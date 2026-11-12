import { readPublicEvent } from "@/lib/event/server";
import { eventLabels as L } from "@/lib/event/labels";
import { EventLiveProvider } from "@/components/event/EventLive";
import { EventClockOverlay } from "@/components/event/EventClock";

/**
 * Overlay per OBS del giveaway di un evento (10/11/2026): /overlay/event/<slug>, sorgente browser con sfondo
 * trasparente (layout di /overlay). Dalle note: il countdown "Ritagliabile come overlay OBS dai creator (o fornire
 * direttamente l'URL per OBS)": qui l'indirizzo da dare ai creator, con il canale del giveaway attivo, il tempo che
 * resta, il comando da scrivere e il prossimo canale. Riletto ogni 10 secondi come la pagina; il layout ricarica
 * comunque la pagina ogni minuto.
 */
export default async function EventOverlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let event = null;
  try {
    event = await readPublicEvent(slug, { fresh: true });
  } catch (error) {
    console.error("[event] overlay:", error instanceof Error ? error.message : error);
  }
  if (!event) {
    return (
      <main lang="it" className="p-3">
        <p className="inline-block rounded-xl border-2 border-sky bg-night/90 px-4 py-2 font-display text-lg font-bold text-chalk">Evento non trovato · {L.overlay.unofficial}</p>
      </main>
    );
  }
  return (
    <main lang="it">
      <EventLiveProvider slug={slug} initial={event}>
        <EventClockOverlay />
      </EventLiveProvider>
    </main>
  );
}
