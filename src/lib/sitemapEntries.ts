import { defaultLocale, href, locales, siteUrl, type Locale } from "./i18n";
import { cards, cardsVerified, latestPatch, patches, type Card } from "./data/cards";
import { decks } from "./data/decks";
import { newsPath, sortedNews, type NewsItem } from "./data/news";
import { tierList } from "./data/tierlist";
import { locationsPatch, locationsVerified } from "./data/locations";
import { getGuides, type Guide } from "./content/guides";
import { authors, guidesByAuthor, newsByAuthor } from "./data/authors";
import { NEWS_PAGES_SINCE, latestDay, pageLastmod, type Day, type PageRoute } from "./lastmod";
import { cardDates, cardLastmod } from "./cardDates";
import { cardPageDeckDays, cardPageLastmod, type DeckRef } from "./cardSynergy";
import type { IndexEntry, UrlEntry } from "./seoXml";
import { directoryIndexable } from "./community/creatorDirectory";
import type { SitemapComic } from "./community/comics";
import { isEarly } from "./tracker/stats";
import { ANALYTICS_PUBLIC } from "./community/badges";

/**
 * Le pagine della sitemap, divise per sezione e per lingua (Ondata 2 del piano SEO/GEO, 25/09/2026: TECH-07, TRJ-06,
 * MIS-06, CARDS-15, ES-10). Prima c'era un solo /sitemap.xml con 936 URL: Search Console non diceva quante schede
 * carta, guide o pagine spagnole fossero indicizzate, e il conteggio si faceva a mano. Ora ogni sezione ha una sitemap
 * per lingua, e il rapporto "Sitemap" di Search Console dà inviate/indicizzate per ciascuna.
 *
 * Dove stanno (route handler in src/app):
 *   /sitemap.xml                       indice di tutte le altre (l'indirizzo già inviato a Search Console e a Bing)
 *   /sitemap-home.xml                  le tre home (/en, /it, /es): una sitemap in /en/ non può elencare /en, che
 *                                      non sta DENTRO la cartella /en/ (Google: una sitemap vale per i discendenti
 *                                      della sua cartella)
 *   /<lingua>/sitemap-<sezione>.xml    le pagine di quella sezione in quella lingua
 * Le sezioni: pagine e hub (con gli autori), news, guide, carte attive, carte create, carte non nella demo, mazzi,
 * community (profili degli iscritti e tornei).
 *
 * Le date sono quelle di sempre (`src/lib/lastmod.ts`, `cardLastmod`): solo il giorno, mai nel futuro. Ogni URL porta
 * le sue versioni nelle altre lingue (hreflang, con x-default) e le immagini del nostro dominio che la pagina mostra.
 * Import relativi, come i moduli di dati: `sitemapEntries.test.ts` lo carica con `node --test`. I dati della
 * community (Supabase) arrivano da fuori (`CommunityData`, letti da `sitemapData.ts`), così qui non c'è rete.
 */

export const SITEMAP_SECTIONS = ["pages", "news", "guides", "cards", "cards-created", "cards-removed", "decks", "community"] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

/**
 * Le sezioni che leggono i dati della community: le altre dipendono solo dai file del repository. Le carte attive ci
 * sono perché il loro lastmod conta i mazzi elencati nella scheda (`deckRefs`, come il `dateModified`); per create e
 * rimosse `cardPageDeckDays` non conta mazzi e i dati non servono. Le news dal 29/09/2026: i fumetti dei creator
 * (pacchetto FUMETTI) stanno nella loro sezione.
 */
export const COMMUNITY_SECTIONS: readonly SitemapSection[] = ["pages", "news", "guides", "cards", "decks", "community"];

export const HOME_SITEMAP_PATH = "/sitemap-home.xml";

/** Percorso della sitemap di una sezione in una lingua: /it/sitemap-cards.xml. */
export function sectionSitemapPath(section: SitemapSection, locale: Locale): string {
  return `/${locale}/sitemap-${section}.xml`;
}

