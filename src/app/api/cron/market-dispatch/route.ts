import { NextResponse } from "next/server";
import { CRON_SECRET_MIN, cronAuthorized } from "@/lib/community/notifications";
import { workflowDispatchRequest } from "@/lib/market/market";

/**
 * Avvia il giro del mercato su GitHub Actions (18/10/2026, Pierluigi: "si" alla proposta di avere i 10 minuti garantiti).
 * Steam risponde 429 ai server di Vercel, quindi il giro (scripts/market-collect.mjs) gira su GitHub; ma GitHub non
 * garantisce i giri programmati frequenti (ieri uno ogni 2 ore circa). Questa rotta la chiama il cron di Vercel ogni 10
 * minuti (vercel.json, `Authorization: Bearer <CRON_SECRET>`) e chiede a GitHub di avviare market-collect.yml su main
 * (`workflowDispatchRequest` in src/lib/market/market.ts). Variabile solo server su Vercel: GITHUB_DISPATCH_TOKEN, un token
 * fine-grained di GitHub con il solo permesso "Actions: Read and write" sul repository originsmeta (scade: va rinnovato).
 * Senza il token risponde `skipped` e restano i giri programmati di GitHub. Mai in cache.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const headers = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < CRON_SECRET_MIN) return NextResponse.json({ ok: false, skipped: "no_secret" }, { headers });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
  const token = process.env.GITHUB_DISPATCH_TOKEN?.trim() ?? "";
  if (!token) return NextResponse.json({ ok: false, skipped: "no_github_token" }, { headers });
  const { url, init } = workflowDispatchRequest(token);
  try {
    const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (res.status === 204) return NextResponse.json({ ok: true }, { headers });
    // 401/403: token scaduto o senza il permesso giusto; 404: token senza accesso al repository o lavoro non trovato
    const detail = (await res.text()).slice(0, 200);
    console.error("[market-dispatch]", res.status, detail);
    return NextResponse.json({ ok: false, error: `github_${res.status}` }, { status: 502, headers });
  } catch (error) {
    console.error("[market-dispatch]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "github_unreachable" }, { status: 502, headers });
  }
}
