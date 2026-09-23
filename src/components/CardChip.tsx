import Link from "next/link";
import { getDictionary, href, type Locale } from "@/lib/i18n";
import { getCard, statLine, type Card } from "@/lib/data/cards";
import { initials, sagaHue } from "@/lib/cardArt";
import { CardPeek, hasPeek, type PeekCard } from "./CardPeek";
import { FlipCard, type FlipCardData, type FlipCardLabels } from "./FlipCard";

/**
 * Illustrazione della carta: `full` usa quella da 480 px ed è pensata per il riquadro grande della scheda
 * carta (immagine principale della pagina, quindi caricata subito); senza, si usa la copia da 160 px.
 */
export function CardArt({ card, className = "", full = false }: { card: Card; className?: string; full?: boolean }) {
  const src = full ? card.image : card.thumb ?? card.image;
  return (
    <span className={`card-chip-art ${card.legendary ? "is-legendary" : ""} ${full ? "card-chip-art-full" : ""} ${className}`} style={src ? undefined : { background: sagaHue[card.saga] ?? sagaHue.other }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={full ? card.name : ""} loading={full ? "eager" : "lazy"} fetchPriority={full ? "high" : undefined} decoding="async" />
      ) : (
        <span aria-hidden="true">{initials(card.name)}</span>
      )}
      {card.mana !== undefined ? <span className="mana">{card.mana}</span> : null}
    </span>
  );
}

/** Etichette di tipo e allineamento nella lingua della pagina, condivise da anteprima e carta che si gira. */
function cardLabels(card: Card, locale: Locale) {
  const c = getDictionary(locale).common;
  const typeLabel = { unit: c.unit, spell: c.spell, token: c.token } as const;
  const alignLabel = { good: c.good, evil: c.evil, neutral: c.neutral } as const;
  return { typeLabel: typeLabel[card.type], alignmentLabel: card.alignment ? alignLabel[card.alignment] : undefined };
}

/** Dati dell'anteprima al passaggio del mouse, con testo ed etichette nella lingua della pagina. */
function peekOf(card: Card, locale: Locale): PeekCard {
  return {
    name: card.name,
    legendary: card.legendary,
    mana: card.mana,
    power: card.power,
    health: card.health,
    image: card.image,
    thumb: card.thumb,
    ability: card.ability?.[locale],
    alignment: card.alignment,
    ...cardLabels(card, locale),
  };
}

/** Leggendarie per prime, il resto nell'ordine ricevuto (note del 22/09/2026: "★ Dorothy, ★ Wicked Stepmother, poi le altre"). */
export function legendaryFirst<T>(list: T[], isLegendary: (item: T) => boolean): T[] {
  return list
    .map((item, i) => ({ item, i, leg: isLegendary(item) }))
    .sort((a, b) => Number(b.leg) - Number(a.leg) || a.i - b.i)
    .map((x) => x.item);
}

/**
 * Nome di carta in una lista: la Leggendaria ha la stella gialla davanti (`.legendary-star`) e un testo per i
 * lettori di schermo, con lo stesso colore e la stessa misura delle altre carte (note del 22/09/2026: niente
 * più dimensione o colore diversi). Il colore lo decide chi lo usa.
 */
export function CardName({ name, legendary, legendaryLabel }: { name: string; legendary?: boolean; legendaryLabel: string }) {
  if (!legendary) return <>{name}</>;
  return (
    <>
      <span className="legendary-star" aria-hidden="true">
        ★
      </span>
      {name}
      <span className="sr-only"> ({legendaryLabel})</span>
    </>
  );
}

/**
 * Mini carta cliccabile: cornice, illustrazione (se disponibile), nome e statistiche.
 * Al passaggio del mouse apre l'anteprima della carta (`CardPeek`), come nel deck builder e nell'elenco dei
 * mazzi: così si legge una news o una guida senza aprire ogni carta. Il contenitore
 * `.deck-card-wrap` serve al posizionamento del pannello; su touch resta il tocco che porta alla scheda.
 */
