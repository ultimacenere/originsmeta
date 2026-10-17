import { cards } from "@/lib/data/cards";
import { supabaseAnon } from "@/lib/supabase/public";
import {
  MARKET_SOURCE_IDS,
  MARKET_SOURCES,
  STEAM_PAGE_GAP_MS,
  ingestRows,
  nextCursor,
  parseEcbUsd,
  parseSearchPage,
  searchUrl,
  type MarketCardRef,
  type MarketSourceId,
} from "./market";

/**
 * Raccoglitore dei prezzi del mercato di Steam (17/10/2026), lato server: lo chiama la rotta /api/cron/market a ogni
 * giro del cron (vercel.json, ogni 10 minuti). Per ogni fonte riprende il giro da dove era rimasto (`cursor_start` di
 * market_sources), legge le pagine di market/search/render una dopo l'altra con una pausa di 2,5 secondi (Steam risponde
 * 429 a chi va più veloce) e salva ogni pagina con market_ingest e il segreto del server (CRON_SECRET, notify_key_ok).
 * Si ferma allo scadere del tempo (`budgetMs`): un giro di molti oggetti si completa in più passaggi del cron, e le
 * pagine lo dicono ("ogni oggetto si aggiorna almeno ogni …"). Un 429 di Steam ferma tutto il passaggio; un errore di una
 * fonte non ferma le altre. Prima della migrazione (tabelle o funzione mancanti) risponde `unavailable` e non fa nulla.
 * Origins va per primo: finché il suo mercato è chiuso costa una richiesta sola.
 */

const STEAM_TIMEOUT_MS = 15_000;
const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const FX_TTL_MS = 6 * 3600_000;
const fxCache: { at: number; value: number | null } = { at: 0, value: null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Il cambio BCE (dollari per un euro), tenuto 6 ore in memoria; null se la BCE non risponde. */
export async function usdPerEur(): Promise<number | null> {
  if (fxCache.value !== null && Date.now() - fxCache.at < FX_TTL_MS) return fxCache.value;
  try {
    const res = await fetch(ECB_URL, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fxCache.value;
    const parsed = parseEcbUsd(await res.text());
    if (parsed) Object.assign(fxCache, { at: Date.now(), value: parsed.usdPerEur });
  } catch (error) {
    console.error("[market] cambio BCE:", error instanceof Error ? error.message : error);
  }
  return fxCache.value;
}

const cardRefs: MarketCardRef[] = cards.map((c) => ({ slug: c.slug, name: c.name }));

export type SourceRun = { source: MarketSourceId; pages: number; items: number; done: boolean; error?: string };
export type CollectResult = { ok: boolean; unavailable?: boolean; rateLimited?: boolean; fx: number | null; runs: SourceRun[] };

const MISSING = new Set(["42P01", "42883", "PGRST202", "PGRST205"]);

export async function collectMarket(secret: string, budgetMs = 100_000): Promise<CollectResult> {
  const db = supabaseAnon();
  const fx = await usdPerEur();
  if (!db) return { ok: false, unavailable: true, fx, runs: [] };
  const deadline = Date.now() + budgetMs;
  const runs: SourceRun[] = [];
  let rateLimited = false;

  for (const id of MARKET_SOURCE_IDS) {
    if (rateLimited || Date.now() > deadline) break;
    const source = MARKET_SOURCES[id];
    const run: SourceRun = { source: id, pages: 0, items: 0, done: false };
    runs.push(run);
    const cursor = await db.from("market_sources").select("cursor_start").eq("id", id).maybeSingle();
    if (cursor.error) {
      if (MISSING.has(cursor.error.code ?? "")) return { ok: false, unavailable: true, fx, runs };
      run.error = cursor.error.message;
      continue;
    }
    let start = cursor.data?.cursor_start ?? 0;
    while (Date.now() < deadline) {
      let json: unknown;
      try {
        const res = await fetch(searchUrl(source, start), { cache: "no-store", headers: { accept: "application/json" }, signal: AbortSignal.timeout(STEAM_TIMEOUT_MS) });
        if (res.status === 429) {
          rateLimited = true;
          break;
        }
        if (!res.ok) {
          run.error = `steam ${res.status}`;
          break;
        }
        json = await res.json();
      } catch (error) {
        run.error = `steam: ${error instanceof Error ? error.message : String(error)}`;
        break;
      }
      const page = parseSearchPage(json);
      if (!page) {
        run.error = "steam: risposta inattesa";
        break;
      }
      const rows = ingestRows(id, page.items, id === "origins" ? cardRefs : []);
      const { next, done } = nextCursor(start, page.total, page.items.length);
      const saved = await db.rpc("market_ingest", {
        p_key: secret,
        p_source: id,
        p_appid: source.appid,
        p_items: rows,
        p_next: next,
        p_total: page.total,
        p_done: done,
        p_usd_per_eur: fx,
      });
      if (saved.error) {
        if (MISSING.has(saved.error.code ?? "")) return { ok: false, unavailable: true, fx, runs };
        run.error = saved.error.message;
        break;
      }
      run.pages += 1;
      run.items += saved.data ?? 0;
      if (done) {
        run.done = true;
        break;
      }
      start = next;
      await sleep(STEAM_PAGE_GAP_MS);
    }
    // una pausa anche fra due fonti: per Steam è lo stesso indirizzo
    await sleep(STEAM_PAGE_GAP_MS);
  }
  const ok = !rateLimited && runs.every((r) => !r.error);
  if (!ok) console.error("[market]", JSON.stringify({ rateLimited, runs }));
  return { ok, rateLimited, fx, runs };
}
