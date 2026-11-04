import type { Locale } from "@/lib/i18n";
import { type Counts, daysBetween, shiftDay, windowStarts } from "./deckStats";

/**
 * Statistiche dei fumetti per chi li disegna (02/11/2026; Pierluigi: "aggiungi le statistiche di visita dei fumetti nel
 * pannello di Vega, come per i mazzi"). Funzioni pure, senza import a runtime oltre a deckStats.ts (anch'esso puro): le
 * esegue `node --test` (comicStats.test.ts) e le usano sia il browser (ComicStatsBeacon) sia il server (ComicStatsPanel).
 *
 * Come si conta (tabella `comic_stats_daily` e funzione `bump_comic_stat`, blocco STATISTICHE DEI FUMETTI di
 * supabase/schema.sql):
 * - per ogni fumetto pubblicato, ogni giorno UTC e ogni lingua della pagina, due contatori: visite e letture complete
 *   (l'ultima tavola arrivata sullo schermo); solo totali, nessun dato personale. La lingua sta nella chiave perché un
 *   fumetto ha versioni disegnate in più lingue: dice quale versione si legge;
 * - nel browser una volta per scheda, per fumetto, lingua e tipo (la stessa memoria di sessione dei mazzi), la visita dopo
 *   `VIEW_DELAY_MS` di pagina visibile come i mazzi; niente bot, niente browser dello staff, niente autore sul proprio
 *   fumetto con l'accesso fatto (lo esclude la funzione SQL con la sessione). Sono stime, e il pannello lo dice.
 * Tetto di 2.000 per contatore, fumetto, lingua e giorno (`COMIC_STAT_CAP`, uguale a bump_deck_stat).
 */

/* ---------- tipi di contatore ---------- */

export const COMIC_STAT_KINDS = ["view", "read"] as const;
export type ComicStatKind = (typeof COMIC_STAT_KINDS)[number];

export const isComicStatKind = (v: unknown): v is ComicStatKind => typeof v === "string" && (COMIC_STAT_KINDS as readonly string[]).includes(v);

/** Colonna di `comic_stats_daily` per ogni tipo (lo stesso abbinamento di `bump_comic_stat`). */
export const COMIC_STAT_COLUMN = { view: "views", read: "reads" } as const satisfies Record<ComicStatKind, string>;

/** Tetto per contatore, fumetto, lingua e giorno (`cap` di bump_comic_stat). */
export const COMIC_STAT_CAP = 2000;

/**
 * Le lingue ammesse dalla chiave della tabella: le stesse di `COMIC_LANGS` (comics.ts) e del vincolo SQL. Copiate qui
 * perché il beacon del browser non debba caricare comics.ts; il test controlla che coincidano.
 */
export const COMIC_STAT_LANGS = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const satisfies readonly Locale[];
const LANG_SET = new Set<string>(COMIC_STAT_LANGS);
export const isComicStatLang = (v: unknown): v is Locale => typeof v === "string" && LANG_SET.has(v);

/** Riga di `comic_stats_daily`. */
export type ComicStatRow = { comic_id: string; day: string; lang: Locale; views: number; reads: number };

/** Voce della memoria di sessione (`SEEN_KEY` dei mazzi) per un fumetto, una lingua e un tipo: separata dai mazzi. */
export const comicSeenKey = (slug: string, lang: Locale, kind: ComicStatKind): string => `comic:${slug}:${lang}|${kind}`;

/** Attributo dell'ultima tavola nella striscia (ComicStrip): quando entra nello schermo la lettura è completa. */
export const COMIC_LAST_PAGE_ATTR = "data-om-comic-last";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Riga letta dal database resa sicura: numeri interi non negativi, giorno e lingua validi; null se non è una riga buona. */
export function normalizeComicStatRow(raw: unknown): ComicStatRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.comic_id !== "string" || typeof r.day !== "string" || !DAY_RE.test(r.day) || !isComicStatLang(r.lang)) return null;
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? Math.floor(x) : 0;
  };
  return { comic_id: r.comic_id, day: r.day, lang: r.lang, views: n(r.views), reads: n(r.reads) };
}

/* ---------- riepiloghi ---------- */

/** Visite e letture di una lingua della pagina, su 7 e 30 giorni e in totale. */
export type LangCounts = { lang: Locale; views: Counts; reads: Counts };

export type ComicStatSummary = {
  views: Counts;
  reads: Counts;
  /** per lingua della pagina, dalla più letta (solo le lingue con almeno un contatore) */
  langs: LangCounts[];
  /** ultimi `days` giorni, dal più vecchio a oggi */
  series: { views: number[]; reads: number[] };
  /** primo giorno con un contatore (null se non c'è ancora nulla) */
  firstDay: string | null;
};

/** Numero di giorni della serie per i grafici (come i mazzi). */
export const COMIC_SERIES_DAYS = 30;

const zero = (): Counts => ({ d7: 0, d30: 0, total: 0 });

export function emptyComicSummary(days: number = COMIC_SERIES_DAYS): ComicStatSummary {
  return { views: zero(), reads: zero(), langs: [], series: { views: new Array(days).fill(0), reads: new Array(days).fill(0) }, firstDay: null };
}

function add(c: Counts, day: string, n: number, starts: { d7: string; d30: string }) {
  if (!n) return;
  c.total += n;
  if (day >= starts.d30) c.d30 += n;
  if (day >= starts.d7) c.d7 += n;
}

