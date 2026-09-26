/**
 * Statistiche dei mazzi per gli autori (pacchetto STATS, 26/09/2026: Pierluigi, funzioni per i creator; il primo
 * influencer iscritto è coachcrono). Funzioni pure, senza import a runtime: `node --test` le esegue senza il resto
 * del sito (test in deckStats.test.ts), e le usano sia il browser (DeckStatsBeacon) sia il server (DeckStatsPanel).
 *
 * Come si conta (tabella `deck_stats_daily` e funzione `bump_deck_stat` in supabase/creator-STATS.sql):
 * - per ogni mazzo pubblicato e ogni giorno UTC, quattro contatori: visite, copie del codice del gioco, clic sui link
 *   esterni (risorse, canali, link del video) e video avviati; solo totali, nessun dato personale;
 * - nel browser una volta per sessione, per mazzo e per tipo (sessionStorage), la visita dopo qualche secondo di pagina
 *   visibile; niente bot (user agent, `navigator.webdriver`), niente browser dello staff (flag di analytics.ts), niente
 *   autore sul proprio mazzo (lo esclude la funzione SQL con la sessione). Sono stime, e le pagine lo dicono.
 * - i voti non si contano qui: arrivano da `deck_votes`, che c'era già (conteggio per data del voto, media delle stelle).
 */

/* ---------- tipi di contatore ---------- */

export const DECK_STAT_KINDS = ["view", "code", "link", "video"] as const;
export type DeckStatKind = (typeof DECK_STAT_KINDS)[number];

export const isDeckStatKind = (v: unknown): v is DeckStatKind => typeof v === "string" && (DECK_STAT_KINDS as readonly string[]).includes(v);

/** Colonna di `deck_stats_daily` per ogni tipo (lo stesso abbinamento di `bump_deck_stat`). */
export const STAT_COLUMN = { view: "views", code: "code_copies", link: "link_clicks", video: "video_plays" } as const satisfies Record<DeckStatKind, string>;

/** Riga di `deck_stats_daily`. */
export type DeckStatRow = { deck_id: string; day: string; views: number; code_copies: number; link_clicks: number; video_plays: number };

/** Voto di `deck_votes` visto dalle statistiche: niente `user_id`, non serve. */
export type DeckVoteStat = { deck_id: string; stars: number; created_at: string };

/* ---------- browser: quando contare ---------- */

/** Secondi di pagina visibile prima di contare una visita (non si contano le schede aperte e chiuse di corsa). */
export const VIEW_DELAY_MS = 5000;
/** Chiave di sessionStorage con i contatori già mandati in questa sessione ("slug|tipo"): non esce mai dal browser. */
export const SEEN_KEY = "originsmeta.deckstats.v1";
/** Quante voci tiene la chiave: le più vecchie escono (una sessione che apre centinaia di mazzi è già un'eccezione). */
export const SEEN_MAX = 300;

/**
 * Un robot, non una persona: user agent vuoto o da crawler, browser senza testa, strumenti di misura e di anteprima,
 * browser pilotati (`navigator.webdriver`). Conta chi esegue JavaScript (Googlebot, Bingbot, Lighthouse…): gli altri
 * non arrivano mai al contatore. "CUBOT" è una marca di telefoni e non va scambiata per un bot.
 */
const BOT_UA =
  /bot\b|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|google-inspectiontool|googleother|mediapartners-google|apis-google|feedfetcher|facebookexternalhit|chatgpt-user|phantomjs|puppeteer|playwright|selenium|prerender/i;

export function isLikelyBot(userAgent: string | null | undefined, webdriver = false): boolean {
  if (webdriver) return true;
  const ua = (userAgent ?? "").trim();
  if (!ua) return true;
  return BOT_UA.test(ua.replace(/cubot/gi, ""));
}

/** Voce della chiave di sessione per un mazzo e un tipo. */
export const seenKey = (slug: string, kind: DeckStatKind): string => `${slug}|${kind}`;

/** Le voci salvate nella sessione; [] se la chiave manca o è rovinata. */
export function parseSeen(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(-SEEN_MAX) : [];
  } catch {
    return [];
  }
}

/** L'elenco con la voce in più, oppure null se la voce c'era già (quel contatore è già stato mandato). */
export function addSeen(list: readonly string[], key: string, max: number = SEEN_MAX): string[] | null {
  if (list.includes(key)) return null;
  const next = [...list, key];
  return next.length > max ? next.slice(next.length - max) : next;
}

/**
 * Evento del catalogo di analytics.ts che vale anche come contatore del mazzo: la copia RIUSCITA del codice del gioco
 * dalla scheda (`game_code_copy` con placement `deck_page`, mandato da CopyButton). Così la copia si misura in un punto
 * solo e GA4/Vercel restano come prima.
 */
export function statKindForEvent(name: string, params: Record<string, unknown>): DeckStatKind | null {
  if (name === "game_code_copy" && params.placement === "deck_page") return "code";
  return null;
}

