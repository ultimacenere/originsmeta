/**
 * Test del giro di IndexNow (`indexnow.mjs`): lettura dei file del repo, percorsi da segnalare dopo un push, voci
 * scritte a mano, controllo del noindex, lettura delle sitemap. Mai la rete.
 * `node --test scripts/indexnow.test.mjs`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LOCALES,
  addedKeys,
  changedKeys,
  guideSlugList,
  isNoindex,
  itemDates,
  matchesPrefix,
  parseTargets,
  pushPaths,
  recordChunks,
  sitemapLocs,
} from "./indexnow.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("lettura dei file", () => {
  test("le lingue sono quelle del sito", () => {
    const block = read("src/lib/i18n.ts").match(/export const locales = \[([^\]]*)\]/)?.[1] ?? "";
    assert.deepEqual([...block.matchAll(/"([a-z]{2})"/g)].map((m) => m[1]), LOCALES);
  });
  test("news: date e aggiornamenti per slug, il tipo non conta", () => {
    const src = `export type NewsItem = {\n  slug: string;\n  date: string;\n};\nexport const news = [\n  {\n    slug: "b",\n    date: "2026-09-02",\n    updated: "2026-09-03",\n    guides: ["x"],\n  },\n  {\n    slug: "a",\n    date: "2026-08-01",\n  },\n];`;
    assert.deepEqual([...itemDates(src)], [
      ["b", "2026-09-02|2026-09-03"],
      ["a", "2026-08-01|"],
    ]);
  });
  test("guide: le due versioni (en, it) in fila; gli slug dei mazzi citati non sono guide", () => {
    const src = `export const guideSlugs = [\n  "g1",\n] as const;\nconst en = {\n  "g1": {\n    slug: "g1",\n    tags: {\n      communityDecks: [{ slug: "mazzo-1", name: "M" }],\n    },\n    updated: "2026-09-23",\n  },\n};\nconst it = {\n  "g1": {\n    slug: "g1",\n    updated: "2026-09-25",\n  },\n};`;
    assert.deepEqual([...guideSlugList(src)], ["g1"]);
    assert.deepEqual([...itemDates(src)], [["g1", "|2026-09-23;|2026-09-25"]]);
  });
  test("record per slug: chiavi con e senza virgolette, testi su più righe, CRLF uguale a LF", () => {
    const lf = `export const cardLore = {\n  // commento\n  "king-arthur": { saga: "arthurian", it: \`Scudo\nAlla rivelazione: …\` },\n  merlin: { saga: "arthurian" },\n};\n`;
    const crlf = lf.replace(/\n/g, "\r\n");
    assert.deepEqual([...recordChunks(lf).keys()], ["king-arthur", "merlin"]);
    assert.match(recordChunks(lf).get("king-arthur"), /Alla rivelazione/);
    assert.deepEqual(changedKeys(recordChunks(lf), recordChunks(crlf)), []);
  });
  test("chiavi cambiate, aggiunte e tolte", () => {
    const a = new Map([["x", "1"], ["y", "2"], ["z", "3"]]);
    const b = new Map([["x", "1"], ["y", "20"], ["w", "4"]]);
    assert.deepEqual(changedKeys(a, b).sort(), ["w", "y", "z"]);
    assert.deepEqual(addedKeys(a, b), ["w"]);
    assert.deepEqual(addedKeys(new Set(["a"]), new Set(["a", "b"])), ["b"]);
  });
  test("sui file veri del repo", () => {
    const news = itemDates(read("src/lib/data/news.ts"));
    assert.ok(news.size > 20);
    assert.ok([...news.values()].every((sig) => /^\d{4}-\d{2}-\d{2}\|/.test(sig)));
    const guides = read("src/lib/content/guides.ts");
    const slugs = guideSlugList(guides);
    assert.ok(slugs.size >= 16);
    const dates = itemDates(guides);
    for (const s of slugs) assert.match(dates.get(s) ?? "", /^\|\d{4}-\d{2}-\d{2};\|\d{4}-\d{2}-\d{2}$/, s);
    const lore = recordChunks(read("src/lib/data/card-lore.ts"));
    const history = recordChunks(read("src/lib/data/card-history.ts"));
    assert.ok(lore.size >= 200 && lore.has("king-arthur") && lore.has("merlin"));
    assert.ok(history.size >= 40 && history.has("mulan") && history.has("queen-of-hearts"));
  });
});

describe("percorsi dopo un push", () => {
  const newsA = `export const news = [\n  {\n    slug: "vecchia",\n    date: "2026-09-20",\n  },\n  {\n    slug: "rivista",\n    date: "2026-09-19",\n  },\n];`;
  const newsB = `export const news = [\n  {\n    slug: "nuova",\n    date: "2026-09-25",\n  },\n  {\n    slug: "vecchia",\n    date: "2026-09-20",\n  },\n  {\n    slug: "rivista",\n    date: "2026-09-19",\n    updated: "2026-09-25",\n  },\n];`;
  test("news nuova: pagina nelle tre lingue, più home e /news; news rivista: la sua pagina", () => {
    const { fresh, changed } = pushPaths({ newsA, newsB });
    assert.deepEqual(fresh, ["/en/news/nuova", "/it/news/nuova", "/es/news/nuova"]);
    assert.deepEqual(changed, ["/en/news/rivista", "/it/news/rivista", "/es/news/rivista", "/en", "/it", "/es", "/en/news", "/it/news", "/es/news"]);
  });
  test("guida nuova e guida aggiornata", () => {
    const guidesA = `export const guideSlugs = [\n  "g1",\n] as const;\nconst en = {\n  g1: {\n    slug: "g1",\n    updated: "2026-09-20",\n  },\n};`;
    const guidesB = `export const guideSlugs = [\n  "g2",\n  "g1",\n] as const;\nconst en = {\n  g2: {\n    slug: "g2",\n    updated: "2026-09-25",\n  },\n  g1: {\n    slug: "g1",\n    updated: "2026-09-25",\n  },\n};`;
    const { fresh, changed } = pushPaths({ guidesA, guidesB });
    assert.deepEqual(fresh, ["/en/guides/g2", "/it/guides/g2", "/es/guides/g2"]);
    assert.deepEqual(changed, ["/en/guides/g1", "/it/guides/g1", "/es/guides/g1", "/en/guides", "/it/guides", "/es/guides"]);
  });
  test("patch: le schede toccate dallo storico o dai testi, più MetaShifting", () => {
    const historyA = `export const cardHistory = {\n  mulan: [\n    { patch: "0.6.2" },\n  ],\n};`;
    const historyB = `export const cardHistory = {\n  mulan: [\n    { patch: "0.6.2" },\n    { patch: "demo-1005" },\n  ],\n  "king-arthur": [\n    { patch: "demo-1005" },\n  ],\n};`;
    const loreA = `export const cardLore = {\n  merlin: { it: "a" },\n  mulan: { it: "b" },\n};`;
    const loreB = `export const cardLore = {\n  merlin: { it: "a2" },\n  mulan: { it: "b" },\n};`;
    const { fresh, changed } = pushPaths({ historyA, historyB, loreA, loreB });
    assert.deepEqual(fresh, []);
    for (const slug of ["mulan", "king-arthur", "merlin"]) for (const l of LOCALES) assert.ok(changed.includes(`/${l}/cards/${slug}`), `${l} ${slug}`);
    assert.ok(changed.includes("/es/metashifting"));
    assert.equal(changed.length, 9 + 3);
  });
  test("solo testi cambiati: niente MetaShifting", () => {
    const { changed } = pushPaths({ loreA: `const x = {\n  merlin: { it: "a" },\n};`, loreB: `const x = {\n  merlin: { it: "b" },\n};` });
    assert.deepEqual(changed, ["/en/cards/merlin", "/it/cards/merlin", "/es/cards/merlin"]);
  });
  test("niente di cambiato, niente da segnalare", () => {
    assert.deepEqual(pushPaths({ newsA, newsB: newsA }), { fresh: [], changed: [] });
    assert.deepEqual(pushPaths({}), { fresh: [], changed: [] });
  });
});

describe("voci scritte a mano", () => {
  test("slug nelle tre lingue, percorsi, URL e sitemap", () => {
    assert.deepEqual(parseTargets("news:upgrade-meta-0925, decks:mazzo-1a2b ,/es/cards,https://originsmeta.com/it/faq#domande,sitemap:/es,sitemap:"), {
      paths: [
        "/en/news/upgrade-meta-0925",
        "/it/news/upgrade-meta-0925",
        "/es/news/upgrade-meta-0925",
        "/en/decks/community/mazzo-1a2b",
        "/it/decks/community/mazzo-1a2b",
        "/es/decks/community/mazzo-1a2b",
        "/es/cards",
        "/it/faq",
      ],
      sitemaps: ["/es", "all"],
    });
    assert.deepEqual(parseTargets("cards:merlin").paths, ["/en/cards/merlin", "/it/cards/merlin", "/es/cards/merlin"]);
  });
  test("una voce che non si capisce ferma tutto", () => {
    assert.throws(() => parseTargets("mazzi:x"), /Voce non valida/);
    assert.throws(() => parseTargets("news:Slug Con Spazi"), /Voce non valida/);
    assert.throws(() => parseTargets("https://altro.it/pagina"), /non è un indirizzo/);
  });
});

describe("pagine e sitemap", () => {
  test("noindex dal meta robots (in qualunque ordine) o dall'header", () => {
    assert.equal(isNoindex('<meta name="robots" content="noindex, follow"/>'), true);
    assert.equal(isNoindex("<meta content='noindex' name='robots'>"), true);
    assert.equal(isNoindex('<meta name="bingbot" content="noindex"/>'), true);
    assert.equal(isNoindex('<meta name="robots" content="index, follow, max-image-preview:large"/>'), false);
    assert.equal(isNoindex('<meta name="description" content="noindex nel testo"/>'), false);
    assert.equal(isNoindex("<html></html>", "noindex"), true);
  });
  test("loc delle sitemap, non quelli delle immagini", () => {
    const xml = `<urlset><url><loc>https://originsmeta.com/es/cards/merlin</loc><image:image><image:loc>https://originsmeta.com/cards/merlin.webp</image:loc></image:image></url><url><loc>https://originsmeta.com/es/faq?a=1&amp;b=2</loc></url></urlset>`;
    assert.deepEqual(sitemapLocs(xml), ["https://originsmeta.com/es/cards/merlin", "https://originsmeta.com/es/faq?a=1&b=2"]);
  });
  test("prefisso di percorso: /es prende /es e /es/…, non /esempio", () => {
    assert.equal(matchesPrefix("https://originsmeta.com/es", "/es"), true);
    assert.equal(matchesPrefix("https://originsmeta.com/es/cards/merlin", "es"), true);
    assert.equal(matchesPrefix("https://originsmeta.com/en/cards/esmeralda", "/es"), false);
    assert.equal(matchesPrefix("https://originsmeta.com/esempio", "/es"), false);
    assert.equal(matchesPrefix("https://originsmeta.com/it", "all"), true);
  });
});
