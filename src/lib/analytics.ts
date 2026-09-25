/**
 * Misura del sito (Ondata 2, pacchetto MIS, 25/09/2026): un solo punto da cui partono gli eventi, verso due strumenti.
 *
 * - Google Analytics 4: solo con il consenso "Accetta tutto" del banner cookie, come le pagine viste, e mai nel browser
 *   dello staff (flag del traffico interno, qui sotto). Riceve tutti i parametri dell'evento più `lang` (en, it, es,
 *   dal primo segmento del percorso).
 * - Vercel Web Analytics (`track()` di @vercel/analytics): senza cookie e senza consenso, conta tutti i visitatori. Il
 *   team Vercel è Pro, quindi gli eventi personalizzati ci sono, ma con al massimo DUE proprietà ciascuno: per ogni
 *   evento `VERCEL_PROPS` dice quali. La pagina (e quindi la lingua) Vercel la registra da sé.
 *
 * Nessun evento parte sul server o in build: ogni funzione esce subito senza `window`, e tutto sta in try/catch (una
 * misura che si rompe non deve mai rompere un tasto). Nei parametri niente dati personali: né email né nomi utente né
 * testi scritti dagli utenti; il termine cercato fra le carte passa, ripulito da `searchTermForAnalytics`.
 *
 * EVENTI (nomi stabili: non si rinominano, i rapporti li contano per nome). ★ = da segnare come evento chiave in GA4
 * (Amministrazione → Eventi → "Segna come evento chiave", dopo che l'evento è arrivato almeno una volta). Per vedere i
 * parametri nei rapporti di GA4 vanno registrati come dimensioni personalizzate con ambito evento (method e search_term
 * ci sono già): lang, placement, target, server, cta, legendary, source, kind, stars, vote_type, search_area, results.
 *
 *   ★ sign_up             primo accesso completato di un account nuovo           method (discord | email)
 *     login               accesso completato di un account che c'era già         method
 *     login_start         clic su "Accedi con Discord", o link via email spedito  method
 *     login_error         errore mostrato dal pannello di accesso                 kind, method
 *                         (kind: discord_start, email_send, captcha, rate_limited nel pannello; expired, other_browser,
 *                         discord_cancelled, discord, generic al ritorno da /auth/callback)
 *   ★ deck_publish        mazzo pubblicato sul sito (non le modifiche)            legendary, source (builder | private_draft)
 *     deck_save_private   mazzo salvato privato nel profilo                       legendary, placement
 *     deck_complete       il mazzo del builder arriva a 25 carte (anche importato) placement
 *   ★ game_code_copy      copia del codice del gioco (KGBLDC…)                    placement (builder | tournament_builder | deck_page)
 *     deck_share          link, lista in testo o "Condividi con…" dal builder      method (link | text | native), placement
 *     deck_open_builder   "Apri nel deck builder" dalla scheda di un mazzo (attributi) placement
 *   ★ deck_vote           voto a un mazzo della community                         stars (1-5), vote_type (new | update)
 *   ★ tier_list_save      tier list salvata nel profilo                           kind (legendaries | cards)
 *     tier_list_share     link o testo di una tier list copiati                   method (link | text), kind
 *   ★ steam_click         clic su un link verso Steam, tasti e link di testo      target (store | demo | news | next_fest | community | other), placement, cta
 *   ★ discord_click       clic su un link verso Discord                           server (originsmeta | official), placement, cta
 *     view_search_results ricerca fra le carte in /cards e nel deck builder       search_term, results, search_area (cards | deck_builder)
 *     home_route          clic dalla home verso una sezione (attributi data-om-*) destination
 *     tier_entry_open     scheda di una voce aperta nelle tier list (TierExplorer) tier_source, card
 *     tier_entry_click    clic dalla scheda di una voce                           tier_source, target
 *
 * `placement` dei clic in uscita: `data-om-placement` del link o di un suo contenitore, altrimenti header, footer,
 * content (dentro <main>) o other (banner, pop-up). `cta`: `data-om-cta` del link (button per SteamButton e
 * DiscordButton, icon per il loghino Discord dell'header), altrimenti link.
 * discord_click vale per tutti e due i server: il nostro (`ORIGINSMETA_DISCORD`) ha server=originsmeta, quello ufficiale
 * di Koin Games server=official. Chi vuole contare solo gli ingressi nel nostro crea in GA4 un evento derivato
 * (discord_click con server = originsmeta).
 *
 * Tre modi di mandare un evento:
 *   1. `trackEvent(nome, parametri)` dai componenti client, con i parametri controllati dai tipi (`EventParams`);
 *   2. attributi sul markup, anche nei componenti server: `data-om-event="home_route" data-om-destination="decks"`
 *      su un link o su un contenitore (i parametri sono gli altri `data-om-*`); li legge `onDocumentClick`;
 *   3. i link verso Steam e Discord non hanno bisogno di niente: `onDocumentClick` li riconosce dall'indirizzo.
 * `onDocumentClick` lo registra GoogleAnalytics.tsx, montato nel layout della lingua su ogni pagina.
 *
 * TRAFFICO INTERNO (MIS-03): visitando una volta https://originsmeta.com/?staff=on (oppure /it?staff=on…) da ogni
 * browser e dispositivo dello staff, il browser si segna come interno (localStorage `originsmeta.internal.v1`): GA4 non
 * parte, gli eventi non vanno da nessuna parte (si leggono nella console, utile per le prove) e le pagine viste di
 * Vercel le scarta `vercelBeforeSend`. ?staff=off lo spegne. Il parametro sparisce subito dall'indirizzo.
 *
 * CONSENSO RITIRATO (MIS-08): `stopGoogleAnalytics` nega il consenso a gtag, lo spegne (`ga-disable-<ID>`) e cancella
 * i cookie _ga; GoogleAnalytics.tsx poi ricarica la pagina, l'unico modo sicuro di togliere gtag.js, che altrimenti
 * resterebbe in pagina con la misurazione avanzata e manderebbe ping senza cookie.
 */
