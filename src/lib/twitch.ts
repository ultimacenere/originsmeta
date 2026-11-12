import { listCreators } from "@/lib/community/creators";
import { twitchLogin } from "@/lib/community/profileLinks";
import { liveAlerts, type LiveAlert } from "@/lib/community/notifications";
import { chunk, isOriginsStream, liveUsers, loginsToCheck, type LiveCandidate, type LiveResponse, type TwitchStream } from "./twitchLive";

/**
 * Twitch, lato server (pacchetto CREATOR, 26/09/2026): chi fra i creator è in diretta su Origins TCG. La usa solo la
 * rotta /api/live, che il browser chiede per i badge LIVE: le pagine restano statiche o ISR e non chiamano mai Twitch.
 *
 * Variabili d'ambiente (Vercel, SOLO server, mai con NEXT_PUBLIC_): TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET dell'app di
 * Pierluigi su dev.twitch.tv (Console → Applications; basta un'app senza permessi: il token è "client credentials",
 * dell'app e non di un utente). TWITCH_GAME_ID, facoltativa: l'id della categoria di Origins TCG su Twitch, se il nome
 * della categoria dovesse cambiare. Senza le due chiavi niente chiamate, niente badge e nessun errore.
 * Il segreto resta nelle variabili: qui non c'è e non passa mai al browser.
 */

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const STREAMS_URL = "https://api.twitch.tv/helix/streams";
const TIMEOUT_MS = 5000;

