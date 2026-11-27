"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
  Le 12 carte del mazzo dei traguardi: filtro (Tutte · Prese · Da prendere) e dettaglio in un <dialog> nativo, foglio dal
  basso sul telefono. Le carte e i dettagli li disegna il server: qui arrivano già pronti.
*/

export type TrophyItem = { id: string; taken: boolean; label: string; face: ReactNode; under: ReactNode; detail: ReactNode };

type Filter = "all" | "taken" | "missing";

export function TrophyGrid({ items }: { items: TrophyItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const taken = items.filter((i) => i.taken).length;
  const filters: { id: Filter; label: string; n: number }[] = [
    { id: "all", label: "Tutte", n: items.length },
    { id: "taken", label: "Prese", n: taken },
    { id: "missing", label: "Da prendere", n: items.length - taken },
  ];
  const shown = items.filter((i) => filter === "all" || (filter === "taken" ? i.taken : !i.taken));
  const current = items.find((i) => i.id === open) ?? null;

  return (
    <>
      <div role="group" aria-label="Mostra le carte" className="ct-filter mt-4">
        {filters.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className="ct-filter-btn">
            {f.label} <span className="tabular-nums">{f.n}</span>
          </button>
        ))}
      </div>

      {shown.length ? (
        <ul className="ct-grid mt-4">
          {shown.map((i) => (
            <li key={i.id} className="min-w-0">
              <button
                type="button"
                className={`ct-slot${i.taken ? "" : " is-off"}`}
                aria-haspopup="dialog"
                aria-label={i.label}
                onClick={(e) => {
                  opener.current = e.currentTarget;
                  setOpen(i.id);
                }}
              >
                <span aria-hidden="true" className="ct-slot-face">
                  {i.face}
                </span>
                {i.under}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-pale-muted">{filter === "taken" ? "Nessuna carta presa per ora." : "Le hai prese tutte."}</p>
      )}

      <dialog
        ref={dialog}
        className="ct-dialog card-night"
        aria-label={current?.label ?? "Carta"}
        onClose={() => {
          setOpen(null);
          opener.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(null);
        }}
      >
        {current ? (
          <div className="ct-dialog-body">
            {current.detail}
            <button type="button" className="btn btn-ink mt-5 min-h-11 w-full justify-center sm:w-auto" onClick={() => setOpen(null)}>
              Chiudi
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
