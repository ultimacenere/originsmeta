import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { getGuide } from "@/lib/content/guides";
import type { NewsItem } from "@/lib/data/news";

type Props = { item: NewsItem; locale: Locale; dict: Dictionary };

/**
 * Link alla fonte di una news: esterno (post Steam, stampa) oppure interno al sito per le news sui mazzi
 * della community (`source: "community"`, `url` è un percorso senza prefisso lingua, es. /decks/community/…).
 */
export function NewsSourceLink({ item, locale, dict, className = "" }: Props & { className?: string }) {
  if (item.source === "community") {
    return (
      <Link href={href(locale, item.url)} className={className}>
        {dict.common.openDeck} →
      </Link>
    );
  }
  return (
    <a href={item.url} rel="noopener" className={className}>
      {dict.common.source} →
    </a>
  );
}

/** Etichetta della pill accanto alla data: Steam, Community o Fonte. */
export function newsSourceLabel(item: NewsItem, dict: Dictionary): string {
  if (item.source === "steam") return "Steam";
  return item.source === "community" ? dict.common.community : dict.common.source;
}

/** Etichetta della lista di carte: per i mazzi della community sono le carte del mazzo, non quelle di un aggiornamento. */
export function newsCardsLabel(item: NewsItem, dict: Dictionary): string {
  return item.source === "community" ? dict.common.deckCards : dict.common.cardsMentioned;
}

/** Guide del sito collegate alla news (campo `guides`), nella lingua della pagina. */
export function NewsGuideLinks({ item, locale, dict }: Props) {
  const guides = (item.guides ?? []).map((s) => getGuide(locale, s)).filter((g) => g !== undefined);
  if (!guides.length) return null;
  return (
    <div className="mt-4">
      <p className="kicker mb-2 text-pale-muted">{dict.common.relatedGuides}</p>
      <ul className="space-y-1 text-sm">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={href(locale, `/guides/${g.slug}`)} className="text-mint hover:underline">
              {g.title} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
