import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async redirects() {
    return [
      // Radice del sito: manda alla lingua del browser (it), altrimenti inglese.
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "^it.*" }],
        destination: "/it",
        permanent: false,
      },
      { source: "/", destination: "/en", permanent: false },
      // Il francese è stato ritirato dal sito: chi arriva da vecchi link va sulla versione inglese.
      { source: "/fr", destination: "/en", permanent: true },
      { source: "/fr/:path*", destination: "/en/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
