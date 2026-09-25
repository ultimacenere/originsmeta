import type { Card } from "@/lib/data/cards";

/**
 * La carta da collezione ufficiale sulla scheda, con i crediti impressi intatti: stessa resa di `CardArt` con `full`
 * (classi `.card-chip-art*`), ma con un testo alternativo che descrive la carta (CARDS-16): nome, tipo, "carta
 * ufficiale di Origins TCG", illustratore e "© Koin Games", nella lingua della pagina (`cardImageAlt`). Prima l'alt
 * era il solo nome. È l'immagine principale della pagina: si carica subito.
 */
export function CardCollectible({ card, alt, className = "" }: { card: Card; alt: string; className?: string }) {
  if (!card.image) return null;
  return (
    <span className={`card-chip-art card-chip-art-full ${card.legendary ? "is-legendary" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.image} alt={alt} loading="eager" fetchPriority="high" decoding="async" />
      {card.mana !== undefined ? <span className="mana">{card.mana}</span> : null}
    </span>
  );
}
