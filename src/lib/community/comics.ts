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
 * traduce presentazione e testi delle tavole nelle altre due lingue (il titolo no).
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
export const COMIC_LANGS = ["en", "it", "es"] as const;

export type ComicStatus = "draft" | "published" | "hidden";
export type ComicPage = { path: string; width: number; height: number; text: string };
/** Il testo che si traduce: titolo, presentazione e un testo per tavola (vuoto dove la tavola non ha testo). */
export type ComicText = { title: string; summary: string; pages: string[] };
export type ComicTranslation = { hash: string; at: string; model?: string; comic: ComicText };
export type ComicTranslations = Partial<Record<Locale, ComicTranslation>>;
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
  text_hash: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  profile?: ComicAuthor | null;
};

/** Di ogni traduzione, negli elenchi, solo impronta, data, titolo e presentazione. */
export type ComicListTranslation = { hash: string | null; at: string | null; summary: string | null; title?: string | null };

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

// ——— Modulo ———

export type ComicIntent = "draft" | "publish";
export type ComicFormValue = { lang: Locale; title: string; summary: string; pages: ComicPage[]; cover_path: string | null };
export type ComicFormError =
  | { code: "lang" | "title" | "summary" | "pages" | "cover"; index?: undefined }
  | { code: "page"; index: number };

type FormReader = { get: (name: string) => unknown };

/** Il campo del modulo da mettere a fuoco per un errore (i testi delle tavole hanno id `cm-page-<n>`). */
export function comicErrorField(error: ComicFormError): string {
  if (error.code === "page") return `page-${error.index}`;
  return error.code;
}

/** Lunghezza massima della lista delle tavole nel modulo (JSON): 10 tavole piene stanno ben sotto. */
const PAGES_JSON_MAX = 60_000;

/**
 * Legge e controlla i campi del modulo di un fumetto (FormData), con le regole del database per lo stato che si chiede:
 * una bozza si salva anche a metà (titolo da 1 carattere, niente presentazione, tavole e copertina); un fumetto da
 * pubblicare ha titolo, presentazione, almeno una tavola e la copertina. `owner` è il proprietario: tavole e copertina
 * devono stare nella SUA cartella. `pages` arriva come JSON ([{path, width, height, text}]) dal modulo.
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

  const rawPages = fd.get("pages");
  let list: unknown = [];
  if (typeof rawPages === "string" && rawPages.trim()) {
    if (rawPages.length > PAGES_JSON_MAX) return { ok: false, error: { code: "pages" } };
    try {
      list = JSON.parse(rawPages);
    } catch {
      return { ok: false, error: { code: "pages" } };
    }
  }
  if (!Array.isArray(list) || list.length > L.pagesMax || (publish && list.length < 1)) return { ok: false, error: { code: "pages" } };
  const pages: ComicPage[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const x = list[i] as Record<string, unknown> | null;
    if (!x || typeof x !== "object" || !comicPathOk(x.path, owner) || !pageSizeOk(x.width, x.height) || seen.has(x.path)) return { ok: false, error: { code: "page", index: i } };
    const text = cleanPlain(x.text ?? "", L.pageTextMax, true);
    if (!plainTextOk(text, 0, L.pageTextMax, true)) return { ok: false, error: { code: "page", index: i } };
    seen.add(x.path);
    pages.push({ path: x.path, width: x.width as number, height: x.height as number, text });
  }

  const coverRaw = String(fd.get("cover_path") ?? "").trim();
  if (coverRaw && !comicPathOk(coverRaw, owner)) return { ok: false, error: { code: "cover" } };
  if (publish && !coverRaw) return { ok: false, error: { code: "cover" } };
  return { ok: true, value: { lang, title, summary, pages, cover_path: coverRaw || null } };
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

type WithText = { lang: Locale; title: string; summary: string; pages: readonly ComicPage[]; translations?: ComicTranslations | null };

/** La traduzione in `locale`, solo se è stata fatta sul testo attuale e rispetta le regole. */
export function freshComicTranslation(c: WithText, locale: Locale): ComicTranslation | null {
  if (locale === c.lang) return null;
  const t = c.translations?.[locale];
  if (!t || typeof t !== "object" || t.hash !== comicHash(c)) return null;
  return comicTranslationOk(t.comic, c.pages.length) ? t : null;
}

