import Link from "next/link";
import { formatDate, getDictionary, href, locales, type Locale } from "@/lib/i18n";
import { listPublishedGuides } from "@/lib/community/guideQueries";
import { communityGuideIndexing, communityGuideWords, localizedCommunityGuide, readMinutes, type CommunityGuide } from "@/lib/community/guides";
import { fillLabel } from "@/lib/community/deckQuality";
import { shownBadge } from "@/lib/community/badges";
import { authorName } from "@/lib/community/util";
import { badgeStyle } from "@/lib/cardArt";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { GuideCover } from "./GuideCover";

/**
 * Elenchi delle guide della community (pacchetto GUIDE, 27/09/2026): la scheda di una guida (`CommunityGuideCard`,
 * usata anche in fondo alla pagina di una guida, nel profilo /u e nel pannello /account) e la sezione "Guide della
 * community" di /guides (`CommunityGuidesSection`), che mostra le ultime guide indicizzabili nella lingua della pagina
 * (sopra la soglia di parole e scritte o tradotte in questa lingua: le altre restano sul profilo dell'autore).
 */

/** Il riassunto nella lingua della pagina, se c'è; altrimenti quello dell'autore. */
function summaryOf(g: CommunityGuide, locale: Locale): { text: string; lang: Locale } {
  const v = localizedCommunityGuide(g, locale);
  return { text: v.text.summary, lang: v.lang };
}

export function CommunityGuideCard({ guide, locale, categoryLabel, showAuthor = true }: { guide: CommunityGuide; locale: Locale; categoryLabel: string; showAuthor?: boolean }) {
  const L = communityGuideLabels[locale];
  const d = getDictionary(locale);
  const summary = summaryOf(guide, locale);
  const role = shownBadge(guide.profile?.badge);
  const date = (guide.published_at ?? guide.created_at).slice(0, 10);
  return (
    <Link href={href(locale, `/guides/community/${guide.slug}`)} className="card-night card-night-hover flex h-full flex-col overflow-hidden" prefetch={false}>
      <GuideCover preset={guide.cover_preset} className="aspect-[16/6]" framed={false} />
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <p className="kicker text-pale-muted">
          {categoryLabel} · {fillLabel(L.page.readTime, { n: String(readMinutes(communityGuideWords(guide))) })} · {formatDate(locale, date)}
        </p>
        <h3 className="t-item mt-1 leading-tight" lang={guide.lang === locale ? undefined : guide.lang}>
          {guide.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-pale-muted" lang={summary.lang === locale ? undefined : summary.lang}>
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

/** Sezione di /guides: le ultime guide della community indicizzabili nella lingua della pagina (niente se non ce ne sono). */
export async function CommunityGuidesSection({ locale, limit = 6 }: { locale: Locale; limit?: number }) {
  const guides = (await listPublishedGuides()).filter((g) => !communityGuideIndexing(g, locales, locale).noindex).slice(0, limit);
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
    </section>
  );
}
