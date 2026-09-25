import { siteUrl, type Locale } from "../i18n";
import { ORIGINSMETA_DISCORD } from "../discord";
// Il nucleo leggero degli autori, non authors.ts: il layout radice importa questo modulo, e authors.ts si porta dietro
// news e guide (circa 560 KB di sorgente) che al grafo del sito non servono.
import { founders } from "../data/authorsCore";

/*
  Dati strutturati del sito (schema.org, JSON-LD): le entità uniche e i costruttori dei nodi di pagina. Funzioni pure,
  senza JSX, così il grafo si prova con `node --test src/lib/jsonld/jsonld.test.ts`. Il componente che scrive lo
  <script> è in src/components/JsonLd.tsx, che riesporta tutto quello che sta qui: le pagine continuano a importare da
  "@/components/JsonLd".

  Ondata 2 del piano SEO/GEO (rilievi GEO-08, HOME-10, TOOL-09, 25/09/2026): un grafo solo, con le entità collegate per
  `@id` e mai copiate. OriginsMeta (chi scrive), Origins TCG (il gioco di cui si parla), Koin Games (chi lo fa e lo
  pubblica, un nodo nostro e non un oggetto anonimo ripetuto con indirizzi diversi) e una Person per ogni autore, uguale
  in tutte le lingue. Niente logo né icone di Koin Games: il materiale ufficiale non entra nell'identità del sito.
*/

/** Oggetto JSON-LD generico. */
export type Json = Record<string, unknown>;

/**
 * Convenzione degli `@id`, uguale per tutti i nodi:
 * - entità reali, una sola per tutto il dominio e per tutte le lingue: `${siteUrl}/#<nome>` (organization, origins-tcg,
 *   koin-games, person-<slug>, user-<username>, event-<slug>);
 * - nodi legati a una pagina: `<indirizzo della pagina>#<nome>` (website, collection, page, app).
 * Chi ha bisogno di puntare a un'entità scrive `{ "@id": organizationId }` (o `videoGameId`, `koinGamesId`,
 * `personId(slug)`, `memberId(username)`), o usa `personRef`/`memberRef`/`koinGamesRef` quando servono anche nome e
 * indirizzo sul posto: mai una copia dell'oggetto, altrimenti nascono entità duplicate. Le pagine non scrivono a mano
 * l'`@id` di una persona (un test lo controlla sotto src/app).
 */
export const organizationId = `${siteUrl}/#organization`;
export const videoGameId = `${siteUrl}/#origins-tcg`;
export const koinGamesId = `${siteUrl}/#koin-games`;

/**
 * Una persona è una sola in tutte le lingue (TOOL-09): prima l'`@id` era l'indirizzo della pagina autore nella lingua
 * (…/en/authors/davdas#person, …/it/…), cioè tre entità per la stessa persona. Pagina autore, firma delle news e delle
 * guide e profilo della community usano questo.
 */
export const personId = (slug: string): string => `${siteUrl}/#person-${slug}`;

/**
 * Un iscritto della community che non è un autore del sito: anche lui una persona sola in tutte le lingue, legata al
 * nome utente (la sua pagina è /<lingua>/u/<username>). Per un autore editoriale vale `personId` (authorByUsername).
 * È la formula che usano anche la firma dei mazzi e il profilo /u del pacchetto DECKS.
 */
export const memberId = (username: string): string => `${siteUrl}/#user-${username}`;

/**
 * Valuta delle offerte a prezzo 0 (strumenti gratuiti, iscrizioni gratuite a eventi e tornei): una sola in tutto il
 * sito, perché la stessa iscrizione gratuita non risulti in euro su una pagina e in dollari su un'altra. È quella che
 * /tier-list/create usava già.
 */
export const FREE_OFFER_CURRENCY = "EUR";

/** Il sito in una lingua (nodo WebSite del layout): lo usano `isPartOf` delle pagine. */
export const websiteId = (locale: Locale | string): string => `${siteUrl}/${locale}#website`;

/** Indirizzo assoluto da un percorso del sito ("/it/about") o da un indirizzo già completo. */
const absolute = (pathOrUrl: string): string => (pathOrUrl.startsWith("http") ? pathOrUrl : `${siteUrl}${pathOrUrl}`);

export function breadcrumbs(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
  };
}

/**
 * Koin Games come entità del grafo, con un `@id` nostro (un indirizzo sul loro dominio non lo controlliamo). La usano
 * `developer` e `publisher` del gioco e l'`organizer` degli eventi ufficiali; prima comparivano due oggetti anonimi,
 * uno con koingames.io e uno con origins-tcg.com. Solo fatti già scritti sul sito (llms.txt e guide: studio di Tampa,
 * in Florida, fondato nel 2021) e nessun logo.
 */
export const koinGames: Json = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": koinGamesId,
  name: "Koin Games",
  url: "https://koingames.io",
  sameAs: ["https://koingames.io"],
  foundingDate: "2021",
  address: { "@type": "PostalAddress", addressLocality: "Tampa", addressRegion: "FL", addressCountry: "US" },
};

