/**
 * Le chiamate a Nitro dal browser (14/11/2026): la coda di `nitroAds`, lo script nel <head>, gli spazi, la finestra del
 * consenso (CMP, solo dove vale il GDPR) e il link della CCPA. Solo per i componenti client: usa `window` e `document`.
 * Regole e indirizzi in nitro.ts; API in api-docs.nitropay.com e nelle guide di nitropay.com/docs.
 */
import { NITRO_CMP_LANG, NITRO_GA_CONSENT_ID, nitroDemo, nitroScriptUrl, type NitroAdOptions } from "./nitro";
import { getConsent, setConsent } from "../consent";

type NitroAdsApi = {
  createAd: (id: string, options: NitroAdOptions) => Promise<unknown>;
  queue: unknown[];
  /** true quando lo script ha finito di caricarsi (lo scrive Nitro) */
  loaded?: boolean;
};

type TcfData = { eventStatus?: string } | null;

/** La parte dell'API TCF v2 che usiamo, con il comando `hasCustomConsent` che Nitro aggiunge per i consensi personalizzati. */
type TcfApi = {
  (command: "hasCustomConsent", version: 2, callback: (consented: boolean | null) => void, consentId: string): void;
  (command: "addEventListener", version: 2, callback: (data: TcfData, success: boolean) => void): void;
};

declare global {
  interface Window {
    nitroAds?: NitroAdsApi;
    /** API TCF della CMP di Nitro: c'è solo dove vale il GDPR (e non con un ad blocker) */
    __tcfapi?: TcfApi;
    /** comandi della CMP di Nitro (`showModal` riapre la finestra del consenso): solo dove vale il GDPR */
    __cmp?: (command: string) => void;
    /** API US Privacy di Nitro (link "Do Not Sell" per la California) */
    __uspapi?: (command: string, version: number) => void;
  }
}

const SCRIPT_ID = "nitro-ads-script";

/**
 * La coda di Nitro, come nel loro frammento: le `createAd` chiamate prima dello script restano in coda e le esegue lo
 * script appena arriva. Senza `addUserToken`: i dati degli iscritti non vanno mai a Nitro né agli inserzionisti.
 */
function nitroAds(): NitroAdsApi {
  if (!window.nitroAds) {
    const queue: unknown[] = [];
    window.nitroAds = {
      queue,
      createAd: (...args) => new Promise((resolve) => queue.push(["createAd", args, resolve])),
    };
  }
  return window.nitroAds;
}

/**
 * Lo script di Nitro nel <head>, una volta per scheda (guida di onboarding, passo 1): `data-spa="auto"` perché Next
 * cambia pagina senza ricaricarla (Nitro rinfresca da solo gli annunci), `data-demo` fuori dalla produzione.
 */
/**
 * La lingua della finestra del consenso: il cookie `ncmp-lang`, che la CMP legge all'avvio al posto della lingua del
 * browser (26/11/2026: su /en la finestra usciva in italiano). Va scritto prima dello script e a ogni cambio di lingua.
 */
export function setNitroCmpLanguage(locale: string): void {
  const lang = NITRO_CMP_LANG[locale] ?? "en";
  document.cookie = `ncmp-lang=${lang}; path=/; max-age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
}

export function loadNitroScript(siteId: string): void {
  nitroAds();
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.async = true;
  s.src = nitroScriptUrl(siteId);
  s.setAttribute("data-cfasync", "false");
  s.setAttribute("data-spa", "auto");
  if (nitroDemo(window.location.hostname)) s.setAttribute("data-demo", "true");
  document.head.appendChild(s);
}

/** Crea uno spazio; con lo script bloccato (ad blocker, rete) la richiesta resta in coda e la pagina non cambia. */
export function createAd(id: string, options: NitroAdOptions): void {
  try {
    void nitroAds()
      .createAd(id, options)
      .catch(() => undefined);
  } catch {
    /* errore dello script di Nitro: la pagina resta com'è */
  }
}

/** Toglie uno spazio: Nitro vede sparire l'elemento e libera da solo le sue risorse (NitroAd.onNavigate, api-docs). */
export function removeAd(id: string): void {
  document.getElementById(id)?.remove();
}

/**
 * Segue la finestra del consenso di Nitro: `cb(true)` quando lo script è arrivato e la finestra c'è (dove vale il GDPR),
 * `cb(false)` quando è arrivato e non c'è, e anche se dopo `timeoutMs` non è ancora arrivato (ad blocker, rete lenta).
 * Se arriva dopo il tempo, `cb` viene chiamata di nuovo con il valore giusto.
 */
export function watchNitroCmp(cb: (active: boolean) => void, timeoutMs = 3500): () => void {
  const check = () => cb(typeof window.__tcfapi === "function");
  if (window.nitroAds?.loaded) {
    check();
    return () => undefined;
  }
  const timer = window.setTimeout(() => cb(false), timeoutMs);
  const onLoaded = () => {
    window.clearTimeout(timer);
    check();
  };
  document.addEventListener("nitroAds.loaded", onLoaded, { once: true });
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("nitroAds.loaded", onLoaded);
  };
}

/**
 * Dove vale il GDPR la scelta su Google Analytics si fa nella finestra di Nitro (consenso personalizzato `ga`): qui la si
 * riporta nel nostro consenso (`setConsent`), così GoogleAnalytics.tsx e analytics.ts restano come sono. Si rilegge al
 * caricamento della finestra (`tcloaded`, scelta già fatta) e dopo ogni scelta (`useractioncomplete`).
 */
export function syncGaConsentFromNitro(): () => void {
  const consentId = NITRO_GA_CONSENT_ID;
  if (consentId === null) return () => undefined;
  const start = () => {
    const tcf = window.__tcfapi;
    if (typeof tcf !== "function") return;
    const check = () =>
      tcf(
        "hasCustomConsent",
        2,
        (consented) => {
          // null: la CMP non conosce ancora il consenso `ga` (configurazione del sito non arrivata), quindi non si tocca niente
          if (consented === null) return;
          const value = consented ? "all" : "necessary";
          if (getConsent() !== value) setConsent(value);
        },
        consentId,
      );
    tcf("addEventListener", 2, (data, success) => {
      if (success && data && (data.eventStatus === "tcloaded" || data.eventStatus === "useractioncomplete")) check();
    });
  };
  if (window.nitroAds?.loaded) {
    start();
    return () => undefined;
  }
  document.addEventListener("nitroAds.loaded", start, { once: true });
  return () => document.removeEventListener("nitroAds.loaded", start);
}

/**
 * Rimette il link "Do Not Sell My Personal Information" negli `<span data-ccpa-link="1">` dopo un cambio di pagina
 * (guida "US Privacy law compliance steps", Single Page Apps): Nitro lo mostra solo a chi è in California.
 */
export function refreshCcpaLinks(): void {
  try {
    window.__uspapi?.("addLink", 1);
  } catch {
    /* API non ancora pronta: ci pensa lo script quando arriva */
  }
}
