import { href, siteUrl, type Locale } from "../i18n";
import { steamNextFest, type Event } from "../data/events";
import { FREE_OFFER_CURRENCY, koinGamesRef, videoGameId, type Json } from "./entities";

/*
  Eventi del calendario come dati strutturati (schema.org Event), rilievo GEO-09 dell'Ondata 2 (25/09/2026). Prima ogni
  evento ufficiale aveva come organizzatore un "Koin Games" anonimo con l'indirizzo di origins-tcg.com (e il festival
  delle demo sembrava loro), date senza orario e og.jpg come immagine. Ora: nome ufficiale, orario con fuso quando la
  fonte lo dà (`ld.startAt` in events.ts), Koin Games per `@id`, Valve come organizzatore del festival, l'immagine
  dell'evento dal materiale ufficiale. Funzioni pure, provate da src/lib/jsonld/jsonld.test.ts.
*/

const ONLINE = "https://schema.org/OnlineEventAttendanceMode";
const SCHEDULED = "https://schema.org/EventScheduled";

/**
 * Un evento è una sola entità in tutte le lingue: lo stesso `@id` su /tournaments, nella news delle sue regole e nella
 * guida dedicata (che lo possono ripetere con `eventNode`).
 */
export const eventId = (slug: string): string => `${siteUrl}/#event-${slug}`;

/** Lo Steam Next Fest come nodo (dentro `superEvent`): lo organizza Valve, non Koin Games. */
export function festivalNode(): Json {
  return {
    "@type": "Event",
    "@id": eventId(steamNextFest.slug),
    name: steamNextFest.name,
    startDate: steamNextFest.startAt,
    endDate: steamNextFest.end,
    eventAttendanceMode: ONLINE,
    eventStatus: SCHEDULED,
    location: { "@type": "VirtualLocation", url: steamNextFest.url },
    organizer: { "@type": "Organization", name: steamNextFest.organizer.name, url: steamNextFest.organizer.url },
    url: steamNextFest.url,
  };
}

/**
 * Nodo Event di un evento di events.ts, nella lingua della pagina. `url` è la scheda dell'evento su /tournaments
 * (l'ancora con lo slug); il luogo è online, all'indirizzo dell'iscrizione o della fonte. Gli eventi ufficiali li
 * organizza Koin Games; per gli altri l'organizzatore non si scrive finché non lo sappiamo.
 */
export function eventNode(e: Event, locale: Locale): Json {
  const ld = e.ld ?? {};
  const start = ld.startAt ?? e.start;
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": eventId(e.slug),
    name: ld.name?.[locale] ?? e.title[locale],
  };
  if (ld.alternateName) node.alternateName = ld.alternateName[locale];
  Object.assign(node, {
    description: e.text[locale],
    startDate: start,
    endDate: e.end ?? start,
    eventAttendanceMode: ONLINE,
    eventStatus: SCHEDULED,
    location: { "@type": "VirtualLocation", url: e.signup?.url ?? e.source ?? `${siteUrl}${href(locale, "/tournaments")}` },
    url: `${siteUrl}${href(locale, "/tournaments")}#${e.slug}`,
    image: `${siteUrl}${ld.image ?? "/media/og.jpg"}`,
    about: { "@id": videoGameId },
  });
  if (e.official) node.organizer = koinGamesRef;
  if (ld.free) {
    node.isAccessibleForFree = true;
    if (e.signup) node.offers = { "@type": "Offer", price: "0", priceCurrency: FREE_OFFER_CURRENCY, url: e.signup.url };
  }
  // Una regola sola per gli eventi di Koin che si tengono dentro lo Steam Next Fest (la classificata nella demo e la
  // Crimson Cup): il festival è il `superEvent`, l'organizzatore resta Koin Games.
  if (ld.festival) node.superEvent = festivalNode();
  return node;
}
