import type { EventPlayer } from "../eventMeta";

/**
 * Liste dei tornei ufficiali per le pagine del meta (/decks/meta/<slug>, 30/09/2026). Si trascrivono a mano dalla fonte
 * ufficiale (post di Koin Games, Discord ufficiale, broadcast), ognuna con il link della fonte in `sources`: niente liste
 * senza fonte, niente piazzamenti dedotti. Un mazzo è [Leggendaria, 12 carte base] con gli slug di cards.ts (un test
 * controlla che le carte esistano). Finché `players` ha meno di EVENT_META_MIN_PLAYERS giocatori la pagina dice quando
 * arrivano le liste, è noindex e fuori dalla sitemap.
 */
export type EventDecklists = {
  slug: string;
  name: string;
  /** giorni del torneo (ISO) */
  from: string;
  to: string;
  /** formato: quanti mazzi porta ogni giocatore (Conquest della Crimson Cup: 3) */
  decksPerPlayer: number;
  /** fonti delle liste, con la data in cui le abbiamo lette */
  sources: { label: string; url: string; read: string }[];
  players: EventPlayer[];
  /** data dell'ultima trascrizione (ISO), per la pagina e la sitemap */
  updated: string;
};

export const eventDecklists: EventDecklists[] = [
  {
    slug: "crimson-cup-2026",
    name: "Crimson Cup",
    from: "2026-10-20",
    to: "2026-10-25",
    decksPerPlayer: 3,
    sources: [],
    players: [],
    updated: "2026-09-30",
  },
];

export function getEventDecklists(slug: string): EventDecklists | undefined {
  return eventDecklists.find((e) => e.slug === slug);
}
