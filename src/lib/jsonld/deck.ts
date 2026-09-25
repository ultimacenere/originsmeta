import { href, siteUrl, type Locale } from "@/lib/i18n";
import { organizationId, videoGameId } from "@/components/JsonLd";

/**
 * Dati strutturati della community: la scheda di un mazzo (Article) e la pagina pubblica di chi lo ha pubblicato
 * (ProfilePage), con la stessa persona nei due posti (Ondata 2 del piano SEO/GEO, rilievi DECKS-08, DECKS-10 e
 * GEO-14, 25/09/2026). Il modulo legge da `src/components/JsonLd.tsx` solo gli `@id` delle entità del sito.
 *
 * Convenzione degli `@id` quella del pacchetto LD della stessa ondata (src/lib/jsonld/entities.ts, TOOL-09): le entità
 * reali hanno un `@id` unico per tutto il dominio e per tutte le lingue, `${siteUrl}/#<nome>`; i nodi legati a una
 * pagina si chiamano `<indirizzo della pagina>#<nome>`.
 * - Autore editoriale (authors.ts lo lega all'account, `editorialAuthor`): è la Person della sua pagina autore,
 *   `${siteUrl}/#person-<slug>` (`personId` di LD), con nome e pagina autore come nel `personRef` delle news e delle
 *   guide. Nessun `sameAs` verso /authors: `sameAs` serve per i profili fuori dal sito, e due nodi della stessa persona
 *   si uniscono con lo stesso `@id` (verificatore di DECKS-10).
 * - Iscritto: `${siteUrl}/#user-<nome utente>`, uno solo per le tre lingue (prima `…/<lingua>/u/<nome>#person`, tre
 *   entità per la stessa persona), con `url` del profilo nella lingua della pagina.
 * - Carte: lo stesso `@id` della scheda carta, unico per le tre lingue (`${siteUrl}/#card-<ID ufficiale>`, o lo slug
 *   senza ID: `cardEntityId` del pacchetto CARDS in src/lib/jsonld/card.ts).
 * `personId` e `cardEntityId` qui sotto ripetono le formule di quei due moduli, che su questo ramo non ci sono ancora:
 * dopo l'integrazione si importano da lì (note del pacchetto DECKS).
 */

type Json = Record<string, unknown>;

/** `@id` della Person di un autore editoriale: stessa formula di `personId` in src/lib/jsonld/entities.ts (pacchetto LD). */
const personId = (slug: string): string => `${siteUrl}/#person-${slug}`;

/** `@id` di un iscritto della community senza pagina autore: uno per tutte le lingue, come le altre entità del sito. */
const memberId = (username: string): string => `${siteUrl}/#user-${username}`;

/** `@id` di una carta: stessa formula di `cardEntityId` in src/lib/jsonld/card.ts (pacchetto CARDS). */
const cardEntityId = (card: { key?: string; slug: string }): string => `${siteUrl}/#card-${card.key ?? card.slug}`;

/** Autore editoriale collegato a un account (vedi `editorialAuthor` in src/lib/community/deckQuality.ts). */
export type EditorialLink = { slug: string; name: string };

/**
 * Person di chi ha pubblicato un mazzo, la stessa sulla scheda dei suoi mazzi e sulla sua pagina /u/<username>.
 * Con un autore editoriale è la Person della pagina autore (`@id`, nome completo e `url` di /authors/<slug>, come il
 * `personRef` di LD); altrimenti quella dell'iscritto, con l'`url` del suo profilo. Senza nome utente (profilo
 * incompleto) resta il solo nome, senza `@id` inventato.
 */
export function communityPerson({
  locale,
  username,
  name,
  editorial,
  extra,
}: {
  locale: Locale;
  username: string | null | undefined;
  name: string;
  editorial?: EditorialLink;
  /** campi in più della sola pagina profilo (alternateName, identifier, image…) */
  extra?: Json;
}): Json {
  if (editorial) {
    return { "@type": "Person", "@id": personId(editorial.slug), name: editorial.name, url: `${siteUrl}${href(locale, `/authors/${editorial.slug}`)}`, ...extra };
  }
  if (!username) return { "@type": "Person", name };
  return { "@type": "Person", "@id": memberId(username), name, url: `${siteUrl}${href(locale, `/u/${username}`)}`, ...extra };
}

