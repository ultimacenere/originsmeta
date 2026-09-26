/**
 * Profilo pubblico di un iscritto: bio, canali e lingue dei contenuti (pacchetto CREATOR, 26/09/2026, richiesta di
 * Pierluigi: "funzioni per i creator"). Chiunque abbia un account li scrive in /account; la pagina /u/<nome> li mostra
 * a tutti, e per chi ha un tag autore (Autore, Influencer, Pro, Staff) diventano anche la scheda della directory
 * /creators, le icone accanto al nome nei mazzi e i `sameAs` della Person nei dati strutturati.
 *
 * Qui stanno le regole, in funzioni pure (nessun import: `node --test src/lib/community/profileLinks.test.ts`):
 * - ogni canale ha un tipo (twitch, youtube, x, tiktok, instagram, kick, bluesky, discord, website) e un indirizzo
 *   https riscritto nella forma canonica di quella piattaforma (`normalizeLink`); il sito salva solo la forma
 *   canonica, così le stesse regole si possono ripetere nel database (supabase/creator-CREATOR.sql,
 *   `profile_link_ok`) e un indirizzo scritto a mano via API che non le rispetta viene rifiutato anche lì;
 * - `website` accetta qualsiasi host, ma solo https, niente credenziali, porte, indirizzi IP, accorciatori di link,
 *   redirector (l.facebook.com, google.<tld>/url…) né host delle piattaforme che hanno un tipo loro (twitch.tv,
 *   discord.com…, sottodomini compresi): con il dominio di una piattaforma nota come etichetta, un link di
 *   reindirizzamento o di autorizzazione di un bot sembrerebbe fidato (`websiteBlock`);
 * - la bio è testo semplice (niente Markdown né HTML: React la scrive come testo), al massimo `BIO_MAX` caratteri
 *   contati come `char_length` di Postgres (punti di codice, non unità UTF-16);
 * - al massimo `MAX_LINKS` canali, senza doppioni, nell'ordine scelto dall'utente: i primi sono i "canali principali"
 *   che compaiono accanto al nome (`mainChannels`).
 */

export const LINK_KINDS = ["twitch", "youtube", "x", "tiktok", "instagram", "kick", "bluesky", "discord", "website"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];
export type ProfileLink = { kind: LinkKind; url: string };

/** Quanti canali per profilo (lo ripete il vincolo `profiles_links_check` del database). */
export const MAX_LINKS = 8;
/** Lunghezza massima della bio, in caratteri (punti di codice, come `char_length` di Postgres). */
export const BIO_MAX = 280;
/** Lunghezza massima di un indirizzo salvato. */
export const LINK_URL_MAX = 200;
/** Quante icone accanto al nome dell'autore (scheda del mazzo, elenco /decks). */
export const MAIN_CHANNELS = 3;

/** Lingue in cui un iscritto dichiara di fare contenuti: le lingue del sito (il test lo confronta con `locales`). */
export const CONTENT_LANGS = ["en", "it", "es"] as const;
export type ContentLang = (typeof CONTENT_LANGS)[number];

/** Tag autore che fanno di un profilo un "creator": vetrina su /u, directory /creators, stato in diretta. */
export const CREATOR_BADGES = ["creator", "influencer", "pro", "staff"] as const;
export function isCreatorBadge(badge: string | null | undefined): boolean {
  return (CREATOR_BADGES as readonly string[]).includes(badge ?? "");
}

/**
 * Nome della piattaforma, uguale in tutte le lingue (sono marchi: si scrivono come testo, senza loghi). `website` non ha
 * un nome proprio: l'etichetta ("Sito web") sta nel file delle etichette e accanto si mostra sempre il dominio.
 */
export const LINK_KIND_NAMES: Readonly<Record<Exclude<LinkKind, "website">, string>> = {
  twitch: "Twitch",
  youtube: "YouTube",
  x: "X",
  tiktok: "TikTok",
  instagram: "Instagram",
  kick: "Kick",
  bluesky: "Bluesky",
  discord: "Discord",
};

export function isLinkKind(value: unknown): value is LinkKind {
  return typeof value === "string" && (LINK_KINDS as readonly string[]).includes(value);
}

/**
 * Forma canonica di ogni piattaforma. Sono le stesse espressioni del database (supabase/creator-CREATOR.sql): se se ne
 * cambia una, va cambiata anche lì (il test controlla che ogni indirizzo prodotto da `normalizeLink` le rispetti).
 */
