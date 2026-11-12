import type { EventMatch } from "./types";
import { PCT_FLOOR, WIN_POINTS, pairsOf, swissPairs } from "../tournament/formats";

/**
 * Svizzera degli eventi (10/11/2026). Gli abbinamenti sono quelli della svizzera del Tournament Organizer
 * (`swissPairs` e `pairsOf` di src/lib/tournament/formats.ts, 09/11/2026, provati contro tm_swiss_pairs): stessa
 * ricerca, così un evento e un torneo seguono le stesse regole. La classifica è quella del Tournament Organizer ridotta
 * alle partite secche di un evento: 3 punti a vittoria (il bye vale una vittoria), nessun pareggio, spareggio sul win
 * rate degli avversari (OMW%, minimo 33% come nel regolamento di Magic).
 */
export { PCT_FLOOR, WIN_POINTS, pairsOf, swissPairs };

export type StandingRow = {
  player: string;
  rank: number;
  points: number;
  wins: number;
  losses: number;
  byes: number;
  played: number;
  /** win rate degli avversari, da 0 a 1 (minimo PCT_FLOOR) */
  omw: number;
};

const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

/**
 * Classifica di un evento: tutti i `players` (anche chi non ha ancora giocato, a zero), partite con un vincitore.
 * Ordine: punti, OMW%, vittorie, poi l'ordine di `players` (quello della configurazione).
 */
export function standings(players: readonly string[], matches: readonly EventMatch[]): StandingRow[] {
  type Res = { opp: string | null; won: boolean };
  const res = new Map<string, Res[]>(players.map((p) => [p, []]));
  for (const m of matches) {
    if (!m.winner) continue;
    if (res.has(m.a)) res.get(m.a)!.push({ opp: m.b, won: m.winner === m.a });
    if (m.b && res.has(m.b)) res.get(m.b)!.push({ opp: m.a, won: m.winner === m.b });
  }
  const mw = new Map<string, number>();
  for (const [p, list] of res) {
    const wins = list.filter((r) => r.won).length;
    mw.set(p, list.length ? Math.max(wins / list.length, PCT_FLOOR) : PCT_FLOOR);
  }
  const order = new Map(players.map((p, i) => [p, i]));
  const rows: StandingRow[] = players.map((p) => {
    const list = res.get(p) ?? [];
    const wins = list.filter((r) => r.won).length;
    const opps = list.filter((r) => r.opp && mw.has(r.opp)).map((r) => mw.get(r.opp as string) as number);
    return {
      player: p,
      rank: 0,
      points: wins * WIN_POINTS,
      wins,
      losses: list.length - wins,
      byes: list.filter((r) => !r.opp).length,
      played: list.length,
      omw: round6(opps.length ? opps.reduce((s, x) => s + x, 0) / opps.length : list.length ? PCT_FLOOR : 0),
    };
  });
  rows.sort((a, b) => b.points - a.points || b.omw - a.omw || b.wins - a.wins || (order.get(a.player) ?? 0) - (order.get(b.player) ?? 0));
  // a pari punti, OMW% e vittorie la posizione è la stessa
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.rank = prev && prev.points === r.points && prev.omw === r.omw && prev.wins === r.wins ? prev.rank : i + 1;
  });
  return rows;
}

/** "62,5" (il simbolo % lo mette l'etichetta). */
export function pct(x: number): string {
  return (Math.round(x * 1000) / 10).toFixed(1).replace(".", ",");
}
