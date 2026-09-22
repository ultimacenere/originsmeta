import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { archetypeLabels, decks, getDeck } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { tierOf } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { DeckCardGrid } from "@/components/CardChip";
import { DiscordButton, isDiscordUrl } from "@/components/DiscordButton";
import { newTabProps } from "@/components/SteamButton";
import { DeckCharts } from "@/components/DeckCharts";
import { deckStats } from "@/lib/deckstats";
import { RULES } from "@/lib/deckrules";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => decks.map((deck) => ({ locale, slug: deck.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const deck = getDeck(slug);
  if (!deck) return {};
  return pageMeta(locale, `/decks/${deck.slug}`, `${deck.name} · ${dict.decks.title}`, `${deck.tagline[locale]}. ${deck.text[locale]}`);
}

export default async function DeckPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const deck = getDeck(slug);
  if (!deck) notFound();
  const legendary = deck.legendary ? getCard(deck.legendary) : undefined;
  const tier = tierOf("decks", deck.slug);
  const guides = getGuides(locale).filter((g) => g.tags?.decks?.includes(deck.slug));
  const others = decks.filter((x) => x.slug !== deck.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.decks.title, path: href(locale, "/decks") }, { name: deck.name, path: href(locale, `/decks/${deck.slug}`) }])} />
      <p className="text-sm">
        <Link href={href(locale, "/decks")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.decks.title}
        </Link>
      </p>

      <article className="card-night mt-6 p-6 sm:p-8">
        <p className="kicker text-mint">
          {d.decks.detailKicker} · {d.common.updated} {formatDate(locale, deck.updated)}
        </p>
        <h1 className="t-page mt-2 leading-tight">{deck.name}</h1>
        <p className="mt-2 text-lg text-pale-muted">{deck.tagline[locale]}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="stat-pill bg-night-3 text-chalk text-[11px] font-semibold uppercase">{d.common[deck.source]}</span>
          <span className="stat-pill border-2 border-sky text-pale">
            {d.common.archetype}: {archetypeLabels[deck.archetype][locale]}
          </span>
          {/* creator su Discord: il tasto ufficiale (il blurple come colore del testo faceva 3,4:1 sul blu notte) */}
          {deck.creator.url && isDiscordUrl(deck.creator.url) ? (
            <DiscordButton href={deck.creator.url} size="sm">
              {d.common.creator}: {deck.creator.name}
            </DiscordButton>
          ) : (
            <span className="stat-pill border-2 border-sky text-pale">
              {d.common.creator}:{" "}
              {deck.creator.url ? (
                <a className="link-mint" href={deck.creator.url} {...newTabProps}>
                  {deck.creator.name}
                </a>
              ) : (
                deck.creator.name
              )}
            </span>
          )}
          <span className="stat-pill bg-night-3 text-pale">
            {d.common.tierPosition}: {tier === "unranked" || !tier ? d.common.unranked : tier}
          </span>
        </div>
        <p className="mt-6 text-pale">{deck.text[locale]}</p>

        {deck.creator.video ? (
          <p className="mt-4">
            <a className="btn btn-ink text-xs" href={deck.creator.video} {...newTabProps}>
              ▶ {d.common.video}
            </a>
          </p>
        ) : null}

        {/* Stessa griglia di carte che si girano della scheda dei mazzi di Origins (FlipCard, 22/09/2026) */}
        <h2 className="t-section mt-8">{d.common.legendary}</h2>
        {legendary ? (
          <div className="mt-3">
            <DeckCardGrid slugs={[legendary.slug]} locale={locale} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-pale-muted">{d.common.unknownStats}</p>
        )}

        <h2 className="t-section mt-8">{d.common.cardsInDeck}</h2>
        <div className="mt-3">
          <DeckCardGrid slugs={deck.cards} locale={locale} />
        </div>

        <DeckCharts stats={deckStats({ legendary: deck.legendary, cards: deck.cards }, locale, { expectedTotal: RULES.deckSize })} labels={d.stats} partial />

        {deck.changes?.length ? (
          <>
            <h2 className="t-section mt-8">{d.decks.changes}</h2>
            <ul className="mt-3 space-y-3">
              {deck.changes.map((c, i) => (
                <li key={i} className="rounded-lg border border-sky p-4 text-sm">
                  <p className="font-mono">
                    <span className="text-pale-muted">{d.common.patch} {c.patch}</span> · <span className="text-pink">− {c.removed}</span> · <span className="text-mint">+ {c.added}</span>
                  </p>
                  <p className="mt-1 text-pale-muted">{c.why[locale]}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </article>

      {guides.length ? (
        <section className="mt-10">
          <h2 className="t-section">{d.common.relatedGuides}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover block p-5">
                  <p className="kicker text-pale-muted">{d.guides.categories[g.category]}</p>
                  <h3 className="t-item mt-1">{g.title}</h3>
                  <p className="mt-1 text-sm text-pale-muted">{g.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="t-section">{d.decks.otherDecks}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((x) => (
            <li key={x.slug}>
              <Link href={href(locale, `/decks/${x.slug}`)} className="btn btn-ghost text-xs">
                {x.name} <span className="font-mono font-normal text-chalk-muted">{archetypeLabels[x.archetype][locale]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
