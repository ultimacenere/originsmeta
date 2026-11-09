import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n";
import { LANGUAGE_ALIASES, preferredLocale } from "@/app/t/locale";

/**
 * Pezzi comuni alle due rotte di Steam (/auth/steam e /auth/steam/callback), come nel ritorno /auth/callback.
 */

/** Origine pubblica della richiesta: dietro Vercel arriva negli header x-forwarded-*, in locale coincide con l'URL. */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;
}

/** La lingua del primo pezzo di un percorso interno (/it/account → it), se è una lingua del sito. */
export function localeFromPath(path: string | null | undefined): Locale | null {
  const seg = path?.split("/")[1]?.split(/[?#]/)[0] ?? "";
  return isLocale(seg) ? seg : null;
}

/** La lingua del browser quando il percorso non la dice (stessa scelta dei link brevi /t). */
export function browserLocale(request: Request): Locale {
  return preferredLocale(request.headers.get("accept-language"), locales, defaultLocale, LANGUAGE_ALIASES);
}

/** Pagina di accesso con l'errore di Steam, il metodo e la pagina a cui tornare dopo. */
export function loginErrorPath(locale: Locale, kind: string, next: string): string {
  return `/${locale}/login?error=${encodeURIComponent(kind)}&via=steam&next=${encodeURIComponent(next)}`;
}
