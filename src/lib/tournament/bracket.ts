/**
 * Motore puro del tabellone a eliminazione diretta del Tournament Organizer.
 *
 * Nessun import, nessun accesso al database, niente React: solo funzioni deterministiche che il
 * chiamante (Server Action, pagina o funzione plpgsql `bracket_order(n)` che replica `seedOrder`)
 * usa per costruire e leggere il tabellone. Qui non c'è casualità: l'eventuale mescolamento degli
 * iscritti lo fa il chiamante prima di passare la lista.
 *
 * Algoritmo
 * - Il tabellone ha `size` posti, potenza di 2 (nel menu del TO 4..128, vedi `BRACKET_SIZES`).
 *   `bracketSize` sceglie la minima potenza di 2 che contiene gli iscritti, limitata al massimo del
 *   torneo: 50 iscritti su massimo 64 → tabellone da 64 con 14 bye.
 * - Gli iscritti ricevono un seed 1..n nell'ordine in cui arrivano (`seeded[0]` è il seed 1).
 * - I seed vengono disposti sui posti del primo turno con l'ordine standard (`seedOrder`): si parte
 *   da [1] e, a ogni raddoppio fino a `m` posti, ogni seed `s` della lista precedente diventa la
 *   coppia (s, m + 1 − s). Per 8 posti: [1, 8, 4, 5, 2, 7, 3, 6]. Così i seed 1 e 2 possono
 *   incontrarsi solo in finale, i primi quattro solo dalle semifinali in su, e il primo elemento di
 *   ogni coppia (il posto `a`) è sempre il seed minore: i posti `a` ospitano esattamente i seed
 *   1..size/2 e i posti `b` i seed size/2+1..size.
 * - I posti con seed > n sono vuoti: chi sta in `a` passa il turno (bye). Con la dimensione minima
 *   vale n > size/2, quindi tutti i seed dei posti `a` esistono: un bye sta sempre in `b`, mai in `a`,
 *   nessuna partita è vuota e i bye toccano proprio i seed 1..(size − n). `buildRound1` rifiuta un
 *   tabellone sovradimensionato (n ≤ size/2) proprio per garantire queste proprietà e il tipo `a: T`.
 * - I bye sono distribuiti nel modo più uniforme possibile tra le partite del secondo turno: due
 *   giocatori reduci da un bye si incontrano al secondo turno solo quando i bye sono più di size/4
 *   (cioè n < 3·size/4), caso in cui è inevitabile con qualunque disposizione (size/4 partite al
 *   secondo turno e più di size/4 bye da piazzare); anche allora gli incontri "bye contro bye" sono
 *   il minimo possibile, bye − size/4.
 * - La partita (round, position) manda il vincitore a (round + 1, floor(position / 2)), sul lato `a`
 *   se `position` è pari e `b` se impari (`nextSlot`). I round partono da 1; l'ultimo, log2(size), è
 *   la finale (`roundsOf`, `matchesInRound`, `roundLabel`).
 * - `validateScore` accetta solo punteggi coerenti con il formato (Bo1: 1–0; Bo3: 2–0 e 2–1;
 *   Bo5: 3–0, 3–1 e 3–2, e simmetrici). `standings` legge vincitore, finalista sconfitto e perdenti
 *   delle semifinali dalle partite con status `confirmed` o `bye`.
 */

/** Dimensioni del tabellone proposte nel menu del Tournament Organizer. */
export const BRACKET_SIZES = [4, 8, 16, 32, 64, 128] as const;

export type BracketSize = (typeof BRACKET_SIZES)[number];

/** Numero di partite al meglio di 1, 3 o 5 game. */
export type BestOf = 1 | 3 | 5;

/** Partita del primo turno: `a` è sempre occupato, `b` è `null` quando `a` passa il turno (bye). */
export type Round1Pair<T> = { position: number; a: T; b: T | null };

