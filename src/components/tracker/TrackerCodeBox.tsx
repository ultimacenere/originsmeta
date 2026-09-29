"use client";

import { useActionState, useEffect, useState } from "react";
import { createTrackerCode, type TrackerCodeState } from "@/lib/community/trackerActions";
import { fillTracker, type TrackerLabels } from "@/lib/trackerLabels";

/**
 * "Crea un codice" di /account/tracker (tracker/overlay, Fase 3, 30/09/2026): il codice monouso da scrivere nell'app
 * per collegarla all'account. Vale 10 minuti e una volta (tracker_link_code); scaduto, il riquadro lo dice. Il codice
 * vive solo in questo riquadro: non finisce nell'indirizzo della pagina né nella cronologia del browser.
 */
export function TrackerCodeBox({ labels, locale }: { labels: TrackerLabels["link"]; locale: string }) {
  const [state, action, pending] = useActionState<TrackerCodeState>(createTrackerCode, {});
  // l'ora la aggiorna il timer qui sotto (0 = appena creato, quindi non scaduto): niente Date.now() durante il render
  const [now, setNow] = useState(0);
  // il codice copiato: un codice nuovo torna a "Copia" da solo
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copied = Boolean(state.code) && copiedCode === state.code;

  useEffect(() => {
    if (!state.expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, [state.expiresAt]);

  const expired = state.expiresAt && now > 0 ? Date.parse(state.expiresAt) <= now : false;
  const until = state.expiresAt ? new Date(state.expiresAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="card-night mt-4 p-5">
      <form action={action}>
        <button type="submit" disabled={pending} className="btn btn-primary text-xs disabled:opacity-60">
          {pending ? labels.creating : labels.create}
        </button>
      </form>
      <div aria-live="polite">
        {state.code && !expired ? (
          <div className="mt-5">
            <p className="kicker text-pale-muted">{labels.yourCode}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="font-mono text-3xl font-bold tracking-[0.18em] text-sky" translate="no">
                {state.code}
              </p>
              <button
                type="button"
                className="btn btn-ink text-xs"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(state.code ?? "");
                    setCopiedCode(state.code ?? null);
                  } catch {
                    setCopiedCode(null);
                  }
                }}
              >
                {copied ? labels.copied : labels.copy}
              </button>
            </div>
            <p className="mt-2 text-sm text-pale-muted">{fillTracker(labels.expires, { time: until })}</p>
          </div>
        ) : null}
        {state.code && expired ? <p className="mt-4 text-sm text-pale-muted">{labels.expired}</p> : null}
        {state.error ? <p className="mt-4 text-sm text-bad">{labels.errors[state.error]}</p> : null}
      </div>
    </div>
  );
}
