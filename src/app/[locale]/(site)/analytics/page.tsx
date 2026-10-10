import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { TRACKER_DOWNLOAD_FILE, TRACKER_DOWNLOAD_URL, analyticsLabels } from "@/lib/analyticsLabels";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { ANALYTICS_PUBLIC } from "@/lib/community/badges";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";

/*
  Pagina di OriginsMeta Analytics, l'app per Windows che registra le partite. Nata il 02/10/2026 come pagina del tool
  "in pausa" (la patch 0.7 aveva tolto i replay) con il tasto "Sei interessato al tool?"; dal 10/10/2026 l'app legge di
  nuovo le carte giocate dallo schermo e questa è la pagina del download, con che cosa fa l'app, gli screenshot e la
  guida all'installazione passo per passo (Pierluigi: "nella pagina del tracker mettiamo un tutorial step by step per
  l'installazione"). Il tasto "Sei interessato?" non c'è più (componente, tabella e informativa restano).
  In prova dal 10/10/2026 (Pierluigi: "visibile solo ai creators e top players"): con ANALYTICS_PUBLIC spento la vedono
  solo Creator, Pro, Staff e admin con l'accesso fatto (gli altri ricevono un 404), noindex e fuori da hreflang e
  sitemap; la sessione letta la rende dinamica. Con ANALYTICS_PUBLIC acceso torna statica e indicizzabile. Lo zip arriva da GitHub Releases (`TRACKER_DOWNLOAD_URL`, un solo posto); i clic
  sul download contano come `analytics_download` (attributi data-om-*, analytics.ts).
  Screenshot dell'app vera nelle tre lingue dell'app (public/media/analytics, fatti il 02/10/2026 con --capture su una
  copia dei dati, senza collegamento: nessun nome utente), con le carte intere e i loro crediti.
*/

const OVERVIEW = { width: 1200, height: 799 };
const MATCHES = { width: 1200, height: 667 };
/**
 * Lingua degli screenshot: l'app esiste in inglese, italiano e spagnolo, e gli screenshot sono quelli (fatti il
 * 02/10/2026). Il francese (07/10/2026) non ha screenshot propri e mostra quelli inglesi (l'app in francese parte in
 * inglese), senza copiare i file: le didascalie restano nella lingua della pagina.
 */
type ShotLocale = "en" | "it" | "es";
const SHOT_LOCALE: Record<Locale, ShotLocale> = { en: "en", it: "it", es: "es", fr: "en" };
const OVERLAY: Record<ShotLocale, { width: number; height: number }> = { en: { width: 638, height: 243 }, it: { width: 688, height: 243 }, es: { width: 626, height: 243 } };

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const x = analyticsLabels[locale];
  const meta = pageMeta(locale, "/analytics", x.meta.title, x.meta.description, `/media/analytics/app-overview-${SHOT_LOCALE[locale]}.webp`, {
    imageSize: OVERVIEW,
    imageAlt: x.shots.overview.alt,
    noindex: !ANALYTICS_PUBLIC,
  });
  return ANALYTICS_PUBLIC ? meta : dropHreflang(meta);
}

/** Il tasto del download: un link diretto allo zip, contato come `analytics_download` con il suo posto nella pagina. */
function DownloadButton({ label, placement }: { label: string; placement: "top" | "install" }) {
  return (
    <a href={TRACKER_DOWNLOAD_URL} className="btn btn-primary" rel="noopener" data-om-event="analytics_download" data-om-placement={placement}>
      {label} ↓
    </a>
  );
}

/** Il testo di un passo con i segnaposto al loro posto: `{file}` il nome dello zip, `{link}` il link alla pagina dell'account. */
function stepText(text: string, parts: { file: ReactNode; link: ReactNode }): ReactNode[] {
  return text.split(/(\{file\}|\{link\})/).map((piece, i) => (piece === "{file}" ? <span key={i}>{parts.file}</span> : piece === "{link}" ? <span key={i}>{parts.link}</span> : piece));
}

