import { supabaseUrl } from "@/lib/supabase/env";
import { coverStyle, mediaPublicUrl, type Vetrina } from "@/lib/community/showcase";

/**
 * Sfondo della pagina del profilo vetrina /u/<nome> (richiesta di Pierluigi del 27/09/2026: "mi va bene che ci sia una
 * copertina ma ci deve essere anche lo sfondo", "lo rendiamo bloccato, così anche quando gli utenti metteranno il loro
 * non lo vedranno ripetersi"): l'immagine caricata dal creator o uno degli 8 motivi della copertina, su tutta la
 * finestra e FERMO mentre si scorre. È un livello fisso dietro a tutto (position: fixed, z-index -1, dopo lo sfondo
 * del sito nel documento), non background-attachment: fixed, che su iOS non funziona. Una velatura blu notte tiene
 * leggibili testi e pannelli. Decorativo: niente testo, alt vuoto. Senza sfondo scelto resta quello del sito.
 */
export function ProfileBackground({ vetrina }: { vetrina: Vetrina }) {
  const src = vetrina.backgroundPath ? mediaPublicUrl(supabaseUrl, vetrina.backgroundPath) : null;
  if (!src && !vetrina.backgroundPreset) return null;
  const base = src
    ? { backgroundColor: "#0e071f", backgroundImage: `url("${src}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : coverStyle(vetrina.backgroundPreset!);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ ...base, zIndex: -1 }}>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "linear-gradient(180deg, rgba(14, 7, 31, 0.5) 0%, rgba(14, 7, 31, 0.72) 45%, rgba(14, 7, 31, 0.86) 100%)" }}
      />
    </div>
  );
}
