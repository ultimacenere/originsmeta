import { NextResponse } from "next/server";
import { supabaseAnon } from "@/lib/supabase/public";
import { normalizeLinkCode } from "@/lib/tracker/upload";
import { TRACKER_HEADERS, bearerToken, dbErrorCode, readJsonBody, trackerFail } from "@/lib/tracker/http";

/**
 * Collegamento dell'app OriginsMeta Tracker all'account (tracker/overlay, Fase 3, 30/09/2026; docs/tracker.md).
 *
 * POST {code, name} → {token, username}: l'app scambia il codice monouso creato in /account/tracker con il suo token
 * (funzione tracker_link_claim del blocco TRACKER di supabase/schema.sql). Il token esce solo qui, una volta: l'app lo
 * cifra sul PC; il database ne tiene l'impronta. `name` è il nome del PC, che vede solo il proprietario (40 caratteri).
 * DELETE con "Authorization: Bearer <token>" → {ok}: l'app si scollega da sola (tracker_device_unlink).
 *
 * Niente cookie né sessione del sito (l'app non ne ha), mai in cache, client anonimo senza cache dei dati. Errori:
 * {error: <codice>} con lo stato di `trackerErrorStatus` (invalid_code 400, too_many_devices 409, …); con la
 * migrazione non ancora applicata 503 "unavailable".
 */
export const dynamic = "force-dynamic";

const MAX_BODY = 4096;

export async function POST(request: Request) {
  const db = supabaseAnon();
  if (!db) return trackerFail("unavailable");
  const body = await readJsonBody(request, MAX_BODY);
  const value = body.ok && typeof body.value === "object" && body.value !== null ? (body.value as { code?: unknown; name?: unknown }) : null;
  if (!value) return trackerFail("bad_request");
  const code = normalizeLinkCode(value.code);
  if (!code) return trackerFail("invalid_code");
  const name = typeof value.name === "string" ? value.name.slice(0, 40) : "";
  const { data, error } = await db.rpc("tracker_link_claim", { p_code: code, p_name: name });
  if (error) {
    const reason = dbErrorCode(error);
    if (reason === "error") console.error("[tracker] link:", error.message);
    return trackerFail(reason);
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.token) return trackerFail("error");
  return NextResponse.json({ token: row.token, username: row.username ?? null }, { headers: TRACKER_HEADERS });
}

export async function DELETE(request: Request) {
  const db = supabaseAnon();
  if (!db) return trackerFail("unavailable");
  const token = bearerToken(request);
  if (!token) return trackerFail("invalid_token");
  const { data, error } = await db.rpc("tracker_device_unlink", { p_token: token });
  if (error) {
    const reason = dbErrorCode(error);
    if (reason === "error") console.error("[tracker] unlink:", error.message);
    return trackerFail(reason);
  }
  return NextResponse.json({ ok: data === true }, { headers: TRACKER_HEADERS });
}
