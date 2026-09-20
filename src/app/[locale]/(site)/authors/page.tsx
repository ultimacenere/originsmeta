import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { authors } from "@/lib/data/authors";
import { JsonLd, breadcrumbs, collectionPage } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/authors", dict.authors.metaTitle, dict.authors.intro);
}

export default async function AuthorsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  // Stesso helper delle altre pagine lista: l'`@id` è `…/authors#collection`, come su carte, mazzi e guide.
  const collection = collectionPage({
    locale,
    path: href(locale, "/authors"),
    name: d.authors.title,
    description: d.authors.intro,
    items: authors.map((a) => ({ name: a.name, path: href(locale, `/authors/${a.slug}`) })),
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          collection,
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.authors.title, path: href(locale, "/authors") },
          ]),
        ]}
      />
      <p className="kicker text-mint">{d.about.authorsTitle}</p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{d.authors.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.authors.intro}</p>
      <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {authors.map((a) => (
          <li key={a.slug}>
            <Link href={href(locale, `/authors/${a.slug}`)} className="card-night card-night-hover flex h-full flex-col p-6">
              <p className="kicker text-pale-muted">{a.role[locale]}</p>
              <h2 className="mt-1 text-xl font-extrabold leading-tight text-sky">{a.name}</h2>
              <p className="mt-2 flex-1 text-sm text-pale-muted">{a.tagline[locale]}</p>
              <span className="mt-4 font-display text-sm font-bold text-mint">{d.authors.profileCta} →</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-pale-muted">{d.common.notAffiliated}</p>
    </div>
  );
}
