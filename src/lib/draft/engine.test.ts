/**
 * Test del motore del draft (`engine.ts`) con il runner integrato di Node: `node --test src/lib/draft/engine.test.ts`.
 * Pool finto e drafter banale: qui si controllano le regole dei formati, non il bot (per quello c'è bot.test.ts).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  DECK_BASE,
  DRAFT_FORMATS,
  FORMAT_RULES,
  applyAction,
  cardsNeeded,
  createDraft,
  opponentKnowledge,
  poolSupports,
  waitingFor,
  type DraftAction,
  type DraftCard,
  type DraftFormat,
  type DraftState,
  type Seat,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./engine.ts";

const rarities = ["common", "common", "common", "rare", "rare", "epic"] as const;
const pool: DraftCard[] = [
  ...Array.from({ length: 11 }, (_, i) => ({ slug: `leg-${i}`, legendary: true, rarity: "legendary" as const, mana: 4 })),
  ...Array.from({ length: 111 }, (_, i) => ({ slug: `c-${i}`, legendary: false, rarity: rarities[i % rarities.length], mana: 1 + (i % 7) })),
];

/** Drafter banale: la prima carta, regala la seconda, costruisce con le prime 12. */
function firstChoice(s: DraftState, seat: Seat): DraftAction {
  const p = s.seats[seat].pending!;
  if (p.kind === "build") return { seat, type: "build", legendary: s.seats[seat].legendaries[0], cards: s.seats[seat].pool.slice(0, DECK_BASE) };
  if (p.kind === "keepGive") return { seat, type: "keepGive", keep: p.options[0], give: p.options[1] };
  return { seat, type: "pick", card: p.options[0] };
}

function run(format: DraftFormat, seed: number): DraftState {
  let s = createDraft(format, seed, pool);
  for (let guard = 0; s.phase !== "done"; guard++) {
    assert.ok(guard < 500, "il draft non finisce");
    const seat = waitingFor(s)[0];
    const res = applyAction(s, firstChoice(s, seat));
    assert.ok("state" in res, `mossa rifiutata: ${"error" in res ? res.error : ""}`);
    s = res.state;
  }
  return s;
}

const expectedPool: Record<DraftFormat, { legendaries: number; pool: number }> = {
  exchange: { legendaries: 1, pool: FORMAT_RULES.exchange.rounds * 2 },
  triple: { legendaries: 2, pool: FORMAT_RULES.triple.rounds },
  packs: { legendaries: 2, pool: FORMAT_RULES.packs.packs * FORMAT_RULES.packs.packSize },
};

describe("formati", () => {
  for (const format of DRAFT_FORMATS) {
    test(`${format}: finisce con due mazzi validi e nessuna carta doppia`, () => {
      const s = run(format, 12345);
      for (const seat of s.seats) {
        assert.equal(seat.legendaries.length, expectedPool[format].legendaries);
        assert.equal(seat.pool.length, expectedPool[format].pool);
        assert.ok(seat.deck);
        assert.equal(seat.deck.cards.length, DECK_BASE);
      }
      const all = s.seats.flatMap((x) => [...x.legendaries, ...x.pool]);
      assert.equal(new Set(all).size, all.length, "una carta è finita a tutti e due");
      const burned = s.log.filter((e) => e.type === "burn").map((e) => (e as { card: string }).card);
      assert.ok(burned.every((c) => !all.includes(c)), "una carta bruciata è finita in un pool");
    });
    test(`${format}: stesso seme, stesso draft; seme diverso, draft diverso`, () => {
      assert.deepEqual(run(format, 77), run(format, 77));
      assert.notDeepEqual(run(format, 77).seats[0].pool, run(format, 78).seats[0].pool);
    });
    test(`${format}: il pool vero basta`, () => {
      assert.ok(poolSupports(format, pool));
      assert.ok(cardsNeeded(format).base <= 111);
    });
  }
});

describe("mosse sbagliate", () => {
  test("una carta che non è fra le opzioni, un posto che non deve muovere, tenere e regalare la stessa carta", () => {
    const s = createDraft("exchange", 5, pool);
    assert.deepEqual(applyAction(s, { seat: 0, type: "pick", card: "c-0-inesistente" }), { error: "badCard" });
    const t = createDraft("triple", 5, pool);
    const idle = t.seats[0].pending ? 1 : 0;
    assert.deepEqual(applyAction(t, { seat: idle as Seat, type: "pick", card: t.table[0] }), { error: "notYourTurn" });
    // Scambio, giro principale
    let x = s;
    for (const seat of [0, 1] as Seat[]) x = (applyAction(x, firstChoice(x, seat)) as { state: DraftState }).state;
    const o = x.seats[0].pending!;
    assert.equal(o.kind, "keepGive");
    if (o.kind !== "keepGive") return;
    assert.deepEqual(applyAction(x, { seat: 0, type: "keepGive", keep: o.options[0], give: o.options[0] }), { error: "sameCard" });
  });
  test("costruzione: 11 carte, una carta non del pool, una Leggendaria non propria", () => {
    let s = createDraft("triple", 9, pool);
    while (s.phase !== "build") s = (applyAction(s, firstChoice(s, waitingFor(s)[0])) as { state: DraftState }).state;
    const me = s.seats[0];
    const bad = (a: DraftAction) => assert.deepEqual(applyAction(s, a), { error: "badDeck" });
    bad({ seat: 0, type: "build", legendary: me.legendaries[0], cards: me.pool.slice(0, 11) });
    bad({ seat: 0, type: "build", legendary: me.legendaries[0], cards: [...me.pool.slice(0, 11), s.seats[1].pool[0]] });
    bad({ seat: 0, type: "build", legendary: s.seats[1].legendaries[0], cards: me.pool.slice(0, 12) });
    bad({ seat: 0, type: "build", legendary: me.legendaries[0], cards: [...me.pool.slice(0, 11), me.pool[0]] });
  });
  test("una mossa, rifiutata o accettata, non cambia lo stato di partenza", () => {
    const s = createDraft("packs", 3, pool);
    const before = JSON.stringify(s);
    applyAction(s, { seat: waitingFor(s)[0], type: "pick", card: "nessuna" });
    applyAction(s, firstChoice(s, waitingFor(s)[0]));
    assert.equal(JSON.stringify(s), before);
  });
});

