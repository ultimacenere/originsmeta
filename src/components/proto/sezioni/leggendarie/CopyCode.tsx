"use client";

import { useState } from "react";

/* Tasto «Copia codice del gioco» della sezione Leggendarie (prototipo, 27/11/2026). */

const L = { copy: "Copia codice del gioco", done: "Codice copiato", fail: "Copia non riuscita" };

export function CopyCode({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className="btn btn-primary text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setState("done");
        } catch {
          setState("fail");
        }
        window.setTimeout(() => setState("idle"), 2000);
      }}
    >
      {state === "done" ? L.done : state === "fail" ? L.fail : L.copy}
    </button>
  );
}
