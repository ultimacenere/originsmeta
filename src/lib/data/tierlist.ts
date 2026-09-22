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

/**
 * Voci della sezione mazzi che sono mazzi della community (scheda /decks/community/[slug]) e non mazzi
 * editoriali di decks.ts: si scrivono con questo prefisso, es. "community:healing-healsing-9411".
 */
export const COMMUNITY_DECK_PREFIX = "community:";

/**
 * Mazzi della community citati in tier list. La pagina è statica e non legge Supabase, quindi nome e
 * Leggendaria stanno qui: il nome è quello delle guide (`tags.communityDecks` in guides.ts), la Leggendaria
 * è la prima carta del campo `cards` della news del mazzo (news.ts). Se un mazzo viene nascosto o eliminato
 * dal suo autore, va tolto anche da qui.
 */
export const communityDecks: Record<string, { name: string; legendary: string }> = {
  "3-pigs-mid-range-6311": { name: "3 Pigs Mid Range", legendary: "three-not-so-little-pigs" },
  "healing-healsing-9411": { name: "Healing Healsing", legendary: "van-helsing" },
};

/** Il mazzo della community dietro una voce della tier list, se la voce è un mazzo della community. */
export function communityDeckOf(entry: string): { slug: string; name: string; legendary: string } | undefined {
  if (!entry.startsWith(COMMUNITY_DECK_PREFIX)) return undefined;
  const slug = entry.slice(COMMUNITY_DECK_PREFIX.length);
  const deck = communityDecks[slug];
  return deck ? { slug, ...deck } : undefined;
}

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
 * Finché le fasce sono vuote, fra le voci "non ancora classificate" stanno i mazzi pubblicati sul sito e
 * tutte le Leggendarie attive della Demo 2.0, lette dal database carte: una Leggendaria nuova entra da sola
 * al prossimo import, una rimossa esce da sola.
 */
export const tierList: { updated: string; sections: TierSection[] } = {
  updated: "2026-09-22",
  sections: [
    {
      id: "decks",
      tiers: deckTiers,
      unranked: Object.keys(communityDecks)
        .map((slug) => `${COMMUNITY_DECK_PREFIX}${slug}`)
        .filter((entry) => !placed(deckTiers).has(entry)),
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
