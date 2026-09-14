import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternatesFor, getDictionary, isLocale, ogLocale, siteUrl, type Dictionary, type Locale } from "./i18n";

export type LocaleParams = Promise<{ locale: string }>;

export async function resolveLocale(params: LocaleParams): Promise<{ locale: Locale; dict: Dictionary }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale) };
}

export function pageMeta(locale: Locale, path: string, title: string, description: string, image?: string): Metadata {
  const url = `${siteUrl}/${locale}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url, ...alternatesFor(path) },
    openGraph: {
      title,
      description,
      url,
      locale: ogLocale[locale],
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}
