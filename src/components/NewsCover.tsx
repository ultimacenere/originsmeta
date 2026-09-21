/**
 * Copertina di una news o di una guida: sempre presente (regola del 15/09/2026), presa dal media kit ufficiale
 * in /public/media o dalla miniatura ufficiale di YouTube. Immagine semplice, non next/image, così le
 * miniature remote non richiedono configurazione.
 */
export function NewsCover({ src, className = "", priority = false }: { src: string; className?: string; priority?: boolean }) {
  return (
    // `priority` per la copertina in testa alla pagina di un articolo: è l'immagine più grande della
    // pagina, caricarla subito accorcia il Largest Contentful Paint.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`aspect-[16/9] w-full rounded-lg border border-sky/70 object-cover ${className}`}
    />
  );
}
