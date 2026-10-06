import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Card } from "@/lib/data/cards";
import { tierTone } from "@/lib/tiercode";
import { CARD_RANKED_MIN_VOTES, fillVoteText } from "@/lib/cardVotes";
import { cardVoteLabels } from "@/lib/cardVoteLabels";
import type { CardVotesData } from "@/lib/community/cardVotes";
import { CardVote } from "@/components/CardVote";

/**
 * "Voti alle carte" sotto la carta nella sua scheda (06/10/2026; dal 7/10 nella colonna della carta, Pierluigi: "subito
 * sotto la carta la possibilità del voto"): il widget compatto per votare da 1 a 10, media e voti dalla cache condivisa
 * delle schede (`loadCardRatings`, un'ora), la fascia nella tier list dei voti quando la carta ce l'ha e il link alla
 * pagina. `data` null (community spenta, migrazione non applicata o lettura fallita in build): il widget vota lo stesso
 * e mostra i numeri della risposta; i tasti non dipendono dai dati della pagina.
 */
export function CardVoteBox({ card, locale, data, loginHref }: { card: Pick<Card, "slug" | "name">; locale: Locale; data: CardVotesData | null; loginHref: string }) {
  const l = cardVoteLabels[locale];
  const rating = data?.ratings[card.slug];
  return (
    <aside className="w-full max-w-[230px]" aria-labelledby="card-votes-title">
      <p id="card-votes-title" className="kicker text-mint">
        {l.cardPage.kicker}
      </p>
      <div className="mt-2">
        <CardVote slug={card.slug} avg={rating?.avg ?? 0} votes={rating?.votes ?? 0} labels={l.widget} loginHref={loginHref} placement="card_page" locale={locale} compact />
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-snug text-pale-muted">
        {rating?.tier ? (
          <span className="flex items-center gap-1.5">
            <span className={`tier-letter is-small ${tierTone[rating.tier]}`}>{rating.tier}</span>
            {fillVoteText(l.cardPage.tier, { tier: rating.tier })}
          </span>
        ) : rating ? (
          <span>{fillVoteText(l.explorer.needMore, { min: CARD_RANKED_MIN_VOTES, n: rating.votes })}</span>
        ) : null}
        <Link href={href(locale, "/tier-list/votes")} className="link-mint font-bold">
          {l.cardPage.open} →
        </Link>
      </p>
    </aside>
  );
}
