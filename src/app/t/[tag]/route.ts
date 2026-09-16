import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { getTournamentByTag } from "@/lib/tournament/queries";
import { normalizeTag } from "@/lib/tournament/types";

/**
 * Link breve dei tornei (/t/OM-7KQ2, comodo da incollare su Discord): cerca il tag e reindirizza alla scheda
 * nella lingua del browser. Senza lingua nel percorso, quindi fuori da [locale]. Tag sconosciuto → pagina
 * dei tornei con ?tag=missing (la casella di ricerca mostra il messaggio).
 */
export const dynamic = "force-dynamic";

function pickLocale(req: NextRequest): Locale {
  const first = (req.headers.get("accept-language") ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("it") ? "it" : defaultLocale;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const locale = pickLocale(req);
  const normalized = normalizeTag(decodeURIComponent(tag));
  const found = normalized ? await getTournamentByTag(normalized, await supabaseServer()) : null;
  const target = found ? `/${locale}/tournaments/${found.slug}` : `/${locale}/tournaments?tag=missing`;
  return NextResponse.redirect(new URL(target, req.url), 302);
}
