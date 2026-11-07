/**
 * Test dell'incolla degli screenshot nella stanza partita (`screenshotPaste.ts`, 07/11/2026): `npm test`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { SCREENSHOT_ACCEPT, SCREENSHOT_TYPES, pastedScreenshot } from "./screenshotPaste.ts";

const png = { type: "image/png" };
const gif = { type: "image/gif" };
const pdf = { type: "application/pdf" };

describe("pastedScreenshot", () => {
  test("uno screenshot negli appunti si carica, anche col cursore nella chat", () => {
    assert.deepEqual(pastedScreenshot([png], false, false), { kind: "image", file: png });
    assert.deepEqual(pastedScreenshot([png], false, true), { kind: "image", file: png });
  });

  test("il testo resta testo", () => {
    assert.deepEqual(pastedScreenshot([], true, true), { kind: "none" });
    assert.deepEqual(pastedScreenshot([], true, false), { kind: "none" });
  });

  test("testo e immagine insieme: nella chat vince il testo, fuori dai campi l'immagine", () => {
    assert.deepEqual(pastedScreenshot([png], true, true), { kind: "none" });
    assert.deepEqual(pastedScreenshot([png], true, false), { kind: "image", file: png });
  });

  test("tipi che il selettore non accetta", () => {
    assert.deepEqual(pastedScreenshot([gif], false, false), { kind: "bad" });
    assert.deepEqual(pastedScreenshot([pdf], false, true), { kind: "bad" });
  });

  test("fra più file prende il primo accettato", () => {
    assert.deepEqual(pastedScreenshot([gif, png], false, false), { kind: "image", file: png });
  });
});

test("i tipi coincidono con quelli del bucket in schema.sql", () => {
  const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
  const row = schema.match(/'tournament-screenshots', 'tournament-screenshots', false, \d+, array\[([^\]]+)\]/);
  assert.ok(row, "riga del bucket non trovata");
  const inBucket = row[1].split(",").map((s) => s.trim().replaceAll("'", ""));
  assert.deepEqual([...inBucket].sort(), [...SCREENSHOT_TYPES].sort());
  assert.equal(SCREENSHOT_ACCEPT, "image/jpeg,image/png,image/webp");
});
