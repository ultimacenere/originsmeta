import type { Metadata } from "next";
import { Suspense } from "react";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { cards, cardSource, lastChange, sagas, type SagaId } from "@/lib/data/cards";
import { CardExplorer, type ExplorerCard } from "@/components/CardExplorer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/cards", dict.cards.title, dict.cards.intro);
}

export default async function CardsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const rarityLabel = { common: d.common.common, rare: d.common.rare, epic: d.common.epic, legendary: d.common.legendary } as const;
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
      image: c.image,
      mana: c.mana,
      power: c.power,
      health: c.health,
      alignment: c.alignment,
      alignmentLabel: c.alignment ? alignLabel[c.alignment] : undefined,
      rarity: c.rarity,
      rarityLabel: c.rarity ? rarityLabel[c.rarity] : undefined,
      keywords: c.keywords ?? [],
      lastKind: lc?.kind,
      lastKindLabel: lc ? d.common[lc.kind === "deck" ? "rework" : lc.kind] : undefined,
      removed: c.status === "removed",
      removedLabel: d.common.removed,
    };
  });
  const usedSagas = Array.from(new Set(cards.map((c) => c.saga))) as SagaId[];
  const sagaOptions = usedSagas.map((id) => ({ id, label: sagas[id][locale] })).sort((a, b) => a.label.localeCompare(b.label));
  const inDemo = cards.filter((c) => c.status === "active" && c.type !== "token").length;
  const created = cards.filter((c) => c.type === "token").length;
  const removed = cards.filter((c) => c.status === "removed").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.cards}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.cards.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.cards.intro}</p>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted/80">{d.common.asOf}</p>
      <p className="mt-6 font-display text-3xl font-extrabold text-mint">
        {inDemo} <span className="text-base font-bold text-chalk-muted">{d.cards.countLabel}</span>
      </p>
      <p className="mt-1 font-mono text-xs text-chalk-muted">
        +{created} {d.cards.countCreated} · {removed} {d.cards.countRemoved}
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <CardExplorer
            cards={list}
            sagas={sagaOptions}
            alignments={(["good", "evil", "neutral"] as const).map((id) => ({ id, label: alignLabel[id] }))}
            rarities={(["common", "rare", "epic", "legendary"] as const).map((id) => ({ id, label: rarityLabel[id] }))}
            labels={{
              search: d.common.search,
              all: d.common.all,
              type: d.common.filterType,
              saga: d.common.filterSaga,
              alignment: d.common.alignment,
              rarity: d.common.rarity,
              sort: d.common.sortBy,
              sortName: d.common.sortName,
              sortMana: d.common.sortMana,
              sortPower: d.common.sortPower,
              sortHealth: d.common.sortHealth,
              results: d.common.results,
              noResults: d.common.noResults,
              legendary: d.common.legendary,
              unknownStats: d.common.unknownStats,
              showRemoved: d.common.showRemoved,
            }}
          />
        </Suspense>
      </div>
      <p className="mt-10 max-w-2xl text-sm text-chalk-muted">{d.cards.legendNote}</p>
      <p className="mt-2 max-w-2xl text-xs text-chalk-muted/70">
        {d.cards.sourceBefore}{" "}
        <a href={cardSource.url} rel="noopener" className="link-mint">
          {cardSource.name}
        </a>{" "}
        ({d.common.patch} {cardSource.patch}){d.cards.sourceAfter}
      </p>
      <p className="mt-2 text-xs text-chalk-muted/70">{d.common.imageCredit}</p>
    </div>
  );
}