import { track } from "@vercel/analytics";
import { getConsent } from "./consent";
import { ORIGINSMETA_DISCORD } from "./discord";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/* ---------- catalogo degli eventi ---------- */

export type AuthMethod = "discord" | "email";
export type SearchArea = "cards" | "deck_builder";

export type EventParams = {
  sign_up: { method: AuthMethod };
  login: { method: AuthMethod };
  login_start: { method: AuthMethod };
  login_error: { kind: string; method?: AuthMethod };
  deck_publish: { legendary: string; source: "builder" | "private_draft" };
  deck_save_private: { legendary: string; placement: string };
  deck_complete: { placement: string };
  game_code_copy: { placement: string };
  deck_share: { method: "link" | "text" | "native"; placement: string };
  deck_open_builder: { placement: string };
  deck_vote: { stars: number; vote_type: "new" | "update" };
  tier_list_save: { kind: string };
  tier_list_share: { method: "link" | "text"; kind: string };
  steam_click: { target: string; placement: string; cta: string };
  discord_click: { server: "originsmeta" | "official"; placement: string; cta: string };
  view_search_results: { search_term: string; results: number; search_area: SearchArea };
  home_route: { destination: string };
  tier_entry_open: { tier_source: string; card: string };
  tier_entry_click: { tier_source: string; target: string };
};
export type EventName = keyof EventParams;

/** Le proprietà che vanno a Vercel per ogni evento, in ordine d'importanza: al massimo due (limite del piano Pro). */
export const VERCEL_PROPS = {
  sign_up: ["method"],
  login: ["method"],
  login_start: ["method"],
  login_error: ["kind", "method"],
  deck_publish: ["legendary", "source"],
  deck_save_private: ["legendary", "placement"],
  deck_complete: ["placement"],
  game_code_copy: ["placement"],
  deck_share: ["method", "placement"],
  deck_open_builder: ["placement"],
  deck_vote: ["stars", "vote_type"],
  tier_list_save: ["kind"],
  tier_list_share: ["method", "kind"],
  steam_click: ["target", "placement"],
  discord_click: ["server", "placement"],
  view_search_results: ["search_term", "results"],
  home_route: ["destination"],
  tier_entry_open: ["tier_source", "card"],
  tier_entry_click: ["tier_source", "target"],
} as const satisfies { [N in EventName]: readonly (keyof EventParams[N] & string)[] };

export const isEventName = (name: unknown): name is EventName => typeof name === "string" && Object.hasOwn(VERCEL_PROPS, name);

type Primitive = string | number | boolean;
type Props = Record<string, Primitive>;

/**
 * Parametri puliti: nomi in snake_case (come li vuole GA4, massimo 40 caratteri), solo stringhe non vuote (tagliate a
 * 100 caratteri, il limite di GA4), numeri finiti e booleani. Il resto si scarta.
 */
