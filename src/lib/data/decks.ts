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

const koin = { name: "Koin Games · playtest", url: "https://discord.gg/originstcg" };

export const decks: Deck[] = [
  {
    slug: "swarm",
    name: "Swarm",
    archetype: "swarm",
    creator: koin,
    source: "playtest",
    updated: "2026-08-14",
    tagline: n("Go wide, buff the board", "Vai largo, potenzia il campo"),
    text: n(
      "Cheap bodies on every lane and effects that pump the whole board. Mowgli replaced a cheap spell in 0.6.1 because the deck ran out of gas in the mid-to-late game.",
      "Corpi economici su ogni corsia ed effetti che pompano tutto il campo. Mowgli ha sostituito una magia economica nella 0.6.1 perché il mazzo restava a secco a metà e fine partita.",
    ),
    cards: ["mowgli", "piglet", "little-lamb", "card-soldier"],
    changes: [
      {
        patch: "0.6.1",
        removed: "First Aid",
        added: "Mowgli",
        why: n("Swarm felt thin in the mid-to-late game; a body instead of a cheap spell builds toward a stronger late-game hand.", "Swarm sembrava povero a metà e fine partita; un corpo al posto di una magia economica costruisce una mano finale più forte."),
      },
    ],
  },
  {
    slug: "evil",
    name: "Evil",
    archetype: "evil",
    creator: koin,
    source: "playtest",
    updated: "2026-08-27",
    tagline: n("Villains and big bodies", "Cattivi e grossi corpi"),
    text: n(
      "The villains' deck. Count Orlok was pulled from the game in 0.6.1 while his ability is fixed, and Bandersnatch took his slot; the beast has since been nerfed twice.",
      "Il mazzo dei cattivi. Il Conte Orlok è stato tolto dal gioco nella 0.6.1 mentre viene sistemata la sua abilità, e Bandersnatch ha preso il suo posto; da allora la bestia è stata indebolita due volte.",
    ),
    cards: ["bandersnatch", "count-orlok", "brides-of-dracula", "wicked-witch-of-the-west", "flying-monkey"],
    changes: [
      {
        patch: "0.6.1",
        removed: "Count Orlok",
        added: "Bandersnatch",
        why: n("Count Orlok temporarily swapped out while an issue with his ability is addressed.", "Il Conte Orlok è stato sostituito temporaneamente mentre si risolve un problema alla sua abilità."),
      },
    ],
  },
  {
    slug: "discard",
    name: "Discard",
    archetype: "discard",
    creator: koin,
    source: "playtest",
    updated: "2026-08-14",
    tagline: n("Throw away, get paid", "Scarta e incassa"),
    text: n(
      "Built around discarding Koschei on purpose. Genie got in the way, so 0.6.1 swapped him for Mind Palace, a cheaper draw spell. The team noted the deck was underperforming.",
      "Costruito per scartare Koschei di proposito. Genie intralciava, così la 0.6.1 lo ha sostituito con Mind Palace, una pescata più economica. Il team ha notato che il mazzo rendeva meno degli altri.",
    ),
    cards: ["koschei", "mind-palace", "genie"],
    changes: [
      {
        patch: "0.6.1",
        removed: "Genie",
        added: "Mind Palace",
        why: n("Discard was underperforming; Genie prevented reliably discarding Koschei.", "Discard rendeva meno; Genie impediva di scartare Koschei in modo affidabile."),
      },
    ],
  },
];

export function getDeck(slug: string): Deck | undefined {
  return decks.find((d) => d.slug === slug);
}

export function decksWithCard(cardSlug: string): Deck[] {
  return decks.filter((d) => d.cards.includes(cardSlug) || d.legendary === cardSlug);
}
