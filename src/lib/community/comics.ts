import type { Locale } from "../i18n";
import { TRANSLATION_RULES, textHash, type TranslationDoc } from "./deckTranslation";
import { MEDIA_FILE_RE, UUID_RE, mediaPublicUrl } from "./profileMedia";
import { cleanPlain, plainTextOk } from "./guides";

/**
 * Fumetti dei Creator pubblicati come news (pacchetto FUMETTI, 29/09/2026). Richiesta di Pierluigi: Vega (Creator)
 * disegna un fumetto a settimana con notizie e storie del gioco, "vorrei che venisse fatta come news"; scelte sue: "Li
 * pubblica lei da sola" e la firma "Vega". Chi ha il ruolo Creator o Staff (o è admin: `canPublishComics` di badges.ts)
 * pubblica da /news/comics/new: tavole, copertina 16:9, titolo, presentazione e il testo di ogni tavola. Il fumetto esce
 * fra le news (home, /news, sitemap, Discord), con la pagina /news/comics/<slug> firmata da chi l'ha disegnato; il sito
 * traduce titolo, presentazione e testi delle tavole nelle altre due lingue.
 *
 * Versioni disegnate (30/09/2026): Vega aveva pubblicato lo stesso fumetto tre volte, una per lingua, e Pierluigi ha
 * chiesto "unificali in una sola news subito". Un fumetto ha ora, oltre alle tavole nella lingua dei
 * testi (`lang`), una versione disegnata per ognuna delle altre lingue (`editions`: tavole, titolo, presentazione e, se
 * serve, una copertina sua): nella pagina in quella lingua si vede la versione disegnata al posto della traduzione
 * automatica, e la news resta una, con un indirizzo solo.
 *
 * Regole pure, senza dipendenze a runtime oltre a moduli a loro volta puri: `node --test src/lib/community/comics.test.ts`
 * le prova e le confronta con il blocco FUMETTI di supabase/schema.sql, che dice le stesse cose (limiti, cartelle, ruoli).
 */

/** Cartella del bucket `profile-media` con tavole e copertine: `<id>/comic/<uuid>.<ext>`. */
export const COMIC_FOLDER = "comic";
/** Limiti del testo e delle tavole, uguali ai vincoli del database. */
export const COMIC_LIMITS = {
  titleMin: 3,
  titleMax: 110,
  /** presentazione: scheda in home e in /news, attacco della pagina, description */
  summaryMin: 40,
  summaryMax: 300,
  pagesMax: 10,
  /** testo di una tavola: dialoghi, didascalie ed effetti sonori (facoltativo, ma serve a chi non vede le immagini e a Google) */
  pageTextMax: 1500,
} as const;
/** Tetti del database (trigger guard_community_comic): fumetti per account, creati e prime pubblicazioni al giorno. */
export const COMIC_MAX_PER_OWNER = 500;
export const COMIC_DAILY_NEW_LIMIT = 10;
export const COMIC_DAILY_PUBLISH_LIMIT = 3;
/** Ore senza pubblicare dopo un fumetto nascosto dallo staff. */
export const COMIC_HIDE_COOLDOWN_HOURS = 24;
/** File nella cartella dei fumetti di un utente (policy di caricamento: un tetto suo, fuori da quello della vetrina). */
export const COMIC_FILES_MAX = 300;
/** La tavola dopo la riduzione nel browser: larga al massimo 1080 px e alta al massimo 1920 (una striscia 9:16). */
export const COMIC_PAGE_BOX = { width: 1080, height: 1920 } as const;
/** Misure minime di una tavola salvata (vincolo del database). */
export const COMIC_PAGE_MIN = { width: 100, height: 100 } as const;
/** Peso massimo di un file dopo la ricodifica (il limite del bucket). */
export const COMIC_FILE_MAX_BYTES = 2 * 1024 * 1024;
/** Peso massimo del file scelto dal computer, prima che il browser lo riduca (oltre, rischia di bloccare il telefono). */
export const COMIC_SOURCE_MAX_BYTES = 20 * 1024 * 1024;
/** Copertina 16:9 come le guide: l'ideale 1600 × 900, almeno 1200 × 675, ritagliata al centro nel browser. */
export const COMIC_COVER_SIZE = { width: 1600, height: 900 } as const;
export const COMIC_COVER_MIN = { width: 1200, height: 675 } as const;
/** Lingue in cui si scrivono i testi (quella dei balloon): le tre del sito. */
export const COMIC_LANGS = ["en", "it", "es", "fr"] as const;

