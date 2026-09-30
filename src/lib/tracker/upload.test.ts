/**
 * Test del collegamento app → sito del tracker (Fase 3, 30/09/2026) e delle statistiche: `node --test
 * src/lib/tracker/upload.test.ts`.
 * - upload.ts: la partita che parte dal PC (`toUpload`: dell'avversario solo Leggendaria e carte giocate), il controllo
 *   della rotta (`isUpload`), il codice di collegamento, gli errori; e il confronto con `tracker_match_ok` e le altre
 *   funzioni del blocco TRACKER di supabase/schema.sql (stessi campi, stessi limiti, stesse soglie).
 * - stats.ts, personal.ts, enrich.ts: soglie e letture delle statistiche anonime, statistiche personali, patch e
 *   archetipo aggiunti dal sito.
 * I moduli sono scritti per Next (import senza estensione, alias `@/` in archetype.ts, JSON senza attributi): prima di
 * caricarli il test registra un hook di risoluzione dei moduli di Node, come cardSynergy.test.ts, più l'alias `@/`.
 */
import * as nodeModule from "node:module";
import fs from "node:fs";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const SRC = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const target = specifier.startsWith("@/") ? new URL(specifier.slice(2), SRC).href : specifier;
    if ((/^\.\.?\//.test(target) || target.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(target)) {
      try {
        return next(`${target}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    const resolved = next(target, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const U: typeof import("./upload") = await import("./upload.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const S: typeof import("./stats") = await import("./stats.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const P: typeof import("./personal") = await import("./personal.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const E: typeof import("./enrich") = await import("./enrich.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const M: typeof import("./match") = await import("./match.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const R: typeof import("./replay") = await import("./replay.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const T: typeof import("./testing") = await import("./testing.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const PR: typeof import("./profile") = await import("./profile.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const C: typeof import("../data/cards") = await import("../data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const A: typeof import("../archetype") = await import("../archetype.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const TL: typeof import("../trackerLabels") = await import("../trackerLabels.ts");
const G: typeof import("../../../scripts/schema-guard.mjs") = await import("../../../scripts/schema-guard.mjs");

const NOW = Date.parse("2026-09-30T12:00:00.000Z");

/* ---------- una partita vera del lettore ---------- */

const deck = PR.readInventoryFile(T.inventoryJson([{ name: "On Death", cards: T.MY_DECK }]))![0];
const replay = R.readReplay(R.parseReplay(T.syntheticReplay()), { accountId: T.ME.id });
const end = { endedAt: "2026-09-29T21:00:00.000Z", result: "W" as const, matchId: "offline_secret", deckIndex: 0, missed: "" };
const tracked = await M.buildMatch({ end, accountId: T.ME.id, deck, replay, queue: "normal" });

describe("toUpload: che cosa parte dal PC", () => {
  const up = U.toUpload(tracked, NOW);

  test("tutti i campi, validi per la rotta", () => {
    assert.deepEqual(Object.keys(up).sort(), [...U.UPLOAD_KEYS].sort());
    assert.ok(U.isUpload(up, NOW));
    assert.equal(up.deckCards.length, 13);
    assert.equal(up.deckLegendary, "C00176_MC");
    assert.equal(up.queue, "normal");
    assert.deepEqual(up.plays[0], { t: 1, m: true, c: "C00002_MB", l: 0 });
  });

  test("dell'avversario solo la Leggendaria e le carte che ha giocato, mai il mazzo intero", () => {
    assert.equal(up.oppLegendary, "C00012_MC");
    assert.deepEqual(up.oppPlayed, ["C00012_MC"]);
    const json = JSON.stringify(up);
    // le 12 carte base del mazzo dell'avversario non le ha giocate: non devono esserci
    for (const k of T.BOT_DECK.slice(1).map(R.cardBaseKey)) assert.ok(!json.includes(k), k);
  });

  test("mai nomi, id, rank dell'avversario, modalità o segnale bot", () => {
    const json = JSON.stringify(up);
    for (const secret of [T.ME.id, T.ME.name, T.BOT.id, T.BOT.name, "offline_secret", "Master", "BotBattle", "bot", "Bot", "missed", "arena", "locationPool"]) assert.ok(!json.includes(secret), secret);
  });

  test("valori fuori forma: sistemati o null, mai una partita che il database scarterebbe", () => {
    const odd = {
      ...tracked,
      endedAt: "2026-10-05T00:00:00.000Z",
      deck: { ...tracked.deck, name: `On${String.fromCharCode(7)} Death ${"x".repeat(70)}`, code: "KGBLDC" + "A".repeat(500) + ":00000000" },
      rank: "Master<script>",
      turns: 250,
      plays: [...tracked.plays, { turn: 201, me: true, card: "C00002_MB", lane: 0 }, { turn: 3, me: false, card: "C00031_MB", lane: 7 }],
    };
    const u = U.toUpload(odd, NOW);
    assert.equal(u.endedAt, null);
    assert.equal(u.deckName?.startsWith("On Death x"), true);
    assert.equal([...(u.deckName ?? "")].length, 60);
    assert.equal(u.deckCode, null);
    assert.equal(u.rank, null);
    assert.equal(u.turns, null);
    assert.ok(u.plays.every((p) => p.t <= 200));
    assert.deepEqual(u.plays.at(-1), { t: 3, m: false, c: "C00031_MB", l: null });
    assert.ok(U.isUpload(u, NOW));
  });

  test("nome del mazzo: senza caratteri di controllo, 60 caratteri contando le emoji una volta", () => {
    assert.equal(U.cleanDeckName(`A${String.fromCharCode(0)}B${String.fromCharCode(0x9f)}C`), "ABC");
    assert.equal(U.cleanDeckName("   "), null);
    assert.equal([...(U.cleanDeckName("🃏".repeat(80)) ?? "")].length, 60);
  });
});

describe("isUpload: il controllo della rotta", () => {
  const good = U.toUpload(tracked, NOW);
  const bad = (over: Record<string, unknown>) => U.isUpload({ ...good, ...over }, NOW);

  test("campi in più o in meno, anche quelli del sito", () => {
    assert.equal(bad({ opponentDeck: T.BOT_DECK }), false);
    assert.equal(bad({ patch: "0.7" }), false);
    const { queue: _q, ...noQueue } = good;
    void _q;
    assert.equal(U.isUpload(noQueue, NOW), false);
  });

  test("valori sbagliati", () => {
    for (const over of [
      { id: "nope" },
      { endedAt: "2026-13-45T25:61:61Z" },
      { endedAt: "2026-02-30T10:00:00Z" },
      { endedAt: "2025-12-31T23:59:59Z" },
      { endedAt: "2026-10-02T12:00:00Z" },
      { result: "X" },
      { queue: "BotBattle" },
      { queue: "bot" },
      { deckName: "x".repeat(61) },
      { deckLegendary: "C0017_MC" },
      { deckCards: [...good.deckCards, "C00400_MB"] },
      { deckCards: ["c00002_mb"] },
      { deckCode: "KGBLDC" + "A".repeat(420) + ":00000000" },
      { rank: "Master<script>" },
      { oppPlayed: Array.from({ length: 41 }, (_, i) => `C${String(500 + i).padStart(5, "0")}_MB`) },
      { turns: 201 },
      { turns: 1.5 },
      { plays: Array.from({ length: 301 }, () => ({ t: 1, m: true, c: null, l: null })) },
      { plays: [{ t: 1, m: true, c: null }] },
      { plays: [{ t: 1, m: true, c: null, l: 3 }] },
      { plays: [{ t: -1, m: true, c: null, l: null }] },
      { plays: [{ t: 1, m: "true", c: null, l: null }] },
      { plays: [{ t: 1, m: true, c: null, l: null, x: 1 }] },
    ]) {
      assert.equal(bad(over), false, JSON.stringify(over).slice(0, 80));
    }
  });

  test("valori limite validi", () => {
    assert.equal(bad({ endedAt: null, result: null, deckName: null, deckLegendary: null, deckCards: [], deckCode: null, rank: null, oppLegendary: null, oppPlayed: [], turns: null, plays: [] }), true);
    assert.equal(bad({ endedAt: "2026-10-01T11:59:59Z", deckName: "x".repeat(60), turns: 200, queue: "ranked" }), true);
    assert.equal(bad({ endedAt: "2026-09-29T21:00:00.1234Z" }), true);
    assert.equal(U.timestampOk("2026-01-01T00:00:00Z", NOW), true);
  });

  test("campi del sito: patch e archetipo, o null", () => {
    assert.equal(U.serverFieldsOk({ patch: "0.7", archetype: "midrange" }), true);
    assert.equal(U.serverFieldsOk({ patch: "demo-0921", archetype: null }), true);
    assert.equal(U.serverFieldsOk({ patch: "0.7<", archetype: null }), false);
    assert.equal(U.serverFieldsOk({ patch: null, archetype: "Mid Range" }), false);
  });
});

describe("codice di collegamento, token ed errori", () => {
  test("normalizeLinkCode: maiuscole, spazi e trattini, 8 caratteri", () => {
    assert.equal(U.normalizeLinkCode("abcd efgh"), "ABCD-EFGH");
    assert.equal(U.normalizeLinkCode(" ABCD-EFGH "), "ABCD-EFGH");
    assert.equal(U.normalizeLinkCode("ABCD-EFG"), null);
    assert.equal(U.normalizeLinkCode("ABCD-EFGHI"), null);
    assert.equal(U.normalizeLinkCode(null), null);
    assert.equal(U.normalizeLinkCode(`${" ".repeat(40)}ABCDEFGH`), null);
  });

  test("token", () => {
    assert.equal(U.isTrackerToken(`omt_${"a".repeat(64)}`), true);
    assert.equal(U.isTrackerToken(`omt_${"A".repeat(64)}`), false);
    assert.equal(U.isTrackerToken("omt_"), false);
  });

  test("errori del database → codici e stati HTTP", () => {
    assert.equal(U.trackerErrorCode("invalid_token"), "invalid_token");
    assert.equal(U.trackerErrorCode('P0001: too_many_matches'), "too_many_matches");
    assert.equal(U.trackerErrorCode("boom"), "error");
    assert.equal(U.trackerErrorCode(undefined), "error");
    assert.equal(U.trackerErrorStatus("invalid_token"), 401);
    assert.equal(U.trackerErrorStatus("too_many_devices"), 409);
    assert.equal(U.trackerErrorStatus("too_many_matches"), 429);
    assert.equal(U.trackerErrorStatus("unavailable"), 503);
    assert.equal(U.trackerErrorStatus("error"), 500);
  });
});

/* ---------- statistiche ---------- */

describe("stats: soglie e letture", () => {
  test("soglia: quella di TRACKER_STATS, al lancio 20 partite e 3 giocatori come nell'informativa; prime stime sotto 100", () => {
    const { minGames, minPlayers } = S.TRACKER_STATS;
    assert.equal(S.passesThreshold(minGames, minPlayers), true);
    assert.equal(S.passesThreshold(minGames - 1, minPlayers), false);
    assert.equal(S.passesThreshold(minGames, minPlayers - 1), false);
    // la soglia del lancio è la promessa dell'informativa; quella di prova (01/10/2026) può solo stare sotto, mai sopra
    assert.deepEqual(S.TRACKER_STATS_LAUNCH, { minGames: 20, minPlayers: 3 });
    for (const l of ["en", "it", "es"] as const) assert.match(TL.trackerPrivacy[l], /\b20\b[^.]*\b3\b/, l);
    assert.ok(minGames >= 1 && minPlayers >= 1 && minGames <= 20 && minPlayers <= 3);
    assert.equal(S.testThresholds, minGames < 20 || minPlayers < 3);
    assert.equal(S.isEarly(99), true);
    assert.equal(S.isEarly(100), false);
    assert.equal(S.percent(13, 21), 62);
    assert.equal(S.winRate(0, 0), null);
  });

  test("lista esatta: 13 chiavi in ordine, come deck_list nel database", () => {
    const keys = T.MY_DECK.map(R.cardBaseKey);
    const list = S.listKey(keys);
    assert.equal(list, [...keys].sort().join(","));
    assert.match(list ?? "", S.LIST_RE);
    assert.equal(S.listKey(keys.slice(1)), null);
    assert.equal(S.listKey([...keys.slice(1), "bad"]), null);
    assert.equal(S.listKey([...keys].reverse()), list);
  });

  test("lista di un mazzo del sito, dagli slug", () => {
    const keyOf = (slug: string) => C.getCard(slug)?.key;
    const legendary = C.cards.find((c) => c.legendary && c.key && c.status === "active")!;
    const base = C.cards.filter((c) => !c.legendary && c.type !== "token" && c.key && c.status === "active").slice(0, 12);
    const list = S.deckListKey({ legendary: legendary.slug, cards: base.map((c) => c.slug) }, keyOf);
    assert.equal(list, S.listKey([legendary.key!, ...base.map((c) => c.key!)]));
    assert.equal(S.deckListKey({ legendary: null, cards: [] }, keyOf), null);
    assert.equal(S.deckListKey({ legendary: legendary.slug, cards: ["custom:foo", ...base.slice(1).map((c) => c.slug)] }, keyOf), null);
  });

  test("letture: righe sotto soglia, vittorie impossibili e chiavi strane si scartano", () => {
    // una partita sotto la soglia del momento (19 al lancio; 0 con la soglia di prova del 01/10/2026)
    const below = S.TRACKER_STATS.minGames - 1;
    const rows = [
      { legendary: "C00176_MC", games: 21, wins: 13, players: 3 },
      { legendary: "C00012_MC", games: below, wins: Math.min(10, below), players: 5 },
      { legendary: "C00084_MC", games: "40", wins: "41", players: 4 },
      { legendary: "Mulan", games: 40, wins: 20, players: 4 },
      { legendary: "C00001_MC", games: "40", wins: "20", players: "4" },
    ];
    assert.deepEqual(
      S.parseLegendaryStats(rows).map((r) => r.legendary),
      ["C00176_MC", "C00001_MC"],
    );
    assert.deepEqual(S.parseLegendaryStats(null), []);
    assert.deepEqual(S.parseOverview([{ games: 65, wins: 34, players: 4, with_opponent: 46 }]), { games: 65, wins: 34, players: 4, withOpponent: 46 });
    assert.deepEqual(S.parseOverview([{ games: 65, wins: 34, players: 4, with_opponent: null }])?.withOpponent, null);
    assert.equal(S.parseOverview([]), null);
    const cardsRows = S.parseCardStats([
      { card: "C00002_MB", deck_games: 21, deck_wins: 13, deck_players: 3, played_games: null, played_wins: null, played_players: null, avg_turn: null },
      { card: "C00029_MB", deck_games: 21, deck_wins: 13, deck_players: 3, played_games: 21, played_wins: 13, played_players: 3, avg_turn: "2.8" },
      { card: "C00031_MB", deck_games: below, deck_wins: 0, deck_players: 1, played_games: null, played_wins: null, played_players: null, avg_turn: null },
    ]);
    assert.deepEqual(
      cardsRows.map((c) => [c.card, c.deck?.games ?? null, c.played?.avgTurn ?? null]),
      [
        ["C00002_MB", 21, null],
        ["C00029_MB", 21, 2.8],
      ],
    );
    const list = S.listKey(T.MY_DECK.map(R.cardBaseKey))!;
    assert.equal(S.parseListStats([{ list, legendary: "C00176_MC", games: 21, wins: 13, players: 3 }, { list: "x", legendary: null, games: 50, wins: 1, players: 9 }]).length, 1);
    assert.equal(S.parseArchetypeStats([{ archetype: "midrange", games: 21, wins: 13, players: 3 }, { archetype: "Mid Range", games: 21, wins: 13, players: 3 }]).length, 1);
    assert.equal(S.parseMatchupStats([{ legendary: "C00176_MC", opponent: "C00012_MC", games: 21, wins: 13, players: 3 }]).length, 1);
    // un giocatore sotto la soglia del momento (2 al lancio; 0 con la soglia di prova)
    assert.equal(S.parseOpponentStats([{ opponent: "C00012_MC", games: 20, wins: 3, players: S.TRACKER_STATS.minPlayers - 1 }]).length, 0);
  });
});

describe("personal: statistiche personali", () => {
  const row = (over: Partial<import("./personal").OwnMatch>): import("./personal").OwnMatch => ({
    id: Math.random().toString(16).slice(2).padEnd(32, "0"),
    ended_at: "2026-09-29T21:00:00.000Z",
    created_at: "2026-09-29T21:00:05.000Z",
    result: "W",
    patch: "0.7",
    deck_name: "On Death",
    deck_legendary: "C00176_MC",
    deck_list: S.listKey(T.MY_DECK.map(R.cardBaseKey)),
    opponent_legendary: "C00012_MC",
    turns: 9,
    ...over,
  });

  test("totali, mazzi per lista esatta (o Leggendaria), avversari, esiti sconosciuti a parte", () => {
    const s = P.personalStats([
      row({ result: "W" }),
      row({ result: "L", ended_at: "2026-09-29T22:00:00.000Z", deck_name: "On Death v2" }),
      row({ result: null }),
      row({ result: "W", deck_list: null, deck_legendary: "C00084_MC", deck_name: null, opponent_legendary: null, patch: "demo-0921", ended_at: "2026-09-22T10:00:00.000Z" }),
    ]);
    assert.deepEqual([s.games, s.wins, s.losses, s.unknown], [3, 2, 1, 1]);
    assert.equal(s.decks.length, 2);
    assert.deepEqual([s.decks[0].name, s.decks[0].games, s.decks[0].wins], ["On Death v2", 2, 1]);
    assert.equal(s.decks[1].key, "legendary:C00084_MC");
    assert.deepEqual(s.opponents, [{ legendary: "C00012_MC", games: 2, wins: 1, losses: 1 }]);
    assert.equal(s.lastAt, "2026-09-29T22:00:00.000Z");
    assert.deepEqual(s.patches, ["0.7", "demo-0921"]);
    assert.equal(P.recentMatches([row({}), row({ ended_at: "2026-09-30T01:00:00.000Z", deck_name: "last" })], 1)[0].deck_name, "last");
  });

  test("nessuna partita", () => {
    assert.deepEqual(P.personalStats([]), { games: 0, wins: 0, losses: 0, unknown: 0, decks: [], opponents: [], lastAt: null, patches: [] });
  });
});

describe("enrich: patch e archetipo aggiunti dal sito", () => {
  const up = U.toUpload(tracked, NOW);

  test("con dipendenze finte: valori validi passano, gli altri diventano null", () => {
    const ok = E.enrichUpload(up, { patchOf: () => "0.7", archetypeOf: () => "midrange" }, NOW);
    assert.deepEqual([ok.patch, ok.archetype], ["0.7", "midrange"]);
    const odd = E.enrichUpload(up, { patchOf: () => "0.7<x", archetypeOf: () => "Mid Range" }, NOW);
    assert.deepEqual([odd.patch, odd.archetype], [null, null]);
    let asked = "";
    E.enrichUpload({ ...up, endedAt: null, deckCards: up.deckCards.slice(0, 5) }, { patchOf: (iso) => ((asked = iso), null), archetypeOf: () => assert.fail("mazzo a metà") }, NOW);
    assert.equal(asked, new Date(NOW).toISOString());
  });

  test("patch vera: quella in vigore all'ora di fine partita", () => {
    const latest = C.patchOrder[C.patchOrder.length - 1];
    const p = C.patches[latest] as { date: string; at?: string };
    const after = p.at ?? `${p.date}T23:59:00.000Z`;
    assert.equal(E.siteEnrichDeps.patchOf(after), latest);
    assert.equal(E.siteEnrichDeps.patchOf("2026-09-22T12:00:00.000Z"), "demo-0921");
  });

  test("archetipo vero: le regole del modulo di pubblicazione, solo con 13 carte note e una Leggendaria", () => {
    const legendary = C.cards.find((c) => c.legendary && c.key && c.status === "active")!;
    const base = C.cards.filter((c) => !c.legendary && c.type !== "token" && c.key && c.status === "active").slice(0, 12);
    const keys = [legendary.key!, ...base.map((c) => c.key!)];
    const expected = A.suggestArchetype({ name: "", legendary: legendary.slug, cards: base.map((c) => c.slug), customCards: [] });
    assert.equal(E.archetypeOfKeys(keys), expected);
    assert.match(expected, U.ARCHETYPE_RE);
    assert.equal(E.archetypeOfKeys(keys.slice(1)), null);
    assert.equal(E.archetypeOfKeys([...keys.slice(1), "C99999_MB"]), null);
    const second = C.cards.find((c) => c.legendary && c.key && c.key !== legendary.key)!;
    assert.equal(E.archetypeOfKeys([...keys.slice(0, 12), second.key!]), null);
  });
});

/* ---------- confronto con il blocco TRACKER di supabase/schema.sql ---------- */

describe("database: blocco TRACKER di supabase/schema.sql", () => {
  const MARKER = "-- ===== 30/09/2026: TRACKER =====";
  const schema = fs.readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const at = schema.indexOf(MARKER);
  const next = at >= 0 ? schema.indexOf("\n-- ===== ", at + MARKER.length) : -1;
  const block = at >= 0 ? schema.slice(at, next < 0 ? undefined : next) : "";
  /** Il testo di una funzione del blocco, così com'è scritto (maiuscole comprese). */
  const fn = (name: string) => {
    const i = block.indexOf(`create or replace function public.${name}(`);
    assert.ok(i >= 0, `manca ${name}`);
    const j = block.indexOf("$$;", block.indexOf("$$", i) + 2);
    return block.slice(i, j + 3);
  };
  const src = (re: RegExp) => re.source;

  test("il blocco c'è, dopo FUMETTI IN PIÙ LINGUE, e schema-guard lo accetta", () => {
    assert.ok(at > schema.indexOf("-- ===== 30/09/2026: FUMETTI IN PIÙ LINGUE ====="));
    assert.deepEqual(G.schemaProblems(schema), []);
    assert.deepEqual(G.singleDollarLines(block), []);
    assert.deepEqual(G.overLongRepetitions(block), []);
    assert.ok(!/\bpublic\.profiles\b/.test(G.sqlStatements(block).filter((s) => /^(grant|revoke)\b/.test(s)).join("\n")));
  });

  test("tracker_match_ok: gli stessi campi dell'app più i due del sito", () => {
    const body = fn("tracker_match_ok");
    const keys = /\(m - array\[([^\]]+)\]\)/.exec(body)?.[1].split(",").map((k) => k.trim().replace(/'/g, ""));
    assert.deepEqual(keys, [...U.UPLOAD_KEYS, ...U.SERVER_KEYS]);
    assert.match(body, /\(x - array\['t', 'm', 'c', 'l'\]\)/);
    assert.match(body, /x \?& array\['t', 'm', 'c', 'l'\]/);
  });

  test("tracker_match_ok: stessi limiti e stesse forme di upload.ts", () => {
    const body = fn("tracker_match_ok");
    const L = U.UPLOAD_LIMITS;
    for (const part of [
      `jsonb_array_length(m -> 'deckCards') > ${L.deckCards}`,
      `jsonb_array_length(m -> 'oppPlayed') > ${L.oppPlayed}`,
      `jsonb_array_length(m -> 'plays') > ${L.plays}`,
      `tracker_int_ok(m -> 'turns', 0, ${L.maxTurn})`,
      `tracker_int_ok(x -> 't', 0, ${L.maxTurn})`,
      `tracker_int_ok(x -> 'l', 0, ${L.maxLane})`,
      `char_length(coalesce(m ->> 'deckName', '')) > ${L.deckName}`,
      `char_length(m ->> 'deckCode') > ${L.deckCode}`,
      `char_length(coalesce(m ->> 'rank', '')) > ${L.rank}`,
      `(m ->> 'queue') not in ('ranked', 'normal')`,
      `'${src(U.ID_RE)}'`,
      `'${src(U.DECK_CODE_RE)}'`,
      `'${src(U.RANK_RE)}'`,
      `'${src(U.PATCH_RE)}'`,
      `'${src(U.ARCHETYPE_RE)}'`,
    ]) {
      assert.ok(body.includes(part), part);
    }
    assert.ok(fn("tracker_key_ok").includes(`'${src(U.KEY_RE)}'`));
    const ts = fn("tracker_ts_ok");
    assert.ok(ts.includes(`'${src(U.TIMESTAMP_RE)}'`), "forma della data");
    assert.ok(ts.includes(`timestamptz '${U.EARLIEST_MATCH.slice(0, 10)} 00:00:00+00' and now() + interval '1 day'`), "intervallo della data");
  });

  test("tracker_submit, collegamento e scollegamento: token, tetti, codice", () => {
    const submit = fn("tracker_submit");
    assert.ok(submit.includes(`'${src(U.TOKEN_RE)}'`));
    assert.ok(submit.includes(`if n > ${U.UPLOAD_LIMITS.batch} then raise exception 'invalid_matches'`));
    assert.ok(submit.includes(`interval '1 day') + n > ${U.UPLOAD_LIMITS.perDay} then`));
    assert.ok(submit.includes(`string_agg(k, ',' order by k collate "C")`), "lista esatta come listKey (ordine dei caratteri, virgole)");
    const code = fn("tracker_link_code");
    assert.ok(code.includes(`'${U.LINK.alphabet}'`));
    assert.ok(code.includes(`interval '${U.LINK.minutes} minutes'`));
    assert.ok(code.includes(`interval '1 hour') >= ${U.LINK.perHour} then`));
    const claim = fn("tracker_link_claim");
    assert.ok(claim.includes(`char_length(norm) <> ${U.LINK.length}`));
    assert.ok(claim.includes(`d.revoked_at is null) >= ${U.LINK.maxDevices} then`));
    assert.ok(fn("tracker_device_unlink").includes(`'${src(U.TOKEN_RE)}'`));
    for (const e of U.TRACKER_ERRORS) assert.ok(block.includes(`raise exception '${e}'`), e);
    assert.ok(block.includes(`deck_list ~ '${src(S.LIST_RE)}'`), "vincolo di deck_list = LIST_RE");
  });

  test("statistiche: soglia e coda uguali a TRACKER_STATS", () => {
    assert.ok(fn("tracker_stats_ok").includes(`games >= ${S.TRACKER_STATS.minGames} and players >= ${S.TRACKER_STATS.minPlayers}`));
    assert.equal(S.TRACKER_STATS.queue, null);
    assert.ok(fn("tracker_stats_queue").includes("select null::text"));
  });

  test("statistiche: solo aggregati di una patch, con la soglia, mai proprietari né id", () => {
    const names = [...block.matchAll(/create or replace function public\.(tracker_stats_(?!ok|queue)\w+)\(p_patch text\)/g)].map((m) => m[1]);
    assert.deepEqual(names.sort(), ["tracker_stats_archetypes", "tracker_stats_cards", "tracker_stats_legendaries", "tracker_stats_lists", "tracker_stats_matchups", "tracker_stats_opponents", "tracker_stats_overview"]);
    const stmts = G.sqlStatements(block);
    for (const name of names) {
      const body = fn(name);
      const columns = /returns table \(([^)]*)\)/.exec(body)?.[1] ?? "";
      assert.ok(!/\b(owner|id|device_id)\b/.test(columns), `${name}: ${columns}`);
      assert.ok(body.includes("security definer set search_path = public, pg_temp"), name);
      assert.ok(body.includes("public.tracker_stats_ok("), `${name}: soglia`);
      assert.ok(body.includes("public.tracker_stat_rows(p_patch)"), `${name}: righe della patch`);
      assert.ok(stmts.includes(`grant execute on function public.${name}(text) to anon, authenticated`), `${name}: grant`);
    }
    // le righe grezze (con il proprietario) non le chiama nessuno da fuori
    assert.ok(stmts.includes("revoke all on function public.tracker_stat_rows(text) from public, anon, authenticated"));
    assert.ok(!stmts.some((s) => /^grant\b/.test(s) && s.includes("tracker_stat_rows")));
    const rowsFn = fn("tracker_stat_rows");
    assert.ok(rowsFn.includes("distinct on (t.id)"), "una volta per impronta");
    assert.ok(rowsFn.includes("p_patch is not null"), "niente somme di più patch");
  });

  test("tabelle: nessuna scrittura diretta, le partite le legge solo il proprietario", () => {
    const stmts = G.sqlStatements(block);
    for (const t of ["tracker_devices", "tracker_link_codes", "tracked_matches"]) assert.ok(stmts.includes(`revoke all on public.${t} from anon, authenticated`), t);
    assert.ok(stmts.includes("grant select (id, name, created_at, last_seen_at, revoked_at) on public.tracker_devices to authenticated"));
    assert.ok(stmts.includes("grant select on public.tracked_matches to authenticated"));
    assert.ok(!stmts.some((s) => /^grant (insert|update|delete|all)\b/.test(s)));
    assert.ok(!stmts.some((s) => /^create policy\b/.test(s) && /\bfor (insert|update|delete|all)\b/.test(s)));
    // la pagina legge solo queste colonne
    for (const c of P.OWN_MATCH_COLUMNS.split(",").map((x) => x.trim())) assert.ok(block.includes(`  ${c} `), c);
  });
});
