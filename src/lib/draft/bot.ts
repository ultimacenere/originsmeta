/**
 * Il bot del draft, "il Cervello" (02/10/2026; Pierluigi: "abbiamo un cervello di gioco, usiamolo per fare un bot
 * incazzato nero fortissimo"). Gioca solo con quello che saprebbe un giocatore al suo posto (`opponentKnowledge` di
 * engine.ts): nessuna carta nascosta, nessun seme sbirciato. È forte perché:
 *
 * 1. valuta ogni carta con i voti del cervello di gioco (`ratings.ts`) **più** le sinergie con quello che ha già preso
 *    (pacchetti dati/voluti, la Leggendaria pesa di più) **più** i bisogni del mazzo, che contano di più col passare
 *    dei giri: curva (le carte da 2 per il primo round), rimozioni, danno alla barriera, pescate;
 * 2. nega: quando dopo di lui sceglie l'avversario, toglie dal tavolo la carta che all'avversario servirebbe di più se
 *    il prezzo è giusto; nello Scambio regala la carta che all'avversario serve di meno;
 * 3. costruisce il mazzo cercando le 12 migliori del pool insieme (curva, rimozioni, sinergie), non carta per carta.
 *
 * Lo stesso calcolo dà il "giudizio del Cervello" sui due mazzi a fine draft (`deckReport`), con un voto a fasce come la
 * tier list (S, A, B, C, D). È un'opinione del bot e le pagine la presentano così.
 */
import { DECK_BASE, opponentKnowledge, type DraftAction, type DraftCard, type DraftState, type Seat } from "./engine";
import { ratingOf, type Pkg, type Role } from "./ratings";

export type BotCard = DraftCard & { power?: number; health?: number; alignment?: "good" | "evil" | "neutral" };

type Info = { r: number; gives: Set<Pkg>; wants: Set<Pkg>; roles: Set<Role>; mana: number; legendary: boolean; spell: boolean };

export type BotKit = { info: (slug: string) => Info };

/** Prepara i dati del bot dal pool del draft. Alla carta si aggiungono i pacchetti che si leggono dal tipo e dall'allineamento. */
export function botKit(cards: readonly BotCard[]): BotKit {
  const map = new Map<string, Info>();
  for (const c of cards) {
    const rt = ratingOf(c.slug, c);
    const gives = new Set<Pkg>(rt.gives ?? []);
    if (c.spell) gives.add("spell");
    else {
      gives.add("ally");
      if (c.alignment === "good") gives.add("good");
      if (c.alignment === "evil") gives.add("evil");
      if ((c.power ?? 0) >= 5) gives.add("power");
    }
    map.set(c.slug, { r: rt.r, gives, wants: new Set(rt.wants ?? []), roles: new Set(rt.roles ?? []), mana: c.mana ?? 3, legendary: c.legendary, spell: Boolean(c.spell) });
  }
  const unknown: Info = { r: 3, gives: new Set(), wants: new Set(), roles: new Set(), mana: 3, legendary: false, spell: false };
  return { info: (slug) => map.get(slug) ?? unknown };
}

/** Pesi del bot, tarati con la simulazione di bot.test.ts. */
export const TUNING = {
  /** quanto vale togliere una carta all'avversario che sceglie subito dopo (Tris, Leggendarie) */
  table: 0.55,
  /** nelle buste l'avversario vede la busta dopo, ma con una carta in meno */
  pack: 0.3,
  /** nello Scambio il regalo va dritto all'avversario */
  gift: 0.75,
  /** peso della sinergia con il pool e con la Leggendaria */
  synPool: 0.32,
  synLegendary: 0.8,
  /** peso dei bisogni del mazzo a inizio e a fine draft */
  needEarly: 0.3,
  needLate: 0.7,
};

/* ------------------------------------------------------------------------------------------------ valore di una carta */

