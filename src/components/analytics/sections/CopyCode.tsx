"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

/** Tasto «Copia codice del gioco» di Analytics a sezioni (evento ★ `game_code_copy` con placement analytics). */
export function CopyCode({ code, label, done, className = "" }: { code: string; label: string; done: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-primary text-xs ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          trackEvent("game_code_copy", { placement: "analytics" });
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt(label, code);
        }
      }}
    >
      {copied ? done : label}
    </button>
  );
}
