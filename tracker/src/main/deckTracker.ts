/**
 * Il pannello del mazzo, "Deck tracker" (10/10/2026, richiesta di Pierluigi: "una seconda dashboard che fa vedere il
 * deck in uso e se possibile aggiornarlo live, come un tracker a tutti gli effetti"). Funzione pura, con i test in
 * deckTracker.test.ts: la usano la finestra accanto al gioco e la sorgente per OBS (overlay.ts).
 *
 * Il mazzo arriva dai file del gioco (watcher.ts, cambia appena il giocatore lo sceglie); durante la partita lo scanner
 * (frames.ts) dice round, carte giocate e carte rivelate dall'avversario. Le carte sono ordinate come nella schermata
 * del mazzo del gioco: per costo, poi per nome.
 */
import type { TrackedMatch } from "../../../src/lib/tracker/match";
import type { ScannedMatch } from "../shared/reconstruct";
import type { ActiveDeck, DeckCard, DeckTrackerView } from "../shared/types";
import type { CardLookup } from "./overlay";

/** Copie di una carta base nel mazzo: 1 Leggendaria + 12 carte × 2 = 25 (regole del deck builder del sito). */
export const BASE_COPIES = 2;

const sortedKey = (cards: readonly string[]) => [...cards].sort().join(",");

export function deckTrackerView(input: {
  activeDeck: ActiveDeck;
  matches: readonly TrackedMatch[];
  /** la partita letta dallo scanner (in corso o appena finita); null senza scanner o senza partita */
  live: { scan: ScannedMatch; inMatch: boolean } | null;
  scanner: boolean;
  card: CardLookup;
  now?: number;
}): DeckTrackerView {
  const { activeDeck, live, card } = input;
  const played = new Map<string, number>();
  for (const p of live?.scan.plays ?? []) if (p.me) played.set(p.card, (played.get(p.card) ?? 0) + 1);
  const entry = (key: string, copies: number): DeckCard => {
    const c = card(key);
    return { key, name: c?.name ?? key, slug: c?.slug ?? null, mana: c?.mana ?? null, spell: c?.type === "spell", legendary: c?.legendary ?? false, copies, played: Math.min(copies, played.get(key) ?? 0) };
  };
  const byCost = (a: DeckCard, b: DeckCard) => (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name);

  let deck: DeckTrackerView["deck"] = null;
  let record: DeckTrackerView["record"] = null;
  if (activeDeck && activeDeck.cards.length) {
    const legendaryKey = activeDeck.legendary ?? activeDeck.cards.find((k) => card(k)?.legendary) ?? null;
    const others = [...new Set(activeDeck.cards.filter((k) => k !== legendaryKey))];
    deck = { name: activeDeck.name, legendary: legendaryKey ? entry(legendaryKey, 1) : null, cards: others.map((k) => entry(k, BASE_COPIES)).sort(byCost) };
    const key = sortedKey(activeDeck.cards);
    const games = input.matches.filter((m) => m.deck.cards.length && sortedKey(m.deck.cards) === key);
    const wins = games.filter((m) => m.result === "W").length;
    const losses = games.filter((m) => m.result === "L").length;
    record = { wins, losses, games: wins + losses };
  }

  const opp = live?.scan;
  return {
    deck,
    record,
    scanner: input.scanner,
    live: opp
      ? {
          inMatch: live.inMatch,
          round: opp.turns,
          opponent: {
            legendary: opp.oppLegendary ? entry(opp.oppLegendary, 1) : null,
            // le carte rivelate dall'avversario, nell'ordine in cui sono comparse, con le copie viste
            seen: [...new Set(opp.plays.filter((p) => !p.me && p.card !== opp.oppLegendary).map((p) => p.card))].map((k) => {
              const e = entry(k, 0);
              const n = opp.plays.filter((p) => !p.me && p.card === k).length;
              return { ...e, copies: n, played: n };
            }),
          },
        }
      : null,
    updatedAt: new Date(input.now ?? Date.now()).toISOString(),
  };
}
