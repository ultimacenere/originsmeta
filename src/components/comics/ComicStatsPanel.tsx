import Link from "@/components/IntentLink";
import { formatDate, href, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { comicRoleOf, listOwnComics } from "@/lib/community/comicQueries";
import { comicPath, type ComicListItem } from "@/lib/community/comics";
import { authorName } from "@/lib/community/util";
import { shiftDay, utcDay, type Counts } from "@/lib/community/deckStats";
import { COMIC_SERIES_DAYS, combineComicSummaries, readRate, summarizeComics, type ComicStatSummary, type LangCounts } from "@/lib/community/comicStats";
import { readComicStaffRanking, readOwnComicStats, type RankedComicInfo } from "@/lib/community/comicStatsQueries";
import { comicStatsLabels, type ComicStatsLabels } from "@/lib/comicStatsLabels";
import { fillStats } from "@/lib/deckStatsLabels";
import { COMIC_LANG_NAMES } from "@/lib/comicLabels";
import { STAT_COLORS, StatBars, StatSparkline, StatTile } from "@/components/stats/StatsWidgets";

type Props = {
  /** client con la sessione dell'utente (quello di /account): la policy SQL decide che cosa vede */
  supabase: Db;
  userId: string;
  locale: Locale;
};

const statusStyle = { draft: "bg-night-3 text-pale", hidden: "bg-crimson-deep text-chalk" } as const;

/**
 * "Statistiche dei fumetti" in /account (02/11/2026; Pierluigi: "aggiungi le statistiche di visita dei fumetti nel pannello
 * di Vega, come per i mazzi"): per ogni fumetto dell'utente visite e letture complete negli ultimi 7 e 30 giorni e in
 * totale, i totali per lingua della pagina, il grafico al giorno e la quota di visite arrivate all'ultima tavola; per
 * admin e tag Staff anche la classifica di tutti i fumetti per visite. Componente server dentro un <Suspense> di /account,
 * come DeckStatsPanel, con gli stessi pezzi grafici (StatsWidgets). Non compare a chi non ha fumetti (e non è dello
 * staff) né prima della migrazione del blocco FUMETTI (tabella dei fumetti assente).
 */
export async function ComicStatsPanel({ supabase, userId, locale }: Props) {
  const L = comicStatsLabels[locale];
  const [{ status, comics }, role] = await Promise.all([listOwnComics(supabase, userId), comicRoleOf(supabase, userId)]);
  if (status === "missing" || (!comics.length && !role.staff)) return null;
  const ids = comics.map((c) => c.id);
  const today = utcDay(new Date());
  const [own, staff] = await Promise.all([readOwnComicStats(supabase, ids), role.staff ? readComicStaffRanking(supabase, today) : null]);
  const per = summarizeComics(ids, own.rows, today);
  const all = combineComicSummaries([...per.values()]);
  const nf = new Intl.NumberFormat(locale);
  const n = (v: number) => nf.format(v);
  const periods = { d7: L.d7, d30: L.d30, total: L.total };
  const pct = (reads: number, views: number) => {
    const r = readRate(reads, views);
    return r === null ? "–" : `${n(r)}%`;
  };
  const langName = (lang: Locale) => COMIC_LANG_NAMES[locale][lang];
  // fumetti dal più visto negli ultimi 30 giorni, poi per titolo
  const ordered = [...comics].sort((a, b) => (per.get(b.id)?.views.d30 ?? 0) - (per.get(a.id)?.views.d30 ?? 0) || a.title.localeCompare(b.title, locale));

  return (
    <section id="comic-stats" className="mt-12 scroll-mt-24" aria-labelledby="comic-stats-panel-title">
      <h2 id="comic-stats-panel-title" className="t-section">
        {L.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.intro}</p>

      {!own.available ? (
        <div className="card-night mt-4 p-6">
          <p className="text-pale-muted">{L.unavailable}</p>
        </div>
      ) : comics.length ? (
        <>
          <p className="mt-2 font-mono text-xs text-pale-muted">{all.firstDay ? fillStats(L.since, { date: formatDate(locale, all.firstDay) }) : L.noData}</p>

          {/* Tutti i fumetti insieme: 30 giorni in grande, 7 giorni e totale sotto */}
          <h3 className="kicker mt-5 text-pale-muted">{L.allComics}</h3>
          <ul className="mt-2 grid grid-cols-2 gap-3">
            <StatTile label={L.views} counts={all.views} periods={periods} n={n} />
            <StatTile label={L.reads} counts={all.reads} periods={periods} n={n} extra={`${L.readRate} ${pct(all.reads.total, all.views.total)}`} />
          </ul>
          <LangLine langs={all.langs} L={L} n={n} name={langName} />

          <figure className="mt-4 rounded-xl border-2 border-sky bg-night-2/60 p-4">
            <figcaption className="kicker text-pale-muted">{L.chartTitle}</figcaption>
            <div role="img" aria-label={fillStats(L.chartAria, { views: n(sum(all.series.views)), reads: n(sum(all.series.reads)) })}>
              <StatBars values={all.series.views} color={STAT_COLORS.a} label={L.views} heightClass="h-24" n={n} />
              <StatBars values={all.series.reads} color={STAT_COLORS.b} label={L.reads} heightClass="h-14" n={n} dates={{ first: shiftDay(today, -((all.series.views.length || COMIC_SERIES_DAYS) - 1)), locale }} />
            </div>
          </figure>

          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {ordered.map((comic) => {
              const s = per.get(comic.id);
              if (!s) return null;
              return <ComicCard key={comic.id} comic={comic} summary={s} locale={locale} L={L} n={n} pct={pct} name={langName} />;
            })}
          </ul>
        </>
      ) : null}

      {staff && (staff.available || own.available) ? <StaffRanking ranking={staff} locale={locale} L={L} n={n} /> : null}

      {own.available ? <p className="mt-4 max-w-3xl text-xs text-pale-muted">{L.estimate}</p> : null}
    </section>
  );
}

const sum = (a: readonly number[]) => a.reduce((s, x) => s + x, 0);

/** I totali per lingua della pagina, dalla più vista: "inglese 367 · spagnolo 187 · italiano 136". */
function LangLine({ langs, L, n, name }: { langs: readonly LangCounts[]; L: ComicStatsLabels; n: (v: number) => string; name: (lang: Locale) => string }) {
  if (!langs.length) return null;
  return (
    <p className="mt-3 text-sm text-pale">
      <span className="kicker text-pale-muted">{L.byLang}</span>{" "}
      <span className="font-mono text-xs tabular-nums">
        {langs.map((l, i) => (
          <span key={l.lang}>
            {i ? " · " : ""}
            {name(l.lang)} <strong className="text-sky">{n(l.views.total)}</strong>
          </span>
        ))}
      </span>
    </p>
  );
}

/** La scheda di un fumetto: titolo, stato, andamento, tabella su 7 e 30 giorni e totale, lingue. */
function ComicCard({ comic, summary: s, locale, L, n, pct, name }: { comic: ComicListItem; summary: ComicStatSummary; locale: Locale; L: ComicStatsLabels; n: (v: number) => string; pct: (reads: number, views: number) => string; name: (lang: Locale) => string }) {
  const rows: { label: string; fmt: (k: keyof Counts) => string }[] = [
    { label: L.views, fmt: (k) => n(s.views[k]) },
    { label: L.reads, fmt: (k) => n(s.reads[k]) },
    { label: L.readRate, fmt: (k) => pct(s.reads[k], s.views[k]) },
  ];
  return (
    <li className="card-night flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {comic.status !== "published" ? <span className={`stat-pill text-[11px] font-semibold uppercase ${statusStyle[comic.status]}`}>{comic.status === "hidden" ? L.hidden : L.draft}</span> : null}
          <h3 className="t-item mt-1 break-words leading-tight">
            {comic.status === "published" ? (
              <Link href={href(locale, comicPath(comic.slug))} className="text-sky hover:underline">
                {comic.title}
              </Link>
            ) : (
              comic.title
            )}
          </h3>
        </div>
        <StatSparkline values={s.series.views} />
      </div>
      <table className="mt-3 w-full text-xs">
        <caption className="sr-only">{comic.title}</caption>
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
                  {r.fmt(k)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <LangLine langs={s.langs} L={L} n={n} name={name} />
    </li>
  );
}

/** Classifica dello staff: i fumetti più visti negli ultimi 30 giorni, fra tutti quelli pubblicati. */
function StaffRanking({ ranking, locale, L, n }: { ranking: { available: boolean; complete: boolean; ranked: RankedComicInfo[] }; locale: Locale; L: ComicStatsLabels; n: (v: number) => string }) {
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
            <li key={r.comic_id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border-2 border-night-3 px-3 py-2 text-sm text-pale">
              <span className="w-6 shrink-0 font-mono text-xs text-pale-muted">{i + 1}.</span>
              <span className="min-w-0 flex-1 basis-48">
                {r.comic ? (
                  r.comic.status === "published" ? (
                    <Link href={href(locale, comicPath(r.comic.slug))} className="font-semibold text-sky hover:underline">
                      {r.comic.title}
                    </Link>
                  ) : (
                    <span className="font-semibold">
                      {r.comic.title} <span className="text-xs text-pale-muted">({r.comic.status === "hidden" ? L.hidden : L.draft})</span>
                    </span>
                  )
                ) : (
                  <span className="text-pale-muted">{L.notVisible}</span>
                )}
                {r.comic?.profile ? (
                  <span className="text-xs text-pale-muted">
                    {" "}
                    {L.by} {authorName(r.comic.profile)}
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-xs tabular-nums text-pale-muted">
                <strong className="font-display text-base text-sky">{n(r.views30)}</strong> {L.views.toLowerCase()} · {L.d7} {n(r.views7)} · {L.reads.toLowerCase()} {n(r.reads30)}
              </span>
            </li>
          ))}
        </ol>
      )}
      {ranking.available && !ranking.complete ? <p className="mt-3 text-xs text-pale-muted">{L.partial}</p> : null}
    </div>
  );
}
