/**
 * Test del lettore del tracker (`replay.ts`, `profile.ts`, `match.ts`): `node --test src/lib/tracker/tracker.test.ts`.
 *
 * I replay dei test sono costruiti qui con un piccolo codificatore della stessa grammatica (nessun file del gioco nel
 * repo: sono materiale di Koin e contengono i nomi dei giocatori). In fondo, un test legge anche i file veri del PC
 * (replay in Documenti, cache in LocalLow) se ci sono, e si salta altrove: controlla che dopo una patch la grammatica e
 * la regola delle istanze reggano ancora, senza stampare nulla dei file.
 *
 * `match.ts` importa deckcode.ts e replay.ts senza estensione, come vuole Next: prima di caricarlo il test registra
 * l'hook di risoluzione dei moduli di Node (come cardSynergy.test.ts) che aggiunge `.ts` agli import relativi.
 */
import * as nodeModule from "node:module";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(specifier, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const replayModule: typeof import("./replay") = await import("./replay.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const profileModule: typeof import("./profile") = await import("./profile.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const matchModule: typeof import("./match") = await import("./match.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const deckcode: typeof import("../deckcode") = await import("../deckcode.ts");

const { parseReplay, readReplay, replayFileInfo, instanceDeck, cardOfInstance, ReplayFormatError, REPLAY_MAX_BYTES, NO_LANE } = replayModule;
const { readStatsFile, readInventoryFile, detectMatchEnd } = profileModule;
const { buildMatch, matchFingerprint, pickMe, replayBelongsTo, PAIR_WINDOW_MS } = matchModule;

/* ---------- codificatore dei replay per i test ---------- */

type Bytes = number[];
const utf8 = new TextEncoder();
const u16 = (n: number): Bytes => [n & 0xff, (n >> 8) & 0xff];
const varint = (n: number): Bytes => {
  const out: Bytes = [];
  do {
    let c = n & 0x7f;
    n >>>= 7;
    if (n) c |= 0x80;
    out.push(c);
  } while (n);
  return out;
};
const rawString = (s: string): Bytes => {
  const b = [...utf8.encode(s)];
  return [...varint(b.length), ...b];
};
type Fields = [number, Bytes][];
const body = (fields: Fields, kind = 2): Bytes => [kind, fields.length, ...fields.flatMap(([id, v]) => [id, ...v])];
const V = {
  nil: (): Bytes => [0x00],
  bool: (b: boolean): Bytes => [0x01, b ? 1 : 0],
  u8: (n: number): Bytes => [0x02, n],
  i32: (n: number): Bytes => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setInt32(0, n, true);
    return [0x05, ...b];
  },
  str: (s: string): Bytes => [0x0e, ...rawString(s)],
  obj: (fields: Fields): Bytes => [0x10, ...body(fields)],
  objects: (items: Fields[]): Bytes => [0x0f, 0x11, ...u16(items.length), ...items.flatMap((f) => [0x10, ...body(f)])],
  strings: (items: string[]): Bytes => [0x0f, 0x0e, ...u16(items.length), ...items.flatMap(rawString)],
};

const ME = { id: "5550001", name: "PlayerOne" };
const BOT = { id: "9990002", name: "RobotoName" };
// mazzi: Leggendaria per prima, poi 12 carte base (come nei file veri); la dodicesima base di ME è una magia (_SB)
const MY_DECK = ["C00176_MC_V00000", ...["C00002_MB", "C00029_MB", "C00032_MB", "C00036_MB", "C00093_MB", "C00159_MB", "C00208_MB", "C00234_SB", "C00267_MB", "C00274_MB", "C00361_MB", "C00169_SB"].map((k) => `${k}_V00000`)];
const BOT_DECK = ["C00012_MC_V00000", ...["C00031_MB", "C00040_MB", "C00041_MB", "C00046_MB", "C00050_MB", "C00060_MB", "C00070_MB", "C00080_MB", "C00090_MB", "C00100_MB", "C00110_MB", "C00120_SB"].map((k) => `${k}_V00000`)];

const card = (key: string): Fields => [
  [0, V.str(key)],
  [3, V.str("CB00015")],
  [4, V.nil()],
  [5, V.i32(-1)],
];
const player = (p: { id: string; name: string }, bot: boolean, rank: string, deck: string[]): Fields => [
  [0, V.str(p.id)],
  [1, V.str(p.name)],
  [2, V.bool(bot)],
  [5, V.obj([[0, V.objects([...deck, "Tower_V00000"].map(card))]])],
  [7, V.str(rank)],
  [11, V.str("H0010_V00000")],
];
const event = (type: number, who: number, instance: number, lane?: number, slot?: number): Fields => {
  const f: Fields = [
    [0, V.u8(type)],
    [2, V.u8(who)],
    [50, V.u8(instance)],
  ];
  if (lane !== undefined) f.push([51, V.u8(lane)]);
  if (slot !== undefined) f.push([53, V.u8(slot)]);
  return f;
};
const record = (events: Fields[]): Fields => [
  [0, V.objects(events)],
  [1, V.strings([])],
];

/** Replay finto: record 2 = mulligan, record 4 = turno 1, record 8 = turno 2. Avversario bot con rank "Master", salvo opzioni. */
function syntheticReplay(opts: { opponentBot?: boolean; opponentRank?: string } = {}): Uint8Array {
  const records: Fields[] = Array.from({ length: 9 }, () => record([]));
  records[2] = record([event(1, 0, 4), event(1, 1, 33)]);
  records[4] = record([event(3, 0, 2, 0, 0), event(3, 1, 30, 1, 2)]);
  // istanze del mazzo: 1–25 per il giocatore 0, 30–54 per il giocatore 1; 26 e 55 sono carte generate in partita
  records[8] = record([event(3, 0, 26, NO_LANE, 0), event(3, 1, 55, NO_LANE, 0), event(3, 0, 1, 2, 1)]);
  return new Uint8Array([
    5,
    2,
    ...V.obj([
      [0, V.str("03_Arena")],
      [1, V.i32(123456)],
      [37, V.str("Pool_0001")],
    ]),
    3,
    ...V.objects([player(ME, false, "Bronze III", MY_DECK), player(BOT, opts.opponentBot ?? true, opts.opponentRank ?? "Master", BOT_DECK)]),
    4,
    ...V.objects(records),
  ]);
}

/* ---------- replay ---------- */

describe("parseReplay", () => {
  test("legge la grammatica, compreso il tag vuoto 0x00", () => {
    const tree = parseReplay(syntheticReplay());
    assert.equal(tree.version, 5);
    assert.deepEqual([...tree.fields.keys()], [2, 3, 4]);
  });

  test("tag sconosciuto: errore con la posizione", () => {
    assert.throws(() => parseReplay(new Uint8Array([5, 2, 0x09, 0])), (e: unknown) => e instanceof ReplayFormatError && /0x09/.test(e.message) && e.offset === 2);
  });

  test("file troncato, vuoto o troppo grande: errore", () => {
    const bytes = syntheticReplay();
    assert.throws(() => parseReplay(bytes.subarray(0, bytes.length - 3)), ReplayFormatError);
    assert.throws(() => parseReplay(new Uint8Array([5])), ReplayFormatError);
    assert.throws(() => parseReplay(new Uint8Array(REPLAY_MAX_BYTES + 1)), ReplayFormatError);
  });
});

describe("readReplay", () => {
  const match = readReplay(parseReplay(syntheticReplay()), { accountId: ME.id });

  test("giocatori: chi è il giocatore, bot, rank, mazzo senza la voce Tower, Leggendaria", () => {
    assert.equal(match.players.length, 2);
    const [me, bot] = match.players;
    assert.deepEqual([me.isMe, me.isBot, me.rank, me.deck.length, me.legendary], [true, false, "Bronze III", 13, "C00176_MC_V00000"]);
    assert.deepEqual([bot.isMe, bot.isBot, bot.rank, bot.deck.length, bot.legendary], [false, true, "Master", 13, "C00012_MC_V00000"]);
    assert.equal(match.arena, "03_Arena");
    assert.equal(match.locationPool, "Pool_0001");
  });

  test("giocate: istanze → carte (Leggendaria una copia, secondo giocatore da 30), carte generate, corsia 255, turni", () => {
    assert.deepEqual(match.plays, [
      { turn: 1, player: 0, card: "C00002_MB_V00000", lane: 0, slot: 0 },
      { turn: 1, player: 1, card: "C00012_MC_V00000", lane: 1, slot: 2 },
      { turn: 2, player: 0, card: null, lane: null, slot: 0 },
      { turn: 2, player: 1, card: null, lane: null, slot: 0 },
      { turn: 2, player: 0, card: "C00176_MC_V00000", lane: 2, slot: 1 },
    ]);
    assert.equal(match.turns, 2);
    assert.equal(match.unmapped, 0);
    assert.deepEqual(match.mulligan, [
      { player: 0, card: "C00029_MB_V00000" },
      { player: 1, card: "C00040_MB_V00000" },
    ]);
  });

  test("nomi e id dei giocatori non escono mai", () => {
    const json = JSON.stringify(match);
    for (const secret of [ME.id, ME.name, BOT.id, BOT.name]) assert.ok(!json.includes(secret), secret);
  });

  test("senza id dell'account nessun giocatore è riconosciuto", () => {
    const anon = readReplay(parseReplay(syntheticReplay()));
    assert.deepEqual(
      anon.players.map((p) => p.isMe),
      [false, false],
    );
  });

  test("istanze fuori regola contate a parte", () => {
    const expanded = instanceDeck(MY_DECK);
    assert.equal(expanded.length, 25);
    assert.equal(cardOfInstance(0, 0, expanded), undefined);
    assert.equal(cardOfInstance(1, 29, instanceDeck(BOT_DECK)), undefined);
    assert.equal(cardOfInstance(0, 25, expanded), "C00169_SB_V00000");
    assert.equal(cardOfInstance(0, 26, expanded), null);
  });
});

describe("replayFileInfo", () => {
  test("modalità e ora locale dal nome, mai i nomi dei giocatori", () => {
    assert.deepEqual(replayFileInfo("LatestMatch_BotBattle_2026-09-29_02-51-19.replay"), { mode: "BotBattle", localStamp: "2026-09-29T02:51:19" });
    const vs = replayFileInfo("LatestMatch_Alice_vs_Bob_2026-09-29_02-51-19.replay");
    assert.deepEqual(vs, { mode: "vs", localStamp: "2026-09-29T02:51:19" });
    assert.ok(!JSON.stringify(vs).includes("Alice"));
    assert.equal(replayFileInfo("LatestMatch_Strano Nome!_2026-09-29_02-51-19.replay")?.mode, "other");
    assert.equal(replayFileInfo("Player.log"), null);
  });
});

/* ---------- cache del profilo ---------- */

const statsJson = (stats: Record<string, string>, id: unknown = 2048) => JSON.stringify({ results: [{ id, stats: Object.entries(stats).map(([k, v]) => ({ k, v })) }] });
const baseStats = { lastMatchPlayedDateTime: "2026-09-27T23:40:33.9871104Z", onboardingResults: "LLW", onboardingLastMatchId: "offline_aaa", ActiveUserDeckIndex: "4", BattleMode: "0" };

describe("readStatsFile", () => {
  test("statistiche delle partite", () => {
    assert.deepEqual(readStatsFile(statsJson(baseStats)), {
      accountId: "2048",
      lastMatchAt: "2026-09-27T23:40:33.987Z",
      results: "LLW",
      lastMatchId: "offline_aaa",
      activeDeckIndex: 4,
      battleMode: "0",
    });
  });

  test("altri file e testo rotto: null", () => {
    assert.equal(readStatsFile(statsJson({ ActiveUserDeckIndex: "1", ActiveAvatarKey: "AV00007" })), null);
    assert.equal(readStatsFile(JSON.stringify({ id: 2048, email: "x@example.com" })), null);
    assert.equal(readStatsFile("{"), null);
    assert.equal(readStatsFile("[1,2]"), null);
  });

  test("valori strani: indice e data non validi diventano null, esiti non validi stringa vuota", () => {
    const s = readStatsFile(statsJson({ ...baseStats, ActiveUserDeckIndex: "-1", lastMatchPlayedDateTime: "ieri", onboardingResults: "W?L" }));
    assert.equal(s?.activeDeckIndex, null);
    assert.equal(s?.lastMatchAt, null);
    assert.equal(s?.results, "");
  });
});

const inventoryJson = JSON.stringify({
  currencies: [],
  items: [
    { id: "items.Avatar.PlayerAvatar", items: [] },
    {
      id: "items.Deck.Web2Deck",
      items: [
        { id: "199", properties: [{ name: "Config", value: JSON.stringify({ DisplayName: "Swarm", Cards: [{ CardKey: "C00046_MC_V00000", CardId: 1 }, { CardKey: "C00002_MB_V00000", CardId: 2 }] }) }, { name: "DeckPresetKey", value: "D00002" }] },
        { id: "215", properties: [{ name: "Config", value: JSON.stringify({ DisplayName: "On Death", Cards: MY_DECK.map((k) => ({ CardKey: k })) }) }, { name: "DeckPresetKey", value: "" }] },
        { id: "300", properties: [{ name: "Config", value: "{rotto" }] },
      ],
    },
  ],
});

describe("readInventoryFile", () => {
  test("mazzi nell'ordine del file, con Leggendaria e preset", () => {
    const decks = readInventoryFile(inventoryJson);
    assert.equal(decks?.length, 3);
    assert.deepEqual(decks?.[0], { index: 0, id: "199", name: "Swarm", preset: "D00002", cards: ["C00046_MC_V00000", "C00002_MB_V00000"], legendary: "C00046_MC_V00000" });
    assert.deepEqual([decks?.[1].name, decks?.[1].preset, decks?.[1].cards.length, decks?.[1].legendary], ["On Death", null, 13, "C00176_MC_V00000"]);
    assert.deepEqual([decks?.[2].name, decks?.[2].cards], [null, []]);
  });

  test("file senza mazzi: null", () => {
    assert.equal(readInventoryFile(JSON.stringify({ items: [{ id: "items.Emote.TextEmote", items: [] }] })), null);
    assert.equal(readInventoryFile(statsJson(baseStats)), null);
  });
});

describe("detectMatchEnd", () => {
  const prev = readStatsFile(statsJson(baseStats))!;
  const next = (over: Record<string, string>) => readStatsFile(statsJson({ ...baseStats, ...over }))!;

  test("prima lettura o niente di nuovo: null", () => {
    assert.equal(detectMatchEnd(null, prev), null);
    assert.equal(detectMatchEnd(prev, next({ ActiveUserDeckIndex: "2" })), null);
  });

  test("una partita nuova: esito dalla lettera aggiunta a sinistra", () => {
    const end = detectMatchEnd(prev, next({ lastMatchPlayedDateTime: "2026-09-29T00:51:19.1Z", onboardingResults: "WLLW", onboardingLastMatchId: "offline_bbb", ActiveUserDeckIndex: "3" }));
    assert.deepEqual(end, { endedAt: "2026-09-29T00:51:19.100Z", result: "W", matchId: "offline_bbb", deckIndex: 3, missed: "" });
  });

  test("partite perse per strada: la più recente è l'esito, le altre finiscono in missed", () => {
    const end = detectMatchEnd(prev, next({ lastMatchPlayedDateTime: "2026-09-29T01:00:00Z", onboardingResults: "LWWLLW", onboardingLastMatchId: "offline_ccc" }));
    assert.deepEqual([end?.result, end?.missed], ["L", "WW"]);
  });

  test("stringa che non allunga la precedente o che non cambia: esito sconosciuto", () => {
    assert.equal(detectMatchEnd(prev, next({ lastMatchPlayedDateTime: "2026-09-29T01:00:00Z", onboardingResults: "WW" }))?.result, null);
    assert.equal(detectMatchEnd(prev, next({ onboardingLastMatchId: "offline_ddd" }))?.result, null);
  });
});

/* ---------- partita registrata ---------- */

describe("buildMatch", () => {
  const decks = readInventoryFile(inventoryJson)!;
  const end = { endedAt: "2026-09-29T00:51:19.000Z", result: "W" as const, matchId: "offline_secret-id", deckIndex: 1, missed: "" };
  const replay = readReplay(parseReplay(syntheticReplay()), { accountId: ME.id });

  test("cache + replay: esito, mazzo con nome e codice del gioco, avversario, giocate", async () => {
    const m = await buildMatch({ end, accountId: ME.id, deck: decks[1], replay });
    const base = MY_DECK.map((k) => k.replace(/_V\d+$/, ""));
    assert.equal(m.v, 1);
    assert.match(m.id, /^[0-9a-f]{32}$/);
    assert.deepEqual([m.result, m.rank, m.turns, m.missed], ["W", "Bronze III", 2, ""]);
    assert.deepEqual(m.deck, { name: "On Death", legendary: "C00176_MC", cards: base, code: await deckcode.encodeGameCode(base) });
    assert.deepEqual(m.opponent, { legendary: "C00012_MC", cards: BOT_DECK.map((k) => k.replace(/_V\d+$/, "")) });
    assert.deepEqual(m.plays[0], { turn: 1, me: true, card: "C00002_MB", lane: 0 });
    assert.deepEqual(m.plays[1], { turn: 1, me: false, card: "C00012_MC", lane: 1 });
    const json = JSON.stringify(m);
    for (const secret of [end.matchId, ME.id, ME.name, BOT.id, BOT.name]) assert.ok(!json.includes(secret), secret);
  });

  test("mai dire se l'avversario è un bot o una persona: la stessa partita dà lo stesso record", async () => {
    const human = readReplay(parseReplay(syntheticReplay({ opponentBot: false, opponentRank: "Silver II" })), { accountId: ME.id });
    const vsBot = await buildMatch({ end, accountId: ME.id, deck: decks[1], replay });
    const vsHuman = await buildMatch({ end, accountId: ME.id, deck: decks[1], replay: human });
    assert.deepEqual(vsBot, vsHuman);
    const json = JSON.stringify(vsBot);
    for (const tell of ["Master", "Silver II", "BotBattle", '"bot"', "vsBot", "isBot", '"mode"']) assert.ok(!json.includes(tell), tell);
  });

  test("senza replay: esito e mazzo del profilo, niente avversario", async () => {
    const m = await buildMatch({ end, accountId: ME.id, deck: decks[1], replay: null });
    assert.deepEqual([m.opponent, m.turns, m.plays], [null, null, []]);
    assert.equal(m.deck.name, "On Death");
    assert.equal(m.deck.cards.length, 13);
  });

  test("mazzo del replay diverso da quello scelto nel profilo: vale il replay, senza nome", async () => {
    const m = await buildMatch({ end, accountId: ME.id, deck: decks[0], replay });
    assert.equal(m.deck.name, null);
    assert.equal(m.deck.legendary, "C00176_MC");
  });

  test("impronta: stessa partita e stesso account uguale, account diverso diversa, mai l'id", async () => {
    const a = await matchFingerprint("1", "offline_x", null);
    assert.equal(a, await matchFingerprint("1", "offline_x", null));
    assert.notEqual(a, await matchFingerprint("2", "offline_x", null));
    assert.notEqual(a, await matchFingerprint("1", null, "2026-09-29T00:51:19.000Z"));
  });
});

describe("pickMe e replayBelongsTo", () => {
  const players = readReplay(parseReplay(syntheticReplay())).players;

  test("senza id: l'unico non bot", () => {
    assert.equal(pickMe(players, null)?.index, 0);
  });

  test("due persone: quella con il mazzo del profilo, altrimenti la prima", () => {
    const humans = players.map((p) => ({ ...p, isBot: false }));
    const decks = readInventoryFile(inventoryJson)!;
    const botDeck = { ...decks[1], cards: BOT_DECK };
    assert.equal(pickMe(humans, botDeck)?.index, 1);
    assert.equal(pickMe(humans, null)?.index, 0);
    assert.equal(pickMe([], null), null);
  });

  test("replay abbinato alla partita entro due minuti", () => {
    const endedAt = "2026-09-29T00:51:19.000Z";
    const t = Date.parse(endedAt);
    assert.equal(replayBelongsTo(endedAt, t - 2000), true);
    assert.equal(replayBelongsTo(endedAt, t + PAIR_WINDOW_MS), true);
    assert.equal(replayBelongsTo(endedAt, t + PAIR_WINDOW_MS + 1), false);
    assert.equal(replayBelongsTo(null, t), false);
  });
});

/* ---------- file veri del PC, se ci sono ---------- */

const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
const replayDirs = [
  path.join(home, "Documents", "My Games", "Origins TCG Demo", "Replays"),
  path.join(home, "OneDrive", "Documents", "My Games", "Origins TCG Demo", "Replays"),
  path.join(home, "OneDrive", "Documenti", "My Games", "Origins TCG Demo", "Replays"),
];
const realReplays = replayDirs.flatMap((dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => replayFileInfo(f)).map((f) => path.join(dir, f)) : []));
const cacheRoot = path.join(home, "AppData", "LocalLow", "Koin Games", "Origins TCG Demo", "beamable", "cache");
const subdirs = (p: string) => (fs.existsSync(p) ? fs.readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => path.join(p, e.name)) : []);
const cacheFiles = subdirs(cacheRoot)
  .flatMap(subdirs)
  .flatMap(subdirs)
  .flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => path.join(d, f)));

