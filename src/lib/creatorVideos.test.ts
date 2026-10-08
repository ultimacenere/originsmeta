import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { channelIdFromHtml, cardNameMatcher, cleanTitle, feedUrl, isOriginsVideo, parseYoutubeFeed, pickCreatorVideos, youtubeChannelRef, type FeedEntry } from "./creatorVideos.ts";

const CH = "UCz21S4q1c04xT-n8qbYSTTA";
const NOW = Date.parse("2026-10-08T12:00:00Z");

function entry(id: string, title: string, published: string, extra: Partial<FeedEntry> = {}): FeedEntry {
  return { id, title, published, description: "", short: false, ...extra };
}

test("canale del profilo: id diretto o pagina da leggere", () => {
  assert.deepEqual(youtubeChannelRef(`https://www.youtube.com/channel/${CH}`), { channelId: CH });
  assert.deepEqual(youtubeChannelRef("https://www.youtube.com/@CoachCrono"), { page: "https://www.youtube.com/@CoachCrono" });
  assert.equal(youtubeChannelRef("https://www.youtube.com/watch?v=ms1JfH4rVa4"), null);
  assert.equal(youtubeChannelRef("https://evil.example/@CoachCrono"), null);
});

test("id del canale dalla pagina HTML", () => {
  assert.equal(channelIdFromHtml(`<link rel="canonical" href="https://www.youtube.com/channel/${CH}">`), CH);
  assert.equal(channelIdFromHtml(`<meta itemprop="identifier" content="${CH}">`), CH);
  assert.equal(channelIdFromHtml(`{"externalId":"${CH}"}`), CH);
  assert.equal(channelIdFromHtml("<html>consent</html>"), null);
  assert.equal(feedUrl(CH), `https://www.youtube.com/feeds/videos.xml?channel_id=${CH}`);
  assert.equal(feedUrl("x&y"), null);
});

test("feed Atom: voci, entità, Shorts", () => {
  const xml = `<feed><title>CoachCrono</title>
 <entry><yt:videoId>ms1JfH4rVa4</yt:videoId><title>CHE MAZZO &amp; IL VAN HELSING! &#128293;</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=ms1JfH4rVa4"/><published>2026-10-08T10:00:41+00:00</published>
  <media:group><media:description>Origins TCG &lt;3</media:description></media:group></entry>
 <entry><yt:videoId>abcdefghijk</yt:videoId><title>Short</title><link rel="alternate" href="https://www.youtube.com/shorts/abcdefghijk"/><published>2026-10-07T10:00:00+00:00</published></entry>
 <entry><yt:videoId>bad</yt:videoId><title>x</title></entry></feed>`;
  const e = parseYoutubeFeed(xml);
  assert.equal(e.length, 2);
  assert.equal(e[0].title, "CHE MAZZO & IL VAN HELSING! 🔥");
  assert.equal(e[0].description, "Origins TCG <3");
  assert.equal(e[0].short, false);
  assert.equal(e[1].short, true);
});

test("solo video su Origins TCG", () => {
  const cards = cardNameMatcher(["Van Helsing", "Robin Hood", "Death", "Beast", "Dracula", "Cinderella", "Roo"]);
  const yes = (title: string, description = "") => isOriginsVideo({ title, description }, cards);
  assert.ok(yes("IL CONTROL PER ECCELLENZA DI ORIGINS TCG!"));
  assert.ok(yes("NUOVE VERSIONE POST PATCH SU ORIGINS SENZA IL BOOK"));
  assert.ok(yes("CHE MAZZO IL VAN HELSING!"));
  assert.ok(yes("ROBIN HOOD FINALMENTE!"));
  assert.ok(yes("cinderella combo"));
  assert.ok(yes("Nuovo mazzo", "Il mio mazzo per Origins TCG"));
  assert.ok(!yes("Nuovo mazzo", "Live su twitch, origins dopo le 13"));
  assert.ok(!yes("DEATH è ROTTA su Marvel Snap"));
  assert.ok(!yes("Beast deck | Marvel Snap ITA"));
  assert.ok(!yes("THE BAZAAR NUOVA SEASON"));
  assert.ok(!yes("Kangaroo run"));
});

test("titoli puliti", () => {
  assert.equal(cleanTitle("  a​ b\n c "), "a b c");
  assert.equal(cleanTitle("x".repeat(200)).length, 140);
});

test("scelta dei video: più recenti, tetti, niente Shorts né vecchi né doppioni", () => {
  const feeds = [
    {
      username: "coachcrono",
      name: "CoachCrono",
      entries: [
        entry("aaaaaaaaaa1", "Origins 1", "2026-10-08T10:00:00Z"),
        entry("aaaaaaaaaa2", "Origins 2", "2026-10-07T10:00:00Z"),
        entry("aaaaaaaaaa3", "Origins 3", "2026-10-06T10:00:00Z"),
        entry("aaaaaaaaaa4", "Origins short", "2026-10-05T10:00:00Z", { short: true }),
        entry("aaaaaaaaaa5", "The Bazaar", "2026-10-05T10:00:00Z"),
        entry("aaaaaaaaaa6", "Origins vecchio", "2026-05-01T10:00:00Z"),
        entry("aaaaaaaaaa7", "Origins dal futuro", "2026-12-01T10:00:00Z"),
      ],
    },
    {
      username: "vegakiles",
      name: "Vega",
      entries: [entry("bbbbbbbbbb1", "OriginsMeta tier list", "2026-10-07T12:00:00Z"), entry("aaaaaaaaaa1", "Origins 1 (doppione)", "2026-10-08T10:00:00Z")],
    },
  ];
  const all = pickCreatorVideos(feeds, { now: NOW });
  assert.deepEqual(
    all.map((v) => v.id),
    ["aaaaaaaaaa1", "bbbbbbbbbb1", "aaaaaaaaaa2", "aaaaaaaaaa3"],
  );
  assert.equal(all[1].username, "vegakiles");
  assert.equal(all[0].published, "2026-10-08T10:00:00.000Z");
  assert.deepEqual(
    pickCreatorVideos(feeds, { now: NOW, perCreator: 1 }).map((v) => v.id),
    ["aaaaaaaaaa1", "bbbbbbbbbb1"],
  );
  assert.equal(pickCreatorVideos(feeds, { now: NOW, max: 2 }).length, 2);
});
