import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { TRACKER_DOWNLOAD_FILE, analyticsLabels, trackerDownloadHref, trackerInstallHref } from "@/lib/analyticsLabels";
import { TrackerDownloadButton, TrackerSignInStep } from "@/components/TrackerDownloadButton";
import { ORIGINSMETA_DISCORD } from "@/lib/discord";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import { ANALYTICS_PUBLIC } from "@/lib/community/badges";
import { requireAnalyticsAccess } from "@/lib/community/analyticsAccess";
import { dropHreflang } from "@/lib/community/deckQuality";

/*
  Pagina di OriginsMeta Tracker, l'app per Windows che registra le partite (fino al 12/10/2026 si chiamava OriginsMeta
  Analytics e la pagina stava in /analytics, che da allora è la pagina delle statistiche; Pierluigi: "l'app si chiama
  OriginsMeta Tracker"). Nata il 02/10/2026 come pagina del tool
  "in pausa" (la patch 0.7 aveva tolto i replay) con il tasto "Sei interessato al tool?"; dal 10/10/2026 l'app legge di
  nuovo le carte giocate dallo schermo e questa è la pagina del download, con che cosa fa l'app, gli screenshot e la
  guida all'installazione passo per passo (Pierluigi: "nella pagina del tracker mettiamo un tutorial step by step per
  l'installazione"). Il tasto "Sei interessato?" non c'è più (componente, tabella e informativa restano).
  In prova dal 10/10/2026 (Pierluigi: "visibile solo ai creators e top players"): con ANALYTICS_PUBLIC spento la vedono
  solo Creator, Autore, Pro, Staff e admin con l'accesso fatto (gli altri ricevono un 404), noindex e fuori da hreflang e
  sitemap; la sessione letta la rende dinamica. Con ANALYTICS_PUBLIC acceso torna statica e indicizzabile. Aperta a tutti dal 12/10/2026, ma il download è solo per chi ha fatto l'accesso (Pierluigi: "solo i registrati al sito
  possono scaricare l'app e possono usarla"): il tasto porta a /api/tracker/download, che rimanda allo zip su GitHub
  Releases o alla pagina di accesso (l'indirizzo dello zip non è nella pagina); i clic
  sul download contano come `analytics_download` (attributi data-om-*, analytics.ts).
  Screenshot dell'app vera nelle tre lingue dell'app (public/media/analytics, fatti il 02/10/2026 con --capture su una
  copia dei dati, senza collegamento: nessun nome utente), con le carte intere e i loro crediti. Sono dell'app 0.2/0.3
  (dicono "Analytics" e "funziona anche solo su questo PC"): vanno rifatti con la 0.4. Lo screenshot della schermata di
  collegamento (app-link-*, 15/10/2026) è invece della 0.4.6, fatto con `--capture` e una cartella dati vuota.
*/

const OVERVIEW = { width: 1200, height: 799 };
const MATCHES = { width: 1200, height: 667 };
/**
 * Lingua degli screenshot: l'app esiste in inglese, italiano e spagnolo, e gli screenshot sono quelli (fatti il
 * 02/10/2026). Il francese (07/10/2026) non ha screenshot propri e mostra quelli inglesi (l'app in francese parte in
 * inglese), senza copiare i file: le didascalie restano nella lingua della pagina. Lo stesso il portoghese e il tedesco (20/10/2026).
 */
type ShotLocale = "en" | "it" | "es";
const SHOT_LOCALE: Record<Locale, ShotLocale> = { en: "en", it: "it", es: "es", fr: "en", pt: "en", de: "en", ru: "en" };
const OVERLAY: Record<ShotLocale, { width: number; height: number }> = { en: { width: 638, height: 243 }, it: { width: 688, height: 243 }, es: { width: 626, height: 243 } };

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const x = analyticsLabels[locale];
  const meta = pageMeta(locale, "/tracker", x.meta.title, x.meta.description, `/media/analytics/app-overview-${SHOT_LOCALE[locale]}.webp`, {
    imageSize: OVERVIEW,
    imageAlt: x.shots.overview.alt,
    noindex: !ANALYTICS_PUBLIC,
  });
  return ANALYTICS_PUBLIC ? meta : dropHreflang(meta);
}

