/**
 * Anteprima della carta al passaggio del mouse: metà pannello alla carta ufficiale, metà a nome, costo,
 * statistiche, tipo, allineamento e testo dell'abilità. Stesse classi `.deck-peek*` di globals.css.
 *
 * Componente condiviso (niente "use client", niente hook): lo usano il deck builder (componente client) e
 * `CardChip` (componente server), così l'anteprima c'è ovunque ci sia una carta, anche dentro la scheda di
 * un mazzo. Va messo come figlio diretto di un elemento `.deck-card-wrap.has-peek`: apertura e chiusura
 * sono solo CSS (`:hover`), e solo dove il mouse esiste (`hover: hover`). Su touch il pannello non compare
 * e resta il tocco che porta alla scheda della carta. `CardMentionEdges` lo sposta ai bordi della finestra.
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
          <span className="deck-peek-name">
            {card.legendary ? "★ " : ""}
            {card.name}
          </span>
          <span className="deck-peek-tags">
            {card.mana !== undefined ? <span className="deck-peek-mana">{card.mana}</span> : null}
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
