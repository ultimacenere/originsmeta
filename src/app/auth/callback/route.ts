import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import { authErrorKind, type AuthErrorKind } from "@/lib/loginLabels";

/** Solo percorsi interni: niente redirect verso altri siti. */
function safeNext(raw: string | null, locale: Locale): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return `/${locale}/account`;
  return raw;
}

/**
 * Lingua del browser quando `next` non la dice (link vecchi, `next` mancante): prima lingua supportata in ordine
 * di preferenza nell'header accept-language, altrimenti l'inglese. Stessa idea di pickLocale in
 * src/app/t/[tag]/[code]/route.ts, ma scorre tutte le lingue indicate e non solo la prima.
 */
function pickLocale(request: Request): Locale {
  const langs = (request.headers.get("accept-language") ?? "").split(",");
  for (const part of langs) {
    const base = part.split(";")[0]?.trim().toLowerCase().split("-")[0] ?? "";
    if (isLocale(base)) return base;
  }
  return defaultLocale;
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
  // `withVia`: solo quando il tipo non si conosce qui e lo classificherà il pannello (errore nel frammento #error=…).
  const fail = (kind: AuthErrorKind | null, withVia = false) =>
    NextResponse.redirect(`${origin}/${locale}/login?error=${kind ?? "generic"}${withVia ? `&via=${via}` : ""}&next=${encodeURIComponent(next)}`);

  const supabase = await supabaseServer();
  if (!supabase) return NextResponse.redirect(`${origin}/${locale}`);
  const providerError = url.searchParams.get("error");
  const providerCode = url.searchParams.get("error_code");
  if (providerError || providerCode) return fail(authErrorKind(providerError, providerCode, via));

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return fail(authErrorKind(null, error.code ?? "exchange", via));
  }
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return fail(authErrorKind(null, error.code ?? "otp", via));
  }
  // Nessun codice: se Supabase ha messo l'errore nel frammento (#error=…), il browser lo conserva nel redirect
  // e il pannello lo legge da lì; `via` gli serve per distinguere "Discord annullato" da "link scaduto".
  return fail("generic", true);
}
