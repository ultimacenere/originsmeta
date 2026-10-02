/**
 * Motore del draft di OriginsMeta (02/10/2026, richiesta di Pierluigi: "facciamo un draft da zero MIGLIORE del loro").
 *
 * Due giocatori (posti 0 e 1) si dividono le carte e ognuno costruisce un mazzo del formato del gioco: 1 Leggendaria e
 * 12 carte base, che diventano 25 con le due copie (`RULES` di deckrules.ts), quindi il mazzo si esporta con il codice
 * del gioco (KGBLDC) e si apre nel deck builder. Tre formati:
 *
 * - **Scambio** (`exchange`): Leggendaria fra 3 tue, le altre si bruciano; poi 10 giri in cui ognuno vede 3 carte sue:
 *   una la tiene, una la regala all'avversario, la terza si brucia. Pool di 20 carte, se ne giocano 12.
 * - **Tris** (`triple`): 4 Leggendarie in comune scelte a serpentina (A, B, B, A), poi 16 giri di 3 carte in comune: sceglie
 *   uno, poi l'altro, la terza si brucia; chi sceglie per primo si alterna. Pool di 16 carte.
 * - **Buste** (`packs`): Leggendarie come nel Tris, poi 3 giri di buste da 6 carte (1 epica, 2 rare, 3 comuni): si
 *   sceglie insieme una carta dalla busta che si ha davanti e ci si scambiano le buste finché sono vuote. Pool di 18.
 *
 * Tutto è deterministico dal seme (`mulberry32`): stesso seme, stesse carte. Lo stato è un oggetto JSON semplice, così
 * la fase 2 (draft online fra due persone) potrà salvarlo e farlo convalidare dal database con le stesse regole.
 * Funzioni pure, nessun accesso al database carte: il pool arriva da fuori (`DraftCard`).
 */

export type DraftFormat = "exchange" | "triple" | "packs";
export const DRAFT_FORMATS: readonly DraftFormat[] = ["exchange", "triple", "packs"];
export type Seat = 0 | 1;
export type Rarity = "common" | "rare" | "epic" | "legendary";

/** La carta come serve al motore: niente testi, niente immagini. */
export type DraftCard = { slug: string; legendary: boolean; rarity?: Rarity; mana?: number; spell?: boolean };

/** Numeri dei formati: un solo posto, letto anche dalle etichette delle pagine. */
export const FORMAT_RULES = {
  exchange: { legendaryOffer: 3, rounds: 10, offer: 3 },
  triple: { legendaryShared: 4, rounds: 16, offer: 3 },
  packs: { legendaryShared: 4, packs: 3, packSize: 6, slots: { epic: 1, rare: 2, common: 3 } },
} as const;

export const DECK_BASE = 12;

/** Decisione che aspetta un giocatore: scegliere una carta, oppure (Scambio) tenerne una e regalarne un'altra. */
export type Pending = { kind: "pick"; options: string[] } | { kind: "keepGive"; options: string[] } | { kind: "build" };

export type SeatState = {
  /** Leggendarie e carte base ottenute, in ordine di arrivo */
  legendaries: string[];
  pool: string[];
  /** carte arrivate dall'avversario (Scambio): l'avversario le conosce, quindi sono informazione pubblica */
  received: string[];
  /** carte regalate all'avversario (Scambio) */
  given: string[];
  /** regalo del giro in corso (Scambio): arriva all'avversario solo a fine giro, quando hanno scelto tutti e due,
   *  così chi sceglie per secondo non sceglie sapendo che cosa riceve */
  outbox: string | null;
  pending: Pending | null;
  deck: { legendary: string; cards: string[] } | null;
};

/** Una scelta registrata, per il riepilogo e per rigiocare il draft. */
export type DraftEvent =
  | { seat: Seat; type: "pick"; card: string; phase: "legendary" | "main"; round: number }
  | { seat: Seat; type: "keepGive"; keep: string; give: string; burn: string; phase: "legendary" | "main"; round: number }
  | { type: "burn"; card: string; phase: "legendary" | "main"; round: number };

export type DraftState = {
  v: 1;
  format: DraftFormat;
  seed: number;
  phase: "legendary" | "main" | "build" | "done";
  /** giro della fase, da 1 */
  round: number;
  /** chi sceglie per primo nel giro (Tris e Leggendarie a serpentina) */
  first: Seat;
  seats: [SeatState, SeatState];
  /** carte in comune ancora sul tavolo (Tris, Leggendarie a serpentina) */
  table: string[];
  /** ordine dei turni del giro a serpentina, consumato da sinistra */
  turns: Seat[];
  /** buste: per ogni posto la busta che ha davanti (Buste) */
  packs: [string[], string[]];
  /** mazzi di carte ancora da distribuire, già mescolati dal seme */
  deckBase: string[];
  deckLegendary: string[];
  /** buste ancora da aprire, già composte */
  sealed: string[][];
  log: DraftEvent[];
};