/** Le lingue dalla più vista (visite totali, poi letture, poi l'ordine di COMIC_STAT_LANGS per un ordine stabile). */
export function sortLangs(langs: readonly LangCounts[]): LangCounts[] {
  const order = (l: Locale) => COMIC_STAT_LANGS.indexOf(l);
  return [...langs].sort((a, b) => b.views.total - a.views.total || b.reads.total - a.reads.total || order(a.lang) - order(b.lang));
}

/**
 * Riepilogo per fumetto: per ogni id di `comicIds` (anche senza righe: tutto a zero) visite e letture su 7 e 30 giorni e
 * in totale, le stesse per lingua della pagina, la serie giornaliera degli ultimi `days` giorni e il primo giorno con dati.
 * Righe di fumetti fuori da `comicIds` si ignorano (lo staff legge anche quelle degli altri).
 */
export function summarizeComics(comicIds: readonly string[], rows: readonly ComicStatRow[], today: string, days: number = COMIC_SERIES_DAYS): Map<string, ComicStatSummary> {
  const out = new Map<string, ComicStatSummary>(comicIds.map((id) => [id, emptyComicSummary(days)]));
  const byLang = new Map<string, Map<Locale, LangCounts>>();
  const starts = windowStarts(today);
  const seriesStart = shiftDay(today, -(days - 1));
  for (const r of rows) {
    const s = out.get(r.comic_id);
    if (!s) continue;
    add(s.views, r.day, r.views, starts);
    add(s.reads, r.day, r.reads, starts);
    if (r.views || r.reads) {
      if (!s.firstDay || r.day < s.firstDay) s.firstDay = r.day;
      let langs = byLang.get(r.comic_id);
      if (!langs) byLang.set(r.comic_id, (langs = new Map()));
      let lc = langs.get(r.lang);
      if (!lc) langs.set(r.lang, (lc = { lang: r.lang, views: zero(), reads: zero() }));
      add(lc.views, r.day, r.views, starts);
      add(lc.reads, r.day, r.reads, starts);
    }
    const i = daysBetween(seriesStart, r.day);
    if (i >= 0 && i < days) {
      s.series.views[i] += r.views;
      s.series.reads[i] += r.reads;
    }
  }
  for (const [id, langs] of byLang) {
    const s = out.get(id);
    if (s) s.langs = sortLangs([...langs.values()]);
  }
  return out;
}

/** La somma di più riepiloghi (tutti i fumetti di un autore): serie sommate giorno per giorno, lingue sommate. */
export function combineComicSummaries(list: readonly ComicStatSummary[], days: number = COMIC_SERIES_DAYS): ComicStatSummary {
  const out = emptyComicSummary(days);
  const langs = new Map<Locale, LangCounts>();
  const addCounts = (to: Counts, from: Counts) => {
    to.d7 += from.d7;
    to.d30 += from.d30;
    to.total += from.total;
  };
  for (const s of list) {
    addCounts(out.views, s.views);
    addCounts(out.reads, s.reads);
    for (const lc of s.langs) {
      let x = langs.get(lc.lang);
      if (!x) langs.set(lc.lang, (x = { lang: lc.lang, views: zero(), reads: zero() }));
      addCounts(x.views, lc.views);
      addCounts(x.reads, lc.reads);
    }
    for (let i = 0; i < days; i++) {
      out.series.views[i] += s.series.views[i] ?? 0;
      out.series.reads[i] += s.series.reads[i] ?? 0;
    }
    if (s.firstDay && (!out.firstDay || s.firstDay < out.firstDay)) out.firstDay = s.firstDay;
  }
  out.langs = sortLangs([...langs.values()]);
  return out;
}

/**
 * Quota di visite arrivate all'ultima tavola, in percento intero (0–100); null senza visite. Le letture contate
 * senza visita (scheda chiusa prima dei 5 secondi ma dopo aver scorso tutto: fumetti di una tavola) non superano il 100.
 */
export function readRate(reads: number, views: number): number | null {
  if (!views || views < 0) return null;
  return Math.min(100, Math.round((Math.max(0, reads) / views) * 100));
}

/* ---------- classifica dello staff ---------- */

export type RankedComic = { comic_id: string; views30: number; views7: number; reads30: number };

/**
 * Fumetti ordinati per visite negli ultimi 30 giorni (poi visite in 7 giorni, letture, id per un ordine stabile), solo
 * quelli con almeno un contatore nella finestra; al massimo `limit`.
 */
export function rankComics(rows: readonly ComicStatRow[], today: string, limit = 20): RankedComic[] {
  const starts = windowStarts(today);
  const by = new Map<string, RankedComic>();
  for (const r of rows) {
    if (r.day < starts.d30) continue;
    const x = by.get(r.comic_id) ?? { comic_id: r.comic_id, views30: 0, views7: 0, reads30: 0 };
    x.views30 += r.views;
    if (r.day >= starts.d7) x.views7 += r.views;
    x.reads30 += r.reads;
    by.set(r.comic_id, x);
  }
  return [...by.values()]
    .filter((x) => x.views30 || x.reads30)
    .sort((a, b) => b.views30 - a.views30 || b.views7 - a.views7 || b.reads30 - a.reads30 || a.comic_id.localeCompare(b.comic_id))
    .slice(0, Math.max(0, limit));
}
