/**
 * Test della diretta in home al posto dello slider (18/10/2026): `node --test src/lib/officialLive.test.ts`.
 * Il canale ufficiale di Origins TCG vale sempre; il cast in italiano di CoachCrono vale solo sulle pagine italiane dal 19
 * al 21 ottobre 2026 (ora italiana) e, quando c'è, viene prima; se non è in diretta torna il canale ufficiale; nessuna
 * diretta = lo slider. Canale nella forma di /api/live, spettatori nel formato della lingua, testi nelle quattro lingue.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  HERO_STREAMS,
  OFFICIAL_LIVE_USERNAME,
  heroHeading,
  heroLiveOf,
  officialLiveLabels,
  officialViewersText,
  streamApplies,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./officialLive.ts";

const official = { originstcg: { channel: "https://www.twitch.tv/originstcg", viewers: 321, title: "  Crimson Cup day 1  " } };
const coach = { coachcrono: { channel: "https://www.twitch.tv/coachcrono", viewers: 34, title: "Cast ITA" } };
const both = { ...official, ...coach };
const before = Date.parse("2026-10-18T21:59:00Z"); // 18/10 23:59 in Italia
const during = Date.parse("2026-10-20T18:00:00Z");
const lastMinute = Date.parse("2026-10-21T21:59:30Z"); // 21/10 23:59:30 in Italia
const after = Date.parse("2026-10-21T22:00:30Z"); // 22/10 00:00:30 in Italia

describe("diretta in home", () => {
  test("il profilo ufficiale è OriginsTCG e vale sempre, in ogni lingua", () => {
    assert.equal(OFFICIAL_LIVE_USERNAME, "originstcg");
    for (const l of ["en", "it", "es", "fr"]) assert.equal(heroLiveOf(official, l, before)?.id, "official", l);
  });
  test("nessuna diretta = lo slider", () => {
    assert.equal(heroLiveOf(null, "it", during), null);
    assert.equal(heroLiveOf({}, "it", during), null);
    assert.equal(heroLiveOf({ vint3n: { channel: "https://www.twitch.tv/vint3n", viewers: 2 } }, "it", during), null, "un altro creator non cambia la home");
  });
  test("CoachCrono: solo in italiano e solo dal 19 al 21 ottobre, prima di quella ufficiale", () => {
    assert.equal(heroLiveOf(both, "it", during)?.id, "coachcrono");
    assert.equal(heroLiveOf(both, "it", lastMinute)?.id, "coachcrono", "fino a fine 21 ottobre, ora italiana");
    assert.equal(heroLiveOf(both, "it", before)?.id, "official", "prima del 19");
    assert.equal(heroLiveOf(both, "it", after)?.id, "official", "dopo il 21");
    for (const l of ["en", "es", "fr"]) assert.equal(heroLiveOf(both, l, during)?.id, "official", `${l}: sempre l'ufficiale`);
    assert.equal(heroLiveOf(coach, "en", during), null, "in inglese il coach da solo non sostituisce lo slider");
  });
  test("se il coach non è in diretta torna quella ufficiale; se nessuna, lo slider", () => {
    assert.equal(heroLiveOf(official, "it", during)?.id, "official");
    assert.equal(heroLiveOf(coach, "it", during)?.id, "coachcrono");
    assert.equal(heroLiveOf({}, "it", during), null);
  });
  test("periodi delle dirette", () => {
    const cast = HERO_STREAMS.find((s: { id: string }) => s.id === "coachcrono");
    assert.ok(cast && streamApplies(cast, "it", during) && !streamApplies(cast, "es", during) && !streamApplies(cast, "it", after));
  });
  test("canale: solo l'indirizzo canonico di /api/live; dati ripuliti", () => {
    assert.deepEqual(heroLiveOf(official, "en", before), { id: "official", name: "Origins TCG", channel: "originstcg", viewers: 321, title: "Crimson Cup day 1" });
    assert.equal(heroLiveOf({ originstcg: { channel: "originstcg", viewers: 1 } }, "en", before), null, "il solo nome non basta");
    assert.equal(heroLiveOf({ originstcg: { channel: "https://evil.example/originstcg", viewers: 1 } }, "en", before), null);
    assert.equal(heroLiveOf({ originstcg: { channel: "https://www.twitch.tv/originstcg", viewers: Number.NaN } }, "en", before)?.viewers, 0);
  });
  test("titoli e spettatori", () => {
    assert.equal(heroHeading(officialLiveLabels.it, { id: "official", name: "Origins TCG" }), "Origins TCG è in diretta su Twitch");
    assert.equal(heroHeading(officialLiveLabels.it, { id: "coachcrono", name: "CoachCrono" }), "La Crimson Cup in diretta in italiano con CoachCrono");
    assert.equal(officialViewersText(officialLiveLabels.it, 12345, "it"), "12.345 spettatori");
    assert.equal(officialViewersText(officialLiveLabels.en, 1, "en"), "1 viewer");
    assert.equal(officialViewersText(officialLiveLabels.fr, 0, "fr"), null);
  });
  test("stesse chiavi e segnaposto nelle quattro lingue", () => {
    const keys = Object.keys(officialLiveLabels.en).sort();
    for (const l of Object.values(officialLiveLabels) as { viewers: string; castHeading: string }[]) {
      assert.deepEqual(Object.keys(l).sort(), keys);
      assert.match(l.viewers, /\{n\}/);
      assert.match(l.castHeading, /\{name\}/);
    }
  });
});
