import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n";
import { LANGUAGE_ALIASES, preferredLocale } from "@/app/t/locale";
import { authErrorKind, type AuthErrorKind } from "@/lib/loginLabels";
import { isNewAccount, withAuthSignal } from "@/lib/analytics";

/** Solo percorsi interni: niente redirect verso altri siti. */
function safeNext(raw: string | null, locale: Locale): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return `/${locale}/account`;
  return raw;
}

/**
 * Lingua del browser quando `next` non la dice (link vecchi, `next` mancante): la stessa scelta dei link brevi /t
 * (src/app/t/locale.ts), cioè la lingua supportata con il peso q più alto nell'header accept-language, con catalano,
 * galiziano e basco portati sullo spagnolo; altrimenti l'inglese.
 */
function pickLocale(request: Request): Locale {
  return preferredLocale(request.headers.get("accept-language"), locales, defaultLocale, LANGUAGE_ALIASES);
}

/**
 * Ritorno da Discord (OAuth) o dal link via email: scambia il codice con una sessione,
 * scrive i cookie e rimanda l'utente alla pagina da cui era partito (`next`, compresa la query:
 * per esempio il deck builder con il mazzo nell'indirizzo).
 *
 * In caso di errore torna alla pagina di accesso con `?error=<tipo>` (vedi `authErrorKind`): il pannello
 * spiega che cosa è successo (link scaduto o già usato, aperto in un altro browser, Discord annullato).
 * `via` lo aggiunge LoginPanel all'indirizzo di ritorno per distinguere Discord dall'email.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawNext = url.searchParams.get("next");
  const seg = rawNext?.split("/")[1]?.split("?")[0] ?? "";
  const locale: Locale = isLocale(seg) ? seg : pickLocale(request);
  const next = safeNext(rawNext, locale);
  const via = url.searchParams.get("via") === "discord" ? "discord" : "email";
  // Dietro Vercel l'origine reale arriva negli header x-forwarded-*; in locale coincide con l'URL richiesto.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;
  // `via` sempre: serve al pannello per classificare l'errore nel frammento (#error=…) e alla misura (metodo di login_error).
  const fail = (kind: AuthErrorKind | null) => NextResponse.redirect(`${origin}/${locale}/login?error=${kind ?? "generic"}&via=${via}&next=${encodeURIComponent(next)}`);

  const supabase = await supabaseServer();
  if (!supabase) return NextResponse.redirect(`${origin}/${locale}`);
  const providerError = url.searchParams.get("error");
  const providerCode = url.searchParams.get("error_code");
  if (providerError || providerCode) return fail(authErrorKind(providerError, providerCode, via));

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  // Misura (evento sign_up online dal 25/09/2026, a9400e8; login e il resto con l'Ondata 2, MIS-01): il ritorno porta
  // ?om_auth=sign_up|login&om_method=discord|email; l'evento lo manda il browser all'arrivo e toglie il segnale
  // dall'indirizzo (`consumeAuthSignal` in src/lib/analytics.ts, chiamata da GoogleAnalytics.tsx). Qui niente eventi.
  // Un account nuovo lo riconosce `isNewAccount`: con l'email conta la conferma appena avvenuta, perché Supabase crea
  // l'utente quando spedisce il link e `last_sign_in_at` arriva solo quando lo si apre (minuti dopo).
  const done = (user: Parameters<typeof isNewAccount>[0]) => NextResponse.redirect(`${origin}${withAuthSignal(next, isNewAccount(user, via) ? "sign_up" : "login", via)}`);
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return done(data.user);
    return fail(authErrorKind(null, error.code ?? "exchange", via));
  }
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return done(data.user);
    return fail(authErrorKind(null, error.code ?? "otp", via));
  }
  // Nessun codice: se Supabase ha messo l'errore nel frammento (#error=…), il browser lo conserva nel redirect
  // e il pannello lo legge da lì; `via` gli serve per distinguere "Discord annullato" da "link scaduto".
  return fail("generic");
}