/** Quante carte con lo stesso pacchetto si danno la mano: a vuole quello che b dà, e viceversa. */
function pair(a: Info, b: Info): number {
  let n = 0;
  for (const p of a.wants) if (b.gives.has(p)) n++;
  for (const p of b.wants) if (a.gives.has(p)) n++;
  return n;
}

/** Saturazione morbida: oltre un certo numero di compagni la sinergia smette di crescere. */
const soft = (x: number, cap: number) => cap * (1 - Math.exp(-x / cap));

/** fasce di costo: ≤1, 2, 3, 4, 5, 6+ e quante carte ne vuole un mazzo da 12 (le carte da 2 per il primo round) */
const bucket = (mana: number) => Math.max(0, Math.min(5, mana - 1));
const CURVE_TARGET = [1, 3, 3, 2, 1.5, 1.5];

export type Ctx = { pool: string[]; legendaries: string[]; /** da 0 a 1: quanto è avanti il draft */ progress: number };

function synergy(kit: BotKit, c: Info, ctx: Ctx): number {
  let s = 0;
  for (const p of ctx.pool) s += TUNING.synPool * pair(c, kit.info(p));
  for (const l of ctx.legendaries) s += TUNING.synLegendary * pair(c, kit.info(l));
  return soft(s, 3.2);
}

function needs(kit: BotKit, c: Info, ctx: Ctx, poolTarget: number): number {
  const w = TUNING.needEarly + TUNING.needLate * ctx.progress;
  const scale = poolTarget / DECK_BASE;
  const counts = [0, 0, 0, 0, 0, 0];
  let removal = 0;
  let barrier = 0;
  let draw = 0;
  for (const p of ctx.pool) {
    const i = kit.info(p);
    counts[bucket(i.mana)]++;
    if (i.roles.has("removal") || i.roles.has("sweeper")) removal++;
    if (i.roles.has("barrier")) barrier++;
    if (i.roles.has("draw")) draw++;
  }
  let n = 0;
  const b = bucket(c.mana);
  const target = CURVE_TARGET[b] * scale;
  if (counts[b] < target) n += 0.7 * Math.min(1, target - counts[b]);
  else if (counts[b] > target + 1) n -= 0.45 * (counts[b] - target - 1);
  if (c.roles.has("removal") || c.roles.has("sweeper")) n += removal < 2 * scale ? 0.9 : removal < 3.5 * scale ? 0.4 : 0;
  if (c.roles.has("barrier")) n += barrier < 2 * scale ? 0.35 : 0;
  if (c.roles.has("draw")) n += draw < 1 * scale ? 0.25 : 0;
  return w * n;
}

/** Valore di una carta base per chi ha già `ctx`. `poolTarget`: quante carte avrà il pool a fine draft. */
export function cardValue(kit: BotKit, slug: string, ctx: Ctx, poolTarget = 18): number {
  const c = kit.info(slug);
  return c.r + synergy(kit, c, ctx) + needs(kit, c, ctx, poolTarget);
}

/** Valore di una Leggendaria in più: la prima conta per intero, una seconda solo per quanto migliora la scelta. */
export function legendaryValue(kit: BotKit, slug: string, ctx: Ctx): number {
  const c = kit.info(slug);
  let fit = 0;
  for (const p of ctx.pool) fit += 0.32 * pair(c, kit.info(p));
  const v = c.r + soft(fit, 2.5);
  if (!ctx.legendaries.length) return v;
  const best = Math.max(...ctx.legendaries.map((l) => legendaryValue(kit, l, { ...ctx, legendaries: [] })));
  return 0.25 * v + Math.max(0, v - best);
}

/* ------------------------------------------------------------------------------------------------ decisioni */



function poolTargetOf(state: DraftState): number {
  return state.format === "exchange" ? 20 : state.format === "triple" ? 16 : 18;
}

function progressOf(state: DraftState, seat: Seat): number {
  return Math.min(1, state.seats[seat].pool.length / poolTargetOf(state));
}

function ctxFor(state: DraftState, seat: Seat): Ctx {
  const me = state.seats[seat];
  return { pool: me.pool, legendaries: me.legendaries, progress: progressOf(state, seat) };
}

