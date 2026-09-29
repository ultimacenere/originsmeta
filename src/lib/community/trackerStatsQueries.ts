import { supabasePublic } from "@/lib/supabase/public";
import {
  parseArchetypeStats,
  parseCardStats,
  parseLegendaryStats,
  parseListStats,
  parseMatchupStats,
  parseOpponentStats,
  parseOverview,
  type ArchetypeStat,
  type CardStat,
  type LegendaryStat,
  type ListStat,
  type MatchupStat,
  type OpponentStat,
  type Overview,
} from "@/lib/tracker/stats";
import { isMissing } from "./achievements";

/**
 * Statistiche anonime del tracker di una patch (30/09/2026): le sette funzioni tracker_stats_* del blocco TRACKER di
 * supabase/schema.sql, lette con il client pubblico (cache di 60 secondi, pagine statiche e ISR restano tali). Solo
 * aggregati sopra la soglia (stats.ts li ricontrolla). Dove mostrarle lo decide Pierluigi (proposta in docs/tracker.md,
 * "Win rate sul sito"): per ora nessuna pagina le usa.
 *
 * Prima della migrazione (funzioni che mancano) `missing`; un errore del database lancia, così l'ISR tiene la pagina di
 * prima, come le altre letture pubbliche (`rowsOrThrow` di queries.ts).
 */
export type TrackerStats = {
  patch: string;
  overview: Overview | null;
  legendaries: LegendaryStat[];
  lists: ListStat[];
  archetypes: ArchetypeStat[];
  cards: CardStat[];
  matchups: MatchupStat[];
  opponents: OpponentStat[];
};

export async function readTrackerStats(patch: string): Promise<{ status: "ok"; data: TrackerStats } | { status: "missing" } | { status: "disabled" }> {
  const db = supabasePublic();
  if (!db) return { status: "disabled" };
  const args = { p_patch: patch };
  const [overview, legendaries, lists, archetypes, cards, matchups, opponents] = await Promise.all([
    db.rpc("tracker_stats_overview", args),
    db.rpc("tracker_stats_legendaries", args),
    db.rpc("tracker_stats_lists", args),
    db.rpc("tracker_stats_archetypes", args),
    db.rpc("tracker_stats_cards", args),
    db.rpc("tracker_stats_matchups", args),
    db.rpc("tracker_stats_opponents", args),
  ]);
  const all = [overview, legendaries, lists, archetypes, cards, matchups, opponents];
  if (all.some((r) => r.error && isMissing(r))) return { status: "missing" };
  const failed = all.find((r) => r.error);
  if (failed?.error) throw new Error(`[tracker] statistiche: ${failed.error.message}`);
  return {
    status: "ok",
    data: {
      patch,
      overview: parseOverview(overview.data),
      legendaries: parseLegendaryStats(legendaries.data),
      lists: parseListStats(lists.data),
      archetypes: parseArchetypeStats(archetypes.data),
      cards: parseCardStats(cards.data),
      matchups: parseMatchupStats(matchups.data),
      opponents: parseOpponentStats(opponents.data),
    },
  };
}
