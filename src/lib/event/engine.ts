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
 *
 * Dal 12/11/2026 (note della riunione dell'11/11: "ogni 3 partite si può fare uno spin per cambiare mazzo", "nessun
 * giocatore può ricevere lo stesso mazzo due volte") le estrazioni possono essere più di una: "Nuova estrazione" rimette
 * tutti i mazzi sulla ruota e ogni giro dà a una coppia un mazzo che nessuno dei due ha già avuto. Il mazzo di un
 * giocatore è quello del suo ultimo giro.
 */

export type Rand = () => number;

export type EngineError =
  | "no_decks_left"
  | "no_players_left"
  | "no_new_deck"
  | "draw_open"
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
          ? [
              {
                deck: a.deck,
                players: a.players as string[],
                at: typeof a.at === "string" ? a.at : "",
                ...(posInt(a.draw) ? { draw: a.draw as number } : {}),
                ...(posInt(a.afterRound) || a.afterRound === 0 ? { afterRound: a.afterRound as number } : {}),
              },
            ]
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
  return { assignments, matches, giveaway: normalizeRun(x.giveaway), ...(posInt(x.draw) && (x.draw as number) > 1 ? { draw: x.draw as number } : {}) };
}

/** Numero intero da 1 a 99 (estrazioni e turni scritti nello stato). */
function posInt(x: unknown): boolean {
  return typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 99;
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

/** Il mazzo di ogni giocatore nel turno `round`: quello dell'ultimo giro fatto prima che il turno nascesse. */
export function deckByPlayerAt(state: Pick<EventState, "assignments">, round: number): Map<string, string> {
  const out = new Map<string, string>();
  for (const a of state.assignments) if ((a.afterRound ?? 0) < round) for (const p of a.players) out.set(p, a.deck);
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

/** L'estrazione in corso (1 = la prima). */
export function drawOf(state: Pick<EventState, "assignments" | "draw">): number {
  return state.assignments.reduce((m, a) => Math.max(m, a.draw ?? 1), Math.max(1, state.draw ?? 1));
}

/** I giri dell'estrazione `draw` (quelli salvati prima del 12/11/2026, senza numero, sono della prima). */
export function spinsOfDraw(state: Pick<EventState, "assignments">, draw: number): Assignment[] {
  return state.assignments.filter((a) => (a.draw ?? 1) === draw);
}

/** I mazzi che ogni giocatore ha già avuto, in tutte le estrazioni. */
export function decksHad(state: Pick<EventState, "assignments">): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const a of state.assignments) {
    for (const p of a.players) {
      const set = out.get(p) ?? new Set<string>();
      set.add(a.deck);
      out.set(p, set);
    }
  }
  return out;
}

/** Giocatori ancora senza mazzo e mazzi ancora sulla ruota, nell'estrazione in corso. */
function openDraw(config: EventConfig, state: EventState): { draw: number; free: string[]; decks: string[] } {
  const draw = drawOf(state);
  const cur = spinsOfDraw(state, draw);
  const usedDecks = new Set(cur.map((a) => a.deck));
  const done = new Set(cur.flatMap((a) => a.players));
  return {
    draw,
    free: playersOf(config)
      .filter((p) => !done.has(p.id))
      .map((p) => p.id),
    decks: config.decks.filter((d) => !usedDecks.has(d.id)).map((d) => d.id),
  };
}

/** Quanti giri della ruota restano nell'estrazione in corso: uno per mazzo, finché ci sono giocatori senza mazzo. */
export function spinsLeft(config: EventConfig, state: EventState): number {
  const { free, decks } = openDraw(config, state);
  return free.length ? Math.min(decks.length, Math.ceil(free.length / 2)) : 0;
}

type Group = { players: string[]; deck: string };

/**
 * Dalla seconda estrazione: cerca un modo di dare un mazzo nuovo a tutti i giocatori rimasti (a coppie, uno da solo se
 * sono dispari; se i mazzi finiscono prima, chi resta non ne riceve) e restituisce il primo gruppo. Il resto non si
 * salva: il giro dopo rifà la ricerca, e quello che resta di una soluzione è ancora una soluzione, quindi la ruota non
 * finisce mai in un vicolo cieco. Ricerca con ritorno indietro in ordine casuale e un tetto di passi (i casi veri, 8
 * mazzi e due o tre estrazioni, si risolvono al primo tentativo). `first` è la coppia decisa in configurazione.
 */
