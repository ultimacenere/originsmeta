import { statSync } from "node:fs";
import { join } from "node:path";
import { href, siteUrl, type Locale } from "./i18n";
import { newsPath, sortedNews, type NewsItem } from "./data/news";
import { authorOfNews } from "./data/authors";
import { imageSizeOf } from "./imageSize";
import { imageMime, rssXml, type RssImage, type RssItem } from "./seoXml";

/**
 * Feed RSS delle news, uno per lingua: /en/news/feed.xml, /it/news/feed.xml, /es/news/feed.xml (Ondata 2 del piano
 * SEO/GEO, 25/09/2026: NEWS-08, TECH-15, GEO-15). Prima le news si scoprivano solo dalla sitemap e da Discord: il feed
 * le porta ai lettori RSS, ai bot RSS dei server Discord di altri giocatori e ai motori che leggono i feed (Google e
 * Bing li accettano anche come sitemap, e robots.txt li dichiara).
 *
 * Ogni voce: titolo dell'articolo (H1), link e guid (la pagina), data di pubblicazione, la meta description scritta
 * apposta, chi firma e la copertina. Il feed si genera alla build (le news cambiano solo con un deploy): lì `public/`
 * c'è, quindi misura e peso della copertina si leggono dal file. Import relativi, per `node --test`.
 */

/** Quante news tiene il feed: le più recenti. */
export const NEWS_FEED_ITEMS = 30;

/** Percorso del feed di una lingua. */
export function newsFeedPath(locale: Locale): string {
  return `/${locale}/news/feed.xml`;
}

/**
 * Titolo e descrizione del canale nelle tre lingue ("patch notes" in italiano, "notas del parche" in spagnolo, come
 * in docs/spagnolo.md). La descrizione dice sempre che il sito non è affiliato a Koin Games. Il titolo serve anche al
 * `<link rel="alternate">` delle pagine.
 */
export const newsFeedLabels: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Origins TCG news · OriginsMeta",
    description: "Origins TCG news from OriginsMeta: patch notes, events, demo updates and new features on the site. Unofficial fan site, not affiliated with Koin Games.",
  },
  it: {
    title: "News su Origins TCG · OriginsMeta",
    description: "Le news su Origins TCG di OriginsMeta: patch notes, eventi, novità della demo e del sito. Sito fan non ufficiale, non affiliato a Koin Games.",
  },
  es: {
    title: "Noticias de Origins TCG · OriginsMeta",
    description: "Noticias de Origins TCG en OriginsMeta: notas del parche, eventos, novedades de la demo y del sitio. Sitio fan no oficial, no afiliado a Koin Games.",
  },
};

/**
 * Data di pubblicazione di una news per il feed. Le news hanno solo il giorno: vale mezzogiorno UTC (come `formatDate`
 * in i18n.ts, così il giorno è lo stesso in tutti i fusi), mai oltre `now`, perché un lettore di feed metterebbe in
 * cima un articolo "dal futuro".
 */
export function newsPubDate(day: string, now: Date): Date {
  const noon = new Date(`${day.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(noon.getTime())) return now;
  return noon > now ? now : noon;
}

/** Peso in byte di un file di `public/` (per `enclosure`); undefined se non si legge. */
function bytesOf(publicPath: string): number | undefined {
  try {
    return statSync(join(process.cwd(), "public", publicPath.replace(/^\//, ""))).size;
  } catch {
    return undefined;
  }
}

/** Copertina di una news: le nostre con misura e peso, le miniature di YouTube con il solo indirizzo. */
function coverOf(n: NewsItem): RssImage | undefined {
  if (!n.image) return undefined;
  if (!n.image.startsWith("/")) return /^https:\/\//.test(n.image) ? { url: n.image, type: imageMime(n.image) } : undefined;
  const size = imageSizeOf(n.image);
  return { url: `${siteUrl}${n.image}`, type: imageMime(n.image), width: size?.width, height: size?.height, bytes: bytesOf(n.image) };
}

/** Le voci del feed di una lingua, dalla news più recente. */
export function newsFeedItems(locale: Locale, now: Date, limit = NEWS_FEED_ITEMS): RssItem[] {
  return sortedNews.slice(0, limit).map((n) => {
    const link = `${siteUrl}${href(locale, newsPath(n))}`;
    return {
      title: n.title[locale],
      link,
      guid: link,
      pubDate: newsPubDate(n.date, now),
      description: n.description[locale],
      creator: authorOfNews(n).name,
      image: coverOf(n),
    };
  });
}

/** Il feed RSS 2.0 di una lingua. */
export function newsFeedXml(locale: Locale, now: Date = new Date()): string {
  const items = newsFeedItems(locale, now);
  // l'ultima news pubblicata o rivista, non l'ora della build: un deploy senza news nuove non fa sembrare nuovo il feed
  const lastChange = sortedNews.reduce((best, n) => ((n.updated ?? n.date) > best ? (n.updated ?? n.date) : best), "");
  return rssXml({
    title: newsFeedLabels[locale].title,
    link: `${siteUrl}${href(locale, "/news")}`,
    self: `${siteUrl}${newsFeedPath(locale)}`,
    description: newsFeedLabels[locale].description,
    language: locale,
    lastBuildDate: lastChange ? newsPubDate(lastChange, now) : now,
    items,
  });
}
