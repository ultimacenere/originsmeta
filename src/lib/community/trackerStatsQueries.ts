import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { latestPatch, patchOrder, type PatchId } from "@/lib/data/cards";
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
 * Statistiche anonime del tracker per il sito (30/09/2026): le funzioni tracker_stats_* del blocco TRACKER di
 * supabase/schema.sql, solo aggregati sopra la soglia (stats.ts ricontrolla le risposte). Le usano la pagina
 * /tier-list/win-rate (`readWinrate`), lo stato della scheda "Win rate" nella testata della tier list
 * (`readWinrateGames`) e il riquadro delle schede dei mazzi della community (`readDeckWinrate`).
 *
 * Cache: le chiamate sono POST (RPC di PostgREST) e la data cache di Next le tiene solo con `cache: "force-cache"`
 * (docs di Next 16, fetch): qui 5 minuti, come l'ISR delle pagine della tier list, così tutte le schede dei mazzi
 * rigenerate nello stesso intervallo condividono la stessa risposta invece di chiedere una lettura a testa. Si tengono
 * solo le risposte 200: una funzione che manca (migrazione non ancora fatta) si richiede la volta dopo.
 *
 * Patch: quella in corso; se non ha ancora un numero sopra la soglia (per esempio nei giorni subito dopo una patch),
 * la precedente, detto in chiaro sulla pagina (`fallback`).
 */

function statsClient() {
  if (!supabaseEnabled) return null;
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { revalidate: 300, tags: ["tracker-stats"] } }) },
  });
}

type Rpc = { data: unknown; error: { code?: string | null; message: string } | null; status?: number };

export type WinrateData = {
  patch: PatchId;
  /** la patch in corso non ha ancora numeri: questi sono della precedente */
  fallback: boolean;
  overview: Overview;
  legendaries: LegendaryStat[];
  lists: ListStat[];
  archetypes: ArchetypeStat[];
  cards: CardStat[];
  matchups: MatchupStat[];
  opponents: OpponentStat[];
};

export type WinrateRead = { status: "ok"; data: WinrateData } | { status: "empty"; patch: PatchId } | { status: "missing" } | { status: "disabled" };

/** Le patch da provare: quella in corso, poi la precedente. */
const candidates = (): PatchId[] => {
  const i = patchOrder.indexOf(latestPatch);
  return i > 0 ? [latestPatch, patchOrder[i - 1]] : [latestPatch];
};

/** La patch da mostrare e la sua panoramica: null se nessuna delle due ha ancora numeri; "missing" prima della migrazione. */
async function statsPatch(db: NonNullable<ReturnType<typeof statsClient>>): Promise<{ patch: PatchId; overview: Overview } | null | "missing"> {
  for (const patch of candidates()) {
    const res = (await db.rpc("tracker_stats_overview", { p_patch: patch })) as Rpc;
    if (res.error) {
      if (isMissing(res)) return "missing";
      throw new Error(`[tracker] panoramica: ${res.error.message}`);
    }
    const overview = parseOverview(res.data);
    if (overview) return { patch, overview };
  }
  return null;
}

/**
 * Tutti i numeri della pagina dei win rate. Un errore del database lancia (l'ISR tiene la pagina di prima, come le altre
 * letture pubbliche); funzioni mancanti = "missing", nessun numero sopra la soglia = "empty".
 */
export async function readWinrate(): Promise<WinrateRead> {
  const db = statsClient();
  if (!db) return { status: "disabled" };
  const picked = await statsPatch(db);
  if (picked === "missing") return { status: "missing" };
  if (!picked) return { status: "empty", patch: latestPatch };
  const args = { p_patch: picked.patch };
  const results = (await Promise.all([
    db.rpc("tracker_stats_legendaries", args),
    db.rpc("tracker_stats_lists", args),
    db.rpc("tracker_stats_archetypes", args),
    db.rpc("tracker_stats_cards", args),
    db.rpc("tracker_stats_matchups", args),
    db.rpc("tracker_stats_opponents", args),
  ])) as Rpc[];
  if (results.some((r) => r.error && isMissing(r))) return { status: "missing" };
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(`[tracker] statistiche: ${failed.error.message}`);
  const [legendaries, lists, archetypes, cards, matchups, opponents] = results;
  return {
    status: "ok",
    data: {
      patch: picked.patch,
      fallback: picked.patch !== latestPatch,
      overview: picked.overview,
      legendaries: parseLegendaryStats(legendaries.data),
      lists: parseListStats(lists.data),
      archetypes: parseArchetypeStats(archetypes.data),
      cards: parseCardStats(cards.data),
      matchups: parseMatchupStats(matchups.data),
      opponents: parseOpponentStats(opponents.data),
    },
  };
}

/**
 * Partite contate nella patch mostrata, per lo stato della scheda "Win rate" nella testata della tier list: null se non
 * c'è ancora un numero (o prima della migrazione). Mai un errore: la testata non deve far fallire le altre pagine.
 */
export async function readWinrateGames(): Promise<number | null> {
  const db = statsClient();
  if (!db) return null;
  try {
    const picked = await statsPatch(db);
    return picked && picked !== "missing" ? picked.overview.games : null;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Il win rate di un mazzo della community quando qualcuno gioca le sue stesse 13 carte (lista esatta, `deckListKey` di
 * stats.ts), nella patch mostrata: null sotto la soglia, prima della migrazione o con un errore (il riquadro è
 * facoltativo e non deve far fallire la scheda del mazzo).
 */
export async function readDeckWinrate(listKey: string | null): Promise<(ListStat & { patch: PatchId }) | null> {
  const db = statsClient();
  if (!db || !listKey) return null;
  try {
    const picked = await statsPatch(db);
    if (!picked || picked === "missing") return null;
    const res = (await db.rpc("tracker_stats_lists", { p_patch: picked.patch })) as Rpc;
    if (res.error) {
      if (!isMissing(res)) console.error(`[tracker] liste: ${res.error.message}`);
      return null;
    }
    const found = parseListStats(res.data).find((l) => l.list === listKey);
    return found ? { ...found, patch: picked.patch } : null;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return null;
  }
}
