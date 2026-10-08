/**
 * Video dei creator in home (08/10/2026, richiesta di Pierluigi: "sotto le news vorrei creare uno slider di video di
 * youtube dei nostri influencer che si popola dei video ogni volta che lo pubblicano"). I video arrivano dal feed RSS
 * pubblico di ogni canale YouTube (youtube.com/feeds/videos.xml?channel_id=…, gli ultimi 15 video, niente chiave API) dei
 * profili con un ruolo vetrina (Creator, Autore, Pro, Staff) e un canale YouTube nel profilo. La lettura (con la cache
 * condivisa di mezz'ora) sta in src/lib/community/creatorVideoQueries.ts; qui le funzioni pure, con i test in
 * creatorVideos.test.ts. Nessun import a runtime: lo esegue anche Node nei test.
 *
 * Quali video: solo quelli su Origins TCG, perché i creator pubblicano anche altri giochi. Un video entra se il titolo
 * nomina Origins (o OriginsMeta, #originstcg) o il nome inglese di una carta del gioco, oppure se lo fa la descrizione
 * con "Origins TCG", "#originstcg" o "OriginsMeta" (la sola parola "Origins" nella descrizione non basta: i link fissi
 * delle descrizioni la ripetono sotto ogni video). Fuori gli Shorts (verticali, non stanno nel carosello 16:9) e i
 * video più vecchi di `MAX_AGE_DAYS`.
 */

/** Un video del carosello, già controllato. */
export type CreatorVideo = {
  /** id del video YouTube (11 caratteri) */
  id: string;
  title: string;
  /** data di pubblicazione ISO (dal feed) */
  published: string;
  /** nome utente del profilo su OriginsMeta (link a /u/<nome>) */
  username: string;
  /** nome mostrato del profilo, o il nome utente */
  name: string;
};

/** Una voce del feed di YouTube, letta da `parseYoutubeFeed`. */
export type FeedEntry = { id: string; title: string; published: string; description: string; short: boolean };

export const MAX_VIDEOS = 12;
export const MAX_PER_CREATOR = 6;
export const MAX_AGE_DAYS = 90;
const TITLE_MAX = 140;

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

/**
 * Dal canale YouTube del profilo (forma canonica di profileLinks.ts: /@nome, /channel/UC…, /c/…, /user/…) a quello che
 * serve per leggere il feed: l'id del canale se l'indirizzo lo contiene, altrimenti la pagina del canale da cui ricavarlo.
 */
export function youtubeChannelRef(url: string): { channelId: string } | { page: string } | null {
  const m = /^https:\/\/www\.youtube\.com\/(@[A-Za-z0-9._-]{3,30}|channel\/(UC[A-Za-z0-9_-]{22})|c\/[A-Za-z0-9._-]{1,100}|user\/[A-Za-z0-9._-]{1,100})$/.exec(url);
  if (!m) return null;
  if (m[2]) return { channelId: m[2] };
  return { page: url };
}

/** L'id del canale dalla pagina HTML del canale: link canonico, meta `identifier` o `externalId` dei dati della pagina. */
export function channelIdFromHtml(html: string): string | null {
  const found =
    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/.exec(html)?.[1] ??
    /<meta itemprop="identifier" content="(UC[A-Za-z0-9_-]{22})"/.exec(html)?.[1] ??
    /"externalId":"(UC[A-Za-z0-9_-]{22})"/.exec(html)?.[1];
  return found && CHANNEL_ID.test(found) ? found : null;
}

