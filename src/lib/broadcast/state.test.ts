/**
 * Test di Broadcasting OM (`state.ts`, `labels.ts`, `demo.ts`): `node --test src/lib/broadcast/state.test.ts`.
 * Stato della diretta, pulizia di quello che arriva da un indirizzo, codifica per OBS, punteggio della serie, copie.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  BASE_CARDS,
  LIMITS,
  MAX_DECKS,
  STATE_PREFIX,
  bumpScore,
  clampScore,
  cleanText,
  copiesLeft,
  cyclePlayed,
  decodeState,
  deckFromKeys,
  emptyState,
  cleanUrl,
  cleanImage,
  withoutUploads,
  preferStored,
  SPONSOR_FORMATS,
  STORED_STATE_MAX,
  visibleSponsors,
  MAX_SPONSORS,
  SPONSOR_SECONDS,
  SCORE_SECONDS,
  scoreSlot,
  slotSeconds,
  encodeState,
  markPlayed,
  phaseOf,
  sanitizeState,
  seriesWinner,
  stateFromHash,
  winsNeeded,
  type BroadcastDeck,
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in stream.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./state.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { overlayLabels } from "./labels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { demoState } from "./demo.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { decodeGameCode, encodeGameCode } from "../deckcode.ts";

const known = new Set(["merlin", "spellbook", "roo", "jill", "baby-bear", "mind-palace", "piglet", "tigger", "kanga", "eeyore", "hare", "tortoise", "goldi", "winnie-the-pooh"]);
const isCard = (s: string) => known.has(s) || /^[a-z-]+$/.test(s);
const onlyKnown = (s: string) => known.has(s);

const deck = (): BroadcastDeck => ({ name: "", legendary: "merlin", cards: ["spellbook", "roo"], played: {} });

describe("punteggio della serie", () => {
  test("vittorie necessarie per Bo1, Bo3, Bo5", () => {
    assert.equal(winsNeeded(1), 1);
    assert.equal(winsNeeded(3), 2);
    assert.equal(winsNeeded(5), 3);
  });
  test("il punteggio sta fra 0 e le vittorie necessarie", () => {
    assert.equal(clampScore(-2, 3), 0);
    assert.equal(clampScore(7, 3), 2);
    assert.equal(clampScore(2.9, 5), 2);
    assert.equal(clampScore("3", 5), 0);
    assert.equal(clampScore(Number.NaN, 3), 0);
  });
  test("chi chiude la serie vince; a pari chiusura nessuno", () => {
    const s = emptyState();
    assert.equal(seriesWinner(s), null);
    const a = bumpScore(bumpScore(s, 0, 1), 0, 1);
    assert.equal(seriesWinner(a), 0);
    assert.equal(bumpScore(a, 0, 1).players[0].score, 2, "oltre le vittorie necessarie non si va");
    const both = { ...a, players: [a.players[0], { ...a.players[1], score: 2 }] as typeof a.players };
    assert.equal(seriesWinner(both), null);
  });
});

describe("copie giocate", () => {
  test("Leggendaria 1 copia, carte base 2, le altre 0", () => {
    const d = deck();
    assert.equal(copiesLeft(d, "merlin"), 1);
    assert.equal(copiesLeft(d, "roo"), 2);
    assert.equal(copiesLeft(d, "jill"), 0);
  });
  test("markPlayed resta fra 0 e le copie", () => {
    let d = markPlayed(deck(), "roo", 1);
    d = markPlayed(d, "roo", 1);
    d = markPlayed(d, "roo", 1);
    assert.equal(copiesLeft(d, "roo"), 0);
    d = markPlayed(markPlayed(markPlayed(d, "roo", -1), "roo", -1), "roo", -1);
    assert.deepEqual(d.played, {});
    assert.equal(markPlayed(deck(), "jill", 1).played.jill, undefined);
  });
  test("il clic della regia toglie una copia e, finite, le rimette", () => {
    let d = cyclePlayed(deck(), "roo");
    assert.equal(copiesLeft(d, "roo"), 1);
    d = cyclePlayed(d, "roo");
    assert.equal(copiesLeft(d, "roo"), 0);
    d = cyclePlayed(d, "roo");
    assert.equal(copiesLeft(d, "roo"), 2);
    assert.equal(copiesLeft(cyclePlayed(cyclePlayed(deck(), "merlin"), "merlin"), "merlin"), 1);
  });
});

describe("pulizia dello stato", () => {
  test("qualunque cosa diventa uno stato valido", () => {
    for (const raw of [null, 3, "x", [], { players: "no" }, { tournament: { bestOf: 7 } }]) {
      const s = sanitizeState(raw, isCard);
      assert.equal(s.v, 1);
      assert.equal(s.players.length, 2);
      assert.equal(s.tournament.bestOf, 3);
      assert.ok(s.players.every((p) => p.decks.length >= 1));
    }
  });
  test("testi su una riga, senza invisibili, tagliati", () => {
    assert.equal(cleanText("  Ald\u200bry\n\tcup  ", 20), "Ald ry cup");
    assert.equal(cleanText("x".repeat(100), LIMITS.player).length, LIMITS.player);
    assert.equal(cleanText(42, 10), "");
    assert.equal([...cleanText("🃏".repeat(30), LIMITS.player)].length, LIMITS.player, "si taglia per caratteri, mai a metà emoji");
  });
  test("carte sconosciute, doppioni e Leggendaria fra le base si tolgono; massimo 12 carte e 4 mazzi", () => {
    const s = sanitizeState(
      {
        players: [
          {
            decks: Array.from({ length: 6 }, () => ({ legendary: "nope", cards: ["roo", "roo", "merlin", "x1", ...Array.from({ length: 20 }, (_, i) => `c-${"abcdefghijklmnopqrstuvwxyz"[i]}`)], played: { roo: 9, ghost: 1 } })),
            active: 5,
          },
        ],
      },
      isCard,
    );
    const p = s.players[0];
    assert.equal(p.decks.length, MAX_DECKS);
    assert.equal(p.active, 0, "mazzo in campo fuori dall'elenco: il primo");
    assert.equal(p.decks[0].legendary, "nope");
    assert.equal(p.decks[0].cards.length, BASE_CARDS);
    assert.equal(new Set(p.decks[0].cards).size, BASE_CARDS);
    assert.deepEqual(p.decks[0].played, { roo: 2 });
    const strict = sanitizeState({ players: [{ decks: [{ legendary: "nope", cards: ["roo", "x1"] }] }] }, onlyKnown);
    assert.equal(strict.players[0].decks[0].legendary, null);
    assert.deepEqual(strict.players[0].decks[0].cards, ["roo"]);
  });
  test("lato della lista e lingua solo fra i valori ammessi", () => {
    const s = sanitizeState({ lang: "de", players: [{ list: "top" }, { list: "off" }] }, isCard);
    assert.equal(s.lang, "en");
    assert.equal(s.players[0].list, "right");
    assert.equal(s.players[1].list, "off");
  });
});

describe("spazio sponsor", () => {
  test("spento di default, anche quando manca nello stato", () => {
    assert.equal(emptyState().sponsors.on, false);
    assert.equal(sanitizeState({}, isCard).sponsors.on, false);
    assert.equal(sanitizeState({ sponsors: { on: "yes" } }, isCard).sponsors.on, false);
  });
  test("solo indirizzi https, senza credenziali", () => {
    assert.equal(cleanUrl("https://example.com/logo.png"), "https://example.com/logo.png");
    assert.equal(cleanUrl(" https://shop.example.it "), "https://shop.example.it/");
    for (const bad of ["http://example.com/a.png", "javascript:alert(1)", "data:image/png;base64,AAAA", "https://user:pw@example.com/", "https://localhost/a.png", "ftp://example.com", "https://" + "a".repeat(400) + ".com", 42, ""]) {
      assert.equal(cleanUrl(bad), "", String(bad).slice(0, 40));
    }
  });
  test("al massimo 3 sponsor, secondi fra i limiti, nomi tagliati", () => {
    const s = sanitizeState({ sponsors: { on: true, seconds: 1, items: Array.from({ length: 6 }, (_, i) => ({ name: "Sponsor ".repeat(10) + i, logo: "http://x.com/a.png", url: "https://x.com" })) } }, isCard);
    assert.equal(s.sponsors.items.length, MAX_SPONSORS);
    assert.equal(s.sponsors.seconds, SPONSOR_SECONDS.min);
    assert.equal(s.sponsors.scoreSeconds, SCORE_SECONDS.default);
    assert.ok(s.sponsors.items.every((x) => x.name.length <= 32 && x.logo === "" && x.url === "https://x.com/"));
    assert.equal(sanitizeState({ sponsors: { seconds: 999 } }, isCard).sponsors.seconds, SPONSOR_SECONDS.max);
    assert.equal(sanitizeState({ sponsors: { scoreSeconds: 1 } }, isCard).sponsors.scoreSeconds, SCORE_SECONDS.min);
    assert.deepEqual([SCORE_SECONDS.default, SPONSOR_SECONDS.default], [20, 7], "20 secondi il punteggio, 7 lo sponsor");
  });
  test("il punteggio si alterna con gli sponsor, uno per giro", () => {
    assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((n) => scoreSlot(n, 0).show), Array(7).fill("score"));
    assert.deepEqual([0, 1, 2, 3].map((n) => scoreSlot(n, 1)), [{ show: "score" }, { show: "sponsor", index: 0 }, { show: "score" }, { show: "sponsor", index: 0 }]);
    assert.deepEqual([1, 3, 5, 7].map((n) => (scoreSlot(n, 3) as { index: number }).index), [0, 1, 2, 0]);
    const t = { scoreSeconds: 20, seconds: 7 };
    assert.deepEqual([0, 1, 2].map((n) => slotSeconds(n, t, 2)), [20, 7, 20]);
    assert.equal(slotSeconds(1, t, 0), 20, "senza sponsor resta il punteggio");
  });
  test("formati con misure esplicite: logo 612 × 204 e bannerino 652 × 244, il doppio di quello che va in onda", () => {
    for (const f of Object.values(SPONSOR_FORMATS)) assert.deepEqual([f.width, f.height], [f.shown.width * 2, f.shown.height * 2], "si carica al doppio della misura in onda");
    assert.deepEqual([SPONSOR_FORMATS.banner.shown.width, SPONSOR_FORMATS.banner.shown.height], [326, 122], "il bannerino riempie il riquadro del punteggio");
    assert.deepEqual([SPONSOR_FORMATS.logo.width, SPONSOR_FORMATS.logo.height], [612, 204]);
  });
  test("immagini: data URL raster entro il peso, https; mai SVG, HTML o testo", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    assert.equal(cleanImage(png), png);
    assert.equal(cleanImage("https://cdn.example.com/logo.webp"), "https://cdn.example.com/logo.webp");
    for (const bad of ["data:image/svg+xml;base64,PHN2Zz4=", "data:text/html;base64,PGI+", "data:image/png;base64,abc def", "data:image/png;base64," + "A".repeat(300_000)]) {
      assert.equal(cleanImage(bad), "", bad.slice(0, 30));
    }
    const s = sanitizeState({ sponsors: { on: true, items: [{ name: "A", kind: "banner", logo: png }, { name: "B", kind: "poster" }] } }, isCard);
    assert.equal(s.sponsors.items[0].kind, "banner");
    assert.equal(s.sponsors.items[0].logo, png);
    assert.equal(s.sponsors.items[1].kind, "logo");
  });
  test("le immagini caricate restano nel browser: fuori dall'indirizzo, rimesse quando è la stessa diretta", () => {
    const png = "data:image/png;base64," + "A".repeat(20_000);
    const full = sanitizeState({ sponsors: { on: true, items: [{ name: "Acme", kind: "banner", logo: png }] } }, isCard);
    const url = withoutUploads(full);
    assert.equal(url.sponsors.items[0].logo, "");
    assert.equal(url.sponsors.items[0].name, "Acme");
    assert.ok(encodeState(url).length < 8000, "l'indirizzo resta corto");
    assert.equal(decodeState(encodeState(full), isCard), null, "con l'immagine non entra nell'indirizzo");
    assert.equal(decodeState(encodeState(full), isCard, STORED_STATE_MAX)?.sponsors.items[0].logo, png);
    assert.equal(preferStored(url, full), full);
    const other = { ...url, tournament: { ...url.tournament, name: "Altro" } };
    assert.equal(preferStored(other, full), other, "un indirizzo di un'altra diretta vince");
    assert.equal(preferStored(null, full), full);
  });
  test("si mostrano solo con lo spazio acceso e un nome o un logo", () => {
    const items = [{ name: "", kind: "logo" as const, logo: "", url: "https://a.com/" }, { name: "Acme", kind: "logo" as const, logo: "", url: "" }];
    assert.deepEqual(visibleSponsors({ on: false, scoreSeconds: 20, seconds: 7, items }), []);
    assert.deepEqual(visibleSponsors({ on: true, scoreSeconds: 20, seconds: 7, items }).map((x) => x.name), ["Acme"]);
  });
  test("la partita di prova ha lo spazio acceso con un segnaposto, nessun marchio vero", () => {
    const s = demoState("it");
    assert.equal(s.sponsors.on, true);
    assert.equal(s.sponsors.items[0].name, "Il tuo sponsor qui");
    assert.equal(s.sponsors.items[0].logo, "");
  });
});

describe("codifica per l'indirizzo dell'overlay", () => {
  test("andata e ritorno della partita di prova", () => {
    const s = demoState("it");
    const code = encodeState(s);
    assert.ok(code.startsWith(STATE_PREFIX));
    assert.ok(code.length < 4000, `indirizzo corto (${code.length})`);
    assert.ok(/^[A-Za-z0-9._-]+$/.test(code), "solo caratteri sicuri in un indirizzo");
    assert.deepEqual(decodeState(code, isCard), sanitizeState(s, isCard));
  });
  test("testo estraneo, rovinato o troppo lungo: null", () => {
    assert.equal(decodeState("", isCard), null);
    assert.equal(decodeState("B2.abc", isCard), null);
    assert.equal(decodeState(`${STATE_PREFIX}%%%`, isCard), null);
    assert.equal(decodeState(`${STATE_PREFIX}${"A".repeat(9000)}`, isCard), null);
  });
  test("lo stato si legge dall'hash", () => {
    assert.equal(stateFromHash("#s=B1.abc"), "B1.abc");
    assert.equal(stateFromHash("#x=1&s=B1.a=b"), "B1.a=b");
    assert.equal(stateFromHash("#nothing"), null);
  });
});

describe("mazzi da codici e tornei", () => {
  const byKey = new Map([
    ["C0001_MB", { slug: "merlin", legendary: true }],
    ["C0002_MB", { slug: "roo", legendary: false }],
    ["C0003_MB", { slug: "jill", legendary: false }],
  ]);
  test("chiavi del codice del gioco → Leggendaria, carte base e chiavi sconosciute", () => {
    const { deck: d, unknown } = deckFromKeys(["C0002_MB_V00000", "C0001_MB", "C0003_MB_V00002", "C0099_MB"], (k) => byKey.get(k));
    assert.equal(d.legendary, "merlin");
    assert.deepEqual(d.cards, ["roo", "jill"]);
    assert.equal(unknown, 1);
  });
  test("il codice che copia il pubblico, incollato nella regia, ridà lo stesso mazzo", async () => {
    const keys = ["C0003_MB", "C0001_MB", "C0002_MB"];
    const code = await encodeGameCode(keys);
    const res = await decodeGameCode(code);
    assert.ok("keys" in res);
    const { deck: d, unknown } = deckFromKeys(res.keys, (k) => byKey.get(k));
    assert.equal(unknown, 0);
    assert.equal(d.legendary, "merlin");
    assert.deepEqual([...d.cards].sort(), ["jill", "roo"]);
  });
  test("fase dal turno del tabellone", () => {
    const labels = overlayLabels.it.phases;
    assert.equal(phaseOf(4, 4, labels), "Finale");
    assert.equal(phaseOf(3, 4, labels), "Semifinale");
    assert.equal(phaseOf(2, 4, labels), "Quarti di finale");
    assert.equal(phaseOf(1, 4, labels), "Turno 1");
    assert.equal(phaseOf(1, 1, labels), "Finale");
    assert.equal(phaseOf(1, 2, labels), "Semifinale");
  });
});

describe("testi e partita di prova", () => {
  test("le cinque lingue hanno le stesse chiavi e la dicitura su Koin Games", () => {
    const keys = (o: object) => JSON.stringify(Object.keys(o).sort());
    for (const lang of ["it", "es", "fr", "pt"] as const) assert.equal(keys(overlayLabels[lang]), keys(overlayLabels.en));
    for (const l of Object.values(overlayLabels)) assert.match(l.unofficial, /Koin Games/);
    assert.match(overlayLabels.fr.copied, / !$/, "francese: spazio insecabile prima del punto esclamativo");
  });
  test("la partita di prova è quella del mockup: Aldry 1, Dav 0, Bo3, Dav con il terzo mazzo", () => {
    const s = demoState();
    assert.equal(s.players[0].name, "Aldry");
    assert.equal(s.players[1].name, "Dav");
    assert.equal(s.players[0].score, 1);
    assert.equal(s.tournament.bestOf, 3);
    assert.equal(s.players[1].active, 2);
    for (const p of s.players) for (const d of p.decks) assert.equal(d.cards.length, BASE_CARDS);
  });
});
