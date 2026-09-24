import { cards } from "./cards";

export type TierId = "S" | "A" | "B" | "C" | "D";
export const tierIds: TierId[] = ["S", "A", "B", "C", "D"];

export type TierSectionId = "decks" | "legendaries" | "cards";

export type TierSection = {
  id: TierSectionId;
  /** slug (mazzi o carte) per tier; i mazzi della community con il prefisso `COMMUNITY_DECK_PREFIX` */
  tiers: Record<TierId, string[]>;
  /** voci in valutazione, non ancora classificate */
  unranked: string[];
};

const empty = (): Record<TierId, string[]> => ({ S: [], A: [], B: [], C: [], D: [] });

/** Tutto ciò che sta già in una fascia: serve a non ripetere la stessa voce fra le "non ancora classificate". */
const placed = (tiers: Record<TierId, string[]>): Set<string> => new Set(tierIds.flatMap((t) => tiers[t]));

/*
  Le fasce S/A/B/C/D restano vuote finché ladder e tornei non danno risultati: le prime escono dopo lo Steam
  Next Fest, dalla Crimson Cup. Una fascia riempita a sensazione brucerebbe la pagina: qui si scrive solo ciò
  che si può spiegare in una news.
*/
const deckTiers = empty();
const legendaryTiers = empty();
const cardTiers = empty();

/**
 * Tier list di OriginsMeta. Aggiornare `updated` a ogni modifica e spiegare ogni spostamento nelle news.
 * Finché le fasce sono vuote, fra le voci "non ancora classificate" stanno tutte le Leggendarie attive della
 * Demo 2.0, lette dal database carte (le schede carta mostrano "non ancora classificata"). La pagina
 * /tier-list, intanto, mostra le anteprime vere: mazzi più votati e carte più presenti nei mazzi pubblicati.
 */
export const tierList: { updated: string; sections: TierSection[] } = {
  updated: "2026-09-22",
  sections: [
    {
      id: "decks",
      // slug dei mazzi pubblicati (/decks/community/<slug>) quando entreranno in fascia; i mazzi li legge la pagina
      // da Supabase (24/09/2026: prima qui ce n'erano 2 scritti a mano su 14 pubblicati)
      tiers: deckTiers,
      unranked: [],
    },
    {
      id: "legendaries",
      tiers: legendaryTiers,
      unranked: cards.filter((c) => c.legendary && c.status === "active" && !placed(legendaryTiers).has(c.slug)).map((c) => c.slug),
    },
    { id: "cards", tiers: cardTiers, unranked: [] },
  ],
};

export function tierOf(sectionId: TierSectionId, slug: string): TierId | "unranked" | undefined {
  const section = tierList.sections.find((s) => s.id === sectionId);
  if (!section) return undefined;
  for (const t of tierIds) if (section.tiers[t].includes(slug)) return t;
  return section.unranked.includes(slug) ? "unranked" : undefined;
}
