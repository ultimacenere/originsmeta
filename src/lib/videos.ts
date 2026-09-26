/**
 * Video e risorse nei mazzi della community e nelle guide editoriali (pacchetto VIDEO, richiesta di Pierluigi del
 * 26/09/2026: funzioni per i creator, a partire da coachcrono). Funzioni pure e senza import: le esegue anche
 * `node --test` (test in videos.test.ts).
 *
 * - Video: YouTube (watch, youtu.be, Shorts, dirette, embed) e Twitch (VOD twitch.tv/videos/<id>, clip
 *   clips.twitch.tv/<slug> o twitch.tv/<canale>/clip/<slug>), fino a tre per mazzo, con il minuto di partenza e il
 *   titolo facoltativi. Nel database (`community_decks.videos`, supabase/creator-VIDEO.sql) si salva l'indirizzo
 *   CANONICO (`parseVideoUrl(...).url`) più `start` in secondi e `title`: il vincolo del database accetta solo quelle
 *   forme, e la pagina rilegge comunque tutto con `deckVideos`, che scarta quello che non riconosce.
 * - La vecchia colonna `video_url` (un solo link, anche non YouTube) resta: `deckVideos` la legge come primo video se
 *   `videos` è vuota, e il sito continua a scriverci il primo video, così una versione vecchia del sito vede ancora
 *   qualcosa. Un vecchio link che non è un video diventa una risorsa, ma solo su un host ammesso (`legacyResource`).
 *   Nessuna migrazione dei dati: il 26/09/2026 nessun mazzo pubblicato aveva un video.
 * - Risorse: fino a cinque link {label, url} per mazzo, solo https e solo dagli host di `LINK_HOSTS`, esclusi i
 *   reindirizzamenti noti di quelle piattaforme; mai dentro il testo della guida, che il sito traduce in automatico.
 */

export type VideoProvider = "youtube" | "twitch";
/** video = video YouTube (anche le dirette registrate), short = YouTube Shorts (verticale), vod e clip = Twitch */
export type VideoKind = "video" | "short" | "vod" | "clip";

export type ParsedVideo = {
  provider: VideoProvider;
  kind: VideoKind;
  /** id del video YouTube (11 caratteri), numero del VOD di Twitch o slug della clip */
  id: string;
  /** indirizzo canonico, quello che si salva (senza il minuto di partenza) */
  url: string;
  /** secondi dall'inizio (mai per le clip di Twitch, che non lo prevedono) */
  start?: number;
  /** titolo scritto da chi ha pubblicato il video (mazzi) o dalla redazione (guide), già ripulito */
  title?: string;
};

/** Una voce della colonna `community_decks.videos`. */
export type StoredVideo = { url: string; start?: number; title?: string };
/** Una voce della colonna `community_decks.links`. */
export type DeckLink = { label: string; url: string };
/** Un link pronto da mostrare: etichetta ripulita e dominio visibile accanto (niente sorprese su dove porta). */
export type ShownLink = DeckLink & { host: string };

export const MAX_DECK_VIDEOS = 3;
export const MAX_DECK_LINKS = 5;
/** lunghezza massima di un indirizzo salvato (video canonico o link), in caratteri: la stessa del vincolo SQL */
export const URL_MAX = 300;
/** etichetta di un link, in caratteri (punti di codice, come `char_length` di Postgres) */
export const LINK_LABEL_MAX = 40;
/** titolo di un video: il massimo di YouTube (100 caratteri), lo stesso nel vincolo SQL */
export const VIDEO_TITLE_MAX = 100;
/** minuto di partenza massimo: 48 ore (i VOD di Twitch più lunghi) */
export const START_MAX = 48 * 3600;
/** un indirizzo incollato può avere parametri di tracciamento lunghi: si accetta fino a qui, poi si canonicalizza */
const INPUT_MAX = 2048;
/** Twitch non riproduce un embed più piccolo di 400×300 (documentazione dell'embed): sotto, il video si apre su Twitch */
export const TWITCH_MIN_WIDTH = 400;
export const TWITCH_MIN_HEIGHT = 300;
/** i domini del sito, sempre fra i `parent` dell'embed di Twitch (più quello della pagina: anteprime e localhost) */
export const SITE_HOSTS = ["originsmeta.com", "www.originsmeta.com"] as const;

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const TWITCH_VOD = /^\d{1,15}$/;
const TWITCH_SLUG = /^[A-Za-z0-9_-]{1,100}$/;
const TWITCH_CHANNEL = /^[A-Za-z0-9_]{1,25}$/;

