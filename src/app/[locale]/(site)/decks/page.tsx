import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { archetypeLabels, decks } from "@/lib/data/decks";
import { cards, getCard, statLine } from "@/lib/data/cards";
import { DeckExplorer, type ExplorerDeck } from "@/components/DeckExplorer";
import { listPublishedDecks } from "@/lib/community/queries";
import { authorName } from "@/lib/community/util";

/** I mazzi della community arrivano da Supabase: la pagina si rigenera al massimo ogni 5 minuti (e subito dopo ogni pubblicazione). */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/decks", dict.decks.title, dict.decks.intro);
}

export default async function DecksPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const legendaries = cards.filter((c) => c.legendary);
  const community = await listPublishedDecks();
  const communityList: ExplorerDeck[] = community
    .slice()
    .sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0) || (b.rating?.votes ?? 0) - (a.rating?.votes ?? 0) || b.created_at.localeCompare(a.created_at))
    .map((deck) => {
      const leg = deck.legendary ? getCard(deck.legendary) : undefined;
      const legCustom = !leg ? deck.custom_cards.find((x) => x.slug === deck.legendary) : undefined;
      return {
        slug: `community-${deck.slug}`,
        name: deck.name,
        href: href(locale, `/decks/community/${deck.slug}`),
        tagline: deck.guide.summary.length > 140 ? `${deck.guide.summary.slice(0, 140).trimEnd()}…` : deck.guide.summary,
        legendary: leg ? { slug: leg.slug, name: leg.name } : legCustom ? { slug: legCustom.slug, name: legCustom.name } : undefined,
        archetype: deck.archetype,
        archetypeLabel: archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype,
        creator: authorName(deck.profile),
        source: "community",
        sourceLabel: d.common.community,
        cardNames: deck.cards.map((s) => getCard(s)?.name ?? deck.custom_cards.find((x) => x.slug === s)?.name ?? s),
        updated: deck.updated_at.slice(0, 10),
        rating: deck.rating,
        deckTypeLabels: deck.deck_types.map((t) => d.community.deckTypes[t as keyof typeof d.community.deckTypes] ?? t),
        creatorBadge: d.community.badges[(deck.profile?.badge ?? "community") as keyof typeof d.community.badges] ?? deck.profile?.badge ?? undefined,
        creatorBadgeId: deck.profile?.badge ?? "community",
      };
    });
  const list: ExplorerDeck[] = decks.map((deck) => {
    const leg = deck.legendary ? getCard(deck.legendary) : undefined;
    return {
      slug: deck.slug,
      name: deck.name,
      href: href(locale, `/decks/${deck.slug}`),
      tagline: deck.tagline[locale],
      legendary: leg ? { slug: leg.slug, name: leg.name } : undefined,
      archetype: deck.archetype,
      archetypeLabel: archetypeLabels[deck.archetype][locale],
      creator: deck.creator.name,
      source: deck.source,
      sourceLabel: d.common[deck.source],
      cardNames: deck.cards.map((s) => getCard(s)?.name ?? s),
      updated: deck.updated,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.decks}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.decks.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.decks.intro}</p>
      <p className="mt-5">
        <Link href={href(locale, "/deck-builder")} className="btn btn-mint">
          {d.nav.builder} →
        </Link>
      </p>

      <div className="mt-8">
        <DeckExplorer
          decks={[...list, ...communityList]}
          labels={{
            legendary: d.common.filterLegendary,
            archetype: d.common.filterArchetype,
            creator: d.common.filterCreator,
            card: d.common.filterCard,
            all: d.common.all,
            results: d.common.results,
            noResults: d.common.noDecks,
            cardsInDeck: d.common.cardsInDeck,
            votes: d.community.votes,
            vote: d.community.vote,
          }}
        />
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="felt-panel p-6">
          <h2 className="text-2xl font-extrabold text-sky">{d.decks.legendariesTitle}</h2>
          <p className="mt-3 text-chalk-muted">{d.decks.legendariesText}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {legendaries.map((c) => (
              <li key={c.slug}>
                <Link href={href(locale, `/cards/${c.slug}`)} className="btn btn-gold text-xs">
                  ★ {c.name} <span className="font-mono font-normal">{statLine(c)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="felt-panel p-6">
          <h2 className="text-2xl font-extrabold text-sky">{d.decks.conquestTitle}</h2>
          <p className="mt-3 text-chalk-muted">{d.decks.conquestText}</p>
        </section>
      </div>

      <section className="card-night mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-2xl font-extrabold text-sky">{d.decks.submitTitle}</h2>
          <p className="mt-1 text-pale-muted">{d.decks.submitText}</p>
        </div>
        <Link className="btn btn-ink" href={href(locale, "/deck-builder")}>
          {d.decks.submitCta}
        </Link>
      </section>
    </div>
  );
}
