/**
 * Broadcasting OM in diretta, lato server (05/11/2026, docs/broadcasting.md): stato della regia sul sito, immagini
 * degli sponsor, canali Twitch collegati e invio agli spettatori con l'Extension PubSub di Twitch.
 *
 * Il database lo usano solo le funzioni del blocco "05/11/2026: BROADCASTING IN DIRETTA" di supabase/schema.sql: la
 * regia con la sessione di chi ha fatto l'accesso, l'overlay di OBS e l'estensione con il client anonimo, il
 * collegamento di un canale con il segreto del server (CRON_SECRET). Prima della migrazione le rotte rispondono
 * "unavailable" e la regia lo dice: il resto di Broadcasting OM (regia e overlay nello stesso browser) funziona come prima.
 *
 * Estensione Twitch di Broadcasting OM, separata dal Deck tracker (cartella twitch-broadcast/): variabili d'ambiente su
 * Vercel, SOLO server, mai NEXT_PUBLIC_: TWITCH_BCAST_EXT_CLIENT_ID (Client ID dell'estensione), TWITCH_BCAST_EXT_SECRET
 * (Extension Secret, in base64 come lo dà la console di dev.twitch.tv), TWITCH_BCAST_EXT_OWNER_ID (id utente Twitch del
 * proprietario dell'estensione; senza, vale TWITCH_EXT_OWNER_ID). Senza le prime due: niente collegamenti (503) e
 * niente invii a Twitch, la diretta per OBS funziona lo stesso.
 *
 * Prove in locale senza database: con `BROADCAST_LIVE_DEV=1` in `.env.development.local` (solo `next dev`, mai in
 * produzione) tutto vive in memoria, con un utente finto "dev" (liveDev.ts).
 */
import { supabaseAnon } from "@/lib/supabase/public";
import { currentUser } from "@/lib/supabase/server";
import { sendBroadcast, type ExtConfig } from "@/lib/twitchExt/server";
import { broadcastCatalog } from "./catalog";
import { devBackend, liveDevEnabled } from "./liveDev";
import { extHasDecks, extStateOf, jsonBytes, LIVE_STATE_MAX, pubsubMessage } from "./live";
import { sanitizeState, withoutUploads, type BroadcastState } from "./state";
import { LiveError, liveErrorOf, type LiveRow, type PublicBackend, type UserBackend } from "./liveTypes";

export { LIVE_ERROR_STATUS, LiveError } from "./liveTypes";

export function bcastExtConfig(): ExtConfig | null {
  const clientId = process.env.TWITCH_BCAST_EXT_CLIENT_ID?.trim();
  const secret = process.env.TWITCH_BCAST_EXT_SECRET?.trim();
  const ownerId = (process.env.TWITCH_BCAST_EXT_OWNER_ID || process.env.TWITCH_EXT_OWNER_ID)?.trim();
  return clientId && secret && ownerId ? { clientId, secret, ownerId } : null;
}

/** Le pagine dell'estensione girano su https://<client id>.ext-twitch.tv: solo quell'origine chiama il collegamento. */
export function bcastCors(request: Request, cfg: ExtConfig | null): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const ok = cfg && origin === `https://${cfg.clientId}.ext-twitch.tv`;
  return ok
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "authorization, content-type", "access-control-max-age": "600", vary: "origin" }
    : { vary: "origin" };
}

/* ---------------- stato ---------------- */

let catalogSlugs: Set<string> | null = null;
export function isCatalogCard(slug: string): boolean {
  catalogSlugs ??= new Set(broadcastCatalog().map((c) => c.slug));
  return catalogSlugs.has(slug);
}

/**
 * Lo stato mandato dalla regia, pulito come quello di un indirizzo (sanitizeState): le immagini caricate restano solo
 * come "om:<impronta>" (un data URL si toglie: le immagini si caricano a parte). null se supera il tetto del database.
 */
export function liveStateFromRequest(raw: unknown): BroadcastState | null {
  const state = withoutUploads(sanitizeState(raw, isCatalogCard));
  return jsonBytes(state) <= LIVE_STATE_MAX ? state : null;
}

/** Lo stato letto dal database, ripulito (le carte che non esistono più si tolgono), o null. */
export function liveStateFromDb(raw: unknown): BroadcastState | null {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? sanitizeState(raw, isCatalogCard) : null;
}

/**
 * Manda la versione nuova agli spettatori dei canali collegati (target "broadcast" dell'Extension PubSub). Senza la
 * configurazione dell'estensione non parte niente. Errori solo nel log: l'estensione rilegge lo stato quando si apre.
 */
