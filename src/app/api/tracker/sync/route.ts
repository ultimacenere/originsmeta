import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/public";
import { UPLOAD_LIMITS, isUpload, type TrackerUpload } from "@/lib/tracker/upload";
import { enrichUpload, siteEnrichDeps } from "@/lib/tracker/enrich";
import { TRACKER_HEADERS, bearerToken, dbErrorCode, readJsonBody, trackerFail } from "@/lib/tracker/http";

/**
 * Partite dall'app OriginsMeta Tracker (tracker/overlay, Fase 3, 30/09/2026; docs/tracker.md).
 *
 * POST {matches: […]} con "Authorization: Bearer <token>" → {added, received, rejected}. Al massimo 50 partite per
 * chiamata; ognuna deve avere la forma di `isUpload` (src/lib/tracker/upload.ts: dell'avversario solo la Leggendaria e
 * le carte giocate, mai nomi, id, rank dell'avversario né segnale bot), le altre si contano in `rejected` e non si
 * riprovano. Il sito aggiunge a ogni partita la patch in vigore alla fine e l'archetipo del mazzo (enrich.ts), poi la
 * funzione tracker_submit del blocco TRACKER la scrive per l'utente del token, una volta per impronta (500 al giorno).
 * Con `matches: []` fa solo da controllo del token (e aggiorna "ultimo invio" del PC).
 *
 * Errori: {error: <codice>} (invalid_token 401: l'app si scollega; too_many_matches 429: l'app riprova più tardi;
 * unavailable 503 prima della migrazione). Mai in cache, client anonimo senza cache dei dati, niente cookie.
 */
export const dynamic = "force-dynamic";

/** 50 partite con tutte le giocate stanno ampiamente sotto questo tetto (una partita vera pesa pochi KB). */
const MAX_BODY = 1024 * 1024;

export async function POST(request: Request) {
  const db = supabaseAnon();
  if (!db) return trackerFail("unavailable");
  const token = bearerToken(request);
  if (!token) return trackerFail("invalid_token");
  const body = await readJsonBody(request, MAX_BODY);
  if (!body.ok || typeof body.value !== "object" || body.value === null) return trackerFail("bad_request");
  const list = (body.value as { matches?: unknown }).matches;
  if (!Array.isArray(list) || list.length > UPLOAD_LIMITS.batch) return trackerFail("invalid_matches");

  const now = Date.now();
  const valid = list.filter((m): m is TrackerUpload => isUpload(m, now));
  const rows = valid.map((u) => enrichUpload(u, siteEnrichDeps, now));
  const { data, error } = await db.rpc("tracker_submit", { p_token: token, p_matches: rows });
  if (error) {
    const reason = dbErrorCode(error);
    if (reason === "error") console.error("[tracker] sync:", error.message);
    return trackerFail(reason);
  }
  return NextResponse.json({ added: typeof data === "number" ? data : 0, received: list.length, rejected: list.length - valid.length }, { headers: TRACKER_HEADERS });
}
