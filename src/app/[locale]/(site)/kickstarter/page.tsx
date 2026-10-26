import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate, href, type Locale } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { imageSizeOf } from "@/lib/imageSize";
import { dropHreflang } from "@/lib/community/deckQuality";
import { ANY_ALT_ART_ONE_IN, DEMO_REVIEWS, KICKSTARTER_FACTS_READ, KICKSTARTER_VIP_URL, PULL_RATES, kickstarterLive } from "@/lib/kickstarter";
import { ctaLabel, fillKs, kickstarterLabels, type KickstarterLabels } from "@/lib/kickstarterLabels";
import { KickstarterButton } from "@/components/KickstarterButton";
import { KickstarterSticky } from "@/components/KickstarterSticky";
import { newTabProps } from "@/components/SteamButton";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  Landing del Kickstarter della Alpha Edition (26/10/2026). Dalla call con Tim Jooste di Koin Games: OriginsMeta entra
  nel programma referral e Tim suggerisce una pagina dedicata; Pierluigi: "segui i più alti standard di conversione,
  dobbiamo venderne il più possibile". Struttura dalla checklist di conversione del 26/10/2026 (NN/g, Kickstarter, FTC,
  UE, Codice del consumo): un solo obiettivo, il clic verso la campagna con il nostro link referral
  (src/lib/kickstarter.ts); tre tasti (prima schermata, dopo "come funziona", in fondo) più la barra fissa sul telefono
  che compare quando il primo esce dallo schermo; sotto ogni tasto dove porta e la dichiarazione del link referral con il
  rapporto con Koin; nessun altro link nel corpo che gli faccia concorrenza (solo la fonte delle probabilità, piccola, e
  la guida in fondo, dopo l'ultimo tasto). Solo fatti di Koin o di Steam con la data della lettura e le regole di
  Kickstarter; nessun prezzo finché la campagna non li mostra.
  ISR ogni 5 minuti: l'etichetta del tasto passa da "Avvisami" a "Scegli la tua ricompensa Alpha" da sola (`kickstarterLive`).
  Noindex e fuori da hreflang e sitemap: alle ricerche sul Kickstarter risponde la guida /guides/origins-tcg-kickstarter
  (che ha il suo riquadro verso questa pagina); qui si arriva dalla home, dalla barra in cima al sito, dalla guida, dal
  Discord e dai social.
*/

export const revalidate = 300;

const HERO = "/media/ss-pack-opening.webp";
const HERO_CTA_ID = "ks-hero-cta";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const k = kickstarterLabels[locale];
  return dropHreflang(pageMeta(locale, "/kickstarter", k.meta.title, k.meta.description, HERO, { imageSize: imageSizeOf(HERO), imageAlt: k.heroAlt, noindex: true }));
}

/** Tasto più le due righe che dicono dove porta e che il link è referral: sempre insieme. */
function Cta({ k, live, placement, id, center = false }: { k: KickstarterLabels; live: boolean; placement: string; id?: string; center?: boolean }) {
  return (
    <div id={id} className={center ? "flex flex-col items-center" : undefined}>
      <KickstarterButton placement={placement} size="lg">
        {ctaLabel(k, live)}
      </KickstarterButton>
      <p className="mt-2 text-sm text-pale">{k.ctaNote}</p>
      <p className="mt-1 max-w-xl text-xs text-pale-muted">{k.disclosure}</p>
    </div>
  );
}

function oddsText(k: KickstarterLabels, locale: Locale, rate: (typeof PULL_RATES)[number]): string {
  return rate.every ? k.rates.everyPack : fillKs(k.rates.oneIn, { n: new Intl.NumberFormat(locale).format(rate.n ?? 0) });
}

