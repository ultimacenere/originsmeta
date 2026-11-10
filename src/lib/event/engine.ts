import type { Assignment, EventConfig, EventMatch, EventState, Talent } from "./types";
import { normalizeRun, IDLE_RUN } from "./clock";
import { pairsOf, standings, swissPairs } from "./swiss";

/**
 * Motore di un evento (10/11/2026): le mosse della regia sullo stato. Funzioni pure: la Server Action legge lo stato
 * dal database, applica la mossa con un generatore di numeri casuali crittografico e salva con il numero di versione
 * (due caster che premono insieme: il secondo riprova sullo stato nuovo).
 *
 * Dalle note del 10/11/2026: "Ruota di assegnazione deck visibile solo ai caster", "Gira la ruota: colore estratto =
 * coppia di giocatori + deck assegnato", "Roll limitati al numero di deck per evitare errori", "Dopo l'assegnazione:
 * click 'crea abbinamenti' genera i match automaticamente", "Sezione classifica svizzera: win/lose/punteggio per ogni
 * giocatore". Quindi un giro della ruota estrae un mazzo fra quelli rimasti (ogni mazzo ha il suo colore) e lo dà a una
 * coppia di giocatori: la prossima delle coppie decise in configurazione (`pairs`) o, senza, due giocatori estratti a
 * caso fra quelli senza mazzo. I giri finiscono quando finiscono i mazzi o i giocatori. "Crea abbinamenti" fa un turno
 * svizzero (il primo a caso), evitando le rivincite e, con `mirror: "avoid"`, due giocatori con lo stesso mazzo.
 */

export type Rand = () => number;

export type EngineError =
  | "no_decks_left"
  | "no_players_left"
  | "nothing_to_undo"
  | "matches_started"
  | "round_open"
  | "not_enough_players"
  | "round_has_results"
  | "unknown_match"
  | "bad_winner";

export type EngineResult<T = object> = ({ ok: true; state: EventState } & T) | { ok: false; error: EngineError };

export function emptyState(): EventState {
  return { assignments: [], matches: [], giveaway: { ...IDLE_RUN } };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Stato letto dal database, ripulito: voci sbagliate scartate, campi mancanti a vuoto. */
export function normalizeState(x: unknown): EventState {
  if (!isObj(x)) return emptyState();
  const assignments: Assignment[] = Array.isArray(x.assignments)
    ? x.assignments.flatMap((a) =>
        isObj(a) && typeof a.deck === "string" && Array.isArray(a.players) && a.players.every((p) => typeof p === "string")
          ? [{ deck: a.deck, players: a.players as string[], at: typeof a.at === "string" ? a.at : "" }]
          : [],
      )
    : [];
  const matches: EventMatch[] = Array.isArray(x.matches)
    ? x.matches.flatMap((m) =>
        isObj(m) && typeof m.id === "string" && Number.isInteger(m.round) && Number.isInteger(m.table) && typeof m.a === "string" && (m.b === null || typeof m.b === "string")
          ? [{ id: m.id, round: m.round as number, table: m.table as number, a: m.a, b: (m.b as string | null) ?? null, winner: typeof m.winner === "string" && (m.winner === m.a || m.winner === m.b) ? m.winner : null }]
          : [],
      )
    : [];
  return { assignments, matches, giveaway: normalizeRun(x.giveaway) };
}

/** I giocatori dell'evento, nell'ordine della configurazione. */
export function playersOf(config: Pick<EventConfig, "talent">): Talent[] {
  return config.talent.filter((t) => t.role === "player");
}

/** Il mazzo di ogni giocatore (dalla ruota). */
export function deckByPlayer(state: Pick<EventState, "assignments">): Map<string, string> {
  const out = new Map<string, string>();
  for (const a of state.assignments) for (const p of a.players) out.set(p, a.deck);
  return out;
}

/** Il turno più alto creato (0 = nessuno). */
export function lastRound(state: Pick<EventState, "matches">): number {
  return state.matches.reduce((m, x) => Math.max(m, x.round), 0);
}

/** Il turno ha tutti i risultati? (I bye hanno già il vincitore.) */
export function roundComplete(state: Pick<EventState, "matches">, round: number): boolean {
  return state.matches.filter((m) => m.round === round).every((m) => m.winner !== null);
}

function pickIndex(n: number, rand: Rand): number {
  return Math.min(n - 1, Math.floor(rand() * n));
}

export function shuffle<T>(list: readonly T[], rand: Rand): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rand);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Quanti giri della ruota restano: uno per mazzo, finché ci sono giocatori senza mazzo. */
export function spinsLeft(config: EventConfig, state: EventState): number {
  const usedDecks = new Set(state.assignments.map((a) => a.deck));
  const decksLeft = config.decks.filter((d) => !usedDecks.has(d.id)).length;
  const assigned = deckByPlayer(state);
  const playersLeft = playersOf(config).filter((p) => !assigned.has(p.id)).length;
  return playersLeft ? Math.min(decksLeft, Math.ceil(playersLeft / 2)) : 0;
}

