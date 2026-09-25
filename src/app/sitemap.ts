import type { MetadataRoute } from "next";
import { defaultLocale, locales, siteUrl, href, type Locale } from "@/lib/i18n";
import { cards, cardsVerified, latestPatch, patches, type Card } from "@/lib/data/cards";
import { cardLore } from "@/lib/data/card-lore";
import { decks, decksWithCard } from "@/lib/data/decks";
import { newsPath, sortedNews, type NewsItem } from "@/lib/data/news";
import { tierList } from "@/lib/data/tierlist";
import { locationsPatch, locationsVerified } from "@/lib/data/locations";
import { getGuides, type Guide } from "@/lib/content/guides";
import { authors, guidesByAuthor, newsByAuthor } from "@/lib/data/authors";
import { listPublicProfiles, listPublishedSlugs } from "@/lib/community/queries";
import { listPublishedTierLists } from "@/lib/community/tierlists";
import { listTournamentSlugs } from "@/lib/tournament/queries";
import { NEWS_PAGES_SINCE, latestDay, pageLastmod, todayUtc, type PageRoute } from "@/lib/lastmod";

/** I mazzi della community cambiano: la sitemap si rigenera al massimo ogni ora (e dopo ogni pubblicazione). */
export const revalidate = 3600;

type Dates = readonly (string | null | undefined)[];

/**
 * Una pagina della sitemap. `route` è il modello (la sua data sta in `PAGE_UPDATED` di `src/lib/lastmod.ts`),
 * `dates` le date dei dati che la pagina mostra: una funzione quando cambiano con la lingua (le guide).
 * `locales`: solo quando la pagina non esiste in tutte le lingue (mazzi della community senza traduzione).
 */
type Entry = {
  path: string;
  route: PageRoute;
  dates: Dates | ((locale: Locale) => Dates);
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
  locales?: readonly Locale[];
};

/** Data di una news: l'ultima revisione, altrimenti la pubblicazione. */
const newsDay = (n: NewsItem) => n.updated ?? n.date;

/**
 * Date che cambiano una scheda carta: le patch che l'hanno toccata, la verifica sul gioco quando ne ha corretto
 * testo o parole chiave (`card-lore.ts`, campi `en` e `keywords`), i mazzi editoriali che la contengono.
 */
