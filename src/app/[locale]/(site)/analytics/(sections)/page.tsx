import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { ANALYTICS_PUBLIC } from "@/lib/community/badges";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsDataset } from "@/lib/analyticsSource";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { deckLinks, loadAllPatches, loadSections, patchName, publishedByList, sectionHref, type SearchParams } from "@/lib/community/analyticsSections";
import { byPrudent, listKeyOf, moveOf } from "@/lib/tracker/sections";
import { fmtInt, pct } from "@/lib/tracker/snapshot";
import { isEarly } from "@/lib/tracker/stats";
import { toGameCardInput, GameCardFace } from "@/components/GameCard";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { PageNotes } from "@/components/PageNotes";
import { TierSectionNotes, TierSourceLine } from "@/components/TierListHeader";
import { ArchetypeIcon } from "@/components/ArchetypeIcon";
import { AnalyticsSource } from "@/components/analytics/AnalyticsSource";
import { CrimsonPromo } from "@/components/crimson/CrimsonPromo";
import { Band, MoveTag, Portrait, SecHead, Spark, WrBar, fill, rich } from "@/components/analytics/sections/parts";
import { CopyCode } from "@/components/analytics/sections/CopyCode";

/*
  Panoramica di Analytics (27/11/2026, Analytics a sezioni; prima era la pagina unica "Meta Snapshot v2.0" del 12/10/2026,
  le cui sezioni sono diventate pagine). In fasce: la patch in breve (frasi calcolate e i numeri principali), il podio delle
  Leggendarie, chi sale e chi scende, i mazzi da copiare, le carte più giocate; ognuna porta alla sua sezione. In fondo i
  testi di sempre (come si leggono i numeri, la fonte e come citarla) e il nodo Dataset (difesa SEO/GEO del 09/11/2026).
  La patch si sceglie con ?patch=, quindi la pagina si rende a ogni richiesta (le letture del Tracker restano in cache 5
  minuti); senza accesso il proxy mostra la pagina sfocata (src/lib/membersOnly.ts). Noindex sotto le 100 partite.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const w = dict.tier.winrate;
  const last = (await loadAllPatches()).at(-1);
  const indexable = ANALYTICS_PUBLIC && !!last && !isEarly(last.games);
  const meta = pageMeta(locale, "/analytics", w.title, w.description, undefined, { noindex: !indexable });
  return indexable ? meta : dropHreflang(meta);
}

export default async function AnalyticsOverview({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const w = d.tier.winrate;
  const t = d.tier;
  const L = analyticsSectionsLabels[locale];
  const O = L.overview;
  const C = L.common;
  const sez = await loadSections(searchParams);
  const P = (r: number) => pct(r, locale, 0);
  const P1 = (r: number) => pct(r, locale, 1);
  const games = (n: number) => (n === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(n, locale) }));
  const name = (slug: string) => getCard(slug)?.name ?? slug;
  const h = (p: string) => (sez ? sectionHref(locale, p, sez) : href(locale, `/analytics${p}`));
  const appHref = href(locale, "/tracker");
  const archName = (id: string) => (archetypeLabels[id]?.[locale] ?? id).split(" / ");
  const curName = sez ? patchName(sez.cur.patch, locale) : "";

  const jsonLd = (
    <JsonLd
      data={[
        breadcrumbs([
          { name: "OriginsMeta", path: href(locale) },
          { name: w.h1, path: href(locale, "/analytics") },
        ]),
        analyticsDataset(locale),
      ]}
    />
  );

  const notes = (
    <PageNotes>
      <section id="how-to-read" className="an-notes scroll-mt-36" aria-labelledby="an-h-notes">
        <h2 id="an-h-notes">{w.notesText.title}</h2>
        <p>{w.intro}</p>
        <TierSourceLine
          items={[
            { label: t.lineSource, text: fill(w.sourceText, { patch: curName }) },
            ...(sez ? [{ label: t.lineSample, text: games(sez.cur.games) }] : []),
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
          {sez && sez.cur.games ? <li>{fill(w.notesText.bias, { p: P1(sez.cur.wins / sez.cur.games) })}</li> : null}
        </ul>
        <p className="an-notes-links">
          <span>
            {t.mainText}{" "}
            <Link href={href(locale, "/tier-list")} className="link-mint font-bold">
              {t.mainAnchor}
            </Link>
          </span>
          <span>
            {w.app.notesText}{" "}
            <Link href={appHref} className="link-mint font-bold">
              {w.app.notesAnchor}
            </Link>
          </span>
        </p>
      </section>
      <AnalyticsSource locale={locale} patch={curName} className="mt-10" />
    </PageNotes>
  );

  if (!sez) {
    return (
      <>
        {jsonLd}
        <Band top tone="stage">
          <SecHead as="h1" title={w.h1} brief={[C.unavailable]} />
          <CrimsonPromo locale={locale} legendaryLabel={d.common.legendary} />
        </Band>
        {notes}
      </>
    );
  }

  const { cur, prev, all } = sez;
  const prudent = [...cur.legendaries].sort(byPrudent);
  const strongest = prudent[0];
  const mostPlayed = [...cur.legendaries].sort((a, b) => b.games - a.games)[0];
  const sameTop = !!strongest && mostPlayed?.slug === strongest.slug;
  const second = sameTop ? prudent[1] : mostPlayed;

  const published = await publishedByList();
  const lists = [...cur.lists].sort(byPrudent).slice(0, 3);
  const listRows = await Promise.all(
    lists.map(async (l, i) => {
      const pub = published.get(listKeyOf(l.legendary, l.cards))?.[0] ?? null;
      const deckName = pub?.name ?? fill(C.listN, { name: name(l.legendary), n: i + 1 });
      return { l, pub, deckName, links: await deckLinks(locale, l.legendary, l.cards, deckName) };
    }),
  );

  const moves = prev
    ? cur.legendaries.flatMap((l) => {
        const m = moveOf(prev.legendaries.find((x) => x.slug === l.slug), l);
        return m ? [{ l, m }] : [];
      })
    : [];
  const ups = moves.filter((x) => x.m.points > 0).sort((a, b) => b.m.points - a.m.points).slice(0, 3);
  const downs = moves.filter((x) => x.m.points < 0).sort((a, b) => a.m.points - b.m.points).slice(0, 3);
  const bigMove = [...moves].sort((a, b) => Math.abs(b.m.points) - Math.abs(a.m.points))[0];
  const topCards = cur.cards.filter((c) => !getCard(c.slug)?.legendary && c.deck).slice(0, 6);
  const prevName = prev ? patchName(prev.patch, locale) : "";
  const medals = O.medals.split("|");

  const brief = [
    strongest
      ? rich(sameTop ? O.strongestBoth : O.strongest, { name: name(strongest.slug), p: P(strongest.r), games: games(strongest.games), share: P(strongest.share) })
      : null,
    bigMove && prev
      ? rich(bigMove.m.points > 0 ? O.moverUp : O.moverDown, { name: name(bigMove.l.slug), prev: prevName, from: P(bigMove.m.before.r), to: P(bigMove.m.after.r) })
      : null,
    listRows[0] ? rich(O.bestDeck, { name: listRows[0].deckName, p: P(listRows[0].l.r), games: games(listRows[0].l.games) }) : null,
  ].filter(Boolean);

  const seeAll = (p: string) => (
    <Link href={h(p)} prefetch={false} className="link-mint text-sm font-bold">
      {C.seeAll}
    </Link>
  );

  return (
    <>
      {jsonLd}
      <Band top tone="stage">
        <SecHead as="h1" title={w.h1} brief={brief} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="sez-panel">
            <p className="sez-note">{O.gamesLabel}</p>
            <p className="sez-num mt-1 text-3xl">{fmtInt(cur.games, locale)}</p>
            <p className="sez-note">{fill(O.matched, { n: fmtInt(cur.matchedGames, locale) })}</p>
          </div>
          {[strongest, second].filter((x) => !!x).map((l, i) => (
            <Link key={l.slug} href={h(`/legendaries/${l.slug}`)} prefetch={false} className="sez-panel block hover:border-mint">
              <p className="sez-note">{i === 0 ? (sameTop ? O.strongestBothCell : O.strongestCell) : sameTop ? O.runnerUp : O.mostPlayed}</p>
              <p className="mt-1 truncate font-display text-lg font-semibold text-chalk">{name(l.slug)}</p>
              <p className="sez-num text-2xl">{P(l.r)}</p>
              <p className="sez-note">{games(l.games)}</p>
            </Link>
          ))}
          {listRows[0] ? (
            <Link href={h("/decks")} prefetch={false} className="sez-panel block hover:border-mint">
              <p className="sez-note">{O.bestDeckCell}</p>
              <p className="mt-1 truncate font-display text-lg font-semibold text-chalk">{listRows[0].deckName}</p>
              <p className="sez-num text-2xl">{P(listRows[0].l.r)}</p>
              <p className="sez-note">{games(listRows[0].l.games)}</p>
            </Link>
          ) : null}
        </div>
        <CrimsonPromo locale={locale} legendaryLabel={d.common.legendary} />
      </Band>

      {prudent.length >= 3 ? (
        <Band tone="felt">
          <SecHead title={O.podium} brief={[]} action={seeAll("/legendaries")} />
          <div className="an-podium has-3">
            {prudent.slice(0, 3).map((l, i) => {
              const card = getCard(l.slug);
              return (
                <article key={l.slug} className={`an-pod is-p${i + 1}`}>
                  <Link href={h(`/legendaries/${l.slug}`)} prefetch={false} className="an-pod-card">
                    {card ? <GameCardFace input={toGameCardInput(card, locale)} lang={locale} /> : null}
                  </Link>
                  <div className="an-panel an-pod-plate">
                    <span className="an-medal">{medals[i]}</span>
                    <h3>{name(l.slug)}</h3>
                    <div className="an-big-wr">{P1(l.r)}</div>
                    <WrBar n={l} locale={locale} className="mt-2" />
                    <p className="sez-note mt-2">
                      {games(l.games)} · {fill(C.range, { lo: P(l.lo), hi: P(l.hi) })}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="sez-note mx-auto mt-4 max-w-2xl text-center">{O.podiumNote}</p>
        </Band>
      ) : null}

      {prev ? (
        <Band tone="deep">
          <SecHead title={O.movers} brief={[fill(O.moversFrom, { from: prevName, to: curName })]} action={seeAll("/trends")} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { t: O.up, rows: ups },
              { t: O.down, rows: downs },
            ].map((g) => (
              <div key={g.t} className="sez-panel">
                <p className="font-display font-semibold text-chalk">{g.t}</p>
                <ul className="mt-2 grid gap-2">
                  {g.rows.map(({ l, m }) => (
                    <li key={l.slug}>
                      <Link href={h(`/legendaries/${l.slug}`)} prefetch={false} className="flex items-center gap-3 hover:text-mint">
                        <Portrait art={getCard(l.slug)?.art} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display font-semibold text-chalk">{name(l.slug)}</span>
                          <span className="sez-note">
                            {P(m.before.r)} → {P(m.after.r)}
                          </span>
                        </span>
                        <span className="hidden sm:block">
                          <Spark points={all.map((p) => p.legendaries.find((x) => x.slug === l.slug)?.r ?? null)} width={64} height={24} />
                        </span>
                        <MoveTag m={m} locale={locale} labels={C} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="sez-note mt-2">{C.greyNote}</p>
        </Band>
      ) : null}

      {listRows.length ? (
        <Band tone="felt">
          <SecHead title={O.decks} brief={[]} action={seeAll("/decks")} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {listRows.map(({ l, pub, deckName, links }) => {
              const leg = getCard(l.legendary);
              return (
                <div key={listKeyOf(l.legendary, l.cards)} className="sez-panel flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-20 shrink-0">{leg ? <GameCardFace input={toGameCardInput(leg, locale)} lang={locale} /> : null}</div>
                    <div className="min-w-0">
                      {pub ? (
                        <Link href={href(locale, `/decks/community/${pub.slug}`)} prefetch={false} className="block truncate font-display font-semibold text-chalk hover:text-mint">
                          {deckName}
                        </Link>
                      ) : (
                        <p className="truncate font-display font-semibold text-chalk">{deckName}</p>
                      )}
                      {pub?.author ? <p className="sez-note truncate">{pub.author}</p> : null}
                      <p className="sez-num text-2xl">{P(l.r)}</p>
                      <p className="sez-note">{games(l.games)}</p>
                    </div>
                  </div>
                  <WrBar n={l} locale={locale} />
                  <div className="mt-auto flex flex-wrap gap-2">
                    {links.code ? <CopyCode code={links.code} label={C.copyCode} done={C.copied} /> : null}
                    <Link href={links.builder} prefetch={false} className="btn btn-ghost text-xs">
                      {C.openBuilder}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Band>
      ) : null}

      {topCards.length ? (
        <Band tone="deep">
          <SecHead title={O.cards} brief={[O.cardsNote]} action={seeAll("/cards")} />
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {topCards.map((c) => {
              const card = getCard(c.slug);
              if (!card) return null;
              return (
                <li key={c.slug} className="text-center">
                  <Link href={href(locale, `/cards/${c.slug}`)} prefetch={false} className="block">
                    <GameCardFace input={toGameCardInput(card, locale)} lang={locale} />
                  </Link>
                  <p className="sez-num mt-1 text-lg">{P(c.deckShare)}</p>
                  <p className="sez-note">
                    {c.deck ? fill(C.won, { p: P(c.deck.r) }) : ""}
                    {c.avgTurn ? ` · ${fill(C.round, { t: c.avgTurn.toLocaleString(locale === "zh-cn" ? "zh-CN" : locale, { maximumFractionDigits: 1 }) })}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </Band>
      ) : null}

      {notes}
    </>
  );
}
