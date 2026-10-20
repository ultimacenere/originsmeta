import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, cache, type CSSProperties, type ReactNode } from "react";
import { formatDate, formatDateShort, href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard, getCardByKey, patchLabel, type Card } from "@/lib/data/cards";
import { CRIMSON_SOURCE_URL, crimsonQualifiers, crimsonRegions } from "@/lib/data/crimsonCup";
import { biggestGaps, fillCrimson as fmt, headlines, latestWithStats, legendaryViews, MIN_SEEN_FOR_STORY, versusCards, versusLegendaries, withStats, type LadderLegendary, type QualifierWithStats } from "@/lib/crimsonCup";
import { crimsonCupLabels } from "@/lib/crimsonCupLabels";
import { readWinrate } from "@/lib/community/trackerStatsQueries";
import { ANALYTICS_PUBLIC } from "@/lib/community/badges";
import { bothSides, deltaText, fmtInt, pct, pctNum, pctUnit } from "@/lib/tracker/snapshot";
import { CardName } from "@/components/CardChip";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { PageNotes } from "@/components/PageNotes";
import { CardArt, SectionHead } from "@/components/analytics/parts";
import { AnalyticsReveal } from "@/components/analytics/AnalyticsReveal";
import { CrimsonTabs, type CrimsonTab } from "@/components/crimson/CrimsonTabs";

/*
  Crimson Cup: il meta del torneo (20/10/2026). Pierluigi, sulle tabelle che Koin Games ha pubblicato sul Discord ufficiale
  dopo la AMER #1: "come possiamo usarli oltre ad una news? possiamo creare una sezione di analytics con questi dati?";
  scelte: pagina dedicata /analytics/crimson-cup con un selettore per qualificazione che si riempie man mano, confronto
  torneo contro ladder, righe sulle schede carta.

  Due fonti, tenute separate e dette per nome: i numeri del torneo sono quelli ufficiali di Koin (src/lib/data/crimsonCup.ts,
  ricalcoli e regole in src/lib/crimsonCup.ts); il ladder è OriginsMeta Tracker, letto come /analytics (Leggendarie a due
  lati con `bothSides`, carte dal lato di chi registra). Stesso linguaggio grafico di /analytics (fasce `.an-*`), più gli
  stili `.cc-*` in fondo a globals.css.

  Regole: mai il numero di iscritti o di giocatori (le tabelle non lo scrivono, e Pierluigi ha chiesto di non parlare di
  chi non si è presentato), niente soglie, niente stime sulle carte che Koin non pubblica. Senza i numeri del Tracker (o con
  ANALYTICS_PUBLIC spento) la sezione del confronto dice solo che non è disponibile.

  Indicizzabile in tutte le lingue, in sitemap. Legge il Tracker: ISR (revalidate 300, come /analytics); il resto è statico.
*/
export const revalidate = 300;

const loadWinrate = cache(readWinrate);
const PAGE = "/analytics/crimson-cup";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = crimsonCupLabels[locale];
  return pageMeta(locale, PAGE, L.meta.title, L.meta.description, "/media/news-crimson-cup.webp", { imageAlt: L.h1 });
}

/** Come `fmt`, ma i segnaposto possono essere nodi (nomi delle Leggendarie con la stella). */
const fmtNode = (s: string, v: Record<string, ReactNode>): ReactNode[] =>
  s.split(/(\{\w+\})/).map((part, i) => {
    const k = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={i}>{k && k in v ? v[k] : part}</Fragment>;
  });

/** Una scala da 0 a un tetto tondo (10%, 20%…) sopra il valore più alto: le barre restano leggibili e mai esagerate. */
const ceilTo = (max: number, step = 0.1) => Math.max(step, Math.min(1, Math.ceil(max / step - 1e-9) * step));

type Ladder = { patch: string; games: number; legendaries: Map<string, LadderLegendary>; cards: Map<string, number> };

