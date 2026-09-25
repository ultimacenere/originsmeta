import type { Metadata } from "next";
import { Unbounded, Manrope, JetBrains_Mono, Noto_Sans, Caveat, Reenie_Beanie } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";
import { getDictionary, href, isLocale, locales, ogLocale, siteUrl, type Locale } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SignupTracker } from "@/components/SignupTracker";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { feedbackLabels } from "@/lib/feedbackLabels";
import { JsonLd, organization, videoGame, website } from "@/components/JsonLd";
import { defaultOgAlt } from "@/lib/page";

/** ID misurazione GA4 (pubblico). Parte solo con il consenso "Accetta tutto" del banner cookie. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9J5Q803XJS";

const unbounded = Unbounded({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-unbounded", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-manrope", display: "swap" });
const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jet", display: "swap" });
// Solo per i tasti Discord: è il fallback dichiarato da Discord al posto del loro "gg sans" (proprietario).
const noto = Noto_Sans({ subsets: ["latin"], weight: ["600"], variable: "--font-noto", display: "swap" });
// Solo per i post-it (note del 22/09/2026: "scritto a penna"): Caveat, una grafia a penna leggibile anche piccola,
// con le lettere accentate dell'italiano. Variabile (400-700, un solo file). Niente preload: serve a pochi
// foglietti per pagina e non deve contendere la banda ai font del testo; con display swap si vede subito il ripiego.
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap", preload: false });
// Solo per i due post-it grandi di Tier list e MetaShifting in home (Pierluigi, 22/09/2026: "come se stessi
// scrivendo a penna", poi "scritte di fretta"): Reenie Beanie, una biro veloce e irregolare. Niente preload.
const pen = Reenie_Beanie({ subsets: ["latin"], weight: ["400"], variable: "--font-pen", display: "swap", preload: false });

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
  return (
    <html lang={l} className={`${unbounded.variable} ${manrope.variable} ${jet.variable} ${noto.variable} ${hand.variable} ${pen.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {/* Salta al contenuto: il <main> ha id="main" sia nella home sia nel gruppo (site). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-mint focus:px-3 focus:py-2 focus:text-ink"
        >
          {d.nav.skipToContent}
        </a>
        <Header locale={l} dict={d} />
        {children}
        <Footer locale={l} dict={d} />
        {/* Segnalazioni e suggerimenti dei visitatori: su ogni pagina, fuori dal <main>, prima del banner dei cookie */}
        <FeedbackWidget locale={l} labels={feedbackLabels(d)} />
        <CookieBanner labels={d.cookies} privacyHref={href(l, "/privacy")} />
        <JsonLd data={[website(l, d.meta.siteDescription), organization, videoGame]} />
        <GoogleAnalytics id={GA_ID} />
        <SignupTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
