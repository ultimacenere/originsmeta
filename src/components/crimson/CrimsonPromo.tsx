import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import { getCard } from "@/lib/data/cards";
import { crimsonQualifiers } from "@/lib/data/crimsonCup";
import { fillCrimson as fmt, headlines, latestWithStats } from "@/lib/crimsonCup";
import { crimsonCupLabels } from "@/lib/crimsonCupLabels";
import { pct } from "@/lib/tracker/snapshot";
import { CardArt } from "@/components/analytics/parts";
import { CardName } from "@/components/CardChip";

/**
 * La fascia "Crimson Cup" di /analytics (20/10/2026): i tre fatti dell'ultima qualificazione con i numeri ufficiali di Koin
 * (la più bandita, la più portata, la carta più giocata) e il tasto verso /analytics/crimson-cup. Niente se nessuna
 * qualificazione ha ancora numeri.
 */
export function CrimsonPromo({ locale, legendaryLabel }: { locale: Locale; legendaryLabel: string }) {
  const q = latestWithStats(crimsonQualifiers);
  if (!q) return null;
  const L = crimsonCupLabels[locale].promo;
  const h = headlines(q.stats);
  const facts = [
    { kicker: L.banned, slug: h.mostBanned?.legendary, value: h.mostBanned ? pct(h.mostBanned.banRate, locale) : "" },
    { kicker: L.brought, slug: h.mostSubmitted?.legendary, value: h.mostSubmitted ? pct(h.mostSubmitted.share, locale) : "" },
    { kicker: L.card, slug: h.topCard?.card, value: h.topCard ? pct(h.topCard.share, locale) : "" },
  ].flatMap((f) => {
    const card = f.slug ? getCard(f.slug) : undefined;
    return card ? [{ ...f, card }] : [];
  });
  return (
    <section className="an-panel cc-promo an-reveal" aria-labelledby="cc-promo-h">
      <div>
        <span className="an-plate">
          <span>{L.plate}</span>
        </span>
        <h2 id="cc-promo-h" className="an-h2 mt-3">
          {L.title}
        </h2>
        <p>{fmt(L.text, { q: q.name })}</p>
        <Link href={href(locale, "/analytics/crimson-cup")} prefetch={false} className="btn btn-primary mt-4 inline-flex text-xs">
          {L.cta} →
        </Link>
      </div>
      <div className="cc-promo-facts">
        {facts.map((f) => (
          <div key={f.kicker} className="cc-promo-fact">
            <CardArt src={f.card.image} thumb={f.card.thumb} name={f.card.name} width={44} />
            <div className="min-w-0">
              <span className="kicker">{f.kicker}</span>
              <b>
                <CardName name={f.card.name} legendary={f.card.legendary} legendaryLabel={legendaryLabel} />
              </b>
              <span className="font-mono">{f.value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