export type ComicStatus = "draft" | "published" | "hidden";
export type ComicPage = { path: string; width: number; height: number; text: string };
/** Il testo che si traduce: titolo, presentazione e un testo per tavola (vuoto dove la tavola non ha testo). */
export type ComicText = { title: string; summary: string; pages: string[] };
export type ComicTranslation = { hash: string; at: string; model?: string; comic: ComicText };
export type ComicTranslations = Partial<Record<Locale, ComicTranslation>>;
/**
 * La versione disegnata in un'altra lingua (30/09/2026): tavole con i balloon in quella lingua, ognuna con il suo testo,
 * titolo, presentazione e, facoltativa, una copertina sua (una copertina con delle scritte); senza, vale quella del
 * fumetto. Le regole sono quelle dell'originale (colonna `editions`, vincolo `community_comics_editions_check`).
 */
export type ComicEdition = { title: string; summary: string; pages: ComicPage[]; cover_path: string | null };
export type ComicEditions = Partial<Record<Locale, ComicEdition>>;
export type ComicAuthor = { username: string | null; display_name: string | null; avatar_url: string | null; badge?: string | null };

/** Un fumetto intero (pagina pubblica e modifica). */
export type CommunityComic = {
  id: string;
  slug: string;
  owner: string;
  lang: Locale;
  title: string;
  summary: string;
  pages: ComicPage[];
  cover_path: string | null;
  status: ComicStatus;
  translations: ComicTranslations | null;
  /** versioni disegnate nelle altre lingue (vuoto: nessuna) */
  editions: ComicEditions;
  text_hash: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  profile?: ComicAuthor | null;
};

/** Di ogni traduzione, negli elenchi, solo impronta, data, titolo e presentazione. */
export type ComicListTranslation = { hash: string | null; at: string | null; summary: string | null; title?: string | null };
/** Di ogni versione disegnata, negli elenchi, titolo, presentazione, copertina e il file della prima tavola (se ce n'è una). */
export type ComicListEdition = { title: string | null; summary: string | null; cover_path: string | null; page: string | null };

/** Un fumetto negli elenchi (home, /news, profilo, /account, sitemap): senza tavole né traduzioni intere. */
export type ComicListItem = {
  id: string;
  slug: string;
  owner: string;
  lang: Locale;
  title: string;
  summary: string;
  cover_path: string | null;
  status: ComicStatus;
  text_hash: string | null;
  tr: Partial<Record<Locale, ComicListTranslation>>;
  /** versioni disegnate (facoltativo: le righe lette prima della migrazione non le hanno) */
  ed?: Partial<Record<Locale, ComicListEdition>>;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  profile?: ComicAuthor | null;
};

const LANG_SET = new Set<string>(COMIC_LANGS);
const isLang = (v: unknown): v is Locale => typeof v === "string" && LANG_SET.has(v);

/** L'indirizzo di un fumetto, senza lingua. */
export function comicPath(slug: string): string {
  return `/news/comics/${slug}`;
}

// ——— File: tavole e copertina ———

const ANY_OWNER = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Il percorso di un file nella cartella dei fumetti (`<id>/comic/<file>`, al massimo 200 caratteri) e, con `owner`, di QUEL
 * proprietario. Il nome del file lo sceglie il sito (un uuid, `uploadMedia`); il database ricontrolla la cartella.
 */
export function comicPathOk(path: unknown, owner?: string): path is string {
  if (typeof path !== "string" || path.length > 200) return false;
  if (owner === undefined) return new RegExp(`^${ANY_OWNER}/${COMIC_FOLDER}/${MEDIA_FILE_RE}$`).test(path);
  return UUID_RE.test(owner) && new RegExp(`^${owner}/${COMIC_FOLDER}/${MEDIA_FILE_RE}$`).test(path);
}

/** L'indirizzo pubblico di una tavola o della copertina (`base` = URL del progetto Supabase). */
export function comicImageUrl(path: string, base: string): string {
  return mediaPublicUrl(base, path);
}

/** Le misure di una tavola rientrano nei limiti del database (numeri interi, 100-1080 di larghezza, 100-1920 di altezza). */
export function pageSizeOk(width: unknown, height: unknown): boolean {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    (width as number) >= COMIC_PAGE_MIN.width &&
    (width as number) <= COMIC_PAGE_BOX.width &&
    (height as number) >= COMIC_PAGE_MIN.height &&
    (height as number) <= COMIC_PAGE_BOX.height
  );
}

