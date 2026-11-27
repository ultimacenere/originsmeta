import type { Metadata } from "next";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard } from "@/lib/data/cards";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";
import { analyticsSectionsLabels } from "@/lib/analyticsSectionsLabels";
import { analyticsDecksCardsLabels } from "@/lib/analyticsDecksCardsLabels";
import { loadSections, patchName, type SearchParams } from "@/lib/community/analyticsSections";
import { moveOf, num } from "@/lib/tracker/sections";
import { fmtDec, fmtInt, pct } from "@/lib/tracker/snapshot";
import { toGameCardInput } from "@/components/GameCard";
import { Band, SecHead, fill, rich } from "@/components/analytics/sections/parts";
import { CardExplorer, type CardRow } from "@/components/analytics/sections/cards/CardExplorer";

/*
  Sezione Carte di Analytics (27/11/2026, Analytics a sezioni; Pierluigi: "Quando si gioca ogni carta"). Le carte della
  patch scelta: in quante partite sono nel mazzo, come vanno, in che round si giocano e come si sono mosse rispetto alla
  patch precedente. In cima le frasi da sapere; la vista di partenza è «Quando si gioca», la tabella è la seconda. Dati del
  Tracker, lato di chi registra. Dietro il muro per gli iscritti: noindex e fuori da hreflang.
*/

/** «Molto giocata»: almeno il 10% delle partite e 100 partite. */
const MANY_SHARE = 0.1;
const MANY_GAMES = 100;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const L = analyticsDecksCardsLabels[locale].cards;
  return dropHreflang(pageMeta(locale, "/analytics/cards", L.metaTitle, L.description, undefined, { noindex: true }));
}

export default async function AnalyticsCards({ params, searchParams }: { params: LocaleParams; searchParams: SearchParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const L = analyticsDecksCardsLabels[locale].cards;
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
  const before = new Map((prev?.cards ?? []).map((c) => [c.slug, c]));

  const rows: CardRow[] = cur.cards.flatMap((c) => {
    const card = getCard(c.slug);
    if (!card || card.type === "token" || !c.deck) return [];
    const b = before.get(c.slug);
    return [
      {
        slug: c.slug,
        name: card.name,
        mana: card.mana ?? null,
        legendary: !!card.legendary,
        input: toGameCardInput(card, locale),
        share: c.deckShare,
        deck: c.deck,
        played: c.played,
        turn: c.avgTurn,
        shareMove: b?.deck && prev ? moveOf(num(b.deck.games, prev.games), num(c.deck.games, cur.games)) : null,
        wrMove: moveOf(b?.deck, c.deck),
      },
    ];
  });

  // le frasi da sapere (le Leggendarie restano fuori: sono in ogni mazzo della loro Leggendaria)
  const base = rows.filter((r) => !r.legendary);
  const brief = [];
  const most = [...base].sort((a, b) => b.share - a.share)[0];
  if (most) brief.push(rich(L.mostPlayed, { name: most.name, p: P(most.share), games: games(most.deck.games) }));
  const best = base.filter((r) => r.share >= MANY_SHARE && r.deck.games >= MANY_GAMES).sort((a, b) => b.deck.lo - a.deck.lo)[0];
  if (best && best.slug !== most?.slug) brief.push(rich(L.bestWin, { name: best.name, p: P(best.deck.r), games: games(best.deck.games) }));
  const late = base.filter((r) => r.turn !== null && (r.played?.games ?? 0) >= 50).sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];
  if (late?.turn) brief.push(rich(L.latest, { name: late.name, t: fmtDec(late.turn, locale, 1) }));

  return (
    <>
      <Band tone="stage" top>
        <SecHead as="h1" title={L.title} brief={brief} />
        <CardExplorer
          rows={rows}
          t={{
            locale,
            L,
            C: { games: C.games, gamesOne: C.gamesOne, isNew: C.isNew, clearMove: C.clearMove, unclearMove: C.unclearMove },
            cardsBase: href(locale, "/cards"),
            prevLabel: prev ? patchName(prev.patch, locale) : null,
          }}
        />
      </Band>
      <Band tone="deep">
        <div className="flex flex-col gap-1">
          {L.notes.map((n) => (
            <p key={n} className="sez-note">
              {n}
            </p>
          ))}
        </div>
      </Band>
    </>
  );
}
