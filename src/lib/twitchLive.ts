/**
 * Stato "in diretta" dei creator su Twitch (pacchetto CREATOR, 26/09/2026): le parti pure, senza rete e senza import,
 * così si provano con `node --test src/lib/twitchLive.test.ts`. Le chiamate a Twitch stanno in src/lib/twitch.ts, la
 * rotta in src/app/api/live/route.ts, il badge nel browser in src/components/LiveBadge.tsx.
 *
 * Si guarda solo chi ha il ruolo Creator, Autore, Pro o Staff e un canale Twitch nel profilo. Una diretta conta se è su Origins TCG: la
 * categoria del gioco su Twitch oppure il titolo che lo nomina ("Origins TCG", "#originstcg", "OriginsMeta"). Chi è in
 * diretta su un altro gioco non riceve il badge: il sito parla di Origins, e il badge promette una diretta di Origins.
 */

/** Una diretta come la restituisce Helix, GET /helix/streams (solo i campi che servono). */
export type TwitchStream = {
  user_login: string;
  game_id?: string;
  game_name?: string;
  title?: string;
  viewer_count?: number;
  type?: string;
  /** id della diretta: gli avvisi a chi segue ne mandano uno per diretta (pacchetto SEGUI, 27/09/2026) */
  id?: string;
};

/** Un creator da controllare: il suo nome utente su OriginsMeta e il suo canale Twitch. */
export type LiveCandidate = { username: string; login: string };

/**
 * Chi è in diretta, per nome utente di OriginsMeta: indirizzo del canale, spettatori e, dal 28/09/2026, il titolo della
 * diretta (per la pagina /live; testo scritto dallo streamer su Twitch, ripulito da `cleanStreamTitle`, mai HTML).
 */
export type LiveUsers = Record<string, { channel: string; viewers: number; title?: string }>;

/** Il corpo della risposta di /api/live: `enabled` false senza le chiavi di Twitch (nessun badge, nessun errore). */
export type LiveResponse = { enabled: boolean; users: LiveUsers };

/** Quanti canali per richiesta a Helix (limite di Twitch per `user_login`). */
export const HELIX_BATCH = 100;

/** Nomi della categoria del gioco su Twitch, ridotti a lettere e cifre minuscole. */
const ORIGINS_GAMES = new Set(["originstcg", "originstradingcardgame"]);

/** Un titolo che parla di Origins TCG: il nome del gioco, l'hashtag o il nostro sito. */
const ORIGINS_TITLE = /\borigins[\s_-]*tcg\b|#originstcg\b|\boriginsmeta\b/i;

/** La diretta è su Origins TCG? Categoria del gioco o titolo che lo nomina; con `gameId` basta l'id della categoria. */
export function isOriginsStream(stream: Pick<TwitchStream, "game_id" | "game_name" | "title" | "type">, gameId?: string): boolean {
  if (stream.type && stream.type !== "live") return false;
  if (gameId && stream.game_id === gameId) return true;
  const game = (stream.game_name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ORIGINS_GAMES.has(game) || ORIGINS_TITLE.test(stream.title ?? "");
}

/** Divide un elenco in gruppi di `size` (le richieste a Helix accettano al massimo 100 canali). */
export function chunk<T>(items: readonly T[], size: number = HELIX_BATCH): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += Math.max(1, size)) out.push(items.slice(i, i + Math.max(1, size)));
  return out;
}

/** Canali da chiedere a Twitch: nomi validi, minuscoli, senza doppioni. */
export function loginsToCheck(candidates: readonly LiveCandidate[]): string[] {
  return [...new Set(candidates.map((c) => c.login.toLowerCase()).filter((l) => /^[a-z0-9_]{3,25}$/.test(l)))];
}

/**
 * Chi è in diretta su Origins TCG, per nome utente di OriginsMeta. Più profili possono puntare allo stesso canale
 * (un doppio account, uno staff che mette il canale del team): il badge va a tutti, perché il canale è in diretta.
 */
export function liveUsers(candidates: readonly LiveCandidate[], streams: readonly TwitchStream[], gameId?: string): LiveUsers {
  const live = new Map<string, TwitchStream>();
  for (const s of streams) if (s.user_login && isOriginsStream(s, gameId)) live.set(s.user_login.toLowerCase(), s);
  const out: LiveUsers = {};
  for (const c of candidates) {
    const s = live.get(c.login.toLowerCase());
    if (!s) continue;
    const title = cleanStreamTitle(s.title);
    out[c.username] = {
      channel: `https://www.twitch.tv/${c.login.toLowerCase()}`,
      viewers: Math.max(0, Math.round(Number(s.viewer_count) || 0)),
      ...(title ? { title } : {}),
    };
  }
  return out;
}

/* ---------- pagina /live e striscia del calendario (28/09/2026) ---------- */

/** Lunghezza massima del titolo di una diretta mostrato nella pagina /live (in caratteri). */
export const STREAM_TITLE_MAX = 140;

/** Controllo, invisibili e caratteri di direzione (anche quelli che girano il testo): nel titolo diventano spazi. */
const TITLE_JUNK = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufe00-\ufe0f\ufeff\uffa0]/g;

/**
 * Il titolo della diretta come lo mostra il sito: una riga sola, senza caratteri di controllo né invisibili, al massimo
 * `STREAM_TITLE_MAX` caratteri (tagliato con l'ellissi). Vuoto o non testo: undefined. React lo scrive come testo.
 */
export function cleanStreamTitle(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const flat = raw.slice(0, STREAM_TITLE_MAX * 8).replace(TITLE_JUNK, " ").replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  const chars = Array.from(flat);
  return chars.length <= STREAM_TITLE_MAX ? flat : `${chars.slice(0, STREAM_TITLE_MAX - 1).join("").trimEnd()}…`;
}

/** Indirizzo del canale nella forma che il sito scrive (`liveUsers`): solo questo diventa un link o un lettore. */
const CHANNEL_URL = /^https:\/\/www\.twitch\.tv\/([a-z0-9_]{3,25})$/;

/** Il nome del canale da un indirizzo https://www.twitch.tv/<canale>, o null se l'indirizzo non è in quella forma. */
export function channelLogin(channel: string): string | null {
  return CHANNEL_URL.exec(channel)?.[1] ?? null;
}

/**
 * La risposta di /api/live letta dal browser, ricontrollata voce per voce: nome utente del sito, canale nella forma
 * canonica, spettatori numero intero, titolo ripulito. Quello che non torna si scarta (una risposta vecchia in cache,
 * un proxy che la altera): meglio un badge in meno che un link sbagliato.
 */
export function safeLiveUsers(raw: unknown): LiveUsers {
  const out: LiveUsers = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [username, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z0-9_-]{1,40}$/i.test(username) || !value || typeof value !== "object") continue;
    const v = value as { channel?: unknown; viewers?: unknown; title?: unknown };
    if (typeof v.channel !== "string" || !channelLogin(v.channel)) continue;
    const title = cleanStreamTitle(v.title);
    out[username] = { channel: v.channel, viewers: Math.max(0, Math.round(Number(v.viewers) || 0)), ...(title ? { title } : {}) };
  }
  return out;
}

/** Chi è in diretta, in ordine: più spettatori prima, a parità il nome utente. Lo stesso ordine per striscia e pagina. */
export function liveOrder(users: LiveUsers): string[] {
  return Object.keys(users).sort((a, b) => users[b].viewers - users[a].viewers || (a < b ? -1 : a > b ? 1 : 0));
}
