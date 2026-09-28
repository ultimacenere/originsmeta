/**
 * Artwork della Leggendaria caricato da un Creator o dallo Staff (29/09/2026, `deckArtUrl` in src/lib/community/deckArt.ts)
 * nel riquadro della carta: stessa cornice dorata di `CardArt`, con il costo in mana della Leggendaria. L'immagine è già
 * ritagliata in 5:7 dal browser e riempie il riquadro. `<img>` e non next/image: il file sta nello Storage di Supabase,
 * come le foto profilo, e il riquadro è piccolo.
 */
export function DeckArtImage({ src, alt, mana, className = "", eager = false }: { src: string; alt: string; mana?: number; className?: string; eager?: boolean }) {
  return (
    <span className={`card-chip-art is-legendary ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" />
      {mana !== undefined ? <span className="mana">{mana}</span> : null}
    </span>
  );
}
