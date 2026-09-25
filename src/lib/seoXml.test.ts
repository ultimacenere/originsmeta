/**
 * Test dell'XML per motori e lettori di feed (`seoXml.ts`): sitemap con hreflang e immagini, indice, feed RSS.
 * `node --test src/lib/seoXml.test.ts`. Nessun parser XML fra le dipendenze: si controllano struttura e caratteri
 * speciali con le espressioni regolari, e che ogni elemento aperto sia chiuso.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { escapeXml, imageMime, rfc822, rssXml, sitemapIndexXml, urlsetXml } from "./seoXml.ts";

/** Gli elementi aperti e chiusi si bilanciano (tag autochiusi a parte). */
function balanced(xml: string): boolean {
  const stack: string[] = [];
  for (const m of xml.matchAll(/<(\/?)([a-zA-Z][\w:.-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, self] = m;
    if (self) continue;
    if (closing) {
      if (stack.pop() !== name) return false;
    } else stack.push(name);
  }
  return stack.length === 0;
}

describe("escapeXml", () => {
  test("i cinque caratteri speciali", () => {
    assert.equal(escapeXml(`a & b < c > d "e" 'f'`), "a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;");
    assert.equal(escapeXml("Mulan · Leggendaria"), "Mulan · Leggendaria");
  });
});

describe("sitemap", () => {
  const xml = urlsetXml([
    {
      url: "https://originsmeta.com/it/cards/mulan",
      lastmod: "2026-09-25",
      alternates: { en: "https://originsmeta.com/en/cards/mulan", it: "https://originsmeta.com/it/cards/mulan", "x-default": "https://originsmeta.com/en/cards/mulan" },
      images: ["https://originsmeta.com/cards/mulan.webp"],
    },
    { url: "https://originsmeta.com/it/faq?a=1&b=2" },
  ]);
  test("intestazione, namespace e bilanciamento", () => {
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset /);
    assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
    assert.match(xml, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
    assert.match(xml, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
    assert.ok(balanced(xml));
  });
  test("loc, lastmod, hreflang e immagini nell'ordine dello schema", () => {
    const first = xml.slice(xml.indexOf("<url>"), xml.indexOf("</url>"));
    const order = ["<loc>", "<lastmod>", "<xhtml:link", "<image:image>"].map((t) => first.indexOf(t));
    assert.ok(order.every((i) => i > 0));
    assert.deepEqual([...order].sort((a, b) => a - b), order);
    assert.match(first, /<xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/originsmeta\.com\/en\/cards\/mulan"\/>/);
    assert.match(first, /<image:image><image:loc>https:\/\/originsmeta\.com\/cards\/mulan\.webp<\/image:loc><\/image:image>/);
  });
  test("niente changefreq né priority (Google li ignora), niente campi immagine deprecati", () => {
    assert.doesNotMatch(xml, /changefreq|priority|image:title|image:caption/);
  });
  test("una & nell'URL diventa &amp;", () => {
    assert.match(xml, /<loc>https:\/\/originsmeta\.com\/it\/faq\?a=1&amp;b=2<\/loc>/);
  });
  test("al massimo 1.000 immagini per pagina", () => {
    const many = urlsetXml([{ url: "https://originsmeta.com/en", images: Array.from({ length: 1005 }, (_, i) => `https://originsmeta.com/${i}.webp`) }]);
    assert.equal(many.match(/<image:image>/g)?.length, 1000);
  });
  test("sitemap vuota ma valida", () => {
    const empty = urlsetXml([]);
    assert.ok(balanced(empty));
    assert.doesNotMatch(empty, /<url>/);
  });
});

describe("indice delle sitemap", () => {
  test("sitemapindex con loc e lastmod", () => {
    const xml = sitemapIndexXml([{ url: "https://originsmeta.com/sitemap-home.xml", lastmod: "2026-09-25" }, { url: "https://originsmeta.com/it/sitemap-cards.xml" }]);
    assert.match(xml, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.equal(xml.match(/<sitemap>/g)?.length, 2);
    assert.match(xml, /<sitemap>\n<loc>https:\/\/originsmeta\.com\/sitemap-home\.xml<\/loc>\n<lastmod>2026-09-25<\/lastmod>\n<\/sitemap>/);
    assert.ok(balanced(xml));
  });
});

describe("feed RSS", () => {
  const xml = rssXml({
    title: "News su Origins TCG · OriginsMeta",
    link: "https://originsmeta.com/it/news",
    self: "https://originsmeta.com/it/news/feed.xml",
    description: "Sito fan non ufficiale, non affiliato a Koin Games.",
    language: "it",
    lastBuildDate: new Date("2026-09-25T12:00:00Z"),
    items: [
      {
        title: "Patch & novità <demo>",
        link: "https://originsmeta.com/it/news/demo-patch-notes-0921",
        guid: "https://originsmeta.com/it/news/demo-patch-notes-0921",
        pubDate: new Date("2026-09-21T12:00:00Z"),
        description: "Le modifiche della patch del 21 settembre.",
        creator: "Pierluigi “Aldry” Cella",
        image: { url: "https://originsmeta.com/media/news.webp", width: 1600, height: 900, bytes: 12345 },
      },
      {
        title: "Video",
        link: "https://originsmeta.com/it/news/video",
        guid: "https://originsmeta.com/it/news/video",
        pubDate: new Date("2026-09-20T12:00:00Z"),
        description: "Con la miniatura di YouTube.",
        image: { url: "https://i.ytimg.com/vi/abc/maxresdefault.jpg" },
      },
    ],
  });
  test("RSS 2.0 con atom:link self e namespace", () => {
    assert.match(xml, /<rss version="2\.0" xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom" xmlns:dc="http:\/\/purl\.org\/dc\/elements\/1\.1\/" xmlns:media="http:\/\/search\.yahoo\.com\/mrss\/">/);
    assert.match(xml, /<atom:link href="https:\/\/originsmeta\.com\/it\/news\/feed\.xml" rel="self" type="application\/rss\+xml"\/>/);
    assert.match(xml, /<language>it<\/language>/);
    assert.match(xml, /<lastBuildDate>Fri, 25 Sep 2026 12:00:00 GMT<\/lastBuildDate>/);
    assert.ok(balanced(xml));
  });
  test("voce: titolo con i caratteri speciali, guid permalink, data RFC 822, firma", () => {
    assert.match(xml, /<title>Patch &amp; novità &lt;demo&gt;<\/title>/);
    assert.match(xml, /<guid isPermaLink="true">https:\/\/originsmeta\.com\/it\/news\/demo-patch-notes-0921<\/guid>/);
    assert.match(xml, /<pubDate>Mon, 21 Sep 2026 12:00:00 GMT<\/pubDate>/);
    assert.match(xml, /<dc:creator>Pierluigi “Aldry” Cella<\/dc:creator>/);
  });
  test("copertina: media:content con misure, enclosure solo se si conosce il peso", () => {
    assert.match(xml, /<media:content url="https:\/\/originsmeta\.com\/media\/news\.webp" medium="image" type="image\/webp" width="1600" height="900"\/>/);
    assert.match(xml, /<enclosure url="https:\/\/originsmeta\.com\/media\/news\.webp" length="12345" type="image\/webp"\/>/);
    assert.match(xml, /<media:content url="https:\/\/i\.ytimg\.com\/vi\/abc\/maxresdefault\.jpg" medium="image" type="image\/jpeg"\/>/);
    assert.equal(xml.match(/<enclosure /g)?.length, 1);
  });
});

describe("utilità", () => {
  test("imageMime dall'estensione", () => {
    assert.equal(imageMime("/media/a.webp"), "image/webp");
    assert.equal(imageMime("https://i.ytimg.com/vi/x/hqdefault.JPG"), "image/jpeg");
    assert.equal(imageMime("/media/a.png?v=2"), "image/png");
    assert.equal(imageMime("/media/a"), undefined);
  });
  test("rfc822", () => {
    assert.equal(rfc822(new Date("2026-09-25T00:00:00Z")), "Fri, 25 Sep 2026 00:00:00 GMT");
  });
});
