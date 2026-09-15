import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { getGuide, guideSlugs } from "@/lib/content/guides";
import { getDeck, archetypeLabels } from "@/lib/data/decks";
import { Markdown } from "@/components/Markdown";
import { CardChipList } from "@/components/CardChip";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { siteUrl } from "@/lib/i18n";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => guideSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  const g = getGuide(locale, slug);
  if (!g) return {};
  // Titolo breve se la guida contiene già "Origins TCG", altrimenti con il nome della sezione.
  const title = /origins/i.test(g.title) ? g.title : `${g.title} · ${dict.guides.title}`;
  return pageMeta(locale, `/guides/${g.slug}`, title, g.excerpt, g.image, { type: "article", published: g.updated, modified: g.updated });
}

export default async function GuidePage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const g = getGuide(locale, slug);
  if (!g) notFound();
  const relatedDecks = (g.tags?.decks ?? []).map((s) => getDeck(s)).filter((x) => x !== undefined);
  const relatedCards = g.tags?.cards ?? [];
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.excerpt,
    inLanguage: locale,
    datePublished: g.updated,
    dateModified: g.updated,
    image: g.image ? `${siteUrl}${g.image}` : `${siteUrl}/media/og.jpg`,
    author: { "@type": "Organization", name: "OriginsMeta", url: siteUrl },
    publisher: { "@id": `${siteUrl}/#organization` },
    mainEntityOfPage: `${siteUrl}${href(locale, `/guides/${g.slug}`)}`,
    about: { "@type": "VideoGame", name: "Origins TCG", url: "https://origins-tcg.com/" },
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
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-chalk sm:text-5xl">{g.title}</h1>
        <p className="mt-4 text-lg text-chalk-muted">{g.excerpt}</p>
      </header>
      {g.image ? (
        <div className="hero-art mt-8">
          <Image src={g.image} alt="" width={1600} height={900} sizes="(max-width: 768px) 92vw, 720px" className="w-full" priority />
        </div>
      ) : null}
      <article className="card-ivory mt-8 p-6 sm:p-10">
        <Markdown source={g.body} />
        {g.faq?.length ? (
          <section className="mt-8 border-t border-sky pt-6" aria-labelledby="guide-faq">
            <h2 id="guide-faq" className="text-2xl font-extrabold text-ink">
              {d.guides.faqTitle}
            </h2>
            <dl className="mt-4 space-y-4">
              {g.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-display text-base font-bold text-ink">{f.q}</dt>
                  <dd className="mt-1 text-ink-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        <p className="mt-8 border-t border-sky pt-4 text-xs text-ink-muted">{d.common.notAffiliated}</p>
      </article>

      {relatedDecks.length || relatedCards.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-chalk">{d.guides.related}</h2>
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
