import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales, siteUrl, type Locale } from "@/lib/i18n";
import { cleanDescription, pageMeta, pageTitleWith, resolveLocale } from "@/lib/page";
import { getPublishedComic, listPublishedComics } from "@/lib/community/comicQueries";
import { COMIC_COVER_SIZE, comicDate, comicFeedCards, comicImageUrl, comicIndexing, comicPath, comicPathOk, localizedComic, type CommunityComic } from "@/lib/community/comics";
import { dropHreflang, fillLabel } from "@/lib/community/deckQuality";
import { normalizeBadge, shownBadge } from "@/lib/community/badges";
import { authorName } from "@/lib/community/util";
import { badgeStyle } from "@/lib/cardArt";
import { supabaseUrl } from "@/lib/supabase/env";
import { comicLabels, COMIC_LANG_NAMES } from "@/lib/comicLabels";
import { communityPerson } from "@/lib/jsonld/deck";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { organizationId, videoGameId } from "@/lib/jsonld/entities";
import { Avatar } from "@/components/AccountMenu";
import { FollowButton } from "@/components/follow/FollowButton";
import { DiscordButton } from "@/components/DiscordButton";
import { NewsCover } from "@/components/NewsCover";
import { ORIGINSMETA_DISCORD } from "@/lib/discord";
import { ComicStrip } from "@/components/comics/ComicStrip";
import { ComicActions } from "@/components/comics/ComicActions";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Pagina di un fumetto (pacchetto FUMETTI, 29/09/2026): una news disegnata, firmata da chi l'ha disegnata. ISR come le
 * guide della community, generata alla prima richiesta e rigenerata al massimo ogni minuto (le Server Action la
 * rinnovano subito). Titolo, firma, presentazione, le tavole una sotto l'altra e la trascrizione dei testi nella lingua
 * della pagina (tradotta dal sito quando c'è, altrimenti l'originale con la nota: allora la pagina è noindex in quella
 * lingua e fuori da hreflang e sitemap).
 */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

/** La presentazione nella lingua della pagina, pulita per la description. */
function comicDescription(comic: CommunityComic, locale: Locale): string {
  return cleanDescription(localizedComic(comic, locale).text.summary);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const comic = await getPublishedComic(slug);
  if (!comic) return {};
  const L = comicLabels[locale];
  const indexing = comicIndexing(comic, locales, locale);
  const cover = comicPathOk(comic.cover_path, comic.owner) ? comicImageUrl(comic.cover_path, supabaseUrl) : undefined;
  // titolo nella lingua della pagina quando la traduzione c'è (il titolo si traduce con il resto)
  const title = localizedComic(comic, locale).text.title;
  const meta = pageMeta(locale, comicPath(comic.slug), pageTitleWith(title, L.page.metaSuffix), comicDescription(comic, locale), cover, {
    ...(cover ? { imageSize: COMIC_COVER_SIZE, imageAlt: title } : {}),
    type: "article",
    published: comicDate(comic),
    modified: comic.updated_at,
    languages: indexing.languages,
    noindex: indexing.noindex,
  });
  return indexing.languages.length ? meta : dropHreflang(meta);
}

