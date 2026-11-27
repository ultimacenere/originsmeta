import { getDictionary } from "@/lib/i18n";
import { protoMeta } from "@/components/proto/ProtoBar";
import { MatchupExplorer, type MxCell, type MxLeg } from "@/components/analytics/MatchupExplorer";
import type { DeltaInfo } from "@/components/analytics/parts";
import { cardOf, gamesText, loadSez, sezHref } from "@/lib/proto/sezioni";
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
  Sezione «Scontri» del prototipo a sezioni (27/11/2026): lo stesso esploratore degli scontri di /analytics di oggi
  (MatchupExplorer, contato a due lati), su una pagina sua e con la patch scelta. I testi sono quelli del dizionario.
*/

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/scontri", "Analytics: scontri (prototipo)", "Prototipo: chi batte chi fra le Leggendarie di Origins TCG, con i numeri veri del Tracker.");
}

const L = {
  title: "Scontri",
  lead: "Chi batte chi fra le Leggendarie, contando tutti e due i lati di ogni partita. Scegli una Leggendaria per vedere contro chi vince e contro chi soffre.",
  none: "In questa patch non ci sono ancora abbastanza scontri.",
};

const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

export default async function Scontri({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez) return <p className="text-pale">I numeri del Tracker non rispondono: riprova fra qualche minuto.</p>;
  const { cur } = sez;
  const locale = "it" as const;
  const d = getDictionary(locale);
  const w = d.tier.winrate;
  const c = w.common;
  const unit = pctUnit(locale);
  const P = (r: number, digits = 1) => pct(r, locale, digits);
  const gText = (n: number) => (n === 1 ? w.gamesOne : fmt(w.games, { n: fmtInt(n, locale) }));
  const wl = (s: { wins: number; games: number }) => `${fmtInt(s.wins, locale)}–${fmtInt(s.games - s.wins, locale)}`;
  const delta = (r: number): DeltaInfo => {
    const dir = dirOf(r);
    const pts = fmtDec(Math.abs(deltaPoints(r)), locale, 1);
    return { dir, text: deltaText(r, locale), sr: dir === "up" ? fmt(c.above, { d: pts }) : dir === "down" ? fmt(c.below, { d: pts }) : c.even };
  };

  // gli scontri del prototipo sono già a due lati e speculari: le funzioni di snapshot.ts lavorano su qualsiasi chiave
  const mus = cur.matchups.map((m) => rated({ legendary: m.a, opponent: m.b, games: m.games, wins: m.wins }));
  const notable = notableMatchup(mus);
  const legBy = new Map(cur.legendaries.map((l) => [l.slug, l]));
  const order = notable ? matchupOrder(mus, new Map(cur.legendaries.map((l) => [l.slug, l.games]))).filter((s) => cardOf(s)) : [];
  if (!notable || !order.length) return <p className="text-pale">{L.none}</p>;
  const grid = matchupGrid(mus, order);
  const codes = legendaryCodes(order.map((s) => cardOf(s)!.name));
  const legs: MxLeg[] = order.map((s, i) => {
    const card = cardOf(s)!;
    const own = legBy.get(s);
    return {
      key: s,
      name: card.name,
      short: shortName(card.name),
      code: codes[i],
      href: sezHref(`/leggendarie/${s}`, sez),
      src: card.image,
      thumb: card.thumb,
      wr: own ? P(own.r) : null,
      pickAria: own ? fmt(w.matchups.pickAria, { name: card.name, p: P(own.r), games: gText(own.games) }) : card.name,
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
      sub: own ? fmt(w.matchups.vsSub, { games: gText(withOpp), p: P(own.r) }) : gText(withOpp),
    };
  });
  const rowNotable = grid.map((row) => {
    const n = notableMatchup(row.map((cell) => ({ ...cell, legendary: cell.a, opponent: cell.b })));
    return n ? order.indexOf(n.opponent) : -1;
  });
  const initial = { a: order.indexOf(notable.legendary), b: order.indexOf(notable.opponent) };

  return (
    <div>
      <h2 className="sez-h2">{L.title}</h2>
      <p className="sez-lead">{L.lead}</p>
      <p className="sez-note mt-1">{gamesText(cur.matchedGames)} con la Leggendaria avversaria nota · {cur.label}</p>
      <div className="an-page mt-5">
        <MatchupExplorer
          legs={legs}
          grid={cells}
          vs={vs}
          rowNotable={rowNotable}
          initial={initial}
          labels={{ ...w.matchups, vs: w.vs, pt: c.pt, ciAria: c.interval, legendary: d.common.legendary, unit }}
        />
      </div>
    </div>
  );
}
