import type { Metadata } from "next";
import Image from "next/image";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { analyticsLabels } from "@/lib/analyticsLabels";
import { AnalyticsInterest } from "@/components/AnalyticsInterest";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  Pagina di OriginsMeta Analytics (02/10/2026, Pierluigi: "togliamo la pagina del winrate, creiamo una pagina invece
  […] in cui spieghiamo anche con screenshot che il tool esiste ed è pronto, ma con la nuova patch son stati rimossi
  tutti i dati di gioco", con il tasto "sei interessato al tool?" sopra e sotto per raccogliere i numeri da mostrare a
  Kevin di Koin Games). Prende il posto di /tier-list/win-rate (redirect permanente in next.config.ts) e della quarta
  scheda della tier list. Pagina statica: il numero degli interessati non si mostra (Pierluigi: "non voglio si vedano
  il numero di interessati"), lo legge solo lo staff (analytics_interest_count).
  Screenshot dell'app vera nelle tre lingue (public/media/analytics, fatti con --capture su una copia dei dati, senza
  collegamento: nessun nome utente), con le carte intere e i loro crediti.
*/

const OVERVIEW = { width: 1200, height: 799 };
const MATCHES = { width: 1200, height: 667 };
const OVERLAY = { en: { width: 638, height: 243 }, it: { width: 688, height: 243 }, es: { width: 626, height: 243 } } as const;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const x = analyticsLabels[locale];
  return pageMeta(locale, "/analytics", x.meta.title, x.meta.description, `/media/analytics/app-overview-${locale}.webp`, {
    imageSize: OVERVIEW,
    imageAlt: x.shots.overview.alt,
  });
}

export default async function AnalyticsPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const x = analyticsLabels[locale];
  const path = href(locale, "/analytics");
  const interest = { locale, labels: x.interest, privacyHref: `${href(locale, "/privacy")}#analytics-interest` };
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: x.h1, path },
          ]),
        ]}
      />
      <header className="max-w-3xl">
        <p className="kicker text-mint">{x.kicker}</p>
        <h1 className="t-page mt-2">{x.h1}</h1>
        <p className="mt-3">
          <span className="stat-pill bg-night-3 text-xs font-semibold uppercase text-gold">{x.paused}</span>
        </p>
        <p className="mt-4 text-pale">{x.lead}</p>
      </header>

      <div className="mt-6 max-w-3xl">
        <AnalyticsInterest placement="top" {...interest} />
      </div>

      <section className="mt-12" aria-labelledby="an-what">
        <h2 id="an-what" className="t-section">
          {x.what.title}
        </h2>
        <ul className="mt-4 grid max-w-3xl gap-2 text-pale">
          {x.what.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-mint">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <figure className="card-night overflow-hidden p-2 lg:col-span-2">
            <Image src={`/media/analytics/app-overview-${locale}.webp`} {...OVERVIEW} alt={x.shots.overview.alt} sizes="(min-width: 1024px) 960px, 100vw" className="h-auto w-full rounded-lg" priority />
            <figcaption className="px-2 py-2 text-sm text-pale-muted">{x.shots.overview.caption}</figcaption>
          </figure>
          <figure className="card-night overflow-hidden p-2">
            <Image src={`/media/analytics/app-matches-${locale}.webp`} {...MATCHES} alt={x.shots.matches.alt} sizes="(min-width: 1024px) 470px, 100vw" className="h-auto w-full rounded-lg" />
            <figcaption className="px-2 py-2 text-sm text-pale-muted">{x.shots.matches.caption}</figcaption>
          </figure>
          <figure className="card-night flex flex-col justify-between overflow-hidden p-2">
            <div className="grid flex-1 place-items-center rounded-lg bg-felt-deep p-4">
              <Image src={`/media/analytics/overlay-${locale}.webp`} {...OVERLAY[locale]} alt={x.shots.overlay.alt} sizes="(min-width: 1024px) 400px, 90vw" className="h-auto w-full max-w-[400px]" />
            </div>
            <figcaption className="px-2 py-2 text-sm text-pale-muted">{x.shots.overlay.caption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="an-why">
        <h2 id="an-why" className="t-section">
          {x.why.title}
        </h2>
        {x.why.paragraphs.map((p) => (
          <p key={p} className="mt-3 text-pale">
            {p}
          </p>
        ))}
      </section>

      <section className="mt-10 max-w-3xl" aria-labelledby="an-koin">
        <h2 id="an-koin" className="t-section">
          {x.koin.title}
        </h2>
        <p className="mt-3 text-pale">{x.koin.text}</p>
        <p className="mt-2 text-sm text-pale-muted">{x.koin.unofficial}</p>
      </section>

      <div className="mt-6 max-w-3xl">
        <AnalyticsInterest placement="bottom" {...interest} />
      </div>
    </div>
  );
}
