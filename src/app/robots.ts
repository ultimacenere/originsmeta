import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/i18n";

export default function robots(): MetadataRoute.Robots {
  return {
    // Le pagine arrivano complete dal server: il payload RSC (?_rsc=) serve solo alla navigazione nel browser, e i
    // prefetch dei link lo facevano scaricare a Googlebot per ogni carta di una griglia (78% delle richieste di
    // scansione il 25/09/2026). /xx/login resta scansionabile col suo noindex; le varianti ?next=… no.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/*?_rsc=", "/*&_rsc=", "/*/login?"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
