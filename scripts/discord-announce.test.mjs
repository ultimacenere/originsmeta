/**
 * Test dell'annuncio su Discord (`discord-announce.mjs`): riconoscimento degli slug nuovi e lettura dei meta Open
 * Graph. `node --test scripts/discord-announce.test.mjs` (è anche in `npm test`).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { added, guideSlugs, newsSlugs, ogValue, payload } from "./discord-announce.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("slug delle news e delle guide", () => {
  test("news: solo le voci, non il tipo", () => {
    const src = `export type NewsItem = {\n  slug: string;\n};\nexport const news = [\n  {\n    slug: "b",\n  },\n  {\n    slug: "a",\n  },\n];`;
    assert.deepEqual([...newsSlugs(src)].sort(), ["a", "b"]);
  });
  test("guide: l'elenco guideSlugs", () => {
    const src = `const altro = ["x"];\nexport const guideSlugs = [\n  "uno",\n  "due",\n] as const;\nconst dopo = "tre";`;
    assert.deepEqual([...guideSlugs(src)], ["uno", "due"]);
  });
  test("nuovi = dopo meno prima (l'ordine non conta)", () => {
    assert.deepEqual(added(new Set(["a", "b"]), new Set(["b", "c", "a"])), ["c"]);
    assert.deepEqual(added(new Set(["a"]), new Set(["a"])), []);
  });
  test("sui file veri del repo", () => {
    const news = newsSlugs(read("src/lib/data/news.ts"));
    assert.ok(news.has("upgrade-meta-0924"));
    assert.ok(news.has("demo-patch-notes-0921"));
    const guides = guideSlugs(read("src/lib/content/guides.ts"));
    assert.ok(guides.has("origins-tcg-locations"));
    assert.ok(guides.size >= 16);
  });
});

describe("meta Open Graph", () => {
  const html = `<head><meta property="og:title" content="Tom &amp; Jerry: l&#x27;ultima"/><meta content="Due &quot;parole&quot;" property="og:description"><meta property="og:image" content="https://originsmeta.com/media/x.webp"/></head>`;
  test("legge i valori con gli attributi in qualunque ordine e scioglie le entità", () => {
    assert.equal(ogValue(html, "title"), "Tom & Jerry: l'ultima");
    assert.equal(ogValue(html, "description"), 'Due "parole"');
    assert.equal(ogValue(html, "image"), "https://originsmeta.com/media/x.webp");
    assert.equal(ogValue(html, "video"), "");
  });
  test("messaggio: titolo italiano, link inglese, copertina, nessuna menzione", () => {
    const en = `<meta property="og:title" content="The last one · OriginsMeta"/>`;
    const body = payload("news", "prova", html, en);
    const [embed] = body.embeds;
    assert.equal(embed.title, "Tom & Jerry: l'ultima");
    assert.match(embed.url, /\/it\/news\/prova$/);
    assert.equal(embed.image.url, "https://originsmeta.com/media/x.webp");
    assert.match(embed.fields[0].value, /^\[The last one\]\(https:\/\/originsmeta\.com\/en\/news\/prova\)$/);
    assert.deepEqual(body.allowed_mentions, { parse: [] });
  });
});
