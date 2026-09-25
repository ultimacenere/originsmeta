import type { NextConfig } from "next";

/**
 * Gli URL di spam di aprile 2026 (/?r=…&channel=…&from=…, dal dominio parcheggiato prima di noi, TECH-10): la radice
 * con tutti e due i parametri non va più alla home (307 e poi 200, che li teneva in vita), ma risponde 410 da
 * `src/proxy.ts`. I redirect di questo file vengono prima del proxy, quindi quelli della radice vanno saltati in quel
 * caso e solo in quello. `missing` salta una regola appena c'è anche UNA delle chiavi elencate: per questo ogni regola
 * della radice esiste in due copie, una per chiave (`rootRedirect`). Con uno solo dei due parametri (/?r=discord,
 * /?channel=yt) una delle due copie scatta ancora e porta alla home nella lingua giusta, query compresa.
 */
const spamKeys = ["r", "channel"] as const;

/** Un redirect temporaneo della radice, in due copie: scatta se manca `r` oppure se manca `channel`. */
function rootRedirect(destination: string, acceptLanguage?: string) {
  return spamKeys.map((key) => ({
    source: "/",
    ...(acceptLanguage ? { has: [{ type: "header" as const, key: "accept-language", value: acceptLanguage }] } : {}),
    missing: [{ type: "query" as const, key }],
    destination,
    permanent: false,
  }));
}

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async redirects() {
    return [
      // La copia di Vercel (originsmeta.vercel.app) porta al dominio vero con lo stesso percorso, in modo permanente
      // (COMP-12, TRJ-05). Solo quell'host: le anteprime dei branch (altri *.vercel.app) e localhost restano come sono.
      {
        source: "/:path*",
        has: [{ type: "host", value: "originsmeta.vercel.app" }],
        destination: "https://originsmeta.com/:path*",
        permanent: true,
      },
      // Radice del sito: manda alla lingua del browser (it; es anche per catalano, galiziano e basco, che leggono lo
      // spagnolo), altrimenti inglese. Redirect temporanei (307), mai permanenti: la radice deve poter cambiare lingua
      // a ogni visita, e x-default resta /en. Si guarda solo la prima lingua dell'header (è un'espressione regolare);
      // i link brevi dei tornei pesano tutto l'elenco (`preferredLocale` in src/app/t/locale.ts).
      ...rootRedirect("/it", "^it.*"),
      ...rootRedirect("/es", "^(?:es|ca|gl|eu).*"),
      ...rootRedirect("/en"),
      // Il francese è stato ritirato dal sito: chi arriva da vecchi link va sulla versione inglese.
      { source: "/fr", destination: "/en", permanent: true },
      { source: "/fr/:path*", destination: "/en/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
