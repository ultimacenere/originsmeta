import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans, Caveat, Reenie_Beanie, Noto_Sans_SC, Long_Cang } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";
import { siteFontVariables } from "@/fonts";
import { getDictionary, href, htmlLang, isLocale, locales, ogLocale, siteUrl, type Locale } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { GoogleAnalytics, VercelAnalytics } from "@/components/GoogleAnalytics";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { feedbackLabels } from "@/lib/feedbackLabels";
import { JsonLd, koinGames, organization, videoGame, website } from "@/components/JsonLd";
import { defaultOgAlt } from "@/lib/page";
import { newsFeedLabels, newsFeedPath } from "@/lib/newsFeedMeta";
import { KickstarterBar } from "@/components/KickstarterBar";
import { kickstarterPromoActive } from "@/lib/kickstarter";
import { kickstarterLabels } from "@/lib/kickstarterLabels";
import { TournamentPromoDialog } from "@/components/TournamentPromo";
import { TOURNAMENT_PROMO, promoActive } from "@/lib/tournamentPromo";
import { tournamentPromoText } from "@/lib/tournamentPromoLabels";

/**
 * I caratteri del sito sono ingranditi con `size-adjust` (src/fonts/index.ts). Safari prima della 17 non lo conosce e
 * mostrerebbe i titoli piccolissimi: questa riga gira prima del codice del sito (next/script, beforeInteractive) e
 * mette `data-no-sa` sull'<html>; globals.css lì usa il carattere del testo anche per titoli, tasti e nomi. L'<html> ha
 * `suppressHydrationWarning` per questo attributo, che il server non conosce.
 */
const NO_SIZE_ADJUST = `try{var f=new FontFace("om","local(Arial)",{sizeAdjust:"120%"});if(f.sizeAdjust!=="120%")document.documentElement.setAttribute("data-no-sa","")}catch(e){document.documentElement.setAttribute("data-no-sa","")}`;

