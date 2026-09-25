import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Card } from "@/lib/data/cards";
import { COMMUNITY_MIN_LISTS } from "@/lib/tierstats";
import type { CommunityScores } from "@/lib/community/decksByCard";
import { cardLabels, fill, type BriefItem } from "@/lib/cardPage";
import { CardParts } from "./CardParts";

/**
 * "In breve" (SCHEDE-10): 2–3 domande con le risposte ricavate dai dati (`cardBrief` di `cardPage.ts`), in un elenco
 * di definizioni visibile. Niente FAQPage: Google non mostra più i rich result FAQ dal 7 maggio 2026, e 690 blocchi di
 * domande con lo stesso schema nei dati strutturati sembrerebbero riempitivo. Il testo serve a chi legge e agli
 * assistenti, che citano già le schede.
 */
export function CardBrief({ card, locale, items }: { card: Pick<Card, "slug">; locale: Locale; items: readonly BriefItem[] }) {
  if (!items.length) return null;
  return (
    <section className="card-night mt-10 p-6 sm:p-8" aria-labelledby="card-brief">
      <h2 id="card-brief" className="t-section">
        {cardLabels[locale].brief}
      </h2>
      <dl className="mt-4 space-y-4">
        {items.map((it) => (
          <div key={it.q}>
            <dt className="font-bold text-sky">{it.q}</dt>
            <dd className="mt-1 text-pale">
              <CardParts parts={it.a} locale={locale} self={card.slug} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Punteggio della tier list della community sulla scheda (SCHEDE-11), dietro la stessa soglia della pagina
 * /tier-list/community (`COMMUNITY_MIN_LISTS`, non una copia): sotto le 5 liste del suo tipo (Leggendarie o carte
 * base) sarebbe l'opinione di una o due persone presentata come consenso, quindi al suo posto c'è l'invito a
 * /tier-list/create con il conto delle liste. Sopra la soglia: fascia, media e voti della carta. Niente AggregateRating:
 * la fascia è un giudizio di gioco, non una recensione. `scores` null (lettura non riuscita): solo l'invito.
 */
export function CardCommunityScore({ card, locale, scores }: { card: Pick<Card, "slug" | "name" | "legendary">; locale: Locale; scores: CommunityScores | null }) {
  const l = cardLabels[locale];
  const kind = scores?.[card.legendary ? "legendaries" : "cards"];
  const score = kind?.scores[card.slug];
  const above = kind !== undefined && kind.lists >= COMMUNITY_MIN_LISTS;
  const avg = score ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score.avg) : "";
  return (
    <aside className="card-night mt-10 p-5">
      <p className="kicker text-mint">{l.community}</p>
      {above ? (
        <p className="mt-2 text-pale">
          {score ? fill(score.votes === 1 ? l.communityScoreOne : l.communityScore, { tier: score.tier, avg, votes: score.votes }) : l.communityUnranked}{" "}
          <Link href={href(locale, "/tier-list/community")} className="link-mint">
            {l.communityOpen} →
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-pale">
          {fill(l.communityInvite, { name: card.name, min: COMMUNITY_MIN_LISTS })}
          {kind ? fill(l.communitySoFar, { n: kind.lists }) : ""}.{" "}
          <Link href={href(locale, "/tier-list/create")} className="link-mint">
            {l.communityCta} →
          </Link>
        </p>
      )}
    </aside>
  );
}
