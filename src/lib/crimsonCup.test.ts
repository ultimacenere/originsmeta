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
  acrossCards,
  acrossHeadlines,
  acrossLegendaries,
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
/** Le qualificazioni fino alla APAC compresa e le prime tre con i numeri: i test restano validi con quelle che arrivano dopo. */
const UP_TO_APAC = crimsonQualifiers.slice(0, crimsonQualifiers.findIndex((q) => q.id === "apac") + 1);
const FIRST_THREE = withStats(crimsonQualifiers).slice(0, 3);

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

  test("i ban rate calcolati sono quelli pubblicati da Koin (AMER #2)", () => {
    const published: Record<string, number> = {
      "van-helsing": 48.4,
      merlin: 47.5,
      "three-not-so-little-pigs": 36.1,
      dorothy: 33.3,
      "king-arthur": 24,
      "robin-hood": 18.6,
      mulan: 14,
      "queen-of-hearts": 12,
      "legion-of-the-dead": 10.6,
      dracula: 9.2,
      "wicked-stepmother": 8.3,
    };
    const amer2 = crimsonQualifiers.find((q) => q.id === "amer-2")!.stats!;
    assert.equal(amer2.legendaries.length, Object.keys(published).length);
    for (const row of amer2.legendaries) assert.equal(Math.round(banRate(row) * 1000) / 10, published[row.legendary], row.legendary);
    assert.equal(submittedTotal(amer2), 891);
  });

  test("i ban rate calcolati sono quelli pubblicati da Koin (APAC)", () => {
    const published: Record<string, number> = {
      "van-helsing": 55.1,
      merlin: 36.8,
      "three-not-so-little-pigs": 33.8,
      dorothy: 30.8,
      mulan: 20.9,
      "king-arthur": 18.3,
      "wicked-stepmother": 17.6,
      dracula: 13.6,
      "queen-of-hearts": 11.8,
      "robin-hood": 11.5,
      "legion-of-the-dead": 9.7,
    };
    const apac = crimsonQualifiers.find((q) => q.id === "apac")!.stats!;
    assert.equal(apac.legendaries.length, Object.keys(published).length);
    for (const row of apac.legendaries) assert.equal(Math.round(banRate(row) * 1000) / 10, published[row.legendary], row.legendary);
    assert.equal(submittedTotal(apac), 1383);
  });

  test("ogni carta esiste nel database, attiva, e le Leggendarie sono Leggendarie", () => {
    for (const q of withStats(crimsonQualifiers)) {
      for (const r of q.stats.legendaries) {
        const card = bySlug.get(r.legendary);
        assert.ok(card, `${q.id}: ${r.legendary} non esiste`);
        assert.equal(card!.legendary, true, `${r.legendary} non è una Leggendaria`);
        // al massimo un turno dopo quello dei qualificati: Koin scrive R5 nella APAC
        assert.ok(r.banned <= r.seen && r.deepest >= 1 && r.deepest <= q.stats.qualifyRound + 1, r.legendary);
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
      for (let i = 1; i < q.stats.cards.length; i++) assert.ok(q.stats.cards[i].decks <= q.stats.cards[i - 1].decks, q.stats.cards[i].card);
      // ogni quota è arrotondata a un decimale (±0,05 punti): deve esserci un totale compatibile con tutte (AMER #1: 723,
      // APAC: 1383); una tolleranza fissa non basta, perché l'arrotondamento pesa di più dove i mazzi sono di più
      const lo = Math.max(...q.stats.cards.map((c) => c.decks / (c.share + 0.0005)));
      const hi = Math.min(...q.stats.cards.map((c) => c.decks / (c.share - 0.0005)));
      assert.ok(lo <= hi, `${q.id}: quote incoerenti`);
      // e non è lontano dai mazzi della tabella delle Leggendarie (AMER #1: 721)
      assert.ok(Math.abs((lo + hi) / 2 - submittedTotal(q.stats)) < 5, `${q.id}: totali lontani`);
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
    const [vh] = cardCrimsonFacts("van-helsing", UP_TO_APAC);
    assert.equal(vh.kind, "legendary");
    if (vh.kind === "legendary") {
      assert.equal(vh.qualifier, "APAC");
      assert.equal(vh.banRank, 1);
      assert.equal(vh.submittedRank, 2);
      assert.equal(vh.count, 11);
      assert.equal(vh.deepest, 5);
    }
    const [bear] = cardCrimsonFacts("baby-bear", UP_TO_APAC);
    assert.deepEqual(bear, { kind: "card", qualifier: "APAC", decks: 689, share: 0.498, rank: 1, count: 20 });
    assert.deepEqual(cardCrimsonFacts("baby-bear", UP_TO_APAC).map((f) => f.qualifier), ["APAC", "AMER #2", "EMEA #1", "AMER #1"]);
    assert.deepEqual(cardCrimsonFacts("cinderella", UP_TO_APAC), []);
    // AMER #1 20 carte, EMEA #1 3 nuove, APAC 2 nuove (Searing Light, Three Blind Mice), più le 11 Leggendarie
    assert.equal(crimsonCardSlugs(UP_TO_APAC).size, 36);
    assert.equal(crimsonCardDay("obliterate", UP_TO_APAC), "2026-10-23");
    assert.equal(crimsonCardDay("impundulu", UP_TO_APAC), "2026-10-22");
    assert.equal(crimsonCardDay("cinderella", UP_TO_APAC), undefined);
    assert.equal(latestWithStats(UP_TO_APAC)?.id, "apac");
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

describe("Crimson Cup: le qualificazioni a confronto", () => {
  const ready = FIRST_THREE;

  test("Leggendarie: una colonna per qualificazione, ban e viste sommati, dalla più bandita nell'insieme", () => {
    const legs = acrossLegendaries(FIRST_THREE);
    assert.equal(legs.length, 11);
    assert.deepEqual(
      legs.slice(0, 3).map((l) => l.legendary),
      ["van-helsing", "merlin", "three-not-so-little-pigs"],
    );
    const vh = legs[0];
    assert.equal(vh.points.length, ready.length);
    assert.equal(vh.banned, 96 + 139 + 90);
    assert.equal(vh.seen, 216 + 272 + 186);
    assert.ok(Math.abs((vh.banDelta ?? 0) - (90 / 186 - 139 / 272)) < 1e-9);
    // le quote nell'insieme sono sui mazzi di tutte le tabelle: sommano 1
    assert.ok(Math.abs(legs.reduce((t, l) => t + l.share, 0) - 1) < 1e-9);
    assert.equal(legs.reduce((t, l) => t + l.submitted, 0), 721 + 924 + 891);
  });

  test("carte: prima quelle in tutte le tabelle, null dove Koin non la pubblica", () => {
    const cards = acrossCards(FIRST_THREE);
    assert.equal(cards.length, 23);
    assert.equal(cards[0].card, "baby-bear");
    assert.equal(cards[0].inTop, 3);
    assert.ok(Math.abs((cards[0].delta ?? 0) - (0.461 - 0.501)) < 1e-9);
    const jekyll = cards.find((c) => c.card === "jekyll")!;
    assert.deepEqual(jekyll.points.map((p) => p !== null), [false, true, false]);
    assert.equal(jekyll.delta, null);
    assert.equal(cards.filter((c) => c.inTop === 3).length, 15);
    for (let i = 1; i < cards.length; i++) assert.ok(cards[i].inTop <= cards[i - 1].inTop, cards[i].card);
  });

  test("i fatti che legano le qualificazioni", () => {
    const h = acrossHeadlines(FIRST_THREE);
    assert.equal(h.qualifiers, 3);
    assert.deepEqual(h.topBanned, { legendary: "van-helsing", times: 3, min: 96 / 216, max: 139 / 272 });
    // King Arthur: 4 su 63 nella EMEA #1, 18 su 75 nella AMER #2; Dorothy (9 volte vista) non conta
    assert.equal(h.mover?.legendary, "king-arthur");
    assert.equal(h.mover?.prev, "EMEA #1");
    assert.equal(h.mover?.last, "AMER #2");
    assert.ok(Math.abs((h.mover?.delta ?? 0) - (18 / 75 - 4 / 63)) < 1e-9);
    assert.deepEqual(h.topCard, { card: "baby-bear", times: 3 });
    assert.equal(h.alwaysCards, 15);
    assert.equal(h.top, 20);
    // con una sola qualificazione non c'è niente da confrontare
    assert.deepEqual(acrossHeadlines(ready.slice(0, 1)), { qualifiers: 1, alwaysCards: 0, top: 20 });
  });

  test("con la APAC: il cambio più grande è Merlin, 12 carte in tutte e quattro le tabelle", () => {
    const h = acrossHeadlines(UP_TO_APAC);
    assert.equal(h.qualifiers, 4);
    assert.equal(h.topBanned?.legendary, "van-helsing");
    assert.equal(h.topBanned?.times, 4);
    // Merlin: 38 su 80 nella AMER #2, 49 su 133 nella APAC
    assert.equal(h.mover?.legendary, "merlin");
    assert.equal(h.mover?.last, "APAC");
    assert.ok(Math.abs((h.mover?.delta ?? 0) - (49 / 133 - 38 / 80)) < 1e-9);
    assert.equal(h.alwaysCards, 12);
    assert.equal(acrossCards(UP_TO_APAC).length, 25);
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
