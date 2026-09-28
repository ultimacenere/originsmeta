/**
 * Test dello stato "in diretta" (`twitchLive.ts`): `node --test src/lib/twitchLive.test.ts`.
 * Solo le dirette su Origins TCG (categoria del gioco o titolo che lo nomina) accendono il badge.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  STREAM_TITLE_MAX,
  channelLogin,
  chunk,
  cleanStreamTitle,
  isOriginsStream,
  liveOrder,
  liveUsers,
  loginsToCheck,
  safeLiveUsers,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./twitchLive.ts";

describe("dirette su Origins TCG", () => {
  test("la categoria del gioco basta", () => {
    assert.ok(isOriginsStream({ game_name: "Origins TCG", title: "Ranked!", type: "live" }));
    assert.ok(isOriginsStream({ game_name: "Origins: Trading Card Game", title: "" }));
  });
  test("oppure il titolo che nomina il gioco, l'hashtag o il sito", () => {
    assert.ok(isOriginsStream({ game_name: "Just Chatting", title: "Deck tech Merlin | Origins TCG demo" }));
    assert.ok(isOriginsStream({ game_name: "Games + Demos", title: "prima partita #OriginsTCG" }));
    assert.ok(isOriginsStream({ game_name: "Just Chatting", title: "tier list con la chat su OriginsMeta" }));
    assert.ok(isOriginsStream({ game_name: "", title: "ORIGINS-TCG day 3" }));
  });
  test("un altro gioco, o un titolo che dice solo 'origins', no", () => {
    assert.ok(!isOriginsStream({ game_name: "Assassin's Creed Origins", title: "Egypt 100%" }));
    assert.ok(!isOriginsStream({ game_name: "Hearthstone", title: "origins of the meta" }));
    assert.ok(!isOriginsStream({ game_name: "Origins TCG", title: "", type: "rerun" }), "solo dirette vere");
  });
  test("con l'id della categoria configurato basta l'id", () => {
    assert.ok(isOriginsStream({ game_id: "123", game_name: "Nome cambiato", title: "" }, "123"));
    assert.ok(!isOriginsStream({ game_id: "999", game_name: "Altro", title: "" }, "123"));
  });
});

describe("richieste e risposta", () => {
  test("gruppi da cento canali", () => {
    const logins = Array.from({ length: 250 }, (_, i) => `canale${i}`);
    assert.deepEqual(
      chunk(logins).map((c) => c.length),
      [100, 100, 50],
    );
    assert.deepEqual(chunk([]), []);
  });
  test("canali validi, minuscoli, senza doppioni", () => {
    assert.deepEqual(
      loginsToCheck([
        { username: "a", login: "CoachCrono" },
        { username: "b", login: "coachcrono" },
        { username: "c", login: "no" },
        { username: "d", login: "nome con spazi" },
      ]),
      ["coachcrono"],
    );
  });
  test("chi è in diretta, per nome utente, con il canale e gli spettatori", () => {
    const users = liveUsers(
      [
        { username: "coachcrono", login: "coachcrono" },
        { username: "altro", login: "altro_canale" },
        { username: "team", login: "CoachCrono" },
      ],
      [
        { user_login: "coachcrono", game_name: "Origins TCG", viewer_count: 42.4, type: "live" },
        { user_login: "altro_canale", game_name: "Fortnite", title: "", viewer_count: 1000, type: "live" },
      ],
    );
    assert.deepEqual(users, {
      coachcrono: { channel: "https://www.twitch.tv/coachcrono", viewers: 42 },
      team: { channel: "https://www.twitch.tv/coachcrono", viewers: 42 },
    });
  });
  test("con il titolo della diretta, ripulito (pagina /live, 28/09/2026)", () => {
    const users = liveUsers(
      [{ username: "aldrymus", login: "aldrymus" }],
      [{ user_login: "aldrymus", game_name: "Origins TCG", title: "  Origins tcg -   Niubbo in test ", viewer_count: 3, type: "live" }],
    );
    assert.deepEqual(users, { aldrymus: { channel: "https://www.twitch.tv/aldrymus", viewers: 3, title: "Origins tcg - Niubbo in test" } });
  });
});

describe("pagina /live e striscia del calendario", () => {
  const ch = (code: number) => String.fromCharCode(code);
  test("titolo: una riga, niente controllo né invisibili, tagliato con l'ellissi", () => {
    assert.equal(cleanStreamTitle(`Ranked${ch(10)}con la chat${ch(9)}!`), "Ranked con la chat !");
    // override di direzione (U+202E), spazio a larghezza zero (U+200B), campanello (U+0007): diventano spazi
    assert.equal(cleanStreamTitle(`abc${ch(0x202e)}def${ch(0x200b)}ghi${ch(7)}`), "abc def ghi");
    assert.equal(cleanStreamTitle("   "), undefined);
    assert.equal(cleanStreamTitle(42), undefined);
    const long = cleanStreamTitle("x".repeat(500)) ?? "";
    assert.equal(Array.from(long).length, STREAM_TITLE_MAX);
    assert.ok(long.endsWith("…"));
  });
  test("canale: solo https://www.twitch.tv/<canale> nella forma che scrive il sito", () => {
    assert.equal(channelLogin("https://www.twitch.tv/aldrymus"), "aldrymus");
    assert.equal(channelLogin("https://www.twitch.tv/r0bip"), "r0bip");
    assert.equal(channelLogin("https://twitch.tv/aldrymus"), null);
    assert.equal(channelLogin("https://www.twitch.tv/AldryMus"), null);
    assert.equal(channelLogin("https://www.twitch.tv/aldrymus/videos"), null);
    assert.equal(channelLogin("javascript:alert(1)"), null);
  });
  test("risposta di /api/live letta dal browser: le voci che non tornano si scartano", () => {
    const users = safeLiveUsers({
      aldrymus: { channel: "https://www.twitch.tv/aldrymus", viewers: "7", title: `Test${ch(0x202e)}` },
      "robip-origins": { channel: "https://www.twitch.tv/r0bip", viewers: 12.6 },
      cattivo: { channel: "https://evil.example/aldrymus", viewers: 1 },
      "nome con spazi": { channel: "https://www.twitch.tv/altro", viewers: 1 },
      vuoto: null,
    });
    assert.deepEqual(users, {
      aldrymus: { channel: "https://www.twitch.tv/aldrymus", viewers: 7, title: "Test" },
      "robip-origins": { channel: "https://www.twitch.tv/r0bip", viewers: 13 },
    });
    assert.deepEqual(safeLiveUsers(null), {});
    assert.deepEqual(safeLiveUsers([1, 2]), {});
  });
  test("ordine: più spettatori prima, a parità il nome utente", () => {
    const users = {
      zeta: { channel: "https://www.twitch.tv/zeta", viewers: 5 },
      alfa: { channel: "https://www.twitch.tv/alfa", viewers: 5 },
      beta: { channel: "https://www.twitch.tv/beta", viewers: 40 },
    };
    assert.deepEqual(liveOrder(users), ["beta", "alfa", "zeta"]);
    assert.deepEqual(liveOrder({}), []);
  });
});
