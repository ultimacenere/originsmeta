import { NextResponse } from "next/server";
import { listTierListOwners } from "@/lib/community/tierlists";
import { tierListCounts } from "@/lib/tierstats";

/**
 * Quante tier list sono state salvate (per scheda) e da quante persone, per l'invito della home (Ondata 3 del piano
 * SEO/GEO, TOOL-01). La home resta statica come le altre pagine editoriali: è `TierInvite` nel browser a chiedere
 * questo JSON, come la striscia del calendario chiede /api/calendar. Rigenerato al massimo ogni 5 minuti (in pratica
 * ogni minuto: la lettura di `supabasePublic` si rinnova a 60 s e vince il tempo più basso). Con un errore del database
 * la lettura lancia (DECKS-12) e resta la risposta di prima; con la community spenta tutti zero.
 */
export const revalidate = 300;

export async function GET() {
  const counts = tierListCounts(await listTierListOwners());
  return NextResponse.json(counts, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
}
