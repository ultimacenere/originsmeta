import { NextResponse } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/env";
import { CRON_SECRET_MIN, cronAuthorized } from "@/lib/community/notifications";
import { collectMarket } from "@/lib/market/collect";

/**
 * Prezzi del mercato di Steam (17/10/2026, tracker dei prezzi): a ogni giro del cron di Vercel (vercel.json, ogni 10
 * minuti, `Authorization: Bearer <CRON_SECRET>`) legge le pagine di market/search/render per Origins TCG e per la
 * controfigura e le salva con market_ingest (src/lib/market/collect.ts, blocco MERCATO di supabase/schema.sql). Stesse
 * regole di /api/cron/live: senza CRON_SECRET risponde `skipped`, con il segreto sbagliato 401, prima della migrazione
 * `unavailable`. Mai in cache. Ha fino a 120 secondi: il raccoglitore se ne prende 100.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const headers = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < CRON_SECRET_MIN) return NextResponse.json({ ok: false, skipped: "no_secret" }, { headers });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
  if (!supabaseEnabled) return NextResponse.json({ ok: false, skipped: "no_community" }, { headers });
  const result = await collectMarket(secret, 100_000);
  return NextResponse.json(result, { headers });
}
