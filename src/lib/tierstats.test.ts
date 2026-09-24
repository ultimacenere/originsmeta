/**
 * Test dei numeri della sezione Tier list (`tierstats.ts`) con il runner integrato di Node:
 * `node --test src/lib/tierstats.test.ts`. Come per `tiercode.test.ts`, l'import ha l'estensione `.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMUNITY_MIN_LISTS,
  aggregateLists,
  tierFromAverage,
  usageCounts,
  weightedRating,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./tierstats.ts";

describe("tierFromAverage", () => {
  test("usa le stesse soglie della vista SQL", () => {
    assert.equal(tierFromAverage(5), "S");
    assert.equal(tierFromAverage(4.5), "S");
    assert.equal(tierFromAverage(4.49), "A");
    assert.equal(tierFromAverage(3.5), "A");
    assert.equal(tierFromAverage(2.5), "B");
    assert.equal(tierFromAverage(1.5), "C");
    assert.equal(tierFromAverage(1.49), "D");
  });
});

describe("aggregateLists", () => {
  test("media, voti e distribuzione per carta", () => {
    const out = aggregateLists([
      { entries: { S: ["mulan"], A: ["dracula"] } },
      { entries: { A: ["mulan"], D: ["dracula"] } },
      { entries: { S: ["mulan"] } },
    ]);
    const mulan = out.find((c) => c.slug === "mulan");
    const dracula = out.find((c) => c.slug === "dracula");
    assert.deepEqual(mulan, { slug: "mulan", avg: 4.67, votes: 3, dist: { S: 2, A: 1, B: 0, C: 0, D: 0 }, tier: "S" });
    assert.deepEqual(dracula, { slug: "dracula", avg: 2.5, votes: 2, dist: { S: 0, A: 1, B: 0, C: 0, D: 1 }, tier: "B" });
    assert.equal(out[0].slug, "mulan", "la media più alta viene prima");
  });

  test("ignora chiavi estranee, valori non validi e liste rotte", () => {
    const out = aggregateLists([
      { entries: { S: ["mulan", 3, ""], pool: ["dorothy"], X: ["merlin"] } },
      { entries: null },
      { entries: "S" },
      { entries: { A: "mulan" } },
    ]);
    assert.deepEqual(
      out.map((c) => c.slug),
      ["mulan"],
    );
    assert.equal(out[0].votes, 1);
  });

  test("una carta ripetuta nella stessa lista vota una volta sola, con la fascia più alta", () => {
    const [only] = aggregateLists([{ entries: { B: ["merlin"], S: ["merlin"] } }]);
    assert.equal(only.votes, 1);
    assert.equal(only.avg, 5);
  });

  test("nessuna lista, nessun punteggio", () => {
    assert.deepEqual(aggregateLists([]), []);
  });
});

describe("usageCounts", () => {
  test("conta i mazzi, non le copie, e tiene a parte la Leggendaria", () => {
    const out = usageCounts([
      { legendary: "van-helsing", cards: ["spellbook", "spellbook", "mind-palace"] },
      { legendary: "van-helsing", cards: ["spellbook"] },
      { legendary: null, cards: ["mind-palace"] },
    ]);
    assert.deepEqual(out.legendaries, { "van-helsing": 2 });
    assert.deepEqual(out.cards, { spellbook: 2, "mind-palace": 2 });
  });
});

describe("weightedRating", () => {
  test("un 5 con un voto non passa davanti a un 4,33 con tre voti", () => {
    assert.ok(weightedRating(4.33, 3) > weightedRating(5, 1));
  });
  test("senza voti restituisce il valore di partenza", () => {
    assert.equal(weightedRating(0, 0), 3);
  });
});

test("la soglia della community è 5 liste (decisione del 24/09/2026)", () => {
  assert.equal(COMMUNITY_MIN_LISTS, 5);
});
