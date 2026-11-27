import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { loadSections, patchName, sectionHref, type SearchParams } from "@/lib/community/analyticsSections";
import { moveOf, num, type Move, type Num } from "@/lib/tracker/sections";
import { fmtInt, pct } from "@/lib/tracker/snapshot";
import { GameCardFace, toGameCardInput } from "@/components/GameCard";
import { Band, MoveTag, SecHead, Spark, fill, rich } from "@/components/analytics/sections/parts";

/*
  Sezione «Chi sale e chi scende» di Analytics (27/11/2026, Pierluigi: "Chi sale e chi scende"): le Leggendarie e le carte
  che si sono spostate fra la patch scelta e la precedente, e le carte che Koin ha cambiato nella patch con la loro quota
  nei mazzi prima e dopo. Uno spostamento è colorato solo quando è netto (intervalli al 95% che non si toccano). Mai un
  nesso di causa oltre i numeri: «dopo la patch», non «per colpa della patch».
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const T = analyticsSectionsLabels[locale].trends;
  return dropHreflang(pageMeta(locale, "/analytics/trends", `${T.title} · Analytics`, T.legsLead, undefined, { noindex: true }));
}

const KIND_CLASS: Record<string, string> = { buff: "text-good", nerf: "text-crimson", rework: "text-gold", deck: "text-gold" };

export default async function TrendsPage({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const L = analyticsSectionsLabels[locale];
  const T = L.trends;
  const C = L.common;
  const sez = await loadSections(searchParams);
  if (!sez)
    return (
      <Band top tone="stage">
        <SecHead as="h1" title={T.title} brief={[C.unavailable]} />
      </Band>
    );
  const { cur, prev, all } = sez;
  if (!prev)
    return (
      <Band top tone="stage">
        <SecHead as="h1" title={T.title} brief={[T.first]} />
      </Band>
    );
  const P = (r: number) => pct(r, locale, 0);
  const games = (n: number) => (n === 1 ? C.gamesOne : fill(C.games, { n: fmtInt(n, locale) }));
  const name = (slug: string) => getCard(slug)?.name ?? slug;
  const h = (p: string) => sectionHref(locale, p, sez);
  const curName = patchName(cur.patch, locale);
  const prevName = patchName(prev.patch, locale);

  const legRows = cur.legendaries
    .map((l) => ({ slug: l.slug, now: l as Num, m: moveOf(prev.legendaries.find((x) => x.slug === l.slug), l) }))
    .sort((a, b) => (b.m?.points ?? -999) - (a.m?.points ?? -999));

  // quota nei mazzi come proporzione con il suo intervallo: partite con la carta su partite della patch
  const share = (deckGames: number | undefined, total: number) => num(deckGames ?? 0, total);
  const cardMoves = cur.cards
    .filter((c) => !getCard(c.slug)?.legendary && c.deck && c.deck.games >= 20)
    .flatMap((c) => {
      const before = prev.cards.find((x) => x.slug === c.slug);
      const m = moveOf(share(before?.deck?.games, prev.games), share(c.deck?.games, cur.games));
      return m ? [{ c, m }] : [];
    });
  const more = cardMoves.filter((x) => x.m.points > 0).sort((a, b) => b.m.points - a.m.points).slice(0, 8);
  const less = cardMoves.filter((x) => x.m.points < 0).sort((a, b) => a.m.points - b.m.points).slice(0, 8);

  const changed = cur.cards.flatMap((c) => {
    const card = getCard(c.slug);
    const ch = card?.history.find((x) => x.patch === cur.patch);
    return card && ch ? [{ c, card, ch }] : [];
  });
  // l'ultima patch, ancora con molte meno partite della precedente
  const fresh = sez.latest && cur.games < prev.games / 2;

  const withMove = legRows.filter((r): r is typeof r & { m: Move } => !!r.m);
  const topUp = withMove[0];
  const topDown = withMove.at(-1);
  const brief = [
    fill(T.lead, { from: prevName, to: curName }),
    topUp && topUp.m.points > 0 ? rich(T.upMost, { name: name(topUp.slug), from: P(topUp.m.before.r), to: P(topUp.m.after.r) }) : null,
    topDown && topDown.m.points < 0 ? rich(T.downMost, { name: name(topDown.slug), from: P(topDown.m.before.r), to: P(topDown.m.after.r) }) : null,
    changed.length ? rich(changed.length === 1 ? T.koinCountOne : T.koinCount, { n: changed.length }) : null,
  ].filter(Boolean);

  return (
    <>
      <Band top tone="stage">
        <SecHead as="h1" title={T.title} brief={brief} />
        {fresh ? <p className="pen-note mb-4 text-gold">{T.fresh}</p> : null}
        <h2 className="font-display text-lg font-semibold text-chalk">{T.legs}</h2>
        <p className="sez-note">{T.legsLead}</p>
        <ul className="mt-3 grid gap-1">
          {legRows.map(({ slug, now, m }) => (
            <li key={slug}>
              <Link
                href={h(`/legendaries/${slug}`)}
                prefetch={false}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 sm:grid-cols-[minmax(0,1fr)_96px_120px_80px]"
              >
                <span className="truncate font-display font-semibold text-chalk">{name(slug)}</span>
                <span className="hidden sm:block">
                  <Spark points={all.map((p) => p.legendaries.find((x) => x.slug === slug)?.r ?? null)} />
                </span>
                <span className="text-right">
                  <span className="sez-num">{m ? `${P(m.before.r)} → ${P(now.r)}` : P(now.r)}</span>
                  <span className="sez-note block">{games(now.games)}</span>
                </span>
                <span className="text-right">
                  <MoveTag m={m} locale={locale} labels={C} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Band>

      <Band tone="deep">
        <h2 className="font-display text-lg font-semibold text-chalk">{T.koin}</h2>
        <p className="sez-note">{T.koinLead}</p>
        {changed.length ? (
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {changed.map(({ c, card, ch }) => {
              const before = prev.cards.find((x) => x.slug === c.slug);
              const m = moveOf(share(before?.deck?.games, prev.games), share(c.deck?.games, cur.games));
              return (
                <li key={c.slug} className="text-center">
                  <Link href={href(locale, `/cards/${c.slug}`)} prefetch={false} className="block">
                    <GameCardFace input={toGameCardInput(card, locale)} lang={locale} />
                  </Link>
                  <p className={`pen-note mt-1 ${KIND_CLASS[ch.kind] ?? "text-gold"}`}>{T[ch.kind as "buff" | "nerf" | "rework" | "deck"] ?? ch.kind}</p>
                  <p className="sez-note">{ch.note?.[locale] ?? ch.note?.en}</p>
                  {m ? (
                    <p className="mt-1 text-sm">
                      {fill(T.inDecks, { from: P(m.before.r), to: P(m.after.r) })} <MoveTag m={m} locale={locale} labels={C} />
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="sez-note mt-2">{T.noKoin}</p>
        )}
      </Band>

      <Band tone="felt">
        <h2 className="font-display text-lg font-semibold text-chalk">{T.picks}</h2>
        <p className="sez-note">{T.picksLead}</p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { t: T.more, rows: more },
            { t: T.less, rows: less },
          ].map((g) => (
            <div key={g.t} className="sez-panel">
              <p className="font-display font-semibold text-chalk">{g.t}</p>
              <ul className="mt-2 grid gap-2">
                {g.rows.map(({ c, m }) => (
                  <li key={c.slug}>
                    <Link
                      href={href(locale, `/cards/${c.slug}`)}
                      prefetch={false}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 hover:text-mint sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                    >
                      <span className="min-w-0 truncate font-display font-semibold text-chalk">{name(c.slug)}</span>
                      <span className="sez-note col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                        {P(m.before.r)} → {P(m.after.r)}
                        {c.deck ? ` · ${fill(C.won, { p: P(c.deck.r) })}` : ""}
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
    </>
  );
}
