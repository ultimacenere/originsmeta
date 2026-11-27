"use client";

import { useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { Interval } from "@/components/analytics/parts";
import type { Axis } from "@/lib/tracker/snapshot";

/*
  «In onda», la classifica da diretta dei mazzi dell'iscritto: righe che si aprono al tocco (le 12 carte, il codice del
  gioco, la scheda del mazzo) e tre ordini. Tutti i numeri arrivano pronti dal server.
*/

export type StandCard = { slug: string; name: string; src: string | null; href: string };
export type StandRow = {
  id: string;
  name: string;
  href: string;
  legendary: { name: string; src: string | null } | null;
  archetype: { id: string; label: string };
  games: number;
  lo: number;
  hi: number;
  r: number;
  wrText: string;
  loText: string;
  gamesText: string;
  votes: number;
  avgText: string | null;
  inForm: boolean;
  code: string | null;
  cards: StandCard[];
  patchText: string | null;
};

type SortKey = "prudent" | "games" | "votes";
const SORTS: { id: SortKey; label: string }[] = [
  { id: "prudent", label: "Win rate prudente" },
  { id: "games", label: "Partite" },
  { id: "votes", label: "Voti" },
];

const order = (key: SortKey) => (a: StandRow, b: StandRow) =>
  key === "games"
    ? b.games - a.games || b.lo - a.lo
    : key === "votes"
      ? b.votes - a.votes || b.lo - a.lo
      : b.lo - a.lo || b.games - a.games || b.r - a.r;

export function OndaStandings({ rows, axis }: { rows: StandRow[]; axis: Axis }) {
  const [sort, setSort] = useState<SortKey>("prudent");
  const [open, setOpen] = useState<string | null>(null);
  const list = [...rows].sort(order(sort));
  return (
    <div>
      {rows.length > 1 ? (
        <div className="onda-sorts" role="group" aria-label="Ordina i mazzi">
          {SORTS.map((s) => (
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
                  {d.legendary?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.legendary.src} alt="" width={44} height={62} loading="lazy" decoding="async" />
                  ) : (
                    <span className="onda-row-leg-none" aria-hidden="true" />
                  )}
                </span>
                <span className="onda-row-name">
                  <span className="onda-row-title">{d.name}</span>
                  <span className="onda-row-sub">
                    <ArchetypeIcon id={d.archetype.id} size="xs" />
                    <span className="truncate">{d.archetype.label}</span>
                    {d.legendary ? <span className="onda-row-legname truncate">· {d.legendary.name}</span> : null}
                  </span>
                </span>
                <span className="onda-row-stat">
                  <span className="onda-row-nums">
                    <b>{d.wrText}</b>
                    <span>{d.gamesText}</span>
                    {d.inForm ? (
                      <span className="an-plate is-mint onda-form">
                        <span>In forma</span>
                      </span>
                    ) : null}
                  </span>
                  <Interval lo={d.lo} hi={d.hi} r={d.r} axis={axis} label={`Win rate ${d.wrText}, prudente ${d.loText}, su ${d.gamesText}`} />
                </span>
                <span className="onda-row-mark" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <div id={panel} hidden={!isOpen} className="onda-row-more">
                <ul className="onda-row-cards" aria-label={`Le 12 carte di ${d.name}`}>
                  {d.cards.map((c) => (
                    <li key={c.slug}>
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
                <div className="onda-row-actions">
                  {d.code ? <CopyButton text={d.code} label="Copia codice del gioco" copied="Copiato" className="btn btn-primary onda-tap" ariaLabel={`Copia il codice del gioco di ${d.name}`} /> : null}
                  <Link href={d.href} prefetch={false} className="btn btn-ink onda-tap">
                    Apri il mazzo
                  </Link>
                  <span className="onda-row-facts">
                    {d.avgText ? (
                      <span>
                        <span className="legendary-star" aria-hidden="true">
                          ★
                        </span>{" "}
                        {d.avgText} · {d.votes === 1 ? "1 voto" : `${d.votes} voti`}
                      </span>
                    ) : null}
                    {d.patchText ? <span>Carte della patch {d.patchText}</span> : null}
                    <span>Prudente {d.loText}</span>
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