/** I dati della community che la sitemap usa: solo slug, nomi utente e date, mai i contenuti. */
export type CommunityData = {
  /** mazzi pubblicati, con le lingue in cui la scheda è indicizzabile (guida originale + traduzioni aggiornate) */
  decks: { slug: string; updated_at: string; locales: Locale[] }[];
  /** data dell'ultimo mazzo pubblicato o modificato, anche sotto soglia: /decks e le tier list mostrano tutti i mazzi */
  latestDeck?: string;
  /**
   * I mazzi pubblicati come li legge la scheda carta (`loadDeckRefs`, src/lib/community/decksByCard.ts), per dare alle
   * schede lo stesso lastmod del loro `dateModified` (`cardPageLastmod` + `cardPageDeckDays`). null o assente: nessun
   * giorno dei mazzi (community spenta, oppure la build, dove la lettura può rispondere null).
   */
  deckRefs?: DeckRef[] | null;
  /** tornei pubblici non annullati */
  tournaments: { slug: string; updated_at: string }[];
  /** iscritti con almeno un mazzo pubblicato, una tier list salvata o una guida della community (/u/<nome>) */
  profiles: { username: string; updated_at: string }[];
  /**
   * tier list salvate: la più recente e quella di ogni utente, come coppie [nome, data]. Non un oggetto: la cache dei
   * dati lo serializza in JSON e lo restituisce come oggetto normale, dove un nome utente come "constructor" (possibile:
   * il nome nasce dal nome Discord o dall'email) leggerebbe una proprietà di Object.prototype invece di una data.
   */
  tierLists: { latest?: string; byUser: [username: string, updatedAt: string][] };
  /**
   * Profilo pubblico (pacchetto CREATOR, 26/09/2026): quante schede ha la directory /creators (profili Creator, Autore, Pro o Staff
   * e il profilo compilato, `listedInDirectory`: entra in sitemap solo da `CREATORS_MIN_INDEX` in su, come la pagina
   * decide il suo noindex), la loro modifica più recente e, per ogni profilo modificato, il giorno
   * dell'ultima modifica di bio, canali, lingue o tag (`showcase_updated_at`), come coppie [nome, data] per lo stesso
   * motivo delle tier list. Assente: niente directory in sitemap e date dei profili come prima.
   */
  showcase?: { creators: number; latest?: string; byUser: [username: string, updatedAt: string][] };
  /**
   * Guide della community (pacchetto GUIDE, 27/09/2026): quelle da elencare, ognuna con le lingue in cui la pagina si
   * indicizza (sopra la soglia di parole, originale e traduzioni aggiornate: `sitemapCommunityGuides` in
   * community/guides.ts), la data di ogni versione (ultima modifica o arrivo della traduzione) e la copertina. Per lingua:
   * `list` è il lastmod di /guides/community (una lingua assente = elenco vuoto, noindex e fuori dalla sitemap); `hub`
   * quello che le guide della community danno a /guides, che dal 29/09/2026 le mostra nell'HTML insieme alle editoriali.
   * Nella sezione "guides", accanto alle guide editoriali. Assente: nessuna guida della community.
   */
  communityGuides?: {
    guides: { slug: string; locales: Locale[]; dates: Partial<Record<Locale, string>>; image?: string }[];
    hub: Partial<Record<Locale, string>>;
    list: Partial<Record<Locale, string>>;
  };
  /**
   * Fumetti dei creator (pacchetto FUMETTI, 29/09/2026, `sitemapComics` in community/comics.ts): nella sezione "news", solo
   * nelle lingue in cui la pagina si indicizza, con la data di ogni versione; `latest` è l'ultimo uscito, che sposta il
   * lastmod di /news (li mostra in tutte le lingue) e dell'elenco /news/comics. Assente: nessun fumetto.
   */
  communityComics?: { comics: SitemapComic[]; latest?: string };
  /**
   * Mazzi torneo (04/10/2026, `listDeckSetIndex`): quelli sopra la soglia di parole, con le lingue in cui la scheda si
   * indicizza; `latest` è l'ultimo pubblicato o modificato (lastmod di /decks/tournament). Assente: nessun trio.
   */
  deckSets?: { sets: { slug: string; updated_at: string; locales: Locale[] }[]; latest?: string };
  /** voti alle carte (06/10/2026): l'ora dell'ultimo voto, per /tier-list/votes; assente prima della migrazione */
  cardVotes?: { latest?: string };
  /**
   * Win rate (riaperti il 10/10/2026): partite contate nella patch che mostra /tier-list/win-rate (`readWinrateGames`),
   * null o assente senza numeri sopra la soglia. La pagina entra in sitemap solo quando si indicizza, cioè dalle 100
   * partite in su (`isEarly` di tracker/stats.ts, la stessa regola del suo noindex).
   */
  winrateGames?: number | null;
};