export const CANONICAL: Readonly<Record<LinkKind, RegExp>> = {
  twitch: /^https:\/\/www\.twitch\.tv\/[a-z0-9_]{3,25}$/,
  youtube: /^https:\/\/www\.youtube\.com\/(@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22}|c\/[A-Za-z0-9._-]{1,100}|user\/[A-Za-z0-9._-]{1,100})$/,
  x: /^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}$/,
  tiktok: /^https:\/\/www\.tiktok\.com\/@[a-z0-9_.]{2,24}$/,
  instagram: /^https:\/\/www\.instagram\.com\/[a-z0-9_.]{1,30}$/,
  kick: /^https:\/\/kick\.com\/[a-z0-9_-]{3,25}$/,
  bluesky: /^https:\/\/bsky\.app\/profile\/([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+|did:plc:[a-z0-9]{24})$/,
  discord: /^https:\/\/discord\.gg\/[A-Za-z0-9-]{2,32}$/,
  website: /^https:\/\/[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}(\/[^\s"<>\\^`{|}]*)?$/,
};

/**
 * Accorciatori di link: nascondono la destinazione, quindi niente (spam e phishing). Si confrontano per suffisso
 * (anche m.bit.ly, www.tinyurl.com…). Anche nel database (`profile_link_ok`, espressione `WEBSITE_BLOCKED_HOST`):
 * il test controlla che l'espressione del database sia quella costruita da questi elenchi.
 */
export const SHORTENER_HOSTS: readonly string[] = [
  "bit.ly",
  "bitly.com",
  "j.mp",
  "tinyurl.com",
  "tiny.one",
  "rotf.lol",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "v.gd",
  "buff.ly",
  "cutt.ly",
  "cutt.us",
  "rebrand.ly",
  "bl.ink",
  "shorturl.at",
  "shorturl.com",
  "tiny.cc",
  "rb.gy",
  "s.id",
  "lnkd.in",
  "t.ly",
  "adf.ly",
  "shorte.st",
  "ouo.io",
];

/**
 * Redirector noti: pagine che portano altrove con la destinazione nell'indirizzo (l.facebook.com/?u=…). Come gli
 * accorciatori, per suffisso. google.<tld>/url e /amp/ stanno in `GOOGLE_REDIRECT`.
 */
export const REDIRECTOR_HOSTS: readonly string[] = ["l.facebook.com", "lm.facebook.com", "l.messenger.com", "out.reddit.com", "href.li", "t.umblr.com", "away.vk.com"];

/**
 * Host delle piattaforme che hanno un tipo loro, con i sottodomini: come "sito web" non valgono (il modulo dice di
 * scegliere la piattaforma). Così un indirizzo come discord.com/oauth2/authorize… o youtube.com/redirect?q=… non passa
 * con l'etichetta di un dominio che ispira fiducia.
 */
export const PLATFORM_HOSTS: Readonly<Record<string, Exclude<LinkKind, "website">>> = {
  "twitch.tv": "twitch",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "x.com": "x",
  "twitter.com": "x",
  "tiktok.com": "tiktok",
  "instagram.com": "instagram",
  "kick.com": "kick",
  "bsky.app": "bluesky",
  "discord.com": "discord",
  "discord.gg": "discord",
  "discordapp.com": "discord",
};

/** Google usato come redirector: google.<tld>/url?q=… e le pagine /amp/. Uguale nel database. */
export const GOOGLE_REDIRECT = /^https:\/\/(www\.)?google(\.[a-z]{2,3}){1,2}\/(url|amp)([/?#]|$)/;

const escapeHost = (h: string) => h.replace(/\./g, "\\.");

/**
 * Un'espressione sola con tutti gli host che il sito web non accetta (piattaforme, accorciatori, redirector), per
 * suffisso: è quella del vincolo del database, identica carattere per carattere (lo controlla il test).
 */
export const WEBSITE_BLOCKED_HOST = new RegExp(`(^|\\.)(${[...Object.keys(PLATFORM_HOSTS), ...SHORTENER_HOSTS, ...REDIRECTOR_HOSTS].map(escapeHost).join("|")})$`);

/** `host` è `base` o un suo sottodominio? */
const onHost = (host: string, base: string) => host === base || host.endsWith(`.${base}`);

/**
 * Perché un indirizzo non vale come sito web: `platform` (host di una piattaforma con un tipo suo, `kind` dice quale),
 * `shortener`, `redirect`; null se va bene. Stessa regola del database (`WEBSITE_BLOCKED_HOST`, `GOOGLE_REDIRECT`).
 */
export function websiteBlock(url: string): { error: "platform"; kind: Exclude<LinkKind, "website"> } | { error: "shortener" | "redirect" } | null {
  const host = hostOf(url);
  const platform = Object.keys(PLATFORM_HOSTS).find((h) => onHost(host, h));
  if (platform) return { error: "platform", kind: PLATFORM_HOSTS[platform] };
  if (SHORTENER_HOSTS.some((h) => onHost(host, h))) return { error: "shortener" };
  if (REDIRECTOR_HOSTS.some((h) => onHost(host, h)) || GOOGLE_REDIRECT.test(url)) return { error: "redirect" };
  return null;
}

/** Primi segmenti di percorso che sulle piattaforme non sono un canale (pagine del sito, video, ricerca…). */
const RESERVED: Readonly<Partial<Record<LinkKind, readonly string[]>>> = {
  twitch: ["directory", "videos", "search", "settings", "downloads", "jobs", "p", "turbo", "subscriptions", "inventory", "wallet", "drops", "login", "signup"],
  x: ["home", "explore", "search", "i", "intent", "share", "settings", "messages", "notifications", "hashtag", "login", "signup", "tos", "privacy"],
  instagram: ["p", "reel", "reels", "explore", "stories", "accounts", "direct", "tv", "about", "developer"],
  kick: ["categories", "browse", "search", "following", "dashboard", "terms-of-service", "privacy-policy", "community-guidelines"],
};

/** Host accettati in ingresso per ogni piattaforma (con o senza www, mobile); l'uscita è sempre quella canonica. */
const HOSTS: Readonly<Partial<Record<LinkKind, readonly string[]>>> = {
  twitch: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com"],
  x: ["x.com", "www.x.com", "mobile.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"],
  tiktok: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  kick: ["kick.com", "www.kick.com"],
  bluesky: ["bsky.app", "www.bsky.app"],
  discord: ["discord.gg", "www.discord.gg", "discord.com", "www.discord.com", "discordapp.com", "www.discordapp.com"],
};

/**
 * Perché un indirizzo è stato rifiutato: `invalid` (non è un indirizzo di quella piattaforma), `http` (serve https),
 * `shortener` (accorciatore), `redirect` (redirector), `platform` (sito web su un host di una piattaforma che ha un
 * tipo suo: `platform` nella risposta dice quale), `long` (oltre `LINK_URL_MAX`).
 */
export type LinkError = "invalid" | "http" | "shortener" | "redirect" | "platform" | "long";

type Normalized = { ok: true; link: ProfileLink | null } | { ok: false; error: LinkError; platform?: Exclude<LinkKind, "website"> };

/**
 * Caratteri invisibili che non devono finire in un indirizzo o nella bio: larghezza zero e marcatori di direzione
 * (U+200B–U+200F), incorporamenti e sostituzioni di direzione (U+202A–U+202E), U+2060–U+2069, BOM (U+FEFF). Scritti
 * con gli escape, mai come caratteri letterali: un editor o una sostituzione li perderebbe senza che si veda.
 */
const INVISIBLE = "\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2069\\uFEFF";
const SQUEEZE = new RegExp(`[\\s${INVISIBLE}]+`, "g");

/** Toglie spazi, a capo e caratteri invisibili (larghezza zero, controlli di direzione) da un valore incollato. */
function squeeze(raw: string): string {
  return raw.replace(SQUEEZE, "");
}

/** Il primo segmento del percorso ("/coachcrono/videos" → "coachcrono"), già decodificato; "" se non c'è. */
function firstSegment(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  try {
    return decodeURIComponent(seg);
  } catch {
    return "";
  }
}

/** Il canale dal percorso di un indirizzo già riconosciuto come della piattaforma `kind`; null se non è un canale. */
function channelUrl(kind: Exclude<LinkKind, "website">, url: URL): string | null {
  const segs = url.pathname.split("/").filter(Boolean);
  const first = firstSegment(url.pathname);
  const reserved = RESERVED[kind] ?? [];
  if (reserved.includes(first.toLowerCase())) return null;
  switch (kind) {
    case "twitch":
      return `https://www.twitch.tv/${first.toLowerCase()}`;
    case "youtube": {
      if (first.startsWith("@")) return `https://www.youtube.com/${first}`;
      if ((first === "channel" || first === "c" || first === "user") && segs[1]) return `https://www.youtube.com/${first}/${segs[1]}`;
      return null;
    }
    case "x":
      return `https://x.com/${first}`;
    case "tiktok":
      return first.startsWith("@") ? `https://www.tiktok.com/${first.toLowerCase()}` : null;
    case "instagram":
      return `https://www.instagram.com/${first.toLowerCase()}`;
    case "kick":
      return `https://kick.com/${first.toLowerCase()}`;
    case "bluesky":
      return first === "profile" && segs[1] ? `https://bsky.app/profile/${segs[1].toLowerCase()}` : null;
    case "discord": {
      const host = url.hostname.replace(/^www\./, "");
      if (host === "discord.gg") return first ? `https://discord.gg/${first}` : null;
      return first === "invite" && segs[1] ? `https://discord.gg/${segs[1]}` : null;
    }
  }
}

/**
 * Nome scritto da solo, senza indirizzo ("coachcrono", "@coachcrono"): comodo per le piattaforme dove il canale è
 * un nome. Non per il sito web né per Discord (serve l'invito intero); per Bluesky vale il nome completo
 * ("nome.bsky.social"). Con una barra o i due punti si tratta come indirizzo; con un punto anche, tranne su YouTube,
 * TikTok e Instagram, dove i nomi con il punto sono comuni ("coach.crono"): lì è un indirizzo solo se è l'host della
 * piattaforma ("instagram.com").
 */
const DOTTED_HANDLES: readonly LinkKind[] = ["youtube", "tiktok", "instagram"];

function fromHandle(kind: LinkKind, value: string): string | null {
  const handle = value.replace(/^@/, "");
  if (kind === "bluesky") return /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(handle) && !value.includes("/") ? `https://bsky.app/profile/${handle.toLowerCase()}` : null;
  if (kind === "website" || kind === "discord" || !handle || /[/:]/.test(handle)) return null;
  if (handle.includes(".") && (!DOTTED_HANDLES.includes(kind) || (HOSTS[kind] ?? []).includes(handle.toLowerCase()))) return null;
  switch (kind) {
    case "twitch":
      return `https://www.twitch.tv/${handle.toLowerCase()}`;
    case "youtube":
      return `https://www.youtube.com/@${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle.toLowerCase()}`;
    case "instagram":
      return `https://www.instagram.com/${handle.toLowerCase()}`;
    case "kick":
      return `https://kick.com/${handle.toLowerCase()}`;
  }
}

/**
 * Sito web: https, host con un dominio vero (niente IP, porte, credenziali), niente accorciatori, redirector né host
 * delle piattaforme che hanno un tipo loro (`websiteBlock`).
 */
function websiteUrl(url: URL): Normalized {
  if (url.username || url.password || url.port) return { ok: false, error: "invalid" };
  const host = url.hostname.toLowerCase();
  if (/^[\d.]+$/.test(host) || host.startsWith("[")) return { ok: false, error: "invalid" };
  url.hash = "";
  const out = url.toString();
  const blocked = websiteBlock(out);
  if (blocked) return blocked.error === "platform" ? { ok: false, error: "platform", platform: blocked.kind } : { ok: false, error: blocked.error };
  if ([...out].length > LINK_URL_MAX) return { ok: false, error: "long" };
  return CANONICAL.website.test(out) ? { ok: true, link: { kind: "website", url: out } } : { ok: false, error: "invalid" };
}

/**
 * Un canale scritto nel modulo, nella forma canonica della piattaforma. Valore vuoto: nessun canale (`link: null`).
 * Si accettano l'indirizzo intero, l'indirizzo senza https:// e, per le piattaforme a nome, il solo nome.
 */
export function normalizeLink(kind: LinkKind, raw: string): Normalized {
  const value = squeeze(String(raw ?? ""));
  if (!value) return { ok: true, link: null };
  if (value.length > 400) return { ok: false, error: "long" };
  const handle = fromHandle(kind, value);
  if (handle) return CANONICAL[kind].test(handle) ? { ok: true, link: { kind, url: handle } } : { ok: false, error: "invalid" };
  if (/^http:\/\//i.test(value)) return { ok: false, error: "http" };
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https:\/\//i.test(value)) return { ok: false, error: "invalid" };
  let url: URL;
  try {
    url = new URL(/^https:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { ok: false, error: "invalid" };
  }
  if (url.protocol !== "https:") return { ok: false, error: "invalid" };
  if (kind === "website") return websiteUrl(url);
  const host = url.hostname.toLowerCase();
  if (SHORTENER_HOSTS.some((h) => onHost(host, h))) return { ok: false, error: "shortener" };
  if (url.username || url.password || url.port || !(HOSTS[kind] ?? []).includes(host)) return { ok: false, error: "invalid" };
  const out = channelUrl(kind, url);
  if (!out) return { ok: false, error: "invalid" };
  if (out.length > LINK_URL_MAX) return { ok: false, error: "long" };
  return CANONICAL[kind].test(out) ? { ok: true, link: { kind, url: out } } : { ok: false, error: "invalid" };
}

/** Un canale già salvato è valido? Stessa regola del database: tipo noto e indirizzo nella forma canonica. */
export function isCanonicalLink(value: unknown): value is ProfileLink {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || !isLinkKind(v.kind) || typeof v.url !== "string") return false;
  if ([...v.url].length > LINK_URL_MAX || !CANONICAL[v.kind].test(v.url)) return false;
  if (v.kind === "website" && websiteBlock(v.url)) return false;
  return true;
}

/**
 * I canali di un profilo letti dal database (jsonb): solo quelli validi, al massimo `MAX_LINKS`. Difesa in lettura:
 * il vincolo del database li ha già controllati, ma una riga scritta prima del vincolo non deve rompere la pagina.
 */
export function parseStoredLinks(raw: unknown): ProfileLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCanonicalLink).slice(0, MAX_LINKS).map((l) => ({ kind: l.kind, url: l.url }));
}

/** Lingue dei contenuti lette dal database o dal modulo: solo quelle ammesse, senza doppioni, nell'ordine del sito. */
export function cleanContentLangs(raw: unknown): ContentLang[] {
  const values = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  return CONTENT_LANGS.filter((l) => values.includes(l));
}

/** Host di un indirizzo, senza porta ("https://www.example.com/x" → "www.example.com"); "" se non si legge. */
export function hostOf(url: string): string {
  const m = /^https:\/\/([^/?#]+)/i.exec(url);
  return m ? m[1].toLowerCase() : "";
}

/**
 * Testo visibile di un canale: il nome del canale sulla piattaforma ("coachcrono", "@coachcrono") o, per il sito web,
 * il dominio senza www. Chi legge vede sempre dove porta il link, anche quando l'etichetta è la piattaforma.
 */
export function linkHandle(link: ProfileLink): string {
  const path = link.url.replace(/^https:\/\/[^/]+\/?/, "");
  switch (link.kind) {
    case "website":
      return hostOf(link.url).replace(/^www\./, "");
    case "bluesky":
      return `@${path.replace(/^profile\//, "")}`;
    case "discord":
      return `discord.gg/${path}`;
    case "youtube":
      return path.startsWith("@") ? path : path.replace(/^(channel|c|user)\//, "");
    case "x":
    case "instagram":
      return `@${path}`;
    default:
      return path;
  }
}

/** I canali principali, quelli accanto al nome dell'autore: i primi `n` nell'ordine scelto dall'utente. */
export function mainChannels(links: readonly ProfileLink[], n: number = MAIN_CHANNELS): ProfileLink[] {
  return links.slice(0, Math.max(0, n));
}

/** Nome del canale Twitch del profilo (il primo, se ce n'è più di uno), per lo stato "in diretta"; null senza Twitch. */
export function twitchLogin(links: readonly ProfileLink[]): string | null {
  const t = links.find((l) => l.kind === "twitch");
  return t ? t.url.slice("https://www.twitch.tv/".length) : null;
}

/**
 * Caratteri che nella bio non devono finire: controlli (tranne l'a capo), larghezza zero, controlli di direzione.
 * Il vincolo del database rifiuta ogni carattere di controllo tranne l'a capo (`[[:cntrl:]]`).
 */
const BIO_STRIP = new RegExp(`[\\u0000-\\u0008\\u000B-\\u001F\\u007F-\\u009F${INVISIBLE}]`, "g");

/**
 * Bio del modulo: testo semplice, a capo ammessi (al massimo una riga vuota di fila), spazi in fondo alle righe tolti.
 * I separatori di riga Unicode (U+2028, U+2029, U+0085) diventano a capo: con alcuni locale del database contano come
 * caratteri di controllo e il salvataggio fallirebbe. Vuota: nessuna bio (`null`). Troppo lunga: errore, non un taglio
 * a metà frase.
 */
export function cleanBio(raw: string): { ok: true; value: string | null } | { ok: false; error: "long" } {
  const text = String(raw ?? "")
    .replace(/\r\n?|[\u2028\u2029\u0085]/g, "\n")
    .replace(/\t/g, " ")
    .replace(BIO_STRIP, "")
    .split("\n")
    .map((line) => line.replace(/ +/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) return { ok: true, value: null };
  return [...text].length > BIO_MAX ? { ok: false, error: "long" } : { ok: true, value: text };
}

/** Intervallo minimo fra due salvataggi del profilo che cambiano qualcosa (ogni salvataggio rigenera pagine e sitemap). */
export const SAVE_MIN_INTERVAL_MS = 10_000;

/**
 * Il profilo salvato nel database è già uguale a quello del modulo? Allora il salvataggio non scrive e non rigenera
 * nulla. Confronto esatto: canali nello stesso ordine (l'ordine decide i canali principali), lingue nell'ordine del sito
 * (come le scrive `cleanContentLangs`).
 */
export function sameShowcase(row: { bio: string | null; links: unknown; content_langs: unknown }, value: ProfileFormValue): boolean {
  const links = Array.isArray(row.links) ? row.links.map((l) => ({ kind: (l as ProfileLink | null)?.kind, url: (l as ProfileLink | null)?.url })) : null;
  return (row.bio ?? null) === value.bio && JSON.stringify(links) === JSON.stringify(value.links) && JSON.stringify(row.content_langs ?? null) === JSON.stringify(value.content_langs);
}

export type ProfileFormInput = { bio: string; langs: readonly string[]; kinds: readonly string[]; urls: readonly string[] };
export type ProfileFormValue = { bio: string | null; links: ProfileLink[]; content_langs: ContentLang[] };
/** Errori del modulo: la bio, e per ogni riga dei canali (indice nel modulo) il motivo; `tooMany` oltre `MAX_LINKS`. */
export type ProfileFormErrors = {
  bio?: "long";
  /** `platform`: con l'errore omonimo, la piattaforma da scegliere al posto di "sito web" */
  links?: { index: number; error: LinkError | "kind"; platform?: Exclude<LinkKind, "website"> }[];
  tooMany?: boolean;
};

/**
 * Il modulo "Il tuo profilo" di /account: bio, lingue (caselle), righe dei canali (tipo + indirizzo, nell'ordine del
 * modulo). Le righe vuote si saltano, i doppioni si tengono una volta sola (la prima). Tutto valido: i valori da
 * salvare; altrimenti gli errori, riga per riga, e nulla si salva.
 */
export function parseProfileForm(input: ProfileFormInput): { ok: true; value: ProfileFormValue } | { ok: false; errors: ProfileFormErrors } {
  const errors: ProfileFormErrors = {};
  const bio = cleanBio(input.bio);
  if (!bio.ok) errors.bio = bio.error;
  const links: ProfileLink[] = [];
  const rowErrors: NonNullable<ProfileFormErrors["links"]> = [];
  const rows = Math.max(input.kinds.length, input.urls.length);
  for (let i = 0; i < rows; i++) {
    const url = input.urls[i] ?? "";
    if (!squeeze(url)) continue;
    const kind = input.kinds[i];
    if (!isLinkKind(kind)) {
      rowErrors.push({ index: i, error: "kind" });
      continue;
    }
    const res = normalizeLink(kind, url);
    if (!res.ok) rowErrors.push({ index: i, error: res.error, ...(res.platform ? { platform: res.platform } : {}) });
    else if (res.link && !links.some((l) => l.url === res.link!.url)) links.push(res.link);
  }
  if (rowErrors.length) errors.links = rowErrors;
  if (links.length > MAX_LINKS) errors.tooMany = true;
  if (errors.bio || errors.links || errors.tooMany) return { ok: false, errors };
  return { ok: true, value: { bio: bio.ok ? bio.value : null, links, content_langs: cleanContentLangs(input.langs) } };
}
