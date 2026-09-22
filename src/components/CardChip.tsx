import Link from "next/link";
import { getDictionary, href, type Locale } from "@/lib/i18n";
import { getCard, statLine, type Card } from "@/lib/data/cards";
import { initials, sagaHue } from "@/lib/cardArt";
import { CardPeek, hasPeek, type PeekCard } from "./CardPeek";

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

/** Dati dell'anteprima al passaggio del mouse, con testo ed etichette nella lingua della pagina. */
function peekOf(card: Card, locale: Locale): PeekCard {
  const c = getDictionary(locale).common;
  const typeLabel = { unit: c.unit, spell: c.spell, token: c.token } as const;
  const alignLabel = { good: c.good, evil: c.evil, neutral: c.neutral } as const;
  return {
    name: card.name,
    legendary: card.legendary,
    mana: card.mana,
    power: card.power,
    health: card.health,
    image: card.image,
    thumb: card.thumb,
    ability: card.ability?.[locale],
    typeLabel: typeLabel[card.type],
    alignment: card.alignment,
    alignmentLabel: card.alignment ? alignLabel[card.alignment] : undefined,
  };
}

/**
 * Mini carta cliccabile: cornice, illustrazione (se disponibile), nome e statistiche.
 * Al passaggio del mouse apre l'anteprima della carta (`CardPeek`), come nel deck builder e nell'elenco dei
 * mazzi: così si legge un mazzo, una news o una guida senza aprire ogni carta. Il contenitore
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
          <span className="block truncate font-display text-[0.8rem] font-bold leading-tight text-sky">{card.name}</span>
          <span className="block font-mono text-[11px] text-pale-muted">
            {card.legendary ? "★ " : ""}
            {stats || "—"}
          </span>
        </span>
      </Link>
      {withPeek ? <CardPeek card={peek} /> : null}
    </span>
  );
}

export function CardChipList({ slugs, locale, max }: { slugs: string[]; locale: Locale; max?: number }) {
  const list = max ? slugs.slice(0, max) : slugs;
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
