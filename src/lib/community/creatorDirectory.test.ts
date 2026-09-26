/**
 * Test della directory dei creator (`creatorDirectory.ts`): `node --test src/lib/community/creatorDirectory.test.ts`.
 * Ordine dichiarato (lingua della pagina, mazzi, nome), filtri per lingua e piattaforma, chi entra, soglia di
 * indicizzazione.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  CREATORS_MIN_INDEX,
  directoryIndexable,
  filterCreators,
  listedInDirectory,
  orderCreators,
  platformsInUse,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./creatorDirectory.ts";

const list = [
  { name: "Zeta", langs: ["en"], kinds: ["youtube"], decks: 9 },
  { name: "coachcrono", langs: ["it"], kinds: ["twitch", "youtube"], decks: 2 },
  { name: "Alfa", langs: ["it", "es"], kinds: [], decks: 2 },
  { name: "Razor", langs: ["es"], kinds: ["twitch"], decks: 0 },
];

describe("directory dei creator", () => {
  test("prima la lingua della pagina, poi i mazzi, poi il nome", () => {
    assert.deepEqual(
      orderCreators(list, "it").map((c) => c.name),
      ["Alfa", "coachcrono", "Zeta", "Razor"],
    );
    assert.deepEqual(
      orderCreators(list, "es").map((c) => c.name),
      ["Alfa", "Razor", "Zeta", "coachcrono"],
    );
    assert.deepEqual(
      orderCreators(list, "en").map((c) => c.name),
      ["Zeta", "Alfa", "coachcrono", "Razor"],
    );
    assert.equal(list[0].name, "Zeta", "l'elenco passato non cambia");
  });
  test("filtri per lingua e piattaforma", () => {
    assert.deepEqual(
      filterCreators(list, "it", "all").map((c) => c.name),
      ["coachcrono", "Alfa"],
    );
    assert.deepEqual(
      filterCreators(list, "all", "twitch").map((c) => c.name),
      ["coachcrono", "Razor"],
    );
    assert.deepEqual(
      filterCreators(list, "es", "twitch").map((c) => c.name),
      ["Razor"],
    );
    assert.equal(filterCreators(list, "all", "all").length, list.length);
  });
  test("solo le piattaforme usate, nell'ordine dato", () => {
    assert.deepEqual(platformsInUse(list, ["twitch", "youtube", "x", "website"]), ["twitch", "youtube"]);
  });
  test("indicizzata da tre schede in su", () => {
    assert.equal(CREATORS_MIN_INDEX, 3);
    assert.ok(!directoryIndexable(0));
    assert.ok(!directoryIndexable(2));
    assert.ok(directoryIndexable(3));
  });
  test("in directory solo i profili compilati: una bio o almeno un canale", () => {
    assert.ok(listedInDirectory({ bio: "Streamer", links: [] }));
    assert.ok(listedInDirectory({ bio: null, links: [{ kind: "twitch", url: "https://www.twitch.tv/coachcrono" }] }));
    assert.ok(!listedInDirectory({ bio: null, links: [] }), "il solo nome non basta");
    assert.ok(!listedInDirectory({ bio: "   ", links: [] }));
    assert.ok(!listedInDirectory({ bio: undefined, links: [] }));
  });
});