function cardDates(c: Card): Dates {
  const lore = cardLore[c.slug];
  return [...c.history.map((h) => patches[h.patch].date), lore?.en || lore?.keywords ? cardsVerified.date : undefined, ...decksWithCard(c.slug).map((d) => d.updated)];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = todayUtc();
  const [community, tournaments, profiles, tierLists] = await Promise.all([listPublishedSlugs(), listTournamentSlugs(), listPublicProfiles(), listPublishedTierLists()]);
  const latestNews = latestDay(sortedNews.map(newsDay));
  const latestCommunity = latestDay(community.map((c) => c.updated_at));
  const latestTierList = latestDay(tierLists.map((t) => t.updated_at));
  const latestTournament = latestDay(tournaments.map((t) => t.updated_at));
  const patchDay = patches[latestPatch].date;
  const cardDays = latestDay(cards.flatMap((c) => cardDates(c)));
  // Le guide hanno date per lingua: la versione spagnola non è più vecchia del 25/09/2026 (`getGuides`).
  const guidesBy = Object.fromEntries(locales.map((l) => [l, getGuides(l)])) as Record<Locale, Guide[]>;
  const guideDay = (l: Locale, slug: string) => guidesBy[l].find((g) => g.slug === slug)?.updated;

  const entries: Entry[] = [
    // La home mostra le ultime news, i movimenti dell'ultima patch e la tier list.
    { path: "", route: "/", dates: [latestNews, patchDay, tierList.updated], changeFrequency: "daily", priority: 1 },
    { path: "/news", route: "/news", dates: [latestNews], changeFrequency: "daily", priority: 0.9 },
    // Dal 24/09/2026 la tier list mostra anche lo stato delle altre fonti e le anteprime dei mazzi pubblicati.
    { path: "/tier-list", route: "/tier-list", dates: [tierList.updated, latestCommunity, latestTierList], changeFrequency: "daily", priority: 0.9 },
    // Le più giocate: calcolata dai mazzi pubblicati, cambia con loro.
    { path: "/tier-list/most-played", route: "/tier-list/most-played", dates: [latestCommunity], changeFrequency: "daily", priority: 0.8 },
    // MetaShifting: cambia con le patch.
    { path: "/metashifting", route: "/metashifting", dates: [patchDay], changeFrequency: "weekly", priority: 0.8 },
    // Tier list personalizzabile: cambia quando cambiano le carte attive, cioè con una patch o una nuova verifica sul gioco.
    { path: "/tier-list/create", route: "/tier-list/create", dates: [patchDay, cardsVerified.date], changeFrequency: "weekly", priority: 0.8 },
    // Tier list della community: cambia quando qualcuno salva la sua.
    { path: "/tier-list/community", route: "/tier-list/community", dates: [latestTierList], changeFrequency: "daily", priority: 0.7 },
    { path: "/cards", route: "/cards", dates: [cardDays], changeFrequency: "weekly", priority: 0.9 },
    // I Luoghi cambiano con la rotazione del gioco (una patch) o con una verifica nel gioco.
    { path: "/locations", route: "/locations", dates: [patches[locationsPatch].date, locationsVerified?.date], changeFrequency: "monthly", priority: 0.8 },
    { path: "/decks", route: "/decks", dates: [...decks.map((d) => d.updated), latestCommunity], changeFrequency: "daily", priority: 0.9 },
    // Il pool del deck builder segue le carte: patch e verifica sul gioco.
    { path: "/deck-builder", route: "/deck-builder", dates: [patchDay, cardsVerified.date], changeFrequency: "monthly", priority: 0.8 },
    { path: "/guides", route: "/guides", dates: (l) => guidesBy[l].map((g) => g.updated), changeFrequency: "weekly", priority: 0.8 },
    // Calendario: eventi ufficiali (data del modello, events.ts) e tornei della community.
    { path: "/tournaments", route: "/tournaments", dates: [latestTournament], changeFrequency: "daily", priority: 0.8 },
    // /faq è l'unica pagina con dati strutturati FAQPage: vale la pena segnalarla. Le sue date sono quelle del modello.
    { path: "/faq", route: "/faq", dates: [], changeFrequency: "monthly", priority: 0.6 },
    { path: "/about", route: "/about", dates: [], changeFrequency: "monthly", priority: 0.4 },
    { path: "/authors", route: "/authors", dates: [], changeFrequency: "monthly", priority: 0.3 },
    // Pagine autore: l'elenco arriva da `src/lib/data/authors.ts` (file puro, non legge Supabase), così un autore
    // nuovo entra in sitemap senza che nessuno debba ricopiarne lo slug qui. Cambiano con le sue news e guide.
    ...authors.map((a) => ({
      path: `/authors/${a.slug}`,
      route: "/authors/[slug]" as const,
      dates: (l: Locale) => [...newsByAuthor(a.slug).map(newsDay), ...guidesByAuthor(l, a.slug).map((g) => g.updated)],
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
    // /privacy non entra in sitemap: la pagina è noindex, elencarla manderebbe un segnale contraddittorio.
    ...cards.map((c) => ({ path: `/cards/${c.slug}`, route: "/cards/[slug]" as const, dates: cardDates(c), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...decks.map((d) => ({ path: `/decks/${d.slug}`, route: "/decks/[slug]" as const, dates: [d.updated], changeFrequency: "weekly" as const, priority: 0.7 })),
    ...guidesBy.en.map((g) => ({ path: `/guides/${g.slug}`, route: "/guides/[slug]" as const, dates: (l: Locale) => [guideDay(l, g.slug)], changeFrequency: "weekly" as const, priority: 0.8 })),
    // Ogni news ha la sua pagina dal 21/09/2026: una news più vecchia non può dichiarare una pagina che non c'era.
    ...sortedNews.map((n) => ({ path: newsPath(n), route: "/news/[slug]" as const, dates: [newsDay(n), NEWS_PAGES_SINCE], changeFrequency: "monthly" as const, priority: 0.7 })),
    // Solo le lingue in cui la guida si legge davvero (originale + traduzioni aggiornate, 25/09/2026): le altre
    // versioni della scheda sono noindex finché la traduzione non c'è.
    ...community.map((c) => ({ path: `/decks/community/${c.slug}`, route: "/decks/community/[slug]" as const, dates: [c.updated_at], changeFrequency: "weekly" as const, priority: 0.6, locales: c.locales })),
    // Pagine pubbliche degli iscritti che hanno pubblicato almeno un mazzo (23/09/2026)
    ...profiles.map((p) => ({ path: `/u/${p.username}`, route: "/u/[username]" as const, dates: [p.updated_at], changeFrequency: "weekly" as const, priority: 0.4 })),
    ...tournaments.map((t) => ({ path: `/tournaments/${t.slug}`, route: "/tournaments/[slug]" as const, dates: [t.updated_at], changeFrequency: "daily" as const, priority: 0.6 })),
  ];

  const out: MetadataRoute.Sitemap = [];
  for (const e of entries) {
    const langs = e.locales?.length ? locales.filter((l) => e.locales?.includes(l)) : locales;
    for (const l of langs) {
      const languages: Record<string, string> = {};
      for (const ll of langs) languages[ll] = `${siteUrl}${href(ll, e.path)}`;
      // x-default: la stessa riga che l'HTML dichiara in alternatesFor(), così i due segnali coincidono.
      languages["x-default"] = `${siteUrl}${href(langs.includes(defaultLocale) ? defaultLocale : langs[0], e.path)}`;
      out.push({
        url: `${siteUrl}${href(l, e.path)}`,
        // Solo il giorno (aaaa-mm-gg), mai un orario: vedi `lastmodFor` in src/lib/lastmod.ts.
        lastModified: pageLastmod(e.route, l, typeof e.dates === "function" ? e.dates(l) : e.dates, today),
        changeFrequency: e.changeFrequency,
        priority: e.priority,
        alternates: { languages },
      });
    }
  }
  return out;
}
