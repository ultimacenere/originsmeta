"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { clearShowcase } from "@/lib/community/showcaseActions";
import type { ShowcaseEditorLabels } from "@/lib/showcaseLabels";
import { cleanupMedia } from "./mediaUpload";

/**
 * "Togli i dati della vetrina" (pacchetto VETRINA, 27/09/2026) per chi ha perso il ruolo: non vede più il modulo, ma
 * copertina, frase, orari e il resto sono ancora nella riga del profilo, leggibili via API, e la privacy promette che si
 * possono togliere da /account. La Server Action svuota i campi (il trigger ammette sempre di svuotare), poi il browser
 * cancella la copertina caricata, che non è più in uso. Fatto, al posto del tasto resta la conferma (niente refresh
 * della pagina, che toglierebbe anche il messaggio).
 */
export function ClearShowcaseButton({ userId, labels }: { userId: string; labels: ShowcaseEditorLabels }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const clear = async () => {
    setState("busy");
    try {
      const res = await clearShowcase();
      if (!res.ok) {
        setState("error");
        return;
      }
      const sb = supabaseBrowser();
      if (sb) await cleanupMedia(sb, userId, "cover", null);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {state === "done" ? null : (
        <button type="button" className="btn btn-ink text-xs" onClick={clear} disabled={state === "busy"}>
          {state === "busy" ? labels.clearing : labels.clear}
        </button>
      )}
      <p role="status" aria-live="polite" className={`min-h-[1.25rem] text-sm ${state === "error" ? "text-bad" : "text-mint"}`}>
        {state === "done" ? labels.cleared : state === "error" ? labels.clearError : ""}
      </p>
    </div>
  );
}
