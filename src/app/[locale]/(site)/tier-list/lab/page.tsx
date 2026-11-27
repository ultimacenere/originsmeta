import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { loadLabData } from "@/lib/tierLab/data";
import { GameCardFace } from "@/components/GameCard";
import type { LabLegendary } from "@/lib/tierLab/types";

/*
  Indice dei prototipi della tier list (26-27/11/2026, branch claude/tierlist-lab, anteprima Vercel noindex). Pierluigi ha
  bocciato le proposte statiche del primo giro e ha chiesto "3 prototipi" veri, cliccabili, con i dati del sito.
  Non va su main senza il suo sì: a scelta fatta, la direzione vincente si rifà su /tier-list in otto lingue.
*/
export const revalidate = 300;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return pageMeta(locale, "/tier-list/lab", "Tier list: tre prototipi", "Tre prototipi della tier list di OriginsMeta, con le carte e i dati veri del sito.", undefined, {
    noindex: true,
    languages: [],
  });
}

type Proto = { slug: string; name: string; idea: string; real: string; effort: string; cards: (data: LabLegendary[]) => LabLegendary[] };

const PROTOS: Proto[] = [
  {
    slug: "mano",
    name: "La mano del meta",
    idea: "Le Leggendarie sono le carte del gioco tenute in mano, una mano per fascia. Tocchi una carta, la guardi da vicino e sul retro trovi perché sta lì.",
    real: "Fasce, win rate, Crimson Cup, scontri, community e voti: tutto dai dati del sito.",
    effort: "Circa 3 sessioni per /tier-list in otto lingue.",
    cards: (l) => l.slice(0, 3),
  },
  {
    slug: "testa-a-testa",
    name: "Testa a testa",
    idea: "La tier list si gioca: otto duelli al giorno sulla schermata VS. Scegli chi vince, scopri il dato vero dello scontro e quanto sei d'accordo con dati e community.",
    real: "Scontri fra Leggendarie dal Tracker, fasce ufficiali, community e voti.",
    effort: "Circa 3 sessioni, più il punteggio condiviso se lo vuoi salvare.",
    cards: (l) => [l[0], l[2]],
  },
  {
    slug: "replay",
    name: "Il replay delle patch",
    idea: "Il meta come una classifica in diretta: premi play e le carte cambiano fascia patch dopo patch, con le patch notes che spiegano chi si è mosso.",
    real: "Fasce del 9/11 e la stessa regola sui numeri del Tracker delle patch del 4, 17 e 23 novembre.",
    effort: "Circa 4 sessioni, più un passaggio a ogni patch.",
    cards: (l) => [l[2], l[4], l[1]],
  },
];

export default async function LabIndex({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const data = await loadLabData(locale);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <h1 className="t-page text-sky">Tier list: tre prototipi</h1>
      <p className="mt-3 max-w-2xl text-pale">
        Tre strade davvero diverse, con le carte del gioco e i dati veri del sito. Le fasce ufficiali sono quelle pubblicate il {data.officialReadLabel}: non le ho rilette.
      </p>
      <p className="pen-note mt-2">Anteprima privata, non indicizzata. Testi solo in italiano.</p>

      <ol className="mt-8 grid grid-cols-1 gap-6">
        {PROTOS.map((p, i) => (
          <li key={p.slug} className="card-night flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex shrink-0 justify-center gap-1 sm:w-56" aria-hidden>
              {p.cards(data.legendaries).map((l, j, all) => (
                <div
                  key={l.slug}
                  className="w-[30%] max-w-24 sm:w-20"
                  style={{ transform: `rotate(${(j - (all.length - 1) / 2) * 7}deg) translateY(${Math.abs(j - (all.length - 1) / 2) * 6}px)` }}
                >
                  <GameCardFace input={l.game} lang={locale} />
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="t-section text-sky">
                <span className="pen-num mr-2">{i + 1}</span>
                {p.name}
              </h2>
              <p className="mt-2 text-chalk">{p.idea}</p>
              <p className="mt-2 text-sm text-pale-muted">Dati veri: {p.real}</p>
              <p className="text-sm text-pale-muted">Per la produzione: {p.effort}</p>
              <Link href={href(locale, `/tier-list/lab/${p.slug}`)} className="btn-primary mt-4 inline-flex min-h-11 items-center px-5">
                Apri il prototipo
              </Link>
              {p.slug === "replay" ? (
                <Link href={href(locale, "/tier-list/lab/replay/carte")} className="ml-4 mt-4 inline-flex min-h-11 items-center text-mint underline">
                  La versione per le carte base
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-pale-muted">
        Tier list di oggi: <Link href={href(locale, "/tier-list")} className="text-mint underline">/tier-list</Link>. La regola delle fasce è spiegata nella{" "}
        <Link href={data.officialNews} className="text-mint underline">news del 9 novembre</Link>.
      </p>
    </div>
  );
}
