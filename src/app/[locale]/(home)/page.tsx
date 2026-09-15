import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { href, formatDate, formatDateShort } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { movers, sagas } from "@/lib/data/cards";
import { decks, archetypeLabels } from "@/lib/data/decks";
import { tierList, tierIds } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { sortedNews, type NewsItem } from "@/lib/data/news";
import { SectionHead } from "@/components/SectionHead";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardChipList } from "@/components/CardChip";
import { officialLinks } from "@/components/Footer";
import { SteamButton } from "@/components/SteamButton";
import { DiscordButton } from "@/components/DiscordButton";
import { HeroSlider, type Slide } from "@/components/HeroSlider";
import { EventTicker } from "@/components/EventTicker";
import { NewsCover } from "@/components/NewsCover";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  const m = pageMeta(locale, "", dict.meta.homeTitle, dict.meta.description, "/media/og.jpg");
  return { ...m, title: { absolute: dict.meta.homeTitle } };
}

/** Le patch note sono le news con slug `patch-…`: finiscono nel blocco MetaShifting, le altre nella bacheca. */
const isPatchNote = (n: NewsItem) => n.slug.startsWith("patch-");

export default async function Home({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const top = movers().slice(0, 5);
  const guides = getGuides(locale);
  const featured = sortedNews.slice(0, 2);
  const patchNotes = sortedNews.filter((n) => isPatchNote(n) && !featured.includes(n)).slice(0, 3);
  const board = sortedNews.filter((n) => !featured.includes(n) && !patchNotes.includes(n)).slice(0, 6);
  const sectionTitle = { decks: d.tier.sections.decks.title, legendaries: d.tier.sections.legendaries.title, cards: d.tier.sections.cards.title } as const;
  const sl = d.home.slides;
  const slides: Slide[] = [
    { src: "/media/hero-1920.webp", alt: "Origins TCG key art", ...sl.keyArt, href: officialLinks.demo, external: true },
    { src: "/media/banner-rapunzel.webp", alt: "Origins TCG official banner with Rapunzel", ...sl.rapunzel, href: href(locale, "/cards") },
    { src: "/media/ls-zero-pay-to-win.webp", alt: "Official loading screen: zero pay to win", ...sl.zeroPay, href: href(locale, "/guides/is-origins-tcg-pay-to-win") },
    { src: "/media/ls-real-collecting.webp", alt: "Official loading screen: real collecting", ...sl.realCollecting, href: href(locale, "/guides/collector-economy") },
    { src: "/media/ls-collect-them-all.webp", alt: "Official loading screen: collect them all", ...sl.collectAll, href: href(locale, "/cards") },
  ];

  return (
    <>
      {/* Slider a tutta larghezza con le immagini ufficiali del media kit: fa da hero */}
      <HeroSlider slides={slides} labels={d.home.slider} interval={4500} />
      <EventTicker locale={locale} dict={d} />
      <main id="main" className="flex-1">
        {/* Titolo + tasti ufficiali (blocco tenuto com'è: il punto 2 delle note 5.0 è stato scartato) */}
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker text-mint">{d.home.kicker}</p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight text-sky sm:text-4xl">{d.home.title}</h1>
              <p className="mt-2 max-w-2xl text-chalk-muted">{d.home.sub}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SteamButton href={officialLinks.demo} variant="green">
                {d.home.ctaDemo}
              </SteamButton>
              <DiscordButton href={officialLinks.discord}>{d.home.ctaDiscord}</DiscordButton>
            </div>
          </div>

          {/* Due news in evidenza + tier list (ordine delle note 5.0) */}
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_1.15fr_0.85fr]">
            {featured.map((item, i) => (
              <article key={item.slug} className="card-night flex flex-col p-6">
                <NewsCover src={item.image} className="mb-4" />
                <p className={`kicker ${i === 0 ? "text-crimson" : "text-mint"}`}>
                  {i === 0 ? d.home.newsOfDay : d.home.featured} · {formatDate(locale, item.date)}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight text-sky">
                  <Link href={href(locale, "/news")} className="hover:underline">
                    {item.title[locale]}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-pale">{item.summary[locale]}</p>
                {item.cards?.length ? (
                  <div className="mt-4">
                    <p className="kicker mb-2 text-pale-muted">{d.common.cardsMentioned}</p>
                    <CardChipList slugs={item.cards} locale={locale} max={6} />
                  </div>
                ) : null}
                <p className="mt-auto flex flex-wrap gap-3 pt-4 text-sm">
                  <a href={item.url} rel="noopener" className="text-crimson underline">
                    {d.common.source} →
                  </a>
                  <Link href={href(locale, "/news")} className="text-pale-muted hover:text-sky">
                    {d.common.viewAll} →
                  </Link>
                </p>
              </article>
            ))}

            {/* Tier list */}
            <section className="card-night flex flex-col p-5">
              <h2 className="text-2xl font-extrabold text-sky">{d.home.tierTitle}</h2>
              <p className="mt-1 text-sm text-pale-muted">{d.home.tierSub}</p>
              <ul className="mt-4 space-y-2">
                {tierList.sections.map((s) => {
                  const ranked = tierIds.reduce((acc, t) => acc + s.tiers[t].length, 0);
                  return (
                    <li key={s.id}>
                      <Link href={href(locale, `/tier-list#${s.id}`)} className="block rounded-lg border border-sky px-3 py-2 hover:bg-night-3 hover:text-chalk">
                        <span className="block font-display text-sm font-bold">{sectionTitle[s.id]}</span>
                        <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">
                          {ranked > 0 ? `${ranked} ranked` : `${s.unranked.length} · ${d.common.unranked}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-pale-muted">{d.home.tierStatus}</p>
              <Link href={href(locale, "/tier-list")} className="mt-auto pt-3 font-display text-sm font-bold text-crimson hover:underline">
                {d.common.viewAll} →
              </Link>
            </section>
          </div>
        </section>

        {/* MetaShifting + patch note */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <SectionHead title={d.home.patchTitle} sub={d.home.patchSub} link={{ href: href(locale, "/news"), label: d.common.viewAll }} />
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.6fr]">
            <section className="felt-panel-mint flex flex-col p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-2xl font-extrabold text-mint">{d.common.metashift}</h2>
                <span className="font-mono text-[11px] uppercase tracking-wider text-chalk-muted">0.6.1 → 0.6.3</span>
              </div>
              <p className="mt-1 text-sm text-chalk-muted">{d.home.metashiftSub}</p>
              <ol className="mt-4 space-y-2">
                {top.map(({ card, change }) => (
                  <li key={`${card.slug}-${change.patch}`}>
                    <Link href={href(locale, `/cards/${card.slug}`)} className="card-night block px-3 py-2 hover:shadow-mint">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-display text-sm font-bold text-sky">{card.name}</span>
                        <span className="shrink-0 text-[11px] text-pale-muted">{sagas[card.saga][locale]}</span>
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

            <ul className="felt-panel divide-y divide-felt-line self-start">
              {patchNotes.map((nItem) => (
                <li key={nItem.slug} className="grid gap-3 p-5 sm:grid-cols-[110px_180px_1fr]">
                  <p className="font-mono text-sm tabular text-mint">{formatDateShort(locale, nItem.date)}</p>
                  <NewsCover src={nItem.image} />
                  <div>
                    <h3 className="font-display text-lg font-bold text-sky">{nItem.title[locale]}</h3>
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
          </div>
        </section>

        {/* Bacheca news */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <SectionHead title={d.home.newsBoardTitle} sub={d.home.newsBoardSub} link={{ href: href(locale, "/news"), label: d.common.viewAll }} />
          <ul className="felt-panel divide-y divide-felt-line">
            {board.map((nItem) => (
              <li key={nItem.slug} className="grid gap-3 p-4 sm:grid-cols-[110px_140px_1fr]">
                <p className="font-mono text-sm tabular text-mint">{formatDateShort(locale, nItem.date)}</p>
                <NewsCover src={nItem.image} />
                <div>
                  <h3 className="font-display text-base font-bold text-sky">{nItem.title[locale]}</h3>
                  <p className="mt-1 text-sm text-chalk-muted">{nItem.summary[locale]}</p>
                  <a href={nItem.url} rel="noopener" className="mt-1 inline-block text-xs text-mint hover:underline">
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
                <Link href={href(locale, `/decks/${deck.slug}`)} className="card-night card-night-hover flex h-full flex-col p-5">
                  <span className="flex flex-wrap gap-2">
                    <span className="stat-pill bg-night-3 text-chalk text-[11px] font-semibold uppercase">{d.common[deck.source]}</span>
                    <span className="stat-pill border border-sky text-pale">{archetypeLabels[deck.archetype][locale]}</span>
                  </span>
                  <span className="mt-3 font-display text-2xl font-extrabold text-sky">{deck.name}</span>
                  <span className="mt-1 text-sm text-pale-muted">{deck.tagline[locale]}</span>
                  <span className="mt-4 font-display text-sm font-bold text-crimson">{d.common.readMore} →</span>
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
                <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover flex h-full flex-col overflow-hidden">
                  {g.image ? (
                    <Image src={g.image} alt="" width={1200} height={675} sizes="(max-width: 768px) 90vw, 30vw" className="aspect-[16/9] w-full object-cover" />
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="kicker text-pale-muted">
                      {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime}
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold leading-tight text-sky">{g.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-pale-muted">{g.excerpt}</p>
                    <span className="mt-4 font-display text-sm font-bold text-crimson">{d.common.readMore} →</span>
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
                    <dd className="mt-1 font-display text-lg font-bold text-sky">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-chalk-muted/80">{d.home.statusNote}</p>
            </div>
            <Link href={href(locale, "/guides/collector-economy")} className="card-night card-night-hover block overflow-hidden">
              <Image src="/media/ls-two-ways.webp" alt="Two ways to collect: collector packs and prestige packs (official loading screen)" width={1600} height={900} sizes="(max-width: 1024px) 90vw, 50vw" className="w-full" />
              <div className="p-5">
                <p className="kicker text-pale-muted">{d.guides.title}</p>
                <h3 className="mt-1 text-xl font-extrabold text-sky">{guides[2].title}</h3>
                <p className="mt-2 text-sm text-pale-muted">{guides[2].excerpt}</p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
