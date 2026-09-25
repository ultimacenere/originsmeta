import Link from "next/link";
import { formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import { getCard, patchAt, patchLabel, type Card } from "@/lib/data/cards";
import { archetypeLabels } from "@/lib/data/decks";
import { weightedRating } from "@/lib/tierstats";
import type { TierDeckEntry } from "@/lib/tierTypes";
import type { Companion, DeckRef } from "@/lib/cardSynergy";
import { cardLabels, cardList, fill, fillParts, itDei } from "@/lib/cardPage";
import { TierDeckList } from "@/components/TierDecks";
import { CardChip, legendaryFirst } from "@/components/CardChip";
import { CardParts } from "./CardParts";

/**
 * Mazzi pubblicati sulla scheda carta (SCHEDE-02, DECKS-04, COMP-03): "Mazzi guidati da Merlin", "Mazzi con Spellbook".
 * Prima la sezione leggeva `decks.ts`, vuoto dal 15/09/2026, e puntava alla rotta vecchia dei mazzi: non compariva
 * mai, e nessuna delle 690 schede linkava un mazzo della community.
 * Le voci sono quelle della tier list (`TierDeckList`: Leggendaria, nome, archetipo, autore con il tag, voto), nello
 * stesso ordine (voto pesato, poi i più recenti). Si linkano solo i mazzi la cui pagina è indicizzabile nella lingua
 * della scheda, al massimo `MAX_DECKS` (`listedDecks` di cardSynergy.ts, la stessa funzione del JSON-LD e delle date);
 * quanti restano fuori lo dice una riga, con il link all'elenco di tutti i mazzi. Il conto "in n dei N mazzi" sta
 * nella frase d'attacco e non si ripete qui (revisione del 25/09/2026): qui c'è come sono ordinati e che cosa vuol
 * dire il conto.
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

export function CardDecks({
  locale,
  dict,
  title,
  listed,
  others,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  /** i mazzi da elencare, già scelti e ordinati (`listedDecks`) */
  listed: readonly DeckRef[];
  /** mazzi con la carta non elencati qui: noindex in questa lingua o oltre il tetto */
  others: number;
}) {
  const l = cardLabels[locale];
  if (!listed.length && !others) return null;
  return (
    <section className="mt-10" id="decks">
      <h2 className="t-section">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-pale-muted">
        {l.decksNote}{" "}
        <Link href={href(locale, "/tier-list/most-played")} className="link-mint">
          {l.mostPlayed} →
        </Link>
      </p>
      {listed.length ? (
        <div className="mt-4">
          <TierDeckList decks={listed.map((deck) => deckEntry(deck, locale, dict))} dict={dict} locale={locale} />
        </div>
      ) : null}
      {others ? (
        <p className="mt-3 text-sm text-pale-muted">
          {others === 1 ? l.moreDecksOne : fill(l.moreDecksMany, { n: others })}{" "}
          <Link href={href(locale, "/decks")} className="link-mint">
            {l.allDecks} →
          </Link>
        </p>
      ) : null}
    </section>
  );
}

/**
 * Carte create: "Mazzi che generano Garlic". Solo il conto dei mazzi pubblicati con la carta della demo che la genera
 * (Van Helsing) e il link alla sezione dei mazzi della sua scheda, non l'elenco: la stessa lista su cinque schede
 * (Van Helsing's Tools, Garlic, Holy Water, Silver Bullet, Wooden Stake) sarebbe un blocco ripetuto, e la scheda di
 * Van Helsing's Tools finirebbe per contendere alla Leggendaria la ricerca "van helsing origins tcg" (SCHEDE-06).
 */
export function CardRootDecks({ locale, title, roots, decks }: { locale: Locale; title: string; roots: readonly Card[]; decks: number }) {
  const l = cardLabels[locale];
  if (!roots.length || !decks) return null;
  const count = fillParts(decks === 1 ? l.tokenDecksOne : l.tokenDecksMany, { n: decks, roots: cardList(roots, locale, true) });
  return (
    <section className="mt-10" id="decks">
      <h2 className="t-section">{title}</h2>
      <p className="mt-2 max-w-3xl text-pale">
        <CardParts parts={count} locale={locale} />
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {roots.map((root) => (
          <li key={root.slug}>
            <Link href={`${href(locale, `/cards/${root.slug}`)}#decks`} className="link-mint font-bold">
              {fill(root.legendary ? l.decksLed : l.decksWith, { name: root.name })} →
            </Link>
          </li>
        ))}
      </ul>
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
  // {dei} solo nell'etichetta delle Leggendarie ("degli 8 mazzi guidati da…"): davanti a "suoi" resta "dei"
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