function firstGroup(free: readonly string[], decks: readonly string[], had: ReadonlyMap<string, ReadonlySet<string>>, rand: Rand, first: readonly [string, string] | null): Group | null {
  const isNew = (deck: string, group: readonly string[]) => group.every((p) => !had.get(p)?.has(deck));
  for (let attempt = 0; attempt < 30; attempt++) {
    let budget = 20_000;
    const out: { group: Group | null } = { group: null };
    const solve = (players: readonly string[], left: readonly string[], forced: string | null, depth: number): boolean => {
      if (!players.length || !left.length) return true;
      const a = players[0];
      const rest = players.slice(1);
      const partners: (string | null)[] = forced ? [forced] : players.length % 2 === 1 ? [...rest, null] : rest;
      for (const b of partners) {
        const group = b ? [a, b] : [a];
        const others = b ? rest.filter((p) => p !== b) : rest;
        for (const deck of left) {
          if (!isNew(deck, group)) continue;
          if (budget-- <= 0) return false;
          if (
            solve(
              others,
              left.filter((d) => d !== deck),
              null,
              depth + 1,
            )
          ) {
            if (depth === 0) out.group = { players: group, deck };
            return true;
          }
        }
      }
      return false;
    };
    const order = shuffle(free, rand);
    const start = first ? [first[0], ...order.filter((p) => p !== first[0])] : order;
    if (solve(start, shuffle(decks, rand), first ? first[1] : null, 0)) return out.group;
  }
  return null;
}

/** Un giro della ruota: un mazzo rimasto per la prossima coppia. Dalla seconda estrazione, un mazzo nuovo per tutti e due. */
export function spin(config: EventConfig, state: EventState, rand: Rand, now: number): EngineResult<{ assignment: Assignment }> {
  const { draw, free, decks } = openDraw(config, state);
  if (!decks.length) return { ok: false, error: "no_decks_left" };
  if (!free.length) return { ok: false, error: "no_players_left" };
  const freeSet = new Set(free);
  const planned = config.pairs.find(([a, b]) => freeSet.has(a) && freeSet.has(b)) ?? null;
  let group: Group | null;
  if (draw === 1) {
    // senza coppie decise (o finite quelle), due giocatori a caso fra quelli senza mazzo (l'ultimo, se è solo, da solo)
    const players = planned ? [...planned] : shuffle(free, rand).slice(0, 2);
    group = { players, deck: decks[pickIndex(decks.length, rand)] };
  } else {
    const had = decksHad(state);
    // la coppia decisa resta insieme se c'è un mazzo nuovo per tutti e due, altrimenti le coppie si rimescolano
    group = (planned ? firstGroup(free, decks, had, rand, planned) : null) ?? firstGroup(free, decks, had, rand, null);
    if (!group) return { ok: false, error: "no_new_deck" };
  }
  const assignment: Assignment = { deck: group.deck, players: group.players, at: new Date(now).toISOString(), draw, afterRound: lastRound(state) };
  return { ok: true, state: { ...state, assignments: [...state.assignments, assignment] }, assignment };
}

/**
 * Annulla l'ultimo giro della ruota, finché dopo quel giro non è nato un turno. Se l'estrazione in corso (dalla seconda)
 * non ha ancora giri, la richiude.
 */
export function undoSpin(state: EventState): EngineResult {
  const draw = drawOf(state);
  if (!spinsOfDraw(state, draw).length) {
    if (draw > 1) return { ok: true, state: { ...state, draw: draw - 1 } };
    return { ok: false, error: state.matches.length ? "matches_started" : "nothing_to_undo" };
  }
  const last = state.assignments[state.assignments.length - 1];
  if (lastRound(state) > (last.afterRound ?? 0)) return { ok: false, error: "matches_started" };
  return { ok: true, state: { ...state, assignments: state.assignments.slice(0, -1) } };
}

/**
 * Apre una nuova estrazione: tutti i mazzi tornano sulla ruota e ogni giocatore ne riceve uno che non ha ancora avuto.
 * Solo a estrazione finita e a turno chiuso, e solo se un modo di dare a tutti un mazzo nuovo esiste.
 */
export function newDraw(config: EventConfig, state: EventState, rand: Rand): EngineResult<{ draw: number }> {
  if (!state.assignments.length || spinsLeft(config, state) > 0) return { ok: false, error: "draw_open" };
  const last = lastRound(state);
  if (last && !roundComplete(state, last)) return { ok: false, error: "round_open" };
  const draw = drawOf(state) + 1;
  const next: EventState = { ...state, draw };
  const { free, decks } = openDraw(config, next);
  if (!free.length || !decks.length || !firstGroup(free, decks, decksHad(next), rand, null)) return { ok: false, error: "no_new_deck" };
  return { ok: true, state: next, draw };
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
