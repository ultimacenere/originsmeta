/**
 * Test dei numeri della Crimson Cup (20/10/2026): `node --test src/lib/crimsonCup.test.ts`.
 * - I dati trascritti dalle tabelle di Koin (src/lib/data/crimsonCup.ts): ban rate uguali a quelli pubblicati, carte che
 *   esistono nel database e nel tipo giusto, quote delle carte coerenti fra loro.
 * - Le funzioni pure di crimsonCup.ts: ordine e posizioni, fatti in evidenza, righe delle schede carta, confronto con il
 *   ladder.
 * - I testi (crimsonCupLabels.ts): title e description nei limiti di Google (regole di `pageTitle` e `cleanDescription`,
 *   come hubMeta.test.ts), stessi segnaposto in ogni lingua, tipografia francese.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  banRate,
  biggestGaps,
  cardCrimsonFacts,
  crimsonCardDay,
  crimsonCardSlugs,
  headlines,
  latestWithStats,
  legendaryViews,
  submittedTotal,
  versusCards,
  versusLegendaries,
  withStats,
  type LadderLegendary,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./crimsonCup.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { CRIMSON_SOURCE_URL, crimsonQualifiers } from "./data/crimsonCup.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { crimsonCupLabels, crimsonOrdinal } from "./crimsonCupLabels.ts";

const LOCALES = ["en", "it", "es", "fr", "pt", "de", "ru"] as const;
const TITLE_MAX = 60;
const TITLE_MAX_NO_BRAND = 46;
const DESC_MIN = 120;
const DESC_MAX = 158;

type WooCard = { slug: string; name: string; legendary?: boolean; status?: string; type?: string };
const woo = JSON.parse(fs.readFileSync(new URL("./data/woo-cards.json", import.meta.url), "utf8")) as WooCard[] | { cards: WooCard[] };
const wooCards: WooCard[] = Array.isArray(woo) ? woo : woo.cards;
const bySlug = new Map(wooCards.map((c) => [c.slug, c]));

const amer = crimsonQualifiers.find((q) => q.id === "amer-1")!;
const stats = amer.stats!;

describe("Crimson Cup: dati trascritti", () => {
  test("i ban rate calcolati sono quelli pubblicati da Koin (AMER #1)", () => {
    const published: Record<string, number> = {
      "van-helsing": 44.4,
      merlin: 42.2,
      "three-not-so-little-pigs": 32.8,
      dorothy: 23.1,
      "king-arthur": 22.7,
      "queen-of-hearts": 21,
      mulan: 20.3,
      "legion-of-the-dead": 19.2,
      dracula: 14.1,
      "robin-hood": 11.8,
      "wicked-stepmother": 11.1,
    };
    assert.equal(stats.legendaries.length, Object.keys(published).length);
    for (const row of stats.legendaries) assert.equal(Math.round(banRate(row) * 1000) / 10, published[row.legendary], row.legendary);
  });

  test("i ban rate calcolati sono quelli pubblicati da Koin (EMEA #1)", () => {
    const published: Record<string, number> = {
      "van-helsing": 51.1,
      merlin: 48.6,
      "three-not-so-little-pigs": 34.9,
      "robin-hood": 19.6,
      "legion-of-the-dead": 15.4,
      mulan: 15.3,
      dracula: 14.5,
      dorothy: 10,
      "queen-of-hearts": 8,
      "king-arthur": 6.3,
      "wicked-stepmother": 0, // "—" nella tabella: 0 su 6
    };
    const emea = crimsonQualifiers.find((q) => q.id === "emea-1")!.stats!;
    assert.equal(emea.legendaries.length, Object.keys(published).length);
    for (const row of emea.legendaries) assert.equal(Math.round(banRate(row) * 1000) / 10, published[row.legendary], row.legendary);
    assert.equal(submittedTotal(emea), 924);
  });

  test("ogni carta esiste nel database, attiva, e le Leggendarie sono Leggendarie", () => {
    for (const q of withStats(crimsonQualifiers)) {
      for (const r of q.stats.legendaries) {
        const card = bySlug.get(r.legendary);
        assert.ok(card, `${q.id}: ${r.legendary} non esiste`);
        assert.equal(card!.legendary, true, `${r.legendary} non è una Leggendaria`);
        assert.ok(r.banned <= r.seen && r.deepest >= 1 && r.deepest <= q.stats.qualifyRound, r.legendary);
      }
      for (const c of q.stats.cards) {
        const card = bySlug.get(c.card);
        assert.ok(card, `${q.id}: ${c.card} non esiste`);
        assert.notEqual(card!.legendary, true, `${c.card} è una Leggendaria`);
        assert.notEqual(card!.status, "removed", `${c.card} è rimossa`);
      }
      assert.equal(new Set(q.stats.cards.map((c) => c.card)).size, q.stats.cards.length, "carte ripetute");
    }
  });

  test("le carte sono nell'ordine di Koin e le quote pubblicate tornano con un solo totale", () => {
    for (const q of withStats(crimsonQualifiers)) {
      const totals = q.stats.cards.map((c) => c.decks / c.share);
      for (let i = 1; i < q.stats.cards.length; i++) assert.ok(q.stats.cards[i].decks <= q.stats.cards[i - 1].decks, q.stats.cards[i].card);
      // ogni quota è arrotondata a un decimale: il totale che ne risulta varia di poco (AMER #1: 723)
      assert.ok(Math.max(...totals) - Math.min(...totals) < 4, `${q.id}: quote incoerenti`);
      // e non è lontano dai mazzi della tabella delle Leggendarie (721)
      assert.ok(Math.abs(totals[0] - submittedTotal(q.stats)) < 5, `${q.id}: totali lontani`);
    }
  });

  test("qualificazioni in ordine di calendario, id unici, numeri letti dopo l'inizio", () => {
    const ids = crimsonQualifiers.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length);
    for (let i = 1; i < crimsonQualifiers.length; i++) assert.ok(Date.parse(crimsonQualifiers[i].startAt) > Date.parse(crimsonQualifiers[i - 1].startAt));
    for (const q of withStats(crimsonQualifiers)) assert.ok(q.stats.read >= q.startAt.slice(0, 10), q.id);
    assert.equal(CRIMSON_SOURCE_URL, "https://discord.gg/originstcg");
  });
});

describe("Crimson Cup: numeri derivati", () => {
  test("Leggendarie dalla più bandita, con quote che sommano 1 e posizioni", () => {
    const views = legendaryViews(stats);
    assert.deepEqual(
      views.slice(0, 3).map((v) => v.legendary),
      ["van-helsing", "merlin", "three-not-so-little-pigs"],
    );
    assert.equal(views[0].banRank, 1);
    assert.ok(Math.abs(views.reduce((s, v) => s + v.share, 0) - 1) < 1e-9);
    const pigs = views.find((v) => v.legendary === "three-not-so-little-pigs")!;
    assert.equal(pigs.submittedRank, 1);
    assert.equal(pigs.banRank, 3);
    assert.equal(submittedTotal(stats), 721);
  });

  test("i fatti in evidenza", () => {
    const h = headlines(stats);
    assert.equal(h.mostBanned?.legendary, "van-helsing");
    assert.equal(h.mostSubmitted?.legendary, "three-not-so-little-pigs");
    // Wicked Stepmother (1 su 9) è sotto la soglia: la meno bandita che fa notizia è Robin Hood
    assert.equal(h.leastBanned?.legendary, "robin-hood");
    assert.equal(h.topCard?.card, "baby-bear");
    assert.equal(h.reachedQualify, 10);
    assert.equal(h.legendaries, 11);
  });

  test("righe delle schede carta: Leggendaria, carta, nessuna", () => {
    const [vh] = cardCrimsonFacts("van-helsing", crimsonQualifiers);
    assert.equal(vh.kind, "legendary");
    if (vh.kind === "legendary") {
      assert.equal(vh.qualifier, "EMEA #1");
      assert.equal(vh.banRank, 1);
      assert.equal(vh.submittedRank, 2);
      assert.equal(vh.count, 11);
      assert.equal(vh.deepest, 4);
    }
    const [bear] = cardCrimsonFacts("baby-bear", crimsonQualifiers);
    assert.deepEqual(bear, { kind: "card", qualifier: "EMEA #1", decks: 463, share: 0.501, rank: 1, count: 20 });
    assert.equal(cardCrimsonFacts("baby-bear", crimsonQualifiers)[1]?.qualifier, "AMER #1");
    assert.deepEqual(cardCrimsonFacts("cinderella", crimsonQualifiers), []);
    assert.equal(crimsonCardSlugs(crimsonQualifiers).size, 34);
    assert.equal(crimsonCardDay("obliterate", crimsonQualifiers), "2026-10-21");
    assert.equal(crimsonCardDay("cinderella", crimsonQualifiers), undefined);
    assert.equal(latestWithStats(crimsonQualifiers)?.id, "emea-1");
  });

  test("torneo contro ladder: differenze, righe senza ladder in fondo, differenze più grandi", () => {
    const views = legendaryViews(stats);
    const ladder = new Map<string, LadderLegendary>([
      ["three-not-so-little-pigs", { share: 0.143, r: 0.612, games: 709 }],
      ["merlin", { share: 0.074, r: 0.459, games: 368 }],
      ["dracula", { share: 0.2, r: 0.433, games: 436 }],
    ]);
    const rows = versusLegendaries(views, ladder);
    assert.equal(rows[0].legendary, "three-not-so-little-pigs");
    assert.ok(rows.slice(3).every((r) => r.ladder === null && r.diff === null));
    const gaps = biggestGaps(rows);
    assert.equal(gaps.up?.legendary, "three-not-so-little-pigs");
    assert.equal(gaps.down?.legendary, "dracula");
    assert.deepEqual(biggestGaps(rows.slice(3)), {});
    const cards = versusCards(stats.cards.slice(0, 2), new Map([["baby-bear", 0.53]]));
    assert.equal(cards[0].ladder, 0.53);
    assert.ok(Math.abs((cards[0].diff ?? 0) - (0.472 - 0.53)) < 1e-9);
    assert.equal(cards[1].ladder, null);
  });
});

describe("Crimson Cup: testi", () => {
  test("numeri d'ordine nelle cinque lingue", () => {
    assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22].map((n) => crimsonOrdinal(n, "en")), ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd"]);
    assert.equal(crimsonOrdinal(1, "fr"), "1re");
    assert.equal(crimsonOrdinal(2, "fr"), "2e");
    assert.equal(crimsonOrdinal(3, "it"), "3ª");
    assert.equal(crimsonOrdinal(3, "es"), "3.ª");
    assert.equal(crimsonOrdinal(3, "de"), "3.");
    assert.equal(crimsonOrdinal(3, "ru"), "3-я");
  });

  test("title e description nei limiti di Google, con Origins TCG", () => {
    for (const l of LOCALES) {
      const { title, description } = crimsonCupLabels[l].meta;
      const max = title.includes("Origins TCG") ? TITLE_MAX : TITLE_MAX_NO_BRAND;
      assert.ok(title.length <= max, `[${l}] title di ${title.length} caratteri: ${title}`);
      assert.ok(description.length >= DESC_MIN && description.length <= DESC_MAX, `[${l}] description di ${description.length} caratteri`);
      assert.ok(description.includes("Crimson Cup") && description.includes("Koin Games"), `[${l}] description senza Crimson Cup o Koin Games`);
    }
  });

  test("stessi segnaposto e stesse chiavi in ogni lingua", () => {
    const flat = (o: unknown, path = "", out = new Map<string, string>()): Map<string, string> => {
      if (typeof o === "string") out.set(path, [...o.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(","));
      else if (Array.isArray(o)) o.forEach((v, i) => flat(v, `${path}[${i}]`, out));
      else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) flat(v, path ? `${path}.${k}` : k, out);
      return out;
    };
    const en = flat(crimsonCupLabels.en);
    for (const l of LOCALES) {
      const other = flat(crimsonCupLabels[l]);
      assert.deepEqual([...other.keys()].sort(), [...en.keys()].sort(), `[${l}] chiavi diverse dall'inglese`);
      for (const [k, v] of en) assert.equal(other.get(k), v, `[${l}] ${k}: segnaposto diversi`);
    }
  });

  test("francese con lo spazio insecabile prima di : ; ? !", () => {
    const strings: string[] = [];
    const walk = (o: unknown) => {
      if (typeof o === "string") strings.push(o);
      else if (o && typeof o === "object") Object.values(o).forEach(walk);
    };
    walk(crimsonCupLabels.fr);
    for (const s of strings) assert.ok(!/ [:;?!]/.test(s), `spazio normale prima della punteggiatura: ${s}`);
  });
});