/** Un giro della ruota: un mazzo rimasto per la prossima coppia. */
export function spin(config: EventConfig, state: EventState, rand: Rand, now: number): EngineResult<{ assignment: Assignment }> {
  const usedDecks = new Set(state.assignments.map((a) => a.deck));
  const decks = config.decks.filter((d) => !usedDecks.has(d.id));
  if (!decks.length) return { ok: false, error: "no_decks_left" };
  const assigned = deckByPlayer(state);
  const free = playersOf(config).filter((p) => !assigned.has(p.id)).map((p) => p.id);
  if (!free.length) return { ok: false, error: "no_players_left" };
  const freeSet = new Set(free);
  const planned = config.pairs.find(([a, b]) => freeSet.has(a) && freeSet.has(b));
  // senza coppie decise (o finite quelle), due giocatori a caso fra quelli senza mazzo (l'ultimo, se è solo, da solo)
  const players = planned ? [...planned] : shuffle(free, rand).slice(0, 2);
  const deck = decks[pickIndex(decks.length, rand)];
  const assignment: Assignment = { deck: deck.id, players, at: new Date(now).toISOString() };
  return { ok: true, state: { ...state, assignments: [...state.assignments, assignment] }, assignment };
}

/** Annulla l'ultimo giro della ruota (solo prima del primo turno). */
export function undoSpin(state: EventState): EngineResult {
  if (state.matches.length) return { ok: false, error: "matches_started" };
  if (!state.assignments.length) return { ok: false, error: "nothing_to_undo" };
  return { ok: true, state: { ...state, assignments: state.assignments.slice(0, -1) } };
}

/**
 * Il prossimo turno svizzero. Il primo turno mescola i giocatori; dal secondo l'ordine è quello della classifica
 * (punti), mescolato a pari punti. Rivincite evitate, e con `mirror: "avoid"` anche i giocatori con lo stesso mazzo
 * (quando non si può, la ricerca accetta la coppia meno peggio, come in un torneo).
 */
export function nextRound(config: EventConfig, state: EventState, rand: Rand): EngineResult<{ round: number }> {
  const last = lastRound(state);
  if (last && !roundComplete(state, last)) return { ok: false, error: "round_open" };
  const players = playersOf(config).map((p) => p.id);
  if (players.length < 2) return { ok: false, error: "not_enough_players" };
  const round = last + 1;
  let order: string[];
  if (round === 1) order = shuffle(players, rand);
  else {
    const pts = new Map(standings(players, state.matches).map((r) => [r.player, r.points]));
    order = shuffle(players, rand).sort((a, b) => (pts.get(b) ?? 0) - (pts.get(a) ?? 0));
  }
  const index = new Map(order.map((p, i) => [p, i]));
  const hadBye = order.map((p) => state.matches.some((m) => m.a === p && m.b === null));
  const avoid: [number, number][] = [];
  for (const m of state.matches) {
    if (m.b && index.has(m.a) && index.has(m.b)) avoid.push([index.get(m.a)!, index.get(m.b)!]);
  }
  if (config.mirror === "avoid") {
    const decks = deckByPlayer(state);
    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const di = decks.get(order[i]);
        if (di && di === decks.get(order[j])) avoid.push([i, j]);
      }
    }
  }
  const { tables, bye } = pairsOf(swissPairs(order.length, hadBye, avoid));
  const matches: EventMatch[] = tables.map(([i, j], t) => ({ id: `r${round}-t${t + 1}`, round, table: t + 1, a: order[i], b: order[j], winner: null }));
  if (bye !== null) matches.push({ id: `r${round}-bye`, round, table: matches.length + 1, a: order[bye], b: null, winner: order[bye] });
  return { ok: true, state: { ...state, matches: [...state.matches, ...matches] }, round };
}

/** Cancella l'ultimo turno, solo se nessuna partita ha ancora un risultato (i bye non contano). */
export function undoRound(state: EventState): EngineResult {
  const last = lastRound(state);
  if (!last) return { ok: false, error: "nothing_to_undo" };
  if (state.matches.some((m) => m.round === last && m.b !== null && m.winner !== null)) return { ok: false, error: "round_has_results" };
  return { ok: true, state: { ...state, matches: state.matches.filter((m) => m.round !== last) } };
}

/** Il vincitore di una partita (null lo toglie). I bye non si cambiano. */
export function setWinner(state: EventState, matchId: string, winner: string | null): EngineResult {
  const m = state.matches.find((x) => x.id === matchId);
  if (!m) return { ok: false, error: "unknown_match" };
  if (m.b === null) return { ok: false, error: "bad_winner" };
  if (winner !== null && winner !== m.a && winner !== m.b) return { ok: false, error: "bad_winner" };
  return { ok: true, state: { ...state, matches: state.matches.map((x) => (x.id === matchId ? { ...x, winner } : x)) } };
}

/** Rand crittografico per le Server Action (Web Crypto, presente in Node come nel browser). */
export function cryptoRand(): Rand {
  return () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  };
}

/** Rand con seme, per i test (mulberry32). */
export function seededRand(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
