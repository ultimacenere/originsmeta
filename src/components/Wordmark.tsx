/**
 * Logo del sito (23/09/2026: Pierluigi ha sostituito la scritta con il logo disegnato, lettering in stile graffiti
 * con "Origins" in menta e "Meta" in blu notte, contorno bianco e fondo trasparente).
 *
 * Era un testo (font display, "Origins" gesso + "Meta" menta + pallino magenta): ora è un'immagine, quindi va
 * trattata come tale. Tre cose da sapere:
 * - **Misura**: si ragiona per altezza, come prima con il testo. `height` decide, la larghezza viene da sé
 *   (rapporto 3,25:1). Le due misure di default tengono il logo alla stessa altezza ottica della vecchia scritta.
 * - **Nitidezza**: il file è largo 640 px, cioè il doppio abbondante di come viene disegnato, così resta pulito
 *   anche sugli schermi densi; sotto i 160 px di larghezza il browser usa la copia da 320 (`srcSet`).
 * - **Testo**: il nome del sito non sparisce per chi non vede l'immagine. Nell'header il link ha già il suo
 *   `aria-label`, quindi lì l'immagine resta muta (`alt=""`) per non farlo leggere due volte; altrove (footer)
 *   l'alt porta "OriginsMeta".
 *
 * Il file sta in `public/media/`, generato dall'originale con un trim dei margini trasparenti e due misure WebP.
 */
export function Wordmark({ className = "", height = 26, alt = "" }: { className?: string; height?: number; alt?: string }) {
  const width = Math.round(height * 3.25);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/media/logo-originsmeta.webp"
      srcSet="/media/logo-originsmeta-sm.webp 320w, /media/logo-originsmeta.webp 640w"
      sizes={`${width}px`}
      alt={alt}
      width={width}
      height={height}
      className={`block w-auto ${className}`}
      style={{ height }}
      // il logo è la prima cosa che si vede in cima alla pagina: non deve arrivare dopo
      loading="eager"
      fetchPriority="high"
      decoding="async"
    />
  );
}