/**
 * Le tavole lette dal database, ricontrollate (difesa in lettura): solo oggetti con un percorso della cartella del
 * proprietario, misure nei limiti e un testo, al massimo 10. Una riga scritta a mano e rovinata non rompe la pagina.
 */
export function storedPages(raw: unknown, owner: string): ComicPage[] {
  if (!Array.isArray(raw)) return [];
  const out: ComicPage[] = [];
  for (const p of raw) {
    if (!p || typeof p !== "object") continue;
    const x = p as Record<string, unknown>;
    if (!comicPathOk(x.path, owner) || !pageSizeOk(x.width, x.height)) continue;
    out.push({ path: x.path, width: x.width as number, height: x.height as number, text: typeof x.text === "string" ? x.text : "" });
    if (out.length === COMIC_LIMITS.pagesMax) break;
  }
  return out;
}

/**
 * Le versioni disegnate lette dal database, ricontrollate come le tavole: solo le altre lingue del sito (mai `lang`),
 * testi stringa, tavole e copertina nella cartella del proprietario. Una versione a metà (una bozza) resta: la pagina
 * mostra solo quelle complete (`comicEdition`).
 */
export function storedEditions(raw: unknown, owner: string, lang: Locale): ComicEditions {
  const out: ComicEditions = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const l of COMIC_LANGS) {
    const x = (raw as Record<string, unknown>)[l];
    if (l === lang || !x || typeof x !== "object" || Array.isArray(x)) continue;
    const e = x as Record<string, unknown>;
    out[l] = {
      title: typeof e.title === "string" ? e.title : "",
      summary: typeof e.summary === "string" ? e.summary : "",
      pages: storedPages(e.pages, owner),
      cover_path: comicPathOk(e.cover_path, owner) ? e.cover_path : null,
    };
  }
  return out;
}

/** Tutti i file di un fumetto (tavole, copertina, tavole e copertine delle versioni disegnate), senza doppioni. */
export function comicFiles(c: { owner: string; pages: readonly ComicPage[]; cover_path: string | null; editions?: ComicEditions | null }): string[] {
  const all = [...c.pages.map((p) => p.path), c.cover_path, ...Object.values(c.editions ?? {}).flatMap((e) => (e ? [...e.pages.map((p) => p.path), e.cover_path] : []))];
  return [...new Set(all.filter((p): p is string => comicPathOk(p, c.owner)))];
}

// ——— Modulo ———

export type ComicIntent = "draft" | "publish";
export type ComicFormValue = { lang: Locale; title: string; summary: string; pages: ComicPage[]; cover_path: string | null; editions: ComicEditions };
export type ComicFormError =
  | { code: "lang" | "title" | "summary" | "pages" | "cover" | "editions"; index?: undefined; edition?: undefined }
  | { code: "page"; index: number; edition?: undefined }
  | { code: "edition_title" | "edition_summary" | "edition_pages" | "edition_cover"; edition: Locale; index?: undefined }
  | { code: "edition_page"; edition: Locale; index: number };

type FormReader = { get: (name: string) => unknown };

/**
 * Il campo del modulo da mettere a fuoco per un errore: i testi delle tavole hanno id `cm-page-<n>`, i campi di una
 * versione disegnata `cm-ed-<lingua>-title`, `cm-ed-<lingua>-page-<n>`…
 */
export function comicErrorField(error: ComicFormError): string {
  if (error.code === "page") return `page-${error.index}`;
  if (error.code === "edition_page") return `ed-${error.edition}-page-${error.index}`;
  if (error.edition) return `ed-${error.edition}-${error.code.slice("edition_".length)}`;
  return error.code;
}

/** Lunghezza massima della lista delle tavole nel modulo (JSON): 10 tavole piene stanno ben sotto. */
const PAGES_JSON_MAX = 60_000;
/** Lunghezza massima delle versioni disegnate nel modulo (JSON): due versioni da 10 tavole piene. */
const EDITIONS_JSON_MAX = 130_000;

/** Un JSON del modulo: vuoto → `empty`, troppo lungo o rotto → undefined. */
function formJson(raw: unknown, max: number, empty: unknown): unknown {
  if (typeof raw !== "string" || !raw.trim()) return empty;
  if (raw.length > max) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Le tavole di un elenco del modulo: tutte giuste, o l'indice della prima che non va (`-1`: l'elenco intero). */
