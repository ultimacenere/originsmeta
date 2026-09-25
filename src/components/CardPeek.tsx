import { deckPeekOf, hasPeek, type PeekCard } from "@/lib/cardPeek";

export { hasPeek, type PeekCard };

/**
 * Anteprima della carta al passaggio del mouse: metà pannello alla carta ufficiale, metà a nome, costo,
 * statistiche, tipo, allineamento e testo dell'abilità. Stesse classi `.deck-peek*` di globals.css.
 *
 * Componente condiviso (niente "use client", niente hook): lo usano il deck builder (componente client),
 * l'elenco dei mazzi (`DeckExplorer`), le tier list e `CardChip` (componente server), così l'anteprima c'è ovunque
 * ci sia una carta. Va messo come figlio diretto di un elemento `.deck-card-wrap.has-peek`: apertura e chiusura sono
 * solo CSS (`:hover`), e solo dove il mouse esiste (`hover: hover`). Su touch il pannello non compare e resta il tocco
 * che porta alla scheda della carta.
 *
 * Dal 25/09/2026 (GEO-01) il server rende solo il segnaposto vuoto, con i dati del pannello nell'attributo
 * `data-peek`: il pannello lo crea `CardMentionEdges` al primo passaggio del mouse (vedi src/lib/cardPeek.ts). Prima
 * nome, statistiche e testo di ogni carta stavano nell'HTML della pagina: su /decks erano il 69% delle parole.
 * Quindi la pagina che usa `CardPeek` monta `CardMentionEdges` (`CardChip` lo porta già con sé), che sposta anche il
 * pannello ai bordi della finestra.
 *
 * Costo in mana sempre in vista (note del 22/09/2026, "mostrare le statistiche ma mantenere sempre visibile il
 * costo"): la gemma menta con anello di `.deck-peek-mana` (globals.css, documentata in /style) in testa al pannello,
 * accanto al nome, invece che in mezzo alle altre pastiglie.
 * Il pannello si apre sopra o sotto la chip o la riga, mai sopra di essa (vedi `CardMentionEdges`), quindi anche il
 * costo della riga resta scoperto. Leggendaria: stella gialla davanti al nome (`.legendary-star`), stesso colore.
 */
export function CardPeek({ card }: { card: PeekCard }) {
  if (!hasPeek(card)) return null;
  return <span className="deck-peek" aria-hidden="true" data-peek={JSON.stringify(deckPeekOf(card))} />;
}