/** Host senza "www." e "m.", in minuscolo. */
function bareHost(url: URL): string {
  return url.hostname.toLowerCase().replace(/^(?:www\.|m\.)/, "");
}

/** Il link porta a un video (YouTube o Twitch), non a un canale o a una pagina qualsiasi. */
export function isVideoUrl(url: URL): boolean {
  const host = bareHost(url);
  const path = url.pathname;
  if (host === "youtu.be") return path.length > 1;
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    return (path === "/watch" && url.searchParams.has("v")) || /^\/(?:shorts|live|embed)\/[^/]+/.test(path);
  }
  if (host === "clips.twitch.tv" || host === "player.twitch.tv") return true;
  if (host === "twitch.tv") return /^\/videos\/\d+/.test(path) || /^\/[^/]+\/clip\/[^/]+/.test(path);
  return false;
}

/** L'iframe di un lettore video (il video del mazzo incorporato): YouTube, anche senza cookie, e Twitch. */
export function isVideoEmbedSrc(src: string | null | undefined): boolean {
  let url: URL;
  try {
    url = new URL(src ?? "");
  } catch {
    return false;
  }
  const host = bareHost(url);
  return host === "youtube.com" || host === "youtube-nocookie.com" || host === "player.twitch.tv" || host === "clips.twitch.tv";
}

/**
 * Contatore di un link cliccato nella scheda del mazzo: "video" per un video di YouTube o Twitch, "link" per ogni altro
 * link esterno (le risorse e i canali dell'autore); null per i link interni del sito e per quelli che non sono pagine
 * (mailto:, javascript:). Un elemento con `data-om-deck-stat` decide da sé, prima di questa funzione.
 */
export function statKindForHref(href: string, origin: string): DeckStatKind | null {
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.origin === origin) return null;
  return isVideoUrl(url) ? "video" : "link";
}

/** Chi vede i numeri di tutti i mazzi (la classifica dello staff): admin o tag Staff, come la policy SQL. */
export function canSeeAllStats(profile: { role?: string | null; badge?: string | null } | null | undefined): boolean {
  return profile?.role === "admin" || profile?.badge === "staff";
}

/* ---------- giorni (UTC, come `bump_deck_stat`) ---------- */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Il giorno UTC di una data, "YYYY-MM-DD". */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `day` spostato di `n` giorni (anche negativi). */
export function shiftDay(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Giorni da `from` a `to` (0 se sono lo stesso giorno, negativo se `to` viene prima). */
export function daysBetween(from: string, to: string): number {
  const t = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(to) - t(from)) / 86_400_000);
}

/** Il giorno UTC di un voto (`created_at` di deck_votes); null se la data non si legge. */
export function voteDay(createdAt: string): string | null {
  const t = Date.parse(createdAt);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
}

/** Riga letta dal database resa sicura: numeri interi non negativi, giorno valido; null se non è una riga buona. */
export function normalizeStatRow(raw: unknown): DeckStatRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.deck_id !== "string" || typeof r.day !== "string" || !DAY_RE.test(r.day)) return null;
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? Math.floor(x) : 0;
  };
  return { deck_id: r.deck_id, day: r.day, views: n(r.views), code_copies: n(r.code_copies), link_clicks: n(r.link_clicks), video_plays: n(r.video_plays) };
}

/* ---------- riepiloghi ---------- */

/** Ultimi 7 giorni, ultimi 30 giorni (oggi compreso) e totale da quando si conta. */
export type Counts = { d7: number; d30: number; total: number };

export type DeckStatSummary = {
  views: Counts;
  code: Counts;
  link: Counts;
  video: Counts;
  /** voti ricevuti (per data del voto) */
  votes: Counts;
  /** somma delle stelle dei voti, per le medie (`averageStars`) */
  stars: Counts;
  /** ultimi `days` giorni, dal più vecchio a oggi */
  series: { views: number[]; code: number[] };
  /** primo giorno con un contatore (null se non c'è ancora nulla) */
  firstDay: string | null;
};

/** Numero di giorni della serie per i grafici. */
export const SERIES_DAYS = 30;

const zero = (): Counts => ({ d7: 0, d30: 0, total: 0 });

export function emptySummary(days: number = SERIES_DAYS): DeckStatSummary {
  return {
    views: zero(),
    code: zero(),
    link: zero(),
    video: zero(),
    votes: zero(),
    stars: zero(),
    series: { views: new Array(days).fill(0), code: new Array(days).fill(0) },
    firstDay: null,
  };
}

/** Primo giorno delle due finestre: 7 e 30 giorni con oggi compreso. */
export function windowStarts(today: string): { d7: string; d30: string } {
  return { d7: shiftDay(today, -6), d30: shiftDay(today, -29) };
}

function add(c: Counts, day: string, n: number, starts: { d7: string; d30: string }) {
  if (!n) return;
  c.total += n;
  if (day >= starts.d30) c.d30 += n;
  if (day >= starts.d7) c.d7 += n;
}