export type DraftAction =
  | { seat: Seat; type: "pick"; card: string }
  | { seat: Seat; type: "keepGive"; keep: string; give: string }
  | { seat: Seat; type: "build"; legendary: string; cards: string[] };

export type DraftError =
  | "notYourTurn"
  | "badCard"
  | "sameCard"
  | "badDeck"
  | "finished";

/* ------------------------------------------------------------------------------------------------ caso con seme */

/** Generatore pseudo-casuale con seme a 32 bit (mulberry32): veloce, sufficiente per mescolare un pool di 120 carte. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Seme nuovo da 1 a 2^31: abbastanza corto da stare in un link (`?s=`). */
export function newSeed(rand: () => number = Math.random): number {
  return 1 + Math.floor(rand() * 2147483646);
}

export function isSeed(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 2147483647;
}

/* ------------------------------------------------------------------------------------------------ creazione */

const emptySeat = (): SeatState => ({ legendaries: [], pool: [], received: [], given: [], outbox: null, pending: null, deck: null });

/** Buste del formato Buste: rarità per slot; se una rarità finisce si ripiega sulla più vicina, poi su qualunque carta. */
function makePacks(base: DraftCard[], rand: () => number): string[][] {
  const r = FORMAT_RULES.packs;
  const byRarity: Record<"epic" | "rare" | "common", string[]> = { epic: [], rare: [], common: [] };
  for (const c of shuffle(base, rand)) byRarity[c.rarity === "epic" || c.rarity === "rare" ? c.rarity : "common"].push(c.slug);
  const fallback: Record<"epic" | "rare" | "common", ("epic" | "rare" | "common")[]> = {
    epic: ["epic", "rare", "common"],
    rare: ["rare", "epic", "common"],
    common: ["common", "rare", "epic"],
  };
  const packs: string[][] = [];
  for (let p = 0; p < r.packs * 2; p++) {
    const pack: string[] = [];
    for (const [rarity, n] of Object.entries(r.slots) as ["epic" | "rare" | "common", number][]) {
      for (let k = 0; k < n; k++) {
        const from = fallback[rarity].find((x) => byRarity[x].length > 0);
        if (from) pack.push(byRarity[from].pop() as string);
      }
    }
    packs.push(shuffle(pack, rand));
  }
  return packs;
}

/** Inizia un draft. `first` = chi sceglie per primo la Leggendaria (Tris e Buste); di default lo decide il seme. */
export function createDraft(format: DraftFormat, seed: number, pool: readonly DraftCard[], first?: Seat): DraftState {
  const rand = rng(seed);
  const legendary = pool.filter((c) => c.legendary);
  const base = pool.filter((c) => !c.legendary);
  const starter: Seat = first ?? (rand() < 0.5 ? 0 : 1);
  const state: DraftState = {
    v: 1,
    format,
    seed,
    phase: "legendary",
    round: 1,
    first: starter,
    seats: [emptySeat(), emptySeat()],
    table: [],
    turns: [],
    packs: [[], []],
    deckBase: [],
    deckLegendary: shuffle(legendary.map((c) => c.slug), rand),
    sealed: [],
    log: [],
  };
  if (format === "packs") state.sealed = makePacks(base, rand);
  else state.deckBase = shuffle(base.map((c) => c.slug), rand);
  return openRound(state);
}

/** Carte necessarie a un formato: il pool deve bastare (la pagina lo controlla prima di proporre il formato). */
export function cardsNeeded(format: DraftFormat): { legendary: number; base: number } {
  if (format === "exchange") return { legendary: FORMAT_RULES.exchange.legendaryOffer * 2, base: FORMAT_RULES.exchange.rounds * FORMAT_RULES.exchange.offer * 2 };
  if (format === "triple") return { legendary: FORMAT_RULES.triple.legendaryShared, base: FORMAT_RULES.triple.rounds * FORMAT_RULES.triple.offer };
  const p = FORMAT_RULES.packs;
  return { legendary: p.legendaryShared, base: p.packs * 2 * p.packSize };
}

export function poolSupports(format: DraftFormat, pool: readonly DraftCard[]): boolean {
  const need = cardsNeeded(format);
  return pool.filter((c) => c.legendary).length >= need.legendary && pool.filter((c) => !c.legendary).length >= need.base;
}

