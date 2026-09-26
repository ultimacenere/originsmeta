import { getCard } from "@/lib/data/cards";
import { sortByCost } from "@/lib/stream";
import { authorName } from "./util";
import type { StreamDeck } from "./streamDecks";

/**
 * Il mazzo pronto per overlay, immagine e comando di chat (pacchetto STREAM, 26/09/2026): nomi e costi dal database
 * carte (le carte inserite a mano dall'autore con il loro nome e, se c'è, il costo), la Leggendaria a parte, le altre
 * per costo e nome. Solo lato server: legge il database carte.
 */
export type StreamCard = {
  slug: string;
  name: string;
  mana?: number;
  /** carta fuori dal nostro database, scritta a mano dall'autore (asterisco, niente immagine) */
  custom?: boolean;
  /** carta intera da 160 px (miniatura), con i crediti stampati: mai ritagliata */
  thumb?: string;
  /** carta intera da 480 px */
  image?: string;
  saga?: string;
  spell?: boolean;
};

export type StreamDeckView = {
  slug: string;
  name: string;
  author: string;
  username: string | null;
  badge: string | null;
  archetype: string;
  legendary: StreamCard | null;
  cards: StreamCard[];
};

function cardOf(slug: string, deck: StreamDeck): StreamCard {
  const card = getCard(slug);
  if (card) return { slug, name: card.name, mana: card.mana, thumb: card.thumb, image: card.image, saga: card.saga, spell: card.type === "spell" };
  const custom = deck.custom_cards.find((x) => x.slug === slug);
  return { slug, name: custom?.name ?? slug.replace(/^custom:/, ""), mana: custom?.mana, custom: true };
}

export function streamDeckView(deck: StreamDeck): StreamDeckView {
  return {
    slug: deck.slug,
    name: deck.name,
    author: authorName(deck.profile),
    username: deck.profile?.username ?? null,
    badge: deck.profile?.badge ?? null,
    archetype: deck.archetype,
    legendary: deck.legendary ? cardOf(deck.legendary, deck) : null,
    cards: sortByCost(deck.cards.map((s) => cardOf(s, deck))),
  };
}
