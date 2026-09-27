"use client";

import { useActionState, useState } from "react";
import { saveShowStats, type ShowStatsState } from "@/lib/community/achievementActions";
import type { AchievementLabels } from "@/lib/achievementLabels";

/**
 * La casella "Mostra i numeri sulla vetrina del profilo" di /account (pacchetto TRAGUARDI, 27/09/2026). La casella è
 * controllata: React 19 svuota i moduli dopo un'azione riuscita, qui deve restare com'è stata salvata. Il messaggio
 * dopo il salvataggio sta in una regione `role="status"`.
 */
export function ShowStatsToggle({ initial, labels }: { initial: boolean; labels: AchievementLabels["account"] }) {
  const [checked, setChecked] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState<ShowStatsState, FormData>(async (prev, fd) => {
    const res = await saveShowStats(prev, fd);
    if (typeof res.value === "boolean") setChecked(res.value);
    setDirty(false);
    return res;
  }, {});
  const message = pending ? labels.saving : dirty ? "" : state.error ? labels.errors[state.error] : state.ok ? (state.value ? labels.savedOn : labels.savedOff) : "";

  return (
    <form action={formAction} className="card-night mt-4 p-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="show_stats"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            setDirty(true);
          }}
          className="mt-0.5 h-5 w-5 shrink-0 accent-mint"
        />
        <span className="font-semibold text-pale">{labels.checkbox}</span>
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-ink text-xs disabled:opacity-60">
          {labels.save}
        </button>
        <p role="status" className={`text-sm ${state.error && !dirty && !pending ? "text-bad" : "text-pale-muted"}`}>
          {message}
        </p>
      </div>
    </form>
  );
}
