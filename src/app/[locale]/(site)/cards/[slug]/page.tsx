import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { cards, cardSource, getCard, patches, relatedFrom, sagas, statLine } from "@/lib/data/cards";
import { archetypeLabels, decksWithCard } from "@/lib/data/decks";
import { tierOf } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardArt, CardChipList } from "@/components/CardChip";
import { alignStyle } from "@/lib/cardArt";
import { SteamButton } from "@/components/SteamButton";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => cards.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) return {};
  const stats = statLine(card);
  const text = card.ability?.[locale] ?? card.origin?.[locale] ?? "";
  const desc = `${card.name}${stats ? ` (${stats})` : ""} · ${sagas[card.saga][locale]} · ${text.replace(/\s*\n\s*/g, " ")}`;
  return pageMeta(locale, `/cards/${card.slug}`, `${card.name} · ${dict.cards.title}`, desc, card.image);
}

export default async function CardPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const card = getCard(slug);
  if (!card) notFound();
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const rarityLabel = { common: d.common.common, rare: d.common.rare, epic: d.common.epic, legendary: d.common.legendary } as const;
  const related = cards.filter((c) => c.saga === card.saga && c.slug !== card.slug && c.status === "active");
  const linked = (card.related ?? []).filter((s) => getCard(s));
  const linkedFrom = relatedFrom(card.slug);
  const inDecks = decksWithCard(card.slug);
  const guides = getGuides(locale).filter((g) => g.tags?.cards?.includes(card.slug));
  const tier = tierOf(card.legendary ? "legendaries" : "cards", card.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.cards.title, path: href(locale, "/cards") }, { name: card.name, path: href(locale, `/cards/${card.slug}`) }])} />
      <p className="text-sm">
        <Link href={href(locale, "/cards")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.cards.title}
        </Link>
      </p>

      <article className="card-ivory mt-6 grid gap-8 p-6 sm:p-8 md:grid-cols-[150px_1fr_240px]">
        <div>
          <CardArt card={card} className="!h-[210px] !w-[150px] text-3xl" />
          {!card.image ? <p className="mt-2 text-center text-[11px] text-ink-muted">{d.common.noImage}</p> : <p className="mt-2 text-center text-[11px] text-ink-muted">{d.common.imageCredit}</p>}
        </div>
        <div>
          <p className="kicker text-ink-muted">
            {d.cards.detailKicker} · {sagas[card.saga][locale]}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            {card.legendary ? <span className="text-gold-deep">★ </span> : null}
            {card.name}
          </h1>
          {card.formerName ? (
            <p className="mt-1 text-sm text-ink-muted">
              {d.common.formerName}: {card.formerName}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="stat-pill bg-ink text-ivory">{typeLabel[card.type]}</span>
            {card.legendary ? <span className="stat-pill bg-gold text-ink font-bold">★ {d.common.legendary}</span> : null}
            {card.rarity && card.rarity !== "legendary" ? <span className="stat-pill bg-ivory-3 text-ink">{rarityLabel[card.rarity]}</span> : null}
            {card.alignment ? <span className={`stat-pill ${alignStyle[card.alignment]}`}>{alignLabel[card.alignment]}</span> : null}
            {card.status === "removed" ? <span className="stat-pill bg-crimson text-ivory">{d.common.removed}</span> : null}
            {tier ? (
              <span className="stat-pill bg-ivory-3 text-ink">
                {d.common.tierPosition}: {tier === "unranked" ? d.common.unranked : tier}
              </span>
            ) : null}
          </div>
          {card.ability ? <p className="mt-6 whitespace-pre-line text-lg text-ink">{card.ability[locale]}</p> : null}
          {card.ability && locale !== "en" ? <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{card.ability.en}</p> : null}
          {card.keywords?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {card.keywords.map((k) => (
                <span key={k} className="rounded border border-sky/60 px-2 py-0.5 text-[11px] text-ink-muted">
                  {k}
                </span>
              ))}
            </div>
          ) : null}
          {card.origin ? (
            <>
              <h2 className="mt-8 text-xl font-extrabold text-ink">{d.cards.sagaTitle}</h2>
              <p className="mt-2 text-ink-muted">{card.origin[locale]}</p>
            </>
          ) : null}
        </div>

        <aside className="felt-panel self-start p-5 text-chalk">
          <p className="kicker text-chalk-muted">{d.common.stats}</p>
          {card.mana === undefined && card.power === undefined ? (
            <p className="mt-2 text-sm text-chalk-muted">{d.common.unknownStats}</p>
          ) : (
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="kicker text-chalk-muted">{d.common.mana}</dt>
                <dd className="font-display text-3xl font-extrabold text-mint tabular">{card.mana ?? "–"}</dd>
              </div>
              <div>
                <dt className="kicker text-chalk-muted">{d.common.power}</dt>
                <dd className="font-display text-3xl font-extrabold text-chalk tabular">{card.power ?? "–"}</dd>
              </div>
              <div>
                <dt className="kicker text-chalk-muted">{d.common.health}</dt>
                <dd className="font-display text-3xl font-extrabold text-chalk tabular">{card.health ?? "–"}</dd>
              </div>
            </dl>
          )}
          {card.key ? <p className="mt-3 font-mono text-[11px] text-chalk-muted/80">ID {card.key}</p> : null}
          <p className="mt-4 text-[11px] leading-snug text-chalk-muted/80">{d.common.asOf}</p>
        </aside>
      </article>

      {linked.length || linkedFrom.length ? (
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {linked.length ? (
            <div>
              <h2 className="text-2xl font-extrabold text-chalk">{d.common.related}</h2>
              <div className="mt-4">
                <CardChipList slugs={linked} locale={locale} />
              </div>
            </div>
          ) : null}
          {linkedFrom.length ? (
            <div>
              <h2 className="text-2xl font-extrabold text-chalk">{d.common.relatedFrom}</h2>
              <div className="mt-4">
                <CardChipList slugs={linkedFrom.map((c) => c.slug)} locale={locale} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {card.history.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-chalk">{d.cards.changesTitle}</h2>
          <ol className="mt-4 space-y-3">
            {[...card.history].reverse().map((ch, i) => (
              <li key={i} className="card-ivory p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <ChangeChip kind={ch.kind} label={d.common[ch.kind === "deck" ? "rework" : ch.kind]} />
                  <span className="font-mono text-sm text-ink-muted">
                    {d.common.patch} {ch.patch} · {formatDate(locale, patches[ch.patch].date)}
                  </span>
                  <SteamButton href={patches[ch.patch].url} variant="dark" size="sm" className="ml-auto">
                    {d.common.steamNews}
                  </SteamButton>
                </div>
                <div className="mt-3">
                  <StatDelta from={ch.from} to={ch.to} />
                </div>
                <p className="mt-2 text-ink">{ch.note[locale]}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {inDecks.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-chalk">{d.common.decksWithCard}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {inDecks.map((deck) => (
              <li key={deck.slug}>
                <Link href={href(locale, `/decks/${deck.slug}`)} className="btn btn-mint text-xs">
                  {deck.name} <span className="font-mono font-normal opacity-70">{archetypeLabels[deck.archetype][locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {guides.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-chalk">{d.common.relatedGuides}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="btn btn-ghost text-xs">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold text-chalk">
            {d.cards.relatedTitle}: {sagas[card.saga][locale]}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Link href={href(locale, `/cards/${c.slug}`)} className="btn btn-ghost text-xs">
                  {c.name}
                  {statLine(c) ? <span className="font-mono text-chalk-muted">{statLine(c)}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 text-xs text-chalk-muted/70">
        {d.cards.sourceBefore}{" "}
        <a href={cardSource.url} rel="noopener" className="link-mint">
          {cardSource.name}
        </a>{" "}
        ({d.common.patch} {cardSource.patch}){d.cards.sourceAfter}
      </p>
    </div>
  );
}
