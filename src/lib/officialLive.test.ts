/**
 * Test della diretta ufficiale in home (18/10/2026): `node --test src/lib/officialLive.test.ts`.
 * La diretta c'è solo se /api/live ha il profilo OriginsTCG; canale ripulito, spettatori nel formato della lingua, testi
 * con le stesse chiavi e lo stesso segnaposto nelle quattro lingue.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  OFFICIAL_LIVE_USERNAME,
  officialLiveLabels,
  officialLiveOf,
  officialViewersText,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./officialLive.ts";

describe("diretta ufficiale in home", () => {
  test("il profilo è OriginsTCG", () => {
    assert.equal(OFFICIAL_LIVE_USERNAME, "originstcg");
  });
  test("c'è solo se OriginsTCG è in diretta", () => {
    assert.equal(officialLiveOf(null), null);
    assert.equal(officialLiveOf({}), null);
    assert.equal(officialLiveOf({ coachcrono: { channel: "https://www.twitch.tv/coachcrono", viewers: 50 } }), null, "un altro creator in diretta non cambia la home");
    assert.deepEqual(officialLiveOf({ originstcg: { channel: "https://www.twitch.tv/originstcg", viewers: 321, title: "  Crimson Cup day 1  " } }), { channel: "originstcg", viewers: 321, title: "Crimson Cup day 1" });
  });
  test("il canale è l'indirizzo canonico di /api/live; altro = niente diretta; spettatori sporchi = 0", () => {
    assert.equal(officialLiveOf({ originstcg: { channel: "bad/channel", viewers: 1 } }), null);
    assert.equal(officialLiveOf({ originstcg: { channel: "originstcg", viewers: 1 } }), null, "il solo nome non basta: /api/live manda l'indirizzo");
    assert.equal(officialLiveOf({ originstcg: { channel: "https://evil.example/originstcg", viewers: 1 } }), null);
    assert.deepEqual(officialLiveOf({ originstcg: { channel: "https://www.twitch.tv/originstcg", viewers: Number.NaN } }), { channel: "originstcg", viewers: 0, title: null });
  });
  test("spettatori nel formato della lingua", () => {
    assert.equal(officialViewersText(officialLiveLabels.it, 12345, "it"), "12.345 spettatori");
    assert.equal(officialViewersText(officialLiveLabels.en, 1, "en"), "1 viewer");
    assert.equal(officialViewersText(officialLiveLabels.fr, 0, "fr"), null);
  });
  test("stesse chiavi e segnaposto nelle quattro lingue", () => {
    const keys = Object.keys(officialLiveLabels.en).sort();
    for (const l of Object.values(officialLiveLabels)) {
      assert.deepEqual(Object.keys(l).sort(), keys);
      assert.match(l.viewers, /\{n\}/);
    }
  });
});
