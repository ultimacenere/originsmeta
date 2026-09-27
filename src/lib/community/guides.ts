import type { Locale } from "../i18n";
import type { DeckLink, StoredVideo } from "../videos";
import { countWords } from "./deckQuality";
import { textHash, type TranslationDoc } from "./deckTranslation";

/**
 * Guide della community pubblicate direttamente da chi ha un ruolo (pacchetto GUIDE, 27/09/2026; Pierluigi: "OK A
 * TUTTO, OTTIMO!!" alle proposte per i profili): Autore, Creator, Pro e Staff (`canPublishGuides` di badges.ts)
 * scrivono e pubblicano le loro guide senza passare dallo staff; gli altri continuano con "Mandaci la tua guida".
 *
 * Qui stanno le regole pure, uguali a quelle del database (supabase/wave2-GUIDE.sql, da accodare a schema.sql; il test
 * guides.test.ts le confronta): limiti del testo, categorie, copertine preimpostate, pulizia del testo semplice, lettura
 * del modulo, parole e soglia di indicizzazione, lingue in cui la guida si legge (originale più traduzioni aggiornate),
 * righe della sitemap, testo da tradurre. Nessun import a runtime che non sia puro (`deckQuality.ts` e
 * `deckTranslation.ts`, a loro volta puri): lo esegue `node --test`, lo carica il modulo nel browser.
 *
 * Testo degli utenti: sempre testo semplice, mai Markdown né HTML. Il sito lo mostra come testo, con i nomi delle carte
 * trasformati in link (`CardMentions`), come le guide dei mazzi.
 */

// ——— Limiti (uguali ai vincoli di supabase/wave2-GUIDE.sql) ———

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

/** Tetti del database (trigger guard_community_guide): lo staff e gli admin non li hanno. */
export const GUIDE_MAX_PER_OWNER = 100;
export const GUIDE_DAILY_NEW_LIMIT = 10;
export const GUIDE_DAILY_PUBLISH_LIMIT = 3;
/** Segnalazioni al giorno per utente (trigger guard_community_guide_report) e lunghezza del motivo. */
export const REPORT_DAILY_LIMIT = 20;
export const REPORT_REASON_MIN = 3;
export const REPORT_REASON_MAX = 500;

/** Le categorie delle guide del sito (GuideCategory di src/lib/content/guides.ts, etichette nei dizionari). */
export const GUIDE_CATEGORIES = ["game", "decks", "rank", "archetypes", "interviews", "events", "economy"] as const;
export type CommunityGuideCategory = (typeof GUIDE_CATEGORIES)[number];

/**
 * Copertine preimpostate: disegni del sito con la palette (gradienti e motivi SVG, `GuideCover`), mai materiale Koin
 * (le regole del media kit: niente illustrazioni come sfondo o copertina di interfaccia).
 */
export const GUIDE_COVER_PRESETS = ["mint", "sky", "gold", "crimson", "aurora", "night"] as const;
export type GuideCoverPreset = (typeof GUIDE_COVER_PRESETS)[number];

/**
 * Bucket dello Storage delle copertine caricate (`cover_path`): quello del pacchetto VETRINA, che nel ramo di questo
 * pacchetto non c'è ancora. Finché è null il modulo offre solo le copertine preimpostate e la pagina ignora `cover_path`
 * (l'integratore lo imposta al nome del bucket di VETRINA, con le sue policy per cartella dell'utente).
 */
export const GUIDE_COVER_BUCKET: string | null = null;

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
export type CommunityGuideTranslation = { hash: string; at: string; model?: string; guide: CommunityGuideText };
export type CommunityGuideTranslations = Partial<Record<Locale, CommunityGuideTranslation>>;

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
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null; badge?: string | null } | null;
};

export const isGuideCategory = (v: unknown): v is CommunityGuideCategory => typeof v === "string" && (GUIDE_CATEGORIES as readonly string[]).includes(v);
export const isCoverPreset = (v: unknown): v is GuideCoverPreset => typeof v === "string" && (GUIDE_COVER_PRESETS as readonly string[]).includes(v);
const isGuideLang = (v: unknown): v is Locale => typeof v === "string" && (GUIDE_LANGS as readonly string[]).includes(v);

// ——— Testo semplice ———

/**
 * Caratteri tolti: controllo C0 e C1 (tranne a capo e tabulazione, trattati a parte), trattino morbido, segni di
 * direzione del testo (ALM, LRM, RLM, LRE…RLO, LRI…PDI: con quelli un testo si legge al contrario) e invisibili (spazio
 * a larghezza zero, BOM). La stessa lista di `community_guide_text_ok` nel database, scritta con gli escape.
 */
const HIDDEN = /[\u{0}-\u{8}\u{b}-\u{1f}\u{7f}-\u{9f}\u{ad}\u{61c}\u{200b}\u{200e}\u{200f}\u{202a}-\u{202e}\u{2066}-\u{2069}\u{feff}]/gu;

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
 * caratteri tolti da `cleanPlain`, al massimo una riga vuota di fila, niente spazi o a capo in testa e in coda.
 */
