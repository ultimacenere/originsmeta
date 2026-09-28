import Link from "next/link";
import { formatDate, getDictionary, href, type Locale } from "@/lib/i18n";
import { guideShapeSummary, readMinutes, type CommunityGuideListItem } from "@/lib/community/guides";
import { fillLabel } from "@/lib/community/deckQuality";
import { shownBadge } from "@/lib/community/badges";
import { authorName } from "@/lib/community/util";
import { badgeStyle } from "@/lib/cardArt";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import { GuideCover } from "./GuideCover";

/**
 * Scheda di una guida della community (pacchetto GUIDE, 27/09/2026), usata in /guides/community, in fondo alla pagina
 * di una guida e nel profilo /u (/guides, dal 29/09/2026 un elenco solo con le guide della redazione, ha la sua scheda
 * uguale per tutte). Copertina del media kit o caricata dall'autore (`GuideCover` con la guida). Le voci sono leggere
 * (niente sezioni né traduzioni intere): parole, impronta e riassunti tradotti bastano per le schede e per decidere dove
 * una guida si indicizza (`guideShapeIndexing` in guides.ts).
 */

export function CommunityGuideCard({ guide, locale, categoryLabel, showAuthor = true }: { guide: CommunityGuideListItem; locale: Locale; categoryLabel: string; showAuthor?: boolean }) {
  const L = communityGuideLabels[locale];
  const d = getDictionary(locale);
  const summary = guideShapeSummary(guide, locale);
  const role = shownBadge(guide.profile?.badge);
  const date = (guide.published_at ?? guide.created_at).slice(0, 10);
  return (
    <Link href={href(locale, `/guides/community/${guide.slug}`)} className="card-night card-night-hover flex h-full min-w-0 flex-col overflow-hidden" prefetch={false}>
      <GuideCover guide={guide} framed={false} sizes="(max-width: 768px) 92vw, 30vw" />
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

