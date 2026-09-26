import Link from "next/link";
import { formatDate, formatDateShort, href, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import type { CommunityDeck } from "@/lib/community/types";
import { authorName } from "@/lib/community/util";
import { SERIES_DAYS, averageStars, combineSummaries, niceCeil, shiftDay, summarizeDecks, utcDay, type Counts, type DeckStatSummary } from "@/lib/community/deckStats";
import { readOwnDeckStats, readStaffRanking, readStatsViewer, type RankedDeckInfo } from "@/lib/community/deckStatsQueries";
import { deckStatsLabels, fillStats, type DeckStatsLabels } from "@/lib/deckStatsLabels";

/* Colori dei grafici come DeckCharts: menta per le visite, celeste per le copie (sempre con legenda, mai solo colore) */
const C = { views: "#31e3bd", code: "#3fc4e8", muted: "#8e9bb1", grid: "rgba(216,222,231,0.14)" };

type Props = {
  /** client con la sessione dell'utente (quello di /account): la policy SQL decide che cosa vede */
  supabase: Db;
  userId: string;
  /** i mazzi pubblicati e nascosti dell'utente (non le bozze private) */
  decks: CommunityDeck[];
  locale: Locale;
};

/**
 * "Le tue statistiche" in /account (pacchetto STATS, 26/09/2026): per ogni mazzo pubblicato dell'utente visite, copie
 * del codice del gioco, voti e media, clic sui link e video avviati negli ultimi 7 e 30 giorni e in totale, con il
 * grafico delle visite al giorno; per admin e tag Staff anche la classifica di tutti i mazzi per visite. Componente
 * server: /account è dinamica, niente dati nel browser. Grafici in SVG inline come DeckCharts, senza librerie. Non
 * compare a chi non ha mazzi (e non è dello staff).
 */
export async function DeckStatsPanel({ supabase, userId, decks, locale }: Props) {
  const L = deckStatsLabels[locale];
  const viewer = await readStatsViewer(supabase, userId);
  if (!decks.length && !viewer.staff) return null;
  const today = utcDay(new Date());
  const ids = decks.map((d) => d.id);
  const [own, staff] = await Promise.all([readOwnDeckStats(supabase, ids), viewer.staff ? readStaffRanking(supabase, today) : Promise.resolve(null)]);
  const per = summarizeDecks(ids, own.rows, own.votes, today);
  const all = combineSummaries([...per.values()]);
  const nf = new Intl.NumberFormat(locale);
  const n = (v: number) => nf.format(v);
  const avg = (stars: number, votes: number) => {
    const a = averageStars(stars, votes);
    return a === null ? "–" : `★ ${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(a)}`;
  };
  // mazzi dal più visto negli ultimi 30 giorni, poi per nome
  const ordered = [...decks].sort((a, b) => (per.get(b.id)?.views.d30 ?? 0) - (per.get(a.id)?.views.d30 ?? 0) || a.name.localeCompare(b.name, locale));

  return (
    <section id="stats" className="mt-12 scroll-mt-24" aria-labelledby="deck-stats-panel-title">
      <h2 id="deck-stats-panel-title" className="t-section">
        {L.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.intro}</p>

      {!own.available ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.unavailable}</p>
        </div>
      ) : decks.length ? (
        <>
          <p className="mt-2 font-mono text-xs text-pale-muted">{all.firstDay ? fillStats(L.since, { date: formatDate(locale, all.firstDay) }) : L.noData}</p>

          {/* Tutti i mazzi insieme: 30 giorni in grande, 7 giorni e totale sotto */}
          <h3 className="kicker mt-5 text-pale-muted">{L.allDecks}</h3>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Tile label={L.views} counts={all.views} L={L} n={n} />
            <Tile label={L.codeCopies} counts={all.code} L={L} n={n} />
            <Tile label={L.votes} counts={all.votes} L={L} n={n} extra={avg(all.stars.total, all.votes.total)} />
            <Tile label={L.linkClicks} counts={all.link} L={L} n={n} />
            <Tile label={L.videoPlays} counts={all.video} L={L} n={n} />
          </ul>

          <DailyBars summary={all} today={today} locale={locale} L={L} n={n} />

          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {ordered.map((deck) => {
              const s = per.get(deck.id);
              if (!s) return null;
              const rows: { label: string; c: Counts; fmt?: (k: keyof Counts) => string }[] = [
                { label: L.views, c: s.views },
                { label: L.codeCopies, c: s.code },
                { label: L.votes, c: s.votes },
                { label: L.average, c: s.votes, fmt: (k) => avg(s.stars[k], s.votes[k]) },
                { label: L.linkClicks, c: s.link },
                { label: L.videoPlays, c: s.video },
              ];
              return (
                <li key={deck.id} className="card-night flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {deck.status === "hidden" ? <span className="stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{L.hidden}</span> : null}
                      <p className="t-item mt-1 leading-tight">
                        {deck.status === "published" ? (
                          <Link href={href(locale, `/decks/community/${deck.slug}`)} className="text-sky hover:underline">
                            {deck.name}
                          </Link>
                        ) : (
                          deck.name
                        )}
                      </p>
                    </div>
                    <Sparkline values={s.series.views} />
                  </div>
                  <table className="mt-3 w-full text-xs">
                    <thead>
                      <tr className="text-right">
                        <th scope="col" className="kicker py-1 text-left text-chalk-muted">
                          {L.metric}
                        </th>
                        <th scope="col" className="kicker py-1 pl-2 text-chalk-muted">
                          {L.d7}
                        </th>
                        <th scope="col" className="kicker py-1 pl-2 text-chalk-muted">
                          {L.d30}
                        </th>
                        <th scope="col" className="kicker py-1 pl-2 text-chalk-muted">
                          {L.total}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.label} className="border-t border-night-3 text-pale">
                          <th scope="row" className="py-1 text-left font-semibold">
                            {r.label}
                          </th>
                          {(["d7", "d30", "total"] as const).map((k) => (
                            <td key={k} className="py-1 pl-2 text-right font-mono tabular-nums">
                              {r.fmt ? r.fmt(k) : n(r.c[k])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {/* con la tabella illeggibile basta l'avviso qui sopra, una volta */}
      {staff && (staff.available || own.available) ? <StaffRanking ranking={staff} locale={locale} L={L} n={n} /> : null}

      {own.available ? <p className="mt-4 max-w-3xl text-xs text-pale-muted">{L.estimate}</p> : null}
    </section>
  );
}

/** Tessera del riepilogo: 30 giorni in grande, sotto 7 giorni, totale ed eventuale media. */
function Tile({ label, counts, L, n, extra }: { label: string; counts: Counts; L: DeckStatsLabels; n: (v: number) => string; extra?: string }) {
  return (
    <li className="rounded-xl border-2 border-sky bg-night-2/60 p-4">
      <p className="kicker text-pale-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none text-sky tabular-nums">
        {n(counts.d30)} <span className="font-mono text-[11px] font-normal text-pale-muted">{L.d30}</span>
      </p>
      <p className="mt-1 font-mono text-[11px] text-pale-muted">
        {L.d7} {n(counts.d7)} · {L.total} {n(counts.total)}
        {extra ? ` · ${extra}` : ""}
      </p>
    </li>
  );
}

/**
 * Visite e copie del codice per giorno, ultimi 30 giorni: due strisce con la loro scala (le copie sono poche rispetto
 * alle visite e su una scala sola sparirebbero), l'asse dei giorni sotto la seconda. I numeri esatti stanno nelle
 * tessere e nelle tabelle; per i lettori di schermo la figura ha i totali in `aria-label`.
 */
function DailyBars({ summary, today, locale, L, n }: { summary: DeckStatSummary; today: string; locale: Locale; L: DeckStatsLabels; n: (v: number) => string }) {
  const { views, code } = summary.series;
  const days = views.length || SERIES_DAYS;
  const first = shiftDay(today, -(days - 1));
  const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
  return (
    <figure className="mt-4 rounded-xl border-2 border-sky bg-night-2/60 p-4">
      <figcaption className="kicker text-pale-muted">{L.chartTitle}</figcaption>
      <div role="img" aria-label={fillStats(L.chartAria, { views: n(sum(views)), copies: n(sum(code)) })} className="mt-2">
        <Bars values={views} color={C.views} label={L.views} height={120} n={n} />
        <Bars values={code} color={C.code} label={L.codeCopies} height={78} n={n} dates={{ first, locale }} />
      </div>
    </figure>
  );
}

/** Una striscia di barre giornaliere con la sua scala; `dates` aggiunge sotto primo, mezzo e ultimo giorno. */
function Bars({ values, color, label, height, n, dates }: { values: number[]; color: string; label: string; height: number; n: (v: number) => string; dates?: { first: string; locale: Locale } }) {
  const days = values.length;
  const max = niceCeil(Math.max(0, ...values));
  const W = 600;
  const padL = 30;
  const padR = 6;
  const padT = 16;
  const padB = dates ? 22 : 6;
  const H = height + (dates ? 16 : 0);
  const colW = (W - padL - padR) / Math.max(1, days);
  const plotH = H - padT - padB;
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const ticks = [0, Math.floor((days - 1) / 2), days - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true" focusable="false">
      <text x={padL} y={10} fontSize={11} fontFamily="var(--font-mono)" fill={color}>
        {label}
      </text>
      {[0, max].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={1} />
          <text x={padL - 5} y={y(v) + 4} textAnchor="end" fontSize={10} fontFamily="var(--font-mono)" fill={C.muted}>
            {n(v)}
          </text>
        </g>
      ))}
      {values.map((v, i) => (v ? <rect key={i} x={padL + i * colW + colW * 0.15} y={y(v)} width={colW * 0.7} height={y(0) - y(v)} fill={color} rx={2} /> : null))}
      {dates
        ? ticks.map((i) => (
            <text key={i} x={padL + i * colW + colW / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === days - 1 ? "end" : "middle"} fontSize={10} fontFamily="var(--font-mono)" fill={C.muted}>
              {formatDateShort(dates.locale, shiftDay(dates.first, i))}
            </text>
          ))
        : null}
    </svg>
  );
}

/** Andamento delle visite di un mazzo negli ultimi 30 giorni (i numeri sono nella tabella accanto). */
function Sparkline({ values }: { values: number[] }) {
  const W = 96;
  const H = 28;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(H - 2 - (v / max) * (H - 4)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-24 shrink-0" aria-hidden="true" focusable="false">
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill="rgba(49,227,189,0.15)" stroke="none" />
      <polyline points={pts} fill="none" stroke={C.views} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/** Classifica dello staff: i mazzi più visti negli ultimi 30 giorni, fra tutti quelli pubblicati. */
function StaffRanking({ ranking, locale, L, n }: { ranking: { available: boolean; ranked: RankedDeckInfo[] }; locale: Locale; L: DeckStatsLabels; n: (v: number) => string }) {
  return (
    <div className="card-night mt-8 p-5 sm:p-6">
      <h3 className="t-item text-sky">{L.staffTitle}</h3>
      <p className="mt-1 text-sm text-chalk-muted">{L.staffIntro}</p>
      {!ranking.available ? (
        <p className="mt-3 text-sm text-pale-muted">{L.unavailable}</p>
      ) : !ranking.ranked.length ? (
        <p className="mt-3 text-sm text-pale-muted">{L.staffEmpty}</p>
      ) : (
        <ol className="mt-4 grid grid-cols-1 gap-2">
          {ranking.ranked.map((r, i) => (
            <li key={r.deck_id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border-2 border-night-3 px-3 py-2 text-sm text-pale">
              <span className="w-6 shrink-0 font-mono text-xs text-pale-muted">{i + 1}.</span>
              <span className="min-w-0 flex-1 basis-48">
                {r.deck ? (
                  r.deck.status === "published" ? (
                    <Link href={href(locale, `/decks/community/${r.deck.slug}`)} className="font-semibold text-sky hover:underline">
                      {r.deck.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">
                      {r.deck.name} <span className="text-xs text-pale-muted">({L.hidden})</span>
                    </span>
                  )
                ) : (
                  <span className="text-pale-muted">{L.notVisible}</span>
                )}
                {r.deck?.profile ? (
                  <span className="text-xs text-pale-muted">
                    {" "}
                    {L.by} {authorName(r.deck.profile)}
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-xs tabular-nums text-pale-muted">
                <strong className="font-display text-base text-sky">{n(r.views30)}</strong> {L.views.toLowerCase()} · {L.d7} {n(r.views7)} · {L.codeCopies.toLowerCase()} {n(r.code30)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