/**
 * Rimando a Koin Games dentro un altro nodo (organizer di un Event): l'`@id` più nome e sito, che Google chiede
 * all'organizzatore anche quando il nodo completo sta in un altro blocco della pagina (quello del layout).
 */
export const koinGamesRef: Json = { "@type": "Organization", "@id": koinGamesId, name: "Koin Games", url: "https://koingames.io" };

/**
 * OriginsMeta. Fondatori dalle pagine autore (`founders` in authors.ts, ruolo "Founder"), con l'`@id` unico della
 * persona; `sameAs` è il nostro server Discord (src/lib/discord.ts), l'unico profilo ufficiale del sito fuori dal sito;
 * `publishingPrinciples` è la sezione di /about che spiega come verifichiamo i dati. La non affiliazione a Koin Games
 * sta anche nella descrizione: non si toglie mai.
 */
export const organization: Json = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId,
  name: "OriginsMeta",
  alternateName: "Origins Meta",
  url: siteUrl,
  // Logo di OriginsMeta, non di Koin: i dati strutturati dichiarano l'identità del sito. Dal 23/09/2026 è il
  // lettering nuovo, lo stesso dell'header e del footer; l'icona quadrata resta per la scheda del browser.
  logo: `${siteUrl}/media/logo-originsmeta.webp`,
  email: "staff@originsmeta.com",
  description:
    "Unofficial, independent fan site about Origins TCG, the digital card game by Koin Games: news, tier list, guides, card database, decks and tournament calendar, in English, Italian and Spanish. Not affiliated with Koin Games.",
  // Mese in cui è nato il sito.
  foundingDate: "2026-09",
  founder: founders.map((a) => ({ "@type": "Person", "@id": personId(a.slug), name: a.name })),
  knowsAbout: ["Origins TCG", "Koin Games", "digital collectible card games"],
  sameAs: [ORIGINSMETA_DISCORD],
  publishingPrinciples: `${siteUrl}/en/about#how-we-check`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "editorial",
    email: "staff@originsmeta.com",
    availableLanguage: ["en", "it", "es"],
  },
};

/**
 * Gli indirizzi ufficiali del gioco, gli stessi di `officialLinks` nel footer (Footer.tsx è un componente, qui non si
 * importa: il test controlla che i due elenchi restino uguali). La demo e il Discord ufficiale non ci sono: la prima è
 * un'altra app di Steam, il secondo è un invito, non un profilo.
 */
export const gameLinks = {
  steam: "https://store.steampowered.com/app/4429430/Origins_TCG/",
  site: "https://origins-tcg.com/",
  x: "https://x.com/origins_tcg",
  youtube: "https://www.youtube.com/@origins_tcg",
} as const;

/**
 * Il gioco di cui parla il sito, come entità unica riusata da tutte le pagine con `about`.
 * Solo fatti già pubblicati sul sito (fonti: pagina Steam ufficiale, origins-tcg.com, guide): niente date di uscita non
 * confermate e nessun logo o icona di Koin Games, che non è il nostro marchio. `alternateName` è la dicitura del logo
 * ufficiale; `disambiguatingDescription` separa il gioco da Riftbound: Origins, che riempie le ricerche con "Origins";
 * `inLanguage` sono le lingue della pagina Steam (inglese, francese, italiano, tedesco) più lo spagnolo, che la demo ha
 * dal 25/09/2026 (verificato nel gioco, guida play-the-demo).
 */
export const videoGame: Json = {
  "@context": "https://schema.org",
  "@type": ["VideoGame", "Game"],
  "@id": videoGameId,
  name: "Origins TCG",
  alternateName: "Origins Trading Card Game",
  description:
    "Digital trading card game by Koin Games: public-domain legends reimagined in one original world, and a free-to-compete promise — every competitive card is earned by playing.",
  disambiguatingDescription:
    "The digital trading card game by Koin Games, with a free demo on Steam; not to be confused with Riftbound: Origins, a set of the League of Legends trading card game.",
  url: gameLinks.site,
  gamePlatform: ["PC", "Steam"],
  genre: ["Trading card game", "Digital collectible card game"],
  inLanguage: ["en", "fr", "it", "de", "es"],
  developer: { "@id": koinGamesId },
  publisher: { "@id": koinGamesId },
  sameAs: [gameLinks.steam, gameLinks.site, gameLinks.x, gameLinks.youtube],
};

/**
 * Nodo Person per chi firma i contenuti, a partire da un autore di `src/lib/data/authors.ts`.
 * I campi tradotti arrivano già nella lingua della pagina (`role` da `role[locale]`, `description`
 * da `tagline[locale]`); `url` è la pagina autore (percorso localizzato o indirizzo assoluto),
 * `email` e `sameAs` si ricavano da `links` (il `mailto:` fa l'email, gli http(s) i `sameAs`).
 * L'`@id` è quello unico della persona (`personId`), uguale in ogni lingua; campi facoltativi aggiunti solo se
 * valorizzati e rimandi alle entità del sito per `@id` (`organizationId`).
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
  const url = author.url ? absolute(author.url) : undefined;
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId(author.slug),
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
 * Rimando a un autore dentro un altro nodo (`author` di NewsArticle e Article): l'`@id` unico della persona, il nome e
 * la sua pagina nella lingua di chi legge. È la forma da usare nelle news e nelle guide al posto di `<url>#person`.
 */
