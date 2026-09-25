"use client";

import { useState } from "react";
import { trackNamedEvent, type EventName } from "@/lib/analytics";

/** Tasto "Copia". `event` (misura, src/lib/analytics.ts): l'evento da mandare quando la copia negli appunti riesce. */
export function CopyButton({
  text,
  label,
  copied,
  className = "btn btn-ink text-xs",
  event,
}: {
  text: string;
  label: string;
  copied: string;
  className?: string;
  event?: { name: EventName; params: Record<string, string> };
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
    <button type="button" onClick={copy} className={className}>
      {done ? copied : label}
    </button>
  );
}
