import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate, href, locales, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getGuides } from "@/lib/content/guides";
import { authorOfGuide } from "@/lib/data/authors";
import { listPublishedGuides } from "@/lib/community/guideQueries";
import { communityGuideCover, guideShapeSummary, guideShapeTitle, guidesIndexableIn, readMinutes } from "@/lib/community/guides";
import { fillLabel } from "@/lib/community/deckQuality";
import { shownBadge } from "@/lib/community/badges";
import { authorName } from "@/lib/community/util";
import { badgeStyle } from "@/lib/cardArt";
import { supabaseUrl } from "@/lib/supabase/env";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { GuideCtaBox } from "@/components/guides/GuideCtaBox";

/**
 * Le guide di Origins TCG in un solo elenco (29/09/2026, Pierluigi: "le guide non devono avere distinzioni tra guide
 * ufficiali e guide della community, quindi rimuovi la divisione nella pagina"; a pubblicarle da sole sono solo Autore,
 * Creator, Pro e Staff). Guide editoriali (content/guides.ts) e guide della community indicizzabili in questa lingua
 * (sopra la soglia di parole, scritte o tradotte qui: `guidesIndexableIn`, le stesse di /guides/community e della
 * sitemap) stanno nella stessa griglia, con la stessa scheda e la firma, dalla più recente per data di prima
 * pubblicazione: una guida appena pubblicata sta in cima.
 *
 * Per avere le guide della community nell'HTML (Google e gli assistenti leggono quello) la pagina è ISR come /decks e
 * /guides/community: prima era statica e la sezione "Guide della community" la chiedeva il browser a
 * /api/community-guides (revisione del 27/09/2026, "se Pierluigi preferisce la sezione nell'HTML, si torna all'ISR").
 * Come le altre letture pubbliche, un errore del database lancia e resta la pagina di prima; con la tabella che non c'è
 * o la community spenta, solo le guide editoriali. Le guide della community restano ai loro indirizzi
 * (/guides/community/<slug>).
 */
export const revalidate = 300;

/** Una voce dell'elenco: guida editoriale o della community, pronta da mostrare. */
type Entry = {
  key: string;
  href: string;
  title: string;
  /** lingua del titolo o del riassunto quando non è quella della pagina (traduzione di una guida della community che manca) */
  titleLang?: string;
  excerpt: string;
  excerptLang?: string;
  category: string;
  readTime: number;
  /** giorno mostrato (aggiornamento per le editoriali, pubblicazione per quelle della community) */
  shown: string;
  /** data di prima pubblicazione (ISO): l'ordine dell'elenco */
  published: string;
  image: { src: string; width: number; height: number; remote?: boolean } | null;
  by: string;
  role: { label: string; className: string } | null;
};

async function loadEntries(locale: Locale, badges: Record<string, string>) {
  const L = communityGuideLabels[locale];
  const editorial: Entry[] = getGuides(locale).map((g) => ({
    key: `guide-${g.slug}`,
    href: href(locale, `/guides/${g.slug}`),
    title: g.title,
    excerpt: g.excerpt,
    category: g.category,
    readTime: g.readTime,
    shown: g.updated,
    published: g.published ?? g.updated,
    image: g.image ? { src: g.image, width: 1200, height: 675 } : null,
    by: fillLabel(L.list.by, { name: authorOfGuide(g).name }),
    role: null,
  }));
  const community: Entry[] = guidesIndexableIn(await listPublishedGuides(), locales, locale).map((g) => {
    const summary = guideShapeSummary(g, locale);
    const title = guideShapeTitle(g, locale);
    const role = shownBadge(g.profile?.badge);
    const cover = communityGuideCover(g, supabaseUrl);
    return {
      key: `community-${g.id}`,
      href: href(locale, `/guides/community/${g.slug}`),
      title: title.text,
      ...(title.lang !== locale ? { titleLang: title.lang } : {}),
      excerpt: summary.text,
      ...(summary.lang !== locale ? { excerptLang: summary.lang } : {}),
      category: g.category,
      readTime: readMinutes(g.words ?? 0),
      shown: (g.published_at ?? g.created_at).slice(0, 10),
      published: g.published_at ?? g.created_at,
      image: cover,
      by: fillLabel(L.list.by, { name: authorName(g.profile) }),
      role: role ? { label: badges[role] ?? role, className: badgeStyle[role] } : null,
    };
  });
  // dalla più recente; a pari data (le editoriali hanno solo il giorno) l'ordine di content/guides.ts
  return [...community, ...editorial].sort((a, b) => b.published.localeCompare(a.published));
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // In SERP anche che cosa si trova nelle guide (piano SEO del 25/09/2026); l'H1 resta `title`
  return pageMeta(locale, "/guides", dict.guides.metaTitle, dict.guides.description);
}

