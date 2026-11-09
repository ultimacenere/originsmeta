import { cards } from "./cards";
import { legendaryTier, type LegendaryEvidence } from "../tierRule";

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
  Prima tier list di OriginsMeta (09/11/2026, Pierluigi: "pubblica la tier list"): le Leggendarie, con la regola di
  src/lib/tierRule.ts (ladder della patch in corso a due lati, poi la Crimson Cup) e la news
  `origins-tcg-tier-list-legendaries-november-2026` che la spiega. Mazzi e carte base restano senza fasce: le pagine
  mostrano le classifiche vive. Una fascia riempita a sensazione brucerebbe la pagina: qui si scrive solo ciò che si
  può spiegare in una news.

  I numeri sono una fotografia, non si aggiornano da soli: ladder letto il 09/11/2026 alle 00:00 UTC con
  `tracker_stats_bundle` (patch ea-1104, 3.147 partite con la Leggendaria avversaria nota; presenze e vittorie a due
  lati, `bothSides`), Crimson Cup dalle quattro qualificazioni con i numeri ufficiali (`crimsonQualifiers`) e dalle
  finali (`crimsonFinals`): lo controlla tierRule.test.ts. Dopo una patch di bilanciamento (la prossima è annunciata
  per il 17/11/2026) si rileggono, si aggiorna `updated` e si spiega ogni spostamento in una news.
*/
export const legendaryEvidence: { read: string; patch: string; games: number; rows: LegendaryEvidence[] } = {
  read: "2026-11-09",
  patch: "ea-1104",
  games: 3147,
  rows: [
    { slug: "three-not-so-little-pigs", games: 1488, wins: 843, crimson: { banned: 402, seen: 1172, finalists: 4 } },
    { slug: "dracula", games: 1647, wins: 876, crimson: { banned: 37, seen: 286, finalists: 0 } },
    { slug: "king-arthur", games: 439, wins: 224, crimson: { banned: 52, seen: 286, finalists: 0 } },
    { slug: "van-helsing", games: 505, wins: 255, crimson: { banned: 504, seen: 999, finalists: 3 } },
    { slug: "legion-of-the-dead", games: 379, wins: 190, crimson: { banned: 60, seen: 438, finalists: 2 } },
    { slug: "mulan", games: 202, wins: 96, crimson: { banned: 50, seen: 285, finalists: 2 } },
    { slug: "queen-of-hearts", games: 337, wins: 149, crimson: { banned: 34, seen: 263, finalists: 0 } },
    { slug: "robin-hood", games: 390, wins: 162, crimson: { banned: 52, seen: 352, finalists: 0 } },
    // nel gioco dalla patch del 4/11: alla Crimson Cup non c'era
    { slug: "dr-frank", games: 596, wins: 237, crimson: null },
    { slug: "merlin", games: 138, wins: 53, crimson: { banned: 179, seen: 414, finalists: 1 } },
    // +2/+2 con la patch del 4/11: il torneo non conta
    { slug: "dorothy", games: 150, wins: 57, crimson: { banned: 19, seen: 81, finalists: 0 }, changedAfterCrimson: true },
    { slug: "wicked-stepmother", games: 23, wins: 5, crimson: { banned: 5, seen: 44, finalists: 0 } },
  ],
};

const deckTiers = empty();
const legendaryTiers = empty();
for (const row of legendaryEvidence.rows) {
  const tier = legendaryTier(row);
  if (tier !== "unranked") legendaryTiers[tier].push(row.slug);
}
const cardTiers = empty();

/**
 * Tier list di OriginsMeta. Aggiornare `updated` a ogni modifica e spiegare ogni spostamento nelle news.
 * Finché le fasce sono vuote, fra le voci "non ancora classificate" stanno tutte le Leggendarie attive del
 * gioco, lette dal database carte (le schede carta mostrano "non ancora classificata"). La pagina
 * /tier-list, intanto, mostra le anteprime vere: mazzi più votati e carte più presenti nei mazzi pubblicati.
 */
export const tierList: { updated: string; sections: TierSection[] } = {
  updated: "2026-11-09",
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
