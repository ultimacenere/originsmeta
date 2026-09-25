/**
 * Test dei feed RSS delle news (`newsFeed.ts`) sulle news vere, nelle tre lingue: voci, link, date mai nel futuro,
 * description della news, firma, copertine, etichette del canale con la dicitura "non affiliato a Koin Games".
 * `node --test src/lib/newsFeed.test.ts`. Hook dei moduli come in sitemapEntries.test.ts (import senza estensione).
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

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
const feed: typeof import("./newsFeed") = await import("./newsFeed.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const newsModule: typeof import("./data/news") = await import("./data/news.ts");
const { NEWS_FEED_ITEMS, newsFeedItems, newsFeedLabels, newsFeedPath, newsFeedXml, newsPubDate } = feed;
const { sortedNews } = newsModule;

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];
const NOW = new Date("2026-09-25T15:00:00Z");

describe("etichette", () => {
  test("titolo e descrizione in tutte le lingue, con la dicitura sull'affiliazione", () => {
    const notAffiliated: Record<Locale, RegExp> = { en: /not affiliated with Koin Games/, it: /non affiliato a Koin Games/, es: /no afiliado a Koin Games/ };
    for (const l of locales) {
      assert.ok(newsFeedLabels[l].title.includes("Origins TCG"));
      assert.match(newsFeedLabels[l].description, notAffiliated[l]);
    }
  });
  test("percorso del feed dentro /<lingua>/news/", () => {
    assert.equal(newsFeedPath("es"), "/es/news/feed.xml");
  });
});

describe("date", () => {
  test("mezzogiorno UTC del giorno della news, mai dopo adesso", () => {
    assert.equal(newsPubDate("2026-09-21", NOW).toISOString(), "2026-09-21T12:00:00.000Z");
    assert.equal(newsPubDate("2026-09-25", new Date("2026-09-25T08:00:00Z")).toISOString(), "2026-09-25T08:00:00.000Z");
    assert.equal(newsPubDate("2026-10-01", NOW).toISOString(), NOW.toISOString());
    assert.equal(newsPubDate("non è una data", NOW).toISOString(), NOW.toISOString());
  });
});

describe("voci", () => {
  for (const l of locales) {
    test(`${l}: le news più recenti, con link, description e firma`, () => {
      const items = newsFeedItems(l, NOW);
      assert.equal(items.length, Math.min(NEWS_FEED_ITEMS, sortedNews.length));
      items.forEach((it, i) => {
        const n = sortedNews[i];
        assert.equal(it.link, `https://originsmeta.com/${l}/news/${n.slug}`);
        assert.equal(it.guid, it.link);
        assert.equal(it.title, n.title[l]);
        assert.equal(it.description, n.description[l]);
        assert.ok(it.creator && it.creator.length > 3);
        assert.ok(it.pubDate <= NOW);
        if (i > 0) assert.ok(it.pubDate <= items[i - 1].pubDate);
      });
    });
  }
  test("copertine: le nostre con misure, tutte in https", () => {
    const items = newsFeedItems("it", NOW);
    for (const it of items) {
      assert.ok(it.image, it.link);
      assert.match(it.image?.url ?? "", /^https:\/\//);
      if (it.image?.url.startsWith("https://originsmeta.com/")) assert.ok((it.image.width ?? 0) > 0 && (it.image.height ?? 0) > 0, it.image.url);
    }
  });
});

describe("feed", () => {
  test("RSS completo con il self giusto e una voce per news", () => {
    const xml = newsFeedXml("es", NOW);
    assert.match(xml, /<atom:link href="https:\/\/originsmeta\.com\/es\/news\/feed\.xml" rel="self"/);
    assert.match(xml, /<link>https:\/\/originsmeta\.com\/es\/news<\/link>/);
    assert.match(xml, /<language>es<\/language>/);
    assert.equal(xml.match(/<item>/g)?.length, Math.min(NEWS_FEED_ITEMS, sortedNews.length));
    // nessun carattere di controllo né & non codificata
    assert.doesNotMatch(xml, /&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});
