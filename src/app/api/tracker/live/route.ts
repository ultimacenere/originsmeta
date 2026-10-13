import { after, NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/public";
import { parseLiveState, pubsubMessage } from "@/lib/tracker/live";
import { TRACKER_HEADERS, bearerToken, readJsonBody } from "@/lib/tracker/http";
import { extConfig, sendBroadcast } from "@/lib/twitchExt/server";

/**
 * Stato dal vivo dall'app OriginsMeta Tracker per l'estensione Twitch "Deck tracker" (13/10/2026, docs/twitch.md).
 *
 * POST {state} con "Authorization: Bearer <token dell'app>" → {linked}. Lo stato deve avere la forma di
 * `parseLiveState` (src/lib/tracker/live.ts: il mazzo dello streamer, il round, la Leggendaria e le carte rivelate
 * dell'avversario, niente altro); la funzione tracker_live_push del blocco TWITCH lo salva solo se l'account ha
 * collegato un canale, e allora il sito lo manda agli spettatori con l'Extension PubSub (dopo la risposta). Con
 * `linked: false` l'app smette di mandare per qualche minuto.
 *
 * Errori: {error} con invalid_token 401 (l'app si scollega), bad_request/invalid_state 400, too_fast 429,
 * unavailable 503 (migrazione non fatta). Mai in cache, client anonimo, niente cookie.
 */
export const dynamic = "force-dynamic";

const MAX_BODY = 8 * 1024;
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: TRACKER_HEADERS });

export async function POST(request: Request) {
  const db = supabaseAnon();
  if (!db) return fail("unavailable", 503);
  const token = bearerToken(request);
  if (!token) return fail("invalid_token", 401);
  const body = await readJsonBody(request, MAX_BODY);
  if (!body.ok || typeof body.value !== "object" || body.value === null) return fail("bad_request", 400);
  const state = parseLiveState((body.value as { state?: unknown }).state);
  if (!state) return fail("invalid_state", 400);
  const { data, error } = await db.rpc("tracker_live_push", { p_token: token, p_state: state });
  if (error) {
    const msg = error.message ?? "";
    if (["PGRST202", "42883", "42P01", "42703"].includes(error.code ?? "")) return fail("unavailable", 503);
    if (msg.includes("invalid_token")) return fail("invalid_token", 401);
    if (msg.includes("invalid_state")) return fail("invalid_state", 400);
    if (msg.includes("too_fast")) return fail("too_fast", 429);
    console.error("[tracker] live:", msg);
    return fail("error", 500);
  }
  const channel = typeof data === "string" ? data : null;
  const cfg = extConfig();
  if (channel && cfg) {
    const message = pubsubMessage(state, new Date().toISOString());
    if (message) after(() => sendBroadcast(cfg, channel, message));
  }
  return NextResponse.json({ linked: Boolean(channel) }, { headers: TRACKER_HEADERS });
}
