import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/public";
import { normalizeLinkCode } from "@/lib/tracker/upload";
import { readJsonBody } from "@/lib/tracker/http";
import { verifyExtJwt } from "@/lib/twitchExt/jwt";
import { extConfig, extCors } from "@/lib/twitchExt/server";

/**
 * Collegamento di un canale Twitch all'account per l'estensione "Deck tracker" (13/10/2026, docs/twitch.md).
 *
 * POST {code} con "Authorization: Bearer <JWT dell'estensione>" dalla pagina di configurazione → {username}. Il JWT lo
 * firma Twitch con il secret dell'estensione: si accetta solo con il ruolo "broadcaster", e il canale è il suo
 * channel_id. Il codice lo crea il sito in /account/tracker (twitch_link_code); twitch_link_claim lo scambia solo con
 * il segreto del server (CRON_SECRET), così nessuno può collegare un canale senza averlo dimostrato a Twitch.
 * Solo dall'origine dell'estensione (CORS). Errori: {error} con forbidden 401, invalid_code 400, unavailable 503.
 */
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: extCors(request, extConfig()) });
}

export async function POST(request: Request) {
  const cfg = extConfig();
  const headers = { ...extCors(request, cfg), "cache-control": "no-store" };
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  const key = process.env.CRON_SECRET?.trim();
  const db = supabaseAnon();
  if (!cfg || !key || !db) return fail("unavailable", 503);
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "");
  const claims = m ? verifyExtJwt(m[1], cfg.secret) : null;
  if (!claims || claims.role !== "broadcaster" || !claims.channel_id) return fail("forbidden", 401);
  const body = await readJsonBody(request, 1024);
  const code = body.ok && body.value && typeof body.value === "object" ? normalizeLinkCode((body.value as { code?: unknown }).code) : null;
  if (!code) return fail("invalid_code", 400);
  const { data, error } = await db.rpc("twitch_link_claim", { p_key: key, p_code: code, p_channel: claims.channel_id });
  if (error) {
    const msg = error.message ?? "";
    if (["PGRST202", "42883", "42P01"].includes(error.code ?? "")) return fail("unavailable", 503);
    if (msg.includes("invalid_code")) return fail("invalid_code", 400);
    console.error("[twitch-ext] link:", msg);
    return fail("error", 500);
  }
  return NextResponse.json({ username: typeof data === "string" ? data : null }, { headers });
}
