import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { patchChanges, patchOrder, patches, type Moved, type PatchId } from "@/lib/data/cards";
import { linkLabels } from "@/lib/linkLabels";
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
 * patch notes di una patch, l'elenco delle carte toccate con la modifica prima/dopo, il link alla scheda di ogni carta
 * e a MetaShifting, sulla sezione della patch. Stessi dati di MetaShifting (card-history.ts via cards.ts): niente
 * testo nuovo. Le patch notes del playtest (0.6.x) avevano solo il riassunto: con `notes` il blocco porta anche la
 * nota di ogni modifica e diventa il loro contenuto; dove il testo dell'articolo ha già la tabella si resta compatti.
 */
export function NewsPatchChanges({ patch, locale, dict: d, notes, className = "" }: { patch: PatchId; locale: Locale; dict: Dictionary; notes: boolean; className?: string }) {
  const items = patchItems(patch);
  if (!items.length) return null;
  const l = linkLabels[locale].patch;
  const count = new Set(items.map((m) => m.card.slug)).size;
  const alignmentLabel = { good: d.common.good, evil: d.common.evil, neutral: d.common.neutral } as const;
  return (
    <section className={className} aria-labelledby="news-patch">
      <h2 id="news-patch" className="t-section">
        {l.title}
      </h2>
      <p className="mt-2 text-sm text-pale-muted">{count === 1 ? l.introOne : l.introMany.replace("{n}", String(count))}</p>
      <ul className="mt-4 divide-y divide-felt-line/70">
        {items.map(({ card, change }) => (
          <li key={`${card.slug}-${change.patch}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3">
            <Link href={href(locale, `/cards/${card.slug}`)} className="min-w-0 font-bold text-sky hover:underline">
              <CardName name={card.name} legendary={card.legendary} legendaryLabel={d.common.legendary} />
            </Link>
            <ChangeChip kind={change.kind} label={d.common[change.kind === "deck" ? "rework" : change.kind]} />
            <span className="col-span-2 text-pale">
              {change.from && change.to ? (
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
            {notes ? <span className="col-span-2 text-sm text-pale-muted">{change.note[locale]}</span> : null}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href={`${href(locale, "/metashifting")}#patch-${patch}`} className="link-mint font-bold">
          {l.metashifting} →
        </Link>
      </p>
    </section>
  );
}