export function cleanParams(params: Record<string, unknown>): Props {
  const out: Props = {};
  for (const [k, v] of Object.entries(params)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(k)) continue;
    if (typeof v === "string") {
      const s = v.trim().slice(0, 100);
      if (s) out[k] = s;
    } else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Le proprietà per Vercel: quelle di `VERCEL_PROPS`, nell'ordine, se ci sono. */
export function vercelProps(name: EventName, params: Props): Props {
  const out: Props = {};
  for (const k of VERCEL_PROPS[name] as readonly string[]) if (params[k] !== undefined) out[k] = params[k];
  return out;
}

/** Lingua della pagina dal percorso (/it/…, /es/…): "" fuori dalle tre lingue. */
export function langOf(pathname: string): string {
  const seg = pathname.split("/")[1] ?? "";
  return seg === "en" || seg === "it" || seg === "es" ? seg : "";
}

/** Leggendaria di un mazzo come parametro: lo slug della carta, "custom" per quelle inserite a mano (il nome lo scrive l'utente). */
export function legendaryParam(slug: string | null | undefined): string {
  if (!slug) return "none";
  return slug.startsWith("custom:") ? "custom" : slug;
}

/* ---------- invio ---------- */

let gaStarted = false;
/** Eventi arrivati con il consenso prima che GA4 fosse avviato (un effetto figlio parte prima di quello del layout). */
const pendingGa: [string, Props][] = [];
const PENDING_MAX = 20;

/** GA4 può ricevere eventi: consenso "Accetta tutto" e browser non dello staff. */
export function gaAllowed(): boolean {
  return getConsent() === "all" && !isInternalTraffic();
}

function sendToGa(name: string, params: Props) {
  if (!gaAllowed()) return;
  if (gaStarted && window.gtag) window.gtag("event", name, params);
  else if (pendingGa.length < PENDING_MAX) pendingGa.push([name, params]);
}

/**
 * La coda di Vercel (`window.va` → `window.vaq`), come la crea `inject()` di @vercel/analytics: un evento mandato prima
 * che il componente <Analytics> sia montato (l'accesso, letto al primo giro di effetti del layout) aspetta lo script
 * invece di perdersi. `inject()` trova la coda e la usa così com'è.
 */
function ensureVercelQueue() {
  if (window.va) return;
  window.va = function va(...args) {
    (window.vaq = window.vaq || []).push(args);
  };
}

/** Opzioni di `send`: `ga: false` quando l'evento lo conta già la misurazione avanzata di GA4. */
function send(name: EventName, raw: Record<string, unknown>, opts: { ga?: boolean } = {}) {
  if (typeof window === "undefined") return;
  try {
    const params = cleanParams(raw);
    if (isInternalTraffic()) {
      console.info("[OriginsMeta · traffico interno] evento non inviato:", name, params);
      return;
    }
    try {
      ensureVercelQueue();
      track(name, vercelProps(name, params));
    } catch {
      /* Vercel non disponibile (bloccato da un'estensione): GA4 va avanti */
    }
    if (opts.ga !== false) sendToGa(name, { ...params, lang: langOf(window.location.pathname) });
  } catch {
    /* la misura non deve mai rompere la pagina */
  }
}

/** Manda un evento del catalogo a Vercel e, con il consenso, a GA4. */
export function trackEvent<N extends EventName>(name: N, params: EventParams[N]): void {
  send(name, params as Record<string, unknown>);
}

/** Come `trackEvent`, per chi ha il nome in una stringa (attributi data-om-*, TierExplorer): i nomi fuori catalogo si scartano. */
export function trackNamedEvent(name: string, params: Record<string, unknown>): void {
  if (isEventName(name)) send(name, params);
}

/* ---------- Google Analytics 4 ---------- */

/** `window['ga-disable-<ID>']`: la proprietà documentata da Google per spegnere GA4 in una pagina. */
function setGaDisabled(id: string, off: boolean) {
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = off;
}

/**
 * Avvia GA4 (lo chiama GoogleAnalytics.tsx quando c'è il consenso; gtag.js lo carica il componente). È il codice di
 * Google, tale e quale, eseguito qui invece che in uno script inline, così `window.gtag` esiste subito e gli eventi in
 * attesa partono dopo `config`. Consent Mode v2: pubblicità sempre negata, statistiche concesse. `anonymize_ip` non
 * c'è più: era di Universal Analytics e in GA4 non fa niente (GA4 non registra gli indirizzi IP).
 */
export function startGoogleAnalytics(id: string): void {
  if (typeof window === "undefined" || !id || gaStarted) return;
  try {
    // un consenso dato di nuovo dopo un ritiro, nella stessa pagina: GA4 torna attivo
    setGaDisabled(id, false);
    const dataLayer = (window.dataLayer = window.dataLayer || []);
    // gtag vuole l'oggetto `arguments`, non un array: con un array GA4 ignora i comandi
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
    window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", id);
    gaStarted = true;
    for (const [name, params] of pendingGa.splice(0)) window.gtag("event", name, params);
  } catch {
    /* GA4 resta spento */
  }
}

/**
 * Consenso ritirato ("Solo necessari" dopo "Accetta tutto"): consenso negato a gtag, GA4 spento con la proprietà
 * `ga-disable-<ID>` e cookie _ga cancellati. Restituisce true se GA4 girava in questa pagina:
 * allora gtag.js è ancora caricato e il chiamante ricarica la pagina, perché la misurazione avanzata (pagine viste
 * nella cronologia, scorrimento, clic in uscita) sta dentro gtag.js e con il solo consenso negato continuerebbe a
 * mandare ping senza cookie.
 */
export function stopGoogleAnalytics(id: string): boolean {
  if (typeof window === "undefined") return false;
  const wasRunning = gaStarted;
  try {
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
    if (id) setGaDisabled(id, true);
  } catch {
    /* si cancellano comunque i cookie */
  }
  pendingGa.length = 0;
  deleteGaCookies();
  return wasRunning;
}

/** Nomi dei cookie di Google Analytics presenti in `document.cookie` (_ga, _ga_<ID>, _gid, _gat…, _gac_…, _gcl_…). */
export function gaCookieNames(cookieHeader: string): string[] {
  const names = cookieHeader
    .split(";")
    .map((c) => c.split("=")[0]?.trim() ?? "")
    .filter((n) => /^(?:_ga|_gid|_gat|_gac|_gcl)(?:_|$)/.test(n));
  return [...new Set(names)];
}

/**
 * Domini da provare per cancellare un cookie: "" (cookie del solo host) e l'host con i domini sopra, fino a due livelli
 * (www.originsmeta.com, originsmeta.com). GA4 scrive i suoi sul dominio più alto possibile; un dominio che il browser
 * non accetta (un suffisso pubblico come vercel.app) viene ignorato senza danni. Niente domini per localhost e indirizzi IP.
 */
export function cookieDomains(hostname: string): string[] {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":")) return [""];
  const parts = host.split(".");
  const out = [""];
  for (let i = 0; i <= parts.length - 2; i++) out.push(parts.slice(i).join("."));
  return out;
}