function oppCtx(state: DraftState, seat: Seat): Ctx {
  const k = opponentKnowledge(state, seat);
  return { pool: k.pool, legendaries: k.legendaries, progress: Math.min(1, k.count / poolTargetOf(state)) };
}

function valueFor(kit: BotKit, state: DraftState, slug: string, ctx: Ctx): number {
  return kit.info(slug).legendary && state.phase === "legendary" ? legendaryValue(kit, slug, ctx) : cardValue(kit, slug, ctx, poolTargetOf(state));
}

/** La mossa del bot per il posto `seat`. Deterministica: stesso stato, stessa mossa. */
export function botAction(state: DraftState, seat: Seat, kit: BotKit): DraftAction {
  const pending = state.seats[seat].pending;
  if (!pending) throw new Error("botAction: il bot non deve muovere");
  const me = ctxFor(state, seat);
  const opp = oppCtx(state, seat);

  if (pending.kind === "build") {
    const deck = bestDeck(kit, state.seats[seat].legendaries, state.seats[seat].pool);
    return { seat, type: "build", legendary: deck.legendary, cards: deck.cards };
  }

  if (pending.kind === "keepGive") {
    let best: { keep: string; give: string; u: number } | null = null;
    for (const keep of pending.options) {
      for (const give of pending.options) {
        if (give === keep) continue;
        const u = valueFor(kit, state, keep, me) - TUNING.gift * valueFor(kit, state, give, opp);
        if (!best || u > best.u + 1e-9) best = { keep, give, u };
      }
    }
    return { seat, type: "keepGive", keep: best!.keep, give: best!.give };
  }

  // pick: dal tavolo in comune, dalla busta o fra le Leggendarie proprie
  const options = pending.options;
  const shared = state.format !== "exchange" && (state.phase === "legendary" || state.format === "triple");
  const oppNext = shared && state.turns.length > 1 && state.turns[1] !== seat;
  const lambda = state.format === "packs" && state.phase === "main" ? TUNING.pack : TUNING.table;
  const deny = (oppNext || (state.format === "packs" && state.phase === "main")) && options.length > 1;
  let best: { card: string; u: number } | null = null;
  for (const card of options) {
    let u = valueFor(kit, state, card, me);
    if (deny) {
      const rest = options.filter((c) => c !== card);
      u -= lambda * Math.max(...rest.map((c) => valueFor(kit, state, c, opp)));
    }
    if (!best || u > best.u + 1e-9) best = { card, u };
  }
  return { seat, type: "pick", card: best!.card };
}

/* ------------------------------------------------------------------------------------------------ costruzione e giudizio */

export type DeckScore = { score: number; parts: { cards: number; synergy: number; curve: number; roles: number; legendary: number } };

/** Punteggio di un mazzo intero: valore delle carte, sinergie fra tutte, curva e ruoli. */
export function deckScore(kit: BotKit, legendary: string, cards: readonly string[]): DeckScore {
  const infos = cards.map((c) => kit.info(c));
  const L = kit.info(legendary);
  const cardsPart = infos.reduce((a, c) => a + c.r, 0);
  let syn = 0;
  for (let i = 0; i < infos.length; i++) {
    let s = 0.8 * pair(infos[i], L);
    for (let j = 0; j < infos.length; j++) if (j !== i) s += 0.16 * pair(infos[i], infos[j]);
    syn += soft(s, 2.4);
  }
  const counts = [0, 0, 0, 0, 0, 0];
  for (const c of infos) counts[bucket(c.mana)]++;
  let curve = 0;
  counts.forEach((n, i) => {
    const d = n - CURVE_TARGET[i];
    if (Math.abs(d) > 1) curve -= 0.6 * (Math.abs(d) - 1);
  });
  const early = counts[0] + counts[1];
  if (early < 3) curve -= 1.2 * (3 - early);
  const top = counts[5];
  if (top > 3) curve -= 1 * (top - 3);
  let roles = 0;
  const removal = infos.filter((c) => c.roles.has("removal") || c.roles.has("sweeper")).length;
  if (removal < 2) roles -= 1.5 * (2 - removal);
  else roles += Math.min(removal - 2, 2) * 0.4;
  const barrier = infos.filter((c) => c.roles.has("barrier")).length;
  if (barrier >= 2) roles += 0.5;
  const legendaryPart = L.r;
  const score = cardsPart + syn + curve + roles + legendaryPart;
  return { score, parts: { cards: cardsPart, synergy: syn, curve, roles, legendary: legendaryPart } };
}

