/**
 * Test del link breve dei creator (`shortLink.ts`): `node --test src/lib/community/shortLink.test.ts`.
 * originsmeta.com/@<nome> → /<lingua>/u/<nome> con gli UTM del creator; il matcher del proxy è quello di src/proxy.ts.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SHORT_LINK_LOCALES,
  shortLinkLabel,
  shortLinkTarget,
  shortLinkUsername,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./shortLink.ts";

const q = (s: string) => new URLSearchParams(s);

describe("link breve dei creator", () => {
  test("nome utente: minuscolo, senza @ o barra finale, solo lettere, cifre e trattini", () => {
    assert.equal(shortLinkUsername("CoachCrono"), "coachcrono");
    assert.equal(shortLinkUsername("coachcrono/"), "coachcrono");
    assert.equal(shortLinkUsername("%40coachcrono"), "coachcrono");
    assert.equal(shortLinkUsername("luigi-davdas-ragoni"), "luigi-davdas-ragoni");
    assert.equal(shortLinkUsername("-coach"), null);
    assert.equal(shortLinkUsername("coach crono"), null);
    assert.equal(shortLinkUsername("../admin"), null);
    assert.equal(shortLinkUsername("%E0%A4%A"), null, "codifica rotta");
    assert.equal(shortLinkUsername(""), null);
    assert.equal(shortLinkUsername("a".repeat(65)), null);
  });
  test("porta al profilo nella lingua scelta, con gli UTM del creator", () => {
    assert.equal(shortLinkTarget("CoachCrono", "it", q("")), "/it/u/coachcrono?utm_source=creator&utm_medium=shortlink&utm_campaign=coachcrono");
    assert.equal(shortLinkTarget("coachcrono", "es", q("")), "/es/u/coachcrono?utm_source=creator&utm_medium=shortlink&utm_campaign=coachcrono");
  });
  test("gli UTM già nel link vincono; gli altri parametri non passano", () => {
    assert.equal(
      shortLinkTarget("coachcrono", "en", q("utm_source=youtube&utm_content=video-12&ref=x&staff=abc")),
      "/en/u/coachcrono?utm_source=youtube&utm_content=video-12&utm_medium=shortlink&utm_campaign=coachcrono",
    );
  });
  test("un nome impossibile porta alla directory dei creator", () => {
    assert.equal(shortLinkTarget("coach crono", "it", q("")), "/it/creators");
  });
  test("etichetta da copiare", () => {
    assert.equal(shortLinkLabel("coachcrono"), "originsmeta.com/@coachcrono");
  });
  test("le lingue sono quelle del sito, e il proxy intercetta /@<nome>", () => {
    const i18n = readFileSync(new URL("../i18n.ts", import.meta.url), "utf8");
    const m = /export const locales = \[([^\]]+)\]/.exec(i18n);
    assert.ok(m);
    assert.deepEqual(
      m[1].split(",").map((s) => s.trim().replace(/"/g, "")),
      [...SHORT_LINK_LOCALES],
    );
    const proxy = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
    assert.match(proxy, /"\/@:name"/, "matcher del link breve in src/proxy.ts");
  });
});
