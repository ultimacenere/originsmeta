import Image from "next/image";
import { guideCover } from "@/lib/community/guides";

/**
 * Copertina di una guida della community (pacchetto GUIDE, 27/09/2026): un'immagine del media kit ufficiale in
 * public/media (`GUIDE_COVERS` in guides.ts), come le copertine delle guide e delle news del sito. Il materiale Koin qui
 * è contenuto (la copertina di un articolo), non interfaccia: si mostra intero, nelle sue proporzioni 16:9 (niente
 * ritagli: i crediti impressi restano visibili) e senza nulla sopra (la categoria sta nel testo accanto, mai sull'immagine,
 * che potrebbe avere i crediti in un angolo). Decorativa (`alt` vuoto): il titolo sta nell'H1 o nella scheda.
 * Componente server senza stato, usato dalla pagina della guida, dagli elenchi e dal modulo (anteprima e scelta).
 */
export function GuideCover({
  preset,
  className = "",
  framed = true,
  eager = false,
  sizes = "(max-width: 896px) 100vw, 896px",
}: {
  preset: unknown;
  className?: string;
  /** cornice celeste da 3 px e angoli tondi (pagina della guida); senza, la cornice la dà la scheda che la contiene */
  framed?: boolean;
  /** la copertina in testa alla pagina di una guida: l'immagine più grande della pagina, si carica subito */
  eager?: boolean;
  sizes?: string;
}) {
  const c = guideCover(preset);
  const frame = framed ? "rounded-xl border-[3px] border-sky" : "border-b-[3px] border-sky";
  return (
    <div className={`w-full overflow-hidden bg-night-2 ${frame} ${className}`}>
      <Image
        src={c.src}
        alt=""
        width={c.width}
        height={c.height}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="block aspect-[16/9] h-auto w-full object-cover"
      />
    </div>
  );
}
