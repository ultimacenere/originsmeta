import Link from "next/link";
import { formatDate, href, type Dictionary, type Locale } from "@/lib/i18n";
import { badgePill, badgeStyle } from "@/lib/cardArt";
import { getGuide } from "@/lib/content/guides";
import { newsPath, sortedNews, type NewsItem } from "@/lib/data/news";
import { newsForGuide } from "@/lib/relatedNews";
import { linkLabels } from "@/lib/linkLabels";
import { newTabProps } from "./SteamButton";

type Props = { item: NewsItem; locale: Locale; dict: Dictionary };

/** News su un mazzo pubblicato sul sito (community o staff): `url` è un percorso interno senza prefisso lingua. */
export function isDeckNews(item: NewsItem): boolean {
  return item.source === "community" || item.source === "staff";
}

/** Novità del sito raccontate da noi (`source: "site"`): la fonte è l'articolo stesso, quindi nessun link "Fonte". */
export function isSiteNews(item: NewsItem): boolean {
  return item.source === "site";
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
 * ("Fonte · steamcommunity.com →") così si sa dove si sta andando, e si apre in una nuova scheda: prima
 * ogni clic su una fonte chiudeva la visita al sito. `newTabProps` è la regola unica dei link esterni del sito
 * (SteamButton.tsx): nuova scheda, `noopener` e l'avviso per i lettori di schermo.
 */
export function NewsSourceLink({ item, locale, dict, className = "" }: Props & { className?: string }) {
  if (isSiteNews(item)) return null;
  if (isDeckNews(item)) {
    return (
      <Link href={href(locale, item.url)} className={className}>
        {dict.common.openDeck} →
      </Link>
    );
  }
  const domain = linkDomain(item.url);
  return (
    <a href={item.url} {...newTabProps} className={className}>
      {domain ? `${dict.common.source} · ${domain}` : dict.common.source} →
    </a>
  );
}

/**
 * Tasto "Apri il mazzo" delle news sui mazzi pubblicati sul sito, da mettere subito sotto la copertina
 * (richiesta della riunione del 21/09/2026: in fondo alla news il link non lo trovava nessuno).
 * Per le altre news non rende nulla, quindi si può mettere in ogni scheda senza controlli.
 */
export function NewsDeckButton({ item, locale, dict, className = "" }: Props & { className?: string }) {
  if (!isDeckNews(item)) return null;
  return (
    <Link href={href(locale, item.url)} className={`btn btn-primary ${className}`}>
      {dict.common.openDeck} →
    </Link>
  );
}

/** Etichetta della pill accanto alla data: Steam, Staff, Community, OriginsMeta o Fonte. */
export function newsSourceLabel(item: NewsItem, dict: Dictionary): string {
  if (item.source === "steam") return "Steam";
  if (item.source === "site") return "OriginsMeta";
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
  // le novità del sito nel menta del logo, con il testo scuro dei fondi pieni menta
  if (item.source === "site") return `${base} bg-mint text-ink`;
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
            <Link href={href(locale, `/guides/${g.slug}`)} className="link-mint">
              {g.title} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Il collegamento inverso di `NewsGuideLinks`, in fondo a una guida (Ondata 1 del piano SEO/GEO, 25/09/2026,
 * NEWS-03): le news che citano la guida nel campo `guides`, dalla più recente, al massimo cinque. Le guide
 * evergreen (Kickstarter, Next Fest, demo) portano così agli articoli datati che le aggiornano. Senza news, niente blocco.
 */
export function GuideNewsLinks({ guideSlug, locale }: { guideSlug: string; locale: Locale }) {
  const items = newsForGuide(guideSlug, sortedNews);
  if (!items.length) return null;
  return (
    <section className="mt-10" aria-labelledby="guide-news">
      <h2 id="guide-news" className="t-section">
        {linkLabels[locale].guideNews}
      </h2>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={href(locale, newsPath(item))} className="card-night card-night-hover flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4">
              <time dateTime={item.date} className="shrink-0 font-mono text-xs text-pale-muted">
                {formatDate(locale, item.date)}
              </time>
              <span className="t-item text-base leading-snug">{item.title[locale]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
