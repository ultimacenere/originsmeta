/**
 * Test di video e risorse dei mazzi e delle guide (`videos.ts`) con il runner integrato di Node:
 * `node --test src/lib/videos.test.ts`. Come per tierstats.test.ts, l'import ha l'estensione `.ts`.
 * In fondo un controllo incrociato con l'SQL (supabase/creator-VIDEO.sql, poi accodato a schema.sql): la lista degli
 * host ammessi e le forme canoniche dei video devono essere le stesse nel sito e nei vincoli del database.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  LINK_HOSTS,
  MAX_DECK_LINKS,
  MAX_DECK_VIDEOS,
  START_MAX,
  allowedSiteNames,
  cleanLabel,
  deckLinks,
  deckVideos,
  embedSrc,
  formatStart,
  guideVideoLayout,
  guideVideoLd,
  isIsoDate,
  legacyVideoLink,
  parseLink,
  parseStartInput,
  parseTimeParam,
  parseVideoUrl,
  publicEmbedUrl,
  readDeckMedia,
  twitchParents,
  twitchTime,
  watchUrl,
  youtubeId,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in tiercode.test.ts.
  // @ts-expect-error TS5097
} from "./videos.ts";

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

  test("Twitch: VOD, clip nelle tre forme, lettore; il minuto del VOD dal parametro t", () => {
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
    assert.deepEqual(parseVideoUrl("https://clips.twitch.tv/embed?clip=FunnyClip-AbC_123&parent=example.com"), clip);
    assert.equal(parseVideoUrl("https://player.twitch.tv/?video=v2245678901&parent=x.com")?.url, "https://www.twitch.tv/videos/2245678901");
    assert.equal(parseVideoUrl("https://clips.twitch.tv/FunnyClip?t=30")?.start, undefined, "le clip non hanno un minuto");
  });

  test("non sono video: canali, altri siti, id sbagliati, credenziali, porte, schemi strani", () => {
    for (const raw of [
      "",
      "   ",
      "https://www.twitch.tv/coachcrono",
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
  test("colonna videos: solo quelli riconosciuti, senza doppioni, al massimo tre; il minuto salvato vince", () => {
    const v = deckVideos({
      videos: [
        { url: `https://www.youtube.com/watch?v=${YT}`, start: 750 },
        { url: `https://youtu.be/${YT}` },
        { url: "https://evil.example/video" },
        "https://www.twitch.tv/videos/1",
        { url: "https://www.twitch.tv/videos/1" },
        { url: "https://clips.twitch.tv/Abc", start: 30 },
        { url: "https://www.twitch.tv/videos/2" },
      ],
      video_url: "https://www.twitch.tv/videos/999",
    });
    assert.equal(v.length, MAX_DECK_VIDEOS);
    assert.deepEqual(
      v.map((x: { url: string; start?: number }) => [x.url, x.start]),
      [
        [`https://www.youtube.com/watch?v=${YT}`, 750],
        ["https://www.twitch.tv/videos/1", undefined],
        ["https://clips.twitch.tv/Abc", undefined],
      ],
    );
    assert.equal(deckVideos({ videos: [{ url: `https://youtu.be/${YT}`, start: 1.5 }] })[0].start, undefined, "un minuto non intero non vale");
  });

  test("vecchio video_url: primo video se la colonna è vuota o manca; altrimenti tasto come prima", () => {
    assert.deepEqual(deckVideos({ video_url: `https://youtu.be/${YT}?t=10` }).map((x: { start?: number }) => x.start), [10]);
    assert.deepEqual(deckVideos({ videos: [], video_url: `https://youtu.be/${YT}` }).length, 1);
    assert.deepEqual(deckVideos({ videos: null, video_url: null }), []);
    assert.equal(legacyVideoLink({ video_url: "https://vimeo.com/123" }), "https://vimeo.com/123");
    assert.equal(legacyVideoLink({ video_url: `https://youtu.be/${YT}` }), null, "riconosciuto: va nel lettore");
    assert.equal(legacyVideoLink({ video_url: "javascript:alert(1)" }), null);
    assert.equal(legacyVideoLink({ video_url: null }), null);
  });
});

describe("risorse", () => {
  test("host ammessi con i sottodomini; niente sosia, credenziali, porte, schemi strani", () => {
    assert.deepEqual(parseLink("https://www.youtube.com/playlist?list=PL1"), { ok: true, url: "https://www.youtube.com/playlist?list=PL1", host: "youtube.com" });
    assert.deepEqual(parseLink("old.reddit.com/r/OriginsTCG"), { ok: true, url: "https://old.reddit.com/r/OriginsTCG", host: "old.reddit.com" });
    assert.deepEqual(parseLink("http://x.com/origins_tcg"), { ok: true, url: "https://x.com/origins_tcg", host: "x.com" }, "http si riscrive in https");
    assert.equal(parseLink("https://store.steampowered.com/app/4429430/").ok, true);
    assert.equal(parseLink("https://discord.gg/abc").ok, true);
    assert.equal(parseLink("https://discord.com/invite/abc").ok, true);
    assert.deepEqual(parseLink("https://discord.com/oauth2/authorize?client_id=1"), { ok: false, reason: "host" }, "su discord.com solo inviti, canali ed eventi");
    assert.deepEqual(parseLink("https://bit.ly/abc"), { ok: false, reason: "host" });
    assert.deepEqual(parseLink("https://youtube.com.evil.example/x"), { ok: false, reason: "host" });
    assert.deepEqual(parseLink("https://notyoutube.com/x"), { ok: false, reason: "host" });
    assert.deepEqual(parseLink("https://user@youtube.com/x"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink("https://youtube.com:444/x"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink("javascript:alert(1)"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink("data:text/html,hi"), { ok: false, reason: "invalid" });
    assert.deepEqual(parseLink(`https://youtube.com/${"a".repeat(300)}`), { ok: false, reason: "invalid" }, "oltre 300 caratteri");
    assert.ok(allowedSiteNames().includes("Twitch"));
    assert.equal(new Set(allowedSiteNames()).size, allowedSiteNames().length);
  });

  test("etichette: testo semplice, niente caratteri di controllo né di direzione, 40 caratteri", () => {
    assert.equal(cleanLabel("  Deck tech\n completo  "), "Deck tech completo");
    assert.equal(cleanLabel("abc‮gpj.exe"), "abcgpj.exe");
    assert.equal(cleanLabel("\u0000x\u0007"), "x");
    assert.equal(Array.from(cleanLabel("é".repeat(60))).length, 40);
    assert.equal(cleanLabel("🎥".repeat(50)), "🎥".repeat(40), "si contano i caratteri, non le metà delle emoji");
    assert.equal(cleanLabel(undefined), "");
  });

  test("deckLinks rilegge le righe salvate con le stesse regole", () => {
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
  });
});

describe("modulo di pubblicazione", () => {
  const form = (o: Record<string, string>) => (k: string) => (k in o ? o[k] : null);

  test("video e link validi, righe vuote saltate, doppioni tolti, minuto dal campo o dall'indirizzo", () => {
    const r = readDeckMedia(
      form({
        video_url_0: `https://youtu.be/${YT}?t=90`,
        video_start_0: "",
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
      }),
    );
    assert.deepEqual(r, {
      ok: true,
      videos: [
        { url: `https://www.youtube.com/watch?v=${YT}`, start: 90 },
        { url: "https://www.twitch.tv/videos/77", start: 3600 },
      ],
      links: [
        { label: "VOD", url: "https://www.twitch.tv/videos/77" },
        { label: "discord.gg", url: "https://discord.gg/abc" },
      ],
    });
  });

  test("errori con la riga: video non riconosciuto, minuto sbagliato, link senza indirizzo o fuori elenco", () => {
    assert.deepEqual(readDeckMedia(form({ video_url_0: "", video_url_1: "https://vimeo.com/1" })), { ok: false, code: "video", index: 1 });
    assert.deepEqual(readDeckMedia(form({ video_url_0: `https://youtu.be/${YT}`, video_start_0: "12:99" })), { ok: false, code: "videoStart", index: 0 });
    assert.deepEqual(readDeckMedia(form({ link_label_2: "Solo testo" })), { ok: false, code: "link", index: 2 });
    assert.deepEqual(readDeckMedia(form({ link_url_0: "https://bit.ly/x" })), { ok: false, code: "linkHost", index: 0 });
    assert.deepEqual(readDeckMedia(form({ link_url_0: "not a url" })), { ok: false, code: "link", index: 0 });
  });

  test("il modulo di prima (campo `video` unico) vale come primo video; senza campi niente video né link", () => {
    assert.deepEqual(readDeckMedia(form({ video: `https://youtu.be/${YT}` })), { ok: true, videos: [{ url: `https://www.youtube.com/watch?v=${YT}` }], links: [] });
    assert.deepEqual(readDeckMedia(form({})), { ok: true, videos: [], links: [] });
    assert.deepEqual(readDeckMedia(form({ video_url_0: "", video: `https://youtu.be/${YT}` })), { ok: true, videos: [], links: [] }, "col modulo nuovo `video` non conta");
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
  // Dopo l'integrazione l'SQL sta in schema.sql; finché non c'è, nel file del pacchetto.
  const sql = ["../../supabase/creator-VIDEO.sql", "../../supabase/schema.sql"]
    .map((p) => new URL(p, import.meta.url))
    .filter((u) => existsSync(u))
    .map((u) => readFileSync(u, "utf8"))
    .join("\n");
  const hostFn = sql.slice(sql.indexOf("function public.deck_link_host_ok"));
  const videoFn = sql.slice(sql.indexOf("function public.deck_videos_ok"));

  test("gli host ammessi del vincolo sono quelli di LINK_HOSTS", () => {
    assert.ok(hostFn.length < sql.length, "manca public.deck_link_host_ok");
    const list = hostFn.slice(hostFn.indexOf("array["), hostFn.indexOf("]::text[]"));
    const hosts = [...list.matchAll(/'([a-z0-9.-]+)'/g)].map((m) => m[1]);
    assert.deepEqual([...hosts].sort(), [...LINK_HOSTS].sort());
  });

  test("le forme canoniche dei video passano il vincolo, le altre no", () => {
    assert.ok(videoFn.length < sql.length, "manca public.deck_videos_ok");
    const m = videoFn.match(/!~ '([^']+)' then true/);
    assert.ok(m, "espressione regolare dei video non trovata");
    const re = new RegExp(m[1]);
    for (const raw of [`https://youtu.be/${YT}?t=5`, `https://www.youtube.com/shorts/${YT}`, "https://www.twitch.tv/videos/2245678901", "https://m.twitch.tv/c/clip/Abc_d-1"]) {
      const p = parseVideoUrl(raw);
      assert.ok(p && re.test(p.url), raw);
    }
    for (const bad of [`https://youtu.be/${YT}`, `https://www.youtube.com/watch?v=${YT}&t=5`, "https://www.twitch.tv/coachcrono", "http://clips.twitch.tv/Abc"]) assert.ok(!re.test(bad), bad);
  });
});
