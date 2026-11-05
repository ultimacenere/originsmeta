import { NextResponse } from "next/server";
import { isLiveId } from "@/lib/broadcast/live";
import { liveStateFromDb, publicBackend } from "@/lib/broadcast/liveServer";

/**
 * Broadcasting OM in diretta (05/11/2026): lo stato di una diretta per l'overlay di OBS (/broadcast/live?id=…), che la
 * rilegge ogni secondo e mezzo. GET ?id=<id della diretta> → {state, version, at}: state null se la diretta è spenta
 * o ferma da 18 ore; {state: null, version: 0} se l'id non esiste. È quello che va in onda: niente accesso, e la cache
 * del CDN (1 secondo) vale per tutte le sorgenti della stessa diretta.
 */
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "public, max-age=0, s-maxage=1, stale-while-revalidate=2" } as const;

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!isLiveId(id)) return NextResponse.json({ error: "bad_request" }, { status: 400, headers: { "cache-control": "no-store" } });
  try {
    const row = await publicBackend().liveState(id);
    if (!row) return NextResponse.json({ state: null, version: 0, at: null }, { headers: HEADERS });
    return NextResponse.json({ state: liveStateFromDb(row.state), version: row.version, at: row.updatedAt }, { headers: HEADERS });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
