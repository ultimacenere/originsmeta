/**
 * Test delle date della sitemap (`lastmod.ts`) con il runner integrato di Node: `node --test src/lib/lastmod.test.ts`.
 * Le regole: il giorno più recente fra modello, dati e soglie; mai prima della nascita della lingua (lo spagnolo il
 * 25/09/2026); mai nel futuro; mai un orario.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  LOCALE_SINCE,
  NEWS_PAGES_SINCE,
  PAGE_UPDATED,
  SITE_WIDE_CHANGE,
  lastmodFor,
  latestDay,
  pageLastmod,
  toDay,
  todayUtc,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in deckrules.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./lastmod.ts";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

describe("giorni", () => {
  test("toDay: data o timestamp diventano il solo giorno, il resto non è una data", () => {
    assert.equal(toDay("2026-09-24"), "2026-09-24");
    assert.equal(toDay("2026-09-24T16:59:00+02:00"), "2026-09-24");
    assert.equal(toDay("2026-09-24T22:10:05.123456+00:00"), "2026-09-24");
    assert.equal(toDay(""), undefined);
    assert.equal(toDay(null), undefined);
    assert.equal(toDay(undefined), undefined);
    assert.equal(toDay("24/09/2026"), undefined);
    assert.equal(toDay("2026-13-45"), undefined);
  });
  test("latestDay: il più recente, ignorando i vuoti", () => {
    assert.equal(latestDay(["2026-08-21", undefined, "2026-09-22T10:00:00Z", "", "2026-09-01"]), "2026-09-22");
    assert.equal(latestDay([]), undefined);
    assert.equal(latestDay([null, "x"]), undefined);
  });
  test("todayUtc: giorno UTC, senza orario", () => {
    assert.equal(todayUtc(new Date("2026-09-25T08:30:00Z")), "2026-09-25");
    // alle 00:30 in Italia è ancora il 24 in UTC: vale il 24, così la data non è mai nel futuro per nessuno
    assert.equal(todayUtc(new Date("2026-09-25T00:30:00+02:00")), "2026-09-24");
  });
});

describe("lastmod di un URL", () => {
  const today = "2026-10-20";
  test("vince la data più recente del contenuto", () => {
    assert.equal(lastmodFor("en", ["2026-10-02", "2026-10-15", "2026-09-30"], today), "2026-10-15");
  });
  test("nessuna pagina spagnola prima del 25/09/2026, qualunque data abbia il contenuto", () => {
    assert.equal(LOCALE_SINCE.es, "2026-09-25");
    assert.equal(lastmodFor("es", ["2026-08-27"], today), "2026-09-25");
    assert.equal(lastmodFor("es", [], today), "2026-09-25");
  });
  test("un contenuto vecchio sale all'ultimo cambio di tutto il sito (hreflang di ogni pagina)", () => {
    assert.equal(lastmodFor("en", ["2026-03-13"], today), SITE_WIDE_CHANGE);
    assert.equal(lastmodFor("it", ["2026-08-21"], today), SITE_WIDE_CHANGE);
  });
  test("mai nel futuro: una data scritta in anticipo si ferma a oggi", () => {
    assert.equal(lastmodFor("en", ["2026-11-01"], "2026-10-20"), "2026-10-20");
    // anche le soglie: una sitemap generata prima del 25/09 non dichiara il 25/09
    assert.equal(lastmodFor("es", [], "2026-09-24"), "2026-09-24");
  });
  test("i timestamp dei mazzi (Supabase) diventano giorni", () => {
    assert.equal(lastmodFor("it", ["2026-10-03T21:45:10.5+00:00"], today), "2026-10-03");
  });
  test("sempre e solo un giorno", () => {
    for (const locale of ["en", "it", "es"] as const) {
      assert.match(lastmodFor(locale, ["2026-10-03T21:45:10Z"], today), ISO_DAY);
      assert.match(lastmodFor(locale, [], "2026-09-20T23:59:00Z"), ISO_DAY);
    }
  });
});

describe("modelli delle pagine", () => {
  test("ogni data di PAGE_UPDATED è un giorno vero, non anteriore alla nascita del sito", () => {
    for (const [route, day] of Object.entries(PAGE_UPDATED)) {
      assert.equal(toDay(day), day, `data del modello ${route}`);
      assert.ok(day >= LOCALE_SINCE.en, `${route} non può essere cambiata prima che il sito esistesse`);
    }
    assert.match(NEWS_PAGES_SINCE, ISO_DAY);
  });
  test("pageLastmod: il modello conta come una data del contenuto", () => {
    const today = "2026-12-01";
    assert.equal(pageLastmod("/faq", "en", [], today), latestDay([PAGE_UPDATED["/faq"], SITE_WIDE_CHANGE]));
    assert.equal(pageLastmod("/cards/[slug]", "es", ["2026-11-05"], today), "2026-11-05");
  });
});
