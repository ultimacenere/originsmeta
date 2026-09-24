/**
 * Test della ricerca delle carte (`cardSearch.ts`) con il runner integrato di Node:
 * `node --test src/lib/cardSearch.test.ts`. Come per `tiercode.test.ts`, l'import ha l'estensione `.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
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
