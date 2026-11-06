import type { ReactNode } from "react";

/**
 * Passi numerati di /account/tracker e /account/twitch (06/11/2026): la forma della guida all'installazione di /tracker,
 * con dentro il passo quello che gli serve (il link, il riquadro del codice), così istruzione e codice stanno nello stesso
 * punto e non si confondono con quelli dell'altra pagina.
 */
export function StepCards({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="mt-4 grid gap-3">
      {steps.map((step, i) => (
        <li key={i} className="card-night flex gap-3 p-4 sm:gap-4 sm:p-5">
          <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint font-mono text-sm font-bold text-ink">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 self-center text-sm text-pale">{step}</div>
        </li>
      ))}
    </ol>
  );
}
