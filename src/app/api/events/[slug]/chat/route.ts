import { isEventSlug, readPublicEvent } from "@/lib/event/server";
import { formatRemaining, giveawayClock } from "@/lib/event/clock";
import { eventShortLink } from "@/lib/event/links";

/**
 * Comando di chat di un evento (10/11/2026), per Nightbot, StreamElements e Fossabot, come /api/chat/deck: una riga di
 * testo con dove è il giveaway adesso e quanto manca, più il link breve della pagina. Esempio per Nightbot:
 * !commands add !rumble $(urlfetch https://originsmeta.com/api/events/royale-rumble/chat)
 * La CDN tiene la risposta 5 secondi. Testo semplice, sotto i 400 caratteri (il limite dei bot).
 */
const HEADERS = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=5, stale-while-revalidate=10" };

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isEventSlug(slug)) return new Response("Evento non trovato.", { status: 404, headers: HEADERS });
  let event;
  try {
    event = await readPublicEvent(slug, { fresh: true, twitch: false });
  } catch {
    return new Response("La pagina dell'evento non risponde: riprova fra poco.", { status: 503, headers: { ...HEADERS, "Cache-Control": "no-store" } });
  }
  if (!event) return new Response("Evento non trovato.", { status: 404, headers: HEADERS });
  const link = eventShortLink(slug);
  const { config } = event;
  const now = Date.now();
  const c = giveawayClock(config.slots, event.state.giveaway, now);
  const where = (ch: string) => (ch ? `twitch.tv/${ch}` : "un canale da svelare");
  const packs = (n: number) => (n === 1 ? "1 pacchetto" : `${n} pacchetti`);
  let text: string;
  if (c.status === "running" && c.slot) {
    text = `Giveaway ora su ${where(c.slot.channel)}: scrivi ${config.keyword} in chat, mancano ${formatRemaining(c.remainingMs)} (${packs(c.slot.packs)}).${c.next ? ` Poi su ${where(c.next.slot.channel)}.` : ""} Info e codici: ${link}`;
  } else if (c.status === "paused" && c.slot) {
    text = `Giveaway in pausa su ${where(c.slot.channel)}: riparte a breve. Info e codici: ${link}`;
  } else if (c.status === "done") {
    text = `Il giveaway di ${config.name} è finito. Hai vinto un codice? Riscattalo su ${link}`;
  } else {
    const start = config.startsAt ? Date.parse(config.startsAt) : NaN;
    text =
      !Number.isNaN(start) && start > now
        ? `${config.name}: si parte tra ${formatRemaining(start - now)}. Giocatori, mazzi e giveaway: ${link}`
        : `${config.name}: il giveaway parte durante la diretta, la pagina dice dove e quanto manca: ${link}`;
  }
  return new Response(text.slice(0, 380), { headers: HEADERS });
}
