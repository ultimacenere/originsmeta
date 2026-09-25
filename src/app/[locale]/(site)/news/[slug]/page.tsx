import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales, siteUrl } from "@/lib/i18n";
import { pageMeta, pageTitleWith, resolveLocale } from "@/lib/page";
import { imageSizeOf } from "@/lib/imageSize";
import { getNews, modifiedIn, news, newsPath, newsReadTime, sortedNews } from "@/lib/data/news";
import { authorOfNews } from "@/lib/data/authors";
import { patchOrder, patches } from "@/lib/data/cards";
import { relatedNews } from "@/lib/relatedNews";
import { linkLabels } from "@/lib/linkLabels";
import { NewsPatchChanges, patchItems, patchOfNews } from "@/components/NewsPatchChanges";
import { Markdown } from "@/components/Markdown";
import { CardChipList } from "@/components/CardChip";
import { CardMentionEdges } from "@/components/CardMentionEdges";
import { NewsCover } from "@/components/NewsCover";
import { SteamButton } from "@/components/SteamButton";
import { DiscordButton } from "@/components/DiscordButton";
import { ORIGINSMETA_DISCORD } from "@/lib/discord";
import { NewsDeckButton, NewsGuideLinks, NewsSourceLink, isDeckNews, isSiteNews, newsCardsLabel, newsSourceClass, newsSourceLabel } from "@/components/NewsLinks";
import { JsonLd, breadcrumbs, organizationId, videoGameId } from "@/components/JsonLd";

type Params = Promise<{ locale: string; slug: string }>;

/** Oltre i 110 caratteri Google ignora `headline`: se il titolo è più lungo, nei dati strutturati va il titolo per la SERP. */
const HEADLINE_MAX = 110;

/** Le news che raccontano una patch (campo `news` delle patch in cards.ts): per le news correlate sono dello stesso tipo. */
const patchNews = new Set(patchOrder.map((id) => patches[id].news).filter((s): s is string => Boolean(s)));

