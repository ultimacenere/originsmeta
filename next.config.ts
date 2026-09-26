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

/**
 * Lingua del visitatore per i redirect senza lingua (la radice e le sezioni): italiano; spagnolo anche per catalano,
 * galiziano e basco, che leggono lo spagnolo; altrimenti inglese (la regola senza `has`, sempre per ultima). Si guarda
 * solo la prima lingua dell'header (è un'espressione regolare); i link brevi dei tornei pesano tutto l'elenco
 * (`preferredLocale` in src/app/t/locale.ts).
 */
const browserLocales = [
  { locale: "it", acceptLanguage: "^it.*" },
  { locale: "es", acceptLanguage: "^(?:es|ca|gl|eu).*" },
] as const;

const acceptLanguage = (value: string) => [{ type: "header" as const, key: "accept-language", value }];

/** Un redirect temporaneo della radice, in due copie: scatta se manca `r` oppure se manca `channel`. */
function rootRedirect(destination: string, language?: string) {
  return spamKeys.map((key) => ({
    source: "/",
    ...(language ? { has: acceptLanguage(language) } : {}),
    missing: [{ type: "query" as const, key }],
    destination,
    permanent: false,
  }));
}

/**
 * Le sezioni del sito, cioè le cartelle di src/app/[locale]/(site) tranne `[...rest]` (il test in
 * `[...rest]/notFoundHtml.test.ts` controlla che l'elenco sia uguale alle cartelle: una sezione nuova va aggiunta qui).
 * Un indirizzo senza lingua con una sezione vera (/cards/merlin, /news/<slug>, /guides/<slug>, /cards, /faq), per
 * esempio un link incollato a mano, prima rispondeva 404 con i soli tasti verso le tre home, o con il guscio
 * `__next_error__` senza titolo (/cards, /decks, /faq): ora porta alla stessa pagina nella lingua del visitatore
 * (Ondata 1, correzione del 25/09/2026). Il resto del percorso e la query passano come sono; se la pagina non esiste
 * nemmeno con la lingua, risponde la 404 di quella lingua. Un primo segmento che non è né una lingua né una sezione
 * (/xx/pagina) resta alla 404 di `[...rest]/route.ts`.
 */
const sections = [
  "about",
  "account",
  "authors",
  "cards",
  "creators",
  "deck-builder",
  "decks",
  "faq",
  "guides",
  "locations",
  "login",
  "metashifting",
  "news",
  "privacy",
  "style",
  "tier-list",
  "tournaments",
  "u",
] as const;

/**
 * Redirect temporanei (307) delle sezioni senza lingua, con le stesse regole della radice, in due forme per lingua: la
 * sola sezione (/cards) e la sezione con il resto del percorso (/cards/merlin, /tournaments/<slug>/deck).
 * Il resto del percorso non ha punti (`[^.]+`): i redirect di questo file vengono PRIMA dei file di `public` (docs di
 * Next, next-config-js/redirects.md: "Redirects are checked before the filesystem which includes pages and `/public`
 * files"), e public/cards ha le illustrazioni, le miniature e le copertine (/cards/aladdin.webp, /cards/sm/…,
 * /cards/cover/…). Con un `:path*` qualunque finivano su /en/cards/aladdin.webp, la 404 della scheda carta, e sparivano
 * tutte le immagini delle carte. Nessuno slug del sito ha punti (carte, news, guide, mazzi e nomi utente sono fatti di
 * lettere, cifre e trattini); un percorso con un punto che non è un file (/news/a.b) resta alla 404, come prima.
 * Nessun giro: le destinazioni cominciano con una lingua, che non è mai una sezione. Test in notFoundHtml.test.ts con
 * il matcher vero di Next, su tutti i file di `public`.
 */
function sectionRedirects() {
  const section = `:section(${sections.join("|")})`;
  const forms = [
    { source: `/${section}`, rest: ":section" },
    { source: `/${section}/:path([^.]+)`, rest: ":section/:path" },
  ];
  const to = (locale: string, has?: ReturnType<typeof acceptLanguage>) =>
    forms.map(({ source, rest }) => ({ source, ...(has ? { has } : {}), destination: `/${locale}/${rest}`, permanent: false }));
  return [...browserLocales.flatMap(({ locale, acceptLanguage: language }) => to(locale, acceptLanguage(language))), ...to("en")];
}

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  // Miniature dei video YouTube dei mazzi e delle guide (pacchetto VIDEO, 26/09/2026): le scarica l'ottimizzatore del
  // sito, così il browser chiede solo /_next/image a originsmeta.com e non contatta Google prima del clic sul video
  // (`youtubeThumb` in src/lib/videos.ts, lettore `VideoEmbed`). Solo i.ytimg.com/vi/…, senza query.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" }],
  },
  // Overlay per OBS (pacchetto STREAM, 26/09/2026, src/app/overlay): mai indicizzato, e usabile anche dentro un iframe
  // (frame-ancestors aperto: la pagina mostra un mazzo pubblico e non ha azioni). La sorgente browser di OBS non è un
  // iframe e funzionerebbe comunque; questa riga resta valida anche se un giorno il sito chiuderà gli iframe altrove.
  async headers() {
    return [
      {
        source: "/overlay/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
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
      // Radice del sito: manda alla lingua del browser (`browserLocales`). Redirect temporanei (307), mai permanenti:
      // la radice deve poter cambiare lingua a ogni visita, e x-default resta /en.
      ...browserLocales.flatMap(({ locale, acceptLanguage: language }) => rootRedirect(`/${locale}`, language)),
      ...rootRedirect("/en"),
      // Sezioni senza lingua (/cards/merlin, /news/<slug>…): la stessa pagina nella lingua del browser.
      ...sectionRedirects(),
      // Il francese è stato ritirato dal sito: chi arriva da vecchi link va sulla versione inglese.
      { source: "/fr", destination: "/en", permanent: true },
      { source: "/fr/:path*", destination: "/en/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
