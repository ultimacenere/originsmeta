import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "@/components/IntentLink";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { analyticsLegendariesLabels } from "@/lib/analyticsLegendariesLabels";
import { loadSections, patchName, sectionHref, type SearchParams } from "@/lib/community/analyticsSections";
import { byPrudent, moveOf, type Move, type SecLegendary } from "@/lib/tracker/sections";
import { BANDS, band, fmtDec, fmtInt, pct } from "@/lib/tracker/snapshot";
import type { Locale } from "@/lib/i18n";
import { GameCardFace, toGameCardInput } from "@/components/GameCard";
import { Band, MoveTag, SecHead, Spark, WrBar, fill, rich } from "@/components/analytics/sections/parts";
import "@/components/analytics/sections/legendaries/legendaries.css";

/*
  Sezione «Leggendarie» di Analytics (27/11/2026, Analytics a sezioni; dal prototipo rifinito lo stesso giorno). Il podio
  delle prime tre sul palco, poi le Leggendarie divise per fascia di risultato come il tabellone di /analytics di prima
  (dalla forbice al 95%, `band` di snapshot.ts), e la tabella completa chiusa in fondo. Contate a due lati, ordinate per il
  caso peggiore (bordo basso dell'intervallo). Dietro il muro per gli iscritti: noindex, Google vede la pagina sfocata.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const T = analyticsLegendariesLabels[locale].list;
  return dropHreflang(pageMeta(locale, "/analytics/legendaries", T.metaTitle, T.metaDescription, undefined, { noindex: true }));
}

export default async function LegendariesPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const C = analyticsSectionsLabels[locale].common;
  const T = analyticsLegendariesLabels[locale].list;
  const sez = await loadSections(searchParams);
  if (!sez) {
    return (
      <Band tone="stage" top>
        <SecHead as="h1" title={T.title} brief={[C.unavailable]} />
      </Band>
    );
  }
  const { all, cur, prev } = sez;
  const P = (r: number) => pct(r, locale, 0);
  const games = (n: number) => (n === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(n, locale) }));
  const name = (slug: string) => getCard(slug)?.name ?? slug;
  const pts = (m: Move) => fill(analyticsLegendariesLabels[locale].page.points, { n: `${m.points > 0 ? "+" : "−"}${fmtDec(Math.abs(m.points), locale, 1)}` });
  const prevName = prev ? patchName(prev.patch, locale) : "";

  const rows = [...cur.legendaries].sort(byPrudent);
  const moves = new Map(rows.map((l) => [l.slug, moveOf(prev?.legendaries.find((x) => x.slug === l.slug), l)]));

  /* le cose da sapere, la più importante per prima */
  const brief: ReactNode[] = [];
  const top = rows[0];
  const mostPlayed = [...rows].sort((a, b) => b.games - a.games)[0];
  if (top) brief.push(rich(T.briefTop, { name: name(top.slug), wr: P(top.r), games: games(top.games), share: P(top.share) }));
  if (mostPlayed && mostPlayed.slug !== top?.slug) brief.push(rich(T.briefPlayed, { name: name(mostPlayed.slug), share: P(mostPlayed.share) }));
  if (prev) {
    const sure = rows.flatMap((l) => {
      const m = moves.get(l.slug);
      return m && m.sure ? [{ l, m }] : [];
    });
    const rise = [...sure].sort((a, b) => b.m.points - a.m.points)[0];
    const fall = [...sure].sort((a, b) => a.m.points - b.m.points)[0];
    if (rise && rise.m.points > 0) brief.push(rich(T.briefRise, { prev: prevName, name: name(rise.l.slug), pts: pts(rise.m) }));
    else if (fall && fall.m.points < 0) brief.push(rich(T.briefFall, { prev: prevName, name: name(fall.l.slug), pts: pts(fall.m) }));
    else brief.push(fill(T.briefNoMove, { prev: prevName }));
  }
  const bottom = rows.at(-1);
  if (bottom && bottom.slug !== top?.slug && brief.length < 3) brief.push(rich(T.briefBottom, { name: name(bottom.slug), wr: P(bottom.r), games: games(bottom.games) }));

  const podium = rows.slice(0, 3);
  const medals = T.medals.split("|");
  const groups = BANDS.map((b) => ({ b, legs: rows.filter((l) => band(l) === b) })).filter((g) => g.legs.length);
  const href = (slug: string) => sectionHref(locale, `/legendaries/${slug}`, sez);

  return (
    <>
      <Band tone="stage" top>
        <SecHead as="h1" title={T.title} brief={brief} />
        <div className={`an-podium has-${podium.length}`}>
          {podium.map((l, i) => {
            const card = getCard(l.slug);
            return (
              <article key={l.slug} className={`an-pod is-p${i + 1}`}>
                <Link href={href(l.slug)} prefetch={false} className="an-pod-card" aria-label={fill(T.open, { name: name(l.slug) })}>
                  {card ? <GameCardFace input={toGameCardInput(card, locale)} lang={locale} /> : null}
                </Link>
                <div className="an-panel an-pod-plate">
                  <span className="an-medal">{medals[i]}</span>
                  <h3>{name(l.slug)}</h3>
                  <div className="an-big-wr">{pct(l.r, locale, 1)}</div>
                  <WrBar n={l} locale={locale} className="mx-auto mt-2 max-w-[200px]" />
                  <div className="an-pod-meta">
                    {games(l.games)} · {fill(C.range, { lo: P(l.lo), hi: P(l.hi) })}
                    <br />
                    {fill(T.share, { p: P(l.share) })} · <MoveTag m={moves.get(l.slug) ?? null} locale={locale} labels={C} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Band>

      <Band tone="felt">
        <SecHead title={T.bandsTitle} brief={[T.bandsLead]} />
        <div className="lg-bands">
          {groups.map(({ b, legs }) => (
            <section key={b} className={`lg-band is-${b}`} aria-label={T.bands[b]}>
              <h3 className="lg-band-title">
                {T.bands[b]} <span>{legs.length}</span>
              </h3>
              <ul className="lg-band-cards">
                {legs.map((l) => (
                  <BandCard key={l.slug} l={l} locale={locale} href={href(l.slug)} move={moves.get(l.slug) ?? null} />
                ))}
              </ul>
            </section>
          ))}
        </div>
        {prev ? <p className="sez-note mt-4">{fill(T.prev, { patch: prevName })}</p> : null}
      </Band>

      <Band tone="deep">
        <details className="lg-table">
          <summary>
            <span className="sez-h2">{T.tableTitle}</span>
            <span className="sez-note">{T.tableLead}</span>
          </summary>
          <ol className="lg-list">
            {rows.map((l, i) => {
              const card = getCard(l.slug);
              const points = all.map((p) => p.legendaries.find((x) => x.slug === l.slug)?.r ?? null);
              return (
                <li key={l.slug}>
                  <Link href={href(l.slug)} prefetch={false} className={`lg-row${l.games < 20 ? " sez-thin" : ""}`} aria-label={fill(T.open, { name: name(l.slug) })}>
                    <span className="lg-rank" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="lg-face" aria-hidden="true">
                      {card?.art ? (
                        // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, WebP piccolo
                        <img src={card.art} alt="" loading="lazy" decoding="async" />
                      ) : null}
                    </span>
                    <span className="lg-name">
                      <b>{name(l.slug)}</b>
                      <span>{fill(T.share, { p: P(l.share) })}</span>
                    </span>
                    <span className="lg-wr">
                      <span className="lg-wr-top">
                        <span>
                          <span className="sez-num">{P(l.r)}</span> {T.wr}
                        </span>
                        <span>{games(l.games)}</span>
                      </span>
                      <WrBar n={l} locale={locale} />
                    </span>
                    <span className="lg-move">
                      <MoveTag m={moves.get(l.slug) ?? null} locale={locale} labels={C} />
                    </span>
                    <span className="lg-spark">
                      <Spark points={points} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </details>
      </Band>
    </>
  );
}

function BandCard({ l, locale, href, move }: { l: SecLegendary; locale: Locale; href: string; move: Move | null }) {
  const C = analyticsSectionsLabels[locale].common;
  const T = analyticsLegendariesLabels[locale].list;
  const card = getCard(l.slug);
  const games = l.games === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(l.games, locale) });
  return (
    <li className={`lg-bcard${l.games < 20 ? " sez-thin" : ""}`}>
      <Link href={href} prefetch={false} aria-label={fill(T.open, { name: card?.name ?? l.slug })}>
        <span className="lg-bcard-face">{card ? <GameCardFace input={toGameCardInput(card, locale)} lang={locale} /> : null}</span>
        <span className="lg-bcard-wr">
          <span className="sez-num">{pct(l.r, locale, 0)}</span> <MoveTag m={move} locale={locale} labels={C} />
        </span>
        <span className="lg-bcard-sub">
          {games} · {fill(T.shareShort, { p: pct(l.share, locale, 0) })}
        </span>
      </Link>
    </li>
  );
}

