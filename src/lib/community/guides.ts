import type { Locale } from "../i18n";
import type { DeckLink, StoredVideo } from "../videos";
import { countWords } from "./deckQuality";
import { textHash, type TranslationDoc } from "./deckTranslation";
import { MEDIA_FILE_RE, PROFILE_MEDIA_BUCKET, UUID_RE, mediaPublicUrl } from "./profileMedia";

/**
 * Guide della community pubblicate direttamente da chi ha un ruolo (pacchetto GUIDE, 27/09/2026; Pierluigi: "OK A
 * TUTTO, OTTIMO!!" alle proposte per i profili): Autore, Creator, Pro e Staff (`canPublishGuides` di badges.ts)
 * scrivono e pubblicano le loro guide senza passare dallo staff; gli altri continuano con "Mandaci la tua guida".
 *
 * Qui stanno le regole pure, uguali a quelle del database (blocco GUIDE di supabase/schema.sql; il test
 * guides.test.ts le confronta): limiti del testo, categorie, copertine preimpostate, pulizia del testo semplice, lettura
 * del modulo, parole e soglia di indicizzazione, lingue in cui la guida si legge (originale più traduzioni aggiornate),
 * elenchi leggeri e righe della sitemap, piano della traduzione a pezzi. Nessun import a runtime che non sia puro
 * (`deckQuality.ts` e `deckTranslation.ts`, a loro volta puri): lo esegue `node --test`, lo carica il modulo nel browser,
 * lo usa scripts/translate-guides.mjs.
 *
 * Testo degli utenti: sempre testo semplice, mai Markdown né HTML. Il sito lo mostra come testo, con i nomi delle carte
 * trasformati in link (`CardMentions`), come le guide dei mazzi.
 */

// ——— Limiti (uguali ai vincoli del blocco GUIDE di supabase/schema.sql) ———

export const GUIDE_LIMITS = {
  /** titolo: una riga, 10-110 caratteri per pubblicare (una bozza da 1) */
  titleMin: 10,
  titleMax: 110,
  /** riassunto (attacco della guida, description della pagina): 120-300 caratteri per pubblicare */
  summaryMin: 120,
  summaryMax: 300,
  /** sezioni: da 1 a 12 per pubblicare, ognuna con titolo (una riga, fino a 80) e testo (fino a 4000) */
  sectionsMin: 1,
  sectionsMax: 12,
  headingMax: 80,
  bodyMax: 4000,
  /** carte collegate alla guida (slug del database carte) */
  cardsMax: 24,
} as const;

/**
 * Tetti del database (trigger guard_community_guide): lo staff e gli admin non li hanno. I due giornalieri contano il
 * registro `community_guide_events`, che l'utente non può cancellare: eliminare e ricreare una guida non li azzera.
 */
export const GUIDE_MAX_PER_OWNER = 100;
export const GUIDE_DAILY_NEW_LIMIT = 10;
export const GUIDE_DAILY_PUBLISH_LIMIT = 3;
/** Dopo che lo staff ha nascosto una sua guida, per quante ore il proprietario non pubblica (trigger, 'guide_hidden_recent'). */
export const GUIDE_HIDE_COOLDOWN_HOURS = 24;
/**
 * Segnalazioni al giorno per utente (trigger guard_community_guide_report) e lunghezza del motivo. Lo staff riceve un
 * avviso su Discord solo alla prima segnalazione di una guida nelle 24 ore (`first_in_day`).
 */
export const REPORT_DAILY_LIMIT = 5;
export const REPORT_REASON_MIN = 3;
export const REPORT_REASON_MAX = 500;

/** Le categorie delle guide del sito (GuideCategory di src/lib/content/guides.ts, etichette nei dizionari). */
export const GUIDE_CATEGORIES = ["game", "decks", "rank", "archetypes", "interviews", "events", "economy"] as const;
export type CommunityGuideCategory = (typeof GUIDE_CATEGORIES)[number];

/**
 * Copertine preimpostate: immagini del media kit ufficiale in public/media, le stesse che il sito usa come copertine
 * delle sue guide e delle sue news e che i tornei offrono a chi non carica un'immagine (COVER_PRESETS di
 * src/lib/tournament/types.ts; il test controlla che siano fra quelle e che i file esistano). Regola di CLAUDE.md:
 * "ogni news e ogni guida ha SEMPRE una copertina", presa dal media kit; il materiale Koin si usa come contenuto
 * (copertine di news e guide sì), mai come identità o interfaccia del sito. Si mostrano intere, in 16:9 come sono
 * (niente ritagli: i crediti impressi restano). Fuori le immagini troppo larghe per il 16:9 (banner) e gli screenshot
 * con il watermark "Development Build", che vogliono una didascalia.
 */
