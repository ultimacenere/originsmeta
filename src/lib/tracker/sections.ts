import { bothSides, wilson } from "./snapshot";
import type { ArchetypeStat, CardStat, ListStat, MatchupStat, Overview } from "./stats";

/**
 * Analytics a sezioni (27/11/2026, Pierluigi: "Pagina di oggi, ma meglio", "sotto analytics diverse sezioni, in cui
 * inseriamo le analisi"; scelto e rifinito sui prototipi dello stesso giorno, poi "Sì, portala"). I numeri di una patch
 * del Tracker in una forma semplice per le pagine di /analytics/*: slug delle carte al posto delle chiavi del gioco, win
 * rate con l'intervallo di Wilson al 95%, Leggendarie e scontri contati a due lati (`bothSides`), carte delle liste
 * esatte di ogni Leggendaria, spostamenti fra due patch. Funzioni pure: le prova `node --test src/lib/tracker/sections.test.ts`.
 *
 * Il numero di giocatori del database non entra mai qui: le funzioni ricevono solo partite e vittorie.
 */

export type Num = { games: number; wins: number; r: number; lo: number; hi: number };
export const num = (wins: number, games: number): Num => {
  const [lo, hi] = wilson(wins, games);
  return { games, wins, r: games > 0 ? wins / games : 0.5, lo, hi };
};

export type SecLegendary = Num & { slug: string; share: number };
export type SecMatchup = Num & { a: string; b: string };
export type SecList = Num & { legendary: string; cards: string[] };
export type SecCard = { slug: string; deck: Num | null; deckShare: number; played: Num | null; avgTurn: number | null };
export type SecArchetype = Num & { archetype: string };

export type SecPatch = {
  patch: string;
  /** partite della patch (lato di chi registra) e quante ne ha vinte chi registra */
  games: number;
  wins: number;
  /** partite con la Leggendaria avversaria nota: la base di Leggendarie e scontri */
  matchedGames: number;
  legendaries: SecLegendary[];
  matchups: SecMatchup[];
  lists: SecList[];
  cards: SecCard[];
  archetypes: SecArchetype[];
};

type Raw = { overview: Overview; lists: ListStat[]; archetypes: ArchetypeStat[]; cards: CardStat[]; matchups: MatchupStat[] };

/** Dai numeri del database (chiavi del gioco) a quelli delle sezioni (slug). `slugOf` null = carta che il sito non conosce. */
export function toSecPatch(patch: string, raw: Raw, slugOf: (key: string) => string | null): SecPatch {
  const both = bothSides(raw.matchups.map((m) => ({ legendary: m.legendary, opponent: m.opponent, games: m.games, wins: m.wins })));
  const legendaries = both.legendaries.flatMap((l) => {
    const slug = slugOf(l.legendary);
    return slug ? [{ slug, ...num(l.wins, l.games), share: both.games > 0 ? l.games / (2 * both.games) : 0 }] : [];
  });
  const matchups = both.matchups.flatMap((m) => {
    const a = slugOf(m.legendary);
    const b = slugOf(m.opponent);
    return a && b ? [{ a, b, ...num(m.wins, m.games) }] : [];
  });
  const lists = raw.lists.flatMap((l) => {
    const legendary = l.legendary ? slugOf(l.legendary) : null;
    const slugs = l.list.split(",").map(slugOf);
    if (!legendary || slugs.some((s) => !s)) return [];
    return [{ legendary, cards: (slugs as string[]).filter((s) => s !== legendary).sort(), ...num(l.wins, l.games) }];
  });
  const games = raw.overview.games;
  const cards = raw.cards.flatMap((c) => {
    const slug = slugOf(c.card);
    if (!slug) return [];
    return [
      {
        slug,
        deck: c.deck ? num(c.deck.wins, c.deck.games) : null,
        deckShare: c.deck && games > 0 ? c.deck.games / games : 0,
        played: c.played ? num(c.played.wins, c.played.games) : null,
        avgTurn: c.played?.avgTurn ?? null,
      },
    ];
  });
  return {
    patch,
    games,
    wins: raw.overview.wins,
    matchedGames: both.games,
    legendaries: legendaries.sort((x, y) => y.games - x.games),
    matchups,
    lists: lists.sort((x, y) => y.games - x.games),
    cards: cards.sort((x, y) => (y.deck?.games ?? 0) - (x.deck?.games ?? 0)),
    archetypes: raw.archetypes.map((a) => ({ archetype: a.archetype, ...num(a.wins, a.games) })).sort((x, y) => y.games - x.games),
  };
}

/** Il caso peggiore davanti: bordo basso dell'intervallo, poi le partite. */
export const byPrudent = <T extends Num>(a: T, b: T) => b.lo - a.lo || b.games - a.games;

/**
 * Le carte che una Leggendaria porta, dalle liste esatte registrate: per carta la quota delle partite di quella
 * Leggendaria in cui c'era e il win rate con e senza (lato di chi registra).
 */
export type CardWith = { slug: string; share: number; with: Num; without: Num | null };
export function cardsOfLegendary(lists: readonly SecList[], legendary: string): { games: number; cards: CardWith[] } {
  const mine = lists.filter((l) => l.legendary === legendary);
  const games = mine.reduce((s, l) => s + l.games, 0);
  const wins = mine.reduce((s, l) => s + l.wins, 0);
  const acc = new Map<string, { games: number; wins: number }>();
  for (const l of mine)
    for (const c of l.cards) {
      const a = acc.get(c) ?? { games: 0, wins: 0 };
      acc.set(c, { games: a.games + l.games, wins: a.wins + l.wins });
    }
  const cards = [...acc].map(([slug, a]) => ({
    slug,
    share: games > 0 ? a.games / games : 0,
    with: num(a.wins, a.games),
    without: games - a.games > 0 ? num(wins - a.wins, games - a.games) : null,
  }));
  return { games, cards: cards.sort((x, y) => y.share - x.share || y.with.games - x.with.games) };
}

/** Spostamento fra due patch, in punti; `sure` quando gli intervalli al 95% non si toccano. */
export type Move = { points: number; sure: boolean; before: Num; after: Num };
export function moveOf(before: Num | null | undefined, after: Num | null | undefined): Move | null {
  if (!before || !after || !before.games || !after.games) return null;
  return { points: Math.round((after.r - before.r) * 1000) / 10, sure: after.lo > before.hi || after.hi < before.lo, before, after };
}

/** Due intervalli che non si toccano: la differenza è netta. */
export const apart = (a: Num, b: Num) => a.lo > b.hi || a.hi < b.lo;

/** Fascia di "quando si gioca" dal round medio. */
export type Phase = "early" | "mid" | "late" | "unseen";
export const phaseOf = (avgTurn: number | null): Phase => (avgTurn === null ? "unseen" : avgTurn <= 3 ? "early" : avgTurn <= 6 ? "mid" : "late");

/** Chiave di una lista esatta (Leggendaria + 12 carte in ordine), per trovarla fra i mazzi pubblicati. */
export const listKeyOf = (legendary: string, cards: readonly string[]) => `${legendary}|${[...cards].sort().join(",")}`;
