import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { getCard } from "@/lib/data/cards";
import { cardImageAlt } from "@/lib/cardPage";

/**
 * Leggendaria del cuore sulla vetrina /u (pacchetto VETRINA; rifatta il 27/09/2026 su richiesta di Pierluigi: "rimuovi
 * tutte le scritte inutili, dai spazio alla carta, allargala e rendila più grande, solo l'artwork ci interessa"): la sola
 * illustrazione ufficiale (la finestra d'arte di /cards/art/<slug>.webp, la stessa della carta di gioco che disegniamo;
 * la carta intera se manca), grande, con la cornice oro delle Leggendarie. Il nome non si vede ma resta per chi usa un
 * lettore di schermo (alt e nome del link) e al passaggio del mouse (title); il clic apre la scheda della carta.
 * L'unica scritta è il credito, minuscolo in un angolo: la regola del materiale Koin (CLAUDE.md) vieta di togliere i
 * crediti degli illustratori, e la finestra d'arte non ha quello impresso sulla carta. È contenuto, non interfaccia.
 * Solo una Leggendaria attiva del database; con uno slug che non torna non mostra nulla.
 */
export function FavoriteLegendary({ slug, locale }: { slug: string | null; locale: Locale; legendaryLabel?: string }) {
  const card = slug ? getCard(slug) : undefined;
  if (!card || !card.legendary || card.status !== "active" || card.type === "token") return null;
  const src = card.art ?? card.image;
  if (!src) return null;
  const credit = card.credit?.illus ? `Ill. ${card.credit.illus} · © Koin Games` : "© Koin Games";
  return (
    <figure className="w-full shrink-0 sm:w-[340px]">
      <Link
        href={href(locale, `/cards/${card.slug}`)}
        prefetch={false}
        title={card.name}
        aria-label={card.name}
        className="relative block overflow-hidden rounded-[14px] border-[3px] border-gold bg-night-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={cardImageAlt(card, locale)} loading="lazy" decoding="async" className={`block w-full ${card.art ? "aspect-[560/437] object-cover" : "h-auto"}`} />
        <figcaption className="absolute right-1.5 bottom-1.5 rounded bg-night/75 px-1.5 py-0.5 text-[10px] leading-tight text-chalk-muted">{credit}</figcaption>
      </Link>
    </figure>
  );
}