export const GUIDE_COVERS = {
  "keyart-king-arthur": { src: "/media/keyart-king-arthur.webp", width: 1600, height: 899 },
  "keyart-mulan": { src: "/media/keyart-mulan.webp", width: 1600, height: 899 },
  "keyart-queen-of-hearts": { src: "/media/keyart-queen-of-hearts.webp", width: 1600, height: 899 },
  "keyart-robin-hood": { src: "/media/keyart-robin-hood.webp", width: 1600, height: 899 },
  "keyart-winnie-the-pooh": { src: "/media/keyart-winnie-the-pooh.webp", width: 1600, height: 899 },
  "keyart-puss-in-boots": { src: "/media/keyart-puss-in-boots.webp", width: 1600, height: 899 },
  "keyart-goldi": { src: "/media/keyart-goldi.webp", width: 1600, height: 899 },
  "keyart-queen-of-hearts-cyber": { src: "/media/keyart-queen-of-hearts-cyber.webp", width: 1600, height: 899 },
  "keyart-red-wide": { src: "/media/keyart-red-wide.webp", width: 1600, height: 900 },
  "hero-1920": { src: "/media/hero-1920.webp", width: 1920, height: 1080 },
  "ls-two-ways": { src: "/media/ls-two-ways.webp", width: 1600, height: 900 },
  "ls-zero-pay-to-win": { src: "/media/ls-zero-pay-to-win.webp", width: 1600, height: 900 },
  "ls-real-collecting": { src: "/media/ls-real-collecting.webp", width: 1600, height: 900 },
  "ls-collect-them-all": { src: "/media/ls-collect-them-all.webp", width: 1600, height: 900 },
  "ls-collector-pack": { src: "/media/ls-collector-pack.webp", width: 1600, height: 900 },
} as const satisfies Record<string, { src: string; width: number; height: number }>;
export type GuideCoverPreset = keyof typeof GUIDE_COVERS;
export const GUIDE_COVER_PRESETS = Object.keys(GUIDE_COVERS) as GuideCoverPreset[];
/** La copertina di una guida nuova (e di un valore sconosciuto letto dal database). */
export const DEFAULT_GUIDE_COVER: GuideCoverPreset = "keyart-king-arthur";

/**
 * Bucket dello Storage delle copertine caricate (`cover_path`): quello del pacchetto VETRINA (`profile-media`), acceso il
 * 29/09/2026 su segnalazione di Vega ("non ha potuto cambiare l'immagine della copertina della guida"). Il file sta nella
 * cartella del proprietario, `<id>/guide/<file>`: la policy di caricamento del bucket lo ammette per chi pubblica guide,
 * quella di cancellazione non tocca una copertina in uso e il trigger controlla che il file ci sia (blocco IMMAGINI di
 * supabase/schema.sql).
 */
export const GUIDE_COVER_BUCKET: string | null = PROFILE_MEDIA_BUCKET;
/** La cartella delle copertine delle guide dentro quella dell'utente. */
export const GUIDE_COVER_FOLDER = "guide";
/**
 * Misura della copertina caricata: 16:9 come le copertine del media kit. Il browser la ritaglia al centro in 16:9 e la
 * riduce a questa misura al caricamento (WebP), quindi la pagina ne conosce sempre le proporzioni. Il modulo consiglia
 * almeno `GUIDE_COVER_MIN`, sotto si vede sgranata.
 */
export const GUIDE_COVER_SIZE = { width: 1600, height: 900 } as const;
export const GUIDE_COVER_MIN = { width: 1200, height: 675 } as const;
/** Peso massimo della copertina caricata: il limite del bucket (2 MB), come la copertina del profilo. */
export const GUIDE_COVER_MAX_BYTES = 2 * 1024 * 1024;

/** Lingue in cui si scrive una guida: quelle del sito (`locales` di i18n.ts, il test le confronta). */
export const GUIDE_LANGS = ["en", "it", "es"] as const;

/**
 * Parole di testo (riassunto più sezioni, nella lingua dell'autore) sotto cui una guida non si indicizza in nessuna
 * lingua ed è fuori da sitemap e hreflang, come i mazzi sotto `GUIDE_MIN_WORDS` (deckQuality.ts). 300 parole è il
 * minimo di una guida vera (il piano del pacchetto): una pagina più corta è una scheda, e la stessa cosa tradotta
 * in automatico in tre lingue sarebbe contenuto sottile. La guida resta pubblicata, navigabile e sul profilo.
 */
export const COMMUNITY_GUIDE_MIN_WORDS = 300;


export type CommunityGuideStatus = "draft" | "published" | "hidden";
export type GuideSectionText = { heading: string; body: string };
/** Il testo che si traduce: riassunto e sezioni (il titolo no, come il nome di un mazzo). */
export type CommunityGuideText = { summary: string; sections: GuideSectionText[] };
/**
 * Una traduzione salvata: `hash` è l'impronta del testo originale da cui è fatta (`communityGuideHash`), `parts` le
 * impronte delle sue parti (riassunto, poi ogni sezione: `guidePartHashes`), così una modifica ritraduce solo le parti
 * cambiate.
 */
export type CommunityGuideTranslation = { hash: string; at: string; model?: string; parts?: string[]; guide: CommunityGuideText };
export type CommunityGuideTranslations = Partial<Record<Locale, CommunityGuideTranslation>>;

type Author = { username: string | null; display_name: string | null; avatar_url: string | null; badge?: string | null };

/** Una riga di public.community_guides come la legge il sito (con l'autore quando serve). */
export type CommunityGuide = {
  id: string;
  slug: string;
  owner: string;
  lang: Locale;
  title: string;
  summary: string;
  sections: GuideSectionText[];
  category: CommunityGuideCategory;
  cards: string[];
  videos?: StoredVideo[] | null;
  links?: DeckLink[] | null;
  cover_preset: GuideCoverPreset;
  cover_path?: string | null;
  status: CommunityGuideStatus;
  translations?: CommunityGuideTranslations | null;
  words?: number | null;
  text_hash?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  profile?: Author | null;
};

