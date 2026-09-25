import type { NewsItem } from "./data/news";

/*
  Link fra articoli (Ondata 1 del piano SEO/GEO, 25/09/2026, rilievi NEWS-07 e NEWS-03). Prima ogni news finiva con
  "Altre news", cioè sempre le ultime tre uscite: il valore dei link interni si concentrava su quelle e 22 articoli
  su 26 ricevevano link solo da /news e dalla pagina autore. Ora:
  - `relatedNews`: le news correlate a un articolo, con un punteggio deterministico sui dati che ci sono già
    (link espliciti fra i due testi, guide e carte in comune, stesso tipo di news, vicinanza di data), completate
    con le più recenti;
  - `newsForGuide`: le news che citano una guida nel campo `guides`, per il blocco "News su questo argomento".
  Funzioni pure (test in relatedNews.test.ts): le pagine restano statiche, il calcolo si fa alla build.
*/

/**
 * Quello che serve di una news per collegarla alle altre. Scritto a mano e non con `Pick<NewsItem, …>`: i campi
 * accettano sia `string[]` sia gli slug tipizzati delle guide (`GuideSlug[]`), e i test possono usare guide finte.
 */
export type NewsLinkFields = {
  slug: string;
  date: string;
  source: NewsItem["source"];
  cards?: readonly string[];
  guides?: readonly string[];
  /** testo in Markdown per lingua: i link `/<lingua>/news/<slug>` che contiene sono il legame più sicuro fra due news */
  body?: { readonly [locale: string]: string | undefined };
};

/** Quante news correlate in fondo a un articolo e quante news in fondo a una guida. */
export const RELATED_NEWS_MAX = 3;
export const GUIDE_NEWS_MAX = 5;

/**
 * Pesi del punteggio. Un link esplicito fra i due testi (in una direzione o nell'altra) vale quanto una guida in
 * comune: è l'autore che dice che gli articoli parlano della stessa cosa (le regole della Crimson Cup e il suo
 * annuncio). Una guida in comune vale più di una carta (la guida è l'argomento, la carta un dettaglio) e le carte in
 * comune contano fino a tre, così due mazzi con dieci carte uguali non schiacciano tutto il resto. Stesso tipo:
 * entrambe patch notes, entrambe mazzi pubblicati qui, entrambe novità del sito. La stessa fonte (Steam, stampa) è un
 * segnale generico: pesa meno della vicinanza di data, che aggiunge fino a mezzo punto e si azzera a 30 giorni, così
 * anche una sola carta in comune batte "stessa fonte, stessa settimana".
 */
export const RELATED_WEIGHTS = { link: 3, guide: 3, card: 1, maxCards: 3, sameKind: 2, sameSource: 0.25, near: 0.5, nearDays: 30 } as const;

const DAY_MS = 86_400_000;

type Kind = "patch" | "deck" | "site" | "other";

function kindOf(item: NewsLinkFields, patchNews: ReadonlySet<string>): Kind {
  if (patchNews.has(item.slug)) return "patch";
  if (item.source === "community" || item.source === "staff") return "deck";
  if (item.source === "site") return "site";
  return "other";
}

function shared(a: readonly string[] | undefined, b: readonly string[] | undefined): number {
  if (!a?.length || !b?.length) return 0;
  const other = new Set(b);
  return new Set(a.filter((s) => other.has(s))).size;
}

/* link Markdown verso un articolo, con il prefisso della lingua (regola dei link interni): `](/it/news/<slug>` */
const NEWS_LINK = /\]\(\/(?:[a-z]{2}\/)?news\/([a-z0-9-]+)/g;
const linkCache = new WeakMap<NewsLinkFields, ReadonlySet<string>>();

/** Gli slug delle news linkate dal testo di `item`, in qualunque lingua. */
export function linkedNews(item: NewsLinkFields): ReadonlySet<string> {
  let out = linkCache.get(item);
  if (!out) {
    const found = new Set<string>();
    for (const text of Object.values(item.body ?? {})) {
      if (!text) continue;
      for (const m of text.matchAll(NEWS_LINK)) if (m[1] !== item.slug) found.add(m[1]);
    }
    out = found;
    linkCache.set(item, out);
  }
  return out;
}

/**
 * Quanto due news parlano della stessa cosa, senza la data: 0 vuol dire nessun legame.
 * `patchNews` sono gli slug delle news che raccontano una patch (campo `news` delle patch in cards.ts).
 */
export function topicScore(a: NewsLinkFields, b: NewsLinkFields, patchNews: ReadonlySet<string> = new Set()): number {
  const w = RELATED_WEIGHTS;
  let score = shared(a.guides, b.guides) * w.guide + Math.min(shared(a.cards, b.cards), w.maxCards) * w.card;
  if (linkedNews(a).has(b.slug) || linkedNews(b).has(a.slug)) score += w.link;
  const ka = kindOf(a, patchNews);
  const kb = kindOf(b, patchNews);
  if (ka !== "other" && ka === kb) score += w.sameKind;
  else if (a.source === b.source) score += w.sameSource;
  return score;
}

/** Vicinanza di data fra 0 e 1: 1 lo stesso giorno, 0 da 30 giorni in su (nel punteggio pesa `RELATED_WEIGHTS.near`). */
export function dateCloseness(a: string, b: string): number {
  const days = Math.abs(Date.parse(a) - Date.parse(b)) / DAY_MS;
  if (!Number.isFinite(days)) return 0;
  return Math.max(0, 1 - days / RELATED_WEIGHTS.nearDays);
}

/** Dalla più recente; a parità di data l'ordine dello slug, così il risultato non dipende dall'ordine dei dati. */
function byDate(a: NewsLinkFields, b: NewsLinkFields): number {
  return b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
}

/**
 * Le news correlate a `item`: prima quelle con un legame (punteggio più vicinanza di data), poi, se non bastano,
 * le più recenti. Mai la news stessa, mai due volte la stessa.
 */
export function relatedNews<T extends NewsLinkFields>(item: NewsLinkFields, pool: readonly T[], opts: { patchNews?: ReadonlySet<string>; max?: number } = {}): T[] {
  const max = opts.max ?? RELATED_NEWS_MAX;
  const patchNews = opts.patchNews ?? new Set<string>();
  const others = pool.filter((other) => other.slug !== item.slug);
  const scored = others
    .map((other) => ({ other, topic: topicScore(item, other, patchNews) }))
    .filter((x) => x.topic > 0)
    .map((x) => ({ ...x, total: x.topic + dateCloseness(item.date, x.other.date) * RELATED_WEIGHTS.near }))
    .sort((a, b) => b.total - a.total || byDate(a.other, b.other));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const { other } of scored) {
    if (out.length >= max) break;
    if (seen.has(other.slug)) continue;
    seen.add(other.slug);
    out.push(other);
  }
  for (const other of [...others].sort(byDate)) {
    if (out.length >= max) break;
    if (seen.has(other.slug)) continue;
    seen.add(other.slug);
    out.push(other);
  }
  return out;
}

/** Le news che citano la guida `guideSlug` nel campo `guides`, dalla più recente, al massimo `max` (5). */
export function newsForGuide<T extends NewsLinkFields>(guideSlug: string, pool: readonly T[], max = GUIDE_NEWS_MAX): T[] {
  return pool
    .filter((item) => item.guides?.includes(guideSlug))
    .sort(byDate)
    .slice(0, max);
}
