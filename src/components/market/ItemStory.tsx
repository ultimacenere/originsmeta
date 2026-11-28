"use client";

import Link from "@/components/IntentLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { MARKET_RANGES, convertCents, formatMoney, fxFor, niceTicks, type MarketRange, type PricePoint } from "@/lib/market/market";
import { HOUR_MS, READ_GAP_MS, eventsOf, priceAt, readingsOf, reliabilityOf, stateAt, stepSegments, storyNotes, typicalPrice, type Reading, type StoryNote } from "@/lib/market/story";
import { fillMarket, type MarketLabels } from "@/lib/marketLabels";
import { useMounted } from "@/lib/useMounted";
import { Change } from "./Change";
import { CurrencySwitch, useMarketCurrency } from "./currency";
import "./market.css";

/**
 * La scheda che racconta (28/11/2026): la parte viva della pagina di un pezzo del Mercato. Un numero grande (il prezzo
 * più basso richiesto, con le offerte e l'ora della lettura) che segue il dito sul grafico; prezzo tipico dei 7 giorni,
 * affidabilità a parole e commissioni comprese; il grafico a gradini onesto sulle letture (pieno fra letture di seguito,
 * tratteggiato fra letture lontane, puntini prima di una sparizione, fascia "letto, nessuna offerta"), con le patch e le
 * note numerate a penna; la storia in breve scritta dai dati e i pezzi gemelli sulla stessa scala. Regole pure in
 * src/lib/market/story.ts; i giorni e le ore nel fuso di chi guarda solo dopo l'idratazione (prima UTC, come l'HTML).
 */

export type StoryContext = { t: number; label: string; patch: boolean };
export type StoryTwin = { slug: string; href: string | null; title: string; tags: string[]; price: number | null; lastPrice: number | null; daily: PricePoint[]; self: boolean };

type Labels = {
  story: MarketLabels["story"];
  ranges: MarketLabels["item"]["ranges"];
  table: MarketLabels["item"]["table"];
  currency: string;
  noOffers: string;
};

const DAY_MS = 24 * HOUR_MS;
const RANGE_MS: Record<Exclude<MarketRange, "all">, number> = { "24h": DAY_MS, "7d": 7 * DAY_MS, "30d": 30 * DAY_MS };