/**
 * Caratteri tolti dai testi degli utenti (etichette dei link, titoli dei video): controllo C0/C1, trattino morbido,
 * segni di direzione del testo (ALM U+061C, LRM, RLM, LRE…RLO, LRI…PDI: con quelli un nome si legge al contrario) e
 * invisibili (spazio a larghezza zero, BOM). Scritti con gli escape, mai come caratteri letterali invisibili. Il
 * vincolo SQL rifiuta gli stessi (`deck_text_ok` in supabase/creator-VIDEO.sql).
 */
const HIDDEN_CHARS = /[\u0000-\u001f\u007f-\u009f­؜​‎‏‪-‮⁦-⁩﻿]/g;

/** Sostituisce i segnaposto {chiave} di un testo; i valori non passano da `replace` (niente `$&` interpretati). */
export function fillVideoLabel(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/**
 * Indirizzo scritto a mano → URL, oppure null. Senza schema si assume https ("youtu.be/abc"); http passa (lo si
 * riscrive poi in https), ogni altro schema no. Niente credenziali né porte nell'indirizzo: un link "normale" non le ha,
 * uno che le ha serve quasi sempre a ingannare ("https://youtube.com@sito-truffa.example").
 */
function toUrl(raw: string): URL | null {
  const v = raw.trim();
  if (!v || v.length > INPUT_MAX || /\s/.test(v)) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password || u.port) return null;
    return u;
  } catch {
    return null;
  }
}

/** Minuto di partenza entro i limiti; 0 o fuori scala = nessun minuto. */
function inRange(s: number): number | undefined {
  return Number.isInteger(s) && s > 0 && s <= START_MAX ? s : undefined;
}

/**
 * Parametro `t` (o `start`) di un indirizzo: "90", "90s", "1m30s", "1h2m3s", "01h02m03s". Altro = nessun minuto.
 */
export function parseTimeParam(raw: string | null | undefined): number | undefined {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return undefined;
  if (/^\d{1,6}s?$/.test(s)) return inRange(parseInt(s, 10));
  const m = s.match(/^(?:(\d{1,2})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s)?$/);
  if (!m || !(m[1] || m[2] || m[3])) return undefined;
  return inRange(Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0));
}

/**
 * Minuto di partenza scritto nel modulo. Vuoto = nessuno. "12" = minuto 12 (il campo si chiama "minuto di partenza"),
 * "12:30" = 12 minuti e 30 secondi, "1:02:03" = un'ora, 2 minuti e 3 secondi; valgono anche "12m30s", "1h2m", "45s".
 */
export function parseStartInput(raw: string | null | undefined): { ok: true; value?: number } | { ok: false } {
  const s = (raw ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return { ok: true };
  let total: number | undefined;
  let m: RegExpMatchArray | null;
  if (/^\d{1,4}$/.test(s)) total = parseInt(s, 10) * 60;
  else if ((m = s.match(/^(\d{1,4}):([0-5]?\d)$/))) total = Number(m[1]) * 60 + Number(m[2]);
  else if ((m = s.match(/^(\d{1,2}):([0-5]\d):([0-5]\d)$/))) total = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  else if (/[hms]/.test(s)) {
    m = s.match(/^(?:(\d{1,2})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s)?$/);
    if (m && (m[1] || m[2] || m[3])) total = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  }
  if (total === undefined || total > START_MAX) return { ok: false };
  return total > 0 ? { ok: true, value: total } : { ok: true };
}

/** 750 → "12:30", 3723 → "1:02:03". */
export function formatStart(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** 3723 → "1h2m3s", il formato del parametro `time` del lettore di Twitch e di `t` nei suoi link. */
export function twitchTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m}m${seconds % 60}s`;
}

function youtube(id: string | null | undefined, kind: "video" | "short", start: number | undefined): ParsedVideo | null {
  if (!id || !YT_ID.test(id)) return null;
  const url = kind === "short" ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
  return { provider: "youtube", kind, id, url, ...(start ? { start } : {}) };
}

function twitchVod(id: string | null | undefined, start: number | undefined): ParsedVideo | null {
  if (!id || !TWITCH_VOD.test(id)) return null;
  return { provider: "twitch", kind: "vod", id, url: `https://www.twitch.tv/videos/${id}`, ...(start ? { start } : {}) };
}

