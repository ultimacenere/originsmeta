import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { loadLabData } from "@/lib/tierLab/data";
import { ReplayStage } from "@/components/tierLab/replay/ReplayStage";
import { ReplayTable } from "@/components/tierLab/replay/ReplayTable";
import { ReplayTabs } from "@/components/tierLab/replay/ReplayTabs";
import { buildReplay, fmtInt } from "@/components/tierLab/replay/frames";

/**
 * Prototipo 3 della tier list, «Il replay delle patch» (27/11/2026, branch claude/tierlist-lab, noindex): il meta delle
 * Leggendarie come una classifica in diretta che si muove patch dopo patch. Nell'HTML del server: la tier list
 * pubblicata del 9/11 (primo fotogramma del palco) e la tabella Leggendaria × fotogramma; il browser la anima.
 */

export const revalidate = 300;

const TITLE = "Tier list delle Leggendarie: il meta patch dopo patch";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return pageMeta(
    locale,
    "/tier-list/lab/replay",
    "Tier list: il replay delle patch",
    "Prototipo: le fasce delle Leggendarie di Origins TCG pubblicate il 9 novembre e la stessa regola sui numeri delle patch dopo, da guardare come un replay.",
    undefined,
    { noindex: true, languages: [] },
  );
}

export default async function ReplayPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const data = await loadLabData(locale);
  const replay = buildReplay(data);

  return (
    <div className="tlr-page mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <header className="tlr-intro">
        <h1 className="t-page text-sky">{TITLE}</h1>
        <Link href={href(locale, "/tier-list/lab")} className="tlr-back">
          Tutti i prototipi
        </Link>
        <ReplayTabs locale={locale} current="legendaries" />
        <p className="tlr-intro-text">
          Solo il primo fotogramma è una tier list pubblicata: le fasce del {data.officialReadLabel}, patch del 4/11,{" "}
          {fmtInt(locale, data.officialGames)} partite. Gli altri tre sono la regola del 9/11 applicata ai numeri di
          quella patch, non pubblicata.
        </p>
        <p className="tlr-headline font-display">{replay.headline}</p>
        {replay.steady ? <p className="tlr-steady">{replay.steady}</p> : null}
        {data.trackerMissing ? <p className="tlr-steady">Il Tracker non ha risposto: le patch dopo il 9/11 sono vuote.</p> : null}
      </header>

      <ReplayStage replay={replay} />

      <section id="legendaries" className="tlr-section" aria-labelledby="tlr-table-title">
        <h2 id="tlr-table-title" className="t-section text-sky">
          Le Leggendarie in ogni fotogramma
        </h2>
        <ReplayTable replay={replay} />
      </section>

      <section id="method" className="tlr-section" aria-labelledby="tlr-method-title">
        <h2 id="tlr-method-title" className="t-section text-sky">
          Come si calcola la fascia
        </h2>
        <div className="tlr-method">
          <p>
            Il win rate conta tutti e due i lati delle partite registrate dal Tracker di OriginsMeta: la vittoria di una Leggendaria è la
            sconfitta dell&apos;altra. La fascia nasce dal bordo basso dell&apos;intervallo al 95%: S se sta sopra il 50%, poi A dal 50%, B dal
            45%, C dal 40% e D sotto. Le Leggendarie bandite in almeno il 30% delle partite della Crimson Cup e con almeno un finalista salgono
            di una fascia. Chi ha poche partite resta fra le non classificate.
          </p>
          <p>
            La quota è la parte delle presenze in campo di quella patch. Le modifiche alle carte vengono dalle patch notes ufficiali.{" "}
            <Link href={replay.officialNews}>La news della tier list del 9 novembre</Link> racconta il metodo per intero.
          </p>
        </div>
      </section>
    </div>
  );
}
