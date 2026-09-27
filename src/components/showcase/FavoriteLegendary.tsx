import type { ReactNode } from "react";
import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { getCard } from "@/lib/data/cards";
import { cardImageAlt } from "@/lib/cardPage";

/** La Leggendaria del cuore da mostrare, o undefined (slug assente, carta rimossa, non Leggendaria, senza immagine). */
export function favoriteLegendaryCard(slug: string | null | undefined) {
  const card = slug ? getCard(slug) : undefined;
  if (!card || !card.legendary || card.status !== "active" || card.type === "token") return undefined;
  return card.image || card.art ? card : undefined;
}

/**
 * Leggendaria del cuore sulla vetrina /u (pacchetto VETRINA; rifatta il 27/09/2026 su richiesta di Pierluigi: "rimuovi
 * tutte le scritte inutili, dai spazio alla carta, allargala e rendila più grande", poi "voglio la carta intera"): la
 * carta ufficiale INTERA, grande, con i crediti impressi intatti (ILLUS // … e KOIN GAMES INC: la regola del materiale
 * Koin vieta di ritagliarli o coprirli, e così non serve un credito scritto). Nessun titolo né nome visibile: il nome
 * resta per chi usa un lettore di schermo (alt e nome del link) e al passaggio del mouse (title); il clic apre la scheda
 * della carta. Sotto la carta ci può stare un contenuto della pagina (`children`: il conteggio di mazzi e tier list).
 */
export function FavoriteLegendary({ slug, locale, children }: { slug: string | null; locale: Locale; children?: ReactNode }) {
  const card = favoriteLegendaryCard(slug);
  if (!card) return null;
  const src = card.image ?? card.art!;
  return (
    <figure className="mx-auto flex w-full max-w-[260px] shrink-0 flex-col items-center gap-2 sm:mx-0 sm:w-[240px]">
      <Link
        href={href(locale, `/cards/${card.slug}`)}
        prefetch={false}
        title={card.name}
        aria-label={card.name}
        className="block w-full overflow-hidden rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={cardImageAlt(card, locale)} loading="lazy" decoding="async" className="block h-auto w-full" />
      </Link>
      {children ? <figcaption className="text-center">{children}</figcaption> : null}
    </figure>
  );
}
