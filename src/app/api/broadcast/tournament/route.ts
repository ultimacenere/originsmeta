import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabasePublic } from "@/lib/supabase/public";
import { getTournament, getTournamentByTag, listMatches, listPlayers, listVisibleDecks } from "@/lib/tournament/queries";
import { normalizeTag, totalRounds } from "@/lib/tournament/types";
import { decodeOmCode } from "@/lib/deckcode";
import { authorName } from "@/lib/community/util";
import type { BroadcastTournamentResponse } from "@/lib/broadcast/state";

/**
 * Broadcasting OM (prototipo del 16/10/2026): i dati di un torneo del Tournament Organizer per la regia, dal tag
 * (OM-XXXX). Nome, formato, iscritti, partite del tabellone con il punteggio e i mazzi consegnati che chi chiede può
 * vedere: si legge con la sessione di chi è collegato (organizzatore, arbitro, staff vedono quello che vedono sul sito),
 * altrimenti con il client anonimo, e le policy del database decidono. Nessuna scrittura.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tag = normalizeTag(req.nextUrl.searchParams.get("tag") ?? "");
  if (!tag) return NextResponse.json({ error: "tag" }, { status: 400 });
  const client = (await supabaseServer()) ?? supabasePublic();
  if (!client) return NextResponse.json({ error: "offline" }, { status: 503 });
  try {
    const ref = await getTournamentByTag(tag, client);
    const t = ref ? await getTournament(ref.slug, client) : null;
    if (!t) return NextResponse.json({ error: "missing" }, { status: 404 });
    const [players, matches, decks] = await Promise.all([listPlayers(t.id, client), listMatches(t.id, client), listVisibleDecks(t.id, client)]);
    const body: BroadcastTournamentResponse = {
      name: t.name,
      tag: t.tag,
      bestOf: t.best_of,
      finalBestOf: (t as { final_best_of?: number | null }).final_best_of ?? null,
      totalRounds: totalRounds(matches),
      players: players.map((p) => ({ id: p.user_id, name: authorName(p.profile) })),
      matches: matches.map((m) => ({ id: m.id, round: m.round, position: m.position, a: m.player_a, b: m.player_b, scoreA: m.score_a, scoreB: m.score_b, status: m.status })),
      decks: Object.fromEntries(
        decks.map((d) => [
          d.user_id,
          d.codes.map((code) => decodeOmCode(code)).filter((x) => x !== null).map((x) => ({ name: x.name, legendary: x.legendary, cards: x.cards })),
        ]),
      ),
    };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("[broadcast] torneo:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
