import { siteUrl, type Locale } from "@/lib/i18n";
import { breadcrumbs, organizationId, videoGameId } from "@/components/JsonLd";
import type { Card } from "@/lib/data/cards";

/**
 * Dati strutturati della scheda carta (Ondata 2 del piano SEO/GEO, SCHEDE-08, CARDS-10, GEO-07): due nodi.
 *
 * 1. La pagina, `ItemPage` (`<url>#page`): nome e descrizione della pagina, lingua, sito, raccolta /cards, briciole di
 *    pane, data di modifica (la stessa del `lastmod` della sitemap) e, come `mainEntity`, la carta.
 * 2. La carta, `CreativeWork` con un `@id` del sito uguale nelle tre lingue (`${siteUrl}/#card-<ID ufficiale>`, come
 *    `#origins-tcg` per il gioco): una sola entità per carta, non tre. Ha l'ID ufficiale (`identifier`, per esempio
 *    C00075_MC, la chiave con cui anche altri siti indicizzano le carte), il vecchio nome, lo stato nella Demo 2.0, il
 *    gioco di cui fa parte e i diritti di Koin Games.
 *
 * Prima c'era un solo CreativeWork per lingua con l'illustratore come `creator`: diceva che la carta era sua. La carta
 * è di Koin Games; l'illustratore firma l'illustrazione, quindi sta nel nodo `ImageObject` dell'immagine, con il
 * credito e il copyright (i campi che Google chiede per i metadati delle immagini). Koin Games compare solo come
 * `Organization` con nome e indirizzo, mai con un logo (regola del materiale ufficiale, CLAUDE.md).
 * Niente FAQPage (i rich result FAQ non escono più dal 7/5/2026) e niente AggregateRating: la fascia della tier list è
 * un giudizio di gioco, non una recensione.
 * Il modulo importa da `JsonLd.tsx` in sola lettura (il componente è di un altro pacchetto).
 */

type Json = Record<string, unknown>;

/** Koin Games come titolare dei diritti: nome e sito, nessun logo. */
const koinGames: Json = { "@type": "Organization", name: "Koin Games", url: "https://koingames.io" };

/** `@id` della carta, uguale nelle tre lingue: l'ID ufficiale quando c'è (tutte le 230 carte oggi), altrimenti lo slug. */
export function cardEntityId(card: Pick<Card, "key" | "slug">): string {
  return `${siteUrl}/#card-${card.key ?? card.slug}`;
}

export type CardLdInput = {
  card: Card;
  locale: Locale;
  /** percorso localizzato della scheda (/it/cards/merlin) */
  path: string;
  /** title finale della pagina, come lo scrive `pageTitle` */
  title: string;
  /** meta description della pagina */
  description: string;
  /** frase d'attacco senza link: descrive la carta */
  lead: string;
  /** testo della carta nella lingua della pagina, se non è superato da una patch */
  text?: string;
  /** giorno di modifica, lo stesso del `lastmod` della sitemap */
  dateModified: string;
  /** briciole di pane: sito, database carte, carta */
  crumbs: { name: string; path: string }[];
  /** nome del tipo e parole chiave già nella lingua della pagina */
  keywords: string[];
  /** stato nella lingua della pagina ("Nella Demo 2.0", "Non nella Demo 2.0 (build precedenti)") */
  status: string;
  /** immagine ufficiale: dimensioni, testo alternativo e credito */
  image?: { width?: number; height?: number; alt: string; credit: string };
  /** schede dei mazzi pubblicati linkati dalla pagina, percorsi localizzati */
  deckPaths?: string[];
};

/** I due nodi della scheda carta, pronti per `<JsonLd data={…} />`. */
export function cardJsonLd(input: CardLdInput): Json[] {
  const { card, locale, path } = input;
  const url = `${siteUrl}${path}`;
  const cardId = cardEntityId(card);
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
    inLanguage: locale,
    isPartOf: [{ "@id": `${siteUrl}/${locale}#website` }, { "@id": `${siteUrl}${path.replace(/\/[^/]+$/, "")}#collection` }],
    publisher: { "@id": organizationId },
    breadcrumb: { ...crumbs, "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": cardId },
    dateModified: input.dateModified,
  };
  if (input.deckPaths?.length) page.relatedLink = input.deckPaths.map((p) => `${siteUrl}${p}`);

  const entity: Json = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": cardId,
    name: card.name,
    description: input.lead,
    mainEntityOfPage: { "@id": `${url}#page` },
    isPartOf: { "@id": videoGameId },
    creativeWorkStatus: input.status,
    copyrightHolder: koinGames,
    dateModified: input.dateModified,
  };
  if (input.keywords.length) entity.keywords = input.keywords.join(", ");
  if (card.key) entity.identifier = { "@type": "PropertyValue", propertyID: "Origins TCG card ID", value: card.key };
  if (card.formerName) entity.alternateName = card.formerName;
  if (input.text) entity.text = input.text;
  if (card.image && input.image) {
    const image: Json = {
      "@type": "ImageObject",
      contentUrl: `${siteUrl}${card.image}`,
      url: `${siteUrl}${card.image}`,
      caption: input.image.alt,
      creditText: input.image.credit,
      copyrightNotice: "© Koin Games",
      copyrightHolder: koinGames,
    };
    // Misure lette dal file (le carte ufficiali non sono tutte alte uguali), solo se note
    if (input.image.width && input.image.height) Object.assign(image, { width: input.image.width, height: input.image.height });
    // L'illustratore è stampato sulla carta: autore dell'illustrazione, non della carta.
    if (card.credit?.illus) image.creator = { "@type": "Person", name: card.credit.illus };
    entity.image = image;
  }
  return [page, entity];
}
