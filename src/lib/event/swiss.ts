import type { EventMatch } from "./types";

/**
 * Svizzera degli eventi (10/11/2026). `swissPairs` e `pairsOf` sono copiati da src/lib/tournament/formats.ts del
 * branch claude/svizzera-gironi (09/11/2026, svizzera del Tournament Organizer, provata contro tm_swiss_pairs su 400
 * casi): stessa ricerca, così gli abbinamenti di un evento e quelli di un torneo seguono le stesse regole. La classifica
 * è quella del Tournament Organizer ridotta alle partite secche di un evento: 3 punti a vittoria (il bye vale una
 * vittoria), nessun pareggio, spareggio sul win rate degli avversari (OMW%, minimo 33% come nel regolamento di Magic).
 */

/** Punti per una vittoria (bye compreso); il pareggio non esiste. */
export const WIN_POINTS = 3;
/** Minimo delle percentuali negli spareggi. */
export const PCT_FLOOR = 0.33;
/** Passi massimi della ricerca degli abbinamenti senza rivincite. */
export const SWISS_PAIR_BUDGET = 5000;

/**
 * Abbinamenti di un turno svizzero (indici da 0). I giocatori 0..n-1 sono in ordine di classifica; `hadBye[i]` dice se
 * i ha già avuto il bye; `played` le coppie da evitare (già giocate, o con lo stesso mazzo). Restituisce il compagno di
 * ognuno (-1 = bye). Bye al più basso senza bye; poi ricerca in profondità dall'alto senza coppie da evitare, con un
 * altro candidato al bye se quello non chiude; senza soluzione dall'alto preferendo chi non va evitato.
 */
export function swissPairs(n: number, hadBye: boolean[], played: [number, number][]): number[] {
  if (n < 1) return [];
  if (n === 1) return [-1];
  // dentro si lavora da 1: 0 = libero, -1 = bye
  const seen = new Uint8Array(n * n + n + 1);
  const at = (i: number, j: number) => (i - 1) * n + j;
  for (const [a, b] of played) {
    const i = a + 1;
    const j = b + 1;
    if (i >= 1 && i <= n && j >= 1 && j <= n) {
      seen[at(i, j)] = 1;
      seen[at(j, i)] = 1;
    }
  }
  let byes: number[] = [];
  if (n % 2 === 1) {
    for (let k = n; k >= 1; k--) if (!hadBye[k - 1]) byes.push(k);
    if (!byes.length) for (let k = n; k >= 1; k--) byes.push(k);
  } else byes = [0];

  let steps = 0;
  const out = (partner: number[]) => partner.slice(1).map((p) => (p > 0 ? p - 1 : -1));

  for (const bye of byes) {
    const partner = new Array<number>(n + 1).fill(0);
    const cand = new Array<number>(n + 1).fill(0);
    if (bye > 0) partner[bye] = -1;
    const stack: number[] = [];
    let i = 1;
    let ok = false;
    for (;;) {
      while (i <= n && partner[i] !== 0) i += 1;
      if (i > n) {
        ok = true;
        break;
      }
      steps += 1;
      if (steps > SWISS_PAIR_BUDGET) break;
      let pick = 0;
      for (let j = Math.max(cand[i], i) + 1; j <= n; j++) {
        if (partner[j] === 0 && !seen[at(i, j)]) {
          pick = j;
          break;
        }
      }
      if (pick > 0) {
        partner[i] = pick;
        partner[pick] = i;
        cand[i] = pick;
        stack.push(i);
        i += 1;
      } else {
        cand[i] = 0;
        if (!stack.length) break;
        const k = stack.pop() as number;
        const j = partner[k];
        partner[k] = 0;
        partner[j] = 0;
        i = k;
      }
    }
    if (ok) return out(partner);
    if (steps > SWISS_PAIR_BUDGET) break;
  }

  const bye = byes[0];
  const partner = new Array<number>(n + 1).fill(0);
  if (bye > 0) partner[bye] = -1;
  for (let i = 1; i <= n; i++) {
    if (partner[i] !== 0) continue;
    let pick = 0;
    for (let j = i + 1; j <= n; j++) {
      if (partner[j] === 0 && !seen[at(i, j)]) {
        pick = j;
        break;
      }
    }
    if (!pick) {
      for (let j = i + 1; j <= n; j++) {
        if (partner[j] === 0) {
          pick = j;
          break;
        }
      }
    }
    if (!pick) throw new Error("pairing_failed");
    partner[i] = pick;
    partner[pick] = i;
  }
  return out(partner);
}

/** Le coppie dei compagni di `swissPairs` (indice più basso prima) e il bye. */
export function pairsOf(partner: number[]): { tables: [number, number][]; bye: number | null } {
  const tables: [number, number][] = [];
  let bye: number | null = null;
  partner.forEach((p, i) => {
    if (p < 0) bye = i;
    else if (p > i) tables.push([i, p]);
  });
  return { tables, bye };
}

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
