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
import { listPublishedComics } from "@/lib/community/comicQueries";
import { comicFeedCards, mergeFeed } from "@/lib/community/comics";
import { fillLabel } from "@/lib/community/deckQuality";
import { authorName } from "@/lib/community/util";
import { supabaseUrl } from "@/lib/supabase/env";
import { comicLabels } from "@/lib/comicLabels";
import { ComicCtaBox } from "@/components/comics/ComicCtaBox";

/**
 * Dal 29/09/2026 (pacchetto FUMETTI) fra le news ci sono anche i fumetti dei creator, che stanno nel database: la pagina è
 * in ISR come /decks e /guides (le Server Action dei fumetti la rinnovano subito). Un errore del database lancia e resta
 * la pagina di prima; con la community spenta o la tabella che non c'è, solo le news del sito.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // "patch notes" non sta più nel titolo (piano SEO del 25/09/2026): la pagina primaria di quella ricerca è /metashifting
  return pageMeta(locale, "/news", dict.news.metaTitle, dict.news.description);
}

export default async function NewsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const C = comicLabels[locale];
  // News del sito e fumetti dei creator in un solo elenco, dal più recente (mergeFeed in comics.ts)
  const feed = mergeFeed(sortedNews, comicFeedCards(await listPublishedComics(60), locale, supabaseUrl, authorName));

  // Lista per i dati strutturati: ogni news ha la sua pagina (/news/<slug>), ogni fumetto la sua (/news/comics/<slug>).
  // Le ancore restano sulle voci qui sotto, così i vecchi link /news#slug continuano a funzionare.
  const listed = feed.map((e) => (e.kind === "news" ? { name: e.item.title[locale], path: href(locale, newsPath(e.item)) } : { name: e.comic.title, path: href(locale, e.comic.path) }));

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
      {/* "Pubblica un fumetto" per chi può (Creator e Staff): lo decide il browser */}
      <ComicCtaBox labels={C.cta} href={href(locale, "/news/comics/new")} />
      <ol className="mt-10 space-y-4">
        {feed.map((e) => {
          if (e.kind === "comic") {
            const c = e.comic;
            return (
              <li key={`comic-${c.slug}`} className="card-night scroll-mt-24 p-6">
                {c.image ? <NewsCover src={c.image} className="mb-4" /> : null}
                <p className="flex flex-wrap items-center gap-3 font-mono text-sm text-pale-muted">
                  <span className="tabular">{formatDate(locale, c.date.slice(0, 10))}</span>
                  <span className="stat-pill pill-comic text-[11px] font-semibold uppercase">{C.pill}</span>
                </p>
                <h2 className="t-item mt-2 leading-tight" lang={c.titleLang}>
                  <Link href={href(locale, c.path)} className="hover:underline">
                    {c.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-pale-muted">{fillLabel(C.by, { name: c.author.name })}</p>
                <p className="mt-3 text-pale" lang={c.summaryLang}>
                  {c.summary}
                </p>
                <p className="mt-3">
                  <Link href={href(locale, c.path)} className="text-sm font-bold text-mint hover:underline">
                    {C.read} →
                  </Link>
                </p>
              </li>
            );
          }
          const n = e.item;
          return (
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
          );
        })}
      </ol>
      <p className="mt-8 text-sm">
        <Link href={href(locale, "/news/comics")} className="link-mint font-bold">
          {C.page.allComics} →
        </Link>
      </p>
    </div>
  );
}
