import type { Dictionary, Locale } from "@/lib/i18n";
import { cards, sagas } from "@/lib/data/cards";
import type { BuilderCard } from "@/lib/deckrules";
import type { BuilderLabels } from "@/components/DeckBuilder";

/** Etichette del deck builder dal dizionario (usate da /deck-builder e dal builder dedicato ai tornei). */
export function builderLabels(d: Dictionary): BuilderLabels {
  const b = d.builder;
  return {
    deckTitle: b.deckTitle,
    modeSingle: b.modeSingle,
    modeTournament: b.modeTournament,
    deckName: b.deckName,
    deckNamePlaceholder: b.deckNamePlaceholder,
    legendarySlot: b.legendarySlot,
    // dopo il nome di una Leggendaria, per i lettori di schermo: la stessa parola del titolo della casella
    legendary: b.legendarySlot,
    pickLegendary: b.pickLegendary,
    slots: b.slots,
    slotsHint: b.slotsHint,
    slotsLeft: b.slotsLeft,
    pool: b.pool,
    poolHint: b.poolHint,
    searchPool: b.searchPool,
    searchPoolHint: b.searchPoolHint,
    filterType: b.filterType,
    filterCost: b.filterCost,
    poolCount: b.poolCount,
    poolCountOne: b.poolCountOne,
    poolEmpty: b.poolEmpty,
    clearFilters: d.common.clearFilters,
    all: d.common.all,
    cost: b.cost,
    remove: b.remove,
    curve: b.curve,
    valid: b.valid,
    invalid: b.invalid,
    issues: b.issues,
    customTitle: b.customTitle,
    customHint: b.customHint,
    customName: b.customName,
    customCost: b.customCost,
    customLegendary: b.customLegendary,
    customAdd: b.customAdd,
    actions: b.actions,
    // importazione
    importQuestion: b.importQuestion,
    importPlaceholder: b.importPlaceholder,
    importTitle: b.importTitle,
    importOk: b.importOk,
    importUnknown: b.importUnknown,
    importError: b.importError,
    teachTitle: b.teachTitle,
    teachHint: b.teachHint,
    teachSend: b.teachSend,
    restored: b.restored,
    undoLink: b.undoLink,
    // i quattro tasti
    publish: b.publish,
    completeHint: b.completeHint,
    publishLoginHint: b.publishLoginHint,
    loginRequired: b.loginRequired,
    savePrivate: b.savePrivate,
    savingPrivate: b.savingPrivate,
    savedPrivate: b.savedPrivate,
    saved: b.saved,
    viewProfile: b.viewProfile,
    savePrivateErrors: b.savePrivateErrors,
    // "Condividi" a tre voci: link, codice del gioco, lista in testo (il codice OriginsMeta non si mostra più)
    share: b.share,
    shareTitle: b.shareTitle,
    shareLink: b.shareLink,
    shareGame: b.shareGame,
    shareText: b.shareText,
    shareNative: b.shareNative,
    copyLink: b.copyLink,
    copyGame: b.copyGame,
    copyText: b.copyText,
    copied: b.copied,
    close: b.close,
    exportGameMissing: b.exportGameMissing,
    clear: b.clear,
    clearConfirm: b.clearConfirm,
    clearYes: b.clearYes,
    cancel: b.cancel,
    autosaved: b.autosaved,
    // barra in basso sul telefono
    viewDeck: b.viewDeck,
    summaryBar: b.summaryBar,
    // Conquest
    tournamentTitle: b.tournamentTitle,
    tournamentHint: b.tournamentHint,
    minDifferent: b.minDifferent,
    diffTable: b.diffTable,
    shared: b.shared,
    deckLabel: b.deckLabel,
    ok: b.ok,
    typeUnit: b.typeUnit,
    typeSpell: b.typeSpell,
    spell: d.common.spell,
  };
}

/** Carte giocabili nel deck builder (attive, non create da altre carte) con l'etichetta della saga nella lingua. */
export function builderPool(locale: Locale, d?: Dictionary): BuilderCard[] {
  const typeLabel = d ? ({ unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const) : undefined;
  const alignLabel = d ? ({ good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const) : undefined;
  return cards
    .filter((c) => c.status === "active" && c.type !== "token")
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      type: c.type,
      legendary: Boolean(c.legendary),
      mana: c.mana,
      power: c.power,
      health: c.health,
      sagaLabel: sagas[c.saga][locale],
      key: c.key,
      thumb: c.thumb,
      image: c.image,
      art: c.art,
      // per l'anteprima al passaggio del mouse: testo già nella lingua della pagina, niente database nel bundle
      ability: c.ability?.[locale],
      // per la ricerca: il gioco è in inglese, chi ci gioca cerca "draw" o "discard" anche sulla pagina italiana
      abilityEn: locale !== "en" && c.ability && c.ability.en !== c.ability[locale] ? c.ability.en : undefined,
      alignment: c.alignment,
      alignmentLabel: c.alignment && alignLabel ? alignLabel[c.alignment] : undefined,
      typeLabel: typeLabel ? typeLabel[c.type] : undefined,
    }));
}
