import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { href, siteUrl } from "@/lib/i18n";
import { cleanDescription, pageTitle, resolveLocale, type LocaleParams } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { fillTracker } from "@/lib/trackerLabels";
import { twitchAccountLabels } from "@/lib/twitchAccountLabels";
import { forCreatorsLabels } from "@/lib/forCreatorsLabels";
import { streamLabels } from "@/lib/streamLabels";
import { analyticsAccess } from "@/lib/community/analyticsAccess";
import { readTrackerDevices, readTwitchLink } from "@/lib/community/trackerQueries";
import { createTwitchCode, unlinkTwitch } from "@/lib/community/trackerActions";
import { AccountTabs } from "@/components/AccountTabs";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StepCards } from "@/components/StepCards";
import { AccountStreamGuide } from "@/components/stream/StreamTools";
import { TrackerCodeBox } from "@/components/tracker/TrackerCodeBox";
import { TrackerTime } from "@/components/tracker/TrackerTime";

/**
 * Twitch e dirette (06/11/2026, Pierluigi: "dobbiamo dividere bene istruzioni e codici per il tracker e le istruzioni per
 * il layover di twitch"): prima l'estensione stava in /account/tracker, con un codice della stessa forma di quello
 * dell'app, e il comando !deck e l'overlay per OBS in fondo a /account. Qui sta tutto quello che serve a chi fa dirette:
 * lo stato (app e canale collegati), i passi dell'estensione con il suo codice, il comando e l'overlay. Pagina privata,
 * dinamica, noindex, fuori da sitemap e hreflang; l'accesso lo controlla il proxy (come /account/tracker).
 *
 * I passi sono quelli della guida di /for-creators (strumento "twitch"): il quarto, che là porta a questa pagina, qui è il
 * riquadro del codice. Il canale si collega da Twitch (docs/twitch.md): qui si crea il codice e si scollega.
 */
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const L = twitchAccountLabels[locale].meta;
  return { title: { absolute: pageTitle(L.title) }, description: cleanDescription(L.description), robots: { index: false, follow: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Una riga dello stato: spunta se è a posto, punto esclamativo se manca qualcosa. */
function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-ink ${ok ? "bg-good" : "bg-gold"}`}>
        {ok ? "✓" : "!"}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-pale">{children}</div>
    </li>
  );
}

export default async function TwitchAccountPage({ params, searchParams }: { params: LocaleParams; searchParams: Search }) {
  const { locale } = await resolveLocale(params);
  const sp = await searchParams;
  const L = twitchAccountLabels[locale];
  const E = L.extension;
  const { supabase, user } = await currentUser();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{L.unavailable}</p>
      </div>
    );
  }
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, "/account/twitch"))}`);

  const [devices, twitch, access, { data: profileRow }, { count: published }] = await Promise.all([
    readTrackerDevices(supabase),
    readTwitchLink(supabase),
    // con ANALYTICS_PUBLIC spento l'estensione, come l'app, è solo per i ruoli in prova; comando e overlay sono per tutti
    analyticsAccess(),
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
    supabase.from("community_decks").select("id", { count: "exact", head: true }).eq("owner", user.id).eq("status", "published"),
  ]);
  const username = (profileRow as { username: string | null } | null)?.username ?? null;
  const pcs = devices.status === "ok" ? devices.data : [];
  const channel = twitch.status === "ok" ? twitch.data : null;
  // prima della migrazione del blocco TWITCH la sezione non si mostra (docs/twitch.md)
  const showExtension = access && twitch.status !== "missing";

  const F = forCreatorsLabels[locale].tools;
  const guide = F.items.find((t) => t.id === "twitch");
  const textOf = (i: number) => guide?.steps[i]?.text ?? "";
  const steps: ReactNode[] = [
    <>
      {textOf(0)}
      <p className="mt-2">
        <a href={guide?.steps[0]?.link?.path} target="_blank" rel="noopener noreferrer" className="link-mint font-bold">
          {guide?.steps[0]?.link?.label} ↗
        </a>
      </p>
    </>,
    textOf(1),
    textOf(2),
    <>
      {E.codeStep}
      <TrackerCodeBox labels={E} locale={locale} create={createTwitchCode} />
    </>,
    textOf(4),
    textOf(5),
  ];
  const howTo = (
    <>
      <StepCards steps={steps} />
      {guide?.stuck.length ? (
        <div className="felt-panel mt-3 p-4">
          <p className="font-display text-sm font-bold text-gold">? {F.stuck}</p>
          <ul className="mt-1 grid gap-1.5 text-sm text-pale">
            {guide.stuck.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden="true" className="text-gold">
                  •
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link href={`${href(locale, "/for-creators")}#twitch`} prefetch={false} className="link-mint font-bold">
              {E.guide} →
            </Link>
          </p>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <AccountTabs locale={locale} active="twitch" />
      <h1 className="t-page">{L.h1}</h1>
      <p className="mt-2 max-w-2xl text-chalk-muted">{L.intro}</p>

      {showExtension ? (
        <section id="extension" className="mt-10 scroll-mt-24">
          <h2 className="t-section">{E.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{E.intro}</p>
          {one(sp.done) === "twitch" ? <p className="mt-3 text-sm text-good">{E.done}</p> : null}
          {one(sp.error) === "twitch" ? <p className="mt-3 text-sm text-bad">{E.error}</p> : null}

          <ul className="card-night mt-4 grid gap-3 p-4 sm:p-5">
            <Check ok={pcs.length > 0}>
              {pcs.length ? (
                <span>{E.trackerOk}</span>
              ) : (
                <>
                  <span>{E.trackerMissing}</span>
                  <Link href={href(locale, "/account/tracker")} prefetch={false} className="link-mint font-bold">
                    {E.trackerLink} →
                  </Link>
                </>
              )}
            </Check>
            <Check ok={Boolean(channel)}>
              {channel ? (
                <>
                  <span>
                    {fillTracker(E.linked, { id: channel.channel_id })} <TrackerTime iso={channel.linked_at} locale={locale} />
                  </span>
                  <form action={unlinkTwitch}>
                    <input type="hidden" name="locale" value={locale} />
                    <ConfirmButton label={E.unlink} confirm={E.confirm} className="btn btn-ink text-xs" />
                  </form>
                </>
              ) : (
                <span>{E.none}</span>
              )}
            </Check>
          </ul>

          {/* a canale collegato le istruzioni restano a portata di mano, chiuse: servono solo per rifare il collegamento */}
          {channel ? (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-bold text-mint">{E.howTo}</summary>
              {howTo}
            </details>
          ) : (
            <>
              <h3 className="t-item mt-6">{E.howTo}</h3>
              {howTo}
            </>
          )}

          <p className="mt-4 max-w-2xl text-xs text-pale-muted">
            {E.privacy}{" "}
            <Link href={`${href(locale, "/privacy")}#tracker`} prefetch={false} className="link-mint">
              {E.privacyLink}
            </Link>
            .
          </p>
        </section>
      ) : null}

      {/* Comando !deck e overlay per OBS (pacchetto STREAM, 26/09/2026): niente app né codici, solo righe da copiare */}
      {username ? (
        <AccountStreamGuide username={username} locale={locale} site={siteUrl} hasDecks={(published ?? 0) > 0} labels={streamLabels[locale].account} tools={streamLabels[locale].tools} />
      ) : null}
    </div>
  );
}
