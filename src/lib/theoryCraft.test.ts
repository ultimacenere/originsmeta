/**
 * Test del Theory craft (29/10/2026) con il runner integrato di Node: `node --test src/lib/theoryCraft.test.ts`.
 *
 * - Regole (theoryCraft.ts): quali carte aggiunge (le rimosse, mai le create), quando un mazzo è theory craft, divisione
 *   fra mazzi del gioco e theory craft, builder che apre il mazzo.
 * - Controllo dei mazzi sul server (`checkDeck` di community/util.ts): le carte non ancora nel gioco passano solo con
 *   `theory`, le create mai.
 * - Pool del builder e del modulo di pubblicazione (builderLabels.ts) e codice del gioco (deckGameCode.ts): le carte non
 *   ancora nel gioco non hanno la chiave del gioco, quindi un mazzo che le usa non ha codice.
 * - Etichette nelle sette lingue (theoryCraftLabels.ts) e voci del menu nei dizionari.
 *
 * Un hook di risoluzione aggiunge `.ts` agli import, traduce l'alias `@/` e dichiara i JSON, come in deckSets.test.ts e
 * cardPage.test.ts.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
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
    const resolved = next(spec, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const T: typeof import("./theoryCraft") = await import("./theoryCraft.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const C: typeof import("./data/cards") = await import("./data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const U: typeof import("./community/util") = await import("./community/util.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const B: typeof import("./builderLabels") = await import("./builderLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const G: typeof import("./deckGameCode") = await import("./deckGameCode.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("./theoryCraftLabels") = await import("./theoryCraftLabels.ts");

const { cards, activeCards } = C;
const active = activeCards.filter((c) => !c.legendary);
const activeLegendary = activeCards.find((c) => c.legendary)!;
const theoryUnits = T.theoryCards.filter((c) => !c.legendary);
const theoryLegendary = T.theoryCards.find((c) => c.legendary)!;
const token = cards.find((c) => c.type === "token")!;
const deck = (legendary: string, list: string[]) => ({ name: "Test", legendary, cards: list, customCards: [] });
const twelve = active.slice(0, 12).map((c) => c.slug);

describe("carte del Theory craft", () => {
  test("sono le carte rimosse dal gioco, senza le carte create", () => {
    const removed = cards.filter((c) => c.status === "removed" && c.type !== "token");
    assert.ok(T.theoryCards.length > 0);
    assert.deepEqual(
      T.theoryCards.map((c) => c.slug),
      removed.map((c) => c.slug),
    );
    for (const c of T.theoryCards) assert.notEqual(c.type, "token", c.slug);
  });
  test("nessuna carta del gioco è theory craft, ogni rimossa sì", () => {
    for (const c of activeCards) assert.equal(T.isTheoryCard(c.slug), false, c.slug);
    for (const c of T.theoryCards) assert.equal(T.isTheoryCard(c.slug), true, c.slug);
    assert.equal(T.isTheoryCard(token.slug), false);
    assert.equal(T.isTheoryCard(null), false);
    assert.equal(T.isTheoryCard("custom:qualcosa"), false);
  });
  test("ogni carta del Theory craft ha almeno il costo, per curva e filtri del builder", () => {
    for (const c of T.theoryCards) assert.equal(typeof c.mana, "number", c.slug);
  });
});

describe("mazzi theory craft", () => {
  const official = deck(activeLegendary.slug, twelve);
  const withTheoryCard = deck(activeLegendary.slug, [...twelve.slice(0, 11), theoryUnits[0].slug]);
  const withTheoryLegendary = deck(theoryLegendary.slug, twelve);
  test("un mazzo è theory craft quando usa almeno una carta non ancora nel gioco", () => {
    assert.equal(T.isTheoryDeck(official), false);
    assert.equal(T.isTheoryDeck(withTheoryCard), true);
    assert.equal(T.isTheoryDeck(withTheoryLegendary), true);
    assert.equal(T.isTheoryDeck({ legendary: null, cards: null }), false);
  });
  test("carte non ancora nel gioco: Leggendaria per prima, ognuna una volta", () => {
    const both = deck(theoryLegendary.slug, [theoryUnits[1].slug, ...twelve.slice(0, 10), theoryUnits[1].slug]);
    assert.deepEqual(T.theorySlugsOf(both), [theoryLegendary.slug, theoryUnits[1].slug]);
    assert.deepEqual(T.theoryNamesOf(both), [theoryLegendary.name, theoryUnits[1].name]);
  });
  test("divisione e filtro tengono l'ordine", () => {
    const all = [withTheoryCard, official, withTheoryLegendary];
    assert.deepEqual(T.splitTheory(all), { official: [official], theory: [withTheoryCard, withTheoryLegendary] });
    assert.deepEqual(T.officialDecks(all), [official]);
  });
  test("il builder che apre il mazzo", () => {
    assert.equal(T.builderPathFor(official), "/deck-builder");
    assert.equal(T.builderPathFor(withTheoryCard), T.THEORY_PATH);
    assert.equal(T.THEORY_PATH, "/theory-craft");
    assert.equal(T.THEORY_DECKS_PATH, "/theory-craft/decks");
  });
});

describe("checkDeck", () => {
  test("le carte non ancora nel gioco passano solo con theory", () => {
    assert.equal(U.checkDeck(deck(activeLegendary.slug, twelve)).ok, true);
    const withCard = deck(activeLegendary.slug, [...twelve.slice(0, 11), theoryUnits[0].slug]);
    assert.equal(U.checkDeck(withCard).ok, false);
    assert.equal(U.checkDeck(withCard, { theory: true }).ok, true);
    const withLegendary = deck(theoryLegendary.slug, twelve);
    assert.equal(U.checkDeck(withLegendary).ok, false);
    assert.equal(U.checkDeck(withLegendary, { theory: true }).ok, true);
  });
  test("una Leggendaria rimossa resta Leggendaria: non entra fra le dodici carte", () => {
    assert.equal(U.checkDeck(deck(activeLegendary.slug, [...twelve.slice(0, 11), theoryLegendary.slug]), { theory: true }).ok, false);
  });
  test("le carte create non entrano mai, nemmeno nel Theory craft", () => {
    assert.equal(U.checkDeck(deck(activeLegendary.slug, [...twelve.slice(0, 11), token.slug]), { theory: true }).ok, false);
  });
});

describe("pool e codice del gioco", () => {
  test("pool del Theory craft: carte del gioco con la chiave, le altre segnate e senza chiave", () => {
    const plain = B.builderPool("en");
    const theory = B.builderPool("en", undefined, { theory: true });
    assert.equal(plain.some((c) => c.theory), false);
    assert.equal(theory.length, plain.length + T.theoryCards.length);
    for (const c of theory) {
      if (T.isTheoryCard(c.slug)) {
        assert.equal(c.theory, true, c.slug);
        assert.equal(c.key, undefined, c.slug);
      } else assert.equal(c.theory, undefined, c.slug);
    }
  });
  test("pool del modulo di pubblicazione: anche le carte del Theory craft, senza chiave", () => {
    const pool = B.publishPool();
    assert.equal(pool.length, activeCards.length + T.theoryCards.length);
    for (const c of pool) {
      if (T.isTheoryCard(c.slug)) assert.deepEqual([c.theory, c.key], [true, undefined], c.slug);
      else assert.equal(c.theory, undefined, c.slug);
    }
  });
  test("niente codice del gioco per un mazzo theory craft", async () => {
    const withKeys = active.filter((c) => c.key).slice(0, 12).map((c) => c.slug);
    const leg = activeCards.find((c) => c.legendary && c.key)!;
    const official = await G.deckGameCode({ legendary: leg.slug, cards: withKeys });
    assert.ok(official.code?.startsWith("KGBLDC"));
    const theoryCard = theoryUnits.find((c) => c.key)!;
    const theory = await G.deckGameCode({ legendary: leg.slug, cards: [...withKeys.slice(0, 11), theoryCard.slug] });
    assert.deepEqual(theory, { code: null, missing: 1 });
  });
});

describe("etichette", () => {
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const flat = (o: object, prefix = ""): [string, string][] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : flat(v as object, `${prefix}${k}.`)));
  const en = new Map(flat(L.theoryCraftLabels.en));
  test("stesse chiavi e stessi segnaposto nelle sette lingue", () => {
    for (const [locale, labels] of Object.entries(L.theoryCraftLabels)) {
      const map = new Map(flat(labels));
      assert.deepEqual([...map.keys()].sort(), [...en.keys()].sort(), locale);
      for (const [k, v] of map) {
        assert.ok(v.trim(), `${locale} ${k} vuota`);
        assert.deepEqual(placeholders(v), placeholders(en.get(k)!), `${locale} ${k}`);
      }
    }
  });
  test("title con Origins TCG entro 60 caratteri, description fra 120 e 158", () => {
    for (const [locale, labels] of Object.entries(L.theoryCraftLabels)) {
      for (const page of [labels.builder, labels.decks]) {
        assert.ok(page.metaTitle.includes("Origins TCG"), `${locale} ${page.metaTitle}`);
        assert.ok(page.metaTitle.length <= 60, `${locale} ${page.metaTitle} (${page.metaTitle.length})`);
        assert.ok(page.description.length >= 120 && page.description.length <= 158, `${locale} description (${page.description.length}): ${page.description}`);
      }
    }
  });
  test("francese: spazio insecabile prima di : ; ? ! e dentro « »", () => {
    for (const [k, v] of flat(L.theoryCraftLabels.fr)) {
      assert.doesNotMatch(v, / [:;?!]/, `fr ${k}`);
      assert.doesNotMatch(v, /« | »/, `fr ${k}`);
    }
  });
  test("le voci del menu ci sono in ogni dizionario", () => {
    for (const locale of Object.keys(L.theoryCraftLabels)) {
      const dict = readFileSync(new URL(`./dictionaries/${locale}.ts`, import.meta.url), "utf8");
      assert.match(dict, /\n {4}theoryCraft: "[^"]+",/, locale);
      assert.match(dict, /\n {4}theoryDecks: "[^"]+",/, locale);
    }
  });
});
