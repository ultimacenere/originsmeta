import { en } from "./dictionaries/en";
import { it } from "./dictionaries/it";
import { es } from "./dictionaries/es";

/** Lingue del sito: inglese (riferimento dei dizionari), italiano e, dal 25/09/2026, spagnolo. */
export const locales = ["en", "it", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  es: "Español",
};

export const ogLocale: Record<Locale, string> = {
  en: "en_US",
  it: "it_IT",
  es: "es_ES",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, it, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const siteUrl = "https://originsmeta.com";

/** Percorso localizzato: href("it", "/cards") -> "/it/cards" */
export function href(locale: Locale, path: string = ""): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/**
 * Alternates hreflang per una pagina (path senza prefisso lingua). `only` limita le lingue a quelle in cui la
 * pagina esiste davvero nella sua lingua (per esempio un mazzo della community senza traduzione): x-default va
 * all'inglese se c'è, altrimenti alla prima lingua disponibile.
 */
export function alternatesFor(path: string = "", only?: readonly Locale[]) {
  const list = only?.length ? locales.filter((l) => only.includes(l)) : locales;
  const languages: Record<string, string> = {};
  for (const l of list) {
    languages[l] = `${siteUrl}${href(l, path)}`;
  }
  languages["x-default"] = `${siteUrl}${href(list.includes(defaultLocale) ? defaultLocale : list[0], path)}`;
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
