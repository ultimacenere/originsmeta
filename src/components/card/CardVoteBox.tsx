import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Card } from "@/lib/data/cards";
import { tierTone } from "@/lib/tiercode";
import { CARD_RANKED_MIN_VOTES, fillVoteText } from "@/lib/cardVotes";
import { cardVoteLabels } from "@/lib/cardVoteLabels";
import type { CardVotesData } from "@/lib/community/cardVotes";
import { CardVote } from "@/components/CardVote";

/**
 * Riquadro "Voti alle carte" della scheda carta (06/10/2026): il widget per votare da 1 a 10, media e voti dalla cache
 * condivisa delle schede (`loadCardRatings`, un'ora), la fascia nella tier list dei voti quando la carta ce l'ha e il
 * link alla pagina. `data` null = community spenta o migrazione non ancora applicata: il widget dice che i voti non sono
 * attivi (e durante la build, con una lettura fallita, la scheda esce così e si rimette alla prima rigenerazione).
 */
export function CardVoteBox({ card, locale, data, loginHref }: { card: Pick<Card, "slug" | "name">; locale: Locale; data: CardVotesData | null; loginHref: string }) {
  const l = cardVoteLabels[locale];
  const rating = data?.ratings[card.slug];
  return (
    <aside className="card-night mt-10 p-5" aria-labelledby="card-votes-title">
      <p id="card-votes-title" className="kicker text-mint">
        {l.cardPage.kicker}
      </p>
      <p className="mt-2 text-pale">{fillVoteText(l.cardPage.text, { name: card.name })}</p>
      <div className="mt-4">
        <CardVote slug={card.slug} avg={rating?.avg ?? 0} votes={rating?.votes ?? 0} labels={l.widget} loginHref={loginHref} placement="card_page" locale={locale} available={data !== null} />
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-pale-muted">
        {rating?.tier ? (
          <span className="flex items-center gap-2">
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
