import type { ReactNode } from "react";
import { KICKSTARTER_URL } from "@/lib/kickstarter";

/**
 * Tasto verso la campagna Kickstarter della Alpha Edition con il link referral di OriginsMeta (26/10/2026,
 * src/lib/kickstarter.ts): gradiente stile Instagram dei bottoni primari (`.btn-kickstarter` in globals.css; dal 27/10/2026, prima era il verde di Kickstarter). Si apre nella stessa scheda, al
 * contrario degli altri tasti esterni del sito: è il tasto di una pagina con un solo obiettivo, e NN/g consiglia la stessa
 * scheda (una nuova solo avvisando); il testo sotto il tasto dice dove porta. `rel="sponsored"` perché il link è pagato
 * (regole di Google sui link in uscita). Il clic lo conta `onDocumentClick` con l'evento `kickstarter_click` (attributi
 * data-om-*); `placement` dice da dove. Componente server, nessun JavaScript. La dichiarazione del link referral la
 * scrive chi usa il tasto, accanto (`disclosure` delle etichette).
 */
export function KickstarterButton({
  children,
  placement,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  placement: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cls = ["btn-kickstarter", size === "sm" ? "btn-kickstarter-sm" : size === "lg" ? "btn-kickstarter-lg" : "", className].filter(Boolean).join(" ");
  return (
    <a href={KICKSTARTER_URL} rel="sponsored noopener" className={cls} data-om-event="kickstarter_click" data-om-placement={placement} data-om-cta="button">
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}
