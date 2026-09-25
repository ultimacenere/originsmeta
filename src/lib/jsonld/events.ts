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
 * `@id` di un evento del calendario, uno per lingua e legato alla sua scheda (/<lingua>/tournaments): lo stesso su
 * /tournaments, nella news delle sue regole e nella guida dedicata di quella lingua (che lo ripetono con `eventNode`).
 * Per lingua, e non unico come quello delle carte, perché il nodo porta nome, descrizione e indirizzo tradotti: un
 * `@id` comune alle tre lingue dava alla stessa entità tre nomi e tre `url` (revisione dell'integrazione dell'Ondata 2;
 * è l'errore che jsonld/card.ts ha tolto alle carte tenendo sull'entità unica solo i valori uguali in ogni lingua).
 */
export const eventId = (slug: string, locale: Locale): string => `${siteUrl}${href(locale, "/tournaments")}#event-${slug}`;

/**
 * `@id` dello Steam Next Fest, unico in tutte le lingue: il suo nodo (`festivalNode`) porta solo valori uguali ovunque
 * (nome ufficiale in inglese, date, Valve, indirizzo di Steam).
 */
export const festivalId = `${siteUrl}/#event-${steamNextFest.slug}`;

/** Lo Steam Next Fest come nodo (dentro `superEvent`): lo organizza Valve, non Koin Games. */
export function festivalNode(): Json {
  return {
    "@type": "Event",
    "@id": festivalId,
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
    "@id": eventId(e.slug, locale),
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
