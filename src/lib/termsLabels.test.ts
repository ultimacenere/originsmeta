/**
 * Test dei termini d'uso (14/10/2026): `node --test src/lib/termsLabels.test.ts`. Le cinque lingue hanno le stesse
 * sezioni con le stesse ancore, la dicitura "non affiliato a Koin Games", nessun nome della fonte dei dati delle carte
 * né un permesso di Koin dichiarato, e il francese ha lo spazio insecabile davanti a : ; ? ! e dentro « ».
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { termsLabels, TERMS_UPDATED } from "./termsLabels.ts";

const locales = ["en", "it", "es", "fr", "pt", "de", "ru"] as const;
const all = (l: (typeof locales)[number]) => {
  const t = termsLabels[l];
  return [t.title, t.description, t.updated, t.intro, t.footer, ...t.sections.flatMap((s: { title: string; body: string[] }) => [s.title, ...s.body])];
};

describe("termini d'uso", () => {
  test("stesse sezioni e ancore nelle cinque lingue", () => {
    const ids = termsLabels.en.sections.map((s: { id: string }) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const l of locales) assert.deepEqual(termsLabels[l].sections.map((s: { id: string }) => s.id), ids, l);
  });

  test("non affiliato a Koin Games, niente fonte dei dati né permesso dichiarato", () => {
    const affiliation = { en: "not affiliated with", it: "non è affiliato a koin games", es: "no está afiliado a koin games", fr: "ni affilié à koin games", pt: "não é afiliado à koin games", de: "nicht mit koin games verbunden", ru: "не связан с koin games" };
    for (const l of locales) {
      const text = all(l).join(" ").toLowerCase();
      assert.ok(text.includes(affiliation[l]), l);
      assert.ok(!/world of origins|worldoforigins/.test(text), l);
      assert.ok(!/permission|permesso|permiso|autoris(é|e) par koin|разрешени/.test(text), l);
    }
  });

  test("description entro 158 caratteri e data dell'aggiornamento", () => {
    assert.match(TERMS_UPDATED, /^\d{4}-\d{2}-\d{2}$/);
    for (const l of locales) {
      const n = termsLabels[l].description.length;
      assert.ok(n >= 100 && n <= 158, `${l}: ${n}`);
      assert.ok(termsLabels[l].updated.includes("2026"), l);
    }
  });

  test("tipografia francese", () => {
    for (const s of all("fr")) {
      assert.ok(!/ [:;?!]/.test(s.replace(/https?:\/\//g, "")), s);
      assert.ok(!/« | »/.test(s), s);
    }
  });
});
