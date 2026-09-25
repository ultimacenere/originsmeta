/**
 * Test della pubblicazione su Discord (`discord-announce.mjs`): lettura dei file del repo, canali di ogni voce,
 * archivio in ordine, messaggi e UTM dei link. `node --test scripts/discord-announce.test.mjs` (è anche in `npm test`).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { added, backfillItems, deliveredChannel, guideDates, guideSlugs, newsChannels, newsEntries, newsSlugs, ogValue, patchNews, payload, utmCampaign, webhookFor, withUtm } from "./discord-announce.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/** Link di un messaggio diviso in due: l'indirizzo senza gli UTM (la pagina, frammento compreso) e gli UTM a parte. */
const split = (href) => {
  const u = new URL(href);
  const utm = Object.fromEntries([...u.searchParams].filter(([k]) => k.startsWith("utm_")));
  for (const k of Object.keys(utm)) u.searchParams.delete(k);
  return { clean: u.toString(), utm };
};
/** L'indirizzo dentro un link Markdown [titolo](indirizzo). */
const mdHref = (value) => value.match(/\]\(([^)]+)\)$/)?.[1] ?? "";

describe("lettura dei file", () => {
  test("news: slug e data delle voci, non il tipo", () => {
    const src = `export type NewsItem = {\n  slug: string;\n  date: string;\n};\nexport const news = [\n  {\n    slug: "b",\n    image: "/x.webp",\n    date: "2026-09-02",\n  },\n  {\n    slug: "a",\n    date: "2026-08-01",\n  },\n];`;
    assert.deepEqual(newsEntries(src), [
      { slug: "b", date: "2026-09-02", index: 0 },
      { slug: "a", date: "2026-08-01", index: 1 },
    ]);
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
    const news = newsEntries(read("src/lib/data/news.ts"));
    const bySlug = new Map(news.map((e) => [e.slug, e.date]));
    assert.equal(bySlug.get("upgrade-meta-0924"), "2026-09-24");
    assert.equal(bySlug.get("demo-patch-notes-0921"), "2026-09-21");
    assert.equal(bySlug.get("steam-page-live"), "2026-05-06");
    assert.equal(news.length, new Set(news.map((e) => e.slug)).size, "uno slug per voce");
    const guides = read("src/lib/content/guides.ts");
    const slugs = guideSlugs(guides);
    assert.ok(slugs.has("origins-tcg-locations"));
    const dates = guideDates(guides);
    for (const s of slugs) assert.match(dates.get(s) ?? "", /^\d{4}-\d{2}-\d{2}$/, `data della guida ${s}`);
    const patches = patchNews(read("src/lib/data/cards.ts"));
    assert.deepEqual(patches.get("demo-patch-notes-0921"), { patch: "demo-0921", date: "2026-09-21" });
    assert.deepEqual(patches.get("patch-0-6-1-ranked"), { patch: "0.6.1", date: "2026-08-14" });
    assert.equal(patches.size, 4);
    for (const slug of patches.keys()) assert.ok(bySlug.has(slug), `la patch cita una news che esiste: ${slug}`);
  });
});

