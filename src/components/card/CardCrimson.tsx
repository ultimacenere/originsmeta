import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { crimsonQualifiers } from "@/lib/data/crimsonCup";
import { cardCrimsonFacts, fillCrimson as fmt } from "@/lib/crimsonCup";
import { crimsonCupLabels, crimsonOrdinal } from "@/lib/crimsonCupLabels";
import { fmtInt, pct } from "@/lib/tracker/snapshot";

/**
 * "Nella Crimson Cup" sulle schede carta (20/10/2026, scelta di Pierluigi: "righe su carte e Leggendarie"): per ogni
 * qualificazione con i numeri ufficiali di Koin, il ban rate e i mazzi consegnati di una Leggendaria, o la quota dei mazzi
 * di una carta fra le più giocate. Le carte che le tabelle di Koin non nominano non mostrano niente: nessuna stima.
 */
export function CardCrimson({ slug, locale }: { slug: string; locale: Locale }) {
  const facts = cardCrimsonFacts(slug, crimsonQualifiers);
  if (!facts.length) return null;
  const L = crimsonCupLabels[locale].card;
  const P = (r: number) => pct(r, locale);
  const N = (n: number) => fmtInt(n, locale);
  return (
    <section className="card-night mt-10 p-6 sm:p-8" aria-labelledby="card-crimson-h">
      <p className="kicker text-mint">{L.source}</p>
      <h2 id="card-crimson-h" className="t-section mt-1">
        {L.title}
      </h2>
      <ul className="mt-3 space-y-2 text-pale">
        {facts.map((f) => (
          <li key={f.qualifier}>
            {f.kind === "legendary"
              ? fmt(L.legendary, {
                  q: f.qualifier,
                  p: P(f.banRate),
                  b: N(f.banned),
                  s: N(f.seen),
                  rank: crimsonOrdinal(f.banRank, locale),
                  count: N(f.count),
                  n: N(f.submitted),
                  share: P(f.share),
                }) + (f.deepest >= f.qualifyRound ? fmt(L.reached, { round: f.deepest }) : fmt(L.furthest, { round: f.deepest }))
              : fmt(L.card, { q: f.qualifier, p: P(f.share), n: N(f.decks), rank: crimsonOrdinal(f.rank, locale), count: N(f.count) })}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href={href(locale, "/analytics/crimson-cup")} prefetch={false} className="link-mint font-bold">
          {L.link} →
        </Link>
      </p>
    </section>
  );
}
