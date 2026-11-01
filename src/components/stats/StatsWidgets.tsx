import { formatDateShort, type Locale } from "@/lib/i18n";
import { niceCeil, shiftDay, type Counts } from "@/lib/community/deckStats";

/**
 * Pezzi dei pannelli delle statistiche in /account, condivisi dai mazzi (DeckStatsPanel, pacchetto STATS del 26/09/2026)
 * e dai fumetti (ComicStatsPanel, 02/11/2026): tessera del riepilogo, striscia di barre giornaliere, andamento piccolo.
 * Grafici in SVG inline come DeckCharts, senza librerie; le scritte sono HTML, leggibili anche sul telefono. Colori come
 * DeckCharts: menta per il primo contatore (visite), celeste per il secondo (copie del codice, letture complete), sempre
 * con la legenda scritta, mai solo colore.
 */
export const STAT_COLORS = { a: "#31e3bd", b: "#3fc4e8", grid: "rgba(216,222,231,0.14)" };

/** Le tre finestre delle tessere e delle tabelle, nella lingua della pagina. */
export type PeriodLabels = { d7: string; d30: string; total: string };

/** Tessera del riepilogo: 30 giorni in grande, sotto 7 giorni, totale ed eventuale dato in più (media, quota). */
export function StatTile({ label, counts, periods, n, extra }: { label: string; counts: Counts; periods: PeriodLabels; n: (v: number) => string; extra?: string }) {
  return (
    <li className="rounded-xl border-2 border-sky bg-night-2/60 p-4">
      <p className="kicker text-pale-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none text-sky tabular-nums">
        {n(counts.d30)} <span className="font-mono text-[11px] font-normal text-pale-muted">{periods.d30}</span>
      </p>
      <p className="mt-1 font-mono text-[11px] text-pale-muted">
        {periods.d7} {n(counts.d7)} · {periods.total} {n(counts.total)}
        {extra ? ` · ${extra}` : ""}
      </p>
    </li>
  );
}

/**
 * Una striscia di barre giornaliere con la sua scala; `dates` aggiunge sotto primo, mezzo e ultimo giorno. Le barre sono
 * un SVG che si allarga con la figura (`preserveAspectRatio="none"`, linee sempre da 1 px), mentre scala e date sono
 * testo HTML a 11 px: restano leggibili a 375 px come su uno schermo largo.
 */
export function StatBars({ values, color, label, heightClass, n, dates }: { values: number[]; color: string; label: string; heightClass: string; n: (v: number) => string; dates?: { first: string; locale: Locale } }) {
  const days = Math.max(1, values.length);
  const max = niceCeil(Math.max(0, ...values));
  const mid = Math.floor((days - 1) / 2);
  const day = (i: number) => (dates ? formatDateShort(dates.locale, shiftDay(dates.first, i)) : "");
  return (
    <div className="mt-3">
      <p className="font-mono text-[11px] font-semibold" style={{ color }}>
        {label}
      </p>
      <div className="mt-1 flex gap-2">
        <div className={`flex ${heightClass} w-9 shrink-0 flex-col justify-between text-right font-mono text-[11px] leading-none text-pale-muted`}>
          <span>{n(max)}</span>
          <span>0</span>
        </div>
        <svg viewBox={`0 0 ${days} 100`} preserveAspectRatio="none" className={`${heightClass} min-w-0 flex-1`} aria-hidden="true" focusable="false">
          <line x1={0} x2={days} y1={0.5} y2={0.5} stroke={STAT_COLORS.grid} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={days} y1={99.5} y2={99.5} stroke={STAT_COLORS.grid} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {values.map((v, i) => (v ? <rect key={i} x={i + 0.15} y={100 - (v / max) * 100} width={0.7} height={(v / max) * 100} fill={color} /> : null))}
        </svg>
      </div>
      {dates ? (
        <div className="ml-11 mt-1 flex justify-between font-mono text-[11px] text-pale-muted">
          <span>{day(0)}</span>
          <span>{day(mid)}</span>
          <span>{day(days - 1)}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Andamento di un contatore negli ultimi 30 giorni, piccolo (i numeri stanno nella tabella accanto). */
export function StatSparkline({ values }: { values: number[] }) {
  const W = 96;
  const H = 28;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(H - 2 - (v / max) * (H - 4)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-24 shrink-0" aria-hidden="true" focusable="false">
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill="rgba(49,227,189,0.15)" stroke="none" />
      <polyline points={pts} fill="none" stroke={STAT_COLORS.a} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
