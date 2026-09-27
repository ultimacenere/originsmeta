import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { getCard } from "@/lib/data/cards";
import { cardImageAlt, cardLabels } from "@/lib/cardPage";
import { fillShowcase, showcaseLabels } from "@/lib/showcaseLabels";
import { CardName } from "@/components/CardChip";

/**
 * Leggendaria del cuore accanto al nome sulla vetrina /u (pacchetto VETRINA, 27/09/2026): la carta ufficiale intera, con
 * i crediti impressi intatti (mai ritagliata né coperta), più il credito scritto sotto con la formula delle schede carta
 * (`cardLabels[locale].creditText`: "Art by … · © Koin Games", "Illustrazione di … · © Koin Games"). È contenuto, come le
 * carte delle schede: il materiale Koin non si usa per l'interfaccia. Solo una Leggendaria attiva del database; con uno
 * slug che non torna (carta rimossa, dato scritto a mano) non mostra nulla. La cornice resta oro, il colore delle
 * Leggendarie, anche con un altro colore d'accento.
 */
export function FavoriteLegendary({ slug, locale, legendaryLabel }: { slug: string | null; locale: Locale; legendaryLabel: string }) {
  const card = slug ? getCard(slug) : undefined;
  if (!card || !card.legendary || card.status !== "active" || card.type === "token") return null;
  const L = showcaseLabels[locale].view;
  const cardHref = href(locale, `/cards/${card.slug}`);
  return (
    <figure className="flex shrink-0 items-center gap-3">
      <Link href={cardHref} prefetch={false} className="shrink-0">
        {card.image ? (
          <span className="card-chip-art card-chip-art-full is-legendary !h-[118px] !w-[84px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.image} alt={cardImageAlt(card, locale)} loading="lazy" decoding="async" />
          </span>
        ) : (
          <span className="flex h-[118px] w-[84px] items-center justify-center rounded-lg border-2 border-gold bg-night-3 font-display text-gold" aria-hidden="true">
            ★
          </span>
        )}
      </Link>
      <figcaption className="min-w-0 max-w-[12rem] text-xs">
        <span className="kicker block text-gold">{L.favorite}</span>
        <Link href={cardHref} prefetch={false} className="t-item mt-1 block text-sm leading-tight hover:text-mint">
          <CardName name={card.name} legendary legendaryLabel={legendaryLabel} />
        </Link>
        <span className="mt-1 block text-pale-muted">{card.credit?.illus ? fillShowcase(cardLabels[locale].creditText, { illus: card.credit.illus }) : "© Koin Games"}</span>
      </figcaption>
    </figure>
  );
}
