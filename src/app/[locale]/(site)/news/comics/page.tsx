import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { listPublishedComics } from "@/lib/community/comicQueries";
import { comicFeedCards, comicListLocales } from "@/lib/community/comics";
import { fillLabel } from "@/lib/community/deckQuality";
import { authorName } from "@/lib/community/util";
import { supabaseUrl } from "@/lib/supabase/env";
import { locales } from "@/lib/i18n";
import { comicLabels } from "@/lib/comicLabels";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";
import { NewsCover } from "@/components/NewsCover";
import { ComicCtaBox } from "@/components/comics/ComicCtaBox";

/**
 * Tutti i fumetti dei creator (pacchetto FUMETTI, 29/09/2026), dal più recente: l'archivio della serie, in ISR come /news.
 * Ogni fumetto esce anche fra le news; qui si ritrovano tutti insieme. Senza fumetti la pagina è noindex (un elenco vuoto
 * non serve a nessuno) e fuori dalla sitemap.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = comicLabels[locale];
  const comics = await listPublishedComics(200);
  // indicizzabile nella lingua solo se almeno un fumetto si legge in questa lingua (originale o tradotto)
  const indexable = comics.some((c) => comicListLocales(c, locales).includes(locale));
  return pageMeta(locale, "/news/comics", L.hub.metaTitle, L.hub.description, undefined, { noindex: !indexable });
}

export default async function ComicsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = comicLabels[locale];
  const cards = comicFeedCards(await listPublishedComics(200), locale, supabaseUrl, authorName);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.news.title, path: href(locale, "/news") },
            { name: L.hub.title, path: href(locale, "/news/comics") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/news/comics"),
            name: L.hub.title,
            description: L.hub.description,
            items: cards.map((c) => ({ name: c.title, path: href(locale, c.path) })),
            about: videoGameId,
          }),
        ]}
      />
      <p className="kicker text-mint">
        <Link href={href(locale, "/news")} className="hover:underline">
          {d.nav.news}
        </Link>
      </p>
      <h1 className="t-page mt-2">{L.hub.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{L.hub.intro}</p>
      <ComicCtaBox labels={L.cta} href={href(locale, "/news/comics/new")} />
      {cards.length === 0 ? (
        <p className="card-night mt-8 p-6 text-pale-muted">{L.hub.empty}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <li key={c.slug} className="min-w-0">
              <Link href={href(locale, c.path)} prefetch={false} className="card-night card-night-hover flex h-full min-w-0 flex-col p-5">
                {c.image ? <NewsCover src={c.image} /> : null}
                <p className="kicker mt-4 text-pale-muted">
                  {L.pill} · {formatDate(locale, c.date.slice(0, 10))}
                </p>
                <h2 className="t-item mt-1 break-words leading-tight" lang={c.titleLang}>
                  {c.title}
                </h2>
                <p className="mt-2 line-clamp-4 break-words text-sm text-pale-muted" lang={c.summaryLang}>
                  {c.summary}
                </p>
                <p className="mt-3 text-xs text-pale">{fillLabel(L.by, { name: c.author.name })}</p>
                <span className="mt-4 font-display text-sm font-bold text-mint">{L.read} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
