import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, cache, type CSSProperties, type ReactNode } from "react";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { activeCards, getCard, getCardByKey, latestPatch, patchLabel, type Card } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { listPublishedDecks } from "@/lib/community/queries";
import { authorName } from "@/lib/community/util";
import { dropHreflang } from "@/lib/community/deckQuality";
import { readWinrate } from "@/lib/community/trackerStatsQueries";
import { ANALYTICS_PUBLIC } from "@/lib/community/badges";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { trackerInstallHref } from "@/lib/analyticsLabels";
import { archetypeIcon } from "@/lib/archetypeIcons";
import { deckListKey, isEarly } from "@/lib/tracker/stats";
import {
  BANDS,
  axisFor,
  band,
  byPrudent,
  cardHighlights,
  deltaPoints,
  deltaText,
  dirOf,
  fmtDec,
  fmtInt,
  isSure,
  legendaryCodes,
  matchupGrid,
  matchupOrder,
  notableMatchup,
  pct,
  pctNum,
  pctUnit,
  pos,
  rated,
  shortName,
  ticks,
  tintAlpha,
  verdictOf,
  vsLists,
  watchLegendary,
  type Axis,
  type Rated,
  bothSides,
} from "@/lib/tracker/snapshot";
import { TierSectionNotes, TierSourceLine } from "@/components/TierListHeader";
import { PageNotes } from "@/components/PageNotes";
import { CardName } from "@/components/CardChip";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { CardArt, Delta, Interval, SectionHead, type DeltaInfo } from "@/components/analytics/parts";
import { MetaMap } from "@/components/analytics/MetaMap";
import { CardStatsTable, type CardStatRow } from "@/components/analytics/CardStatsTable";
import { MatchupExplorer, type MxCell, type MxLeg } from "@/components/analytics/MatchupExplorer";
import { AnalyticsReveal } from "@/components/analytics/AnalyticsReveal";

/*
  Analytics (12/10/2026, Pierluigi: "non si chiama più win rate ma si chiama analytics" e le statistiche "solo sotto
  Analytics"): la pagina delle statistiche, che fino al 12/10/2026 stava in /tier-list/win-rate (ora un 308 verso qui) come
  scheda della tier list. La pagina dell'app è /tracker.
  Storia. Win rate (30/09/2026; Pierluigi: i win rate di mazzi e carte "sono molto importanti e dobbiamo averli"): una
  scheda della tier list; tolta il 02/10/2026 (la patch 0.7 aveva tolto i replay) e riaperta il 10/10/2026, quando l'app
  ha ricominciato a leggere le carte giocate dallo schermo; in prova per i ruoli con vetrina dal 10/10, aperta a tutti
  il 12/10/2026 (ANALYTICS_PUBLIC acceso): statica e ISR.

  Design "Meta Snapshot v2.0" (12/10/2026, scelto da Pierluigi; specifica e prototipo in design/win-rate/01-meta-snapshot,
  richieste nella nota "winrate 2.0"): la pagina come la grafica di un torneo in diretta, a fasce a tutta larghezza che si
  alternano (palco per scoreboard e scontri, feltro, fondo scuro). In ordine: scoreboard con i numeri eroe e le storie della
  patch; Leggendarie (podio con le carte intere, tabellone a forbici, mappa del meta, tabella); mazzi della community come
  classifica da diretta; archetipi a "lecca-lecca" dal 50% con i simbolini di Pierluigi (archetypeIcons.ts); carte (tre in
  evidenza e tabella ordinabile); scontri (filtro a carte, "Vince contro / Soffre contro", tabella stile Data Reaper con il
  pannello); invito all'app; testi in fondo. I numeri derivati (intervallo di Wilson, win rate prudente, fasce, scontro
  più sbilanciato…) stanno in src/lib/tracker/snapshot.ts, con test.

  Regole di Pierluigi del 12/10/2026: mai il numero di giocatori (`players` delle risposte non esce da qui: nemmeno
  in aria-label o dati strutturati), solo le partite; nessuna etichetta "prime stime", nessun avviso giallo, nessun testo
  sulle soglie (il ripiego su una patch precedente è una riga grigia); niente "Leggendarie più incontrate"; nella tabella
  degli scontri solo i nomi. Con pochi dati le sezioni senza numeri non compaiono (i mazzi mostrano un invito a pubblicarne
  uno), lo scoreboard non ha celle vuote e la tabella degli scontri ha solo le Leggendarie che hanno partite.

  Noindex (e fuori da sitemap e hreflang) finché la patch mostrata ha meno di 100 partite (`isEarly`): una pagina quasi
  vuota non si indicizza. Legge Supabase: ISR (revalidate 300).
*/
export const revalidate = 300;

const loadWinrate = cache(readWinrate);

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const w = dict.tier.winrate;
  const read = await loadWinrate();
  const indexable = ANALYTICS_PUBLIC && read.status === "ok" && !isEarly(read.data.overview.games);
  const meta = pageMeta(locale, "/analytics", w.title, w.description, undefined, { noindex: !indexable });
  return indexable ? meta : dropHreflang(meta);
}

const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));
const FULL: Axis = { min: 0, max: 1 };
/** Come `fmt`, ma i segnaposto possono essere nodi (per le stelle delle Leggendarie nelle frasi). */
const fmtNode = (s: string, v: Record<string, ReactNode>): ReactNode[] =>
  s.split(/(\{\w+\})/).map((part, i) => {
    const k = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={i}>{k && k in v ? v[k] : part}</Fragment>;
  });