export function generateStaticParams() {
  return locales.flatMap((locale) => news.map((item) => ({ locale, slug: item.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const item = getNews(slug);
  if (!item) return {};
  // Titolo per la SERP: `metaTitle` quando c'è; altrimenti il titolo dell'articolo, che `pageTitleWith`
  // accorcia all'ultima parola intera se non sta nei 60 caratteri. Il marchio lo aggiunge `pageMeta`.
  const title = item.metaTitle?.[locale] ?? pageTitleWith(item.title[locale], d.nav.news);
  return pageMeta(locale, newsPath(item), title, item.description?.[locale] ?? item.summary[locale], item.image, {
    type: "article",
    published: item.date,
    modified: modifiedIn(locale, item.updated ?? item.date),
    imageAlt: item.title[locale],
    // Le copertine hanno misure diverse (1600×900, 1200×675…): si leggono dal file; le miniature remote no.
    imageSize: imageSizeOf(item.image),
  });
}

/**
 * Pagina di un articolo: ogni news ha la sua (regola del 21/09/2026), firmata come le guide.
 * Struttura di lettura: titolo, riassunto d'attacco, firma con le date, copertina, testo a sezioni,
 * cosa cambia nella patch (solo sulle patch notes), fonte, carte e guide collegate, domande frequenti, news correlate.
 */
export default async function NewsArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const item = getNews(slug);
  if (!item) notFound();

  const title = item.title[locale];
  const path = href(locale, newsPath(item));
  // Pubblicazione: la data dell'articolo in ogni lingua. Modifica: in spagnolo mai prima del 25/09/2026, quando la
  // versione è nata (`modifiedIn`, la stessa regola delle guide). Firma, dati strutturati e Open Graph la condividono.
  const updated = modifiedIn(locale, item.updated ?? item.date);
  const body = item.body?.[locale];
  const faq = item.faq?.[locale] ?? [];
  const highlights = item.highlights?.[locale] ?? [];
  const ll = linkLabels[locale];
  // News correlate (Ondata 1, 25/09/2026, NEWS-07): prima erano sempre le ultime tre uscite, uguali per ogni articolo;
  // ora guide e carte in comune, stesso tipo e vicinanza di data (`relatedNews`), completate con le più recenti.
  const more = relatedNews(item, sortedNews, { patchNews });
  // Patch notes di una patch: il blocco "Cosa cambia in questa patch" con le carte toccate e il link a MetaShifting.
  // Le carte della news restano come pastiglie solo se il blocco non le elenca già tutte.
  const patch = patchOfNews(item.slug);
  const patchSlugs = new Set(patch ? patchItems(patch).map((m) => m.card.slug) : []);
  const withPatch = patch !== undefined && patchSlugs.size > 0;
  const cardChips = withPatch && item.cards?.every((s) => patchSlugs.has(s)) ? [] : (item.cards ?? []);
  // Chi firma lo decide `authorOfNews` e nessun altro: firma in pagina, nodo NewsArticle e pagina autore dicono la stessa cosa.
  const author = authorOfNews(item);
  const authorPath = href(locale, `/authors/${author.slug}`);
  const authorUrl = `${siteUrl}${authorPath}`;
  // La fonte da cui nasce l'articolo: il post ufficiale, oppure la scheda del mazzo pubblicato qui. Le novità del
  // sito (`site`) non hanno una fonte fuori dall'articolo: niente "Fonte" e niente `isBasedOn`.
  const deckNews = isDeckNews(item);
  const siteNews = isSiteNews(item);
  const ownSource = deckNews || siteNews;
  const sourceUrl = siteNews ? undefined : deckNews ? `${siteUrl}${href(locale, item.url)}` : item.url;

  const article = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title.length <= HEADLINE_MAX ? title : (item.metaTitle?.[locale] ?? title.slice(0, HEADLINE_MAX)),
    description: item.description?.[locale] ?? item.summary[locale],
    inLanguage: locale,
    datePublished: item.date,
    dateModified: updated,
    image: item.image.startsWith("http") ? item.image : `${siteUrl}${item.image}`,
    // Lo stesso nodo Person della pagina autore (`person()` in JsonLd.tsx): nel grafo la persona resta una sola.
    author: { "@type": "Person", "@id": `${authorUrl}#person`, name: author.name, url: authorUrl },
    publisher: { "@id": organizationId },
    mainEntityOfPage: `${siteUrl}${path}`,
    about: { "@id": videoGameId },
    articleSection: d.nav.news,
    isBasedOn: sourceUrl,
  };
  const faqLd = faq.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {faqLd ? <JsonLd data={faqLd} /> : null}
      <JsonLd
        data={[
          article,
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.nav.news, path: href(locale, "/news") },
            { name: title, path },
          ]),
        ]}
      />
      {/* Una volta per pagina: tiene dentro la finestra le anteprime delle carte (nomi di carta nel testo e nelle
          tabelle delle patch notes, carte toccate dalla news in fondo). */}
      <CardMentionEdges />
      <p className="text-sm">
        <Link href={href(locale, "/news")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.nav.news}
        </Link>
      </p>

      <header className="mt-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="kicker text-mint">{d.nav.news}</span>
          <span className={newsSourceClass(item)}>{newsSourceLabel(item, d)}</span>
          <span className="font-mono text-xs text-pale-muted">
            {newsReadTime(item, locale)} {d.guides.readTime}
          </span>
        </p>
        <h1 className="t-page mt-3 leading-tight">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-chalk">{item.summary[locale]}</p>
        {/* Firma editoriale sotto il titolo, con le date: chi scrive e quando, prima ancora di leggere */}
        <p className="mt-5 text-sm text-pale-muted">
          {d.authors.writtenBy}{" "}
          <Link href={authorPath} rel="author" className="font-bold text-mint hover:underline">
            {author.name}
          </Link>
          {" · "}
          {d.news.published} <time dateTime={item.date}>{formatDate(locale, item.date)}</time>
          {updated !== item.date ? (
            <>
              {" · "}
              {d.common.updated} <time dateTime={updated}>{formatDate(locale, updated)}</time>
            </>
          ) : null}
        </p>
      </header>

      {highlights.length ? (
        // Le novità in sintesi, prima di tutto il resto: ogni punto salta alla sezione che ne parla.
        <nav className="card-night mt-8 p-6 sm:p-8" aria-labelledby="news-highlights">
          <h2 id="news-highlights" className="kicker text-mint">
            {d.news.inBrief}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-pale marker:text-mint">
            {highlights.map((h) => (
              <li key={h.anchor}>
                <a href={`#${h.anchor}`} className="font-bold text-sky underline-offset-2 hover:underline">
                  {h.label}
                </a>
                {h.text ? `: ${h.text}` : null}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="hero-art mt-8">
        <NewsCover src={item.image} priority className="rounded-none border-0" />
      </div>
      {/* News su un mazzo pubblicato qui: "Apri il mazzo" subito sotto la copertina, come in /news e in home
          (riunione del 21/09/2026). Sulle altre news non rende nulla. */}
      <NewsDeckButton item={item} locale={locale} dict={d} className="mt-6" />

      <article className="card-night mt-8 p-6 sm:p-10">
        {/* I nomi delle carte nel testo diventano link alla scheda con l'anteprima della carta al passaggio del mouse */}
        {body ? <Markdown source={body} linkCards={locale} /> : null}

        {/* Sulle patch notes del playtest, senza testo, il blocco porta anche la nota di ogni modifica */}
        {withPatch ? <NewsPatchChanges patch={patch} locale={locale} dict={d} notes={!body} className={body ? "mt-8 border-t border-sky pt-6" : ""} /> : null}

        {ownSource && !cardChips.length && !item.guides?.length ? null : (
          <section className={body || withPatch ? "mt-8 border-t border-sky pt-6" : ""} aria-labelledby={ownSource ? undefined : "news-source"}>
            {/* per le news sui mazzi la "fonte" è la scheda del mazzo, già aperta dal tasto sotto la copertina;
                per le novità del sito è l'articolo stesso */}
            {ownSource ? null : (
              <>
                <h2 id="news-source" className="kicker text-pale-muted">
                  {d.news.sourceTitle}
                </h2>
                <div className="mt-3">
                  {item.source === "steam" ? (
                    <SteamButton href={item.url} variant="dark" size="sm">
                      {d.common.steamNews}
                    </SteamButton>
                  ) : (
                    <NewsSourceLink item={item} locale={locale} dict={d} className="text-sm font-bold text-mint underline" />
                  )}
                </div>
              </>
            )}
            {cardChips.length ? (
              <div className={ownSource ? "" : "mt-6"}>
                <p className="kicker mb-2 text-pale-muted">{newsCardsLabel(item, d)}</p>
                <CardChipList slugs={cardChips} locale={locale} />
              </div>
            ) : null}
            <NewsGuideLinks item={item} locale={locale} dict={d} />
          </section>
        )}

        {faq.length ? (
          <section className="mt-8 border-t border-sky pt-6" aria-labelledby="news-faq">
            <h2 id="news-faq" className="t-section">
              {d.guides.faqTitle}
            </h2>
            <dl className="mt-4 space-y-4">
              {faq.map((f) => (
                <div key={f.q}>
                  <dt className="t-item text-base">{f.q}</dt>
                  <dd className="mt-1 text-pale-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <p className="mt-8 border-t border-sky pt-4 text-sm text-pale-muted">
          {d.authors.writtenBy}{" "}
          <Link href={authorPath} rel="author" className="font-bold text-mint hover:underline">
            {author.name}
          </Link>
        </p>
        <p className="mt-2 text-xs text-pale-muted">{d.common.notAffiliated}</p>
      </article>

      {/* Invito al NOSTRO Discord in fondo a ogni news (Pierluigi, 24/09/2026), prima delle altre news */}
      <section aria-labelledby="news-discord" className="card-night mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1 basis-64">
          <h2 id="news-discord" className="t-item">
            {d.news.discordTitle}
          </h2>
          <p className="mt-1 text-sm text-pale">{d.news.discordText}</p>
        </div>
        <DiscordButton href={ORIGINSMETA_DISCORD} className="justify-center">
          {d.nav.discordJoin}
        </DiscordButton>
      </section>

      <section className="mt-12" aria-labelledby="more-news">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="more-news" className="t-section">
            {ll.relatedNews}
          </h2>
          <Link href={href(locale, "/news")} className="text-sm text-mint hover:underline">
            {d.common.viewAll} →
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {more.map((other) => (
            <li key={other.slug}>
              <Link href={href(locale, newsPath(other))} className="card-night card-night-hover block h-full p-4">
                <NewsCover src={other.image} className="mb-3" />
                <p className="font-mono text-xs text-pale-muted">
                  <time dateTime={other.date}>{formatDate(locale, other.date)}</time>
                </p>
                <h3 className="t-item mt-1 text-base leading-snug">{other.title[locale]}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