function twitchClip(slug: string | null | undefined): ParsedVideo | null {
  if (!slug || !TWITCH_SLUG.test(slug) || slug.toLowerCase() === "embed") return null;
  return { provider: "twitch", kind: "clip", id: slug, url: `https://clips.twitch.tv/${slug}` };
}

/**
 * Riconosce un video YouTube o Twitch da un indirizzo incollato; null se non è uno di quelli ammessi. Il minuto di
 * partenza scritto nell'indirizzo (`t=`, `start=`, `#t=`) finisce in `start`.
 *   YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/live/ID, /embed/ID, /v/ID,
 *            anche m. e youtube-nocookie.com;
 *   Twitch:  twitch.tv/videos/<numero> (VOD), clips.twitch.tv/<slug>, twitch.tv/<canale>/clip/<slug>,
 *            m.twitch.tv/clip/<slug> (la condivisione dal telefono), clips.twitch.tv/embed?clip=<slug>,
 *            player.twitch.tv/?video=v<numero>.
 * Un canale Twitch (twitch.tv/<canale>) non è un video: va fra le risorse.
 */
export function parseVideoUrl(raw: string | null | undefined): ParsedVideo | null {
  const u = toUrl(raw ?? "");
  if (!u) return null;
  const host = u.hostname.toLowerCase().replace(/^(?:www|m)\./, "");
  const hashT = u.hash.match(/(?:^#|&)t=([^&]+)/)?.[1];
  const start = parseTimeParam(u.searchParams.get("t") ?? u.searchParams.get("start") ?? u.searchParams.get("time") ?? hashT);
  const parts = u.pathname.split("/").filter(Boolean);
  if (host === "youtu.be") return youtube(parts[0], "video", start);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch" && parts.length === 1) return youtube(u.searchParams.get("v"), "video", start);
    if (parts.length === 2 && parts[0] === "shorts") return youtube(parts[1], "short", start);
    if (parts.length === 2 && (parts[0] === "live" || parts[0] === "embed" || parts[0] === "v")) return youtube(parts[1], "video", start);
    return null;
  }
  if (host === "twitch.tv") {
    if (parts.length === 2 && parts[0] === "videos") return twitchVod(parts[1], start);
    if (parts.length === 2 && parts[0] === "clip") return twitchClip(parts[1]);
    if (parts.length === 3 && parts[1] === "clip" && TWITCH_CHANNEL.test(parts[0])) return twitchClip(parts[2]);
    return null;
  }
  if (host === "clips.twitch.tv") {
    if (parts.length === 1 && parts[0] === "embed") return twitchClip(u.searchParams.get("clip"));
    if (parts.length === 1) return twitchClip(parts[0]);
    return null;
  }
  if (host === "player.twitch.tv" && parts.length === 0) {
    const v = u.searchParams.get("video");
    return v ? twitchVod(v.replace(/^v/i, ""), start) : null;
  }
  return null;
}

/** ID di un video YouTube (watch, youtu.be, Shorts, dirette, embed), altrimenti null. */
export function youtubeId(url: string | null | undefined): string | null {
  const p = parseVideoUrl(url);
  return p?.provider === "youtube" ? p.id : null;
}

/**
 * Miniatura di un video YouTube (hqdefault, 480×360, c'è sempre), null per Twitch (le sue miniature chiedono l'API).
 * La pagina la mostra SOLO attraverso l'ottimizzatore di immagini del sito (next/image, `images.remotePatterns` in
 * next.config.ts): il browser chiede /_next/image a originsmeta.com e l'immagine la scarica il server, quindi prima
 * del clic nessuna richiesta del visitatore arriva a Google.
 */
export function youtubeThumb(v: Pick<ParsedVideo, "provider" | "id">): string | null {
  return v.provider === "youtube" && YT_ID.test(v.id) ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : null;
}

/** Il riquadro è abbastanza grande per l'embed di Twitch? (almeno 400×300, altrimenti il lettore non parte) */
export function twitchFits(width: number, height: number): boolean {
  return width >= TWITCH_MIN_WIDTH && height >= TWITCH_MIN_HEIGHT;
}

/** I `parent` dell'embed di Twitch: i domini del sito più quello della pagina (anteprime Vercel, localhost). */
export function twitchParents(hostname: string | null | undefined): string[] {
  const own = (hostname ?? "").toLowerCase();
  const list: string[] = [...SITE_HOSTS];
  if (/^[a-z0-9.-]{1,253}$/.test(own) && !list.includes(own)) list.push(own);
  return list;
}

/**
 * Indirizzo del lettore da mettere nell'iframe, solo DOPO il clic (`VideoEmbed`): YouTube nella modalità a privacy
 * avanzata (youtube-nocookie.com), Twitch con i `parent` obbligatori. `autoplay`: il clic sul nostro tasto vale come
 * gesto dell'utente, così non serve un secondo clic dentro il lettore.
 */
export function embedSrc(v: ParsedVideo, parents: readonly string[]): string {
  if (v.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1${v.start ? `&start=${v.start}` : ""}`;
  const parent = parents.map((p) => `parent=${encodeURIComponent(p)}`).join("&");
  if (v.kind === "clip") return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(v.id)}&${parent}&autoplay=true`;
  return `https://player.twitch.tv/?video=v${v.id}&${parent}&autoplay=true${v.start ? `&time=${twitchTime(v.start)}` : ""}`;
}

/** Il video sulla sua piattaforma, con il minuto di partenza: il link "Apri su YouTube/Twitch". */
export function watchUrl(v: ParsedVideo): string {
  if (v.provider === "youtube") return v.kind === "short" ? v.url : `${v.url}${v.start ? `&t=${v.start}s` : ""}`;
  if (v.kind === "clip") return v.url;
  return `${v.url}${v.start ? `?t=${twitchTime(v.start)}` : ""}`;
}

/** Indirizzo pubblico del lettore per i dati strutturati (`embedUrl` di VideoObject): quello standard, senza autoplay. */
export function publicEmbedUrl(v: ParsedVideo): string {
  if (v.provider === "youtube") return `https://www.youtube.com/embed/${v.id}`;
  if (v.kind === "clip") return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(v.id)}&parent=${SITE_HOSTS[0]}`;
  return `https://player.twitch.tv/?video=v${v.id}&parent=${SITE_HOSTS[0]}`;
}

/**
 * Testo semplice di un utente: niente caratteri di controllo né invisibili (`HIDDEN_CHARS`), spazi compattati, al
 * massimo `max` caratteri (punti di codice: un'emoji conta uno, come `char_length` di Postgres).
 */
export function cleanText(raw: string | null | undefined, max: number): string {
  const s = String(raw ?? "")
    .replace(HIDDEN_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(s).slice(0, max).join("").trim();
}

/** Etichetta di un link delle risorse: testo semplice, al massimo 40 caratteri. */
export function cleanLabel(raw: string | null | undefined): string {
  return cleanText(raw, LINK_LABEL_MAX);
}

/** Titolo di un video: testo semplice, al massimo 100 caratteri. */
export function cleanVideoTitle(raw: string | null | undefined): string {
  return cleanText(raw, VIDEO_TITLE_MAX);
}

/** Una voce salvata (o scritta a mano in guides.ts) → video riconosciuto; il minuto salvato vince su quello dell'indirizzo. */
function storedToParsed(item: unknown): ParsedVideo | null {
  if (!item || typeof item !== "object") return null;
  const { url, start, title } = item as Record<string, unknown>;
  if (typeof url !== "string") return null;
  const p = parseVideoUrl(url);
  if (!p) return null;
  const t = typeof title === "string" ? cleanVideoTitle(title) : "";
  const base: ParsedVideo = { provider: p.provider, kind: p.kind, id: p.id, url: p.url, ...(t ? { title: t } : {}) };
  if (p.kind === "clip") return base;
  const chosen = (typeof start === "number" ? inRange(start) : undefined) ?? p.start;
  return chosen ? { ...base, start: chosen } : base;
}

/**
 * I video di un mazzo da mostrare: la colonna `videos` (al massimo tre, senza doppioni, solo quelli riconosciuti) e,
 * se è vuota o manca (migrazione non ancora applicata), il vecchio `video_url` come primo video.
 */
export function deckVideos(d: { videos?: unknown; video_url?: string | null }): ParsedVideo[] {
  const out: ParsedVideo[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(d.videos) ? d.videos : []) {
    if (out.length >= MAX_DECK_VIDEOS) break;
    const p = storedToParsed(item);
    if (!p || seen.has(p.url)) continue;
    seen.add(p.url);
    out.push(p);
  }
  if (!out.length && d.video_url) {
    const p = parseVideoUrl(d.video_url);
    if (p) out.push(p);
  }
  return out;
}

/* ---------- risorse (link) ---------- */

/**
 * Host ammessi nei link delle risorse, con i sottodomini (www., m., old.reddit.com, store.steampowered.com…). Scelta
 * prudente del 26/09/2026: le piattaforme dei creator e della community, il gioco (sito ufficiale, Koin Games, Steam)
 * e OriginsMeta stesso. Fuori: accorciatori (bit.ly, redd.it…), siti personali, raccolte fondi (Patreon, Ko-fi) e
 * documenti condivisi (Google Docs), da decidere con Pierluigi. La stessa lista sta nel vincolo SQL
 * `deck_link_host_ok` (supabase/creator-VIDEO.sql): un test in videos.test.ts controlla che coincidano.
 */
export const LINK_HOSTS = [
  "youtube.com",
  "youtu.be",
  "twitch.tv",
  "x.com",
  "twitter.com",
  "reddit.com",
  "discord.gg",
  "discord.com",
  "origins-tcg.com",
  "koingames.io",
  "steampowered.com",
  "steamcommunity.com",
  "originsmeta.com",
  "tiktok.com",
  "instagram.com",
  "bsky.app",
  "kick.com",
] as const;

/**
 * Sottodomini delle piattaforme ammesse che servono solo a reindirizzare altrove (link esterni di Instagram e Reddit,
 * accorciatori di TikTok e Bluesky): la scheda mostrerebbe un dominio fidato e porterebbe su un sito qualsiasi.
 * Stessa lista nel vincolo SQL.
 */
export const LINK_BLOCKED_HOSTS = ["l.instagram.com", "out.reddit.com", "vm.tiktok.com", "vt.tiktok.com", "go.bsky.app"] as const;

/**
 * Percorsi di reindirizzamento delle piattaforme ammesse (youtube.com/redirect, /attribution_link,
 * steamcommunity.com/linkfilter, x.com/i/redirect, tiktok.com/link/…), sul percorso in minuscolo. Espressione
 * regolare scritta uguale nel vincolo SQL (sintassi comune a JavaScript e alle ARE di Postgres; un test le confronta).
 */
export const LINK_BLOCKED_PATH = "^/(?:redirect|attribution_link|linkfilter|i/redirect)(?:/|$)|^/link/";
const BLOCKED_PATH_RE = new RegExp(LINK_BLOCKED_PATH);

/** Nomi da mostrare nell'aiuto del modulo, nello stesso ordine (i domini senza un nome noto restano domini). */
export const LINK_HOST_NAMES: Record<(typeof LINK_HOSTS)[number], string> = {
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "twitch.tv": "Twitch",
  "x.com": "X",
  "twitter.com": "X",
  "reddit.com": "Reddit",
  "discord.gg": "Discord",
  "discord.com": "Discord",
  "origins-tcg.com": "origins-tcg.com",
  "koingames.io": "koingames.io",
  "steampowered.com": "Steam",
  "steamcommunity.com": "Steam",
  "originsmeta.com": "OriginsMeta",
  "tiktok.com": "TikTok",
  "instagram.com": "Instagram",
  "bsky.app": "Bluesky",
  "kick.com": "Kick",
};

/** I nomi senza doppioni, per l'aiuto del modulo ("YouTube, Twitch, X, …"). */
export function allowedSiteNames(): string[] {
  return Array.from(new Set(LINK_HOSTS.map((h) => LINK_HOST_NAMES[h])));
}

/** Il dominio ammesso a cui appartiene un host (con i sottodomini), oppure null. */
export function allowedHost(host: string): (typeof LINK_HOSTS)[number] | null {
  const h = host.toLowerCase();
  if ((LINK_BLOCKED_HOSTS as readonly string[]).includes(h)) return null;
  return LINK_HOSTS.find((d) => h === d || h.endsWith(`.${d}`)) ?? null;
}

/**
 * Percorso ammesso: mai un reindirizzamento (`LINK_BLOCKED_PATH`); sul dominio discord.com (sottodomini compresi) solo
 * inviti, canali ed eventi: il resto (autorizzazioni OAuth di app e bot, pagine del sito) non è una risorsa di un
 * mazzo e può servire a ingannare ("aggiungi questo bot").
 */
function pathAllowed(domain: string, pathname: string): boolean {
  const path = pathname.toLowerCase();
  if (BLOCKED_PATH_RE.test(path)) return false;
  if (domain === "discord.com") return /^\/(?:invite|channels|events)\//.test(path);
  return true;
}

export type ParsedLink = { ok: true; url: string; host: string } | { ok: false; reason: "invalid" | "host" };

/**
 * Un link delle risorse: https (un http si riscrive), host fatto solo di lettere, cifre, punti e trattini (come vuole
 * il vincolo SQL: niente trattino basso), host ammesso e percorso che non reindirizza, niente credenziali né porte, al
 * massimo 300 caratteri.
 */
export function parseLink(raw: string | null | undefined): ParsedLink {
  const u = toUrl(raw ?? "");
  if (!u) return { ok: false, reason: "invalid" };
  if (!/^[a-z0-9.-]+$/.test(u.hostname)) return { ok: false, reason: "invalid" };
  const domain = allowedHost(u.hostname);
  if (!domain || !pathAllowed(domain, u.pathname)) return { ok: false, reason: "host" };
  u.protocol = "https:";
  const url = u.toString();
  if (url.length > URL_MAX) return { ok: false, reason: "invalid" };
  return { ok: true, url, host: u.hostname.replace(/^www\./, "") };
}

/** I link di un mazzo da mostrare, riletti con le stesse regole del modulo (una riga scritta via API non passa). */
export function deckLinks(d: { links?: unknown }): ShownLink[] {
  const out: ShownLink[] = [];
  const seen = new Set<string>();
  for (const item of Array.isArray(d.links) ? d.links : []) {
    if (out.length >= MAX_DECK_LINKS) break;
    if (!item || typeof item !== "object") continue;
    const { label, url } = item as Record<string, unknown>;
    if (typeof url !== "string") continue;
    const p = parseLink(url);
    if (!p.ok || seen.has(p.url)) continue;
    seen.add(p.url);
    out.push({ label: cleanLabel(typeof label === "string" ? label : "") || cleanLabel(p.host), url: p.url, host: p.host });
  }
  return out;
}

/**
 * Il vecchio `video_url` che non è un video riconosciuto (fino al 26/09/2026 il modulo accettava qualsiasi link): diventa
 * una risorsa con l'etichetta data ("Guarda il video"), ma solo se è su un host ammesso; un link verso un sito qualsiasi
 * non si mostra più. Null anche se il mazzo ha almeno un video riconosciuto.
 */
export function legacyResource(d: { videos?: unknown; video_url?: string | null }, label: string): ShownLink | null {
  if (!d.video_url || deckVideos(d).length) return null;
  const p = parseLink(d.video_url);
  return p.ok ? { label: cleanLabel(label) || cleanLabel(p.host), url: p.url, host: p.host } : null;
}

/** Le risorse della scheda di un mazzo: il vecchio link (`legacyResource`), se c'è, poi i link salvati; al massimo cinque. */
export function deckResources(d: { videos?: unknown; video_url?: string | null; links?: unknown }, legacyLabel: string): ShownLink[] {
  const links = deckLinks(d);
  const legacy = legacyResource(d, legacyLabel);
  return legacy && !links.some((l) => l.url === legacy.url) ? [legacy, ...links].slice(0, MAX_DECK_LINKS) : links;
}

/* ---------- modulo di pubblicazione ---------- */

/** Nomi dei campi del modulo: tre righe di video (indirizzo, minuto e titolo) e cinque di link (etichetta e indirizzo). */
export const MEDIA_FIELD_NAMES = [
  "video_url_0",
  "video_start_0",
  "video_title_0",
  "video_url_1",
  "video_start_1",
  "video_title_1",
  "video_url_2",
  "video_start_2",
  "video_title_2",
  "link_label_0",
  "link_url_0",
  "link_label_1",
  "link_url_1",
  "link_label_2",
  "link_url_2",
  "link_label_3",
  "link_url_3",
  "link_label_4",
  "link_url_4",
] as const;
export type MediaFieldName = (typeof MEDIA_FIELD_NAMES)[number];

export const videoFields = (i: number) =>
  ({ url: `video_url_${i}`, start: `video_start_${i}`, title: `video_title_${i}` }) as { url: MediaFieldName; start: MediaFieldName; title: MediaFieldName };
export const linkFields = (i: number) => ({ label: `link_label_${i}`, url: `link_url_${i}` }) as { label: MediaFieldName; url: MediaFieldName };

/** Errori del modulo: video non riconosciuto (o titolo senza link), minuto non valido, link non valido, sito non ammesso. */
export type MediaError = "video" | "videoStart" | "link" | "linkHost";

export type DeckMedia = { videos: StoredVideo[]; links: DeckLink[] };

/** Il campo del modulo da correggere per un errore di `readDeckMedia` (la Server Action lo rimanda al modulo). */
export function mediaErrorField(code: MediaError, index: number): MediaFieldName {
  if (code === "videoStart") return videoFields(index).start;
  if (code === "video") return videoFields(index).url;
  return linkFields(index).url;
}

/** Numero della riga (da 1) di un campo del modulo ("link_url_2" → 3); 1 se il nome non ne ha. */
export function mediaFieldRow(field: string | undefined): number {
  const m = field?.match(/_(\d)$/);
  return m ? Number(m[1]) + 1 : 1;
}

/**
 * Legge video e link dal modulo (`get` = `formData.get`) e li controlla come fa il database. Righe vuote saltate,
 * doppioni tolti in silenzio, etichetta mancante = dominio del link. `index` dice quale riga non va (da 0).
 * Compatibilità: un modulo della versione di prima (campo `video` unico, rimasto aperto in una scheda durante il
 * rilascio) vale come primo video.
 */
export function readDeckMedia(get: (name: string) => unknown): ({ ok: true } & DeckMedia) | { ok: false; code: MediaError; index: number } {
  const str = (k: string) => {
    const v = get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  const videos: StoredVideo[] = [];
  for (let i = 0; i < MAX_DECK_VIDEOS; i++) {
    const f = videoFields(i);
    const raw = i === 0 && get(f.url) === null ? str("video") : str(f.url);
    const title = cleanVideoTitle(str(f.title));
    if (!raw && !title) continue;
    const p = parseVideoUrl(raw);
    if (!p) return { ok: false, code: "video", index: i };
    const typed = parseStartInput(str(f.start));
    if (!typed.ok) return { ok: false, code: "videoStart", index: i };
    if (videos.some((v) => v.url === p.url)) continue;
    const start = p.kind === "clip" ? undefined : (typed.value ?? p.start);
    videos.push({ url: p.url, ...(start ? { start } : {}), ...(title ? { title } : {}) });
  }
  const links: DeckLink[] = [];
  for (let i = 0; i < MAX_DECK_LINKS; i++) {
    const f = linkFields(i);
    const raw = str(f.url);
    const label = cleanLabel(str(f.label));
    if (!raw && !label) continue;
    if (!raw) return { ok: false, code: "link", index: i };
    const p = parseLink(raw);
    if (!p.ok) return { ok: false, code: p.reason === "host" ? "linkHost" : "link", index: i };
    if (links.some((l) => l.url === p.url)) continue;
    links.push({ label: label || cleanLabel(p.host), url: p.url });
  }
  return { ok: true, videos, links };
}

/**
 * Quello che si perderebbe salvando senza le colonne `videos` e `links` (migrazione non ancora applicata): la colonna
 * storica tiene un solo indirizzo, senza minuto né titolo. Se c'è altro, la Server Action risponde con un errore invece
 * di salvare a metà.
 */
export function mediaNeedsColumns(m: DeckMedia): boolean {
  return m.videos.length > 1 || m.links.length > 0 || m.videos.some((v) => v.start || v.title);
}

/* ---------- guide editoriali ---------- */

/**
 * Un video in una guida editoriale (campo `videos` di `Guide` in src/lib/content/guides.ts). Solo video ufficiali o
 * di creator citati, mai inventati. `at`: "top" (default) sotto la copertina, "end" in fondo al testo; `before`: la
 * ancora di un titolo del testo ({#ancora}) per lingua, il video va subito prima di quel titolo (le ancore cambiano
 * con la lingua; una lingua senza ancora, o con un'ancora che non c'è, lo mostra in cima).
 * I dati strutturati (VideoObject) escono solo con titolo, miniatura e data di caricamento veri (`guideVideoLd`).
 */
export type GuideVideo = {
  url: string;
  start?: number;
  /** titolo del video, quello della piattaforma */
  title?: string;
  /** descrizione breve; facoltativa anche per Google */
  description?: string;
  /** data di caricamento sulla piattaforma, ISO 8601 ("2026-09-21" o con ora e fuso) */
  uploadDate?: string;
  /** miniatura salvata nel sito (public/media/…): la usa l'anteprima prima del clic e VideoObject */
  thumbnail?: string;
  at?: "top" | "end";
  before?: Partial<Record<"en" | "it" | "es", string>>;
};

export type GuideVideoItem = { video: GuideVideo; parsed: ParsedVideo };
export type GuideSegment = { kind: "md"; source: string } | { kind: "videos"; items: GuideVideoItem[] };

/** La riga del titolo con quell'ancora ("## Titolo {#ancora}"), o -1. */
function anchorLine(lines: string[], anchor: string): number {
  if (!/^[a-z0-9-]+$/.test(anchor)) return -1;
  const tail = `{#${anchor}}`;
  return lines.findIndex((l) => /^#{2,3} /.test(l) && l.trimEnd().endsWith(tail));
}

/**
 * Dove vanno i video di una guida nella lingua della pagina: `top` e `end` li rende la pagina, `segments` è il testo
 * spezzato davanti ai titoli indicati da `before`, con i video in mezzo. Senza video: un solo pezzo, il testo intero.
 */
export function guideVideoLayout(body: string, videos: readonly GuideVideo[] | undefined, locale: string): { top: GuideVideoItem[]; end: GuideVideoItem[]; segments: GuideSegment[] } {
  const top: GuideVideoItem[] = [];
  const end: GuideVideoItem[] = [];
  const lines = body.split("\n");
  const inline = new Map<number, GuideVideoItem[]>();
  for (const video of videos ?? []) {
    const parsed = storedToParsed(video);
    if (!parsed) continue;
    const item = { video, parsed };
    const anchor = video.before?.[locale as "en" | "it" | "es"];
    const at = anchor ? anchorLine(lines, anchor) : -1;
    if (at >= 0) inline.set(at, [...(inline.get(at) ?? []), item]);
    else if (video.at === "end") end.push(item);
    else top.push(item);
  }
  const segments: GuideSegment[] = [];
  let from = 0;
  for (const at of [...inline.keys()].sort((a, b) => a - b)) {
    const chunk = lines.slice(from, at).join("\n");
    if (chunk.trim()) segments.push({ kind: "md", source: chunk });
    segments.push({ kind: "videos", items: inline.get(at) ?? [] });
    from = at;
  }
  const rest = lines.slice(from).join("\n");
  if (rest.trim() || !segments.length) segments.push({ kind: "md", source: from ? rest : body });
  return { top, end, segments };
}

/** Data ISO 8601 valida: giorno, oppure giorno e ora con il fuso. */
export function isIsoDate(s: string | undefined): boolean {
  if (!s || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(s)) return false;
  return !Number.isNaN(Date.parse(s.length === 10 ? `${s}T00:00:00Z` : s));
}

/**
 * VideoObject per il nodo Article di una guida, solo con i tre dati che Google chiede (name, thumbnailUrl, uploadDate:
 * Search Central, "Video structured data") scritti davvero nella guida: niente dati inventati né ricavati. Null
 * altrimenti. `siteUrl` rende assoluta la miniatura.
 */
export function guideVideoLd(v: GuideVideo, siteUrl: string): Record<string, unknown> | null {
  const parsed = storedToParsed(v);
  if (!parsed || !v.title?.trim() || !v.thumbnail?.startsWith("/") || !isIsoDate(v.uploadDate)) return null;
  return {
    "@type": "VideoObject",
    name: v.title.trim(),
    ...(v.description?.trim() ? { description: v.description.trim() } : {}),
    thumbnailUrl: `${siteUrl}${v.thumbnail}`,
    uploadDate: v.uploadDate,
    embedUrl: publicEmbedUrl(parsed),
  };
}

/** La proprietà `video` del nodo Article di una guida: i soli VideoObject completi, oppure niente (oggetto vuoto). */
export function guideVideosLd(videos: readonly GuideVideo[] | undefined, siteUrl: string): { video?: Record<string, unknown>[] } {
  const list = (videos ?? []).map((v) => guideVideoLd(v, siteUrl)).filter((x): x is Record<string, unknown> => x !== null);
  return list.length ? { video: list } : {};
}
