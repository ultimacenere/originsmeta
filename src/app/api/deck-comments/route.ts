import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";
import { currentUser } from "@/lib/supabase/server";
import { viewerIsStaff } from "@/lib/community/inboxQueries";
import { commentTargetFrom } from "@/lib/community/deckComments";
import { commentView, readComments } from "@/lib/community/deckCommentQueries";

/**
 * I commenti di un mazzo (22/10/2026), per la sezione "Commenti" della scheda, che li chiede dal browser: la scheda è
 * ISR e i commenti cambiano di continuo (e i nascosti li vedono solo l'autore e lo staff), quindi non stanno nell'HTML.
 * Così la pagina resta in una lingua sola anche quando i commenti sono in un'altra.
 *
 * GET ?deck=<uuid> | ?set=<uuid> & locale=<lingua> → { available, viewer: { id, staff } | null, comments }. Il testo
 * dei commenti arriva già letto, con i nomi delle carte collegati alle schede nella lingua della pagina. Privata e mai
 * in cache (dipende dalla sessione). Prima della migrazione `available: false`: la sezione dice che i commenti non sono
 * ancora attivi. Con il database giù 503.
 */
export const dynamic = "force-dynamic";

const headers = { "cache-control": "private, no-store" };

export async function GET(req: NextRequest) {
  const target = commentTargetFrom(req.nextUrl.searchParams);
  if (!target) return NextResponse.json({ error: "target" }, { status: 400, headers });
  const raw = req.nextUrl.searchParams.get("locale") ?? "";
  const locale = isLocale(raw) ? raw : "en";
  const { supabase, user } = await currentUser();
  if (!supabase) return NextResponse.json({ available: false, viewer: null, comments: [] }, { headers });
  const [read, staff] = await Promise.all([readComments(supabase, target), user ? viewerIsStaff(supabase) : null]);
  if (!read.ok) {
    if (read.error === "unavailable") return NextResponse.json({ available: false, viewer: null, comments: [] }, { headers });
    return NextResponse.json({ error: read.error }, { status: 503, headers });
  }
  const viewer = user ? { id: user.id, staff: Boolean(staff?.ok && staff.data) } : null;
  return NextResponse.json({ available: true, viewer, comments: read.rows.map((r) => commentView(r, locale, user?.id ?? null)) }, { headers });
}
