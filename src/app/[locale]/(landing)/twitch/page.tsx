import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { imageSizeOf } from "@/lib/imageSize";
import { analyticsLabels, trackerDownloadHref } from "@/lib/analyticsLabels";
import { TWITCH_EXTENSION_URL } from "@/lib/forCreators";
import { forCreatorsLabels } from "@/lib/forCreatorsLabels";
import { ORIGINSMETA_DISCORD } from "@/lib/discord";
import {
  FULL_GUIDES_PATH,
  PC_STEPS,
  SETUP_CONTACTS,
  TRACKER_ACCOUNT_PATH,
  TWITCH_SETUP_IMAGE,
  TWITCH_SETUP_PATH,
  TWITCH_STEPS,
  stepNumber,
  twitchSetupTrack,
  type SetupStepId,
} from "@/lib/twitchSetup";
import { fillName, twitchSetupLabels, type SetupStep } from "@/lib/twitchSetupLabels";
import { TrackerDownloadButton } from "@/components/TrackerDownloadButton";
import { CopyButton } from "@/components/CopyButton";
import { DiscordButton } from "@/components/DiscordButton";
import { newTabProps } from "@/components/SteamButton";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

/*
  /twitch (12/11/2026): il "layout di Twitch" in una schermata. Pierluigi: "una landing page verticale sul layout di
  twitch: una presentazione rapida e le istruzioni a prova di demente ma poco testo e chiaro, se riesci a stare in una
  schermata standard senza scroll sarebbe ideale e aggiungi i contatti miei e di dav". Vuol dire OriginsMeta Tracker più
  l'estensione Twitch (scelta sua): quattro passi sul PC, tre su Twitch, a chi scrivere se ci si blocca.

  Sta fuori dal gruppo (site) per non avere la striscia del calendario sopra: su un portatile da 768 px di altezza quei
  75 px fanno la differenza fra una schermata e una schermata e mezza. Testata e piede del sito restano (layout della
  lingua). Statica e indicizzabile in tutte le lingue; le guide lunghe restano in /for-creators e /tracker.
  Grafica con le regole della home del 12/11: un solo pannello, niente etichette in maiuscolo sopra i titoli, niente
  freccine, numeri e note a penna. Le misure per stare in una schermata sono in fondo a globals.css (.setup-*).
  Testi in src/lib/twitchSetupLabels.ts, costanti e contatti in src/lib/twitchSetup.ts.
*/

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = twitchSetupLabels[locale];
  return pageMeta(locale, TWITCH_SETUP_PATH, L.meta.title, L.meta.description, TWITCH_SETUP_IMAGE, {
    imageSize: imageSizeOf(TWITCH_SETUP_IMAGE),
    imageAlt: forCreatorsLabels[locale].heroAlt,
  });
}

/**
 * Un passo: il numero a penna, il titolo e la riga con che cosa premere. `inline` è un link che continua la riga (la
 * pagina dove si crea il codice), `button` un tasto vero accanto al passo (il download, la scheda dell'estensione).
 */
function Step({ id, step, inline, button }: { id: SetupStepId; step: SetupStep; inline?: ReactNode; button?: ReactNode }) {
  return (
    <li className="setup-step">
      <span className="setup-num" aria-hidden="true">
        {stepNumber(id)}
      </span>
      <div className="min-w-0">
        <h3 className="setup-step-title">{step.title}</h3>
        <p className="setup-step-text">
          {step.text}
          {inline ? <> {inline}</> : null}
        </p>
      </div>
      {button ? <div className="setup-step-action">{button}</div> : null}
    </li>
  );
}

