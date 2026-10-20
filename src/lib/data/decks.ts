import type { Locale } from "../i18n";

type L10n = Record<Locale, string>;
const n = (en: string, it: string, es: string, fr: string, pt: string, de: string): L10n => ({ en, it, es, fr, pt, de });

/** Archetipi (tag obbligatorio su ogni mazzo). */
export const archetypeLabels: Record<string, L10n> = {
  swarm: n("Swarm / go wide", "Swarm / vai largo", "Swarm / ir a lo ancho", "Swarm / jouer large", "Swarm / jogar largo", "Swarm / breit spielen"),
  // "Evil" si chiama "Big" dal 12/10/2026 (Pierluigi: "evil diventa big"); l'id resta `evil` per i mazzi già salvati
  evil: n("Big / big bodies", "Big / grossi corpi", "Big / cuerpos grandes", "Big / gros gabarits", "Big / corpos grandes", "Big / große Körper"),
  discard: n("Discard", "Scarto", "Descarte", "Défausse", "Descarte", "Discard"),
  midrange: n("Midrange", "Midrange", "Midrange", "Midrange", "Midrange", "Midrange"),
  // Tempo dal 12/10/2026 (Pierluigi, nota "winrate 2.0" e "sì aggiungilo"): lo sceglie chi pubblica, suggestArchetype non lo propone
  tempo: n("Tempo", "Tempo", "Tempo", "Tempo", "Tempo", "Tempo"),
  control: n("Control", "Controllo", "Control", "Contrôle", "Controle", "Control"),
  aggro: n("Aggro", "Aggro", "Aggro", "Aggro", "Aggro", "Aggro"),
  combo: n("Combo", "Combo", "Combo", "Combo", "Combo", "Combo"),
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
