import { locales } from "@/lib/i18n";
import { sectionSitemapResponse } from "@/lib/sitemapData";

/**
 * /<lingua>/sitemap-decks.xml: le schede dei mazzi, solo nelle lingue in cui la guida si legge (le altre sono noindex).
 * Regole comuni (sezioni, date, hreflang, immagini) in src/lib/sitemapEntries.ts.
 */
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }): Promise<Response> {
  return sectionSitemapResponse("decks", params);
}
