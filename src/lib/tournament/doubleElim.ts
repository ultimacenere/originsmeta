/**
 * Qualificazione a doppia eliminazione (10/11/2026, richiesta di apix per il torneo del 28–29/11/2026: due tabelloni da
 * 512 a doppia eliminazione, tutto al meglio delle 3, passano 32 dal tabellone dei vincenti e 32 da quello dei perdenti
 * di ogni tabellone, poi una Top 128 a eliminazione diretta senza seed). Il giudice vero è il blocco "10/11/2026: DOPPIA
 * ELIMINAZIONE" di supabase/schema.sql: qui le stesse regole in TypeScript, per le pagine (nomi delle partite, schede dei
 * tabelloni), per i test (doubleElim.test.ts) e per le prove a secco (00_KB/_sim_torneo_2026-11-06/de-dry.mjs confronta il
 * database con queste funzioni partita per partita).
 *
 * Struttura di un tabellone (`pool`) da P posti con Q qualificati per lato:
 * - vincenti (`upper`): turni 1..U con U = log2(P / Q); chi vince l'ultimo turno è qualificato;
 * - perdenti (`lower`): L = 2U − 2 turni. Il turno 1 mette di fronte i perdenti del primo turno dei vincenti; nei turni
 *   pari (d'ingresso) i sopravvissuti incontrano i perdenti del turno r = k/2 + 1 dei vincenti, in ordine rovesciato nei
 *   turni r pari (meno rivincite a breve); nei turni dispari dal 3 i sopravvissuti si dimezzano. Chi vince l'ultimo turno
 *   dei perdenti è qualificato; chi perde nei perdenti è fuori.
 * Nel database: `stage` 'upper' o 'lower', `grp` il tabellone (da 0), turni dei vincenti 1..U e dei perdenti U+1..U+L
 * (numerazione unica: il vincolo unique (tournament_id, round, position) resta com'è), posizione = pool × partite del
 * turno in un tabellone + indice nel tabellone. Dopo la qualificazione la fase finale è il tabellone di sempre (stage
 * null), creato da start_final_stage nei turni dopo.
 *
 * Bye: i giocatori si dividono fra i tabelloni a turno (0, 1, 0, 1…), P è la potenza di 2 del tabellone più pieno, nel
 * primo turno dei vincenti i bye vanno ai seed più alti come sempre. Un bye dei vincenti non manda nessuno nei perdenti:
 * il posto resta vuoto e chi è dall'altra parte passa il turno dei perdenti senza giocare (anche un incontro dei perdenti
 * senza nessuno dei due è un bye vuoto, che lascia vuoto il posto del turno dopo).
 *
 * Funzioni pure, senza import a runtime: le usano pagine, componenti, script e test.
 */

/** Tabelloni della qualificazione (vincolo tournaments_de_pools_check). */
export const DE_POOLS_RANGE = { min: 1, max: 8, default: 2 } as const;
/** Qualificati per lato e per tabellone (vincolo tournaments_de_qualify_check): potenze di 2. */
export const DE_QUALIFY_OPTIONS = [1, 2, 4, 8, 16, 32, 64, 128] as const;
export const DE_QUALIFY_DEFAULT = 32;
/** Posti in più per la doppia eliminazione (solo per lei: vincolo tournaments_size_check). */
export const DE_ONLY_SIZES = [512, 1024] as const;

export type DeStage = "upper" | "lower";

export type DePlan = {
  pools: number;
  /** posti di ogni tabellone (potenza di 2) */
  poolSize: number;
  /** qualificati per lato e per tabellone */
  qualify: number;
  upperRounds: number;
  lowerRounds: number;
};

function log2(n: number): number {
  let k = 0;
  while (2 ** k < n) k += 1;
  return k;
}

/** Ordine dei seed sui posti del primo turno (uguale a seedOrder di bracket.ts e bracket_order dell'SQL). */
export function seedOrder(size: number): number[] {
  let order = [1];
  for (let m = 2; m <= size; m *= 2) {
    const next: number[] = [];
    for (const s of order) next.push(s, m + 1 - s);
    order = next;
  }
  return order;
}

/** Iscritti di ogni tabellone: il k-esimo dell'ordine di avvio va nel tabellone k % pools. */
export function poolCounts(players: number, pools: number): number[] {
  return Array.from({ length: pools }, (_, p) => Math.floor(players / pools) + (p < players % pools ? 1 : 0));
}

/**
 * Piano della qualificazione per `players` iscritti, oppure il problema: ogni tabellone deve avere più di 2Q iscritti
 * (se no passerebbero tutti). P = potenza di 2 del tabellone più pieno (così P ≥ 4Q e ogni partita del primo turno ha
 * almeno un giocatore).
 */