/** Coordinate della partita successiva e lato in cui entra il vincitore. */
export type BracketSlot = { round: number; position: number; side: "a" | "b" };

/** Sottoinsieme dei campi di una riga della tabella delle partite che serve per leggere il tabellone. */
export type MatchLike = {
  round: number;
  position: number;
  player_a: string | null;
  player_b: string | null;
  winner: string | null;
  status: string;
};

export type Standings = {
  winner: string | null;
  runnerUp: string | null;
  semifinalists: string[];
};

export type RoundLabel = "final" | "semifinal" | "quarterfinal" | { of: number };

/** Esponente k tale che 2^k === size, oppure -1 se `size` non è una potenza di 2 maggiore o uguale a 2. */
function log2Exact(size: number): number {
  if (!Number.isInteger(size) || size < 2) return -1;
  let k = 0;
  let m = 1;
  while (m < size) {
    m *= 2;
    k += 1;
  }
  return m === size ? k : -1;
}

function assertSize(size: number): void {
  if (log2Exact(size) < 0) {
    throw new RangeError(`Dimensione del tabellone non valida: ${size} (serve una potenza di 2 maggiore o uguale a 2)`);
  }
}

function assertRound(size: number, round: number): void {
  const total = roundsOf(size);
  if (!Number.isInteger(round) || round < 1 || round > total) {
    throw new RangeError(`Turno ${round} fuori dal tabellone da ${size} (turni 1..${total})`);
  }
}

/**
 * Minima potenza di 2 che contiene `players` iscritti (almeno 2), limitata a `max`.
 * Se `players > max` restituisce `max`: sta al chiamante rifiutare le iscrizioni in eccesso.
 * `max` deve essere una potenza di 2 maggiore o uguale a 2 (di norma una di `BRACKET_SIZES`).
 */
export function bracketSize(players: number, max: number): number {
  assertSize(max);
  if (players > max) return max;
  let size = 2;
  while (size < players) size *= 2;
  return size;
}

/**
 * Ordine standard dei seed sui posti del primo turno: [1] → [1, 2] → [1, 4, 2, 3] → [1, 8, 4, 5, 2, 7, 3, 6] → …
 * A ogni raddoppio fino a `m` posti, ogni seed `s` della lista precedente diventa la coppia (s, m + 1 − s).
 * Il risultato è una permutazione di 1..size in cui `order[2i] < order[2i+1]` per ogni coppia.
 * `size` deve essere una potenza di 2 maggiore o uguale a 2. Stessa definizione di `bracket_order(n)` in plpgsql.
 */
export function seedOrder(size: number): number[] {
  assertSize(size);
  let order = [1];
  for (let m = 2; m <= size; m *= 2) {
    const next: number[] = [];
    for (const s of order) next.push(s, m + 1 - s);
    order = next;
  }
  return order;
}

/**
 * Partite del primo turno: `seeded[0]` è il seed 1, `seeded[1]` il seed 2 e così via; i seed oltre
 * `seeded.length` sono posti vuoti (bye), che finiscono sempre in `b`. Le `position` vanno da 0 a size/2 − 1.
 * Lancia un errore se gli iscritti sono meno di 2, più di `size`, oppure non più di size/2 (tabellone
 * sovradimensionato: usare `bracketSize`), o se `size` non è una potenza di 2.
 */
export function buildRound1<T>(seeded: T[], size: number): Round1Pair<T>[] {
  assertSize(size);
  const n = seeded.length;
  if (n < 2) throw new RangeError(`Servono almeno 2 iscritti per il tabellone (ricevuti ${n})`);
  if (n > size) throw new RangeError(`Troppi iscritti per un tabellone da ${size}: ${n}`);
  if (n <= size / 2) {
    throw new RangeError(`Tabellone da ${size} sovradimensionato per ${n} iscritti: la dimensione va scelta con bracketSize`);
  }
  const order = seedOrder(size);
  const pairs: Round1Pair<T>[] = [];
  for (let position = 0; position < size / 2; position += 1) {
    const seedA = order[2 * position]; // sempre ≤ size/2 < n: il posto `a` è occupato
    const seedB = order[2 * position + 1];
    pairs.push({ position, a: seeded[seedA - 1], b: seedB <= n ? seeded[seedB - 1] : null });
  }
  return pairs;
}