/** Le lingue da tradurre (mancanti o rimaste indietro rispetto al testo). */
export function missingComicLocales(c: WithText, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l !== c.lang && freshComicTranslation(c, l) === null);
}

/** Il testo da mostrare nella pagina in `locale`: tradotto quando si può, altrimenti l'originale. */
export function localizedComic(c: WithText, locale: Locale): { text: ComicText; lang: Locale; translated: boolean } {
  const t = freshComicTranslation(c, locale);
  if (t) return { text: t.comic, lang: locale, translated: true };
  return { text: { title: c.title, summary: c.summary, pages: c.pages.map((p) => p.text) }, lang: c.lang, translated: false };
}

/**
 * Dove si indicizza la pagina: nella lingua dei testi e in quelle con la traduzione aggiornata. Le altre versioni restano
 * navigabili (le tavole si capiscono lo stesso) ma noindex e fuori da hreflang e sitemap, come le guide non tradotte.
 */
export function comicIndexing(c: WithText & { status?: string }, all: readonly Locale[], locale: Locale): { languages: Locale[]; noindex: boolean } {
  if (c.status && c.status !== "published") return { languages: [], noindex: true };
  const languages = all.filter((l) => l === c.lang || freshComicTranslation(c, l) !== null);
  return { languages, noindex: !languages.includes(locale) };
}

// ——— Elenchi: la stessa regola della pagina, con le colonne leggere ———

/** La traduzione in `locale` è aggiornata, secondo gli elenchi (impronta della traduzione uguale a `text_hash`)? */
function listFresh(c: ComicListItem, locale: Locale): ComicListTranslation | null {
  if (locale === c.lang || !c.text_hash) return null;
  const t = c.tr[locale];
  return t && t.hash === c.text_hash && t.summary ? t : null;
}

/** Le lingue in cui un fumetto si indicizza, viste dagli elenchi. */
export function comicListLocales(c: ComicListItem, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l === c.lang || listFresh(c, l) !== null);
}

/** La presentazione nella lingua della pagina, se la traduzione è aggiornata; altrimenti l'originale con la sua lingua. */
export function comicListSummary(c: ComicListItem, locale: Locale): { text: string; lang: Locale } {
  const t = listFresh(c, locale);
  return t?.summary ? { text: t.summary, lang: locale } : { text: c.summary, lang: c.lang };
}

/** Il titolo nella lingua della pagina, se la traduzione è aggiornata; altrimenti quello dell'autore con la sua lingua. */
export function comicListTitle(c: ComicListItem, locale: Locale): { text: string; lang: Locale } {
  const title = listFresh(c, locale)?.title;
  return title && plainTextOk(title, 1, COMIC_TRANSLATION_LIMITS.titleMax, false) ? { text: title, lang: locale } : { text: c.title, lang: c.lang };
}

/** La data della versione in `locale` (sitemap): l'ultima modifica o, se più recente, l'arrivo della traduzione. */
export function comicListDate(c: ComicListItem, locale: Locale): string {
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
  /** copertina (indirizzo pubblico) */
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
      return {
        slug: c.slug,
        path: comicPath(c.slug),
        title: title.text,
        ...(title.lang !== locale ? { titleLang: title.lang } : {}),
        summary: summary.text,
        ...(summary.lang !== locale ? { summaryLang: summary.lang } : {}),
        date: comicDate(c),
        image: comicPathOk(c.cover_path, c.owner) ? comicImageUrl(c.cover_path, base) : null,
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
