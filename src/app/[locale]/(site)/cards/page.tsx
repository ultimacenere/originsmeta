import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { activeCards, cards, cardSource, sagas, type SagaId } from "@/lib/data/cards";
import { CardExplorer, type ExplorerCard } from "@/components/CardExplorer";
import { flipOf } from "@/components/CardChip";
import { newTabProps } from "@/components/SteamButton";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/cards", dict.cards.title, dict.cards.description);
}

export default async function CardsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const rarityLabel = { common: d.common.common, rare: d.common.rare, epic: d.common.epic, legendary: d.common.legendary } as const;
  // Dati della carta che si gira dallo stesso `flipOf` della scheda dei mazzi (stesso retro), più i campi dei filtri
  const list: ExplorerCard[] = cards.map((c) => ({
    ...flipOf(c, locale),
    type: c.type,
    legendary: Boolean(c.legendary),
    sagaId: c.saga,
    sagaLabel: sagas[c.saga][locale],
    rarity: c.rarity,
    keywords: c.keywords ?? [],
    removed: c.status === "removed",
  }));
  const usedSagas = Array.from(new Set(cards.map((c) => c.saga))) as SagaId[];
  const sagaOptions = usedSagas.map((id) => ({ id, label: sagas[id][locale] })).sort((a, b) => a.label.localeCompare(b.label));
  const inDemo = cards.filter((c) => c.status === "active" && c.type !== "token").length;
  const created = cards.filter((c) => c.type === "token").length;
  const removed = cards.filter((c) => c.status === "removed").length;

  // Lista per i dati strutturati: le carte giocabili nella demo, già in memoria, così la pagina resta statica.
  const listed = activeCards.map((c) => ({ name: c.name, path: href(locale, `/cards/${c.slug}`) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.cards.title, path: href(locale, "/cards") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/cards"),
            name: d.cards.title,
            description: d.cards.intro,
            items: listed,
            about: videoGameId,
          })]}
      />
      <p className="kicker text-mint">{d.nav.cards}</p>
      <h1 className="t-page mt-2">{d.cards.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.cards.intro}</p>
      {/* I Luoghi sono l'altra metà del tabellone: da qui ci si arriva senza passare dal menu (23/09/2026) */}
      <p className="mt-3 text-sm">
        <Link href={href(locale, "/locations")} className="link-mint font-bold">
          {d.locations.h1} →
        </Link>
      </p>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted/80">{d.common.asOf}</p>
      <p className="mt-6 font-display text-3xl font-extrabold text-mint">
        {inDemo} <span className="text-base font-bold text-chalk-muted">{d.cards.countLabel}</span>
      </p>
      <p className="mt-1 font-mono text-xs text-chalk-muted">
        +{created} {d.cards.countCreated} · {removed} {d.cards.countRemoved}
      </p>
      <div className="mt-8">
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
              mana: d.common.mana,
              power: d.common.power,
              health: d.common.health,
            }}
          />
      </div>
      <p className="mt-10 max-w-2xl text-sm text-chalk-muted">{d.cards.legendNote}</p>
      <p className="mt-2 max-w-2xl text-xs text-chalk-muted/70">
        {d.cards.sourceBefore}{" "}
        <a href={cardSource.url} {...newTabProps} className="link-mint">
          {cardSource.name}
        </a>{" "}
        ({d.common.patch} {cardSource.patch}){d.cards.sourceAfter}
      </p>
      <p className="mt-2 text-xs text-chalk-muted/70">{d.common.imageCredit}</p>
    </div>
  );
}
