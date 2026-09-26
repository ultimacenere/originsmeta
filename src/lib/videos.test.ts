/**
 * Test di video e risorse dei mazzi e delle guide (`videos.ts`, etichette in `videoLabels.ts`) con il runner integrato
 * di Node: `node --test src/lib/videos.test.ts`. Come per tierstats.test.ts, l'import ha l'estensione `.ts`.
 * In fondo un controllo incrociato con l'SQL (blocco VIDEO di supabase/schema.sql, accodato il 26/09/2026): host ammessi ed
 * esclusi, percorsi di reindirizzamento, caratteri vietati e forme canoniche dei video devono essere gli stessi nel sito
 * e nei vincoli del database.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LINK_BLOCKED_HOSTS,
  LINK_BLOCKED_PATH,
  LINK_HOSTS,
  MAX_DECK_LINKS,
  MAX_DECK_VIDEOS,
  START_MAX,
  VIDEO_TITLE_MAX,
  allowedSiteNames,
  cleanLabel,
  cleanVideoTitle,
  deckLinks,
  deckResources,
  deckVideos,
  embedSrc,
  fillVideoLabel,
  formatStart,
  guideVideoLayout,
  guideVideoLd,
  isIsoDate,
  legacyResource,
  mediaErrorField,
  mediaFieldRow,
  mediaNeedsColumns,
  parseLink,
  parseStartInput,
  parseTimeParam,
  parseVideoUrl,
  publicEmbedUrl,
  readDeckMedia,
  twitchFits,
  twitchParents,
  twitchTime,
  watchUrl,
  youtubeId,
  youtubeThumb,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097
} from "./videos.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { videoFormLabels, videoLabels, videoPrivacyText } from "./videoLabels.ts";

const YT = "dQw4w9WgXcQ";

describe("riconoscimento dei video", () => {
  test("YouTube: watch, youtu.be, Shorts, dirette, embed, m. e nocookie; indirizzo canonico senza tracciamento", () => {
    const watch = { provider: "youtube", kind: "video", id: YT, url: `https://www.youtube.com/watch?v=${YT}` };
    assert.deepEqual(parseVideoUrl(`https://www.youtube.com/watch?v=${YT}&list=PL123&si=abc`), watch);
    assert.deepEqual(parseVideoUrl(`https://youtu.be/${YT}?si=xyz`), watch);
    assert.deepEqual(parseVideoUrl(`youtu.be/${YT}`), watch, "senza schema si assume https");
    assert.deepEqual(parseVideoUrl(`http://m.youtube.com/watch?v=${YT}`), watch, "http e m. vanno bene, si salva in https");
    assert.deepEqual(parseVideoUrl(`https://www.youtube.com/live/${YT}?feature=share`), watch);
    assert.deepEqual(parseVideoUrl(`https://www.youtube-nocookie.com/embed/${YT}`), watch);
    assert.deepEqual(parseVideoUrl(`https://www.youtube.com/shorts/${YT}`), { provider: "youtube", kind: "short", id: YT, url: `https://www.youtube.com/shorts/${YT}` });
  });

  test("YouTube: il minuto dell'indirizzo (t=, start=, #t=) finisce in start", () => {
    assert.equal(parseVideoUrl(`https://youtu.be/${YT}?t=750`)?.start, 750);
    assert.equal(parseVideoUrl(`https://www.youtube.com/watch?v=${YT}&t=12m30s`)?.start, 750);
    assert.equal(parseVideoUrl(`https://www.youtube.com/watch?v=${YT}&t=1h2m3s`)?.start, 3723);
    assert.equal(parseVideoUrl(`https://www.youtube.com/embed/${YT}?start=90`)?.start, 90);
    assert.equal(parseVideoUrl(`https://www.youtube.com/watch?v=${YT}#t=45`)?.start, 45);
    assert.equal(parseVideoUrl(`https://www.youtube.com/watch?v=${YT}&t=0`)?.start, undefined, "0 = dall'inizio");
    assert.equal(parseVideoUrl(`https://www.youtube.com/watch?v=${YT}&t=abc`)?.start, undefined);
  });

  test("Twitch: VOD, clip nelle quattro forme, lettore; il minuto del VOD dal parametro t", () => {
    assert.deepEqual(parseVideoUrl("https://www.twitch.tv/videos/2245678901?t=1h02m03s"), {
      provider: "twitch",
      kind: "vod",
      id: "2245678901",
      url: "https://www.twitch.tv/videos/2245678901",
      start: 3723,
    });
    const clip = { provider: "twitch", kind: "clip", id: "FunnyClip-AbC_123", url: "https://clips.twitch.tv/FunnyClip-AbC_123" };
    assert.deepEqual(parseVideoUrl("https://clips.twitch.tv/FunnyClip-AbC_123"), clip);
    assert.deepEqual(parseVideoUrl("https://www.twitch.tv/coachcrono/clip/FunnyClip-AbC_123?filter=clips"), clip);
    assert.deepEqual(parseVideoUrl("https://m.twitch.tv/coachcrono/clip/FunnyClip-AbC_123"), clip);
    assert.deepEqual(parseVideoUrl("https://m.twitch.tv/clip/FunnyClip-AbC_123?tt_medium=mobile"), clip, "la condivisione dal telefono");
    assert.deepEqual(parseVideoUrl("https://clips.twitch.tv/embed?clip=FunnyClip-AbC_123&parent=example.com"), clip);
    assert.equal(parseVideoUrl("https://player.twitch.tv/?video=v2245678901&parent=x.com")?.url, "https://www.twitch.tv/videos/2245678901");
    assert.equal(parseVideoUrl("https://clips.twitch.tv/FunnyClip?t=30")?.start, undefined, "le clip non hanno un minuto");
  });

  test("non sono video: canali, altri siti, id sbagliati, credenziali, porte, schemi strani", () => {
    for (const raw of [
      "",
      "   ",
      "https://www.twitch.tv/coachcrono",
      "https://www.twitch.tv/clip",
      "https://www.youtube.com/@origins_tcg",
      "https://www.youtube.com/playlist?list=PL123",
      "https://music.youtube.com/watch?v=" + YT,
      "https://www.youtube.com/watch?v=short",
      "https://youtu.be/" + YT + "x",
      "https://www.youtube.com.evil.example/watch?v=" + YT,
      "https://evil.example/?u=https://youtu.be/" + YT,
      "https://user:pw@www.youtube.com/watch?v=" + YT,
      "https://www.youtube.com:8443/watch?v=" + YT,
      "javascript:alert(1)//youtu.be/" + YT,
      "ftp://youtu.be/" + YT,
      "https://www.twitch.tv/videos/abc",
      "https://clips.twitch.tv/embed",
      "https://vimeo.com/123456",
      "https://youtu.be/" + YT + " altro",
    ]) {
      assert.equal(parseVideoUrl(raw), null, raw);
    }
    assert.equal(youtubeId(`https://youtu.be/${YT}`), YT);
    assert.equal(youtubeId("https://www.twitch.tv/videos/123"), null);
    assert.equal(youtubeId(null), null);
  });
});

describe("minuto di partenza", () => {
  test("parseStartInput: vuoto, minuti, m:ss, h:mm:ss, 12m30s; il resto non vale", () => {
    assert.deepEqual(parseStartInput(""), { ok: true });
    assert.deepEqual(parseStartInput("  "), { ok: true });
    assert.deepEqual(parseStartInput("12"), { ok: true, value: 720 }, "un numero solo = minuti");
    assert.deepEqual(parseStartInput("12:30"), { ok: true, value: 750 });
    assert.deepEqual(parseStartInput("0:45"), { ok: true, value: 45 });
    assert.deepEqual(parseStartInput("1:02:03"), { ok: true, value: 3723 });
    assert.deepEqual(parseStartInput("12m30s"), { ok: true, value: 750 });
    assert.deepEqual(parseStartInput("1h 2m"), { ok: true, value: 3720 });
    assert.deepEqual(parseStartInput("0"), { ok: true }, "zero = dall'inizio");
    for (const bad of ["abc", "12:75", "1:2:3:4", "-5", "12.30", "49:00:00", "m"]) assert.deepEqual(parseStartInput(bad), { ok: false }, bad);
  });

  test("parseTimeParam, formatStart e twitchTime", () => {
    assert.equal(parseTimeParam("90"), 90);
    assert.equal(parseTimeParam("90s"), 90);
    assert.equal(parseTimeParam("1m30s"), 90);
    assert.equal(parseTimeParam(String(START_MAX + 1)), undefined);
    assert.equal(parseTimeParam(null), undefined);
    assert.equal(formatStart(750), "12:30");
    assert.equal(formatStart(45), "0:45");
    assert.equal(formatStart(3723), "1:02:03");
    assert.equal(twitchTime(3723), "1h2m3s");
    assert.equal(twitchTime(90), "0h1m30s");
  });
});

describe("lettore e link esterni", () => {
  test("embedSrc: youtube-nocookie con autoplay e minuto; Twitch con tutti i parent e il minuto", () => {
    const yt = parseVideoUrl(`https://youtu.be/${YT}?t=90`)!;
    assert.equal(embedSrc(yt, []), `https://www.youtube-nocookie.com/embed/${YT}?autoplay=1&rel=0&playsinline=1&start=90`);
    const vod = parseVideoUrl("https://www.twitch.tv/videos/123?t=1m5s")!;
    assert.equal(embedSrc(vod, ["originsmeta.com", "preview.vercel.app"]), "https://player.twitch.tv/?video=v123&parent=originsmeta.com&parent=preview.vercel.app&autoplay=true&time=0h1m5s");
    const clip = parseVideoUrl("https://clips.twitch.tv/Abc-1")!;
    assert.equal(embedSrc(clip, ["originsmeta.com"]), "https://clips.twitch.tv/embed?clip=Abc-1&parent=originsmeta.com&autoplay=true");
  });

  test("twitchParents: i domini del sito più quello della pagina, senza doppioni né valori strani", () => {
    assert.deepEqual(twitchParents("originsmeta.com"), ["originsmeta.com", "www.originsmeta.com"]);
    assert.deepEqual(twitchParents("originsmeta-git-x.vercel.app"), ["originsmeta.com", "www.originsmeta.com", "originsmeta-git-x.vercel.app"]);
    assert.deepEqual(twitchParents("localhost"), ["originsmeta.com", "www.originsmeta.com", "localhost"]);
    assert.deepEqual(twitchParents("evil.com&parent=x"), ["originsmeta.com", "www.originsmeta.com"]);
    assert.deepEqual(twitchParents(undefined), ["originsmeta.com", "www.originsmeta.com"]);
  });

  test("twitchFits: l'embed di Twitch vuole almeno 400×300 (colonna di 437 px in 16:9 = 246 px: troppo bassa)", () => {
    assert.equal(twitchFits(640, 360), true);
    assert.equal(twitchFits(400, 300), true);
    assert.equal(twitchFits(437, 246), false);
    assert.equal(twitchFits(343, 300), false);
  });

  test("youtubeThumb: miniatura di YouTube per i video e gli Short, nessuna per Twitch", () => {
    assert.equal(youtubeThumb(parseVideoUrl(`https://youtu.be/${YT}`)!), `https://i.ytimg.com/vi/${YT}/hqdefault.jpg`);
    assert.equal(youtubeThumb(parseVideoUrl(`https://www.youtube.com/shorts/${YT}`)!), `https://i.ytimg.com/vi/${YT}/hqdefault.jpg`);
    assert.equal(youtubeThumb(parseVideoUrl("https://www.twitch.tv/videos/1")!), null);
    assert.equal(youtubeThumb({ provider: "youtube", id: "../../x" }), null);
  });

  test("watchUrl e publicEmbedUrl", () => {
    assert.equal(watchUrl(parseVideoUrl(`https://youtu.be/${YT}?t=90`)!), `https://www.youtube.com/watch?v=${YT}&t=90s`);
    assert.equal(watchUrl(parseVideoUrl(`https://www.youtube.com/shorts/${YT}`)!), `https://www.youtube.com/shorts/${YT}`);
    assert.equal(watchUrl(parseVideoUrl("https://www.twitch.tv/videos/123?t=90")!), "https://www.twitch.tv/videos/123?t=0h1m30s");
    assert.equal(watchUrl(parseVideoUrl("https://clips.twitch.tv/Abc")!), "https://clips.twitch.tv/Abc");
    assert.equal(publicEmbedUrl(parseVideoUrl(`https://youtu.be/${YT}`)!), `https://www.youtube.com/embed/${YT}`);
    assert.equal(publicEmbedUrl(parseVideoUrl("https://www.twitch.tv/videos/123")!), "https://player.twitch.tv/?video=v123&parent=originsmeta.com");
  });
});

describe("video di un mazzo", () => {
  test("colonna videos: solo quelli riconosciuti, senza doppioni, al massimo tre; il minuto salvato vince; titolo ripulito", () => {
    const v = deckVideos({
      videos: [
        { url: `https://www.youtube.com/watch?v=${YT}`, start: 750, title: "  Deck tech‮ al contrario " },
        { url: `https://youtu.be/${YT}` },
        { url: "https://evil.example/video" },
        "https://www.twitch.tv/videos/1",
        { url: "https://www.twitch.tv/videos/1", title: 7 },
        { url: "https://clips.twitch.tv/Abc", start: 30 },
        { url: "https://www.twitch.tv/videos/2" },
      ],
      video_url: "https://www.twitch.tv/videos/999",
    });
    assert.equal(v.length, MAX_DECK_VIDEOS);
    assert.deepEqual(
      v.map((x: { url: string; start?: number; title?: string }) => [x.url, x.start, x.title]),
      [
        [`https://www.youtube.com/watch?v=${YT}`, 750, "Deck tech al contrario"],
        ["https://www.twitch.tv/videos/1", undefined, undefined],
        ["https://clips.twitch.tv/Abc", undefined, undefined],
      ],
    );
    assert.equal(deckVideos({ videos: [{ url: `https://youtu.be/${YT}`, start: 1.5 }] })[0].start, undefined, "un minuto non intero non vale");
  });

  test("vecchio video_url: primo video se la colonna è vuota o manca", () => {
    assert.deepEqual(deckVideos({ video_url: `https://youtu.be/${YT}?t=10` }).map((x: { start?: number }) => x.start), [10]);
    assert.deepEqual(deckVideos({ videos: [], video_url: `https://youtu.be/${YT}` }).length, 1);
    assert.deepEqual(deckVideos({ videos: null, video_url: null }), []);
  });

  test("vecchio video_url che non è un video: risorsa solo se l'host è ammesso, mai verso un sito qualsiasi", () => {
    assert.deepEqual(legacyResource({ video_url: "https://www.twitch.tv/coachcrono" }, "Guarda il video"), {
      label: "Guarda il video",
      url: "https://www.twitch.tv/coachcrono",
      host: "twitch.tv",
    });
    assert.equal(legacyResource({ video_url: "https://evil.example/phish" }, "x"), null, "host non ammesso");
    assert.equal(legacyResource({ videos: [], video_url: "http://evil.example/phish" }, "x"), null);
    assert.equal(legacyResource({ video_url: "https://vimeo.com/123" }, "x"), null);
    assert.equal(legacyResource({ video_url: `https://youtu.be/${YT}` }, "x"), null, "riconosciuto: va nel lettore");
    assert.equal(legacyResource({ video_url: "javascript:alert(1)" }, "x"), null);
    assert.equal(legacyResource({ video_url: null }, "x"), null);
    const res = deckResources(
      { video_url: "https://www.twitch.tv/coachcrono", links: [{ label: "Discord", url: "https://discord.gg/abc" }, { label: "Doppione", url: "https://www.twitch.tv/coachcrono" }] },
      "Guarda il video",
    );
    assert.deepEqual(
      res.map((l: { label: string }) => l.label),
      ["Discord", "Doppione"],
      "il link salvato vince sul vecchio uguale",
    );
    assert.deepEqual(deckResources({ video_url: "https://www.twitch.tv/coachcrono" }, "Guarda il video").length, 1);
  });
});

describe("risorse", () => {
  test("host ammessi con i sottodomini; niente sosia, credenziali, porte, schemi strani, trattini bassi", () => {
    assert.deepEqual(parseLink("https://www.youtube.com/playlist?list=PL1"), { ok: true, url: "https://www.youtube.com/playlist?list=PL1", host: "youtube.com" });
    assert.deepEqual(parseLink("old.reddit.com/r/OriginsTCG"), { ok: true, url: "https://old.reddit.com/r/OriginsTCG", host: "old.reddit.com" });
    assert.deepEqual(parseLink("http://x.com/origins_tcg"), { ok: true, url: "https://x.com/origins_tcg", host: "x.com" }, "http si riscrive in https");
    assert.equal(parseLink("https://store.steampowered.com/app/4429430/").ok, true);
    assert.equal(parseLink("https://discord.gg/abc").ok, true);
    assert.equal(parseLink("https://discord.com/invite/abc").ok, true);
    assert.deepEqual(parseLink("https://discord.com/oauth2/authorize?client_id=1"), { ok: false, reason: "host" }, "su discord.com solo inviti, canali ed eventi");
    assert.deepEqual(parseLink("https://ptb.discord.com/oauth2/authorize"), { ok: false, reason: "host" }, "anche sui sottodomini");
    assert.deepEqual(parseLink("https://bit.ly/abc"), { ok: false, reason: "host" });
    assert.deepEqual(parseLink("https://youtube.com.evil.example/x"), { ok: false, reason: "host" });
    assert.deepEqual(parseLink("https://notyoutube.com/x"), { ok: false, reason: "host" });
    assert.deepEqual(parseLink("https://user@youtube.com/x"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink("https://youtube.com:444/x"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink("https://a_b.youtube.com/x"), { ok: false, reason: "invalid" }, "il vincolo SQL non riconosce un host col trattino basso");
    assert.deepEqual(parseLink("javascript:alert(1)"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink("data:text/html,hi"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink(`https://youtube.com/${"a".repeat(300)}`), { ok: false, reason: "invalid" }, "oltre 300 caratteri");
    assert.ok(allowedSiteNames().includes("Twitch"));
    assert.equal(new Set(allowedSiteNames()).size, allowedSiteNames().length);
  });

  test("niente reindirizzamenti delle piattaforme ammesse (dominio fidato, destinazione qualsiasi)", () => {
    for (const raw of [
      "https://l.instagram.com/?u=https%3A%2F%2Fevil.com",
      "https://www.youtube.com/redirect?q=https://evil.com",
      "https://m.youtube.com/Redirect?q=https://evil.com",
      "https://www.youtube.com/attribution_link?u=/watch",
      "https://steamcommunity.com/linkfilter/?url=https://evil.com",
      "https://out.reddit.com/t3_x?url=https://evil.com",
      "https://x.com/i/redirect?url=https://evil.com",
      "https://www.tiktok.com/link/v2?target=https://evil.com",
      "https://vm.tiktok.com/ZMabc/",
      "https://vt.tiktok.com/ZSabc/",
      "https://go.bsky.app/abc",
    ]) {
      assert.deepEqual(parseLink(raw), { ok: false, reason: "host" }, raw);
    }
    assert.equal(parseLink("https://www.youtube.com/redirects-explained").ok, true, "solo il percorso esatto");
    assert.equal(parseLink("https://www.instagram.com/originstcg/").ok, true);
    assert.equal(parseLink("https://www.tiktok.com/@originstcg").ok, true);
  });

  test("etichette e titoli: testo semplice, niente caratteri di controllo, di direzione né invisibili", () => {
    assert.equal(cleanLabel("  Deck tech\n completo  "), "Deck tech completo");
    assert.equal(cleanLabel("abc‮gpj.exe"), "abcgpj.exe");
    assert.equal(cleanLabel("a؜b"), "ab", "ALM (U+061C), come LRM e RLM");
    assert.equal(cleanLabel("a​b­c﻿d"), "abcd", "spazio a larghezza zero, trattino morbido, BOM");
    assert.equal(cleanLabel("\u0000x\u0007"), "x");
    assert.equal(Array.from(cleanLabel("é".repeat(60))).length, 40);
    assert.equal(cleanLabel("🎥".repeat(50)), "🎥".repeat(40), "si contano i caratteri, non le metà delle emoji");
    assert.equal(cleanLabel(undefined), "");
    assert.equal(Array.from(cleanVideoTitle("t".repeat(150))).length, VIDEO_TITLE_MAX);
  });

  test("deckLinks rilegge le righe salvate con le stesse regole; etichetta di riserva = dominio, entro 40 caratteri", () => {
    const shown = deckLinks({
      links: [
        { label: "VOD completo", url: "https://www.twitch.tv/videos/1" },
        { label: "", url: "https://discord.gg/abc" },
        { label: "Truffa", url: "https://evil.example" },
        { label: "Doppione", url: "https://www.twitch.tv/videos/1" },
        { label: 3, url: "https://x.com/a" },
        null,
      ],
    });
    assert.deepEqual(shown, [
      { label: "VOD completo", url: "https://www.twitch.tv/videos/1", host: "twitch.tv" },
      { label: "discord.gg", url: "https://discord.gg/abc", host: "discord.gg" },
      { label: "x.com", url: "https://x.com/a", host: "x.com" },
    ]);
    assert.deepEqual(deckLinks({}), []);
    assert.equal(deckLinks({ links: Array.from({ length: 9 }, (_, i) => ({ label: `L${i}`, url: `https://x.com/${i}` })) }).length, MAX_DECK_LINKS);
    const long = deckLinks({ links: [{ label: "", url: "https://a-very-long-subdomain-name-for-testing-purposes.reddit.com/r/x" }] });
    assert.equal(Array.from(long[0].label).length, 40);
  });
});

describe("modulo di pubblicazione", () => {
  const form = (o: Record<string, string>) => (k: string) => (k in o ? o[k] : null);

  test("video e link validi, righe vuote saltate, doppioni tolti, minuto dal campo o dall'indirizzo, titolo", () => {
    const r = readDeckMedia(
      form({
        video_url_0: `https://youtu.be/${YT}?t=90`,
        video_start_0: "",
        video_title_0: "  Deck tech​ ",
        video_url_1: "",
        video_start_1: "5",
        video_url_2: "https://www.twitch.tv/videos/77",
        video_start_2: "1:00:00",
        link_label_0: " VOD ",
        link_url_0: "https://www.twitch.tv/videos/77",
        link_label_1: "",
        link_url_1: "discord.gg/abc",
        link_label_2: "",
        link_url_2: "",
        link_label_3: "Stesso",
        link_url_3: "https://discord.gg/abc",
        link_label_4: "",
        link_url_4: "https://a-very-long-subdomain-name-for-testing-purposes.reddit.com/r/x",
      }),
    );
    assert.deepEqual(r, {
      ok: true,
      videos: [
        { url: `https://www.youtube.com/watch?v=${YT}`, start: 90, title: "Deck tech" },
        { url: "https://www.twitch.tv/videos/77", start: 3600 },
      ],
      links: [
        { label: "VOD", url: "https://www.twitch.tv/videos/77" },
        { label: "discord.gg", url: "https://discord.gg/abc" },
        { label: "a-very-long-subdomain-name-for-testing-p", url: "https://a-very-long-subdomain-name-for-testing-purposes.reddit.com/r/x" },
      ],
    });
  });

  test("errori con la riga e il campo: video non riconosciuto o titolo senza link, minuto sbagliato, link senza indirizzo o fuori elenco", () => {
    assert.deepEqual(readDeckMedia(form({ video_url_0: "", video_url_1: "https://vimeo.com/1" })), { ok: false, code: "video", index: 1 });
    assert.deepEqual(readDeckMedia(form({ video_title_2: "Solo il titolo" })), { ok: false, code: "video", index: 2 });
    assert.deepEqual(readDeckMedia(form({ video_url_0: `https://youtu.be/${YT}`, video_start_0: "12:99" })), { ok: false, code: "videoStart", index: 0 });
    assert.deepEqual(readDeckMedia(form({ link_label_2: "Solo testo" })), { ok: false, code: "link", index: 2 });
    assert.deepEqual(readDeckMedia(form({ link_url_0: "https://bit.ly/x" })), { ok: false, code: "linkHost", index: 0 });
    assert.deepEqual(readDeckMedia(form({ link_url_0: "not a url" })), { ok: false, code: "link", index: 0 });
    assert.equal(mediaErrorField("video", 1), "video_url_1");
    assert.equal(mediaErrorField("videoStart", 0), "video_start_0");
    assert.equal(mediaErrorField("linkHost", 4), "link_url_4");
    assert.equal(mediaErrorField("link", 2), "link_url_2");
    assert.equal(mediaFieldRow("link_url_2"), 3);
    assert.equal(mediaFieldRow(undefined), 1);
  });

  test("il modulo di prima (campo `video` unico) vale come primo video; senza campi niente video né link", () => {
    assert.deepEqual(readDeckMedia(form({ video: `https://youtu.be/${YT}` })), { ok: true, videos: [{ url: `https://www.youtube.com/watch?v=${YT}` }], links: [] });
    assert.deepEqual(readDeckMedia(form({})), { ok: true, videos: [], links: [] });
    assert.deepEqual(readDeckMedia(form({ video_url_0: "", video: `https://youtu.be/${YT}` })), { ok: true, videos: [], links: [] }, "col modulo nuovo `video` non conta");
  });

  test("senza le colonne nuove si salva solo un video semplice: il resto andrebbe perso", () => {
    const one = { url: `https://www.youtube.com/watch?v=${YT}` };
    assert.equal(mediaNeedsColumns({ videos: [], links: [] }), false);
    assert.equal(mediaNeedsColumns({ videos: [one], links: [] }), false);
    assert.equal(mediaNeedsColumns({ videos: [one, { url: "https://www.twitch.tv/videos/1" }], links: [] }), true);
    assert.equal(mediaNeedsColumns({ videos: [{ ...one, start: 5 }], links: [] }), true);
    assert.equal(mediaNeedsColumns({ videos: [{ ...one, title: "x" }], links: [] }), true);
    assert.equal(mediaNeedsColumns({ videos: [], links: [{ label: "a", url: "https://x.com/a" }] }), true);
  });
});

describe("etichette", () => {
  const shape = (o: unknown): unknown => (o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)])) : typeof o);

  test("le tre lingue hanno le stesse chiavi e gli stessi segnaposto", () => {
    for (const loc of ["it", "es"] as const) {
      assert.deepEqual(shape(videoLabels[loc]), shape(videoLabels.en), loc);
      const walk = (a: unknown, b: unknown, path: string) => {
        if (typeof a === "string" && typeof b === "string") {
          const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
          assert.deepEqual(ph(b), ph(a), `${loc}.${path}`);
        } else if (a && typeof a === "object") for (const k of Object.keys(a)) walk((a as never)[k], (b as never)[k], `${path}.${k}`);
      };
      walk(videoLabels.en, videoLabels[loc], "");
      assert.ok(videoPrivacyText[loc].length > 200);
    }
    for (const [code, text] of Object.entries(videoLabels.en.errors)) {
      if (code !== "mediaUnavailable") assert.match(text as string, /\{n\}/, `errors.${code} dice la riga`);
    }
    assert.equal(fillVideoLabel(videoFormLabels("it").errors.link, { n: 3 }), "Risorsa 3: l'indirizzo manca o non è valido (https://…).");
    assert.equal(fillVideoLabel("{a} $& {b}", { a: "$1", b: 2 }), "$1 $& 2", "i valori non passano da replace");
  });
});

describe("video nelle guide", () => {
  const body = ["## In breve {#in-breve}", "", "Testo.", "", "## Le carte {#carte}", "", "Altro testo.", "", "## Fine"].join("\n");
  const v = (extra: object) => ({ url: `https://youtu.be/${YT}`, ...extra });

  test("senza video il testo resta intero, in un pezzo solo", () => {
    assert.deepEqual(guideVideoLayout(body, undefined, "it"), { top: [], end: [], segments: [{ kind: "md", source: body }] });
  });

  test("in cima, in fondo e prima di un titolo, con l'ancora della lingua; ancora assente = in cima", () => {
    const layout = guideVideoLayout(body, [v({}), v({ at: "end", url: "https://clips.twitch.tv/Abc" }), v({ before: { it: "carte", en: "cards" } }), v({ before: { it: "manca" } }), { url: "https://evil.example" }], "it");
    assert.equal(layout.top.length, 2, "il primo e quello con l'ancora che non c'è");
    assert.equal(layout.end.length, 1);
    assert.deepEqual(
      layout.segments.map((s: { kind: string; source?: string; items?: unknown[] }) => (s.kind === "md" ? s.source?.split("\n")[0] : `video×${s.items?.length}`)),
      ["## In breve {#in-breve}", "video×1", "## Le carte {#carte}"],
    );
    const en = guideVideoLayout(body, [v({ before: { it: "carte" } })], "en");
    assert.equal(en.top.length, 1, "in inglese l'ancora non è indicata: in cima");
    assert.equal(guideVideoLayout(body, [v({ title: "Il trailer" })], "it").top[0].parsed.title, "Il trailer");
  });

  test("VideoObject solo con titolo, miniatura del sito e data di caricamento veri", () => {
    const full = { url: `https://youtu.be/${YT}`, title: "Deck tech", thumbnail: "/media/news-trailer.webp", uploadDate: "2026-09-21" };
    assert.deepEqual(guideVideoLd(full, "https://originsmeta.com"), {
      "@type": "VideoObject",
      name: "Deck tech",
      thumbnailUrl: "https://originsmeta.com/media/news-trailer.webp",
      uploadDate: "2026-09-21",
      embedUrl: `https://www.youtube.com/embed/${YT}`,
    });
    assert.equal(guideVideoLd({ ...full, uploadDate: undefined }, "https://originsmeta.com"), null);
    assert.equal(guideVideoLd({ ...full, title: " " }, "https://originsmeta.com"), null);
    assert.equal(guideVideoLd({ ...full, thumbnail: "https://i.ytimg.com/vi/x/hq.jpg" }, "https://originsmeta.com"), null, "miniatura solo dal sito");
    assert.equal(guideVideoLd({ ...full, uploadDate: "21/09/2026" }, "https://originsmeta.com"), null);
    assert.equal(guideVideoLd({ ...full, url: "https://vimeo.com/1" }, "https://originsmeta.com"), null);
    assert.equal(isIsoDate("2026-09-21T18:00:00+02:00"), true);
    assert.equal(isIsoDate("2026-02-30"), true, "Date.parse è largo sui giorni: basta la forma");
    assert.equal(isIsoDate("2026-13-01"), false);
  });
});

describe("allineamento con l'SQL", () => {
  // L'SQL del pacchetto sta in schema.sql (accodato il 26/09/2026, prima era supabase/creator-VIDEO.sql).
  const sql = readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8");
  /** Il primo array['…']::text[] dopo un segnaposto `/* NOME *\/` dell'SQL. */
  const listAfter = (marker: string) => {
    const at = sql.indexOf(`/* ${marker} */`);
    assert.ok(at >= 0, `manca /* ${marker} */`);
    const part = sql.slice(at, sql.indexOf("]::text[]", at));
    return [...part.matchAll(/'([a-z0-9.-]+)'/g)].map((m) => m[1]).sort();
  };

  test("host ammessi ed esclusi del vincolo sono quelli di LINK_HOSTS e LINK_BLOCKED_HOSTS", () => {
    assert.deepEqual(listAfter("LINK_HOSTS"), [...LINK_HOSTS].sort());
    assert.deepEqual(listAfter("LINK_BLOCKED_HOSTS"), [...LINK_BLOCKED_HOSTS].sort());
  });

  test("il percorso di reindirizzamento è la stessa espressione regolare", () => {
    const at = sql.indexOf("/* LINK_BLOCKED_PATH */");
    assert.ok(at >= 0, "manca /* LINK_BLOCKED_PATH */");
    const m = sql.slice(at).match(/^\/\* LINK_BLOCKED_PATH \*\/ '([^']+)'/);
    assert.ok(m, "espressione dopo LINK_BLOCKED_PATH non trovata");
    assert.equal(m[1], LINK_BLOCKED_PATH);
  });

  test("i caratteri vietati nei testi sono gli stessi che toglie cleanText", () => {
    const fn = sql.slice(sql.indexOf("function public.deck_text_ok"));
    const m = fn.match(/translate\(t, U&'([^']+)'/);
    assert.ok(m, "translate() di deck_text_ok non trovato");
    const chars = [...m[1].matchAll(/\\([0-9A-F]{4})/g)].map((x) => String.fromCharCode(parseInt(x[1], 16)));
    assert.ok(chars.length >= 10);
    for (const c of chars) assert.equal(cleanLabel(`a${c}b`), "ab", `U+${c.charCodeAt(0).toString(16)}`);
    for (const c of ["؜", "​", "­", "﻿", "‮", "⁦"]) assert.ok(chars.includes(c), `U+${c.charCodeAt(0).toString(16)} manca nell'SQL`);
  });

  test("le forme canoniche dei video passano il vincolo, le altre no", () => {
    const fn = sql.slice(sql.indexOf("function public.deck_video_url_ok"));
    assert.ok(fn.length < sql.length, "manca public.deck_video_url_ok");
    const m = fn.match(/u ~ '([^']+)'/);
    assert.ok(m, "espressione regolare dei video non trovata");
    const re = new RegExp(m[1]);
    for (const raw of [`https://youtu.be/${YT}?t=5`, `https://www.youtube.com/shorts/${YT}`, "https://www.twitch.tv/videos/2245678901", "https://m.twitch.tv/c/clip/Abc_d-1", "https://m.twitch.tv/clip/Abc_d-1"]) {
      const p = parseVideoUrl(raw);
      assert.ok(p && re.test(p.url), raw);
    }
    for (const bad of [`https://youtu.be/${YT}`, `https://www.youtube.com/watch?v=${YT}&t=5`, "https://www.twitch.tv/coachcrono", "http://clips.twitch.tv/Abc", "https://evil.example/phish"]) assert.ok(!re.test(bad), bad);
  });

  test("il titolo dei video ha lo stesso massimo nel vincolo", () => {
    assert.match(sql, new RegExp(`deck_text_ok\\(x ->> 'title', ${VIDEO_TITLE_MAX}\\)`));
  });
});
