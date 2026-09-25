import { href, siteUrl, type Locale } from "@/lib/i18n";
import { organizationId, videoGameId } from "@/components/JsonLd";

/**
 * Dati strutturati della community: la scheda di un mazzo (Article) e la pagina pubblica di chi lo ha pubblicato
 * (ProfilePage), con la stessa persona nei due posti (Ondata 2 del piano SEO/GEO, rilievi DECKS-08, DECKS-10 e
 * GEO-14, 26/09/2026). Convenzione degli `@id` quella di `src/components/JsonLd.tsx`: i nodi legati a una pagina si
 * chiamano `<indirizzo della pagina>#<nome>`, e alle entità del sito (organizzazione, gioco) si rimanda per `@id`.
 *
 * Prima l'autore del mazzo era `{ "@type": "Person", name }` senza url né `@id`: nel grafo non era la persona del
 * suo profilo, e i mazzi di Davdas non erano collegati alla sua pagina autore. Ora:
 * - l'autore è un Person con `@id` stabile `<…>/u/<username>#person` e `url` del profilo, lo stesso nodo che il
 *   profilo dichiara come `mainEntity`;
 * - se `src/lib/data/authors.ts` dichiara che quei mazzi li ha pubblicati un autore editoriale (`communityDecks`), il
 *   Person ha `sameAs` verso la pagina /authors/<slug>: è la pagina che dice chi è quella persona. Nessun legame che
 *   i dati non dicano;
 * - l'Article parla del gioco e della Leggendaria (`about`) e nomina le carte del mazzo (`mentions`), con gli stessi
 *   `@id` delle schede carta (`<…>/cards/<slug>#card`).
 */

type Json = Record<string, unknown>;

/** `@id` del Person di un iscritto: lo stesso sulla scheda dei suoi mazzi e sulla sua pagina /u/<username>. */
export function communityPersonId(locale: Locale, username: string): string {
  return `${siteUrl}${href(locale, `/u/${username}`)}#person`;
}

/** `@id` del nodo di una scheda carta (lo dichiara la pagina /cards/<slug>). */
export function cardNodeId(locale: Locale, slug: string): string {
  return `${siteUrl}${href(locale, `/cards/${slug}`)}#card`;
}

/** Autore editoriale collegato a un account (vedi `editorialAuthor` in src/lib/community/deckQuality.ts). */
export type EditorialLink = { slug: string; name: string };

/** Person di un iscritto. Senza nome utente (profilo incompleto) resta il solo nome, senza `@id` inventato. */
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
  if (!username) return { "@type": "Person", name };
  const node: Json = {
    "@type": "Person",
    "@id": communityPersonId(locale, username),
    name,
    url: `${siteUrl}${href(locale, `/u/${username}`)}`,
    ...extra,
  };
  if (editorial) node.sameAs = [`${siteUrl}${href(locale, `/authors/${editorial.slug}`)}`];
  return node;
}

/** Una carta citata dal mazzo: rimando al nodo della sua scheda, con nome e indirizzo per chi non segue gli `@id`. */
function cardRef(locale: Locale, card: { slug: string; name: string }): Json {
  return { "@type": "CreativeWork", "@id": cardNodeId(locale, card.slug), name: card.name, url: `${siteUrl}${href(locale, `/cards/${card.slug}`)}` };
}

/**
 * Article della scheda di un mazzo della community.
 *
 * `headline` è il title della SERP, lo stesso testo del `<title>` (`pageTitle(deckTitle(…))`), così motori e
 * assistenti leggono lo stesso nome della pagina.
 *
 * Niente `aggregateRating`, per scelta (26/09/2026). Google mostra le stelline solo su pochi tipi (Product, Recipe,
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
  legendary?: { slug: string; name: string };
  /** le carte base del mazzo che hanno una scheda, nell'ordine del mazzo */
  cards: readonly { slug: string; name: string }[];
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
 * ProfilePage della pagina pubblica di un iscritto: `mainEntity` è lo stesso Person della firma dei suoi mazzi, con
 * immagine, data di iscrizione e numero di mazzi pubblicati (`agentInteractionStatistic`, WriteAction), i campi che
 * Google legge sui profili (documentazione "Profile page structured data").
 */
export function profilePage({
  locale,
  pageUrl,
  person,
  created,
  decks,
}: {
  locale: Locale;
  pageUrl: string;
  person: Json;
  created?: string;
  decks: number;
}): Json {
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${pageUrl}#profile`,
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
