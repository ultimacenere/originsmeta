/**
 * Test delle sitemap divise per sezione e lingua (`sitemapEntries.ts`), sui dati veri del sito (carte, news, guide,
 * autori) più una community finta: ogni pagina in una sola sitemap, ogni sitemap sopra le pagine che elenca, carte
 * nella sezione giusta con l'immagine ufficiale, date solo giorno e mai nel futuro, indice senza sitemap vuote, e una
 * route per ogni sezione. `node --test src/lib/sitemapEntries.test.ts`.
 *
 * I moduli di dati sono scritti per Next (import senza estensione, JSON senza attributi): come in cardTitles.test.ts,
 * un piccolo hook di risoluzione dei moduli di Node aggiunge `.ts` agli import relativi e dichiara i JSON.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

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
const mod: typeof import("./sitemapEntries") = await import("./sitemapEntries.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("./data/cards") = await import("./data/cards.ts");
const { EMPTY_COMMUNITY, HOME_SITEMAP_PATH, SITEMAP_SECTIONS, cardSection, homeEntries, sectionEntries, sectionSitemapPath, sitemapIndexEntries, sitemapPages } = mod;
const { cards } = cardsModule;

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];
const SITE = "https://originsmeta.com";
const TODAY = "2026-09-25";
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Una community finta: un mazzo solo in italiano, uno in tre lingue, un torneo, un profilo con una data nel futuro. */
const community = {
  decks: [
    { slug: "solo-italiano-1a2b", updated_at: "2026-09-24T10:00:00+00:00", locales: ["it"] as Locale[] },
    { slug: "tre-lingue-3c4d", updated_at: "2026-09-23T08:00:00+00:00", locales: ["en", "it", "es"] as Locale[] },
  ],
  tournaments: [{ slug: "crimson-cup-om-ab12", updated_at: "2026-09-25T09:00:00+00:00" }],
  profiles: [{ username: "davdas", updated_at: "2026-09-22T12:00:00+00:00" }],
  tierLists: { latest: "2026-09-25T07:00:00+00:00", byUser: { davdas: "2026-09-30T07:00:00+00:00" } },
};

const pages = sitemapPages(community);
const bySection = (section: (typeof SITEMAP_SECTIONS)[number], locale: Locale) => sectionEntries(pages, section, locale, TODAY);

describe("ogni pagina in una sola sitemap", () => {
  test("nessun URL in due sitemap, e tutte le pagine ci sono", () => {
    const all = [...homeEntries(pages, TODAY)];
    for (const l of locales) for (const s of SITEMAP_SECTIONS) all.push(...bySection(s, l));
    const urls = all.map((e) => e.url);
    assert.equal(new Set(urls).size, urls.length);
    const expected = pages.reduce((n, p) => n + (p.locales?.length ?? locales.length), 0);
    assert.equal(urls.length, expected);
  });
  test("le home stanno solo in /sitemap-home.xml, una per lingua", () => {
    assert.deepEqual(
      homeEntries(pages, TODAY).map((e) => e.url),
      locales.map((l) => `${SITE}/${l}`),
    );
    for (const l of locales) for (const s of SITEMAP_SECTIONS) assert.ok(!bySection(s, l).some((e) => e.url === `${SITE}/${l}`));
  });
  test("ogni sitemap di lingua elenca solo pagine dentro la sua cartella (/it/sitemap-x.xml → /it/…)", () => {
    for (const l of locales) {
      for (const s of SITEMAP_SECTIONS) {
        const dir = `${SITE}${sectionSitemapPath(s, l)}`.replace(/[^/]+$/, "");
        assert.equal(dir, `${SITE}/${l}/`);
        for (const e of bySection(s, l)) assert.ok(e.url.startsWith(dir), `${e.url} fuori da ${dir}`);
      }
    }
  });
});

