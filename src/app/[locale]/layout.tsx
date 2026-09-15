import type { Metadata } from "next";
import { Unbounded, Manrope, JetBrains_Mono, Noto_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";
import { alternatesFor, getDictionary, href, isLocale, locales, ogLocale, siteUrl, type Locale } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { JsonLd, organization, website } from "@/components/JsonLd";

/** ID misurazione GA4 (pubblico). Parte solo con il consenso "Accetta tutto" del banner cookie. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-9J5Q803XJS";

const unbounded = Unbounded({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-unbounded", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-manrope", display: "swap" });
const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jet", display: "swap" });
// Solo per i tasti Discord: è il fallback dichiarato da Discord al posto del loro "gg sans" (proprietario).
const noto = Noto_Sans({ subsets: ["latin"], weight: ["600"], variable: "--font-noto", display: "swap" });

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
    alternates: { canonical: `${siteUrl}/${locale}`, ...alternatesFor("") },
    openGraph: {
      type: "website",
      siteName: d.meta.siteName,
      locale: ogLocale[locale],
      url: `${siteUrl}/${locale}`,
      title: d.meta.homeTitle,
      description: d.meta.description,
      images: [{ url: "/media/og.jpg", width: 1200, height: 630, alt: "Origins TCG" }],
    },
    twitter: { card: "summary_large_image", title: d.meta.homeTitle, description: d.meta.description, images: ["/media/og.jpg"] },
    robots: { index: true, follow: true },
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
    <html lang={l} className={`${unbounded.variable} ${manrope.variable} ${jet.variable} ${noto.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-mint focus:px-3 focus:py-2 focus:text-ink"
        >
          {d.nav.menu}
        </a>
        <Header locale={l} dict={d} />
        {children}
        <Footer locale={l} dict={d} />
        <CookieBanner labels={d.cookies} privacyHref={href(l, "/privacy")} />
        <JsonLd data={[website(l, d.meta.description), organization]} />
        <GoogleAnalytics id={GA_ID} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