/**
 * Riepilogo per mazzo: per ogni id di `deckIds` (anche senza righe: tutto a zero) i quattro contatori e i voti su 7 e
 * 30 giorni e in totale, più la serie giornaliera di visite e copie degli ultimi `days` giorni. Righe e voti di mazzi
 * fuori da `deckIds` si ignorano (lo staff legge anche quelli degli altri).
 */
export function summarizeDecks(
  deckIds: readonly string[],
  rows: readonly DeckStatRow[],
  votes: readonly DeckVoteStat[],
  today: string,
  days: number = SERIES_DAYS,
): Map<string, DeckStatSummary> {
  const out = new Map<string, DeckStatSummary>(deckIds.map((id) => [id, emptySummary(days)]));
  const starts = windowStarts(today);
  const seriesStart = shiftDay(today, -(days - 1));
  for (const r of rows) {
    const s = out.get(r.deck_id);
    if (!s) continue;
    add(s.views, r.day, r.views, starts);
    add(s.code, r.day, r.code_copies, starts);
    add(s.link, r.day, r.link_clicks, starts);
    add(s.video, r.day, r.video_plays, starts);
    if (r.views || r.code_copies || r.link_clicks || r.video_plays) {
      if (!s.firstDay || r.day < s.firstDay) s.firstDay = r.day;
    }
    const i = daysBetween(seriesStart, r.day);
    if (i >= 0 && i < days) {
      s.series.views[i] += r.views;
      s.series.code[i] += r.code_copies;
    }
  }
  for (const v of votes) {
    const s = out.get(v.deck_id);
    const stars = Number(v.stars);
    if (!s || !Number.isFinite(stars) || stars < 1 || stars > 5) continue;
    const day = voteDay(v.created_at);
    s.votes.total += 1;
    s.stars.total += stars;
    if (day && day >= starts.d30) {
      s.votes.d30 += 1;
      s.stars.d30 += stars;
    }
    if (day && day >= starts.d7) {
      s.votes.d7 += 1;
      s.stars.d7 += stars;
    }
  }
  return out;
}

/** La somma di più riepiloghi (il totale di tutti i mazzi di un autore): serie sommate giorno per giorno. */
export function combineSummaries(list: readonly DeckStatSummary[], days: number = SERIES_DAYS): DeckStatSummary {
  const out = emptySummary(days);
  const keys = ["views", "code", "link", "video", "votes", "stars"] as const;
  for (const s of list) {
    for (const k of keys) {
      out[k].d7 += s[k].d7;
      out[k].d30 += s[k].d30;
      out[k].total += s[k].total;
    }
    for (let i = 0; i < days; i++) {
      out.series.views[i] += s.series.views[i] ?? 0;
      out.series.code[i] += s.series.code[i] ?? 0;
    }
    if (s.firstDay && (!out.firstDay || s.firstDay < out.firstDay)) out.firstDay = s.firstDay;
  }
  return out;
}

/** Media delle stelle con un decimale; null senza voti. */
export function averageStars(stars: number, votes: number): number | null {
  if (!votes) return null;
  return Math.round((stars / votes) * 10) / 10;
}

/* ---------- classifica dello staff ---------- */

export type RankedDeck = { deck_id: string; views30: number; views7: number; code30: number; link30: number; video30: number };

/**
 * Mazzi ordinati per visite negli ultimi 30 giorni (poi visite in 7 giorni, copie, id per un ordine stabile), solo
 * quelli con almeno un contatore nella finestra; al massimo `limit`.
 */
export function rankDecks(rows: readonly DeckStatRow[], today: string, limit = 20): RankedDeck[] {
  const starts = windowStarts(today);
  const by = new Map<string, RankedDeck>();
  for (const r of rows) {
    if (r.day < starts.d30) continue;
    const x = by.get(r.deck_id) ?? { deck_id: r.deck_id, views30: 0, views7: 0, code30: 0, link30: 0, video30: 0 };
    x.views30 += r.views;
    if (r.day >= starts.d7) x.views7 += r.views;
    x.code30 += r.code_copies;
    x.link30 += r.link_clicks;
    x.video30 += r.video_plays;
    by.set(r.deck_id, x);
  }
  return [...by.values()]
    .filter((x) => x.views30 || x.code30 || x.link30 || x.video30)
    .sort((a, b) => b.views30 - a.views30 || b.views7 - a.views7 || b.code30 - a.code30 || a.deck_id.localeCompare(b.deck_id))
    .slice(0, Math.max(0, limit));
}

/* ---------- grafici ---------- */

/** Massimo "tondo" dell'asse (1, 2, 5 × 10^k) sopra il valore più alto, almeno 1. */
export function niceCeil(n: number): number {
  if (!Number.isFinite(n) || n <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  for (const step of [1, 2, 5, 10]) if (step * pow >= n) return step * pow;
  return 10 * pow;
}
