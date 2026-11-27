import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { loadLabData } from "@/lib/tierLab/data";
import { HeadToHead } from "@/components/tierLab/testa/HeadToHead";
import { OfficialBoard } from "@/components/tierLab/testa/OfficialBoard";
import { buildPool, toDuelLeg, utcDay } from "@/components/tierLab/testa/duels";

/*
  Prototipo 2 della tier list, «Testa a testa» (27/11/2026, branch claude/tierlist-lab, noindex): la tier list si gioca
  a duelli con la schermata VS del gioco. Sotto il gioco, nell'HTML del server, la tier list ufficiale in chiaro.
  In produzione vivrebbe su /tier-list (stessi indirizzi in otto lingue, ancora #legendaries, un H1).
*/
export const revalidate = 300;

const PATH = "/tier-list/lab/testa-a-testa";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  return pageMeta(
    locale,
    PATH,
    "Tier list del meta: testa a testa",
    "Otto duelli fra Leggendarie al giorno: scegli chi vince, scopri il dato vero dello scontro e confrontalo con la tier list ufficiale e la community.",
    undefined,
    { noindex: true, languages: [] },
  );
}

export default async function TestaATesta({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const data = await loadLabData(locale);
  const patch = data.patches.find((p) => p.id === data.officialPatch);
  const patchLabel = patch ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${patch.date}T12:00:00Z`)) : data.officialPatch;
  const pool = buildPool(data.legendaries, data.officialPatch);
  const legs = data.legendaries.map(toDuelLeg);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <h1 className="t-page text-sky">Tier list del meta: le Leggendarie testa a testa</h1>
      <p className="mt-1 text-sm">
        <Link href={href(locale, "/tier-list/lab")} className="text-mint underline">
          Tutti i prototipi
        </Link>
      </p>
      <p className="mt-3 max-w-2xl text-pale">
        Otto duelli al giorno, uguali per tutti. Scegli la Leggendaria che vince più spesso quando si incontrano: poi vedi il dato vero dello scontro e chi la mette
        più in alto.
      </p>

      <div className="mt-6">
        {pool.length > 0 ? (
          <HeadToHead locale={locale} legs={legs} pool={pool} initialDay={utcDay()} patchLabel={patchLabel} pagePath={href(locale, PATH)} />
        ) : (
          <p className="text-pale">Gli scontri del Tracker non si leggono in questo momento: la sfida torna appena rispondono.</p>
        )}
      </div>

      <div className="mt-12">
        <OfficialBoard data={data} locale={locale} patchLabel={patchLabel} />
      </div>
    </div>
  );
}
