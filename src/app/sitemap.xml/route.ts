import { sitemapIndexResponse } from "@/lib/sitemapData";

/**
 * /sitemap.xml: dal 25/09/2026 (Ondata 2) è l'indice delle sitemap divise per sezione e per lingua, allo stesso
 * indirizzo già inviato a Search Console e dichiarato in robots.txt. Le pagine stanno in /sitemap-home.xml e in
 * /<lingua>/sitemap-<sezione>.xml (perché lì: `src/lib/sitemapEntries.ts`). Legge i dati della community, quindi si
 * rigenera con la loro cache (ogni cinque minuti, non ogni ora) e dopo una pubblicazione (`revalidateSitemaps`):
 * regole in src/lib/sitemapData.ts.
 */
export const revalidate = 3600;

export function GET(): Promise<Response> {
  return sitemapIndexResponse();
}
