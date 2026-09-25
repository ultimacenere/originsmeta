/**
 * Test dei dati strutturati della scheda carta (`jsonld/card.ts`, Ondata 2 del piano SEO/GEO) con il runner integrato
 * di Node: `node --test src/lib/jsonld/card.test.ts`. Controlla la regola della revisione del 25/09/2026: la carta è
 * una sola entità per le tre lingue, quindi il suo nodo deve essere IDENTICO sulle tre pagine, e tutto quello che
 * dipende dalla lingua sta sulla pagina (ItemPage). Più: Koin Games solo per `@id` (mai un oggetto anonimo),
 * l'illustratore come `contributor` dell'immagine e non come autore, niente FAQPage né AggregateRating, ItemList dei
 * mazzi solo quando la pagina ne elenca.
 * Dall'integrazione dell'Ondata 2 jsonld/card.ts prende le entità da jsonld/entities.ts (modulo puro), non più da
 * `JsonLd.tsx`: il test carica i moduli veri, niente modulo finto. I moduli si caricano con l'hook di risoluzione di `cardTitles.test.ts` (`module.registerHooks`, Node ≥ 22.15),
 * che traduce `@/` nella cartella src, aggiunge `.ts` e dichiara i JSON.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../../", import.meta.url);
const SITE = "https://originsmeta.com";
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcUrl).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    const resolved = next(spec, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const ld: typeof import("./card") = await import("./card.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const page: typeof import("../cardPage") = await import("../cardPage.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const synergy: typeof import("../cardSynergy") = await import("../cardSynergy.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("../data/cards") = await import("../data/cards.ts");
const { cardEntityId, cardJsonLd } = ld;
const { cardImageAlt, cardImageSize, cardLdTexts, cardLead, cardStatusLd, fill, kindWord, cardLabels, partsText } = page;
const { cardRelations } = synergy;
const { cards, getCard } = cardsModule;

type Locale = "en" | "it" | "es";
type Json = Record<string, unknown>;
const locales: Locale[] = ["en", "it", "es"];

const card = (slug: string) => {
  const c = getCard(slug);
  assert.ok(c, `carta assente dal database: ${slug}`);
  return c;
};

/** I nodi di una scheda, costruiti come li costruisce la pagina (senza i mazzi, se non si passano). */
function nodes(slug: string, locale: Locale, decks?: { name: string; path: string }[]): Json[] {
  const c = card(slug);
  const rel = cardRelations(c, cards);
  const path = `/${locale}/cards/${c.slug}`;
  return cardJsonLd({
    card: c,
    locale,
    path,
    title: `${c.name} · OriginsMeta`,
    description: `Descrizione di ${c.name} in ${locale}`,
    lead: partsText(cardLead(c, { ...rel }, locale)),
    texts: cardLdTexts(c, false),
    dateModified: locale === "es" ? "2026-09-26" : "2026-09-25",
    crumbs: [
      { name: "OriginsMeta", path: `/${locale}` },
      { name: "Cards", path: `/${locale}/cards` },
      { name: c.name, path },
    ],
    keywords: [kindWord(c, locale)],
    status: cardStatusLd(c, rel),
    image: c.image ? { ...cardImageSize(c), alt: cardImageAlt(c, locale), credit: c.credit?.illus ? fill(cardLabels[locale].creditText, { illus: c.credit.illus }) : "© Koin Games" } : undefined,
    decks: decks ? { title: `Decks with ${c.name}`, items: decks } : undefined,
  });
}

/** Tutti gli oggetti annidati di un nodo, per cercare tipi e campi ovunque. */
function walk(value: unknown, out: Json[] = []): Json[] {
  if (Array.isArray(value)) for (const v of value) walk(v, out);
  else if (value && typeof value === "object") {
    out.push(value as Json);
    for (const v of Object.values(value)) walk(v, out);
  }
  return out;
}

