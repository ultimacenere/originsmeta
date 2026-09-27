import { supabaseUrl } from "@/lib/supabase/env";
import { DEFAULT_COVER_PRESET, accentBorder, coverStyle, mediaPublicUrl, type Vetrina } from "@/lib/community/showcase";

/**
 * Copertina in testa al profilo vetrina /u/<nome> (pacchetto VETRINA, 27/09/2026): l'immagine caricata dal creator,
 * ritagliata larga con object-fit, oppure uno degli 8 sfondi disegnati con la palette del sito (quello predefinito se
 * non ne ha scelto uno). Decorativa (niente testo sopra, alt vuoto), con la cornice nel colore d'accento. Mai materiale
 * Koin come sfondo: le illustrazioni delle carte stanno nella vetrina solo come contenuto (Leggendaria del cuore).
 */
export function ProfileCover({ vetrina }: { vetrina: Vetrina }) {
  const frame = "mt-2.5 block h-28 w-full overflow-hidden rounded-[14px] border-[3px] border-sky sm:h-40 md:h-48";
  if (vetrina.coverPath) {
    return (
      <div className={frame} style={accentBorder(vetrina.accent)} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaPublicUrl(supabaseUrl, vetrina.coverPath)} alt="" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
      </div>
    );
  }
  return <div className={frame} style={{ ...coverStyle(vetrina.coverPreset ?? DEFAULT_COVER_PRESET), ...accentBorder(vetrina.accent) }} aria-hidden="true" />;
}
