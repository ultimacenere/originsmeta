import { cards, getCard, type Card } from "@/lib/data/cards";

/**
 * Theory craft (29/10/2026, Pierluigi: "creiamo sotto deck builder la nuova sezione Theory craft dove le persone potranno
 * creare dei deck con anche le carte che non sono ancora uscite", poi "sono le 86 carte rimosse dal gioco"): un deck
 * builder che al pool del gioco aggiunge le carte che oggi non ci sono (`status: "removed"` dell'import, con gli ultimi
 * costo, statistiche e testo noti) e un elenco dei mazzi costruiti così, uguale a quello dei mazzi singoli.
 *
 * Un mazzo è theory craft quando contiene almeno una di quelle carte: lo dicono le carte, non una colonna del database.
 * Quindi niente migrazione, e quando una carta torna nel gioco (l'import la riporta `active`) i mazzi che la usano passano
 * da soli fra i mazzi singoli, con lo stesso indirizzo. Nessun mazzo pubblicato prima del 29/10/2026 ne contiene: le 86
 * erano già fuori dal gioco all'apertura della community (15/09/2026) e `checkDeck` le rifiutava.
 *
 * I mazzi theory craft stanno fuori da tutto ciò che descrive il gioco di oggi: /decks e la sua classifica, tier list,
 * "Le più giocate", schede delle carte, Analytics. Il codice del gioco non si genera (`deckGameCode`: il gioco non le ha).
 */

import { THEORY_PATH } from "./theoryCraftPaths";
export { THEORY_DECKS_PATH, THEORY_PATH, THEORY_STORAGE_KEY } from "./theoryCraftPaths";

/** Le carte che il Theory craft aggiunge al pool: fuori dal gioco oggi, mai le carte create (token). */
export const theoryCards: Card[] = cards.filter((c) => c.status === "removed" && c.type !== "token");

const theorySet = new Set(theoryCards.map((c) => c.slug));

export function isTheoryCard(slug: string | null | undefined): boolean {
  return Boolean(slug && theorySet.has(slug));
}

type DeckCards = { legendary: string | null; cards: readonly string[] | null };

/** Le carte di un mazzo che non sono nel gioco, Leggendaria per prima, ognuna una volta. */
export function theorySlugsOf(deck: DeckCards): string[] {
  const out: string[] = [];
  for (const s of [deck.legendary, ...(deck.cards ?? [])]) if (s && isTheoryCard(s) && !out.includes(s)) out.push(s);
  return out;
}

export function isTheoryDeck(deck: DeckCards): boolean {
  return theorySlugsOf(deck).length > 0;
}

/** Mazzi del gioco di oggi e mazzi theory craft, nello stesso ordine in cui arrivano. */
export function splitTheory<T extends DeckCards>(decks: readonly T[]): { official: T[]; theory: T[] } {
  const official: T[] = [];
  const theory: T[] = [];
  for (const d of decks) (isTheoryDeck(d) ? theory : official).push(d);
  return { official, theory };
}

/** Solo i mazzi che si giocano oggi: tier list, statistiche, schede carta e /decks non vedono i theory craft. */
export function officialDecks<T extends DeckCards>(decks: readonly T[]): T[] {
  return decks.filter((d) => !isTheoryDeck(d));
}

/** Il deck builder che sa aprire il mazzo: il Theory craft se ha carte non ancora nel gioco, altrimenti quello di sempre. */
export function builderPathFor(deck: DeckCards): string {
  return isTheoryDeck(deck) ? THEORY_PATH : "/deck-builder";
}

/** Nomi delle carte non ancora nel gioco di un mazzo, per le frasi delle pagine. */
export function theoryNamesOf(deck: DeckCards): string[] {
  return theorySlugsOf(deck).map((s) => getCard(s)?.name ?? s);
}
