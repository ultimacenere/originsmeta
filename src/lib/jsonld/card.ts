import { siteUrl, type Locale } from "@/lib/i18n";
import { breadcrumbs, organizationId, videoGameId } from "@/components/JsonLd";
import type { Card } from "@/lib/data/cards";

/**
 * Dati strutturati della scheda carta (Ondata 2 del piano SEO/GEO, SCHEDE-08, CARDS-10, GEO-07, COMP-03).
 *
 * 1. La pagina, `ItemPage` (`<url>#page`), una per lingua: tutto quello che dipende dalla lingua sta qui, accanto a
 *    `inLanguage`. Nome e descrizione della pagina, la frase d'attacco come `abstract`, le parole chiave, le briciole di
 *    pane, la data di modifica (la stessa del `lastmod` della sitemap), l'immagine ufficiale con didascalia e crediti
 *    (`primaryImageOfPage`), i mazzi linkati (`relatedLink`) e, come `mainEntity`, la carta.
 * 2. La carta, `CreativeWork` con un `@id` del sito uguale nelle tre lingue (`${siteUrl}/#card-<ID ufficiale>`, come
 *    `#origins-tcg` per il gioco): una sola entità per carta, non tre. Per questo porta solo valori uguali in ogni
 *    lingua (revisione del 25/09/2026): nome, vecchio nome, ID ufficiale (`identifier`, per esempio C00075_MC, la chiave
 *    con cui anche altri siti indicizzano le carte), gioco di cui fa parte, stato (in inglese, `cardStatusLd`), Koin
 *    Games come autore e titolare dei diritti, l'indirizzo dell'immagine e il testo del gioco con la sua lingua
 *    dichiarata (`@language`). Prima portava la frase d'attacco, le parole chiave, lo stato e la data della pagina:
 *    tre valori diversi, uno per lingua, sulla stessa entità.
 * 3. Se la pagina elenca dei mazzi, un `ItemList` (`<url>#decks`) con nome e indirizzo di ciascuno (COMP-03).
 *
 * La carta è di Koin Games; l'illustratore firma l'illustrazione, non la carta, e l'immagine è la carta intera
 * composta da Koin (cornice, testi, crediti impressi): nell'`ImageObject` l'illustratore è `contributor`, Koin Games
 * `creator` e `copyrightHolder`, con `creditText` e `copyrightNotice` (i campi che Google chiede per i metadati delle
 * immagini). Koin Games è un rimando per `@id` al nodo del sito (`${siteUrl}/#koin-games`, pacchetto LD: GEO-08), con
 * nome e sito perché il rimando resti leggibile anche da solo, mai con un logo (regola del materiale ufficiale).
 * Niente FAQPage (i rich result FAQ non escono più dal 7/5/2026) e niente AggregateRating: la fascia della tier list è
 * un giudizio di gioco, non una recensione.
 * Il modulo importa da `JsonLd.tsx` in sola lettura (il componente è di un altro pacchetto), e solo `breadcrumbs`,
 * `organizationId` e `videoGameId`: sono le tre cose che il finto JsonLd del test di deckQuality.ts (pacchetto DECKS)
 * sostituisce, perché jsonld/deck.ts importerà `cardEntityId` da qui.
 */

type Json = Record<string, unknown>;

/**
 * Koin Games per `@id`: la stessa formula di `koinGamesId` / `koinGamesRef` del pacchetto LD (src/lib/jsonld/entities.ts,
 * riesportati da JsonLd.tsx). Qui è ripetuta perché su questo ramo quel modulo non c'è ancora: dopo l'integrazione si
 * può importare `koinGamesRef` da "@/components/JsonLd" (note del pacchetto CARDS).
 */
const koinGamesRef: Json = { "@type": "Organization", "@id": `${siteUrl}/#koin-games`, name: "Koin Games", url: "https://koingames.io" };

/**
 * `@id` della carta, uguale nelle tre lingue: l'ID ufficiale quando c'è (tutte le 230 carte oggi), altrimenti lo slug.
 * È l'unica fonte di questo `@id`: anche i mazzi (jsonld/deck.ts) puntano alle carte con questa funzione.
 */
export function cardEntityId(card: Pick<Card, "key" | "slug">): string {
  return `${siteUrl}/#card-${card.key ?? card.slug}`;
}

/** Un testo della carta con la sua lingua. */
export type CardLdText = { lang: Locale; text: string };

