import { formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import { archetypeLabels } from "@/lib/data/decks";
import { getCard, patchAt, patchLabel, type Card } from "@/lib/data/cards";
import type { ExplorerDeck } from "@/components/DeckExplorer";
import { creatorExtras, type creatorIndex } from "@/lib/community/creators";
import { authorName } from "@/lib/community/util";
import { localizedGuide } from "@/lib/community/deckTranslation";
import { normalizeBadge } from "@/lib/community/badges";
import { deckListKey } from "@/lib/tracker/stats";
import { supabaseUrl } from "@/lib/supabase/env";
import { deckArtUrl } from "@/lib/community/deckArt";
import { weightedRating } from "@/lib/tierstats";
import { deckCardsDate } from "@/lib/community/deckVersions";
import { stripMarkdown } from "@/lib/userMarkdown";
import type { CommunityDeck } from "@/lib/community/types";
import type { DeckPopularity } from "@/lib/community/favorites";

/**
 * Le righe di `DeckExplorer` per i mazzi della community: le usano /decks e, dal 29/10/2026, l'elenco dei mazzi theory
 * craft (/theory-craft/decks), che Pierluigi vuole "esattamente uguale alla sezione ufficiale dei deck". Prima stavano
 * dentro la pagina di /decks.
 */

/**
 * Taglio a `max` caratteri con l'ellissi, per le righe dell'elenco. Per punti di codice e non per unità UTF-16 (04/10/2026):
 * `slice` spezzava a metà un'emoji in fondo al taglio, la pagina mostrava "�" e React segnalava un errore di idratazione.
 */
export const shorten = (s: string, max: number) => {
  const chars = Array.from(s);
  return chars.length > max ? `${chars.slice(0, max).join("").trimEnd()}…` : s;
};

/** Quel poco che serve all'elenco: lo soddisfano sia le carte del database sia quelle inserite a mano. */
type CardLike = {
  name: string;
  type?: Card["type"];
  thumb?: string;
  image?: string;
  art?: string;
  mana?: number;
  power?: number;
  health?: number;
  legendary?: boolean;
  alignment?: Card["alignment"];
  ability?: Card["ability"] | string;
};

/** Carte del mazzo per l'elenco: nome, miniatura, costo e testo dell'abilità, ordinate per costo come nel gioco. */
export function deckArt(slugs: string[], lookup: (slug: string) => CardLike | undefined, locale: Locale, d: Dictionary) {
  const typeLabel = { unit: d.common.unit, spell: d.common.spell, token: d.common.token } as const;
  const alignLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  return slugs
    .map((s) => {
      const c = lookup(s);
      return {
        name: c?.name ?? s,
        thumb: c?.thumb,
        image: c?.image,
        art: c?.art,
        mana: c?.mana,
        power: c?.power,
        health: c?.health,
        legendary: Boolean(c?.legendary),
        typeLabel: c?.type ? typeLabel[c.type] : undefined,
        alignment: c?.alignment,
        alignmentLabel: c?.alignment ? alignLabel[c.alignment] : undefined,
        // le carte del database hanno il testo nelle due lingue, quelle inserite a mano non ce l'hanno affatto
        ability: typeof c?.ability === "string" ? c.ability : c?.ability?.[locale],
      };
    })
    .sort((a, b) => (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name));
}

type Winrates = { lists: Map<string, { wins: number; games: number }> } | null;

/**
 * Le righe dei mazzi della community nell'ordine in cui arrivano. `gameCodes`: codice del gioco per slug (null quando una
 * carta non ha l'ID ufficiale, sempre per i mazzi theory craft); `popularity` null senza la migrazione dei preferiti;
 * `winrates` null quando il win rate delle liste non si mostra.
 */
export function communityExplorerDecks({
  decks,
  locale,
  d,
  gameCodes,
  popularity,
  creators,
  winrates,
}: {
  decks: CommunityDeck[];
  locale: Locale;
  d: Dictionary;
  gameCodes: Map<string, string | null>;
  popularity: Map<string, DeckPopularity> | null;
  creators: ReturnType<typeof creatorIndex>;
  winrates: Winrates;
}): ExplorerDeck[] {
  return decks.map((deck) => {
    const leg = deck.legendary ? getCard(deck.legendary) : undefined;
    const legCustom = !leg ? deck.custom_cards.find((x) => x.slug === deck.legendary) : undefined;
    const patch = patchAt(deckCardsDate(deck));
    return {
      slug: `community-${deck.slug}`,
      // copie del codice dall'elenco nelle statistiche dell'autore (pacchetto STATS)
      statsSlug: deck.slug,
      name: deck.name,
      href: href(locale, `/decks/community/${deck.slug}`),
      // riassunto nella lingua della pagina quando la traduzione del sito c'è (25/09/2026), altrimenti quello dell'autore;
      // senza i segni della formattazione (22/10/2026)
      tagline: shorten(stripMarkdown(localizedGuide(deck, locale).text.summary), 140),
      legendary: leg
        ? { slug: leg.slug, name: leg.name, href: href(locale, `/cards/${leg.slug}`), cover: leg.cover, thumb: leg.thumb, image: leg.image, mana: leg.mana }
        : legCustom
          ? { slug: legCustom.slug, name: legCustom.name }
          : undefined,
      // artwork della Leggendaria dei Creator e dello Staff (29/09/2026): solo se il ruolo c'è ancora
      art: deckArtUrl(deck, supabaseUrl) ?? undefined,
      archetype: deck.archetype,
      archetypeLabel: archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype,
      publisher: authorName(deck.profile),
      source: "community",
      sourceLabel: d.common.community,
      cardNames: deck.cards.map((s) => getCard(s)?.name ?? deck.custom_cards.find((x) => x.slug === s)?.name ?? s),
      cardArt: deckArt(deck.cards, (s) => getCard(s) ?? deck.custom_cards.find((x) => x.slug === s), locale, d),
      code: gameCodes.get(deck.slug) ?? undefined,
      updated: deck.updated_at.slice(0, 10),
      // data di creazione e versione del gioco di quel giorno (richiesta di Pierluigi del 23/09/2026)
      created: deck.created_at.slice(0, 10),
      createdLabel: formatDate(locale, deck.created_at.slice(0, 10)),
      patchId: patch,
      patchLabel: patch ? patchLabel(patch, locale) : undefined,
      rating: deck.rating,
      ...(popularity ? { trend: popularity.get(deck.id)?.trend ?? 0, favorites: popularity.get(deck.id)?.favorites ?? 0 } : {}),
      // voto pesato per l'ordine "Più votati" dell'elenco (`ExplorerDeck.score`), lo stesso della classifica dei migliori
      // mazzi (Ondata 3): con la media semplice un solo voto da 5 stelle passava davanti al #1 della classifica
      score: deck.rating?.votes ? weightedRating(deck.rating.avg, deck.rating.votes) : 0,
      ...(() => {
        const key = deckListKey({ legendary: deck.legendary, cards: deck.cards }, (s) => getCard(s)?.key);
        const wr = key ? winrates?.lists.get(key) : undefined;
        return wr && wr.games > 0 ? { winrate: { wins: wr.wins, games: wr.games } } : {};
      })(),
      deckTypeLabels: deck.deck_types.map((t) => d.community.deckTypes[t as keyof typeof d.community.deckTypes] ?? t),
      // ruolo di chi l'ha pubblicato (27/09/2026): un tag che il codice non conosce vale community
      publisherBadge: d.community.badges[normalizeBadge(deck.profile?.badge)],
      publisherBadgeId: normalizeBadge(deck.profile?.badge),
      ...creatorExtras(creators, deck.owner),
    };
  });
}
