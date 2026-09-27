import { NextResponse } from "next/server";
import { formatDate, getDictionary, href, locales } from "@/lib/i18n";
import { listPublishedGuides } from "@/lib/community/guideQueries";
import { COMMUNITY_GUIDES_ON_HUB, guideCover, guideShapeSummary, guidesIndexableIn, readMinutes } from "@/lib/community/guides";
import { fillLabel } from "@/lib/community/deckQuality";
import { shownBadge } from "@/lib/community/badges";
import { authorName } from "@/lib/community/util";
import { badgeStyle } from "@/lib/cardArt";
import { communityGuideLabels } from "@/lib/communityGuideLabels";
import type { HubGuide, HubGuides } from "@/components/guides/CommunityGuidesHub";

/**
 * Le ultime guide della community per la sezione di /guides (pacchetto GUIDE, revisione del 27/09/2026), in ogni lingua
 * del sito: le prime `COMMUNITY_GUIDES_ON_HUB` indicizzabili in quella lingua (sopra la soglia di parole, scritte o
 * tradotte lì, le stesse di /guides/community) e quante sono in tutto, già pronte da mostrare. /guides resta statica
 * come le altre pagine editoriali: è `CommunityGuidesHub` nel browser a chiedere questo JSON, come la striscia del
 * calendario chiede /api/calendar. Rigenerato al massimo ogni 5 minuti (in pratica ogni minuto: la lettura di
 * `supabasePublic` si rinnova a 60 s) e subito dopo ogni salvataggio di una guida (`revalidateGuide` in guideActions.ts).
 * Con un errore del database la lettura lancia (DECKS-12) e resta la risposta di prima; con la tabella che non c'è
 * ancora o la community spenta, nessuna guida.
 */
export const revalidate = 300;

export async function GET() {
  const all = await listPublishedGuides();
  const out: HubGuides = {};
  for (const locale of locales) {
    const L = communityGuideLabels[locale];
    const d = getDictionary(locale);
    const shown = guidesIndexableIn(all, locales, locale);
    out[locale] = {
      total: shown.length,
      guides: shown.slice(0, COMMUNITY_GUIDES_ON_HUB).map((g): HubGuide => {
        const summary = guideShapeSummary(g, locale);
        const role = shownBadge(g.profile?.badge);
        return {
          id: g.id,
          href: href(locale, `/guides/community/${g.slug}`),
          title: g.title,
          ...(g.lang !== locale ? { titleLang: g.lang } : {}),
          summary: summary.text,
          ...(summary.lang !== locale ? { summaryLang: summary.lang } : {}),
          kicker: `${d.guides.categories[g.category]} · ${fillLabel(L.page.readTime, { n: String(readMinutes(g.words ?? 0)) })} · ${formatDate(locale, (g.published_at ?? g.created_at).slice(0, 10))}`,
          by: fillLabel(L.list.by, { name: authorName(g.profile) }),
          role: role ? { label: d.community.badges[role], className: badgeStyle[role] } : null,
          cover: guideCover(g.cover_preset),
        };
      }),
    };
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
}
