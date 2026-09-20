import type { Metadata } from "next";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { sortedNews } from "@/lib/data/news";
import { CardChipList } from "@/components/CardChip";
import { SteamButton } from "@/components/SteamButton";
import { NewsCover } from "@/components/NewsCover";
import { NewsGuideLinks, NewsSourceLink, newsCardsLabel, newsSourceClass, newsSourceLabel } from "@/components/NewsLinks";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/news", dict.news.title, dict.news.description);
}

export default async function NewsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);

  // Lista per i dati strutturati: le news non hanno una pagina propria, ognuna è un'ancora di /news.
  const listed = sortedNews.map((n) => ({ name: n.title[locale], path: `${href(locale, "/news")}#${n.slug}` }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.news.title, path: href(locale, "/news") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/news"),
            name: d.news.title,
            description: d.news.description,
            items: listed,
            about: videoGameId,
          }),
        ]}
      />
      <p className="kicker text-mint">{d.nav.news}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.news.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.news.intro}</p>
      <ol className="mt-10 space-y-4">
        {sortedNews.map((n) => (
          <li key={n.slug} id={n.slug} className="card-night scroll-mt-24 p-6">
            <NewsCover src={n.image} className="mb-4" />
            <p className="flex flex-wrap items-center gap-3 font-mono text-sm text-pale-muted">
              <span className="tabular">{formatDate(locale, n.date)}</span>
              <span className={newsSourceClass(n)}>{newsSourceLabel(n, d)}</span>
            </p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-sky">{n.title[locale]}</h2>
            <p className="mt-3 text-pale">{n.summary[locale]}</p>
            {n.cards?.length ? (
              <div className="mt-4">
                <p className="kicker mb-2 text-pale-muted">{newsCardsLabel(n, d)}</p>
                <CardChipList slugs={n.cards} locale={locale} />
              </div>
            ) : null}
            <NewsGuideLinks item={n} locale={locale} dict={d} />
            {n.source === "steam" ? (
              <p className="mt-4">
                <SteamButton href={n.url} variant="dark" size="sm">
                  {d.common.steamNews}
                </SteamButton>
              </p>
            ) : (
              <NewsSourceLink item={n} locale={locale} dict={d} className="mt-3 inline-block text-sm text-crimson underline" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
