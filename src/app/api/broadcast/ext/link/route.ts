import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/tracker/http";
import { normalizeLinkCode } from "@/lib/tracker/upload";
import { verifyExtJwt } from "@/lib/twitchExt/jwt";
import { twitchLoginOf } from "@/lib/twitch";
import { bcastCors, bcastExtConfig, LIVE_ERROR_STATUS, LiveError, publicBackend } from "@/lib/broadcast/liveServer";

/**
 * Collegamento di un canale Twitch a una regia di Broadcasting OM (05/11/2026, twitch-broadcast/README.md).
 *
 * POST {code} con "Authorization: Bearer <JWT dell'estensione>" dalla pagina di configurazione → {username} (la regia
 * collegata). Il JWT lo firma Twitch con il secret dell'estensione di Broadcasting OM: si accetta solo con il ruolo
 * "broadcaster", e il canale è il suo channel_id. Il codice lo crea la regia (/api/broadcast/live/link);
 * broadcast_link_claim lo scambia solo con il segreto del server (CRON_SECRET), così nessuno collega un canale senza
 * averlo dimostrato a Twitch. Il nome del canale (solo da mostrare nella regia) lo chiede il sito a Twitch.
 * Solo dall'origine dell'estensione (CORS). Errori: {error} con forbidden 401, invalid_code 400, too_many 429,
 * unavailable 503.
 */
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: bcastCors(request, bcastExtConfig()) });
}

export async function POST(request: Request) {
  const cfg = bcastExtConfig();
  const headers = { ...bcastCors(request, cfg), "cache-control": "no-store" };
  const fail = (error: keyof typeof LIVE_ERROR_STATUS) => NextResponse.json({ error }, { status: LIVE_ERROR_STATUS[error], headers });
  const key = process.env.CRON_SECRET?.trim();
  if (!cfg || !key) return fail("unavailable");
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "");
  const claims = m ? verifyExtJwt(m[1], cfg.secret) : null;
  if (!claims || claims.role !== "broadcaster" || !claims.channel_id) return fail("forbidden");
  const body = await readJsonBody(request, 1024);
  const code = body.ok && body.value && typeof body.value === "object" ? normalizeLinkCode((body.value as { code?: unknown }).code) : null;
  if (!code) return fail("invalid_code");
  try {
    const login = await twitchLoginOf(claims.channel_id);
    const username = await publicBackend().linkClaim(key, code, claims.channel_id, login);
    return NextResponse.json({ username }, { headers });
  } catch (e) {
    return fail(e instanceof LiveError ? e.code : "error");
  }
}
