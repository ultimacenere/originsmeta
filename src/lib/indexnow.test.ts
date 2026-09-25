/**
 * Test di IndexNow (`indexnow.ts`): chiave e suo file in public/, pulizia degli URL (host, doppioni, frammenti),
 * gruppi da 10.000, corpo della richiesta, esiti del motore, interruttore della produzione e invio con un `fetch`
 * finto (mai la rete). `node --test src/lib/indexnow.test.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_KEY,
  INDEXNOW_MAX_URLS,
  INDEXNOW_SITE,
  describeIndexNowStatus,
  indexNowBatches,
  indexNowBody,
  indexNowEnabled,
  indexNowRequests,
  indexNowUrls,
  isIndexNowKey,
  keyFileUrl,
  localizedPaths,
  submitIndexNow,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./indexnow.ts";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("chiave", () => {
  test("valida per il protocollo: 32 caratteri esadecimali", () => {
    assert.match(INDEXNOW_KEY, /^[0-9a-f]{32}$/);
    assert.ok(isIndexNowKey(INDEXNOW_KEY));
    assert.equal(isIndexNowKey("corta"), false);
    assert.equal(isIndexNowKey("con spazi dentro"), false);
    assert.equal(isIndexNowKey("a".repeat(129)), false);
  });
  test("il file public/<chiave>.txt contiene la chiave e nient'altro", () => {
    assert.equal(read(`public/${INDEXNOW_KEY}.txt`).trim(), INDEXNOW_KEY);
  });
  test("il file sta nella radice del sito, così vale per tutti gli URL", () => {
    assert.equal(keyFileUrl(), `https://originsmeta.com/${INDEXNOW_KEY}.txt`);
  });
  test("il sito è lo stesso di i18n.ts", () => {
    assert.equal(read("src/lib/i18n.ts").match(/export const siteUrl = "([^"]+)"/)?.[1], INDEXNOW_SITE);
  });
});

describe("URL", () => {
  test("percorsi in tutte le lingue, home comprese", () => {
    assert.deepEqual(localizedPaths("/news/x", ["en", "it", "es"]), ["/en/news/x", "/it/news/x", "/es/news/x"]);
    assert.deepEqual(localizedPaths("", ["en", "it"]), ["/en", "/it"]);
    assert.deepEqual(localizedPaths("guides", ["es"]), ["/es/guides"]);
  });
  test("assoluti, solo del nostro host in https, senza frammenti, barre finali e doppioni", () => {
    assert.deepEqual(
      indexNowUrls([
        "/it/news/a",
        "https://originsmeta.com/it/news/a",
        "https://originsmeta.com/it/news/a/",
        "https://originsmeta.com/it/news/a#in-breve",
        "https://www.originsmeta.com/it/news/b",
        "http://originsmeta.com/it/news/c",
        "https://originsmeta.vercel.app/it/news/d",
        "https://esempio.it/it/news/e",
        "",
        "  /es  ",
        "https://originsmeta.com/",
      ]),
      ["https://originsmeta.com/it/news/a", "https://originsmeta.com/es", "https://originsmeta.com"],
    );
  });
  test("gruppi da 10.000 al massimo", () => {
    assert.equal(INDEXNOW_MAX_URLS, 10_000);
    const list = Array.from({ length: 25_001 }, (_, i) => i);
    assert.deepEqual(indexNowBatches(list).map((b) => b.length), [10_000, 10_000, 5_001]);
    assert.deepEqual(indexNowBatches([1, 2, 3], 2), [[1, 2], [3]]);
    assert.deepEqual(indexNowBatches([]), []);
  });
});

describe("richiesta", () => {
  test("corpo JSON del protocollo: host, chiave, posizione della chiave, URL", () => {
    assert.deepEqual(indexNowBody(["https://originsmeta.com/en"]), {
      host: "originsmeta.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://originsmeta.com/${INDEXNOW_KEY}.txt`,
      urlList: ["https://originsmeta.com/en"],
    });
  });
  test("un POST JSON per gruppo, con gli URL già puliti", () => {
    const reqs = indexNowRequests(["/en/cards/merlin", "/en/cards/merlin", "/it/cards/merlin", "https://altro.it/x"], { max: 1 });
    assert.equal(reqs.length, 2);
    for (const r of reqs) {
      assert.equal(r.url, INDEXNOW_ENDPOINT);
      assert.equal(r.init.method, "POST");
      assert.equal(r.init.headers["content-type"], "application/json; charset=utf-8");
      assert.equal(r.count, 1);
    }
    assert.deepEqual(JSON.parse(reqs[1].init.body).urlList, ["https://originsmeta.com/it/cards/merlin"]);
  });
  test("nessuna richiesta senza URL validi o con una chiave non valida", () => {
    assert.deepEqual(indexNowRequests(["https://altro.it/x"]), []);
    assert.deepEqual(indexNowRequests(["/en"], { key: "no" }), []);
  });
});

describe("esiti e interruttore", () => {
  test("200 e 202 vanno bene, gli altri sono avvisi", () => {
    assert.equal(describeIndexNowStatus(200).ok, true);
    assert.equal(describeIndexNowStatus(202).ok, true);
    for (const s of [400, 403, 422, 429, 500]) assert.equal(describeIndexNowStatus(s).ok, false);
    assert.match(describeIndexNowStatus(403).text, /chiave/);
  });
  test("solo dalla produzione di Vercel, e spegnibile", () => {
    assert.equal(indexNowEnabled({ VERCEL_ENV: "production" }), true);
    assert.equal(indexNowEnabled({ VERCEL_ENV: "production", INDEXNOW: "off" }), false);
    assert.equal(indexNowEnabled({ VERCEL_ENV: "preview" }), false);
    assert.equal(indexNowEnabled({}), false);
  });
});

describe("invio (fetch finto)", () => {
  test("una richiesta per gruppo, esito per gruppo", async () => {
    const calls: { url: string; body: string }[] = [];
    const results = await submitIndexNow(["/en", "/it", "/es"], {
      max: 2,
      fetch: async (url: string, init: { body: string }) => {
        calls.push({ url, body: init.body });
        return { status: calls.length === 1 ? 200 : 202 };
      },
    });
    assert.equal(calls.length, 2);
    assert.deepEqual(results.map((r: { count: number; ok: boolean; status?: number }) => [r.count, r.ok, r.status]), [
      [2, true, 200],
      [1, true, 202],
    ]);
  });
  test("mai un'eccezione: rete giù o chiave rifiutata diventano esiti", async () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      const down = await submitIndexNow(["/en"], {
        fetch: async () => {
          throw new Error("ECONNRESET");
        },
      });
      assert.deepEqual(down.map((r: { ok: boolean; text: string }) => [r.ok, r.text]), [[false, "rete: ECONNRESET"]]);
      const refused = await submitIndexNow(["/en"], { fetch: async () => ({ status: 403 }) });
      assert.equal(refused[0].ok, false);
      assert.equal(refused[0].status, 403);
    } finally {
      console.warn = warn;
    }
  });
  test("niente da mandare, nessuna richiesta", async () => {
    let called = false;
    const results = await submitIndexNow([], {
      fetch: async () => {
        called = true;
        return { status: 200 };
      },
    });
    assert.deepEqual(results, []);
    assert.equal(called, false);
  });
});
