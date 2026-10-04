import { getCard } from "@/lib/data/cards";
import { sortByCost } from "@/lib/stream";
import { authorName } from "./util";
import { shownBadge } from "./badges";
import type { StreamDeck } from "./streamDecks";
import type { StreamDeckSet } from "./streamDeckSets";

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

/** Le carte inserite a mano dall'autore: le ha un mazzo singolo e ognuno dei tre mazzi di un mazzo torneo. */
type WithCustom = { custom_cards?: readonly { slug: string; name: string; mana?: number }[] | null };

function cardOf(slug: string, deck: WithCustom): StreamCard {
  const card = getCard(slug);
  if (card) return { slug, name: card.name, mana: card.mana, thumb: card.thumb, image: card.image, saga: card.saga, spell: card.type === "spell" };
  const custom = deck.custom_cards?.find((x) => x.slug === slug);
  return { slug, name: custom?.name ?? slug.replace(/^custom:/, ""), mana: custom?.mana, custom: true };
}

export function streamDeckView(deck: StreamDeck): StreamDeckView {
  return {
    slug: deck.slug,
    name: deck.name,
    author: authorName(deck.profile),
    username: deck.profile?.username ?? null,
    // ruolo da mostrare (27/09/2026): null per la community e per un tag che il codice non conosce
    badge: shownBadge(deck.profile?.badge),
    archetype: deck.archetype,
    legendary: deck.legendary ? cardOf(deck.legendary, deck) : null,
    cards: sortByCost(deck.cards.map((s) => cardOf(s, deck))),
  };
}

/** Uno dei tre mazzi di un mazzo torneo, pronto per overlay e immagine: lettera (A, B, C), nome, Leggendaria, carte per costo. */
export type StreamSetDeck = { letter: string; name: string; archetype: string; legendary: StreamCard | null; cards: StreamCard[] };

export type StreamDeckSetView = {
  slug: string;
  name: string;
  author: string;
  username: string | null;
  badge: string | null;
  decks: StreamSetDeck[];
};

/**
 * Il mazzo torneo pronto per overlay, immagine e comando di chat (04/10/2026): come `streamDeckView`, per ognuno dei tre
 * mazzi nell'ordine in cui li ha messi l'autore (lettere A, B, C come nella scheda del trio).
 */
export function streamDeckSetView(set: StreamDeckSet): StreamDeckSetView {
  return {
    slug: set.slug,
    name: set.name,
    author: authorName(set.profile),
    username: set.profile?.username ?? null,
    badge: shownBadge(set.profile?.badge),
    decks: set.decks.map((deck, i) => ({
      letter: String.fromCharCode(65 + i),
      name: deck.name,
      archetype: deck.archetype,
      legendary: deck.legendary ? cardOf(deck.legendary, deck) : null,
      cards: sortByCost(deck.cards.map((s) => cardOf(s, deck))),
    })),
  };
}
