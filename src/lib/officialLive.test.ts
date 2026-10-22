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
const robip = { "robip-origins": { channel: "https://www.twitch.tv/r0bip", viewers: 5, title: "Castiamo il torneo!" } };
const before = Date.parse("2026-10-18T21:59:00Z"); // 18/10 23:59 in Italia
const during = Date.parse("2026-10-20T18:00:00Z");
const lastMinute = Date.parse("2026-10-21T21:59:30Z"); // 21/10 23:59:30 in Italia
const after = Date.parse("2026-10-21T22:00:30Z"); // 22/10 00:00:30 in Italia

describe("diretta in home", () => {
  test("il profilo ufficiale è OriginsTCG e vale sempre, in ogni lingua", () => {
    assert.equal(OFFICIAL_LIVE_USERNAME, "originstcg");
    for (const l of ["en", "it", "es", "fr", "pt", "de", "ru"]) assert.equal(heroLiveOf(official, l, before)?.id, "official", l);
  });
  test("nessuna diretta = lo slider", () => {
    assert.equal(heroLiveOf(null, "it", during), null);
    assert.equal(heroLiveOf({}, "it", during), null);
    assert.equal(heroLiveOf({ someone: { channel: "https://www.twitch.tv/someone", viewers: 2 } }, "it", during), null, "un altro creator non cambia la home");
    assert.equal(heroLiveOf({ vint3n: { channel: "https://www.twitch.tv/vint3n", viewers: 2 } }, "it", Date.parse("2026-10-22T11:00:00Z")), null, "vint3n non cambia la home italiana");
  });
  test("CoachCrono: solo in italiano e solo dal 19 al 21 ottobre, prima di quella ufficiale", () => {
    assert.equal(heroLiveOf(both, "it", during)?.id, "coachcrono");
    assert.equal(heroLiveOf(both, "it", lastMinute)?.id, "coachcrono", "fino a fine 21 ottobre, ora italiana");
    assert.equal(heroLiveOf(both, "it", before)?.id, "official", "prima del 19");
    assert.equal(heroLiveOf(both, "it", after)?.id, "official", "dopo il 21");
    for (const l of ["en", "es", "fr", "pt", "de", "ru"]) assert.equal(heroLiveOf(both, l, during)?.id, "official", `${l}: sempre l'ufficiale`);
    assert.equal(heroLiveOf(coach, "en", during), null, "in inglese il coach da solo non sostituisce lo slider");
  });
  test("se il coach non è in diretta torna quella ufficiale; se nessuna, lo slider", () => {
    assert.equal(heroLiveOf(official, "it", during)?.id, "official");
    assert.equal(heroLiveOf(coach, "it", during)?.id, "coachcrono");
    assert.equal(heroLiveOf({}, "it", during), null);
  });
  test("Robip: secondo in italiano, dopo il coach e prima di quella ufficiale (20/10/2026)", () => {
    assert.equal(heroLiveOf({ ...both, ...robip }, "it", during)?.id, "coachcrono", "il coach resta primo");
    assert.deepEqual(heroLiveOf({ ...official, ...robip }, "it", during), { id: "robip", name: "Robip", channel: "r0bip", viewers: 5, title: "Castiamo il torneo!" });
    assert.equal(heroLiveOf(robip, "it", during)?.id, "robip");
    assert.equal(heroLiveOf({ ...official, ...robip }, "it", after)?.id, "official", "dopo il 21");
    for (const l of ["en", "es", "fr", "pt", "de"]) assert.equal(heroLiveOf({ ...official, ...robip }, l, during)?.id, "official", l);
    assert.equal(heroHeading(officialLiveLabels.it, { id: "robip", name: "Robip" }), "La Crimson Cup in diretta in italiano con Robip");
  });
  test("vint3n: primo in inglese dal 22 al 25 ottobre, prima di quella ufficiale (22/10/2026)", () => {
    const vint3n = { vint3n: { channel: "https://www.twitch.tv/vint3n", viewers: 40, title: "Crimson Cup APAC qualifier" } };
    const apac = Date.parse("2026-10-22T11:00:00Z"); // qualificazione APAC, 19:00 SGT
    const finals = Date.parse("2026-10-25T14:00:00Z"); // finali, 10:00 EDT
    const lastMinute25 = Date.parse("2026-10-26T03:59:30Z"); // 25/10 23:59:30 sulla costa est
    assert.deepEqual(heroLiveOf({ ...official, ...vint3n }, "en", apac), { id: "vint3n", name: "vint3n", channel: "vint3n", viewers: 40, title: "Crimson Cup APAC qualifier" });
    assert.equal(heroLiveOf({ ...official, ...vint3n }, "en", finals)?.id, "vint3n");
    assert.equal(heroLiveOf({ ...official, ...vint3n }, "en", lastMinute25)?.id, "vint3n", "fino a fine 25 ottobre sulla costa est");
    assert.equal(heroLiveOf(vint3n, "en", apac)?.id, "vint3n", "anche senza la diretta ufficiale");
    assert.equal(heroLiveOf({ ...official, ...vint3n }, "en", during)?.id, "official", "prima del 22");
    assert.equal(heroLiveOf({ ...official, ...vint3n }, "en", Date.parse("2026-10-26T04:00:30Z"))?.id, "official", "dopo il 25");
    assert.equal(heroLiveOf(official, "en", apac)?.id, "official", "se vint3n non è in diretta torna quella ufficiale");
    for (const l of ["it", "es", "fr", "pt", "de", "ru"]) assert.equal(heroLiveOf({ ...official, ...vint3n }, l, apac)?.id, "official", l);
    assert.equal(heroHeading(officialLiveLabels.en, { id: "vint3n", name: "vint3n" }), "The Crimson Cup live with vint3n");
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
