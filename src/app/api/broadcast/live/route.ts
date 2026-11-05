import { after, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/tracker/http";
import { bcastExtConfig, LIVE_ERROR_STATUS, LiveError, liveStateFromRequest, pushToChannels, userBackend } from "@/lib/broadcast/liveServer";
import type { LiveInfoResponse } from "@/lib/broadcast/liveTypes";

/**
 * Broadcasting OM in diretta (05/11/2026, docs/broadcasting.md): la diretta della regia di chi ha fatto l'accesso.
 *
 * - GET → {username, live: {id, version, updatedAt, live, channels} | null, twitch}: com'è la diretta (non la crea).
 * - POST {state} → {id, version, at}: salva lo stato (pulito con sanitizeState, immagini caricate solo come
 *   "om:<impronta>", 8 KB al massimo), crea la diretta la prima volta e, dopo la risposta, manda la versione nuova
 *   agli spettatori dei canali Twitch collegati (Extension PubSub).
 * - DELETE → {version}: spegne la diretta (OBS e l'estensione non mostrano più niente).
 *
 * Errori: {error} con login 401, unavailable 503 (migrazione non fatta), too_fast 429, invalid 400, error 500.
 * Mai in cache.
 */
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "no-store" } as const;

function fail(e: unknown) {
  const code = e instanceof LiveError ? e.code : "error";
  if (!(e instanceof LiveError)) console.error("[broadcast-live]", e instanceof Error ? e.message : e);
  return NextResponse.json({ error: code }, { status: LIVE_ERROR_STATUS[code], headers: HEADERS });
}

export async function GET() {
  try {
    const user = await userBackend();
    const body: LiveInfoResponse = { username: user.username, live: await user.info(false), twitch: Boolean(bcastExtConfig()) };
    return NextResponse.json(body, { headers: HEADERS });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = await userBackend();
    const body = await readJsonBody(request, 16_384);
    const raw = body.ok && body.value && typeof body.value === "object" ? (body.value as { state?: unknown }).state : undefined;
    const state = raw && typeof raw === "object" ? liveStateFromRequest(raw) : null;
    if (!state) throw new LiveError("invalid");
    const saved = await user.save(state);
    const at = new Date().toISOString();
    if (saved.channels.length) after(() => pushToChannels(saved.channels, saved.id, saved.version, at, state));
    return NextResponse.json({ id: saved.id, version: saved.version, at }, { headers: HEADERS });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE() {
  try {
    const user = await userBackend();
    const cleared = await user.clear();
    const at = new Date().toISOString();
    if (cleared?.channels.length) after(() => pushToChannels(cleared.channels, cleared.id, cleared.version, at, null));
    return NextResponse.json({ version: cleared?.version ?? 0, at }, { headers: HEADERS });
  } catch (e) {
    return fail(e);
  }
}
