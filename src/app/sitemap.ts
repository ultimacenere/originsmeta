import type { MetadataRoute } from "next";
import { locales, siteUrl, href } from "@/lib/i18n";
import { cards } from "@/lib/data/cards";
import { decks } from "@/lib/data/decks";
import { guideSlugs } from "@/lib/content/guides";
import { listPublishedSlugs } from "@/lib/community/queries";

/** I mazzi della community cambiano: la sitemap si rigenera al massimo ogni ora (e dopo ogni pubblicazione). */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/news", "/tier-list", "/guides", "/cards", "/decks", "/deck-builder", "/tournaments", "/about", "/privacy"];
  const community = await listPublishedSlugs();
  const paths = [
    ...staticPaths,
    ...cards.map((c) => `/cards/${c.slug}`),
    ...decks.map((d) => `/decks/${d.slug}`),
    ...guideSlugs.map((s) => `/guides/${s}`),
    ...community.map((c) => `/decks/community/${c.slug}`),
  ];
  const now = new Date();
  const out: MetadataRoute.Sitemap = [];
  for (const p of paths) {
    for (const l of locales) {
      const languages: Record<string, string> = {};
      for (const ll of locales) languages[ll] = `${siteUrl}${href(ll, p)}`;
      out.push({
        url: `${siteUrl}${href(l, p)}`,
        lastModified: now,
        changeFrequency: p === "" || p === "/news" ? "daily" : "weekly",
        priority: p === "" ? 1 : p.startsWith("/cards/") ? 0.6 : 0.8,
        alternates: { languages },
      });
    }
  }
  return out;
}
