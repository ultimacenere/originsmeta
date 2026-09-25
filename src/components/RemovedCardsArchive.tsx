import Link from "next/link";
import { getDictionary, href, type Locale } from "@/lib/i18n";
import { cards, sagas, statLine, type Card, type SagaId } from "@/lib/data/cards";
import { CardName, legendaryFirst } from "./CardChip";

/**
 * Archivio delle carte non nella demo, in fondo a /cards (Ondata 1 SEO/GEO, 25/09/2026; decisione di Pierluigi: le
 * rimosse restano indicizzabili in tutte e tre le lingue, con un archivio su /cards).
 *
 * Perché: il database di /cards (CardExplorer) toglie le rimosse dall'HTML finché non si spunta la casella, quindi 80
 * schede su 86 per lingua non ricevevano link da nessuna pagina della loro lingua (solo dal cambio lingua e dalla
 * sitemap), anche se una decina ha già impressioni in Search Console. Qui l'elenco è renderizzato sul server, con un
 * link per carta alla scheda nella stessa lingua, dentro un <details> chiuso: resta compatto per chi legge e i link
 * sono comunque nell'HTML per i motori.
 *
 * Componente server senza stato; le etichette sono qui nelle tre lingue (niente dizionario da toccare), il resto
 * (saghe, "Leggendaria") viene dai dati e dai dizionari che il sito ha già.
 */

const labels: Record<Locale, { title: string; text: string }> = {
  en: {
    title: "Cards not in the demo",
    text: "These cards were removed in earlier builds and are not in Demo 2.0, so the deck builder does not accept them. Each one keeps its page, with the last known text and stats and the legend it comes from.",
  },
  it: {
    title: "Carte non nella demo",
    text: "Queste carte sono state rimosse nelle build precedenti e non sono nella Demo 2.0, quindi il deck builder non le accetta. Ognuna conserva la sua scheda, con l'ultimo testo e le ultime statistiche note e la leggenda da cui viene.",
  },
  es: {
    title: "Cartas fuera de la demo",
    text: "Estas cartas se retiraron en builds anteriores y no están en la Demo 2.0, así que el deck builder no las acepta. Cada una conserva su ficha, con el último texto y las últimas estadísticas conocidas y la leyenda de la que viene.",
  },
};

/** Ancora dell'archivio su /cards: le schede delle carte rimosse possono puntare qui. */
export const removedArchiveId = "not-in-demo";

export function RemovedCardsArchive({ locale }: { locale: Locale }) {
  const removed = cards.filter((c) => c.status === "removed");
  if (!removed.length) return null;
  const l = labels[locale];
  const legendaryLabel = getDictionary(locale).common.legendary;
  // Raggruppate per saga (in ordine alfabetico nella lingua della pagina), Leggendarie per prime, poi per nome
  const bySaga = new Map<SagaId, Card[]>();
  for (const c of removed) bySaga.set(c.saga, [...(bySaga.get(c.saga) ?? []), c]);
  const groups = [...bySaga.entries()]
    .map(([saga, list]) => ({
      saga,
      label: sagas[saga][locale],
      list: legendaryFirst(
        [...list].sort((a, b) => a.name.localeCompare(b.name)),
        (c) => Boolean(c.legendary),
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  return (
    <details id={removedArchiveId} className="card-night mt-10 p-5">
      <summary className="t-item cursor-pointer">
        {l.title} <span className="font-mono text-sm font-normal text-pale-muted">({removed.length})</span>
      </summary>
      <p className="mt-3 max-w-3xl text-sm text-pale-muted">{l.text}</p>
      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <section key={g.saga}>
            <h3 className="kicker text-chalk-muted">{g.label}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {g.list.map((c) => (
                <li key={c.slug}>
                  {/* prefetch spento: 86 link in un riquadro chiuso non devono scaricare 86 pagine */}
                  <Link href={href(locale, `/cards/${c.slug}`)} prefetch={false} className="btn btn-ghost text-xs">
                    <span>
                      <CardName name={c.name} legendary={c.legendary} legendaryLabel={legendaryLabel} />
                    </span>
                    {statLine(c) ? <span className="font-mono text-chalk-muted">{statLine(c)}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