/** ID misurazione GA4 (pubblico). Parte solo con il consenso "Accetta tutto" del banner cookie. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9J5Q803XJS";

// I caratteri del sito (Sofia Sans in tre larghezze, dal 12/11/2026) stanno in src/fonts: titoli, tasti e nomi, testo.
// JetBrains Mono resta solo per il codice (comandi da copiare, <code>): niente preload, serve in poche pagine.
const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jet", display: "swap", preload: false });
// Solo per i tasti Discord: è il fallback dichiarato da Discord al posto del loro "gg sans" (proprietario).
const noto = Noto_Sans({ subsets: ["latin"], weight: ["600"], variable: "--font-noto", display: "swap" });
// Solo per i post-it (note del 22/09/2026: "scritto a penna"): Caveat, una grafia a penna leggibile anche piccola,
// con le lettere accentate dell'italiano. Variabile (400-700, un solo file). Niente preload: serve a pochi
// foglietti per pagina e non deve contendere la banda ai font del testo; con display swap si vede subito il ripiego.
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap", preload: false });
// Solo per i due post-it grandi di Tier list e MetaShifting in home (Pierluigi, 22/09/2026: "come se stessi
// scrivendo a penna", poi "scritte di fretta"): Reenie Beanie, una biro veloce e irregolare. Niente preload.
const pen = Reenie_Beanie({ subsets: ["latin"], weight: ["400"], variable: "--font-pen", display: "swap", preload: false });

// Pagine russe (20/10/2026): il font dei tasti Discord e quello dei post-it con il cirillico, istanze a parte senza
// preload, così le altre lingue non scaricano i file cirillici (i caratteri del sito lo hanno già diviso per gruppi di
// lettere, vedi src/fonts). Reenie Beanie non ha il cirillico: in russo i post-it grandi ripiegano sul font di riserva.
const notoCyr = Noto_Sans({ subsets: ["latin", "cyrillic"], weight: ["600"], variable: "--font-noto", display: "swap", preload: false });
const handCyr = Caveat({ subsets: ["latin", "cyrillic"], variable: "--font-hand", display: "swap", preload: false });

// Pagine cinesi (04/11/2026): i font latini restano per lettere e numeri, gli ideogrammi vengono da Noto Sans SC (testo e
// titoli) e Long Cang (post-it a penna), dichiarati dopo i latini in globals.css. Senza preload: Google li divide in tanti
// file per gruppi di caratteri e il browser scarica solo quelli che la pagina usa; le altre lingue non li toccano.
const cjk = Noto_Sans_SC({ subsets: ["latin"], variable: "--font-cjk", display: "swap", preload: false });
const cjkHand = Long_Cang({ subsets: ["latin"], weight: ["400"], variable: "--font-cjk-hand", display: "swap", preload: false });

// dynamicParams resta al default (true): le lingue sconosciute finiscono in notFound() qui sotto, e le pagine
// generate su richiesta (mazzi della community) restano possibili.

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: d.meta.homeTitle, template: `%s · ${d.meta.siteName}` },
    description: d.meta.description,
    // Niente canonical né hreflang qui (Ondata 1, 25/09/2026): ogni pagina li dichiara con `pageMeta`, e una pagina
    // che li ereditasse dal layout (una 404, un errore) punterebbe alla home. Le 404 li azzerano in (site)/not-found.tsx.
    openGraph: {
      type: "website",
      siteName: d.meta.siteName,
      locale: ogLocale[locale],
      url: `${siteUrl}/${locale}`,
      title: d.meta.homeTitle,
      description: d.meta.description,
      images: [{ url: "/media/og.jpg", width: 1200, height: 630, alt: defaultOgAlt[locale] }],
    },
    twitter: { card: "summary_large_image", title: d.meta.homeTitle, description: d.meta.description, images: ["/media/og.jpg"] },
    // Anteprime grandi in Discover e in Google Immagini (NEWS-05): valgono per tutto il sito. Una pagina noindex
    // (`pageMeta` con `noindex`, account, login…) dichiara il proprio `robots`, che sostituisce per intero questo.
    robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    // Verifica della proprietà su Google Search Console (account ultimacenere@gmail.com).
    verification: { google: "ck0gbXaqDgigihYXiyoKywmrKP2LOC2YOOYFu6c8SZs" },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const d = getDictionary(l);
  // Popup di un torneo (05/11/2026): qui solo i dati (e niente popup nelle build dopo la fine); ora esatta, banner dei
  // cookie e pagina li decide il browser
  const promo = TOURNAMENT_PROMO && promoActive(new Date().getTime(), TOURNAMENT_PROMO) ? TOURNAMENT_PROMO : null;
  return (
    <html
      lang={htmlLang[l]}
      suppressHydrationWarning
      className={`${siteFontVariables} ${jet.variable} ${l === "ru" ? `${notoCyr.variable} ${handCyr.variable}` : `${noto.variable} ${hand.variable}`} ${l === "zh-cn" ? `${cjk.variable} ${cjkHand.variable}` : ""} ${pen.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="om-no-size-adjust" strategy="beforeInteractive">
          {NO_SIZE_ADJUST}
        </Script>
        {/* Feed RSS delle news nella lingua della pagina (Ondata 2): React 19 porta i <link> nel <head>. Percorso e titolo
            dal modulo leggero newsFeedMeta.ts (non da newsFeed.ts, che legge news, autori e file). Non passa dai
            metadati perché `alternates` di `pageMeta` (canonical e hreflang di ogni pagina) sostituirebbe quello del layout. */}
        <link rel="alternate" type="application/rss+xml" title={newsFeedLabels[l].title} href={`${siteUrl}${newsFeedPath(l)}`} />
        {/* Salta al contenuto: il <main> ha id="main" sia nella home sia nel gruppo (site). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-mint focus:px-3 focus:py-2 focus:text-ink"
        >
          {d.nav.skipToContent}
        </a>
        {/* Il Kickstarter della Alpha Edition (26/10/2026): una riga verso la landing, finché dura la promozione; sulla home
            non qui ma sotto lo slider (27/10/2026), dove la monta la pagina */}
        {kickstarterPromoActive(new Date()) ? (
          <KickstarterBar
            landingHref={href(l, "/kickstarter")}
            homeHref={href(l, "/")}
            text={kickstarterLabels[l].bar.text}
            cta={kickstarterLabels[l].bar.cta}
            closeLabel={kickstarterLabels[l].bar.close}
          />
        ) : null}
        <Header locale={l} dict={d} />
        {children}
        <Footer locale={l} dict={d} />
        {/* Segnalazioni e suggerimenti dei visitatori: su ogni pagina, fuori dal <main>, prima del banner dei cookie */}
        <FeedbackWidget locale={l} labels={feedbackLabels(d)} />
        {/* Popup di un torneo della community (05/11/2026): src/lib/tournamentPromo.ts. Porta al riquadro dell'iscrizione. */}
        {promo ? (
          <TournamentPromoDialog
            promo={{
              slug: promo.slug,
              tag: promo.tag,
              name: promo.name,
              organizer: promo.organizer,
              startsAt: promo.startsAt,
              until: promo.until,
              cover: promo.cover,
              decks: promo.decks,
              bestOf: promo.bestOf,
              prize: promo.prize,
            }}
            lang={htmlLang[l]}
            href={`${href(l, `/tournaments/${promo.slug}`)}#join`}
            labels={tournamentPromoText(l, d.tournaments, promo)}
          />
        ) : null}
        <CookieBanner labels={d.cookies} privacyHref={href(l, "/privacy")} />
        {/* Il grafo del sito su ogni pagina (Ondata 2, GEO-08): il sito nella lingua, OriginsMeta con i fondatori, Koin
            Games come entità propria e il gioco, che la usa per @id come sviluppatore ed editore */}
        <JsonLd data={[website(l, d.meta.siteDescription), organization, koinGames, videoGame]} />
        {/* GA4 col consenso, eventi, sign_up/login al ritorno dall'accesso, traffico interno: vedi src/lib/analytics.ts */}
        <GoogleAnalytics id={GA_ID} />
        {/* Vercel Web Analytics senza il traffico interno dello staff (?staff=<codice>): vedi src/lib/analytics.ts */}
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
