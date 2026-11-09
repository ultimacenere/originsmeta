/**
 * Tier list di OriginsMeta, le Leggendarie (09/11/2026): `node --test src/lib/tierRule.test.ts`.
 * La regola, le fasce che ne escono e i numeri della Crimson Cup uguali a quelli ufficiali del sito.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    const resolved = next(specifier, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});


// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const rule: typeof import("./tierRule") = await import("./tierRule.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const tl: typeof import("./data/tierlist") = await import("./data/tierlist.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("./data/cards") = await import("./data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cc: typeof import("./crimsonCup") = await import("./crimsonCup.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const ccData: typeof import("./data/crimsonCup") = await import("./data/crimsonCup.ts");
const { ladderTier, legendaryTier, crimsonBoost } = rule;
const { legendaryEvidence, tierList, tierOf } = tl;

describe("regola della tier list", () => {
  test("il ladder: S solo col bordo basso sopra il 50%, poi 50, 45, 40; sotto 100 presenze niente fascia", () => {
    assert.equal(ladderTier(99, 90), "unranked");
    assert.equal(ladderTier(1000, 560), "S");
    assert.equal(ladderTier(100, 52), "A");
    assert.equal(ladderTier(200, 95), "B");
    assert.equal(ladderTier(200, 85), "C");
    assert.equal(ladderTier(200, 70), "D");
  });
  test("la Crimson Cup alza di una fascia solo con ban dal 30% e un finalista, mai sopra la S, mai se la carta è cambiata", () => {
    const e = { slug: "x", games: 200, wins: 85, crimson: { banned: 30, seen: 100, finalists: 1 } };
    assert.equal(legendaryTier(e), "B");
    assert.equal(legendaryTier({ ...e, crimson: { banned: 29, seen: 100, finalists: 1 } }), "C");
    assert.equal(legendaryTier({ ...e, crimson: { banned: 30, seen: 100, finalists: 0 } }), "C");
    assert.equal(legendaryTier({ ...e, changedAfterCrimson: true }), "C");
    assert.equal(legendaryTier({ ...e, games: 1000, wins: 560 }), "S");
    assert.equal(crimsonBoost({ ...e, crimson: null }), false);
  });
});

describe("la prima tier list delle Leggendarie (09/11/2026)", () => {
  test("ogni Leggendaria nel gioco ha i suoi numeri, una volta sola", () => {
    const active = cardsModule.cards.filter((c) => c.legendary && c.status === "active").map((c) => c.slug).sort();
    assert.deepEqual(legendaryEvidence.rows.map((r) => r.slug).sort(), active);
  });
  test("le fasce sono quelle che escono dalla regola", () => {
    const got = Object.fromEntries(legendaryEvidence.rows.map((r) => [r.slug, tierOf("legendaries", r.slug)]));
    assert.deepEqual(got, {
      "three-not-so-little-pigs": "S", dracula: "S", "van-helsing": "S",
      "king-arthur": "A", "legion-of-the-dead": "A",
      mulan: "B",
      "queen-of-hearts": "C", "robin-hood": "C", merlin: "C",
      "dr-frank": "D", dorothy: "D",
      "wicked-stepmother": "unranked",
    });
    assert.equal(tierList.updated, legendaryEvidence.read);
  });
  test("i numeri della Crimson Cup sono quelli ufficiali del sito", () => {
    const sum = new Map<string, { banned: number; seen: number }>();
    for (const q of cc.withStats(ccData.crimsonQualifiers)) for (const r of q.stats.legendaries) {
      const s = sum.get(r.legendary) ?? { banned: 0, seen: 0 };
      sum.set(r.legendary, { banned: s.banned + r.banned, seen: s.seen + r.seen });
    }
    const finals = new Map(cc.finalsLegendaries(ccData.crimsonFinals.finalists).map((f) => [f.legendary, f.players]));
    for (const row of legendaryEvidence.rows) {
      if (!row.crimson) { assert.equal(sum.has(row.slug), false, row.slug); continue; }
      assert.deepEqual({ banned: row.crimson.banned, seen: row.crimson.seen }, sum.get(row.slug), row.slug);
      assert.equal(row.crimson.finalists, finals.get(row.slug) ?? 0, row.slug);
    }
  });
});
