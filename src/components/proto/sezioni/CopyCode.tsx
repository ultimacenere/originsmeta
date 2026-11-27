"use client";

import { useState } from "react";

/** Tasto «Copia codice del gioco» del prototipo a sezioni. */
export function CopyCode({ code, label = "Copia codice del gioco", className = "" }: { code: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-primary text-xs ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt(label, code);
        }
      }}
    >
      {done ? "Copiato" : label}
    </button>
  );
}
