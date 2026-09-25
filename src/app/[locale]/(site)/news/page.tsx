import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { newsPath, sortedNews } from "@/lib/data/news";
import { CardChipList } from "@/components/CardChip";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { SteamButton } from "@/components/SteamButton";
import { NewsCover } from "@/components/NewsCover";
import { NewsDeckButton, NewsGuideLinks, NewsSourceLink, isDeckNews, newsCardsLabel, newsSourceClass, newsSourceLabel } from "@/components/NewsLinks";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // "patch notes" non sta più nel titolo (piano SEO del 25/09/2026): la pagina primaria di quella ricerca è /metashifting
  return pageMeta(locale, "/news", dict.news.metaTitle, dict.news.description);
}

export default async function NewsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);

  // Lista per i dati strutturati: ogni news ha la sua pagina (/news/<slug>). Le ancore restano sulle
  // voci qui sotto, così i vecchi link /news#slug continuano a funzionare.
  const listed = sortedNews.map((n) => ({ name: n.title[locale], path: href(locale, newsPath(n)) }));

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
      {/* Anteprima delle carte al passaggio del mouse (CardChip): la tiene dentro la finestra ai bordi. */}
      <CardMentionEdges />
      <p className="kicker text-mint">{d.nav.news}</p>
      <h1 className="t-page mt-2">{d.news.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.news.intro}</p>
      {/* In cima, il rimando fisso alla pagina che raccoglie tutte le patch (piano SEO del 25/09/2026) */}
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">
        {d.news.patchNotesText}{" "}
        <Link href={href(locale, "/metashifting")} className="link-mint font-bold">
          {d.news.patchNotesLink} →
        </Link>
      </p>
      <ol className="mt-10 space-y-4">
        {sortedNews.map((n) => (
          <li key={n.slug} id={n.slug} className="card-night scroll-mt-24 p-6">
            <NewsCover src={n.image} className="mb-4" />
            {/* News su un mazzo pubblicato qui: il tasto per aprirlo sta subito sotto la copertina, non in fondo
                (riunione del 21/09/2026). Sulle altre news non rende nulla. */}
            <NewsDeckButton item={n} locale={locale} dict={d} className="mb-4" />
            <p className="flex flex-wrap items-center gap-3 font-mono text-sm text-pale-muted">
              <span className="tabular">{formatDate(locale, n.date)}</span>
              <span className={newsSourceClass(n)}>{newsSourceLabel(n, d)}</span>
            </p>
            <h2 className="t-item mt-2 leading-tight">
              <Link href={href(locale, newsPath(n))} className="hover:underline">
                {n.title[locale]}
              </Link>
            </h2>
            <p className="mt-3 text-pale">{n.summary[locale]}</p>
            <p className="mt-3">
              <Link href={href(locale, newsPath(n))} className="text-sm font-bold text-mint hover:underline">
                {d.news.readArticle} →
              </Link>
            </p>
            {n.cards?.length ? (
              <div className="mt-4">
                <p className="kicker mb-2 text-pale-muted">{newsCardsLabel(n, d)}</p>
                <CardChipList slugs={n.cards} locale={locale} />
              </div>
            ) : null}
            <NewsGuideLinks item={n} locale={locale} dict={d} />
            {n.source === "steam" && n.url ? (
              <p className="mt-4">
                <SteamButton href={n.url} variant="dark" size="sm">
                  {d.common.steamNews}
                </SteamButton>
              </p>
            ) : isDeckNews(n) ? null : (
              // Fonte esterna in menta (il magenta faceva 2,96:1 sul blu notte), in una nuova scheda. Sulle news dei
              // mazzi non serve: il link al mazzo è già il tasto sotto la copertina.
              <NewsSourceLink item={n} locale={locale} dict={d} className="link-mint mt-3 inline-block text-sm" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
