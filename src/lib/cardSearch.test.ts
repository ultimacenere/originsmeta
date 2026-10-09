/**
 * Test della ricerca delle carte (`cardSearch.ts`) con il runner integrato di Node:
 * `node --test src/lib/cardSearch.test.ts`. Come per `tiercode.test.ts`, l'import ha l'estensione `.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  matchesPoolFilters,
  poolCost,
  matchesSearch,
  normalizeSearch,
  searchHaystack,
  searchTerms,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./cardSearch.ts";

/** Mulan come arriva al deck builder della pagina italiana: testo in italiano e, per chi gioca in inglese, l'originale. */
const mulan = searchHaystack([
  "Mulan",
  "Ballata di Mulan",
  "Double Attack\nQuando un'abilità On Reveal di un alleato si attiva, ripetila.",
  "Double Attack\nWhen an ally On Reveal ability happens, repeat it.",
]);
const find = (query: string, haystack = mulan) => matchesSearch(haystack, searchTerms(query));

describe("normalizeSearch", () => {
  test("toglie maiuscole, accenti e spazi doppi", () => {
    assert.equal(normalizeSearch("  Abilità  PIÙ\tforte "), "abilita piu forte");
  });
  test("rende dritti gli apostrofi tipografici", () => {
    assert.equal(normalizeSearch("un’abilità"), "un'abilita");
  });
});

describe("searchTerms", () => {
  test("una ricerca vuota non ha parole", () => {
    assert.deepEqual(searchTerms(""), []);
    assert.deepEqual(searchTerms("   "), []);
  });
  test("divide la ricerca in parole normalizzate", () => {
    assert.deepEqual(searchTerms("On  Reveal"), ["on", "reveal"]);
  });
});

describe("matchesSearch", () => {
  test("trova la parola chiave nel testo della carta (il caso del feedback)", () => {
    assert.ok(find("Reveal"));
    assert.ok(find("on reveal"));
    assert.ok(find("REVEAL"));
  });
  test("trova il testo in italiano e in inglese", () => {
    assert.ok(find("ripetila"));
    assert.ok(find("repeat"));
  });
  test("accenti e apostrofi non contano", () => {
    assert.ok(find("abilita"));
    assert.ok(find("un’abilità"));
  });
  test("più parole: servono tutte, in qualunque ordine e in campi diversi", () => {
    assert.ok(find("reveal mulan"));
    assert.ok(find("double reveal"));
    assert.ok(find("ballata attack"));
    assert.equal(find("reveal death"), false);
  });
  test("una parola non si trova a cavallo di due campi", () => {
    const hay = searchHaystack(["Mulan", "Ballata di Mulan"]);
    assert.equal(find("mulanballata", hay), false);
    assert.equal(find("anbal", hay), false);
  });
  test("senza ricerca passano tutte le carte", () => {
    assert.ok(matchesSearch(mulan, []));
    assert.ok(matchesSearch("", []));
  });
  test("i campi mancanti si saltano", () => {
    const hay = searchHaystack(["Baloo", undefined, "Giungla", undefined]);
    assert.equal(hay, "baloo giungla");
    assert.ok(find("baloo", hay));
    assert.equal(find("undefined", hay), false);
  });
});

describe("filtri a pulsanti del deck builder", () => {
  const legend = { type: "unit", legendary: true, mana: 6 };
  const unit = { type: "unit", legendary: false, mana: 2 };
  const spell = { type: "spell", legendary: false, mana: 1 };
  const big = { type: "unit", legendary: false, mana: 10 };
  test("tipo: le Leggendarie a parte, le unità sono quelle base", () => {
    assert.ok(matchesPoolFilters(legend, "legendary", []));
    assert.equal(matchesPoolFilters(unit, "legendary", []), false);
    assert.equal(matchesPoolFilters(legend, "unit", []), false);
    assert.ok(matchesPoolFilters(unit, "unit", []));
    assert.ok(matchesPoolFilters(spell, "spell", []));
    assert.equal(matchesPoolFilters(unit, "spell", []), false);
    for (const c of [legend, unit, spell, big]) assert.ok(matchesPoolFilters(c, "all", []));
  });
  test("costi: più valori insieme, 8 vale da 8 in su, nessuno = tutti", () => {
    assert.ok(matchesPoolFilters(unit, "all", [1, 2]));
    assert.ok(matchesPoolFilters(spell, "all", [1, 2]));
    assert.equal(matchesPoolFilters(legend, "all", [1, 2]), false);
    assert.ok(matchesPoolFilters(big, "all", [8]));
    assert.equal(poolCost(10), 8);
    assert.equal(poolCost(undefined), null);
    assert.equal(matchesPoolFilters({ type: "unit", legendary: false }, "all", [0]), false);
  });
  test("tipo e costo insieme", () => {
    assert.ok(matchesPoolFilters(unit, "unit", [2]));
    assert.equal(matchesPoolFilters(unit, "unit", [3]), false);
  });
});
