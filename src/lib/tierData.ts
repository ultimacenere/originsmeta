import { formatDate, getDictionary, href, type Locale } from "@/lib/i18n";
import { activeCards, patchAt, patchLabel, patchOrder, sagas, type PatchId } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { getGuides } from "@/lib/content/guides";
import { listPublishedDecks } from "@/lib/community/queries";
import { listPublishedTierLists } from "@/lib/community/tierlists";
import { authorName } from "@/lib/community/util";
import { aggregateLists, usageCounts, weightedRating, type CardScore } from "@/lib/tierstats";
import type { TierCardEntry, TierDeckEntry } from "@/lib/tierTypes";

/**
 * Dati della sezione Tier list (riprogettazione del 24/09/2026, §1 punto 32 della KB): una sola lettura di Supabase
 * per le tre pagine (/tier-list, /tier-list/community, /tier-list/most-played), che sono in ISR come /decks.
 * - mazzi pubblicati: le anteprime "più votati", gli archetipi e il conteggio di "Le più giocate";
 * - tier list salvate dagli iscritti: media, voti e distribuzione di ogni carta.
 * Senza Supabase (community spenta) le liste tornano vuote e le pagine mostrano gli inviti.
 */

export type TierData = {
  cards: TierCardEntry[];
  decks: TierDeckEntry[];
  /** date del primo e dell'ultimo mazzo pubblicato, già scritte */
  deckRange?: { from: string; to: string };
  /** versioni del gioco dei mazzi pubblicati, dalla più recente */
  deckPatches: string[];
  /** tier list salvate per tipo e data dell'ultima */
  /** liste salvate per scheda (una per persona e per scheda) e persone distinte che ne hanno salvata almeno una */
  lists: { legendaries: number; cards: number; people: number; updated?: string };
};

export async function loadTierData(locale: Locale): Promise<TierData> {
  const d = getDictionary(locale);
  const [rawDecks, lists] = await Promise.all([listPublishedDecks(), listPublishedTierLists()]);

  // Mazzi: dal più votato (voto pesato sul numero di voti), quelli senza voti in fondo dal più recente
  const decks: TierDeckEntry[] = rawDecks
    .map((deck) => {
      const leg = deck.legendary ? activeCards.find((c) => c.slug === deck.legendary) : undefined;
      const rating = deck.rating ?? { avg: 0, votes: 0 };
      const badge = deck.profile?.badge ?? "community";
      const created = deck.created_at.slice(0, 10);
      const patch = patchAt(deck.created_at);
      return {
        slug: deck.slug,
        name: deck.name,
        href: href(locale, `/decks/community/${deck.slug}`),
        legendary: leg ? { slug: leg.slug, name: leg.name, thumb: leg.thumb } : undefined,
        archetype: deck.archetype,
        archetypeLabel: archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype,
        creator: authorName(deck.profile),
        badge,
        badgeLabel: d.community.badges[badge as keyof typeof d.community.badges] ?? badge,
        rating,
        score: weightedRating(rating.avg, rating.votes),
        created,
        createdLabel: formatDate(locale, created),
        patchLabel: patch ? patchLabel(patch, locale) : undefined,
      };
    })
    .sort((a, b) => Number(b.rating.votes > 0) - Number(a.rating.votes > 0) || b.score - a.score || b.created.localeCompare(a.created));

  const usage = usageCounts(rawDecks.map((deck) => ({ legendary: deck.legendary, cards: deck.cards })));
  const scores = new Map<string, CardScore>();
  for (const s of aggregateLists(lists.filter((l) => l.kind === "legendaries"))) scores.set(s.slug, s);
  for (const s of aggregateLists(lists.filter((l) => l.kind === "cards"))) scores.set(s.slug, s);

  const guides = getGuides(locale);
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;

  const cards: TierCardEntry[] = activeCards.map((c) => {
    const used = (c.legendary ? usage.legendaries[c.slug] : usage.cards[c.slug]) ?? 0;
    const score = scores.get(c.slug);
    const inDecks = rawDecks.filter((deck) => (c.legendary ? deck.legendary === c.slug : deck.cards.includes(c.slug)));
    // i mazzi della carta nell'ordine dei più votati, come l'elenco dei mazzi
    const deckOrder = new Map(decks.map((x, i) => [x.slug, i]));
    inDecks.sort((a, b) => (deckOrder.get(a.slug) ?? 0) - (deckOrder.get(b.slug) ?? 0));
    return {
      slug: c.slug,
      name: c.name,
      href: href(locale, `/cards/${c.slug}`),
      thumb: c.thumb,
      image: c.image,
      mana: c.mana,
      power: c.power,
      health: c.health,
      spell: c.type === "spell",
      typeLabel: typeLabel[c.type],
      alignment: c.alignment,
      alignmentLabel: c.alignment ? alignLabel[c.alignment] : undefined,
      legendary: Boolean(c.legendary),
      saga: sagas[c.saga][locale],
      ability: c.ability?.[locale],
      used,
      community: score ? { tier: score.tier, avg: score.avg, votes: score.votes, dist: score.dist } : undefined,
      decks: inDecks.map((deck) => ({ name: deck.name, href: href(locale, `/decks/community/${deck.slug}`) })),
      guides: guides.filter((g) => g.tags?.cards?.includes(c.slug)).map((g) => ({ title: g.title, href: href(locale, `/guides/${g.slug}`) })),
    };
  });

  const created = rawDecks.map((deck) => deck.created_at.slice(0, 10)).sort();
  // versioni del gioco presenti fra i mazzi, dalla più recente (l'ordine è quello ufficiale di `patchOrder`)
  const patchIds = Array.from(new Set(rawDecks.map((deck) => patchAt(deck.created_at)).filter((p): p is PatchId => p !== undefined))).sort(
    (a, b) => patchOrder.indexOf(a) - patchOrder.indexOf(b),
  );
  const updated = lists.map((l) => l.updated_at.slice(0, 10)).sort().at(-1);

  return {
    cards,
    decks,
    deckRange: created.length ? { from: formatDate(locale, created[0]), to: formatDate(locale, created[created.length - 1]) } : undefined,
    deckPatches: patchIds.reverse().map((p) => patchLabel(p, locale)),
    lists: {
      legendaries: lists.filter((l) => l.kind === "legendaries").length,
      cards: lists.filter((l) => l.kind === "cards").length,
      people: new Set(lists.map((l) => l.owner)).size,
      updated: updated ? formatDate(locale, updated) : undefined,
    },
  };
}
