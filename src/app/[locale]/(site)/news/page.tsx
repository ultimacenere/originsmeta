import type { Metadata } from "next";
import { formatDate } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { sortedNews } from "@/lib/data/news";
import { CardChipList } from "@/components/CardChip";
import { SteamButton } from "@/components/SteamButton";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/news", dict.news.title, dict.news.intro);
}

export default async function NewsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.news}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.news.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.news.intro}</p>
      <ol className="mt-10 space-y-4">
        {sortedNews.map((n) => (
          <li key={n.slug} className="card-night p-6">
            <p className="flex flex-wrap items-center gap-3 font-mono text-sm text-pale-muted">
              <span className="tabular">{formatDate(locale, n.date)}</span>
              <span className={`stat-pill text-[11px] font-semibold uppercase ${n.source === "steam" ? "pill-steam" : "bg-night-3 text-pale"}`}>
                {n.source === "steam" ? "Steam" : d.common.source}
              </span>
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-sky">{n.title[locale]}</h2>
            <p className="mt-3 text-pale">{n.summary[locale]}</p>
            {n.cards?.length ? (
              <div className="mt-4">
                <p className="kicker mb-2 text-pale-muted">{d.common.cardsMentioned}</p>
                <CardChipList slugs={n.cards} locale={locale} />
              </div>
            ) : null}
            {n.source === "steam" ? (
              <p className="mt-4">
                <SteamButton href={n.url} variant="dark" size="sm">
                  {d.common.steamNews}
                </SteamButton>
              </p>
            ) : (
              <a href={n.url} rel="noopener" className="mt-3 inline-block text-sm text-crimson underline">
                {d.common.source} →
              </a>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