export async function pushToChannels(channels: readonly string[], id: string, version: number, at: string, state: BroadcastState | null): Promise<void> {
  const cfg = bcastExtConfig();
  // nelle prove in locale la finta estensione rilegge lo stato da sola (twitch-broadcast/dev/twitch-mock.js)
  if (!cfg || !channels.length || liveDevEnabled()) return;
  const ext = state ? extStateOf(state) : null;
  const message = pubsubMessage(id, version, at, ext && extHasDecks(ext) ? ext : null);
  await Promise.all(channels.slice(0, 10).map((ch) => sendBroadcast(cfg, ch, message)));
}

/* ---------------- database ---------------- */

function rpcFail(error: { code?: string | null; message?: string | null }): never {
  const code = liveErrorOf(error);
  if (code === "error") console.error("[broadcast-live]", error.message);
  throw new LiveError(code);
}

/** La regia di chi ha fatto l'accesso; LiveError("login") senza sessione. */
export async function userBackend(): Promise<UserBackend> {
  if (liveDevEnabled()) return devBackend.user;
  const { supabase, user } = await currentUser();
  if (!supabase) throw new LiveError("unavailable");
  if (!user) throw new LiveError("login");
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  return {
    username: profile?.username ?? null,
    async info(create) {
      const { data, error } = await supabase.rpc("broadcast_live_info", { p_create: create });
      if (error) rpcFail(error);
      const row = Array.isArray(data) ? data[0] : undefined;
      return row ? { id: row.id, version: row.version, updatedAt: row.updated_at, live: row.live, channels: Array.isArray(row.channels) ? row.channels : [] } : null;
    },
    async save(state) {
      const { data, error } = await supabase.rpc("broadcast_live_save", { p_state: state });
      if (error) rpcFail(error);
      const row = Array.isArray(data) ? data[0] : undefined;
      if (!row) throw new LiveError("error");
      return { id: row.id, version: row.version, channels: row.channels ?? [] };
    },
    async clear() {
      const { data, error } = await supabase.rpc("broadcast_live_clear");
      if (error) rpcFail(error);
      const row = Array.isArray(data) ? data[0] : undefined;
      return row ? { id: row.id, version: row.version, channels: row.channels ?? [] } : null;
    },
    async imagePut(data) {
      const { data: hash, error } = await supabase.rpc("broadcast_image_put", { p_data: data });
      if (error) rpcFail(error);
      if (typeof hash !== "string") throw new LiveError("error");
      return hash;
    },
    async linkCode() {
      const { data, error } = await supabase.rpc("broadcast_link_code");
      if (error) rpcFail(error);
      if (typeof data !== "string") throw new LiveError("error");
      return data;
    },
    async unlink(channel) {
      const { data, error } = await supabase.rpc("broadcast_unlink", { p_channel: channel });
      if (error) rpcFail(error);
      return data === true;
    },
  };
}

const rowOf = (data: unknown): LiveRow | null => {
  const row = Array.isArray(data) ? (data[0] as { id?: string; state?: unknown; version?: number; updated_at?: string } | undefined) : undefined;
  return row && typeof row.version === "number" ? { id: typeof row.id === "string" ? row.id : null, state: row.state ?? null, version: row.version, updatedAt: row.updated_at ?? "" } : null;
};

/** Il client anonimo, senza cache (le letture dell'overlay cambiano ogni secondo). */
export function publicBackend(): PublicBackend {
  if (liveDevEnabled()) return devBackend.public;
  const db = supabaseAnon();
  if (!db) throw new LiveError("unavailable");
  return {
    async liveState(id) {
      const { data, error } = await db.rpc("broadcast_live_state", { p_id: id });
      if (error) rpcFail(error);
      return rowOf(data);
    },
    async channelState(channel) {
      const { data, error } = await db.rpc("broadcast_channel_state", { p_channel: channel });
      if (error) rpcFail(error);
      return rowOf(data);
    },
    async imageGet(id, hash) {
      const { data, error } = await db.rpc("broadcast_image_get", { p_id: id, p_hash: hash });
      if (error) rpcFail(error);
      return typeof data === "string" ? data : null;
    },
    async linkClaim(key, code, channel, login) {
      const { data, error } = await db.rpc("broadcast_link_claim", { p_key: key, p_code: code, p_channel: channel, p_login: login });
      if (error) rpcFail(error);
      return typeof data === "string" ? data : null;
    },
  };
}
