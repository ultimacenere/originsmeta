import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { normalizeTag } from "@/lib/tournament/types";
import { LANGUAGE_ALIASES, preferredLocale } from "@/app/t/locale";

/**
 * Link d'invito di un torneo privato: /t/<tag>/<codice>. Chi lo apre da loggato riceve l'invito (RPC redeem_invite,
 * che per i tornei pubblici restituisce semplicemente lo slug) e viene portato alla scheda; chi non è loggato passa
 * dall'accesso e torna qui. Codice sbagliato → pagina dei tornei con il messaggio "link non valido".
 * Lingua: quella del browser, come il link breve (`preferredLocale`, spagnolo compreso).
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ tag: string; code: string }> }) {
  const { tag, code } = await params;
  const locale = preferredLocale(req.headers.get("accept-language"), locales, defaultLocale, LANGUAGE_ALIASES);
  const normalized = normalizeTag(decodeURIComponent(tag));
  const cleanCode = decodeURIComponent(code).trim().slice(0, 40);
  if (!normalized || !/^[a-z0-9]{6,40}$/i.test(cleanCode)) return NextResponse.redirect(new URL(`/${locale}/tournaments?tag=invite`, req.url), 302);
  const { supabase, user } = await currentUser();
  if (!supabase) return NextResponse.redirect(new URL(`/${locale}/tournaments`, req.url), 302);
  if (!user) {
    const next = `/t/${normalized}/${cleanCode}`;
    return NextResponse.redirect(new URL(`/${locale}/login?next=${encodeURIComponent(next)}`, req.url), 302);
  }
  const { data, error } = await supabase.rpc("redeem_invite", { tag: normalized, code: cleanCode });
  if (error || typeof data !== "string") {
    const reason = error?.message.includes("not_found") ? "missing" : "invite";
    return NextResponse.redirect(new URL(`/${locale}/tournaments?tag=${reason}`, req.url), 302);
  }
  return NextResponse.redirect(new URL(`/${locale}/tournaments/${data}`, req.url), 302);
}
