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
  onlyLegendaries,
  type ArchetypeStat,
  type CardStat,
  type LegendaryStat,
  type ListStat,
  type MatchupStat,
  type OpponentStat,
  type Overview,
} from "@/lib/tracker/stats";
import { STATS_PARTS, isStatementTimeout, parseBundle, retryDelays, type StatsPart, type StatsRows } from "@/lib/tracker/bundle";
import { isLegendaryKey } from "@/lib/tracker/enrich";
import { isMissing } from "./achievements";

/**
 * Statistiche anonime del tracker per il sito (30/09/2026): le funzioni tracker_stats_* del blocco TRACKER di
 * supabase/schema.sql, solo aggregati sopra la soglia (stats.ts ricontrolla le risposte). Le usano la pagina
 * /analytics e /analytics/crimson-cup (`readWinrate`), la sitemap (`readWinrateGames`), la pastiglia dei mazzi di /decks
 * (`readListWinrates`) e il riquadro delle schede dei mazzi della community (`readDeckWinrate`).
 *
 * Cache: le chiamate sono POST (RPC di PostgREST) e la data cache di Next le tiene solo con `cache: "force-cache"`
 * (docs di Next 16, fetch): qui 5 minuti, come l'ISR delle pagine della tier list, così tutte le schede dei mazzi
 * rigenerate nello stesso intervallo condividono la stessa risposta invece di chiedere una lettura a testa. Si tengono
 * solo le risposte 200: una funzione che manca (migrazione non ancora fatta) si richiede la volta dopo.
 *
 * Patch: quella in corso; se non ha ancora un numero sopra la soglia (per esempio nei giorni subito dopo una patch),
 * la precedente, detto in chiaro sulla pagina (`fallback`).
 *
 * Timeout (25/10/2026, Crimson Cup): due build su tre si fermavano su "canceling statement due to statement timeout".
 * Ogni pagina chiamava sette funzioni che rileggono tutte le partite della patch, e la build genera insieme le sette
 * lingue di /analytics e di /analytics/crimson-cup. Da qui:
 * - una lettura sola, `tracker_stats_bundle` (blocco "STATISTICHE IN UNA LETTURA" di schema.sql), con le stesse righe;
 *   finché la migrazione non c'è, le sette funzioni come prima, chiamate solo quando servono;
 * - una sola richiesta per patch e per funzione nello stesso processo per 60 secondi (`shared`): pagine e lingue
 *   generate insieme aspettano la stessa risposta invece di chiederne una a testa;
 * - fino a due nuovi tentativi sui timeout (`retryDelays`);
 * - durante la build un errore che resta non fa più fallire la build: `readWinrate` dice "unavailable" (la pagina lo dice e
 *   l'ISR la rifà a sito acceso). A sito acceso l'errore lancia come prima: l'ISR tiene la pagina dell'ultima lettura.
 */

function statsClient() {
  if (!supabaseEnabled) return null;
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { revalidate: 300, tags: ["tracker-stats"] } }) },
  });
}

type Db = NonNullable<ReturnType<typeof statsClient>>;
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

/** "unavailable": il database non ha risposto durante la build (solo lì: a sito acceso l'errore lancia). */
export type WinrateRead =
  | { status: "ok"; data: WinrateData }
  | { status: "empty"; patch: PatchId }
  | { status: "missing" }
  | { status: "disabled" }
  | { status: "unavailable" };

const building = () => process.env.NEXT_PHASE === "phase-production-build";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Una chiamata con i nuovi tentativi sui timeout; gli altri errori tornano subito. */
async function call(db: Db, fn: string, patch: string): Promise<Rpc> {
  let res = (await db.rpc(fn as "tracker_stats_bundle", { p_patch: patch })) as Rpc;
  for (const wait of retryDelays()) {
    if (!res.error || !isStatementTimeout(res.error)) break;
    await sleep(wait);
    res = (await db.rpc(fn as "tracker_stats_bundle", { p_patch: patch })) as Rpc;
  }
  return res;
}

/** Richieste in corso o appena finite, per chiave, nello stesso processo (60 s; quelle fallite si tolgono subito). */
const SHARE_MS = 60_000;
const inflight = new Map<string, { at: number; value: Promise<unknown> }>();
function shared<T>(key: string, run: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = inflight.get(key);
  if (hit && now - hit.at < SHARE_MS) return hit.value as Promise<T>;
  const value = run();
  inflight.set(key, { at: now, value });
  value.catch(() => {
    if (inflight.get(key)?.value === value) inflight.delete(key);
  });
  return value;
}

