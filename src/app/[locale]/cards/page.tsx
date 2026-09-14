import type { Metadata } from "next";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { cards, lastChange, sagas, type SagaId } from "@/lib/data/cards";
import { CardExplorer, type ExplorerCard } from "@/components/CardExplorer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/cards", dict.cards.title, dict.cards.intro);
}

export default async function CardsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const list: ExplorerCard[] = cards.map((c) => {
    const lc = lastChange(c);
    return {
      slug: c.slug,
      name: c.name,
      href: href(locale, `/cards/${c.slug}`),
      type: c.type,
      typeLabel: typeLabel[c.type],
      legendary: Boolean(c.legendary),
      sagaId: c.saga,
      sagaLabel: sagas[c.saga][locale],
      mana: c.mana,
      power: c.power,
      health: c.health,
      keywords: c.keywords ?? [],
      lastKind: lc?.kind,
      lastKindLabel: lc ? d.common[lc.kind === "deck" ? "rework" : lc.kind] : undefined,
      removed: c.status === "removed",
      removedLabel: d.common.removed,
    };
  });
  const usedSagas = Array.from(new Set(cards.map((c) => c.saga))) as SagaId[];
  const sagaOptions = usedSagas.map((id) => ({ id, label: sagas[id][locale] })).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.cards}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.cards.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.cards.intro}</p>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted/80">{d.common.asOf}</p>
      <p className="mt-6 font-display text-3xl font-extrabold text-gold">
        {cards.length} <span className="text-base font-bold text-chalk-muted">{d.cards.countLabel}</span>
      </p>
      <div className="mt-8">
        <CardExplorer
          cards={list}
          sagas={sagaOptions}
          labels={{
            search: d.common.search,
            all: d.common.all,
            type: d.common.filterType,
            saga: d.common.filterSaga,
            sort: d.common.sortBy,
            sortName: d.common.sortName,
            sortMana: d.common.sortMana,
            sortPower: d.common.sortPower,
            sortHealth: d.common.sortHealth,
            results: d.common.results,
            noResults: d.common.noResults,
            legendary: d.common.legendary,
            unknownStats: d.common.unknownStats,
          }}
        />
      </div>
      <p className="mt-10 max-w-2xl text-sm text-chalk-muted">{d.cards.legendNote}</p>
    </div>
  );
}
