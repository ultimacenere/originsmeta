import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { archetypeLabels, decks } from "@/lib/data/decks";
import { cards, getCard, statLine } from "@/lib/data/cards";
import { DeckExplorer, type ExplorerDeck } from "@/components/DeckExplorer";
import { contactEmail } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/decks", dict.decks.title, dict.decks.intro);
}

export default async function DecksPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const legendaries = cards.filter((c) => c.legendary);
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
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.decks.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.decks.intro}</p>
      <p className="mt-5">
        <Link href={href(locale, "/deck-builder")} className="btn btn-mint">
          {d.nav.builder} →
        </Link>
      </p>

      <div className="mt-8">
        <DeckExplorer
          decks={list}
          labels={{
            legendary: d.common.filterLegendary,
            archetype: d.common.filterArchetype,
            creator: d.common.filterCreator,
            card: d.common.filterCard,
            all: d.common.all,
            results: d.common.results,
            noResults: d.common.noDecks,
            cardsInDeck: d.common.cardsInDeck,
          }}
        />
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="felt-panel p-6">
          <h2 className="text-2xl font-extrabold text-chalk">{d.decks.legendariesTitle}</h2>
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
          <h2 className="text-2xl font-extrabold text-chalk">{d.decks.conquestTitle}</h2>
          <p className="mt-3 text-chalk-muted">{d.decks.conquestText}</p>
        </section>
      </div>

      <section className="card-ivory mt-12 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">{d.decks.submitTitle}</h2>
          <p className="mt-1 text-ink-muted">{d.decks.submitText}</p>
        </div>
        <a className="btn btn-ink" href={`mailto:${contactEmail}?subject=Deck%20OriginsMeta`}>
          {d.decks.submitCta}
        </a>
      </section>
    </div>
  );
}