/** La funzione unica non c'è (prima della migrazione): si riprova dopo 5 minuti, così la migrazione vale senza deploy. */
let bundleMissingAt = 0;

/** Una parte delle statistiche di una patch: "missing" prima della migrazione del Tracker. Gli errori lanciano. */
async function part(db: Db, patch: PatchId, name: StatsPart): Promise<unknown | "missing"> {
  if (Date.now() - bundleMissingAt > 5 * 60_000) {
    const bundle = await shared(`bundle:${patch}`, async () => {
      const res = await call(db, "tracker_stats_bundle", patch);
      if (res.error) {
        if (isMissing(res)) return "missing" as const;
        throw new Error(`[tracker] statistiche: ${res.error.message}`);
      }
      return parseBundle(res.data);
    });
    if (bundle !== "missing" && bundle) return bundle[name];
    if (bundle === "missing") bundleMissingAt = Date.now();
    // una risposta senza la forma attesa: le funzioni separate
  }
  return shared(`${name}:${patch}`, async () => {
    const res = await call(db, `tracker_stats_${name}`, patch);
    if (res.error) {
      if (isMissing(res)) return "missing" as const;
      throw new Error(`[tracker] statistiche (${name}): ${res.error.message}`);
    }
    return res.data;
  });
}

/** Le patch da provare: quella in corso, poi la precedente. */
const candidates = (): PatchId[] => {
  const i = patchOrder.indexOf(latestPatch);
  return i > 0 ? [latestPatch, patchOrder[i - 1]] : [latestPatch];
};

/** La patch da mostrare e la sua panoramica: null se nessuna delle due ha ancora numeri; "missing" prima della migrazione. */
async function statsPatch(db: Db): Promise<{ patch: PatchId; overview: Overview } | null | "missing"> {
  for (const patch of candidates()) {
    const data = await part(db, patch, "overview");
    if (data === "missing") return "missing";
    const overview = parseOverview(data);
    if (overview) return { patch, overview };
  }
  return null;
}

/**
 * Tutti i numeri della pagina dei win rate. A sito acceso un errore del database lancia (l'ISR tiene la pagina di prima,
 * come le altre letture pubbliche); durante la build diventa "unavailable". Funzioni mancanti = "missing", nessun
 * numero sopra la soglia = "empty".
 */
export async function readWinrate(): Promise<WinrateRead> {
  const db = statsClient();
  if (!db) return { status: "disabled" };
  try {
    const picked = await statsPatch(db);
    if (picked === "missing") return { status: "missing" };
    if (!picked) return { status: "empty", patch: latestPatch };
    const rows = {} as StatsRows;
    for (const name of STATS_PARTS) {
      if (name === "overview") continue;
      const data = await part(db, picked.patch, name);
      if (data === "missing") return { status: "missing" };
      rows[name] = data;
    }
    return {
      status: "ok",
      data: onlyLegendaries(
        {
          patch: picked.patch,
          fallback: picked.patch !== latestPatch,
          overview: picked.overview,
          legendaries: parseLegendaryStats(rows.legendaries),
          lists: parseListStats(rows.lists),
          archetypes: parseArchetypeStats(rows.archetypes),
          cards: parseCardStats(rows.cards),
          matchups: parseMatchupStats(rows.matchups),
          opponents: parseOpponentStats(rows.opponents),
        },
        isLegendaryKey,
      ),
    };
  } catch (error) {
    if (!building()) throw error;
    console.warn(`[tracker] statistiche non disponibili durante la build: ${error instanceof Error ? error.message : error}`);
    return { status: "unavailable" };
  }
}

/**
 * Partite contate nella patch mostrata, per la sitemap: null se non c'è ancora un numero (o prima della migrazione). Mai
 * un errore: non deve far fallire le altre pagine.
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
  if (!listKey) return null;
  const all = await readListWinrates();
  const found = all?.lists.get(listKey);
  return found && all ? { ...found, patch: all.patch } : null;
}

/**
 * Il win rate di tutte le liste esatte giocate, per chiave della lista (11/10/2026, pastiglia dei mazzi in /decks): una
 * sola lettura per pagina, con la stessa cache di 5 minuti. null prima della migrazione, sotto la soglia o con un errore.
 */
export async function readListWinrates(): Promise<{ patch: PatchId; lists: Map<string, ListStat> } | null> {
  const db = statsClient();
  if (!db) return null;
  try {
    const picked = await statsPatch(db);
    if (!picked || picked === "missing") return null;
    const data = await part(db, picked.patch, "lists");
    if (data === "missing") return null;
    return { patch: picked.patch, lists: new Map(parseListStats(data).map((l) => [l.list, l])) };
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return null;
  }
}
