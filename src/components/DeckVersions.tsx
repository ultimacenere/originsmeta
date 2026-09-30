"use client";

import { useState } from "react";
import Link from "next/link";

/** Una carta da mostrare: il nome e, se è nel nostro database, la sua scheda. */
export type VersionCard = { name: string; href?: string };

/**
 * Una versione del mazzo già pronta da mostrare (testi e link li prepara la pagina, sul server): etichetta del selettore,
 * periodo, voti, carte e che cosa è cambiato rispetto alla versione di prima.
 */
export type VersionView = {
  n: number;
  current: boolean;
  label: string;
  when: string;
  rating: string;
  legendary: VersionCard | null;
  cards: VersionCard[];
  changes: { title: string; legendary: string | null; added: VersionCard[]; removed: VersionCard[] } | null;
  builderHref: string;
  builderLabel: string;
};

/**
 * Selettore delle versioni di un mazzo della community (pacchetto VERSIONI, 30/09/2026: "sistema per aggiornamento deck
 * con anche selettore della versione"). La scheda mostra sopra le carte in vigore; qui si sceglie una versione e se ne
 * vedono periodo, voti, carte e cambi. Tutto è già nell'HTML: il selettore cambia solo quale versione si vede.
 */
export function DeckVersions({ title, hint, currentTag, versions }: { title: string; hint: string; currentTag: string; versions: VersionView[] }) {
  const [selected, setSelected] = useState(versions[0]?.n ?? 1);
  const v = versions.find((x) => x.n === selected) ?? versions[0];
  if (!v) return null;
  const card = (c: VersionCard) =>
    c.href ? (
      <Link href={c.href} className="hover:text-mint hover:underline">
        {c.name}
      </Link>
    ) : (
      <span>{c.name} *</span>
    );
  return (
    <section aria-labelledby="deck-versions-title" className="mt-8 rounded-xl border-2 border-felt-line bg-night-2/60 p-4 sm:p-5">
      <h2 id="deck-versions-title" className="t-section">
        {title}
      </h2>
      <p className="mt-1 text-sm text-pale-muted">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={title}>
        {versions.map((x) => (
          <button
            key={x.n}
            type="button"
            aria-pressed={x.n === v.n}
            onClick={() => setSelected(x.n)}
            className={`stat-pill border-2 font-mono text-xs ${x.n === v.n ? "border-mint bg-mint text-ink" : "border-felt-line bg-night-3 text-pale hover:border-mint"}`}
          >
            {x.label}
            {x.current ? ` · ${currentTag}` : ""}
          </button>
        ))}
      </div>
      <div className="mt-4" aria-live="polite">
        <p className="font-mono text-xs text-pale-muted">
          {v.when} · {v.rating}
        </p>
        {v.changes ? (
          <div className="mt-3">
            <p className="kicker text-gold">{v.changes.title}</p>
            {v.changes.legendary ? <p className="mt-1 text-sm text-chalk">{v.changes.legendary}</p> : null}
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {v.changes.added.map((c) => (
                <li key={`+${c.name}`} className="text-mint">
                  + {card(c)}
                </li>
              ))}
              {v.changes.removed.map((c) => (
                <li key={`-${c.name}`} className="text-pale-muted line-through decoration-1">
                  − {card(c)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!v.current ? (
          <ul className="mt-3 flex flex-wrap gap-2 text-sm text-pale">
            {v.legendary ? <li className="stat-pill bg-gold text-ink">★ {card(v.legendary)}</li> : null}
            {v.cards.map((c) => (
              <li key={c.name} className="stat-pill bg-night-3">
                {card(c)}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3">
          <Link href={v.builderHref} className="btn btn-ink text-xs">
            {v.builderLabel}
          </Link>
        </p>
      </div>
    </section>
  );
}