/* ------------------------------------------------------------------------------------------------ giri */

const other = (s: Seat): Seat => (s === 0 ? 1 : 0);

function take(deck: string[], n: number): string[] {
  return deck.splice(0, n);
}

/** Prepara le decisioni del giro corrente. Lavora sulla copia che le riceve. */
function openRound(s: DraftState): DraftState {
  if (s.phase === "legendary") {
    if (s.format === "exchange") {
      const n = FORMAT_RULES.exchange.legendaryOffer;
      for (const seat of [0, 1] as Seat[]) s.seats[seat].pending = { kind: "pick", options: take(s.deckLegendary, n) };
    } else {
      s.table = take(s.deckLegendary, FORMAT_RULES[s.format].legendaryShared);
      s.turns = [s.first, other(s.first), other(s.first), s.first];
      s.seats[s.turns[0]].pending = { kind: "pick", options: [...s.table] };
    }
    return s;
  }
  if (s.phase === "main") {
    if (s.format === "exchange") {
      const n = FORMAT_RULES.exchange.offer;
      for (const seat of [0, 1] as Seat[]) s.seats[seat].pending = { kind: "keepGive", options: take(s.deckBase, n) };
    } else if (s.format === "triple") {
      s.table = take(s.deckBase, FORMAT_RULES.triple.offer);
      // chi ha scelto per secondo la prima Leggendaria apre il primo giro, poi si alterna
      const opener: Seat = s.round % 2 === 1 ? other(s.first) : s.first;
      s.turns = [opener, other(opener)];
      s.seats[opener].pending = { kind: "pick", options: [...s.table] };
    } else {
      if (s.packs[0].length === 0 && s.packs[1].length === 0) s.packs = [s.sealed.shift() ?? [], s.sealed.shift() ?? []];
      for (const seat of [0, 1] as Seat[]) s.seats[seat].pending = { kind: "pick", options: [...s.packs[seat]] };
    }
    return s;
  }
  if (s.phase === "build") {
    for (const seat of [0, 1] as Seat[]) s.seats[seat].pending = { kind: "build" };
  }
  return s;
}

/** Il giro è finito: si passa al successivo, alla fase successiva o alla costruzione. */
function closeRound(s: DraftState): DraftState {
  // Scambio: i regali del giro si consegnano adesso, insieme
  for (const seat of [0, 1] as Seat[]) {
    const gift = s.seats[seat].outbox;
    if (!gift) continue;
    const opp = s.seats[other(seat)];
    opp.pool.push(gift);
    opp.received.push(gift);
    s.seats[seat].outbox = null;
  }
  if (s.phase === "legendary") {
    s.phase = "main";
    s.round = 1;
    s.table = [];
    s.turns = [];
    return openRound(s);
  }
  if (s.format === "packs") {
    // la busta torna vuota solo quando tutte e due sono finite: allora si apre il giro successivo
    if (s.packs[0].length || s.packs[1].length) {
      s.packs = [s.packs[1], s.packs[0]];
      return openRound(s);
    }
    if (s.sealed.length === 0) return startBuild(s);
    s.round += 1;
    return openRound(s);
  }
  const rounds = s.format === "exchange" ? FORMAT_RULES.exchange.rounds : FORMAT_RULES.triple.rounds;
  if (s.round >= rounds) return startBuild(s);
  s.round += 1;
  s.table = [];
  s.turns = [];
  return openRound(s);
}

function startBuild(s: DraftState): DraftState {
  s.phase = "build";
  s.round = 1;
  s.table = [];
  s.turns = [];
  s.packs = [[], []];
  return openRound(s);
}

/* ------------------------------------------------------------------------------------------------ mosse */

const clone = (s: DraftState): DraftState => JSON.parse(JSON.stringify(s)) as DraftState;

