/** Test dell'invio dello stato dal vivo per l'estensione Twitch (twitchLive.ts, 13/10/2026): `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { LIVE_MIN_MS, LIVE_PAUSE, LivePusher } from "./twitchLive";
import type { LiveSource } from "../../../src/lib/tracker/live";

const card = (key: string, copies: number, drawn = 0, played = 0) => ({ key, copies, drawn, played });
const view = (round: number): LiveSource => ({
  deck: { name: "Prova", legendary: card("C00065_MC", 1), cards: [card("C00245_MB", 2, 1, 1)] },
  live: { inMatch: true, round, deckLeft: 20, opponent: { deckLeft: null, legendary: card("C00042_SC", 1, 1, 1), seen: [card("C00026_SB", 1, 1, 1)] } },
});

function setup(reply: (n: number) => { status: number; body?: unknown } | Error, token: string | null = "omt_" + "a".repeat(64)) {
  let now = 1_000_000;
  const calls: { url: string; body: unknown; auth: string }[] = [];
  const pusher = new LivePusher(
    {
      site: "https://originsmeta.com",
      now: () => now,
      fetch: async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body ?? "null"), auth: init.headers.authorization });
        const r = reply(calls.length);
        if (r instanceof Error) throw r;
        return { status: r.status, json: async () => r.body ?? {} };
      },
    },
    () => token,
  );
  return { pusher, calls, tick: (ms: number) => (now += ms) };
}

test("manda lo stato quando cambia, al massimo ogni 2 secondi, col token dell'app", async () => {
  const { pusher, calls, tick } = setup(() => ({ status: 200, body: { linked: true } }));
  await pusher.offer(view(1));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://originsmeta.com/api/tracker/live");
  assert.match(calls[0].auth, /^Bearer omt_/);
  assert.equal((calls[0].body as { state: { live: { round: number } } }).state.live.round, 1);
  await pusher.offer(view(2)); // troppo presto
  assert.equal(calls.length, 1);
  tick(LIVE_MIN_MS);
  await pusher.offer(view(1)); // uguale all'ultimo mandato
  assert.equal(calls.length, 1);
  await pusher.offer(view(2));
  assert.equal(calls.length, 2);
  assert.equal(pusher.linked, true);
});

test("senza canale collegato si ferma per 5 minuti; senza token non parte niente", async () => {
  const { pusher, calls, tick } = setup(() => ({ status: 200, body: { linked: false } }));
  await pusher.offer(view(1));
  tick(LIVE_MIN_MS);
  await pusher.offer(view(2));
  assert.equal(calls.length, 1);
  tick(LIVE_PAUSE.unlinked);
  await pusher.offer(view(3));
  assert.equal(calls.length, 2);
  const none = setup(() => ({ status: 200 }), null);
  await none.pusher.offer(view(1));
  assert.equal(none.calls.length, 0);
});

test("errori: token non valido, migrazione mancante, senza rete", async () => {
  for (const [reply, pause] of [
    [{ status: 401 }, LIVE_PAUSE.invalidToken],
    [{ status: 503 }, LIVE_PAUSE.unavailable],
    [new Error("offline"), LIVE_PAUSE.offline],
  ] as const) {
    const { pusher, calls, tick } = setup(() => reply);
    await pusher.offer(view(1));
    tick(pause - 1);
    await pusher.offer(view(2));
    assert.equal(calls.length, 1);
    tick(1);
    await pusher.offer(view(2));
    assert.equal(calls.length, 2);
  }
});
