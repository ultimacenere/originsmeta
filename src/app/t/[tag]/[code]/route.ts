import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { normalizeTag } from "@/lib/tournament/types";
import { withCarriedParams } from "@/lib/analytics";
import { LANGUAGE_ALIASES, preferredLocale } from "@/app/t/locale";

/**
 * Link d'invito di un torneo privato: /t/<tag>/<codice>. Chi lo apre da loggato riceve l'invito (RPC redeem_invite,
 * che per i tornei pubblici restituisce semplicemente lo slug) e viene portato alla scheda; chi non è loggato passa
 * dall'accesso e torna qui. Codice sbagliato → pagina dei tornei con il messaggio "link non valido".
 * Lingua: quella del browser, come il link breve (`preferredLocale`, spagnolo compreso).
 *
 * Misura: al ritorno dall'accesso /auth/callback rimanda qui con ?om_auth=…&om_method=…, e questa rotta sta fuori da
 * [locale], dove non c'è chi manda l'evento. Ogni reindirizzamento verso una pagina del sito porta quindi con sé il
 * segnale e gli UTM (`withCarriedParams`), altrimenti le iscrizioni arrivate da un invito non si contavano mai
 * (revisione dell'integrazione dell'Ondata 2). Non quello verso /login, dove il segnale non c'è ancora.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ tag: string; code: string }> }) {
  const { tag, code } = await params;
  const locale = preferredLocale(req.headers.get("accept-language"), locales, defaultLocale, LANGUAGE_ALIASES);
  const to = (path: string) => NextResponse.redirect(new URL(withCarriedParams(path, req.nextUrl.searchParams), req.url), 302);
  const normalized = normalizeTag(decodeURIComponent(tag));
  const cleanCode = decodeURIComponent(code).trim().slice(0, 40);
  if (!normalized || !/^[a-z0-9]{6,40}$/i.test(cleanCode)) return to(`/${locale}/tournaments?tag=invite`);
  const { supabase, user } = await currentUser();
  if (!supabase) return to(`/${locale}/tournaments`);
  if (!user) {
    const next = `/t/${normalized}/${cleanCode}`;
    return NextResponse.redirect(new URL(`/${locale}/login?next=${encodeURIComponent(next)}`, req.url), 302);
  }
  const { data, error } = await supabase.rpc("redeem_invite", { tag: normalized, code: cleanCode });
  if (error || typeof data !== "string") {
    const reason = error?.message.includes("not_found") ? "missing" : "invite";
    return to(`/${locale}/tournaments?tag=${reason}`);
  }
  return to(`/${locale}/tournaments/${data}`);
}
