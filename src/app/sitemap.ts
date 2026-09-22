import type { MetadataRoute } from "next";
import { defaultLocale, locales, siteUrl, href } from "@/lib/i18n";
import { cards, cardsVerified, latestPatch, patches } from "@/lib/data/cards";
import { decks } from "@/lib/data/decks";
import { newsPath, sortedNews } from "@/lib/data/news";
import { tierList } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { authors } from "@/lib/data/authors";
import { listPublicProfiles, listPublishedSlugs } from "@/lib/community/queries";
import { listTournamentSlugs } from "@/lib/tournament/queries";

/** Data dell'ultima revisione editoriale delle pagine fisse (aggiornare quando cambiano testi o struttura). */
const SITE_UPDATED = "2026-09-21";
/** Giorno in cui è nata la tier list personalizzabile (/tier-list/create). */
const TIER_MAKER_ADDED = "2026-09-22";

/** I mazzi della community cambiano: la sitemap si rigenera al massimo ogni ora (e dopo ogni pubblicazione). */
export const revalidate = 3600;

type Entry = { path: string; lastModified: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestNews = sortedNews[0]?.date ?? SITE_UPDATED;
  const latestDeck = decks.map((d) => d.updated).sort().at(-1) ?? SITE_UPDATED;
  const [community, tournaments, profiles] = await Promise.all([listPublishedSlugs(), listTournamentSlugs(), listPublicProfiles()]);
  const latestCommunity = community.map((c) => c.updated_at.slice(0, 10)).sort().at(-1);
  const latestTournament = tournaments.map((t) => t.updated_at.slice(0, 10)).sort().at(-1);
  const guides = getGuides("en");

  const entries: Entry[] = [
    { path: "", lastModified: latestNews, changeFrequency: "daily", priority: 1 },
    { path: "/news", lastModified: latestNews, changeFrequency: "daily", priority: 0.9 },
    { path: "/tier-list", lastModified: tierList.updated, changeFrequency: "weekly", priority: 0.9 },
    // Tier list personalizzabile (22/09/2026): la pagina cambia quando cambiano le carte attive, cioè con una patch
    // o con una nuova verifica delle carte sul gioco.
    { path: "/tier-list/create", lastModified: [TIER_MAKER_ADDED, patches[latestPatch].date, cardsVerified.date].sort().at(-1) ?? TIER_MAKER_ADDED, changeFrequency: "weekly", priority: 0.8 },
    // Tier list della community (23/09/2026): cambia quando qualcuno salva la sua, cioè spesso quanto i mazzi.
    { path: "/tier-list/community", lastModified: [latestCommunity ?? "", SITE_UPDATED].sort().at(-1) || SITE_UPDATED, changeFrequency: "daily", priority: 0.7 },
    { path: "/cards", lastModified: patches[latestPatch].date, changeFrequency: "weekly", priority: 0.9 },
    { path: "/decks", lastModified: [latestDeck, latestCommunity ?? ""].sort().at(-1) || latestDeck, changeFrequency: "daily", priority: 0.9 },
    { path: "/deck-builder", lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { path: "/guides", lastModified: guides.map((g) => g.updated).sort().at(-1) ?? SITE_UPDATED, changeFrequency: "weekly", priority: 0.8 },
    { path: "/tournaments", lastModified: [SITE_UPDATED, latestTournament ?? ""].sort().at(-1) || SITE_UPDATED, changeFrequency: "daily", priority: 0.8 },
    // /faq è l'unica pagina con dati strutturati FAQPage: vale la pena segnalarla.
    { path: "/faq", lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { path: "/about", lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.4 },
    { path: "/authors", lastModified: SITE_UPDATED, changeFrequency: "monthly", priority: 0.3 },
    // Pagine autore: l'elenco arriva da `src/lib/data/authors.ts` (file puro, non legge Supabase),
    // così un autore nuovo entra in sitemap senza che nessuno debba ricopiarne lo slug qui.
    ...authors.map((a) => ({ path: `/authors/${a.slug}`, lastModified: SITE_UPDATED, changeFrequency: "monthly" as const, priority: 0.3 })),
    // /privacy non entra in sitemap: la pagina è noindex, elencarla manderebbe un segnale contraddittorio.
    ...cards.map((c) => ({
      path: `/cards/${c.slug}`,
      lastModified: c.history.length ? patches[c.history[c.history.length - 1].patch].date : SITE_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...decks.map((d) => ({ path: `/decks/${d.slug}`, lastModified: d.updated, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...guides.map((g) => ({ path: `/guides/${g.slug}`, lastModified: g.updated, changeFrequency: "weekly" as const, priority: 0.8 })),
    // Ogni news ha la sua pagina dal 21/09/2026: data dell'ultima revisione, altrimenti quella di pubblicazione.
    ...sortedNews.map((n) => ({ path: newsPath(n), lastModified: n.updated ?? n.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...community.map((c) => ({ path: `/decks/community/${c.slug}`, lastModified: c.updated_at.slice(0, 10), changeFrequency: "weekly" as const, priority: 0.6 })),
    // Pagine pubbliche degli iscritti che hanno pubblicato almeno un mazzo (23/09/2026)
    ...profiles.map((p) => ({ path: `/u/${p.username}`, lastModified: p.updated_at.slice(0, 10), changeFrequency: "weekly" as const, priority: 0.4 })),
    ...tournaments.map((t) => ({ path: `/tournaments/${t.slug}`, lastModified: t.updated_at.slice(0, 10), changeFrequency: "daily" as const, priority: 0.6 })),
  ];

  const out: MetadataRoute.Sitemap = [];
  for (const e of entries) {
    for (const l of locales) {
      const languages: Record<string, string> = {};
      for (const ll of locales) languages[ll] = `${siteUrl}${href(ll, e.path)}`;
      // x-default: la stessa riga che l'HTML dichiara in alternatesFor(), così i due segnali coincidono.
      languages["x-default"] = `${siteUrl}${href(defaultLocale, e.path)}`;
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