describe("dove va cosa", () => {
  const patches = new Map([["patch-x", { patch: "0.9", date: "2026-08-20" }]]);
  test("news in annunci e #site-news, patch notes anche in #metashifting", () => {
    assert.deepEqual(newsChannels("una-news", patches), ["announcements", "news"]);
    assert.deepEqual(newsChannels("patch-x", patches), ["announcements", "news", "metashifting"]);
  });
  test("le guide vanno in #site-news finché #guides non ha il suo webhook", () => {
    assert.equal(webhookFor("guides", { DISCORD_WEBHOOK_NEWS: "N" }), "N");
    assert.equal(webhookFor("guides", { DISCORD_WEBHOOK_NEWS: "N", DISCORD_WEBHOOK_GUIDES: "G" }), "G");
    assert.equal(webhookFor("metashifting", { DISCORD_WEBHOOK_NEWS: "N" }), "");
  });
  test("archivio da settembre: in ordine, patch vecchie solo in #metashifting", () => {
    const items = backfillItems(
      {
        news: [
          { slug: "nuova", date: "2026-09-10", index: 0 },
          { slug: "stesso-giorno-prima", date: "2026-09-02", index: 1 },
          { slug: "stesso-giorno-dopo", date: "2026-09-02", index: 2 },
          { slug: "patch-x", date: "2026-08-20", index: 3 },
          { slug: "vecchia", date: "2026-08-10", index: 4 },
        ],
        guides: new Set(["guida"]),
        guideDate: new Map([["guida", "2026-09-05"]]),
        patches,
        decks: [
          { slug: "mazzo-agosto", date: "2026-08-30", createdAt: "2026-08-30T10:00:00Z" },
          { slug: "mazzo", date: "2026-09-16", createdAt: "2026-09-16T17:30:00Z" },
        ],
      },
      "2026-09-01",
    );
    assert.deepEqual(
      items.map((i) => `${i.kind}:${i.slug}:${i.channels.join("+")}`),
      [
        "news:patch-x:metashifting",
        "news:stesso-giorno-dopo:announcements+news",
        "news:stesso-giorno-prima:announcements+news",
        "guides:guida:guides",
        "news:nuova:announcements+news",
        "decks:mazzo:decks",
      ],
    );
    assert.equal(items[0].patch, "0.9");
  });
});

