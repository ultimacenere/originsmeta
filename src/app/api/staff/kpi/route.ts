import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnon } from "@/lib/supabase/public";
import { CRON_SECRET_MIN, cronAuthorized } from "@/lib/community/notifications";
import { kpiDays, kpiFrom } from "@/lib/kpi";

/**
 * Numeri della dashboard privata (22/10/2026): iscrizioni, download del tracker e mazzi creati per giorno di Roma, da
 * `?from=aaaa-mm-gg` (di base il 15/09/2026) a oggi. Solo con `Authorization: Bearer <CRON_SECRET>`: senza segreto
 * configurato `skipped`, con il segreto sbagliato 401 (prima di toccare il database), prima della migrazione
 * `unavailable`. Solo conteggi, mai righe, nomi o id; mai in cache, mai indicizzata. La chiama Claude per aggiornare la
 * dashboard su claude.ai (src/lib/kpi.ts).
 */
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store", "x-robots-tag": "noindex" };

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < CRON_SECRET_MIN) return NextResponse.json({ ok: false, skipped: "no_secret" }, { headers });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
  const client = supabaseAnon();
  if (!client) return NextResponse.json({ ok: false, skipped: "no_community" }, { headers });
  const from = kpiFrom(request.nextUrl.searchParams.get("from"));
  const { data, error } = await client.rpc("kpi_daily", { p_key: secret, p_from: from });
  if (error) {
    const missing = error.code === "PGRST202" || error.code === "42883";
    if (!missing) console.error("[kpi] kpi_daily:", error.code ?? "", error.message);
    return NextResponse.json({ ok: false, error: missing ? "unavailable" : "db" }, { status: missing ? 200 : 503, headers });
  }
  return NextResponse.json({ ok: true, timezone: "Europe/Rome", from, generatedAt: new Date().toISOString(), days: kpiDays(data) }, { headers });
}