/** Partita in cui entra il vincitore di (round, position): il turno dopo, posizione floor(position / 2), lato `a` se pari e `b` se impari. */
export function nextSlot(round: number, position: number): BracketSlot {
  return { round: round + 1, position: Math.floor(position / 2), side: position % 2 === 0 ? "a" : "b" };
}

/** Numero di turni del tabellone: log2(size) (8 → 3). */
export function roundsOf(size: number): number {
  assertSize(size);
  return log2Exact(size);
}

/** Partite del turno `round` (da 1): size / 2^round (8 posti, turno 1 → 4; turno 3 → 1). */
export function matchesInRound(size: number, round: number): number {
  assertRound(size, round);
  return size / 2 ** round;
}

/**
 * Vero se il punteggio è coerente con il formato: interi non negativi, non pari, il maggiore è esattamente
 * (bestOf + 1) / 2 e il minore è inferiore. Bo1: 1–0; Bo3: 2–0 e 2–1; Bo5: 3–0, 3–1 e 3–2 (e simmetrici).
 */
export function validateScore(bestOf: BestOf, a: number, b: number): boolean {
  if (bestOf !== 1 && bestOf !== 3 && bestOf !== 5) return false;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a === b) return false;
  const target = (bestOf + 1) / 2;
  return Math.max(a, b) === target && Math.min(a, b) < target;
}

/** Status che chiudono una partita con un vincitore valido. */
const DECIDED_STATUSES = ["confirmed", "bye"];

function isDecided(match: MatchLike): boolean {
  return DECIDED_STATUSES.includes(match.status) && match.winner !== null;
}

/** Sconfitto di una partita decisa, oppure `null` se la partita non è chiusa o il vincitore non è uno dei due giocatori. */
function loserOf(match: MatchLike): string | null {
  if (!isDecided(match)) return null;
  if (match.winner === match.player_a) return match.player_b;
  if (match.winner === match.player_b) return match.player_a;
  return null;
}

/**
 * Classifica finale letta dal tabellone: vincitore della finale (ultimo turno) se la partita è `confirmed`
 * o `bye`, finalista sconfitto e perdenti delle semifinali (in ordine di posizione). I giocatori
 * sconosciuti restano `null`; con size 2 non ci sono semifinali e la lista è vuota.
 */
export function standings(matches: MatchLike[], size: number): Standings {
  const finalRound = roundsOf(size);
  const final = matches.find((m) => m.round === finalRound && m.position === 0);
  let winner: string | null = null;
  let runnerUp: string | null = null;
  if (final !== undefined && isDecided(final)) {
    winner = final.winner;
    runnerUp = loserOf(final);
  }
  const semifinalists: string[] = [];
  if (finalRound >= 2) {
    const semifinals = matches.filter((m) => m.round === finalRound - 1).sort((x, y) => x.position - y.position);
    for (const semifinal of semifinals) {
      const loser = loserOf(semifinal);
      if (loser !== null) semifinalists.push(loser);
    }
  }
  return { winner, runnerUp, semifinalists };
}

/**
 * Nome del turno: l'ultimo è `final`, il penultimo `semifinal`, il terzultimo `quarterfinal`, gli altri
 * `{ of: matchesInRound(size, round) * 2 }` (es. "round of 16"). Le etichette tradotte le fa chi usa il modulo.
 */
export function roundLabel(round: number, size: number): RoundLabel {
  assertRound(size, round);
  const total = roundsOf(size);
  if (round === total) return "final";
  if (round === total - 1) return "semifinal";
  if (round === total - 2) return "quarterfinal";
  return { of: matchesInRound(size, round) * 2 };
}