/** Le 12 carte migliori del pool insieme, per ogni Leggendaria posseduta: avvio goloso, poi scambi finché migliorano. */
export function bestDeck(kit: BotKit, legendaries: readonly string[], pool: readonly string[]): { legendary: string; cards: string[]; score: number } {
  let best: { legendary: string; cards: string[]; score: number } | null = null;
  for (const legendary of legendaries) {
    const sorted = [...pool].sort((a, b) => kit.info(b).r + 0.8 * pair(kit.info(b), kit.info(legendary)) - (kit.info(a).r + 0.8 * pair(kit.info(a), kit.info(legendary))) || a.localeCompare(b));
    let deck = sorted.slice(0, DECK_BASE);
    let score = deckScore(kit, legendary, deck).score;
    let improved = true;
    for (let pass = 0; improved && pass < 40; pass++) {
      improved = false;
      const out = pool.filter((c) => !deck.includes(c));
      for (let i = 0; i < deck.length; i++) {
        for (const cand of out) {
          const next = [...deck];
          next[i] = cand;
          const s = deckScore(kit, legendary, next).score;
          if (s > score + 1e-6) {
            deck = next;
            score = s;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    if (!best || score > best.score) best = { legendary, cards: [...deck].sort(), score };
  }
  if (!best) throw new Error("bestDeck: nessuna Leggendaria");
  return best;
}

export type Grade = "S" | "A" | "B" | "C" | "D";
export type DeckReport = {
  grade: Grade;
  score: number;
  /** carte per fascia di costo: ≤1, 2, 3, 4, 5, 6+ */
  curve: number[];
  removal: number;
  early: number;
  barrier: number;
  draw: number;
  /** i pacchetti che il mazzo usa davvero (almeno 3 carte che si danno la mano), dal più forte */
  packages: Pkg[];
};

/** Soglie del voto, tarate in `bot.test.ts` sui mazzi del bot e su mazzi a caso dello stesso pool. */
export const GRADE_STEPS: [Grade, number][] = [
  ["S", 91],
  ["A", 86],
  ["B", 81],
  ["C", 75],
];

const REPORT_PKGS: Pkg[] = ["discard", "spell", "heal", "move", "reveal", "death", "evil", "good", "wide"];

export function deckReport(kit: BotKit, legendary: string, cards: readonly string[]): DeckReport {
  const { score } = deckScore(kit, legendary, cards);
  const infos = cards.map((c) => kit.info(c));
  const all = [kit.info(legendary), ...infos];
  const curve = [0, 0, 0, 0, 0, 0];
  for (const c of infos) curve[bucket(c.mana)]++;
  const packages = REPORT_PKGS.map((p) => {
    const givers = all.filter((c) => c.gives.has(p)).length;
    const wanters = all.filter((c) => c.wants.has(p)).length;
    return { p, n: wanters ? givers + wanters : 0 };
  })
    .filter((x) => x.n >= 3)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.p)
    .slice(0, 2);
  return {
    grade: GRADE_STEPS.find(([, min]) => score >= min)?.[0] ?? "D",
    score: Math.round(score * 10) / 10,
    curve,
    removal: infos.filter((c) => c.roles.has("removal") || c.roles.has("sweeper")).length,
    early: curve[0] + curve[1],
    barrier: infos.filter((c) => c.roles.has("barrier")).length,
    draw: infos.filter((c) => c.roles.has("draw")).length,
    packages,
  };
}
