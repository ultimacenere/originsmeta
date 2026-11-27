import Link from "@/components/IntentLink";
import { protoMeta } from "@/components/proto/ProtoBar";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { Band, MoveTag, SezHead, WrBar } from "@/components/proto/sezioni/parts";
import { MazziList, MazziTop, type MDeck, type MThumb, type MLeg } from "@/components/proto/sezioni/mazzi/MazziList";
import { archetypeLabels } from "@/lib/data/decks";
import { gameInput } from "@/lib/proto/analyticsProto";
import { cardOf, gamesText, listKeyOf, loadSez, moveOf, pctText, publishedByList, sezHref } from "@/lib/proto/sezioni";

/*
  Prototipo «Analytics a sezioni», sezione Mazzi (27/11/2026; rifinitura dello stesso giorno, Pierluigi: telefono,
  grafica, contenuti). Le liste esatte registrate dal Tracker nella patch scelta, ordinate per win rate prudente (bordo
  basso dell'intervallo al 95%): in cima le frasi da sapere e i primi tre in evidenza, poi tutte le altre compatte con il
  filtro per Leggendaria, infine gli archetipi.
*/

const L = {
  title: "Mazzi migliori da copiare",
  meta: "Mazzi migliori da copiare: prototipo di Analytics",
  description: "Prototipo: le liste esatte di Origins TCG che vincono di più nel Tracker, con il codice del gioco da copiare.",
  best: (name: string, p: string, games: string, lo: string) => (
    <>
      Il mazzo migliore è <b>{name}</b>: vince il <b>{p}</b> su {games}, almeno il {lo} nel caso peggiore.
    </>
  ),
  mostLists: (leg: string, n: number, of: number) => (
    <>
      <b>{leg}</b> ha più liste in alto: {n} delle prime {of}.
    </>
  ),
  count: (n: number, solid: number) => (
    <>
      <b>{n.toLocaleString("it-IT")}</b> liste esatte registrate in questa patch, {solid.toLocaleString("it-IT")} con almeno 20 partite.
    </>
  ),
  others: "Tutte le altre liste",
  othersLead: "Una lista esatta ha tutte e 13 le carte uguali. Prima quelle che vincono di più anche nel caso peggiore: con poche partite una lista resta sotto finché non le accumula.",
  archTitle: "Archetipi",
  archTop: (name: string, p: string) => (
    <>
      L&apos;archetipo più giocato è <b>{name}</b>, nel {p} delle partite.
    </>
  ),
  archBest: (name: string, p: string, games: string) => (
    <>
      Quello che vince di più è <b>{name}</b>: {p} su {games}.
    </>
  ),
  archNote: "L'archetipo è quello che il Tracker assegna alla partita quando la registra, non quello scelto da chi ha pubblicato il mazzo.",
  share: "delle partite",
  arrows: (label: string) => `Le frecce: punti di win rate rispetto a ${label}, colorate solo quando lo spostamento è netto.`,
  legendsLink: "Le carte e le liste di ogni Leggendaria sono nella sezione",
  legends: "Leggendarie",
  empty: "I numeri del Tracker non rispondono: riprova fra qualche minuto.",
  none: "Nessuna lista esatta registrata in questa patch.",
};

export const revalidate = 300;
const PER_LEGENDARY = 30;
const TOP = 3;
const SOLID = 20;

export function generateMetadata() {
  return protoMeta("/proto/analytics/sezioni/mazzi", L.meta, L.description);
}

