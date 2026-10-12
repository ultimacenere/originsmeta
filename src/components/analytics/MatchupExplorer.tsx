"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { CellKind, Dir, Verdict } from "@/lib/tracker/snapshot";
import { CardArt, Delta, Interval, Star, type DeltaInfo } from "./parts";

/*
  Gli scontri di /analytics (design "Meta Snapshot v2.0", 12/10/2026; richieste di Pierluigi nella nota "winrate 2.0"):
  - filtro a carte piccole intere (radiogroup): la Leggendaria scelta mostra "Vince contro / Soffre contro", accende la
    sua riga nella tabella e porta nel pannello il suo scontro più netto;
  - tabella degli scontri sul modello del Data Reaper: quadrati piccoli col solo numero, solo nomi (le carte stanno nel
    pannello e nel filtro), sigle di tre lettere sotto i 760 px con la chiave sotto la tabella;
  - pannello a destra da 1024 px (sotto, più stretto): le due carte intere e tutte le statistiche dello scontro. Si
    aggiorna al passaggio del mouse (anteprima), col fuoco da tastiera (frecce, Inizio, Fine) e col tocco o il clic, che
    fissano lo scontro.
  Il server passa tutto già calcolato e formattato (snapshot.ts): il client compone solo le frasi dai modelli. Lo stato
  iniziale (lo scontro più sbilanciato) è lo stesso del server, quindi l'HTML ha già il pannello pieno.
*/

export type MxLeg = {
  key: string;
  name: string;
  short: string;
  code: string;
  href: string;
  src?: string;
  thumb?: string;
  /** win rate della Leggendaria nella patch ("57,1%"), se ha numeri suoi */
  wr: string | null;
  pickAria: string;
  /** ha almeno uno scontro dal proprio lato (si può scegliere nel filtro) */
  hasRow: boolean;
};
export type MxCell = {
  kind: CellKind;
  games: number;
  /** partite col separatore delle migliaia della lingua */
  gamesNum: string;
  gamesText: string;
  /** il numero nel quadrato: "57", "—" (specchio), "·" (nessuna partita) */
  val: string;
  tint: number;
  dir: Dir;
  pct: string;
  pctNum: string;
  pct0: string;
  lo: string;
  hi: string;
  wl: string;
  delta: DeltaInfo;
  verdict: Verdict;
  sure: boolean;
  tenth: number;
  r: number;
  loN: number;
  hiN: number;
};
export type MxLabels = {
  pickGroup: string;
  pickHint: string;
  vsTitle: string;
  beats: string;
  suffers: string;
  noneBeats: string;
  noneSuffers: string;
  sure: string;
  unsure: string;
  small: string;
  vsAria: string;
  tableTitle: string;
  tableLead: string;
  cornerRow: string;
  cornerCol: string;
  caption: string;
  legendUp: string;
  legendDown: string;
  legendThin: string;
  legendNone: string;
  codes: string;
  cell: string;
  cellSmall: string;
  cellMirror: string;
  cellNone: string;
  rowPick: string;
  panelAria: string;
  panelPreview: string;
  panelTop: string;
  panelPick: string;
  panelChosen: string;
  mirror: string;
  none: string;
  interval: string;
  verdicts: Record<Verdict, { title: string; text: string }>;
  often: string;
  stats: { games: string; wl: string; interval: string; delta: string; back: string };
  backText: string;
  backNone: string;
  vs: string;
  pt: string;
  ciAria: string;
  legendary: string;
  unit: string;
};

const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));
const FULL = { min: 0, max: 1 };

type Pair = { a: number; b: number };
type Why = "top" | "pick" | "chosen";

