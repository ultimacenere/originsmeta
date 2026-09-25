/**
 * Test dei numeri della sezione Tier list (`tierstats.ts`) con il runner integrato di Node:
 * `node --test src/lib/tierstats.test.ts`. Come per `tiercode.test.ts`, l'import ha l'estensione `.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMUNITY_MIN_LISTS,
  aggregateLists,
  briefSentence,
  deckBrief,
  fillParts,
  pickBrief,
  tierFromAverage,
  usageCounts,
  weightedRating,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./tierstats.ts";

describe("tierFromAverage", () => {
  test("usa le stesse soglie della vista SQL", () => {
    assert.equal(tierFromAverage(5), "S");
    assert.equal(tierFromAverage(4.5), "S");
    assert.equal(tierFromAverage(4.49), "A");
    assert.equal(tierFromAverage(3.5), "A");
    assert.equal(tierFromAverage(2.5), "B");
    assert.equal(tierFromAverage(1.5), "C");
    assert.equal(tierFromAverage(1.49), "D");
  });
});

describe("aggregateLists", () => {
  test("media, voti e distribuzione per carta", () => {
    const out = aggregateLists([
      { entries: { S: ["mulan"], A: ["dracula"] } },
      { entries: { A: ["mulan"], D: ["dracula"] } },
      { entries: { S: ["mulan"] } },
    ]);
    const mulan = out.find((c) => c.slug === "mulan");
    const dracula = out.find((c) => c.slug === "dracula");
    assert.deepEqual(mulan, { slug: "mulan", avg: 4.67, votes: 3, dist: { S: 2, A: 1, B: 0, C: 0, D: 0 }, tier: "S" });
    assert.deepEqual(dracula, { slug: "dracula", avg: 2.5, votes: 2, dist: { S: 0, A: 1, B: 0, C: 0, D: 1 }, tier: "B" });
    assert.equal(out[0].slug, "mulan", "la media più alta viene prima");
  });

  test("ignora chiavi estranee, valori non validi e liste rotte", () => {
    const out = aggregateLists([
      { entries: { S: ["mulan", 3, ""], pool: ["dorothy"], X: ["merlin"] } },
      { entries: null },
      { entries: "S" },
      { entries: { A: "mulan" } },
    ]);
    assert.deepEqual(
      out.map((c) => c.slug),
      ["mulan"],
    );
    assert.equal(out[0].votes, 1);
  });

  test("una carta ripetuta nella stessa lista vota una volta sola, con la fascia più alta", () => {
    const [only] = aggregateLists([{ entries: { B: ["merlin"], S: ["merlin"] } }]);
    assert.equal(only.votes, 1);
    assert.equal(only.avg, 5);
  });

  test("nessuna lista, nessun punteggio", () => {
    assert.deepEqual(aggregateLists([]), []);
  });
});

describe("usageCounts", () => {
  test("conta i mazzi, non le copie, e tiene a parte la Leggendaria", () => {
    const out = usageCounts([
      { legendary: "van-helsing", cards: ["spellbook", "spellbook", "mind-palace"] },
      { legendary: "van-helsing", cards: ["spellbook"] },
      { legendary: null, cards: ["mind-palace"] },
    ]);
    assert.deepEqual(out.legendaries, { "van-helsing": 2 });
    assert.deepEqual(out.cards, { spellbook: 2, "mind-palace": 2 });
  });
});

describe("weightedRating", () => {
  test("un 5 con un voto non passa davanti a un 4,33 con tre voti", () => {
    assert.ok(weightedRating(4.33, 3) > weightedRating(5, 1));
  });
  test("senza voti restituisce il valore di partenza", () => {
    assert.equal(weightedRating(0, 0), 3);
  });
});

test("la soglia della community è 5 liste (decisione del 24/09/2026)", () => {
  assert.equal(COMMUNITY_MIN_LISTS, 5);
});

/** Voci di prova: nome e numero, con il link che le pagine costruiscono per le schede. */
const item = (name: string, value: number) => ({ name, href: `/en/cards/${name.toLowerCase().replace(/\W+/g, "-")}`, value });
const names = (pick: { kind: string; items?: { name: string }[] }) => (pick.items ?? []).map((x) => x.name);

