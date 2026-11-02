/**
 * Test delle illustrazioni alternative della scheda carta (`cardVariants.ts`, `cardVariantLabels.ts`, 02/11/2026): ogni
 * variante ALPHA ha il suo file, il suo credito e una carta del database con la stessa chiave; niente carte non annunciate;
 * le promo del Kickstarter vanno sulla carta giusta; le date e le immagini per la sitemap; i testi nelle sette lingue.
 * `node --test src/lib/cardVariants.test.ts`.
 *
 * I moduli di dati sono scritti per Next (import senza estensione, JSON senza attributi): come in sitemapEntries.test.ts,
 * un piccolo hook di risoluzione dei moduli di Node aggiunge `.ts` agli import relativi e dichiara i JSON.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    const resolved = next(specifier, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const V: typeof import("./cardVariants") = await import("./cardVariants.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("./cardVariantLabels") = await import("./cardVariantLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const C: typeof import("./data/cards") = await import("./data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const CR: typeof import("./data/card-credits") = await import("./data/card-credits.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const K: typeof import("./kickstarterPromos") = await import("./kickstarterPromos.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const D: typeof import("./cardDates") = await import("./cardDates.ts");

const manifest = JSON.parse(readFileSync(new URL("./data/card-variants.json", import.meta.url), "utf8")) as {
  width: number;
  variants: Record<string, { slug: string; w: number; h: number; since: string }>;
};
const publicFile = (p: string) => new URL(`../../public${p}`, import.meta.url);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

describe("varianti ALPHA", () => {
  test("ogni variante del manifest ha il suo credito e ogni credito la sua variante", () => {
    assert.deepEqual(Object.keys(manifest.variants).sort(), Object.keys(CR.variantCredits).sort());
    assert.equal(V.alphaVariants.length, Object.keys(manifest.variants).length);
  });
  test("chiave, carta, file e misure", () => {
    for (const v of V.alphaVariants) {
      assert.match(v.id, /^C\d{5}_[MS][BC]_V000(?:01|1[1-5])$/, v.id);
      const card = C.getCard(v.card);
      assert.ok(card, `${v.id}: carta ${v.card} fuori database`);
      assert.equal(card.key, v.id.slice(0, 9), `${v.id}: la chiave non è quella di ${card.name}`);
      assert.equal(v.image, V.alphaImagePath(v.card, v.code));
      assert.ok(existsSync(publicFile(v.image)), `${v.id}: manca ${v.image}`);
      assert.equal(v.width, manifest.width);
      assert.ok(v.height > 500 && v.height < 760, `${v.id}: altezza ${v.height}`);
      assert.match(v.since, ISO_DAY);
    }
  });
  test("crediti trascritti: illustratore e numero, lo stesso numero della carta base", () => {
    for (const v of V.alphaVariants) {
      assert.ok(v.credit.illus.trim().length > 3, v.id);
      assert.match(v.credit.num ?? "", /^\d{3,4}$/, v.id);
      assert.equal(v.credit.num, CR.cardCredits[v.card]?.num, `${v.id}: numero diverso dalla carta base`);
    }
  });
  test("niente carte non annunciate del pacco creator (Peter Pan, Wukong, Nezha)", () => {
    for (const key of ["C00088_MC", "C00097_MC", "C00189_MC"]) assert.ok(!Object.keys(manifest.variants).some((id) => id.startsWith(key)), key);
  });
});

describe("illustrazioni di una carta", () => {
  test("le promo del Kickstarter sulla loro carta, le varianti ALPHA prima", () => {
    for (const p of K.KICKSTARTER_PROMOS) assert.ok(V.cardAltArts(p.card).promos.includes(p), p.image);
    const alice = V.cardAltArts("alice");
    assert.equal(alice.promos.length, 1);
    assert.equal(V.altArtCount(alice), alice.alpha.length + 1);
    const images = V.cardAltArtImages("alice");
    assert.deepEqual(images, [...alice.alpha.map((v) => v.image), "/media/kickstarter/promos/profile-alice.webp"]);
    // Van Helsing: la scatola e la Golden Slab
    assert.deepEqual(
      V.cardAltArts("van-helsing").promos.map((p) => p.group),
      ["box", "golden"],
    );
  });
  test("una carta senza illustrazioni alternative non ha sezione, immagini né giorno", () => {
    const none = C.cards.find((c) => V.altArtCount(V.cardAltArts(c.slug)) === 0);
    assert.ok(none);
    assert.deepEqual(V.cardAltArtImages(none.slug), []);
    assert.equal(V.cardAltArtDay(none.slug), undefined);
  });
  test("il giorno della scheda è quello dell'ultima illustrazione entrata, e conta nelle date della carta", () => {
    for (const c of C.cards) {
      const arts = V.cardAltArts(c.slug);
      if (!V.altArtCount(arts)) continue;
      const days = [...arts.alpha.map((v) => v.since), ...(arts.promos.length ? [V.CARD_PROMOS_SINCE] : [])];
      const day = V.cardAltArtDay(c.slug);
      assert.equal(day, [...days].sort().at(-1), c.slug);
      assert.ok(D.cardDates(c, "it", []).includes(day), c.slug);
    }
  });
});

describe("testi nelle sette lingue", () => {
  const en = L.cardVariantLabels.en;
  const flat = (o: object, prefix = ""): [string, string][] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : flat(v as object, `${prefix}${k}.`)));
  const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(" ");
  const enFlat = new Map(flat(en));
  test("stesse chiavi, nessun testo vuoto, stessi segnaposto dell'inglese", () => {
    for (const [locale, labels] of Object.entries(L.cardVariantLabels)) {
      const entries = flat(labels);
      assert.deepEqual(entries.map(([k]) => k).sort(), [...enFlat.keys()].sort(), locale);
      for (const [k, v] of entries) {
        assert.ok(v.trim().length > 0, `${locale}.${k}`);
        assert.equal(placeholders(v), placeholders(enFlat.get(k) ?? ""), `${locale}.${k}`);
      }
    }
  });
  test("ancore in minuscolo latino, diverse per lingua", () => {
    const anchors = Object.values(L.cardVariantLabels).map((l) => l.anchor);
    for (const a of anchors) assert.match(a, /^[a-z0-9-]+$/);
    assert.equal(new Set(anchors).size, anchors.length);
  });
  test("francese: spazio insecabile prima di due punti e punto e virgola", () => {
    for (const [k, v] of flat(L.cardVariantLabels.fr)) assert.doesNotMatch(v, / [:;?!]/, `fr.${k}`);
  });
  test("ogni alt dice gioco, illustratore e diritti", () => {
    for (const [locale, l] of Object.entries(L.cardVariantLabels)) {
      for (const alt of [l.altAlpha, l.altPromo]) {
        assert.match(alt, /Origins TCG/, locale);
        assert.match(alt, /\{artist\}/, locale);
        assert.match(alt, /© Koin Games$/, locale);
      }
    }
  });
});