function formPages(list: unknown, publish: boolean, owner: string): { ok: true; pages: ComicPage[] } | { ok: false; index: number } {
  const L = COMIC_LIMITS;
  if (!Array.isArray(list) || list.length > L.pagesMax || (publish && list.length < 1)) return { ok: false, index: -1 };
  const pages: ComicPage[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const x = list[i] as Record<string, unknown> | null;
    if (!x || typeof x !== "object" || !comicPathOk(x.path, owner) || !pageSizeOk(x.width, x.height) || seen.has(x.path)) return { ok: false, index: i };
    const text = cleanPlain(x.text ?? "", L.pageTextMax, true);
    if (!plainTextOk(text, 0, L.pageTextMax, true)) return { ok: false, index: i };
    seen.add(x.path);
    pages.push({ path: x.path, width: x.width as number, height: x.height as number, text });
  }
  return { ok: true, pages };
}

/**
 * Le versioni disegnate del modulo (JSON: {"it": {title, summary, pages, cover_path}}), con le regole dell'originale:
 * per pubblicare titolo, presentazione e almeno una tavola; una bozza anche a metà (titolo compreso). Mai la lingua dei
 * testi del fumetto; la copertina è facoltativa, nella cartella del proprietario.
 */
function formEditions(raw: unknown, lang: Locale, publish: boolean, owner: string): { ok: true; editions: ComicEditions } | { ok: false; error: ComicFormError } {
  const L = COMIC_LIMITS;
  const data = formJson(raw, EDITIONS_JSON_MAX, {});
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, error: { code: "editions" } };
  const editions: ComicEditions = {};
  for (const [key, value] of Object.entries(data)) {
    if (!isLang(key) || key === lang || !value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: { code: "editions" } };
    const e = value as Record<string, unknown>;
    const title = cleanPlain(e.title ?? "", L.titleMax, false);
    if (!plainTextOk(title, publish ? L.titleMin : 0, L.titleMax, false)) return { ok: false, error: { code: "edition_title", edition: key } };
    const summary = cleanPlain(e.summary ?? "", L.summaryMax, true);
    if (!plainTextOk(summary, publish ? L.summaryMin : 0, L.summaryMax, true)) return { ok: false, error: { code: "edition_summary", edition: key } };
    const pages = formPages(e.pages ?? [], publish, owner);
    if (!pages.ok) return { ok: false, error: pages.index < 0 ? { code: "edition_pages", edition: key } : { code: "edition_page", edition: key, index: pages.index } };
    const cover = typeof e.cover_path === "string" ? e.cover_path.trim() : "";
    if (cover && !comicPathOk(cover, owner)) return { ok: false, error: { code: "edition_cover", edition: key } };
    editions[key] = { title, summary, pages: pages.pages, cover_path: cover || null };
  }
  return { ok: true, editions };
}

/**
 * Legge e controlla i campi del modulo di un fumetto (FormData), con le regole del database per lo stato che si chiede:
 * una bozza si salva anche a metà (titolo da 1 carattere, niente presentazione, tavole e copertina); un fumetto da
 * pubblicare ha titolo, presentazione, almeno una tavola e la copertina. `owner` è il proprietario: tavole e copertina
 * devono stare nella SUA cartella. `pages` arriva come JSON ([{path, width, height, text}]) dal modulo, `editions` (le
 * versioni disegnate, facoltative) come JSON per lingua: un modulo senza il campo vale "nessuna versione".
 */
