"use client";

import { useRef, useState, type ReactNode } from "react";

const FILTERS = [
  { id: "all", label: "Tutto" },
  { id: "deck", label: "Mazzi" },
  { id: "balance", label: "Bilanciamento" },
  { id: "achievement", label: "Traguardi" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

/** Filtro a pastiglie sopra i capitoli: nasconde con il CSS (data-filter) quello che non c'entra e apre le tendine. */
export function PatchFilter({ children, counts }: { children: ReactNode; counts: Record<FilterId, number> }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const root = useRef<HTMLDivElement>(null);
  const pick = (id: FilterId) => {
    setFilter(id);
    if (id !== "all") root.current?.querySelectorAll("details").forEach((d) => (d.open = true));
  };
  return (
    <div ref={root} data-filter={filter} className="patch-filter-root">
      <div role="group" aria-label="Mostra" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.filter((f) => f.id === "all" || counts[f.id] > 0).map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => pick(f.id)}
            className={`min-h-11 rounded-full px-4 font-display text-sm font-bold transition-colors ${filter === f.id ? "bg-mint text-ink" : "bg-night-2 text-chalk hover:text-mint"}`}
          >
            {f.label}
            {f.id !== "all" ? <span className="ml-1.5 font-mono opacity-80">{counts[f.id]}</span> : null}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
