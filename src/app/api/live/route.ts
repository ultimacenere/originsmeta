import { NextResponse } from "next/server";
import { liveStatus, twitchConfigured } from "@/lib/twitch";
import type { LiveResponse } from "@/lib/twitchLive";

/**
 * Chi fra i creator è in diretta su Origins TCG (pacchetto CREATOR, 26/09/2026): {enabled, users: {<nome utente>:
 * {channel, viewers}}}. La chiede il browser (`LiveBadge`), una volta per pagina, come la striscia del calendario chiede
 * /api/calendar: le pagine (profili, directory, mazzi) restano ISR e non aspettano Twitch.
 *
 * Cache: la risposta si rigenera al massimo ogni 90 secondi (ISR della rotta) e la CDN la tiene 90 secondi, quindi a
 * Twitch arriva una richiesta ogni minuto e mezzo al massimo, qualunque sia il traffico. Senza TWITCH_CLIENT_ID e
 * TWITCH_CLIENT_SECRET risponde {enabled: false, users: {}}: nessun badge e nessun errore. Un guasto di Twitch o di
 * Supabase vale "nessuno in diretta" (lo si legge nei log), mai una pagina rotta.
 */
export const revalidate = 90;

export async function GET() {
  let body: LiveResponse;
  try {
    body = await liveStatus();
  } catch (error) {
    console.error("[live]", error instanceof Error ? error.message : error);
    body = { enabled: twitchConfigured(), users: {} };
  }
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=30, s-maxage=90, stale-while-revalidate=60" } });
}
