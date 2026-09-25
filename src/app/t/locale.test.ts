/**
 * Test della lingua dei link brevi dei tornei (`locale.ts`): `node --test src/app/t/locale.test.ts`.
 * Prima lingua del sito nell'Accept-Language, in ordine di preferenza; catalano, galiziano e basco valgono spagnolo.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  LANGUAGE_ALIASES,
  preferredLocale,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/deckrules.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./locale.ts";

const locales = ["en", "it", "es"] as const;
const pick = (header: string | null) => preferredLocale(header, locales, "en", LANGUAGE_ALIASES);

describe("lingua dei link brevi", () => {
  test("la prima lingua del browser, se il sito la parla", () => {
    assert.equal(pick("it-IT,it;q=0.9,en;q=0.8"), "it");
    assert.equal(pick("es-ES,es;q=0.9"), "es");
    assert.equal(pick("es-419,es;q=0.9,en;q=0.8"), "es");
    assert.equal(pick("en-US,en;q=0.9,it;q=0.8"), "en");
  });
  test("catalano, galiziano e basco leggono lo spagnolo", () => {
    assert.equal(pick("ca-ES,ca;q=0.9,es;q=0.8"), "es");
    assert.equal(pick("gl-ES,gl;q=0.9"), "es");
    assert.equal(pick("eu"), "es");
  });
  test("una lingua che il sito non parla lascia il posto alla successiva", () => {
    assert.equal(pick("pt-BR,pt;q=0.9,es;q=0.8,en;q=0.7"), "es");
    assert.equal(pick("de-DE,de;q=0.9,it;q=0.8"), "it");
    assert.equal(pick("fr-FR,fr;q=0.9"), "en");
  });
  test("conta il peso q, non solo l'ordine scritto", () => {
    assert.equal(pick("en;q=0.5,es;q=0.9"), "es");
    assert.equal(pick("it;q=0,en"), "en");
  });
  test("header assente, vuoto o sporco: inglese", () => {
    assert.equal(pick(null), "en");
    assert.equal(pick(""), "en");
    assert.equal(pick("*"), "en");
    assert.equal(pick(" ;q=abc , IT "), "it");
  });
});
