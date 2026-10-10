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

/**
 * Lo stato di ogni fonte sotto il suo nome, nella testata della sezione. `winrateGames`: partite della patch mostrata
 * dalla pagina dei win rate (`readWinrateGames`), null finché non c'è un numero sopra la soglia ("in arrivo"); assente
 * sulle pagine che non leggono il database (il tool), che mostrano la dicitura fissa. Dal 02 al 10/10/2026 la scheda era
 * "Analytics · in pausa" (patch 0.7 senza replay); riaperta il 10/10/2026, quando l'app legge di nuovo le carte giocate
 * dallo schermo.
 */
export function tierSourceState(
  d: Dictionary,
  n: { lists: number; people: number; decks: number; officialUpdated?: string; cardVotes?: number | null; winrateGames?: number | null },
) {
  const t = d.tier;
  return {
    winrate:
      n.winrateGames === undefined
        ? t.sourceWinrateHint
        : n.winrateGames
          ? n.winrateGames === 1
            ? t.sourceWinrateGamesOne
            : t.sourceWinrateGames.replace("{n}", String(n.winrateGames))
          : t.sourceWinrateSoon,
    // voti alle carte (06/10/2026): quanti voti da 1 a 10 sono stati dati; null = migrazione non ancora applicata ("in arrivo")
    votes:
      n.cardVotes === undefined
        ? t.sourceVotesHint
        : n.cardVotes === null
          ? t.sourceVotesSoon
          : n.cardVotes === 0
            ? t.sourceVotesNone
            : n.cardVotes === 1
              ? t.sourceVotesOne
              : t.sourceVotesMany.replace("{n}", String(n.cardVotes)),
    official: n.officialUpdated ? t.sourceOfficialUpdated.replace("{date}", n.officialUpdated) : t.sourceOfficialSoon,
    // niente conteggio sotto "Community" (Pierluigi, 29/09/2026: "rimuovi la dicitura 6 persone"): resta solo il nome.
    // Quante persone hanno salvato una lista si legge ancora nella riga del campione (communitySample di tierstats.ts).
    community: "",
    played: n.decks === 0 ? t.sourcePlayedNone : n.decks === 1 ? t.sourcePlayedOne : t.sourcePlayedMany.replace("{n}", String(n.decks)),
  };
}
