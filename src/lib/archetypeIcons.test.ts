/**
 * Simbolini degli archetipi (12/10/2026): `node --test src/lib/archetypeIcons.test.ts`. Ogni archetipo del sito ha
 * un'icona che esiste in public/ e un colore d'accento leggibile come testo sui fondi scuri del sito (AA, 4,5:1).
 */
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ARCHETYPE_ICONS, archetypeIcon, contrastRatio } from "./archetypeIcons.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { archetypeLabels } from "./data/decks.ts";

/* night, night-2, night-3 e felt di globals.css */
const BACKGROUNDS = ["#182238", "#121a2c", "#22304b", "#150c2c"];

test("ogni archetipo del sito ha la sua icona", () => {
  for (const id of Object.keys(archetypeLabels)) assert.ok(archetypeIcon(id), `manca l'icona di ${id}`);
  assert.equal(archetypeIcon("sconosciuto"), null);
  assert.equal(archetypeIcon("toString"), null);
});

test("i file delle icone esistono", () => {
  for (const { src } of Object.values(ARCHETYPE_ICONS)) assert.ok(fs.existsSync(path.join("public", src)), `manca ${src}`);
});

test("colori d'accento con contrasto AA sui fondi scuri", () => {
  for (const [id, { color }] of Object.entries(ARCHETYPE_ICONS)) {
    for (const bg of BACKGROUNDS) assert.ok(contrastRatio(color, bg) >= 4.5, `${id} su ${bg}: ${contrastRatio(color, bg).toFixed(2)}`);
  }
  // colori diversi fra loro
  assert.equal(new Set(Object.values(ARCHETYPE_ICONS).map((a) => a.color)).size, Object.keys(ARCHETYPE_ICONS).length);
});
