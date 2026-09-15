import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { getCard, statLine, type Card } from "@/lib/data/cards";
import { initials, sagaHue } from "@/lib/cardArt";

export function CardArt({ card, className = "" }: { card: Card; className?: string }) {
  return (
    <span className={`card-chip-art ${className}`} style={card.image ? undefined : { background: sagaHue[card.saga] ?? sagaHue.other }}>
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.image} alt="" loading="lazy" />
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
        <span className="block truncate font-display text-[0.8rem] font-bold leading-tight text-mint">{card.name}</span>
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