export function ItemStory({
  locale,
  labels,
  name,
  family,
  price,
  listings,
  hourly,
  daily,
  readHours,
  fx,
  usdPerEur,
  now,
  readAt,
  context,
  twins,
}: {
  locale: string;
  labels: Labels;
  name: string;
  /** il nome della famiglia (la carta) per i pezzi gemelli */
  family: string;
  price: number | null;
  listings: number;
  hourly: PricePoint[];
  daily: PricePoint[];
  readHours: number[] | null;
  fx: { day: string; usdPerEur: number }[];
  usdPerEur: number | null;
  /** l'ora della lettura dei dati (server): intervalli e "7 giorni" si contano da qui */
  now: number;
  /** l'ultima lettura del mercato fatta dal raccoglitore (per "letto il"), o null */
  readAt: string | null;
  context: StoryContext[];
  twins: StoryTwin[];
}) {
  const s = labels.story;
  const currency = useMarketCurrency(locale);
  const mounted = useMounted();
  const fxMap = useMemo(() => new Map(fx.map((f) => [f.day, f.usdPerEur])), [fx]);
  const toCur = (cents: number, t: number) => convertCents(cents, currency, fxFor(new Date(t).toISOString().slice(0, 10), fxMap, usdPerEur)) ?? cents;
  const money = (cents: number, t: number) => formatMoney(toCur(cents, t), currency, locale);
  const tz = mounted ? {} : { timeZone: "UTC" };
  const day = (t: number) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", ...tz }).format(new Date(t));
  const dt = (t: number) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", ...tz }).format(new Date(t));
  const fmt = (n: number) => new Intl.NumberFormat(locale).format(n);

  // letture: orarie (31 giorni) con le ore lette della fonte, e prima il giornaliero per tutto lo storico
  const readings = useMemo(() => {
    const h = readingsOf(hourly, readHours);
    const first = h.length ? h[0].t : Infinity;
    const older: Reading[] = daily
      .map((p) => ({ t: Date.parse(p.t), listed: true, price: p.close, listings: p.listings }))
      .filter((r) => Number.isFinite(r.t) && r.t < first - 12 * HOUR_MS);
    return [...older, ...h];
  }, [hourly, daily, readHours]);
  const events = useMemo(() => eventsOf(readings), [readings]);
  const notes = useMemo(() => storyNotes(events), [events]);
  const typical = useMemo(() => typicalPrice(readings, now), [readings, now]);
  const rel = reliabilityOf(price !== null, typical);
  const firstListed = readings.find((r) => r.listed && r.price !== null) ?? null;
  const lastListed = [...readings].reverse().find((r) => r.listed && r.price !== null) ?? null;
  const before7 = priceAt(readings, now - 7 * DAY_MS);

  const [range, setRange] = useState<MarketRange>("all");
  const [scrub, setScrub] = useState<{ t: number; reading: Reading | null; unread: boolean } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(760);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(280, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const t1 = now;
  const t0 = range === "all" ? (readings.length ? Math.min(readings[0].t, now - DAY_MS) - 6 * HOUR_MS : now - 30 * DAY_MS) : now - RANGE_MS[range];
  const inRange = readings.filter((r) => r.t >= t0 && r.t <= t1);
  const prevReading = [...readings].reverse().find((r) => r.t < t0) ?? null;
  const chartReadings = prevReading ? [prevReading, ...inRange] : inRange;
  const { lines, bands } = stepSegments(chartReadings, t0, t1);
  const values = chartReadings.filter((r) => r.listed && r.price !== null).map((r) => toCur(r.price as number, r.t));

  const narrow = width < 520;
  const H = narrow ? 250 : 300;
  const pad = { top: 40, right: 14, bottom: 46, left: narrow ? 50 : 62 };
  const x = (t: number) => pad.left + ((t - t0) / (t1 - t0)) * (width - pad.left - pad.right);
  let lo = values.length ? Math.min(...values) : 0;
  let hi = values.length ? Math.max(...values) : 100;
  if (lo === hi) {
    lo = lo * 0.9;
    hi = hi * 1.1 + 1;
  }
  const ticks = niceTicks(Math.max(0, lo), hi, 4);
  lo = Math.min(lo, ticks[0]);
  hi = Math.max(hi, ticks[ticks.length - 1]);
  const yTop = pad.top + 6;
  const yBottom = H - pad.bottom - 6;
  const y = (v: number) => yBottom - ((v - lo) / (hi - lo || 1)) * (yBottom - yTop);
  const tickStep = ticks.length > 1 ? ticks[1] - ticks[0] : 100;
  const tick = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: tickStep >= 100 ? 0 : 2, maximumFractionDigits: tickStep >= 100 ? 0 : 2 }).format(v / 100);
  // tacche dei giorni distanti almeno 56 px (sul telefono "31 ott" e "1 nov" si toccavano); sotto i due giorni, le ore
  const days = (t1 - t0) / DAY_MS;
  const pxPerDay = (width - pad.left - pad.right) / Math.max(days, 1 / 24);
  const every = days <= 2 ? 0 : ([1, 2, 3, 5, 7, 10, 14, 30].find((k) => k * pxPerDay >= 56) ?? 30);
  const dayTicks: number[] = [];
  if (every) {
    const d0 = new Date(t0);
    d0.setUTCHours(12, 0, 0, 0);
    for (let t = d0.getTime() + (d0.getTime() < t0 ? DAY_MS : 0); t <= t1; t += every * DAY_MS) dayTicks.push(t);
  } else {
    const stepH = [3, 6, 12].find((k) => (k / 24) * pxPerDay >= 48) ?? 12;
    for (let t = Math.ceil(t0 / (stepH * HOUR_MS)) * stepH * HOUR_MS; t <= t1; t += stepH * HOUR_MS) dayTicks.push(t);
  }
  const hourLabel = (t: number) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", ...tz }).format(new Date(t));
  // etichette delle patch: se toccano quella prima scendono di una riga
  const ctx = context
    .filter((c) => c.t >= t0 && c.t <= t1)
    .sort((a, b) => a.t - b.t)
    .reduce<(StoryContext & { row: number })[]>((acc, c) => {
      const prev = acc[acc.length - 1];
      const overlap = prev && prev.row === 0 && x(c.t) - x(prev.t) < prev.label.length * 6.4 + 8;
      acc.push({ ...c, row: overlap ? 1 : 0 });
      return acc;
    }, []);
  // numeri delle note: se due cadono troppo vicini, il secondo si sposta a destra
  const shownNotes = notes
    .filter((n) => n.t >= t0 && n.t <= t1)
    .reduce<(StoryNote & { dx: number })[]>((acc, n) => {
      const prev = acc[acc.length - 1];
      const gap = prev ? x(n.t) - (x(prev.t) + prev.dx) : Infinity;
      acc.push({ ...n, dx: gap < 14 ? 14 - gap : 0 });
      return acc;
    }, []);

  const pointerTime = (clientX: number) => {
    const el = svgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * width;
    return Math.max(t0, Math.min(t1, t0 + ((px - pad.left) / (width - pad.left - pad.right)) * (t1 - t0)));
  };
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const t = pointerTime(e.clientX);
    if (t === null) return;
    const st = stateAt(readings, t);
    setScrub({ t, reading: st.reading, unread: st.unread });
  };

  // il numero grande e la riga sotto: adesso, o l'ora sotto il dito
  let big: string;
  let bigClass = "mkt-big";
  let sub: React.ReactNode;
  if (scrub) {
    bigClass += " is-scrub";
    const r = scrub.reading;
    if (!r) {
      big = "—";
      sub = `${dt(scrub.t)} · ${s.scrub.notYet}`;
    } else if (scrub.unread) {
      big = "?";
      sub = `${dt(scrub.t)} · ${s.scrub.unread}`;
    } else if (r.listed && r.price !== null) {
      big = money(r.price, r.t);
      sub = `${dt(scrub.t)} · ${r.listings === 1 ? s.offersOne : fillMarket(s.offers, { n: fmt(r.listings) })}`;
    } else {
      big = s.noOffers;
      bigClass += " is-none";
      sub = `${dt(scrub.t)} · ${s.scrub.noOffers}`;
    }
  } else if (price !== null) {
    big = money(price, now);
    sub = `${s.ask} · ${listings === 1 ? s.offersOne : fillMarket(s.offers, { n: fmt(listings) })} · ${fillMarket(s.readAt, { when: dt(readAt ? Date.parse(readAt) : now) })}`;
  } else {
    big = s.noOffers;
    bigClass += " is-none";
    sub = lastListed ? fillMarket(s.lastOffer, { when: dt(lastListed.t), price: money(lastListed.price as number, lastListed.t) }) : "";
  }

  const noteText = (n: StoryNote) => {
    switch (n.kind) {
      case "first":
        return fillMarket(s.notes.first, { price: money(n.price, n.t), day: day(n.t) });
      case "drop":
        return fillMarket(s.notes.drop, { before: money(n.before ?? n.price, n.from ?? n.t), after: money(n.price, n.t), day: day(n.t) });
      case "rise":
        return fillMarket(s.notes.rise, { before: money(n.before ?? n.price, n.from ?? n.t), after: money(n.price, n.t), day: day(n.t) });
      case "gone":
        return fillMarket(s.notes.gone, { since: dt(n.from ?? n.t), until: dt(n.to ?? n.t) });
      case "back":
        return fillMarket(s.notes.back, { day: day(n.t), price: money(n.price, n.t) });
      case "seller":
        return fillMarket(s.notes.seller, { day: day(n.t), price: money(n.price, n.t) });
      default:
        return "";
    }
  };

  const change = (before: number | null) => (price !== null && before !== null ? <Change now={price} before={before} locale={locale} /> : null);
  const typicalVs = price !== null && typical ? ((price - typical.median) / typical.median) * 100 : null;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0" aria-live="polite">
          <div className={bigClass}>{big}</div>
          <p className="mt-1 text-sm text-pale">{sub}</p>
        </div>
        <CurrencySwitch locale={locale} label={labels.currency} />
      </div>

      <div className="mkt-facts">
        {price !== null && before7 !== null ? (
          <span className="mkt-fact">
            {s.change7d} {change(before7)}
          </span>
        ) : null}
        {price !== null && firstListed && firstListed.t < now - DAY_MS ? (
          <span className="mkt-fact">
            {s.sinceFirst} {change(firstListed.price)}
          </span>
        ) : null}
        {price !== null && typical && rel !== "thin" ? (
          <span className="mkt-fact">
            {s.typical} <b>{money(typical.median, now)}</b>
            {typicalVs !== null ? <span>· {Math.abs(typicalVs) < 0.5 ? s.inLine : fillMarket(s.nowVs, { pct: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" }).format(typicalVs / 100) })}</span> : null}
          </span>
        ) : null}
        {rel ? (
          <span className="mkt-fact">
            <span className={`mkt-rel is-${rel}`}>{s.reliability[rel]}</span>
            <span className="text-pale-muted">
              · {fillMarket(s.reliabilityHelp[rel], { n: fmt(typical?.n ?? 0), pct: fmt(Math.max(1, Math.round((typical?.spread ?? 0) * 100))) })}
            </span>
          </span>
        ) : null}
        {price !== null || lastListed ? (
          <details className="mkt-fact">
            <summary className="cursor-pointer">{s.fees}</summary>
            <span className="basis-full text-pale-muted">{s.feesHelp}</span>
          </details>
        ) : null}
      </div>

      <section aria-labelledby="mkt-chart-title" className="card-night mkt-chart p-3 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 id="mkt-chart-title" className="t-section">
            {s.chartTitle}
          </h2>
          <div role="group" aria-label={s.chartTitle} className="flex flex-wrap gap-1.5">
            {MARKET_RANGES.map((r) => (
              <button key={r} type="button" onClick={() => { setRange(r); setScrub(null); }} aria-pressed={range === r} className={`btn btn-choice px-3 py-1 text-xs ${range === r ? "is-on" : ""}`}>
                {labels.ranges[r]}
              </button>
            ))}
          </div>
        </div>
        <p className="pen-note is-quiet mb-1" aria-hidden="true">
          {s.scrubHint}
        </p>
        <div ref={box}>
          {values.length ? (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${H}`}
              width={width}
              height={H}
              role="img"
              aria-label={fillMarket(s.chartAria, { name })}
              onPointerMove={onPointer}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onPointer(e);
              }}
              onPointerLeave={() => setScrub(null)}
              onPointerUp={(e) => {
                if (e.pointerType !== "mouse") setScrub(null);
              }}
            >
              <defs>
                <pattern id="mkt-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,61,154,0.6)" strokeWidth="2" />
                </pattern>
              </defs>
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} stroke="var(--color-night-3)" strokeWidth={1} />
                  <text x={pad.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11.5} fill="var(--color-chalk-muted)" className="font-mono">
                    {tick(v)}
                  </text>
                </g>
              ))}
              {ctx.map((c) => {
                const cx = x(c.t);
                const end = cx + c.label.length * 6.4 + 4 > width - 2;
                return (
                  <g key={`${c.t}-${c.label}`}>
                    <line x1={cx} x2={cx} y1={pad.top - (c.row ? 2 : 14)} y2={H - pad.bottom} stroke={c.patch ? "rgba(255,233,138,0.55)" : "rgba(63,196,232,0.5)"} strokeWidth={1.5} strokeDasharray="3 4" />
                    <text x={end ? cx - 4 : cx + 4} y={c.row ? pad.top - 4 : pad.top - 16} textAnchor={end ? "end" : "start"} fontSize={11} fontWeight={800} fill={c.patch ? "var(--postit-label)" : "var(--color-sky)"} className="font-display">
                      {c.label}
                    </text>
                  </g>
                );
              })}
              {bands.map((b) => (
                <rect key={`b${b.t0}`} x={x(b.t0)} y={yBottom - 1} width={Math.max(1, x(b.t1) - x(b.t0))} height={7} fill="url(#mkt-hatch)" />
              ))}
              {lines.map((l, i) => {
                const ya = y(toCur(l.price, l.t0));
                const d = `M${x(l.t0).toFixed(1)},${ya.toFixed(1)} H${x(l.t1).toFixed(1)}${l.next !== null ? ` V${y(toCur(l.next, l.t1)).toFixed(1)}` : ""}`;
                return (
                  <path
                    key={`l${i}`}
                    d={d}
                    fill="none"
                    stroke="var(--color-chalk)"
                    strokeWidth={l.kind === "solid" ? 2.5 : 1.6}
                    strokeDasharray={l.kind === "gap" ? "4 5" : l.kind === "trail" ? "1 5" : undefined}
                    strokeLinecap="round"
                    opacity={l.kind === "solid" ? 1 : 0.75}
                  />
                );
              })}
              {chartReadings.map((r, i) => {
                const prev = chartReadings[i - 1];
                if (!r.listed || r.price === null || r.t < t0 || (prev && r.t - prev.t <= READ_GAP_MS)) return null;
                return <circle key={`p${r.t}`} cx={x(r.t)} cy={y(toCur(r.price, r.t))} r={2.6} fill="var(--color-felt)" stroke="var(--color-chalk)" strokeWidth={1.5} />;
              })}
              {lastListed && lastListed.t >= t0 ? (
                <circle cx={x(lastListed.t)} cy={y(toCur(lastListed.price as number, lastListed.t))} r={5.5} fill={price !== null ? "var(--color-mint)" : "var(--color-felt)"} stroke={price !== null ? "var(--color-mint)" : "var(--color-chalk)"} strokeWidth={2} />
              ) : null}
              {shownNotes.map((n) => {
                const px = x(n.t);
                const cx = px + n.dx;
                const cy = y(toCur(n.price, n.t));
                const up = cy > pad.top + 40;
                const ly = up ? cy - 22 : cy + 28;
                const num = notes.findIndex((m) => m.kind === n.kind && m.t === n.t) + 1;
                return (
                  <g key={`n${n.kind}${n.t}`} aria-hidden="true">
                    <line x1={px} x2={cx} y1={cy + (up ? -6 : 6)} y2={ly + (up ? 6 : -14)} stroke="var(--postit-label)" strokeWidth={1.4} />
                    <text x={cx} y={ly} textAnchor="middle" fontSize={19} fontWeight={700} fill="var(--postit-label)" style={{ fontFamily: "var(--font-hand), 'Segoe Print', cursive" }}>
                      {num}
                    </text>
                  </g>
                );
              })}
              <text x={pad.left - 8} y={H - pad.bottom + 20} textAnchor="end" fontSize={10.5} fontWeight={700} fill="var(--color-chalk-muted)" className="font-display">
                {s.offersLane}
              </text>
              {chartReadings
                .filter((r) => r.t >= t0)
                .map((r) => (
                  <rect
                    key={`o${r.t}`}
                    x={x(r.t) - 1.25}
                    y={H - pad.bottom + 16 - (r.listings > 1 ? 6 : r.listed ? 3 : 1)}
                    width={2.5}
                    height={r.listings > 1 ? 12 : r.listed ? 6 : 2}
                    rx={1}
                    fill={r.listings > 1 ? "var(--color-mint)" : r.listed ? "var(--color-sky)" : "rgba(255,61,154,0.7)"}
                  />
                ))}
              {dayTicks.map((t) => (
                <text key={`d${t}`} x={x(t)} y={H - 4} textAnchor="middle" fontSize={11} fill="var(--color-chalk-muted)">
                  {every ? day(t) : hourLabel(t)}
                </text>
              ))}
              {scrub ? (
                <g pointerEvents="none">
                  <line x1={x(scrub.t)} x2={x(scrub.t)} y1={pad.top} y2={H - pad.bottom} stroke="var(--postit-label)" strokeWidth={1.5} />
                  {scrub.reading && scrub.reading.listed && scrub.reading.price !== null && !scrub.unread ? (
                    <circle cx={x(scrub.t)} cy={y(toCur(scrub.reading.price, scrub.reading.t))} r={6} fill="var(--postit-label)" stroke="var(--color-felt)" strokeWidth={2} />
                  ) : null}
                </g>
              ) : null}
            </svg>
          ) : (
            <p className="rounded-lg border-2 border-dashed border-night-3 p-6 text-center text-sm text-pale-muted">{s.noStory}</p>
          )}
        </div>
        <div className="mkt-legend mt-2">
          <span>
            <i style={{ background: "var(--color-chalk)" }} />
            {s.legend.solid}
          </span>
          <span>
            <i style={{ background: "repeating-linear-gradient(90deg, var(--color-chalk) 0 4px, transparent 4px 9px)" }} />
            {s.legend.gap}
          </span>
          <span>
            <i style={{ background: "repeating-linear-gradient(90deg, var(--color-chalk) 0 1.5px, transparent 1.5px 6px)" }} />
            {s.legend.trail}
          </span>
          {readHours ? (
            <span>
              <i style={{ background: "repeating-linear-gradient(45deg, rgba(255,61,154,.7) 0 2px, transparent 2px 5px)" }} />
              {s.legend.none}
            </span>
          ) : null}
          {ctx.length ? (
            <span>
              <i style={{ background: "var(--postit-label)", height: 2 }} />
              {s.legend.context}
            </span>
          ) : null}
        </div>
        {inRange.length ? (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-chalk-muted">{labels.table.show}</summary>
            <div className="mt-2 max-h-80 overflow-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-chalk-muted">
                  <tr>
                    <th scope="col" className="py-1 pr-3 font-semibold">
                      {labels.table.time}
                    </th>
                    <th scope="col" className="py-1 pr-3 text-right font-semibold">
                      {labels.table.close}
                    </th>
                    <th scope="col" className="py-1 text-right font-semibold">
                      {labels.table.listings}
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums text-pale">
                  {[...inRange].reverse().map((r) => (
                    <tr key={r.t} className="border-t border-night-3">
                      <td className="py-1 pr-3 font-sans">{dt(r.t)}</td>
                      <td className="py-1 pr-3 text-right">{r.listed && r.price !== null ? money(r.price, r.t) : labels.noOffers}</td>
                      <td className="py-1 text-right">{fmt(r.listings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-labelledby="mkt-story" className="card-night p-5">
          <h2 id="mkt-story" className="t-section mb-3">
            {s.storyTitle}
          </h2>
          {notes.length ? (
            <ol className="mkt-notes">
              {notes.map((n) => (
                <li key={`${n.kind}${n.t}`}>{noteText(n)}</li>
              ))}
            </ol>
          ) : (
            <p className="text-pale-muted">{s.noStory}</p>
          )}
        </section>
        <Twins twins={twins} family={family} labels={s} toCur={toCur} money={money} now={now} />
      </div>
    </div>
  );
}

/** I pezzi della stessa famiglia, piccoli grafici gemelli sulla stessa scala (dal giornaliero); ognuno porta alla sua scheda. */
function Twins({
  twins,
  family,
  labels: s,
  toCur,
  money,
  now,
}: {
  twins: StoryTwin[];
  family: string;
  labels: MarketLabels["story"];
  toCur: (cents: number, t: number) => number;
  money: (cents: number, t: number) => string;
  now: number;
}) {
  if (twins.length < 2) {
    return (
      <section aria-labelledby="mkt-twins" className="card-night p-5">
        <h2 id="mkt-twins" className="t-section mb-3">
          {fillMarket(s.siblingsTitle, { name: family })}
        </h2>
        <p className="text-pale-muted">{fillMarket(s.onlyPiece, { name: family })}</p>
      </section>
    );
  }
  const W = 200;
  const H = 70;
  const all = twins.flatMap((t) => t.daily.map((p) => ({ t: Date.parse(p.t), v: toCur(p.close, Date.parse(p.t)) })));
  const tMin = all.length ? Math.min(...all.map((p) => p.t)) : now - 30 * DAY_MS;
  const vMax = all.length ? Math.max(...all.map((p) => p.v)) * 1.08 : 1;
  const xx = (t: number) => 3 + ((t - tMin) / Math.max(1, now - tMin)) * (W - 6);
  const yy = (v: number) => H - 5 - (v / vMax) * (H - 12);
  return (
    <section aria-labelledby="mkt-twins" className="card-night p-5">
      <h2 id="mkt-twins" className="t-section mb-3">
        {fillMarket(s.siblingsTitle, { name: family })}
      </h2>
      <div className="mkt-twins">
        {twins.map((tw) => {
          const pts = tw.daily.map((p) => ({ t: Date.parse(p.t), v: toCur(p.close, Date.parse(p.t)) })).filter((p) => Number.isFinite(p.t));
          const path = pts.map((p, i) => `${i ? `H${xx(p.t).toFixed(1)} V` : `M${xx(p.t).toFixed(1)},`}${yy(p.v).toFixed(1)}`).join(" ");
          const last = pts[pts.length - 1];
          const body = (
            <>
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={[tw.title, ...tw.tags].join(" · ")}>
                <rect x={0} y={0} width={W} height={H} rx={8} fill="rgba(14,7,31,0.45)" />
                {pts.length ? <path d={path} fill="none" stroke={tw.self ? "var(--color-mint)" : "var(--color-sky)"} strokeWidth={2.2} /> : null}
                {last ? <circle cx={xx(last.t)} cy={yy(last.v)} r={3.5} fill={tw.price !== null ? "var(--color-mint)" : "var(--color-felt)"} stroke={tw.self ? "var(--color-mint)" : "var(--color-sky)"} strokeWidth={2} /> : null}
              </svg>
              <span className="mkt-twin-cap">
                <b>{tw.tags.join(" · ") || tw.title}</b>
                {" · "}
                {tw.price !== null ? money(tw.price, now) : tw.lastPrice !== null ? `${s.noOffers} (${money(tw.lastPrice, now)})` : s.noOffers}
              </span>
            </>
          );
          return tw.href && !tw.self ? (
            <Link key={tw.slug} href={tw.href} className="mkt-twin">
              {body}
            </Link>
          ) : (
            <div key={tw.slug} className={`mkt-twin ${tw.self ? "is-self" : ""}`} aria-current={tw.self ? "page" : undefined}>
              {body}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-pale-muted">{s.siblingsNote}</p>
    </section>
  );
}
