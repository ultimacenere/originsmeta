import { NextResponse } from "next/server";
import { CHANNEL_RE } from "@/lib/twitchExt/jwt";
import { extHasDecks, extStateOf } from "@/lib/broadcast/live";
import { liveStateFromDb, publicBackend } from "@/lib/broadcast/liveServer";

/**
 * Estensione Twitch di Broadcasting OM (05/11/2026, twitch-broadcast/README.md): lo stato della regia collegata a un
 * canale, che l'estensione legge quando si apre (e quando PubSub dice di rileggerlo); poi gli aggiornamenti arrivano
 * con l'Extension PubSub. GET ?channel=<id del canale> → {id, v, at, s}: s è lo stato per l'estensione (giocatori, mazzi,
 * copie giocate) o null (canale non collegato, diretta spenta o senza mazzi). È quello che va in onda, quindi niente
 * JWT: la cache del CDN (2 secondi) vale per tutti gli spettatori del canale.
 */
export const dynamic = "force-dynamic";

const HEADERS = { "access-control-allow-origin": "*", "cache-control": "public, max-age=0, s-maxage=2, stale-while-revalidate=10" } as const;

export async function GET(request: Request) {
  const channel = new URL(request.url).searchParams.get("channel") ?? "";
  if (!CHANNEL_RE.test(channel)) return NextResponse.json({ error: "bad_request" }, { status: 400, headers: HEADERS });
  try {
    const row = await publicBackend().channelState(channel);
    const state = row ? liveStateFromDb(row.state) : null;
    const ext = state ? extStateOf(state) : null;
    return NextResponse.json({ id: row?.id ?? null, v: row?.version ?? 0, at: row?.updatedAt ?? null, s: ext && extHasDecks(ext) ? ext : null }, { headers: HEADERS });
  } catch {
    return NextResponse.json({ id: null, v: 0, at: null, s: null }, { headers: { ...HEADERS, "cache-control": "public, max-age=0, s-maxage=5" } });
  }
}
