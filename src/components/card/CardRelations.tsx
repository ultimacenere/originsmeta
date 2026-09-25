import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Card } from "@/lib/data/cards";
import type { CardRelations as Relations } from "@/lib/cardSynergy";
import { cardLabels, cardList, fill, fillParts, partsText } from "@/lib/cardPage";
import { CardChipList } from "@/components/CardChip";
import { CardParts } from "./CardParts";

/**
 * Legami della carta con le altre carte, ricavati dai testi (SCHEDE-06, SCHEDE-12). Sostituisce i due riquadri di
 * prima, "Carte collegate" e "Richiamata da", che leggevano il campo `related` di World of Origins e davano dati
 * sbagliati sulle carte create (su Garlic "Richiamata da Van Helsing", il cui testo non nomina Garlic).
 * - Carte create: "Come si ottiene", con chi la genera passaggio per passaggio (Garlic ← Van Helsing's Tools ← Van
 *   Helsing) e le carte fuori dalla demo che la generavano; se nessun testo lo dice, lo si dice, con il collegamento di
 *   World of Origins dichiarato come tale.
 * - Altre carte: "Carte che genera", dal testo, con il passaggio successivo (Van Helsing → Van Helsing's Tools →
 *   Holy Water, Silver Bullet, Garlic, Wooden Stake).
 * - "Carte collegate (World of Origins)": i collegamenti del database che nessun testo spiega (Merlin ↔ Merlin's
 *   Prophecy), senza dire "genera": il legame può venire dal potere leggendario, non ancora letto nel gioco.
 */
export function CardRelations({ card, locale, rel }: { card: Pick<Card, "slug" | "name" | "type">; locale: Locale; rel: Relations<Card> }) {
  const l = cardLabels[locale];
  const slugs = (list: readonly Card[]) => list.map((c) => c.slug);
  const token = card.type === "token";
  const orphan = token && !rel.createdBy.length;
  const [created, ...createdNext] = rel.creates;
  return (
    <>
      {token ? (
        <section className="mt-10" id="how-to-get">
          <h2 className="t-section">{l.howToGet}</h2>
          {orphan ? (
            <div className="mt-4 space-y-3">
              <p className="text-pale">{l.noCreator}</p>
              {rel.linked.length ? (
                <div>
                  <p className="kicker text-chalk-muted">{l.linkedBy}</p>
                  <div className="mt-2">
                    <CardChipList slugs={slugs(rel.linked)} locale={locale} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {rel.createdBy.map((level, i) => (
                <div key={i}>
                  <p className="kicker text-chalk-muted">{i === 0 ? l.createdBy : l.createdByNext}</p>
                  <div className="mt-2">
                    <CardChipList slugs={slugs(level)} locale={locale} />
                  </div>
                </div>
              ))}
              {rel.createdByEarlier.length ? (
                <div>
                  <p className="kicker text-chalk-muted">{l.createdByEarlier}</p>
                  <div className="mt-2">
                    <CardChipList slugs={slugs(rel.createdByEarlier)} locale={locale} />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {created?.length ? (
        <section className="mt-10">
          <h2 className="t-section">{l.creates}</h2>
          <p className="mt-2 text-sm text-pale-muted">{l.createsIntro}</p>
          <div className="mt-4">
            <CardChipList slugs={slugs(created)} locale={locale} />
          </div>
          {createdNext.map((level, i) => {
            const before = i === 0 ? created : createdNext[i - 1];
            return (
              <div key={i} className="mt-4">
                <p className="kicker text-chalk-muted">{before.length === 1 ? fill(l.createsNextOne, { name: before[0].name }) : l.createsNextMany}</p>
                <div className="mt-2">
                  <CardChipList slugs={slugs(level)} locale={locale} />
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {rel.linked.length && !orphan ? (
        <section className="mt-10">
          <h2 className="t-section">{l.linked}</h2>
          <p className="mt-2 text-sm text-pale-muted">{l.linkedIntro}</p>
          <div className="mt-4">
            <CardChipList slugs={slugs(rel.linked)} locale={locale} />
          </div>
        </section>
      ) : null}
    </>
  );
}

/**
 * Carte create: al posto dell'invito al deck builder, che non le accetta (SCHEDE-04, CARDS-09), l'invito a costruire
 * un mazzo con la carta della demo che le genera, con il link alla sua scheda e al deck builder.
 */
export function CardRootCta({ card, locale, roots, builderLabel }: { card: Pick<Card, "slug" | "name">; locale: Locale; roots: readonly Card[]; builderLabel: string }) {
  if (!roots.length) return null;
  const l = cardLabels[locale];
  return (
    <section className="card-night mt-10 p-6 sm:p-8">
      <h2 className="t-section">{fill(l.buildRoot, { roots: partsText(cardList(roots, locale, true)) })}</h2>
      <p className="mt-2 max-w-2xl text-pale">
        <CardParts parts={fillParts(l.buildRootText, { name: { card: card.slug, text: card.name }, roots: cardList(roots, locale, true) })} locale={locale} self={card.slug} />
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {roots.map((c) => (
          <Link key={c.slug} href={href(locale, `/cards/${c.slug}`)} className="btn btn-ghost">
            {c.name}
          </Link>
        ))}
        <Link href={href(locale, "/deck-builder")} className="btn btn-primary">
          {builderLabel}
        </Link>
      </div>
    </section>
  );
}
