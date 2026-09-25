/**
 * Test delle news correlate e delle news di una guida (`relatedNews.ts`) con il runner integrato di Node:
 * `node --test src/lib/relatedNews.test.ts`. Come per `tiercode.test.ts`, l'import ha l'estensione `.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  RELATED_NEWS_MAX,
  dateCloseness,
  newsForGuide,
  relatedNews,
  topicScore,
  type NewsLinkFields,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./relatedNews.ts";

const item = (slug: string, date: string, extra: Partial<NewsLinkFields> = {}): NewsLinkFields => ({ slug, date, source: "steam", ...extra });
const slugs = (list: NewsLinkFields[]) => list.map((x) => x.slug);

describe("topicScore", () => {
  test("una guida in comune pesa più di una carta in comune", () => {
    const a = item("a", "2026-09-01", { source: "press", guides: ["g"], cards: ["x"] });
    const withGuide = item("b", "2026-09-01", { source: "site", guides: ["g"] });
    const withCard = item("c", "2026-09-01", { source: "site", cards: ["x"] });
    assert.ok(topicScore(a, withGuide) > topicScore(a, withCard));
  });
  test("le carte in comune contano al massimo tre", () => {
    const many = ["a", "b", "c", "d", "e", "f"];
    const a = item("a", "2026-09-01", { source: "press", cards: many });
    const b = item("b", "2026-09-01", { source: "site", cards: many });
    assert.equal(topicScore(a, b), 3);
  });
  test("due patch notes sono dello stesso tipo anche con fonti diverse", () => {
    const patches = new Set(["p1", "p2"]);
    const a = item("p1", "2026-08-01", { source: "steam" });
    const b = item("p2", "2026-09-01", { source: "press" });
    assert.equal(topicScore(a, b, patches), 2);
    assert.equal(topicScore(a, b), 0);
  });
  test("stessa fonte senza altro legame vale poco ma non zero", () => {
    assert.equal(topicScore(item("a", "2026-09-01"), item("b", "2026-01-01")), 1);
  });
});

describe("dateCloseness", () => {
  test("1 lo stesso giorno, 0 da 30 giorni in su, mai negativa", () => {
    assert.equal(dateCloseness("2026-09-10", "2026-09-10"), 1);
    assert.equal(dateCloseness("2026-09-10", "2026-10-10"), 0);
    assert.equal(dateCloseness("2026-09-10", "2026-01-01"), 0);
    assert.ok(dateCloseness("2026-09-10", "2026-09-20") > dateCloseness("2026-09-10", "2026-09-25"));
  });
});

describe("relatedNews", () => {
  const pool = [
    item("newest", "2026-09-24", { source: "site" }),
    item("second", "2026-09-23", { source: "press" }),
    item("third", "2026-09-22", { source: "press" }),
    item("patch-a", "2026-08-14", { cards: ["mulan", "merlin"] }),
    item("patch-b", "2026-08-21", { cards: ["merlin"] }),
    item("guide-news", "2026-06-01", { source: "press", guides: ["next-fest"] }),
    item("old", "2026-03-01", { source: "press", guides: ["next-fest"] }),
  ];
  const patchNews = new Set(["patch-a", "patch-b"]);

  test("mai la news stessa e al massimo tre, senza doppioni", () => {
    for (const x of pool) {
      const out = relatedNews(x, pool, { patchNews });
      assert.ok(!slugs(out).includes(x.slug));
      assert.ok(out.length <= RELATED_NEWS_MAX);
      assert.equal(new Set(slugs(out)).size, out.length);
    }
  });
  test("le patch notes si collegano fra loro prima delle news recenti", () => {
    const out = relatedNews(pool[3], pool, { patchNews });
    assert.equal(out[0].slug, "patch-b");
  });
  test("una guida in comune batte la data e la fonte", () => {
    const out = relatedNews(item("x", "2026-09-24", { source: "press", guides: ["next-fest"] }), pool, { patchNews });
    assert.deepEqual(slugs(out).slice(0, 2), ["guide-news", "old"]);
  });
  test("senza legami si completa con le più recenti", () => {
    const lone = item("lone", "2026-01-01", { source: "community" });
    assert.deepEqual(slugs(relatedNews(lone, pool, { patchNews })), ["newest", "second", "third"]);
  });
  test("a parità di punteggio decide la data, poi lo slug: il risultato non dipende dall'ordine dei dati", () => {
    const a = item("a", "2026-09-10", { source: "press" });
    const twins = [item("z", "2026-09-10", { source: "press" }), item("m", "2026-09-10", { source: "press" }), item("b", "2026-09-10", { source: "press" })];
    const forward = slugs(relatedNews(a, twins));
    const backward = slugs(relatedNews(a, [...twins].reverse()));
    assert.deepEqual(forward, ["b", "m", "z"]);
    assert.deepEqual(backward, forward);
  });
  test("le news diverse non linkano tutte le stesse tre", () => {
    const targets = new Set(pool.flatMap((x) => slugs(relatedNews(x, pool, { patchNews }))));
    assert.ok(targets.size > RELATED_NEWS_MAX);
  });
});

describe("newsForGuide", () => {
  const pool = [
    item("a", "2026-09-01", { guides: ["g"] }),
    item("b", "2026-09-20", { guides: ["h", "g"] }),
    item("c", "2026-09-10", { guides: ["h"] }),
    item("d", "2026-08-01"),
  ];
  test("solo le news che citano la guida, dalla più recente", () => {
    assert.deepEqual(slugs(newsForGuide("g", pool)), ["b", "a"]);
  });
  test("nessuna news: elenco vuoto", () => {
    assert.deepEqual(newsForGuide("nessuna", pool), []);
  });
  test("al massimo cinque", () => {
    const many = Array.from({ length: 8 }, (_, i) => item(`n${i}`, `2026-09-0${i + 1}`, { guides: ["g"] }));
    const out = newsForGuide("g", many);
    assert.equal(out.length, 5);
    assert.equal(out[0].slug, "n7");
  });
});
