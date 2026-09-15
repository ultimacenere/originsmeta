import type { Locale } from "../i18n";

type L10n = Record<Locale, string> & { fr?: string };
const n = (en: string, it: string, fr?: string): L10n => (fr ? { en, it, fr } : { en, it });

/** Archetipi (tag obbligatorio su ogni mazzo). */
export const archetypeLabels: Record<string, L10n> = {
  swarm: n("Swarm / go wide", "Swarm / vai largo"),
  evil: n("Evil / big bodies", "Evil / grossi corpi"),
  discard: n("Discard", "Scarto"),
  midrange: n("Midrange", "Midrange"),
  control: n("Control", "Controllo"),
  aggro: n("Aggro", "Aggro"),
  combo: n("Combo", "Combo"),
};

export type DeckSource = "playtest" | "official" | "community";

export type Deck = {
  slug: string;
  name: string;
  /** slug della Leggendaria che guida il mazzo, se nota */
  legendary?: string;
  archetype: keyof typeof archetypeLabels;
  creator: { name: string; url?: string; video?: string };
  source: DeckSource;
  updated: string;
  tagline: L10n;
  text: L10n;
  /** slug delle carte note nel mazzo */
  cards: string[];
  changes?: { patch: string; removed?: string; added?: string; why: L10n }[];
};


/**
 * Mazzi curati dalla redazione. I tre mazzi di esempio del playtest (Swarm, Evil, Discard, ricostruiti dalle
 * patch notes) sono stati rimossi il 15/09/2026 su richiesta di Pierluigi: i mazzi del sito vengono dalla
 * community (`community_decks`). L'array resta per eventuali liste ufficiali future.
 */
export const decks: Deck[] = [];

export function getDeck(slug: string): Deck | undefined {
  return decks.find((d) => d.slug === slug);
}

export function decksWithCard(cardSlug: string): Deck[] {
  return decks.filter((d) => d.cards.includes(cardSlug) || d.legendary === cardSlug);
}
