"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type BracketTab = {
  id: string;
  /** testo del tasto ("A", "Top 16") */
  short: string;
  /** nome completo per i lettori di schermo ("Bracket A") */
  label: string;
  /** il bracket ha già il vincitore */
  done?: boolean;
  /** il bracket di chi guarda */
  mine?: boolean;
  /** la scheda della fase finale: più larga, in oro */
  top?: boolean;
};

/**
 * Schede dei bracket di un torneo con la fase finale (08/11/2026): una fila di tasti sopra i pannelli già disegnati dal
 * server, uno per scheda e nello stesso ordine. Si vede un pannello alla volta; gli altri restano nell'HTML con `hidden`
 * (niente richieste in più cambiando scheda). Schede ARIA: frecce, Home e Fine spostano la scelta.
 */
export function BracketTabs({ tabs, initial, label, mineLabel, children }: { tabs: BracketTab[]; initial: string; label: string; mineLabel: string; children: ReactNode[] }) {
  const [sel, setSel] = useState(initial);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, tabs.findIndex((t) => t.id === sel));
  const go = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    setSel(tabs[n].id);
    refs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") go(index + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(index - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(tabs.length - 1);
    else return;
    e.preventDefault();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
        {tabs.map((t, i) => {
          const on = t.id === sel;
          const tone = on ? (t.top ? "border-gold bg-gold text-ink" : "border-mint bg-mint text-ink") : t.top ? "border-gold text-gold hover:bg-gold/15" : t.mine ? "border-mint text-mint hover:bg-mint/10" : t.done ? "border-sky/60 text-pale-muted hover:bg-sky/10" : "border-sky text-pale hover:bg-sky/10";
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-controls={`${base}-panel-${t.id}`}
              aria-selected={on}
              aria-label={t.mine ? `${t.label} (${mineLabel})` : t.label}
              tabIndex={on ? 0 : -1}
              onClick={() => setSel(t.id)}
              onKeyDown={onKey}
              className={`min-w-9 rounded-lg border-2 px-2 py-1 font-mono text-xs font-bold transition ${t.top ? "px-3" : ""} ${tone}`}
            >
              {t.short}
              {t.done && !t.top ? <span aria-hidden="true"> ✓</span> : null}
              {t.mine && !on ? <span aria-hidden="true"> ●</span> : null}
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`${base}-panel-${t.id}`} aria-labelledby={`${base}-tab-${t.id}`} hidden={t.id !== sel} className="mt-4">
          {children[i]}
        </div>
      ))}
    </div>
  );
}
