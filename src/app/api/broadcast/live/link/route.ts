import { NextResponse } from "next/server";
import { CHANNEL_RE } from "@/lib/twitchExt/jwt";
import { LIVE_ERROR_STATUS, LiveError, userBackend } from "@/lib/broadcast/liveServer";

/**
 * Broadcasting OM in diretta (05/11/2026): i canali Twitch della regia di chi ha fatto l'accesso.
 * - POST → {code}: codice monouso (10 minuti) da scrivere nella pagina di configurazione dell'estensione Twitch di
 *   Broadcasting OM sul canale da collegare (5 l'ora, lo dice il database).
 * - DELETE ?channel=<id> → {ok}: scollega un proprio canale.
 * Errori: {error} con login 401, unavailable 503, too_many 429. Mai in cache.
 */
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "no-store" } as const;

function fail(e: unknown) {
  const code = e instanceof LiveError ? e.code : "error";
  if (!(e instanceof LiveError)) console.error("[broadcast-live] link:", e instanceof Error ? e.message : e);
  return NextResponse.json({ error: code }, { status: LIVE_ERROR_STATUS[code], headers: HEADERS });
}

export async function POST() {
  try {
    const user = await userBackend();
    return NextResponse.json({ code: await user.linkCode() }, { headers: HEADERS });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const channel = new URL(request.url).searchParams.get("channel") ?? "";
    if (!CHANNEL_RE.test(channel)) throw new LiveError("invalid");
    const user = await userBackend();
    return NextResponse.json({ ok: await user.unlink(channel) }, { headers: HEADERS });
  } catch (e) {
    return fail(e);
  }
}
