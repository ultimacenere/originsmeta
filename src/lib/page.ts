import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternatesFor, getDictionary, isLocale, ogLocale, siteUrl, type Dictionary, type Locale } from "./i18n";

export type LocaleParams = Promise<{ locale: string }>;

/** Immagine social di riserva quando la pagina non ne ha una propria. */
export const defaultOgImage = "/media/og.jpg";

export async function resolveLocale(params: LocaleParams): Promise<{ locale: Locale; dict: Dictionary }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale) };
}

type PageMetaOptions = { type?: "website" | "article"; published?: string; modified?: string };

/**
 * Metadati di pagina: titolo con la parola chiave "Origins TCG" (aggiunta se manca), descrizione,
 * canonical + hreflang, Open Graph e Twitter con immagine (di default og.jpg).
 */
export function pageMeta(locale: Locale, path: string, title: string, description: string, image?: string, opts: PageMetaOptions = {}): Metadata {
  const url = `${siteUrl}/${locale}${path}`;
  const fullTitle = /origins/i.test(title) ? title : `${title} · Origins TCG`;
  const img = image ?? defaultOgImage;
  const base = { title: fullTitle, description, url, locale: ogLocale[locale], siteName: "OriginsMeta", images: [{ url: img }] };
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url, ...alternatesFor(path) },
    openGraph: opts.type === "article" ? { ...base, type: "article", publishedTime: opts.published, modifiedTime: opts.modified } : { ...base, type: "website" },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [img] },
  };
}