export function dePlan(players: number, pools: number, qualify: number): DePlan | "too_few_players" {
  const counts = poolCounts(players, pools);
  if (!counts.length || Math.min(...counts) <= 2 * qualify) return "too_few_players";
  const poolSize = 2 ** log2(Math.max(...counts));
  const upperRounds = log2(poolSize / qualify);
  return { pools, poolSize, qualify, upperRounds, lowerRounds: 2 * upperRounds - 2 };
}

/** Il minimo di iscritti perché la qualificazione abbia senso: ogni tabellone con 2Q + 1 giocatori. */
export function deMinPlayers(pools: number, qualify: number): number {
  return pools * (2 * qualify + 1);
}

/** Partite di un turno in un tabellone: vincenti P / 2^r; perdenti P / 2^(ceil(k/2) + 1). */
export function deCount(plan: Pick<DePlan, "poolSize">, stage: DeStage, local: number): number {
  return stage === "upper" ? plan.poolSize >> local : plan.poolSize >> (Math.ceil(local / 2) + 1);
}

/** Turno salvato nel database: vincenti 1..U, perdenti U+1..U+L. */
export function deRound(plan: Pick<DePlan, "upperRounds">, stage: DeStage, local: number): number {
  return stage === "upper" ? local : plan.upperRounds + local;
}

export type DeSlot = { stage: DeStage; pool: number; local: number; index: number };

/** Da (stage, round, position) del database al posto nel tabellone. */
export function deSlotOf(plan: DePlan, m: { stage?: string | null; round: number; position: number }): DeSlot | null {
  if (m.stage !== "upper" && m.stage !== "lower") return null;
  const local = m.stage === "upper" ? m.round : m.round - plan.upperRounds;
  const c = deCount(plan, m.stage, local);
  return { stage: m.stage, pool: Math.floor(m.position / c), local, index: m.position % c };
}

/** Posizione nel database di un posto. */
export function dePosition(plan: DePlan, s: Omit<DeSlot, "index"> & { index: number }): number {
  return s.pool * deCount(plan, s.stage, s.local) + s.index;
}

/** Nel turno r dei vincenti, i perdenti entrano nei perdenti in ordine rovesciato quando r è pari. */
function flip(plan: DePlan, r: number, i: number): number {
  const n = plan.poolSize >> r;
  return r % 2 === 0 ? n - 1 - i : i;
}

export type DeTarget = { stage: DeStage; local: number; index: number; side: 0 | 1 } | "qualified" | "out";

/** Dove va il vincitore di una partita. */
export function deWinnerTo(plan: DePlan, s: DeSlot): DeTarget {
  if (s.stage === "upper") return s.local < plan.upperRounds ? { stage: "upper", local: s.local + 1, index: s.index >> 1, side: (s.index & 1) as 0 | 1 } : "qualified";
  if (s.local === plan.lowerRounds) return "qualified";
  return s.local % 2 === 1 ? { stage: "lower", local: s.local + 1, index: s.index, side: 0 } : { stage: "lower", local: s.local + 1, index: s.index >> 1, side: (s.index & 1) as 0 | 1 };
}

/** Dove va chi perde una partita. */
export function deLoserTo(plan: DePlan, s: DeSlot): DeTarget {
  if (s.stage === "lower") return "out";
  if (s.local === 1) return { stage: "lower", local: 1, index: s.index >> 1, side: (s.index & 1) as 0 | 1 };
  return { stage: "lower", local: 2 * s.local - 2, index: flip(plan, s.local, s.index), side: 1 };
}

export type DeFeeder = { stage: DeStage; local: number; index: number; gives: "winner" | "loser" };

/** Da quale partita arriva il giocatore di un lato (null nel primo turno dei vincenti). */
export function deFeeder(plan: DePlan, s: Omit<DeSlot, "pool">, side: 0 | 1): DeFeeder | null {
  if (s.stage === "upper") return s.local === 1 ? null : { stage: "upper", local: s.local - 1, index: 2 * s.index + side, gives: "winner" };
  if (s.local === 1) return { stage: "upper", local: 1, index: 2 * s.index + side, gives: "loser" };
  if (s.local % 2 === 0) {
    if (side === 0) return { stage: "lower", local: s.local - 1, index: s.index, gives: "winner" };
    const r = s.local / 2 + 1;
    return { stage: "upper", local: r, index: flip(plan, r, s.index), gives: "loser" };
  }
  return { stage: "lower", local: s.local - 1, index: 2 * s.index + side, gives: "winner" };
}