/** Applica una mossa. Restituisce il nuovo stato oppure l'errore: lo stato di partenza non cambia mai. */
export function applyAction(state: DraftState, action: DraftAction): { state: DraftState } | { error: DraftError } {
  if (state.phase === "done") return { error: "finished" };
  const pending = state.seats[action.seat].pending;
  if (!pending) return { error: "notYourTurn" };
  const s = clone(state);
  const me = s.seats[action.seat];
  const phase = s.phase as "legendary" | "main";

  if (action.type === "build") {
    if (pending.kind !== "build") return { error: "notYourTurn" };
    const cards = [...new Set(action.cards)];
    if (!me.legendaries.includes(action.legendary)) return { error: "badDeck" };
    if (cards.length !== DECK_BASE || cards.length !== action.cards.length) return { error: "badDeck" };
    if (cards.some((c) => !me.pool.includes(c))) return { error: "badDeck" };
    me.deck = { legendary: action.legendary, cards };
    me.pending = null;
    if (s.seats.every((x) => x.deck)) s.phase = "done";
    return { state: s };
  }

  if (action.type === "keepGive") {
    if (pending.kind !== "keepGive") return { error: "notYourTurn" };
    const { keep, give } = action;
    if (!pending.options.includes(keep) || !pending.options.includes(give)) return { error: "badCard" };
    if (keep === give) return { error: "sameCard" };
    const burn = pending.options.find((c) => c !== keep && c !== give) as string;
    me.pool.push(keep);
    me.given.push(give);
    me.outbox = give;
    me.pending = null;
    s.log.push({ seat: action.seat, type: "keepGive", keep, give, burn, phase, round: s.round });
    return { state: s.seats.every((x) => !x.pending) ? closeRound(s) : s };
  }

  // pick
  if (pending.kind !== "pick") return { error: "notYourTurn" };
  if (!pending.options.includes(action.card)) return { error: "badCard" };
  const target = phase === "legendary" ? me.legendaries : me.pool;
  target.push(action.card);
  me.pending = null;
  s.log.push({ seat: action.seat, type: "pick", card: action.card, phase, round: s.round });

  // Scambio, Leggendaria: scelte contemporanee, le altre due si bruciano
  if (s.format === "exchange") {
    for (const c of pending.options) if (c !== action.card) s.log.push({ type: "burn", card: c, phase, round: s.round });
    return { state: s.seats.every((x) => !x.pending) ? closeRound(s) : s };
  }

  // Buste, giro principale: scelte contemporanee dalla busta davanti
  if (s.format === "packs" && phase === "main") {
    s.packs[action.seat] = s.packs[action.seat].filter((c) => c !== action.card);
    return { state: s.seats.every((x) => !x.pending) ? closeRound(s) : s };
  }

  // carte in comune a turni (Tris; Leggendarie di Tris e Buste)
  s.table = s.table.filter((c) => c !== action.card);
  s.turns.shift();
  const next = s.turns[0];
  if (next !== undefined && s.table.length) {
    s.seats[next].pending = { kind: "pick", options: [...s.table] };
    return { state: s };
  }
  for (const c of s.table) s.log.push({ type: "burn", card: c, phase, round: s.round });
  return { state: closeRound(s) };
}

/* ------------------------------------------------------------------------------------------------ cosa vede chi gioca */

/**
 * Quello che un giocatore sa dell'avversario. Nel Tris tutto è sul tavolo; nello Scambio sa solo quello che gli ha
 * regalato (e quello che ha ricevuto da lui); nelle Buste sa solo quante carte ha. Il bot gioca con queste sole
 * informazioni: è forte perché sceglie bene, non perché sbircia.
 */
export function opponentKnowledge(state: DraftState, seat: Seat): { legendaries: string[]; pool: string[]; count: number } {
  const opp = state.seats[other(seat)];
  const me = state.seats[seat];
  if (state.phase === "done") return { legendaries: [...opp.legendaries], pool: [...opp.pool], count: opp.pool.length };
  if (state.format === "triple") return { legendaries: [...opp.legendaries], pool: [...opp.pool], count: opp.pool.length };
  // Buste: le Leggendarie si scelgono a vista dal tavolo
  const legendaries = state.format === "packs" ? [...opp.legendaries] : [];
  const pool = state.format === "exchange" ? [...me.given] : [];
  return { legendaries, pool, count: opp.pool.length };
}

/** Il giro e le carte in gioco per chi guarda: utile all'interfaccia e ai test. */
export function progress(state: DraftState): { phase: DraftState["phase"]; round: number; rounds: number } {
  if (state.phase === "legendary") return { phase: "legendary", round: 1, rounds: 1 };
  if (state.phase === "main") {
    const rounds = state.format === "exchange" ? FORMAT_RULES.exchange.rounds : state.format === "triple" ? FORMAT_RULES.triple.rounds : FORMAT_RULES.packs.packs;
    return { phase: "main", round: state.round, rounds };
  }
  return { phase: state.phase, round: 1, rounds: 1 };
}

/** Il posto che deve muovere adesso, se uno solo (Tris), oppure tutti e due. */
export function waitingFor(state: DraftState): Seat[] {
  return ([0, 1] as Seat[]).filter((s) => state.seats[s].pending);
}
