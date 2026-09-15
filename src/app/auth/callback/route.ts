import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

/** Solo percorsi interni: niente redirect verso altri siti. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return `/${defaultLocale}/account`;
  return raw;
}

/**
 * Ritorno da Discord (OAuth) o dal link via email: scambia il codice con una sessione,
 * scrive i cookie e rimanda l'utente alla pagina da cui era partito (`next`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const seg = next.split("/")[1];
  const locale = isLocale(seg) ? seg : defaultLocale;
  // Dietro Vercel l'origine reale arriva negli header x-forwarded-*; in locale coincide con l'URL richiesto.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : url.origin;
  const fail = (reason: string) => NextResponse.redirect(`${origin}/${locale}/login?error=${encodeURIComponent(reason)}&next=${encodeURIComponent(next)}`);

  const supabase = await supabaseServer();
  if (!supabase) return NextResponse.redirect(`${origin}/${locale}`);
  if (url.searchParams.get("error")) return fail(url.searchParams.get("error_code") ?? url.searchParams.get("error") ?? "auth");

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return fail(error.code ?? "exchange");
  }
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return fail(error.code ?? "otp");
  }
  return fail("missing_code");
}
