import { NextResponse } from "next/server";
import { getDictionary, href, locales, monthShort, dayNumber } from "@/lib/i18n";
import { listListedTournaments } from "@/lib/tournament/queries";
import { authorName } from "@/lib/community/util";
import type { TickerItem } from "@/components/TickerMarquee";

/**
 * Tornei della community pubblicati sul calendario (solo `listed`, aperti o in corso, non più vecchi di un giorno),
 * già nel formato della striscia del calendario per ogni lingua. Il layout `(site)` resta statico:
 * è `TickerMarquee` nel browser a chiedere questo JSON, rigenerato al massimo ogni 5 minuti.
 * Il giorno del cubetto qui è quello UTC (la risposta è uguale per tutti); con `startsAt` il browser lo rifà nel fuso
 * di chi guarda (24/11/2026: il torneo di ChillGiver, 28/11 alle 23:00 UTC, in Italia diceva 28 invece di 29).
 */
export const revalidate = 300;

export async function GET() {
  const all = await listListedTournaments(40);
  const since = Date.now() - 86_400_000;
  const live = all.filter((t) => (t.status === "open" || t.status === "running") && new Date(t.starts_at).getTime() >= since);
  const out: Record<string, TickerItem[]> = {};
  for (const locale of locales) {
    const d = getDictionary(locale);
    out[locale] = live.map((t) => {
      const day = t.starts_at.slice(0, 10);
      return {
        key: `t-${t.slug}`,
        href: href(locale, `/tournaments/${t.slug}`),
        date: day,
        day: dayNumber(day),
        month: monthShort(locale, day),
        title: t.name,
        where: `${d.events.communityBadge} · ${authorName(t.profile)}`,
        isNext: false,
        startsAt: t.starts_at,
      };
    });
  }
  return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
}
