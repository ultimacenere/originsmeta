/**
 * Test dei numeri della sezione Tier list (`tierstats.ts`) con il runner integrato di Node:
 * `node --test src/lib/tierstats.test.ts`. Come per `tiercode.test.ts`, l'import ha l'estensione `.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMUNITY_MIN_LISTS,
  communitySample,
  aggregateLists,
  briefSentence,
  deckBrief,
  fillParts,
  pickBrief,
  pickPreview,
  tierFromAverage,
  usageCounts,
  weightedRating,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./tierstats.ts";
// I dizionari veri, per controllare le frasi di "In breve" come escono sulle pagine (stessa eccezione TS5097).
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "./dictionaries/en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it } from "./dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "./dictionaries/es.ts";

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

  test("un pari merito lungo sotto la testa: la frase si omette, il taglio non sale a chi sta sopra", () => {
    assert.equal(pickBrief([item("Dorothy", 5), item("Dracula", 3), ...["A", "B", "C", "D", "E", "F"].map((n) => item(n, 2))]).kind, "none");
    assert.equal(pickBrief([item("Dorothy", 5), ...["A", "B", "C", "D", "E", "F"].map((n) => item(n, 2))]).kind, "none");
  });

  test("il confine dei cinque nomi con il pari merito sotto la testa", () => {
    const four = pickBrief([item("Dorothy", 3), ...["A", "B", "C", "D"].map((n) => item(n, 2))]);
    assert.equal(four.kind, "top");
    assert.deepEqual(names(four), ["Dorothy", "A", "B", "C", "D"]);
    assert.equal(pickBrief([item("Dorothy", 3), ...["A", "B", "C", "D", "E"].map((n) => item(n, 2))]).kind, "none");
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

describe("pickPreview (anteprime a striscia di /tier-list)", () => {
  const six = ["Queen of Hearts", "Dracula", "Van Helsing", "Dorothy", "Three Not So Little Pigs", "King Arthur"].map((n) => item(n, 2));

  test("sei Leggendarie a pari merito: la striscia da quattro le mostra tutte, nell'ordine di In breve", () => {
    const shown = pickPreview([...six, item("Mulan", 1)], { limit: 4, max: 8 }).map((x) => x.name);
    assert.deepEqual(shown, names(pickBrief([...six, item("Mulan", 1)])));
    assert.deepEqual(shown, ["Dorothy", "Dracula", "King Arthur", "Queen of Hearts", "Three Not So Little Pigs", "Van Helsing"]);
  });

  test("senza pari merito sul taglio: le prime `limit`, per numero e poi per nome", () => {
    const shown = pickPreview([item("Mulan", 2), item("Dorothy", 5), item("Dracula", 3), item("Genie", 1), item("Aladdin", 2)], { limit: 4, max: 6 });
    assert.deepEqual(shown.map((x) => x.name), ["Dorothy", "Dracula", "Aladdin", "Mulan"]);
  });

  test("un pari merito sul taglio entra intero finché le voci restano entro `max`", () => {
    const list = [item("Dorothy", 5), item("Dracula", 3), ...["A", "B", "C", "D"].map((n) => item(n, 2)), item("Genie", 1)];
    assert.deepEqual(pickPreview(list, { limit: 4, max: 6 }).map((x) => x.name), ["Dorothy", "Dracula", "A", "B", "C", "D"]);
  });

  test("un pari merito lungo sotto la testa: la striscia si ferma a chi sta sopra", () => {
    const list = [item("Dorothy", 5), item("Dracula", 3), ...["A", "B", "C", "D", "E", "F", "G"].map((n) => item(n, 2))];
    assert.deepEqual(pickPreview(list, { limit: 4, max: 8 }).map((x) => x.name), ["Dorothy", "Dracula"]);
  });

  test("un pari merito lungo in testa: la striscia non sparisce, lo mostra intero", () => {
    const many = "ABCDEFGHIJKL".split("").map((n) => item(n, 1));
    assert.equal(pickPreview(many, { limit: 8, max: 10 }).length, 12);
    assert.deepEqual(pickPreview([], { limit: 4, max: 8 }), []);
  });
});

/**
 * Le frasi inglesi di `decks.brief`, con quella del conteggio accorciata: qui si prova il meccanismo, le frasi vere delle
 * tre lingue le controlla "In breve con i dizionari veri" in fondo.
 */
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

/** Sei mazzi con lo stesso voto pesato da medie diverse: 5 stelle con 1 voto e 4 stelle con 4 voti valgono entrambi 11/3. */
const sixRated = ["Aggro", "Buff", "Control", "Discard", "Evil", "Fairy"].map((n, i) => {
  const rating = i % 2 ? { avg: 4, votes: 4 } : { avg: 5, votes: 1 };
  return { ...item(n, weightedRating(rating.avg, rating.votes)), rating };
});

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

  test("mazzi a pari voto pesato oltre i cinque nomi: la frase lo dice e ogni mazzo tiene il suo voto", () => {
    const out = text(deckBrief({ locale: "en", t, decks: 6, lastDate: "24 September 2026", legendaries: [], rated: sixRated, inDecks, votes }));
    assert.equal(
      out,
      "So far the community has published 6 decks, the latest on 24 September 2026. Six decks share the best rating: Aggro (5.0/5, 1 vote), Buff (4.0/5, 4 votes), Control (5.0/5, 1 vote), Discard (4.0/5, 4 votes), Evil (5.0/5, 1 vote), and Fairy (4.0/5, 4 votes).",
    );
  });
});

