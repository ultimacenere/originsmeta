/*
 * Meta di un torneo dalle liste dei giocatori (30/09/2026, preparato per la Crimson Cup del 20–25/10: le liste della top
 * di ogni giornata trascritte con la fonte in src/lib/data/eventDecklists.ts). Regole pure: quante volte compare ogni
 * Leggendaria, in quanti mazzi c'è ogni carta base, quali formazioni Conquest (le Leggendarie dei mazzi di un giocatore)
 * tornano. Solo conteggi sulle liste pubblicate, mai un win rate. Nessun import a runtime: lo esegue Node nei test.
 */

/** Un mazzo: la Leggendaria per prima, poi le 12 carte base (slug di cards.ts). */
export type EventDeck = string[];

/** Un giocatore del torneo con il piazzamento dichiarato dalla fonte ("1", "2", "3-4", "5-8") e i suoi mazzi. */
export type EventPlayer = { name: string; placing: string; decks: EventDeck[] };

export type EventMeta = {
  players: number;
  decks: number;
  /** Leggendarie dalla più giocata: mazzi che la usano e quota sul totale dei mazzi */
  legendaries: { slug: string; decks: number; share: number }[];
  /** carte base dalla più presente: mazzi che la contengono e quota */
  cards: { slug: string; decks: number; share: number }[];
  /** formazioni (Leggendarie di un giocatore in ordine alfabetico) che compaiono almeno due volte */
  lineups: { legendaries: string[]; players: number }[];
};

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 1000) / 10 : 0);
const byCount = <T extends { decks: number; slug: string }>(a: T, b: T) => b.decks - a.decks || a.slug.localeCompare(b.slug);

export function eventMeta(players: readonly EventPlayer[]): EventMeta {
  const decks = players.flatMap((p) => p.decks).filter((d) => d.length > 0);
  const legendary = new Map<string, number>();
  const card = new Map<string, number>();
  for (const [leg, ...rest] of decks) {
    legendary.set(leg, (legendary.get(leg) ?? 0) + 1);
    for (const s of new Set(rest)) card.set(s, (card.get(s) ?? 0) + 1);
  }
  const lineupCount = new Map<string, number>();
  for (const p of players) {
    if (p.decks.length < 2) continue;
    const key = p.decks.map((d) => d[0]).sort().join("|");
    lineupCount.set(key, (lineupCount.get(key) ?? 0) + 1);
  }
  return {
    players: players.length,
    decks: decks.length,
    legendaries: Array.from(legendary, ([slug, n]) => ({ slug, decks: n, share: pct(n, decks.length) })).sort(byCount),
    cards: Array.from(card, ([slug, n]) => ({ slug, decks: n, share: pct(n, decks.length) })).sort(byCount),
    lineups: Array.from(lineupCount, ([key, n]) => ({ legendaries: key.split("|"), players: n }))
      .filter((l) => l.players >= 2)
      .sort((a, b) => b.players - a.players || a.legendaries.join().localeCompare(b.legendaries.join())),
  };
}

/** Sotto questo numero di giocatori trascritti la pagina resta fuori dalla sitemap e noindex: i conteggi direbbero poco. */
export const EVENT_META_MIN_PLAYERS = 4;
