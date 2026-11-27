"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GameCardFace } from "@/components/GameCard";
import type { ChangeKind, Stats } from "@/lib/data/cards";
import type { Band, ChangeItem, PatchProofData, Side, Step, TimelineLeg } from "@/lib/proto/patch";

/*
  Prototipo C, «Le patch alla prova» (26/11/2026). Tutti i testi in `L`: la versione scelta si traduce nelle otto lingue.
  Stato condiviso: la Leggendaria scelta accende la sua linea nel tempo e filtra le modifiche (le sue e quelle delle carte
  che la sua lista porta), i filtri per tipo di modifica e "solo Leggendarie".
*/

const L = {
  timeline: "Le Leggendarie, patch dopo patch",
  timelineHelp: "Tocca una Leggendaria per seguirla. Il segno giallo è una modifica: pieno alla Leggendaria, vuoto a una carta della sua lista.",
  metricWr: "Win rate",
  metricShare: "Quota di gioco",
  games: "partite",
  gamesOne: "partita",
  all: "Tutte",
  kinds: { buff: "Buff", nerf: "Nerf", rework: "Rework", deck: "Cambio" } as Record<ChangeKind, string>,
  fix: "Correzione",
  onlyLeg: "Solo Leggendarie",
  focusOff: "Tutte le Leggendarie",
  stepVs: (from: string) => `rispetto a ${from}`,
  firstStep: "La 0.7 è la prima patch nel Tracker: il prima non c'è, qui solo il dopo.",
  fresh: (d: number) => `Dati di ${d === 1 ? "un giorno" : `${d} giorni`}: da rileggere fra qualche giorno.`,
  before: "Prima",
  after: "Dopo",
  wrLeg: "Win rate",
  share: "Quota di gioco",
  inDeck: "Nei mazzi",
  vsAvg: "Rispetto alla media",
  avgNote: (b: string) => `media della patch ${b}`,
  noData: "Nessun dato",
  token: "È una carta creata da altre carte: il Tracker non la conta nei mazzi.",
  carriedBy: "La portavano:",
  none: "Nessuna modifica con questi filtri.",
  changes: (n: number) => (n === 1 ? "1 modifica" : `${n} modifiche`),
  cardLink: "Scheda della carta",
  method:
    "Leggendarie contate da tutti e due i lati: la vittoria di chi registra è la sconfitta dell'avversaria. Carte base dal lato di chi registra, confrontate con la media della patch. Il verdetto c'è solo quando gli intervalli al 95% non si toccano; dice che cosa è successo dopo la patch, non il perché.",
};

const fmtN = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const pct = (v: number, d = 1) => `${(v * 100).toFixed(d).replace(".", ",")}%`;
const signedPts = (v: number) => {
  const n = Math.round(v * 1000) / 10;
  return `${n > 0 ? "+" : n < 0 ? "−" : "±"}${String(Math.abs(n)).replace(".", ",")} ${Math.abs(n) === 1 ? "punto" : "punti"}`;
};
const gamesLabel = (n: number) => `${fmtN(n)} ${n === 1 ? L.gamesOne : L.games}`;

const PEN_ARROWS = [
  "M8.2 20.5C7.6 15 8.6 9.5 7.9 3.2M2.4 8.6C4.6 6.6 6.2 4.6 7.9 2.2 9.6 4.4 11.6 6.4 13.8 8.2",
  "M7.6 20.6C8.4 14.6 7.2 9 8.1 3M2.2 8.9C4.2 7 6.4 4.9 8.1 2.3 9.5 4.7 11.9 6.6 13.9 8.6",
  "M8 20.4C7.5 15.2 8.8 8.8 7.8 3.4M2.6 8.2C4.8 6.9 6 4.4 7.8 2.4 9.8 4.2 11.2 6.8 13.6 8.4",
] as const;
const PEN_TONE: Record<ChangeKind, string> = { buff: "text-mint", nerf: "text-crimson-soft", rework: "text-gold", deck: "text-pale" };

