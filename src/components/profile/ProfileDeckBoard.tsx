"use client";

import { useState } from "react";
import Link from "@/components/IntentLink";
import { CopyButton } from "@/components/CopyButton";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { Interval } from "@/components/analytics/parts";
import type { Axis } from "@/lib/tracker/snapshot";

/*
  I mazzi di un iscritto sulla pagina /u/<nome> («In onda», 27/11/2026): una classifica da diretta, con il win rate della
  lista esatta dal Tracker quando ci sono partite, e righe che si aprono al tocco (le carte, il codice del gioco, la scheda
  del mazzo). Tutti i mazzi pubblicati ci sono, anche quelli senza partite. Testi e numeri arrivano pronti dal server.
*/

export type BoardCard = { slug: string; name: string; src: string | null; href: string };
export type BoardStats = { games: number; lo: number; hi: number; r: number; wrText: string; gamesText: string; inForm: boolean; aria: string; prudentText: string };
export type BoardRow = {
  id: string;
  name: string;
  href: string;
  thumb: { src: string; art: boolean } | null;
  legendaryName: string | null;
  archetype: { id: string; label: string };
  theory: string | null;
  stats: BoardStats | null;
  votes: number;
  votesText: string | null;
  recentAt: number;
  dateText: string;
  patchText: string | null;
  code: string | null;
  copyAria: string;
  cardsLabel: string;
  cards: BoardCard[];
};
export type BoardLabels = {
  sortLabel: string;
  sortPrudent: string;
  sortGames: string;
  sortVotes: string;
  sortRecent: string;
  noGames: string;
  inForm: string;
  copy: string;
  copied: string;
  open: string;
};

type SortKey = "prudent" | "games" | "votes" | "recent";

const order = (key: SortKey) => (a: BoardRow, b: BoardRow) => {
  if (key === "recent") return b.recentAt - a.recentAt;
  if (key === "votes") return b.votes - a.votes || b.recentAt - a.recentAt;
  // win rate prudente o partite: prima i mazzi con partite, poi gli altri dal più recente
  if (a.stats && b.stats) {
    return key === "games" ? b.stats.games - a.stats.games || b.stats.lo - a.stats.lo : b.stats.lo - a.stats.lo || b.stats.games - a.stats.games || b.stats.r - a.stats.r;
  }
  if (a.stats || b.stats) return a.stats ? -1 : 1;
  return b.recentAt - a.recentAt;
};

export function ProfileDeckBoard({ rows, axis, labels }: { rows: BoardRow[]; axis: Axis; labels: BoardLabels }) {
  const played = rows.some((r) => r.stats);
  const sorts: { id: SortKey; label: string }[] = [
    ...(played
      ? [
          { id: "prudent" as const, label: labels.sortPrudent },
          { id: "games" as const, label: labels.sortGames },
        ]
      : []),
    { id: "recent", label: labels.sortRecent },
    ...(rows.some((r) => r.votes > 0) ? [{ id: "votes" as const, label: labels.sortVotes }] : []),
  ];
  const [sort, setSort] = useState<SortKey>(played ? "prudent" : "recent");
  const [open, setOpen] = useState<string | null>(null);
  const list = [...rows].sort(order(sort));
  return (
    <div>
      {rows.length > 1 && sorts.length > 1 ? (
        <div className="onda-sorts" role="group" aria-label={labels.sortLabel}>
          {sorts.map((s) => (
            <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)} className="onda-sort">
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
      <ol className="an-panel onda-board">
        {list.map((d, i) => {
          const isOpen = open === d.id;
          const panel = `onda-row-${d.id}`;
          return (
            <li key={d.id} className={`onda-row${isOpen ? " is-open" : ""}`}>
              <button type="button" className="onda-row-btn" aria-expanded={isOpen} aria-controls={panel} onClick={() => setOpen(isOpen ? null : d.id)}>
                <span className="onda-pos" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="onda-row-leg">
                  {d.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.thumb.src} alt="" width={44} height={62} loading="lazy" decoding="async" className={d.thumb.art ? "onda-row-art" : undefined} />
                  ) : (
                    <span className="onda-row-leg-none" aria-hidden="true" />
                  )}
                </span>
                <span className="onda-row-name">
                  <span className="onda-row-title">{d.name}</span>
                  <span className="onda-row-sub">
                    <ArchetypeIcon id={d.archetype.id} size="xs" />
                    <span className="truncate">{d.archetype.label}</span>
                    {d.legendaryName ? <span className="onda-row-legname truncate">· {d.legendaryName}</span> : null}
                    {d.theory ? <span className="onda-row-theory">{d.theory}</span> : null}
                  </span>
                </span>
                <span className="onda-row-stat">
                  {d.stats ? (
                    <>
                      <span className="onda-row-nums">
                        <b>{d.stats.wrText}</b>
                        <span>{d.stats.gamesText}</span>
                        {d.stats.inForm ? (
                          <span className="an-plate is-mint onda-form">
                            <span>{labels.inForm}</span>
                          </span>
                        ) : null}
                      </span>
                      <Interval lo={d.stats.lo} hi={d.stats.hi} r={d.stats.r} axis={axis} label={d.stats.aria} />
                    </>
                  ) : (
                    <span className="onda-row-idle">{labels.noGames}</span>
                  )}
                </span>
                <span className="onda-row-mark" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <div id={panel} hidden={!isOpen} className="onda-row-more">
                {d.cards.length ? (
                  <ul className="onda-row-cards" aria-label={d.cardsLabel}>
                    {d.cards.map((c, k) => (
                      <li key={`${c.slug}-${k}`}>
                        <Link href={c.href} prefetch={false} title={c.name}>
                          {c.src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.src} alt={c.name} width={80} height={112} loading="lazy" decoding="async" />
                          ) : (
                            <span className="an-card-fallback">{c.name}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="onda-row-actions">
                  {d.code ? (
                    <CopyButton
                      text={d.code}
                      label={labels.copy}
                      copied={labels.copied}
                      className="btn btn-primary onda-tap"
                      ariaLabel={d.copyAria}
                      event={{ name: "game_code_copy", params: { placement: "profile" } }}
                    />
                  ) : null}
                  <Link href={d.href} prefetch={false} className="btn btn-ink onda-tap">
                    {labels.open}
                  </Link>
                  <span className="onda-row-facts">
                    {d.votesText ? (
                      <span>
                        <span className="legendary-star" aria-hidden="true">
                          ★
                        </span>{" "}
                        {d.votesText}
                      </span>
                    ) : null}
                    <span>{d.dateText}</span>
                    {d.patchText ? <span>{d.patchText}</span> : null}
                    {d.stats ? <span>{d.stats.prudentText}</span> : null}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
