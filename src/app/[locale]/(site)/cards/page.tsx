import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { activeCards, cards, sagas, type SagaId } from "@/lib/data/cards";
import { CardExplorer, type ExplorerCard } from "@/components/CardExplorer";
import { RemovedCardsArchive, removedArchiveId } from "@/components/RemovedCardsArchive";
import { PageNotes } from "@/components/PageNotes";
import { flipOf } from "@/components/CardChip";
import { keywordLabel, keywordLabels } from "@/lib/keywordLabels";
import { cardFilterLabels } from "@/lib/cardFilterLabels";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // In SERP "cards / card list" (piano SEO del 25/09/2026); l'H1 resta `title`, più leggibile sulla pagina
  return pageMeta(locale, "/cards", dict.cards.metaTitle, dict.cards.description);
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
    // tag nella lingua della pagina e, sulle pagine tradotte, anche in inglese: "Trample" e "Travolgere" trovano le stesse carte
    tags: c.keywords ?? [],
    keywords: [...(c.keywords ?? []), ...(locale === "en" ? [] : (c.keywords ?? []).map((k) => keywordLabel(k, locale)))],
    // per la ricerca: il gioco è in inglese, chi ci gioca cerca "draw" o "discard" anche sulla pagina italiana
    abilityEn: locale !== "en" && c.ability && c.ability.en !== c.ability[locale] ? c.ability.en : undefined,
    removed: c.status === "removed",
  }));
  // Filtro "Parola chiave" (30/09/2026): i tag che le carte usano davvero, prima le parole chiave del gioco (nomi ufficiali)
  const usedTags = Array.from(new Set(cards.flatMap((c) => c.keywords ?? [])));
  const keywordOptions = usedTags
    .map((id) => ({ id, label: keywordLabel(id, locale), game: Boolean(keywordLabels[id]?.game) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
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
      {/* L'unica cosa sotto il titolo è il tasto verso i Luoghi, l'altra metà del tabellone (Pierluigi, 29/09/2026):
          introduzione, conteggi e note sui dati stanno in fondo, dopo le carte */}
      <p className="mt-4">
        <Link href={href(locale, "/locations")} className="btn btn-ghost">
          {d.cards.exploreLocations} →
        </Link>
      </p>
      <div className="mt-6">
        <CardExplorer
            cards={list}
            sagas={sagaOptions}
            alignments={(["good", "evil", "neutral"] as const).map((id) => ({ id, label: alignLabel[id] }))}
            rarities={(["common", "rare", "epic", "legendary"] as const).map((id) => ({ id, label: rarityLabel[id] }))}
            keywordOptions={keywordOptions}
            filterLabels={cardFilterLabels[locale]}
            labels={{
              search: d.common.search,
              searchHint: d.cards.searchHint,
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
      <RemovedCardsArchive locale={locale} />

      {/* I testi della pagina, dopo le carte (Pierluigi, 29/09/2026): prima stavano fra il titolo e la ricerca */}
      <PageNotes>
        <p className="max-w-2xl text-chalk-muted">{d.cards.intro}</p>
        <p className="mt-4 font-display text-xl font-extrabold text-mint">
          {inDemo} <span className="text-sm font-bold text-chalk-muted">{d.cards.countLabel}</span>
        </p>
        <p className="mt-1 font-mono text-xs text-chalk-muted">
          +{created} {d.cards.countCreated} ·{" "}
          <a href={`#${removedArchiveId}`} className="link-mint">
            {removed} {d.cards.countRemoved}
          </a>
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chalk-muted/80">{d.common.asOf}</p>
        <p className="mt-4 max-w-2xl text-sm text-chalk-muted">{d.cards.legendNote}</p>
        {/* Da dove vengono i dati, detto per quello che è verificato (25/09/2026, decisione di Pierluigi): il sito non
            nomina né linka la fonte dei dati importati. Prima qui c'erano il link e "(Patch 0.6.3)", la patch dell'import. */}
        <p className="mt-2 max-w-2xl text-xs text-chalk-muted/70">{d.cards.sourceNote}</p>
        <p className="mt-2 text-xs text-chalk-muted/70">{d.common.imageCredit}</p>
      </PageNotes>
    </div>
  );
}