export const isGuideCategory = (v: unknown): v is CommunityGuideCategory => typeof v === "string" && (GUIDE_CATEGORIES as readonly string[]).includes(v);
export const isCoverPreset = (v: unknown): v is GuideCoverPreset => typeof v === "string" && Object.hasOwn(GUIDE_COVERS, v);
const isGuideLang = (v: unknown): v is Locale => typeof v === "string" && (GUIDE_LANGS as readonly string[]).includes(v);

/** L'immagine di una copertina preimpostata (percorso del sito e misure); per un valore sconosciuto quella di riserva. */
export function guideCover(preset: unknown): { src: string; width: number; height: number } {
  return GUIDE_COVERS[isCoverPreset(preset) ? preset : DEFAULT_GUIDE_COVER];
}

/** L'immagine da mostrare per una guida: `remote` quando è la copertina caricata (indirizzo pubblico del bucket). */
export type GuideCoverImage = { src: string; width: number; height: number; remote?: true };

/**
 * La copertina di una guida della community (29/09/2026): quella caricata dall'autore, se il percorso è nella SUA
 * cartella delle guide (`coverPathOk`), altrimenti quella preimpostata del media kit. `base` è l'URL del progetto
 * Supabase (src/lib/supabase/env.ts): la caricata è un indirizzo assoluto dello Storage, la preimpostata un percorso
 * del sito (`absoluteCover` le rende entrambe assolute per og:image, dati strutturati e Discord).
 */
export function communityGuideCover(g: { owner: string; cover_path?: string | null; cover_preset?: unknown }, base: string): GuideCoverImage {
  if (GUIDE_COVER_BUCKET && coverPathOk(g.cover_path, g.owner)) return { src: mediaPublicUrl(base, g.cover_path), ...GUIDE_COVER_SIZE, remote: true };
  return guideCover(g.cover_preset);
}

/** Indirizzo assoluto di una copertina: quelle caricate lo sono già, le preimpostate sono percorsi del sito. */
export function absoluteCover(src: string, site: string): string {
  return /^https:\/\//.test(src) ? src : `${site}${src}`;
}

// ——— Testo semplice ———

/**
 * Caratteri tolti: controllo C0 e C1 (tranne a capo e tabulazione, trattati a parte), trattino morbido, segni di
 * direzione del testo (ALM, LRM, RLM, LRE…RLO, LRI…PDI: con quelli un testo si legge al contrario), invisibili (spazio
 * a larghezza zero, word joiner e operatori invisibili U+2060-2064, BOM) e riempitivi che sembrano spazi vuoti ma non
 * lo sono per le regex (Hangul U+115F, U+1160, U+3164, U+FFA0, Braille vuoto U+2800: un titolo fatto solo di quelli
 * passerebbe `\S` e sarebbe invisibile). La stessa lista di `community_guide_text_ok` nel database (il test le confronta).
 */
const HIDDEN =
  /[\u{0}-\u{8}\u{b}-\u{1f}\u{7f}-\u{9f}\u{ad}\u{61c}\u{115f}\u{1160}\u{200b}\u{200e}\u{200f}\u{202a}-\u{202e}\u{2060}-\u{2064}\u{2066}-\u{2069}\u{2800}\u{3164}\u{feff}\u{ffa0}]/gu;

/** Gli spazi che non vanno a capo (come lo spazio normale per le righe vuote): gli stessi della regex del database. */
const SPACES = /[ \u{a0}\u{1680}\u{2000}-\u{200a}\u{202f}\u{205f}\u{3000}]/gu;

/** Punti di codice (come `char_length` di Postgres: un'emoji conta uno). */
export const codePoints = (s: string): number => Array.from(s).length;

/**
 * Testo semplice di un utente, pulito come il database lo accetta. `multiline`: a capo ammessi (riassunto, testo delle
 * sezioni, motivo di una segnalazione), righe senza spazi in coda e al massimo una riga vuota di fila; altrimenti una
 * riga sola con gli spazi compattati (titoli). Il testo grezzo si taglia prima delle regex (quattro volte il massimo):
 * un invio enorme non fa girare le espressioni su megabyte di testo. Il limite vero lo controlla `plainTextOk`.
 */