export default async function AnalyticsPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const x = analyticsLabels[locale];
  const shot = SHOT_LOCALE[locale];
  const path = href(locale, "/analytics");
  const install = x.install;
  const placeholders = {
    file: <code className="break-all font-mono text-sm text-chalk">{TRACKER_DOWNLOAD_FILE}</code>,
    link: (
      <Link href={href(locale, "/account/tracker")} prefetch={false} className="link-mint font-bold">
        {install.linkText}
      </Link>
    ),
  };
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
        <p className="mt-4 text-pale">{x.lead}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <DownloadButton label={x.download.button} placement="top" />
          <a href={`#${install.anchor}`} className="link-mint text-sm font-bold">
            {x.download.guide} ↓
          </a>
        </div>
        <p className="mt-2 text-sm text-pale-muted">{x.download.note}</p>
      </header>

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
            <Image src={`/media/analytics/app-overview-${shot}.webp`} {...OVERVIEW} alt={x.shots.overview.alt} sizes="(min-width: 1024px) 960px, 100vw" className="h-auto w-full rounded-lg" priority />
            <figcaption className="px-2 py-2 text-sm text-pale-muted">{x.shots.overview.caption}</figcaption>
          </figure>
          <figure className="card-night overflow-hidden p-2">
            <Image src={`/media/analytics/app-matches-${shot}.webp`} {...MATCHES} alt={x.shots.matches.alt} sizes="(min-width: 1024px) 470px, 100vw" className="h-auto w-full rounded-lg" />
            <figcaption className="px-2 py-2 text-sm text-pale-muted">{x.shots.matches.caption}</figcaption>
          </figure>
          <figure className="card-night flex flex-col justify-between overflow-hidden p-2">
            <div className="grid flex-1 place-items-center rounded-lg bg-felt-deep p-4">
              <Image src={`/media/analytics/overlay-${shot}.webp`} {...OVERLAY[shot]} alt={x.shots.overlay.alt} sizes="(min-width: 1024px) 400px, 90vw" className="h-auto w-full max-w-[400px]" />
            </div>
            <figcaption className="px-2 py-2 text-sm text-pale-muted">{x.shots.overlay.caption}</figcaption>
          </figure>
        </div>
      </section>

      {/* La guida all'installazione (10/10/2026): un elenco ordinato con l'ancora nella lingua (#install, #installazione,
          #instalacion, #installation), dove portano i link di /account e /account/tracker. */}
      <section id={install.anchor} className="mt-14 max-w-3xl scroll-mt-24" aria-labelledby="an-install">
        <h2 id="an-install" className="t-section">
          {install.title}
        </h2>
        <p className="mt-2 text-pale-muted">{install.intro}</p>
        <ol className="mt-6 grid gap-3">
          {install.steps.map((step, i) => (
            <li key={step.title} className="card-night flex gap-4 p-4 sm:p-5">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-mono text-base font-bold text-ink">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="t-item">{step.title}</h3>
                <p className="mt-1 text-pale">{stepText(step.text, placeholders)}</p>
                {/* il passo del download ha il tasto */}
                {step.text.includes("{file}") ? (
                  <p className="mt-3">
                    <DownloadButton label={x.download.button} placement="install" />
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="an-winrate">
        <h2 id="an-winrate" className="t-section">
          {x.winrate.title}
        </h2>
        <p className="mt-3 text-pale">{x.winrate.text}</p>
        <p className="mt-3">
          <Link href={href(locale, "/tier-list/win-rate")} className="link-mint font-bold">
            {x.winrate.link} →
          </Link>
        </p>
      </section>

      <section className="mt-10 max-w-3xl" aria-labelledby="an-privacy">
        <h2 id="an-privacy" className="t-section">
          {x.privacy.title}
        </h2>
        <p className="mt-3 text-pale">{x.privacy.text}</p>
        <p className="mt-3">
          <Link href={`${href(locale, "/privacy")}#tracker`} prefetch={false} className="link-mint font-bold">
            {x.privacy.link} →
          </Link>
        </p>
        <p className="mt-6 text-sm text-pale-muted">{x.koin.unofficial}</p>
      </section>
    </div>
  );
}