export const EMPTY_COMMUNITY: CommunityData = { decks: [], deckRefs: null, tournaments: [], profiles: [], tierLists: { byUser: [] } };

/** Sezione di una scheda carta: prima le rimosse (anche le Leggendarie e le create), poi le create, poi le attive. */
export function cardSection(card: Pick<Card, "status" | "type">): "cards" | "cards-created" | "cards-removed" {
  if (card.status === "removed") return "cards-removed";
  return card.type === "token" ? "cards-created" : "cards";
}

type Dates = readonly (string | null | undefined)[];

/**
 * Una pagina della sitemap. `route` è il modello (la sua data sta in `PAGE_UPDATED` di `src/lib/lastmod.ts`),
 * `dates` le date dei dati che la pagina mostra: una funzione quando cambiano con la lingua (le guide).
 * `locales`: solo quando la pagina non esiste in tutte le lingue (mazzi della community senza traduzione).
 * `lastmod`: il giorno già calcolato da chi lo dichiara anche nella pagina, al posto di `route` + `dates` (le schede
 * carta, con `cardLastmod`: la stessa funzione del loro `dateModified`).
 * `images`: percorsi delle immagini del nostro dominio mostrate nella pagina (copertina, carta ufficiale).
 */
export type SitemapPage = {
  path: string;
  section: SitemapSection | "home";
  route: PageRoute;
  dates: Dates | ((locale: Locale) => Dates);
  lastmod?: (locale: Locale, today: Day) => Day;
  locales?: readonly Locale[];
  images?: (locale: Locale) => readonly (string | undefined)[];
};

/** Data di una news: l'ultima revisione, altrimenti la pubblicazione. */
const newsDay = (n: NewsItem) => n.updated ?? n.date;

/**
 * Solo le immagini del nostro dominio (percorsi di `public/`): Google accetta immagini di altri domini solo se anche
 * quelli sono verificati in Search Console, e le miniature di YouTube non lo sono.
 */
function ownImages(paths: readonly (string | undefined)[]): string[] {
  return [...new Set(paths.filter((p): p is string => typeof p === "string" && p.startsWith("/") && !p.startsWith("//")))].map((p) => `${siteUrl}${p}`);
}

