import type { Dictionary } from "@/lib/i18n";
import type { TierExplorerLabels } from "@/components/TierExplorer";

/** Etichette di `TierExplorer` nella lingua della pagina: le stesse per le tre pagine della sezione Tier list. */
export function tierExplorerLabels(d: Dictionary): TierExplorerLabels {
  const x = d.tier.explorer;
  return {
    search: x.search,
    filters: x.filters,
    type: d.common.type,
    unit: d.common.unit,
    spell: d.common.spell,
    cost: x.cost,
    alignment: d.common.alignment,
    good: d.common.good,
    evil: d.common.evil,
    neutral: d.common.neutral,
    clear: x.clear,
    cardsOne: x.cardsOne,
    cardsMany: x.cardsMany,
    viewLabel: x.viewLabel,
    viewGrid: x.viewGrid,
    viewTable: x.viewTable,
    tableCaption: x.tableCaption,
    colCard: x.colCard,
    colCost: x.colCost,
    colType: x.colType,
    colCommunity: x.colCommunity,
    colDecks: x.colDecks,
    none: x.none,
    emptyTier: x.emptyTier,
    close: x.close,
    communityTier: x.communityTier,
    average: x.average,
    votesOne: x.votesOne,
    votesMany: x.votesMany,
    distribution: x.distribution,
    notRanked: x.notRanked,
    officialPending: x.officialPending,
    inDecks: x.inDecks,
    decksTitle: x.decksTitle,
    noDecks: x.noDecks,
    moreDecks: x.moreDecks,
    guidesTitle: x.guidesTitle,
    cardPage: x.cardPage,
    legendary: d.common.legendary,
    mana: d.common.mana,
    power: d.common.power,
    health: d.common.health,
    showAll: d.tier.played.showAll,
    unused: d.tier.played.unused,
    unranked: d.common.unranked,
    inDecksOne: d.tier.inDecksOne,
    inDecksMany: d.tier.inDecksMany,
    tiers: d.tier.tiers,
  };
}

/** Lo stato di ogni fonte sotto il suo nome, nella testata della sezione. */
export function tierSourceState(d: Dictionary, n: { lists: number; decks: number; officialUpdated?: string }) {
  const t = d.tier;
  return {
    official: n.officialUpdated ? t.sourceOfficialUpdated.replace("{date}", n.officialUpdated) : t.sourceOfficialSoon,
    community: n.lists === 0 ? t.sourceCommunityNone : n.lists === 1 ? t.sourceCommunityOne : t.sourceCommunityMany.replace("{n}", String(n.lists)),
    played: n.decks === 0 ? t.sourcePlayedNone : n.decks === 1 ? t.sourcePlayedOne : t.sourcePlayedMany.replace("{n}", String(n.decks)),
  };
}