export default async function TwitchSetupPage({ params }: { params: LocaleParams }) {
  const { locale } = await resolveLocale(params);
  const L = twitchSetupLabels[locale];
  const dl = analyticsLabels[locale].download;
  const size = imageSizeOf(TWITCH_SETUP_IMAGE) ?? { width: 1600, height: 900 };
  const codeHref = href(locale, TRACKER_ACCOUNT_PATH);
  const link = "link-mint whitespace-nowrap font-bold";

  const buttons: Partial<Record<SetupStepId, ReactNode>> = {
    download: <TrackerDownloadButton href={trackerDownloadHref(locale)} label={dl.button} signInLabel={dl.signIn} placement="twitch" />,
    install: (
      <a href={TWITCH_EXTENSION_URL} {...newTabProps} className="btn btn-ink" {...twitchSetupTrack("extension")}>
        {L.twitch.extLink}
      </a>
    ),
  };
  const inlines: Partial<Record<SetupStepId, ReactNode>> = {
    link: (
      <Link href={codeHref} prefetch={false} className={link} {...twitchSetupTrack("code")}>
        {L.pc.codeLink}
      </Link>
    ),
    connect: (
      <Link href={codeHref} prefetch={false} className={link} {...twitchSetupTrack("twitch_code")}>
        {L.twitch.codeLink}
      </Link>
    ),
  };

  return (
    <main id="main" className="flex-1">
      <JsonLd
        data={[
          breadcrumbs([
            { name: "OriginsMeta", path: href(locale) },
            { name: L.h1, path: href(locale, TWITCH_SETUP_PATH) },
          ]),
        ]}
      />
      <div className="setup mx-auto max-w-7xl px-4 sm:px-6">
        <header className="setup-head">
          <div className="min-w-0">
            <h1 className="t-page setup-title text-sky">{L.h1}</h1>
            <p className="setup-lead">{L.lead}</p>
            <p className="setup-needs">{L.needs}</p>
          </div>
          <figure className="setup-shot">
            <Image
              src={TWITCH_SETUP_IMAGE}
              alt={forCreatorsLabels[locale].heroAlt}
              width={size.width}
              height={size.height}
              sizes="(min-width: 1024px) 380px, 100vw"
              priority
              className="h-auto w-full rounded-xl border-[3px] border-sky"
            />
            <figcaption className="pen-note setup-shot-note">{L.imageNote}</figcaption>
          </figure>
        </header>

        <div className="card-night setup-panel">
          <section aria-labelledby="setup-pc" className="setup-col">
            <h2 id="setup-pc" className="setup-col-title">
              <span className="t-item text-sky">{L.pc.title}</span>
              <span className="pen-note is-quiet">{L.pc.time}</span>
            </h2>
            <ol className="setup-steps">
              {PC_STEPS.map((id) => (
                <Step key={id} id={id} step={L.pc.steps[id]} inline={inlines[id]} button={buttons[id]} />
              ))}
            </ol>
          </section>
          <section aria-labelledby="setup-twitch" className="setup-col setup-col-second">
            <h2 id="setup-twitch" className="setup-col-title">
              <span className="t-item text-sky">{L.twitch.title}</span>
              <span className="pen-note is-quiet">{L.twitch.time}</span>
            </h2>
            <ol className="setup-steps" start={PC_STEPS.length + 1}>
              {TWITCH_STEPS.map((id) => (
                <Step key={id} id={id} step={L.twitch.steps[id]} inline={inlines[id]} button={buttons[id]} />
              ))}
            </ol>
            <p className="setup-done">
              <span className="pen-note">{L.done.label}</span>
              <span>{L.done.text}</span>
            </p>
          </section>
        </div>

        <section aria-labelledby="setup-help" className="setup-help">
          <h2 id="setup-help" className="setup-help-title">
            {L.help.title}
          </h2>
          <ul className="setup-contacts">
            {SETUP_CONTACTS.map((c) => (
              <li key={c.name} className="setup-contact">
                <span className="font-display font-extrabold text-chalk">{c.name}</span>
                {c.discord ? (
                  <>
                    <code className="setup-handle">{c.discord}</code>
                    <CopyButton text={c.discord} label={L.help.copy} copied={L.help.copied} ariaLabel={fillName(L.help.copyAria, c.name)} className="btn btn-ink setup-copy" />
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="setup-help-links">
            <DiscordButton href={ORIGINSMETA_DISCORD} size="sm">
              {L.help.server}
            </DiscordButton>
            <Link href={href(locale, FULL_GUIDES_PATH)} prefetch={false} className="link-mint font-bold" {...twitchSetupTrack("guides")}>
              {L.help.guides}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
