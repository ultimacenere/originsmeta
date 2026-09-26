/**
 * Test delle etichette dei creator (`creatorLabels.ts`): `node --test src/lib/creatorLabels.test.ts`.
 * Stesse chiavi nelle tre lingue, segnaposto uguali, title e description della directory /creators nelle misure
 * del sito (title con "Origins TCG" entro 60 caratteri, description 120–158).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  creatorLabels,
  fillCreator,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./creatorLabels.ts";

type Tree = { [key: string]: string | Tree };

/** Tutte le foglie di un oggetto di etichette, come "form.errors.invalid" → testo. */
function leaves(obj: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else for (const [kk, vv] of leaves(v, key)) out.set(kk, vv);
  }
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("etichette dei creator", () => {
  const en = leaves(creatorLabels.en as unknown as Tree);
  for (const locale of ["it", "es"] as const) {
    test(`${locale}: stesse chiavi e stessi segnaposto dell'inglese, nessun testo vuoto`, () => {
      const other = leaves(creatorLabels[locale] as unknown as Tree);
      assert.deepEqual([...other.keys()].sort(), [...en.keys()].sort());
      for (const [key, text] of other) {
        assert.ok(text.trim(), `${locale} ${key} vuota`);
        assert.deepEqual(placeholders(text), placeholders(en.get(key) ?? ""), `${locale} ${key}: segnaposto diversi`);
      }
    });
  }
  test("directory: title con Origins TCG entro 60 caratteri, description 120–158", () => {
    for (const [locale, l] of Object.entries(creatorLabels)) {
      const d = l.directory;
      assert.match(d.metaTitle, /Origins TCG/, `${locale}: metaTitle senza Origins TCG`);
      assert.ok(d.metaTitle.length <= 60, `${locale}: metaTitle di ${d.metaTitle.length} caratteri`);
      assert.ok(d.description.length >= 120 && d.description.length <= 158, `${locale}: description di ${d.description.length} caratteri`);
    }
  });
  test("nessuna etichetta dice \"creator\": si confonderebbe con il tag Autore (commit f22e427)", () => {
    for (const [locale, l] of Object.entries(creatorLabels)) {
      for (const [key, text] of leaves(l as unknown as Tree)) assert.doesNotMatch(text, /\bcreators?\b/i, `${locale} ${key}`);
    }
  });
  test("spagnolo col tú, mai vosotros", () => {
    for (const text of leaves(creatorLabels.es as unknown as Tree).values()) assert.doesNotMatch(text, /\b(vosotros|os|vuestro|vuestra|podéis|tenéis)\b/i, text);
  });
  test("fillCreator sostituisce i segnaposto noti e lascia gli altri", () => {
    assert.equal(fillCreator("In diretta: {viewers} spettatori {x}", { viewers: 12 }), "In diretta: 12 spettatori {x}");
  });
});