/** Tutte le pagine della sitemap, con la loro sezione. */
export function sitemapPages(data: CommunityData): SitemapPage[] {
  const latestNews = latestDay(sortedNews.map(newsDay));
  const latestCommunity = latestDay([data.latestDeck, ...data.decks.map((c) => c.updated_at)]);
  const latestTournament = latestDay(data.tournaments.map((t) => t.updated_at));
  const patchDay = patches[latestPatch].date;
  const tierListOf = new Map(data.tierLists.byUser);
  const showcaseOf = new Map(data.showcase?.byUser ?? []);
  // Le guide hanno date per lingua: la versione spagnola non è più vecchia del 25/09/2026 (`getGuides`).
  const guidesBy = Object.fromEntries(locales.map((l) => [l, getGuides(l)])) as Record<Locale, Guide[]>;
  const guideOf = (l: Locale, slug: string) => guidesBy[l].find((g) => g.slug === slug);
  const cardDatesBy = (l: Locale) => cards.map((c) => cardDates(c, l, guidesBy[l]));
  // lingue in cui l'elenco /guides/community ha almeno una guida (pacchetto GUIDE)
  const communityListLocales = locales.filter((l) => data.communityGuides?.list[l]);

  return [
    // La home mostra le ultime news, i movimenti dell'ultima patch e la tier list.
    { path: "", section: "home", route: "/", dates: [latestNews, patchDay, tierList.updated] },
    // Dal 29/09/2026 /news mostra anche i fumetti dei creator (pacchetto FUMETTI), in tutte le lingue.
    { path: "/news", section: "pages", route: "/news", dates: [latestNews, data.communityComics?.latest] },
    // L'elenco dei fumetti: solo quando ce n'è almeno uno (vuoto è noindex), nelle lingue in cui almeno uno si legge.
    ...(data.communityComics?.comics.length
      ? [
          {
            path: "/news/comics",
            section: "pages",
            route: "/news/comics",
            dates: [data.communityComics.latest],
            locales: locales.filter((l) => data.communityComics?.comics.some((c) => c.locales.includes(l))),
          } satisfies SitemapPage,
        ]
      : []),
    // Dal 24/09/2026 la tier list mostra anche lo stato delle altre fonti e le anteprime dei mazzi pubblicati.
    { path: "/tier-list", section: "pages", route: "/tier-list", dates: [tierList.updated, latestCommunity, data.tierLists.latest] },
    // Le più giocate: calcolata dai mazzi pubblicati, cambia con loro.
    { path: "/tier-list/most-played", section: "pages", route: "/tier-list/most-played", dates: [latestCommunity] },
    // MetaShifting: cambia con le patch.
    { path: "/metashifting", section: "pages", route: "/metashifting", dates: [patchDay] },
    // Tier list personalizzabile: cambia quando cambiano le carte attive, cioè con una patch o una nuova verifica sul gioco.
    { path: "/tier-list/create", section: "pages", route: "/tier-list/create", dates: [patchDay, cardsVerified.date] },
    // Tier list della community: cambia quando qualcuno salva la sua.
    { path: "/tier-list/community", section: "pages", route: "/tier-list/community", dates: [data.tierLists.latest] },
    // Tier list dei voti alle carte (06/10/2026): cambia a ogni voto (l'ora dell'ultimo voto, da card_vote_totals).
    { path: "/tier-list/votes", section: "pages", route: "/tier-list/votes", dates: [data.cardVotes?.latest] },
    // Win rate (riaperti il 10/10/2026): solo quando la pagina si indicizza (almeno 100 partite nella patch mostrata);
    // sotto è noindex e fuori da hreflang. I numeri cambiano a ogni partita: le date sono quelle del modello.
    // In prova dal 10/10/2026 (solo Creator, Pro, Staff e admin): mai in sitemap finché ANALYTICS_PUBLIC è spento.
    ...(ANALYTICS_PUBLIC && data.winrateGames && !isEarly(data.winrateGames)
      ? [{ path: "/tier-list/win-rate", section: "pages", route: "/tier-list/win-rate", dates: [] } satisfies SitemapPage]
      : []),
    // Il database cambia con la più recente delle sue schede (nella lingua della pagina).
    { path: "/cards", section: "pages", route: "/cards", dates: (l) => [latestDay(cardDatesBy(l).flat())] },
    // I Luoghi cambiano con la rotazione del gioco (una patch) o con una verifica nel gioco.
    { path: "/locations", section: "pages", route: "/locations", dates: [patches[locationsPatch].date, locationsVerified?.date] },
    { path: "/decks", section: "pages", route: "/decks", dates: [...decks.map((d) => d.updated), latestCommunity] },
    // Mazzi torneo (04/10/2026): l'elenco entra solo quando c'è almeno un trio (vuoto è noindex)
    ...(data.deckSets?.latest
      ? [{ path: "/decks/tournament", section: "pages", route: "/decks/tournament", dates: [data.deckSets.latest] } satisfies SitemapPage]
      : []),
    // Il pool del deck builder segue le carte: patch e verifica sul gioco.
    { path: "/deck-builder", section: "pages", route: "/deck-builder", dates: [patchDay, cardsVerified.date] },
    // Il draft (02/10/2026) pesca dallo stesso pool del deck builder.
    { path: "/draft", section: "pages", route: "/draft", dates: [patchDay, cardsVerified.date] },
    // Guide editoriali e, dal 29/09/2026, le guide della community indicizzabili nella lingua: la pagina le mostra tutte in
    // un elenco solo, nell'HTML (ISR; Pierluigi: niente divisione fra guide ufficiali e della community).
    { path: "/guides", section: "pages", route: "/guides", dates: (l) => [...guidesBy[l].map((g) => g.updated), data.communityGuides?.hub[l]] },
    // Tutte le guide della community (pacchetto GUIDE): solo nelle lingue in cui l'elenco ha almeno una guida.
    ...(communityListLocales.length
      ? [{ path: "/guides/community", section: "pages", route: "/guides/community", dates: (l) => [data.communityGuides?.list[l]], locales: communityListLocales } satisfies SitemapPage]
      : []),
    // Calendario: eventi ufficiali (data del modello, events.ts) e tornei della community.
    { path: "/tournaments", section: "pages", route: "/tournaments", dates: [latestTournament] },
    // /faq è l'unica pagina con dati strutturati FAQPage. Le sue date sono quelle del modello.
    { path: "/faq", section: "pages", route: "/faq", dates: [] },
    { path: "/about", section: "pages", route: "/about", dates: [] },
    // OriginsMeta Analytics (02/10/2026; dal 10/10/2026 la pagina dell'app, con il download e la guida all'installazione). Date del modello.
    // In prova dal 10/10/2026: fuori dalla sitemap finché ANALYTICS_PUBLIC è spento (la pagina è noindex e dà 404 ai più).
    ...(ANALYTICS_PUBLIC ? [{ path: "/analytics", section: "pages", route: "/analytics", dates: [] } satisfies SitemapPage] : []),
    { path: "/authors", section: "pages", route: "/authors", dates: [] },
    // Directory dei creator (pacchetto CREATOR): solo da tre creator in su (sotto è noindex); cambia con i loro profili
    // e con i mazzi pubblicati, che mostra contati per autore.
    ...(directoryIndexable(data.showcase?.creators ?? 0)
      ? [{ path: "/creators", section: "pages", route: "/creators", dates: [data.showcase?.latest, latestCommunity] } satisfies SitemapPage]
      : []),
    // Pagine autore: l'elenco arriva da `src/lib/data/authors.ts` (file puro, non legge Supabase), così un autore
    // nuovo entra in sitemap senza che nessuno debba ricopiarne lo slug qui. Cambiano con le sue news e guide.
    ...authors.map(
      (a): SitemapPage => ({
        path: `/authors/${a.slug}`,
        section: "pages",
        route: "/authors/[slug]",
        dates: (l) => [...newsByAuthor(a.slug).map(newsDay), ...guidesByAuthor(l, a.slug).map((g) => g.updated)],
      }),
    ),
    // /privacy non entra in sitemap: la pagina è noindex, elencarla manderebbe un segnale contraddittorio.
    // Lo stesso giorno del `dateModified` della scheda, dalle stesse funzioni (`cardLastmod` in src/lib/cardDates.ts,
    // più i giorni dei mazzi elencati nella scheda in quella lingua: `cardPageLastmod` e `cardPageDeckDays`).
    // L'immagine è la carta ufficiale (media kit Koin, contenuto e non interfaccia), che la scheda mostra intera.
    ...cards.map(
      (c): SitemapPage => ({
        path: `/cards/${c.slug}`,
        section: cardSection(c),
        route: "/cards/[slug]",
        dates: [],
        lastmod: (l, today) => cardPageLastmod(cardLastmod(c, l, today, guidesBy[l]), l, cardPageDeckDays(c, l, data.deckRefs ?? null), today),
        images: () => [c.image],
      }),
    ),
    ...decks.map((d): SitemapPage => ({ path: `/decks/${d.slug}`, section: "decks", route: "/decks/[slug]", dates: [d.updated] })),
    ...guidesBy.en.map(
      (g): SitemapPage => ({
        path: `/guides/${g.slug}`,
        section: "guides",
        route: "/guides/[slug]",
        dates: (l) => [guideOf(l, g.slug)?.updated],
        images: (l) => [guideOf(l, g.slug)?.image],
      }),
    ),
    // Guide della community (pacchetto GUIDE, 27/09/2026): solo le lingue in cui la pagina si indicizza, come i mazzi,
    // con la data di ogni versione e la copertina (media kit, come le guide editoriali).
    ...(data.communityGuides?.guides ?? []).map(
      (g): SitemapPage => ({
        path: `/guides/community/${g.slug}`,
        section: "guides",
        route: "/guides/community/[slug]",
        dates: (l) => [g.dates[l]],
        locales: g.locales,
        images: () => [g.image],
      }),
    ),
    // Fumetti dei creator (pacchetto FUMETTI, 29/09/2026): nella sezione delle news, solo nelle lingue in cui la pagina si
    // indicizza (testi originali o tradotti), con la data di ogni versione. La copertina sta nello Storage di Supabase (un
    // altro dominio): niente immagine, come le guide della community con la copertina caricata.
    ...(data.communityComics?.comics ?? []).map(
      (c): SitemapPage => ({ path: `/news/comics/${c.slug}`, section: "news", route: "/news/comics/[slug]", dates: (l) => [c.dates[l]], locales: c.locales }),
    ),
    // Ogni news ha la sua pagina dal 21/09/2026: una news più vecchia non può dichiarare una pagina che non c'era.
    ...sortedNews.map(
      (n): SitemapPage => ({ path: newsPath(n), section: "news", route: "/news/[slug]", dates: [newsDay(n), NEWS_PAGES_SINCE], images: () => [n.image] }),
    ),
    // Solo le lingue in cui la guida si legge davvero (originale + traduzioni aggiornate, 25/09/2026): le altre
    // versioni della scheda sono noindex finché la traduzione non c'è.
    ...data.decks.map(
      (c): SitemapPage => ({ path: `/decks/community/${c.slug}`, section: "decks", route: "/decks/community/[slug]", dates: [c.updated_at], locales: c.locales }),
    ),
    // Mazzi torneo (04/10/2026): come i mazzi singoli, solo nelle lingue in cui la scheda si indicizza
    ...(data.deckSets?.sets ?? []).map(
      (c): SitemapPage => ({ path: `/decks/tournament/${c.slug}`, section: "decks", route: "/decks/tournament/[slug]", dates: [c.updated_at], locales: c.locales }),
    ),
    // Pagine pubbliche degli iscritti con qualcosa di loro (23/09/2026; tier list dal 25/09, guide della community dal 27/09).
    ...data.profiles.map(
      (p): SitemapPage => ({
        path: `/u/${p.username}`,
        section: "community",
        route: "/u/[username]",
        // anche la modifica di bio, canali e lingue (pacchetto CREATOR) cambia la pagina
        dates: [p.updated_at, tierListOf.get(p.username), showcaseOf.get(p.username)],
      }),
    ),
    ...data.tournaments.map((t): SitemapPage => ({ path: `/tournaments/${t.slug}`, section: "community", route: "/tournaments/[slug]", dates: [t.updated_at] })),
  ];
}

