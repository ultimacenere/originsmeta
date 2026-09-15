import type { Dictionary } from "@/lib/i18n";
import type { DeckStats } from "@/lib/deckstats";

type Labels = Dictionary["stats"];

const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/* Colori dei grafici: unità menta scura, magie inchiostro, Leggendaria oro (sempre con etichetta, mai solo colore) */
const C = { units: "#17a689", spells: "#16102a", legendary: "#f2d23c", muted: "#5e5672", grid: "rgba(22,16,42,0.12)" };

/**
 * Composizione del mazzo in SVG inline, senza librerie: curva di mana impilata, ciambella unità/magie,
 * tessere numeriche, barre per saga, parole chiave. Spazio già previsto per il win rate dalle API.
 */
export function DeckCharts({ stats, labels, partial = false }: { stats: DeckStats; labels: Labels; partial?: boolean }) {
  if (stats.known === 0) return null;
  const max = Math.max(1, ...stats.curve);
  const W = 432;
  const H = 168;
  const padL = 6;
  const padB = 26;
  const padT = 20;
  const colW = (W - padL * 2) / 9;
  const barW = colW * 0.62;
  const plotH = H - padB - padT;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const unitsPct = stats.units + stats.spells ? Math.round((stats.units / (stats.units + stats.spells)) * 100) : 0;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const maxSaga = Math.max(1, ...stats.bySaga.map((s) => s.count));

  return (
    <section className="mt-8" aria-labelledby="deck-stats-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="deck-stats-title" className="text-xl font-extrabold text-ink">
          {labels.title}
        </h2>
        <p className="font-mono text-[11px] text-ink-muted">
          {partial || stats.unknown ? fmt(labels.partial, { known: stats.known, total: stats.total }) : fmt(labels.full, { total: stats.total })}
        </p>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Curva di mana impilata */}
        <figure className="rounded-xl border border-sky/50 bg-ivory-2/60 p-4">
          <figcaption className="flex flex-wrap items-center justify-between gap-2">
            <span className="kicker text-ink-muted">{labels.curve}</span>
            <span className="flex flex-wrap gap-3 font-mono text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: C.units }} /> {labels.units}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: C.spells }} /> {labels.spells}
              </span>
              {stats.legendaryCost !== null ? (
                <span className="inline-flex items-center gap-1">
                  <i className="inline-block h-2.5 w-2.5 rounded-sm border border-sky" style={{ background: C.legendary }} /> {labels.legendary}
                </span>
              ) : null}
            </span>
          </figcaption>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-auto w-full" role="img" aria-label={labels.curveAria}>
            <line x1={padL} x2={W - padL} y1={y(0)} y2={y(0)} stroke={C.grid} strokeWidth={1} />
            {stats.curve.map((total, i) => {
              const x = padL + i * colW + (colW - barW) / 2;
              const spells = stats.curveSpells[i];
              const leg = stats.legendaryCost === i ? 1 : 0;
              const units = stats.curveUnits[i] - leg;
              const segs: { v: number; color: string; stroke?: string }[] = [
                { v: spells, color: C.spells },
                { v: units, color: C.units },
                { v: leg, color: C.legendary, stroke: C.spells },
              ];
              let acc = 0;
              return (
                <g key={i}>
                  {segs.map((s, k) => {
                    if (!s.v) return null;
                    const top = y(acc + s.v);
                    const h = y(acc) - top;
                    acc += s.v;
                    return <rect key={k} x={x} y={top} width={barW} height={h} fill={s.color} stroke={s.stroke} strokeWidth={s.stroke ? 1 : 0} rx={k === segs.length - 1 || acc === total ? 3 : 0} />;
                  })}
                  {total ? (
                    <text x={x + barW / 2} y={y(total) - 5} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={C.spells}>
                      {total}
                    </text>
                  ) : null}
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={C.muted}>
                    {i === 8 ? "8+" : i}
                  </text>
                </g>
              );
            })}
          </svg>
        </figure>

        {/* Tessere + ciambella */}
        <div className="grid grid-cols-2 gap-3">
          <Tile label={labels.avgCost} value={stats.avgCost !== null ? String(stats.avgCost) : "–"} />
          <Tile label={labels.byTurn3} value={String(stats.byTurn3)} hint={labels.copies} />
          <Tile label={labels.power} value={String(stats.power)} hint={stats.avgPower !== null ? `${labels.perUnit} ${stats.avgPower}` : undefined} />
          <Tile label={labels.health} value={String(stats.health)} hint={stats.avgHealth !== null ? `${labels.perUnit} ${stats.avgHealth}` : undefined} />
          <figure className="col-span-2 flex items-center gap-4 rounded-xl border border-sky/50 bg-ivory-2/60 p-4">
            <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" role="img" aria-label={`${labels.units} ${stats.units} · ${labels.spells} ${stats.spells}`}>
              <circle cx={40} cy={40} r={r} fill="none" stroke={C.spells} strokeWidth={10} />
              <circle cx={40} cy={40} r={r} fill="none" stroke={C.units} strokeWidth={10} strokeDasharray={`${(unitsPct / 100) * circ} ${circ}`} transform="rotate(-90 40 40)" strokeLinecap="butt" />
              <circle cx={40} cy={40} r={r - 6} fill="var(--color-ivory)" />
              <text x={40} y={44} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily="var(--font-display)" fill={C.spells}>
                {stats.units + stats.spells}
              </text>
            </svg>
            <figcaption className="text-sm text-ink">
              <p className="kicker text-ink-muted">{labels.types}</p>
              <p className="mt-1">
                <strong>{stats.units}</strong> {labels.units.toLowerCase()} · <strong>{stats.spells}</strong> {labels.spells.toLowerCase()}
              </p>
              <p className="font-mono text-[11px] text-ink-muted">
                {labels.early} {stats.bands.early} · {labels.mid} {stats.bands.mid} · {labels.late} {stats.bands.late}
              </p>
            </figcaption>
          </figure>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Saghe */}
        <figure className="rounded-xl border border-sky/50 bg-ivory-2/60 p-4">
          <figcaption className="kicker text-ink-muted">{labels.sagas}</figcaption>
          <ul className="mt-2 space-y-1.5">
            {stats.bySaga.map((s) => (
              <li key={s.saga} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm text-ink">
                <span className="flex items-center gap-2">
                  <span className="w-36 shrink-0 truncate sm:w-44">{s.label}</span>
                  <span className="h-2.5 flex-1 rounded-full bg-ink/10">
                    <span className="block h-2.5 rounded-full" style={{ width: `${(s.count / maxSaga) * 100}%`, background: C.units }} />
                  </span>
                </span>
                <span className="font-mono text-xs text-ink-muted">{s.count}</span>
              </li>
            ))}
          </ul>
          {stats.legendary ? (
            <p className="mt-3 text-xs text-ink-muted">{fmt(labels.synergy, { n: stats.sameSagaAsLegendary, legendary: stats.legendary.name })}</p>
          ) : null}
        </figure>

        {/* Parole chiave + estremi + win rate (in arrivo) */}
        <div className="grid gap-4">
          <figure className="rounded-xl border border-sky/50 bg-ivory-2/60 p-4">
            <figcaption className="kicker text-ink-muted">{labels.keywords}</figcaption>
            {stats.keywords.length ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {stats.keywords.map((k) => (
                  <li key={k.keyword} className="stat-pill bg-ivory-3 text-ink">
                    {k.keyword} <span className="text-ink-muted">×{k.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">{labels.noKeywords}</p>
            )}
            {stats.topEnd || stats.cheapest ? (
              <p className="mt-3 font-mono text-[11px] text-ink-muted">
                {stats.topEnd ? `${labels.topEnd}: ${stats.topEnd.name} (${stats.topEnd.mana})` : ""}
                {stats.topEnd && stats.cheapest ? " · " : ""}
                {stats.cheapest ? `${labels.cheapest}: ${stats.cheapest.name} (${stats.cheapest.mana})` : ""}
              </p>
            ) : null}
          </figure>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-sky/70 p-4">
            <div>
              <p className="kicker text-ink-muted">{labels.winrate}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink/40">–</p>
            </div>
            <p className="max-w-[16rem] text-right text-xs text-ink-muted">{labels.winrateSoon}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-sky/50 bg-ivory-2/60 p-4">
      <p className="kicker text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none text-ink tabular-nums">{value}</p>
      {hint ? <p className="mt-1 font-mono text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}
