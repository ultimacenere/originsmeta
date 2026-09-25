import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { authors, decksByAuthor, getAuthor, guidesByAuthor, newsByAuthor, nicknameOf } from "@/lib/data/authors";
import { newsPath } from "@/lib/data/news";
import { fill } from "@/lib/tournament/types";
import { isExternalHref, newTabProps } from "@/components/SteamButton";
import { JsonLd, authorProfilePage, breadcrumbs, person } from "@/components/JsonLd";
import { entityLabels } from "@/lib/entityLabels";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => authors.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const a = getAuthor(slug);
  if (!a) return {};
  // Il titolo finale lo compone `pageMeta` (unico punto di verità: aggiunge il marchio solo se manca).
  // La tagline fa da meta description: sta fra 120 e 158 caratteri, quindi non viene tagliata.
  return pageMeta(locale, `/authors/${a.slug}`, a.metaTitle[locale], a.tagline[locale]);
}

export default async function AuthorPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const a = getAuthor(slug);
  if (!a) notFound();
  const guides = guidesByAuthor(locale, a.slug);
  const signedNews = newsByAuthor(a.slug);
  const decks = decksByAuthor(a.slug);
  const path = href(locale, `/authors/${a.slug}`);
  const email = a.links.find((l) => l.url.startsWith("mailto:"))?.url.slice("mailto:".length);
  const sameAs = a.links.filter((l) => /^https?:/.test(l.url)).map((l) => l.url);
  // Nodo Person dall'helper condiviso (`person()` in src/lib/jsonld/entities.ts): l'`@id` è quello unico della persona
  // (`personId`), uguale in ogni lingua e nella firma di news e guide, così nel grafo la persona resta una sola.
  // `alternateName` è il nickname fra le virgolette del nome ("Aldry", "Davdas"), non il nome breve delle firme.
  const personLd = person({
    slug: a.slug,
    name: a.name,
    alternateName: nicknameOf(a) ?? a.displayName,
    role: a.role[locale],
    url: path,
    description: a.tagline[locale],
    knowsAbout: a.knowsAbout,
    email,
    sameAs,
  });
  // Il profilo pubblico della community dello stesso autore, quando ha un account noto (TOOL-09: i due profili si linkano)
  const communityPath = a.username ? href(locale, `/u/${a.username}`) : null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          authorProfilePage({ locale, path, name: a.name, slug: a.slug }),
          personLd,
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.authors.title, path: href(locale, "/authors") },
            { name: a.name, path },
          ]),
        ]}
      />
      <p className="text-sm">
        <Link href={href(locale, "/authors")} className="text-chalk-muted hover:text-chalk">
          ← {d.authors.backTo}
        </Link>
      </p>
      <header className="mt-6">
        <p className="kicker text-mint">{d.authors.title}</p>
        <h1 className="t-page mt-3 leading-tight">{a.name}</h1>
        <p className="mt-4 text-lg text-chalk-muted">
          <span className="font-display font-bold text-sky">{d.authors.role}:</span> {a.role[locale]}
        </p>
      </header>
      <article className="card-night mt-8 space-y-4 p-6 text-lg leading-relaxed text-pale sm:p-10">
        <p>{a.bio[locale]}</p>
        {a.links.length || communityPath ? (
          <ul className="flex flex-wrap gap-2 text-base">
            {a.links.map((l) => (
              <li key={l.url}>
                {/* I profili esterni si aprono in una nuova scheda (regola unica `newTabProps`); l'indirizzo email no, apre il programma di posta. */}
                <a className="btn btn-ink text-xs" href={l.url} {...(isExternalHref(l.url) ? newTabProps : {})}>
                  {l.label}
                </a>
              </li>
            ))}
            {communityPath ? (
              <li>
                <Link className="btn btn-ink text-xs" href={communityPath}>
                  {entityLabels[locale].author.communityProfile} <span className="font-mono font-normal text-pale-muted">@{a.username}</span>
                </Link>
              </li>
            ) : null}
          </ul>
        ) : null}
        <p className="border-t border-sky pt-4 text-xs text-pale-muted">{d.common.notAffiliated}</p>
      </article>

      {guides.length ? (
        <section className="mt-10">
          <h2 className="t-section">{fill(d.authors.guidesBy, { name: a.displayName })}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover block p-5">
                  <p className="kicker text-pale-muted">
                    {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime} · {formatDate(locale, g.updated)}
                  </p>
                  <h3 className="t-item mt-1 leading-tight">{g.title}</h3>
                  <p className="mt-2 text-sm text-pale-muted">{g.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {signedNews.length ? (
        <section className="mt-10">
          <h2 className="t-section">{fill(d.authors.newsBy, { name: a.displayName })}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3">
            {signedNews.map((item) => (
              <li key={item.slug}>
                <Link href={href(locale, newsPath(item))} className="card-night card-night-hover block p-4">
                  <p className="font-mono text-xs text-pale-muted">
                    <time dateTime={item.date}>{formatDate(locale, item.date)}</time>
                  </p>
                  <h3 className="t-item mt-1 text-base leading-snug">{item.title[locale]}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {decks.length ? (
        <section className="mt-10">
          <h2 className="t-section">{d.common.decks}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {decks.map((deck) => (
              <li key={deck.slug}>
                <Link href={href(locale, `/decks/community/${deck.slug}`)} className="btn btn-ink text-xs">
                  {deck.name} <span className="font-mono font-normal text-pale-muted">{d.community.kicker}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