/** La schermata di collegamento dell'app 0.4.6 al primo avvio (15/10/2026, `npm run capture` con una cartella dati vuota, ritagliata). */
const LINK_SHOT = { width: 736, height: 392 };

/** Il tasto del download (12/10/2026): sempre verso la rotta che controlla l'accesso; il testo lo sceglie il browser.
 * Dal 15/10/2026, dopo il clic, la pagina scorre al passo 3 (l'estrazione). */
function DownloadButton({ locale, x, placement }: { locale: Locale; x: (typeof analyticsLabels)[Locale]; placement: "top" | "install" }) {
  return (
    <TrackerDownloadButton
      href={trackerDownloadHref(locale)}
      label={x.download.button}
      signInLabel={x.download.signIn}
      placement={placement}
      next={{ id: `${x.install.anchor}-3`, label: x.install.started }}
    />
  );
}

/**
 * L'avviso SmartScreen di Windows (15/10/2026), dove si ferma chi scarica un'app non firmata: uno schema semplificato
 * delle due schermate, con i testi di Windows nella lingua della pagina e i due clic segnati. Non è uno screenshot (non
 * ce ne sono di veri) e la didascalia lo dice.
 */
function SmartScreenSketch({ s }: { s: (typeof analyticsLabels)[Locale]["install"]["smartscreen"] }) {
  const badge = "absolute -top-7 left-0 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 font-mono text-[11px] font-bold text-ink";
  return (
    <figure className="mt-4">
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
        <div className="relative rounded-md bg-[#0b5cad] p-4 text-white">
          <p className="text-lg font-semibold leading-tight">{s.title}</p>
          <p className="mt-2 text-xs text-white/85">{s.body}</p>
          <p className="relative mt-9 inline-block rounded px-1 text-xs underline outline outline-2 outline-gold">
            {s.more}
            <span className={badge}>{s.first}</span>
          </p>
          <div className="mt-4 flex justify-end">
            <span className="rounded-sm border border-white/60 px-3 py-1 text-xs">{s.dontRun}</span>
          </div>
        </div>
        <div className="relative rounded-md bg-[#0b5cad] p-4 text-white">
          <p className="text-lg font-semibold leading-tight">{s.title}</p>
          <p className="mt-2 text-xs text-white/85">
            {s.app} OriginsMeta Tracker.exe
            <br />
            {s.publisher} {s.unknown}
          </p>
          <div className="mt-10 flex flex-wrap justify-end gap-2">
            <span className="relative rounded-sm border border-white/60 px-3 py-1 text-xs outline outline-2 outline-offset-2 outline-gold">
              {s.run}
              <span className={badge}>{s.second}</span>
            </span>
            <span className="rounded-sm border border-white/60 px-3 py-1 text-xs">{s.dontRun}</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-pale-muted">{s.caption}</figcaption>
    </figure>
  );
}

/** Il testo di un passo con i segnaposto al loro posto: `{file}` il nome dello zip, `{link}` il link alla pagina dell'account. */
function stepText(text: string, parts: { file: ReactNode; link: ReactNode }): ReactNode[] {
  return text.split(/(\{file\}|\{link\})/).map((piece, i) => (piece === "{file}" ? <span key={i}>{parts.file}</span> : piece === "{link}" ? <span key={i}>{parts.link}</span> : piece));
}

