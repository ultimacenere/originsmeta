import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getGuide } from "@/lib/content/guides";
import type { NewsItem } from "@/lib/data/news";

type Props = { item: NewsItem; locale: Locale; dict: Dictionary };

/** News su un mazzo pubblicato sul sito (community o staff): `url` è un percorso interno senza prefisso lingua. */
export function isDeckNews(item: NewsItem): boolean {
  return item.source === "community" || item.source === "staff";
}

/** Dominio leggibile di un link esterno (senza "www."): serve a dire dove porta il link prima del clic. */
function linkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Link alla fonte di una news: esterno (post Steam, stampa) oppure interno al sito per le news sui mazzi
 * pubblicati qui (es. /decks/community/…). Sul link esterno l'etichetta porta anche il dominio
 * ("Fonte · steamcommunity.com →") così si sa dove si sta andando.
 */
export function NewsSourceLink({ item, locale, dict, className = "" }: Props & { className?: string }) {
  if (isDeckNews(item)) {
    return (
      <Link href={href(locale, item.url)} className={className}>
        {dict.common.openDeck} →
      </Link>
    );
  }
  const domain = linkDomain(item.url);
  return (
    <a href={item.url} rel="noopener" className={className}>
      {domain ? `${dict.common.source} · ${domain}` : dict.common.source} →
    </a>
  );
}

/** Etichetta della pill accanto alla data: Steam, Staff, Community o Fonte. */
export function newsSourceLabel(item: NewsItem, dict: Dictionary): string {
  if (item.source === "steam") return "Steam";
  if (item.source === "staff") return dict.community.badges.staff;
  return item.source === "community" ? dict.common.community : dict.common.source;
}

/**
 * Classi della pill accanto alla data. Lo staff porta il solo tag Staff, con gli stessi colori dei mazzi
 * (menta su testo scuro): niente pill "Community" accanto, come nella lista dei mazzi.
 */
export function newsSourceClass(item: NewsItem): string {
  if (item.source === "staff") return `${badgePill} ${badgeStyle.staff}`;
  const base = "stat-pill text-[11px] font-semibold uppercase";
  return item.source === "steam" ? `${base} pill-steam` : `${base} bg-night-3 text-pale`;
}

/** Etichetta della lista di carte: per i mazzi pubblicati qui sono le carte del mazzo, non quelle di un aggiornamento. */
export function newsCardsLabel(item: NewsItem, dict: Dictionary): string {
  return isDeckNews(item) ? dict.common.deckCards : dict.common.cardsMentioned;
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
