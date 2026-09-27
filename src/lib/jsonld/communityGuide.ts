import { href, siteUrl, type Locale } from "@/lib/i18n";
import { organizationId, videoGameId } from "./entities";
import { cardEntityId } from "./card";

type Json = Record<string, unknown>;

/**
 * Article della pagina di una guida della community (pacchetto GUIDE, 27/09/2026), con le convenzioni di jsonld/deck.ts:
 * l'autore è la stessa Person del suo profilo /u (`communityPerson`, `@id` `memberId`, uguale nelle tre lingue; per un
 * autore editoriale quella della sua pagina autore), `headline` è il title della SERP, le carte collegate rimandano alle
 * entità delle loro schede (`cardEntityId`), la guida fa parte della CollectionPage di /guides. `inLanguage` è la lingua
 * del documento (quella della pagina), non quella dell'autore: la pagina /en resta una pagina inglese anche quando mostra
 * l'originale in attesa della traduzione (e allora è noindex).
 */
export function communityGuideArticle({
  locale,
  pageUrl,
  headline,
  description,
  published,
  modified,
  image,
  author,
  cards,
  words,
  section,
}: {
  locale: Locale;
  pageUrl: string;
  headline: string;
  description: string;
  published: string;
  modified: string;
  image: string;
  author: Json;
  cards: readonly { slug: string; key?: string; name: string }[];
  /** parole del testo, come le conta la soglia di indicizzazione */
  words: number;
  /** nome della categoria nella lingua della pagina */
  section: string;
}): Json {
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline,
    description,
    inLanguage: locale,
    datePublished: published,
    dateModified: modified,
    image,
    author,
    publisher: { "@id": organizationId },
    mainEntityOfPage: pageUrl,
    isPartOf: { "@id": `${siteUrl}${href(locale, "/guides")}#collection` },
    about: { "@id": videoGameId },
    articleSection: section,
    wordCount: words,
  };
  if (cards.length) {
    node.mentions = cards.map((c) => ({ "@type": "CreativeWork", "@id": cardEntityId(c), name: c.name, url: `${siteUrl}${href(locale, `/cards/${c.slug}`)}` }));
  }
  return node;
}
