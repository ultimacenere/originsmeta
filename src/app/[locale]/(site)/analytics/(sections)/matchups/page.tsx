import type { Metadata } from "next";
import { resolveLocale, pageMeta, type LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { loadSections, patchName, sectionHref, type SearchParams } from "@/lib/community/analyticsSections";
import { MatchupExplorer, type MxCell, type MxLeg } from "@/components/analytics/MatchupExplorer";
import type { DeltaInfo } from "@/components/analytics/parts";
import { Band, SecHead, fill, rich } from "@/components/analytics/sections/parts";
import {
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
  rated,
  shortName,
  tintAlpha,
  verdictOf,
  vsLists,
} from "@/lib/tracker/snapshot";

/*
  Sezione «Scontri» di Analytics (27/11/2026): l'esploratore degli scontri di /analytics (MatchupExplorer, contato a due
  lati, testi del dizionario `tier.winrate.matchups`) su una pagina sua, con la patch scelta.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const L = analyticsSectionsLabels[locale];
  return dropHreflang(pageMeta(locale, "/analytics/matchups", `${L.matchups.title} · Analytics`, L.matchups.lead, undefined, { noindex: true }));
}

export default async function MatchupsPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const L = analyticsSectionsLabels[locale];
  const M = L.matchups;
  const sez = await loadSections(searchParams);
  if (!sez)
    return (
      <Band top tone="stage">
        <SecHead as="h1" title={M.title} brief={[L.common.unavailable]} />
      </Band>
    );
  const { cur } = sez;
  const w = d.tier.winrate;
  const c = w.common;
  const unit = pctUnit(locale);
  const P = (r: number, digits = 1) => pct(r, locale, digits);
  const gText = (n: number) => (n === 1 ? w.gamesOne : fill(w.games, { n: fmtInt(n, locale) }));
  const games = (n: number) => (n === 1 ? L.common.gamesOne : fill(L.common.games, { n: fmtInt(n, locale) }));
  const wl = (s: { wins: number; games: number }) => `${fmtInt(s.wins, locale)}–${fmtInt(s.games - s.wins, locale)}`;
  const delta = (r: number): DeltaInfo => {
    const dir = dirOf(r);
    const pts = fmtDec(Math.abs(deltaPoints(r)), locale, 1);
    return { dir, text: deltaText(r, locale), sr: dir === "up" ? fill(c.above, { d: pts }) : dir === "down" ? fill(c.below, { d: pts }) : c.even };
  };

  // gli scontri delle sezioni sono già a due lati e speculari: le funzioni di snapshot.ts lavorano su qualsiasi chiave
  const mus = cur.matchups.map((m) => rated({ legendary: m.a, opponent: m.b, games: m.games, wins: m.wins }));
  const notable = notableMatchup(mus);
  const legBy = new Map(cur.legendaries.map((l) => [l.slug, l]));
  const order = notable ? matchupOrder(mus, new Map(cur.legendaries.map((l) => [l.slug, l.games]))).filter((s) => getCard(s)) : [];
  if (!notable || !order.length)
    return (
      <Band top tone="stage">
        <SecHead as="h1" title={M.title} brief={[M.none]} />
      </Band>
    );
  const grid = matchupGrid(mus, order);
  const codes = legendaryCodes(order.map((s) => getCard(s)!.name));
  const legs: MxLeg[] = order.map((s, i) => {
    const card = getCard(s)!;
    const own = legBy.get(s);
    return {
      key: s,
      name: card.name,
      short: shortName(card.name),
      code: codes[i],
      href: sectionHref(locale, `/legendaries/${s}`, sez),
      src: card.image,
      thumb: card.thumb,
      wr: own ? P(own.r) : null,
      pickAria: own ? fill(w.matchups.pickAria, { name: card.name, p: P(own.r), games: gText(own.games) }) : card.name,
      hasRow: grid[i].some((cell) => cell.kind === "ok" || cell.kind === "thin"),
    };
  });
  const cells: MxCell[][] = grid.map((row) =>
    row.map((cell) => ({
      kind: cell.kind,
      games: cell.games,
      gamesNum: fmtInt(cell.games, locale),
      gamesText: gText(cell.games),
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
  const vs = grid.map((row, i) => {
    const { best, worst } = vsLists(row);
    const withOpp = row.filter((cell) => cell.kind === "ok" || cell.kind === "thin").reduce((s, cell) => s + cell.games, 0);
    const own = legBy.get(order[i]);
    return {
      best: best.map((cell) => order.indexOf(cell.b)),
      worst: worst.map((cell) => order.indexOf(cell.b)),
      sub: own ? fill(w.matchups.vsSub, { games: gText(withOpp), p: P(own.r) }) : gText(withOpp),
    };
  });
  const rowNotable = grid.map((row) => {
    const n = notableMatchup(row.map((cell) => ({ ...cell, legendary: cell.a, opponent: cell.b })));
    return n ? order.indexOf(n.opponent) : -1;
  });
  const initial = { a: order.indexOf(notable.legendary), b: order.indexOf(notable.opponent) };

  return (
    <Band top tone="stage">
      <SecHead
        as="h1"
        title={M.title}
        brief={[
          rich(M.notable, { a: getCard(notable.legendary)?.name ?? "", b: getCard(notable.opponent)?.name ?? "", p: P(notable.r, 0), games: games(notable.games) }),
          M.lead,
          fill(M.base, { games: games(cur.matchedGames), patch: patchName(cur.patch, locale) }),
        ]}
      />
      <MatchupExplorer
        legs={legs}
        grid={cells}
        vs={vs}
        rowNotable={rowNotable}
        initial={initial}
        labels={{ ...w.matchups, vs: w.vs, pt: c.pt, ciAria: c.interval, legendary: d.common.legendary, unit }}
      />
    </Band>
  );
}