export function readComicForm(fd: FormReader, intent: ComicIntent, owner: string): { ok: true; value: ComicFormValue } | { ok: false; error: ComicFormError } {
  const L = COMIC_LIMITS;
  const publish = intent === "publish";
  const lang = fd.get("lang");
  if (!isLang(lang)) return { ok: false, error: { code: "lang" } };
  const title = cleanPlain(fd.get("title"), L.titleMax, false);
  if (!plainTextOk(title, publish ? L.titleMin : 1, L.titleMax, false)) return { ok: false, error: { code: "title" } };
  const summary = cleanPlain(fd.get("summary"), L.summaryMax, true);
  if (!plainTextOk(summary, publish ? L.summaryMin : 0, L.summaryMax, true)) return { ok: false, error: { code: "summary" } };

  const list = formJson(fd.get("pages"), PAGES_JSON_MAX, []);
  if (list === undefined) return { ok: false, error: { code: "pages" } };
  const pages = formPages(list, publish, owner);
  if (!pages.ok) return { ok: false, error: pages.index < 0 ? { code: "pages" } : { code: "page", index: pages.index } };

  const coverRaw = String(fd.get("cover_path") ?? "").trim();
  if (coverRaw && !comicPathOk(coverRaw, owner)) return { ok: false, error: { code: "cover" } };
  if (publish && !coverRaw) return { ok: false, error: { code: "cover" } };
  const editions = formEditions(fd.get("editions"), lang, publish, owner);
  if (!editions.ok) return { ok: false, error: editions.error };
  return { ok: true, value: { lang, title, summary, pages: pages.pages, cover_path: coverRaw || null, editions: editions.editions } };
}

/** Codici delle eccezioni dei trigger (`raise exception '<codice>'`), dal più lungo: 'comic_hidden' è dentro 'comic_hidden_recent'. */
const TRIGGER_CODES = ["comic_hidden_recent", "comic_reserved_fields", "comic_daily_limit", "comic_translation", "comic_limit", "comic_rate", "comic_hidden", "comic_status", "comic_file"] as const;

/**
 * La tabella (o una colonna) dei fumetti non c'è ancora: codice online prima della migrazione. Postgres risponde 42P01 o
 * 42703, PostgREST PGRST205 o PGRST204.
 */
export function comicTableMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST205" || error.code === "PGRST204") return true;
  return /community_comic/.test(error.message ?? "") && /does not exist|could not find/i.test(error.message ?? "");
}

/**
 * Errore del database → codice del modulo: i tetti e le regole dei trigger, i vincoli (il sito controlla prima, quindi
 * sono rari), la tabella che non c'è, le policy (42501: ruolo mancante o riga altrui).
 */
export function comicErrorCode(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "db";
  const m = error.message ?? "";
  for (const code of TRIGGER_CODES) if (m.includes(code)) return code;
  if (comicTableMissing(error)) return "unavailable";
  if (/community_comics_pages_check/.test(m)) return "pages";
  if (/community_comics_cover_(path_check|required)/.test(m)) return "cover";
  if (/community_comics_title_check/.test(m)) return "title";
  if (/community_comics_summary_check/.test(m)) return "summary";
  if (/community_comics_editions_check/.test(m)) return "editions";
  if (error.code === "42501") return "forbidden";
  if (error.code === "23505") return "duplicate";
  return "db";
}

// ——— Impronte e traduzioni ———

/**
 * Impronta del testo originale: lingua, titolo, presentazione e testi delle tavole. Il titolo si traduce con il resto
 * (Pierluigi, 29/09/2026, sulla guida di Vega: "non è tradotto il titolo"): cambiarlo rende vecchie le traduzioni.
 */
export function comicHash(c: { lang: Locale; title: string; summary: string; pages: readonly { text: string }[] }): string {
  return textHash([c.lang, c.title, c.summary, ...c.pages.map((p) => p.text)]);
}

/** Lunghezza massima di un testo tradotto: 2,5 volte l'originale più 200 (la tolleranza di `parseTranslation`). */
const translatedMax = (max: number) => Math.ceil(max * 2.5) + 200;
/** Massimi di una traduzione salvata, uguali a `community_comic_translation_ok` nel database. */
export const COMIC_TRANSLATION_LIMITS = {
  titleMax: translatedMax(COMIC_LIMITS.titleMax),
  summaryMax: translatedMax(COMIC_LIMITS.summaryMax),
  pageTextMax: translatedMax(COMIC_LIMITS.pageTextMax),
} as const;

/** Il testo di una traduzione rispetta le regole e ha un testo per ognuna delle `n` tavole? */
export function comicTranslationOk(t: unknown, n: number): t is ComicText {
  if (!t || typeof t !== "object") return false;
  const x = t as { title?: unknown; summary?: unknown; pages?: unknown };
  if (typeof x.title !== "string" || !plainTextOk(x.title, 1, COMIC_TRANSLATION_LIMITS.titleMax, false)) return false;
  if (typeof x.summary !== "string" || !plainTextOk(x.summary, 1, COMIC_TRANSLATION_LIMITS.summaryMax, true)) return false;
  if (!Array.isArray(x.pages) || x.pages.length !== n) return false;
  return x.pages.every((p) => typeof p === "string" && plainTextOk(p, 0, COMIC_TRANSLATION_LIMITS.pageTextMax, true));
}

