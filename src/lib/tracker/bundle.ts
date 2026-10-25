/*
  Le statistiche del Tracker in una lettura sola (25/10/2026): la risposta di tracker_stats_bundle (blocco "STATISTICHE IN
  UNA LETTURA" di supabase/schema.sql) e i nuovi tentativi sui timeout del database. Funzioni pure, test in bundle.test.ts;
  le usa src/lib/community/trackerStatsQueries.ts.
*/

/** Le parti della risposta: una per funzione tracker_stats_<parte>, con le stesse righe (array di oggetti). */
export const STATS_PARTS = ["overview", "legendaries", "lists", "archetypes", "cards", "matchups", "opponents"] as const;
export type StatsPart = (typeof STATS_PARTS)[number];
export type StatsRows = Record<StatsPart, unknown>;

/** La risposta di tracker_stats_bundle: un oggetto con un array per parte. null se la forma non è quella. */
export function parseBundle(data: unknown): StatsRows | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const obj = data as Record<string, unknown>;
  const out = {} as StatsRows;
  for (const p of STATS_PARTS) {
    if (!Array.isArray(obj[p])) return null;
    out[p] = obj[p];
  }
  return out;
}

/** Il database ha interrotto la query per il timeout (Postgres 57014, "canceling statement due to statement timeout"). */
export function isStatementTimeout(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false;
  return error.code === "57014" || /statement timeout/i.test(error.message ?? "");
}

/** Le attese prima dei due nuovi tentativi, con uno scarto a caso perché le pagine generate insieme non ritornino insieme. */
export function retryDelays(random: () => number = Math.random): number[] {
  return [1200 + Math.round(random() * 800), 3000 + Math.round(random() * 1500)];
}
