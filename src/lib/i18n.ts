import { en } from "./dictionaries/en";
import { it } from "./dictionaries/it";
import { fr } from "./dictionaries/fr";

export const locales = ["en", "it", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  fr: "Français",
};

export const ogLocale: Record<Locale, string> = {
  en: "en_US",
  it: "it_IT",
  fr: "fr_FR",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, it, fr };

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