export default async function ComicPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const comic = await getPublishedComic(slug);
  if (!comic) notFound();
  const L = comicLabels[locale];
  const path = href(locale, comicPath(comic.slug));
  const view = localizedComic(comic, locale);
  const author = authorName(comic.profile);
  const role = shownBadge(comic.profile?.badge);
  const published = comicDate(comic);
  const cover = comicPathOk(comic.cover_path, comic.owner) ? comicImageUrl(comic.cover_path, supabaseUrl) : null;
  const pagesLabel = comic.pages.length === 1 ? L.page.pagesOne : fillLabel(L.page.pagesMany, { n: String(comic.pages.length) });
  const langName = COMIC_LANG_NAMES[locale][comic.lang];
  // Altri fumetti: gli ultimi usciti (la stessa lettura delle news, condivisa dalla cache dei dati)
  const others = comicFeedCards(await listPublishedComics(12), locale, supabaseUrl, authorName).filter((c) => c.slug !== comic.slug).slice(0, 3);

  const article = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: view.text.title.slice(0, 110),
    description: comicDescription(comic, locale),
    inLanguage: locale,
    datePublished: published,
    dateModified: comic.updated_at,
    ...(cover ? { image: [cover, ...comic.pages.slice(0, 3).map((p) => comicImageUrl(p.path, supabaseUrl))] } : {}),
    // la Person di chi l'ha disegnato: la stessa della sua pagina /u (un @id per tutte le lingue)
    author: communityPerson({ locale, username: comic.profile?.username, name: author }),
    publisher: { "@id": organizationId },
    mainEntityOfPage: `${siteUrl}${path}`,
    about: { "@id": videoGameId },
    genre: "Comic",
    isAccessibleForFree: true,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          article,
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.news.title, path: href(locale, "/news") },
            { name: L.hub.title, path: href(locale, "/news/comics") },
            { name: view.text.title, path },
          ]),
        ]}
      />
      <p className="text-sm">
        <Link href={href(locale, "/news")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.news.title}
        </Link>
      </p>

      <article className="mt-6 min-w-0">
        <p className="kicker text-mint">
          {L.pill} · {fillLabel(L.page.published, { date: formatDate(locale, published.slice(0, 10)) })}
          {comic.updated_at.slice(0, 10) !== published.slice(0, 10) ? ` · ${fillLabel(L.page.updated, { date: formatDate(locale, comic.updated_at.slice(0, 10)) })}` : ""} · {pagesLabel}
        </p>
        <h1 className="t-page mt-2 break-words leading-tight" lang={view.lang !== locale ? view.lang : undefined}>
          {view.text.title}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-pale-muted">
          <Avatar profile={comic.profile} name={author} size={32} />
          <span>
            {comic.profile?.username ? (
              <Link href={href(locale, `/u/${comic.profile.username}`)} className="font-bold text-pale hover:text-mint hover:underline">
                {fillLabel(L.by, { name: author })}
              </Link>
            ) : (
              <strong className="text-pale">{fillLabel(L.by, { name: author })}</strong>
            )}
          </span>
          {role ? <span className={`stat-pill px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badgeStyle[role]}`}>{d.community.badges[normalizeBadge(role)]}</span> : null}
          <FollowButton profileId={comic.owner} name={author} badge={comic.profile?.badge} locale={locale} placement="comic_page" compact />
        </p>

        {view.text.summary ? (
          <p className="mt-6 whitespace-pre-line break-words rounded-xl border-2 border-sky bg-night-2/80 p-5 text-lg text-pale" lang={view.lang !== locale ? view.lang : undefined}>
            {view.text.summary}
          </p>
        ) : null}
        {/* i balloon sono disegnati nella lingua dell'autore: la nota dice se i testi qui sono tradotti o originali */}
        {comic.lang !== locale ? (
          <p className="mt-3 text-sm text-pale-muted">{fillLabel(view.translated ? L.page.translatedNote : L.page.originalNote, { lang: langName })}</p>
        ) : null}

        <ComicActions comicId={comic.id} ownerId={comic.owner} locale={locale} editHref={href(locale, `${comicPath(comic.slug)}/edit`)} backHref={path} labels={L.owner} />

        <div className="mt-8">
          <ComicStrip pages={comic.pages} texts={view.text.pages} base={supabaseUrl} labels={L.page} />
        </div>

        {/* Trascrizione: il testo di ogni tavola, per i lettori di schermo, per chi preferisce leggerlo e per i motori */}
        <section className="mt-10" aria-labelledby="comic-transcript">
          <h2 id="comic-transcript" className="t-section">
            {L.page.transcript}
          </h2>
          <p className="mt-1 text-sm text-pale-muted">{L.page.transcriptIntro}</p>
          <ol className="mt-4 space-y-4" lang={view.lang !== locale ? view.lang : undefined}>
            {comic.pages.map((p, i) => (
              <li key={p.path} className="card-night p-4">
                <p className="kicker text-pale-muted">{fillLabel(L.page.pageAlt, { n: String(i + 1), total: String(comic.pages.length) })}</p>
                {view.text.pages[i] ? <p className="mt-2 whitespace-pre-line break-words text-pale">{view.text.pages[i]}</p> : <p className="mt-2 text-sm text-pale-muted">{L.page.noText}</p>}
              </li>
            ))}
          </ol>
        </section>
        <p className="mt-6 text-xs text-pale-muted">{d.common.notAffiliated}</p>
      </article>

      {/* Invito al NOSTRO Discord in fondo a ogni news (Pierluigi, 24/09/2026) */}
      <section aria-labelledby="comic-discord" className="card-night mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1 basis-64">
          <h2 id="comic-discord" className="t-item">
            {d.news.discordTitle}
          </h2>
          <p className="mt-1 text-sm text-pale">{d.news.discordText}</p>
        </div>
        <DiscordButton href={ORIGINSMETA_DISCORD} className="justify-center">
          {d.nav.discordJoin}
        </DiscordButton>
      </section>

      {others.length ? (
        <section className="mt-12" aria-labelledby="more-comics">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="more-comics" className="t-section">
              {L.page.moreTitle}
            </h2>
            <Link href={href(locale, "/news/comics")} className="text-sm font-bold text-mint hover:underline">
              {L.page.allComics} →
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {others.map((c) => (
              <li key={c.slug} className="min-w-0">
                <Link href={href(locale, c.path)} prefetch={false} className="card-night card-night-hover flex h-full flex-col overflow-hidden p-4">
                  {c.image ? <NewsCover src={c.image} /> : null}
                  <p className="kicker mt-3 text-pale-muted">{formatDate(locale, c.date.slice(0, 10))}</p>
                  <h3 className="t-item mt-1 break-words leading-tight" lang={c.titleLang}>
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-pale-muted">{fillLabel(L.by, { name: c.author.name })}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