export function cleanPlain(raw: unknown, max: number, multiline: boolean): string {
  let s = typeof raw === "string" ? raw : "";
  const cap = max * 4 + 64;
  if (s.length > cap) s = s.slice(0, cap);
  s = s.replace(/\r\n?|[\u{2028}\u{2029}\u{85}]/gu, "\n").replace(/\t/g, " ").replace(HIDDEN, "");
  if (!multiline) return s.replace(/\s+/g, " ").trim();
  return s
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Il testo rispetta le regole del database (`community_guide_text_ok`)? Lunghezza in punti di codice, almeno un
 * carattere che non sia uno spazio (tranne il testo vuoto ammesso dalle bozze), niente a capo in una riga sola, niente
 * caratteri tolti da `cleanPlain`, al massimo una riga vuota di fila (anche con righe fatte di soli spazi Unicode),
 * niente spazi o a capo in testa e in coda.
 */
export function plainTextOk(t: string, min: number, max: number, multiline: boolean): boolean {
  if (typeof t !== "string") return false;
  const n = codePoints(t);
  if (n < min || n > max) return false;
  if (n === 0) return true;
  if (!/\S/.test(t) || t !== t.replace(/^[ \n]+|[ \n]+$/g, "")) return false;
  if (!multiline && /\n/.test(t)) return false;
  if (/[\r\t\u{2028}\u{2029}\u{85}]/u.test(t) || new RegExp(HIDDEN.source, "u").test(t)) return false;
  return !t.replace(SPACES, "").includes("\n\n\n");
}

// ——— Modulo ———

/** Nomi dei campi delle sezioni nel modulo: `section_heading_0`, `section_body_0`… (dall'alto in basso). */
export const sectionFields = (i: number) => ({ heading: `section_heading_${i}`, body: `section_body_${i}` });

export type GuideIntent = "draft" | "publish";

export type GuideFormValue = {
  lang: Locale;
  title: string;
  summary: string;
  sections: GuideSectionText[];
  category: CommunityGuideCategory;
  cards: string[];
  cover_preset: GuideCoverPreset;
};

/** Errori del modulo: `index` è la sezione (da 0) per `heading` e `body`. */
export type GuideFormError =
  | { code: "title" | "summary" | "sections" | "category" | "lang" | "cover" | "coverImage" | "cards"; index?: undefined }
  | { code: "heading" | "body"; index: number };

/** I campi del modulo per ogni errore, così il modulo mette il fuoco sul campo giusto (`index` = sezione, da 0). */
export function guideErrorField(error: GuideFormError): string {
  if (error.code === "heading" || error.code === "body") return sectionFields(error.index)[error.code];
  if (error.code === "sections") return sectionFields(0).heading;
  if (error.code === "cover" || error.code === "coverImage") return "cover_preset";
  if (error.code === "cards") return "card_search";
  return error.code;
}

type FormReader = { get: (name: string) => unknown; getAll?: (name: string) => unknown[] };

/**
 * Legge e controlla i campi del modulo di scrittura (FormData o bozza), con le regole del database per lo stato che si
 * chiede: una bozza (`draft`) si salva anche a metà (titolo da 1 carattere, riassunto e sezioni anche vuoti), una guida
 * da pubblicare ha tutti i minimi. Le righe di sezione vuote si saltano; le carte sconosciute al database del sito
 * (`knownCard`) si scartano, i doppioni pure. Video e risorse si leggono a parte con `readDeckMedia` (videos.ts).
 */
export function readGuideForm(fd: FormReader, intent: GuideIntent, knownCard: (slug: string) => boolean): { ok: true; value: GuideFormValue } | { ok: false; error: GuideFormError } {
  const L = GUIDE_LIMITS;
  const complete = intent === "publish";
  const str = (k: string) => fd.get(k);

  const lang = str("lang");
  if (!isGuideLang(lang)) return { ok: false, error: { code: "lang" } };
  const category = str("category");
  if (!isGuideCategory(category)) return { ok: false, error: { code: "category" } };
  const cover = str("cover_preset");
  if (!isCoverPreset(cover)) return { ok: false, error: { code: "cover" } };

  const title = cleanPlain(str("title"), L.titleMax, false);
  if (!plainTextOk(title, complete ? L.titleMin : 1, L.titleMax, false)) return { ok: false, error: { code: "title" } };

  const summary = cleanPlain(str("summary"), L.summaryMax, true);
  if (!plainTextOk(summary, complete ? L.summaryMin : 0, L.summaryMax, true)) return { ok: false, error: { code: "summary" } };

  const sections: GuideSectionText[] = [];
  // fino al doppio delle sezioni ammesse: un modulo con più righe piene del massimo dà l'errore, non un taglio muto
  for (let i = 0; i < L.sectionsMax * 2; i++) {
    const f = sectionFields(i);
    if (str(f.heading) == null && str(f.body) == null) continue;
    const heading = cleanPlain(str(f.heading), L.headingMax, false);
    const body = cleanPlain(str(f.body), L.bodyMax, true);
    if (!heading && !body) continue;
    const index = sections.length;
    if (index >= L.sectionsMax) return { ok: false, error: { code: "sections" } };
    if (!plainTextOk(heading, complete ? 1 : 0, L.headingMax, false)) return { ok: false, error: { code: "heading", index } };
    if (!plainTextOk(body, complete ? 1 : 0, L.bodyMax, true)) return { ok: false, error: { code: "body", index } };
    sections.push({ heading, body });
  }
  if (complete && sections.length < L.sectionsMin) return { ok: false, error: { code: "sections" } };

  const rawCards = fd.getAll ? fd.getAll("cards") : [];
  const cards: string[] = [];
  for (const c of rawCards) {
    if (typeof c !== "string" || !/^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$/.test(c) || !knownCard(c) || cards.includes(c)) continue;
    cards.push(c);
  }
  if (cards.length > L.cardsMax) return { ok: false, error: { code: "cards" } };

  return { ok: true, value: { lang, title, summary, sections, category, cards, cover_preset: cover } };
}

/** Codici delle eccezioni del trigger (`raise exception '<codice>'`), dal più lungo: 'guide_hidden' è dentro 'guide_hidden_recent'. */
const TRIGGER_CODES = ["guide_hidden_recent", "guide_daily_limit", "guide_limit", "guide_rate", "guide_hidden", "guide_status", "guide_translation", "report_rate"] as const;

/**
 * Errore del database → codice del modulo: i tetti e le regole del trigger `guard_community_guide` (blocco GUIDE di supabase/schema.sql,
 * `raise exception '<codice>'`), le policy (42501: ruolo mancante o riga altrui) e la tabella che non c'è ancora.
 */
export function guideErrorCode(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "db";
  const m = error.message ?? "";
  for (const code of TRIGGER_CODES) if (m.includes(code)) return code;
  // copertina caricata: cartella o ruolo (trigger del blocco GUIDE), file che non c'è (blocco IMMAGINI, 29/09/2026)
  if (/guide_cover_(path|role|file)/.test(m)) return "coverImage";
  if (guideTableMissing(error)) return "unavailable";
  if (error.code === "42501") return "forbidden";
  if (error.code === "23505") return "duplicate";
  return "db";
}

/**
 * La tabella (o una colonna) delle guide non c'è ancora: codice online prima della migrazione. Postgres risponde 42P01
 * (tabella) o 42703 (colonna), PostgREST PGRST205 ("Could not find the table … in the schema cache") o PGRST204.
 */
export function guideTableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST205" || error.code === "PGRST204") return true;
  return /community_guide/.test(error.message ?? "") && /does not exist|could not find/i.test(error.message ?? "");
}

