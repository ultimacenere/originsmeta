"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startFinalStage } from "@/lib/tournament/actions";
import { fill } from "@/lib/tournament/types";
import type { DoubleElimLabels } from "@/lib/tournament/doubleElimLabels";

/**
 * Comando dello staff per la qualificazione a doppia eliminazione (10/11/2026): "Chiudi la qualificazione e avvia la
 * Top N" (start_final_stage, che rifà tutti i controlli). Il tasto si spegne finché ci sono partite aperte.
 */
export function DoubleElimControls({ id, slug, done, total, open, cut, finalStarted, labels, errors, warnOpen }: { id: string; slug: string; done: number; total: number; open: number; cut: number; finalStarted: boolean; labels: DoubleElimLabels; errors: Record<string, string>; warnOpen: string }) {
  const l = labels;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="card-night border-mint p-5">
      <h2 className="t-section">{l.controls}</h2>
      <p className="mt-1 font-mono text-sm text-pale">{fill(l.status, { done, total })}</p>
      {error ? (
        <p role="alert" className="alert-bad mt-3">
          {error}
        </p>
      ) : null}
      {!finalStarted && open > 0 ? <p className="mt-2 text-sm text-gold">{warnOpen}</p> : null}
      {!finalStarted ? (
        <div className="mt-4 border-t border-sky/40 pt-3">
          <button
            type="button"
            disabled={pending || open > 0}
            onClick={() => {
              if (!window.confirm(fill(l.startFinalConfirm, { n: cut }))) return;
              start(async () => {
                setError(null);
                const r = await startFinalStage(id, slug);
                if (r.error) {
                  setError(errors[r.error] ?? errors.db ?? r.error);
                  return;
                }
                router.refresh();
              });
            }}
            className="btn btn-gold text-xs"
          >
            {fill(l.startFinal, { n: cut })}
          </button>
          <p className="mt-1 max-w-3xl text-xs text-pale-muted">{l.startFinalHint}</p>
        </div>
      ) : null}
    </section>
  );
}
