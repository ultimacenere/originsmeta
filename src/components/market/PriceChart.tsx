"use client";

import { useMemo, useRef, useState } from "react";
import { MARKET_RANGES, chartGeometry, convertCents, formatMoney, fxFor, rangePoints, type MarketRange, type PricePoint } from "@/lib/market/market";
import { fillMarket, type MarketLabels } from "@/lib/marketLabels";
import { useMounted } from "@/lib/useMounted";
import { CurrencySwitch, useMarketCurrency } from "./currency";

/**
 * Grafico del prezzo di un oggetto (tracker dei prezzi, 17/10/2026): una serie sola, il prezzo più basso in vendita a ogni
 * ora (24 ore, 7 e 30 giorni) o a ogni giorno (tutto lo storico), nella valuta scelta (gli euro con il cambio BCE del
 * giorno di ogni punto). SVG nostro, niente librerie (come DeckCharts). Al passaggio del mouse, o col dito, una linea
 * verticale e il riquadro con ora, prezzo e offerte; sotto, la tabella con gli stessi dati per chi non vede il grafico.
 * Prima di due punti dice che lo storico comincia adesso: niente punti inventati.
 */

const W = 720;
const H = 260;
const PAD = { top: 16, right: 12, bottom: 28, left: 72 };

export function PriceChart({
  hourly,
  daily,
  fx,
  usdPerEur,
  locale,
  name,
  labels,
  currencyLabel,
  now,
}: {
  hourly: PricePoint[];
  daily: PricePoint[];
  fx: { day: string; usdPerEur: number }[];
  usdPerEur: number | null;
  locale: string;
  name: string;
  labels: MarketLabels["item"];
  currencyLabel: string;
  /** l'ora del render della pagina (server): gli intervalli si contano da qui, uguali nel server e nel browser */
  now: number;
}) {
  const currency = useMarketCurrency(locale);
  // le ore nel fuso di chi guarda solo dopo l'idratazione (prima UTC, come l'HTML del server)
  const mounted = useMounted();
  const [range, setRange] = useState<MarketRange>("7d");
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fxMap = useMemo(() => new Map(fx.map((f) => [f.day, f.usdPerEur])), [fx]);

  const { points, byDay } = useMemo(() => rangePoints(range, hourly, daily, now), [range, hourly, daily, now]);
  const values = useMemo(
    () => points.map((p) => convertCents(p.close, currency, fxFor(p.t.slice(0, 10), fxMap, usdPerEur)) ?? 0),
    [points, currency, fxMap, usdPerEur],
  );
  const times = useMemo(() => points.map((p) => Date.parse(p.t)), [points]);
  const geo = useMemo(() => (points.length >= 2 ? chartGeometry(values, times, W, H, PAD) : null), [values, times, points.length]);
  const fmtTime = (t: number) =>
    new Intl.DateTimeFormat(locale, byDay ? { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } : { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", ...(mounted ? {} : { timeZone: "UTC" }) }).format(new Date(t));
  const money = (cents: number) => formatMoney(cents, currency, locale);
  const tickMoney = (cents: number) => new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: cents < 1000 ? 2 : 0 }).format(cents / 100);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!geo || !svgRef.current) return;
    const box = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    for (let i = 1; i < geo.xs.length; i++) if (Math.abs(geo.xs[i] - x) < Math.abs(geo.xs[best] - x)) best = i;
    setHover(best);
  };

  const line = geo ? geo.xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${geo.ys[i].toFixed(1)}`).join(" ") : "";
  const baseY = H - PAD.bottom;
  const area = geo ? `${line} L${geo.xs[geo.xs.length - 1].toFixed(1)},${baseY} L${geo.xs[0].toFixed(1)},${baseY} Z` : "";
  const yOf = (v: number) => (geo ? PAD.top + (1 - (v - geo.min) / (geo.max - geo.min)) * (H - PAD.top - PAD.bottom) : 0);
  const h = hover !== null && geo ? hover : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={labels.chartTitle} className="flex flex-wrap gap-1.5">
          {MARKET_RANGES.map((r) => (
            <button key={r} type="button" onClick={() => { setRange(r); setHover(null); }} aria-pressed={range === r} className={`btn btn-choice px-3 py-1 text-xs ${range === r ? "is-on" : ""}`}>
              {labels.ranges[r]}
            </button>
          ))}
        </div>
        <CurrencySwitch locale={locale} label={currencyLabel} />
      </div>

      {!geo ? (
        <p className="mt-4 rounded-lg border-2 border-dashed border-night-3 p-6 text-center text-sm text-pale-muted">{labels.noHistory}</p>
      ) : (
        <div className="relative mt-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full touch-pan-y select-none"
            role="img"
            aria-label={fillMarket(labels.chartAria, { name, range: labels.ranges[range] })}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {geo.ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={yOf(t)} y2={yOf(t)} stroke="var(--color-night-3)" strokeWidth={1} />
                <text x={PAD.left - 8} y={yOf(t)} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--color-pale-muted)" className="font-mono">
                  {tickMoney(t)}
                </text>
              </g>
            ))}
            <path d={area} fill="var(--color-mint)" opacity={0.1} />
            <path d={line} fill="none" stroke="var(--color-mint)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <text x={PAD.left} y={H - 8} fontSize={12} fill="var(--color-pale-muted)">
              {fmtTime(times[0])}
            </text>
            <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize={12} fill="var(--color-pale-muted)">
              {fmtTime(times[times.length - 1])}
            </text>
            {h !== null ? (
              <g>
                <line x1={geo.xs[h]} x2={geo.xs[h]} y1={PAD.top} y2={baseY} stroke="var(--color-pale-muted)" strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={geo.xs[h]} cy={geo.ys[h]} r={5} fill="var(--color-mint)" stroke="var(--color-night)" strokeWidth={2} />
              </g>
            ) : (
              <circle cx={geo.xs[geo.xs.length - 1]} cy={geo.ys[geo.ys.length - 1]} r={4} fill="var(--color-mint)" stroke="var(--color-night)" strokeWidth={2} />
            )}
          </svg>
          {h !== null ? (
            <div
              className="pointer-events-none absolute top-2 rounded-lg border-2 border-sky bg-night-2 px-3 py-2 text-xs shadow-lg"
              style={geo.xs[h] > W / 2 ? { right: `${((W - geo.xs[h]) / W) * 100 + 2}%` } : { left: `${(geo.xs[h] / W) * 100 + 2}%` }}
            >
              <p className="text-pale-muted">{fmtTime(times[h])}</p>
              <p className="font-mono text-sm text-chalk">{money(values[h])}</p>
              <p className="text-pale-muted">
                {labels.table.listings}: <span className="font-mono">{new Intl.NumberFormat(locale).format(points[h].listings)}</span>
              </p>
            </div>
          ) : null}
        </div>
      )}

      {points.length ? (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-chalk-muted">{labels.table.show}</summary>
          <div className="mt-2 max-h-80 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-chalk-muted">
                <tr>
                  <th scope="col" className="py-1 pr-3 font-semibold">{labels.table.time}</th>
                  <th scope="col" className="py-1 pr-3 text-right font-semibold">{labels.table.low}</th>
                  <th scope="col" className="py-1 pr-3 text-right font-semibold">{labels.table.high}</th>
                  <th scope="col" className="py-1 pr-3 text-right font-semibold">{labels.table.close}</th>
                  <th scope="col" className="py-1 text-right font-semibold">{labels.table.listings}</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums text-pale">
                {[...points].reverse().map((p) => {
                  const rate = fxFor(p.t.slice(0, 10), fxMap, usdPerEur);
                  const m = (c: number) => formatMoney(convertCents(c, currency, rate), currency, locale);
                  return (
                    <tr key={p.t} className="border-t border-night-3">
                      <td className="py-1 pr-3 font-sans">{fmtTime(Date.parse(p.t))}</td>
                      <td className="py-1 pr-3 text-right">{m(p.low)}</td>
                      <td className="py-1 pr-3 text-right">{m(p.high)}</td>
                      <td className="py-1 pr-3 text-right">{m(p.close)}</td>
                      <td className="py-1 text-right">{new Intl.NumberFormat(locale).format(p.listings)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