/* ---------- simulazione (test e prove a secco) ---------- */

export type DeMatch = {
  stage: DeStage;
  round: number;
  position: number;
  grp: number;
  player_a: string | null;
  player_b: string | null;
  winner: string | null;
  status: "pending" | "confirmed" | "bye";
};

/**
 * Tutte le partite all'avvio, come tm_de_create: `seeded` è l'ordine di avvio (il k-esimo nel tabellone k % pools, con
 * seed floor(k / pools) + 1). I bye del primo turno sono già chiusi e propagati.
 */
export function deCreate(seeded: string[], pools: number, qualify: number): { plan: DePlan; matches: DeMatch[] } {
  const plan = dePlan(seeded.length, pools, qualify);
  if (plan === "too_few_players") throw new RangeError("too_few_players");
  const matches: DeMatch[] = [];
  for (const stage of ["upper", "lower"] as const) {
    const rounds = stage === "upper" ? plan.upperRounds : plan.lowerRounds;
    for (let local = 1; local <= rounds; local++) {
      const c = deCount(plan, stage, local);
      for (let pool = 0; pool < pools; pool++)
        for (let i = 0; i < c; i++)
          matches.push({ stage, round: deRound(plan, stage, local), position: pool * c + i, grp: pool, player_a: null, player_b: null, winner: null, status: "pending" });
    }
  }
  const ord = seedOrder(plan.poolSize);
  const byPool: string[][] = Array.from({ length: pools }, () => []);
  seeded.forEach((u, k) => byPool[k % pools].push(u));
  const find = (stage: DeStage, local: number, pool: number, index: number) => {
    const round = deRound(plan, stage, local);
    const position = pool * deCount(plan, stage, local) + index;
    return matches.find((m) => m.stage === stage && m.round === round && m.position === position)!;
  };
  const byes: DeMatch[] = [];
  for (let pool = 0; pool < pools; pool++) {
    const list = byPool[pool];
    for (let i = 0; i < plan.poolSize / 2; i++) {
      const m = find("upper", 1, pool, i);
      const a = ord[2 * i] <= list.length ? list[ord[2 * i] - 1] : null;
      const b = ord[2 * i + 1] <= list.length ? list[ord[2 * i + 1] - 1] : null;
      if (!a) throw new RangeError("bad_seeding");
      m.player_a = a;
      m.player_b = b;
      if (!b) {
        m.winner = a;
        m.status = "bye";
        byes.push(m);
      }
    }
  }
  const sim = { plan, matches, find };
  for (const m of byes) dePropagate(sim, m);
  return { plan, matches };
}

type Sim = { plan: DePlan; matches: DeMatch[]; find: (stage: DeStage, local: number, pool: number, index: number) => DeMatch };

function simOf(plan: DePlan, matches: DeMatch[]): Sim {
  const at = new Map(matches.map((m) => [`${m.stage}:${m.round}:${m.position}`, m]));
  return {
    plan,
    matches,
    find: (stage, local, pool, index) => at.get(`${stage}:${deRound(plan, stage, local)}:${pool * deCount(plan, stage, local) + index}`)!,
  };
}

/** Il lato del feeder non manderà nessuno: bye dei vincenti (nessun perdente) o bye vuoto dei perdenti. */
function feederVoid(sim: Sim, pool: number, f: DeFeeder | null): boolean {
  if (!f) return false;
  const m = sim.find(f.stage, f.local, pool, f.index);
  return m.status === "bye" && (f.gives === "loser" || !m.winner);
}

function place(sim: Sim, pool: number, t: DeTarget, uid: string | null) {
  if (t === "qualified" || t === "out") return;
  const nm = sim.find(t.stage, t.local, pool, t.index);
  if (t.side === 0) nm.player_a = uid;
  else nm.player_b = uid;
  settle(sim, pool, nm);
}

/** Dopo un arrivo: se l'altro lato è vuoto per sempre, la partita è un bye (con il vincitore, o vuota). */
function settle(sim: Sim, pool: number, nm: DeMatch) {
  if (nm.status !== "pending") return;
  const s = deSlotOf(sim.plan, nm)!;
  const voidA = !nm.player_a && feederVoid(sim, pool, deFeeder(sim.plan, s, 0));
  const voidB = !nm.player_b && feederVoid(sim, pool, deFeeder(sim.plan, s, 1));
  if ((voidA && voidB) || (voidA && nm.player_b) || (voidB && nm.player_a)) {
    nm.status = "bye";
    nm.winner = nm.player_a ?? nm.player_b;
    dePropagate(sim, nm);
  }
}

