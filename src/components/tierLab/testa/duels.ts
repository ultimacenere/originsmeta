import type { GameCardInput } from "@/game-card/model";
import type { LabLegendary, LabTier, LabTierOrNone } from "@/lib/tierLab/types";

/*
  Prototipo 2 della tier list, «Testa a testa» (27/11/2026, branch claude/tierlist-lab): la tier list si gioca a duelli,
  come la schermata VS del gioco. Qui le parti pure, usate dal server (pool dei duelli) e dal browser (sfida del giorno):
  niente letture, niente numeri di persone. Ogni numero viene da LabData.
*/

/** La Leggendaria come la vede il gioco: quello che serve al duello e ai tre verdetti. */
export type DuelLeg = {
  slug: string;
  name: string;
  href: string;
  game: GameCardInput;
  tier: LabTierOrNone;
  rank: number;
  community?: { tier: LabTier; avg: number };
  votes?: { tier?: LabTier; avg: number };
};

/** Uno scontro del Tracker, orientato: `a` è chi vince più spesso, `r` il suo win rate con l'intervallo al 95%. */
export type Duel = { id: string; a: string; b: string; games: number; wins: number; r: number; lo: number; hi: number; close: boolean };

/** Il duello in campo: chi sta a sinistra e chi a destra (a caso, così il vincitore non sta sempre dalla stessa parte). */
export type Bout = { duel: Duel; left: string; right: string };

/*
  Partite minime perché l'intervallo di uno scontro sia abbastanza stretto da fare una domanda onesta (a 80 partite
  l'intervallo è largo circa ±11 punti). Regola interna del prototipo: non si scrive sulla pagina.
*/
const MIN_GAMES = 80;
/** Sotto un punto di vantaggio lo scontro è un pari: non c'è una risposta da dare. */
const MIN_EDGE = 0.01;

export function toDuelLeg(l: LabLegendary): DuelLeg {
  return {
    slug: l.slug,
    name: l.name,
    href: l.href,
    game: l.game,
    tier: l.official.tier,
    rank: l.official.rank,
    community: l.community,
    votes: l.votes,
  };
}

/** Gli scontri giocabili di una patch, uno per coppia (A contro B è il contrario di B contro A), niente specchi. */
export function buildPool(legs: LabLegendary[], patch: string): Duel[] {
  const seen = new Set<string>();
  const out: Duel[] = [];
  for (const l of legs) {
    for (const m of l.patches[patch]?.matchups ?? []) {
      if (m.opponent === l.slug || m.games < MIN_GAMES) continue;
      const id = [l.slug, m.opponent].sort().join("~");
      if (seen.has(id)) continue;
      seen.add(id);
      if (Math.abs(m.r - 0.5) < MIN_EDGE) continue;
      const aWins = m.r > 0.5;
      const d: Duel = aWins
        ? { id, a: l.slug, b: m.opponent, games: m.games, wins: m.wins, r: m.r, lo: m.lo, hi: m.hi, close: false }
        : { id, a: m.opponent, b: l.slug, games: m.games, wins: m.games - m.wins, r: 1 - m.r, lo: 1 - m.hi, hi: 1 - m.lo, close: false };
      d.close = d.lo <= 0.5;
      out.push(d);
    }
  }
  return out.sort((x, y) => x.id.localeCompare(y.id));
}

/** Generatore pseudo-casuale con seme (mulberry32): la stessa sfida per tutti nello stesso giorno. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Il seme di un giorno (AAAA-MM-GG, UTC): FNV-1a. */
export function daySeed(day: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

function shuffle<T>(xs: T[], next: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Gli 8 duelli di una sfida: un mix di scontri netti (l'intervallo sta tutto da una parte del 50%) e tirati, ogni
 * Leggendaria al massimo due volte (tre se non bastano), ordine e lati a caso dal seme.
 */
export function pickChallenge(pool: Duel[], seed: number, n = 8): Bout[] {
  const next = rng(seed);
  const clear = shuffle(pool.filter((d) => !d.close), next);
  const close = shuffle(pool.filter((d) => d.close), next);
  const wantClose = Math.min(close.length, Math.round(n * 0.375));
  const picked: Duel[] = [];
  const uses = new Map<string, number>();
  const take = (list: Duel[], limit: number, cap: number) => {
    for (const d of list) {
      if (picked.length >= limit) return;
      if (picked.includes(d)) continue;
      if ((uses.get(d.a) ?? 0) >= cap || (uses.get(d.b) ?? 0) >= cap) continue;
      picked.push(d);
      uses.set(d.a, (uses.get(d.a) ?? 0) + 1);
      uses.set(d.b, (uses.get(d.b) ?? 0) + 1);
    }
  };
  for (const cap of [2, 3, 99]) take(close, wantClose, cap);
  for (const cap of [2, 3, 99]) take(clear, n, cap);
  for (const cap of [2, 3, 99]) take(close, n, cap);
  return shuffle(picked, next).map((duel) => (next() < 0.5 ? { duel, left: duel.a, right: duel.b } : { duel, left: duel.b, right: duel.a }));
}

/** Chi delle due mette più in alto una fonte; null se pari o se la fonte non ha classificato tutte e due. */
export type Source = "official" | "community" | "votes";

export function higher(src: Source, x: DuelLeg, y: DuelLeg): string | null {
  if (src === "official") return x.rank === y.rank ? null : x.rank < y.rank ? x.slug : y.slug;
  const vx = src === "community" ? x.community?.avg : x.votes?.avg;
  const vy = src === "community" ? y.community?.avg : y.votes?.avg;
  if (vx === undefined || vy === undefined || vx === vy) return null;
  return vx > vy ? x.slug : y.slug;
}

/** La tua classifica: quante volte l'hai scelta su quante l'hai vista; a pari merito vale la tier list ufficiale. */
export function yourRanking(bouts: Bout[], picks: (string | null)[], legs: Map<string, DuelLeg>) {
  const score = new Map<string, { won: number; seen: number }>();
  bouts.forEach((b, i) => {
    for (const s of [b.left, b.right]) {
      const e = score.get(s) ?? { won: 0, seen: 0 };
      e.seen += 1;
      if (picks[i] === s) e.won += 1;
      score.set(s, e);
    }
  });
  return [...score.entries()]
    .map(([slug, e]) => ({ slug, ...e, leg: legs.get(slug) as DuelLeg }))
    .filter((e) => e.leg)
    .sort((x, y) => y.won / y.seen - x.won / x.seen || y.won - x.won || x.leg.rank - y.leg.rank);
}
