import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { href, formatDate, formatDateShort } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { movers, sagas } from "@/lib/data/cards";
import { decks, archetypeLabels } from "@/lib/data/decks";
import { tierList, tierIds } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { sortedNews } from "@/lib/data/news";
import { SectionHead } from "@/components/SectionHead";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardChipList } from "@/components/CardChip";
import { officialLinks } from "@/components/Footer";
import { SteamButton } from "@/components/SteamButton";
import { DiscordButton } from "@/components/DiscordButton";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  const m = pageMeta(locale, "", `${dict.meta.siteName} · ${dict.meta.tagline}`, dict.meta.description, "/media/og.jpg");
  return { ...m, title: { absolute: `${dict.meta.siteName} · ${dict.meta.tagline}` } };
}

export default async function Home({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const top = movers().slice(0, 5);
  const guides = getGuides(locale);
  const [today, ...rest] = sortedNews;
  const latest = rest.slice(0, 4);
  const sectionTitle = { decks: d.tier.sections.decks.title, legendaries: d.tier.sections.legendaries.title, cards: d.tier.sections.cards.title } as const;

  return (
    <>
      {/* Above the fold: titolo compatto + news del giorno + MetaShift + tier list */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker text-mint">{d.home.kicker}</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-chalk sm:text-4xl">{d.home.title}</h1>
            <p className="mt-2 max-w-2xl text-chalk-muted">{d.home.sub}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SteamButton href={officialLinks.demo} variant="green">
              {d.home.ctaDemo}
            </SteamButton>
            <DiscordButton href={officialLinks.discord}>{d.home.ctaDiscord}</DiscordButton>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_1fr_0.9fr]">
          {/* News del giorno */}
          <article className="card-ivory flex flex-col p-6">
            <p className="kicker text-crimson-deep">
              {d.home.newsOfDay} · {formatDate(locale, today.date)}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-ink">
              <Link href={href(locale, "/news")} className="hover:underline">
                {today.title[locale]}
              </Link>
            </h2>
            <p className="mt-3 text-sm text-ink">{today.summary[locale]}</p>
            {today.cards?.length ? (
              <div className="mt-4">
                <p className="kicker mb-2 text-ink-muted">{d.common.cardsMentioned}</p>
                <CardChipList slugs={today.cards} locale={locale} max={6} />
              </div>
            ) : null}
            <p className="mt-auto flex flex-wrap gap-3 pt-4 text-sm">
              <a href={today.url} rel="noopener" className="text-crimson-deep underline">
                {d.common.source} →
              </a>
              <Link href={href(locale, "/news")} className="text-ink-muted hover:text-ink">
                {d.common.viewAll} →
              </Link>
            </p>
          </article>

          {/* MetaShift */}
          <section className="felt-panel-mint flex flex-col p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-2xl font-extrabold text-mint">{d.common.metashift}</h2>
              <span className="font-mono text-[11px] uppercase tracking-wider text-chalk-muted">0.6.1 → 0.6.3</span>
            </div>
            <p className="mt-1 text-sm text-chalk-muted">{d.home.metashiftSub}</p>
            <ol className="mt-4 space-y-2">
              {top.map(({ card, change }) => (
                <li key={`${card.slug}-${change.patch}`}>
                  <Link href={href(locale, `/cards/${card.slug}`)} className="card-ivory block px-3 py-2 hover:shadow-mint">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-display text-sm font-bold text-ink">{card.name}</span>
                      <span className="shrink-0 text-[11px] text-ink-muted">{sagas[card.saga][locale]}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <StatDelta from={change.from} to={change.to} />
                      <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link href={href(locale, "/tier-list")} className="mt-4 font-display text-sm font-bold text-mint hover:underline">
              {d.tier.trackerTitle} →
            </Link>
          </section>

          {/* Tier list */}
          <section className="card-ivory flex flex-col p-5">
            <h2 className="text-2xl font-extrabold text-ink">{d.home.tierTitle}</h2>
            <p className="mt-1 text-sm text-ink-muted">{d.home.tierSub}</p>
            <ul className="mt-4 space-y-2">
              {tierList.sections.map((s) => {
                const ranked = tierIds.reduce((acc, t) => acc + s.tiers[t].length, 0);
                return (
                  <li key={s.id}>
                    <Link href={href(locale, `/tier-list#${s.id}`)} className="block rounded-lg border border-ink/15 px-3 py-2 hover:bg-ink hover:text-ivory">
                      <span className="block font-display text-sm font-bold">{sectionTitle[s.id]}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">
                        {ranked > 0 ? `${ranked} ranked` : `${s.unranked.length} · ${d.common.unranked}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-ink-muted">{d.home.tierStatus}</p>
            <Link href={href(locale, "/tier-list")} className="mt-auto pt-3 font-display text-sm font-bold text-crimson-deep hover:underline">
              {d.common.viewAll} →
            </Link>
          </section>
        </div>
      </section>

      {/* Patch notes & news */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <SectionHead title={d.home.patchTitle} sub={d.home.patchSub} link={{ href: href(locale, "/news"), label: d.common.viewAll }} />
        <ul className="felt-panel divide-y divide-felt-line">
          {latest.map((nItem) => (
            <li key={nItem.slug} className="grid gap-3 p-5 sm:grid-cols-[110px_1fr]">
              <p className="font-mono text-sm tabular text-mint">{formatDateShort(locale, nItem.date)}</p>
              <div>
                <h3 className="font-display text-lg font-bold text-chalk">{nItem.title[locale]}</h3>
                <p className="mt-1 text-sm text-chalk-muted">{nItem.summary[locale]}</p>
                {nItem.cards?.length ? (
                  <div className="mt-3">
                    <CardChipList slugs={nItem.cards} locale={locale} max={8} />
                  </div>
                ) : null}
                <a href={nItem.url} rel="noopener" className="mt-2 inline-block text-xs text-mint hover:underline">
                  {d.common.source} →
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Mazzi */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <SectionHead title={d.home.decksTitle} sub={d.home.decksSub} link={{ href: href(locale, "/decks"), label: d.common.viewAll }} />
        <ul className="grid gap-5 md:grid-cols-3">
          {decks.map((deck) => (
            <li key={deck.slug}>
              <Link href={href(locale, `/decks/${deck.slug}`)} className="card-ivory card-ivory-hover flex h-full flex-col p-5">
                <span className="flex flex-wrap gap-2">
                  <span className="stat-pill bg-ink text-ivory text-[11px] font-semibold uppercase">{d.common[deck.source]}</span>
                  <span className="stat-pill border border-ink/20 text-ink">{archetypeLabels[deck.archetype][locale]}</span>
                </span>
                <span className="mt-3 font-display text-2xl font-extrabold text-ink">{deck.name}</span>
                <span className="mt-1 text-sm text-ink-muted">{deck.tagline[locale]}</span>
                <span className="mt-4 font-display text-sm font-bold text-crimson-deep">{d.common.readMore} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Guide */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <SectionHead title={d.home.guidesTitle} sub={d.home.guidesSub} link={{ href: href(locale, "/guides"), label: d.common.viewAll }} />
        <ul className="grid gap-5 md:grid-cols-3">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link href={href(locale, `/guides/${g.slug}`)} className="card-ivory card-ivory-hover flex h-full flex-col overflow-hidden">
                {g.image ? (
                  <Image src={g.image} alt="" width={1200} height={675} sizes="(max-width: 768px) 90vw, 30vw" className="aspect-[16/9] w-full object-cover" />
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <p className="kicker text-ink-muted">
                    {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold leading-tight text-ink">{g.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-muted">{g.excerpt}</p>
                  <span className="mt-4 font-display text-sm font-bold text-crimson-deep">{d.common.readMore} →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Stato del gioco + collezionismo */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHead title={d.home.statusTitle} />
            <dl className="grid grid-cols-2 gap-3">
              {(
                [
                  [d.home.status.demo, d.home.status.demoValue],
                  [d.home.status.reviews, d.home.status.reviewsValue],
                  [d.home.status.matches, d.home.status.matchesValue],
                  [d.home.status.launch, d.home.status.launchValue],
                  [d.home.status.mobile, d.home.status.mobileValue],
                  [d.home.status.languages, d.home.status.languagesValue],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="felt-panel p-4">
                  <dt className="kicker text-chalk-muted">{k}</dt>
                  <dd className="mt-1 font-display text-lg font-bold text-chalk">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-chalk-muted/80">{d.home.statusNote}</p>
          </div>
          <Link href={href(locale, "/guides/collector-economy")} className="card-ivory card-ivory-hover block overflow-hidden">
            <Image src="/media/ls-two-ways.webp" alt="Two ways to collect: collector packs and prestige packs (official loading screen)" width={1600} height={900} sizes="(max-width: 1024px) 90vw, 50vw" className="w-full" />
            <div className="p-5">
              <p className="kicker text-ink-muted">{d.guides.title}</p>
              <h3 className="mt-1 text-xl font-extrabold text-ink">{guides[2].title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{guides[2].excerpt}</p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