export function plainTextOk(t: string, min: number, max: number, multiline: boolean): boolean {
  const n = codePoints(t);
  if (n < min || n > max) return false;
  if (n === 0) return true;
  if (!/\S/.test(t) || t !== t.replace(/^[ \n]+|[ \n]+$/g, "")) return false;
  if (!multiline && /\n/.test(t)) return false;
  if (/[\r\t\u{2028}\u{2029}\u{85}]/u.test(t) || new RegExp(HIDDEN.source, "u").test(t)) return false;
  return !t.replace(/ /g, "").includes("\n\n\n");
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
  | { code: "title" | "summary" | "sections" | "category" | "lang" | "cover" | "cards"; index?: undefined }
  | { code: "heading" | "body"; index: number };

/** I campi del modulo per ogni errore, così il modulo mette il fuoco sul campo giusto (`index` = sezione, da 0). */
export function guideErrorField(error: GuideFormError): string {
  if (error.code === "heading" || error.code === "body") return sectionFields(error.index)[error.code];
  if (error.code === "sections") return sectionFields(0).heading;
  if (error.code === "cover") return "cover_preset";
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

/**
 * Errore del database → codice del modulo: i tetti e le regole del trigger `guard_community_guide` (supabase/wave2-GUIDE.sql,
 * `raise exception '<codice>'`), le policy (42501: ruolo mancante o riga altrui) e la tabella che non c'è ancora.
 */
export function guideErrorCode(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "db";
  const m = error.message ?? "";
  for (const code of ["guide_daily_limit", "guide_limit", "guide_rate", "guide_hidden", "guide_status", "report_rate"]) if (m.includes(code)) return code;
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

// ——— Parole, lettura, indicizzazione ———

type WithText = { summary: string; sections: readonly GuideSectionText[] };

/** Parole della guida originale: riassunto più titoli e testi delle sezioni (il titolo della guida no). */
export function communityGuideWords(g: WithText): number {
  return g.sections.reduce((n, s) => n + countWords(s.heading) + countWords(s.body), countWords(g.summary));
}

/** Minuti di lettura, a 200 parole al minuto, almeno uno. */
export function readMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

type WithLang = WithText & { lang: Locale; translations?: CommunityGuideTranslations | null };

/** Impronta del testo originale (lingua compresa, titolo escluso: non si traduce). */
export function communityGuideHash(g: Pick<WithLang, "lang" | "summary" | "sections">): string {
  return textHash([g.lang, g.summary, ...g.sections.flatMap((s) => [s.heading, s.body])]);
}

/** La traduzione in `locale`, solo se è stata fatta sul testo attuale (stessa impronta e stesse sezioni). */
export function freshGuideTranslation(g: WithLang, locale: Locale): CommunityGuideTranslation | null {
  if (locale === g.lang) return null;
  const t = g.translations?.[locale];
  if (!t || t.hash !== communityGuideHash(g) || typeof t.guide?.summary !== "string" || !Array.isArray(t.guide.sections)) return null;
  if (t.guide.sections.length !== g.sections.length) return null;
  return t.guide.sections.every((s) => typeof s?.heading === "string" && typeof s?.body === "string") ? t : null;
}

/** Le lingue in cui la guida si legge davvero, nell'ordine di `all`: l'originale più le traduzioni aggiornate. */
export function communityGuideLocales(g: WithLang, all: readonly Locale[]): Locale[] {
  return all.filter((l) => l === g.lang || freshGuideTranslation(g, l) !== null);
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

/** La guida ha abbastanza testo per stare in Google (e deve essere pubblicata)? */
export function communityGuideIndexable(g: WithText & { status?: string }): boolean {
  return (g.status === undefined || g.status === "published") && communityGuideWords(g) >= COMMUNITY_GUIDE_MIN_WORDS;
}

/**
 * Robots e hreflang della pagina di una guida in una lingua, come `deckIndexing` dei mazzi: `languages` sono le versioni
 * da dichiarare (originale e traduzioni aggiornate, solo sopra soglia), `noindex` se questa versione non si indicizza,
 * `hreflang` false se la guida non si indicizza in nessuna lingua (allora resta la sola canonical, `dropHreflang`).
 */
export function communityGuideIndexing(g: WithLang & { status?: string }, all: readonly Locale[], locale: Locale): { languages: Locale[]; noindex: boolean; hreflang: boolean } {
  const languages = communityGuideIndexable(g) ? communityGuideLocales(g, all) : [];
  return { languages, noindex: !languages.includes(locale), hreflang: languages.length > 0 };
}

/** Una riga della sitemap: le lingue in cui la pagina si indicizza (mai vuote: vuol dire "tutte"). */
export type SitemapCommunityGuide = { slug: string; updated_at: string; locales: Locale[] };

/**
 * Le righe della sitemap dalle guide pubblicate: solo quelle sopra soglia, con le loro lingue; `latest` è la data
 * dell'ultima guida pubblicata o modificata, di qualunque lunghezza (il lastmod di /guides, che le elenca).
 */
export function sitemapCommunityGuides<R extends WithLang & { slug: string; updated_at: string; status?: string }>(
  rows: readonly R[],
  all: readonly Locale[],
): { guides: SitemapCommunityGuide[]; latest?: string } {
  const guides = rows
    .filter((r) => r.status === undefined || r.status === "published")
    .map((r) => ({ slug: r.slug, updated_at: r.updated_at, locales: communityGuideIndexable(r) ? communityGuideLocales(r, all) : [] }))
    .filter((r) => r.locales.length > 0);
  const latest = rows.reduce<string | undefined>((max, r) => (!max || r.updated_at > max ? r.updated_at : max), undefined);
  return latest ? { guides, latest } : { guides };
}

// ——— Traduzione: il testo in campi piatti ———

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

/** Nome del file di una copertina caricata: solo nella cartella del proprietario e con un'estensione d'immagine. */
export function coverPathOk(path: string | null | undefined, owner: string): boolean {
  if (!path) return false;
  return path.length <= 200 && path.split("/")[0] === owner && /^[0-9a-f-]{36}\/([A-Za-z0-9_-]{1,60}\/)?[A-Za-z0-9_-]{1,80}\.(png|jpg|jpeg|webp)$/.test(path);
}
