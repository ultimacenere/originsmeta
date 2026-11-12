import { NextResponse } from "next/server";
import { isEventSlug, readPublicEvent } from "@/lib/event/server";

/**
 * Stato pubblico di un evento della community (10/11/2026): talent svelati, mazzi, ruota, turni, risultati, orologio del
 * giveaway, conteggi dei codici, foto e dirette Twitch dei talent. Lo rilegge ogni 10 secondi la pagina dell'evento (e
 * l'overlay per OBS): la CDN tiene la risposta 5 secondi, quindi al database arriva una lettura ogni 5 secondi per
 * regione qualunque sia il pubblico. L'orologio del giveaway si calcola nel browser da `state.giveaway` e da `now` (l'ora
 * del database), quindi i 5 secondi non spostano il countdown.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isEventSlug(slug)) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=60" } });
  try {
    const event = await readPublicEvent(slug, { fresh: true });
    if (!event) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "public, s-maxage=30" } });
    return NextResponse.json(event, { headers: { "Cache-Control": "public, max-age=0, s-maxage=5, stale-while-revalidate=10" } });
  } catch (error) {
    console.error("[event] stato:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