export function CardChip({ slug, locale }: { slug: string; locale: Locale }) {
  const card = getCard(slug);
  if (!card) return null;
  const stats = statLine(card);
  const peek = peekOf(card, locale);
  const withPeek = hasPeek(peek);
  return (
    <span className={`deck-card-wrap max-w-full ${withPeek ? "has-peek" : ""}`}>
      <Link href={href(locale, `/cards/${card.slug}`)} className="card-chip min-w-0 flex-1" title={withPeek ? undefined : card.name}>
        <CardArt card={card} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[0.8rem] font-bold leading-tight text-sky">
            <CardName name={card.name} legendary={card.legendary} legendaryLabel={getDictionary(locale).common.legendary} />
          </span>
          <span className="block font-mono text-[11px] text-pale-muted">{stats || "—"}</span>
        </span>
      </Link>
      {withPeek ? <CardPeek card={peek} /> : null}
    </span>
  );
}

/** Lista di chip: ogni nome porta alla scheda della carta, Leggendarie per prime. */
export function CardChipList({ slugs, locale, max }: { slugs: string[]; locale: Locale; max?: number }) {
  const sorted = legendaryFirst(slugs, (s) => Boolean(getCard(s)?.legendary));
  const list = max ? sorted.slice(0, max) : sorted;
  return (
    <ul className="flex flex-wrap gap-2">
      {list.map((s) => (
        <li key={s} className="max-w-full">
          <CardChip slug={s} locale={locale} />
        </li>
      ))}
      {max && slugs.length > max ? <li className="self-center font-mono text-xs text-chalk-muted">+{slugs.length - max}</li> : null}
    </ul>
  );
}

/**
 * Dati della carta che si gira (`FlipCard`), nella lingua della pagina: gli stessi per il database /cards, la
 * scheda di un mazzo e /style, così il retro dice le stesse cose ovunque. Solo quello che serve, niente database
 * nel browser (CardExplorer li riceve già pronti dalla pagina).
 */
export function flipOf(card: Card, locale: Locale): FlipCardData {
  const c = getDictionary(locale).common;
  return {
    slug: card.slug,
    href: href(locale, `/cards/${card.slug}`),
    name: card.name,
    thumb: card.thumb,
    image: card.image,
    // il fondale serve solo senza illustrazione: niente stringa in più per ogni carta del database
    hue: card.thumb || card.image ? undefined : (sagaHue[card.saga] ?? sagaHue.other),
    initials: initials(card.name),
    mana: card.mana,
    power: card.power,
    health: card.health,
    legendary: Boolean(card.legendary),
    alignment: card.alignment,
    removed: card.status === "removed",
    removedLabel: c.removed,
    ability: card.ability?.[locale],
    ...cardLabels(card, locale),
  };
}

/** Etichette della carta che si gira, per il nome del link letto dai lettori di schermo. */
export function flipLabels(locale: Locale): FlipCardLabels {
  const c = getDictionary(locale).common;
  return { legendary: c.legendary, mana: c.mana, power: c.power, health: c.health };
}

/**
 * Griglia di carte intere che si girano, per la scheda di un mazzo (richiesta di Pierluigi del 22/09/2026: "come le
 * carte nella sezione Carte, più grandi"). Stessa carta (`FlipCard`) e stesse colonne del database /cards (2 sul
 * telefono, 3 su tablet, 4 dove la pagina è larga), così la carta ha la stessa misura e lo stesso comportamento.
 * Unica differenza: il nome sotto la carta c'è solo su touch (`foot="touch"`), col mouse sta sul retro.
 * Leggendaria per prima, poi le altre per costo e nome come nel gioco. Le carte fuori dal nostro database non ci
 * sono: le mostra la pagina a parte, con il loro nome.
 */
export function DeckCardGrid({ slugs, locale }: { slugs: string[]; locale: Locale }) {
  const list = slugs
    .map((s) => getCard(s))
    .filter((c): c is Card => c !== undefined)
    .sort((a, b) => Number(Boolean(b.legendary)) - Number(Boolean(a.legendary)) || (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name));
  if (!list.length) return null;
  const labels = flipLabels(locale);
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {list.map((card) => (
        <li key={card.slug} className="min-w-0">
          <FlipCard card={flipOf(card, locale)} labels={labels} foot="touch" />
        </li>
      ))}
    </ul>
  );
}
