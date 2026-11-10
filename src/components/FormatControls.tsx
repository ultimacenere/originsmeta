"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startFinalStage, swissNextRound } from "@/lib/tournament/actions";
import { fill } from "@/lib/tournament/types";
import type { FormatLabels } from "@/lib/tournament/formatLabels";

type Props = {
  id: string;
  slug: string;
  format: "swiss" | "groups";
  /** turno svizzero più alto (o turni del calendario dei gironi) e turni previsti */
  round: number;
  total: number;
  /** partite del turno in corso: chiuse e in tutto; partite aperte di tutta la fase */
  done: number;
  matches: number;
  open: number;
  /** posti della Top (svizzera) o qualificati per girone (gironi); null = svizzera senza Top */
  cut: number | null;
  /** il tabellone della fase finale c'è già */
  finalStarted: boolean;
  labels: FormatLabels;
  errors: Record<string, string>;
};

/**
 * Comandi dello staff per svizzera e gironi (09/11/2026): "Genera il turno N" (swiss_next_round) e "Chiudi la svizzera e
 * avvia la Top" / "Chiudi i gironi e avvia la fase finale" (start_final_stage). Le RPC rifanno tutti i controlli; qui i
 * tasti si spengono quando la RPC direbbe di no, con il motivo scritto.
 */
export function FormatControls({ id, slug, format, round, total, done, matches, open, cut, finalStarted, labels, errors }: Props) {
  const fl = labels;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) {
        setError(errors[r.error] ?? errors.db ?? r.error);
        return;
      }
      router.refresh();
    });
  const swiss = format === "swiss";
  const canNext = swiss && !finalStarted && open === 0 && round < total;
  const canFinal = !finalStarted && open === 0 && (swiss ? cut !== null && round >= 1 : true);
  return (
    <section className="card-night border-mint p-5">
      <h2 className="t-section">{swiss ? fl.controlsSwiss : fl.controlsGroups}</h2>
      {swiss ? <p className="mt-1 font-mono text-sm text-pale">{fill(fl.swissStatus, { n: round, total, done, matches })}</p> : <p className="mt-1 font-mono text-sm text-pale">{fill(fl.roundDone, { done, total: matches })}</p>}
      {error ? (
        <p role="alert" className="alert-bad mt-3">
          {error}
        </p>
      ) : null}
      {!finalStarted && open > 0 ? <p className="mt-2 text-sm text-gold">{fl.roundOpenWarn}</p> : null}
      {swiss && !finalStarted ? (
        round < total ? (
          <div className="mt-3">
            <button
              type="button"
              disabled={pending || !canNext}
              onClick={() => {
                if (window.confirm(fill(fl.nextRoundConfirm, { n: round + 1 }))) run(() => swissNextRound(id, slug));
              }}
              className="btn btn-primary text-xs"
            >
              {fill(fl.nextRound, { n: round + 1 })}
            </button>
            <p className="mt-1 max-w-3xl text-xs text-pale-muted">{fl.nextRoundHint}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-good">✓ {fill(fl.swissDone, { n: total })}</p>
        )
      ) : null}
      {!finalStarted && (!swiss || cut !== null) ? (
        <div className="mt-4 border-t border-sky/40 pt-3">
          <button
            type="button"
            disabled={pending || !canFinal}
            onClick={() => {
              const text = swiss ? fill(fl.startTopConfirm, { n: cut ?? 0 }) : fl.startFinalConfirm;
              if (window.confirm(text)) run(() => startFinalStage(id, slug));
            }}
            className="btn btn-gold text-xs"
          >
            {swiss ? fill(fl.startTop, { n: cut ?? 0 }) : fl.startFinal}
          </button>
          <p className="mt-1 max-w-3xl text-xs text-pale-muted">{swiss ? fill(fl.startTopHint, { n: cut ?? 0 }) : fill(fl.startFinalHint, { k: cut ?? 0 })}</p>
        </div>
      ) : null}
      {swiss && cut === null && !finalStarted ? <p className="mt-3 text-xs text-pale-muted">{fl.finishSwissHint}</p> : null}
    </section>
  );
}