describe("pickBrief (In breve di /decks e /tier-list)", () => {
  test("senza pari merito sul taglio: le prime tre, per numero e poi per nome", () => {
    const pick = pickBrief([item("Mulan", 2), item("Dorothy", 5), item("Dracula", 3), item("Genie", 1)]);
    assert.equal(pick.kind, "top");
    assert.deepEqual(names(pick), ["Dorothy", "Dracula", "Mulan"]);
  });

  test("un pari merito sul taglio si cita per intero finché i nomi restano cinque", () => {
    const pick = pickBrief([item("Dorothy", 4), item("Mulan", 2), item("Merlin", 2), item("Dracula", 2), item("Genie", 1)]);
    assert.equal(pick.kind, "top");
    assert.deepEqual(names(pick), ["Dorothy", "Dracula", "Merlin", "Mulan"]);
  });

  test("sei a pari merito in testa (il caso del 25/09/2026): tutti e sei, con il numero comune", () => {
    const six = ["Queen of Hearts", "Dracula", "Van Helsing", "Dorothy", "Three Not So Little Pigs", "King Arthur"].map((n) => item(n, 2));
    const pick = pickBrief([...six, item("Mulan", 1)]);
    assert.equal(pick.kind, "tie");
    assert.equal(pick.kind === "tie" && pick.value, 2);
    assert.deepEqual(names(pick), ["Dorothy", "Dracula", "King Arthur", "Queen of Hearts", "Three Not So Little Pigs", "Van Helsing"]);
  });

  test("un pari merito lungo sotto la testa: il taglio sale a chi sta sopra", () => {
    const pick = pickBrief([item("Dorothy", 5), item("Dracula", 3), ...["A", "B", "C", "D", "E", "F"].map((n) => item(n, 2))]);
    assert.deepEqual(names(pick), ["Dorothy", "Dracula"]);
    assert.deepEqual(names(pickBrief([item("Dorothy", 5), ...["A", "B", "C", "D", "E", "F"].map((n) => item(n, 2))])), ["Dorothy"]);
  });

  test("un pari merito in testa oltre gli otto nomi non si cita", () => {
    assert.equal(pickBrief("ABCDEFGHI".split("").map((n) => item(n, 1))).kind, "none");
    assert.equal(pickBrief("ABCDEFGH".split("").map((n) => item(n, 1))).kind, "tie");
  });

  test("l'ordine di partenza non conta: le due pagine citano le stesse voci", () => {
    const list = [item("Dorothy", 2), item("Dracula", 2), item("Queen of Hearts", 2), item("King Arthur", 2), item("Mulan", 3), item("Genie", 1)];
    const a = pickBrief(list);
    const b = pickBrief([...list].reverse());
    assert.deepEqual(names(a), names(b));
    assert.deepEqual(names(a), ["Mulan", "Dorothy", "Dracula", "King Arthur", "Queen of Hearts"]);
  });

  test("voti pesati uguali da medie diverse sono un pari merito", () => {
    const five = { ...item("Solo", weightedRating(5, 1)) };
    const four = { ...item("Crowd", weightedRating(4, 4)) };
    const pick = pickBrief([five, four, item("Low", weightedRating(3, 1))], { limit: 1, maxNames: 5, maxTied: 8 });
    assert.deepEqual(names(pick), ["Crowd", "Solo"]);
  });

  test("niente voci, o solo voci a zero: nessuna frase", () => {
    assert.equal(pickBrief([]).kind, "none");
    assert.equal(pickBrief([item("Dorothy", 0)]).kind, "none");
  });
});

