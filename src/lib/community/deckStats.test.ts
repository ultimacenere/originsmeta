/**
 * Test delle statistiche dei mazzi per gli autori (`deckStats.ts`, pacchetto STATS del 26/09/2026) con il runner
 * integrato di Node: `node --test src/lib/community/deckStats.test.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  DECK_STAT_KINDS,
  SEEN_MAX,
  STAT_COLUMN,
  addSeen,
  averageStars,
  canSeeAllStats,
  combineSummaries,
  daysBetween,
  isDeckStatKind,
  isLikelyBot,
  isVideoEmbedSrc,
  niceCeil,
  normalizeStatRow,
  parseSeen,
  rankDecks,
  seenKey,
  shiftDay,
  statKindForEvent,
  statKindForHref,
  summarizeDecks,
  utcDay,
  voteDay,
  windowStarts,
  type DeckStatRow,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./deckStats.ts";

const row = (deck_id: string, day: string, views = 0, code_copies = 0, link_clicks = 0, video_plays = 0): DeckStatRow => ({ deck_id, day, views, code_copies, link_clicks, video_plays });

describe("tipi di contatore", () => {
  test("i quattro tipi e le colonne della tabella, come in bump_deck_stat", () => {
    assert.deepEqual([...DECK_STAT_KINDS], ["view", "code", "link", "video"]);
    assert.deepEqual(STAT_COLUMN, { view: "views", code: "code_copies", link: "link_clicks", video: "video_plays" });
    assert.equal(isDeckStatKind("view"), true);
    assert.equal(isDeckStatKind("vote"), false);
    assert.equal(isDeckStatKind(3), false);
  });
});

describe("bot", () => {
  const chrome = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
  test("i browser veri contano", () => {
    assert.equal(isLikelyBot(chrome), false);
    assert.equal(isLikelyBot(iphone), false);
    // un telefono CUBOT non è un bot
    assert.equal(isLikelyBot("Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"), false);
  });
  test("crawler, browser senza testa e strumenti di misura no", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 Chrome-Lighthouse",
      "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
      "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)",
    ]) {
      assert.equal(isLikelyBot(ua), true, ua);
    }
  });
  test("user agent vuoto o browser pilotato", () => {
    assert.equal(isLikelyBot(""), true);
    assert.equal(isLikelyBot(null), true);
    assert.equal(isLikelyBot(chrome, true), true);
  });
});

describe("una volta per sessione", () => {
  test("la voce si aggiunge una volta sola", () => {
    const k = seenKey("spellcast-ab12", "view");
    assert.equal(k, "spellcast-ab12|view");
    const first = addSeen([], k);
    assert.deepEqual(first, [k]);
    assert.equal(addSeen(first ?? [], k), null);
    // stesso mazzo, altro tipo: conta
    assert.deepEqual(addSeen(first ?? [], seenKey("spellcast-ab12", "code")), [k, "spellcast-ab12|code"]);
  });
  test("tetto: escono le voci più vecchie", () => {
    const list = ["a", "b", "c"];
    assert.deepEqual(addSeen(list, "d", 3), ["b", "c", "d"]);
  });
  test("chiave rovinata o assente: elenco vuoto", () => {
    assert.deepEqual(parseSeen(null), []);
    assert.deepEqual(parseSeen("{"), []);
    assert.deepEqual(parseSeen('{"a":1}'), []);
    assert.deepEqual(parseSeen('["x",2,"y"]'), ["x", "y"]);
    const many = JSON.stringify(Array.from({ length: SEEN_MAX + 5 }, (_, i) => `k${i}`));
    assert.equal(parseSeen(many).length, SEEN_MAX);
  });
});

describe("eventi e link della scheda", () => {
  const origin = "https://originsmeta.com";
  test("la copia del codice del gioco dalla scheda è un contatore, le altre no", () => {
    assert.equal(statKindForEvent("game_code_copy", { placement: "deck_page" }), "code");
    assert.equal(statKindForEvent("game_code_copy", { placement: "builder" }), null);
    assert.equal(statKindForEvent("deck_open_builder", { placement: "deck_page" }), null);
  });
  test("link esterni: video di YouTube e Twitch, poi ogni altro link", () => {
    assert.equal(statKindForHref("https://www.youtube.com/watch?v=abcdefghijk", origin), "video");
    assert.equal(statKindForHref("https://youtu.be/abcdefghijk", origin), "video");
    assert.equal(statKindForHref("https://m.youtube.com/shorts/abcdefghijk", origin), "video");
    assert.equal(statKindForHref("https://www.twitch.tv/videos/123456", origin), "video");
    assert.equal(statKindForHref("https://www.twitch.tv/coachcrono/clip/FunnyClip-xyz", origin), "video");
    assert.equal(statKindForHref("https://clips.twitch.tv/FunnyClip-xyz", origin), "video");
    // canali e pagine: link
    assert.equal(statKindForHref("https://www.twitch.tv/coachcrono", origin), "link");
    assert.equal(statKindForHref("https://www.youtube.com/@coachcrono", origin), "link");
    assert.equal(statKindForHref("https://www.youtube.com/watch", origin), "link");
    assert.equal(statKindForHref("https://discord.gg/abc", origin), "link");
    assert.equal(statKindForHref("https://docs.google.com/spreadsheets/d/x", origin), "link");
  });
  test("link interni e non pagine: niente", () => {
    assert.equal(statKindForHref("/it/decks/community/altro-mazzo", origin), null);
    assert.equal(statKindForHref("https://originsmeta.com/it/cards/merlin", origin), null);
    assert.equal(statKindForHref("mailto:staff@originsmeta.com", origin), null);
    assert.equal(statKindForHref("javascript:void(0)", origin), null);
    assert.equal(statKindForHref("http://[", origin), null);
  });
  test("iframe dei lettori video", () => {
    assert.equal(isVideoEmbedSrc("https://www.youtube-nocookie.com/embed/abcdefghijk"), true);
    assert.equal(isVideoEmbedSrc("https://player.twitch.tv/?video=123&parent=originsmeta.com"), true);
    assert.equal(isVideoEmbedSrc("https://clips.twitch.tv/embed?clip=x&parent=originsmeta.com"), true);
    assert.equal(isVideoEmbedSrc("https://challenges.cloudflare.com/turnstile"), false);
    assert.equal(isVideoEmbedSrc(""), false);
    assert.equal(isVideoEmbedSrc(null), false);
  });
});

describe("chi vede tutto", () => {
  test("admin o tag Staff, come la policy SQL", () => {
    assert.equal(canSeeAllStats({ role: "admin", badge: "community" }), true);
    assert.equal(canSeeAllStats({ role: "user", badge: "staff" }), true);
    assert.equal(canSeeAllStats({ role: "user", badge: "influencer" }), false);
    assert.equal(canSeeAllStats(null), false);
  });
});

describe("giorni", () => {
  test("giorno UTC, spostamenti e distanze", () => {
    assert.equal(utcDay(new Date("2026-09-26T23:30:00+02:00")), "2026-09-26");
    assert.equal(utcDay(new Date("2026-09-27T01:30:00+02:00")), "2026-09-26");
    assert.equal(shiftDay("2026-09-26", -29), "2026-08-28");
    assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
    assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
    assert.equal(daysBetween("2026-08-28", "2026-09-26"), 29);
    assert.equal(daysBetween("2026-09-26", "2026-09-26"), 0);
    assert.deepEqual(windowStarts("2026-09-26"), { d7: "2026-09-20", d30: "2026-08-28" });
  });
  test("giorno del voto in UTC", () => {
    assert.equal(voteDay("2026-09-26T10:12:13.123456+00:00"), "2026-09-26");
    assert.equal(voteDay("2026-09-27T00:30:00+02:00"), "2026-09-26");
    assert.equal(voteDay("non una data"), null);
  });
  test("righe del database rese sicure", () => {
    assert.deepEqual(normalizeStatRow({ deck_id: "d", day: "2026-09-26", views: "3", code_copies: -2, link_clicks: 1.7, video_plays: null }), row("d", "2026-09-26", 3, 0, 1, 0));
    assert.equal(normalizeStatRow({ deck_id: "d", day: "26/09/2026" }), null);
    assert.equal(normalizeStatRow(null), null);
    assert.equal(normalizeStatRow({ day: "2026-09-26" }), null);
  });
});

describe("riepiloghi", () => {
  const today = "2026-09-26";
  const rows = [
    row("a", "2026-09-26", 5, 2, 1, 1), // oggi
    row("a", "2026-09-20", 3, 1), // primo giorno della finestra di 7
    row("a", "2026-09-19", 10), // fuori dai 7, dentro i 30
    row("a", "2026-08-28", 4), // primo giorno della finestra di 30
    row("a", "2026-08-27", 100, 9), // fuori dai 30: solo nel totale
    row("b", "2026-09-25", 7),
    row("z", "2026-09-25", 999), // mazzo di un altro: si ignora
  ];
  const votes = [
    { deck_id: "a", stars: 5, created_at: "2026-09-25T12:00:00+00:00" },
    { deck_id: "a", stars: 3, created_at: "2026-09-01T12:00:00+00:00" },
    { deck_id: "a", stars: 4, created_at: "2026-07-01T12:00:00+00:00" },
    { deck_id: "a", stars: 9, created_at: "2026-09-25T12:00:00+00:00" }, // stelle fuori scala: si scarta
    { deck_id: "b", stars: 2, created_at: "data rovinata" }, // conta solo nel totale
  ];
  const map = summarizeDecks(["a", "b", "c"], rows, votes, today);

  test("finestre di 7 e 30 giorni con oggi compreso, e totale", () => {
    const a = map.get("a");
    assert.ok(a);
    assert.deepEqual(a.views, { d7: 8, d30: 22, total: 122 });
    assert.deepEqual(a.code, { d7: 3, d30: 3, total: 12 });
    assert.deepEqual(a.link, { d7: 1, d30: 1, total: 1 });
    assert.deepEqual(a.video, { d7: 1, d30: 1, total: 1 });
    assert.equal(a.firstDay, "2026-08-27");
  });
  test("voti per data del voto, con la somma delle stelle per la media", () => {
    const a = map.get("a");
    assert.ok(a);
    assert.deepEqual(a.votes, { d7: 1, d30: 2, total: 3 });
    assert.deepEqual(a.stars, { d7: 5, d30: 8, total: 12 });
    assert.equal(averageStars(a.stars.total, a.votes.total), 4);
    assert.equal(averageStars(a.stars.d30, a.votes.d30), 4);
    const b = map.get("b");
    assert.deepEqual(b?.votes, { d7: 0, d30: 0, total: 1 });
    assert.equal(averageStars(0, 0), null);
    assert.equal(averageStars(14, 3), 4.7);
  });
  test("serie degli ultimi 30 giorni, dal più vecchio a oggi", () => {
    const a = map.get("a");
    assert.ok(a);
    assert.equal(a.series.views.length, 30);
    assert.equal(a.series.views[0], 4); // 28 agosto
    assert.equal(a.series.views[22], 10); // 19 settembre
    assert.equal(a.series.views[23], 3); // 20 settembre
    assert.equal(a.series.views[29], 5); // oggi
    assert.equal(a.series.code[29], 2);
    assert.equal(
      a.series.views.reduce((s, x) => s + x, 0),
      22,
    );
  });
  test("un mazzo senza righe resta a zero; i mazzi di altri non entrano", () => {
    const c = map.get("c");
    assert.deepEqual(c?.views, { d7: 0, d30: 0, total: 0 });
    assert.equal(c?.firstDay, null);
    assert.equal(map.has("z"), false);
  });
  test("somma di tutti i mazzi dell'autore", () => {
    const all = combineSummaries([...map.values()]);
    assert.deepEqual(all.views, { d7: 15, d30: 29, total: 129 });
    assert.deepEqual(all.votes, { d7: 1, d30: 2, total: 4 });
    assert.equal(all.series.views[28], 7); // 25 settembre, mazzo b
    assert.equal(all.firstDay, "2026-08-27");
  });
});

describe("classifica dello staff", () => {
  const today = "2026-09-26";
  test("per visite in 30 giorni, poi in 7, poi copie; fuori i mazzi senza attività", () => {
    const rows = [
      row("a", "2026-09-26", 5),
      row("a", "2026-09-01", 5),
      row("b", "2026-09-25", 10),
      row("c", "2026-09-02", 10, 3),
      row("d", "2026-08-01", 500), // fuori dai 30 giorni
      row("e", "2026-09-26", 0, 1), // solo una copia: resta, in fondo
    ];
    const ranked = rankDecks(rows, today);
    assert.deepEqual(
      ranked.map((r) => r.deck_id),
      ["b", "a", "c", "e"],
    );
    assert.deepEqual(ranked[0], { deck_id: "b", views30: 10, views7: 10, code30: 0, link30: 0, video30: 0 });
    assert.equal(rankDecks(rows, today, 2).length, 2);
  });
});

describe("assi dei grafici", () => {
  test("massimo tondo", () => {
    assert.equal(niceCeil(0), 1);
    assert.equal(niceCeil(1), 1);
    assert.equal(niceCeil(3), 5);
    assert.equal(niceCeil(7), 10);
    assert.equal(niceCeil(10), 10);
    assert.equal(niceCeil(11), 20);
    assert.equal(niceCeil(230), 500);
    assert.equal(niceCeil(Number.NaN), 1);
  });
});
