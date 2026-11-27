import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { analyticsDecksCardsLabels } from "@/lib/analyticsDecksCardsLabels";
import { loadSections, patchName, publishedByList, sectionHref, type SearchParams } from "@/lib/community/analyticsSections";
import { byPrudent, listKeyOf, moveOf } from "@/lib/tracker/sections";
import { fmtInt, pct } from "@/lib/tracker/snapshot";
import { toGameCardInput } from "@/components/GameCard";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { Band, MoveTag, SecHead, WrBar, fill, rich } from "@/components/analytics/sections/parts";
import { DeckList, DeckTop, type DeckLeg, type DeckRow, type DeckThumb } from "@/components/analytics/sections/decks/DeckLists";

/*
  Sezione Mazzi di Analytics (27/11/2026, Analytics a sezioni; Pierluigi: "Mazzi migliori da copiare"). Le liste esatte
  registrate dal Tracker nella patch scelta, ordinate per win rate prudente (bordo basso dell'intervallo al 95%): in cima
  le frasi da sapere e i primi tre in evidenza, poi le altre compatte con il filtro per Leggendaria, infine gli archetipi.
  Dietro il muro per gli iscritti come tutta Analytics: noindex e fuori da hreflang (Google vede la pagina sfocata).
*/

const PER_LEGENDARY = 30;
const TOP = 3;
const SOLID = 20;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const L = analyticsDecksCardsLabels[locale].decks;
  return dropHreflang(pageMeta(locale, "/analytics/decks", L.metaTitle, L.description, undefined, { noindex: true }));
}