// ——— Parole, impronte, traduzioni aggiornate ———

type WithText = { summary: string; sections: readonly GuideSectionText[] };
type WithLang = WithText & { lang: Locale; translations?: CommunityGuideTranslations | null };

/** Parole della guida originale: riassunto più titoli e testi delle sezioni (il titolo della guida no). */
export function communityGuideWords(g: WithText): number {
  return g.sections.reduce((n, s) => n + countWords(s.heading) + countWords(s.body), countWords(g.summary));
}

/** Minuti di lettura, a 200 parole al minuto, almeno uno. */
export function readMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

/**
 * Impronta del testo originale (lingua compresa, titolo escluso: non si traduce). Il sito la salva in `text_hash`
 * insieme al testo, così gli elenchi sanno quali traduzioni sono aggiornate senza leggere le sezioni.
 */
export function communityGuideHash(g: Pick<WithLang, "lang" | "summary" | "sections">): string {
  return textHash([g.lang, g.summary, ...g.sections.flatMap((s) => [s.heading, s.body])]);
}

/** Lunghezza massima di un testo tradotto: 2,5 volte l'originale più 200, la tolleranza di `parseTranslation`. */
const translatedMax = (max: number) => Math.ceil(max * 2.5) + 200;

/** Massimi di una traduzione salvata, uguali a `community_guide_translation_ok` nel database (il test li confronta). */
export const TRANSLATION_LIMITS = {
  summaryMax: translatedMax(GUIDE_LIMITS.summaryMax),
  headingMax: translatedMax(GUIDE_LIMITS.headingMax),
  bodyMax: translatedMax(GUIDE_LIMITS.bodyMax),
} as const;

/**
 * Il testo di una traduzione rispetta le regole del testo semplice (come l'originale, con i massimi di
 * `TRANSLATION_LIMITS`) e ha `sections` sezioni? Una traduzione scritta via API con segni di direzione, invisibili,
 * titoli su più righe o testi enormi non vale, e la pagina mostra l'originale (il database la rifiuta comunque).
 */
export function translationTextOk(t: unknown, sections: number): t is CommunityGuideText {
  if (!t || typeof t !== "object") return false;
  const x = t as { summary?: unknown; sections?: unknown };
  if (typeof x.summary !== "string" || !plainTextOk(x.summary, 1, TRANSLATION_LIMITS.summaryMax, true)) return false;
  if (!Array.isArray(x.sections) || x.sections.length !== sections) return false;
  return x.sections.every(
    (s: unknown) =>
      Boolean(s) &&
      typeof s === "object" &&
      plainTextOk((s as GuideSectionText).heading, 1, TRANSLATION_LIMITS.headingMax, false) &&
      plainTextOk((s as GuideSectionText).body, 1, TRANSLATION_LIMITS.bodyMax, true),
  );
}

/** Una traduzione pulita come il database la accetta (a capo, spazi, invisibili), prima di salvarla. */
export function cleanTranslation(t: CommunityGuideText): CommunityGuideText {
  const L = TRANSLATION_LIMITS;
  return {
    summary: cleanPlain(t.summary, L.summaryMax, true),
    sections: t.sections.map((s) => ({ heading: cleanPlain(s.heading, L.headingMax, false), body: cleanPlain(s.body, L.bodyMax, true) })),
  };
}

/** La traduzione in `locale`, solo se è stata fatta sul testo attuale (stessa impronta) e rispetta le regole del testo. */
export function freshGuideTranslation(g: WithLang, locale: Locale): CommunityGuideTranslation | null {
  if (locale === g.lang) return null;
  const t = g.translations?.[locale];
  if (!t || typeof t !== "object" || t.hash !== communityGuideHash(g)) return null;
  return translationTextOk(t.guide, g.sections.length) ? t : null;
}

/** Le lingue da tradurre (mancanti o rimaste indietro rispetto al testo). */
export function missingGuideLocales(g: WithLang, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l !== g.lang && freshGuideTranslation(g, l) === null);
}

/** Il testo da mostrare nella pagina in `locale`: tradotto quando si può, altrimenti l'originale. */
export function localizedCommunityGuide(g: WithLang, locale: Locale): { text: CommunityGuideText; lang: Locale; translated: boolean } {
  const t = freshGuideTranslation(g, locale);
  if (t) return { text: t.guide, lang: locale, translated: true };
  return { text: { summary: g.summary, sections: [...g.sections] }, lang: g.lang, translated: false };
}

// ——— Indicizzazione: la stessa regola per la pagina, gli elenchi e la sitemap ———

/** Una traduzione vista dagli elenchi: impronta, data e riassunto (le sezioni no). */
export type GuideListTranslation = { hash: string | null; at: string | null; summary: string | null };

