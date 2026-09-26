import { listCreators } from "@/lib/community/creators";
import { twitchLogin } from "@/lib/community/profileLinks";
import { chunk, liveUsers, loginsToCheck, type LiveCandidate, type LiveResponse, type TwitchStream } from "./twitchLive";

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

/**
 * Chi fra i creator (tag autore + canale Twitch nel profilo) è in diretta su Origins TCG adesso. Senza chiavi:
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
