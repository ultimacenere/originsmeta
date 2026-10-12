"use client";

import { useState } from "react";
import Link from "next/link";
import { Delta, Star, type DeltaInfo } from "./parts";

/*
  Tabella di tutte le carte di /analytics (12/10/2026), ordinabile toccando le intestazioni. Il server passa righe già
  pronte (testi formattati nella lingua della pagina e valori numerici per l'ordine): il client non formatta numeri, così
  l'HTML del server e quello del browser coincidono. Ordine iniziale: carte più presenti nei mazzi.
*/
export type CardStatCell = { pct: string; games: string; r: number; n: number };
export type CardStatRow = {
  key: string;
  name: string;
  href: string;
  legendary: boolean;
  mana: number | null;
  deck: CardStatCell | null;
  played: CardStatCell | null;
  swing: (DeltaInfo & { v: number }) | null;
  turn: { text: string; v: number } | null;
};
export type CardStatLabels = {
  caption: string;
  cols: { card: string; inDeck: string; played: string; swing: string; avgRound: string };
  cost: string;
  legendary: string;
  pt: string;
};

/** confronto semplice dei nomi (inglesi): uguale sul server e nel browser, qualunque sia la lingua del sistema */
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

type SortKey = "deckGames" | "name" | "deck" | "played" | "swing" | "turn";

function value(row: CardStatRow, key: SortKey): number | string | null {
  switch (key) {
    case "deckGames":
      return row.deck?.n ?? null;
    case "name":
      return row.name;
    case "deck":
      return row.deck?.r ?? null;
    case "played":
      return row.played?.r ?? null;
    case "swing":
      return row.swing?.v ?? null;
    case "turn":
      return row.turn?.v ?? null;
  }
}

export function CardStatsTable({ rows, labels }: { rows: CardStatRow[]; labels: CardStatLabels }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "deckGames", dir: -1 });
  const sorted = [...rows].sort((a, b) => {
    const va = value(a, sort.key);
    const vb = value(b, sort.key);
    // le celle vuote vanno sempre in fondo
    if (va === null || vb === null) return va === vb ? 0 : va === null ? 1 : -1;
    const c = typeof va === "string" ? cmp(va, String(vb)) : va - (vb as number);
    return c * sort.dir || cmp(a.name, b.name);
  });
  const cols: [SortKey, string][] = [
    ["name", labels.cols.card],
    ["deck", labels.cols.inDeck],
    ["played", labels.cols.played],
    ["swing", labels.cols.swing],
    ["turn", labels.cols.avgRound],
  ];
  const click = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));
  const cell = (c: CardStatCell | null) =>
    c ? (
      <>
        <b>{c.pct}</b> <span className="an-muted">{c.games}</span>
      </>
    ) : (
      <span className="an-muted">—</span>
    );

  return (
    <table className="an-table an-sticky-col">
      <caption>{labels.caption}</caption>
      <thead>
        <tr>
          {cols.map(([key, label]) => (
            <th key={key} scope="col" aria-sort={sort.key === key ? (sort.dir === -1 ? "descending" : "ascending") : undefined}>
              <button type="button" className="an-sort" onClick={() => click(key)}>
                {label}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.key}>
            <td>
              {r.mana !== null ? (
                <span className="an-mana" title={labels.cost.replace("{n}", String(r.mana))}>
                  <span aria-hidden="true">{r.mana}</span>
                  <span className="sr-only">{labels.cost.replace("{n}", String(r.mana))}</span>
                </span>
              ) : null}
              <Link href={r.href} prefetch={false} className="an-table-link">
                {r.legendary ? <Star label={labels.legendary} /> : null}
                {r.name}
              </Link>
            </td>
            <td className="is-num">{cell(r.deck)}</td>
            <td className="is-num">{cell(r.played)}</td>
            <td className="is-num">{r.swing ? <Delta d={r.swing} pt={labels.pt} /> : <span className="an-muted">—</span>}</td>
            <td className="is-num">{r.turn ? r.turn.text : <span className="an-muted">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