/**
 * Istruzioni per tradurre i testi di un fumetto: stesse regole e stesso glossario delle guide (TRANSLATION_RULES), con i
 * campi di un fumetto, titolo compreso.
 */
export const COMIC_TRANSLATION_SYSTEM = `You translate the texts of comics drawn by content creators on OriginsMeta, an unofficial fan site about Origins TCG, a digital trading card game by Koin Games. The comic is a JSON object: "title" is its title, "summary" is its presentation, "page_N" is the text of page N of the comic: dialogues, captions and sound effects, in reading order, often one per line and sometimes with the name of who speaks before a colon. Translate every field from the source language into the target language and return the same fields. Keep the speakers' names, the line breaks and the tone: jokes and wordplay can be adapted so that they work in the target language, sound effects stay as they are unless the target language has a common equivalent. Translate the title as a title, keeping its emoji and punctuation.

${TRANSLATION_RULES}`;

/** Titolo, presentazione e testi delle tavole come campi per il modello: `title`, `summary`, `page_N` (solo le tavole con un testo). */
export function comicTranslationDoc(c: { title: string; summary: string; pages: readonly { text: string }[] }): TranslationDoc {
  const doc: TranslationDoc = { title: c.title, summary: c.summary };
  c.pages.forEach((p, i) => {
    if (p.text.trim()) doc[`page_${i + 1}`] = p.text;
  });
  return doc;
}

/**
 * Dalla risposta del modello (gli stessi campi di `comicTranslationDoc`) al testo da salvare: le tavole senza testo
 * restano vuote. Pulito come il database lo accetta; null se manca un campo o se il testo non rispetta le regole.
 */
export function comicTextFromDoc(doc: TranslationDoc, c: { summary: string; pages: readonly { text: string }[] }): ComicText | null {
  if (typeof doc.title !== "string" || typeof doc.summary !== "string") return null;
  const pages: string[] = [];
  for (let i = 0; i < c.pages.length; i++) {
    if (!c.pages[i].text.trim()) {
      pages.push("");
      continue;
    }
    const t = doc[`page_${i + 1}`];
    if (typeof t !== "string") return null;
    pages.push(cleanPlain(t, COMIC_TRANSLATION_LIMITS.pageTextMax, true));
  }
  const text = { title: cleanPlain(doc.title, COMIC_TRANSLATION_LIMITS.titleMax, false), summary: cleanPlain(doc.summary, COMIC_TRANSLATION_LIMITS.summaryMax, true), pages };
  return comicTranslationOk(text, c.pages.length) ? text : null;
}

type WithText = {
  lang: Locale;
  title: string;
  summary: string;
  pages: readonly ComicPage[];
  translations?: ComicTranslations | null;
  editions?: ComicEditions | null;
  cover_path?: string | null;
};

/** La traduzione in `locale`, solo se è stata fatta sul testo attuale e rispetta le regole. */
export function freshComicTranslation(c: WithText, locale: Locale): ComicTranslation | null {
  if (locale === c.lang) return null;
  const t = c.translations?.[locale];
  if (!t || typeof t !== "object" || t.hash !== comicHash(c)) return null;
  return comicTranslationOk(t.comic, c.pages.length) ? t : null;
}

/**
 * La versione disegnata in `locale`, se è completa (titolo, presentazione e almeno una tavola, come per pubblicare);
 * altrimenti null. Mai nella lingua dei testi del fumetto.
 */
export function comicEdition(c: WithText, locale: Locale): ComicEdition | null {
  if (locale === c.lang) return null;
  const e = c.editions?.[locale];
  if (!e || !e.pages.length) return null;
  const L = COMIC_LIMITS;
  return plainTextOk(e.title, L.titleMin, L.titleMax, false) && plainTextOk(e.summary, L.summaryMin, L.summaryMax, true) ? e : null;
}

/** Le lingue da tradurre (mancanti o rimaste indietro rispetto al testo): mai quelle con una versione disegnata. */
export function missingComicLocales(c: WithText, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l !== c.lang && comicEdition(c, l) === null && freshComicTranslation(c, l) === null);
}

