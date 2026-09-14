import type { Metadata } from "next";
import { Syne, Manrope, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { alternatesFor, getDictionary, isLocale, locales, ogLocale, siteUrl, type Locale } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-manrope", display: "swap" });
const jet = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jet", display: "swap" });

export const dynamicParams = false;

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
    title: { default: `${d.meta.siteName} · ${d.meta.tagline}`, template: `%s · ${d.meta.siteName}` },
    description: d.meta.description,
    alternates: { canonical: `${siteUrl}/${locale}`, ...alternatesFor("") },
    openGraph: {
      type: "website",
      siteName: d.meta.siteName,
      locale: ogLocale[locale],
      url: `${siteUrl}/${locale}`,
      title: `${d.meta.siteName} · ${d.meta.tagline}`,
      description: d.meta.description,
      images: [{ url: "/media/og.jpg", width: 1200, height: 630, alt: "Origins TCG" }],
    },
    twitter: { card: "summary_large_image", title: `${d.meta.siteName} · ${d.meta.tagline}`, description: d.meta.description, images: ["/media/og.jpg"] },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l: Locale = locale;
  const d = getDictionary(l);
  return (
    <html lang={l} className={`${syne.variable} ${manrope.variable} ${jet.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-ink"
        >
          {d.nav.menu}
        </a>
        <Header locale={l} dict={d} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={l} dict={d} />
      </body>
    </html>
  );
}
