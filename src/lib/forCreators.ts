import type { Locale } from "./i18n";

/**
 * La pagina per i creator, /for-creators (30/10/2026). Vocale di Dav del 29/10: un ragazzo che fa video e dirette con le
 * nostre Analytics chiede "banner, loghi o altro da mettere sul mio stream o sui miei video"; Pierluigi: "una landing page
 * dedicata ai creators, con le spiegazioni dei nostri servizi, dei nostri tool ed infine un mediakit", poi "per i tool crea
 * delle miniguide, facciamo le cose a prova di scemo per installare". Testi in forCreatorsLabels-<lingua>.ts, file del kit
 * generati da scripts/creator-kit.mjs in public/media/creator-kit/ (solo materiale di OriginsMeta, mai di Koin Games).
 *
 * Qui le parti che non cambiano con la lingua: strumenti, file del kit, colori, indirizzi e il segnaposto dei comandi.
 * Funzioni pure, provate in forCreators.test.ts (che controlla anche che i file del kit esistano).
 */

/** Gli strumenti con la loro guida, nell'ordine della pagina; l'id è anche l'ancora (/for-creators#tracker). */
export const TOOL_IDS = ["tracker", "twitch", "overlay", "chat", "links", "broadcast", "tournaments"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

/** Pagina dell'estensione Twitch "OriginsMeta Deck tracker" (id dell'estensione nella console di dev.twitch.tv). */
export const TWITCH_EXTENSION_URL = "https://dashboard.twitch.tv/extensions/rbcpe2tje2atl5l4ymesp209sothzz";

export const KIT_DIR = "/media/creator-kit";
export const KIT_ZIP = `${KIT_DIR}/originsmeta-media-kit.zip`;

export type KitFileId = "logo" | "logoDark" | "symbol" | "symbolTransparent" | "badge" | "panel";

/**
 * I file del kit, con le misure dei PNG. Badge e pannello ci sono in tutte le lingue del sito: la pagina mostra quello
 * della sua lingua, lo zip li ha tutti.
 */
export const KIT_FILES: readonly { id: KitFileId; file: (l: Locale) => string; width: number; height: number; transparent: boolean }[] = [
  { id: "logo", file: () => "originsmeta-logo.png", width: 640, height: 197, transparent: true },
  { id: "logoDark", file: () => "originsmeta-logo-dark.png", width: 1280, height: 640, transparent: false },
  { id: "symbol", file: () => "originsmeta-symbol.png", width: 1024, height: 1024, transparent: false },
  { id: "symbolTransparent", file: () => "originsmeta-symbol-transparent.png", width: 1024, height: 1024, transparent: true },
  { id: "badge", file: (l) => `originsmeta-badge-${l}.png`, width: 960, height: 240, transparent: true },
  { id: "panel", file: (l) => `originsmeta-twitch-panel-${l}.png`, width: 320, height: 100, transparent: true },
];

export const kitFilePath = (id: KitFileId, l: Locale): string => `${KIT_DIR}/${KIT_FILES.find((f) => f.id === id)!.file(l)}`;

export type ColorId = "mint" | "sky" | "night" | "pink" | "chalk";

/** La palette del kit, uguale al README dello zip (scripts/creator-kit.mjs) e ai colori del sito. */
export const KIT_COLORS: readonly { id: ColorId; hex: string }[] = [
  { id: "mint", hex: "#31E3BD" },
  { id: "sky", hex: "#3FC4E8" },
  { id: "night", hex: "#150C2C" },
  { id: "pink", hex: "#FF4DA6" },
  { id: "chalk", hex: "#E2E2E6" },
];

/**
 * Le righe da copiare delle guide hanno due segnaposto: `{user}`, il nome utente (quello di originsmeta.com/u/<nome>),
 * e `{lang}`, la lingua della pagina. Senza accesso `{user}` diventa il testo della lingua ("YOUR-USERNAME"): chi copia
 * vede subito che cosa cambiare.
 */
export function fillCode(code: string, vars: { user: string; lang: Locale }): string {
  return code.replace(/\{user\}/g, vars.user).replace(/\{lang\}/g, vars.lang);
}

/** Un link delle guide: interno ("/tracker", riceve la lingua) o esterno (https://…). */
export const isExternal = (path: string): boolean => /^https:\/\//.test(path);

/** Casella "Scrivi allo staff" già compilata con la richiesta del ruolo Creator (account/messages?topic=creator). */
export const CREATOR_TOPIC = "creator";
export const creatorApplyPath = `/account/messages?topic=${CREATOR_TOPIC}#messages`;