export function MatchupExplorer({
  legs,
  grid,
  vs,
  rowNotable,
  initial,
  labels: t,
}: {
  legs: MxLeg[];
  grid: MxCell[][];
  /** per riga: avversarie (indici) per "Vince contro" e "Soffre contro", e la riga sotto il titolo */
  vs: { best: number[]; worst: number[]; sub: string }[];
  /** per riga: lo scontro più netto (indice della colonna) o -1 */
  rowNotable: number[];
  initial: Pair;
  labels: MxLabels;
}) {
  const [picked, setPicked] = useState(initial.a);
  const [locked, setLocked] = useState<Pair & { why: Why }>({ ...initial, why: "top" });
  const [preview, setPreview] = useState<Pair | null>(null);
  const [roving, setRoving] = useState<Pair>(initial);
  const tableRef = useRef<HTMLTableElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const picksRef = useRef<HTMLDivElement>(null);

  const cur = preview ?? locked;
  const n = legs.length;

  const lock = (a: number, b: number, why: Why) => {
    setLocked({ a, b, why });
    setPreview(null);
    setRoving({ a, b });
  };
  const pick = (a: number) => {
    setPicked(a);
    const b = rowNotable[a];
    if (b >= 0) lock(a, b, "pick");
  };

  const cellLabel = (i: number, j: number) => {
    const c = grid[i][j];
    const a = legs[i].name;
    const b = legs[j].name;
    if (c.kind === "mirror") return fmt(t.cellMirror, { a, games: c.gamesText });
    if (c.kind === "none") return fmt(t.cellNone, { a, b });
    return fmt(t.cell, { a, b, p: c.pct, games: c.gamesText }) + (c.kind === "thin" ? t.cellSmall : "");
  };

  /* ---------- filtro a carte ---------- */
  const pickable = legs.map((l, i) => ({ l, i })).filter((x) => x.l.hasRow);
  const onPicksKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const pos = pickable.findIndex((x) => x.i === picked);
    const next = { ArrowRight: pos + 1, ArrowDown: pos + 1, ArrowLeft: pos - 1, ArrowUp: pos - 1, Home: 0, End: pickable.length - 1 }[e.key];
    if (next === undefined || pos < 0) return;
    e.preventDefault();
    const k = (next + pickable.length) % pickable.length;
    pick(pickable[k].i);
    const btn = picksRef.current?.querySelector<HTMLButtonElement>(`[data-leg="${pickable[k].i}"]`);
    btn?.focus();
    btn?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  /* ---------- tabella: tastiera ---------- */
  const onCellKey = (e: KeyboardEvent<HTMLButtonElement>, i: number, j: number) => {
    const mv: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    let [ni, nj] = [i, j];
    if (e.key === "Home") nj = 0;
    else if (e.key === "End") nj = n - 1;
    else if (mv[e.key]) {
      ni = Math.max(0, Math.min(n - 1, i + mv[e.key][0]));
      nj = Math.max(0, Math.min(n - 1, j + mv[e.key][1]));
    } else return;
    e.preventDefault();
    setRoving({ a: ni, b: nj });
    tableRef.current?.querySelector<HTMLButtonElement>(`[data-i="${ni}"][data-j="${nj}"]`)?.focus();
  };

  /* ---------- pannello ---------- */
  const m = grid[cur.a][cur.b];
  const back = grid[cur.b][cur.a];
  const A = legs[cur.a];
  const B = legs[cur.b];
  const kicker = preview ? t.panelPreview : locked.why === "top" ? t.panelTop : locked.why === "pick" ? fmt(t.panelPick, { name: A.name }) : t.panelChosen;
  const verdict = t.verdicts[m.verdict];

  const vsItem = (b: number) => {
    const c = grid[picked][b];
    const L = legs[b];
    const verdictWord = c.sure ? t.sure : t.unsure;
    const on = locked.a === picked && locked.b === b;
    return (
      <li key={b}>
        <button
          type="button"
          className="an-vs-item"
          aria-pressed={on}
          aria-label={fmt(t.vsAria, { a: legs[picked].name, b: L.name, p: c.pct, games: c.gamesText, verdict: verdictWord })}
          onClick={() => {
            lock(picked, b, "chosen");
            panelRef.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          }}
        >
          <CardArt src={L.src} thumb={L.thumb} name={L.name} width={40} />
          <span className="min-w-0">
            <span className="an-vs-name">
              <span className="legendary-star" aria-hidden="true">
                ★
              </span>
              {L.name}
            </span>
            <span className="an-vs-meta">
              {c.gamesText} · {c.wl}
              {c.kind === "thin" ? ` · ${t.small}` : ""}
            </span>
            <Interval lo={c.loN} hi={c.hiN} r={c.r} axis={FULL} mini label={fmt(t.ciAria, { lo: c.lo, hi: c.hi })} />
          </span>
          <span className="an-vs-pc">
            {c.pct0}
            <small className={`an-delta is-${c.r > 0.5 ? "up" : "down"}`}>
              {c.r > 0.5 ? "▲" : "▼"} {verdictWord}
            </small>
          </span>
        </button>
      </li>
    );
  };

  const v = vs[picked];
  return (
    <>
      <div className="an-picks has-pick" role="radiogroup" aria-label={t.pickGroup} ref={picksRef} onKeyDown={onPicksKey}>
        {pickable.map(({ l, i }) => (
          <button
            key={l.key}
            type="button"
            role="radio"
            className="an-pick"
            data-leg={i}
            aria-checked={picked === i}
            tabIndex={picked === i ? 0 : -1}
            aria-label={l.pickAria}
            onClick={() => pick(i)}
          >
            <span className="an-pick-art">
              <CardArt src={l.src} thumb={l.thumb} name={l.name} width={78} />
            </span>
            <span className="an-pick-name" aria-hidden="true">
              <span className="legendary-star">★</span>
              {l.short}
            </span>
            {l.wr ? (
              <span className="an-pick-wr" aria-hidden="true">
                {l.wr}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <p className="an-hint">{t.pickHint}</p>

      <div className="an-vs-head">
        <h3 className="an-h3">
          <Star label={t.legendary} />
          {fmt(t.vsTitle, { name: legs[picked].name })}
        </h3>
        <p>{v.sub}</p>
      </div>
      <div className="an-vs-cols">
        <div className="an-vs-col is-up">
          <h4>▲ {t.beats}</h4>
          {v.best.length ? <ul className="an-vs-list">{v.best.map(vsItem)}</ul> : <p className="an-vs-none">{t.noneBeats}</p>}
        </div>
        <div className="an-vs-col is-down">
          <h4>▼ {t.suffers}</h4>
          {v.worst.length ? <ul className="an-vs-list">{v.worst.map(vsItem)}</ul> : <p className="an-vs-none">{t.noneSuffers}</p>}
        </div>
      </div>

      <div className="an-block">
        <h3 className="an-sub-h">{t.tableTitle}</h3>
        <p className="an-lead">{t.tableLead}</p>
        <div className="an-mx-layout">
          <div className="an-mx-wrap">
            <table className="an-mx" ref={tableRef} onPointerLeave={() => setPreview(null)}>
              <caption className="sr-only">{t.caption}</caption>
              <thead>
                <tr>
                  <td className="an-mx-corner" aria-hidden="true">
                    {t.cornerRow}
                    <br />
                    {t.cornerCol}
                  </td>
                  {legs.map((l, j) => (
                    <th key={l.key} scope="col" className={cur.b === j ? "is-hl" : undefined}>
                      <span className="an-mx-short" aria-hidden="true">
                        {l.short}
                      </span>
                      <span className="an-mx-code" aria-hidden="true">
                        {l.code}
                      </span>
                      <span className="sr-only">{l.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {legs.map((l, i) => (
                  <tr key={l.key} className={picked === i ? "is-picked" : undefined}>
                    <th scope="row" className={cur.a === i ? "is-hl" : undefined}>
                      {l.hasRow ? (
                        <button type="button" className="an-mx-rowbtn" title={fmt(t.rowPick, { name: l.name })} onClick={() => pick(i)}>
                          <span className="an-mx-full" aria-hidden="true">
                            <span className="legendary-star">★</span>
                            {l.name}
                          </span>
                          <span className="an-mx-code" aria-hidden="true">
                            {l.code}
                          </span>
                          <span className="sr-only">{fmt(t.rowPick, { name: l.name })}</span>
                        </button>
                      ) : (
                        <span className="an-mx-rowbtn is-static">
                          <span className="an-mx-full" aria-hidden="true">
                            <span className="legendary-star">★</span>
                            {l.name}
                          </span>
                          <span className="an-mx-code" aria-hidden="true">
                            {l.code}
                          </span>
                          <span className="sr-only">{l.name}</span>
                        </span>
                      )}
                    </th>
                    {legs.map((_, j) => {
                      const c = grid[i][j];
                      const isLocked = locked.a === i && locked.b === j;
                      const isPreview = preview !== null && preview.a === i && preview.b === j;
                      const tint = c.tint ? (c.r >= 0.5 ? `rgba(70, 211, 105, ${c.tint})` : `rgba(255, 92, 92, ${c.tint})`) : undefined;
                      return (
                        <td key={j}>
                          <button
                            type="button"
                            className={`an-mx-c is-${c.kind}${isPreview ? " is-preview" : ""}`}
                            data-i={i}
                            data-j={j}
                            tabIndex={roving.a === i && roving.b === j ? 0 : -1}
                            aria-pressed={isLocked}
                            aria-label={cellLabel(i, j)}
                            style={tint ? { backgroundColor: tint } : undefined}
                            onPointerOver={(e) => {
                              if (e.pointerType !== "mouse") return;
                              if (!preview || preview.a !== i || preview.b !== j) setPreview({ a: i, b: j });
                            }}
                            onClick={() => lock(i, j, "chosen")}
                            onFocus={() => {
                              if (!isLocked) lock(i, j, "chosen");
                            }}
                            onKeyDown={(e) => onCellKey(e, i, j)}
                          >
                            {c.val}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="an-mx-legend">
              <span>
                <i className="an-sw is-up" />
                {t.legendUp}
              </span>
              <span>
                <i className="an-sw is-down" />
                {t.legendDown}
              </span>
              <span>
                <i className="an-sw is-thin" />
                {t.legendThin}
              </span>
              <span>
                <b className="font-mono">·</b> {t.legendNone}
              </span>
            </div>
            <p className="an-mx-codes">
              <span className="sr-only">{t.codes}: </span>
              {legs.map((l, i) => (
                <span key={l.key}>
                  {i > 0 ? " · " : ""}
                  <b>{l.code}</b> {l.name}
                </span>
              ))}
            </p>
          </div>

          <aside className="an-panel an-mx-panel" aria-live="polite" aria-label={t.panelAria} ref={panelRef}>
            <p className="kicker an-panel-kicker">{kicker}</p>
            <div className="an-pn-cards">
              <figure>
                <Link href={A.href} prefetch={false}>
                  <CardArt src={A.src} thumb={A.thumb} name={A.name} width={78} eager alt={A.name} />
                </Link>
                <figcaption>
                  <span className="legendary-star" aria-hidden="true">
                    ★
                  </span>
                  {A.name}
                </figcaption>
              </figure>
              <span className="an-pn-vs">{t.vs}</span>
              <figure>
                <Link href={B.href} prefetch={false}>
                  <CardArt src={B.src} thumb={B.thumb} name={B.name} width={78} eager alt={B.name} />
                </Link>
                <figcaption>
                  <span className="legendary-star" aria-hidden="true">
                    ★
                  </span>
                  {B.name}
                </figcaption>
              </figure>
            </div>
            {m.kind === "mirror" ? (
              <p className="an-pn-empty">{fmt(t.mirror, { a: A.name, games: m.gamesText })}</p>
            ) : m.kind === "none" ? (
              <p className="an-pn-empty">{fmt(t.none, { a: A.name, b: B.name })}</p>
            ) : (
              <>
                <div className="an-pn-wr">
                  <span className="an-big">
                    {m.pctNum}
                    <small>{t.unit}</small>
                  </span>
                  <Delta d={m.delta} pt={t.pt} />
                </div>
                <div className="an-pn-ci">
                  <Interval lo={m.loN} hi={m.hiN} r={m.r} axis={FULL} label={fmt(t.ciAria, { lo: m.lo, hi: m.hi })} />
                  <p>{fmt(t.interval, { lo: m.lo, hi: m.hi })}</p>
                </div>
                <p className={`an-pn-verdict is-${m.verdict.startsWith("up") ? "up" : m.verdict.startsWith("down") ? "down" : "even"}`}>
                  <b>{verdict.title}</b>
                  {fmt(verdict.text, { a: A.name, games: m.gamesText })} {fmt(t.often, { a: A.name, n: m.tenth })}
                </p>
                <dl className="an-pn-stats">
                  <div>
                    <dt>{t.stats.games}</dt>
                    <dd>{m.gamesNum}</dd>
                  </div>
                  <div>
                    <dt>{t.stats.wl}</dt>
                    <dd>{m.wl}</dd>
                  </div>
                  <div>
                    <dt>{t.stats.interval}</dt>
                    <dd>
                      {m.lo}–{m.hi}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.stats.delta}</dt>
                    <dd>
                      <Delta d={m.delta} pt={t.pt} />
                    </dd>
                  </div>
                  <div className="is-wide">
                    <dt>{t.stats.back}</dt>
                    <dd className="is-text">
                      {back.kind === "ok" || back.kind === "thin" ? fmt(t.backText, { a: A.name, b: B.name, p: back.pct, games: back.gamesText, wl: back.wl }) : fmt(t.backNone, { a: A.name, b: B.name })}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
