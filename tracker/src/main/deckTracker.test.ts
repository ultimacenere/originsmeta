/** Test del pannello del mazzo (deckTracker.ts) e dei suoi indirizzi per OBS: `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_COPIES, deckTrackerView } from "./deckTracker";
import { overlayFile, type CardLookup } from "./overlay";
import type { ScannedMatch } from "../shared/reconstruct";
import type { TrackedMatch } from "../../../src/lib/tracker/match";

const TABLE: Record<string, { name: string; legendary: boolean; slug: string; mana: number; type: string }> = {
  L_ME: { name: "Queen of Hearts", legendary: true, slug: "queen-of-hearts", mana: 4, type: "unit" },
  A: { name: "Mary", legendary: false, slug: "mary", mana: 3, type: "unit" },
  B: { name: "Billy", legendary: false, slug: "billy", mana: 2, type: "unit" },
  S: { name: "Trash for Treasure", legendary: false, slug: "trash-for-treasure", mana: 1, type: "spell" },
  L_OPP: { name: "Merlin", legendary: true, slug: "merlin", mana: 5, type: "unit" },
  X: { name: "Huck Finn", legendary: false, slug: "huck-finn", mana: 2, type: "unit" },
};
const card: CardLookup = (k) => TABLE[k];
const deck = { name: "On Death", legendary: "L_ME", cards: ["L_ME", "A", "B", "S"] };

const match = (result: "W" | "L", cards = deck.cards): TrackedMatch => ({
  v: 2,
  id: Math.random().toString(36),
  endedAt: "2026-10-10T00:11:31.466Z",
  result,
  queue: "normal",
  deck: { name: "On Death", legendary: "L_ME", cards, code: null },
  rank: null,
  opponent: null,
  arena: null,
  locationPool: null,
  turns: null,
  plays: [],
  missed: "",
});

const scan: ScannedMatch = {
  startMs: 0,
  endMs: 1,
  myLegendary: "L_ME",
  oppLegendary: "L_OPP",
  turns: 4,
  plays: [
    { turn: 1, me: true, card: "B", lane: 1 },
    { turn: 2, me: true, card: "B", lane: 2 },
    { turn: 2, me: false, card: "X", lane: 3 },
    { turn: 3, me: true, card: "A", lane: 1 },
    { turn: 3, me: false, card: "L_OPP", lane: 2 },
    { turn: 4, me: false, card: "X", lane: 1 },
    { turn: 4, me: true, card: "B", lane: 3 }, // una terza copia letta per errore non va oltre le copie del mazzo
  ],
  opponentCards: ["L_OPP", "X"],
  complete: true,
};

test("mazzo scelto: Leggendaria a parte, carte per costo, due copie, record del mazzo", () => {
  const v = deckTrackerView({ activeDeck: deck, matches: [match("W"), match("L"), match("W"), match("W", ["L_ME", "A"])], live: null, scanner: false, card, now: 0 });
  assert.equal(v.deck?.legendary?.name, "Queen of Hearts");
  assert.deepEqual(v.deck?.cards.map((c) => `${c.mana} ${c.name}`), ["1 Trash for Treasure", "2 Billy", "3 Mary"]);
  assert.ok(v.deck?.cards.every((c) => c.copies === BASE_COPIES && c.played === 0));
  assert.equal(v.deck?.cards[0].spell, true);
  assert.deepEqual(v.record, { wins: 2, losses: 1, games: 3 });
  assert.equal(v.live, null);
  assert.equal(v.scanner, false);
});

test("dal vivo: copie giocate, round, Leggendaria e carte rivelate dall'avversario", () => {
  const v = deckTrackerView({ activeDeck: deck, matches: [], live: { scan, inMatch: true }, scanner: true, card, now: 0 });
  const by = (name: string) => v.deck!.cards.find((c) => c.name === name)!;
  assert.equal(by("Billy").played, 2, "mai oltre le copie del mazzo");
  assert.equal(by("Mary").played, 1);
  assert.equal(by("Trash for Treasure").played, 0);
  assert.equal(v.live?.inMatch, true);
  assert.equal(v.live?.round, 4);
  assert.equal(v.live?.opponent.legendary?.name, "Merlin");
  assert.deepEqual(v.live?.opponent.seen.map((c) => `${c.name} x${c.copies}`), ["Huck Finn x2"]);
});

test("niente nomi, rank o bot: solo carte", () => {
  const v = deckTrackerView({ activeDeck: deck, matches: [], live: { scan, inMatch: false }, scanner: true, card, now: 0 });
  const text = JSON.stringify(v);
  for (const word of ["rank", "bot", "Bot", "boss", "name\":\"Uaxchi"]) assert.ok(!text.includes(word), word);
});

test("nessun mazzo scelto", () => {
  const v = deckTrackerView({ activeDeck: null, matches: [], live: null, scanner: true, card, now: 0 });
  assert.equal(v.deck, null);
  assert.equal(v.record, null);
});

test("indirizzi del pannello per OBS", () => {
  assert.equal(overlayFile("/overlay/deck"), "deck.html");
  assert.equal(overlayFile("/overlay/deck.js"), "deck.js");
  assert.equal(overlayFile("/overlay/deck.css"), "deck.css");
  assert.equal(overlayFile("/overlay/deck.html"), null, "la pagina solo dal suo indirizzo");
  assert.equal(overlayFile("/overlay/../deck.js"), null);
  assert.equal(overlayFile("/overlay/frames.js"), null);
});
