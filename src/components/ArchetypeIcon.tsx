import type { CSSProperties } from "react";
import { archetypeIcon } from "@/lib/archetypeIcons";

/**
 * Simbolino di un archetipo (12/10/2026, icone di Pierluigi): l'icona su un fondo scuro tinto del suo colore d'accento.
 * Decorativa (`aria-hidden`): il nome dell'archetipo sta sempre scritto accanto. Niente se l'archetipo non ha icona.
 * Niente caricamento pigro: sono sette file da pochi KB, già in cache dopo il primo. Senza stato né hook: lo usano le pagine server e i client component (DeckExplorer).
 */
export function ArchetypeIcon({ id, size = "md", className = "" }: { id: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const icon = archetypeIcon(id);
  if (!icon) return null;
  return (
    <span className={`arch-ic arch-ic-${size} ${className}`} style={{ "--ac": icon.color } as CSSProperties} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon.src} alt="" width={96} height={96} decoding="async" />
    </span>
  );
}
