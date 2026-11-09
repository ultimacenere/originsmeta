import { wilson } from "./tracker/snapshot";
import type { TierId } from "./data/tierlist";

/**
 * La regola della tier list di OriginsMeta per le Leggendarie (09/11/2026, prima tier list pubblicata; Pierluigi:
 * "pubblica la tier list", con il metodo proposto nel macro recap: win rate di Analytics incrociati con i ban rate
 * ufficiali della Crimson Cup). Funzione pura, provata in tierRule.test.ts; i numeri stanno in tierlist.ts.
 *
 * 1. Il ladder: il win rate a due lati della patch in corso (`bothSides` di tracker/snapshot.ts, la misura di /analytics:
 *    ogni partita con la Leggendaria avversaria nota conta per tutte e due). S se il bordo basso dell'intervallo di
 *    Wilson al 95% sta sopra il 50%, A dal 50%, B dal 45%, C dal 40%, D sotto. Sotto le 100 presenze: non classificata.
 * 2. Il torneo: la Crimson Cup (numeri ufficiali di Koin, patch 0.7) alza di una fascia, mai sopra la S, una Leggendaria
 *    bannata in almeno il 30% delle partite in cui si è presentata e arrivata alle finali, se la sua carta non è cambiata
 *    dopo il torneo.
 */
export const TIER_RULE = { minGames: 100, a: 0.5, b: 0.45, c: 0.4, crimsonBan: 0.3, crimsonFinalists: 1 } as const;

export type LegendaryEvidence = {
  slug: string;
  /** presenze in campo nella patch, contando i due lati (uno specchio vale due) */
  games: number;
  wins: number;
  /** Crimson Cup: ban sulle partite in cui si è presentata e giocatori alle finali; null se non c'era */
  crimson: { banned: number; seen: number; finalists: number } | null;
  /** la carta è cambiata dopo la Crimson Cup: il torneo non conta */
  changedAfterCrimson?: boolean;
};

const ORDER: TierId[] = ["S", "A", "B", "C", "D"];

/** La fascia dal solo ladder. */
export function ladderTier(games: number, wins: number): TierId | "unranked" {
  if (games < TIER_RULE.minGames) return "unranked";
  const r = wins / games;
  const [lo] = wilson(wins, games);
  if (lo > 0.5) return "S";
  if (r >= TIER_RULE.a) return "A";
  if (r >= TIER_RULE.b) return "B";
  if (r >= TIER_RULE.c) return "C";
  return "D";
}

/** La Crimson Cup alza questa Leggendaria di una fascia? */
export function crimsonBoost(e: LegendaryEvidence): boolean {
  const c = e.crimson;
  if (!c || e.changedAfterCrimson || c.seen <= 0) return false;
  return c.banned / c.seen >= TIER_RULE.crimsonBan && c.finalists >= TIER_RULE.crimsonFinalists;
}

/** La fascia finale: il ladder, poi il torneo. */
export function legendaryTier(e: LegendaryEvidence): TierId | "unranked" {
  const base = ladderTier(e.games, e.wins);
  if (base === "unranked") return base;
  if (!crimsonBoost(e)) return base;
  return ORDER[Math.max(0, ORDER.indexOf(base) - 1)];
}