/** Riga di `document.cookie` che cancella un cookie (scadenza immediata, stesso percorso e dominio). */
export function expiredCookie(name: string, domain: string): string {
  return `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/${domain ? `; Domain=${domain}` : ""}`;
}

/** Cancella i cookie di Google Analytics da questo sito. */
export function deleteGaCookies(): void {
  if (typeof document === "undefined") return;
  try {
    const names = gaCookieNames(document.cookie);
    if (!names.length) return;
    const domains = cookieDomains(window.location.hostname);
    for (const name of names) for (const domain of domains) document.cookie = expiredCookie(name, domain);
  } catch {
    /* cookie bloccati */
  }
}

/* ---------- parametri nell'indirizzo ---------- */

/** Query (`?a=1&b=2`) senza i parametri indicati: gli altri restano scritti com'erano, byte per byte. */
export function withoutParams(search: string, names: readonly string[]): string {
  const kept = search
    .replace(/^\?/, "")
    .split("&")
    .filter((pair) => {
      if (!pair) return false;
      let key = pair.split("=")[0];
      try {
        key = decodeURIComponent(key.replace(/\+/g, " "));
      } catch {
        /* chiave scritta male: si confronta così com'è */
      }
      return !names.includes(key);
    });
  return kept.length ? `?${kept.join("&")}` : "";
}

