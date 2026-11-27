import { Fragment, type ReactNode } from "react";
import type { Num, Move } from "@/lib/tracker/sections";
import { pct, fmtDec } from "@/lib/tracker/snapshot";
import type { Locale } from "@/lib/i18n";

/* Pezzi comuni delle pagine di Analytics a sezioni (27/11/2026). Solo componenti server, senza stato. */

/** Un modello con i segnaposto {x}: i valori escono in grassetto (le frasi «da sapere»). */
export function rich(template: string, values: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const k = /^\{(\w+)\}$/.exec(part)?.[1];
    return k && k in values ? <b key={i}>{values[k]}</b> : <Fragment key={i}>{part}</Fragment>;
  });
}

/** Lo stesso modello in testo semplice (title, alt, attributi). */
export const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

/** Fascia a tutta larghezza come in /analytics: `stage` (palco), `felt` (feltro), `deep` (fondo scuro). */
export function Band({ tone = "felt", id, top = false, children }: { tone?: "stage" | "felt" | "deep"; id?: string; top?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`an-band an-band--${tone}${top ? " is-top" : ""} sez-band`}>
      <div className="an-wrap">{children}</div>
    </section>
  );
}

/** Titolo di sezione (h1 in cima alla pagina, h2 sotto) con le due o tre frasi «da sapere», la più importante per prima. */
export function SecHead({ title, brief, action, as = "h2" }: { title: string; brief: ReactNode[]; action?: ReactNode; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div className="sez-head">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <H className={as === "h1" ? "t-page text-sky" : "sez-h2"}>{title}</H>
        {action}
      </div>
      {brief.length ? (
        <ul className="sez-brief">
          {brief.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Barra del win rate con l'intervallo al 95% e il 50% segnato. Sotto le 20 partite più tenue. */
export function WrBar({ n, locale, className = "" }: { n: Num; locale: Locale; className?: string }) {
  return (
    <span className={`sez-bar block ${n.games < 20 ? "sez-thin" : ""} ${className}`} role="img" aria-label={`${pct(n.r, locale, 0)} (${pct(n.lo, locale, 0)}–${pct(n.hi, locale, 0)})`}>
      <i style={{ width: `${n.r * 100}%` }} />
      <s style={{ left: `${n.lo * 100}%`, width: `${(n.hi - n.lo) * 100}%` }} />
    </span>
  );
}

/** Spostamento fra due patch: freccia e punti, colorato solo quando è netto (intervalli che non si toccano). */
export function MoveTag({ m, locale, labels }: { m: Move | null; locale: Locale; labels: { isNew: string; clearMove: string; unclearMove: string } }) {
  if (!m) return <span className="sez-flat text-sm">{labels.isNew}</span>;
  const cls = !m.sure ? "sez-flat" : m.points > 0 ? "sez-up" : "sez-down";
  const sign = m.points > 0 ? "+" : m.points < 0 ? "−" : "";
  return (
    <span className={`${cls} whitespace-nowrap text-sm font-bold`} title={m.sure ? labels.clearMove : labels.unclearMove}>
      {m.points > 0 ? "▲" : m.points < 0 ? "▼" : "="} {sign}
      {fmtDec(Math.abs(m.points), locale, 1)}
    </span>
  );
}

/** Linea piccola del win rate su più patch (SVG, 50% tratteggiato). */
export function Spark({ points, width = 96, height = 28 }: { points: (number | null)[]; width?: number; height?: number }) {
  const n = points.length;
  const vals = points.filter((v): v is number => v !== null);
  if (vals.length < 2) return null;
  const min = Math.min(0.3, ...vals);
  const max = Math.max(0.7, ...vals);
  const x = (i: number) => (n > 1 ? (i * (width - 4)) / (n - 1) + 2 : width / 2);
  const y = (v: number) => height - 2 - ((v - min) / (max - min)) * (height - 4);
  const d = points.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
  const lastI = points.length - 1 - [...points].reverse().findIndex((v) => v !== null);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0">
      <line x1="0" x2={width} y1={y(0.5)} y2={y(0.5)} stroke="rgba(255,255,255,.25)" strokeDasharray="3 3" />
      <polyline points={d} fill="none" stroke="var(--color-sky)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(lastI)} cy={y(points[lastI] as number)} r="3" fill="var(--color-mint)" />
    </svg>
  );
}

/** Ritratto tondo di una carta (la sua finestra d'arte). */
export function Portrait({ art, size = 44 }: { art: string | null | undefined; size?: number }) {
  return (
    <span className="block shrink-0 overflow-hidden rounded-full border-2 border-white/25 bg-night-3" style={{ width: size, height: size }}>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, WebP piccolo
        <img src={art} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-[50%_20%]" />
      ) : null}
    </span>
  );
}
