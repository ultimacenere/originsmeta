import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate, href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { getGuides } from "@/lib/content/guides";
import { JsonLd, breadcrumbs, collectionPage, videoGameId } from "@/components/JsonLd";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { GuideCtaBox } from "@/components/guides/GuideCtaBox";
import { CommunityGuidesHub } from "@/components/guides/CommunityGuidesHub";

/**
 * Pagina editoriale statica, come le altre (CLAUDE.md: "Le pagine editoriali restano statiche"). Dal 27/09/2026 mostra
 * anche le ultime guide della community (pacchetto GUIDE): all'integrazione la pagina era passata in ISR per leggerle
 * da Supabase, ma era una decisione da confermare con Pierluigi e una build con Supabase irraggiungibile avrebbe fatto
 * fallire anche l'hub delle guide editoriali. Nella revisione dello stesso giorno la sezione la carica il browser da
 * /api/community-guides (`CommunityGuidesHub`, lo schema della striscia del calendario con /api/calendar); le guide
 * della community restano fuori dai dati strutturati e dal lastmod di questa pagina, e l'elenco completo, indicizzato e
 * in sitemap, è /guides/community (ISR). Se Pierluigi preferisce la sezione nell'HTML, si torna all'ISR.
 */

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  // In SERP anche che cosa si trova nelle guide (piano SEO del 25/09/2026); l'H1 resta `title`
  return pageMeta(locale, "/guides", dict.guides.metaTitle, dict.guides.description);
}

export default async function GuidesPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const guides = getGuides(locale);
  const categories = Object.entries(d.guides.categories) as [keyof typeof d.guides.categories, string][];

  // Lista per i dati strutturati: le guide editoriali della pagina, ognuna con la sua pagina (quelle della community le
  // carica il browser e le elenca /guides/community)
  const listed = guides.map((g) => ({ name: g.title, path: href(locale, `/guides/${g.slug}`) }));
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
            items: listed,
            about: videoGameId,
          }),
        ]}
      />
      <p className="kicker text-mint">{d.nav.guides}</p>
      <h1 className="t-page mt-2">{d.guides.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{d.guides.intro}</p>
      {/* "Mandaci la tua guida" (diretta Twitch del 23/09/2026): subito sotto l'intro, come l'invito a pubblicare
          di /decks; il modulo manda la guida al canale Discord privato dello staff. Per chi ha un ruolo che pubblica le
          guide (pacchetto GUIDE, 27/09/2026) il riquadro diventa "Scrivi una guida" (lo decide il browser: pagina statica). */}
      <GuideCtaBox
        submit={{ title: d.guides.submitTitle, text: d.guides.submitText, button: d.guides.submitCta, href: href(locale, "/guides/submit") }}
        write={{ ...CL.cta, href: href(locale, "/guides/new") }}
      />
      <ul className="mt-6 flex flex-wrap gap-2" aria-label={d.guides.title}>
        {categories.map(([id, label]) => {
          const count = guides.filter((g) => g.category === id).length;
          return (
            <li key={id} className={`stat-pill border-2 ${count ? "border-mint text-mint" : "border-felt-line text-chalk-muted"}`}>
              {label} · {count}
            </li>
          );
        })}
      </ul>
      <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={href(locale, `/guides/${g.slug}`)} className="card-night card-night-hover flex h-full flex-col overflow-hidden">
              {g.image ? <Image src={g.image} alt="" width={1200} height={675} sizes="(max-width: 768px) 90vw, 30vw" className="aspect-[16/9] w-full object-cover" /> : null}
              <div className="flex flex-1 flex-col p-5">
                <p className="kicker text-pale-muted">
                  {d.guides.categories[g.category]} · {g.readTime} {d.guides.readTime} · {formatDate(locale, g.updated)}
                </p>
                <h2 className="t-item mt-1 leading-tight">{g.title}</h2>
                <p className="mt-2 flex-1 text-sm text-pale-muted">{g.excerpt}</p>
                {/* CTA in menta: il magenta resta ai nerf e agli errori (sul blu notte faceva 2,96:1). */}
                <span className="mt-4 font-display text-sm font-bold text-mint">{d.common.readMore} →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {/* Guide della community (pacchetto GUIDE): le ultime indicizzabili in questa lingua, chieste dal browser; niente se non ce ne sono */}
      <CommunityGuidesHub
        locale={locale}
        labels={{ title: CL.list.title, intro: CL.list.intro, all: CL.list.all, count: CL.listPage.count }}
        allHref={href(locale, "/guides/community")}
      />
    </div>
  );
}
