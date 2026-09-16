import type { MetadataRoute } from "next";
import { locales, siteUrl, href } from "@/lib/i18n";
import { cards, patches } from "@/lib/data/cards";
import { decks } from "@/lib/data/decks";
import { sortedNews } from "@/lib/data/news";
import { tierList } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { listPublishedSlugs } from "@/lib/community/queries";
import { listTournamentSlugs } from "@/lib/tournament/queries";

/** Data dell'ultima revisione editoriale delle pagine fisse (aggiornare quando cambiano testi o struttura). */
const SITE_UPDATED = "2026-09-15";

/** I mazzi della community cambiano: la sitemap si rigenera al massimo ogni ora (e dopo ogni pubblicazione). */
export const revalidate = 3600;

type Entry = { path: string; lastModified: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestNews = sortedNews[0]?.date ?? SITE_UPDATED;
  const latestDeck = decks.map((d) => d.updated).sort().at(-1) ?? SITE_UPDATED;
  const [community, tournaments] = await Promise.all([listPublishedSlugs(), listTournamentSlugs()]);
  const latestCommunity = community.map((c) => c.updated_at.slice(0, 10)).sort().at(-1);
  const latestTournament = tournaments.map((t) => t.updated_at.slice(0, 10)).sort().at(-1);
  const guides = getGuides("en");

  const entries: Entry[] = [
    { path: "", lastModified: latestNews, changeFrequency: "daily", priority: 1 },
    { path: "/news", lastModified: latestNews, changeFrequency: "daily", priority: 0.9 },
    { path: "/tier-list", lastModified: tierList.updated, changeFrequency: "weekly", priority: 0.9 },
    { path: "/cards", lastModified: patches["0.6.3"].date, changeFrequency: "weekly", priority: 0.9 },
    { path: "/decks", lastModified: [latestDeck, latestCommunity ?? ""].sort().at(-1) || latestDeck, changeFrequency: "daily", priority: 0.9 },
    { path: "/deck-builder", lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { path: "/guides", lastModified: guides.map((g) => g.updated).sort().at(-1) ?? SITE_UPDATED, changeFrequency: "weekly", priority: 0.8 },
    { path: "/tournaments", lastModified: [SITE_UPDATED, latestTournament ?? ""].sort().at(-1) || SITE_UPDATED, changeFrequency: "daily", priority: 0.8 },
    { path: "/about", lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.4 },
    { path: "/privacy", lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.2 },
    ...cards.map((c) => ({
      path: `/cards/${c.slug}`,
      lastModified: c.history.length ? patches[c.history[c.history.length - 1].patch].date : SITE_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...decks.map((d) => ({ path: `/decks/${d.slug}`, lastModified: d.updated, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...guides.map((g) => ({ path: `/guides/${g.slug}`, lastModified: g.updated, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...community.map((c) => ({ path: `/decks/community/${c.slug}`, lastModified: c.updated_at.slice(0, 10), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...tournaments.map((t) => ({ path: `/tournaments/${t.slug}`, lastModified: t.updated_at.slice(0, 10), changeFrequency: "daily" as const, priority: 0.6 })),
  ];

  const out: MetadataRoute.Sitemap = [];
  for (const e of entries) {
    for (const l of locales) {
      const languages: Record<string, string> = {};
      for (const ll of locales) languages[ll] = `${siteUrl}${href(ll, e.path)}`;
      out.push({
        url: `${siteUrl}${href(l, e.path)}`,
        lastModified: new Date(`${e.lastModified}T12:00:00Z`),
        changeFrequency: e.changeFrequency,
        priority: e.priority,
        alternates: { languages },
      });
    }
  }
  return out;
}
