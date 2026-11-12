import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { deckCards, readPublicEvent } from "@/lib/event/server";
import { EVENT_LOCALE, eventPath } from "@/lib/event/links";
import { EVENT_LOOKS, LOOK_NAMES, isEventLook } from "@/lib/event/looks";
import { EventShow } from "@/components/event/EventShow";

/*
  PROVE DI GRAFICA della pagina di un evento (11/11/2026, Pierluigi: "rendiamola più bella e divertente, fai qualche
  tentativo"): /it/events/<slug>/prova/<a|b|c> mostra la stessa pagina con uno dei tre tagli (Locandina, Ruota, Arcade)
  e una barra in basso per passare dall'uno all'altro. Pagina provvisoria, noindex: quando Pierluigi sceglie, il taglio
  scelto diventa la pagina vera e questa cartella si cancella.
*/

export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = { title: "Prove di grafica dell'evento", robots: { index: false, follow: false } };

type Params = Promise<{ locale: string; slug: string; look: string }>;

export default async function EventLookPage({ params }: { params: Params }) {
  const { locale, slug, look } = await params;
  if (!isLocale(locale) || locale !== EVENT_LOCALE || !isEventLook(look)) notFound();
  const event = await readPublicEvent(slug);
  if (!event) notFound();
  const decks = await Promise.all(event.config.decks.map(async (d) => ({ deck: d, cards: await deckCards(d) })));
  return (
    <>
      <EventShow slug={slug} event={event} decks={decks} look={look} />
      <nav className="ev-switch" aria-label="Prove di grafica">
        <span>Prove</span>
        {EVENT_LOOKS.map((l) => (
          <a key={l} href={eventPath(slug, `/prova/${l}`)} aria-current={l === look ? "page" : undefined}>
            {l.toUpperCase()} · {LOOK_NAMES[l]}
          </a>
        ))}
        <a href={eventPath(slug)}>Oggi</a>
      </nav>
    </>
  );
}
