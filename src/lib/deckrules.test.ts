/**
 * Test della regola Conquest (`deckrules.ts`) con il runner integrato di Node:
 * `node --test src/lib/deckrules.test.ts`. Dal 25/09/2026 le carte diverse fra due mazzi si contano come carte
 * uniche (ogni carta una volta, Leggendaria compresa), come chiede la Crimson Cup: almeno 8 fra ogni coppia.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  RULES,
  differentCards,
  maxSharedFor,
  sharedBaseCards,
  validateConquestShared,
  validateConquest,
  type DeckState,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./deckrules.ts";

const base = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
const deck = (legendary: string, cards: string[]): DeckState => ({ name: legendary, legendary, cards, customCards: [] });

describe("differentCards", () => {
  test("due mazzi identici tranne la Leggendaria differiscono di 1 carta unica", () => {
    assert.equal(differentCards(deck("mulan", base), deck("merlin", base)), 1);
  });
  test("le copie non contano: 5 carte base cambiate più la Leggendaria fanno 6", () => {
    const other = [...base.slice(0, 7), "m", "n", "o", "p", "q"];
    assert.equal(differentCards(deck("mulan", base), deck("merlin", other)), 6);
  });
  test("mazzi senza carte in comune differiscono di 13", () => {
    const other = ["m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x"];
    assert.equal(differentCards(deck("mulan", base), deck("merlin", other)), 13);
  });
});

describe("validateConquest", () => {
  test("il minimo predefinito è quello della Crimson Cup", () => {
    assert.equal(RULES.conquestMinDifferent, 8);
  });
  test("al massimo 5 carte in comune: con 5 passa, con 6 no", () => {
    const five = [...base.slice(0, 5), "m", "n", "o", "p", "q", "r", "s"];
    const six = [...base.slice(0, 6), "m", "n", "o", "p", "q", "r"];
    assert.deepEqual(validateConquest([deck("mulan", base), deck("merlin", five)]), []);
    const issues = validateConquest([deck("mulan", base), deck("merlin", six)]);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].code, "tooSimilar");
    assert.equal(issues[0].value, 7);
  });
  test("due mazzi con la stessa Leggendaria non vanno bene", () => {
    const other = ["m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x"];
    assert.equal(validateConquest([deck("mulan", base), deck("mulan", other)])[0].code, "duplicateLegendary");
  });
});

describe("validateConquestShared (deck builder)", () => {
  const five = [...base.slice(0, 5), "m", "n", "o", "p", "q", "r", "s"];
  const six = [...base.slice(0, 6), "m", "n", "o", "p", "q", "r"];
  const rules = { maxShared: maxSharedFor(RULES.conquestMinDifferent), distinctLegendaries: true };
  test("8 carte uniche diverse della Crimson Cup = al massimo 5 carte base in comune", () => {
    assert.equal(maxSharedFor(8), 5);
    assert.equal(maxSharedFor(0), 12);
    assert.equal(maxSharedFor(13), 0);
  });
  test("la Leggendaria non conta fra le carte in comune", () => {
    assert.deepEqual(sharedBaseCards(deck("mulan", base), deck("mulan", five)), base.slice(0, 5));
  });
  test("con 5 carte in comune passa, con 6 no", () => {
    assert.deepEqual(validateConquestShared([deck("mulan", base), deck("merlin", five)], rules), []);
    const issues = validateConquestShared([deck("mulan", base), deck("merlin", six)], rules);
    assert.deepEqual(issues, [{ code: "tooSimilar", decks: [0, 1], value: 6 }]);
  });
  test("con Leggendarie diverse dice lo stesso di validateConquest", () => {
    for (const other of [base, five, six]) {
      const decks = [deck("mulan", base), deck("merlin", other)];
      assert.equal(validateConquestShared(decks, rules).length, validateConquest(decks).length);
    }
  });
  test("la regola delle Leggendarie diverse si può spegnere", () => {
    const decks = [deck("mulan", base), deck("mulan", five)];
    assert.equal(validateConquestShared(decks, rules)[0].code, "duplicateLegendary");
    assert.deepEqual(validateConquestShared(decks, { ...rules, distinctLegendaries: false }), []);
  });
});
