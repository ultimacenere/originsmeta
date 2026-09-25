import type { Metadata } from "next";
import Link from "next/link";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getCard, patchLabel } from "@/lib/data/cards";
import { countByTag, locationTagLabels, locationTags, locationsByName, locationsPatch, locationsVerified } from "@/lib/data/locations";
import { LocationExplorer, type ExplorerLocation } from "@/components/LocationExplorer";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";

/*
  I Luoghi (23/09/2026). Pagina statica come il database carte: i dati stanno in src/lib/data/locations.ts e non
  vengono da Supabase. L'elenco è esplorabile nel browser (ricerca e filtri, `LocationExplorer`), ma parte già
  scritto nell'HTML, quindi i motori di ricerca lo leggono tutto.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return pageMeta(locale, "/locations", dict.locations.title, dict.locations.description);
}

export default async function LocationsPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const t = d.locations;
  const counts = countByTag();

  const list: ExplorerLocation[] = locationsByName.map((l) => ({
    slug: l.slug,
    name: l.name,
    effect: l.effect[locale],
    effectEn: locale !== "en" && l.effect.en !== l.effect[locale] ? l.effect.en : undefined,
    tags: l.tags,
    cards: (l.cards ?? []).flatMap((slug) => {
      const card = getCard(slug);
      return card ? [{ slug, name: card.name, href: href(locale, `/cards/${slug}`) }] : [];
    }),
  }));

  const tags = locationTags.filter((id) => counts[id] > 0).map((id) => ({ id, label: locationTagLabels[id][locale], count: counts[id] }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: t.title, path: href(locale, "/locations") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/locations"),
            name: t.title,
            description: t.description,
            // le voci dell'elenco sono i luoghi stessi, ognuno con la sua ancora
            items: locationsByName.map((l) => ({ name: l.name, path: `${href(locale, "/locations")}#${l.slug}` })),
            about: videoGameId,
          }),
        ]}
      />
      <p className="kicker text-mint">{d.nav.cards}</p>
      {/* H1 con il nome del gioco e il numero dei luoghi, dai dati (piano SEO del 25/09/2026: prima era solo "Locations") */}
      <h1 className="t-page mt-2">{t.headline.replace("{n}", String(locationsByName.length))}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{t.intro.replace("{n}", String(locationsByName.length))}</p>

      {/* Come funzionano, in tre righe: chi arriva da una ricerca deve capirlo senza aprire la guida */}
      <div className="card-night mt-6 grid max-w-4xl grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        {t.facts.map((f) => (
          <p key={f} className="text-sm text-pale">
            {f}
          </p>
        ))}
      </div>

      <div className="mt-8">
        <LocationExplorer
          locations={list}
          tags={tags}
          labels={{
            search: t.search,
            searchPlaceholder: t.searchPlaceholder,
            all: d.common.all,
            results: t.results,
            noResults: t.noResults,
            related: t.related,
            clear: t.clear,
          }}
        />
      </div>

      <div className="felt-panel mt-10 max-w-4xl p-5 text-sm text-chalk-muted">
        <p>
          {t.source.replace("{patch}", patchLabel(locationsPatch, locale))}{" "}
          {locationsVerified ? t.verified.replace("{n}", String(locationsVerified.count)) : t.notVerified}
        </p>
        <p className="mt-3">
          <Link href={href(locale, "/guides/origins-tcg-locations")} className="link-mint font-bold">
            {t.guideCta} →
          </Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-chalk-muted">
        {d.common.notAffiliated} <span className="sr-only">{siteUrl}</span>
      </p>
    </div>
  );
}
