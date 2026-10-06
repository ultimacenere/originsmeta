import type { Tier } from "./tierstats";
import type { CardRating } from "./cardVotes";

/**
 * Tipi condivisi dalla sezione Tier list (riprogettazione del 24/09/2026): li costruisce `tierData.ts` sul server e
 * li ricevono i componenti, anche quelli client (`TierExplorer`), quindi questo file non importa niente del server.
 */

/** Una carta attiva della Demo 2.0 con tutto quello che le tre viste mostrano, già nella lingua della pagina. */
export type TierCardEntry = {
  slug: string;
  name: string;
  /** scheda della carta, con la lingua */
  href: string;
  /** carta ufficiale a 160 e a 480 px */
  thumb?: string;
  image?: string;
  mana?: number;
  power?: number;
  health?: number;
  spell: boolean;
  typeLabel: string;
  alignment?: "good" | "evil" | "neutral";
  alignmentLabel?: string;
  legendary: boolean;
  saga: string;
  ability?: string;
  /** in quanti mazzi pubblicati compare ("Le più giocate") */
  used: number;
  /** la media delle tier list salvate dagli iscritti, se qualcuno l'ha classificata */
  community?: { tier: Tier; avg: number; votes: number; dist: Record<Tier, number> };
  /** i voti da 1 a 10 degli iscritti (06/10/2026, `cardRatingsFrom`): media, voti, distribuzione e la fascia da 3 voti in su */
  rating?: CardRating;
  /** mazzi pubblicati che la usano, dal più votato */
  decks: { name: string; href: string }[];
  /** guide che la citano */
  guides: { title: string; href: string }[];
};

/** Un mazzo pubblicato dalla community, per le anteprime e per "Le più giocate". */
export type TierDeckEntry = {
  slug: string;
  name: string;
  href: string;
  legendary?: { slug: string; name: string; thumb?: string };
  /** artwork della Leggendaria di un Creator o dello Staff (29/09/2026, `deckArtUrl`): prende il posto della miniatura */
  art?: string;
  archetype: string;
  archetypeLabel: string;
  /** chi ha pubblicato il mazzo (nome mostrato) */
  publisher: string;
  /** ruolo di chi l'ha pubblicato (community, creator, author, pro, staff: `normalizeBadge`) e sua etichetta */
  badge: string;
  badgeLabel: string;
  rating: { avg: number; votes: number };
  /** voto pesato sul numero di voti (`weightedRating`): è l'ordine dei "più votati" */
  score: number;
  created: string;
  createdLabel: string;
  patchLabel?: string;
};
