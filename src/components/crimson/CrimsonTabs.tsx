"use client";

import { useEffect, useState, type ReactNode } from "react";

/*
  Selettore delle qualificazioni della pagina /analytics/crimson-cup (20/10/2026): una scheda per qualificazione, nell'ordine
  del calendario. Le schede con i numeri aprono il loro pannello (tutti già nell'HTML, gli altri `hidden`: senza
  JavaScript si vede l'ultima qualificazione); quelle senza numeri sono ferme e dicono la data. L'hash (#amer-1) apre la
  qualificazione giusta da un link.
*/

export type CrimsonTab = { id: string; name: string; sub: string; ready: boolean };

export function CrimsonTabs({ tabs, initial, label, panels }: { tabs: CrimsonTab[]; initial: string; label: string; panels: { id: string; node: ReactNode }[] }) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.ready && t.id === id)) setOn(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  return (
    <>
      <div className="an-wrap">
        <div role="tablist" aria-label={label} className="cc-picker">
          {tabs.map((t) =>
            t.ready ? (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`cc-tab-${t.id}`}
                aria-selected={on === t.id}
                aria-controls={`cc-panel-${t.id}`}
                className={`cc-pill${on === t.id ? " is-on" : ""}`}
                onClick={() => {
                  setOn(t.id);
                  history.replaceState(null, "", `#${t.id}`);
                }}
              >
                <b>{t.name}</b>
                <small>{t.sub}</small>
              </button>
            ) : (
              <span key={t.id} className="cc-pill is-soon" aria-disabled="true">
                <b>{t.name}</b>
                <small>{t.sub}</small>
              </span>
            ),
          )}
        </div>
      </div>
      {panels.map((p) => (
        <div key={p.id} id={`cc-panel-${p.id}`} role="tabpanel" aria-labelledby={`cc-tab-${p.id}`} hidden={p.id !== on}>
          {p.node}
        </div>
      ))}
    </>
  );
}
