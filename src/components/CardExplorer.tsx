"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type ExplorerCard = {
  slug: string;
  name: string;
  href: string;
  type: "unit" | "spell" | "token";
  typeLabel: string;
  legendary: boolean;
  sagaId: string;
  sagaLabel: string;
  mana?: number;
  power?: number;
  health?: number;
  keywords: string[];
  lastKind?: "buff" | "nerf" | "rework" | "deck";
  lastKindLabel?: string;
  removed: boolean;
  removedLabel: string;
};

type Labels = {
  search: string;
  all: string;
  type: string;
  saga: string;
  sort: string;
  sortName: string;
  sortMana: string;
  sortPower: string;
  sortHealth: string;
  results: string;
  noResults: string;
  legendary: string;
  unknownStats: string;
};

const kindStyle: Record<string, string> = {
  buff: "bg-felt text-chalk",
  nerf: "bg-crimson text-ivory",
  rework: "bg-gold text-ink",
  deck: "bg-ivory-3 text-ink",
};

export function CardExplorer({ cards, labels, sagas }: { cards: ExplorerCard[]; labels: Labels; sagas: { id: string; label: string }[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [saga, setSaga] = useState("all");
  const [sort, setSort] = useState<"name" | "mana" | "power" | "health">("mana");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = cards.filter((c) => {
      if (type !== "all" && (type === "legendary" ? !c.legendary : c.type !== type)) return false;
      if (saga !== "all" && c.sagaId !== saga) return false;
      if (needle && !c.name.toLowerCase().includes(needle) && !c.keywords.some((k) => k.toLowerCase().includes(needle))) return false;
      return true;
    });
    const num = (v?: number) => (v === undefined ? 99 : v);
    out.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "mana") return num(a.mana) - num(b.mana) || a.name.localeCompare(b.name);
      if (sort === "power") return num(b.power === undefined ? -99 : -b.power) - num(a.power === undefined ? -99 : -a.power) || a.name.localeCompare(b.name);
      return num(b.health === undefined ? -99 : -b.health) - num(a.health === undefined ? -99 : -a.health) || a.name.localeCompare(b.name);
    });
    return out;
  }, [cards, q, type, saga, sort]);

  const selectCls = "rounded-lg border border-felt-line bg-felt-deep px-3 py-2 text-sm text-chalk focus:border-gold";

  return (
    <div>
      <div className="felt-panel mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.search}</span>
          <input
            id="card-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Merlin, On Reveal…"
            className={selectCls}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.type}</span>
          <select id="card-type" value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
            <option value="all">{labels.all}</option>
            <option value="legendary">{labels.legendary}</option>
            {["unit", "spell", "token"].map((t) => {
              const sample = cards.find((c) => c.type === t);
              return sample ? (
                <option key={t} value={t}>
                  {sample.typeLabel}
                </option>
              ) : null;
            })}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.saga}</span>
          <select id="card-saga" value={saga} onChange={(e) => setSaga(e.target.value)} className={selectCls}>
            <option value="all">{labels.all}</option>
            {sagas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="kicker text-chalk-muted">{labels.sort}</span>
          <select id="card-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectCls}>
            <option value="mana">{labels.sortMana}</option>
            <option value="name">{labels.sortName}</option>
            <option value="power">{labels.sortPower}</option>
            <option value="health">{labels.sortHealth}</option>
          </select>
        </label>
      </div>

      <p className="kicker mb-4 text-chalk-muted">
        {list.length} {labels.results}
      </p>

      {list.length === 0 ? (
        <p className="card-ivory p-6 text-ink-muted">{labels.noResults}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((c) => (
            <li key={c.slug}>
              <Link href={c.href} className="card-ivory card-ivory-hover block h-full p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="kicker text-ink-muted">{c.sagaLabel}</p>
                    <h3 className="mt-1 truncate text-lg font-extrabold leading-tight text-ink">{c.name}</h3>
                  </div>
                  <span
                    className={`stat-pill shrink-0 font-bold ${c.legendary ? "bg-gold text-ink" : "bg-ink text-ivory"}`}
                    title="Mana"
                  >
                    {c.mana ?? "?"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  {c.type === "unit" ? (
                    <span className="font-mono tabular text-ink">
                      {c.power === undefined ? <em className="text-ink-muted">{labels.unknownStats}</em> : `${c.power} / ${c.health}`}
                    </span>
                  ) : (
                    <span className="text-ink-muted">{c.typeLabel}</span>
                  )}
                  {c.legendary ? <span className="stat-pill bg-gold/30 text-ink">{labels.legendary}</span> : null}
                  {c.removed ? <span className="stat-pill bg-crimson/15 text-crimson-deep">{c.removedLabel}</span> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.keywords.map((k) => (
                    <span key={k} className="rounded border border-ink/15 px-1.5 py-0.5 text-[11px] text-ink-muted">
                      {k}
                    </span>
                  ))}
                  {c.lastKind && c.lastKindLabel ? (
                    <span className={`stat-pill ml-auto text-[11px] font-semibold uppercase ${kindStyle[c.lastKind]}`}>{c.lastKindLabel}</span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
