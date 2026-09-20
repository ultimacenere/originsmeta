import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { defaultOgImage, pageMeta, resolveLocale } from "@/lib/page";
import { imageSizeOf } from "@/lib/imageSize";
import { getGuide, guideSlugs, type Guide } from "@/lib/content/guides";
import { authorOfGuide } from "@/lib/data/authors";
import { getDeck, archetypeLabels } from "@/lib/data/decks";
import { Markdown } from "@/components/Markdown";
import { CardChipList } from "@/components/CardChip";
import { JsonLd, breadcrumbs, organizationId, videoGameId } from "@/components/JsonLd";
import { siteUrl } from "@/lib/i18n";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => guideSlugs.map((slug) => ({ locale, slug })));
}

/**
 * Data di prima pubblicazione: `updated` cambia a ogni revisione, quindi da solo riscriverebbe anche
 * datePublished. Il campo `published` non esiste ancora nel tipo Guide: appena verrà aggiunto questa
 * lettura lo userà, senza altre modifiche.
 */
function guidePublished(g: Guide): string {
  return (g as Guide & { published?: string }).published ?? g.updated;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const g = getGuide(locale, slug);
  if (!g) return {};
  // Titolo per i motori di ricerca: `metaTitle` quando c'è, altrimenti il titolo della guida. Il
  // marchio non si scrive qui: lo aggiunge `pageMeta`, che è l'unico posto dove il titolo si compone.
  const title = g.metaTitle ?? g.title;
  return pageMeta(locale, `/guides/${g.slug}`, title, g.excerpt, g.image, {
    type: "article",
    published: guidePublished(g),
    modified: g.updated,
    imageAlt: g.title,
    // Le copertine non hanno tutte la stessa misura (1600×900, 1600×1042, 1200×675): si legge dal file.
    imageSize: imageSizeOf(g.image),
  });
}

export default async function GuidePage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const g = getGuide(locale, slug);
  if (!g) notFound();
  const relatedDecks = (g.tags?.decks ?? []).map((s) => getDeck(s)).filter((x) => x !== undefined);
  const relatedCommunity = g.tags?.communityDecks ?? [];
  const relatedCards = g.tags?.cards ?? [];
  // Chi firma la guida lo decide `authorOfGuide` (src/lib/data/authors.ts) e nessun altro: la firma
  // in fondo alla pagina, il nodo Article qui sotto e le pagine autore devono dire la stessa cosa.
  const author = authorOfGuide(g);
  const authorPath = href(locale, `/authors/${author.slug}`);
  const authorUrl = `${siteUrl}${authorPath}`;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.excerpt,
    inLanguage: locale,
    datePublished: guidePublished(g),
    dateModified: g.updated,
    image: g.image ? `${siteUrl}${g.image}` : `${siteUrl}${defaultOgImage}`,
    // Un articolo lo firma una persona, non l'organizzazione: è il segnale E-E-A-T che Google cerca.
    // L'`@id` è lo stesso nodo Person che scrive la pagina autore (`person()` in JsonLd.tsx): così i
    // dati strutturati parlano di una persona sola, non di due omonime.
    author: { "@type": "Person", "@id": `${authorUrl}#person`, name: author.name, url: authorUrl },
    publisher: { "@id": organizationId },
    mainEntityOfPage: `${siteUrl}${href(locale, `/guides/${g.slug}`)}`,
    about: { "@id": videoGameId },
  };
  const faqLd = g.faq?.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {faqLd ? <JsonLd data={faqLd} /> : null}
      <JsonLd data={[article, breadcrumbs([{ name: "OriginsMeta", path: href(locale) }, { name: d.guides.title, path: href(locale, "/guides") }, { name: g.title, path: href(locale, `/guides/${g.slug}`) }])]} />
      <p className="text-sm">
        <Link href={href(locale, "/guides")} className="text-chalk-muted hover:text-chalk">
          ← {d.common.backTo} {d.guides.title}
        </Link>
      </p>
      <header className="mt-6">
        <p className="kicker text-mint">
          {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime} · {d.common.updated} {formatDate(locale, g.updated)}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-sky sm:text-5xl">{g.title}</h1>
        <p className="mt-4 text-lg text-chalk-muted">{g.excerpt}</p>
      </header>
      {g.image ? (
        <div className="hero-art mt-8">
          <Image src={g.image} alt="" width={1600} height={900} sizes="(max-width: 768px) 92vw, 720px" className="w-full" priority />
        </div>
      ) : null}
      <article className="card-night mt-8 p-6 sm:p-10">
        <Markdown source={g.body} linkCards={locale} />
        {g.faq?.length ? (
          <section className="mt-8 border-t border-sky pt-6" aria-labelledby="guide-faq">
            <h2 id="guide-faq" className="text-2xl font-extrabold text-sky">
              {d.guides.faqTitle}
            </h2>
            <dl className="mt-4 space-y-4">
              {g.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-display text-base font-bold text-sky">{f.q}</dt>
                  <dd className="mt-1 text-pale-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        <p className="mt-8 border-t border-sky pt-4 text-sm text-pale-muted">
          {d.authors.writtenBy}{" "}
          <Link href={authorPath} className="font-bold text-mint hover:underline">
            {author.name}
          </Link>
        </p>
        <p className="mt-2 text-xs text-pale-muted">{d.common.notAffiliated}</p>
      </article>

      {relatedDecks.length || relatedCommunity.length || relatedCards.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{d.guides.related}</h2>
          {relatedDecks.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {relatedDecks.map((deck) => (
                <li key={deck.slug}>
                  <Link href={href(locale, `/decks/${deck.slug}`)} className="btn btn-mint text-xs">
                    {deck.name} <span className="font-mono font-normal opacity-70">{archetypeLabels[deck.archetype][locale]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {relatedCommunity.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {relatedCommunity.map((deck) => (
                <li key={deck.slug}>
                  <Link href={href(locale, `/decks/community/${deck.slug}`)} className="btn btn-mint text-xs">
                    {deck.name} <span className="font-mono font-normal opacity-70">{d.community.kicker}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {relatedCards.length ? (
            <div className="mt-4">
              <CardChipList slugs={relatedCards} locale={locale} />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