/**
 * Quello che serve per decidere dove una guida si indicizza, senza sezioni né traduzioni intere: parole e impronta
 * salvate dal sito (`words`, `text_hash`) e, per lingua, impronta, data e riassunto della traduzione. Gli elenchi lo
 * leggono dal database (colonne leggere, guideQueries.ts); la pagina di una guida lo calcola dal testo intero
 * (`indexShapeOf`), così le due strade danno la stessa risposta.
 */
export type GuideIndexShape = {
  lang: Locale;
  status?: string;
  words: number | null;
  text_hash: string | null;
  tr: Partial<Record<Locale, GuideListTranslation>>;
};

/** Una guida negli elenchi (/guides, /guides/community, /u, /account, altre guide, sitemap). */
export type CommunityGuideListItem = GuideIndexShape & {
  id: string;
  slug: string;
  owner: string;
  title: string;
  summary: string;
  category: CommunityGuideCategory;
  cover_preset: GuideCoverPreset;
  cover_path?: string | null;
  status: CommunityGuideStatus;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  profile?: Author | null;
};

/** La forma per l'indicizzazione calcolata dal testo intero (parole, impronta e sole traduzioni aggiornate). */
export function indexShapeOf(g: WithLang & { status?: string }): GuideIndexShape {
  const tr: Partial<Record<Locale, GuideListTranslation>> = {};
  for (const l of GUIDE_LANGS) {
    const t = freshGuideTranslation(g, l);
    if (t) tr[l] = { hash: t.hash, at: t.at ?? null, summary: t.guide.summary };
  }
  return { lang: g.lang, status: g.status, words: communityGuideWords(g), text_hash: communityGuideHash(g), tr };
}

/** Una guida intera come voce di elenco. */
export function listItemOf(g: CommunityGuide): CommunityGuideListItem {
  return {
    id: g.id,
    slug: g.slug,
    owner: g.owner,
    title: g.title,
    summary: g.summary,
    category: g.category,
    cover_preset: g.cover_preset,
    cover_path: g.cover_path,
    created_at: g.created_at,
    updated_at: g.updated_at,
    published_at: g.published_at,
    profile: g.profile,
    ...indexShapeOf(g),
    status: g.status,
  };
}

/** La traduzione in `locale` vista da un elenco: vale solo sul testo attuale (impronta salvata uguale) e con un riassunto valido. */
function listTranslation(g: GuideIndexShape, locale: Locale): GuideListTranslation | null {
  if (locale === g.lang || !g.text_hash) return null;
  const t = g.tr[locale];
  return t && t.hash === g.text_hash && typeof t.summary === "string" && plainTextOk(t.summary, 1, TRANSLATION_LIMITS.summaryMax, true) ? t : null;
}

/** Le lingue in cui la guida si legge davvero, nell'ordine di `all`: l'originale più le traduzioni aggiornate. */
export function guideShapeLocales(g: GuideIndexShape, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l === g.lang || listTranslation(g, l) !== null);
}

/** La guida ha abbastanza testo per stare in Google (e deve essere pubblicata)? Senza parole salvate no. */
export function guideShapeIndexable(g: GuideIndexShape): boolean {
  return (g.status === undefined || g.status === "published") && (g.words ?? 0) >= COMMUNITY_GUIDE_MIN_WORDS;
}

/**
 * Robots e hreflang della pagina di una guida in una lingua, come `deckIndexing` dei mazzi: `languages` sono le versioni
 * da dichiarare (originale e traduzioni aggiornate, solo sopra soglia), `noindex` se questa versione non si indicizza,
 * `hreflang` false se la guida non si indicizza in nessuna lingua (allora resta la sola canonical, `dropHreflang`).
 */
export function guideShapeIndexing(g: GuideIndexShape, all: readonly Locale[], locale: Locale): { languages: Locale[]; noindex: boolean; hreflang: boolean } {
  const languages = guideShapeIndexable(g) ? guideShapeLocales(g, all) : [];
  return { languages, noindex: !languages.includes(locale), hreflang: languages.length > 0 };
}

/** `guideShapeIndexing` per una guida intera (la pagina della guida). */
export function communityGuideIndexing(g: WithLang & { status?: string }, all: readonly Locale[], locale: Locale): { languages: Locale[]; noindex: boolean; hreflang: boolean } {
  return guideShapeIndexing(indexShapeOf(g), all, locale);
}

/** La guida intera ha abbastanza testo per stare in Google (e deve essere pubblicata)? */
export function communityGuideIndexable(g: WithText & { status?: string }): boolean {
  return (g.status === undefined || g.status === "published") && communityGuideWords(g) >= COMMUNITY_GUIDE_MIN_WORDS;
}

/** Il riassunto di una voce nella lingua della pagina, se la traduzione c'è; altrimenti quello dell'autore. */
export function guideShapeSummary(g: GuideIndexShape & { summary: string }, locale: Locale): { text: string; lang: Locale } {
  const t = listTranslation(g, locale);
  return t && t.summary !== null ? { text: t.summary, lang: locale } : { text: g.summary, lang: g.lang };
}

/** La data più recente fra quelle date (confronto per istante, non per stringa); undefined se non ce n'è. */
function latestOf(dates: readonly (string | null | undefined)[]): string | undefined {
  let best: string | undefined;
  let bestAt = -Infinity;
  for (const d of dates) {
    const at = d ? Date.parse(d) : NaN;
    if (!Number.isNaN(at) && at > bestAt) {
      best = d as string;
      bestAt = at;
    }
  }
  return best;
}

