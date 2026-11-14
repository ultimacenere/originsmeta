import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/page";
import { deckCards, readPublicEvent } from "@/lib/event/server";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { EVENT_LOCALE, eventAnnounced, eventPath } from "@/lib/event/links";
import { totalPacks } from "@/lib/event/config";
import { EventShow } from "@/components/event/EventShow";

/*
  Pagina di un evento della community (10/11/2026): l'Attrix Showmatch dei creator italiani del 16/11/2026. Dalle note
  Granola "sito roadmap" del 10/11/2026: "Pagina unica (no click multipli), linkabile direttamente dal bot Twitch",
  talent con foto, bio e link (alcuni sfocati fino al reveal), mazzi con il codice da copiare e le facce dei giocatori
  assegnati, classifica svizzera, abbinamenti, countdown del giveaway e riscatto dei codici.
  Dal 14/11/2026 la pagina ha la grafica "Locandina" (EventShow; Pierluigi: "per la pagina pubblica importa la grafica
  locandina"): prima aveva le sezioni a pannelli del resto del sito.
  Solo in italiano (l'evento è dei creator italiani): le altre lingue rimandano qui. ISR ogni 60 secondi (svelamento dei
  talent, mazzi); quello che cambia durante la diretta (orologio, ruota, risultati, dirette Twitch) il browser lo
  rilegge da /api/events/<slug> ogni 10 secondi. Link breve: originsmeta.com/showmatch (next.config.ts).
  Online dal 12/11/2026 ma non annunciata: finché lo slug non è in EVENT_ANNOUNCED (links.ts) la pagina è noindex e
  nessun menu, calendario o sitemap la linka.
*/

export const revalidate = 60;
// generateStaticParams vuoto + dynamicParams (come le schede dei mazzi della community): senza, Next renderizzerebbe la
// pagina a ogni richiesta, e durante la diretta il pubblico la apre in tanti insieme. Le pagine nascono alla prima visita.
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || locale !== EVENT_LOCALE) return { robots: { index: false, follow: true } };
  const event = await readPublicEvent(slug, { twitch: false }).catch(() => null);
  if (!event) return { robots: { index: false, follow: true } };
  const packs = totalPacks(event.config.slots);
  const vars = { name: event.config.name, packs };
  return pageMeta(EVENT_LOCALE, `/events/${slug}`, fillEvent(L.meta.title, vars), fillEvent(packs ? L.meta.description : L.meta.descriptionNoPacks, vars), undefined, { languages: [EVENT_LOCALE], noindex: !eventAnnounced(slug) });
}

export default async function EventPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  if (locale !== EVENT_LOCALE) redirect(eventPath(slug));
  const event = await readPublicEvent(slug);
  if (!event) notFound();
  const decks = await Promise.all(event.config.decks.map(async (d) => ({ deck: d, cards: await deckCards(d) })));
  return <EventShow slug={slug} event={event} decks={decks} />;
}
