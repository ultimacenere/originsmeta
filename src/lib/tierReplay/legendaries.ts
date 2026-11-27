import "server-only";
import { formatDate, href, type Locale } from "@/lib/i18n";
import { cards, patchChanges, patchOrder, patches as patchInfo, patchLabel, latestPatch, type PatchId } from "@/lib/data/cards";
import { legendaryEvidence, tierIds } from "@/lib/data/tierlist";
import { crimsonBoost, ladderTier, legendaryTier } from "@/lib/tierRule";
import { bothSides, wilson } from "@/lib/tracker/snapshot";
import { readTrackerMatchups } from "@/lib/community/trackerStatsQueries";
import { loadTierData, type TierData } from "@/lib/tierData";
import { toGameCardInput } from "@/components/GameCard";
import type { ReplayData, ReplayLegendary, ReplayPatch, ReplayPatchStat, ReplayRate, ReplayTierOrNone } from "./types";

/**
 * Dati del replay delle Leggendarie di /tier-list (prototipo del 26/11/2026, scelto da Pierluigi il 27/11): sola lettura.
 * - fasce ufficiali: quelle pubblicate il 9/11 (tierlist.ts, regola di tierRule.ts), ferme a quella lettura;
 * - community e voti 1–10: la lettura di sempre (`loadTierData`), solo fascia e media, mai quante persone;
 * - Tracker: gli scontri fra Leggendarie delle patch dalla ea-1104, contati a due lati come /analytics (`bothSides`);
 *   per le patch dopo il 9/11 la fascia è quella che darebbe la regola, non una fascia pubblicata.
 */

/** dalla patch della tier list pubblicata fino a quella in corso: una patch nuova entra da sola */
export const REPLAY_PATCHES: PatchId[] = patchOrder.slice(Math.max(0, patchOrder.indexOf(legendaryEvidence.patch as PatchId)));
export const TIER_NEWS = "origins-tcg-tier-list-legendaries-november-2026";

const ORDER: ReplayTierOrNone[] = [...tierIds, "unranked"];

function rate(games: number, wins: number): ReplayRate {
  const [lo, hi] = games > 0 ? wilson(wins, games) : [0, 0];
  return { games, wins, r: games > 0 ? wins / games : 0, lo, hi };
}