/** Quando è cambiata la versione in `locale`: l'ultima modifica dell'autore o l'arrivo della traduzione in quella lingua. */
export function guideShapeDate(g: GuideIndexShape & { updated_at: string }, locale: Locale): string {
  return latestOf([g.updated_at, listTranslation(g, locale)?.at]) ?? g.updated_at;
}

type Dated = GuideIndexShape & { published_at?: string | null; created_at?: string };

/** Le guide indicizzabili in `locale`, dalla più recente (prima pubblicazione): quelle di /guides (le prime) e di /guides/community. */
export function guidesIndexableIn<T extends Dated>(items: readonly T[], all: readonly Locale[], locale: Locale): T[] {
  const day = (g: Dated) => g.published_at ?? g.created_at ?? "";
  return items.filter((g) => !guideShapeIndexing(g, all, locale).noindex).sort((a, b) => day(b).localeCompare(day(a)));
}

/** Una riga della sitemap: le lingue in cui la pagina si indicizza (mai vuote: vuol dire "tutte"), la data per lingua e la copertina. */
export type SitemapCommunityGuide = { slug: string; locales: Locale[]; dates: Partial<Record<Locale, string>>; image?: string };

/**
 * Le righe della sitemap dalle guide pubblicate: solo quelle sopra soglia, con le loro lingue, la data di ogni versione
 * (ultima modifica o arrivo della traduzione) e la copertina preimpostata (una copertina caricata sta nello Storage, un
 * altro dominio: niente immagine, come le miniature di YouTube). `hub` e `list` sono, per lingua, il lastmod di /guides
 * e di /guides/community: dal 29/09/2026 /guides mostra tutte le guide indicizzabili in quella lingua insieme a quelle
 * editoriali (prima solo le ultime sei, in una sezione a parte), quindi le due date coincidono. Una lingua assente =
 * nessuna guida da mostrare (/guides/community vuota e noindex, fuori dalla sitemap). Una guida sottile o non tradotta
 * non sposta le date delle pagine che non la mostrano.
 */
export function sitemapCommunityGuides<R extends Dated & { slug: string; owner?: string; updated_at: string; cover_preset?: string | null; cover_path?: string | null }>(
  rows: readonly R[],
  all: readonly Locale[],
): { guides: SitemapCommunityGuide[]; hub: Partial<Record<Locale, string>>; list: Partial<Record<Locale, string>> } {
  const published = rows.filter((r) => r.status === undefined || r.status === "published");
  const guides = published
    .map((r) => {
      const locales = guideShapeIndexable(r) ? guideShapeLocales(r, all) : [];
      const uploaded = r.owner !== undefined && coverPathOk(r.cover_path, r.owner);
      return {
        slug: r.slug,
        locales,
        dates: Object.fromEntries(locales.map((l) => [l, guideShapeDate(r, l)])),
        ...(uploaded ? {} : { image: guideCover(r.cover_preset).src }),
      };
    })
    .filter((r) => r.locales.length > 0);
  const hub: Partial<Record<Locale, string>> = {};
  const list: Partial<Record<Locale, string>> = {};
  for (const l of all) {
    const shown = guidesIndexableIn(published, all, l);
    if (!shown.length) continue;
    list[l] = latestOf(shown.map((r) => guideShapeDate(r, l)));
    hub[l] = list[l];
  }
  return { guides, hub, list };
}

// ——— Traduzione: il testo in campi piatti, a pezzi ———

/** Riassunto e sezioni come campi stringa per il modello: summary, heading_1, body_1, heading_2… */
export function guideTranslationDoc(text: CommunityGuideText): TranslationDoc {
  const doc: TranslationDoc = { summary: text.summary };
  text.sections.forEach((s, i) => {
    doc[`heading_${i + 1}`] = s.heading;
    doc[`body_${i + 1}`] = s.body;
  });
  return doc;
}

/** Il contrario di `guideTranslationDoc`, per `count` sezioni; null se manca un campo. */
export function guideTextFromDoc(doc: TranslationDoc, count: number): CommunityGuideText | null {
  if (typeof doc.summary !== "string") return null;
  const sections: GuideSectionText[] = [];
  for (let i = 1; i <= count; i++) {
    const heading = doc[`heading_${i}`];
    const body = doc[`body_${i}`];
    if (typeof heading !== "string" || typeof body !== "string") return null;
    sections.push({ heading, body });
  }
  return { summary: doc.summary, sections };
}

/**
 * Impronte delle parti del testo, lingua compresa: il riassunto, poi ogni sezione (titolo e testo insieme). Una
 * modifica cambia solo le impronte delle parti toccate: si ritraducono quelle, le altre si riusano.
 */
export function guidePartHashes(g: Pick<WithLang, "lang" | "summary" | "sections">): string[] {
  return [textHash([g.lang, "summary", g.summary]), ...g.sections.map((s) => textHash([g.lang, "section", s.heading, s.body]))];
}

/**
 * Caratteri di testo di partenza per richiesta: una guida arriva a 300 + 12 × 4080 caratteri (circa 49 mila), troppo
 * per una risposta sola entro il tempo di una funzione; a pezzi di 8000 caratteri ogni richiesta resta sotto il minuto.
 */
export const TRANSLATION_CHUNK_CHARS = 8000;