/** Le lingue in cui una pagina esiste, nell'ordine del sito. */
function langsOf(page: SitemapPage): Locale[] {
  return page.locales?.length ? locales.filter((l) => page.locales?.includes(l)) : [...locales];
}

/** La voce della sitemap di una pagina in una lingua: URL, giorno, hreflang (stesse righe dell'HTML) e immagini. */
export function pageEntry(page: SitemapPage, locale: Locale, today: Day): UrlEntry {
  const langs = langsOf(page);
  const alternates: Record<string, string> = {};
  for (const l of langs) alternates[l] = `${siteUrl}${href(l, page.path)}`;
  // x-default: la stessa riga che l'HTML dichiara in alternatesFor(), così i due segnali coincidono.
  alternates["x-default"] = `${siteUrl}${href(langs.includes(defaultLocale) ? defaultLocale : langs[0], page.path)}`;
  const lastmod = page.lastmod
    ? page.lastmod(locale, today)
    : pageLastmod(page.route, locale, typeof page.dates === "function" ? page.dates(locale) : page.dates, today);
  const images = ownImages(page.images?.(locale) ?? []);
  return { url: `${siteUrl}${href(locale, page.path)}`, lastmod, alternates, ...(images.length ? { images } : {}) };
}

/** Le voci della sitemap di una sezione in una lingua, nell'ordine delle pagine. */
export function sectionEntries(pages: readonly SitemapPage[], section: SitemapSection, locale: Locale, today: Day): UrlEntry[] {
  return pages.filter((p) => p.section === section && langsOf(p).includes(locale)).map((p) => pageEntry(p, locale, today));
}

