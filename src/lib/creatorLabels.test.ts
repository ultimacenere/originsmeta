/**
 * Test delle etichette dei creator (`creatorLabels.ts`): `node --test src/lib/creatorLabels.test.ts`.
 * Stesse chiavi nelle tre lingue, segnaposto uguali, title e description della directory /creators nelle misure
 * del sito (title con "Origins TCG" entro 60 caratteri, description 120–158). Dal 27/09/2026 anche i ruoli: nei testi
 * si chiamano come nei dizionari (Creator, Autore, Pro, Staff), Influencer non c'è più e chi ha pubblicato un mazzo non
 * si chiama né Creator né Autore (prima la regola era opposta: la parola "creator" era vietata, commit f22e427).
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
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en as dictEn } from "./dictionaries/en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it as dictIt } from "./dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es as dictEs } from "./dictionaries/es.ts";

const dictionaries = { en: dictEn, it: dictIt, es: dictEs } as const;

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
  test("ruoli (27/09/2026): nei testi si chiamano come nei dizionari, Creator uguale nelle tre lingue", () => {
    for (const [locale, l] of Object.entries(creatorLabels)) {
      const badges = dictionaries[locale as keyof typeof dictionaries].community.badges;
      assert.equal(badges.creator, "Creator", `${locale}: il ruolo Creator si chiama così in ogni lingua`);
      for (const key of ["form.intro", "form.channelsHint", "directory.intro", "privacy"]) {
        const text = leaves(l as unknown as Tree).get(key) ?? "";
        for (const role of ["creator", "author", "pro", "staff"] as const) assert.ok(text.includes(badges[role]), `${locale} ${key}: manca il ruolo ${badges[role]}`);
      }
    }
  });
  test("niente Influencer (tolto il 27/09/2026) e niente \"tag autore\" generico: ora Autore è un ruolo", () => {
    for (const [locale, l] of Object.entries(creatorLabels)) {
      for (const [key, text] of leaves(l as unknown as Tree)) {
        assert.doesNotMatch(text, /influencer/i, `${locale} ${key}`);
        assert.doesNotMatch(text, /tag autore|author tag|etiqueta de autor/i, `${locale} ${key}`);
      }
    }
  });
  test("la directory si chiama Creator e autori / Creators and authors / Creadores y autores", () => {
    assert.equal(creatorLabels.it.footer, "Creator e autori");
    assert.equal(creatorLabels.en.footer, "Creators and authors");
    assert.equal(creatorLabels.es.footer, "Creadores y autores");
    for (const [locale, l] of Object.entries(creatorLabels)) {
      assert.ok(l.directory.h1.toLowerCase().includes(l.footer.toLowerCase()), `${locale}: H1 senza il nome della directory`);
      assert.ok(l.directory.metaTitle.toLowerCase().includes(l.footer.toLowerCase()), `${locale}: title senza il nome della directory`);
    }
  });
  test("chi ha pubblicato un mazzo non si chiama né Creator né Autore: Pubblicato da / Published by / Publicado por", () => {
    const expected = { en: ["Published by", "Role"], it: ["Pubblicato da", "Ruolo"], es: ["Publicado por", "Rol"] } as const;
    for (const [locale, d] of Object.entries(dictionaries)) {
      const [publishedBy, role] = expected[locale as keyof typeof expected];
      assert.equal(d.common.publishedBy, publishedBy, locale);
      assert.equal(d.common.filterRole, role, locale);
      assert.doesNotMatch(d.common.publishedBy, /creat|autor|author/i, locale);
      for (const label of Object.values(d.community.badges) as string[]) assert.notEqual(d.common.publishedBy, label, locale);
    }
  });
  test("spagnolo col tú, mai vosotros", () => {
    for (const text of leaves(creatorLabels.es as unknown as Tree).values()) assert.doesNotMatch(text, /\b(vosotros|os|vuestro|vuestra|podéis|tenéis)\b/i, text);
  });
  test("fillCreator sostituisce i segnaposto noti e lascia gli altri", () => {
    assert.equal(fillCreator("In diretta: {viewers} spettatori {x}", { viewers: 12 }), "In diretta: 12 spettatori {x}");
  });
});
