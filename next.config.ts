import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async redirects() {
    return [
      // Radice del sito: manda alla lingua del browser (it, fr), altrimenti inglese.
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "^it.*" }],
        destination: "/it",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "header", key: "accept-language", value: "^fr.*" }],
        destination: "/fr",
        permanent: false,
      },
      { source: "/", destination: "/en", permanent: false },
    ];
  },
};

export default nextConfig;