export type CardLdInput = {
  card: Card;
  locale: Locale;
  /** percorso localizzato della scheda (/it/cards/merlin) */
  path: string;
  /** title finale della pagina, come lo scrive `pageTitle` */
  title: string;
  /** meta description della pagina */
  description: string;
  /** frase d'attacco senza link, nella lingua della pagina */
  lead: string;
  /**
   * testi del gioco da dichiarare sulla carta, ciascuno con la sua lingua: gli stessi su tutte le pagine (il chiamante
   * li sceglie con la stessa regola in ogni lingua); vuoto se una patch successiva li ha superati
   */
  texts: CardLdText[];
  /** giorno di modifica, lo stesso del `lastmod` della sitemap */
  dateModified: string;
  /** briciole di pane: sito, database carte, carta */
  crumbs: { name: string; path: string }[];
  /** nome del tipo e parole chiave già nella lingua della pagina */
  keywords: string[];
  /** stato della carta, uguale in tutte le lingue (`cardStatusLd` di cardPage.ts) */
  status: string;
  /** immagine ufficiale: dimensioni, testo alternativo e credito nella lingua della pagina */
  image?: { width?: number; height?: number; alt: string; credit: string };
  /** mazzi pubblicati elencati dalla pagina (gli stessi, nello stesso ordine): titolo della sezione e voci */
  decks?: { title: string; items: { name: string; path: string }[] };
};

/** I nodi della scheda carta (pagina, carta ed eventuale elenco dei mazzi), pronti per `<JsonLd data={…} />`. */
export function cardJsonLd(input: CardLdInput): Json[] {
  const { card, locale, path } = input;
  const url = `${siteUrl}${path}`;
  const cardId = cardEntityId(card);
  const imageUrl = card.image ? `${siteUrl}${card.image}` : undefined;
  // Le briciole di pane dentro la pagina: un solo nodo pagina, con la sua BreadcrumbList (senza un secondo @context).
  const crumbs = breadcrumbs(input.crumbs);
  delete crumbs["@context"];

  const page: Json = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    "@id": `${url}#page`,
    url,
    name: input.title,
    description: input.description,
    abstract: input.lead,
    inLanguage: locale,
    isPartOf: [{ "@id": `${siteUrl}/${locale}#website` }, { "@id": `${siteUrl}${path.replace(/\/[^/]+$/, "")}#collection` }],
    publisher: { "@id": organizationId },
    breadcrumb: { ...crumbs, "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": cardId },
    dateModified: input.dateModified,
  };
  if (input.keywords.length) page.keywords = input.keywords.join(", ");
  if (imageUrl && input.image) {
    const image: Json = {
      "@type": "ImageObject",
      contentUrl: imageUrl,
      url: imageUrl,
      caption: input.image.alt,
      creator: koinGamesRef,
      creditText: input.image.credit,
      copyrightNotice: "© Koin Games",
      copyrightHolder: koinGamesRef,
    };
    // Misure della carta intera (card-art.json), solo se note
    if (input.image.width && input.image.height) Object.assign(image, { width: input.image.width, height: input.image.height });
    // L'illustratore è stampato sulla carta: ha firmato l'illustrazione, non la carta né l'immagine intera.
    if (card.credit?.illus) image.contributor = { "@type": "Person", name: card.credit.illus };
    page.primaryImageOfPage = image;
  }
  const decks = input.decks?.items ?? [];
  if (decks.length) page.relatedLink = decks.map((d) => `${siteUrl}${d.path}`);

  const entity: Json = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": cardId,
    name: card.name,
    isPartOf: { "@id": videoGameId },
    creativeWorkStatus: input.status,
    creator: koinGamesRef,
    copyrightHolder: koinGamesRef,
  };
  if (card.key) entity.identifier = { "@type": "PropertyValue", propertyID: "Origins TCG card ID", value: card.key };
  if (card.formerName) entity.alternateName = card.formerName;
  if (imageUrl) entity.image = imageUrl;
  // Testi con la lingua dichiarata: così lo stesso valore vale su tutte e tre le pagine senza passare per la loro lingua.
  if (input.texts.length) entity.text = input.texts.map((t) => ({ "@value": t.text, "@language": t.lang }));

  const nodes = [page, entity];
  if (decks.length && input.decks) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${url}#decks`,
      name: input.decks.title,
      numberOfItems: decks.length,
      itemListElement: decks.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: d.name, url: `${siteUrl}${d.path}` })),
    });
  }
  return nodes;
}
