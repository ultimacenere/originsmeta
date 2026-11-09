"use client";

import { useMemo, useState } from "react";
import { fill } from "@/lib/tournament/types";
import { groupLetter, standings, type FormatMatch, type StandingRow } from "@/lib/tournament/formats";
import type { FormatLabels } from "@/lib/tournament/formatLabels";

type Props = {
  matches: FormatMatch[];
  /** utente → nome */
  names: Record<string, string>;
  /** iscritti in gara all'avvio (con il girone): compaiono a zero finché non hanno una partita chiusa */
  players: { user_id: string; grp: number | null }[];
  dropped: string[];
  /** turni della svizzera o dei gironi giocati o in corso */
  rounds: number;
  /** quanti passano: i primi `top_cut` della svizzera o i primi `group_advance` di ogni girone (null = nessuno) */
  qualify: number | null;
  groups: boolean;
  viewer: string | null;
  locale: string;
  labels: FormatLabels;
};

const intlLocale = (l: string) => (l === "zh-cn" ? "zh-CN" : l === "pt" ? "pt-BR" : l);

/**
 * Classifica della svizzera o dei gironi, turno per turno (09/11/2026): calcolata nel browser dalle partite con
 * `standings` di formats.ts, la stessa regola di tm_standings (swiss-dry-run.mjs le confronta). Le schede scelgono il
 * turno ("Dopo il turno 3"); nei gironi una tabella per girone, il proprio girone per primo.
 */
export function FormatStandings({ matches, names, players, dropped, rounds, qualify, groups, viewer, locale, labels }: Props) {
  const fl = labels;
  // l'ultimo turno con almeno una partita chiusa
  const closedUpTo = useMemo(() => matches.filter((m) => (m.stage === "swiss" || m.stage === "group") && (m.status === "confirmed" || m.status === "bye")).reduce((mx, m) => Math.max(mx, m.round), 0), [matches]);
  const [upTo, setUpTo] = useState(closedUpTo);
  const rows = useMemo(() => standings(matches, { upTo: upTo || 0, dropped, include: players }), [matches, upTo, dropped, players]);
  const pct = useMemo(() => new Intl.NumberFormat(intlLocale(locale), { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);
  if (!closedUpTo) return <p className="mt-2 text-sm text-pale-muted">{fl.standingsEmpty}</p>;

  // chi passa: i primi in gara (svizzera: in tutta la classifica; gironi: nel proprio girone)
  const qualified = new Set<string>();
  if (qualify) {
    const seen = new Map<number | null, number>();
    for (const r of rows) {
      if (r.dropped || !r.played) continue;
      const k = (seen.get(r.grp) ?? 0) + 1;
      seen.set(r.grp, k);
      if (k <= qualify) qualified.add(r.user_id);
    }
  }
  const byGroup = new Map<number | null, StandingRow[]>();
  for (const r of rows) byGroup.set(r.grp, [...(byGroup.get(r.grp) ?? []), r]);
  const myGroup = viewer ? rows.find((r) => r.user_id === viewer)?.grp : undefined;
  const order = [...byGroup.keys()].sort((a, b) => (a === myGroup ? -1 : b === myGroup ? 1 : (a ?? -1) - (b ?? -1)));

  return (
    <div className="mt-3">
      {rounds > 1 ? (
        <div className="flex flex-wrap gap-1" role="tablist" aria-label={fl.standingsTitle}>
          {Array.from({ length: closedUpTo }, (_, i) => i + 1).map((r) => (
            <button key={r} type="button" role="tab" aria-selected={r === upTo} onClick={() => setUpTo(r)} className={`btn !px-2 !py-1 text-[11px] ${r === upTo ? "btn-primary" : "btn-ink"}`}>
              {fill(fl.standingsAfter, { n: r })}
            </button>
          ))}
        </div>
      ) : null}
      <div className={`mt-3 grid gap-4 ${groups ? "lg:grid-cols-2" : ""}`}>
        {order.map((g) => (
          <div key={String(g)} className="min-w-0">
            {groups ? (
              <h3 className="kicker mb-2 text-mint">
                {fill(fl.group, { letter: groupLetter(g ?? 0) })}
                {g === myGroup ? <span className="ml-2 text-pale-muted">· {fl.yourGroup}</span> : null}
              </h3>
            ) : null}
            <div className="overflow-x-auto rounded-lg border-2 border-sky">
              <table className="w-full min-w-[22rem] text-left text-xs sm:text-sm">
                <thead className="bg-night-3 font-mono text-[10px] uppercase text-pale-muted sm:text-[11px]">
                  <tr>
                    <th scope="col" className="px-2 py-1.5">{fl.colRank}</th>
                    <th scope="col" className="px-2 py-1.5">{fl.colPlayer}</th>
                    <th scope="col" className="px-2 py-1.5 text-right">{fl.colPoints}</th>
                    <th scope="col" className="px-2 py-1.5 text-right">{fl.colRecord}</th>
                    <th scope="col" className="px-2 py-1.5 text-right">{fl.colOmw}</th>
                    <th scope="col" className="px-2 py-1.5 text-right">{fl.colGw}</th>
                    <th scope="col" className="hidden px-2 py-1.5 text-right sm:table-cell">{fl.colOgw}</th>
                  </tr>
                </thead>
                <tbody>
                  {(byGroup.get(g) ?? []).map((r) => {
                    const mine = r.user_id === viewer;
                    const q = qualified.has(r.user_id);
                    return (
                      <tr key={r.user_id} className={`border-t border-sky/30 ${mine ? "bg-mint/10" : ""} ${q ? "shadow-[inset_3px_0_0_var(--color-mint)]" : ""}`}>
                        <td className="px-2 py-1.5 font-mono text-pale-muted">{r.rank}</td>
                        <td className={`max-w-[10rem] truncate px-2 py-1.5 ${r.dropped ? "text-pale-muted line-through" : "text-pale"}`}>
                          {names[r.user_id] ?? "?"}
                          {r.dropped ? <span className="ml-1 font-mono text-[10px] no-underline">({fl.dropped})</span> : null}
                          {q ? <span className="sr-only"> ({fl.qualified})</span> : null}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-chalk">{r.points}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-pale">
                          {r.wins}–{r.losses}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-pale">{r.played ? pct.format(r.omw) : "–"}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-pale">{r.played ? pct.format(r.gw) : "–"}</td>
                        <td className="hidden px-2 py-1.5 text-right font-mono text-pale sm:table-cell">{r.played ? pct.format(r.ogw) : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-pale-muted">{fl.standingsHint}</p>
    </div>
  );
}
