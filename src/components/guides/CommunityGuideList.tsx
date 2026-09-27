import Link from "next/link";
import { formatDate, getDictionary, href, locales, type Locale } from "@/lib/i18n";
import { listPublishedGuides } from "@/lib/community/guideQueries";
import { guideShapeSummary, guidesIndexableIn, readMinutes, type CommunityGuideListItem } from "@/lib/community/guides";
import { fillLabel } from "@/lib/community/deckQuality";
import { shownBadge } from "@/lib/community/badges";
import { authorName } from "@/lib/community/util";
import { badgeStyle } from "@/lib/cardArt";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { GuideCover } from "./GuideCover";

/**
 * Elenchi delle guide della community (pacchetto GUIDE, 27/09/2026): la scheda di una guida (`CommunityGuideCard`,
 * usata in /guides, in /guides/community, in fondo alla pagina di una guida e nel profilo /u), la lettura delle guide
 * indicizzabili in una lingua (`communityGuidesIn`) e la sezione "Guide della community" di /guides
 * (`CommunityGuidesSection`), che mostra le più recenti e porta all'elenco completo. Le voci sono leggere (niente
 * sezioni né traduzioni intere): parole, impronta e riassunti tradotti bastano per le schede e per decidere dove una
 * guida si indicizza (`guideShapeIndexing` in guides.ts).
 */

export function CommunityGuideCard({ guide, locale, categoryLabel, showAuthor = true }: { guide: CommunityGuideListItem; locale: Locale; categoryLabel: string; showAuthor?: boolean }) {
  const L = communityGuideLabels[locale];
  const d = getDictionary(locale);
  const summary = guideShapeSummary(guide, locale);
  const role = shownBadge(guide.profile?.badge);
  const date = (guide.published_at ?? guide.created_at).slice(0, 10);
  return (
    <Link href={href(locale, `/guides/community/${guide.slug}`)} className="card-night card-night-hover flex h-full min-w-0 flex-col overflow-hidden" prefetch={false}>
      <GuideCover preset={guide.cover_preset} framed={false} sizes="(max-width: 768px) 92vw, 30vw" />
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <p className="kicker text-pale-muted">
          {categoryLabel} · {fillLabel(L.page.readTime, { n: String(readMinutes(guide.words ?? 0)) })} · {formatDate(locale, date)}
        </p>
        {/* break-words: un titolo o un riassunto con una parola lunghissima (un link, un codice) non allarga la pagina */}
        <h3 className="t-item mt-1 break-words leading-tight" lang={guide.lang === locale ? undefined : guide.lang}>
          {guide.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 break-words text-sm text-pale-muted" lang={summary.lang === locale ? undefined : summary.lang}>
          {summary.text}
        </p>
        {showAuthor ? (
          <p className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs text-pale">
            <span className="truncate">{fillLabel(L.list.by, { name: authorName(guide.profile) })}</span>
            {role ? <span className={`stat-pill px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badgeStyle[role]}`}>{d.community.badges[role]}</span> : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

/**
 * Le guide della community indicizzabili nella lingua della pagina (sopra la soglia di parole e scritte o tradotte in
 * questa lingua), dalla più recente: la sezione di /guides ne mostra le prime, /guides/community tutte. Le altre restano
 * sul profilo dell'autore, raggiungibili ma fuori dagli elenchi indicizzati.
 */
export async function communityGuidesIn(locale: Locale): Promise<CommunityGuideListItem[]> {
  return guidesIndexableIn(await listPublishedGuides(), locales, locale);
}

/** Sezione di /guides: le ultime guide della community indicizzabili nella lingua della pagina (niente se non ce ne sono). */
export function CommunityGuidesSection({ locale, guides, total }: { locale: Locale; guides: readonly CommunityGuideListItem[]; total: number }) {
  if (!guides.length) return null;
  const L = communityGuideLabels[locale];
  const d = getDictionary(locale);
  return (
    <section className="mt-12 scroll-mt-24" aria-labelledby="community-guides-title" id="community-guides">
      <h2 id="community-guides-title" className="t-section">
        {L.list.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.list.intro}</p>
      <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {guides.map((g) => (
          <li key={g.id} className="min-w-0">
            <CommunityGuideCard guide={g} locale={locale} categoryLabel={d.guides.categories[g.category]} />
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href={href(locale, "/guides/community")} className="font-display text-sm font-bold text-mint hover:underline">
          {L.list.all} ({fillLabel(L.listPage.count, { n: String(total) })}) →
        </Link>
      </p>
    </section>
  );
}