function PenMark({ kind, label, n }: { kind: ChangeKind; label: string; n: number }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] font-bold ${PEN_TONE[kind]}`}>
      {kind === "buff" || kind === "nerf" ? (
        <svg viewBox="0 0 16 22" className={`pen-arrow${kind === "nerf" ? " rotate-180" : ""}`} aria-hidden="true">
          <path d={PEN_ARROWS[n % PEN_ARROWS.length]} />
        </svg>
      ) : null}
      {label}
    </span>
  );
}

function statsLine(from?: Stats, to?: Stats): string | null {
  if (!from || !to) return null;
  const parts: string[] = [];
  if (from.mana !== to.mana && to.mana !== undefined) parts.push(`Costo ${from.mana ?? "?"} → ${to.mana}`);
  if (from.power !== to.power && to.power !== undefined) parts.push(`Forza ${from.power ?? "?"} → ${to.power}`);
  if (from.health !== to.health && to.health !== undefined) parts.push(`Salute ${from.health ?? "?"} → ${to.health}`);
  return parts.length ? parts.join(" · ") : null;
}

/* ---------- linea del tempo ---------- */

type Metric = "wr" | "share";
const valueOf = (p: { r: number; share: number }, m: Metric) => (m === "wr" ? p.r : p.share);

function axisOf(legs: TimelineLeg[], m: Metric): { min: number; max: number } {
  const vals = legs.flatMap((l) => l.points.filter((p): p is NonNullable<typeof p> => !!p).map((p) => valueOf(p, m)));
  if (!vals.length) return { min: 0, max: 1 };
  if (m === "share") return { min: 0, max: Math.ceil((Math.max(...vals) + 0.01) * 20) / 20 };
  const lo = Math.floor((Math.min(...vals, 0.5) - 0.01) * 20) / 20;
  const hi = Math.ceil((Math.max(...vals, 0.5) + 0.01) * 20) / 20;
  return { min: lo, max: hi };
}

function Timeline({
  data,
  focus,
  setFocus,
  metric,
}: {
  data: PatchProofData;
  focus: string | null;
  setFocus: (s: string | null) => void;
  metric: Metric;
}) {
  const W = 760;
  const H = 340;
  const padL = 44;
  const padR = 150;
  const padT = 18;
  const padB = 38;
  const n = data.patches.length;
  const x = (i: number) => padL + (n > 1 ? (i * (W - padL - padR)) / (n - 1) : 0);
  const axis = axisOf(data.timeline, metric);
  const y = (v: number) => padT + (1 - (v - axis.min) / (axis.max - axis.min)) * (H - padT - padB);
  const ticks: number[] = [];
  const step = metric === "wr" ? 0.05 : axis.max > 0.25 ? 0.1 : 0.05;
  for (let t = axis.min; t <= axis.max + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100);

  // etichette in fondo alla linea, spostate per non toccarsi
  const labels = data.timeline
    .map((l) => {
      let i = l.points.length - 1;
      while (i >= 0 && !l.points[i]) i--;
      return i >= 0 ? { slug: l.slug, name: l.name, i, y: y(valueOf(l.points[i]!, metric)) } : null;
    })
    .filter((l): l is NonNullable<typeof l> => !!l)
    .sort((a, b) => a.y - b.y);
  for (let k = 1; k < labels.length; k++) if (labels[k].y - labels[k - 1].y < 13) labels[k].y = labels[k - 1].y + 13;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${L.timeline}: ${metric === "wr" ? L.metricWr : L.metricShare}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className={metric === "wr" && Math.abs(t - 0.5) < 1e-6 ? "stroke-pale/50" : "stroke-pale/12"} strokeDasharray={metric === "wr" && Math.abs(t - 0.5) < 1e-6 ? "4 4" : undefined} />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="fill-pale-muted text-[11px] tabular-nums">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      {data.patches.map((p, i) => (
        <text key={p.patch} x={x(i)} y={H - 12} textAnchor="middle" className="fill-chalk text-[12px] font-semibold">
          {p.label}
        </text>
      ))}
      {data.timeline.map((l) => {
        const on = focus === l.slug;
        const dim = focus !== null && !on;
        const segs: string[] = [];
        let cur = "";
        l.points.forEach((p, i) => {
          if (!p) {
            if (cur) segs.push(cur);
            cur = "";
            return;
          }
          cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(valueOf(p, metric)).toFixed(1)}`;
        });
        if (cur) segs.push(cur);
        return (
          <g key={l.slug} className="cursor-pointer" onClick={() => setFocus(on ? null : l.slug)} opacity={dim ? 0.18 : 1}>
            {segs.map((d, k) => (
              <path key={k} d={d} fill="none" className={on ? "stroke-mint" : "stroke-sky/70"} strokeWidth={on ? 3.5 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {segs.map((d, k) => (
              <path key={`h${k}`} d={d} fill="none" stroke="transparent" strokeWidth={14} />
            ))}
            {l.points.map((p, i) =>
              p ? (
                <g key={i}>
                  {l.marks[i] ? (
                    l.marks[i]!.self ? (
                      <circle cx={x(i)} cy={y(valueOf(p, metric))} r={on ? 7 : 5.5} className="fill-gold stroke-night" strokeWidth={2} />
                    ) : (
                      <circle cx={x(i)} cy={y(valueOf(p, metric))} r={on ? 6 : 4.5} className="fill-night stroke-gold" strokeWidth={2} />
                    )
                  ) : (
                    <circle cx={x(i)} cy={y(valueOf(p, metric))} r={on ? 4 : 2.4} className={on ? "fill-mint" : "fill-sky/80"} />
                  )}
                  {on ? (
                    <text x={x(i)} y={y(valueOf(p, metric)) - 12} textAnchor="middle" className="fill-mint text-[12px] font-bold tabular-nums">
                      {pct(valueOf(p, metric), metric === "wr" ? 1 : 0)}
                    </text>
                  ) : null}
                </g>
              ) : null,
            )}
          </g>
        );
      })}
      {labels.map((lb) => {
        const on = focus === lb.slug;
        return (
          <text
            key={lb.slug}
            x={x(lb.i) + 10}
            y={lb.y + 4}
            onClick={() => setFocus(on ? null : lb.slug)}
            className={`cursor-pointer text-[12px] ${on ? "fill-mint font-bold" : focus ? "fill-pale-muted" : "fill-pale"}`}
          >
            {lb.name}
          </text>
        );
      })}
    </svg>
  );
}