export function personRef(author: { slug: string; name: string }, url: string): Json {
  return { "@type": "Person", "@id": personId(author.slug), name: author.name, url: absolute(url) };
}

/**
 * Rimando a un iscritto della community (organizzatore di un torneo, autore di un mazzo) che non è un autore del sito:
 * `memberId`, il nome mostrato e la sua pagina /u nella lingua di chi legge.
 */
export function memberRef(member: { username: string; name: string }, url: string): Json {
  return { "@type": "Person", "@id": memberId(member.username), name: member.name, url: absolute(url) };
}

/**
 * Pagina lista (carte, mazzi, guide…): CollectionPage con dentro l'ItemList delle voci.
 * `path` e i `path` delle voci sono già localizzati, come li produce `href(locale, …)`;
 * `about` è l'`@id` dell'entità di cui parla la lista: di norma `videoGameId`, mai una copia
 * dell'oggetto VideoGame (una seconda copia sarebbe una seconda entità per lo stesso gioco).
 * `id` di una voce, facoltativo, è l'`@id` dell'entità che la voce rappresenta (una Person nell'indice degli autori);
 * `description`, facoltativa, è il dato che la pagina mostra accanto alla voce (per una classifica: "in 2 mazzi · 13%"),
 * così la lista dei dati strutturati dice la stessa cosa della pagina (GEO-10).
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
  items: { name: string; path: string; id?: string; description?: string }[];
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
    isPartOf: { "@id": websiteId(locale) },
    publisher: { "@id": organizationId },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: `${siteUrl}${it.path}`,
        ...(it.description ? { description: it.description } : {}),
        ...(it.id ? { item: { "@id": it.id } } : {}),
      })),
    },
  };
  if (about) node.about = { "@id": about };
  return node;
}

/**
 * Il sito in una lingua. La SearchAction resta anche se Google non mostra più la casella di ricerca nei risultati
 * (novembre 2024): non costa nulla e descrive una funzione vera (/cards?q=…).
 */
export function website(locale: string, description: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(locale),
    name: "OriginsMeta",
    alternateName: "Origins Meta",
    url: `${siteUrl}/${locale}`,
    inLanguage: locale,
    description,
    publisher: { "@id": organizationId },
    about: { "@id": videoGameId },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/${locale}/cards?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Uno strumento gratuito nel browser (deck builder, tier list personalizzabile): WebApplication con gioco, sito ed
 * editore per `@id`. Nessun `aggregateRating`: non ci sono voti sugli strumenti e non si inventano. `features` sono
 * solo funzioni che il codice fa davvero. La valuta dell'offerta gratuita è quella di tutto il sito (`FREE_OFFER_CURRENCY`).
 */
export function webApplication({
  locale,
  path,
  name,
  description,
  features,
}: {
  locale: string;
  path: string;
  name: string;
  description: string;
  features?: string[];
}): Json {
  const url = `${siteUrl}${path}`;
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#app`,
    name,
    description,
    url,
    inLanguage: locale,
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: FREE_OFFER_CURRENCY },
    isPartOf: { "@id": websiteId(locale) },
    publisher: { "@id": organizationId },
    about: { "@id": videoGameId },
  };
  if (features?.length) node.featureList = features;
  return node;
}

/**
 * La pagina /about (HOME-09, TOOL-13): parla di OriginsMeta (`about` e `mainEntity` sono l'organizzazione) e nomina il
 * gioco e lo studio per `@id`.
 */
export function aboutPage({ locale, path, name, description }: { locale: string; path: string; name: string; description: string }): Json {
  const url = `${siteUrl}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#page`,
    name,
    description,
    url,
    inLanguage: locale,
    isPartOf: { "@id": websiteId(locale) },
    publisher: { "@id": organizationId },
    about: { "@id": organizationId },
    mainEntity: { "@id": organizationId },
    mentions: [{ "@id": videoGameId }, { "@id": koinGamesId }],
  };
}

/**
 * La pagina di un autore del sito (/authors/<slug>): ProfilePage il cui soggetto è la Person unica (`personId`). Il nodo
 * Person completo lo scrive `person()` nella stessa pagina; `mainEntity` ripete comunque nome e pagina, che Google
 * chiede sul posto (documentazione "Profile page"), come fa `koinGamesRef` per l'organizzatore di un evento.
 * Si chiama così, e non `profilePage`, per non confondersi con la pagina /u di un iscritto (`communityProfilePage`
 * del pacchetto DECKS).
 */
export function authorProfilePage({ locale, path, name, slug }: { locale: string; path: string; name: string; slug: string }): Json {
  const url = `${siteUrl}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#page`,
    name,
    url,
    inLanguage: locale,
    isPartOf: { "@id": websiteId(locale) },
    mainEntity: { "@type": "Person", "@id": personId(slug), name, url },
  };
}