/** Quello che la pagina mostra in una lingua: testi (e la loro lingua), tavole e copertina. */
export type ComicView = {
  text: ComicText;
  lang: Locale;
  /** testi tradotti in automatico (le tavole restano quelle dell'originale) */
  translated: boolean;
  /** la versione disegnata in quella lingua */
  edition: boolean;
  pages: readonly ComicPage[];
  cover_path: string | null;
};

/**
 * Il fumetto nella pagina in `locale`: la versione disegnata in quella lingua, se c'è (con la sua copertina o, senza,
 * quella del fumetto); altrimenti le tavole originali con i testi tradotti quando si può, o quelli originali.
 */
export function localizedComic(c: WithText, locale: Locale): ComicView {
  const cover = c.cover_path ?? null;
  const e = comicEdition(c, locale);
  if (e) return { text: { title: e.title, summary: e.summary, pages: e.pages.map((p) => p.text) }, lang: locale, translated: false, edition: true, pages: e.pages, cover_path: e.cover_path ?? cover };
  const t = freshComicTranslation(c, locale);
  if (t) return { text: t.comic, lang: locale, translated: true, edition: false, pages: c.pages, cover_path: cover };
  return { text: { title: c.title, summary: c.summary, pages: c.pages.map((p) => p.text) }, lang: c.lang, translated: false, edition: false, pages: c.pages, cover_path: cover };
}

/**
 * Dove si indicizza la pagina: nella lingua dei testi, in quelle con una versione disegnata e in quelle con la
 * traduzione aggiornata. Le altre versioni restano navigabili (le tavole si capiscono lo stesso) ma noindex e fuori da
 * hreflang e sitemap, come le guide non tradotte.
 */
export function comicIndexing(c: WithText & { status?: string }, all: readonly Locale[], locale: Locale): { languages: Locale[]; noindex: boolean } {
  if (c.status && c.status !== "published") return { languages: [], noindex: true };
  const languages = all.filter((l) => l === c.lang || comicEdition(c, l) !== null || freshComicTranslation(c, l) !== null);
  return { languages, noindex: !languages.includes(locale) };
}

// ——— Elenchi: la stessa regola della pagina, con le colonne leggere ———

/** La traduzione in `locale` è aggiornata, secondo gli elenchi (impronta della traduzione uguale a `text_hash`)? */
function listFresh(c: ComicListItem, locale: Locale): ComicListTranslation | null {
  if (locale === c.lang || !c.text_hash) return null;
  const t = c.tr[locale];
  return t && t.hash === c.text_hash && t.summary ? t : null;
}

/** La versione disegnata in `locale` secondo gli elenchi: completa come per `comicEdition` (la prima tavola basta a dirlo). */
function listEdition(c: ComicListItem, locale: Locale): ComicListEdition | null {
  if (locale === c.lang) return null;
  const e = c.ed?.[locale];
  const L = COMIC_LIMITS;
  if (!e?.title || !e.summary || !comicPathOk(e.page, c.owner)) return null;
  return plainTextOk(e.title, L.titleMin, L.titleMax, false) && plainTextOk(e.summary, L.summaryMin, L.summaryMax, true) ? e : null;
}

/** Le lingue in cui un fumetto si indicizza, viste dagli elenchi. */
export function comicListLocales(c: ComicListItem, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l === c.lang || listEdition(c, l) !== null || listFresh(c, l) !== null);
}

/**
 * La presentazione nella lingua della pagina: quella della versione disegnata, o la traduzione aggiornata; altrimenti
 * l'originale con la sua lingua.
 */
export function comicListSummary(c: ComicListItem, locale: Locale): { text: string; lang: Locale } {
  const e = listEdition(c, locale);
  if (e?.summary) return { text: e.summary, lang: locale };
  const t = listFresh(c, locale);
  return t?.summary ? { text: t.summary, lang: locale } : { text: c.summary, lang: c.lang };
}

/** Il titolo nella lingua della pagina (versione disegnata o traduzione aggiornata); altrimenti quello dell'autore con la sua lingua. */
export function comicListTitle(c: ComicListItem, locale: Locale): { text: string; lang: Locale } {
  const e = listEdition(c, locale);
  if (e?.title) return { text: e.title, lang: locale };
  const title = listFresh(c, locale)?.title;
  return title && plainTextOk(title, 1, COMIC_TRANSLATION_LIMITS.titleMax, false) ? { text: title, lang: locale } : { text: c.title, lang: c.lang };
}

