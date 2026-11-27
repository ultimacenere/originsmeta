import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "@/components/IntentLink";
import { href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { getCard, type ChangeKind } from "@/lib/data/cards";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { analyticsLegendariesLabels } from "@/lib/analyticsLegendariesLabels";
import { deckLinks, loadAllPatches, loadSections, patchName, publishedByList, sectionHref, type SearchParams } from "@/lib/community/analyticsSections";
import { apart, byPrudent, cardsOfLegendary, listKeyOf, moveOf, type CardWith, type SecMatchup } from "@/lib/tracker/sections";
import { fmtDec, fmtInt, pct } from "@/lib/tracker/snapshot";
import { GameCardFace, toGameCardInput } from "@/components/GameCard";
import { Band, MoveTag, SecHead, WrBar, fill, rich } from "@/components/analytics/sections/parts";
import { CopyCode } from "@/components/analytics/sections/CopyCode";
import "@/components/analytics/sections/legendaries/legendaries.css";

/*
  Pagina di una Leggendaria in Analytics (27/11/2026, Analytics a sezioni; dal prototipo rifinito lo stesso giorno). Fasce
  come /analytics: in cima la carta e le tre cose da sapere, poi le carte che porta (dalle liste esatte registrate: quanto
  spesso e, al tocco, come vanno le liste con e senza), contro chi vince e contro chi soffre (a due lati), le sue liste
  migliori da copiare e tutte le patch del Tracker con le modifiche di Koin a lei e alle sue carte. 404 se la Leggendaria
  non ha numeri in nessuna patch. Dietro il muro per gli iscritti: noindex.
*/

type Params = Promise<{ locale: string; slug: string }>;

const THIN = 20;
const FIRST = 9;
const diffPts = (c: CardWith) => (c.without ? Math.round((c.with.r - c.without.r) * 100) : 0);
const sureDiff = (c: CardWith) => !!c.without && apart(c.with, c.without);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const { slug } = await params;
  const card = getCard(slug);
  if (!card?.legendary) notFound();
  const T = analyticsLegendariesLabels[locale].page;
  return dropHreflang(pageMeta(locale, `/analytics/legendaries/${slug}`, fill(T.metaTitle, { name: card.name }), fill(T.metaDescription, { name: card.name }), undefined, { noindex: true }));
}