/** Cambia la query dell'indirizzo senza navigare (Next tiene il suo stato: è lo stesso uso di DeckBuilder e NewDeckBanner). */
function replaceSearch(search: string) {
  const { pathname, hash } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}${hash}`);
}

/* ---------- traffico interno (MIS-03) ---------- */

export const INTERNAL_KEY = "originsmeta.internal.v1";
export const STAFF_PARAM = "staff";

/** ?staff=on (o 1) → true, ?staff=off (o 0) → false, altrimenti null. */
export function staffSwitch(search: string): boolean | null {
  const v = new URLSearchParams(search).get(STAFF_PARAM)?.trim().toLowerCase();
  if (v === "on" || v === "1") return true;
  if (v === "off" || v === "0") return false;
  return null;
}

/**
 * Browser dello staff? Vale il parametro dell'indirizzo, se c'è (la prima pagina, prima che `applyStaffSwitch` lo
 * salvi e lo tolga), altrimenti il flag salvato.
 */
export function isInternalTraffic(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const fromUrl = staffSwitch(window.location.search);
    if (fromUrl !== null) return fromUrl;
    return localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}

/** ?staff=on|off: salva la scelta nel browser, la conferma nella console e toglie il parametro dall'indirizzo. */
export function applyStaffSwitch(): void {
  if (typeof window === "undefined") return;
  try {
    const on = staffSwitch(window.location.search);
    if (on === null) return;
    try {
      if (on) localStorage.setItem(INTERNAL_KEY, "1");
      else localStorage.removeItem(INTERNAL_KEY);
    } catch {
      /* storage bloccato: vale solo per questa pagina */
    }
    console.info(on ? "[OriginsMeta] Traffico interno: in questo browser GA4 e Vercel non contano più nulla (?staff=off per tornare)." : "[OriginsMeta] Traffico interno spento: questo browser torna a essere contato.");
    replaceSearch(withoutParams(window.location.search, [STAFF_PARAM]));
  } catch {
    /* indirizzo non leggibile */
  }
}

/** Parametri della misura da togliere dagli indirizzi che arrivano a Vercel. */
const TRACKING_PARAMS = [STAFF_PARAM, "om_auth", "om_method"] as const;

/** Indirizzo senza i parametri della misura (il resto intatto, frammento compreso). */
export function stripTrackingParams(url: string): string {
  const hashAt = url.indexOf("#");
  const beforeHash = hashAt < 0 ? url : url.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : url.slice(hashAt);
  const q = beforeHash.indexOf("?");
  if (q < 0) return url;
  return `${beforeHash.slice(0, q)}${withoutParams(beforeHash.slice(q), TRACKING_PARAMS)}${hash}`;
}

/**
 * `beforeSend` di Vercel Web Analytics (componente `VercelAnalytics` in GoogleAnalytics.tsx): scarta pagine viste ed
 * eventi del browser dello staff e toglie i parametri della misura dall'indirizzo.
 */
export function vercelBeforeSend<E extends { url: string }>(event: E): E | null {
  if (isInternalTraffic()) return null;
  return { ...event, url: stripTrackingParams(event.url) };
}

/* ---------- accesso e iscrizione (MIS-01, MIS-11) ---------- */

export const AUTH_PARAM = "om_auth";
export const AUTH_METHOD_PARAM = "om_method";
export type AuthEvent = "sign_up" | "login";

/**
 * Indirizzo di ritorno dopo l'accesso (/auth/callback) con il segnale per la misura: `?om_auth=sign_up|login&om_method=…`,
 * prima dell'eventuale frammento (#TL1… della tier list). Sul server si costruisce solo l'indirizzo: l'evento lo manda
 * il browser all'arrivo (`consumeAuthSignal`), che poi toglie il segnale dall'indirizzo.
 */
export function withAuthSignal(next: string, event: AuthEvent, method: AuthMethod): string {
  const hashAt = next.indexOf("#");
  const path = hashAt < 0 ? next : next.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : next.slice(hashAt);
  const sep = !path.includes("?") ? "?" : path.endsWith("?") || path.endsWith("&") ? "" : "&";
  return `${path}${sep}${AUTH_PARAM}=${event}&${AUTH_METHOD_PARAM}=${method}${hash}`;
}

/** Il segnale nella query, se è valido. */
export function readAuthSignal(search: string): { event: AuthEvent; method: AuthMethod } | null {
  const p = new URLSearchParams(search);
  const event = p.get(AUTH_PARAM);
  const method = p.get(AUTH_METHOD_PARAM);
  if ((event !== "sign_up" && event !== "login") || (method !== "discord" && method !== "email")) return null;
  return { event, method };
}

/** Finestre per riconoscere un account nuovo: la conferma appena avvenuta, la creazione entro la durata del link via email (1 ora). */
export const NEW_ACCOUNT_CONFIRMED_MS = 10 * 60_000;
export const NEW_ACCOUNT_CREATED_MS = 60 * 60_000;

/**
 * L'accesso appena completato è un'iscrizione? Sì se l'account è stato confermato negli ultimi 10 minuti (il primo link
 * via email aperto, anche per un account creato giorni prima e mai completato; il primo accesso con Discord) oppure
 * creato nell'ultima ora (il link via email scade dopo un'ora: vale anche se Supabase conferma gli indirizzi alla
 * creazione). Un secondo accesso nella prima ora conta ancora come iscrizione: caso raro, accettato.
 */
export function isNewAccount(
  user: { created_at?: string | null; confirmed_at?: string | null; email_confirmed_at?: string | null } | null | undefined,
  now = Date.now(),
): boolean {
  if (!user) return false;
  const recent = (iso: string | null | undefined, windowMs: number) => {
    const t = Date.parse(iso ?? "");
    return Number.isFinite(t) && Math.abs(now - t) < windowMs;
  };
  return recent(user.confirmed_at ?? user.email_confirmed_at, NEW_ACCOUNT_CONFIRMED_MS) || recent(user.created_at, NEW_ACCOUNT_CREATED_MS);
}

/** All'arrivo dopo l'accesso: manda sign_up o login e toglie il segnale dall'indirizzo (un ricaricamento non lo ripete). */
export function consumeAuthSignal(): void {
  if (typeof window === "undefined") return;
  try {
    const search = window.location.search;
    const p = new URLSearchParams(search);
    if (!p.has(AUTH_PARAM) && !p.has(AUTH_METHOD_PARAM)) return;
    const signal = readAuthSignal(search);
    replaceSearch(withoutParams(search, [AUTH_PARAM, AUTH_METHOD_PARAM]));
    if (signal) trackEvent(signal.event, { method: signal.method });
  } catch {
    /* indirizzo non leggibile */
  }
}

/* ---------- ricerca interna (MIS-13) ---------- */

/**
 * Termine cercato come parametro: minuscolo, spazi compattati, al massimo 40 caratteri. Si scarta (null) quello che non
 * sembra la ricerca di una carta e potrebbe essere un dato personale o un codice: email, link, numeri lunghi (telefoni),
 * testi oltre 60 caratteri (un codice di mazzo incollato).
 */
export function searchTermForAnalytics(raw: string): string | null {
  const t = raw.replace(/\s+/g, " ").trim().toLowerCase();
  if (t.length < 2 || t.length > 60) return null;
  if (t.includes("@") || /https?:|www\./.test(t) || /\d{5,}/.test(t.replace(/[\s.-]/g, ""))) return null;
  return t.slice(0, 40).trim();
}

export const SEARCH_DELAY_MS = 1500;
const searchTimers: Partial<Record<SearchArea, ReturnType<typeof setTimeout>>> = {};
const lastSearch: Partial<Record<SearchArea, string>> = {};

/**
 * Ricerca fra le carte (/cards, pool del deck builder): da chiamare in un effetto a ogni cambio del testo o del numero
 * di risultati. Parte un evento solo quando si smette di scrivere per 1,5 secondi, e non due volte di fila per lo
 * stesso termine. Il termine che arriva con ?q= (la ricerca dell'header porta a /cards?q=…) GA4 lo conta già con la
 * misurazione avanzata ("ricerca nel sito"): quello va solo a Vercel.
 */
export function trackSearch(area: SearchArea, rawTerm: string, results: number): void {
  if (typeof window === "undefined") return;
  try {
    clearTimeout(searchTimers[area]);
    const term = searchTermForAnalytics(rawTerm);
    if (!term) return;
    searchTimers[area] = setTimeout(() => {
      if (lastSearch[area] === term) return;
      lastSearch[area] = term;
      const fromHeader = searchTermForAnalytics(new URLSearchParams(window.location.search).get("q") ?? "") === term;
      send("view_search_results", { search_term: term, results, search_area: area }, { ga: !fromHeader });
    }, SEARCH_DELAY_MS);
  } catch {
    /* la ricerca funziona comunque */
  }
}

/* ---------- clic: link verso Steam e Discord, attributi data-om-* ---------- */

/** App di Steam del gioco e della demo (gli stessi di `officialLinks` in Footer.tsx). */
const STEAM_GAME_APP = "4429430";
const STEAM_DEMO_APP = "4756630";

/** Dove porta un link di Steam: pagina del gioco, della demo, una news (patch notes), il Next Fest, la community, altro. */
export function steamTarget(url: URL): string {
  if (/(?:^|\.)steamcommunity\.com$/i.test(url.hostname)) return "community";
  const path = url.pathname.toLowerCase();
  if (path.startsWith("/news/")) return "news";
  if (path.startsWith("/sale/nextfest")) return "next_fest";
  if (path.startsWith(`/app/${STEAM_DEMO_APP}`)) return "demo";
  if (path.startsWith(`/app/${STEAM_GAME_APP}`)) return "store";
  return "other";
}

/** Codice d'invito del nostro Discord ("RAG7nnrNGP"), da `ORIGINSMETA_DISCORD`. */
const OUR_INVITE = ORIGINSMETA_DISCORD.replace(/\/+$/, "").split("/").pop() ?? "";

type LinkEvent = { name: "steam_click"; params: EventParams["steam_click"] } | { name: "discord_click"; params: EventParams["discord_click"] };

/** Evento di un link in uscita verso Steam o Discord; null per tutti gli altri link. */
export function linkEvent(href: string, placement: string, cta: string): LinkEvent | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (/(?:^|\.)(?:steampowered|steamcommunity)\.com$/.test(host)) return { name: "steam_click", params: { target: steamTarget(url), placement, cta } };
  if (host === "discord.gg" || /(?:^|\.)discord(?:app)?\.com$/.test(host)) {
    // le API (webhook) non sono link per i visitatori
    if (url.pathname.startsWith("/api/")) return null;
    const code = url.pathname.replace(/^\/(?:invite\/)?/, "").replace(/\/+$/, "");
    return { name: "discord_click", params: { server: OUR_INVITE && code === OUR_INVITE ? "originsmeta" : "official", placement, cta } };
  }
  return null;
}

/** `data-om-search-area` → "search_area": nome del parametro da una chiave del dataset (senza il prefisso "om"). */
export function datasetKeyToParam(key: string): string | null {
  if (!/^om[A-Z]/.test(key)) return null;
  const rest = key.slice(2);
  return rest.charAt(0).toLowerCase() + rest.slice(1).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Evento dichiarato con gli attributi: `data-om-event` è il nome, gli altri `data-om-*` i parametri. */
export function datasetEvent(dataset: Record<string, string | undefined>): { name: EventName; params: Props } | null {
  const name = dataset.omEvent;
  if (!isEventName(name)) return null;
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dataset)) {
    if (k === "omEvent" || k === "omCta") continue;
    const param = datasetKeyToParam(k);
    if (param && v !== undefined) raw[param] = v;
  }
  return { name, params: cleanParams(raw) };
}

/** Posto del link nella pagina: `data-om-placement` (del link o di un contenitore), header, footer, content, other. */
function placementOf(el: Element): string {
  const own = el.closest("[data-om-placement]")?.getAttribute("data-om-placement");
  if (own) return own.slice(0, 40);
  if (el.closest("body > header")) return "header";
  if (el.closest("body > footer")) return "footer";
  if (el.closest("main")) return "content";
  return "other";
}

/**
 * Ascoltatore dei clic su tutto il documento (click e clic con la rotellina, auxclick), registrato da GoogleAnalytics.tsx
 * in fase di cattura: così vede anche i link di componenti server (SteamButton, DiscordButton, footer, testi delle news)
 * senza trasformarli in componenti client, e anche i clic che un altro gestore ferma.
 */
export function onDocumentClick(e: MouseEvent): void {
  try {
    if (e.type === "auxclick" && e.button !== 1) return;
    const target = e.target instanceof Element ? e.target : null;
    const el = target?.closest<HTMLElement>("a[href], button");
    if (!el) return;
    const tagged = el.closest<HTMLElement>("[data-om-event]");
    if (tagged) {
      const ev = datasetEvent({ ...tagged.dataset });
      if (ev) send(ev.name, ev.params);
    }
    if (el instanceof HTMLAnchorElement) {
      const ev = linkEvent(el.href, placementOf(el), el.dataset.omCta || "link");
      if (ev) send(ev.name, ev.params);
    }
  } catch {
    /* il clic va avanti comunque */
  }
}
