/**
 * Analytics a sezioni (27/11/2026): `node --test src/lib/tracker/sections.test.ts`.
 * Un hook di risoluzione aggiunge `.ts` agli import, come in tierReplay/replay.test.ts.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // non è un modulo .ts
      }
    }
    return next(specifier, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const sectionsModule: typeof import("./sections") = await import("./sections.ts");
const { toSecPatch, cardsOfLegendary, moveOf, num, phaseOf, listKeyOf, byPrudent } = sectionsModule;

const slug = (k: string) => ({ L1: "leg-a", L2: "leg-b", C1: "c1", C2: "c2", C3: "c3" })[k] ?? null;

describe("toSecPatch", () => {
  const raw = {
    overview: { games: 100, wins: 60, players: 9, withOpponent: 80 },
    lists: [
      { list: "C1,C2,L1", legendary: "L1", games: 10, wins: 7, players: 2 },
      { list: "C1,C3,L1", legendary: "L1", games: 10, wins: 3, players: 2 },
      { list: "C1,XX,L2", legendary: "L2", games: 5, wins: 2, players: 1 },
    ],
    archetypes: [{ archetype: "aggro", games: 40, wins: 20, players: 3 }],
    cards: [{ card: "C1", deck: { games: 50, wins: 30, players: 4 }, played: { games: 40, wins: 25, players: 4, avgTurn: 2.5 } }],
    matchups: [{ legendary: "L1", opponent: "L2", games: 30, wins: 20, players: 5 }],
  };
  const p = toSecPatch("x", raw, slug);

  test("Leggendarie e scontri a due lati, quota sulle presenze", () => {
    assert.equal(p.matchedGames, 30);
    const a = p.legendaries.find((l) => l.slug === "leg-a")!;
    const b = p.legendaries.find((l) => l.slug === "leg-b")!;
    assert.equal(a.wins, 20);
    assert.equal(b.wins, 10);
    assert.equal(a.share + b.share, 1);
    const ab = p.matchups.find((m) => m.a === "leg-a" && m.b === "leg-b")!;
    const ba = p.matchups.find((m) => m.a === "leg-b" && m.b === "leg-a")!;
    assert.equal(ab.wins + ba.wins, 30);
  });

  test("liste con carte sconosciute fuori, Leggendaria tolta dalle 12", () => {
    assert.equal(p.lists.length, 2);
    assert.ok(p.lists.every((l) => !l.cards.includes("leg-a")));
  });

  test("niente giocatori nell'uscita", () => {
    assert.ok(!JSON.stringify(p).includes("players"));
  });

  test("carte: quota sulle partite della patch", () => {
    assert.equal(p.cards[0].deckShare, 0.5);
    assert.equal(p.cards[0].avgTurn, 2.5);
  });

  test("carte di una Leggendaria: quota, con e senza", () => {
    const { games, cards } = cardsOfLegendary(p.lists, "leg-a");
    assert.equal(games, 20);
    const c1 = cards.find((c) => c.slug === "c1")!;
    const c2 = cards.find((c) => c.slug === "c2")!;
    assert.equal(c1.share, 1);
    assert.equal(c1.without, null);
    assert.equal(c2.share, 0.5);
    assert.equal(c2.with.wins, 7);
    assert.equal(c2.without!.wins, 3);
  });
});

describe("spostamenti e fasce", () => {
  test("spostamento netto solo con intervalli che non si toccano", () => {
    const m = moveOf(num(50, 100), num(80, 100))!;
    assert.equal(m.points, 30);
    assert.equal(m.sure, true);
    assert.equal(moveOf(num(5, 10), num(6, 10))!.sure, false);
    assert.equal(moveOf(null, num(1, 2)), null);
  });
  test("round medio in tre fasi", () => {
    assert.equal(phaseOf(2.9), "early");
    assert.equal(phaseOf(5), "mid");
    assert.equal(phaseOf(7.2), "late");
    assert.equal(phaseOf(null), "unseen");
  });
  test("chiave della lista indipendente dall'ordine", () => {
    assert.equal(listKeyOf("a", ["c", "b"]), listKeyOf("a", ["b", "c"]));
  });
  test("caso peggiore davanti", () => {
    const rows = [num(9, 12), num(600, 1000)];
    assert.equal([...rows].sort(byPrudent)[0].games, 1000);
  });
});

describe("testi delle sezioni nelle otto lingue", async () => {
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
  const a: typeof import("../analyticsSectionsLabels") = await import("../analyticsSectionsLabels.ts");
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
  const b: typeof import("../analyticsLegendariesLabels") = await import("../analyticsLegendariesLabels.ts");
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
  const c: typeof import("../analyticsDecksCardsLabels") = await import("../analyticsDecksCardsLabels.ts");
  const flat = (o: unknown, p = ""): [string, string][] =>
    typeof o === "string" ? [[p, o]] : Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flat(v, p ? `${p}.${k}` : k));
  const marks = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
  for (const [file, all] of [
    ["analyticsSectionsLabels", a.analyticsSectionsLabels],
    ["analyticsLegendariesLabels", b.analyticsLegendariesLabels],
    ["analyticsDecksCardsLabels", c.analyticsDecksCardsLabels],
  ] as const) {
    test(`${file}: stesse chiavi, segnaposto e pezzi in ogni lingua`, () => {
      const en = new Map(flat(all.en));
      assert.deepEqual(Object.keys(all).sort(), ["de", "en", "es", "fr", "it", "pt", "ru", "zh-cn"]);
      for (const [loc, labels] of Object.entries(all)) {
        const got = new Map(flat(labels));
        assert.deepEqual([...got.keys()].sort(), [...en.keys()].sort(), `${file} ${loc}: chiavi`);
        for (const [k, v] of en) {
          assert.equal(marks(got.get(k)!), marks(v), `${file} ${loc} ${k}: segnaposto`);
          assert.equal(got.get(k)!.split("|").length, v.split("|").length, `${file} ${loc} ${k}: pezzi`);
          assert.ok(got.get(k)!.trim().length > 0, `${file} ${loc} ${k}: vuoto`);
        }
      }
    });
  }
});
