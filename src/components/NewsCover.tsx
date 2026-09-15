/**
 * Copertina di una news o di una guida: sempre presente (regola del 15/09/2026), presa dal media kit ufficiale
 * in /public/media o dalla miniatura ufficiale di YouTube. Immagine semplice, non next/image, così le
 * miniature remote non richiedono configurazione.
 */
export function NewsCover({ src, className = "" }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" decoding="async" className={`aspect-[16/9] w-full rounded-lg border border-sky/70 object-cover ${className}`} />
  );
}
