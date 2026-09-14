import type { MetadataRoute } from "next";
import { locales, siteUrl, href } from "@/lib/i18n";
import { cards } from "@/lib/data/cards";
import { guideSlugs } from "@/lib/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/cards", "/decks", "/tier-list", "/guides", "/tournaments", "/news", "/about", "/privacy"];
  const paths = [
    ...staticPaths,
    ...cards.map((c) => `/cards/${c.slug}`),
    ...guideSlugs.map((s) => `/guides/${s}`),
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