function credentials(): { id: string; secret: string } | null {
  const id = process.env.TWITCH_CLIENT_ID?.trim();
  const secret = process.env.TWITCH_CLIENT_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

/** Le due chiavi ci sono? Senza, lo stato in diretta è spento. */
export function twitchConfigured(): boolean {
  return credentials() !== null;
}

/** Token dell'app, tenuto in memoria finché non sta per scadere (dura settimane: una richiesta ogni tanto). */
let cachedToken: { value: string; expires: number } | null = null;

async function appToken(creds: { id: string; secret: string }, fresh = false): Promise<string> {
  if (!fresh && cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const body = new URLSearchParams({ client_id: creds.id, client_secret: creds.secret, grant_type: "client_credentials" });
  const res = await fetch(TOKEN_URL, { method: "POST", body, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`token Twitch: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("token Twitch: risposta senza access_token");
  cachedToken = { value: json.access_token, expires: Date.now() + Math.max(60, Number(json.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

/** Le dirette di un gruppo di canali (al massimo 100): un 401 rinnova il token una volta. */
async function streamsOf(creds: { id: string; secret: string }, logins: readonly string[]): Promise<TwitchStream[]> {
  const query = new URLSearchParams(logins.map((l) => ["user_login", l]));
  query.set("first", "100");
  for (const fresh of [false, true]) {
    const token = await appToken(creds, fresh);
    const res = await fetch(`${STREAMS_URL}?${query}`, { headers: { "Client-Id": creds.id, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.status === 401 && !fresh) {
      cachedToken = null;
      continue;
    }
    if (!res.ok) throw new Error(`streams Twitch: HTTP ${res.status}`);
    const json = (await res.json()) as { data?: TwitchStream[] };
    return Array.isArray(json.data) ? json.data : [];
  }
  return [];
}

/* ---------- eventi della community (10/11/2026) ---------- */

const USERS_URL = "https://api.twitch.tv/helix/users";
const AVATAR_TTL_MS = 6 * 3600_000;
const LIVE_TTL_MS = 60_000;
const avatarCache = new Map<string, { url: string | null; at: number }>();
let liveCache: { key: string; logins: string[]; at: number } | null = null;
const LOGIN_RE = /^[a-z0-9_]{3,25}$/;

/**
 * Foto del profilo Twitch dei talent di un evento (login → indirizzo https dell'immagine, al massimo 100 canali). Tenute
 * in memoria sei ore e nella cache dei dati di Next: la pagina dell'evento e la sua rotta le chiedono a ogni
 * rigenerazione, Twitch le vede una volta ogni tanto. Senza chiavi, o con Twitch giù, nessuna foto (si vede l'iniziale).
 */
export async function twitchAvatars(logins: readonly string[]): Promise<Record<string, string>> {
  const creds = credentials();
  if (!creds) return {};
  const out: Record<string, string> = {};
  const want = [...new Set(logins.map((l) => l.toLowerCase()))].filter((l) => LOGIN_RE.test(l)).slice(0, 100);
  const missing = want.filter((l) => {
    const c = avatarCache.get(l);
    if (c && Date.now() - c.at < AVATAR_TTL_MS) {
      if (c.url) out[l] = c.url;
      return false;
    }
    return true;
  });
  if (!missing.length) return out;
  const query = new URLSearchParams(missing.map((l) => ["login", l]));
  try {
    for (const fresh of [false, true]) {
      const token = await appToken(creds, fresh);
      const res = await fetch(`${USERS_URL}?${query}`, {
        headers: { "Client-Id": creds.id, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: 21600 },
      });
      if (res.status === 401 && !fresh) {
        cachedToken = null;
        continue;
      }
      if (!res.ok) throw new Error(`users Twitch: HTTP ${res.status}`);
      const json = (await res.json()) as { data?: { login?: string; profile_image_url?: string }[] };
      const now = Date.now();
      for (const u of json.data ?? []) {
        const login = (u.login ?? "").toLowerCase();
        const url = typeof u.profile_image_url === "string" && u.profile_image_url.startsWith("https://") ? u.profile_image_url : null;
        if (!login) continue;
        avatarCache.set(login, { url, at: now });
        if (url) out[login] = url;
      }
      for (const l of missing) if (!avatarCache.has(l)) avatarCache.set(l, { url: null, at: now });
      break;
    }
  } catch (error) {
    console.error("[twitch] foto degli eventi:", error instanceof Error ? error.message : error);
  }
  return out;
}

/**
 * Quali canali di un evento sono in diretta adesso (qualunque categoria: durante l'evento contano tutti), tenuto un
 * minuto in memoria. Senza chiavi o con Twitch giù: nessuno.
 */
export async function liveLogins(logins: readonly string[]): Promise<string[]> {
  const creds = credentials();
  if (!creds) return [];
  const want = [...new Set(logins.map((l) => l.toLowerCase()))].filter((l) => LOGIN_RE.test(l)).slice(0, 100).sort();
  if (!want.length) return [];
  const key = want.join(",");
  if (liveCache && liveCache.key === key && Date.now() - liveCache.at < LIVE_TTL_MS) return liveCache.logins;
  try {
    const streams = await streamsOf(creds, want);
    const live = [...new Set(streams.map((s) => (s.user_login ?? "").toLowerCase()).filter(Boolean))];
    liveCache = { key, logins: live, at: Date.now() };
    return live;
  } catch (error) {
    console.error("[twitch] dirette degli eventi:", error instanceof Error ? error.message : error);
    return liveCache?.key === key ? liveCache.logins : [];
  }
}

/**
 * Chi fra i profili vetrina (ruolo Creator, Autore, Pro o Staff + canale Twitch nel profilo) è in diretta su Origins TCG adesso. Senza chiavi:
 * `enabled: false` e nessuna chiamata. Un errore di Twitch o del database sale: la rotta lo trasforma in "nessuno".
 */
export async function liveStatus(): Promise<LiveResponse> {
  const creds = credentials();
  if (!creds) return { enabled: false, users: {} };
  const creators = await listCreators();
  const candidates: LiveCandidate[] = creators.flatMap((c) => {
    const login = twitchLogin(c.links);
    return login ? [{ username: c.username, login }] : [];
  });
  const logins = loginsToCheck(candidates);
  if (!logins.length) return { enabled: true, users: {} };
  const streams = (await Promise.all(chunk(logins).map((group) => streamsOf(creds, group)))).flat();
  return { enabled: true, users: liveUsers(candidates, streams, process.env.TWITCH_GAME_ID?.trim() || undefined) };
}

/**
 * Chi fra i profili vetrina con un canale Twitch è in diretta su Origins TCG adesso, con l'id del profilo e della
 * diretta: gli avvisi a chi segue (pacchetto SEGUI, 27/09/2026, rotta /api/cron/live). Stesse regole del badge LIVE
 * (`isOriginsStream`). null senza le chiavi di Twitch (nessuna chiamata); un errore di Twitch o del database sale.
 */
export async function originsLiveStreams(): Promise<LiveAlert[] | null> {
  const creds = credentials();
  if (!creds) return null;
  const creators = await listCreators();
  const profiles = creators.flatMap((c) => {
    const login = twitchLogin(c.links);
    return login ? [{ id: c.id, username: c.username, login }] : [];
  });
  const logins = loginsToCheck(profiles);
  if (!logins.length) return [];
  const streams = (await Promise.all(chunk(logins).map((group) => streamsOf(creds, group)))).flat();
  const gameId = process.env.TWITCH_GAME_ID?.trim() || undefined;
  return liveAlerts(profiles, streams, (s) => isOriginsStream(s, gameId));
}
