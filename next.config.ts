import type { NextConfig } from "next";

/**
 * Gli URL di spam di aprile 2026 (/?r=…&channel=…&from=…, dal dominio parcheggiato prima di noi, TECH-10): la radice
 * con questi parametri non va più alla home (307 e poi 200, che li teneva in vita), ma risponde 410 da `src/proxy.ts`
 * (i redirect di questo file vengono prima del proxy, quindi qui vanno saltati). Con una sola delle due chiavi il
 * redirect salta comunque e resta la 404 globale.
 */
const spamQuery = [
  { type: "query" as const, key: "r" },
  { type: "query" as const, key: "channel" },
];

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
      // a ogni visita, e x-default resta /en.
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "^it.*" }],
        missing: spamQuery,
        destination: "/it",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "^(?:es|ca|gl|eu).*" }],
        missing: spamQuery,
        destination: "/es",
        permanent: false,
      },
      { source: "/", missing: spamQuery, destination: "/en", permanent: false },
      // Il francese è stato ritirato dal sito: chi arriva da vecchi link va sulla versione inglese.
      { source: "/fr", destination: "/en", permanent: true },
      { source: "/fr/:path*", destination: "/en/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
