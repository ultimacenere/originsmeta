import { NextResponse, type NextRequest } from "next/server";
import { getStreamDeckSet } from "@/lib/community/streamDeckSets";
import { cleanDeckSlug, isDeckSlug } from "@/lib/stream";

/**
 * Broadcasting OM (prototipo del 16/10/2026): i tre mazzi di un Mazzo torneo pubblicato sul sito, dallo slug, per
 * riempire in un colpo i mazzi di un giocatore nella regia. Solo trii pubblicati (come overlay e comando di chat).
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = cleanDeckSlug(req.nextUrl.searchParams.get("slug") ?? "");
  if (!isDeckSlug(slug)) return NextResponse.json({ error: "slug" }, { status: 400 });
  try {
    const set = await getStreamDeckSet(slug, { fresh: true });
    if (!set) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json(
      { name: set.name, decks: set.decks.map((d) => ({ name: d.name, legendary: d.legendary || null, cards: d.cards })) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    console.error("[broadcast] mazzo torneo:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