function Spark({ leg, metric, axis }: { leg: TimelineLeg; metric: Metric; axis: { min: number; max: number } }) {
  const W = 120;
  const H = 40;
  const n = leg.points.length;
  const x = (i: number) => 6 + (n > 1 ? (i * (W - 12)) / (n - 1) : 0);
  const y = (v: number) => 4 + (1 - (v - axis.min) / (axis.max - axis.min)) * (H - 8);
  let d = "";
  leg.points.forEach((p, i) => {
    if (p) d += `${d ? "L" : "M"}${x(i).toFixed(1)},${y(valueOf(p, metric)).toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-10 w-full" aria-hidden="true">
      {metric === "wr" ? <line x1={0} x2={W} y1={y(0.5)} y2={y(0.5)} className="stroke-pale/30" strokeDasharray="3 3" /> : null}
      <path d={d} fill="none" className="stroke-sky" strokeWidth={2} strokeLinecap="round" />
      {leg.points.map((p, i) =>
        p && leg.marks[i] ? (
          <circle key={i} cx={x(i)} cy={y(valueOf(p, metric))} r={3.6} className={leg.marks[i]!.self ? "fill-gold" : "fill-night stroke-gold"} strokeWidth={1.6} />
        ) : null,
      )}
    </svg>
  );
}

function FocusDetail({ data, leg, metric }: { data: PatchProofData; leg: TimelineLeg; metric: Metric }) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-pale sm:grid-cols-2">
      {data.patches.map((p, i) => {
        const pt = leg.points[i];
        const mk = leg.marks[i];
        return (
          <li key={p.patch} className="flex flex-wrap items-baseline gap-x-2">
            <span className="w-24 shrink-0 font-display font-semibold text-chalk">{p.label}</span>
            {pt ? (
              <span className="tabular-nums">
                <b className="text-mint">{pct(valueOf(pt, metric), metric === "wr" ? 1 : 0)}</b> · {gamesLabel(pt.games)}
              </span>
            ) : (
              <span className="text-pale-muted">{L.noData}</span>
            )}
            {mk ? (
              <span className="pen-note is-quiet !text-[1.05rem] !text-gold">
                {mk.self ? `${L.kinds[mk.kinds[0]]} a ${leg.name}` : ""}
                {mk.self && mk.cards.length ? ", " : ""}
                {mk.cards.length ? `toccate ${mk.cards.join(", ")}` : ""}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- prima e dopo ---------- */

function Dumbbell({ before, after, scale, center }: { before: Band | null; after: Band | null; scale: { min: number; max: number }; center?: number }) {
  const p = (v: number) => `${Math.min(100, Math.max(0, ((v - scale.min) / (scale.max - scale.min)) * 100))}%`;
  return (
    <div className="relative h-5" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 h-px bg-pale/20" />
      {center !== undefined ? <div className="absolute top-0 h-full w-px bg-pale/45" style={{ left: p(center) }} /> : null}
      {before ? (
        <>
          <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-pale/30" style={{ left: p(before.lo), right: `calc(100% - ${p(before.hi)})` }} />
          <div className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pale" style={{ left: p(before.v) }} />
        </>
      ) : null}
      {after ? (
        <>
          <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-mint/35" style={{ left: p(after.lo), right: `calc(100% - ${p(after.hi)})` }} />
          <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-night bg-mint" style={{ left: p(after.v) }} />
        </>
      ) : null}
    </div>
  );
}

function Measure({
  label,
  before,
  after,
  kind,
}: {
  label: string;
  before: Side | null;
  after: Side | null;
  kind: "wrLeg" | "vsAvg" | "share";
}) {
  const b = before ? (kind === "share" ? before.share : before.wr) : null;
  const a = after ? (kind === "share" ? after.share : after.wr) : null;
  const fmt = (x: Band) => (kind === "vsAvg" ? signedPts(x.v) : pct(x.v, kind === "share" ? 1 : 1));
  const vals = [b, a].filter((x): x is Band => !!x);
  let scale: { min: number; max: number };
  if (kind === "wrLeg") scale = { min: 0.3, max: 0.7 };
  else if (kind === "vsAvg") scale = { min: -0.2, max: 0.2 };
  else scale = { min: 0, max: Math.max(0.1, Math.ceil((Math.max(...vals.map((v) => v.hi), 0) + 0.02) * 10) / 10) };
  if (vals.some((v) => v.lo < scale.min || v.hi > scale.max)) {
    scale = { min: Math.min(scale.min, ...vals.map((v) => v.lo)), max: Math.max(scale.max, ...vals.map((v) => v.hi)) };
  }
  const games = (s: Side | null) => (s ? (kind === "share" ? null : s.games) : null);
  return (
    <div>
      <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
        <span className="text-pale-muted">{label}</span>
        <span className="tabular-nums text-chalk">
          {b ? <span className="text-pale">{fmt(b)}</span> : <span className="text-pale-muted">—</span>}
          <span className="mx-1 text-pale-muted">→</span>
          {a ? <b className="text-mint">{fmt(a)}</b> : <span className="text-pale-muted">—</span>}
        </span>
      </p>
      <Dumbbell before={b} after={a} scale={scale} center={kind === "wrLeg" ? 0.5 : kind === "vsAvg" ? 0 : undefined} />
      {kind !== "share" && (games(before) !== null || games(after) !== null) ? (
        <p className="text-right text-xs tabular-nums text-pale-muted">
          {games(before) !== null ? fmtN(games(before)!) : "—"} → {games(after) !== null ? gamesLabel(games(after)!) : "—"}
        </p>
      ) : null}
    </div>
  );
}

function Item({ it, n, setFocus }: { it: ChangeItem; n: number; setFocus: (s: string) => void }) {
  const stats = statsLine(it.from, it.to);
  const avg = it.after?.base ?? it.before?.base;
  return (
    <li className="card-night flex gap-4 p-4">
      <Link href={`/it/cards/${it.slug}`} className="w-[96px] shrink-0 sm:w-[128px]" aria-label={`${L.cardLink}: ${it.name}`}>
        <GameCardFace input={it.card} lang="it" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="t-item text-sky">
            {it.legendary ? (
              <button type="button" onClick={() => setFocus(it.slug)} className="text-left hover:text-mint">
                <span className="legendary-star" aria-hidden="true">
                  ★
                </span>
                {it.name}
              </button>
            ) : (
              it.name
            )}
          </h3>
          <PenMark kind={it.kind} label={it.fix ? L.fix : L.kinds[it.kind]} n={n} />
        </div>
        {stats ? <p className="mt-1 font-display text-sm font-semibold text-chalk tabular-nums">{stats}</p> : null}
        <p className="mt-1 text-sm text-pale">{it.note}</p>
        {!it.before && !it.after ? (
          <p className="mt-3 text-sm text-pale-muted">{it.card.type === "token" ? L.token : L.noData}</p>
        ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          {it.legendary ? (
            <>
              <Measure label={L.wrLeg} before={it.before} after={it.after} kind="wrLeg" />
              <Measure label={L.share} before={it.before} after={it.after} kind="share" />
            </>
          ) : (
            <>
              <Measure label={L.inDeck} before={it.before} after={it.after} kind="share" />
              <Measure label={L.vsAvg} before={it.before} after={it.after} kind="vsAvg" />
              {avg !== undefined ? <p className="-mt-1 text-xs text-pale-muted">{L.avgNote(pct(avg, 0))}</p> : null}
            </>
          )}
        </div>
        )}
        {it.legs.length ? (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm text-pale-muted">
            {L.carriedBy}
            {it.legs.map((l) => (
              <button key={l.slug} type="button" onClick={() => setFocus(l.slug)} className="text-mint hover:underline">
                {l.name}
              </button>
            ))}
          </p>
        ) : null}
        {it.verdict ? (
          <p className={`pen-note mt-3 !text-[1.3rem] ${it.verdict.dir === "up" ? "!text-mint" : it.verdict.dir === "down" ? "!text-crimson-soft" : "is-quiet"}`}>
            {it.verdict.text}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/* ---------- pagina ---------- */

type KindFilter = "all" | ChangeKind;

export function PatchProof({ data }: { data: PatchProofData }) {
  const [focus, setFocusRaw] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("wr");
  const [kind, setKind] = useState<KindFilter>("all");
  const [onlyLeg, setOnlyLeg] = useState(false);
  const focusLeg = data.timeline.find((l) => l.slug === focus) ?? null;
  const setFocus = (s: string | null) => {
    setFocusRaw(s);
    if (s && typeof document !== "undefined") document.getElementById("tempo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const visible = useMemo(
    () =>
      data.steps.map((s) => ({
        ...s,
        items: s.items.filter(
          (it) =>
            (kind === "all" || it.kind === kind) &&
            (!onlyLeg || it.legendary) &&
            (!focus || it.slug === focus || it.legs.some((l) => l.slug === focus) || (data.timeline.find((l) => l.slug === focus)?.marks ?? []).some((m) => m?.cards.includes(it.name))),
        ),
      })),
    [data, kind, onlyLeg, focus],
  );
  const kinds = useMemo(() => {
    const set = new Set(data.steps.flatMap((s) => s.items.map((i) => i.kind)));
    return (["buff", "nerf", "rework", "deck"] as ChangeKind[]).filter((k) => set.has(k));
  }, [data]);
  const sparkAxis = axisOf(data.timeline, metric);
  const chip = (on: boolean) =>
    `rounded-full px-3 py-1 text-sm font-display font-semibold transition ${on ? "bg-mint text-ink" : "bg-night-2 text-pale hover:text-chalk"}`;

  return (
    <div>
      {/* indice delle patch e filtri, fissi sotto la testata */}
      <nav className="sticky top-16 z-20 -mx-4 mb-6 bg-felt/95 px-4 py-2.5 backdrop-blur-0 sm:-mx-6 sm:px-6" aria-label="Patch">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {visible.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={`shrink-0 ${chip(false)} ${s.items.length ? "" : "opacity-40"}`}>
              {s.to.label} <span className="text-pale-muted tabular-nums">{s.items.length}</span>
            </a>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className={chip(kind === "all")} onClick={() => setKind("all")} aria-pressed={kind === "all"}>
            {L.all}
          </button>
          {kinds.map((k) => (
            <button key={k} type="button" className={chip(kind === k)} onClick={() => setKind(kind === k ? "all" : k)} aria-pressed={kind === k}>
              {L.kinds[k]}
            </button>
          ))}
          <button type="button" className={chip(onlyLeg)} onClick={() => setOnlyLeg(!onlyLeg)} aria-pressed={onlyLeg}>
            ★ {L.onlyLeg}
          </button>
          {focusLeg ? (
            <button type="button" className={chip(true)} onClick={() => setFocusRaw(null)}>
              {focusLeg.name} ✕
            </button>
          ) : null}
        </div>
      </nav>

      <section id="tempo" className="scroll-mt-40">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="t-section text-sky">{L.timeline}</h2>
          <div className="flex gap-1.5" role="group">
            <button type="button" className={chip(metric === "wr")} onClick={() => setMetric("wr")} aria-pressed={metric === "wr"}>
              {L.metricWr}
            </button>
            <button type="button" className={chip(metric === "share")} onClick={() => setMetric("share")} aria-pressed={metric === "share"}>
              {L.metricShare}
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-pale-muted">{L.timelineHelp}</p>
        <div className="card-night mt-4 p-3 sm:p-5">
          <div className="hidden sm:block">
            <Timeline data={data} focus={focus} setFocus={setFocusRaw} metric={metric} />
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-3 sm:hidden">
            {data.timeline.map((l) => {
              const last = [...l.points].reverse().find((p) => !!p);
              const on = focus === l.slug;
              return (
                <li key={l.slug}>
                  <button
                    type="button"
                    onClick={() => setFocusRaw(on ? null : l.slug)}
                    className={`w-full rounded-lg px-2 py-1.5 text-left ${on ? "bg-night-3 ring-2 ring-mint" : focus ? "opacity-50" : ""}`}
                    aria-pressed={on}
                  >
                    <span className="flex items-baseline justify-between gap-1">
                      <span className={`truncate font-display text-sm font-semibold ${on ? "text-mint" : "text-chalk"}`}>{l.name}</span>
                      {last ? <span className="shrink-0 text-xs tabular-nums text-pale">{pct(valueOf(last, metric), metric === "wr" ? 0 : 0)}</span> : null}
                    </span>
                    <Spark leg={l} metric={metric} axis={sparkAxis} />
                  </button>
                </li>
              );
            })}
          </ul>
          {focusLeg ? <FocusDetail data={data} leg={focusLeg} metric={metric} /> : null}
        </div>
      </section>

      {visible.map((s) => (
        <StepSection key={s.id} step={s} freshDays={data.freshDays} setFocus={setFocus} />
      ))}

      <p className="mt-10 max-w-3xl text-sm text-pale-muted">{L.method}</p>
    </div>
  );
}

function StepSection({ step, freshDays, setFocus }: { step: Step; freshDays: number | null; setFocus: (s: string) => void }) {
  return (
    <section id={step.id} className="mt-12 scroll-mt-40">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="t-section text-sky">{step.to.label}</h2>
        <span className="text-sm text-pale-muted">
          {step.from ? `${L.stepVs(step.from.label)} · ` : ""}
          {L.changes(step.items.length)}
        </span>
      </div>
      <p className="mt-1 text-sm text-pale-muted tabular-nums">
        {step.from ? `${L.before}: ${gamesLabel(step.from.games)} · ${L.after}: ${gamesLabel(step.to.games)}` : L.firstStep}
      </p>
      {step.fresh && freshDays ? <p className="pen-note mt-2 !text-[1.2rem] !text-gold">{L.fresh(freshDays)}</p> : null}
      {step.items.length ? (
        <ul className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {step.items.map((it, i) => (
            <Item key={it.id} it={it} n={i} setFocus={setFocus} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-pale-muted">{L.none}</p>
      )}
    </section>
  );
}
