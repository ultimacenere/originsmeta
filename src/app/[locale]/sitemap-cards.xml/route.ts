import { locales } from "@/lib/i18n";
import { sectionSitemapResponse } from "@/lib/sitemapData";

/**
 * /<lingua>/sitemap-cards.xml: le schede delle carte giocabili nella demo, con l'immagine della carta ufficiale.
 * Regole comuni (sezioni, date, hreflang, immagini) in src/lib/sitemapEntries.ts.
 */
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }): Promise<Response> {
  return sectionSitemapResponse("cards", params);
}