/** La copertina nella lingua della pagina: quella della versione disegnata, se ne ha una; altrimenti quella del fumetto. */
export function comicListCover(c: ComicListItem, locale: Locale): string | null {
  const own = listEdition(c, locale)?.cover_path;
  if (comicPathOk(own, c.owner)) return own;
  return comicPathOk(c.cover_path, c.owner) ? c.cover_path : null;
}

/**
 * La data della versione in `locale` (sitemap): l'ultima modifica o, se più recente, l'arrivo della traduzione. Una
 * versione disegnata cambia con il fumetto: la sua data è l'ultima modifica.
 */
export function comicListDate(c: ComicListItem, locale: Locale): string {
  if (listEdition(c, locale)) return c.updated_at;
  const at = listFresh(c, locale)?.at;
  return at && at > c.updated_at ? at : c.updated_at;
}

/** La data della news: la prima pubblicazione (o, per una riga senza, la nascita). */
export function comicDate(c: { published_at: string | null; created_at: string }): string {
  return c.published_at ?? c.created_at;
}

export type SitemapComic = { slug: string; locales: Locale[]; dates: Partial<Record<Locale, string>>; image?: string };

/**
 * Le righe della sitemap (sezione news) dai fumetti pubblicati: le lingue in cui la pagina si indicizza, la data di ogni
 * versione e la copertina (nello Storage di Supabase: un altro dominio, quindi niente immagine, come le guide). `latest`
 * è la data dell'ultimo fumetto uscito (lastmod di /news e della home, che li mostrano in tutte le lingue).
 */
export function sitemapComics(rows: readonly ComicListItem[], all: readonly Locale[]): { comics: SitemapComic[]; latest?: string } {
  const published = rows.filter((r) => r.status === "published");
  const comics = published.map((r) => {
    const locales = comicListLocales(r, all);
    return { slug: r.slug, locales, dates: Object.fromEntries(locales.map((l) => [l, comicListDate(r, l)])) };
  });
  const latest = published.map((r) => comicDate(r)).sort().at(-1);
  return { comics, ...(latest ? { latest } : {}) };
}

// ——— Feed delle news: fumetti e news nello stesso elenco ———

/** Un fumetto come voce delle news (home, /news), già nella lingua della pagina. */
export type ComicFeedCard = {
  slug: string;
  /** percorso senza lingua */
  path: string;
  title: string;
  /** lingua del titolo quando non è quella della pagina (traduzione che manca) */
  titleLang?: Locale;
  summary: string;
  summaryLang?: Locale;
  /** data della news (ISO): la prima pubblicazione */
  date: string;
  /** copertina (indirizzo pubblico): quella della versione disegnata nella lingua della pagina, se ne ha una */
  image: string | null;
  author: { name: string; username: string | null };
};

/** Le voci dei fumetti per le news nella lingua `locale`. `name` dà il nome mostrato dell'autore. */
export function comicFeedCards(items: readonly ComicListItem[], locale: Locale, base: string, name: (p: ComicListItem["profile"]) => string): ComicFeedCard[] {
  return items
    .filter((c) => c.status === "published")
    .map((c) => {
      const summary = comicListSummary(c, locale);
      const title = comicListTitle(c, locale);
      const cover = comicListCover(c, locale);
      return {
        slug: c.slug,
        path: comicPath(c.slug),
        title: title.text,
        ...(title.lang !== locale ? { titleLang: title.lang } : {}),
        summary: summary.text,
        ...(summary.lang !== locale ? { summaryLang: summary.lang } : {}),
        date: comicDate(c),
        image: cover ? comicImageUrl(cover, base) : null,
        author: { name: name(c.profile), username: c.profile?.username ?? null },
      };
    });
}

/**
 * News del sito e fumetti in un solo elenco, dal più recente. Le news hanno solo il giorno ("2026-09-25"), i fumetti
 * l'ora: a pari giorno il fumetto viene prima (lessicograficamente "2026-09-25T…" > "2026-09-25").
 */
export function mergeFeed<N extends { date: string }>(news: readonly N[], comics: readonly ComicFeedCard[]): ({ kind: "news"; date: string; item: N } | { kind: "comic"; date: string; comic: ComicFeedCard })[] {
  const all = [
    ...news.map((item) => ({ kind: "news" as const, date: item.date, item })),
    ...comics.map((comic) => ({ kind: "comic" as const, date: comic.date, comic })),
  ];
  return all.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}
