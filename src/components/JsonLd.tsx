import { siteUrl } from "@/lib/i18n";

type Json = Record<string, unknown>;

/**
 * Convenzione degli `@id`, uguale per tutti i nodi:
 * - entità del sito, una sola per tutto il dominio: `${siteUrl}/#<nome>` (organization, origins-tcg);
 * - nodi legati a una pagina: `<indirizzo della pagina>#<nome>` (website, collection, person).
 * Chi ha bisogno di puntare a un'entità del sito scrive `{ "@id": organizationId }` o
 * `{ "@id": videoGameId }`: mai una copia dell'oggetto, altrimenti nascono entità duplicate.
 */
export const organizationId = `${siteUrl}/#organization`;
export const videoGameId = `${siteUrl}/#origins-tcg`;

/** Dati strutturati schema.org inline (JSON-LD). Il `<` viene escapato per non chiudere lo script. */
export function JsonLd({ data }: { data: Json | Json[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function breadcrumbs(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
  };
}

export const organization: Json = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId,
  name: "OriginsMeta",
  url: siteUrl,
  // Logo di OriginsMeta, non di Koin: i dati strutturati dichiarano l'identità del sito.
  logo: `${siteUrl}/media/originsmeta-icon.png`,
  email: "staff@originsmeta.com",
  description: "Unofficial Origins TCG companion: news, tier list, guides, card database, decks and tournament calendar. In English and Italian.",
  // Mese in cui è nato il sito.
  foundingDate: "2026-09",
  knowsAbout: ["Origins TCG", "Koin Games", "digital collectible card games"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "editorial",
    email: "staff@originsmeta.com",
    availableLanguage: ["en", "it"],
  },
};

/**
 * Il gioco di cui parla il sito, come entità unica riusata da tutte le pagine con `about`.
 * Solo fatti già pubblicati sul sito (fonti: pagina Steam ufficiale, origins-tcg.com, guide):
 * niente date di uscita non confermate e nessun logo o icona di Koin Games, che non è il nostro marchio.
 */
export const videoGame: Json = {
  "@context": "https://schema.org",
  "@type": ["VideoGame", "Game"],
  "@id": videoGameId,
  name: "Origins TCG",
  description:
    "Digital trading card game by Koin Games: public-domain legends reimagined in one original world, and a free-to-compete promise — every competitive card is earned by playing.",
  url: "https://origins-tcg.com/",
  gamePlatform: ["PC", "Steam"],
  genre: ["Trading card game", "Digital collectible card game"],
  publisher: { "@type": "Organization", name: "Koin Games", url: "https://koingames.io" },
  // Gli stessi indirizzi ufficiali del footer (`officialLinks`).
  sameAs: ["https://store.steampowered.com/app/4429430/Origins_TCG/", "https://origins-tcg.com/"],
};

/**
 * Nodo Person per chi firma i contenuti, a partire da un autore di `src/lib/data/authors.ts`.
 * I campi tradotti arrivano già nella lingua della pagina (`role` da `role[locale]`, `description`
 * da `tagline[locale]`); `url` è la pagina autore (percorso localizzato o indirizzo assoluto),
 * `email` e `sameAs` si ricavano da `links` (il `mailto:` fa l'email, gli http(s) i `sameAs`).
 * Stessa forma di `collectionPage`: `@id` legato alla pagina (`<url>#person`), campi facoltativi
 * aggiunti solo se valorizzati e rimandi alle entità del sito per `@id` (`organizationId`).
 */
export function person(author: {
  slug: string;
  name: string;
  alternateName?: string;
  role?: string;
  url?: string;
  description?: string;
  knowsAbout?: string[];
  email?: string;
  sameAs?: string[];
}): Json {
  const url = author.url ? (author.url.startsWith("http") ? author.url : `${siteUrl}${author.url}`) : undefined;
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": url ? `${url}#person` : `${siteUrl}/#person-${author.slug}`,
    name: author.name,
    worksFor: { "@id": organizationId },
  };
  if (author.alternateName && author.alternateName !== author.name) node.alternateName = author.alternateName;
  if (url) {
    node.url = url;
    node.mainEntityOfPage = url;
  }
  if (author.description) node.description = author.description;
  if (author.role) node.jobTitle = author.role;
  if (author.knowsAbout?.length) node.knowsAbout = author.knowsAbout;
  if (author.email) node.email = author.email;
  if (author.sameAs?.length) node.sameAs = author.sameAs;
  return node;
}

/**
 * Pagina lista (carte, mazzi, guide…): CollectionPage con dentro l'ItemList delle voci.
 * `path` e i `path` delle voci sono già localizzati, come li produce `href(locale, …)`;
 * `about` è l'`@id` dell'entità di cui parla la lista: di norma `videoGameId`, mai una copia
 * dell'oggetto VideoGame (una seconda copia sarebbe una seconda entità per lo stesso gioco).
 */
export function collectionPage({
  locale,
  path,
  name,
  description,
  items,
  about,
}: {
  locale: string;
  path: string;
  name: string;
  description: string;
  items: { name: string; path: string }[];
  about?: string;
}): Json {
  const url = `${siteUrl}${path}`;
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name,
    description,
    url,
    inLanguage: locale,
    isPartOf: { "@id": `${siteUrl}/${locale}#website` },
    publisher: { "@id": organizationId },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: `${siteUrl}${it.path}` })),
    },
  };
  if (about) node.about = { "@id": about };
  return node;
}

export function website(locale: string, description: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/${locale}#website`,
    name: "OriginsMeta",
    url: `${siteUrl}/${locale}`,
    inLanguage: locale,
    description,
    publisher: { "@id": organizationId },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/${locale}/cards?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}
