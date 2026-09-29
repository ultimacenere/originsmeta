/**
 * Statistiche anonime del tracker (30/09/2026, richiesta di Pierluigi: i win rate di mazzi e carte "sono molto
 * importanti e dobbiamo averli"). I numeri li calcola il database (funzioni tracker_stats_* del blocco TRACKER di
 * supabase/schema.sql, security definer per anon): qui ci sono le soglie, le etichette e la lettura delle risposte.
 *
 * - Ogni numero si mostra solo sopra la soglia: almeno 20 partite di almeno 3 giocatori diversi (`TRACKER_STATS`,
 *   uguale a `tracker_stats_ok`: un test li confronta), e si mostra appena la supera (decisione di Pierluigi). Finché
 *   un numero ha meno di 100 partite porta l'etichetta "prime stime" (`isEarly`).
 * - Per patch: la patch in vigore alla fine della partita (`patchAt` di cards.ts, calcolata dal sito all'invio). Mai
 *   somme di più patch o di più code (lo dice il blocco SQL): il totale meno una parte svelerebbe l'altra sotto soglia.
 * - Coda: per ora tutte le partite (`queue: null`); con molta più utenza solo la classificata ("ranked"), cambiando
 *   `tracker_stats_queue()` nel database e questo valore insieme.
 * - Contano solo i mazzi di chi traccia, una volta per impronta: niente doppioni, nessun collegamento fra utenti.
 *
 * Le letture ricontrollano le risposte (forma, chiavi delle carte, soglie): una riga che non torna si scarta.
 */
import { ARCHETYPE_RE, KEY_RE } from "./upload";

export const TRACKER_STATS = {
  /** partite minime di ogni numero */
  minGames: 20,
  /** giocatori diversi minimi di ogni numero */
  minPlayers: 3,
  /** sotto questo numero di partite il numero è una "prima stima" */
  earlyBelow: 100,
  /** coda contata: null = tutte le partite (tracker_stats_queue) */
  queue: null as "ranked" | null,
};

export const LIST_SIZE = 13;
/** Lista esatta: le 13 chiavi in ordine (ordine dei caratteri, come `collate "C"` nel database), separate da virgole. */
export const LIST_RE = /^(C[0-9]{5}_[A-Z]{2},){12}C[0-9]{5}_[A-Z]{2}$/;

export const passesThreshold = (games: number, players: number) => games >= TRACKER_STATS.minGames && players >= TRACKER_STATS.minPlayers;
export const isEarly = (games: number) => games < TRACKER_STATS.earlyBelow;
/** Quota di vittorie fra 0 e 1, null senza partite. */
export const winRate = (wins: number, games: number): number | null => (games > 0 ? wins / games : null);
/** Percentuale intera, per le tabelle. */
export const percent = (wins: number, games: number): number | null => {
  const r = winRate(wins, games);
  return r === null ? null : Math.round(r * 100);
};

/** Lista esatta di un mazzo dalle chiavi delle sue 13 carte (la Leggendaria compresa), o null. */
export function listKey(keys: readonly string[]): string | null {
  if (keys.length !== LIST_SIZE || !keys.every((k) => KEY_RE.test(k))) return null;
  return [...keys].sort().join(",");
}

/**
 * Lista esatta di un mazzo del sito (Leggendaria e 12 carte base per slug): serve a trovare il win rate di un mazzo
 * della community quando qualcuno gioca le sue stesse 13 carte. Null se una carta non ha la chiave del gioco.
 */
export function deckListKey(deck: { legendary: string | null; cards: readonly string[] }, keyOf: (slug: string) => string | undefined): string | null {
  if (!deck.legendary) return null;
  const keys = [deck.legendary, ...deck.cards].map(keyOf);
  if (keys.some((k) => !k)) return null;
  return listKey(keys as string[]);
}

/* ---------- lettura delle risposte ---------- */

export type StatCount = { games: number; wins: number; players: number };
export type Overview = StatCount & { withOpponent: number | null };
export type LegendaryStat = StatCount & { legendary: string };
export type ListStat = StatCount & { list: string; legendary: string | null };
export type ArchetypeStat = StatCount & { archetype: string };
export type CardStat = { card: string; deck: StatCount | null; played: (StatCount & { avgTurn: number | null }) | null };
export type MatchupStat = StatCount & { legendary: string; opponent: string };
export type OpponentStat = StatCount & { opponent: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
/** Numero da una colonna di PostgREST (bigint e numeric arrivano come numeri, a volte come stringhe). */
const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^[0-9]+(?:\.[0-9]+)?$/.test(v)) return Number(v);
  return null;
};
const count = (row: Record<string, unknown>, g = "games", w = "wins", p = "players"): StatCount | null => {
  const games = num(row[g]);
  const wins = num(row[w]);
  const players = num(row[p]);
  if (games === null || wins === null || players === null || !Number.isInteger(games) || !Number.isInteger(wins) || wins > games) return null;
  return passesThreshold(games, players) ? { games, wins, players } : null;
};
const rows = (data: unknown): Record<string, unknown>[] => (Array.isArray(data) ? data.filter(isRecord) : []);
const key = (v: unknown): string | null => (typeof v === "string" && KEY_RE.test(v) ? v : null);

export function parseOverview(data: unknown): Overview | null {
  const row = rows(data)[0];
  const c = row ? count(row) : null;
  if (!row || !c) return null;
  const w = num(row.with_opponent);
  return { ...c, withOpponent: w !== null && w <= c.games ? w : null };
}

export function parseLegendaryStats(data: unknown): LegendaryStat[] {
  return rows(data).flatMap((r) => {
    const legendary = key(r.legendary);
    const c = count(r);
    return legendary && c ? [{ legendary, ...c }] : [];
  });
}

export function parseListStats(data: unknown): ListStat[] {
  return rows(data).flatMap((r) => {
    const c = count(r);
    return typeof r.list === "string" && LIST_RE.test(r.list) && c ? [{ list: r.list, legendary: key(r.legendary), ...c }] : [];
  });
}

export function parseArchetypeStats(data: unknown): ArchetypeStat[] {
  return rows(data).flatMap((r) => {
    const c = count(r);
    return typeof r.archetype === "string" && ARCHETYPE_RE.test(r.archetype) && c ? [{ archetype: r.archetype, ...c }] : [];
  });
}

export function parseCardStats(data: unknown): CardStat[] {
  return rows(data).flatMap((r) => {
    const card = key(r.card);
    if (!card) return [];
    const deck = count(r, "deck_games", "deck_wins", "deck_players");
    const played = count(r, "played_games", "played_wins", "played_players");
    const turn = num(r.avg_turn);
    if (!deck && !played) return [];
    return [{ card, deck, played: played ? { ...played, avgTurn: turn } : null }];
  });
}

export function parseMatchupStats(data: unknown): MatchupStat[] {
  return rows(data).flatMap((r) => {
    const legendary = key(r.legendary);
    const opponent = key(r.opponent);
    const c = count(r);
    return legendary && opponent && c ? [{ legendary, opponent, ...c }] : [];
  });
}

export function parseOpponentStats(data: unknown): OpponentStat[] {
  return rows(data).flatMap((r) => {
    const opponent = key(r.opponent);
    const c = count(r);
    return opponent && c ? [{ opponent, ...c }] : [];
  });
}
