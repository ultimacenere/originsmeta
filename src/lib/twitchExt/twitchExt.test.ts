/**
 * Test dell'estensione Twitch "Deck tracker" (13/10/2026, docs/twitch.md): `node --test src/lib/twitchExt/twitchExt.test.ts`.
 * - jwt.ts: firma e verifica HS256 dei token dell'estensione (scaduti, firma sbagliata, altri algoritmi, forma).
 * - ../tracker/live.ts: lo stato dal vivo dall'app (forma, limiti, niente dati oltre a quelli del Deck tracker).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  signExtJwt,
  verifyExtJwt,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./jwt.ts";
import {
  LIVE_LIMITS,
  liveStateOf,
  parseLiveState,
  pubsubMessage,
  PUBSUB_MAX_BYTES,
  type LiveSource,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "../tracker/live.ts";

const SECRET = Buffer.from("segreto-di-prova-dell-estensione-twitch").toString("base64");
const NOW = 1_800_000_000;

describe("JWT dell'estensione", () => {
  test("firma e verifica", () => {
    const tok = signExtJwt({ exp: NOW + 60, channel_id: "12345", role: "broadcaster", opaque_user_id: "U12345" }, SECRET);
    assert.deepEqual(verifyExtJwt(tok, SECRET, NOW), { exp: NOW + 60, channel_id: "12345", role: "broadcaster", opaque_user_id: "U12345" });
  });
  test("scaduto, firma o secret sbagliati, altro algoritmo, forma sbagliata: null", () => {
    assert.equal(verifyExtJwt(signExtJwt({ exp: NOW, role: "viewer" }, SECRET), SECRET, NOW), null);
    const tok = signExtJwt({ exp: NOW + 60, role: "viewer" }, SECRET);
    assert.equal(verifyExtJwt(tok, Buffer.from("altro").toString("base64"), NOW), null);
    assert.equal(verifyExtJwt(tok.slice(0, -2) + "xx", SECRET, NOW), null);
    const [, body, sig] = tok.split(".");
    const none = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    assert.equal(verifyExtJwt(`${none}.${body}.${sig}`, SECRET, NOW), null);
    assert.equal(verifyExtJwt(`${none}.${body}.`, SECRET, NOW), null);
    assert.equal(verifyExtJwt(signExtJwt({ exp: NOW + 60, role: "admin" as "viewer" }, SECRET), SECRET, NOW), null);
    assert.equal(verifyExtJwt(signExtJwt({ exp: NOW + 60, role: "viewer", channel_id: "abc" }, SECRET), SECRET, NOW), null);
    assert.equal(verifyExtJwt("a.b", SECRET, NOW), null);
    assert.equal(verifyExtJwt(tok, "", NOW), null);
  });
});

const card = (key: string, copies: number, drawn = 0, played = 0) => ({ key, copies, drawn, played });
const view: LiveSource = {
  deck: { name: "  Robin​ Hood aggro  ", legendary: card("C00065_MC", 1, 1, 1), cards: [card("C00245_MB", 2, 2, 1), card("C00013_SB", 2, 1, 0)] },
  live: { inMatch: true, round: 5, deckLeft: 14, opponent: { deckLeft: 15, legendary: card("C00042_SC", 1, 1, 1), seen: [card("C00026_SB", 2, 2, 2)] } },
};

describe("stato dal vivo dell'app", () => {
  test("dal pannello del mazzo: solo chiavi e numeri, nome del mazzo pulito", () => {
    const s = liveStateOf(view);
    assert.deepEqual(s, {
      v: 1,
      deck: { name: "Robin Hood aggro", legendary: "C00065_MC", cards: [["C00065_MC", 1, 1, 1], ["C00245_MB", 2, 2, 1], ["C00013_SB", 2, 1, 0]] },
      live: { inMatch: true, round: 5, deckLeft: 14, opp: { legendary: "C00042_SC", deckLeft: 15, seen: [["C00026_SB", 2]] } },
    });
    assert.deepEqual(parseLiveState(JSON.parse(JSON.stringify(s))), s);
    assert.deepEqual(liveStateOf({ deck: null, live: null }), { v: 1, deck: null, live: null });
  });
  test("forma controllata", () => {
    const s = liveStateOf(view);
    const bad = (patch: (x: ReturnType<typeof liveStateOf>) => unknown) => parseLiveState(patch(JSON.parse(JSON.stringify(s))));
    assert.equal(bad((x) => ({ ...x, v: 2 })), null);
    assert.equal(bad((x) => ((x.deck!.cards[0][0] = "<script>"), x)), null);
    assert.equal(bad((x) => ((x.deck!.cards[0][1] = 9), x)), null);
    assert.equal(bad((x) => ((x.deck!.cards = Array(LIVE_LIMITS.deckCards + 1).fill(["C00245_MB", 2, 0, 0])), x)), null);
    assert.equal(bad((x) => ((x.live!.opp.seen = [["C00026_SB", 0]]), x)), null);
    assert.equal(bad((x) => ((x.live!.round = -1), x)), null);
    assert.equal(bad((x) => ((x.live!.inMatch = "sì" as unknown as boolean), x)), null);
    assert.equal(parseLiveState(null), null);
    // campi in più (un nome dell'avversario, un rank) non passano: lo stato si ricostruisce dai soli campi previsti
    const extra = bad((x) => ({ ...x, opponentName: "Pippo", live: { ...x.live, rank: "Gold", opp: { ...x.live!.opp, name: "Pippo" } } }));
    assert.equal(JSON.stringify(extra).includes("Pippo"), false);
    assert.equal(JSON.stringify(extra).includes("Gold"), false);
  });
  test("messaggio per gli spettatori sotto i 5 KB anche al massimo", () => {
    const big = { ...liveStateOf(view), deck: { name: "x".repeat(40), legendary: "C00065_MC", cards: Array(13).fill(["C00245_MB", 2, 2, 2]) } };
    const full = { ...big, live: { inMatch: true, round: 10, deckLeft: 0, opp: { legendary: "C00042_SC", deckLeft: 0, seen: Array(LIVE_LIMITS.seen).fill(["C00026_SB", 20]) } } };
    const msg = pubsubMessage(full as ReturnType<typeof liveStateOf>, new Date(NOW * 1000).toISOString());
    assert.ok(msg && new TextEncoder().encode(msg).length <= PUBSUB_MAX_BYTES);
  });
});
