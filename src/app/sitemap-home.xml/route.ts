import { homeSitemapResponse } from "@/lib/sitemapData";

/**
 * /sitemap-home.xml: le home delle tre lingue. Stanno qui e non nella sitemap delle pagine di ogni lingua perché
 * /en non è dentro la cartella /en/, e una sitemap vale solo per i discendenti della sua cartella (src/lib/sitemapEntries.ts).
 */
export const revalidate = 3600;

export function GET(): Response {
  return homeSitemapResponse();
}