export default async function GuidesPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const categories = Object.entries(d.guides.categories) as [keyof typeof d.guides.categories, string][];
  const entries = await loadEntries(locale, d.community.badges as Record<string, string>);
  const CL = communityGuideLabels[locale];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: d.guides.title, path: href(locale, "/guides") },
          ]),
          collectionPage({
            locale,
            path: href(locale, "/guides"),
            name: d.guides.title,
            description: d.guides.description,
            items: entries.map((e) => ({ name: e.title, path: e.href })),
            about: videoGameId,
          }),
        ]}
      />
      <p className="kicker text-mint">{d.nav.guides}</p>
      <h1 className="t-page mt-2">{d.guides.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.guides.intro}</p>
      {/* "Mandaci la tua guida" (diretta Twitch del 23/09/2026): subito sotto l'intro, come l'invito a pubblicare
          di /decks; il modulo manda la guida al canale Discord privato dello staff. Per chi ha un ruolo che pubblica le
          guide (pacchetto GUIDE, 27/09/2026) il riquadro diventa "Scrivi una guida" (lo decide il browser). */}
      <GuideCtaBox
        submit={{ title: d.guides.submitTitle, text: d.guides.submitText, button: d.guides.submitCta, href: href(locale, "/guides/submit") }}
        write={{ ...CL.cta, href: href(locale, "/guides/new") }}
      />
      <ul className="mt-6 flex flex-wrap gap-2" aria-label={d.guides.title}>
        {categories.map(([id, label]) => {
          const count = entries.filter((g) => g.category === id).length;
          return (
            <li key={id} className={`stat-pill border-2 ${count ? "border-mint text-mint" : "border-felt-line text-chalk-muted"}`}>
              {label} · {count}
            </li>
          );
        })}
      </ul>
      <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {entries.map((g) => (
          <li key={g.key} className="min-w-0">
            <Link href={g.href} prefetch={false} className="card-night card-night-hover flex h-full min-w-0 flex-col overflow-hidden">
              {g.image ? (
                g.image.remote ? (
                  // copertina caricata dall'autore (bucket del sito, già ridotta a 16:9 al caricamento): niente ottimizzatore
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image.src} alt="" width={g.image.width} height={g.image.height} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <Image src={g.image.src} alt="" width={g.image.width} height={g.image.height} sizes="(max-width: 768px) 90vw, 30vw" className="aspect-[16/9] w-full object-cover" />
                )
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col p-5">
                <p className="kicker text-pale-muted">
                  {d.guides.categories[g.category as keyof typeof d.guides.categories] ?? g.category} · {g.readTime} {d.guides.readTime} · {formatDate(locale, g.shown)}
                </p>
                <h2 className="t-item mt-1 break-words leading-tight" lang={g.titleLang}>
                  {g.title}
                </h2>
                <p className="mt-2 line-clamp-4 flex-1 break-words text-sm text-pale-muted" lang={g.excerptLang}>
                  {g.excerpt}
                </p>
                <p className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs text-pale">
                  <span className="truncate">{g.by}</span>
                  {g.role ? <span className={`stat-pill px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${g.role.className}`}>{g.role.label}</span> : null}
                </p>
                {/* CTA in menta: il magenta resta ai nerf e agli errori (sul blu notte faceva 2,96:1). */}
                <span className="mt-4 font-display text-sm font-bold text-mint">{d.common.readMore} →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
