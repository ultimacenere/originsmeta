import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import { pageMeta, pageTitleWith, resolveLocale } from "@/lib/page";
import { getPublishedGuide } from "@/lib/community/guideQueries";
import { communityGuideIndexing } from "@/lib/community/guides";
import { dropHreflang } from "@/lib/community/deckQuality";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { CommunityGuideView, guideDescription } from "@/components/guides/CommunityGuideView";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Pagina di una guida della community (pacchetto GUIDE, 27/09/2026): ISR come le schede dei mazzi della community,
 * generata alla prima richiesta e rigenerata al massimo ogni minuto (le Server Action la rinnovano subito).
 * Testo semplice dell'autore con i nomi delle carte collegati (CardMentions), una sola lingua per pagina: la traduzione
 * automatica nella lingua della pagina quando c'è, altrimenti l'originale con la nota (e la pagina è noindex). Sotto la
 * soglia di parole (`COMMUNITY_GUIDE_MIN_WORDS`) noindex in tutte le lingue, fuori da hreflang e sitemap.
 */
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const guide = await getPublishedGuide(slug);
  if (!guide) return {};
  const L = communityGuideLabels[locale];
  // hreflang solo verso le lingue in cui la guida si legge davvero, e solo sopra la soglia di parole: lo stesso criterio
  // della sitemap (`communityGuideIndexing` in guides.ts, come `deckIndexing` dei mazzi)
  const indexing = communityGuideIndexing(guide, locales, locale);
  const meta = pageMeta(locale, `/guides/community/${guide.slug}`, pageTitleWith(guide.title, L.page.metaSuffix), guideDescription(guide, locale), undefined, {
    type: "article",
    published: guide.published_at ?? guide.created_at,
    modified: guide.updated_at,
    languages: indexing.languages,
    noindex: indexing.noindex,
  });
  return indexing.hreflang ? meta : dropHreflang(meta);
}

export default async function CommunityGuidePage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale } = await resolveLocale(params);
  const guide = await getPublishedGuide(slug);
  if (!guide) notFound();
  return <CommunityGuideView guide={guide} locale={locale} />;
}
