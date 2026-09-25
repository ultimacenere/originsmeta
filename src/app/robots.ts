import type { MetadataRoute } from "next";
import { locales, siteUrl } from "@/lib/i18n";
import { newsFeedPath } from "@/lib/newsFeed";

export default function robots(): MetadataRoute.Robots {
  return {
    // Le pagine arrivano complete dal server: il payload RSC (?_rsc=) serve solo alla navigazione nel browser, e i
    // prefetch dei link lo facevano scaricare a Googlebot per ogni carta di una griglia (78% delle richieste di
    // scansione il 25/09/2026). /xx/login resta scansionabile col suo noindex; le varianti ?next=… no.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/*?_rsc=", "/*&_rsc=", "/*/login?"] }],
    // Dal 25/09/2026 (Ondata 2) /sitemap.xml è l'indice delle sitemap per sezione e lingua (src/lib/sitemapEntries.ts).
    // I feed RSS delle news valgono anche come sitemap per Google e Bing: portano gli articoli nuovi appena escono.
    sitemap: [`${siteUrl}/sitemap.xml`, ...locales.map((l) => `${siteUrl}${newsFeedPath(l)}`)],
    host: siteUrl,
  };
}