export default async function LegendaryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const { slug } = await params;
  const card = getCard(slug);
  if (!card?.legendary) notFound();
  const C = analyticsSectionsLabels[locale].common;
  const T = analyticsLegendariesLabels[locale].page;
  const sez = await loadSections(searchParams);
  if (!sez) {
    return (
      <Band tone="stage" top>
        <SecHead as="h1" title={card.name} brief={[C.unavailable]} />
      </Band>
    );
  }
  const { cur, prev, all } = sez;
  if (!all.some((p) => p.legendaries.some((l) => l.slug === slug))) notFound();

  const P = (r: number) => pct(r, locale, 0);
  const games = (n: number) => (n === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(n, locale) }));
  const name = (s: string) => getCard(s)?.name ?? s;
  const legHref = (s: string) => sectionHref(locale, `/legendaries/${s}`, sez);

  const leg = cur.legendaries.find((l) => l.slug === slug) ?? null;
  const ranked = [...cur.legendaries].sort(byPrudent);
  const rank = leg ? ranked.findIndex((l) => l.slug === slug) + 1 : 0;
  const move = leg ? moveOf(prev?.legendaries.find((l) => l.slug === slug), leg) : null;

  /* carte che porta: le più frequenti prima, le altre dietro un tasto, le rare in una riga chiusa */
  const carried = cardsOfLegendary(cur.lists, slug);
  const common = carried.cards.filter((c) => c.share >= 0.15).slice(0, 16);
  const first = common.slice(0, FIRST);
  const second = common.slice(FIRST);
  const rest = carried.cards.filter((c) => !common.includes(c));

  /* scontri */
  const mus = cur.matchups.filter((m) => m.a === slug && m.b !== slug && m.games > 0);
  const best = [...mus].sort((a, b) => b.lo - a.lo || b.games - a.games).slice(0, 4);
  const worst = [...mus].sort((a, b) => a.hi - b.hi || b.games - a.games).filter((m) => !best.includes(m)).slice(0, 4);

  /* le cose da sapere, la più importante per prima */
  const brief: ReactNode[] = [];
  if (leg) brief.push(rich(T.briefWr, { name: card.name, wr: P(leg.r), games: games(leg.games), rank: fill(T.rankValue, { n: rank }), n: ranked.length }));
  // la carta che pesa di più: fra quelle con almeno 20 partite con e senza, la differenza più grande (prima le nette)
  const weighed = common.filter((c) => c.without && c.with.games >= THIN && c.without.games >= THIN);
  const heavy = [...weighed].sort((a, b) => Number(sureDiff(b)) - Number(sureDiff(a)) || Math.abs(diffPts(b)) - Math.abs(diffPts(a)))[0];
  if (heavy?.without && diffPts(heavy) !== 0)
    brief.push(rich(sureDiff(heavy) ? T.briefCard : T.briefCardUnsure, { card: name(heavy.slug), with: P(heavy.with.r), without: P(heavy.without.r) }));
  const solidMus = mus.filter((m) => m.games >= THIN);
  const pool = solidMus.length ? solidMus : mus;
  const hardest = [...pool].sort((a, b) => a.r - b.r)[0];
  const easiest = [...pool].sort((a, b) => b.r - a.r)[0];
  if (hardest && hardest.r < 0.5) brief.push(rich(T.briefWorst, { opp: name(hardest.b), wr: P(hardest.r), games: games(hardest.games) }));
  else if (easiest) brief.push(rich(T.briefBest, { opp: name(easiest.b), wr: P(easiest.r), games: games(easiest.games) }));

  /* liste migliori: con almeno 5 partite, se ce ne sono */
  const own = cur.lists.filter((l) => l.legendary === slug);
  const solid = own.filter((l) => l.games >= 5);
  const lists = [...(solid.length ? solid : own)].sort(byPrudent).slice(0, 3);
  const published = await publishedByList();
  const listRows = await Promise.all(
    lists.map(async (l, i) => {
      const pub = published.get(listKeyOf(slug, l.cards))?.[0] ?? null;
      const links = await deckLinks(locale, slug, l.cards, pub?.name ?? `${card.name} · ${fill(T.listName, { n: i + 1 })}`);
      const sorted = [...l.cards].sort((a, b) => (getCard(a)?.mana ?? 99) - (getCard(b)?.mana ?? 99) || name(a).localeCompare(name(b)));
      return { l, pub, links, sorted };
    }),
  );

  /* nel tempo: tutte le patch, con le modifiche a lei e alle carte che porta più spesso (almeno nella metà delle liste) */
  const allPatches = await loadAllPatches();
  const core = new Set([slug, ...carried.cards.filter((c) => c.share >= 0.5).map((c) => c.slug)]);
  const time = allPatches.map((p) => {
    const pt = p.legendaries.find((l) => l.slug === slug) ?? null;
    const changes = [...core].flatMap((s) => (getCard(s)?.history ?? []).filter((h) => h.patch === p.patch).map((h) => ({ slug: s, h })));
    return { patch: p.patch, label: patchName(p.patch, locale), pt, changes };
  });

  return (
    <>
      <Band tone="stage" top>
        <Link href={sectionHref(locale, "/legendaries", sez)} prefetch={false} className="link-mint text-sm font-bold">
          {T.back}
        </Link>
        <header className="lg-head mt-4">
          <div className="lg-head-card">
            <GameCardFace input={toGameCardInput(card, locale)} lang={locale} />
          </div>
          <div className="min-w-0">
            <SecHead as="h1" title={card.name} brief={brief.length ? brief : [T.cardsNone]} />
            {leg ? (
              <>
                <div className="lg-facts">
                  <div className="lg-fact">
                    <span>{T.wr}</span>
                    <b className="sez-num">{pct(leg.r, locale, 1)}</b>
                    <small>
                      {games(leg.games)} · {fill(C.range, { lo: P(leg.lo), hi: P(leg.hi) })}
                    </small>
                  </div>
                  <div className="lg-fact">
                    <span>{T.share}</span>
                    <b className="sez-num">{pct(leg.share, locale, 1)}</b>
                    <small>{T.shareSub}</small>
                  </div>
                  <div className="lg-fact">
                    <span>{T.rank}</span>
                    <b className="sez-num">{fill(T.rankValue, { n: rank })}</b>
                    <small>{fill(T.rankSub, { n: ranked.length })}</small>
                  </div>
                  <div className="lg-fact">
                    <span>{T.move}</span>
                    <b className="sez-num">
                      <MoveTag m={move} locale={locale} labels={C} />
                    </b>
                    <small>{prev && move ? fill(T.moveSub, { patch: patchName(prev.patch, locale) }) : T.moveNone}</small>
                  </div>
                </div>
                <div className="mt-4 max-w-md">
                  <WrBar n={leg} locale={locale} />
                </div>
              </>
            ) : null}
          </div>
        </header>
      </Band>

      <Band tone="felt">
        <SecHead title={T.cardsTitle} brief={carried.games ? [fill(T.cardsBrief, { games: games(carried.games) })] : [T.cardsNone]} />
        {carried.games ? (
          <>
            <ul className="lg-cards">
              {first.map((c) => (
                <CarriedCard key={c.slug} c={c} locale={locale} />
              ))}
            </ul>
            {second.length ? (
              <details className="lg-more">
                <summary>{fill(T.more, { n: second.length })}</summary>
                <ul className="lg-cards">
                  {second.map((c) => (
                    <CarriedCard key={c.slug} c={c} locale={locale} />
                  ))}
                </ul>
              </details>
            ) : null}
            {rest.length ? (
              <details className="lg-more">
                <summary>{fill(T.others, { n: rest.length })}</summary>
                <p className="sez-note mt-2">{rest.map((c) => `${name(c.slug)} (${P(c.share)})`).join(", ")}.</p>
              </details>
            ) : null}
          </>
        ) : null}
      </Band>

      <Band tone="deep">
        <SecHead title={T.vsTitle} brief={[T.vsBrief]} />
        {mus.length ? (
          <div className="lg-vs">
            <VsList title={T.best} rows={best} locale={locale} legHref={legHref} tone="sez-up" />
            <VsList title={T.worst} rows={worst} locale={locale} legHref={legHref} tone="sez-down" />
          </div>
        ) : (
          <p className="sez-note">{T.vsNone}</p>
        )}
      </Band>

      <Band tone="felt">
        <SecHead title={T.listsTitle} brief={[listRows.length ? T.listsBrief : T.listsNone]} />
        {listRows.length ? (
          <div className="lg-lists">
            {listRows.map(({ l, pub, links, sorted }, i) => (
              <article key={l.cards.join(",")} className={`an-panel lg-listcard${l.games < THIN ? " sez-thin" : ""}`}>
                <div className="lg-list-head">
                  <span className="lg-list-name">{pub ? pub.name : fill(T.listName, { n: i + 1 })}</span>
                  <span className="text-sm text-pale">
                    <span className="sez-num text-lg">{P(l.r)}</span> · {games(l.games)} · {fill(C.range, { lo: P(l.lo), hi: P(l.hi) })}
                  </span>
                </div>
                {pub ? <p className="sez-note mt-1">{pub.author ? fill(T.published, { name: pub.name, author: pub.author }) : fill(T.publishedNoAuthor, { name: pub.name })}</p> : null}
                <ul className="lg-thumbs">
                  {sorted.map((s) => {
                    const c = getCard(s);
                    return (
                      <li key={s}>
                        <Link href={href(locale, `/cards/${s}`)} prefetch={false} title={c?.name ?? s}>
                          {c?.thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element -- miniatura ufficiale da 160 px, già in WebP
                            <img src={c.thumb} alt={c.name} loading="lazy" decoding="async" width={160} height={230} />
                          ) : (
                            <span className="lg-thumb-none">{c?.name ?? s}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="lg-actions">
                  {links.code ? <CopyCode code={links.code} label={C.copyCode} done={C.copied} /> : null}
                  <Link href={links.builder} prefetch={false} className="btn btn-ghost text-xs">
                    {C.openBuilder}
                  </Link>
                  {pub ? (
                    <Link href={href(locale, `/decks/community/${pub.slug}`)} prefetch={false} className="btn btn-ghost text-xs">
                      {C.openDeck}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Band>

      <Band tone="deep">
        <SecHead title={T.timeTitle} brief={[T.timeBrief]} />
        <TimeChart points={time.map(({ label, pt }) => ({ label, r: pt?.r ?? null }))} marks={time.map((t) => t.changes.length > 0)} aria={fill(T.chartAria, { name: card.name })} locale={locale} />
        <ul className="lg-time">
          {[...time].reverse().map(({ patch, label, pt, changes }) => (
            <li key={patch} className="lg-time-row">
              <span className="lg-time-patch">{label}</span>
              <span className="text-sm">
                {pt ? (
                  <>
                    <span className="sez-num">{P(pt.r)}</span> <span className="text-pale-muted">{games(pt.games)}</span>
                  </>
                ) : (
                  <span className="text-pale-muted">{T.noData}</span>
                )}
              </span>
              <span className="text-sm text-pale">{pt ? fill(T.shareLower, { p: P(pt.share) }) : ""}</span>
              <ul className="lg-changes">
                {changes.length ? (
                  changes.map(({ slug: s, h }, k) => (
                    <li key={`${s}-${k}`}>
                      <span className={`lg-kind ${h.kind === "buff" ? "is-buff" : h.kind === "nerf" ? "is-nerf" : "is-other"}`}>{(T.kinds as Record<ChangeKind, string>)[h.kind] ?? h.kind}</span>
                      <b className="text-chalk">{name(s)}</b>: {h.note[locale] ?? h.note.en}
                    </li>
                  ))
                ) : (
                  <li className="text-pale-muted">{T.noChange}</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      </Band>
    </>
  );
}

/** Una carta che la Leggendaria porta: carta del gioco e quota; al tocco, come vanno le liste con e senza. */
function CarriedCard({ c, locale }: { c: CardWith; locale: Locale }) {
  const info = getCard(c.slug);
  if (!info) return null;
  const C = analyticsSectionsLabels[locale].common;
  const T = analyticsLegendariesLabels[locale].page;
  const P = (r: number) => pct(r, locale, 0);
  const games = (n: number) => (n === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(n, locale) }));
  const sure = sureDiff(c);
  const d = diffPts(c);
  const pts = fill(T.points, { n: `${d > 0 ? "+" : d < 0 ? "−" : ""}${fmtDec(Math.abs(d), locale, 0)}` });
  return (
    <li>
      <details className="lg-card">
        <summary>
          {sure ? <span className={`pen-note ${d > 0 ? "is-up" : "is-down"}`}>{pts}</span> : null}
          <span className="lg-card-face">
            <GameCardFace input={toGameCardInput(info, locale)} lang={locale} />
          </span>
          <span className="lg-card-share">
            <b>{c.share >= 0.995 ? T.always : fill(T.inLists, { p: P(c.share) })}</b>
          </span>
        </summary>
        <div className="lg-card-pop">
          <p>
            {T.withW} <b>{P(c.with.r)}</b> <small>({games(c.with.games)})</small>
          </p>
          {c.without ? (
            <p>
              {T.withoutW} <b>{P(c.without.r)}</b> <small>({games(c.without.games)})</small>
            </p>
          ) : null}
          {c.without ? <p className="lg-card-diff">{sure ? fill(T.diff, { p: pts }) : T.diffUnsure}</p> : null}
        </div>
      </details>
    </li>
  );
}

/** Il win rate su tutte le patch: linea grande con i valori scritti, il 50% tratteggiato, un segno dove Koin ha cambiato qualcosa. */
function TimeChart({ points, marks, aria, locale }: { points: { label: string; r: number | null }[]; marks: boolean[]; aria: string; locale: Locale }) {
  const W = 640;
  const H = 190;
  const padX = 48;
  const padT = 30;
  const padB = 34;
  const vals = points.map((p) => p.r).filter((v): v is number => v !== null);
  if (vals.length < 1) return null;
  const min = Math.min(0.3, ...vals) - 0.02;
  const max = Math.max(0.7, ...vals) + 0.02;
  const n = points.length;
  const x = (i: number) => (n > 1 ? padX + (i * (W - 2 * padX)) / (n - 1) : W / 2);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const path = points.map((p, i) => (p.r === null ? null : `${x(i)},${y(p.r)}`)).filter(Boolean).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lg-chart" role="img" aria-label={aria}>
      <line x1={padX - 20} x2={W - padX + 20} y1={y(0.5)} y2={y(0.5)} stroke="rgba(255,255,255,.3)" strokeDasharray="5 5" />
      <text x={padX - 24} y={y(0.5) + 4} textAnchor="end" className="lg-chart-axis">
        {pct(0.5, locale, 0)}
      </text>
      <polyline points={path} fill="none" stroke="var(--color-sky)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.label}>
          {marks[i] ? <rect x={x(i) - 7} y={H - padB + 6} width="14" height="14" rx="3" fill="var(--color-gold)" opacity="0.85" /> : null}
          <text x={x(i)} y={H - 6} textAnchor="middle" className="lg-chart-label">
            {p.label}
          </text>
          {p.r !== null ? (
            <>
              <circle cx={x(i)} cy={y(p.r)} r="6" fill={i === n - 1 ? "var(--color-mint)" : "var(--color-sky)"} stroke="#110a26" strokeWidth="2" />
              <text x={x(i)} y={y(p.r) - 12} textAnchor="middle" className="lg-chart-val">
                {pct(p.r, locale, 0)}
              </text>
            </>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function VsList({ title, rows, locale, legHref, tone }: { title: string; rows: SecMatchup[]; locale: Locale; legHref: (s: string) => string; tone: string }) {
  const C = analyticsSectionsLabels[locale].common;
  return (
    <div>
      <h3 className={tone}>{title}</h3>
      <ul>
        {rows.map((m) => {
          const opp = getCard(m.b);
          return (
            <li key={m.b}>
              <Link href={legHref(m.b)} prefetch={false} className={`lg-vs-row${m.games < THIN ? " sez-thin" : ""}`}>
                <span className="lg-face" aria-hidden="true">
                  {opp?.art ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, WebP piccolo
                    <img src={opp.art} alt="" loading="lazy" decoding="async" />
                  ) : null}
                </span>
                <span className="truncate font-display font-semibold text-chalk">{opp?.name ?? m.b}</span>
                <WrBar n={m} locale={locale} />
                <span className="lg-vs-num">
                  <span className="sez-num">{pct(m.r, locale, 0)}</span>
                  <small>{m.games === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(m.games, locale) })}</small>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

