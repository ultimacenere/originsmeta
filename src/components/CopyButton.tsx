"use client";

import { useState } from "react";
import { trackNamedEvent, type EventName } from "@/lib/analytics";

/**
 * Tasto "Copia". `event` (misura, src/lib/analytics.ts): l'evento da mandare quando la copia negli appunti riesce.
 * `ariaLabel`: il nome per i lettori di schermo quando più tasti "Copia" stanno vicini ("Copia: Nightbot"); dopo la
 * copia vale il testo visibile ("Copiato").
 */
export function CopyButton({
  text,
  label,
  copied,
  className = "btn btn-ink text-xs",
  event,
  ariaLabel,
}: {
  text: string;
  label: string;
  copied: string;
  className?: string;
  event?: { name: EventName; params: Record<string, string> };
  ariaLabel?: string;
}) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      if (event) trackNamedEvent(event.name, event.params);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      window.prompt(label, text);
    }
  };
  return (
    <button type="button" onClick={copy} className={className} aria-label={ariaLabel && !done ? ariaLabel : undefined}>
      {done ? copied : label}
    </button>
  );
}
