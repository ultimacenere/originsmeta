import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { getTournamentByTag } from "@/lib/tournament/queries";
import { normalizeTag } from "@/lib/tournament/types";
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
  const target = new URL(found ? `/${locale}/tournaments/${found.slug}` : `/${locale}/tournaments?tag=missing`, req.url);
  // gli UTM del link (annunci in #tournaments-feed, src/lib/tournament/notify.ts) arrivano alla scheda: niente altro
  for (const [k, v] of req.nextUrl.searchParams) if (k.startsWith("utm_")) target.searchParams.set(k, v);
  return NextResponse.redirect(target, 302);
}
