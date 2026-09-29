/**
 * Aiuti comuni delle rotte dell'app OriginsMeta Tracker (/api/tracker/link e /api/tracker/sync, 30/09/2026): corpo
 * JSON con un tetto, token dall'intestazione Authorization, errori del database in codici del tracker.
 */
import { NextResponse } from "next/server";
import { isTrackerToken, trackerErrorCode, trackerErrorStatus, type TrackerError } from "./upload";

/** Mai in cache: ogni risposta dipende dal token o dal codice della richiesta. */
export const TRACKER_HEADERS = { "cache-control": "no-store" } as const;

export function trackerFail(code: TrackerError) {
  return NextResponse.json({ error: code }, { status: trackerErrorStatus(code), headers: TRACKER_HEADERS });
}

/** Il corpo JSON della richiesta, se non supera `maxBytes`. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false };
  const text = await request.text();
  if (text.length > maxBytes) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/** Il token dell'app da "Authorization: Bearer omt_…", o null. */
export function bearerToken(request: Request): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "");
  return m && isTrackerToken(m[1]) ? m[1] : null;
}

/** Errore di una chiamata al database → codice del tracker; funzione o tabella che mancano (migrazione non fatta) = "unavailable". */
export function dbErrorCode(error: { code?: string | null; message?: string | null }): TrackerError {
  if (["PGRST202", "42883", "42P01", "42703"].includes(error.code ?? "")) return "unavailable";
  return trackerErrorCode(error.message);
}