/** `tierData`: i dati della tier list già letti dalla pagina, per non rileggerli. */
export async function loadLegendaryReplay(locale: Locale, tierData?: TierData): Promise<ReplayData> {
  const [tier, ...reads] = await Promise.all([tierData ?? loadTierData(locale), ...REPLAY_PATCHES.map((p) => readTrackerMatchups(p))]);
  const byKey = new Map(cards.filter((c) => c.legendary && c.key).map((c) => [c.key as string, c.slug]));

  // per patch: Leggendarie e scontri a due lati, con le chiavi del gioco tradotte in slug
  const perPatch = new Map<string, { legs: Map<string, ReplayPatchStat>; games: number }>();
  REPLAY_PATCHES.forEach((patch, i) => {
    const rows = reads[i];
    if (!rows) return;
    const both = bothSides(rows);
    const totalPresence = both.legendaries.reduce((s, l) => s + l.games, 0) || 1;
    const legs = new Map<string, ReplayPatchStat>();
    for (const l of both.legendaries) {
      const slug = byKey.get(l.legendary);
      if (!slug) continue;
      const matchups = both.matchups
        .filter((m) => m.legendary === l.legendary && m.opponent !== l.legendary && byKey.has(m.opponent))
        .map((m) => ({ opponent: byKey.get(m.opponent) as string, ...rate(m.games, m.wins) }))
        .sort((a, b) => b.games - a.games);
      // la regola del 9/11 intera: ladder di questa patch, poi la Crimson Cup come allora (stessi numeri del torneo)
      const ev = legendaryEvidence.rows.find((r) => r.slug === slug);
      const ruleTier = ev ? legendaryTier({ ...ev, games: l.games, wins: l.wins }) : ladderTier(l.games, l.wins);
      legs.set(slug, { ...rate(l.games, l.wins), share: l.games / totalPresence, ruleTier, matchups });
    }
    perPatch.set(patch, { legs, games: both.games });
  });

  const entries = new Map(tier.cards.filter((c) => c.legendary).map((c) => [c.slug, c]));
  const usedOrder = [...entries.values()].sort((a, b) => b.used - a.used).map((c) => c.slug);

  const legendaries: ReplayLegendary[] = legendaryEvidence.rows.flatMap((row) => {
    const card = cards.find((c) => c.slug === row.slug);
    if (!card) return [];
    const entry = entries.get(row.slug);
    const patchStats: Record<string, ReplayPatchStat> = {};
    for (const p of REPLAY_PATCHES) {
      const s = perPatch.get(p)?.legs.get(row.slug);
      if (s) patchStats[p] = s;
    }
    const c = row.crimson;
    return [
      {
        slug: card.slug,
        name: card.name,
        href: href(locale, `/cards/${card.slug}`),
        game: toGameCardInput(card, locale),
        image: card.image,
        thumb: card.thumb,
        art: card.art,
        mana: card.mana,
        alignment: card.alignment,
        official: {
          tier: legendaryTier(row),
          ladderTier: ladderTier(row.games, row.wins),
          boosted: crimsonBoost(row),
          rate: rate(row.games, row.wins),
          rank: 0,
          crimson: c && c.seen > 0 ? { banRate: c.banned / c.seen, finalists: c.finalists } : null,
          changedAfterCrimson: !!row.changedAfterCrimson,
        },
        community: entry?.community ? { tier: entry.community.tier, avg: entry.community.avg } : undefined,
        votes: entry?.rating ? { tier: entry.rating.tier, avg: entry.rating.avg } : undefined,
        used: entry?.used ?? 0,
        usedRank: usedOrder.indexOf(card.slug) + 1,
        patches: patchStats,
        changes: card.history.map((ch) => ({
          patch: ch.patch,
          patchLabel: patchLabel(ch.patch, locale),
          kind: ch.kind,
          note: ch.note[locale] ?? ch.note.en,
          from: ch.from,
          to: ch.to,
        })),
      },
    ];
  });

  // ordine della tier list ufficiale: fascia, poi bordo basso dell'intervallo, poi partite
  legendaries.sort(
    (a, b) =>
      ORDER.indexOf(a.official.tier) - ORDER.indexOf(b.official.tier) ||
      b.official.rate.lo - a.official.rate.lo ||
      b.official.rate.games - a.official.rate.games,
  );
  legendaries.forEach((l, i) => (l.official.rank = i + 1));

  const changesByPatch = new Map(patchChanges().map((g) => [g.patch, g.items]));
  const labPatches: ReplayPatch[] = REPLAY_PATCHES.map((id) => {
    const info = patchInfo[id];
    const items = changesByPatch.get(id) ?? [];
    return {
      id,
      label: patchLabel(id, locale),
      date: info.date,
      games: perPatch.get(id)?.games ?? 0,
      url: info.url,
      news: info.news ? href(locale, `/news/${info.news}`) : undefined,
      changeCount: items.length,
      events: items.slice(0, 8).map((m) => ({
        slug: m.card.slug,
        name: m.card.name,
        href: href(locale, `/cards/${m.card.slug}`),
        legendary: !!m.card.legendary,
        kind: m.change.kind,
        note: m.change.note[locale] ?? m.change.note.en,
      })),
    };
  });

  return {
    locale,
    officialRead: legendaryEvidence.read,
    officialReadLabel: formatDate(locale, legendaryEvidence.read),
    officialPatch: legendaryEvidence.patch,
    officialGames: legendaryEvidence.games,
    officialNews: href(locale, `/news/${TIER_NEWS}`),
    patches: labPatches,
    latestPatch,
    legendaries,
    readAt: new Date().toISOString(),
    trackerMissing: reads.every((r) => r === null),
  };
}
