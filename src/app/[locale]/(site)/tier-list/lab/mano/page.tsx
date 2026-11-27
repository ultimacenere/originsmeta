import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { loadLabData } from "@/lib/tierLab/data";
import { ManoTable } from "@/components/tierLab/mano/ManoTable";
import { Dossier, type DossierCtx } from "@/components/tierLab/mano/Dossier";
import { dayMonth, num } from "@/components/tierLab/mano/text";

/**
 * Prototipo 1 della tier list (27/11/2026, branch claude/tierlist-lab, noindex): «La mano del meta». Le 12 Leggendarie
 * come carte del gioco tenute in mano, una mano per fascia; l'ispezione mostra il fascicolo sul retro della carta.
 * Tutto il testo che conta (fasce, numeri, perché, metodo, data) è nell'HTML del server: nelle carte, nel metodo e
 * nell'archivio dei fascicoli in fondo.
 */

export const revalidate = 300;

const PATH = "/tier-list/lab/mano";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return pageMeta(
    locale,
    PATH,
    "Tier list Leggendarie: la mano del meta",
    "Prototipo: le Leggendarie di Origins TCG come una mano di carte, una mano per fascia, con il fascicolo di ogni carta.",
    undefined,
    { noindex: true, languages: [] },
  );
}

export default async function ManoPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const data = await loadLabData(locale);
  const ctx: DossierCtx = {
    locale,
    readDay: dayMonth(locale, data.officialRead),
    officialPatch: data.officialPatch,
    patches: data.patches.map((p) => ({ id: p.id, day: dayMonth(locale, p.date) })),
    peers: Object.fromEntries(data.legendaries.map((l) => [l.slug, { name: l.name, thumb: l.thumb, href: l.href }])),
    trackerMissing: data.trackerMissing,
    total: data.legendaries.length,
  };
  const best = data.legendaries[0];
  const officialDay = ctx.patches.find((p) => p.id === data.officialPatch)?.day;

  return (
    <div className="tlm-page mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="t-page">Tier list delle Leggendarie: la mano del meta</h1>
      <p className="mt-1 text-sm">
        <Link href={href(locale, "/tier-list/lab")} className="text-mint hover:underline">
          Tutti i prototipi
        </Link>
      </p>

      <p className="tlm-answer">
        <span className="tlm-answer-main">
          La carta da battere è <a href={best.href}>{best.name}</a>, {best.official.tier === "unranked" ? "senza fascia" : `in fascia ${best.official.tier}`}.
        </span>{" "}
        <span className="tlm-answer-src">
          Fasce pubblicate il {data.officialReadLabel}, patch del {officialDay}: Tracker di OriginsMeta ({num(locale, data.officialGames)} partite) e Crimson Cup ·{" "}
          <a href="#metodo">come si calcola</a>
        </span>
      </p>
      <p className="tlm-hint">
        <span className="pen-note is-quiet">tocca una carta per guardarla da vicino</span>
      </p>

      <ManoTable legendaries={data.legendaries} ctx={ctx} />

      <section id="metodo" className="tlm-method" aria-labelledby="tlm-method-title">
        <h2 id="tlm-method-title" className="t-section">
          Come si calcola
        </h2>
        <p>
          Ogni partita registrata dal Tracker di OriginsMeta conta per tutte e due le Leggendarie in campo: per ognuna si calcolano il win rate e il suo
          intervallo al 95%, cioè quanto potrebbe essere nel caso migliore e nel caso peggiore.
        </p>
        <p>
          Fascia S se anche il bordo basso dell&apos;intervallo sta sopra il 50%; A dal 50%; B dal 45%; C dal 40%; D sotto. Una Leggendaria giocata troppo
          poco resta senza fascia.
        </p>
        <p>
          La Crimson Cup alza di una fascia, mai sopra la S, una Leggendaria bannata in almeno il 30% delle sue partite e arrivata in finale, se la carta non è
          cambiata dopo il torneo.
        </p>
        <p>
          Le fasce non si aggiornano da sole: le spiega <a href={data.officialNews}>la news della tier list</a>. Nel fascicolo di ogni carta, la parte «Dopo
          il {ctx.readDay}» è la stessa regola applicata ai numeri delle patch successive, non una fascia pubblicata.
        </p>
      </section>

      <details id="fascicoli" className="tlm-archive" open>
        <summary>
          <h2 className="t-section">Le {data.legendaries.length} Leggendarie in testo</h2>
        </summary>
        <div className="tlm-archive-list">
          {data.legendaries.map((l) => (
            <article key={l.slug} id={`f-${l.slug}`} className="tlm-archive-item">
              <Dossier l={l} ctx={ctx} level={3} />
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}
