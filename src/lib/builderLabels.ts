import type { Dictionary, Locale } from "@/lib/i18n";
import { cards, sagas } from "@/lib/data/cards";
import type { BuilderCard } from "@/lib/deckrules";
import type { BuilderLabels } from "@/components/DeckBuilder";

/** Etichette del deck builder dal dizionario (usate da /deck-builder e dal builder dedicato ai tornei). */
export function builderLabels(d: Dictionary): BuilderLabels {
  const b = d.builder;
  return {
    publish: b.publish,
    publishLocked: b.publishLocked,
    lockedHint: b.lockedHint,
    publishHint: b.publishHint,
    modeSingle: b.modeSingle,
    modeTournament: b.modeTournament,
    deckName: b.deckName,
    deckNamePlaceholder: b.deckNamePlaceholder,
    legendarySlot: b.legendarySlot,
    pickLegendary: b.pickLegendary,
    slots: b.slots,
    slotsHint: b.slotsHint,
    pool: b.pool,
    poolHint: b.poolHint,
    searchPool: b.searchPool,
    all: d.common.all,
    cost: b.cost,
    add: b.add,
    remove: b.remove,
    inDeck: b.inDeck,
    full: b.full,
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
    copyLink: b.copyLink,
    copied: b.copied,
    exportText: b.exportText,
    exportGame: b.exportGame,
    exportGameMissing: b.exportGameMissing,
    importTitle: b.importTitle,
    importHint: b.importHint,
    importButton: b.importButton,
    importOk: b.importOk,
    importUnknown: b.importUnknown,
    importError: b.importError,
    teachTitle: b.teachTitle,
    teachHint: b.teachHint,
    teachSend: b.teachSend,
    save: b.save,
    saved: b.saved,
    clear: b.clear,
    submit: b.submit,
    submitHint: b.submitHint,
    tournamentTitle: b.tournamentTitle,
    tournamentHint: b.tournamentHint,
    minDifferent: b.minDifferent,
    diffTable: b.diffTable,
    shared: b.shared,
    deckLabel: b.deckLabel,
    ok: b.ok,
    restored: b.restored,
    typeUnit: b.typeUnit,
    typeSpell: b.typeSpell,
    legendary: d.common.legendary,
    unit: d.common.unit,
    spell: d.common.spell,
  };
}

/** Carte giocabili nel deck builder (attive, non create da altre carte) con l'etichetta della saga nella lingua. */
export function builderPool(locale: Locale): BuilderCard[] {
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
      art: c.art,
    }));
}