describe("file veri del gioco su questo PC", () => {
  test("replay: grammatica, due giocatori con 13 carte, istanze tutte al loro posto", { skip: realReplays.length ? false : "nessun replay su questo PC" }, () => {
    for (const file of realReplays) {
      const match = readReplay(parseReplay(new Uint8Array(fs.readFileSync(file))));
      assert.equal(match.players.length, 2);
      for (const p of match.players) {
        assert.equal(p.deck.length, 13);
        assert.ok(p.legendary);
      }
      assert.equal(match.unmapped, 0);
    }
  });

  test("cache: statistiche e mazzi riconosciuti dal contenuto", { skip: cacheFiles.length ? false : "nessuna cache del gioco su questo PC" }, () => {
    const texts = cacheFiles.map((f) => fs.readFileSync(f, "utf8"));
    const stats = texts.map(readStatsFile).filter((s) => s !== null);
    const inventories = texts.map(readInventoryFile).filter((d) => d !== null);
    assert.ok(stats.length >= 1);
    assert.ok(inventories.length >= 1);
    const latest = stats.find((s) => s.lastMatchAt) ?? stats[0];
    assert.match(latest.results, /^[WL]*$/);
    const decks = inventories.reduce((a, b) => (b.length > a.length ? b : a));
    for (const d of decks) assert.equal(d.cards.length, 13);
  });
});
