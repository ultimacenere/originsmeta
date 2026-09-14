import type { Metadata } from "next";
import { formatDate } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { sortedNews } from "@/lib/data/news";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/news", dict.news.title, dict.news.intro);
}

export default async function NewsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.news}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-chalk sm:text-5xl">{d.news.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.news.intro}</p>
      <ol className="mt-10 space-y-4">
        {sortedNews.map((n) => (
          <li key={n.slug} className="card-ivory p-6">
            <p className="flex flex-wrap items-center gap-3 font-mono text-sm text-ink-muted">
              <span className="tabular">{formatDate(locale, n.date)}</span>
              <span className={`stat-pill text-[11px] font-semibold uppercase ${n.source === "steam" ? "bg-ink text-ivory" : "bg-ivory-3 text-ink"}`}>
                {n.source === "steam" ? "Steam" : d.common.source}
              </span>
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-ink">{n.title[locale]}</h2>
            <p className="mt-3 text-ink">{n.summary[locale]}</p>
            <a href={n.url} rel="noopener" className="mt-3 inline-block text-sm text-crimson-deep underline">
              {n.source === "steam" ? d.common.steamNews : d.common.source} →
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
