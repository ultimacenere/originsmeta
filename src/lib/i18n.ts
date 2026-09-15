import { en } from "./dictionaries/en";
import { it } from "./dictionaries/it";

export const locales = ["en", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
};

export const ogLocale: Record<Locale, string> = {
  en: "en_US",
  it: "it_IT",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, it };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const siteUrl = "https://originsmeta.com";

/** Percorso localizzato: href("it", "/cards") -> "/it/cards" */
export function href(locale: Locale, path: string = ""): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Alternates hreflang per una pagina (path senza prefisso lingua). */
export function alternatesFor(path: string = "") {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${siteUrl}${href(l, path)}`;
  }
  languages["x-default"] = `${siteUrl}${href(defaultLocale, path)}`;
  return { languages };
}

export function formatDate(locale: Locale, iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function formatDateShort(locale: Locale, iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

export function monthShort(locale: Locale, iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00Z" : ""));
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(d).replace(".", "");
}

export function dayNumber(iso: string): string {
  return String(Number(iso.slice(8, 10)));
}