/** Una carta citata dal mazzo: rimando all'entità della sua scheda, con nome e indirizzo per chi non segue gli `@id`. */
function cardRef(locale: Locale, card: { slug: string; key?: string; name: string }): Json {
  return { "@type": "CreativeWork", "@id": cardEntityId(card), name: card.name, url: `${siteUrl}${href(locale, `/cards/${card.slug}`)}` };
}

/**
 * Article della scheda di un mazzo della community.
 *
 * `headline` è il title della SERP, lo stesso testo del `<title>` (`pageTitle(deckTitle(…))`), così motori e
 * assistenti leggono lo stesso nome della pagina.
 *
 * Niente `aggregateRating`, per scelta (25/09/2026). Google mostra le stelline solo su pochi tipi (Product, Recipe,
 * Game, SoftwareApplication, Book, Course, Event, LocalBusiness, Movie…): su un Article il voto non produce nessun
 * rich result. Spostarlo su Product o Game vorrebbe dire dichiarare che un elenco di carte scritto da un giocatore è un
 * prodotto o un gioco, cioè dati strutturati che non descrivono la pagina, contro le linee guida. Il voto resta dove
 * serve davvero: visibile nella pagina (stelle, media e numero di voti), che è anche il testo che gli assistenti citano.
 */
export function deckArticle({
  locale,
  pageUrl,
  headline,
  description,
  published,
  modified,
  image,
  author,
  legendary,
  cards,
}: {
  locale: Locale;
  pageUrl: string;
  headline: string;
  description: string;
  published: string;
  modified: string;
  image: string;
  author: Json;
  /** la Leggendaria, quando è una carta del nostro database (una carta scritta a mano non ha una scheda) */
  legendary?: { slug: string; key?: string; name: string };
  /** le carte base del mazzo che hanno una scheda, nell'ordine del mazzo */
  cards: readonly { slug: string; key?: string; name: string }[];
}): Json {
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline,
    description,
    // Lingua del documento, non del testo dell'autore: la pagina /en resta una pagina inglese.
    inLanguage: locale,
    datePublished: published,
    dateModified: modified,
    image,
    author,
    publisher: { "@id": organizationId },
    mainEntityOfPage: pageUrl,
    // La scheda fa parte dei mazzi del sito: la CollectionPage di /decks (collectionPage() in JsonLd.tsx).
    isPartOf: { "@id": `${siteUrl}${href(locale, "/decks")}#collection` },
    // Il gioco resta l'entità unica del layout radice (una copia in linea creerebbe un secondo "Origins TCG"); la
    // Leggendaria è l'argomento del mazzo, le altre carte sono nominate.
    about: legendary ? [{ "@id": videoGameId }, cardRef(locale, legendary)] : { "@id": videoGameId },
  };
  if (cards.length) node.mentions = cards.map((c) => cardRef(locale, c));
  return node;
}

/**
 * ProfilePage della pagina pubblica di un iscritto (`<indirizzo>#page`, come le pagine autore di LD): `mainEntity` è
 * la stessa Person della firma dei suoi mazzi, con immagine, data di iscrizione e numero di mazzi pubblicati
 * (`agentInteractionStatistic`, WriteAction), i campi che Google legge sui profili (documentazione "Profile page
 * structured data"). Si chiama così, e non `profilePage`, per non confondersi con il `profilePage` delle pagine autore
 * che JsonLd.tsx riesporta dal pacchetto LD.
 */
export function communityProfilePage({
  locale,
  pageUrl,
  name,
  person,
  created,
  decks,
}: {
  locale: Locale;
  pageUrl: string;
  name: string;
  person: Json;
  created?: string;
  decks: number;
}): Json {
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${pageUrl}#page`,
    name,
    url: pageUrl,
    inLanguage: locale,
    isPartOf: { "@id": `${siteUrl}/${locale}#website` },
    publisher: { "@id": organizationId },
    mainEntity: {
      ...person,
      agentInteractionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/WriteAction", userInteractionCount: decks },
    },
  };
  if (created) node.dateCreated = created;
  return node;
}
