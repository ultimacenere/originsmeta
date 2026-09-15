import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { archetypeLabels, decks, getDeck } from "@/lib/data/decks";
import { getCard } from "@/lib/data/cards";
import { tierOf } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { CardChip, CardChipList } from "@/components/CardChip";
import { DiscordLogo, isDiscordUrl } from "@/components/DiscordButton";
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
        <p className="kicker text-pale-muted">
          {d.decks.detailKicker} · {d.common.updated} {formatDate(locale, deck.updated)}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight text-sky sm:text-5xl">{deck.name}</h1>
        <p className="mt-2 text-lg text-pale-muted">{deck.tagline[locale]}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="stat-pill bg-night-3 text-chalk text-[11px] font-semibold uppercase">{d.common[deck.source]}</span>
          <span className="stat-pill border border-sky text-pale">
            {d.common.archetype}: {archetypeLabels[deck.archetype][locale]}
          </span>
          <span className="stat-pill border border-sky text-pale">
            {d.common.creator}:{" "}
            {deck.creator.url ? (
              <a className={isDiscordUrl(deck.creator.url) ? "link-discord inline-flex items-center gap-1 align-middle" : "underline"} href={deck.creator.url} rel="noopener">
                {isDiscordUrl(deck.creator.url) ? <DiscordLogo className="h-3 w-3" /> : null}
                {deck.creator.name}
              </a>
            ) : (
              deck.creator.name
            )}
          </span>
          <span className="stat-pill bg-night-3 text-pale">
            {d.common.tierPosition}: {tier === "unranked" || !tier ? d.common.unranked : tier}
          </span>
        </div>
        <p className="mt-6 text-pale">{deck.text[locale]}</p>

        {deck.creator.video ? (
          <p className="mt-4">
            <a className="btn btn-ink text-xs" href={deck.creator.video} rel="noopener">
              ▶ {d.common.video}
            </a>
          </p>
        ) : null}

        <h2 className="mt-8 text-xl font-extrabold text-sky">{d.common.legendary}</h2>
        {legendary ? (
          <div className="mt-2">
            <CardChip slug={legendary.slug} locale={locale} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-pale-muted">{d.common.unknownStats}</p>
        )}

        <h2 className="mt-8 text-xl font-extrabold text-sky">{d.common.cardsInDeck}</h2>
        <div className="mt-3">
          <CardChipList slugs={deck.cards} locale={locale} />
        </div>

        <DeckCharts stats={deckStats({ legendary: deck.legendary, cards: deck.cards }, locale, { expectedTotal: RULES.deckSize })} labels={d.stats} partial />

        {deck.changes?.length ? (
          <>
            <h2 className="mt-8 text-xl font-extrabold text-sky">{d.decks.changes}</h2>
            <ul className="mt-3 space-y-3">
              {deck.changes.map((c, i) => (
                <li key={i} className="rounded-lg border border-sky p-4 text-sm">
                  <p className="font-mono">
                    <span className="text-pale-muted">{d.common.patch} {c.patch}</span> · <span className="text-crimson">− {c.removed}</span> · <span className="text-mint">+ {c.added}</span>
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
          <h2 className="text-2xl font-extrabold text-sky">{d.common.relatedGuides}</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover block p-5">
                  <p className="kicker text-pale-muted">{d.guides.categories[g.category]}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-sky">{g.title}</h3>
                  <p className="mt-1 text-sm text-pale-muted">{g.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-sky">{d.decks.otherDecks}</h2>
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
