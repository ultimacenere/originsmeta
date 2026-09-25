import { locales } from "@/lib/i18n";
import { sectionSitemapResponse } from "@/lib/sitemapData";

/**
 * /<lingua>/sitemap-cards-removed.xml: le schede delle carte non più nella demo (l'archivio di /cards), con l'immagine della carta ufficiale.
 * Regole comuni (sezioni, date, hreflang, immagini) in src/lib/sitemapEntries.ts.
 */
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }): Promise<Response> {
  return sectionSitemapResponse("cards-removed", params);
}
