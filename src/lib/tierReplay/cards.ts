import "server-only";
import { href, type Locale } from "@/lib/i18n";
import { cards, patchChanges, patchOrder, patches as patchInfo, patchLabel, type PatchId } from "@/lib/data/cards";
import { readTrackerCards } from "@/lib/community/trackerStatsQueries";
import { loadTierData, type TierData } from "@/lib/tierData";
import { toGameCardInput } from "@/components/GameCard";
import type { ReplayBaseCard, ReplayCardPatch, ReplayCardsData } from "@/components/tierReplay/cardFrames";

/**
 * Dati del replay delle carte base di /tier-list (27/11/2026): sola lettura. Per ogni patch del Tracker
 * dalla 0.7 i mazzi che contengono la carta (dal lato di chi registra) e la media di tutte le partite registrate; dalla
 * tier list della community e dai voti solo fascia e media, mai quante persone.
 */

/** dalla 0.7 (il Tracker legge le carte giocate dal 10/10/2026) fino alla patch in corso: una patch nuova entra da sola */
export const CARD_REPLAY_PATCHES: PatchId[] = patchOrder.slice(patchOrder.indexOf("0.7"));

/** `tier`: i dati della tier list già letti dalla pagina, per non rileggerli. Le patch senza partite restano fuori. */
export async function loadCardReplay(locale: Locale, tierData?: TierData): Promise<ReplayCardsData> {
  const [tier, ...reads] = await Promise.all([tierData ?? loadTierData(locale), ...CARD_REPLAY_PATCHES.map((p) => readTrackerCards(p))]);
  const changesByPatch = new Map(patchChanges().map((g) => [g.patch, g.items]));

  const patches: ReplayCardPatch[] = CARD_REPLAY_PATCHES.map((id, i) => {
    const info = patchInfo[id];
    const read = reads[i];
    const items = changesByPatch.get(id) ?? [];
    return {
      id,
      label: patchLabel(id, locale),
      date: info.date,
      games: read?.games ?? 0,
      url: info.url,
      news: info.news ? href(locale, `/news/${info.news}`) : undefined,
      changeCount: items.filter((m) => !m.card.legendary).length,
      baseline: read && read.games > 0 ? read.wins / read.games : null,
      events: items
        .filter((m) => !m.card.legendary)
        .slice(0, 8)
        .map((m) => ({
          slug: m.card.slug,
          name: m.card.name,
          href: href(locale, `/cards/${m.card.slug}`),
          legendary: false,
          kind: m.change.kind,
          note: m.change.note[locale] ?? m.change.note.en,
        })),
    };
  });

  const byPatch = reads.map((r) => new Map((r?.cards ?? []).map((c) => [c.card, c.deck])));
  const entries = new Map(tier.cards.filter((c) => !c.legendary).map((c) => [c.slug, c]));

  const list: ReplayBaseCard[] = cards
    .filter((c) => !c.legendary && c.type !== "token" && c.status === "active")
    .map((c) => {
      const entry = entries.get(c.slug);
      const since = c.since ? patchOrder.indexOf(c.since) : -1;
      return {
        slug: c.slug,
        name: c.name,
        href: href(locale, `/cards/${c.slug}`),
        game: toGameCardInput(c, locale),
        changes: c.history.map((ch) => ({
          patch: ch.patch,
          patchLabel: patchLabel(ch.patch, locale),
          kind: ch.kind,
          note: ch.note[locale] ?? ch.note.en,
          from: ch.from,
          to: ch.to,
        })),
        stats: CARD_REPLAY_PATCHES.map((_, i) => {
          const d = c.key ? byPatch[i].get(c.key) : null;
          return d ? { games: d.games, wins: d.wins } : null;
        }),
        notYet: CARD_REPLAY_PATCHES.map((p) => since >= 0 && patchOrder.indexOf(p) < since),
        community: entry?.community ? { tier: entry.community.tier, avg: entry.community.avg } : undefined,
        votes: entry?.rating ? { tier: entry.rating.tier, avg: entry.rating.avg } : undefined,
      };
    });

  return { locale, patches, cards: list, trackerMissing: reads.every((r) => r === null) };
}
