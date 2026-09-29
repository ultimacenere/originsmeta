import type { Metadata } from "next";
import Link from "next/link";
import { href, locales } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { dropHreflang, fillLabel } from "@/lib/community/deckQuality";
import { listPublishedGuides } from "@/lib/community/guideQueries";
import { guideShapeTitle, guidesIndexableIn } from "@/lib/community/guides";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";
import { CommunityGuideCard } from "@/components/guides/CommunityGuideList";
import { GuideCtaBox } from "@/components/guides/GuideCtaBox";

/**
 * Tutte le guide della community (pacchetto GUIDE, 27/09/2026, dopo i rilievi: /guides ne mostra solo le ultime sei e
 * le più vecchie restavano raggiungibili solo dal profilo dell'autore). In ISR (`revalidate = 300`, ma in pratica ogni
 * 60 s: vince il tempo più basso, quello della lettura di `supabasePublic`); le Server Action delle guide e l'arrivo di
 * una traduzione la rinnovano subito. /guides invece è statica e la sua sezione della community la carica il browser
 * (revisione del 27/09/2026): l'elenco indicizzato delle guide della community è questo.
 * Elenca le guide indicizzabili nella lingua della pagina (sopra
 * la soglia di parole, scritte o tradotte in questa lingua), dalla più recente; una versione senza guide è noindex e
 * fuori da hreflang e sitemap (`sitemapCommunityGuides` in guides.ts, `list`). Per ora una pagina sola: le guide sono
 * poche; con qualche centinaio servirà la paginazione (la lettura ne prende fino a 200).
 */
export const revalidate = 300;

/** Le lingue in cui l'elenco ha almeno una guida. */
async function listedLocales() {
  const all = await listPublishedGuides();
  return locales.filter((l) => guidesIndexableIn(all, locales, l).length > 0);
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = communityGuideLabels[locale];
  const langs = await listedLocales();
  const meta = pageMeta(locale, "/guides/community", L.listPage.metaTitle, L.listPage.description, undefined, { languages: langs, noindex: !langs.includes(locale) });
  return langs.length ? meta : dropHreflang(meta);
}

export default async function CommunityGuidesPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const L = communityGuideLabels[locale];
  const guides = guidesIndexableIn(await listPublishedGuides(), locales, locale);
  const path = href(locale, "/guides/community");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.guides.title, path: href(locale, "/guides") },
            { name: L.listPage.title, path },
          ]),
          ...(guides.length
            ? [
                collectionPage({
                  locale,
                  path,
                  name: L.listPage.title,
                  description: L.listPage.description,
                  items: guides.map((g) => ({ name: guideShapeTitle(g, locale).text, path: href(locale, `/guides/community/${g.slug}`) })),
                  about: videoGameId,
                }),
              ]
            : []),
        ]}
      />
      <p className="kicker text-mint">
        <Link href={href(locale, "/guides")} className="hover:underline">
          {d.nav.guides}
        </Link>
      </p>
      <h1 className="t-page mt-2">{L.listPage.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{L.listPage.intro}</p>
      {guides.length ? (
        <>
          <p className="mt-6 font-mono text-xs text-pale-muted">{fillLabel(L.listPage.count, { n: String(guides.length) })}</p>
          <ul className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
            {guides.map((g) => (
              <li key={g.id} className="min-w-0">
                <CommunityGuideCard guide={g} locale={locale} categoryLabel={d.guides.categories[g.category]} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="card-night mt-8 p-6">
          <p className="text-pale-muted">{L.listPage.empty}</p>
        </div>
      )}
      {/* In fondo lo stesso invito di /guides: "Mandaci la tua guida", o "Scrivi una guida" per chi ha il ruolo */}
      <div className="mt-12">
        <GuideCtaBox
          submit={{ title: d.guides.submitTitle, text: d.guides.submitText, button: d.guides.submitCta, href: href(locale, "/guides/submit") }}
          write={{ ...L.cta, href: href(locale, "/guides/new") }}
        />
      </div>
    </div>
  );
}
