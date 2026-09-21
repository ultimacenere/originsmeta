import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { href, formatDate, formatDateShort } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { latestPatch, movers, patchLabel } from "@/lib/data/cards";
import { tierList, tierIds } from "@/lib/data/tierlist";
import { getGuides } from "@/lib/content/guides";
import { newsPath, sortedNews, type NewsItem } from "@/lib/data/news";
import { SectionHead } from "@/components/SectionHead";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { CardChipList } from "@/components/CardChip";
import { officialLinks } from "@/components/Footer";
import { SteamButton } from "@/components/SteamButton";
import { DiscordButton } from "@/components/DiscordButton";
import { HeroSlider, type Slide } from "@/components/HeroSlider";
import { EventTicker } from "@/components/EventTicker";
import { NewsCover } from "@/components/NewsCover";
import { NewsGuideLinks, NewsSourceLink, newsCardsLabel } from "@/components/NewsLinks";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // Nessun `title` da sovrascrivere: `pageMeta` restituisce già il titolo finale come `absolute`
  // (homeTitle contiene sia "Origins TCG" sia "OriginsMeta", quindi resta esattamente com'è nel dizionario).
  return pageMeta(locale, "", dict.meta.homeTitle, dict.meta.description, "/media/og.jpg");
}

/**
 * Ordine della home (note 7.0 del 16/09/2026): slider, calendario, titolo, le prime tre news "aperte", la tier list
 * a striscia sotto di esse, MetaShifting a striscia della stessa misura, poi la bacheca con le altre news (patch
 * note comprese), guide e stato del gioco. La sezione con i mazzi della community è stata tolta (ridondante).
 */
