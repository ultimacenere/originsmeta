/**
 * Test del Kickstarter della Alpha Edition (26/10/2026): `node --test src/lib/kickstarter.test.ts`.
 * Il link di ogni tasto porta il nostro codice referral; promozione ed etichetta del tasto dipendono dalle date; i testi
 * delle sette lingue hanno la stessa forma dell'inglese, gli stessi segnaposto, la dichiarazione del link referral, la
 * dicitura "non affiliato" e titolo e description nei limiti di Google (regole di `pageTitle` e `cleanDescription` in
 * page.ts, che qui non si importa perché carica Next: come in hubMeta.test.ts).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  KICKSTARTER_PROJECT_URL,
  KICKSTARTER_REF,
  KICKSTARTER_URL,
  PULL_RATES,
  kickstarterLive,
  kickstarterPromoActive,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./kickstarter.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "./kickstarterLabels-en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it } from "./kickstarterLabels-it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "./kickstarterLabels-es.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fr } from "./kickstarterLabels-fr.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { pt } from "./kickstarterLabels-pt.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { de } from "./kickstarterLabels-de.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ru } from "./kickstarterLabels-ru.ts";

const all = { en, it, es, fr, pt, de, ru } as Record<string, unknown>;

/** Le foglie di un oggetto di testi: percorso → stringa (gli array con l'indice). */
function leaves(value: unknown, path = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof value === "string") out.set(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${path}[${i}]`).forEach((s, p) => out.set(p, s)));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k).forEach((s, p) => out.set(p, s));
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("link e date", () => {
  test("il link dei tasti è la campagna con il nostro codice referral", () => {
    assert.equal(KICKSTARTER_URL, `${KICKSTARTER_PROJECT_URL}?ref=${KICKSTARTER_REF}`);
    assert.match(KICKSTARTER_URL, /^https:\/\/www\.kickstarter\.com\/projects\/koingames\/origins-trading-card-game-alpha-edition\?ref=8h9kwh$/);
  });
  test("la promozione senza data di fine resta accesa, con la data si spegne alla fine", () => {
    assert.equal(kickstarterPromoActive(new Date("2027-06-01T00:00:00Z"), null), true);
    assert.equal(kickstarterPromoActive(new Date("2026-11-20T10:00:00Z"), "2026-11-20T12:00:00Z"), true);
    assert.equal(kickstarterPromoActive(new Date("2026-11-20T12:00:00Z"), "2026-11-20T12:00:00Z"), false);
  });
  test("il tasto dice Sostienila dalla mezzanotte del 27 ottobre sulla costa est", () => {
    assert.equal(kickstarterLive(new Date("2026-10-27T03:59:59Z")), false);
    assert.equal(kickstarterLive(new Date("2026-10-27T04:00:00Z")), true);
  });
  test("le probabilità sono in ordine dalla più comune alla più rara", () => {
    const n = PULL_RATES.map((r: { every?: boolean; n?: number }) => (r.every ? 1 : (r.n ?? 0)));
    assert.deepEqual(n, [...n].sort((a, b) => a - b));
    assert.equal(PULL_RATES.at(-1)?.tier, "Storybook");
  });
});

describe("testi nelle sette lingue", () => {
  const base = leaves(en);
  for (const [locale, labels] of Object.entries(all)) {
    test(`${locale}: stessa forma e stessi segnaposto dell'inglese, niente testi vuoti`, () => {
      const mine = leaves(labels);
      assert.deepEqual([...mine.keys()].sort(), [...base.keys()].sort());
      for (const [path, text] of mine) {
        assert.ok(text.trim().length > 0, `${locale} ${path} vuoto`);
        assert.deepEqual(placeholders(text), placeholders(base.get(path) ?? ""), `${locale} ${path}: segnaposto diversi`);
      }
    });
    test(`${locale}: titolo con "Origins TCG" entro 60 caratteri, description fra 120 e 158`, () => {
      const l = labels as typeof en;
      assert.match(l.meta.title, /Origins TCG/);
      assert.ok(l.meta.title.length <= 60, `${locale} titolo di ${l.meta.title.length} caratteri`);
      assert.ok(l.meta.description.length >= 120 && l.meta.description.length <= 158, `${locale} description di ${l.meta.description.length} caratteri`);
    });
    test(`${locale}: la dichiarazione del link referral e la dicitura non ufficiale ci sono`, () => {
      const l = labels as typeof en;
      assert.match(l.disclosure, /OriginsMeta/);
      assert.match(l.disclosure, /Koin Games/);
      assert.match(l.unofficial, /Koin Games/);
      assert.ok(l.stickyNote.length > 0 && l.stickyNote.length <= 60, `${locale} nota della barra troppo lunga`);
      // il nome del sito della community non compare sulle pagine (regola del 25/09/2026)
      for (const text of leaves(labels).values()) assert.doesNotMatch(text, /world ?of ?origins|worldoforigins/i);
    });
  }
});
