import { wilson } from "@/lib/tracker/snapshot";
import type { GameCardInput } from "@/game-card/model";

/**
 * Prototipo B del rework di Analytics, «Il tuo mazzo» (26/11/2026): logica pura, senza server, per la pagella del mazzo
 * nel browser. Tutto viene dalle liste esatte registrate dal Tracker (13 carte, lato di chi registra) e dagli scontri
 * contati a due lati di `analyticsProto.ts`; qui niente stime, niente giocatori.
 */

export type MNum = { games: number; wins: number; r: number; lo: number; hi: number };
export const mnum = (wins: number, games: number): MNum => {
  const [lo, hi] = wilson(wins, games);
  return { games, wins, r: games > 0 ? wins / games : 0.5, lo, hi };
};

export type MList = MNum & { legendary: string; cards: string[] };
export type MMatchup = MNum & { a: string; b: string };
export type MLegendary = MNum & { slug: string; share: number };
export type MCardStat = { slug: string; avgTurn: number | null };

export type MPatch = {
  patch: string;
  label: string;
  games: number;
  lists: MList[];
  matchups: MMatchup[];
  legendaries: MLegendary[];
  cards: MCardStat[];
};

export type MCard = { slug: string; key: string | null; name: string; mana: number | null; legendary: boolean; input: GameCardInput };

export type Deck = { legendary: string; cards: string[] };

/** Il mazzo ha la forma che le liste del Tracker possono confrontare: una Leggendaria e 12 carte diverse. */
export const fullDeck = (d: Deck | null): d is Deck => !!d && !!d.legendary && d.cards.length === 12;

export const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

export function exactList(p: MPatch, d: Deck): MList | null {
  return p.lists.find((l) => l.legendary === d.legendary && sameList(l.cards, d.cards)) ?? null;
}

export type CardRead = { slug: string; share: number; with: MNum | null; without: MNum | null; avgTurn: number | null; verdict: "up" | "down" | null; points: number | null };

/** Carta per carta, fra le liste registrate della stessa Leggendaria: quota delle partite in cui c'è, win rate con e senza. */
export function readCards(p: MPatch, d: Deck): { legendaryGames: number; cards: CardRead[] } {
  const mine = p.lists.filter((l) => l.legendary === d.legendary);
  const games = mine.reduce((s, l) => s + l.games, 0);
  const wins = mine.reduce((s, l) => s + l.wins, 0);
  const turns = new Map(p.cards.map((c) => [c.slug, c.avgTurn]));
  const cards = d.cards.map((slug): CardRead => {
    let g = 0;
    let w = 0;
    for (const l of mine)
      if (l.cards.includes(slug)) {
        g += l.games;
        w += l.wins;
      }
    const withN = g > 0 ? mnum(w, g) : null;
    const withoutN = games - g > 0 ? mnum(wins - w, games - g) : null;
    let verdict: CardRead["verdict"] = null;
    if (withN && withoutN) {
      if (withN.lo > withoutN.hi) verdict = "up";
      else if (withN.hi < withoutN.lo) verdict = "down";
    }
    return {
      slug,
      share: games > 0 ? g / games : 0,
      with: withN,
      without: withoutN,
      avgTurn: turns.get(slug) ?? null,
      verdict,
      points: withN && withoutN ? Math.round((withN.r - withoutN.r) * 100) : null,
    };
  });
  return { legendaryGames: games, cards };
}

export type Swap = { list: MList; out: string[]; in: string[]; shared: number };

/** Le liste vicine (stessa Leggendaria, almeno 9 carte su 12 in comune, non la stessa), dalla più solida (bordo basso). */
export function nearLists(p: MPatch, d: Deck, minShared = 9): Swap[] {
  const mine = new Set(d.cards);
  return p.lists
    .filter((l) => l.legendary === d.legendary && !sameList(l.cards, d.cards))
    .map((l) => {
      const shared = l.cards.filter((c) => mine.has(c)).length;
      return { list: l, shared, out: d.cards.filter((c) => !l.cards.includes(c)), in: l.cards.filter((c) => !mine.has(c)) };
    })
    .filter((s) => s.shared >= minShared)
    .sort((a, b) => b.list.lo - a.list.lo || b.list.games - a.list.games);
}

/** Gli scontri della Leggendaria (due lati, niente specchio): i migliori per bordo basso, i più duri per bordo alto (anche sopra il 50%). */
export function matchupsOf(p: MPatch, legendary: string, max = 3): { best: MMatchup[]; worst: MMatchup[]; all: MMatchup[] } {
  const all = p.matchups.filter((m) => m.a === legendary && m.b !== legendary && m.games > 0);
  const best = [...all].filter((m) => m.r > 0.5).sort((x, y) => y.lo - x.lo || y.games - x.games).slice(0, max);
  const worst = [...all].filter((m) => !best.includes(m)).sort((x, y) => x.hi - y.hi || y.games - x.games).slice(0, max);
  return { best, worst, all: all.sort((x, y) => y.r - x.r) };
}

/** Stato nell'indirizzo: `#p=ea-1117&d=<leggendaria>~<carta>~…` (slug, si condivide così com'è). */
export function encodeHash(patch: string, d: Deck | null): string {
  const q = new URLSearchParams();
  q.set("p", patch);
  if (d) q.set("d", [d.legendary, ...d.cards].join("~"));
  return `#${q.toString()}`;
}

export function decodeHash(hash: string): { patch: string | null; deck: Deck | null } {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const raw = q.get("d");
  const parts = raw ? raw.split("~").filter(Boolean) : [];
  return { patch: q.get("p"), deck: parts.length ? { legendary: parts[0], cards: [...new Set(parts.slice(1))] } : null };
}

export const pct = (r: number) => `${Math.round(r * 100)}%`;
