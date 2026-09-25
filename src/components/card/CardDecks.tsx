import Link from "next/link";
import { formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import { getCard, patchAt, patchLabel, type Card } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { weightedRating } from "@/lib/tierstats";
import type { TierDeckEntry } from "@/lib/tierTypes";
import type { Companion, DeckRef } from "@/lib/cardSynergy";
import { cardLabels, deckSentence, fill, itDei, type DeckCount } from "@/lib/cardPage";
import { TierDeckList } from "@/components/TierDecks";
import { CardChip, legendaryFirst } from "@/components/CardChip";

/**
 * Mazzi pubblicati sulla scheda carta (SCHEDE-02, DECKS-04, COMP-03): "Mazzi guidati da Merlin", "Mazzi con Spellbook",
 * "Mazzi che generano Garlic". Prima la sezione leggeva `decks.ts`, vuoto dal 15/09/2026, e puntava alla rotta vecchia
 * dei mazzi: non compariva mai, e nessuna delle 690 schede linkava un mazzo della community.
 * Le voci sono quelle della tier list (`TierDeckList`: Leggendaria, nome, archetipo, autore con il tag, voto), nello
 * stesso ordine (voto pesato, poi i più recenti). Si linkano solo i mazzi la cui pagina è indicizzabile nella lingua
 * della scheda; quanti restano fuori lo dice una riga, con il link all'elenco di tutti i mazzi.
 */

/** Un `DeckRef` nella forma delle voci della tier list, nella lingua della pagina. */
export function deckEntry(deck: DeckRef, locale: Locale, d: Dictionary): TierDeckEntry {
  const leg = deck.legendary ? getCard(deck.legendary) : undefined;
  const created = deck.created.slice(0, 10);
  const patch = patchAt(deck.created);
  return {
    slug: deck.slug,
    name: deck.name,
    href: href(locale, `/decks/community/${deck.slug}`),
    legendary: leg ? { slug: leg.slug, name: leg.name, thumb: leg.thumb } : undefined,
    archetype: deck.archetype,
    archetypeLabel: archetypeLabels[deck.archetype]?.[locale] ?? deck.archetype,
    creator: deck.author,
    badge: deck.badge,
    badgeLabel: d.community.badges[deck.badge as keyof typeof d.community.badges] ?? deck.badge,
    rating: deck.rating,
    score: weightedRating(deck.rating.avg, deck.rating.votes),
    created,
    createdLabel: formatDate(locale, created),
    patchLabel: patch ? patchLabel(patch, locale) : undefined,
  };
}

/** Quanti mazzi mostrare al massimo: oggi la carta più usata ne ha 9 su 16. */
const MAX_DECKS = 12;

export function CardDecks({
  card,
  locale,
  dict,
  title,
  count,
  shown,
  others,
  intro,
}: {
  card: Pick<Card, "type" | "legendary">;
  locale: Locale;
  dict: Dictionary;
  title: string;
  /** il conto per la riga "in n dei N mazzi"; assente per le carte create (i mazzi sono quelli della carta che le genera) */
  count?: DeckCount;
  shown: readonly DeckRef[];
  others: number;
  intro?: string;
}) {
  const l = cardLabels[locale];
  if (!shown.length && !others) return null;
  const list = shown.slice(0, MAX_DECKS);
  const hidden = others + (shown.length - list.length);
  return (
    <section className="mt-10" id="decks">
      <h2 className="t-section">{title}</h2>
      {count ? (
        <p className="mt-2 max-w-3xl text-sm text-pale-muted">
          {deckSentence(card, count, locale)} {l.popularity}{" "}
          <Link href={href(locale, "/tier-list/most-played")} className="link-mint">
            {l.mostPlayed} →
          </Link>
        </p>
      ) : intro ? (
        <p className="mt-2 max-w-3xl text-sm text-pale-muted">{intro}</p>
      ) : null}
      {list.length ? (
        <div className="mt-4">
          <TierDeckList decks={list.map((deck) => deckEntry(deck, locale, dict))} dict={dict} locale={locale} />
        </div>
      ) : null}
      {hidden ? (
        <p className="mt-3 text-sm text-pale-muted">
          {hidden === 1 ? l.moreDecksOne : fill(l.moreDecksMany, { n: hidden })}{" "}
          <Link href={href(locale, "/decks")} className="link-mint">
            {l.allDecks} →
          </Link>
        </p>
      ) : null}
    </section>
  );
}

/**
 * "Spesso nello stesso mazzo" (SCHEDE-12): le carte presenti insieme a questa in almeno 2 mazzi pubblicati, con il
 * conto ("in 2 su 2"). Calcolate da `companions` di `cardSynergy.ts` sugli stessi mazzi della sezione qui sopra:
 * nessuna sinergia scritta a mano. Leggendarie per prime, poi dalla più frequente.
 */
export function CardCompanions({
  card,
  locale,
  list,
  decks,
  min,
}: {
  card: Pick<Card, "name" | "legendary">;
  locale: Locale;
  list: readonly Companion[];
  /** mazzi pubblicati con la carta */
  decks: number;
  min: number;
}) {
  const l = cardLabels[locale];
  const known = list.filter((c) => getCard(c.slug));
  if (!known.length) return null;
  const sorted = legendaryFirst([...known], (c) => Boolean(getCard(c.slug)?.legendary));
  const intro = fill(card.legendary ? l.togetherIntroLed : l.togetherIntro, { name: card.name, min, n: decks, dei: itDei(decks) });
  return (
    <section className="mt-10">
      <h2 className="t-section">{l.together}</h2>
      <p className="mt-2 max-w-3xl text-sm text-pale-muted">{intro}</p>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c) => (
          <li key={c.slug} className="flex min-w-0 items-center gap-2">
            <CardChip slug={c.slug} locale={locale} />
            <span className="shrink-0 font-mono text-xs text-chalk-muted">{fill(l.togetherCount, { k: c.together, n: decks })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
