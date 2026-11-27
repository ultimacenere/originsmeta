import type { Metadata } from "next";
import Link from "next/link";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { loadLabCards } from "@/lib/tierLab/cardsData";
import { ReplayStage } from "@/components/tierLab/replay/ReplayStage";
import { ReplayTable } from "@/components/tierLab/replay/ReplayTable";
import { ReplayTabs } from "@/components/tierLab/replay/ReplayTabs";
import { buildCardReplay } from "@/components/tierLab/replay/cardFrames";
import { fmtPct } from "@/components/tierLab/replay/frames";

/**
 * «Il replay delle patch» per le carte base (27/11/2026, branch claude/tierlist-lab, noindex): Pierluigi ha scelto il
 * replay e ha chiesto di vedere anche la versione per le carte. Le carte base non hanno una tier list pubblicata: le
 * fasce sono una regola di prova (cardFrames.ts), e la pagina lo dice. Nell'HTML del server: il primo fotogramma del
 * palco e la tabella carta × patch.
 */

export const revalidate = 300;

const TITLE = "Tier list delle carte: il meta patch dopo patch";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return pageMeta(
    locale,
    "/tier-list/lab/replay/carte",
    "Tier list delle carte: il replay delle patch",
    "Prototipo: le carte base di Origins TCG patch dopo patch, dalla 0.7 al 23 novembre, con i numeri del Tracker di OriginsMeta e le patch notes.",
    undefined,
    { noindex: true, languages: [] },
  );
}

export default async function CardReplayPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const data = await loadLabCards(locale);
  const replay = buildCardReplay(data);
  const bases = replay.frames.map((f) => `${f.short} ${fmtPct(locale, f.baseline ?? null)}`).join(", ");

  return (
    <div className="tlr-page mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <header className="tlr-intro">
        <h1 className="t-page text-sky">{TITLE}</h1>
        <Link href={href(locale, "/tier-list/lab")} className="tlr-back">
          Tutti i prototipi
        </Link>
        <ReplayTabs locale={locale} current="cards" />
        <p className="tlr-intro-text">
          Le carte base non hanno ancora una tier list pubblicata: queste fasce sono una regola di prova applicata ai numeri del Tracker di
          OriginsMeta, patch dopo patch.
        </p>
        <p className="tlr-headline font-display">{replay.headline}</p>
        {replay.steady ? <p className="tlr-steady">{replay.steady}</p> : null}
        {data.trackerMissing ? <p className="tlr-steady">Il Tracker non ha risposto: le patch sono vuote.</p> : null}
      </header>

      <ReplayStage replay={replay} />

      <section id="cards" className="tlr-section" aria-labelledby="tlr-table-title">
        <h2 id="tlr-table-title" className="t-section text-sky">
          Le carte in ogni patch
        </h2>
        <ReplayTable replay={replay} />
      </section>

      <section id="method" className="tlr-section" aria-labelledby="tlr-method-title">
        <h2 id="tlr-method-title" className="t-section text-sky">
          Come si calcola la fascia di prova
        </h2>
        <div className="tlr-method">
          <p>
            Per le carte il Tracker conosce bene solo il mazzo di chi registra: dell&apos;avversario vede soltanto le carte giocate. Il win rate
            di una carta è quindi quello dei mazzi che la contengono, e va letto contro la media di tutte le partite registrate nella stessa
            patch ({bases}), non contro il 50%.
          </p>
          <p>
            La regola è quella delle Leggendarie con la media al posto del 50%: S se il bordo basso dell&apos;intervallo al 95% sta sopra la
            media, A dalla media in su, B fino a 5 punti sotto, C fino a 10 punti sotto, D più in basso. Chi ha poche partite resta fra le non
            classificate. Il numero dice quanto vincono i mazzi con quella carta, che dipende anche dalla Leggendaria e dalle altre carte: non
            è la forza della carta da sola.
          </p>
          <p>
            «Nei mazzi» è la parte delle partite registrate in cui la carta era nel mazzo. Le modifiche alle carte vengono dalle patch notes
            ufficiali.
          </p>
        </div>
      </section>
    </div>
  );
}
