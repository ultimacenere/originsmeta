import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { patchChanges, patchOrder, patches, type Moved, type PatchId } from "@/lib/data/cards";
import { changeDetail, changeLabel, linkLabels, patchIntro } from "@/lib/linkLabels";
import { ChangeChip, StatDelta } from "./ChangeChip";
import { CardName } from "./CardChip";

/** La patch raccontata da una news: quella che la cita nel campo `news` (cards.ts), se c'è. */
export function patchOfNews(slug: string): PatchId | undefined {
  return patchOrder.find((id) => patches[id].news === slug);
}

/** Le modifiche di una patch, nell'ordine di MetaShifting (prima chi cambia statistiche, poi le Leggendarie…). */
export function patchItems(patch: PatchId): Moved[] {
  return patchChanges().find((g) => g.patch === patch)?.items ?? [];
}

/**
 * "Cosa cambia in questa patch" (Ondata 1 del piano SEO/GEO, 25/09/2026, rilievo NEWS-04): sulle news che sono le
 * patch notes di una patch, le carte toccate con il link alla scheda di ognuna e a MetaShifting, sulla sezione della
 * patch. Stessi dati di MetaShifting (card-history.ts via cards.ts): niente testo nuovo. Due versioni:
 * - `notes`: le patch notes del playtest (0.6.x) avevano solo il riassunto, quindi il blocco porta per ogni carta
 *   la modifica prima/dopo e la nota, e diventa il loro contenuto;
 * - senza `notes`: l'articolo ha già il suo testo con la tabella prima/dopo, e ripeterla sarebbe testo doppio nella
 *   stessa pagina; restano solo i nomi delle carte come link e il rimando a MetaShifting.
 * Gli scambi nei mazzi preimpostati del playtest (modifiche di tipo "deck") non sono modifiche della carta: pastiglia
 * "Cambio di mazzo", solo la nota, e nell'attacco si contano a parte (`patchIntro`, `changeLabel` e `changeDetail` in
 * linkLabels.ts, gli stessi di MetaShifting e delle schede carta).
 */
export function NewsPatchChanges({ patch, locale, dict: d, notes, className = "" }: { patch: PatchId; locale: Locale; dict: Dictionary; notes: boolean; className?: string }) {
  const items = patchItems(patch);
  if (!items.length) return null;
  const l = linkLabels[locale].patch;
  // una carta può avere più modifiche nella stessa patch (statistiche e allineamento): nell'elenco dei nomi compare una volta
  const cards = [...new Map(items.map((m) => [m.card.slug, m.card])).values()];
  const intro = patchIntro(items, locale);
  const alignmentLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  const cardLink = (card: Moved["card"], className: string) => (
    <Link href={href(locale, `/cards/${card.slug}`)} className={className}>
      <CardName name={card.name} legendary={card.legendary} legendaryLabel={d.common.legendary} />
    </Link>
  );
  return (
    <section className={className} aria-labelledby="news-patch">
      <h2 id="news-patch" className="t-section">
        {l.title}
      </h2>
      <p className="mt-2 text-sm text-pale-muted">{notes ? `${intro} ${l.numbers}` : intro}</p>
      {notes ? (
        <ul className="mt-4 divide-y divide-felt-line/70">
          {items.map(({ card, change }, i) => (
            <li key={`${card.slug}-${i}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3">
              {cardLink(card, "min-w-0 font-bold text-sky hover:underline")}
              <ChangeChip kind={change.kind} label={changeLabel(change.kind, locale, d.common)} />
              {/* Per gli scambi nei mazzi niente riga del prima/dopo: la carta non cambia, parla la nota */}
              {changeDetail(change) === "none" ? null : (
                <span className="col-span-2 text-pale">
                  {changeDetail(change) === "stats" ? (
                    <StatDelta from={change.from} to={change.to} />
                  ) : change.alignment ? (
                    <span className="font-mono text-sm">
                      <span className="text-pale-muted line-through decoration-crimson/70">{alignmentLabel[change.alignment.from]}</span>
                      <span className="mx-1.5 text-pale-muted">→</span>
                      <span className="font-semibold">{alignmentLabel[change.alignment.to]}</span>
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-pale-muted">{d.tier.textChange}</span>
                  )}
                </span>
              )}
              <span className="col-span-2 text-sm text-pale-muted">{change.note[locale]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {cards.map((card) => (
            <li key={card.slug}>{cardLink(card, "font-bold text-sky hover:underline")}</li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm">
        <Link href={`${href(locale, "/metashifting")}#patch-${patch}`} className="link-mint font-bold">
          {l.metashifting} →
        </Link>
      </p>
    </section>
  );
}