describe("regole dei formati", () => {
  test("Scambio: il regalo arriva all'avversario a fine giro e la terza carta si brucia", () => {
    let s = createDraft("exchange", 21, pool);
    for (const seat of [0, 1] as Seat[]) s = (applyAction(s, firstChoice(s, seat)) as { state: DraftState }).state;
    const [a, b, c] = (s.seats[0].pending as { options: string[] }).options;
    s = (applyAction(s, { seat: 0, type: "keepGive", keep: a, give: b }) as { state: DraftState }).state;
    assert.deepEqual(s.seats[0].pool, [a]);
    // l'avversario non ha ancora scelto: il regalo non gli è ancora arrivato
    assert.deepEqual(s.seats[1].received, []);
    s = (applyAction(s, firstChoice(s, 1)) as { state: DraftState }).state;
    assert.deepEqual(s.seats[1].received, [b]);
    assert.ok(s.seats[1].pool.includes(b));
    assert.ok(!s.seats.some((x) => x.pool.includes(c)));
  });
  test("Tris: chi sceglie per primo si alterna a ogni giro", () => {
    let s = createDraft("triple", 4, pool, 0);
    const openers: Seat[] = [];
    while (s.phase !== "build") {
      if (s.phase === "main" && s.table.length === FORMAT_RULES.triple.offer) openers.push(waitingFor(s)[0]);
      s = (applyAction(s, firstChoice(s, waitingFor(s)[0])) as { state: DraftState }).state;
    }
    assert.equal(openers.length, FORMAT_RULES.triple.rounds);
    openers.forEach((o, i) => assert.equal(o, i % 2 === 0 ? 1 : 0));
  });
  test("Leggendarie a serpentina: A, B, B, A", () => {
    let s = createDraft("packs", 8, pool, 1);
    const order: Seat[] = [];
    while (s.phase === "legendary") {
      const seat = waitingFor(s)[0];
      order.push(seat);
      s = (applyAction(s, firstChoice(s, seat)) as { state: DraftState }).state;
    }
    assert.deepEqual(order, [1, 0, 0, 1]);
  });
  test("Buste: 1 epica, 2 rare e 3 comuni, e le buste si scambiano", () => {
    let s = createDraft("packs", 11, pool);
    while (s.phase === "legendary") s = (applyAction(s, firstChoice(s, waitingFor(s)[0])) as { state: DraftState }).state;
    const rarity = (slug: string) => pool.find((c) => c.slug === slug)!.rarity;
    for (const pack of s.packs) {
      assert.equal(pack.length, FORMAT_RULES.packs.packSize);
      assert.equal(pack.filter((c) => rarity(c) === "epic").length, 1);
      assert.equal(pack.filter((c) => rarity(c) === "rare").length, 2);
    }
    const second = [...s.packs[1]];
    for (const seat of [0, 1] as Seat[]) s = (applyAction(s, firstChoice(s, seat)) as { state: DraftState }).state;
    assert.deepEqual(s.packs[0], second.slice(1));
  });
});

describe("cosa sa chi gioca dell'avversario", () => {
  test("Scambio: solo i regali; Buste: niente; a draft finito tutto", () => {
    let s = createDraft("exchange", 2, pool);
    for (let i = 0; i < 6; i++) s = (applyAction(s, firstChoice(s, waitingFor(s)[0])) as { state: DraftState }).state;
    const k = opponentKnowledge(s, 0);
    assert.deepEqual(k.legendaries, []);
    assert.deepEqual(k.pool, s.seats[0].given);
    let p = createDraft("packs", 2, pool);
    for (let i = 0; i < 8; i++) p = (applyAction(p, firstChoice(p, waitingFor(p)[0])) as { state: DraftState }).state;
    assert.deepEqual(opponentKnowledge(p, 0).pool, []);
    assert.equal(opponentKnowledge(p, 0).legendaries.length, 2);
    const done = run("packs", 2);
    assert.deepEqual(opponentKnowledge(done, 0).pool, done.seats[1].pool);
  });
});
