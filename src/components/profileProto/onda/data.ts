import type { Card } from "@/lib/data/cards";
import type { ProtoData, ProtoDeck } from "@/lib/profileProto/load";
import { THIN_GAMES, rated, type Rated } from "@/lib/tracker/snapshot";

/*
  Prototipo 2 «In onda» (27/11/2026): i numeri della pagina, in funzioni pure. Solo dati veri di ProtoData, tranne
  l'esempio delle partite personali (EXAMPLE_GAMES), che la pagina dichiara come esempio.
*/

/** La firma di una lista (Leggendaria + 12 carte, in ordine): due mazzi con la stessa lista contano una volta sola. */
export const listSig = (d: ProtoDeck) => `${d.legendary?.slug ?? "-"}|${d.cards.map((c) => c.slug).sort().join(",")}`;

/** I mazzi con partite registrate, una lista una volta sola (vince il primo dell'elenco, il più recente). */
export function playedDecks(decks: readonly ProtoDeck[]): (ProtoDeck & { wr: Rated })[] {
  const seen = new Set<string>();
  const out: (ProtoDeck & { wr: Rated })[] = [];
  for (const d of decks) {
    if (!d.winrate || d.winrate.games <= 0) continue;
    const sig = listSig(d);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push({ ...d, wr: rated(d.winrate) });
  }
  return out;
}

export type Score = { decks: number; games: number; wins: number; wr: Rated | null; votes: number };

export function scoreOf(data: ProtoData): Score {
  const played = playedDecks(data.decks);
  const games = played.reduce((s, d) => s + d.wr.games, 0);
  const wins = played.reduce((s, d) => s + d.wr.wins, 0);
  return {
    decks: data.decks.length,
    games,
    wins,
    wr: games > 0 ? rated({ games, wins }) : null,
    votes: data.decks.reduce((s, d) => s + (d.rating?.votes ?? 0), 0),
  };
}

export type VsMeta = { card: Card; mine: Rated; meta: Rated; diff: number; thin: boolean; verdict: "better" | "worse" | "even" | "thin" };

/** Per ogni Leggendaria dei mazzi con partite: le sue liste contro la stessa Leggendaria nel meta della patch. */
export function vsMeta(data: ProtoData): VsMeta[] {
  if (!data.meta) return [];
  const by = new Map<string, { card: Card; games: number; wins: number }>();
  for (const d of playedDecks(data.decks)) {
    if (!d.legendary) continue;
    const c = by.get(d.legendary.slug) ?? { card: d.legendary, games: 0, wins: 0 };
    by.set(d.legendary.slug, { card: c.card, games: c.games + d.wr.games, wins: c.wins + d.wr.wins });
  }
  const out: VsMeta[] = [];
  for (const [slug, m] of by) {
    const metaRow = data.meta.legendaries.find((l) => l.card.slug === slug);
    if (!metaRow || metaRow.games <= 0) continue;
    const mine = rated({ games: m.games, wins: m.wins });
    const meta = rated({ games: metaRow.games, wins: metaRow.wins });
    const diff = Math.round((mine.r - meta.r) * 1000) / 10;
    const thin = mine.games < THIN_GAMES;
    const verdict = thin ? "thin" : diff >= 2 ? "better" : diff <= -2 ? "worse" : "even";
    out.push({ card: m.card, mine, meta, diff, thin, verdict });
  }
  return out.sort((a, b) => b.mine.games - a.mine.games);
}

/** «In forma»: anche il bordo prudente (il caso peggiore dell'intervallo al 95%) sta sopra il 50%. Provvisorio. */
export const inForm = (r: Rated) => r.lo > 0.5;

/* ---------- esempio delle partite personali (non sono pubbliche) ---------- */

/** Soglie della maestria, livello 1–7, dalle partite giocate con una Leggendaria: mai dal win rate. Provvisorio. */
export const MASTERY_STEPS = [1, 5, 12, 25, 40, 60, 100] as const;
export function masteryOf(games: number): number {
  let lvl = 0;
  for (const s of MASTERY_STEPS) if (games >= s) lvl++;
  return lvl;
}
/** Partite che mancano al livello dopo (null al livello massimo). */
export function nextStep(games: number): number | null {
  const s = MASTERY_STEPS.find((x) => x > games);
  return s === undefined ? null : s - games;
}

/** Numeri di esempio, fissi e uguali per tutti i profili: non vengono da nessuna partita vera. */
const EXAMPLE_GAMES: readonly { games: number; wins: number }[] = [
  { games: 43, wins: 24 },
  { games: 14, wins: 8 },
  { games: 6, wins: 2 },
  { games: 2, wins: 1 },
];

/** Le Leggendarie dell'esempio: quelle dei suoi mazzi, la più frequente per prima, al massimo quattro. */
export function exampleLegendaries(data: ProtoData): { card: Card; games: number; wins: number; level: number; next: number | null }[] {
  const count = new Map<string, { card: Card; n: number }>();
  for (const d of data.decks) {
    if (!d.legendary || d.theory) continue;
    const c = count.get(d.legendary.slug) ?? { card: d.legendary, n: 0 };
    count.set(d.legendary.slug, { card: c.card, n: c.n + 1 });
  }
  return [...count.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, EXAMPLE_GAMES.length)
    .map((x, i) => ({ card: x.card, ...EXAMPLE_GAMES[i], level: masteryOf(EXAMPLE_GAMES[i].games), next: nextStep(EXAMPLE_GAMES[i].games) }));
}

/** La Leggendaria più presente nei suoi mazzi, per la testata quando la vetrina non ne ha una del cuore. */
export function mostUsedLegendary(decks: readonly ProtoDeck[]): Card | null {
  const count = new Map<string, { card: Card; n: number }>();
  for (const d of decks) {
    if (!d.legendary) continue;
    const c = count.get(d.legendary.slug) ?? { card: d.legendary, n: 0 };
    count.set(d.legendary.slug, { card: c.card, n: c.n + 1 });
  }
  return [...count.values()].sort((a, b) => b.n - a.n)[0]?.card ?? null;
}