/** Le voci della sitemap delle home, una per lingua. */
export function homeEntries(pages: readonly SitemapPage[], today: Day): UrlEntry[] {
  return pages.filter((p) => p.section === "home").flatMap((p) => langsOf(p).map((l) => pageEntry(p, l, today)));
}

/**
 * L'indice: la sitemap delle home e quella di ogni sezione in ogni lingua, con il giorno della pagina più recente che
 * elenca. Una sezione vuota in una lingua (per esempio nessun mazzo con la guida in spagnolo) resta fuori: Search
 * Console segnala le sitemap vuote.
 */
export function sitemapIndexEntries(pages: readonly SitemapPage[], today: Day): IndexEntry[] {
  const out: IndexEntry[] = [];
  const home = homeEntries(pages, today);
  if (home.length) out.push({ url: `${siteUrl}${HOME_SITEMAP_PATH}`, lastmod: latestDay(home.map((e) => e.lastmod)) });
  for (const locale of locales) {
    for (const section of SITEMAP_SECTIONS) {
      const entries = sectionEntries(pages, section, locale, today);
      if (entries.length) out.push({ url: `${siteUrl}${sectionSitemapPath(section, locale)}`, lastmod: latestDay(entries.map((e) => e.lastmod)) });
    }
  }
  return out;
}
