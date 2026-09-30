import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Card, Change, Stats } from "@/lib/data/cards";
import { sagaHue } from "@/lib/cardArt";

/**
 * "Prima e dopo" di una patch (30/09/2026, dal confronto con i siti concorrenti: uno mostra la carta vecchia e quella
 * nuova affiancate). Per ogni carta con statistiche cambiate: la stessa illustrazione due volte, con costo, Potenza e
 * Salute di prima e di dopo, e i valori cambiati evidenziati. Solo le modifiche con from/to (quelle dei testi restano
 * nella tabella sotto, con la nota): i dati sono quelli di card-history.ts, come nel resto di MetaShifting. Componente
 * server, niente JavaScript nel browser.
 */
const L: Record<Locale, { title: string; before: string; after: string; mana: string; power: string; health: string }> = {
  en: { title: "Before and after", before: "Before", after: "After", mana: "Cost", power: "Power", health: "Health" },
  it: { title: "Prima e dopo", before: "Prima", after: "Dopo", mana: "Costo", power: "Potenza", health: "Salute" },
  es: { title: "Antes y después", before: "Antes", after: "Después", mana: "Coste", power: "Poder", health: "Salud" },
};

type Item = { card: Card; change: Change };

const KEYS = ["mana", "power", "health"] as const;

/** Le modifiche che il riquadro sa disegnare: statistiche prima e dopo, con almeno un valore diverso. */
export function comparable(items: readonly Item[]): Item[] {
  return items.filter(({ change }) => change.from && change.to && KEYS.some((k) => change.from?.[k] !== change.to?.[k]));
}

function Face({ card, stats, other, label, labels, after }: { card: Card; stats: Stats; other: Stats; label: string; labels: (typeof L)["en"]; after: boolean }) {
  const src = card.thumb ?? card.image;
  /* il costo come la pastiglia di mana delle carte (cerchio menta), Potenza e Salute con i simboli del sito */
  const icon = { mana: "", power: "⚔️", health: "❤️" } as const;
  return (
    <div className="flex w-[92px] flex-col items-center gap-1">
      <span className="kicker text-[10px] text-pale-muted">{label}</span>
      <span
        className={`relative block aspect-[5/7] w-full overflow-hidden rounded-lg border-2 ${after ? "border-mint" : "border-night-3 opacity-75 grayscale-[40%]"}`}
        style={src ? undefined : { background: sagaHue[card.saga] ?? sagaHue.other }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : null}
      </span>
      <span className="flex flex-wrap justify-center gap-1 font-mono text-xs tabular">
        {KEYS.map((k) => {
          const v = stats[k];
          if (v === undefined) return null;
          const changed = v !== other[k];
          return (
            <span
              key={k}
              title={labels[k]}
              className={`${k === "mana" ? "rounded-full border border-mint px-1.5" : "rounded px-1"} ${changed ? (after ? "bg-gold font-bold text-ink" : "text-pale-muted line-through decoration-crimson/70") : "text-pale"}`}
            >
              {icon[k] ? <span aria-hidden="true">{icon[k]}</span> : null}
              <span className="sr-only">{labels[k]} </span>
              {v}
            </span>
          );
        })}
      </span>
    </div>
  );
}

export function PatchCompare({ items, locale }: { items: readonly Item[]; locale: Locale }) {
  const list = comparable(items);
  if (!list.length) return null;
  const t = L[locale];
  return (
    <div className="mt-4">
      <p className="kicker text-mint">{t.title}</p>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map(({ card, change }) => (
          <li key={`${card.slug}-${change.patch}`} className="rounded-xl border border-night-3 bg-night p-3">
            <Link href={href(locale, `/cards/${card.slug}`)} className="block text-center text-sm font-bold text-sky hover:underline">
              {card.name}
            </Link>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Face card={card} stats={change.from!} other={change.to!} label={t.before} labels={t} after={false} />
              <span aria-hidden="true" className="text-lg text-pale-muted">
                →
              </span>
              <Face card={card} stats={change.to!} other={change.from!} label={t.after} labels={t} after />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