describe("sezioni", () => {
  test("le carte nella sezione del loro tipo: attive, create, non nella demo", () => {
    const count = (s: string) => cards.filter((c) => cardSection(c) === s).length;
    assert.equal(count("cards"), cardsModule.activeCards.length);
    assert.equal(count("cards-created"), cards.filter((c) => c.status === "active" && c.type === "token").length);
    assert.equal(count("cards-removed"), cards.filter((c) => c.status === "removed").length);
    for (const l of locales) {
      assert.equal(bySection("cards", l).length, count("cards"));
      assert.equal(bySection("cards-created", l).length, count("cards-created"));
      assert.equal(bySection("cards-removed", l).length, count("cards-removed"));
    }
    // una Leggendaria non più nella demo sta con le rimosse, una carta creata non sta con le attive
    assert.equal(cardSection({ status: "removed", type: "unit" }), "cards-removed");
    assert.equal(cardSection({ status: "removed", type: "token" }), "cards-removed");
    assert.equal(cardSection({ status: "active", type: "token" }), "cards-created");
    assert.equal(cardSection({ status: "active", type: "spell" }), "cards");
  });
  test("le schede carta portano l'immagine della carta ufficiale, dal nostro dominio", () => {
    const withImage = cards.filter((c) => c.image);
    assert.ok(withImage.length > 100);
    for (const c of withImage) {
      const entry = bySection(cardSection(c), "it").find((e) => e.url === `${SITE}/it/cards/${c.slug}`);
      assert.deepEqual(entry?.images, [`${SITE}${c.image}`]);
    }
  });
  test("solo immagini del nostro dominio, in tutte le sitemap", () => {
    for (const l of locales) for (const s of SITEMAP_SECTIONS) for (const e of bySection(s, l)) for (const img of e.images ?? []) assert.ok(img.startsWith(`${SITE}/`), img);
  });
  test("news e guide con la copertina", () => {
    assert.ok(bySection("news", "en").length > 20);
    assert.ok(bySection("news", "en").every((e) => e.url.startsWith(`${SITE}/en/news/`)));
    assert.ok(bySection("guides", "es").every((e) => e.url.startsWith(`${SITE}/es/guides/`) && (e.images?.length ?? 0) <= 1));
    assert.ok(bySection("news", "it").filter((e) => e.images?.length).length > 20);
  });
  test("un mazzo della community solo nelle lingue in cui la guida si legge", () => {
    const only = (l: Locale) => bySection("decks", l).filter((e) => e.url.endsWith("/decks/community/solo-italiano-1a2b"));
    assert.equal(only("it").length, 1);
    assert.equal(only("en").length, 0);
    assert.equal(only("es").length, 0);
    // hreflang solo verso le versioni indicizzabili; x-default sulla prima lingua disponibile
    assert.deepEqual(only("it")[0].alternates, { it: `${SITE}/it/decks/community/solo-italiano-1a2b`, "x-default": `${SITE}/it/decks/community/solo-italiano-1a2b` });
    assert.equal(bySection("decks", "es").length, 1);
  });
  test("community: profili e tornei", () => {
    assert.deepEqual(
      bySection("community", "en").map((e) => e.url),
      [`${SITE}/en/u/davdas`, `${SITE}/en/tournaments/crimson-cup-om-ab12`],
    );
  });
  test("hreflang completo sulle pagine che esistono in tutte le lingue", () => {
    const faq = bySection("pages", "es").find((e) => e.url === `${SITE}/es/faq`);
    assert.deepEqual(faq?.alternates, { en: `${SITE}/en/faq`, it: `${SITE}/it/faq`, es: `${SITE}/es/faq`, "x-default": `${SITE}/en/faq` });
  });
});

describe("date", () => {
  test("solo il giorno, mai nel futuro, lo spagnolo mai prima del 25/09/2026", () => {
    const all = [...homeEntries(pages, TODAY)];
    for (const l of locales) for (const s of SITEMAP_SECTIONS) all.push(...bySection(s, l));
    for (const e of all) {
      assert.match(e.lastmod ?? "", ISO_DAY, e.url);
      assert.ok((e.lastmod ?? "") <= TODAY, `${e.url} ${e.lastmod}`);
      if (e.url.startsWith(`${SITE}/es`)) assert.ok((e.lastmod ?? "") >= "2026-09-25", e.url);
    }
    // la tier list di davdas porta una data del 30/09: il profilo si ferma a oggi
    assert.equal(bySection("community", "it").find((e) => e.url.endsWith("/u/davdas"))?.lastmod, TODAY);
  });
});

describe("indice", () => {
  test("le home e ogni sezione non vuota, con il giorno della pagina più recente", () => {
    const index = sitemapIndexEntries(pages, TODAY);
    assert.equal(index[0].url, `${SITE}${HOME_SITEMAP_PATH}`);
    assert.equal(index.length, 1 + locales.length * SITEMAP_SECTIONS.length);
    for (const item of index.slice(1)) {
      const [, l, s] = item.url.match(/^https:\/\/originsmeta\.com\/(en|it|es)\/sitemap-([a-z-]+)\.xml$/) ?? [];
      assert.ok(l && s, item.url);
      const days = bySection(s as (typeof SITEMAP_SECTIONS)[number], l as Locale).map((e) => e.lastmod ?? "");
      assert.equal(item.lastmod, days.sort().at(-1));
    }
  });
  test("senza community le sezioni vuote restano fuori dall'indice", () => {
    const index = sitemapIndexEntries(sitemapPages(EMPTY_COMMUNITY), TODAY).map((i) => i.url);
    assert.ok(!index.some((u) => /sitemap-community\.xml$/.test(u)));
    assert.ok(index.includes(`${SITE}/es/sitemap-cards.xml`));
    assert.ok(index.every((u) => u.startsWith(`${SITE}/`)));
  });
});

describe("route", () => {
  const root = new URL("../app/", import.meta.url);
  test("una route per ogni sezione, e nessuna in più", () => {
    for (const s of SITEMAP_SECTIONS) {
      const file = new URL(`[locale]/sitemap-${s}.xml/route.ts`, root);
      assert.ok(existsSync(file), `manca la route di ${s}`);
      assert.match(readFileSync(file, "utf8"), new RegExp(`sectionSitemapResponse\\("${s}"`));
    }
    const folders = readdirSync(new URL("[locale]/", root)).filter((f) => /^sitemap-.*\.xml$/.test(f));
    assert.deepEqual(folders.sort(), SITEMAP_SECTIONS.map((s) => `sitemap-${s}.xml`).sort());
  });
  test("l'indice e le home nella radice; nessuna sitemap.ts di Next che si scontri con /sitemap.xml", () => {
    assert.ok(existsSync(new URL("sitemap.xml/route.ts", root)));
    assert.ok(existsSync(new URL(`${HOME_SITEMAP_PATH.slice(1)}/route.ts`, root)));
    assert.ok(!existsSync(new URL("sitemap.ts", root)));
  });
});