export default async function AnalyticsDecks({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const L = analyticsDecksCardsLabels[locale].decks;
  const C = analyticsSectionsLabels[locale].common;
  const sez = await loadSections(searchParams);
  if (!sez)
    return (
      <Band tone="stage" top>
        <SecHead as="h1" title={L.title} brief={[C.unavailable]} />
      </Band>
    );
  const { cur, prev } = sez;
  const P = (r: number) => pct(r, locale, 0);
  const games = (n: number) => (n === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(n, locale) }));
  const published = await publishedByList();

  const lists = [...cur.lists].sort(byPrudent);
  const thumbs: Record<string, DeckThumb> = {};
  const legs: Record<string, DeckLeg> = {};
  const decks: DeckRow[] = [];
  const perLeg = new Map<string, number>();
  for (const l of lists) {
    const leg = getCard(l.legendary);
    if (!leg) continue;
    // al massimo 30 liste per Leggendaria: la pagina resta leggera
    const seen = perLeg.get(l.legendary) ?? 0;
    if (seen >= PER_LEGENDARY) continue;
    perLeg.set(l.legendary, seen + 1);
    if (!legs[l.legendary]) legs[l.legendary] = { slug: leg.slug, name: leg.name, art: leg.art ?? leg.thumb ?? null, input: toGameCardInput(leg, locale) };
    for (const s of l.cards) {
      if (thumbs[s]) continue;
      const c = getCard(s);
      if (c) thumbs[s] = { slug: s, name: c.name, thumb: c.thumb ?? null, mana: c.mana ?? null };
    }
    const cards = [...l.cards].sort((a, b) => (thumbs[a]?.mana ?? 99) - (thumbs[b]?.mana ?? 99) || (thumbs[a]?.name ?? a).localeCompare(thumbs[b]?.name ?? b));
    const pub = published.get(listKeyOf(l.legendary, l.cards))?.[0] ?? null;
    const name = pub?.name ?? fill(L.listName, { name: leg.name, n: seen + 1 });
    const keys = [l.legendary, ...cards].map((x) => getCard(x)?.key);
    decks.push({
      id: listKeyOf(l.legendary, l.cards),
      legendary: l.legendary,
      cards,
      games: l.games,
      wins: l.wins,
      r: l.r,
      lo: l.lo,
      hi: l.hi,
      name,
      published: pub,
      keys: keys.every(Boolean) ? (keys as string[]) : null,
    });
  }
  const gamesOf = (s: string) => decks.filter((d) => d.legendary === s).reduce((n, d) => n + d.games, 0);
  const legOrder = Object.keys(legs).sort((a, b) => gamesOf(b) - gamesOf(a));

  // le frasi da sapere, la più importante per prima
  const brief = [];
  const best = decks[0];
  if (best) brief.push(rich(L.best, { name: best.name, p: P(best.r), games: games(best.games), lo: P(best.lo) }));
  const head = decks.slice(0, 15);
  const byLeg = new Map<string, number>();
  for (const d of head) byLeg.set(d.legendary, (byLeg.get(d.legendary) ?? 0) + 1);
  const topLeg = [...byLeg].sort((a, b) => b[1] - a[1])[0];
  if (topLeg && topLeg[1] > 1) brief.push(rich(L.mostLists, { leg: legs[topLeg[0]]?.name ?? topLeg[0], n: topLeg[1], of: head.length }));
  if (cur.lists.length) brief.push(rich(L.count, { n: fmtInt(cur.lists.length, locale), solid: fmtInt(cur.lists.filter((l) => l.games >= SOLID).length, locale) }));

  const archName = (id: string) => (archetypeLabels[id]?.[locale] ?? id).split(" / ")[0];
  const archs = cur.archetypes.map((a) => {
    const before = prev?.archetypes.find((x) => x.archetype === a.archetype) ?? null;
    return { a, share: cur.games ? a.games / cur.games : 0, move: moveOf(before, a), name: archName(a.archetype) };
  });
  const archByShare = [...archs].sort((x, y) => y.share - x.share);
  const archByWin = archs.filter((x) => x.a.games >= SOLID).sort((x, y) => y.a.lo - x.a.lo);
  const archBrief = [];
  if (archByShare[0]) archBrief.push(rich(L.archTop, { name: archByShare[0].name, p: P(archByShare[0].share) }));
  if (archByWin[0] && archByWin[0].a.archetype !== archByShare[0]?.a.archetype)
    archBrief.push(rich(L.archBest, { name: archByWin[0].name, p: P(archByWin[0].a.r), games: games(archByWin[0].a.games) }));

  const text = {
    locale,
    L,
    C: { games: C.games, gamesOne: C.gamesOne, copyCode: C.copyCode, copied: C.copied, openBuilder: C.openBuilder },
    cardsBase: href(locale, "/cards"),
    decksBase: href(locale, "/decks/community"),
    builderBase: href(locale, "/deck-builder"),
  };
  const [legendsBefore, legendsAfter] = L.legendsLink.split("{link}");

  return (
    <>
      <Band tone="stage" top>
        <SecHead as="h1" title={L.title} brief={brief} />
        {decks.length ? <DeckTop decks={decks.slice(0, TOP)} legs={legs} thumbs={thumbs} t={text} /> : <p className="sez-note">{L.none}</p>}
      </Band>

      {decks.length > TOP ? (
        <Band tone="felt">
          <h2 className="sez-h2">{L.others}</h2>
          <p className="sez-lead mb-4">{L.othersLead}</p>
          <DeckList decks={decks} legs={legs} legOrder={legOrder} thumbs={thumbs} skip={TOP} t={text} />
        </Band>
      ) : null}

      {archs.length ? (
        <Band tone="deep">
          <SecHead title={L.archTitle} brief={archBrief} />
          <ul className="mz-archs">
            {archByShare.map(({ a, share, move, name }) => (
              <li key={a.archetype} className={`an-panel mz-arch${a.games < SOLID ? " is-thin" : ""}`}>
                <ArchetypeIcon id={a.archetype} size="lg" />
                <p className="font-display text-lg font-semibold text-chalk">{name}</p>
                <div className="an-big-wr">{P(a.r)}</div>
                <p className="sez-note">
                  {games(a.games)} · {P(share)} {L.share}
                </p>
                {prev ? <MoveTag m={move} locale={locale} labels={C} /> : null}
                <WrBar n={a} locale={locale} />
              </li>
            ))}
          </ul>
          <p className="sez-note mt-4">{L.archNote}</p>
          {prev ? <p className="sez-note mt-1">{fill(L.arrows, { patch: patchName(prev.patch, locale) })}</p> : null}
          <p className="sez-note mt-4">
            {legendsBefore}
            <Link href={sectionHref(locale, "/legendaries", sez)} prefetch={false} className="text-mint underline-offset-2 hover:underline">
              {L.legends}
            </Link>
            {legendsAfter}
          </p>
        </Band>
      ) : null}
    </>
  );
}