/** Indirizzo del feed RSS di un canale. */
export function feedUrl(channelId: string): string | null {
  return CHANNEL_ID.test(channelId) ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}` : null;
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => safeChar(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function safeChar(code: number): string {
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
}

function tag(block: string, name: string): string {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(block);
  return m ? decodeXml(m[1]).trim() : "";
}

/** Le voci del feed Atom di YouTube (senza librerie: il formato è fisso). Le voci senza id valido si scartano. */
export function parseYoutubeFeed(xml: string): FeedEntry[] {
  const out: FeedEntry[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const block = m[1];
    const id = tag(block, "yt:videoId");
    if (!YT_ID.test(id)) continue;
    const link = /<link rel="alternate" href="([^"]+)"/.exec(block)?.[1] ?? "";
    out.push({
      id,
      title: tag(block, "title"),
      published: tag(block, "published"),
      description: tag(block, "media:description"),
      short: /\/shorts\//.test(link),
    });
  }
  return out;
}

/** Titolo pulito per la pagina: niente caratteri di controllo né invisibili, spazi compattati, al massimo 140 caratteri. */
export function cleanTitle(raw: string): string {
  const s = raw
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠-⁩﻿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > TITLE_MAX ? `${s.slice(0, TITLE_MAX - 1).trimEnd()}…` : s;
}

const ORIGINS_TITLE = /\borigins\b|#originstcg\b|\boriginsmeta\b/i;
const ORIGINS_DESCRIPTION = /\borigins[\s_-]*tcg\b|#originstcg\b|\boriginsmeta\b/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Riconoscitore dei nomi di carta nei titoli, parola intera e senza maiuscole/minuscole. Solo i nomi di più parole
 * ("Van Helsing", "Robin Hood") e quelli di una parola da 8 lettere in su ("Cinderella"): i nomi corti sono parole
 * qualunque o carte di altri giochi che gli stessi creator portano (Death, Beast, Dracula in Marvel Snap).
 */
export function cardNameMatcher(names: readonly string[]): RegExp | null {
  const distinctive = (n: string) => /\s/.test(n) || n.replace(/[^A-Za-z]/g, "").length >= 8;
  const usable = [...new Set(names.map((n) => n.trim()).filter((n) => n && distinctive(n)))].sort((a, b) => b.length - a.length);
  if (!usable.length) return null;
  return new RegExp(`(?:^|[^A-Za-z0-9])(?:${usable.map(escapeRe).join("|")})(?![A-Za-z0-9])`, "i");
}

/** Il video parla di Origins TCG? (regola in testa al modulo) */
export function isOriginsVideo(e: Pick<FeedEntry, "title" | "description">, cards: RegExp | null): boolean {
  return ORIGINS_TITLE.test(e.title) || Boolean(cards?.test(e.title)) || ORIGINS_DESCRIPTION.test(e.description);
}

/**
 * Dai feed dei creator ai video del carosello: solo Origins TCG, niente Shorts né video vecchi o datati nel futuro,
 * niente doppioni, al massimo `MAX_PER_CREATOR` per creator (nessuno riempie da solo il carosello quando ce ne sono
 * altri) e `MAX_VIDEOS` in tutto, dal più recente.
 */
export function pickCreatorVideos(
  feeds: readonly { username: string; name: string; entries: readonly FeedEntry[] }[],
  opts: { now: number; cardNames?: readonly string[]; max?: number; perCreator?: number; maxAgeDays?: number },
): CreatorVideo[] {
  const cards = cardNameMatcher(opts.cardNames ?? []);
  const oldest = opts.now - (opts.maxAgeDays ?? MAX_AGE_DAYS) * 86_400_000;
  const newest = opts.now + 3_600_000;
  const seen = new Set<string>();
  const all: (CreatorVideo & { at: number })[] = [];
  for (const f of feeds) {
    let taken = 0;
    const entries = [...f.entries].sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
    for (const e of entries) {
      if (taken >= (opts.perCreator ?? MAX_PER_CREATOR)) break;
      const at = Date.parse(e.published);
      if (!YT_ID.test(e.id) || e.short || seen.has(e.id) || !Number.isFinite(at) || at < oldest || at > newest) continue;
      if (!isOriginsVideo(e, cards)) continue;
      const title = cleanTitle(e.title);
      if (!title) continue;
      seen.add(e.id);
      taken++;
      all.push({ id: e.id, title, published: new Date(at).toISOString(), username: f.username, name: f.name, at });
    }
  }
  return all
    .sort((a, b) => b.at - a.at)
    .slice(0, opts.max ?? MAX_VIDEOS)
    .map((v) => ({ id: v.id, title: v.title, published: v.published, username: v.username, name: v.name }));
}
