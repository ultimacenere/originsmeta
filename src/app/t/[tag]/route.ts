import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { getTournamentByTag } from "@/lib/tournament/queries";
import { normalizeTag } from "@/lib/tournament/types";
import { withCarriedParams } from "@/lib/analytics";
import { LANGUAGE_ALIASES, preferredLocale } from "@/app/t/locale";

/**
 * Link breve dei tornei (/t/OM-7KQ2, comodo da incollare su Discord): cerca il tag e reindirizza alla scheda
 * nella lingua del browser (inglese, italiano o spagnolo: `preferredLocale`). Senza lingua nel percorso, quindi
 * fuori da [locale]. Tag sconosciuto → pagina dei tornei con ?tag=missing (la casella di ricerca mostra il messaggio).
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const locale = preferredLocale(req.headers.get("accept-language"), locales, defaultLocale, LANGUAGE_ALIASES);
  const normalized = normalizeTag(decodeURIComponent(tag));
  const found = normalized ? await getTournamentByTag(normalized, await supabaseServer()) : null;
  // gli UTM del link (annunci in #tournaments-feed, src/lib/tournament/notify.ts) e l'eventuale segnale dell'accesso
  // (?om_auth=, se /t/<tag> è stato il ritorno di un accesso) arrivano alla scheda: niente altro
  const path = found ? `/${locale}/tournaments/${found.slug}` : `/${locale}/tournaments?tag=missing`;
  return NextResponse.redirect(new URL(withCarriedParams(path, req.nextUrl.searchParams), req.url), 302);
}
