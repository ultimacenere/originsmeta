import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { archetypeLabels } from "@/lib/data/decks";
import { activeCards, getCard, patchAt, patchLabel } from "@/lib/data/cards";
import { listPublishedDeckSets } from "@/lib/community/deckSetQueries";
import { DECK_SET_MIN_DIFFERENT, deckSetIndexableLocales, localizedSetGuide } from "@/lib/community/deckSets";
import { deckLetter, deckSetLabels } from "@/lib/deckSetLabels";
import { authorName } from "@/lib/community/util";
import { normalizeBadge } from "@/lib/community/badges";
import { badgeStyle } from "@/lib/cardArt";
import { weightedRating } from "@/lib/tierstats";
import { fillLabel } from "@/lib/community/deckQuality";
import { supabaseEnabled } from "@/lib/supabase/env";
import { DeckSetExplorer, type ExplorerDeckSet } from "@/components/DeckSetExplorer";
import { DeckSectionTabs } from "@/components/DeckSectionTabs";
import { PageNotes } from "@/components/PageNotes";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/** In ISR come /decks: i trii pubblicati arrivano da Supabase, la pagina si rigenera al massimo ogni 5 minuti. */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = deckSetLabels[locale].list;
  const sets = await listPublishedDeckSets();
  // finché non c'è nessun trio la pagina è un invito vuoto: noindex, come gli elenchi nuovi della community
  return pageMeta(locale, "/decks/tournament", L.metaTitle, L.description, undefined, { noindex: sets.length === 0 });
}

export default async function TournamentDecksPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const S = deckSetLabels[locale];
  const sets = await listPublishedDeckSets();

  const list: ExplorerDeckSet[] = sets.map((s) => {
    const badge = normalizeBadge(s.profile?.badge);
    const patch = patchAt(s.created_at);
    const rating = s.rating ?? { avg: 0, votes: 0 };
    const view = localizedSetGuide(s, locale);
    return {
      slug: s.slug,
      href: href(locale, `/decks/tournament/${s.slug}`),
      name: s.name,
      author: authorName(s.profile),
      ...(badge !== "community" ? { badge: { label: d.community.badges[badge], className: badgeStyle[badge] } } : {}),
      created: s.created_at,
      createdLabel: formatDate(locale, s.created_at.slice(0, 10)),
      ...(patch ? { patch: patchLabel(patch, locale) } : {}),
      // il riassunto solo se si legge nella lingua della pagina (originale o tradotto)
      summary: view.lang === locale ? view.text.summary : "",
      rating,
      score: weightedRating(rating.avg, rating.votes),
      decks: s.decks.map((deck, i) => {
        const card = getCard(deck.legendary);
        return {
          letter: deckLetter(i),
          name: deck.name,
          archetype: archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype,
          legendary: {
            slug: deck.legendary,
            name: card?.name ?? deck.custom_cards?.find((c) => c.slug === deck.legendary)?.name ?? deck.legendary,
            ...(card?.thumb ? { thumb: card.thumb } : {}),
          },
        };
      }),
    };
  });
  // Leggendarie del filtro: quelle della demo, nell'ordine del database
  const legendaries = activeCards
    .filter((c) => c.legendary)
    .map((c): [string, string] => [c.slug, c.name]);

  // ItemList solo con i trii che si indicizzano in questa lingua (stessa regola dei mazzi singoli)
  const listed = sets.filter((s) => deckSetIndexableLocales(s, locales).includes(locale)).map((s) => ({ name: s.name, path: href(locale, `/decks/tournament/${s.slug}`) }));
  const collection = collectionPage({ locale, path: href(locale, "/decks/tournament"), name: S.list.title, description: S.list.description, items: listed, about: videoGameId });
  if (!listed.length) delete collection.mainEntity;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.decks.title, path: href(locale, "/decks") },
            { name: S.list.title, path: href(locale, "/decks/tournament") },
          ]),
          collection,
        ]}
      />
      <DeckSectionTabs locale={locale} active="tournament" />
      <p className="kicker text-mint">{S.list.kicker}</p>
      <h1 className="t-page mt-2">{S.list.title}</h1>
      <p className="mt-4 flex flex-wrap gap-3">
        <Link className="btn btn-primary" href={`${href(locale, "/deck-builder")}?mode=tournament`}>
          {S.list.publishCta} →
        </Link>
      </p>

      <div className="mt-6">
        {list.length ? (
          <DeckSetExplorer
            sets={list}
            legendaries={legendaries}
            labels={{
              filterLegendary: S.list.filterLegendary,
              all: S.list.all,
              sortBy: S.list.sortBy,
              sortNewest: S.list.sortNewest,
              sortRated: S.list.sortRated,
              results: S.list.results,
              noResults: S.list.noResults,
              by: S.list.by,
              votesOne: S.list.votesOne,
              votesMany: S.list.votesMany,
              noVotes: S.list.noVotes,
              patch: d.common.patch,
              legendary: d.common.legendary,
            }}
          />
        ) : (
          <section className="card-night p-6 sm:p-8">
            <h2 className="t-section">{S.list.empty}</h2>
            <p className="mt-2 max-w-2xl text-pale-muted">{supabaseEnabled ? S.list.emptyText : d.community.errors.disabled}</p>
            <p className="mt-4">
              <Link className="btn btn-ink" href={`${href(locale, "/deck-builder")}?mode=tournament`}>
                {S.account.cta}
              </Link>
            </p>
          </section>
        )}
      </div>

      <PageNotes>
        <p className="max-w-3xl text-chalk-muted">{fillLabel(S.list.intro, { min: String(DECK_SET_MIN_DIFFERENT) })}</p>
        <p className="mt-3 max-w-3xl text-sm text-chalk-muted">{S.list.rules}</p>
      </PageNotes>
    </div>
  );
}
