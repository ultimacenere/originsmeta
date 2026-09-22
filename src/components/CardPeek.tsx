/**
 * Anteprima della carta al passaggio del mouse: metà pannello alla carta ufficiale, metà a nome, costo,
 * statistiche, tipo, allineamento e testo dell'abilità. Stesse classi `.deck-peek*` di globals.css.
 *
 * Componente condiviso (niente "use client", niente hook): lo usano il deck builder (componente client),
 * l'elenco dei mazzi (`DeckExplorer`) e `CardChip` (componente server), così l'anteprima c'è ovunque ci sia una
 * carta. Va messo come figlio diretto di un elemento `.deck-card-wrap.has-peek`: apertura e chiusura sono solo
 * CSS (`:hover`), e solo dove il mouse esiste (`hover: hover`). Su touch il pannello non compare e resta il tocco
 * che porta alla scheda della carta. `CardMentionEdges` lo sposta ai bordi della finestra.
 *
 * Costo in mana sempre in vista (note del 22/09/2026, "mostrare le statistiche ma mantenere sempre visibile il
 * costo"): la gemma menta con anello di `.deck-peek-mana` (globals.css, documentata in /style) in testa al pannello,
 * accanto al nome, invece che in mezzo alle altre pastiglie.
 * Il pannello si apre sopra o sotto la chip o la riga, mai sopra di essa (vedi `CardMentionEdges`), quindi anche il
 * costo della riga resta scoperto. Leggendaria: stella gialla davanti al nome (`.legendary-star`), stesso colore.
 */

/** Il minimo che serve all'anteprima: `BuilderCard` lo soddisfa già, `CardChip` lo ricava dalla carta. */
export type PeekCard = {
  name: string;
  legendary?: boolean;
  mana?: number;
  power?: number;
  health?: number;
  /** carta ufficiale intera (480 px) */
  image?: string;
  /** stessa carta a 160 px, se manca quella grande */
  thumb?: string;
  /** testo dell'abilità già nella lingua della pagina */
  ability?: string;
  typeLabel?: string;
  alignment?: "good" | "evil" | "neutral";
  alignmentLabel?: string;
};

/** C'è qualcosa da mostrare? Le carte inserite a mano (senza testo, statistiche né immagine) non hanno anteprima. */
export function hasPeek(card: PeekCard): boolean {
  return Boolean(card.ability || card.power !== undefined || card.image || card.thumb);
}

export function CardPeek({ card }: { card: PeekCard }) {
  if (!hasPeek(card)) return null;
  const art = card.image ?? card.thumb;
  return (
    <span className="deck-peek" aria-hidden="true">
      <span className={`deck-peek-panel ${card.legendary ? "is-legendary" : ""}`}>
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="deck-peek-art" src={art} alt="" loading="lazy" decoding="async" />
        ) : null}
        <span className="deck-peek-body">
          <span className="flex items-start gap-2">
            {card.mana !== undefined ? <span className="deck-peek-mana shrink-0">{card.mana}</span> : null}
            <span className="deck-peek-name min-w-0 self-center">
              {card.legendary ? (
                <span className="legendary-star" aria-hidden="true">
                  ★
                </span>
              ) : null}
              {card.name}
            </span>
          </span>
          <span className="deck-peek-tags">
            {card.power !== undefined ? (
              <span className="deck-peek-stats">
                {card.power} / {card.health ?? "?"}
              </span>
            ) : null}
            {card.typeLabel ? <span className="deck-peek-type">{card.typeLabel}</span> : null}
            {card.alignmentLabel && card.alignment ? <span className={`deck-peek-align is-${card.alignment}`}>{card.alignmentLabel}</span> : null}
          </span>
          {card.ability ? <span className="deck-peek-text">{card.ability}</span> : null}
        </span>
      </span>
    </span>
  );
}