export default async function MazziPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sez = await loadSez(searchParams);
  if (!sez)
    return (
      <Band tone="stage" top>
        <p className="text-pale">{L.empty}</p>
      </Band>
    );
  const { cur, prev } = sez;
  const published = await publishedByList();

  const lists = [...cur.lists].sort((a, b) => b.lo - a.lo || b.games - a.games);
  const thumbs: Record<string, MThumb> = {};
  const legs: Record<string, MLeg> = {};
  const decks: MDeck[] = [];
  const perLeg = new Map<string, number>();
  for (const l of lists) {
    const leg = cardOf(l.legendary);
    if (!leg) continue;
    // al massimo 30 liste per Leggendaria: la pagina resta leggera
    const seen = perLeg.get(l.legendary) ?? 0;
    if (seen >= PER_LEGENDARY) continue;
    perLeg.set(l.legendary, seen + 1);
    if (!legs[l.legendary]) legs[l.legendary] = { slug: leg.slug, name: leg.name, art: leg.art ?? leg.thumb ?? null, input: gameInput(leg) };
    for (const s of l.cards) {
      if (thumbs[s]) continue;
      const c = cardOf(s);
      if (c) thumbs[s] = { slug: s, name: c.name, thumb: c.thumb ?? null, mana: c.mana ?? null };
    }
    const cards = [...l.cards].sort((a, b) => (thumbs[a]?.mana ?? 99) - (thumbs[b]?.mana ?? 99) || (thumbs[a]?.name ?? a).localeCompare(thumbs[b]?.name ?? b));
    const pub = published.get(listKeyOf(l.legendary, l.cards))?.[0] ?? null;
    const name = pub?.name ?? `${leg.name} · lista ${decks.filter((d) => d.legendary === l.legendary).length + 1}`;
    const keys = [l.legendary, ...cards].map((x) => cardOf(x)?.key);
    decks.push({ id: listKeyOf(l.legendary, l.cards), legendary: l.legendary, cards, games: l.games, wins: l.wins, r: l.r, lo: l.lo, hi: l.hi, name, published: pub, keys: keys.every(Boolean) ? (keys as string[]) : null });
  }
  const gamesOf = (s: string) => decks.filter((d) => d.legendary === s).reduce((n, d) => n + d.games, 0);
  const legOrder = Object.keys(legs).sort((a, b) => gamesOf(b) - gamesOf(a));

  // le frasi da sapere, la più importante per prima
  const brief = [];
  const best = decks[0];
  if (best) brief.push(L.best(best.name, pctText(best.r), gamesText(best.games), pctText(best.lo)));
  const head = decks.slice(0, 15);
  const byLeg = new Map<string, number>();
  for (const d of head) byLeg.set(d.legendary, (byLeg.get(d.legendary) ?? 0) + 1);
  const topLeg = [...byLeg].sort((a, b) => b[1] - a[1])[0];
  if (topLeg && topLeg[1] > 1) brief.push(L.mostLists(legs[topLeg[0]]?.name ?? topLeg[0], topLeg[1], head.length));
  if (cur.lists.length) brief.push(L.count(cur.lists.length, cur.lists.filter((l) => l.games >= SOLID).length));

  const archs = cur.archetypes.map((a) => {
    const before = prev?.archetypes.find((x) => x.archetype === a.archetype) ?? null;
    return { a, share: cur.games ? a.games / cur.games : 0, move: moveOf(before, a), name: archetypeLabels[a.archetype]?.it ?? a.archetype };
  });
  const archByShare = [...archs].sort((x, y) => y.share - x.share);
  const archByWin = archs.filter((x) => x.a.games >= SOLID).sort((x, y) => y.a.lo - x.a.lo);
  const archBrief = [];
  if (archByShare[0]) archBrief.push(L.archTop(archByShare[0].name, pctText(archByShare[0].share)));
  if (archByWin[0] && archByWin[0].a.archetype !== archByShare[0]?.a.archetype) archBrief.push(L.archBest(archByWin[0].name, pctText(archByWin[0].a.r), gamesText(archByWin[0].a.games)));

  return (
    <>
      <Band tone="stage" top>
        <SezHead title={L.title} brief={brief} />
        {decks.length ? <MazziTop decks={decks.slice(0, TOP)} legs={legs} thumbs={thumbs} /> : <p className="sez-note">{L.none}</p>}
      </Band>

      {decks.length > TOP ? (
        <Band tone="felt">
          <h2 className="sez-h2">{L.others}</h2>
          <p className="sez-lead mb-4">{L.othersLead}</p>
          <MazziList decks={decks} legs={legs} legOrder={legOrder} thumbs={thumbs} skip={TOP} />
        </Band>
      ) : null}

      {archs.length ? (
        <Band tone="deep">
          <SezHead title={L.archTitle} brief={archBrief} />
          <ul className="mz-archs">
            {archByShare.map(({ a, share, move, name }) => (
              <li key={a.archetype} className={`an-panel mz-arch${a.games < SOLID ? " is-thin" : ""}`}>
                <ArchetypeIcon id={a.archetype} size="lg" />
                <p className="font-display text-lg font-semibold text-chalk">{name}</p>
                <div className="an-big-wr">
                  {Math.round(a.r * 100)}
                  <small>%</small>
                </div>
                <p className="sez-note">
                  {gamesText(a.games)} · {pctText(share)} {L.share}
                </p>
                {prev ? <MoveTag m={move} /> : null}
                <WrBar n={a} />
              </li>
            ))}
          </ul>
          <p className="sez-note mt-4">{L.archNote}</p>
          {prev ? <p className="sez-note mt-1">{L.arrows(prev.label)}</p> : null}
          <p className="sez-note mt-4">
            {L.legendsLink}{" "}
            <Link href={sezHref("/leggendarie", sez)} className="text-mint underline-offset-2 hover:underline">
              {L.legends}
            </Link>
            .
          </p>
        </Band>
      ) : null}
    </>
  );
}