describe("messaggi", () => {
  const html = `<head><meta property="og:title" content="Tom &amp; Jerry: l&#x27;ultima · OriginsMeta"/><meta content="Due &quot;parole&quot;" property="og:description"><meta property="og:image" content="https://originsmeta.com/media/x.webp"/></head>`;
  const en = `<meta property="og:title" content="The last one · OriginsMeta"/>`;
  test("legge i meta con gli attributi in qualunque ordine e scioglie le entità", () => {
    assert.equal(ogValue(html, "title"), "Tom & Jerry: l'ultima · OriginsMeta");
    assert.equal(ogValue(html, "description"), 'Due "parole"');
    assert.equal(ogValue(html, "video"), "");
  });
  test("news: titolo italiano senza marchio, link inglese, copertina, nessuna menzione", () => {
    const body = payload("announcements", { kind: "news", slug: "prova" }, html, en);
    const [embed] = body.embeds;
    assert.equal(embed.title, "Tom & Jerry: l'ultima");
    assert.equal(split(embed.url).clean, "https://originsmeta.com/it/news/prova");
    assert.equal(embed.image.url, "https://originsmeta.com/media/x.webp");
    assert.equal(embed.fields.length, 1);
    assert.match(embed.fields[0].value, /^\[The last one\]\(https:\/\/originsmeta\.com\/en\/news\/prova\?utm_/);
    assert.equal(split(mdHref(embed.fields[0].value)).clean, "https://originsmeta.com/en/news/prova");
    assert.deepEqual(body.allowed_mentions, { parse: [] });
  });
  test("patch notes su #metashifting: link alla patch; mazzi: percorso della scheda", () => {
    const ms = payload("metashifting", { kind: "news", slug: "patch-x", patch: "demo-0921" }, html, en);
    assert.equal(split(mdHref(ms.embeds[0].fields[1].value)).clean, "https://originsmeta.com/it/metashifting#patch-demo-0921");
    assert.match(ms.content, /MetaShifting/);
    const deck = payload("decks", { kind: "decks", slug: "healing-healsing-9411" }, html, en);
    assert.equal(split(deck.embeds[0].url).clean, "https://originsmeta.com/it/decks/community/healing-healsing-9411");
  });
  test("spagnolo: titolo collegato alla pagina /es, prima del link di MetaShifting", () => {
    const es = `<h1>La última</h1>`;
    const body = payload("metashifting", { kind: "news", slug: "patch-x", patch: "demo-0921" }, html, en, es);
    assert.deepEqual(body.embeds[0].fields.map((f) => f.name), ["🇬🇧 English", "🇪🇸 Español", "MetaShifting"]);
    assert.match(body.embeds[0].fields[1].value, /^\[La última\]\(https:\/\/originsmeta\.com\/es\/news\/patch-x\?utm_/);
    assert.equal(split(mdHref(body.embeds[0].fields[1].value)).clean, "https://originsmeta.com/es/news/patch-x");
    assert.match(payload("news", { kind: "news", slug: "x" }, html, en, es).content, /Nueva noticia/);
  });
  test("UTM su ogni link al sito: sorgente discord, mezzo social, campagna = tipo di contenuto, content = canale", () => {
    const es = `<h1>La última</h1>`;
    const news = payload("announcements", { kind: "news", slug: "prova" }, html, en, es).embeds[0];
    for (const href of [news.url, ...news.fields.map((f) => mdHref(f.value))]) {
      assert.deepEqual(split(href).utm, { utm_source: "discord", utm_medium: "social", utm_campaign: "news", utm_content: "announcements" }, href);
    }
    assert.equal(split(payload("news", { kind: "news", slug: "prova" }, html, en).embeds[0].url).utm.utm_content, "site-news");
    // le patch notes hanno la loro campagna in tutti i canali, compreso il link a MetaShifting
    const ms = payload("metashifting", { kind: "news", slug: "patch-x", patch: "demo-0921" }, html, en).embeds[0];
    for (const href of [ms.url, ...ms.fields.map((f) => mdHref(f.value))]) {
      assert.deepEqual(split(href).utm, { utm_source: "discord", utm_medium: "social", utm_campaign: "patch_notes", utm_content: "metashifting" }, href);
    }
    assert.equal(split(payload("guides", { kind: "guides", slug: "g" }, html, en).embeds[0].url).utm.utm_campaign, "guide");
    assert.deepEqual(split(payload("decks", { kind: "decks", slug: "d" }, html, en).embeds[0].url).utm, {
      utm_source: "discord",
      utm_medium: "social",
      utm_campaign: "deck",
      utm_content: "community-decks",
    });
    // l'immagine resta com'è
    assert.equal(news.image.url, "https://originsmeta.com/media/x.webp");
  });
  test("utm_content dice il canale in cui il messaggio esce davvero: le guide senza webhook escono in #site-news", () => {
    const guide = { kind: "guides", slug: "g" };
    assert.equal(deliveredChannel("guides", { DISCORD_WEBHOOK_NEWS: "https://x" }), "news");
    assert.equal(deliveredChannel("guides", { DISCORD_WEBHOOK_GUIDES: "https://y", DISCORD_WEBHOOK_NEWS: "https://x" }), "guides");
    assert.equal(deliveredChannel("guides", {}), "guides", "nessun webhook (prova a secco): il canale della voce");
    assert.equal(deliveredChannel("announcements", {}), "announcements");
    const viaNews = payload("guides", guide, html, en, "", deliveredChannel("guides", { DISCORD_WEBHOOK_NEWS: "https://x" })).embeds[0];
    for (const href of [viaNews.url, ...viaNews.fields.map((f) => mdHref(f.value))]) {
      assert.deepEqual(split(href).utm, { utm_source: "discord", utm_medium: "social", utm_campaign: "guide", utm_content: "site-news" }, href);
    }
    // testo del messaggio: sempre quello della guida
    assert.match(payload("guides", guide, html, en, "", "news").content, /Nuova guida/);
    assert.equal(split(payload("guides", guide, html, en, "", "guides").embeds[0].url).utm.utm_content, "guides");
  });
  test("withUtm: gli UTM prima del frammento, i parametri che c'erano restano", () => {
    assert.equal(
      withUtm("https://originsmeta.com/it/metashifting#patch-0.6.3", "patch_notes", "metashifting"),
      "https://originsmeta.com/it/metashifting?utm_source=discord&utm_medium=social&utm_campaign=patch_notes&utm_content=metashifting#patch-0.6.3",
    );
    assert.equal(withUtm("https://originsmeta.com/it/cards?q=merlin", "news"), "https://originsmeta.com/it/cards?q=merlin&utm_source=discord&utm_medium=social&utm_campaign=news");
    assert.equal(utmCampaign({ kind: "news", slug: "x" }), "news");
    assert.equal(utmCampaign({ kind: "news", slug: "x", patch: "0.6.3" }), "patch_notes");
    assert.equal(utmCampaign({ kind: "decks", slug: "x" }), "deck");
  });
});