describe("JSON-LD della scheda carta", () => {
  test("una sola entità per carta: stesso @id e stesso nodo, identico, nelle tre lingue", () => {
    for (const slug of ["merlin", "garlic", "baker", "reflection", "spellbook"]) {
      const [en, it, es] = locales.map((l) => nodes(slug, l)[1]);
      assert.equal(en["@id"], cardEntityId(card(slug)), slug);
      assert.equal(JSON.stringify(it), JSON.stringify(en), `${slug} it`);
      assert.equal(JSON.stringify(es), JSON.stringify(en), `${slug} es`);
      // niente campi che dipendono dalla pagina sull'entità comune
      for (const key of ["description", "abstract", "keywords", "dateModified", "mainEntityOfPage", "inLanguage", "url"]) assert.ok(!(key in en), `${slug}: ${key}`);
    }
    assert.equal(cardEntityId(card("merlin")), `${SITE}/#card-${card("merlin").key}`);
  });

  test("la pagina porta la lingua, la frase d'attacco, le parole chiave, la data e punta alla carta", () => {
    const [p, entity] = nodes("merlin", "it");
    assert.equal(p["@type"], "ItemPage");
    assert.equal(p.inLanguage, "it");
    assert.match(String(p.abstract), /^Merlin è un'unità Leggendaria di Origins TCG/);
    assert.equal(p.dateModified, "2026-09-25");
    assert.equal(p.keywords, "unità Leggendaria");
    assert.deepEqual(p.mainEntity, { "@id": entity["@id"] });
    assert.equal((p.breadcrumb as Json)["@id"], `${SITE}/it/cards/merlin#breadcrumb`);
    assert.ok(!("@context" in (p.breadcrumb as Json)));
  });

  test("testi del gioco con la loro lingua: tre per le carte della demo, il solo inglese per create e rimosse", () => {
    const langs = (slug: string) => ((nodes(slug, "es")[1].text as { "@language": string }[] | undefined) ?? []).map((t) => t["@language"]);
    assert.deepEqual(langs("merlin"), ["en", "it", "es"]);
    assert.deepEqual(langs("garlic"), ["en"]);
  });

  test("Koin Games solo per @id, l'illustratore contributor dell'immagine e mai autore", () => {
    for (const l of locales) {
      const all = walk(nodes("merlin", l));
      for (const org of all.filter((o) => o["@type"] === "Organization")) assert.equal(org["@id"], `${SITE}/#koin-games`, l);
      const image = nodes("merlin", l)[0].primaryImageOfPage as Json;
      assert.equal(image["@type"], "ImageObject");
      assert.deepEqual((image.contributor as Json)["@type"], "Person");
      assert.equal((image.contributor as Json).name, card("merlin").credit?.illus);
      assert.equal((image.creator as Json)["@id"], `${SITE}/#koin-games`);
      assert.equal(image.copyrightNotice, "© Koin Games");
      assert.ok(image.width && image.height, "misure da card-art.json");
      // nessuna Person fa da autore della carta o dell'immagine
      for (const o of all) for (const key of ["creator", "author"]) assert.notEqual((o[key] as Json | undefined)?.["@type"], "Person", `${l} ${key}`);
    }
  });

  test("niente FAQPage né AggregateRating; ItemList dei mazzi solo quando la pagina ne elenca, uguale ai relatedLink", () => {
    const types = (list: Json[]) => walk(list).map((o) => o["@type"]);
    const plain = nodes("genie", "en");
    assert.ok(!types(plain).includes("FAQPage"));
    assert.ok(!types(plain).includes("AggregateRating"));
    assert.ok(!types(plain).includes("ItemList"));
    assert.equal(plain.length, 2);
    const decks = [
      { name: "Spellcast", path: "/en/decks/community/spellcast" },
      { name: "Genie Tempo", path: "/en/decks/community/genie-tempo" },
    ];
    const withDecks = nodes("genie", "en", decks);
    const list = withDecks.find((n) => n["@type"] === "ItemList") as Json;
    assert.equal(list["@id"], `${SITE}/en/cards/genie#decks`);
    assert.equal(list.numberOfItems, 2);
    assert.deepEqual(
      (list.itemListElement as Json[]).map((i) => i.url),
      withDecks[0].relatedLink,
    );
  });
});