export default async function TrackerPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  await requireAnalyticsAccess();
  const x = analyticsLabels[locale];
  const shot = SHOT_LOCALE[locale];
  const path = href(locale, "/tracker");
  const install = x.install;
  const stepId = (i: number) => `${install.anchor}-${i + 1}`;
  // passo 1: la pagina di accesso con il ritorno alla guida, come la rotta del download per chi non ha fatto l'accesso
  const loginHref = `${href(locale, "/login")}?next=${encodeURIComponent(trackerInstallHref(locale))}`;
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
          <DownloadButton locale={locale} x={x} placement="top" />
          <a href={`#${install.anchor}`} className="link-mint text-sm font-bold">
            {x.download.guide} ↓
          </a>
        </div>
        <p className="mt-2 text-sm text-pale-muted">{x.download.note}</p>
        {/* l'app si usa solo con un account (12/10/2026): lo dice a tutti, anche a chi ha già fatto l'accesso */}
        <p className="mt-1 text-sm text-pale-muted">{x.download.account}</p>
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

      {/* La guida all'installazione (10/10/2026; cinque passi brevi dal 12/10/2026; sette dal 15/10/2026, uno per ogni punto
          in cui si perde chi scarica, ognuno con il suo "Se ti blocchi qui"): un elenco ordinato con l'ancora nella lingua
          (#install, #installazione, #instalacion, #installation), dove portano i link di /account e /account/tracker, e un
          id per passo (#installazione-3) per il percorso in breve e per il salto dopo il download. */}
      <section id={install.anchor} className="mt-14 max-w-3xl scroll-mt-24" aria-labelledby="an-install">
        <h2 id="an-install" className="t-section">
          {install.title}
        </h2>
        <p className="mt-2 text-pale-muted">{install.intro}</p>
        <p className="mt-3 text-sm text-pale">{install.needs}</p>
        <ol className="mt-5 flex flex-wrap gap-2" aria-label={install.title}>
          {install.path.map((label, i) => (
            <li key={label}>
              <a href={`#${stepId(i)}`} className="inline-flex items-center gap-1.5 rounded-full border border-felt-line px-3 py-1 text-sm text-pale hover:border-mint hover:text-chalk">
                <span className="font-mono text-xs font-bold text-mint">{i + 1}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
        <ol className="mt-6 grid gap-3">
          {install.steps.map((step, i) => (
            <li key={step.title} id={stepId(i)} className="card-night flex scroll-mt-24 gap-4 p-4 sm:p-5">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-mono text-base font-bold text-ink">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="t-item">{step.title}</h3>
                <p className="mt-1 text-pale">{stepText(step.text, placeholders)}</p>
                {/* passo 1: accesso; passo con {file}: il tasto del download; passo 4: l'avviso di Windows; passo 5: la schermata dell'app */}
                {i === 0 ? (
                  <div className="mt-3">
                    <TrackerSignInStep loginHref={loginHref} signInLabel={install.signInCta} signedInLabel={install.signedIn} />
                  </div>
                ) : null}
                {step.text.includes("{file}") ? (
                  <div className="mt-3">
                    <DownloadButton locale={locale} x={x} placement="install" />
                  </div>
                ) : null}
                {i === 3 ? <SmartScreenSketch s={install.smartscreen} /> : null}
                {i === 4 ? (
                  <figure className="mt-4 overflow-hidden rounded-lg border border-felt-line bg-felt-deep">
                    <Image src={`/media/analytics/app-link-${shot}.webp`} {...LINK_SHOT} alt={install.shotAlt} sizes="(min-width: 768px) 640px, 90vw" className="h-auto w-full" />
                    <figcaption className="px-3 py-2 text-xs text-pale-muted">{install.shotCaption}</figcaption>
                  </figure>
                ) : null}
                <div className="mt-3 rounded-lg border-l-2 border-gold bg-felt-deep/60 px-3 py-2 text-sm">
                  <p className="kicker text-gold">{install.stuck}</p>
                  <p className="mt-1 text-pale">{step.hint}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        {/* da sapere dopo l'installazione (12/10/2026, dal 15/10/2026 con il Discord per chi resta bloccato) */}
        <div className="card-night mt-6 p-4 sm:p-5">
          <h3 className="t-item">{install.tips.title}</h3>
          <ul className="mt-2 grid gap-2 text-pale">
            {install.tips.items.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span aria-hidden="true" className="text-mint">
                  →
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <a href={ORIGINSMETA_DISCORD} target="_blank" rel="noopener noreferrer" className="link-mint font-bold">
              {install.tips.discord} →
            </a>
          </p>
        </div>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="an-winrate">
        <h2 id="an-winrate" className="t-section">
          {x.winrate.title}
        </h2>
        <p className="mt-3 text-pale">{x.winrate.text}</p>
        <p className="mt-3">
          <Link href={href(locale, "/analytics")} className="link-mint font-bold">
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
