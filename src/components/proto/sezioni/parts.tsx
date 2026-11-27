import type { Num } from "@/lib/proto/analyticsProto";
import type { Move } from "@/lib/proto/sezioni";

/* Pezzi comuni delle pagine del prototipo «Analytics a sezioni» (27/11/2026). Solo componenti server, senza stato. */

const pct = (r: number) => `${Math.round(r * 100)}%`;

/** Barra del win rate con l'intervallo al 95% e il 50% segnato. `thin` sotto le 20 partite: più tenue. */
export function WrBar({ n, className = "" }: { n: Num; className?: string }) {
  return (
    <span className={`sez-bar block ${n.games < 20 ? "sez-thin" : ""} ${className}`} role="img" aria-label={`${pct(n.r)}, fra ${pct(n.lo)} e ${pct(n.hi)}`}>
      <i style={{ width: `${n.r * 100}%` }} />
      <s style={{ left: `${n.lo * 100}%`, width: `${(n.hi - n.lo) * 100}%` }} />
    </span>
  );
}

/** Spostamento fra due patch: freccia e punti, verde o magenta solo quando è netto (intervalli che non si toccano). */
export function MoveTag({ m }: { m: Move | null }) {
  if (!m) return <span className="sez-flat text-sm">nuova</span>;
  const cls = !m.sure ? "sez-flat" : m.points > 0 ? "sez-up" : "sez-down";
  const sign = m.points > 0 ? "+" : m.points < 0 ? "−" : "";
  return (
    <span className={`${cls} whitespace-nowrap text-sm font-bold`} title={m.sure ? "Spostamento netto" : "Spostamento non ancora netto"}>
      {m.points > 0 ? "▲" : m.points < 0 ? "▼" : "="} {sign}
      {Math.abs(m.points).toLocaleString("it-IT", { maximumFractionDigits: 1 })}
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

/** Fascia a tutta larghezza come in /analytics di oggi: `stage` (palco), `felt` (feltro), `deep` (fondo scuro). */
export function Band({ tone = "felt", id, top = false, children }: { tone?: "stage" | "felt" | "deep"; id?: string; top?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`an-band an-band--${tone}${top ? " is-top" : ""} sez-band`}>
      <div className="an-wrap">{children}</div>
    </section>
  );
}

/** Titolo di sezione con, sotto, le due o tre cose da sapere: frasi calcolate dai numeri, la più importante per prima. */
export function SezHead({ title, brief, action }: { title: string; brief: React.ReactNode[]; action?: React.ReactNode }) {
  return (
    <div className="sez-head">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="sez-h2">{title}</h2>
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
