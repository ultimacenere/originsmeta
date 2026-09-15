export type TierId = "S" | "A" | "B" | "C" | "D";
export const tierIds: TierId[] = ["S", "A", "B", "C", "D"];

export type TierSectionId = "decks" | "legendaries" | "cards";

export type TierSection = {
  id: TierSectionId;
  /** slug (mazzi o carte) per tier */
  tiers: Record<TierId, string[]>;
  /** voci in valutazione, non ancora classificate */
  unranked: string[];
};

const empty = (): Record<TierId, string[]> => ({ S: [], A: [], B: [], C: [], D: [] });

/**
 * Tier list di OriginsMeta. Aggiornare `updated` a ogni modifica e spiegare ogni spostamento
 * nelle news. Finché ladder e deckbuilder non sono pubblici, tutte le voci restano in `unranked`.
 */
export const tierList: { updated: string; sections: TierSection[] } = {
  updated: "2026-09-15",
  sections: [
    { id: "decks", tiers: empty(), unranked: [] },
    { id: "legendaries", tiers: empty(), unranked: ["mulan", "queen-of-hearts"] },
    { id: "cards", tiers: empty(), unranked: [] },
  ],
};

export function tierOf(sectionId: TierSectionId, slug: string): TierId | "unranked" | undefined {
  const section = tierList.sections.find((s) => s.id === sectionId);
  if (!section) return undefined;
  for (const t of tierIds) if (section.tiers[t].includes(slug)) return t;
  return section.unranked.includes(slug) ? "unranked" : undefined;
}