/**
 * Le frasi come escono sulle pagine, con i dizionari veri e i contatori che le pagine prendono da `tier`: un segnaposto
 * fuori posto in una lingua (per esempio "con {n} ciascuna" diventato "{n} ciascuna") qui si vede, in hubMeta no.
 */
describe("In breve con i dizionari veri", () => {
  const dicts = { en, it, es };
  const dates = { en: "24 September 2026", it: "24 settembre 2026", es: "24 de septiembre de 2026" };
  const six = ["Queen of Hearts", "Dracula", "Van Helsing", "Dorothy", "Three Not So Little Pigs", "King Arthur"].map((n) => item(n, 2));
  const brief = (locale: "en" | "it" | "es", rated: { name: string; href: string; value: number; rating: { avg: number; votes: number } }[]) => {
    const d = dicts[locale];
    const count = (one: string, many: string) => (n: number) => (n === 1 ? one : many.replace("{n}", String(n)));
    return text(
      deckBrief({
        locale,
        t: d.decks.brief,
        decks: 16,
        lastDate: dates[locale],
        legendaries: [...six, item("Mulan", 1)],
        cards: [item("Mind Palace", 3), item("Golden Egg", 4), item("Spellbook", 5), item("Ellen Trechend", 4)],
        rated,
        inDecks: count(d.tier.inDecksOne, d.tier.inDecksMany),
        votes: count(d.tier.explorer.votesOne, d.tier.explorer.votesMany),
      }),
    );
  };
  const twoRated = [
    { ...item("Buff", weightedRating(5, 3)), rating: { avg: 5, votes: 3 } },
    { ...item("Cure Control", weightedRating(4, 1)), rating: { avg: 4, votes: 1 } },
  ];

  test("inglese", () => {
    assert.equal(
      brief("en", twoRated),
      "So far the community has published 16 Origins TCG (Koin Games) decks on OriginsMeta, the latest on 24 September 2026. Six Legendaries share the lead with 2 decks each: Dorothy, Dracula, King Arthur, Queen of Hearts, Three Not So Little Pigs, and Van Helsing. Most played base cards: Spellbook (5 decks), Ellen Trechend (4 decks), and Golden Egg (4 decks). Best-rated decks: Buff (5.0/5, 3 votes) and Cure Control (4.0/5, 1 vote).",
    );
    assert.match(brief("en", sixRated), / Six decks share the best rating: Aggro \(5\.0\/5, 1 vote\), Buff \(4\.0\/5, 4 votes\), .* and Fairy \(4\.0\/5, 4 votes\)\.$/);
  });

  test("italiano", () => {
    assert.equal(
      brief("it", twoRated),
      "Finora la community ha pubblicato su OriginsMeta 16 mazzi di Origins TCG (Koin Games), l'ultimo il 24 settembre 2026. Sei Leggendarie sono a pari merito in testa, con 2 mazzi ciascuna: Dorothy, Dracula, King Arthur, Queen of Hearts, Three Not So Little Pigs e Van Helsing. Carte base più giocate: Spellbook (5 mazzi), Ellen Trechend (4 mazzi) e Golden Egg (4 mazzi). Mazzi più votati: Buff (5,0/5, 3 voti) e Cure Control (4,0/5, 1 voto).",
    );
    assert.match(brief("it", sixRated), / Sei mazzi sono a pari merito con il voto più alto: Aggro \(5,0\/5, 1 voto\), Buff \(4,0\/5, 4 voti\), .* e Fairy \(4,0\/5, 4 voti\)\.$/);
  });

  test("spagnolo", () => {
    assert.equal(
      brief("es", twoRated),
      "Hasta ahora la comunidad ha publicado en OriginsMeta 16 mazos de Origins TCG (Koin Games); el último, el 24 de septiembre de 2026. Seis Legendarias empatan en cabeza, con 2 mazos cada una: Dorothy, Dracula, King Arthur, Queen of Hearts, Three Not So Little Pigs y Van Helsing. Cartas base más jugadas: Spellbook (5 mazos), Ellen Trechend (4 mazos) y Golden Egg (4 mazos). Mazos mejor valorados: Buff (5,0/5, 3 votos) y Cure Control (4,0/5, 1 voto).",
    );
    assert.match(brief("es", sixRated), / Seis mazos empatan con la mejor valoración: Aggro \(5,0\/5, 1 voto\), Buff \(4,0\/5, 4 votos\), .* y Fairy \(4,0\/5, 4 votos\)\.$/);
  });
});

describe("communitySample", () => {
  test("2 persone e 4 liste: la frase dice tutte e due le cose, nelle tre lingue", () => {
    const n = { legendaries: 2, cards: 2, people: 2 };
    assert.equal(communitySample(en.tier, n), "2 people, 4 lists saved (2 of Legendaries and 2 of base cards)");
    assert.equal(communitySample(it.tier, n), "2 persone, 4 liste salvate (2 di Leggendarie e 2 di carte base)");
    assert.equal(communitySample(es.tier, n), "2 personas, 4 listas guardadas (2 de Legendarias y 2 de cartas base)");
  });
  test("una sola lista: singolare", () => {
    const n = { legendaries: 1, cards: 0, people: 1 };
    assert.equal(communitySample(it.tier, n), "1 persona, 1 lista salvata (1 di Leggendarie e 0 di carte base)");
    assert.equal(communitySample(es.tier, n), "1 persona, 1 lista guardada (1 de Legendarias y 0 de cartas base)");
    assert.equal(communitySample(en.tier, n), "1 person, 1 list saved (1 of Legendaries and 0 of base cards)");
  });
});
