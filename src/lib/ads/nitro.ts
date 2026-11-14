/**
 * Pubblicità con Nitro (NitroPay, la rete pubblicitaria di Overwolf), 14/11/2026. Nitro ha approvato originsmeta.com e
 * Pierluigi ha deciso di partire subito ("dobbiamo partire subito per coprire i costi"). Qui stanno l'interruttore, gli
 * indirizzi, le pagine con gli annunci e gli spazi; i componenti in src/components/ads/, i testi in src/lib/adsLabels.ts.
 * Procedura e condizioni di Nitro nella KB (`_nitro_onboarding_2026-11-14.md`), istruzioni nel README ("Pubblicità con
 * Nitro"). Niente import a runtime: lo legge anche `nitro.test.ts`.
 */

/**
 * L'id del sito nel pannello di Nitro (lo script è `s.nitropay.com/ads-<id>.js`), che arriva con l'accesso al pannello.
 * `null` = annunci spenti: niente script, niente spazi, niente /ads.txt, banner dei cookie, piede e informativa come prima.
 * Lo stesso valore va in `NITRO_SITE_ID` di next.config.ts (il redirect di /ads.txt): il test li confronta.
 */
export const NITRO_SITE_ID: string | null = null;

/**
 * L'id numerico del consenso personalizzato per Google Analytics nella CMP di Nitro (pannello › Sites › il sito ›
 * "(EU) Custom Consents", Internal ID `ga`, Name "Google Analytics Consent": guida "Support for Google Analytics and
 * Consent Mode"). Con l'id, dove vale il GDPR c'è solo la finestra di Nitro e GA4 segue la casella `ga`; finché è `null`
 * lì si vedono la finestra di Nitro e il nostro banner, che resta quello di GA4. Va messo prima di andare online.
 */
export const NITRO_GA_CONSENT_ID: number | null = null;

/** Forma dell'id del sito (cifre e lettere, come nei nomi dei file di Nitro): un valore diverso tiene gli annunci spenti. */
export const NITRO_SITE_ID_RE = /^[0-9a-z][0-9a-z-]{0,63}$/i;

export function adsEnabled(id: string | null = NITRO_SITE_ID): boolean {
  return id !== null && NITRO_SITE_ID_RE.test(id);
}

/** Lo script degli annunci, unico per dominio (guida di onboarding di Nitro, passo 1). Porta con sé la CMP per l'UE. */
export function nitroScriptUrl(id: string): string {
  return `https://s.nitropay.com/ads-${id}.js`;
}

/** Il file ads.txt che tiene aggiornato Nitro: /ads.txt ci porta con un 301 (next.config.ts, guida "Setting up your ads.txt file"). */
export function nitroAdsTxtUrl(id: string): string {
  return `https://api.nitropay.com/v1/ads-${id}.txt`;
}

/**
 * Gli host della produzione: lì gli annunci sono veri. Sulle anteprime di Vercel e in locale lo script parte con
 * `data-demo="true"` (annunci finti), come chiede Nitro per la prova su staging prima della revisione del loro team.
 */
export const PRODUCTION_HOSTS = ["originsmeta.com", "www.originsmeta.com"] as const;

export function nitroDemo(hostname: string): boolean {
  return !(PRODUCTION_HOSTS as readonly string[]).includes(hostname.toLowerCase());
}

/**
 * Le sezioni con gli annunci: le pagine da leggere. Mai negli strumenti (deck builder, draft, Tracker, Mercato), nei
 * tornei e negli eventi in onda, nell'account e nei moduli, nelle landing (Kickstarter, /twitch, /for-creators, /tracker),
 * in /live (le dirette hanno già il loro lettore), nelle pagine legali e negli overlay (che stanno fuori da [locale]).
 * "" è la home.
 */
export const AD_SECTIONS = [
  "",
  "news",
  "guides",
  "cards",
  "locations",
  "tier-list",
  "metashifting",
  "decks",
  "analytics",
  "creators",
  "faq",
  "authors",
  "u",
  "theory-craft",
] as const;

/** Pezzi del percorso che sono moduli o strumenti anche dentro una sezione con gli annunci (modifica, pubblicazione…). */
export const TOOL_SEGMENTS = ["new", "edit", "publish", "submit", "create"] as const;

/** Lingue del sito, scritte per esteso come nel matcher di src/proxy.ts (il test le confronta con `locales`). */
const LOCALE_PREFIX = /^\/(en|it|es|fr|pt|de|ru|zh-cn)(?:\/(.*))?$/;

/** Se una pagina (percorso con la lingua, senza query) può mostrare gli annunci. */
export function adsAllowedPath(pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const m = LOCALE_PREFIX.exec(path);
  if (!m) return false;
  const parts = (m[2] ?? "").split("/").filter(Boolean);
  const section = parts[0] ?? "";
  if (!(AD_SECTIONS as readonly string[]).includes(section)) return false;
  if (parts.some((p) => (TOOL_SEGMENTS as readonly string[]).includes(p))) return false;
  // Theory craft: il deck builder no, l'elenco dei mazzi sì
  if (section === "theory-craft" && parts[1] !== "decks") return false;
  return true;
}

/** Opzioni di `nitroAds.createAd` (api-docs.nitropay.com, NitroAdOptions): si incollano quelle del Placement Builder. */
export type NitroAdOptions = Record<string, unknown>;
export type NitroPlacement = { id: string; options: NitroAdOptions };

/**
 * Gli spazi di tutte le pagine con gli annunci, dal layout di partenza consigliato da Nitro (guida di onboarding,
 * "Recommended Quick-Start Layout"): anchor in fondo allo schermo, colonna fissa a destra solo dove c'è posto accanto
 * alla pagina (che è larga al massimo 1280 px), video flottante su desktop e telefono. Non hanno bisogno di un
 * contenitore nella pagina. Quando arrivano i frammenti del Placement Builder del pannello, le opzioni si incollano qui.
 */
export const GLOBAL_PLACEMENTS: readonly NitroPlacement[] = [
  // chiudibile, solo per la pagina in cui lo si chiude (anchorPersistClose resta false)
  { id: "om-anchor", options: { format: "anchor-v2", anchor: "bottom", anchorClose: true } },
  {
    id: "om-rail-right",
    options: {
      format: "rail",
      rail: "right",
      railOffsetTop: 96,
      railSpacing: 16,
      sizes: [
        [160, 600],
        [300, 600],
        [300, 250],
      ],
      mediaQuery: "(min-width: 1700px)",
    },
  },
  { id: "om-video", options: { format: "floating" } },
];

/**
 * Gli spazi nel testo (`AdSlot`): solo sotto la prima schermata, al massimo uno per altezza di schermo, caricati quando
 * stanno per entrare nello schermo (`renderVisibleOnly`), come chiede Nitro.
 */
export const IN_CONTENT_OPTIONS: NitroAdOptions = {
  format: "display",
  renderVisibleOnly: true,
  sizes: [
    [300, 250],
    [336, 280],
    [728, 90],
  ],
};

/** Gli id degli spazi nel testo, uno per posto: due spazi sulla stessa pagina non hanno mai lo stesso id. */
export const IN_CONTENT_SLOTS = {
  news: "om-news-after-article",
  guide: "om-guide-after-article",
  card: "om-card-after-details",
} as const;

export type InContentSlot = keyof typeof IN_CONTENT_SLOTS;
