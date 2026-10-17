import { readFileSync } from "node:fs";
import { cache } from "react";
import { supabasePublic } from "@/lib/supabase/public";
import { boardRows, pastPrices, pricePoints, type BoardItem, type MarketSourceId, type PricePoint } from "./market";

/**
 * Letture del tracker dei prezzi (17/10/2026) per le pagine /market (ISR): client anonimo con la data cache di 60 s
 * (`supabasePublic`). `null` = tracker non attivo (community spenta o migrazione del blocco MERCATO non ancora fatta:
 * tabella o funzione mancante); gli altri errori lanciano, così l'ISR tiene la pagina di prima (come rowsOrThrow in
 * community/queries.ts).
 *
 * Solo in sviluppo (`next dev`), con MARKET_FIXTURE=<file.json>, i dati arrivano da un file (stessa forma del database):
 * serve a provare le pagine in locale senza la migrazione. Mai in produzione.
 */

export type MarketStatus = { total: number | null; lastSweepAt: string | null; lastPageAt: string | null; sweeping: boolean };
export type MarketBoard = { status: MarketStatus | null; items: BoardItem[]; fx: { day: string; usdPerEur: number }[] };
/** `at`: quando sono stati letti i dati (millisecondi): da qui si contano gli intervalli del grafico, uguali nel server e nel browser. */
export type MarketItemData = { item: BoardItem; hourly: PricePoint[]; daily: PricePoint[]; fx: { day: string; usdPerEur: number }[]; status: MarketStatus | null; at: number };

const MISSING = new Set(["42P01", "42883", "PGRST202", "PGRST205"]);
const PAGE = 1000;

type Fixture = Record<string, { status?: MarketStatus; items: unknown[]; history?: Record<string, { hourly?: unknown[]; daily?: unknown[] }> }> & { fx?: { day: string; usd_per_eur: number }[] };

function fixture(): Fixture | null {
  const path = process.env.MARKET_FIXTURE;
  if (process.env.NODE_ENV !== "development" || !path) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Fixture;
}

class MarketMissing extends Error {}

function check<R extends { data: unknown; error: { code?: string; message: string } | null }>(res: R): R["data"] {
  if (res.error) {
    if (MISSING.has(res.error.code ?? "")) throw new MarketMissing(res.error.message);
    throw new Error(`[market] ${res.error.message}`);
  }
  return res.data;
}

function fxRows(rows: unknown): { day: string; usdPerEur: number }[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({ day: String((r as { day?: unknown }).day ?? "").slice(0, 10), usdPerEur: Number((r as { usd_per_eur?: unknown }).usd_per_eur) }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.day) && Number.isFinite(r.usdPerEur) && r.usdPerEur > 0)
    .sort((a, b) => a.day.localeCompare(b.day));
}

async function readStatus(source: MarketSourceId): Promise<MarketStatus | null> {
  const db = supabasePublic();
  if (!db) return null;
  const row = check(await db.from("market_sources").select("total, last_sweep_at, last_page_at, sweep_started_at").eq("id", source).maybeSingle());
  if (!row) return null;
  return { total: row.total, lastSweepAt: row.last_sweep_at, lastPageAt: row.last_page_at, sweeping: row.sweep_started_at !== null };
}

async function readFx(): Promise<{ day: string; usdPerEur: number }[]> {
  const db = supabasePublic();
  if (!db) return [];
  const out: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const rows = check(await db.from("market_fx").select("day, usd_per_eur").order("day").range(from, from + PAGE - 1));
    out.push(...(rows ?? []));
    if (!rows || rows.length < PAGE) break;
  }
  return fxRows(out);
}

/** Il tabellone di una fonte; null se il tracker non è attivo. */
export const loadMarketBoard = cache(async (source: MarketSourceId): Promise<MarketBoard | null> => {
  const fx = fixture();
  if (fx) {
    const s = fx[source];
    return s ? { status: s.status ?? null, items: boardRows(s.items), fx: fxRows(fx.fx) } : null;
  }
  const db = supabasePublic();
  if (!db) return null;
  try {
    const rows: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      const page = check(await db.rpc("market_board", { p_source: source }).range(from, from + PAGE - 1));
      rows.push(...(page ?? []));
      if (!page || page.length < PAGE) break;
    }
    const [status, fxs] = await Promise.all([readStatus(source), readFx()]);
    return { status, items: boardRows(rows), fx: fxs };
  } catch (error) {
    if (error instanceof MarketMissing) return null;
    throw error;
  }
});

/** Un oggetto con il suo storico; null se il tracker non è attivo o l'oggetto non c'è. */
export const loadMarketItem = cache(async (source: MarketSourceId, slug: string): Promise<MarketItemData | null> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  const fx = fixture();
  if (fx) {
    const s = fx[source];
    const item = s ? boardRows(s.items).find((i) => i.slug === slug) : undefined;
    if (!s || !item) return null;
    const h = pricePoints(s.history?.[item.hash_name]?.hourly, "hour");
    const d = pricePoints(s.history?.[item.hash_name]?.daily, "day");
    const at = Date.now();
    return { item: { ...item, ...pastPrices(h, d, at) }, hourly: h, daily: d, fx: fxRows(fx.fx), status: s.status ?? null, at };
  }
  const db = supabasePublic();
  if (!db) return null;
  try {
    const row = check(
      await db
        .from("market_items")
        .select("hash_name, slug, name, item_type, kind, card, variant, icon, name_color, price, listings, first_seen, last_seen")
        .eq("source", source)
        .eq("slug", slug)
        .maybeSingle(),
    );
    const base = row ? boardRows([{ ...row, price_24h: null, price_7d: null, price_30d: null }])[0] : undefined;
    if (!base) return null;
    const since = new Date(Date.now() - 31 * 24 * 3600_000).toISOString();
    const hourly = check(
      await db
        .from("market_prices_hourly")
        .select("hour, low, high, close, listings")
        .eq("source", source)
        .eq("hash_name", base.hash_name)
        .gte("hour", since)
        .order("hour")
        .range(0, PAGE - 1),
    );
    const daily: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      const rows = check(
        await db.from("market_prices_daily").select("day, low, high, close, listings").eq("source", source).eq("hash_name", base.hash_name).order("day").range(from, from + PAGE - 1),
      );
      daily.push(...(rows ?? []));
      if (!rows || rows.length < PAGE) break;
    }
    const h = pricePoints(hourly, "hour");
    const d = pricePoints(daily, "day");
    const [status, fxs] = await Promise.all([readStatus(source), readFx()]);
    // le variazioni con le stesse regole di market_board, dallo storico dell'oggetto
    const at = Date.now();
    return { item: { ...base, ...pastPrices(h, d, at) }, hourly: h, daily: d, fx: fxs, status, at };
  } catch (error) {
    if (error instanceof MarketMissing) return null;
    throw error;
  }
});