export type GuideTranslationPlan = {
  /** impronte delle parti del testo attuale (`guidePartHashes`), da salvare con la traduzione */
  parts: string[];
  /** parti già tradotte e riusate (null = da tradurre) */
  summary: string | null;
  sections: (GuideSectionText | null)[];
  /** le parti da tradurre, in gruppi: campi `summary`, `heading_N` e `body_N` (N = numero della sezione, da 1) */
  chunks: TranslationDoc[];
};

/**
 * Che cosa tradurre in una lingua: le parti già tradotte in `prev` (la traduzione salvata, anche vecchia) con la stessa
 * impronta si riusano, le altre si raccolgono in gruppi di al massimo `maxChars` caratteri (una sezione non si divide).
 * Una traduzione salvata rovinata o senza impronte delle parti non si riusa.
 */
export function planGuideTranslation(g: Pick<WithLang, "lang" | "summary" | "sections">, prev?: CommunityGuideTranslation | null, maxChars = TRANSLATION_CHUNK_CHARS): GuideTranslationPlan {
  const parts = guidePartHashes(g);
  const summaries = new Map<string, string>();
  const bodies = new Map<string, GuideSectionText>();
  const old = prev?.guide;
  if (prev && Array.isArray(prev.parts) && old && Array.isArray(old.sections) && prev.parts.length === old.sections.length + 1 && translationTextOk(old, old.sections.length)) {
    summaries.set(prev.parts[0], old.summary);
    old.sections.forEach((s, i) => bodies.set(prev.parts![i + 1], s));
  }
  const summary = summaries.get(parts[0]) ?? null;
  const sections = g.sections.map((_, i) => {
    const s = bodies.get(parts[i + 1]);
    return s ? { heading: s.heading, body: s.body } : null;
  });

  const chunks: TranslationDoc[] = [];
  let current: TranslationDoc = {};
  let size = 0;
  const add = (fields: TranslationDoc) => {
    const n = Object.values(fields).reduce((a, v) => a + v.length, 0);
    if (size > 0 && size + n > maxChars) {
      chunks.push(current);
      current = {};
      size = 0;
    }
    Object.assign(current, fields);
    size += n;
  };
  if (summary === null) add({ summary: g.summary });
  g.sections.forEach((s, i) => {
    if (!sections[i]) add({ [`heading_${i + 1}`]: s.heading, [`body_${i + 1}`]: s.body });
  });
  if (size > 0) chunks.push(current);
  return { parts, summary, sections, chunks };
}

/**
 * Riunisce le parti riusate e quelle appena tradotte (`results`: una risposta per gruppo, nell'ordine di `plan.chunks`),
 * pulite come il database le accetta. Null se manca una risposta o un campo, o se il testo non rispetta le regole.
 */
export function assembleGuideTranslation(g: WithText, plan: GuideTranslationPlan, results: readonly (TranslationDoc | null | undefined)[]): CommunityGuideText | null {
  if (results.length !== plan.chunks.length) return null;
  const merged: TranslationDoc = {};
  for (let i = 0; i < plan.chunks.length; i++) {
    const r = results[i];
    if (!r) return null;
    for (const k of Object.keys(plan.chunks[i])) {
      if (typeof r[k] !== "string") return null;
      merged[k] = r[k];
    }
  }
  const summary = plan.summary ?? merged.summary;
  if (typeof summary !== "string") return null;
  const sections: GuideSectionText[] = [];
  for (let i = 0; i < g.sections.length; i++) {
    const done = plan.sections[i];
    const heading = done ? done.heading : merged[`heading_${i + 1}`];
    const body = done ? done.body : merged[`body_${i + 1}`];
    if (typeof heading !== "string" || typeof body !== "string") return null;
    sections.push({ heading, body });
  }
  const text = cleanTranslation({ summary, sections });
  return translationTextOk(text, g.sections.length) ? text : null;
}

/** max_tokens di una richiesta: circa un token ogni due caratteri del testo di partenza più un margine, al massimo 16000. */
export function translationMaxTokens(doc: TranslationDoc): number {
  const chars = Object.values(doc).reduce((n, v) => n + v.length, 0);
  return Math.min(16000, Math.ceil(chars / 2) + 1000);
}

// ——— Letture: dalla riga del database ai dati mostrati ———

/**
 * Sezioni lette dal database, ricontrollate (difesa in lettura, come le bio dei profili): solo oggetti con titolo e
 * testo di tipo stringa, al massimo 12. Una riga scritta a mano e rovinata non rompe la pagina.
 */
export function storedSections(raw: unknown): GuideSectionText[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is GuideSectionText => Boolean(s) && typeof s === "object" && typeof (s as GuideSectionText).heading === "string" && typeof (s as GuideSectionText).body === "string")
    .slice(0, GUIDE_LIMITS.sectionsMax)
    .map((s) => ({ heading: s.heading, body: s.body }));
}

/**
 * Percorso di una copertina caricata: solo nella cartella delle guide del proprietario, `<id>/guide/<file>`, con il nome
 * che dà il sito (29/09/2026: prima bastava una cartella qualsiasi dell'utente, ma il bucket ammette solo le sue
 * cartelle, e una foto profilo o la copertina della vetrina non devono diventare la copertina di una guida).
 */
export function coverPathOk(path: string | null | undefined, owner: string): path is string {
  if (!path || !UUID_RE.test(owner)) return false;
  return path.length <= 200 && new RegExp(`^${owner}/${GUIDE_COVER_FOLDER}/${MEDIA_FILE_RE}$`).test(path);
}