/** Manda vincitore e perdente di una partita chiusa ai posti dopo (come tm_de_propagate). */
function dePropagate(sim: Sim, m: DeMatch) {
  const s = deSlotOf(sim.plan, m)!;
  const loser = m.status === "bye" ? null : m.winner === m.player_a ? m.player_b : m.player_a;
  place(sim, s.pool, deWinnerTo(sim.plan, s), m.winner);
  // un bye dei vincenti non manda nessuno nei perdenti: il posto è vuoto, e chi è dall'altra parte (se c'è) passa
  const lt = deLoserTo(sim.plan, s);
  if (m.status === "bye") {
    if (lt !== "qualified" && lt !== "out") settle(sim, s.pool, sim.find(lt.stage, lt.local, s.pool, lt.index));
  } else place(sim, s.pool, lt, loser);
  // un bye vuoto dei perdenti lascia vuoto il posto dopo
  if (m.status === "bye" && !m.winner) {
    const wt = deWinnerTo(sim.plan, s);
    if (wt !== "qualified" && wt !== "out") settle(sim, s.pool, sim.find(wt.stage, wt.local, s.pool, wt.index));
  }
}

/** Chiude una partita con il vincitore (prova a secco): `aWins` sceglie il lato. */
export function deReport(plan: DePlan, matches: DeMatch[], m: DeMatch, aWins: boolean): void {
  if (m.status !== "pending" || !m.player_a || !m.player_b) throw new Error("not_ready");
  m.winner = aWins ? m.player_a : m.player_b;
  m.status = "confirmed";
  dePropagate(simOf(plan, matches), m);
}

/** Partite pronte: i due giocatori ci sono e la partita è da giocare. */
export function deReady<T extends { status: string; player_a: string | null; player_b: string | null }>(matches: T[]): T[] {
  return matches.filter((m) => m.status === "pending" && m.player_a && m.player_b);
}

/**
 * Qualificati, come start_final_stage: vincitori dell'ultimo turno dei vincenti e dei perdenti di ogni tabellone, in
 * ordine di tabellone e poi vincenti prima dei perdenti (la fase finale li mescola: niente seed, come vuole apix).
 */
export function deQualifiers(plan: DePlan, matches: { stage?: string | null; round: number; position: number; winner: string | null; status: string }[]): { uid: string; pool: number; from: DeStage }[] {
  const out: { uid: string; pool: number; from: DeStage }[] = [];
  for (const m of matches) {
    const s = deSlotOf(plan, m);
    if (!s || !m.winner || (m.status !== "confirmed" && m.status !== "bye")) continue;
    if (deWinnerTo(plan, s) === "qualified") out.push({ uid: m.winner, pool: s.pool, from: s.stage });
  }
  return out.sort((a, b) => a.pool - b.pool || (a.from === b.from ? 0 : a.from === "upper" ? -1 : 1));
}

/** Piano dalle partite salvate (pagine): P dal primo turno dei vincenti, U dai turni dei vincenti. */
export function dePlanOf(matches: { stage?: string | null; round: number; grp?: number | null }[], pools: number, qualify: number): DePlan | null {
  const upper = matches.filter((m) => m.stage === "upper");
  if (!upper.length) return null;
  const upperRounds = Math.max(...upper.map((m) => m.round));
  const first = upper.filter((m) => m.round === 1).length;
  const realPools = Math.max(pools, ...upper.map((m) => (m.grp ?? 0) + 1));
  return { pools: realPools, poolSize: (first / realPools) * 2, qualify, upperRounds, lowerRounds: 2 * upperRounds - 2 };
}

/** Partite ancora aperte della qualificazione. */
export function openDeMatches<T extends { stage?: string | null; status: string }>(matches: T[]): T[] {
  return matches.filter((m) => (m.stage === "upper" || m.stage === "lower") && (m.status === "pending" || m.status === "reported" || m.status === "disputed"));
}

/** Turni di gioco che servono (stima del programma): i perdenti finiscono L turni dopo il primo dei vincenti, + 1. */
export function deSlots(plan: Pick<DePlan, "upperRounds" | "lowerRounds">): number {
  return Math.max(plan.upperRounds, plan.lowerRounds + 1);
}

/** Partite totali della qualificazione. */
export function deMatchCount(plan: DePlan): number {
  let n = 0;
  for (let r = 1; r <= plan.upperRounds; r++) n += deCount(plan, "upper", r);
  for (let k = 1; k <= plan.lowerRounds; k++) n += deCount(plan, "lower", k);
  return n * plan.pools;
}
