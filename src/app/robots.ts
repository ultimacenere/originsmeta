import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/i18n";

export default function robots(): MetadataRoute.Robots {
  return {
    // Le pagine arrivano complete dal server: il payload RSC (?_rsc=) serve solo alla navigazione nel browser, e i
    // prefetch dei link lo facevano scaricare a Googlebot per ogni carta di una griglia (78% delle richieste di
    // scansione il 25/09/2026). /xx/login resta scansionabile col suo noindex; le varianti ?next=… no.
    // Strumenti per le dirette (pacchetto STREAM, 26/09/2026): l'overlay per OBS (dinamico, noindex) e i PNG da
    // scaricare non servono ai motori. L'immagine senza download=1 resta aperta: è l'og:image delle schede dei mazzi,
    // e il crawler di X rispetta robots.txt.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/*?_rsc=", "/*&_rsc=", "/*/login?", "/overlay/", "/api/deck-image/*download=1"] }],
    // Dal 25/09/2026 (Ondata 2) /sitemap.xml è l'indice delle sitemap per sezione e lingua (src/lib/sitemapEntries.ts):
    // basta lui. I feed RSS delle news no: danno la data di uscita, la sitemap quella dell'ultima revisione.
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
