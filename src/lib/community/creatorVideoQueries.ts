import { unstable_cache } from "next/cache";
import { cards } from "@/lib/data/cards";
import { supabaseEnabled } from "@/lib/supabase/env";
import { channelIdFromHtml, feedUrl, parseYoutubeFeed, pickCreatorVideos, youtubeChannelRef, type CreatorVideo, type FeedEntry } from "@/lib/creatorVideos";
import { listCreators } from "./creators";

/**
 * Lettura dei video dei creator per il carosello della home (08/10/2026; regole e funzioni pure in
 * src/lib/creatorVideos.ts). Profili vetrina con un canale YouTube → id del canale (dall'indirizzo, o dalla pagina del
 * canale per gli indirizzi /@nome: una settimana di cache, l'id non cambia) → feed RSS → video su Origins TCG.
 *
 * Cache condivisa di Next (`unstable_cache`, come sitemapData.ts: le Cache Components sono spente): mezz'ora. Così la
 * home, che si rigenera ogni 5 minuti, chiede i feed a YouTube al massimo due volte l'ora, qualunque sia il traffico, e
 * un video nuovo compare entro mezz'ora più i 5 minuti della pagina. I video sono un contorno: un canale che non
 * risponde si salta, e qualunque errore vale "nessun video" (la sezione non si mostra), mai una home che non si
 * rigenera.
 */

const REVALIDATE = 1800;
const CHANNEL_ID_REVALIDATE = 7 * 86_400;
const TIMEOUT_MS = 8000;
/** "Rifiuta tutto" del banner dei cookie di Google: senza, da un server europeo la pagina del canale è quella del consenso */
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; OriginsMetaBot/1.0; +https://originsmeta.com)", "Accept-Language": "en", Cookie: "SOCS=CAI" };

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

const cachedChannelId = unstable_cache(
  async (page: string): Promise<string | null> => {
    const html = await getText(page);
    // null non si salva come risposta buona: si lancia, così unstable_cache non la tiene per una settimana
    const id = html ? channelIdFromHtml(html) : null;
    if (!id) throw new Error(`[creator-videos] id del canale non trovato: ${page}`);
    return id;
  },
  ["creator-videos-channel-id-v1"],
  { revalidate: CHANNEL_ID_REVALIDATE },
);

async function channelIdOf(url: string): Promise<string | null> {
  const ref = youtubeChannelRef(url);
  if (!ref) return null;
  if ("channelId" in ref) return ref.channelId;
  try {
    return await cachedChannelId(ref.page);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return null;
  }
}

async function feedOf(url: string): Promise<FeedEntry[]> {
  const id = await channelIdOf(url);
  const feed = id ? feedUrl(id) : null;
  const xml = feed ? await getText(feed) : null;
  return xml ? parseYoutubeFeed(xml) : [];
}

async function fetchCreatorVideos(): Promise<CreatorVideo[]> {
  const creators = await listCreators();
  const withYoutube = creators.flatMap((c) => {
    const yt = c.links.find((l) => l.kind === "youtube");
    return yt ? [{ username: c.username, name: (c.display_name || c.username).trim(), url: yt.url }] : [];
  });
  if (!withYoutube.length) return [];
  const feeds = await Promise.all(withYoutube.map(async (c) => ({ username: c.username, name: c.name, entries: await feedOf(c.url) })));
  // nessun feed letto è un guasto (rete, YouTube), non "nessun video": si lancia, così la mezz'ora di cache non lo tiene
  if (feeds.every((f) => !f.entries.length)) throw new Error("nessun feed di YouTube letto");
  return pickCreatorVideos(feeds, { now: Date.now(), cardNames: cards.map((c) => c.name) });
}

const cachedCreatorVideos = unstable_cache(fetchCreatorVideos, ["creator-videos-v1"], { revalidate: REVALIDATE, tags: ["creator-videos"] });

/** I video del carosello della home, dal più recente. Vuoto con la community spenta o se qualcosa non va. */
export async function loadCreatorVideos(): Promise<CreatorVideo[]> {
  if (!supabaseEnabled) return [];
  try {
    return await cachedCreatorVideos();
  } catch (e) {
    console.error("[creator-videos]", e instanceof Error ? e.message : e);
    return [];
  }
}