/** I numeri del ladder come li legge /analytics: Leggendarie a due lati, carte dal lato di chi registra. */
async function loadLadder(locale: Locale): Promise<Ladder | null> {
  if (!ANALYTICS_PUBLIC) return null;
  const read = await loadWinrate();
  if (read.status !== "ok") return null;
  const data = read.data;
  const both = bothSides(data.matchups.filter((m) => getCardByKey(m.legendary) && getCardByKey(m.opponent)));
  const legendaries = new Map<string, LadderLegendary>();
  for (const s of both.legendaries) {
    const card = getCardByKey(s.legendary);
    if (card && s.games > 0 && both.games > 0) legendaries.set(card.slug, { share: s.games / (2 * both.games), r: s.wins / s.games, games: s.games });
  }
  const cards = new Map<string, number>();
  const total = data.overview.games;
  for (const s of data.cards) {
    const card = getCardByKey(s.card);
    if (card && s.deck && total > 0) cards.set(card.slug, s.deck.games / total);
  }
  return { patch: patchLabel(data.patch, locale), games: data.overview.games, legendaries, cards };
}

export default async function CrimsonCupPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = crimsonCupLabels[locale];
  const ladder = await loadLadder(locale);
  const ready = withStats(crimsonQualifiers);
  const initial = latestWithStats(crimsonQualifiers);

  const unit = pctUnit(locale);
  const P = (r: number, digits = 1) => pct(r, locale, digits);
  const N = (n: number) => fmtInt(n, locale);
  const legendaryLabel = d.common.legendary;
  const cardHref = (card: Card) => href(locale, `/cards/${card.slug}`);
  const gamesText = (n: number) => (n === 1 ? d.tier.winrate.gamesOne : fmt(d.tier.winrate.games, { n: N(n) }));
  const qDate = (q: { startAt: string }) => formatDate(locale, q.startAt.slice(0, 10));
  const region = (name: string) => crimsonRegions[name.split(" ")[0]]?.[locale] ?? "";
  const legName = (card: Card) => <CardName name={card.name} legendary legendaryLabel={legendaryLabel} />;

  const tabs: CrimsonTab[] = crimsonQualifiers.map((q) => ({
    id: q.id,
    name: q.name,
    sub: q.stats ? `${formatDateShort(locale, q.startAt.slice(0, 10))} · ${L.picker.data}` : `${formatDateShort(locale, q.startAt.slice(0, 10))} · ${L.picker.soon}`,
    ready: Boolean(q.stats),
  }));

  /** Il pannello di una qualificazione con i numeri. */
  const panel = (q: QualifierWithStats) => {
    const s = q.stats;
    const views = legendaryViews(s);
    const h = headlines(s);
    const bans = views.reduce((t, v) => t + v.banned, 0);
    const legs = views.flatMap((v) => {
      const card = getCard(v.legendary);
      return card ? [{ ...v, card }] : [];
    });
    const byShare = [...legs].sort((a, b) => a.submittedRank - b.submittedRank);
    const cards = s.cards.flatMap((c, i) => {
      const card = getCard(c.card);
      return card ? [{ ...c, slug: c.card, card, rank: i + 1 }] : [];
    });
    const banAxis = ceilTo(Math.max(...legs.map((v) => v.banRate)));
    const shareAxis = ceilTo(Math.max(...legs.map((v) => v.share)));
    const cardAxis = ceilTo(Math.max(...cards.map((c) => c.share)));
    const top = (slug?: string) => (slug ? getCard(slug) : undefined);
    const mostBanned = top(h.mostBanned?.legendary);
    const mostSubmitted = top(h.mostSubmitted?.legendary);
    const leastBanned = top(h.leastBanned?.legendary);
    const topCard = top(h.topCard?.card);
    const sec = (id: string) => `${q.id}-${id}`;

    /* torneo contro ladder */
    const vsLegs = ladder ? versusLegendaries(views, ladder.legendaries) : [];
    const vsCards = ladder ? versusCards(s.cards, ladder.cards) : [];
    const gaps = biggestGaps(vsLegs);
    const hasLadder = vsLegs.some((r) => r.ladder !== null);
    const vsAxis = ceilTo(Math.max(0.1, ...vsLegs.map((r) => Math.max(r.crimson, r.ladder ?? 0))));
    const diffText = (diff: number | null) => (diff === null ? "—" : `${deltaText(0.5 + diff, locale)} pt`);
    const diffDir = (diff: number | null) => (diff === null ? "even" : diff > 0.005 ? "up" : diff < -0.005 ? "down" : "even");
    const ladderLegFor = (slug: string) => ladder?.legendaries.get(slug);

    const index = [
      { id: "legendaries", label: L.index.legendaries, count: legs.length },
      { id: "cards", label: L.index.cards, count: cards.length },
      { id: "versus", label: L.index.versus, count: undefined },
    ];

    return (
      <>
        <nav aria-label={d.tier.onThisPage} className="an-index">
          <ol className="an-wrap">
            {index.map((it, i) => (
              <li key={it.id}>
                <a href={`#${sec(it.id)}`}>
                  <b>{String(i + 1).padStart(2, "0")}</b>
                  {it.label}
                  {it.count !== undefined ? <span className="an-index-count">{N(it.count)}</span> : null}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Il palco: scoreboard e tre fatti */}
        <section className="an-band an-band--stage is-top" aria-labelledby={sec("snap")}>
          <div className="an-wrap">
            <div className="an-panel an-snapshot an-reveal">
              <h2 id={sec("snap")} className="sr-only">
                {L.snapshot.title}
              </h2>
              <div className="an-snap-top">
                <span className="an-plate">
                  <span>{L.snapshot.plate}</span>
                </span>
                <span className="an-snap-patch">
                  {q.name} · {region(q.name)} · {qDate(q)}
                </span>
                <span className="an-live">{L.snapshot.source}</span>
              </div>
              <div className="an-snap-grid">
                <div className="an-cell-slot">
                  <a className="an-cell" href={`#${sec("legendaries")}`}>
                    <span className="kicker an-cell-label">{L.snapshot.reached}</span>
                    <span className="an-cell-value">
                      {N(h.reachedQualify)}
                      <small>/{N(h.legendaries)}</small>
                    </span>
                    <span className="an-cell-sub">{fmt(L.snapshot.reachedSub, { round: s.qualifyRound })}</span>
                  </a>
                </div>
                <div className="an-cell-slot">
                  <a className="an-cell" href={`#${sec("legendaries")}`}>
                    <span className="kicker an-cell-label">{L.snapshot.bans}</span>
                    <span className="an-cell-value">{N(bans)}</span>
                    <span className="an-cell-sub">{L.snapshot.bansSub}</span>
                  </a>
                </div>
                {mostBanned && h.mostBanned ? (
                  <div className="an-cell-slot is-full is-wide">
                    <a className="an-cell is-wide" href={`#${sec("legendaries")}`}>
                      <span className="an-cell-thumb">
                        <CardArt src={mostBanned.image} thumb={mostBanned.thumb} name={mostBanned.name} width={76} eager />
                      </span>
                      <span className="min-w-0">
                        <span className="kicker an-cell-label">{L.snapshot.mostBanned}</span>
                        <span className="an-cell-name">{legName(mostBanned)}</span>
                        <span className="an-cell-value">
                          {pctNum(h.mostBanned.banRate, locale)}
                          <small>{unit}</small>
                        </span>
                        <span className="an-cell-sub">{fmt(L.snapshot.mostBannedSub, { b: N(h.mostBanned.banned), s: N(h.mostBanned.seen) })}</span>
                      </span>
                    </a>
                  </div>
                ) : null}
                {mostSubmitted && h.mostSubmitted ? (
                  <div className="an-cell-slot is-full is-wide">
                    <a className="an-cell is-wide" href={`#${sec("brought")}`}>
                      <span className="an-cell-thumb">
                        <CardArt src={mostSubmitted.image} thumb={mostSubmitted.thumb} name={mostSubmitted.name} width={76} eager />
                      </span>
                      <span className="min-w-0">
                        <span className="kicker an-cell-label">{L.snapshot.mostSubmitted}</span>
                        <span className="an-cell-name">{legName(mostSubmitted)}</span>
                        <span className="an-cell-value">
                          {pctNum(h.mostSubmitted.share, locale)}
                          <small>{unit}</small>
                        </span>
                        <span className="an-cell-sub">{fmt(L.snapshot.mostSubmittedSub, { n: N(h.mostSubmitted.submitted), p: P(h.mostSubmitted.share) })}</span>
                      </span>
                    </a>
                  </div>
                ) : null}
                {topCard && h.topCard ? (
                  <div className="an-cell-slot is-full is-wide">
                    <a className="an-cell is-wide" href={`#${sec("cards")}`}>
                      <span className="an-cell-thumb">
                        <CardArt src={topCard.image} thumb={topCard.thumb} name={topCard.name} width={76} eager />
                      </span>
                      <span className="min-w-0">
                        <span className="kicker an-cell-label">{L.snapshot.topCard}</span>
                        <span className="an-cell-name">
                          <CardName name={topCard.name} legendary={topCard.legendary} legendaryLabel={legendaryLabel} />
                        </span>
                        <span className="an-cell-value">
                          {pctNum(h.topCard.share, locale)}
                          <small>{unit}</small>
                        </span>
                        <span className="an-cell-sub">{fmt(L.snapshot.topCardSub, { n: N(h.topCard.decks) })}</span>
                      </span>
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="an-stories" role="group" aria-label={L.stories.label}>
              {mostBanned && h.mostBanned ? (
                <article className="an-story is-down">
                  <span className="kicker">{L.stories.banned.kicker}</span>
                  <p>{fmtNode(L.stories.banned.text, { name: <strong>{legName(mostBanned)}</strong>, p: P(h.mostBanned.banRate) })}</p>
                  <footer>
                    <span>{fmt(L.legendaries.rowBan, { b: N(h.mostBanned.banned), s: N(h.mostBanned.seen) })}</span>
                  </footer>
                </article>
              ) : null}
              {mostSubmitted && h.mostSubmitted ? (
                <article className="an-story">
                  <span className="kicker">{L.stories.brought.kicker}</span>
                  <p>
                    {fmtNode(L.stories.brought.text, {
                      name: <strong>{legName(mostSubmitted)}</strong>,
                      n: N(h.mostSubmitted.submitted),
                      p: P(h.mostSubmitted.share),
                      ban: P(h.mostSubmitted.banRate),
                    })}
                  </p>
                </article>
              ) : null}
              {leastBanned && h.leastBanned ? (
                <article className="an-story is-watch">
                  <span className="kicker">{L.stories.calm.kicker}</span>
                  <p>
                    {fmtNode(L.stories.calm.text, { name: <strong>{legName(leastBanned)}</strong>, min: MIN_SEEN_FOR_STORY, p: P(h.leastBanned.banRate) })}
                    {ladderLegFor(leastBanned.slug) ? fmt(L.stories.calm.ladder, { wr: P(ladderLegFor(leastBanned.slug)!.r) }) : null}
                  </p>
                  {hasLadder ? (
                    <footer>
                      <a href={`#${sec("versus")}`} className="font-bold">
                        {L.stories.link}
                      </a>
                    </footer>
                  ) : null}
                </article>
              ) : null}
            </div>
          </div>
        </section>

        {/* 01 Leggendarie: le più bandite e le più portate */}
        <section id={sec("legendaries")} className="an-band an-band--felt" aria-labelledby={`${sec("legendaries")}-h`}>
          <div className="an-wrap">
            <SectionHead num={1} kicker={L.legendaries.kicker} title={L.legendaries.title} id={`${sec("legendaries")}-h`} meta={fmt(L.legendaries.meta, { n: N(legs.length), b: N(bans) })} />
            <p className="an-lead">{L.legendaries.lead}</p>

            <div className="an-block">
              <h3 className="an-sub-h">{L.legendaries.bannedTitle}</h3>
              <ol className="cc-bars an-reveal">
                {legs.map((v) => (
                  <li key={v.legendary} className="cc-bar-row">
                    <span className="cc-rank" aria-hidden="true">
                      {v.banRank}
                    </span>
                    <Link href={cardHref(v.card)} prefetch={false} className="cc-thumb" tabIndex={-1} aria-hidden="true">
                      <CardArt src={v.card.image} thumb={v.card.thumb} name={v.card.name} width={40} />
                    </Link>
                    <span className="cc-name">
                      <Link href={cardHref(v.card)} prefetch={false}>
                        {legName(v.card)}
                      </Link>
                      <small>
                        {fmt(L.legendaries.rowDecks, { n: N(v.submitted) })}
                        {" · "}
                        <span className={`cc-round${v.deepest >= s.qualifyRound ? " is-top" : ""}`} title={fmt(L.legendaries.roundTitle, { n: v.deepest })}>
                          R{v.deepest}
                        </span>
                      </small>
                    </span>
                    <span className="cc-track" aria-hidden="true">
                      <span className="cc-fill is-ban" style={{ width: `${(v.banRate / banAxis) * 100}%` }} />
                    </span>
                    <span className="cc-val">
                      <b>{P(v.banRate)}</b>
                      <small>{fmt(L.legendaries.rowBan, { b: N(v.banned), s: N(v.seen) })}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="an-block scroll-mt-36" id={sec("brought")}>
              <h3 className="an-sub-h">{L.legendaries.broughtTitle}</h3>
              <p className="an-lead">{L.legendaries.broughtLead}</p>
              <ol className="cc-bars an-reveal">
                {byShare.map((v) => (
                  <li key={v.legendary} className="cc-bar-row">
                    <span className="cc-rank" aria-hidden="true">
                      {v.submittedRank}
                    </span>
                    <Link href={cardHref(v.card)} prefetch={false} className="cc-thumb" tabIndex={-1} aria-hidden="true">
                      <CardArt src={v.card.image} thumb={v.card.thumb} name={v.card.name} width={40} />
                    </Link>
                    <span className="cc-name">
                      <Link href={cardHref(v.card)} prefetch={false}>
                        {legName(v.card)}
                      </Link>
                      <small>{fmt(L.legendaries.rowBan, { b: N(v.banned), s: N(v.seen) })} · {P(v.banRate)}</small>
                    </span>
                    <span className="cc-track" aria-hidden="true">
                      <span className="cc-fill" style={{ width: `${(v.share / shareAxis) * 100}%` }} />
                    </span>
                    <span className="cc-val">
                      <b>{P(v.share)}</b>
                      <small>{fmt(L.legendaries.rowDecks, { n: N(v.submitted) })}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <details className="an-data">
              <summary>{L.legendaries.tableSummary}</summary>
              <div className="an-panel an-table-box">
                <table className="an-table an-sticky-col">
                  <caption>{fmt(L.legendaries.tableCaption, { name: q.name })}</caption>
                  <thead>
                    <tr>
                      {Object.values(L.legendaries.cols).map((label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {legs.map((v) => (
                      <tr key={v.legendary}>
                        <td>
                          <Link href={cardHref(v.card)} prefetch={false} className="an-table-link">
                            {legName(v.card)}
                          </Link>
                        </td>
                        <td className="is-num">
                          <b>{P(v.banRate)}</b>
                        </td>
                        <td className="is-num">
                          {N(v.banned)}/{N(v.seen)}
                        </td>
                        <td className="is-num">{N(v.submitted)}</td>
                        <td className="is-num">{P(v.share)}</td>
                        <td className="is-num">{N(v.played)}</td>
                        <td className="is-num">R{v.deepest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </section>

        {/* 02 Le carte più giocate */}
        <section id={sec("cards")} className="an-band an-band--deep" aria-labelledby={`${sec("cards")}-h`}>
          <div className="an-wrap">
            <SectionHead num={2} kicker={L.cards.kicker} title={L.cards.title} id={`${sec("cards")}-h`} meta={fmt(L.cards.meta, { n: N(cards.length) })} />
            <p className="an-lead">{L.cards.lead}</p>
            <div className="an-feats">
              {cards.slice(0, 3).map((c) => (
                <article key={c.slug} className="an-feat an-reveal">
                  <Link href={cardHref(c.card)} prefetch={false}>
                    <CardArt src={c.card.image} thumb={c.card.thumb} name={c.card.name} width={84} alt={c.card.name} />
                  </Link>
                  <div className="min-w-0">
                    <span className="kicker">{fmt(L.cards.position, { n: c.rank })}</span>
                    <h3>
                      <Link href={cardHref(c.card)} prefetch={false}>
                        <CardName name={c.card.name} legendary={c.card.legendary} legendaryLabel={legendaryLabel} />
                      </Link>
                    </h3>
                    <div className="an-big-wr">
                      {pctNum(c.share, locale)}
                      <small>{unit}</small>
                    </div>
                    <p>{fmt(L.cards.decks, { n: N(c.decks) })}</p>
                  </div>
                </article>
              ))}
            </div>
            <ol className="cc-bars an-reveal">
              {cards.map((c) => (
                <li key={c.slug} className="cc-bar-row">
                  <span className="cc-rank" aria-hidden="true">
                    {c.rank}
                  </span>
                  <Link href={cardHref(c.card)} prefetch={false} className="cc-thumb" tabIndex={-1} aria-hidden="true">
                    <CardArt src={c.card.image} thumb={c.card.thumb} name={c.card.name} width={40} />
                  </Link>
                  <span className="cc-name">
                    <Link href={cardHref(c.card)} prefetch={false}>
                      <CardName name={c.card.name} legendary={c.card.legendary} legendaryLabel={legendaryLabel} />
                    </Link>
                    <small>
                      {c.card.mana !== undefined ? `${c.card.mana} · ` : ""}
                      {c.card.type === "spell" ? d.common.spell : d.common.unit}
                    </small>
                  </span>
                  <span className="cc-track" aria-hidden="true">
                    <span className="cc-fill" style={{ width: `${(c.share / cardAxis) * 100}%` }} />
                  </span>
                  <span className="cc-val">
                    <b>{P(c.share)}</b>
                    <small>{fmt(L.cards.decks, { n: N(c.decks) })}</small>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 03 Torneo contro ladder */}
        <section id={sec("versus")} className="an-band an-band--stage" aria-labelledby={`${sec("versus")}-h`}>
          <div className="an-wrap">
            <SectionHead
              num={3}
              kicker={L.versus.kicker}
              title={L.versus.title}
              id={`${sec("versus")}-h`}
              meta={ladder && hasLadder ? fmt(L.versus.meta, { games: gamesText(ladder.games), patch: ladder.patch }) : undefined}
            />
            {ladder && hasLadder ? (
              <>
                <p className="an-lead">{L.versus.lead}</p>
                {gaps.up || gaps.down ? (
                  <div className="an-stories">
                    {[gaps.up, gaps.down].map((g, i) => {
                      const card = g ? getCard(g.legendary) : undefined;
                      if (!g || !card || g.ladder === null) return null;
                      return (
                        <article key={g.legendary} className={`an-story${i ? " is-watch" : ""}`}>
                          <span className="kicker">{i ? "▼" : "▲"} {diffText(g.diff)}</span>
                          <p>{fmtNode(i ? L.versus.down : L.versus.up, { name: <strong>{legName(card)}</strong>, c: P(g.crimson), l: P(g.ladder) })}</p>
                        </article>
                      );
                    })}
                  </div>
                ) : null}

                <div className="an-block">
                  <h3 className="an-sub-h">{L.versus.legTitle}</h3>
                  <div className="cc-legend" aria-hidden="true">
                    <span>
                      <i className="is-crimson" />
                      {L.versus.legend.crimson}
                    </span>
                    <span>
                      <i className="is-ladder" />
                      {L.versus.legend.ladder}
                    </span>
                  </div>
                  <ol className="cc-dumbs an-reveal">
                    {vsLegs.map((r) => {
                      const card = getCard(r.legendary);
                      if (!card) return null;
                      const lo = Math.min(r.crimson, r.ladder ?? r.crimson);
                      const hi = Math.max(r.crimson, r.ladder ?? r.crimson);
                      return (
                        <li key={r.legendary} className="cc-dumb-row">
                          <span className="cc-name">
                            <Link href={cardHref(card)} prefetch={false}>
                              {legName(card)}
                            </Link>
                            <small>
                              {L.versus.cols.ladderWr}: {r.ladderR !== null ? P(r.ladderR) : "—"} · {L.versus.cols.banRate}: {P(r.banRate)}
                            </small>
                          </span>
                          <span
                            className="cc-dumb"
                            role="img"
                            aria-label={fmt(L.versus.aria, { name: card.name, c: P(r.crimson), l: r.ladder !== null ? P(r.ladder) : L.versus.none })}
                            style={{ "--lo": `${(lo / vsAxis) * 100}%`, "--hi": `${(hi / vsAxis) * 100}%` } as CSSProperties}
                          >
                            <span className="cc-dumb-line" />
                            {r.ladder !== null ? <span className="cc-dot is-ladder" style={{ left: `${(r.ladder / vsAxis) * 100}%` }} /> : null}
                            <span className="cc-dot is-crimson" style={{ left: `${(r.crimson / vsAxis) * 100}%` }} />
                          </span>
                          <span className={`cc-diff is-${diffDir(r.diff)}`}>{diffText(r.diff)}</span>
                        </li>
                      );
                    })}
                  </ol>
                  <details className="an-data">
                    <summary>{L.cards.tableSummary}</summary>
                    <div className="an-panel an-table-box">
                      <table className="an-table an-sticky-col">
                        <caption>{L.versus.legTitle}</caption>
                        <thead>
                          <tr>
                            {Object.values(L.versus.cols).map((label) => (
                              <th key={label} scope="col">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {vsLegs.map((r) => {
                            const card = getCard(r.legendary);
                            if (!card) return null;
                            return (
                              <tr key={r.legendary}>
                                <td>
                                  <Link href={cardHref(card)} prefetch={false} className="an-table-link">
                                    {legName(card)}
                                  </Link>
                                </td>
                                <td className="is-num">
                                  <b>{P(r.crimson)}</b>
                                </td>
                                <td className="is-num">{r.ladder !== null ? P(r.ladder) : "—"}</td>
                                <td className="is-num">{diffText(r.diff)}</td>
                                <td className="is-num">{r.ladderR !== null ? `${P(r.ladderR)} · ${gamesText(r.ladderGames)}` : "—"}</td>
                                <td className="is-num">{P(r.banRate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>

                <div className="an-block">
                  <h3 className="an-sub-h">{L.versus.cardsTitle}</h3>
                  <p className="an-lead">{L.versus.cardsLead}</p>
                  <div className="an-panel an-table-box mt-4">
                    <table className="an-table an-sticky-col">
                      <caption>{L.versus.cardsTitle}</caption>
                      <thead>
                        <tr>
                          {Object.values(L.versus.cardCols).map((label) => (
                            <th key={label} scope="col">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vsCards.map((r) => {
                          const card = getCard(r.card);
                          if (!card) return null;
                          return (
                            <tr key={r.card}>
                              <td>
                                <Link href={cardHref(card)} prefetch={false} className="an-table-link">
                                  <CardName name={card.name} legendary={card.legendary} legendaryLabel={legendaryLabel} />
                                </Link>
                              </td>
                              <td className="is-num">
                                <b>{P(r.crimson)}</b>
                              </td>
                              <td className="is-num">{r.ladder !== null ? P(r.ladder) : L.versus.none}</td>
                              <td className="is-num">
                                <span className={`cc-diff is-${diffDir(r.diff)}`}>{diffText(r.diff)}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="an-quiet">{L.versus.missing}</p>
            )}
          </div>
        </section>
      </>
    );
  };

  const latest = initial ?? ready[ready.length - 1];

  return (
    <div className="an-page">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.nav.analytics, path: href(locale, "/analytics") },
            { name: L.h1, path: href(locale, PAGE) },
          ]),
        ]}
      />
      <header className="an-wrap an-head">
        <p className="kicker text-mint">
          <Link href={href(locale, "/analytics")} className="hover:underline">
            {L.kicker}
          </Link>
        </p>
        <h1 className="t-page mt-2">{L.h1}</h1>
        <div className="an-head-actions">
          <Link href={href(locale, "/analytics")} prefetch={false} className="btn btn-ghost text-xs">
            ← {L.back}
          </Link>
          <Link href={href(locale, "/news/crimson-cup-format-check-in")} prefetch={false} className="link-mint text-sm font-bold">
            {L.rules}
          </Link>
          <a href="#how-to-read" className="link-mint text-sm font-bold">
            {L.howTo}
          </a>
        </div>
      </header>

      {latest ? (
        <div className="mt-5">
          <CrimsonTabs tabs={tabs} initial={latest.id} label={L.picker.label} panels={ready.map((q) => ({ id: q.id, node: panel(q) }))} />
        </div>
      ) : null}

      <div className="an-wrap an-closing">
        <PageNotes>
          <section id="how-to-read" className="an-notes scroll-mt-36" aria-labelledby="cc-h-notes">
            <h2 id="cc-h-notes">{L.notes.title}</h2>
            <p>{L.notes.intro}</p>
            {ready.map((q) => (
              <p key={q.id} className="mt-3">
                <b>{L.notes.sourceLabel}</b>
                {locale === "fr" ? " : " : ": "}
                {fmt(L.notes.source, { name: q.name, date: qDate(q), read: formatDate(locale, q.stats.read) })}{" "}
                <a href={CRIMSON_SOURCE_URL} rel="noopener" target="_blank" className="link-mint font-bold">
                  {L.notes.discord} ↗
                </a>
              </p>
            ))}
            {ladder ? (
              <p className="mt-2">
                <b>{L.notes.ladderLabel}</b>
                {locale === "fr" ? " : " : ": "}
                {fmt(L.notes.ladder, { patch: ladder.patch })}
              </p>
            ) : null}
            <h3>{L.notes.wordsTitle}</h3>
            <dl>
              {L.notes.glossary.map((g) => (
                <div key={g.term}>
                  <dt>{g.term}</dt>
                  <dd>{fmt(g.text, { round: latest?.stats.qualifyRound ?? 4 })}</dd>
                </div>
              ))}
            </dl>
            <h3>{L.notes.dataTitle}</h3>
            <ul>
              {L.notes.list.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="an-notes-links">
              <span>
                {L.notes.analyticsText}{" "}
                <Link href={href(locale, "/analytics")} className="link-mint font-bold">
                  {L.notes.analyticsAnchor} →
                </Link>
              </span>
              <span>
                {L.notes.rulesText}{" "}
                <Link href={href(locale, "/news/crimson-cup-format-check-in")} className="link-mint font-bold">
                  {L.notes.rulesAnchor} →
                </Link>
              </span>
              <span>
                {L.notes.conquestText}{" "}
                <Link href={href(locale, "/guides/origins-tcg-conquest")} className="link-mint font-bold">
                  {L.notes.conquestAnchor} →
                </Link>
              </span>
            </p>
          </section>
        </PageNotes>
      </div>
      <AnalyticsReveal />
    </div>
  );
}
