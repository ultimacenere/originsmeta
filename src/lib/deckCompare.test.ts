/**
 * Test del confronto fra due mazzi (/decks/compare, 30/09/2026): `node --test src/lib/deckCompare.test.ts`.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcUrl).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(spec, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const C: typeof import("./deckCompare") = await import("./deckCompare.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const R: typeof import("./deckrules") = await import("./deckrules.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("./deckCompareLabels") = await import("./deckCompareLabels.ts");

describe("che cosa ha incollato l'utente", () => {
  test("link e codici", () => {
    assert.deepEqual(C.deckInputKind("https://originsmeta.com/it/decks/community/spellbook-control-547a"), { kind: "community", slug: "spellbook-control-547a" });
    assert.deepEqual(C.deckInputKind("zoo-fba0"), { kind: "community", slug: "zoo-fba0" });
    assert.deepEqual(C.deckInputKind("https://originsmeta.com/en/deck-builder#OM1.abc"), { kind: "om", code: "OM1.abc" });
    assert.deepEqual(C.deckInputKind("  KGBLDCdjF8QzAwMjg1:0a1b2c3d "), { kind: "game", code: "KGBLDCdjF8QzAwMjg1:0a1b2c3d" });
    for (const bad of ["", "ciao", "https://example.com", "/decks/community/../x", "zoo"]) assert.equal(C.deckInputKind(bad).kind, "invalid", bad);
  });
});

describe("codice del gioco", () => {
  test("chiavi → Leggendaria e carte, varianti e sconosciute", () => {
    const pool = [
      { slug: "merlin", key: "C00001_SB", legendary: true },
      { slug: "a", key: "C00010_SB", legendary: false },
      { slug: "b", key: "C00011_SB", legendary: false },
    ];
    const r = C.deckFromKeys(["C00001_SB_V00000", "C00010_SB_V00000", "C00010_SB_V00003", "C00011_SB_V00000", "C00099_SB_V00000"], pool);
    assert.deepEqual(r, { deck: { legendary: "merlin", cards: ["a", "b"] }, unknown: 1 });
  });
});

describe("confronto", () => {
  const base = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
  test("in comune, solo in uno, e carte diverse uguali al Conquest del deck builder", () => {
    const A = { legendary: "mulan", cards: base };
    const B = { legendary: "merlin", cards: [...base.slice(0, 6), "m", "n", "o", "p", "q", "r"] };
    const c = C.compareDecks(A, B);
    assert.deepEqual(c.shared, base.slice(0, 6));
    assert.deepEqual(c.onlyA, base.slice(6));
    assert.equal(c.sameLegendary, false);
    const state = (d: typeof A) => ({ name: "", legendary: d.legendary, cards: d.cards, customCards: [] });
    assert.equal(c.differentA, R.differentCards(state(A), state(B)));
    assert.equal(c.differentB, R.differentCards(state(B), state(A)));
    assert.equal(c.differentA, 7);
  });
  test("stessa Leggendaria non conta fra le diverse", () => {
    const c = C.compareDecks({ legendary: "mulan", cards: base }, { legendary: "mulan", cards: base });
    assert.equal(c.sameLegendary, true);
    assert.equal(c.differentA, 0);
    assert.equal(c.shared.length, 12);
  });
});

describe("etichette", () => {
  const keys = (o: object, p = ""): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" && v ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  test("stesse chiavi e stessi segnaposto in EN, IT, ES", () => {
    const holes = (o: object) => JSON.stringify(o).match(/\{\w+\}/g)?.sort();
    for (const l of ["it", "es"] as const) {
      assert.deepEqual(keys(L.deckCompareLabels[l]), keys(L.deckCompareLabels.en), l);
      assert.deepEqual(holes(L.deckCompareLabels[l]), holes(L.deckCompareLabels.en), l);
    }
  });
});

describe("meta dei tornei (/decks/meta, 30/09/2026)", async () => {
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
  const M: typeof import("./eventMeta") = await import("./eventMeta.ts");
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
  const E: typeof import("./data/eventDecklists") = await import("./data/eventDecklists.ts");
  test("Leggendarie, carte e formazioni contate sulle liste", () => {
    const deck = (leg: string, ...cards: string[]) => [leg, ...cards];
    const m = M.eventMeta([
      { name: "A", placing: "1", decks: [deck("mulan", "x", "y"), deck("merlin", "x"), deck("dracula", "z")] },
      { name: "B", placing: "2", decks: [deck("merlin", "x"), deck("mulan", "y"), deck("dracula")] },
      { name: "C", placing: "3-4", decks: [deck("mulan", "x", "x")] },
    ]);
    assert.equal(m.players, 3);
    assert.equal(m.decks, 7);
    assert.deepEqual(m.legendaries[0], { slug: "mulan", decks: 3, share: 42.9 });
    assert.deepEqual(m.cards[0], { slug: "x", decks: 4, share: 57.1 });
    assert.deepEqual(m.lineups, [{ legendaries: ["dracula", "merlin", "mulan"], players: 2 }]);
  });
  test("le liste usano carte che esistono, con una fonte e il numero giusto di mazzi", () => {
    const woo = JSON.parse(readFileSync(new URL("./data/woo-cards.json", import.meta.url), "utf8"));
    const list = woo.cards as { slug: string }[];
    assert.ok(list.length > 100, "catalogo delle carte letto");
    const slugs = new Set(list.map((c) => c.slug));
    for (const ev of E.eventDecklists) {
      if (ev.players.length) assert.ok(ev.sources.length > 0, `${ev.slug}: liste senza fonte`);
      for (const p of ev.players) {
        assert.equal(p.decks.length, ev.decksPerPlayer, `${ev.slug} ${p.name}: numero di mazzi`);
        for (const d of p.decks) for (const s of d) assert.ok(slugs.has(s), `${ev.slug} ${p.name}: carta sconosciuta ${s}`);
      }
    }
  });
});