export default async function AnalyticsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const t = d.tier;
  const w = t.winrate;
  const c = w.common;
  const [read, published] = await Promise.all([loadWinrate(), listPublishedDecks()]);
  const appHref = href(locale, "/tracker");
  const data = read.status === "ok" ? read.data : null;
  const legendaryLabel = d.common.legendary;
  const patchName = patchLabel(data?.patch ?? latestPatch, locale);

  /* ---------- formati nella lingua della pagina ---------- */
  const unit = pctUnit(locale);
  const P = (r: number, digits = 1) => pct(r, locale, digits);
  const gamesText = (n: number) => (n === 1 ? w.gamesOne : fmt(w.games, { n: fmtInt(n, locale) }));
  const wl = (s: { wins: number; games: number }) => `${fmtInt(s.wins, locale)}–${fmtInt(s.games - s.wins, locale)}`;
  const delta = (r: number): DeltaInfo => {
    const dir = dirOf(r);
    const pts = fmtDec(Math.abs(deltaPoints(r)), locale, 1);
    return { dir, text: deltaText(r, locale), sr: dir === "up" ? fmt(c.above, { d: pts }) : dir === "down" ? fmt(c.below, { d: pts }) : c.even };
  };
  const ciLabel = (s: Rated) => fmt(c.interval, { lo: P(s.lo, 0), hi: P(s.hi, 0) });
  const archName = (id: string) => (archetypeLabels[id]?.[locale] ?? id).split(" / ");
  const cardHref = (card: Card) => href(locale, `/cards/${card.slug}`);

  /* ---------- dati (mai `players`: si tengono solo partite e vittorie) ---------- */
  const total = data?.overview.games ?? 0;
  /* Leggendarie e scontri contano tutti e due i lati delle partite con la Leggendaria avversaria nota (13/10/2026,
     bothSides di snapshot.ts): `legGames` partite, il doppio di presenze in campo (la base della quota di gioco). */
  const both = bothSides((data?.matchups ?? []).filter((m) => getCardByKey(m.legendary) && getCardByKey(m.opponent)));
  const legGames = both.games;
  const legShare = (games: number) => (legGames ? games / (2 * legGames) : 0);
  const legs = both.legendaries
    .flatMap((s) => {
      const card = getCardByKey(s.legendary);
      return card ? [{ ...rated({ legendary: s.legendary, games: s.games, wins: s.wins }), card }] : [];
    })
    .sort(byPrudent);
  const legByKey = new Map(legs.map((l) => [l.legendary, l]));
  const archs = (data?.archetypes ?? []).map((s) => rated({ archetype: s.archetype, games: s.games, wins: s.wins })).sort((a, b) => b.r - a.r || b.games - a.games);
  const listStats = new Map((data?.lists ?? []).map((l) => [l.list, l]));
  const decks = published
    .flatMap((deck) => {
      const stat = listStats.get(deckListKey({ legendary: deck.legendary, cards: deck.cards }, (slug) => getCard(slug)?.key) ?? "");
      return stat ? [{ deck, ...rated({ games: stat.games, wins: stat.wins }) }] : [];
    })
    .sort(byPrudent);
  const cardRows = (data?.cards ?? []).flatMap((s) => {
    const card = getCardByKey(s.card);
    if (!card) return [];
    return [
      {
        card: s.card,
        info: card,
        deck: s.deck ? rated({ games: s.deck.games, wins: s.deck.wins }) : null,
        played: s.played ? { ...rated({ games: s.played.games, wins: s.played.wins }), avgTurn: s.played.avgTurn } : null,
      },
    ];
  });
  const mus = both.matchups.map((m) => rated(m));
  const notable = notableMatchup(mus);

  /* ---------- sezioni presenti, numerate nell'ordine ---------- */
  type SecId = "legendaries" | "decks" | "archetypes" | "cards" | "matchups";
  const present: { id: SecId; count: number }[] = data
    ? [
        ...(legs.length ? [{ id: "legendaries" as const, count: legs.length }] : []),
        { id: "decks" as const, count: decks.length },
        ...(archs.length ? [{ id: "archetypes" as const, count: archs.length }] : []),
        ...(cardRows.length ? [{ id: "cards" as const, count: cardRows.length }] : []),
        ...(notable ? [{ id: "matchups" as const, count: mus.filter((m) => m.legendary < m.opponent && m.games > 0).length }] : []),
      ]
    : [];
  const numOf = (id: SecId) => present.findIndex((s) => s.id === id) + 1;
  /* fondi alternati: feltro e fondo scuro; gli scontri sempre sul palco, come lo scoreboard */
  const bandOf = (id: SecId) => (id === "matchups" ? "an-band--stage" : present.filter((s) => s.id !== "matchups").findIndex((s) => s.id === id) % 2 ? "an-band--deep" : "an-band--felt");

  /* ---------- scoreboard ---------- */
  const strongest = legs[0];
  const mostPlayed = [...legs].sort((a, b) => b.games - a.games || byPrudent(a, b))[0];
  const topArch = [...archs].sort((a, b) => b.games - a.games || b.r - a.r)[0];
  const small: { key: string; node: ReactNode }[] = [];
  const wide: { key: string; node: ReactNode }[] = [];
  if (data) {
    small.push({
      key: "games",
      node: (
        <div className="an-cell">
          <div className="kicker an-cell-label">{w.snapshot.games}</div>
          <div className="an-cell-value">{fmtInt(total, locale)}</div>
          {data.overview.withOpponent ? <div className="an-cell-sub">{fmt(w.snapshot.withOpponent, { n: fmtInt(data.overview.withOpponent, locale) })}</div> : null}
        </div>
      ),
    });
  }
  if (topArch && total) {
    const [label] = archName(topArch.archetype);
    small.push({
      key: "arch",
      node: (
        <a className="an-cell" href="#archetypes">
          <div className="kicker an-cell-label">{w.snapshot.topArchetype}</div>
          <div className="an-cell-value">
            {pctNum(topArch.games / total, locale, 0)}
            <small>{unit}</small>
          </div>
          <div className="an-cell-sub">
            <span className="an-arch-tag">
              <ArchetypeIcon id={topArch.archetype} size="sm" />
              {label}
            </span>{" "}
            · {fmt(w.snapshot.archetypeSub, { p: P(topArch.r, 0) })}
          </div>
        </a>
      ),
    });
  }
  if (strongest) {
    wide.push({
      key: "strongest",
      node: (
        <a className="an-cell is-wide" href="#legendaries">
          <span className="an-cell-thumb">
            <CardArt src={strongest.card.image} thumb={strongest.card.thumb} name={strongest.card.name} width={76} eager />
          </span>
          <span className="min-w-0">
            <span className="kicker an-cell-label">{w.snapshot.strongest}</span>
            <span className="an-cell-name">
              <CardName name={strongest.card.name} legendary legendaryLabel={legendaryLabel} />
            </span>
            <span className="an-cell-value">
              {pctNum(strongest.r, locale)}
              <small>{unit}</small>
            </span>
            <span className="an-cell-sub">
              {gamesText(strongest.games)} · {strongest.lo > 0.5 ? w.snapshot.strongestSure : w.snapshot.strongestLead}
            </span>
          </span>
        </a>
      ),
    });
  }
  if (mostPlayed && mostPlayed !== strongest && legGames) {
    wide.push({
      key: "most",
      node: (
        <a className="an-cell is-wide" href={legs.length >= 3 ? "#meta-map" : "#legendaries"}>
          <span className="an-cell-thumb">
            <CardArt src={mostPlayed.card.image} thumb={mostPlayed.card.thumb} name={mostPlayed.card.name} width={76} eager />
          </span>
          <span className="min-w-0">
            <span className="kicker an-cell-label">{w.snapshot.mostPlayed}</span>
            <span className="an-cell-name">
              <CardName name={mostPlayed.card.name} legendary legendaryLabel={legendaryLabel} />
            </span>
            <span className="an-cell-value">
              {pctNum(legShare(mostPlayed.games), locale)}
              <small>{unit}</small>
            </span>
            <span className="an-cell-sub">{fmt(w.snapshot.mostPlayedSub, { n: fmtInt(mostPlayed.games, locale), p: P(mostPlayed.r, 0) })}</span>
          </span>
        </a>
      ),
    });
  }

  /* ---------- storie della patch ---------- */
  const watch = watchLegendary(legs);
  const stories: ReactNode[] = [];
  if (strongest && legs.length >= 2) {
    stories.push(
      <article key="solid" className="an-story">
        <span className="kicker">{w.stories.solid}</span>
        <p>{fmtNode(strongest.lo > 0.5 ? w.stories.solidSure : w.stories.solidLead, { name: <strong><CardName name={strongest.card.name} legendary legendaryLabel={legendaryLabel} /></strong>, p: P(strongest.r) })}</p>
        <footer>
          <span>{gamesText(strongest.games)}</span>
          <Interval lo={strongest.lo} hi={strongest.hi} r={strongest.r} axis={FULL} label={ciLabel(strongest)} style={{ width: 120 }} />
        </footer>
      </article>,
    );
  }
  if (watch && strongest) {
    stories.push(
      <article key="watch" className="an-story is-watch">
        <span className="kicker">{w.stories.watch}</span>
        <p>{fmtNode(w.stories.watchText, { name: <strong><CardName name={watch.card.name} legendary legendaryLabel={legendaryLabel} /></strong>, p: P(watch.r), top: strongest.card.name, games: gamesText(watch.games) })}</p>
        <footer>
          <span>{fmt(w.stories.watchRange, { lo: P(watch.lo, 0), hi: P(watch.hi, 0) })}</span>
        </footer>
      </article>,
    );
  }
  if (notable) {
    const a = getCardByKey(notable.legendary)!;
    const b = getCardByKey(notable.opponent)!;
    stories.push(
      <article key="match" className={`an-story${notable.r < 0.5 ? " is-down" : ""}`}>
        <span className="kicker">{w.stories.match}</span>
        <p>
          {fmtNode(notable.r >= 0.5 ? w.stories.matchUp : w.stories.matchDown, {
            a: <strong><CardName name={a.name} legendary legendaryLabel={legendaryLabel} /></strong>,
            b: <strong><CardName name={b.name} legendary legendaryLabel={legendaryLabel} /></strong>,
            w: fmtInt(notable.wins, locale),
            g: fmtInt(notable.games, locale),
            p: P(notable.r, 0),
          })}
        </p>
        <footer>
          <a href="#matchups" className="font-bold">
            {w.stories.matchLink}
          </a>
        </footer>
      </article>,
    );
  }

  /* ---------- Leggendarie: scala del tabellone ---------- */
  const legAxis = axisFor(legs.flatMap((s) => [s.lo, s.hi]));
  const legTicks = ticks(legAxis);

  /* ---------- archetipi: scala del lecca-lecca ---------- */
  const archAxis = axisFor(
    archs.map((s) => s.r),
    [
      { min: 0.4, max: 0.6 },
      { min: 0.25, max: 0.75 },
      { min: 0.1, max: 0.9 },
      { min: 0, max: 1 },
    ],
  );

  /* ---------- carte ---------- */
  const highlights = cardHighlights(cardRows);
  const tableRows: CardStatRow[] = cardRows.map((r) => {
    const swing = r.deck && r.played ? 0.5 + r.played.r - r.deck.r : null;
    return {
      key: r.card,
      name: r.info.name,
      href: cardHref(r.info),
      legendary: Boolean(r.info.legendary),
      mana: r.info.mana ?? null,
      deck: r.deck ? { pct: P(r.deck.r), games: fmtInt(r.deck.games, locale), r: r.deck.r, n: r.deck.games } : null,
      played: r.played ? { pct: P(r.played.r), games: fmtInt(r.played.games, locale), r: r.played.r, n: r.played.games } : null,
      swing: swing === null ? null : { ...delta(swing), sr: `${deltaText(swing, locale)} ${w.cards.swingSr}`, v: swing },
      turn: r.played?.avgTurn != null ? { text: fmtDec(r.played.avgTurn, locale, 1), v: r.played.avgTurn } : null,
    };
  });

  /* ---------- scontri: dati già pronti per il client ---------- */
  const order = notable ? matchupOrder(mus, new Map(legs.map((l) => [l.legendary, l.games]))).filter((k) => getCardByKey(k)) : [];
  const grid = matchupGrid(mus, order);
  const names = order.map((k) => getCardByKey(k)!.name);
  const codes = legendaryCodes(names);
  const mxLegs: MxLeg[] = order.map((k, i) => {
    const card = getCardByKey(k)!;
    const own = legByKey.get(k);
    return {
      key: k,
      name: card.name,
      short: shortName(card.name),
      code: codes[i],
      href: cardHref(card),
      src: card.image,
      thumb: card.thumb,
      wr: own ? P(own.r) : null,
      pickAria: own ? fmt(w.matchups.pickAria, { name: card.name, p: P(own.r), games: gamesText(own.games) }) : card.name,
      hasRow: grid[i].some((cell) => cell.kind === "ok" || cell.kind === "thin"),
    };
  });
  const mxGrid: MxCell[][] = grid.map((row) =>
    row.map((cell) => ({
      kind: cell.kind,
      games: cell.games,
      gamesNum: fmtInt(cell.games, locale),
      gamesText: gamesText(cell.games),
      val: cell.kind === "mirror" ? "—" : cell.kind === "none" ? "·" : String(Math.round(cell.r * 100)),
      tint: tintAlpha(cell),
      dir: dirOf(cell.r),
      pct: P(cell.r),
      pctNum: pctNum(cell.r, locale),
      pct0: P(cell.r, 0),
      lo: P(cell.lo, 0),
      hi: P(cell.hi, 0),
      wl: wl(cell),
      delta: delta(cell.r),
      verdict: verdictOf(cell),
      sure: isSure(cell),
      tenth: Math.round(cell.r * 10),
      r: cell.r,
      loN: cell.lo,
      hiN: cell.hi,
    })),
  );
  const mxVs = grid.map((row, i) => {
    const { best, worst } = vsLists(row);
    const withOpp = row.filter((cell) => cell.kind === "ok" || cell.kind === "thin").reduce((s, cell) => s + cell.games, 0);
    const own = legByKey.get(order[i]);
    return {
      best: best.map((cell) => order.indexOf(cell.b)),
      worst: worst.map((cell) => order.indexOf(cell.b)),
      sub: own ? fmt(w.matchups.vsSub, { games: gamesText(withOpp), p: P(own.r) }) : gamesText(withOpp),
    };
  });
  const rowNotable = grid.map((row) => {
    const n = notableMatchup(row.map((cell) => ({ ...cell, legendary: cell.a, opponent: cell.b })));
    return n ? order.indexOf(n.opponent) : -1;
  });
  const mxInitial = notable ? { a: order.indexOf(notable.legendary), b: order.indexOf(notable.opponent) } : { a: 0, b: 0 };

  /* ---------- copertura (invito all'app): quanto hanno già i numeri, senza soglie ---------- */
  const legendariesInGame = activeCards.filter((card) => card.legendary).length;
  const cardsInGame = activeCards.length;
  const meter = [
    { label: w.invite.legendaries, n: legs.length, of: legendariesInGame },
    { label: w.invite.cards, n: cardRows.length, of: cardsInGame },
    ...(published.length ? [{ label: w.invite.decks, n: decks.length, of: published.length }] : []),
  ];

  const countText = (n: number, many: string, one: string) => (n === 1 ? fmt(one, { games: gamesText(total) }) : fmt(many, { n: fmtInt(n, locale), games: gamesText(total) }));
  const sectionTitle = { legendaries: w.sections.legendaries.title, decks: w.sections.decks.title, archetypes: w.sections.archetypes.title, cards: w.sections.cards.title, matchups: w.sections.matchups.title };

  return (
    <div className="an-page">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: w.h1, path: href(locale, "/analytics") },
          ]),
        ]}
      />
      {/* testata: solo titolo e tasti (i testi stanno in fondo, come nelle altre pagine dei dati) */}
      <header className="an-wrap an-head">
        <p className="kicker text-mint">{d.nav.analytics}</p>
        <h1 className="t-page mt-2">{w.h1}</h1>
        <div className="an-head-actions">
          <Link href={appHref} prefetch={false} className="btn btn-ghost text-xs">
            ↓ {w.app.cta}
          </Link>
          <a href="#how-to-read" className="link-mint text-sm font-bold">
            {w.howTo}
          </a>
        </div>
      </header>

      {present.length ? (
        <nav aria-label={t.onThisPage} className="an-index">
          <ol className="an-wrap">
            {present.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} data-an-link={s.id}>
                  <b>{String(i + 1).padStart(2, "0")}</b>
                  {sectionTitle[s.id]}
                  <span className="an-index-count">{fmtInt(s.count, locale)}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      {!data ? (
        <div className="an-wrap mt-8">
          <div className="felt-panel-mint max-w-3xl p-6">
            <p className="text-pale">{w.empty}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Il palco: scoreboard e storie della patch */}
          <section className="an-band an-band--stage is-top" aria-labelledby="an-snap-title">
            <div className="an-wrap">
              <div className="an-panel an-snapshot an-reveal">
                <h2 id="an-snap-title" className="sr-only">
                  {w.snapshot.title}
                </h2>
                <div className="an-snap-top">
                  <span className="an-plate">
                    <span>{w.snapshot.plate}</span>
                  </span>
                  <span className="an-snap-patch">{fmt(w.snapshot.patch, { patch: patchName })}</span>
                  <span className="an-live">
                    <i aria-hidden="true" />
                    {w.snapshot.updated}
                  </span>
                </div>
                <div className={`an-snap-grid has-${small.length}-${wide.length}`}>
                  {small.map((s, i) => (
                    <div key={s.key} className={`an-cell-slot${small.length % 2 && i === small.length - 1 ? " is-full" : ""}`}>
                      {s.node}
                    </div>
                  ))}
                  {wide.map((s) => (
                    <div key={s.key} className="an-cell-slot is-full is-wide">
                      {s.node}
                    </div>
                  ))}
                </div>
              </div>
              {/* il ripiego sulla patch precedente: una riga grigia, mai un riquadro giallo (12/10/2026) */}
              {data.fallback ? <p className="an-quiet">{fmt(w.fallback, { current: patchLabel(latestPatch, locale), patch: patchName })}</p> : null}
              {stories.length ? (
                <div className="an-stories" role="group" aria-label={w.stories.label}>
                  {stories}
                </div>
              ) : null}
            </div>
          </section>

          {/* 01 Leggendarie */}
          {legs.length ? (
            <section id="legendaries" className={`an-band ${bandOf("legendaries")}`} aria-labelledby="an-h-legendaries">
              <div className="an-wrap">
                <SectionHead
                  num={numOf("legendaries")}
                  kicker={w.legendaries.kicker}
                  title={w.sections.legendaries.title}
                  id="an-h-legendaries"
                  meta={legs.length === 1 ? fmt(w.legendaries.metaOne, { games: gamesText(legGames) }) : fmt(w.legendaries.meta, { n: legs.length, games: gamesText(legGames) })}
                />
                <div className={`an-podium an-reveal has-${Math.min(3, legs.length)}`}>
                  {legs.slice(0, 3).map((s, i) => (
                    <article key={s.legendary} className={`an-pod is-p${i + 1}`}>
                      <Link href={cardHref(s.card)} prefetch={false} className="an-pod-card">
                        <CardArt src={s.card.image} thumb={s.card.thumb} name={s.card.name} width={i === 0 ? 200 : 150} alt={s.card.name} />
                      </Link>
                      <div className="an-panel an-pod-plate">
                        {/* la medaglia sta sulla targa, mai sopra la carta */}
                        <span className="an-medal">
                          <span aria-hidden="true">{c.medals[i]}</span>
                          <span className="sr-only">{fmt(c.position, { n: i + 1 })}</span>
                        </span>
                        <h3>
                          <CardName name={s.card.name} legendary legendaryLabel={legendaryLabel} />
                        </h3>
                        <div className="an-big-wr">
                          {pctNum(s.r, locale)}
                          <small>{unit}</small>
                        </div>
                        <Delta d={delta(s.r)} pt={c.pt} />
                        <Interval lo={s.lo} hi={s.hi} r={s.r} axis={FULL} label={ciLabel(s)} />
                        <div className="an-pod-meta">
                          <span className="font-mono text-pale">{gamesText(s.games)}</span> · {wl(s)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="an-method">
                  {w.legendaries.method}{" "}
                  <a href="#how-to-read" className="font-bold">
                    {w.legendaries.methodLink}
                  </a>
                </p>

                {/* il tabellone a forbici: tutte su un asse, divise per fascia (con quattro o più Leggendarie) */}
                {legs.length > 3 ? (
                  <div className="an-block an-reveal">
                    <h3 className="an-sub-h">{w.legendaries.boardTitle}</h3>
                    <div className="an-fp">
                      <div className="an-fp-axis" aria-hidden="true">
                        <span className="an-fp-lbl">{w.legendaries.axisName}</span>
                        <span className="an-fp-scale">
                          {legTicks.map((v) => (
                            <span key={v} className={v === 0.5 ? "is-mid" : undefined} style={{ left: `${pos(v, legAxis)}%` }}>
                              {Math.round(v * 100)}
                              {unit}
                            </span>
                          ))}
                        </span>
                        <span className="an-fp-lbl is-end">{w.legendaries.axisRate}</span>
                      </div>
                      {BANDS.map((b) => {
                        const list = legs.filter((s) => band(s) === b);
                        if (!list.length && b === "even") return null;
                        const info = w.legendaries.bands[b];
                        const cls = b.startsWith("up") ? "up" : b.startsWith("down") ? "down" : "even";
                        return (
                          <div key={b}>
                            <div className="an-fp-band">
                              <strong>
                                <span className={`an-delta is-${cls}`} aria-hidden="true">
                                  {b === "up-sure" ? "▲▲" : b === "up" ? "▲" : b === "even" ? "=" : b === "down" ? "▼" : "▼▼"}
                                </span>{" "}
                                {info.title}
                              </strong>
                              <span>
                                {info.rule}
                                {list.length ? "" : ` · ${w.legendaries.bandEmpty}`}
                              </span>
                            </div>
                            {list.map((s) => (
                              <div key={s.legendary} className="an-fp-row">
                                <div className="an-fp-name">
                                  <Link href={cardHref(s.card)} prefetch={false}>
                                    <CardName name={s.card.name} legendary legendaryLabel={legendaryLabel} />
                                  </Link>
                                  <small>{gamesText(s.games)}</small>
                                </div>
                                <div className="an-fp-plot" role="img" aria-label={ciLabel(s)} style={{ "--mid": `${pos(0.5, legAxis)}%` } as CSSProperties}>
                                  <span className="an-fp-range" style={{ left: `${pos(s.lo, legAxis)}%`, width: `${Math.max(0.5, pos(s.hi, legAxis) - pos(s.lo, legAxis))}%` }} />
                                  <span className={`an-fp-dot is-${dirOf(s.r)}`} style={{ left: `${pos(s.r, legAxis)}%` }} />
                                </div>
                                <div className="an-fp-wr">
                                  <b>{P(s.r)}</b>
                                  <Delta d={delta(s.r)} pt={c.pt} block />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* la mappa del meta (con tre o più Leggendarie) */}
                {legs.length >= 3 ? (
                  <div className="an-block scroll-mt-36" id="meta-map">
                    <h3 className="an-sub-h">{w.legendaries.mapTitle}</h3>
                    <p className="an-lead">{w.legendaries.mapLead}</p>
                    <div className="an-panel an-map-wrap an-reveal">
                      <MetaMap
                        points={legs.map((s) => ({ key: s.legendary, label: s.card.name, share: legShare(s.games), r: s.r }))}
                        titles={Object.fromEntries(
                          legs.map((s) => [s.legendary, fmt(w.legendaries.mapPoint, { name: s.card.name, p: P(s.r), games: gamesText(s.games), share: P(legShare(s.games)) })]),
                        )}
                        labels={{ aria: w.legendaries.mapAria, axis: w.legendaries.mapAxis, unit, quadrants: w.legendaries.mapQuadrants as [string, string, string, string], quadrantsShort: w.legendaries.mapQuadrantsShort as [string, string, string, string] }}
                      />
                      <div className="an-map-legend">
                        <span>
                          <i className="is-up" />
                          {w.legendaries.mapUp}
                        </span>
                        <span>
                          <i className="is-down" />
                          {w.legendaries.mapDown}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <details className="an-data">
                  <summary>{w.legendaries.tableSummary}</summary>
                  <div className="an-panel an-table-box">
                    <table className="an-table an-sticky-col">
                      <caption>{fmt(w.legendaries.tableCaption, { patch: patchName })}</caption>
                      <thead>
                        <tr>
                          {Object.values(w.legendaries.cols).map((label) => (
                            <th key={label} scope="col">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {legs.map((s) => (
                          <tr key={s.legendary}>
                            <td>
                              <Link href={cardHref(s.card)} prefetch={false} className="an-table-link">
                                <CardName name={s.card.name} legendary legendaryLabel={legendaryLabel} />
                              </Link>
                            </td>
                            <td className="is-num">
                              <b>{P(s.r)}</b>
                            </td>
                            <td className="is-num">
                              {P(s.lo, 0)}–{P(s.hi, 0)}
                            </td>
                            <td className="is-num">{P(s.lo)}</td>
                            <td className="is-num">{fmtInt(s.games, locale)}</td>
                            <td className="is-num">{wl(s)}</td>
                            <td className="is-num">{P(legShare(s.games))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            </section>
          ) : null}

          {/* 02 Mazzi della community: classifica da diretta */}
          <section id="decks" className={`an-band ${bandOf("decks")}`} aria-labelledby="an-h-decks">
            <div className="an-wrap">
              <SectionHead
                num={numOf("decks")}
                kicker={w.decks.kicker}
                title={w.sections.decks.title}
                id="an-h-decks"
                meta={decks.length ? (decks.length === 1 ? w.decks.metaOne : fmt(w.decks.meta, { n: fmtInt(decks.length, locale) })) : undefined}
              />
              {decks.length ? (
                <ol className="an-lb an-reveal">
                  {decks.map((s, i) => {
                    const leg = s.deck.legendary ? getCard(s.deck.legendary) : undefined;
                    const [archLabel] = archName(s.deck.archetype);
                    return (
                      <li key={s.deck.slug} className={`an-lb-row${i === 0 ? " is-first" : ""}`}>
                        <span className="an-lb-pos">
                          <span aria-hidden="true">{i + 1}</span>
                          <span className="sr-only">{fmt(c.position, { n: i + 1 })}</span>
                        </span>
                        <div className="an-lb-name">
                          {i === 0 && decks.length > 1 ? <span className="kicker">{w.decks.first}</span> : null}
                          <h3>
                            <Link href={href(locale, `/decks/community/${s.deck.slug}`)} prefetch={false}>
                              {s.deck.name}
                            </Link>
                          </h3>
                          <div className="an-lb-sub">
                            <span className="an-arch-tag">
                              <ArchetypeIcon id={s.deck.archetype} size="sm" />
                              {archLabel}
                            </span>
                            {leg ? (
                              <span>
                                <CardName name={leg.name} legendary legendaryLabel={legendaryLabel} />
                              </span>
                            ) : null}
                            <span>{fmt(w.decks.by, { name: authorName(s.deck.profile) })}</span>
                          </div>
                        </div>
                        <div className="an-lb-ci">
                          <Interval lo={s.lo} hi={s.hi} r={s.r} axis={FULL} label={ciLabel(s)} />
                          <div className="an-lb-ci-row">
                            <span className="font-mono text-pale">{gamesText(s.games)}</span>
                            <span>{wl(s)}</span>
                          </div>
                        </div>
                        <div className="an-lb-wr">
                          <b>
                            {pctNum(s.r, locale)}
                            <small>{unit}</small>
                          </b>
                          <Delta d={delta(s.r)} pt={c.pt} block />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="an-empty an-reveal">
                  <p>{w.decks.empty}</p>
                  <Link href={href(locale, "/deck-builder")} prefetch={false} className="btn btn-ghost text-xs">
                    {w.decks.publish} →
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* 03 Archetipi: lecca-lecca dal 50%, il simbolino in punta */}
          {archs.length ? (
            <section id="archetypes" className={`an-band ${bandOf("archetypes")}`} aria-labelledby="an-h-archetypes">
              <div className="an-wrap">
                <SectionHead
                  num={numOf("archetypes")}
                  kicker={w.archetypes.kicker}
                  title={w.sections.archetypes.title}
                  id="an-h-archetypes"
                  meta={topArch && total ? fmt(w.archetypes.meta, { name: archName(topArch.archetype)[0], p: P(topArch.games / total, 0) }) : undefined}
                />
                <div className="an-lol an-reveal">
                  <div className="an-lol-axis" aria-hidden="true">
                    <span className="an-fp-lbl">{w.archetypes.axis}</span>
                    <span className="an-lol-scale">
                      {ticks(archAxis).map((v) => (
                        <span key={v} className={v === 0.5 ? "is-mid" : undefined} style={{ left: `${pos(v, archAxis)}%` }}>
                          {Math.round(v * 100)}
                          {unit}
                        </span>
                      ))}
                    </span>
                    <span className="an-fp-lbl is-end">{w.legendaries.axisRate}</span>
                  </div>
                  {archs.map((s) => {
                    const [label, hint] = archName(s.archetype);
                    const x = pos(s.r, archAxis);
                    const mid = pos(0.5, archAxis);
                    const dir = dirOf(s.r);
                    return (
                      <div key={s.archetype} className="an-lol-row">
                        <div className="an-lol-name">
                          <ArchetypeIcon id={s.archetype} size="lg" />
                          <span className="min-w-0">
                            <b>{label}</b>
                            <small>
                              {hint ? `${hint} · ` : ""}
                              {fmt(w.archetypes.sub, { games: gamesText(s.games), share: P(total ? s.games / total : 0, 0) })}
                            </small>
                          </span>
                        </div>
                        <div className="an-lol-plot" aria-hidden="true" style={{ "--mid": `${mid}%` } as CSSProperties}>
                          <span className={`an-lol-line is-${dir}`} style={dir === "down" ? { left: `${x}%`, width: `${mid - x}%` } : { left: `${mid}%`, width: `${Math.max(0, x - mid)}%` }} />
                          <span className="an-lol-head" style={{ left: `${x}%` }}>
                            <ArchetypeIcon id={s.archetype} size="sm" />
                            {archetypeIcon(s.archetype) ? null : <span className="an-lol-dot" />}
                          </span>
                        </div>
                        <div className="an-lol-val">
                          <span className="font-mono">{P(s.r)}</span>
                          <Delta d={delta(s.r)} pt={c.pt} block />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {/* 04 Carte */}
          {cardRows.length ? (
            <section id="cards" className={`an-band ${bandOf("cards")}`} aria-labelledby="an-h-cards">
              <div className="an-wrap">
                <SectionHead
                  num={numOf("cards")}
                  kicker={w.cards.kicker}
                  title={w.sections.cards.title}
                  id="an-h-cards"
                  meta={countText(cardRows.length, w.cards.meta, w.cards.metaOne)}
                />
                <div className="an-feats">
                  {highlights.most?.deck && total ? (
                    <article className="an-feat an-reveal">
                      <Link href={cardHref(highlights.most.info)} prefetch={false}>
                        <CardArt src={highlights.most.info.image} thumb={highlights.most.info.thumb} name={highlights.most.info.name} width={84} alt={highlights.most.info.name} />
                      </Link>
                      <div className="min-w-0">
                        <span className="kicker">{w.cards.most}</span>
                        <h3>
                          <CardName name={highlights.most.info.name} legendary={highlights.most.info.legendary} legendaryLabel={legendaryLabel} />
                        </h3>
                        <div className="an-big-wr">
                          {pctNum(highlights.most.deck.games / total, locale, 0)}
                          <small>{unit}</small>
                        </div>
                        <p>{fmt(w.cards.mostSub, { n: fmtInt(highlights.most.deck.games, locale), p: P(highlights.most.deck.r) })}</p>
                      </div>
                    </article>
                  ) : null}
                  {highlights.win?.played ? (
                    <article className="an-feat an-reveal">
                      <Link href={cardHref(highlights.win.info)} prefetch={false}>
                        <CardArt src={highlights.win.info.image} thumb={highlights.win.info.thumb} name={highlights.win.info.name} width={84} alt={highlights.win.info.name} />
                      </Link>
                      <div className="min-w-0">
                        <span className="kicker">{w.cards.win}</span>
                        <h3>
                          <CardName name={highlights.win.info.name} legendary={highlights.win.info.legendary} legendaryLabel={legendaryLabel} />
                        </h3>
                        <div className="an-big-wr">
                          {pctNum(highlights.win.played.r, locale)}
                          <small>{unit}</small>
                        </div>
                        <Delta d={delta(highlights.win.played.r)} pt={c.pt} />
                        <p>
                          {highlights.win.played.avgTurn != null
                            ? fmt(w.cards.winSub, { games: gamesText(highlights.win.played.games), t: fmtDec(highlights.win.played.avgTurn, locale, 1) })
                            : fmt(w.cards.winSubNoTurn, { games: gamesText(highlights.win.played.games) })}
                        </p>
                      </div>
                    </article>
                  ) : null}
                  {highlights.swing?.played && highlights.swing.deck ? (
                    <article className="an-feat an-reveal">
                      <Link href={cardHref(highlights.swing.info)} prefetch={false}>
                        <CardArt src={highlights.swing.info.image} thumb={highlights.swing.info.thumb} name={highlights.swing.info.name} width={84} alt={highlights.swing.info.name} />
                      </Link>
                      <div className="min-w-0">
                        <span className="kicker">{w.cards.swing}</span>
                        <h3>
                          <CardName name={highlights.swing.info.name} legendary={highlights.swing.info.legendary} legendaryLabel={legendaryLabel} />
                        </h3>
                        <div className="an-big-wr">
                          {deltaText(0.5 + highlights.swing.played.r - highlights.swing.deck.r, locale)}
                          <small> {c.pt}</small>
                        </div>
                        <p>{fmt(w.cards.swingSub, { played: P(highlights.swing.played.r), deck: P(highlights.swing.deck.r) })}</p>
                      </div>
                    </article>
                  ) : null}
                </div>
                <details className="an-data">
                  <summary>{w.cards.tableSummary}</summary>
                  <div className="an-panel an-table-box">
                    <CardStatsTable
                      rows={tableRows}
                      labels={{
                        caption: w.cards.tableCaption,
                        cols: { card: w.cols.card, inDeck: w.cols.inDeck, played: w.cols.played, swing: w.cards.swingCol, avgRound: w.cols.avgRound },
                        cost: w.cards.cost,
                        legendary: legendaryLabel,
                        pt: c.pt,
                      }}
                    />
                  </div>
                </details>
              </div>
            </section>
          ) : null}

          {/* 05 Scontri: filtro a carte, vince/soffre, tabella con il pannello */}
          {notable ? (
            <section id="matchups" className="an-band an-band--stage" aria-labelledby="an-h-matchups">
              <div className="an-wrap">
                <SectionHead
                  num={numOf("matchups")}
                  kicker={w.matchups.kicker}
                  title={w.sections.matchups.title}
                  id="an-h-matchups"
                  meta={countText(present.find((s) => s.id === "matchups")?.count ?? 0, w.matchups.meta, w.matchups.metaOne)}
                />
                <p className="an-lead">{w.matchups.lead}</p>
                <MatchupExplorer
                  legs={mxLegs}
                  grid={mxGrid}
                  vs={mxVs}
                  rowNotable={rowNotable}
                  initial={mxInitial}
                  labels={{
                    ...w.matchups,
                    vs: w.vs,
                    pt: c.pt,
                    ciAria: c.interval,
                    legendary: legendaryLabel,
                    unit,
                  }}
                />
              </div>
            </section>
          ) : null}
        </>
      )}

      <div className="an-wrap an-closing">
        {/* Invito all'app: da dove arrivano i numeri, e quanto coprono già */}
        <section className="an-panel an-invite an-reveal" aria-labelledby="an-h-app">
          <div>
            <span className="an-plate is-mint">
              <span>OriginsMeta Tracker</span>
            </span>
            <h2 id="an-h-app" className="an-h2 mt-3">
              {w.invite.title}
            </h2>
            <p>{w.invite.text}</p>
            <div className="an-invite-actions">
              <Link href={appHref} prefetch={false} className="btn btn-primary text-xs">
                {w.app.cta}
              </Link>
              <Link href={trackerInstallHref(locale)} prefetch={false} className="link-mint text-sm font-bold">
                {w.invite.guide} →
              </Link>
            </div>
          </div>
          <div className="an-meter">
            <span className="kicker text-sky">{w.invite.meterTitle}</span>
            {meter.map((m) => (
              <div key={m.label} className="an-meter-row">
                <div className="an-meter-lbl">
                  <span>{m.label}</span>
                  <span className="font-mono">
                    {fmtInt(m.n, locale)} / {fmtInt(m.of, locale)}
                  </span>
                </div>
                <div className="an-meter-bar" aria-hidden="true">
                  <span style={{ width: `${m.of ? Math.min(100, (m.n / m.of) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* I testi della pagina, dopo il contenuto (come le altre pagine dei dati, 29/09/2026) */}
        <PageNotes>
          <section id="how-to-read" className="an-notes scroll-mt-36" aria-labelledby="an-h-notes">
            <h2 id="an-h-notes">{w.notesText.title}</h2>
            <p>{w.intro}</p>
            <TierSourceLine
              items={[
                { label: t.lineSource, text: fmt(w.sourceText, { patch: patchName }) },
                ...(data ? [{ label: t.lineSample, text: gamesText(total) }] : []),
                { label: t.lineMeasure, text: w.measureText },
              ]}
            />
            <h3>{w.notesText.sectionsTitle}</h3>
            <TierSectionNotes items={[w.sections.legendaries, w.sections.decks, w.sections.archetypes, w.sections.cards, w.sections.matchups]} />
            <h3>{w.notesText.wordsTitle}</h3>
            <dl>
              {w.notesText.glossary.map((g) => (
                <div key={g.term}>
                  <dt>{g.term}</dt>
                  <dd>{g.text}</dd>
                </div>
              ))}
              <div>
                <dt>{w.notesText.archetypesTerm}</dt>
                <dd className="an-arch-key">
                  {Object.keys(archetypeLabels).map((id) => (
                    <span key={id} className="an-arch-tag">
                      <ArchetypeIcon id={id} size="sm" />
                      {archName(id)[0]}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <h3>{w.notesText.dataTitle}</h3>
            <ul>
              {w.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
              {data && total ? <li>{fmt(w.notesText.bias, { p: P(data.overview.wins / total) })}</li> : null}
            </ul>
            <p className="an-notes-links">
              <span>
                {t.mainText}{" "}
                <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
                  {t.mainAnchor} →
                </Link>
              </span>
              <span>
                {t.decksText}{" "}
                <Link href={href(locale, "/decks")} className="link-mint font-bold">
                  {t.decksAnchor} →
                </Link>
              </span>
              <span>
                {w.app.notesText}{" "}
                <Link href={appHref} className="link-mint font-bold">
                  {w.app.notesAnchor} →
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
