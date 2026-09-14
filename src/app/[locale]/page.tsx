import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { href, formatDateShort } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { movers, sagas } from "@/lib/data/cards";
import { upcomingEvents } from "@/lib/data/events";
import { getGuides } from "@/lib/content/guides";
import { sortedNews } from "@/lib/data/news";
import { SectionHead } from "@/components/SectionHead";
import { ChangeChip, StatDelta } from "@/components/ChangeChip";
import { EventCard } from "@/components/EventCard";
import { officialLinks } from "@/components/Footer";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  const m = pageMeta(locale, "", `${dict.meta.siteName} · ${dict.meta.tagline}`, dict.meta.description, "/media/og.jpg");
  return { ...m, title: { absolute: `${dict.meta.siteName} · ${dict.meta.tagline}` } };
}

export default async function Home({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const top = movers().slice(0, 6);
  const events = upcomingEvents().slice(0, 3);
  const guides = getGuides(locale);
  const latest = sortedNews.slice(0, 3);

  const lanes = [
    { ...d.home.lanes.cards, href: href(locale, "/cards"), tone: "bg-ink text-ivory" },
    { ...d.home.lanes.tier, href: href(locale, "/tier-list"), tone: "bg-gold text-ink" },
    { ...d.home.lanes.event, href: href(locale, "/tournaments"), tone: "bg-crimson text-ivory" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div>
            <p className="kicker text-mint">{d.home.kicker}</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[0.95] text-chalk sm:text-6xl lg:text-7xl">{d.home.title}</h1>
            <p className="mt-6 max-w-xl text-lg text-chalk-muted">{d.home.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(locale, "/cards")} className="btn btn-gold">
                {d.home.ctaCards}
              </Link>
              <a href={officialLinks.discord} rel="noopener" className="btn btn-ghost">
                {d.home.ctaDiscord}
              </a>
            </div>
            <p className="mt-6 text-xs text-chalk-muted/80">{d.common.notAffiliated}</p>
          </div>
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="hero-art">
              <Image
                src="/media/capsule-main.webp"
                alt="Origins TCG key art: a grinning heroine with a pile of cards and the Origins logo"
                width={1232}
                height={706}
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="h-auto w-full"
              />
            </div>
            <p className="mt-3 text-right font-mono text-[11px] uppercase tracking-wider text-chalk-muted/70">Key art © Koin Games</p>
          </div>
        </div>
      </section>

      {/* Tre corsie */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="lane-rule mb-8" />
        <ul className="grid gap-5 md:grid-cols-3">
          {lanes.map((lane, i) => (
            <li key={lane.href}>
              <Link href={lane.href} className="card-ivory card-ivory-hover flex h-full flex-col p-6">
                <span className={`stat-pill w-fit font-bold uppercase tracking-wider ${lane.tone}`}>{["I", "II", "III"][i]}</span>
                <h2 className="mt-4 text-2xl font-extrabold leading-tight text-ink">{lane.title}</h2>
                <p className="mt-2 flex-1 text-sm text-ink-muted">{lane.text}</p>
                <span className="mt-5 font-display text-sm font-bold text-crimson-deep">{lane.cta} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Meta movers */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHead kicker="0.6.1 → 0.6.3" title={d.home.moversTitle} sub={d.home.moversSub} link={{ href: href(locale, "/tier-list"), label: d.common.viewAll }} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {top.map(({ card, change }) => (
            <li key={`${card.slug}-${change.patch}`}>
              <Link href={href(locale, `/cards/${card.slug}`)} className="card-ivory card-ivory-hover flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="kicker text-ink-muted">{sagas[card.saga][locale]}</p>
                  <h3 className="truncate text-lg font-extrabold text-ink">{card.name}</h3>
                  <StatDelta from={change.from} to={change.to} />
                </div>
                <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Calendario */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHead kicker={formatDateShort(locale, new Date().toISOString().slice(0, 10))} title={d.home.calendarTitle} link={{ href: href(locale, "/tournaments"), label: d.common.viewAll }} />
        <ul className="grid gap-5 md:grid-cols-3">
          {events.map((e) => (
            <li key={e.slug}>
              <EventCard event={e} locale={locale} dict={d} compact />
            </li>
          ))}
        </ul>
      </section>

      {/* Guide */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
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
                    {g.readTime} {d.guides.readTime}
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
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
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

      {/* Ultime news */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionHead title={d.news.title} link={{ href: href(locale, "/news"), label: d.common.viewAll }} />
        <ul className="divide-y divide-felt-line felt-panel">
          {latest.map((nItem) => (
            <li key={nItem.slug} className="grid gap-2 p-5 sm:grid-cols-[120px_1fr]">
              <p className="font-mono text-sm tabular text-mint">{formatDateShort(locale, nItem.date)}</p>
              <div>
                <h3 className="font-display text-lg font-bold text-chalk">{nItem.title[locale]}</h3>
                <p className="mt-1 text-sm text-chalk-muted">{nItem.summary[locale]}</p>
                <a href={nItem.url} rel="noopener" className="mt-2 inline-block text-xs text-gold hover:underline">
                  {d.common.source} →
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
