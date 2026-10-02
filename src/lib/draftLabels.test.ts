/**
 * Test dei testi della pagina /draft (`draftLabels.ts`): `node --test src/lib/draftLabels.test.ts`.
 * Lunghezze SEO come per le altre pagine (title con "Origins TCG" entro 60 caratteri, description 120–158) e regole del
 * sito: niente nome della fonte dell'import, il voto del bot presentato come opinione.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { draftLabels } from "./draftLabels.ts";

const locales = ["en", "it", "es"] as const;

describe("testi del draft", () => {
  for (const l of locales) {
    const x = draftLabels[l];
    test(`${l}: title e description per la SERP`, () => {
      assert.match(x.meta.title, /Origins TCG/);
      assert.ok(x.meta.title.length <= 60, `title di ${x.meta.title.length} caratteri`);
      assert.ok(x.meta.description.length >= 120 && x.meta.description.length <= 158, `description di ${x.meta.description.length} caratteri`);
    });
    test(`${l}: il giudizio è un'opinione del bot, e la fonte dell'import non si nomina`, () => {
      assert.ok(x.result.verdictNote.length > 20);
      const all = JSON.stringify(x).toLowerCase();
      assert.ok(!all.includes("world of origins") && !all.includes("worldoforigins"));
      assert.ok(!/win ?rate/.test(all), "niente win rate: il voto non è un risultato di partite");
    });
    test(`${l}: segnaposto presenti dove servono`, () => {
      assert.match(x.play.round, /\{n\}.*\{total\}/);
      assert.match(x.play.oppPicked, /\{name\}/);
      assert.match(x.play.oppPicked, /\{card\}/);
      assert.match(x.notes.pool, /\{count\}.*\{patch\}/);
    });
  }
});
