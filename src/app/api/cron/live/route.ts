import { NextResponse } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/env";
import { originsLiveStreams, twitchConfigured } from "@/lib/twitch";
import { CRON_SECRET_MIN, cronAuthorized } from "@/lib/community/notifications";
import { notifyLive } from "@/lib/community/notify";

/**
 * Avvisi di diretta per chi segue (pacchetto SEGUI, 27/09/2026): chi fra i profili vetrina con un canale Twitch è in
 * diretta su Origins TCG (stesse regole del badge LIVE, `originsLiveStreams` in src/lib/twitch.ts) e, per ognuno, un
 * avviso a ogni follower, una volta per diretta (lo decide il database: `notify_live` in supabase/wave2-SEGUI.sql, con
 * l'id della diretta e una pausa di 3 ore fra due dirette della stessa persona).
 *
 * La chiama il cron di Vercel ogni 10 minuti (vercel.json), con `Authorization: Bearer <CRON_SECRET>`. Variabili (solo
 * server, mai NEXT_PUBLIC_): CRON_SECRET (almeno 32 caratteri; la stessa va registrata nel database con
 * `node scripts/set-cron-key.mjs`, perché `notify_live` gira senza sessione e parte solo con il segreto giusto),
 * TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET (le stesse del badge LIVE). Senza CRON_SECRET o senza le chiavi di Twitch non
 * fa nulla e risponde `skipped`; senza il segreto giusto 401. Mai in cache.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const headers = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < CRON_SECRET_MIN) return NextResponse.json({ ok: false, skipped: "no_secret" }, { headers });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
  if (!supabaseEnabled || !twitchConfigured()) return NextResponse.json({ ok: false, skipped: "no_twitch" }, { headers });

  let alerts;
  try {
    alerts = (await originsLiveStreams()) ?? [];
  } catch (error) {
    console.error("[cron/live]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "twitch" }, { status: 502, headers });
  }

  // una chiamata per diretta, una dopo l'altra: pochi profili, e il database tiene il lock per persona
  let notified = 0;
  let failed = 0;
  for (const alert of alerts) {
    const n = await notifyLive(secret, alert);
    if (n === null) failed += 1;
    else notified += n;
  }
  return NextResponse.json({ ok: failed === 0, live: alerts.length, notified, failed }, { headers });
}
