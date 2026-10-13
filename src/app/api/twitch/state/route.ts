import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/public";
import { parseLiveState } from "@/lib/tracker/live";
import { CHANNEL_RE } from "@/lib/twitchExt/jwt";

/**
 * GET /api/twitch/state?channel=<id del canale> → {state, at} o {state: null}: l'ultimo stato del Deck tracker di un
 * canale collegato (13/10/2026, docs/twitch.md), che l'estensione legge quando si apre; poi gli aggiornamenti arrivano
 * con l'Extension PubSub. È quello che lo streamer mostra già in diretta e che PubSub manda a ogni spettatore, quindi
 * la rotta non chiede il JWT: così la cache del CDN vale per tutti gli spettatori del canale (2 secondi).
 */
export const dynamic = "force-dynamic";

const HEADERS = { "access-control-allow-origin": "*", "cache-control": "public, max-age=0, s-maxage=2, stale-while-revalidate=10" };

export async function GET(request: Request) {
  const channel = new URL(request.url).searchParams.get("channel") ?? "";
  if (!CHANNEL_RE.test(channel)) return NextResponse.json({ error: "bad_request" }, { status: 400, headers: HEADERS });
  const db = supabaseAnon();
  if (!db) return NextResponse.json({ state: null }, { headers: HEADERS });
  const { data, error } = await db.rpc("twitch_live_state", { p_channel: channel });
  if (error) {
    if (!["PGRST202", "42883", "42P01"].includes(error.code ?? "")) console.error("[twitch-ext] state:", error.message);
    return NextResponse.json({ state: null }, { headers: HEADERS });
  }
  const row = Array.isArray(data) ? (data[0] as { state?: unknown; updated_at?: string } | undefined) : undefined;
  const state = row ? parseLiveState(row.state) : null;
  return NextResponse.json(state ? { state, at: row?.updated_at ?? null } : { state: null }, { headers: HEADERS });
}