/** Le frasi inglesi di `decks.brief`, come nel dizionario. */
const t = {
  count: "So far the community has published {n} decks, the latest on {date}.",
  countOne: "So far the community has published one deck, on {date}.",
  legendaries: "Most played Legendaries: {list}.",
  legendariesOne: "Most played Legendary: {list}.",
  legendariesTie: "{count} Legendaries share the lead with {n} each: {list}.",
  cards: "Most played base cards: {list}.",
  cardsOne: "Most played base card: {list}.",
  cardsTie: "{count} base cards share the lead with {n} each: {list}.",
  rated: "Best-rated decks: {list}.",
  ratedOne: "Best-rated deck: {list}.",
  ratedTie: "{count} decks share the best rating: {list}.",
  rating: "{avg}/5, {votes}",
  numbers: ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"],
};
const inDecks = (n: number) => (n === 1 ? "1 deck" : `${n} decks`);
const votes = (n: number) => (n === 1 ? "1 vote" : `${n} votes`);
const text = (parts: (string | { text: string })[]) => parts.map((p) => (typeof p === "string" ? p : p.text)).join("");

describe("frasi di In breve", () => {
  test("i segnaposto si riempiono senza leggere i caratteri speciali dei nomi", () => {
    assert.deepEqual(fillParts("Best: {list}.", { list: ["$& deck"] }), ["Best: ", "$& deck", "."]);
    assert.deepEqual(fillParts("{missing} ok", {}), ["{missing}", " ok"]);
  });

  test("il pari merito in testa lo dice e cita tutti, con i link", () => {
    const six = ["Dorothy", "Dracula", "King Arthur", "Queen of Hearts", "Three Not So Little Pigs", "Van Helsing"].map((n) => item(n, 2));
    const parts = briefSentence(pickBrief(six), { many: t.legendaries, one: t.legendariesOne, tie: t.legendariesTie }, {
      locale: "en",
      note: (it) => inDecks(it.value),
      tieAmount: inDecks,
      countWord: (n) => t.numbers[n],
    });
    assert.equal(text(parts), "Six Legendaries share the lead with 2 decks each: Dorothy, Dracula, King Arthur, Queen of Hearts, Three Not So Little Pigs, and Van Helsing.");
    assert.deepEqual(parts.filter((p) => typeof p !== "string").length, 6);
    assert.ok(parts.some((p) => typeof p !== "string" && p.text === "Dorothy" && p.href === "/en/cards/dorothy"));
  });

  test("il paragrafo intero, uguale per le due pagine", () => {
    const common = {
      locale: "en",
      t,
      decks: 16,
      lastDate: "24 September 2026",
      legendaries: [item("Dorothy", 3), item("Dracula", 2), item("Mulan", 1)],
      rated: [
        { ...item("Buff", weightedRating(5, 3)), rating: { avg: 5, votes: 3 } },
        { ...item("Cure Control", weightedRating(4, 1)), rating: { avg: 4, votes: 1 } },
      ],
      inDecks,
      votes,
    };
    assert.equal(
      text(deckBrief(common)),
      "So far the community has published 16 decks, the latest on 24 September 2026. Most played Legendaries: Dorothy (3 decks), Dracula (2 decks), and Mulan (1 deck). Best-rated decks: Buff (5.0/5, 3 votes) and Cure Control (4.0/5, 1 vote).",
    );
    // le carte base solo dove la pagina le passa (/tier-list); un mazzo solo: la forma al singolare
    const withCards = text(deckBrief({ ...common, decks: 1, cards: [item("Spellbook", 1)], rated: common.rated.slice(1) }));
    assert.match(withCards, /published one deck, on 24 September 2026\./);
    assert.match(withCards, /Most played base card: Spellbook \(1 deck\)\. Best-rated deck: Cure Control \(4\.0\/5, 1 vote\)\.$/);
  });
});
