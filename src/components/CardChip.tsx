import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { getCard, statLine, type Card } from "@/lib/data/cards";
import { initials, sagaHue } from "@/lib/cardArt";

/**
 * Illustrazione della carta: `full` usa quella da 480 px ed è pensata per il riquadro grande della scheda
 * carta (immagine principale della pagina, quindi caricata subito); senza, si usa la copia da 160 px.
 */
export function CardArt({ card, className = "", full = false }: { card: Card; className?: string; full?: boolean }) {
  const src = full ? card.image : card.thumb ?? card.image;
  return (
    <span className={`card-chip-art ${full ? "card-chip-art-full" : ""} ${className}`} style={src ? undefined : { background: sagaHue[card.saga] ?? sagaHue.other }}>
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

/** Mini carta cliccabile: cornice, illustrazione (se disponibile), nome e statistiche. */
export function CardChip({ slug, locale }: { slug: string; locale: Locale }) {
  const card = getCard(slug);
  if (!card) return null;
  const stats = statLine(card);
  return (
    <Link href={href(locale, `/cards/${card.slug}`)} className="card-chip" title={card.name}>
      <CardArt card={card} />
      <span className="min-w-0">
        <span className="block truncate font-display text-[0.8rem] font-bold leading-tight text-sky">{card.name}</span>
        <span className="block font-mono text-[11px] text-pale-muted">
          {card.legendary ? "★ " : ""}
          {stats || "—"}
        </span>
      </span>
    </Link>
  );
}

export function CardChipList({ slugs, locale, max }: { slugs: string[]; locale: Locale; max?: number }) {
  const list = max ? slugs.slice(0, max) : slugs;
  return (
    <ul className="flex flex-wrap gap-2">
      {list.map((s) => (
        <li key={s}>
          <CardChip slug={s} locale={locale} />
        </li>
      ))}
      {max && slugs.length > max ? <li className="self-center font-mono text-xs text-chalk-muted">+{slugs.length - max}</li> : null}
    </ul>
  );
}