export default async function Home({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // MetaShifting in home: le tre modifiche più importanti dell'ultima patch (non di sempre, che erano sempre quelle della 0.6.3)
  const top = movers(latestPatch).slice(0, 3);
  const guides = getGuides(locale);
  const economyGuide = guides.find((g) => g.slug === "collector-economy") ?? guides[0];
  const featured = sortedNews.slice(0, 3);
  const board = sortedNews.filter((n) => !featured.includes(n)).slice(0, 6);
  const sectionTitle = { decks: d.tier.sections.decks.title, legendaries: d.tier.sections.legendaries.title, cards: d.tier.sections.cards.title } as const;
  const sl = d.home.slides;
  // Testo alternativo delle slide: sta nel dizionario (campo `alt`), così segue la lingua della pagina.
  const slides: Slide[] = [
    { src: "/media/hero-1920.webp", ...sl.keyArt, href: officialLinks.demo, external: true },
    { src: "/media/banner-rapunzel.webp", ...sl.rapunzel, href: href(locale, "/cards") },
    { src: "/media/ls-zero-pay-to-win.webp", ...sl.zeroPay, href: href(locale, "/guides/is-origins-tcg-pay-to-win") },
    { src: "/media/ls-real-collecting.webp", ...sl.realCollecting, href: href(locale, "/guides/collector-economy") },
    { src: "/media/ls-collect-them-all.webp", ...sl.collectAll, href: href(locale, "/cards") },
  ];

  /**
   * Indirizzo di una news dalla home: la pagina dell'articolo (regola del 21/09/2026, ogni news ha la sua).
   * Per le news sui mazzi pubblicati qui, la scheda del mazzo resta raggiungibile dal link "Apri il mazzo".
   */
  const newsHref = (item: NewsItem) => href(locale, newsPath(item));

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

          {/* Le prime tre news "aperte" in cima (note 7.0) */}
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {featured.map((item, i) => (
              <article key={item.slug} className="card-night flex flex-col p-6">
                <NewsCover src={item.image} className="mb-4" />
                <p className={`kicker ${i === 0 ? "text-crimson" : "text-mint"}`}>
                  {i === 0 ? d.home.newsOfDay : d.home.featured} · {formatDate(locale, item.date)}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight text-sky">
                  <Link href={newsHref(item)} className="hover:underline">
                    {item.title[locale]}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-pale">{item.summary[locale]}</p>
                <p className="mt-3">
                  <Link href={newsHref(item)} className="text-sm font-bold text-mint hover:underline">
                    {d.news.readArticle} →
                  </Link>
                </p>
                {item.cards?.length ? (
                  <div className="mt-4">
                    <p className="kicker mb-2 text-pale-muted">{newsCardsLabel(item, d)}</p>
                    <CardChipList slugs={item.cards} locale={locale} max={6} />
                  </div>
                ) : null}
                <NewsGuideLinks item={item} locale={locale} dict={d} />
                <p className="mt-auto flex flex-wrap gap-3 pt-4 text-sm">
                  <NewsSourceLink item={item} locale={locale} dict={d} className="text-crimson underline" />
                  <Link href={href(locale, "/news")} className="text-pale-muted hover:text-sky">
                    {d.common.viewAll} →
                  </Link>
                </p>
              </article>
            ))}

          </div>

          {/* Tier list: striscia a tutta larghezza sotto le news (note 7.0), compatta finché le sezioni restano "non classificato" */}
          <section className="card-night mt-5 flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-[220px] flex-1">
              <h2 className="text-2xl font-extrabold text-sky">{d.home.tierTitle}</h2>
              <p className="mt-1 text-sm text-pale-muted">{d.home.tierSub}</p>
              <p className="mt-1 text-xs text-pale-muted">{d.home.tierStatus}</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {tierList.sections.map((s) => {
                const ranked = tierIds.reduce((acc, t) => acc + s.tiers[t].length, 0);
                return (
                  <li key={s.id}>
                    <Link href={href(locale, `/tier-list#${s.id}`)} className="block rounded-lg border-2 border-sky px-3 py-2 text-pale hover:bg-night-3 hover:text-chalk">
                      <span className="block font-display text-sm font-bold text-sky">{sectionTitle[s.id]}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">
                        {ranked > 0 ? `${ranked} ${d.common.ranked}` : `${s.unranked.length} · ${d.common.unranked}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link href={href(locale, "/tier-list")} className="btn btn-mint text-xs">
              {d.common.viewAll} →
            </Link>
          </section>

          {/* MetaShifting: striscia della stessa misura sotto la tier list (note 7.0); le patch note stanno nella bacheca */}
          <section className="felt-panel-mint mt-5 flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-[220px] max-w-xs flex-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl font-extrabold text-mint">{d.common.metashift}</h2>
                <span className="font-mono text-[11px] uppercase tracking-wider text-chalk-muted">
                  {d.common.patch} {patchLabel(latestPatch, locale)}
                </span>
              </div>
              <p className="mt-1 text-sm text-chalk-muted">{d.home.metashiftSub}</p>
            </div>
            <ol className="flex flex-1 flex-wrap gap-2">
              {top.map(({ card, change }) => (
                <li key={`${card.slug}-${change.patch}`}>
                  <Link href={href(locale, `/cards/${card.slug}`)} className="card-night flex items-center gap-2 px-2.5 py-1.5 text-xs hover:shadow-mint">
                    <span className="font-display text-xs font-bold text-sky">{card.name}</span>
                    <StatDelta from={change.from} to={change.to} />
                    <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
                  </Link>
                </li>
              ))}
            </ol>
            {/* Il tasto promette il tracker delle patch: porta direttamente a quella sezione, non in cima alla tier list */}
            <Link href={href(locale, "/tier-list#tracker")} className="btn btn-mint text-xs">
              {d.tier.trackerTitle} →
            </Link>
          </section>
        </section>

        {/* Bacheca news (patch note comprese) */}
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <SectionHead title={d.home.newsBoardTitle} sub={d.home.newsBoardSub} link={{ href: href(locale, "/news"), label: d.common.viewAll }} />
          <ul className="felt-panel divide-y divide-felt-line">
            {board.map((nItem) => (
              <li key={nItem.slug} className="grid gap-3 p-4 sm:grid-cols-[110px_140px_1fr]">
                <p className="font-mono text-sm tabular text-mint">{formatDateShort(locale, nItem.date)}</p>
                <NewsCover src={nItem.image} />
                <div>
                  {/* Il titolo porta alla voce dentro /news (o alla scheda del mazzo); la fonte resta il link piccolo sotto il riassunto */}
                  <h3 className="font-display text-base font-bold text-sky">
                    <Link href={newsHref(nItem)} className="hover:underline">
                      {nItem.title[locale]}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-chalk-muted">{nItem.summary[locale]}</p>
                  <NewsSourceLink item={nItem} locale={locale} dict={d} className="mt-1 inline-block text-xs text-mint hover:underline" />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Mazzi: solo quelli pubblicati dalla community (i tre mazzi di esempio del playtest sono stati rimossi il 15/09/2026) */}
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
              {/* Copertina della scheda guida: decorativa, il titolo e il riassunto accanto dicono già tutto (come nella griglia delle guide) */}
              <Image src="/media/ls-two-ways.webp" alt="" width={1600} height={900} sizes="(max-width: 1024px) 90vw, 50vw" className="w-full" />
              <div className="p-5">
                <p className="kicker text-pale-muted">{d.guides.title}</p>
                <h3 className="mt-1 text-xl font-extrabold text-sky">{economyGuide.title}</h3>
                <p className="mt-2 text-sm text-pale-muted">{economyGuide.excerpt}</p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
