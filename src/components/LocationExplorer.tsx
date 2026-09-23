"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * Elenco esplorabile dei Luoghi (23/09/2026, richiesta di Pierluigi: "i competitor hanno inserito tutte le
 * locations, potremmo creare una pagina dedicata magari più fruibile della loro ed esplorabile").
 *
 * Più fruibile vuol dire tre cose che l'elenco del competitor non ha: si cerca per nome e per effetto, si filtra
 * per famiglia di effetti (danni, mana, movimento…) e ogni luogo che cita una carta la collega alla sua scheda.
 * Tutto nel browser su dati già presenti nella pagina: nessuna chiamata, e la pagina resta statica.
 */

export type ExplorerLocation = {
  slug: string;
  name: string;
  effect: string;
  tags: string[];
  /** carte citate dall'effetto, già con nome e indirizzo nella lingua della pagina */
  cards: { slug: string; name: string; href: string }[];
};

export type LocationLabels = {
  search: string;
  searchPlaceholder: string;
  all: string;
  results: string;
  noResults: string;
  /** "Carte collegate" sotto l'effetto */
  related: string;
  clear: string;
};

export function LocationExplorer({ locations, tags, labels }: { locations: ExplorerLocation[]; tags: { id: string; label: string; count: number }[]; labels: LocationLabels }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return locations.filter((l) => {
      if (tag !== "all" && !l.tags.includes(tag)) return false;
      if (!needle) return true;
      // si cerca nel nome e nell'effetto: chi cerca "mana" vuole i luoghi che parlano di mana, non solo quelli che si chiamano così
      return l.name.toLowerCase().includes(needle) || l.effect.toLowerCase().includes(needle);
    });
  }, [locations, q, tag]);

  const chip = (active: boolean) =>
    `btn btn-choice px-3 py-1.5 text-xs ${active ? "is-on" : ""}`;

  return (
    <div>
      <div className="felt-panel mb-6 flex flex-wrap items-center gap-3 p-4">
        <label className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.search}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.searchPlaceholder}
            autoComplete="off"
            className="w-full rounded-lg border border-sky bg-night px-3 py-2 text-sm text-chalk placeholder:text-chalk-muted"
          />
        </label>
        {q || tag !== "all" ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setTag("all");
            }}
            className="btn btn-ghost self-end text-xs"
          >
            {labels.clear}
          </button>
        ) : null}
      </div>

      {/* Famiglie di effetti: una riga di chip, con quanti luoghi ci sono in ognuna */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTag("all")} aria-pressed={tag === "all"} className={chip(tag === "all")}>
          {labels.all} <span className="font-mono font-normal">{locations.length}</span>
        </button>
        {tags.map((t) => (
          <button key={t.id} type="button" onClick={() => setTag(t.id)} aria-pressed={tag === t.id} className={chip(tag === t.id)}>
            {t.label} <span className="font-mono font-normal">{t.count}</span>
          </button>
        ))}
      </div>

      <p className="kicker mb-4 text-chalk-muted" aria-live="polite">
        {list.length} {labels.results}
      </p>

      {list.length === 0 ? (
        <p className="card-night p-6 text-pale-muted">{labels.noResults}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((l) => (
            <li key={l.slug} id={l.slug} className="card-night flex scroll-mt-24 flex-col p-5">
              <h2 className="t-item leading-tight">{l.name}</h2>
              <p className="mt-2 flex-1 text-pale">{l.effect}</p>
              <p className="mt-3 flex flex-wrap gap-1.5">
                {l.tags.map((t) => (
                  <span key={t} className="stat-pill bg-night-3 text-[11px] text-pale">
                    {tags.find((x) => x.id === t)?.label ?? t}
                  </span>
                ))}
              </p>
              {l.cards.length ? (
                <p className="mt-3 text-xs text-pale-muted">
                  {labels.related}:{" "}
                  {l.cards.map((c, i) => (
                    <span key={c.slug}>
                      {i > 0 ? ", " : ""}
                      <Link href={c.href} className="link-mint">
                        {c.name}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
