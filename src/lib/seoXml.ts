/**
 * XML per i motori e i lettori di feed (Ondata 2 del piano SEO/GEO, 25/09/2026: TECH-07, CARDS-16, NEWS-08):
 * sitemap (`<urlset>` con hreflang e immagini), indice delle sitemap (`<sitemapindex>`) e feed RSS 2.0 delle news.
 *
 * Perché scritto a mano e non con la convenzione `sitemap.ts` di Next: con più sitemap Next le serve sotto
 * `/…/sitemap/<id>.xml` (generateSitemaps), cioè in una cartella, e per Google "una sitemap vale solo per i
 * discendenti della cartella in cui sta" (docs "Build and submit a sitemap"): una sitemap in /sitemap/ non potrebbe
 * elencare /en/cards/…. Le nostre stanno invece in /<lingua>/sitemap-<sezione>.xml, sopra le pagine che elencano,
 * e le servono route handler che usano queste funzioni.
 *
 * Funzioni pure, senza import: `node --test src/lib/seoXml.test.ts`.
 */

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>';

/** Testo sicuro dentro un elemento o un attributo XML. */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c);
}

/** Una pagina della sitemap: URL assoluto, giorno dell'ultima modifica, versioni nelle altre lingue, immagini. */
export type UrlEntry = {
  url: string;
  /** solo il giorno (aaaa-mm-gg), come lo calcola `src/lib/lastmod.ts` */
  lastmod?: string;
  /** hreflang → URL assoluto, x-default compreso */
  alternates?: Readonly<Record<string, string>>;
  /** URL assoluti delle immagini mostrate nella pagina (Google ne legge al massimo 1.000 per pagina) */
  images?: readonly string[];
};

/**
 * `<urlset>` di una sitemap. Ordine degli elementi come nello schema del protocollo (loc, lastmod, poi le estensioni
 * hreflang e immagini); niente `changefreq` né `priority`: Google li ignora ("Google ignores <priority> and
 * <changefreq> values", docs "Build and submit a sitemap"), e la priorità la dicono i link interni.
 * Delle immagini solo `image:loc`: Google ha tolto dalla documentazione title, caption, geo_location e license.
 */
export function urlsetXml(entries: readonly UrlEntry[]): string {
  const out = [
    XML_HEAD,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];
  for (const e of entries) {
    out.push("<url>", `<loc>${escapeXml(e.url)}</loc>`);
    if (e.lastmod) out.push(`<lastmod>${escapeXml(e.lastmod)}</lastmod>`);
    for (const [lang, href] of Object.entries(e.alternates ?? {})) {
      out.push(`<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}"/>`);
    }
    for (const image of (e.images ?? []).slice(0, 1000)) out.push(`<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`);
    out.push("</url>");
  }
  out.push("</urlset>", "");
  return out.join("\n");
}

/** Una sitemap dell'indice: URL assoluto e giorno dell'ultima modifica della pagina più recente che elenca. */
export type IndexEntry = { url: string; lastmod?: string };

/** `<sitemapindex>`: l'indice che sta su /sitemap.xml, l'indirizzo già inviato a Search Console. */
export function sitemapIndexXml(items: readonly IndexEntry[]): string {
  const out = [XML_HEAD, '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const s of items) {
    out.push("<sitemap>", `<loc>${escapeXml(s.url)}</loc>`);
    if (s.lastmod) out.push(`<lastmod>${escapeXml(s.lastmod)}</lastmod>`);
    out.push("</sitemap>");
  }
  out.push("</sitemapindex>", "");
  return out.join("\n");
}

/** Tipo MIME di un'immagine dall'estensione del percorso; undefined se non è un formato noto. */
export function imageMime(path: string): string | undefined {
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(path)?.[1]?.toLowerCase();
  const types: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", avif: "image/avif" };
  return ext ? types[ext] : undefined;
}

/** Copertina di una voce del feed: `media:content` (Media RSS) e, se si conosce il peso del file, anche `enclosure`. */
export type RssImage = { url: string; type?: string; width?: number; height?: number; bytes?: number };

export type RssItem = {
  title: string;
  link: string;
  /** identificatore stabile: il link della pagina, che non cambia */
  guid: string;
  pubDate: Date;
  description: string;
  /** chi firma l'articolo (Dublin Core: `author` di RSS vuole un indirizzo email) */
  creator?: string;
  image?: RssImage;
};

export type RssChannel = {
  title: string;
  /** pagina del sito che il feed segue (/<lingua>/news) */
  link: string;
  /** indirizzo del feed stesso (atom:link rel="self", richiesto dai validatori) */
  self: string;
  description: string;
  /** codice lingua RSS: en, it, es */
  language: string;
  lastBuildDate: Date;
  items: readonly RssItem[];
};

/** Data nel formato di RSS 2.0 (RFC 822): "Thu, 25 Sep 2026 12:00:00 GMT". */
export function rfc822(date: Date): string {
  return date.toUTCString();
}

/** Feed RSS 2.0 con i namespace Atom (self), Dublin Core (firma) e Media RSS (copertina). */
export function rssXml(ch: RssChannel): string {
  const out = [
    XML_HEAD,
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
    "<channel>",
    `<title>${escapeXml(ch.title)}</title>`,
    `<link>${escapeXml(ch.link)}</link>`,
    `<atom:link href="${escapeXml(ch.self)}" rel="self" type="application/rss+xml"/>`,
    `<description>${escapeXml(ch.description)}</description>`,
    `<language>${escapeXml(ch.language)}</language>`,
    `<lastBuildDate>${rfc822(ch.lastBuildDate)}</lastBuildDate>`,
  ];
  for (const it of ch.items) {
    out.push(
      "<item>",
      `<title>${escapeXml(it.title)}</title>`,
      `<link>${escapeXml(it.link)}</link>`,
      `<guid isPermaLink="true">${escapeXml(it.guid)}</guid>`,
      `<pubDate>${rfc822(it.pubDate)}</pubDate>`,
      `<description>${escapeXml(it.description)}</description>`,
    );
    if (it.creator) out.push(`<dc:creator>${escapeXml(it.creator)}</dc:creator>`);
    const img = it.image;
    if (img) {
      const type = img.type ?? imageMime(img.url);
      const attrs = [`url="${escapeXml(img.url)}"`, 'medium="image"'];
      if (type) attrs.push(`type="${escapeXml(type)}"`);
      if (img.width && img.height) attrs.push(`width="${img.width}"`, `height="${img.height}"`);
      out.push(`<media:content ${attrs.join(" ")}/>`);
      // `enclosure` vuole il peso in byte: senza (copertine YouTube) resta solo media:content
      if (img.bytes && type) out.push(`<enclosure url="${escapeXml(img.url)}" length="${img.bytes}" type="${escapeXml(type)}"/>`);
    }
    out.push("</item>");
  }
  out.push("</channel>", "</rss>", "");
  return out.join("\n");
}
