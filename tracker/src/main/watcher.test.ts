/**
 * Test del tracker dell'app (watcher.ts): `npm test` nella cartella tracker/. Una finta cartella del gioco in una
 * cartella temporanea, con statistiche, inventario, un file dell'account e replay costruiti come li scrive il gioco
 * (codificatore in src/lib/tracker/testing.ts); l'orologio avanza a comando.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MatchWatcher, REPLAY_WAIT_MS } from "./watcher";
import { BOT, BOT_DECK, ME, MY_DECK, inventoryJson, statsJson, syntheticReplay } from "../../../src/lib/tracker/testing";
import type { TrackedMatch } from "../../../src/lib/tracker/match";
import type { GameDeck } from "../../../src/lib/tracker/profile";

const T0 = Date.parse("2026-09-29T00:50:00Z");
const iso = (ms: number) => new Date(ms).toISOString();
const base = (k: string) => k.replace(/_V\d+$/, "");

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "om-tracker-"));
  const cacheRoot = path.join(root, "cache");
  const dir = path.join(cacheRoot, "1618175429308424", "DE_79328339604285440", "0.7.0");
  fs.mkdirSync(dir, { recursive: true });
  const replays = path.join(root, "Replays");
  fs.mkdirSync(replays);
  const statsFile = path.join(dir, "87cefbff67c98ea8f45d98121b5b00f8.json");
  const touch = (file: string, at: number) => fs.utimesSync(file, new Date(at), new Date(at));
  fs.writeFileSync(path.join(dir, "307935825bdee329262f1e8aa050a648.json"), inventoryJson([{ name: "Swarm", cards: BOT_DECK, preset: "D00002" }, { name: "On Death", cards: MY_DECK, preset: "D00005" }]));
  fs.writeFileSync(path.join(dir, "1ec2cacd1d6c46afc85b676d1f16628b.json"), JSON.stringify({ id: Number(ME.id), email: "someone@example.com", language: "it" }));
  let clock = T0;
  const stats = (over: Record<string, string>, at: number) => {
    fs.writeFileSync(statsFile, statsJson({ BattleMode: "0", ActiveUserDeckIndex: "1", ...over }));
    touch(statsFile, at);
  };
  const replay = (at: number, bytes: Uint8Array = syntheticReplay(), mode = "BotBattle") => {
    const d = new Date(at);
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}-${String(d.getSeconds()).padStart(2, "0")}`;
    for (const f of fs.readdirSync(replays)) fs.rmSync(path.join(replays, f)); // il gioco tiene solo l'ultimo
    const file = path.join(replays, `LatestMatch_${mode}_${stamp}.replay`);
    fs.writeFileSync(file, bytes);
    touch(file, at);
  };
  return {
    root,
    dirs: { cacheRoots: [cacheRoot], replayDirs: [replays] },
    stats,
    replay,
    now: () => clock,
    advance: (ms: number) => (clock += ms),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

function listen(w: MatchWatcher) {
  const out = { matches: [] as TrackedMatch[], missed: [] as string[], saved: [] as { lastFingerprint: string | null; results: string }[], decks: [] as (GameDeck | null)[] };
  w.on("match", (m: TrackedMatch) => out.matches.push(m));
  w.on("missed", (s: string) => out.missed.push(s));
  w.on("saved", (s) => out.saved.push(s));
  w.on("deck", (d: GameDeck | null) => out.decks.push(d));
  return out;
}

describe("MatchWatcher", () => {
  test("primo avvio con il replay dell'ultima partita ancora lì: la registra, senza partite perse", async () => {
    const g = setup();
    try {
      const end = T0 - 60_000;
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "LWW", onboardingLastMatchId: "offline_first" }, end + 500);
      g.replay(end - 1000);
      const w = new MatchWatcher(g.dirs, { lastFingerprint: null, results: "" }, { firstRun: true, now: g.now });
      const out = listen(w);
      await w.tick();
      assert.equal(out.matches.length, 1);
      const m = out.matches[0];
      assert.deepEqual([m.result, m.deck.name, m.deck.legendary, m.opponent?.legendary, m.missed], ["L", "On Death", base(MY_DECK[0]), base(BOT_DECK[0]), ""]);
      assert.equal(out.missed.length, 0);
      assert.equal(out.saved.at(-1)?.results, "LWW");
      assert.equal(w.status.cache, true);
      assert.equal(w.status.replays, true);
      assert.equal(out.decks[0]?.name, "On Death");
    } finally {
      g.cleanup();
    }
  });

  test("primo avvio senza il replay: nessuna partita, si parte da lì; la partita dopo si registra", async () => {
    const g = setup();
    try {
      g.stats({ lastMatchPlayedDateTime: iso(T0 - 3_600_000), onboardingResults: "WL", onboardingLastMatchId: "offline_old" }, T0 - 3_590_000);
      const w = new MatchWatcher(g.dirs, { lastFingerprint: null, results: "" }, { firstRun: true, now: g.now });
      const out = listen(w);
      await w.tick();
      g.advance(REPLAY_WAIT_MS);
      await w.tick();
      assert.equal(out.matches.length, 0);
      assert.equal(out.saved.length, 1);
      // partita nuova, il replay arriva un secondo prima della cache (come nel gioco)
      const end = g.advance(5 * 60_000);
      g.replay(end - 1000);
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "WWL", onboardingLastMatchId: "offline_new" }, end + 300);
      await w.tick();
      assert.equal(out.matches.length, 1);
      assert.deepEqual([out.matches[0].result, out.matches[0].turns, out.matches[0].plays.length], ["W", 2, 5]);
    } finally {
      g.cleanup();
    }
  });

  test("il replay arriva dopo la cache: il tracker lo aspetta", async () => {
    const g = setup();
    try {
      const w = new MatchWatcher(g.dirs, { lastFingerprint: "x", results: "L" }, { firstRun: false, now: g.now });
      const out = listen(w);
      const end = g.advance(1000);
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "WL", onboardingLastMatchId: "offline_1" }, end + 200);
      await w.tick();
      assert.equal(out.matches.length, 0, "aspetta il replay");
      g.advance(3000);
      g.replay(end + 2500);
      await w.tick();
      assert.equal(out.matches.length, 1);
      assert.equal(out.matches[0].opponent?.legendary, base(BOT_DECK[0]));
    } finally {
      g.cleanup();
    }
  });

  test("il replay non arriva: dopo un minuto la partita si registra con esito e mazzo", async () => {
    const g = setup();
    try {
      const w = new MatchWatcher(g.dirs, { lastFingerprint: "x", results: "" }, { firstRun: false, now: g.now });
      const out = listen(w);
      g.replay(T0 - 3_600_000); // replay vecchio, di un'altra partita
      const end = g.advance(1000);
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "L", onboardingLastMatchId: "offline_2" }, end + 200);
      await w.tick();
      g.advance(REPLAY_WAIT_MS - 1);
      await w.tick();
      assert.equal(out.matches.length, 0);
      g.advance(1);
      await w.tick();
      assert.equal(out.matches.length, 1);
      const m = out.matches[0];
      assert.deepEqual([m.result, m.opponent, m.turns, m.deck.name, m.deck.cards.length], ["L", null, null, "On Death", 13]);
      assert.equal(w.status.problem, null);
    } finally {
      g.cleanup();
    }
  });

  test("partite giocate a tracker spento: l'esito della più recente e le altre in missed", async () => {
    const g = setup();
    try {
      const w = new MatchWatcher(g.dirs, { lastFingerprint: "x", results: "WL" }, { firstRun: false, now: g.now });
      const out = listen(w);
      const end = g.advance(1000);
      g.replay(end - 500);
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "LWWWL", onboardingLastMatchId: "offline_3" }, end + 200);
      await w.tick();
      assert.equal(out.matches[0].result, "L");
      assert.equal(out.matches[0].missed, "WW");
      assert.deepEqual(out.missed, ["WW"]);
    } finally {
      g.cleanup();
    }
  });

  test("file riscritto senza partita nuova: niente; mazzo cambiato: evento deck", async () => {
    const g = setup();
    try {
      const end = g.advance(1000);
      g.replay(end);
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "W", onboardingLastMatchId: "offline_4" }, end + 100);
      const w = new MatchWatcher(g.dirs, { lastFingerprint: null, results: "" }, { firstRun: true, now: g.now });
      const out = listen(w);
      await w.tick();
      assert.equal(out.matches.length, 1);
      g.advance(5000);
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "W", onboardingLastMatchId: "offline_4", ActiveUserDeckIndex: "0" }, end + 9000);
      await w.tick();
      assert.equal(out.matches.length, 1, "nessuna partita nuova");
      assert.deepEqual(
        out.decks.map((d) => d?.name),
        ["On Death", "Swarm"],
      );
    } finally {
      g.cleanup();
    }
  });

  test("replay rotto: la partita si registra senza replay e il problema si vede", async () => {
    const g = setup();
    try {
      const w = new MatchWatcher(g.dirs, { lastFingerprint: "x", results: "" }, { firstRun: false, now: g.now });
      const out = listen(w);
      const end = g.advance(1000);
      g.replay(end, new Uint8Array([5, 2, 0x09, 0, 0, 0]));
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "W", onboardingLastMatchId: "offline_5" }, end + 200);
      await w.tick();
      g.advance(REPLAY_WAIT_MS);
      await w.tick();
      assert.equal(out.matches.length, 1);
      assert.equal(out.matches[0].opponent, null);
      assert.equal(w.status.problem, "badReplay");
    } finally {
      g.cleanup();
    }
  });

  test("gioco assente: il tracker aspetta e lo dice", async () => {
    const g = setup();
    try {
      const w = new MatchWatcher({ cacheRoots: [path.join(g.root, "nessuna")], replayDirs: [path.join(g.root, "niente")] }, { lastFingerprint: null, results: "" }, { firstRun: true, now: g.now });
      await w.tick();
      assert.deepEqual([w.status.cache, w.status.replays, w.status.problem], [false, false, "noGame"]);
    } finally {
      g.cleanup();
    }
  });

  test("mai nomi, id, rank dell'avversario né segnale bot nelle partite registrate", async () => {
    const g = setup();
    try {
      const w = new MatchWatcher(g.dirs, { lastFingerprint: "x", results: "" }, { firstRun: false, now: g.now });
      const out = listen(w);
      const end = g.advance(1000);
      g.replay(end);
      g.stats({ lastMatchPlayedDateTime: iso(end), onboardingResults: "W", onboardingLastMatchId: "offline_secret" }, end + 200);
      await w.tick();
      const json = JSON.stringify(out.matches) + JSON.stringify(out.saved);
      for (const secret of [ME.name, ME.id, BOT.name, BOT.id, "offline_secret", "Master", "BotBattle", "someone@example.com"]) assert.ok(!json.includes(secret), secret);
    } finally {
      g.cleanup();
    }
  });
});
