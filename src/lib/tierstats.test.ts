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
  bestDecks,
  briefSentence,
  communityStage,
  excludedFromBest,
  listParts,
  rankedCount,
  tierInviteText,
  signedTierLists,
  tierListCounts,
  communityOrder,
  deckBrief,
  fillParts,
  pickBrief,
  pickPreview,
  tierFromAverage,
  usageCounts,
  usageOrder,
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

describe("ordini condivisi fra pagina e dati strutturati (Ondata 2, GEO-10)", () => {
  test("usageOrder: più mazzi, poi costo più basso (senza costo in fondo), poi nome", () => {
    const rows = [
      { name: "B", used: 2, mana: 3 },
      { name: "A", used: 2, mana: 3 },
      { name: "C", used: 2, mana: 1 },
      { name: "D", used: 5 },
      { name: "E", used: 2 },
    ];
    assert.deepEqual(rows.sort(usageOrder).map((r) => r.name), ["D", "C", "A", "B", "E"]);
  });
  test("communityOrder: media più alta, poi più voti, poi costo e nome", () => {
    const rows = [
      { name: "B", mana: 2, community: { avg: 4, votes: 3 } },
      { name: "A", mana: 2, community: { avg: 4, votes: 3 } },
      { name: "C", mana: 1, community: { avg: 4, votes: 3 } },
      { name: "D", mana: 5, community: { avg: 4, votes: 6 } },
      { name: "E", mana: 1, community: { avg: 4.5, votes: 1 } },
      { name: "F", mana: 1 },
    ];
    assert.deepEqual(rows.sort(communityOrder).map((r) => r.name), ["E", "D", "C", "A", "B", "F"]);
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

/* ——— Ondata 3 del piano SEO/GEO: invito in home, tier list firmate, migliori mazzi di /decks ——— */

describe("tierListCounts e communityStage (invito della home e /tier-list/community)", () => {
  const rows = [
    { owner: "a", kind: "legendaries" },
    { owner: "a", kind: "cards" },
    { owner: "b", kind: "legendaries" },
    { owner: "c", kind: "cards" },
  ];

  test("liste per scheda e persone distinte", () => {
    assert.deepEqual(tierListCounts(rows), { legendaries: 2, cards: 2, people: 3 });
    assert.deepEqual(tierListCounts([]), { legendaries: 0, cards: 0, people: 0 });
  });

  test("lo stato guarda la scheda più salvata, con la soglia di 5 liste", () => {
    assert.deepEqual(communityStage({ legendaries: 0, cards: 0 }), { stage: "empty", lists: 0 });
    assert.deepEqual(communityStage({ legendaries: 2, cards: 1 }), { stage: "preview", lists: 2 });
    assert.deepEqual(communityStage({ legendaries: 4, cards: 5 }), { stage: "live", lists: 5 });
    assert.deepEqual(communityStage({ legendaries: 1, cards: 3 }, 3), { stage: "live", lists: 3 });
  });

  test("le frasi dell'invito hanno i loro segnaposto, nelle tre lingue", () => {
    for (const d of [en, it, es]) {
      const w = d.home.tierInvite;
      assert.match(w.intro, /\{min\}/);
      assert.match(w.empty, /\{min\}/);
      assert.match(w.previewOne, /\{min\}/);
      assert.doesNotMatch(w.previewOne, /\{n\}/);
      assert.match(w.preview, /\{n\}.*\{min\}/);
      assert.match(w.live, /\{people\}/);
      assert.ok(w.cta.length > 0);
    }
  });
});

describe("tierInviteText (invito della home, conto per persone)", () => {
  const words = (d: typeof it) => ({ ...d.home.tierInvite, peopleOne: d.tier.sourceCommunityPeopleOne, peopleMany: d.tier.sourceCommunityPeopleMany });

  test("i dati del 25/09/2026: 2 persone, 2 liste per scheda (4 in tutto) sono 2 persone delle 5, non 2 liste", () => {
    const n = { legendaries: 2, cards: 2, people: 2 };
    assert.equal(tierInviteText(words(it), n), "Tier list della community: 2 persone delle 5 che servono per farla partire.");
    assert.equal(tierInviteText(words(en), n), "Community tier list: 2 of the 5 people it needs to go live.");
    assert.equal(tierInviteText(words(es), n), "Tier list de la comunidad: 2 de las 5 personas que necesita para arrancar.");
  });

  test("una persona sola, nessuna, soglia raggiunta", () => {
    assert.equal(tierInviteText(words(it), { legendaries: 1, cards: 0, people: 1 }), "Tier list della community: 1 persona delle 5 che servono per farla partire.");
    assert.equal(tierInviteText(words(it), { legendaries: 0, cards: 0, people: 0 }), "Tier list della community: parte da 5 persone e nessuno ha ancora salvato la sua.");
    assert.equal(tierInviteText(words(it), { legendaries: 5, cards: 3, people: 6 }), "Tier list della community: la media delle liste salvate da 6 persone.");
    assert.equal(tierInviteText(words(en), { legendaries: 2, cards: 1, people: 2 }, 2), "Community tier list: the average of the lists saved by 2 people.");
  });

  test("nessun segnaposto resta nella frase, in nessuno stato e in nessuna lingua", () => {
    for (const d of [en, it, es])
      for (const n of [
        { legendaries: 0, cards: 0, people: 0 },
        { legendaries: 1, cards: 0, people: 1 },
        { legendaries: 3, cards: 2, people: 4 },
        { legendaries: 7, cards: 5, people: 9 },
      ])
        assert.doesNotMatch(tierInviteText(words(d), n), /[{}]/);
  });
});

describe("rankedCount", () => {
  test("carte distinte nelle cinque fasce, solo stringhe", () => {
    assert.equal(rankedCount({ S: ["dorothy", "merlin"], A: ["dorothy"], B: [1, ""], Z: ["mulan"] }), 2);
    assert.equal(rankedCount(null), 0);
    assert.equal(rankedCount("S"), 0);
  });
});

describe("signedTierLists (tier list firmate di /tier-list/community)", () => {
  const profile = (username: string | null, badge: string | null, display_name: string | null = null) => ({ username, display_name, badge });
  const row = (owner: string, kind: string, updated: string, p: ReturnType<typeof profile> | null, extra: Record<string, unknown> = {}) => ({
    owner,
    kind,
    title: "",
    code: `TL1-${owner}-${kind}`,
    entries: { S: ["dorothy"], A: ["merlin", "mulan"] },
    updated_at: `${updated}T10:00:00+00:00`,
    profile: p,
    ...extra,
  });

  test("firmano Staff, Pro, Influencer e Autore; community e profili senza tag no", () => {
    const out = signedTierLists([
      row("s", "cards", "2026-09-20", profile("staffer", "staff")),
      row("p", "cards", "2026-09-21", profile("pro1", "pro")),
      row("i", "cards", "2026-09-22", profile("infl", "influencer")),
      row("a", "cards", "2026-09-23", profile("magicofhandss", "creator")),
      row("c", "cards", "2026-09-24", profile("sbardi", "community")),
      row("n", "cards", "2026-09-24", profile("nobadge", null)),
      row("x", "cards", "2026-09-24", null),
    ]);
    assert.deepEqual(
      out.map((a) => [a.username, a.badge]),
      [
        ["magicofhandss", "creator"],
        ["infl", "influencer"],
        ["pro1", "pro"],
        ["staffer", "staff"],
      ],
    );
  });

  test("senza nome utente non c'è un profilo da linkare: la lista non compare", () => {
    assert.deepEqual(signedTierLists([row("s", "cards", "2026-09-20", profile(null, "staff", "Staff senza nome")), row("t", "cards", "2026-09-20", profile("  ", "pro"))]), []);
  });

  test("un autore con due liste: una voce sola, Leggendarie prima, data dell'ultima e carte classificate", () => {
    const [a, ...rest] = signedTierLists([
      row("m", "cards", "2026-09-25", profile("magicofhandss", "creator", "Magic of Hands"), { title: " Tier List Carte " }),
      row("m", "legendaries", "2026-09-24", profile("magicofhandss", "creator", "Magic of Hands"), { title: null, code: null }),
    ]);
    assert.equal(rest.length, 0);
    assert.equal(a.name, "Magic of Hands");
    assert.equal(a.updated, "2026-09-25");
    assert.deepEqual(
      a.lists.map((l) => [l.kind, l.title, l.code, l.updated, l.ranked]),
      [
        ["legendaries", "", "", "2026-09-24", 3],
        ["cards", "Tier List Carte", "TL1-m-cards", "2026-09-25", 3],
      ],
    );
  });

  test("autori dal più recente, a pari data per nome; il nome mostrato ripiega sul nome utente", () => {
    const out = signedTierLists([
      row("b", "cards", "2026-09-22", profile("bravo", "pro")),
      row("a", "cards", "2026-09-22", profile("alpha", "pro", "  ")),
      row("z", "cards", "2026-09-23", profile("zulu", "staff")),
    ]);
    assert.deepEqual(
      out.map((x) => x.name),
      ["zulu", "alpha", "bravo"],
    );
    assert.deepEqual(signedTierLists([]), []);
  });
});

describe("bestDecks (I migliori mazzi adesso, /decks)", () => {
  /** Mazzi di prova col voto pesato come le pagine: nome, media, voti. */
  const deck = (name: string, avg: number, votes: number) => ({ ...item(name, weightedRating(avg, votes)), rating: { avg, votes } });

  test("classifica per voto pesato, con la posizione e lo stesso ordine di In breve", () => {
    const list = [deck("Buff", 5, 3), deck("Cure Control", 4.5, 4), deck("Healing Healsing", 5, 2), deck("Discard", 4, 1), deck("Evil", 3.5, 2), deck("Fairy", 2, 1)];
    const { ranked, more } = bestDecks(list);
    assert.deepEqual(
      ranked.map((r) => [r.item.name, r.rank]),
      [
        ["Buff", 1],
        ["Cure Control", 2],
        ["Healing Healsing", 2],
        ["Discard", 4],
        ["Evil", 5],
      ],
    );
    assert.equal(more, 1);
    // i primi della classifica sono i mazzi che "In breve" cita, nello stesso ordine
    assert.deepEqual(
      ranked.slice(0, 3).map((r) => r.item.name),
      names(pickBrief(list)),
    );
  });

  test("un voto solo da 5 stelle non supera quattro voti con media 4,5", () => {
    const { ranked } = bestDecks([deck("One Vote", 5, 1), deck("Four Votes", 4.5, 4)]);
    assert.deepEqual(
      ranked.map((r) => r.item.name),
      ["Four Votes", "One Vote"],
    );
  });

  test("il pari merito sul taglio entra intero (i dati del 25/09/2026: due a 4,00 e cinque a 3,67)", () => {
    const list = [
      deck("Cure Control", 4.5, 4),
      deck("Healing Healsing", 5, 2),
      ...["3 Pigs Mid Range", "Face Is The Place", "Just F In Em", "King of Value Trade", "Value Maxxing"].map((n) => deck(n, 5, 1)),
      deck("Control", 4, 1),
    ];
    const { ranked, more } = bestDecks(list);
    assert.deepEqual(
      ranked.map((r) => r.rank),
      [1, 1, 3, 3, 3, 3, 3],
    );
    assert.equal(more, 1);
  });

  test("un pari merito troppo lungo sotto la testa: la classifica si ferma sopra e dice quanti restano", () => {
    const list = [deck("A", 5, 4), ...Array.from({ length: 12 }, (_, i) => deck(`T${String(i).padStart(2, "0")}`, 5, 1))];
    const { ranked, more } = bestDecks(list);
    assert.deepEqual(
      ranked.map((r) => r.item.name),
      ["A"],
    );
    assert.equal(more, 12);
    assert.deepEqual(bestDecks([]), { ranked: [], more: 0, tied: 0 });
  });

  test("un pari merito in testa più lungo del tetto: 10 voci tutte #1, e `tied` dice quante altre lo condividono", () => {
    // il caso più comune nei dati: tanti mazzi con un solo voto da 5 stelle (3,67) e nessuno sopra
    const list = [...Array.from({ length: 12 }, (_, i) => deck(`T${String(i).padStart(2, "0")}`, 5, 1)), deck("Low", 3, 1)];
    const { ranked, more, tied } = bestDecks(list);
    assert.equal(ranked.length, 10);
    assert.ok(ranked.every((r) => r.rank === 1));
    // l'ordine fra i pari merito è quello unico (per nome): i primi dieci
    assert.deepEqual(
      ranked.map((r) => r.item.name),
      Array.from({ length: 10 }, (_, i) => `T${String(i).padStart(2, "0")}`),
    );
    assert.equal(tied, 2);
    assert.equal(more, 3);
    // entro il tetto il pari merito in testa si mostra tutto e non c'è niente da dire
    assert.deepEqual(bestDecks(list.slice(0, 8)).tied, 0);
    assert.equal(bestDecks(list.slice(0, 8)).ranked.length, 8);
  });

  test("In breve e classifica dallo stesso insieme: un mazzo votato non indicizzabile in testa non c'è in nessuna delle due", () => {
    // i dati del 25/09/2026: Buff (4,20) e Spellcast (4,00) hanno la guida sotto la soglia, il resto è indicizzabile
    const indexable = [
      deck("Cure Control", 4.5, 4),
      deck("Healing Healsing", 5, 2),
      ...["3 Pigs Mid Range", "FACE IS THE PLACE", "Just f***in em", "King of Value Trade", "VALUE MAXXING"].map((n) => deck(n, 5, 1)),
      deck("Control A", 4, 1),
      deck("Control B", 4, 1),
    ];
    const excluded = [deck("Buff", 5, 3), deck("Spellcast", 4.5, 4), ...["Move/Combo", "Glinda Reborn", "Value Board", "Qoh"].map((n) => deck(n, 5, 1)), deck("Discard", 4, 1)];
    const { ranked } = bestDecks(indexable);
    assert.deepEqual(
      ranked.map((r) => [r.item.name, r.rank]),
      [
        ["Cure Control", 1],
        ["Healing Healsing", 1],
        ["3 Pigs Mid Range", 3],
        ["FACE IS THE PLACE", 3],
        ["Just f***in em", 3],
        ["King of Value Trade", 3],
        ["VALUE MAXXING", 3],
      ],
    );
    // "In breve" con le stesse voci: due a 4,00 e cinque a 3,67 sul taglio, la frase si omette invece di citare Buff
    assert.equal(pickBrief(indexable).kind, "none");
    // la frase di "In breve" non cita nessun mazzo escluso
    const brief = deckBrief({
      locale: "it",
      t: it.decks.brief,
      decks: 19,
      lastDate: "25 settembre 2026",
      legendaries: [],
      rated: indexable,
      inDecks: (n: number) => `${n} mazzi`,
      votes: (n: number) => `${n} voti`,
    })
      .map((p) => (typeof p === "string" ? p : p.text))
      .join("");
    for (const x of excluded) assert.ok(!brief.includes(x.name), x.name);
    // quelli che col loro voto sarebbero in classifica: Buff e Spellcast, nell'ordine unico
    assert.deepEqual(
      excludedFromBest(indexable, excluded).map((x) => x.name),
      ["Buff", "Spellcast"],
    );
  });

  test("excludedFromBest: nessuno se gli esclusi stanno sotto il taglio, anche il pari merito sul taglio se entra", () => {
    const ranked = [deck("A", 5, 4), deck("B", 4.5, 4), deck("C", 4, 4), deck("D", 4, 3), deck("E", 3.5, 2)];
    assert.deepEqual(excludedFromBest(ranked, [deck("Low", 2, 1)]), []);
    assert.deepEqual(excludedFromBest(ranked, []), []);
    // E ha 3,25: un escluso con lo stesso voto pesato entra col pari merito sul taglio (6 voci, entro il tetto)
    assert.deepEqual(
      excludedFromBest(ranked, [deck("Tie", 3.5, 2)]).map((x) => x.name),
      ["Tie"],
    );
    assert.deepEqual(excludedFromBest([], [deck("Solo", 5, 1)]).map((x) => x.name), ["Solo"]);
  });

  test("la frase degli esclusi sopra il taglio, con i nomi in elenco nella lingua della pagina", () => {
    const parts = fillParts(it.decks.best.excludedAboveMany, {
      list: listParts("it", [[{ text: "Buff", href: "/it/decks/community/buff" }, " (4,20)"], [{ text: "Spellcast", href: "/it/decks/community/spellcast" }, " (4,00)"]]),
      min: ["75"],
    });
    assert.equal(
      parts.map((p) => (typeof p === "string" ? p : p.text)).join(""),
      "Buff (4,20) e Spellcast (4,00) hanno il voto pesato per entrare in classifica ma restano fuori: la guida è sotto le 75 parole o non ancora in italiano.",
    );
  });

  test("le frasi della sezione hanno i loro segnaposto e l'ancora è diversa per lingua", () => {
    const anchors = new Set<string>();
    for (const d of [en, it, es]) {
      const b = d.decks.best;
      assert.match(b.title, /Origins TCG/);
      assert.match(b.lead, /\{date\}/);
      assert.match(b.score, /\{score\}/);
      assert.match(b.by, /\{name\}/);
      assert.match(b.method, /\{min\}/);
      for (const s of [b.excludedMany, b.moreMany, b.excludedRestMany, b.tiedMany]) assert.match(s, /\{n\}/);
      for (const s of [b.excludedOne, b.excludedMany, b.excludedAboveOne, b.excludedAboveMany]) assert.match(s, /\{min\}/);
      for (const s of [b.excludedAboveOne, b.excludedAboveMany]) assert.match(s, /^\{list\}/);
      for (const s of [b.tiedOne, b.tiedMany]) assert.match(s, /#\{rank\}/);
      // la guida "sotto le 75 parole", mai "più corta" senza termine di paragone (revisione del pacchetto)
      assert.doesNotMatch(b.excludedOne + b.excludedMany, /più corta|shorter|más corta/);
      assert.match(b.anchor, /^[a-z]+(?:-[a-z]+)*$/);
      anchors.add(b.anchor);
      assert.ok(d.tier.community.signedTitle && d.tier.community.signedText && d.tier.community.signedProfile);
    }
    assert.equal(anchors.size, 3);
  });
});