export default async function KickstarterPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const k = kickstarterLabels[locale];
  const live = kickstarterLive(new Date());
  const path = href(locale, "/kickstarter");
  const read = formatDate(locale, KICKSTARTER_FACTS_READ);
  const heroSize = imageSizeOf(HERO) ?? { width: 1600, height: 900 };
  return (
    // pb-28 sul telefono: la barra fissa in basso non copre la fine della pagina
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: k.h1, path },
          ]),
        ]}
      />

      {/* Prima schermata: che cos'è, perché, il tasto. Sul telefono testo e tasto vengono prima dell'immagine. */}
      <header className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="kicker text-mint">{k.kicker}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-sky sm:text-[2.5rem]">{k.h1}</h1>
          <p className="mt-4 text-lg text-pale">{k.lead}</p>
          <ul className="mt-4 grid gap-1.5 text-pale">
            {k.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-mint">
                  ✓
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Cta k={k} live={live} placement="landing_hero" id={HERO_CTA_ID} />
          </div>
          {live ? null : <p className="mt-4 text-sm text-pale">{k.launchNote}</p>}
          <p className="mt-3">
            <a href="#alpha" className="link-mint text-sm font-bold">
              {k.more} ↓
            </a>
          </p>
        </div>
        <figure className="card-night min-w-0 overflow-hidden p-2">
          <Image src={HERO} {...heroSize} alt={k.heroAlt} sizes="(min-width: 1024px) 540px, 92vw" className="h-auto w-full rounded-lg" priority />
          <figcaption className="px-2 py-2 text-xs text-pale-muted">{k.heroCaption}</figcaption>
        </figure>
      </header>

      {/* Perché la Alpha Edition: i fatti di Koin, uno per riquadro */}
      <section id="alpha" className="mt-16 scroll-mt-24" aria-labelledby="ks-why">
        <h2 id="ks-why" className="t-section">
          {k.why.title}
        </h2>
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {k.why.items.map((item) => (
            <li key={item.title} className="card-night min-w-0 p-5">
              <h3 className="t-item">{item.title}</h3>
              <p className="mt-2 text-pale">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Le probabilità ufficiali, accanto al gioco in breve per chi arriva senza conoscerlo */}
      <section className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]" aria-labelledby="ks-rates">
        <div className="min-w-0">
          <h2 id="ks-rates" className="t-section">
            {k.rates.title}
          </h2>
          <p className="mt-2 text-pale">{fillKs(k.rates.intro, { date: read })}</p>
          <table className="card-night mt-5 w-full border-separate border-spacing-0 overflow-hidden text-left">
            <thead>
              <tr className="font-mono text-xs uppercase tracking-wider text-pale-muted">
                <th scope="col" className="px-4 py-3 font-normal">
                  {k.rates.tier}
                </th>
                <th scope="col" className="px-4 py-3 text-right font-normal">
                  {k.rates.odds}
                </th>
              </tr>
            </thead>
            <tbody>
              {PULL_RATES.map((r) => (
                <tr key={r.tier}>
                  <th scope="row" className="border-t border-felt-line px-3 py-2.5 font-display text-sm font-bold text-sky sm:px-4">
                    {r.tier}
                  </th>
                  {/* su una riga sola: "1 pacchetto su / 2" a capo si legge male */}
                  <td className="whitespace-nowrap border-t border-felt-line px-3 py-2.5 text-right font-mono text-xs text-chalk sm:px-4 sm:text-sm">{oddsText(k, locale, r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-pale">{fillKs(k.rates.anyAlt, { n: ANY_ALT_ART_ONE_IN })}</p>
          <p className="mt-1 text-xs text-pale-muted">
            <a href={KICKSTARTER_VIP_URL} {...newTabProps} className="hover:underline">
              {k.rates.source}
            </a>
          </p>
        </div>
        <div className="min-w-0 self-start lg:mt-12">
          <div className="felt-panel p-6">
            <h3 className="t-item">{k.game.title}</h3>
            <p className="mt-2 text-pale">{k.game.text}</p>
            <p className="mt-3 text-sm text-pale">{fillKs(k.game.reviews, { n: DEMO_REVIEWS.percent, total: DEMO_REVIEWS.total, date: read })}</p>
          </div>
        </div>
      </section>

      {/* Come funziona il sostegno: le regole di Kickstarter che sciolgono l'obiezione "e se non arriva?", poi il tasto */}
      <section className="mt-16" aria-labelledby="ks-how">
        <h2 id="ks-how" className="t-section">
          {k.how.title}
        </h2>
        <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {k.how.steps.map((step, i) => (
            <li key={step.title} className="card-night flex min-w-0 gap-4 p-5">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-mono text-base font-bold text-ink">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="t-item">{step.title}</h3>
                <p className="mt-1 text-pale">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-sm text-pale-muted">{k.how.note}</p>
        <div className="mt-6">
          <Cta k={k} live={live} placement="landing_how" />
        </div>
      </section>

      {/* Domande prima del sostegno: data, prezzi, serve per giocare, dove finiscono le carte, VIP, il link referral */}
      <section className="mt-16 max-w-3xl" aria-labelledby="ks-faq">
        <h2 id="ks-faq" className="t-section">
          {k.faq.title}
        </h2>
        <div className="mt-5 grid gap-3">
          {k.faq.items.map((f) => (
            <details key={f.q} className="card-night group p-4 sm:p-5">
              <summary className="cursor-pointer list-none font-display font-bold text-sky [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  <span>{f.q}</span>
                  <span aria-hidden="true" className="text-mint transition group-open:rotate-45 motion-reduce:transition-none">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-pale">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Chiusura: il tasto un'ultima volta, poi chi siamo */}
      <section className="card-night mt-16 p-6 text-center sm:p-10" aria-labelledby="ks-final">
        <h2 id="ks-final" className="font-display text-2xl font-extrabold text-sky sm:text-3xl">
          {k.final.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pale">{k.final.text}</p>
        <div className="mt-6">
          <Cta k={k} live={live} placement="landing_final" center />
        </div>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="ks-about">
        <h2 id="ks-about" className="t-section">
          {k.about.title}
        </h2>
        <p className="mt-3 text-pale">{k.about.text}</p>
        <p className="mt-3">
          <Link href={href(locale, "/guides/origins-tcg-kickstarter")} className="link-mint font-bold">
            {k.about.guide} →
          </Link>
        </p>
        <p className="mt-6 text-sm text-pale-muted">{k.unofficial}</p>
      </section>

      <KickstarterSticky watchId={HERO_CTA_ID} label={ctaLabel(k, live)} note={k.stickyNote} />
    </div>
  );
}
