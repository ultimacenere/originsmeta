import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { userInboxPath } from "@/lib/community/messages";
import { cards } from "@/lib/data/cards";
import { isShowcaseBadge } from "@/lib/community/badges";
import { getOwnVetrina, listOwnPublishedDecks } from "@/lib/community/showcaseQueries";
import { showcaseLabels } from "@/lib/showcaseLabels";
import { AvatarUploader } from "./AvatarUploader";
import { ClearShowcaseButton } from "./ClearShowcaseButton";
import { ShowcaseForm } from "./ShowcaseForm";

/** Le Leggendarie attive del database, per nome: la scelta della Leggendaria del cuore. */
const legendaries = cards
  .filter((c) => c.legendary && c.status === "active" && c.type !== "token")
  .map((c) => ({ slug: c.slug, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

/**
 * Le due sezioni del pacchetto VETRINA (27/09/2026) in /account/profile (in /account fino al 01/10/2026), sotto "Il tuo profilo pubblico":
 * - "Foto profilo" (#avatar), per TUTTI gli iscritti: la foto caricata dal sito;
 * - "Personalizza la vetrina" (#showcase): il modulo per Creator, Autore, Pro e Staff; agli altri una riga che spiega
 *   che è per i ruoli, con il link alla casella messaggi (/account/messages, "Scrivi allo staff") per chiederne uno, e a chi ha
 *   perso il ruolo con dei dati ancora salvati il tasto "Togli i dati della vetrina".
 * Legge con la sessione della pagina (niente seconda verifica dell'accesso). Prima della migrazione (colonne mancanti) o
 * con una lettura fallita, al posto dei moduli c'è una riga che lo dice: un modulo salvato vuoto cancellerebbe la vetrina.
 */
export async function ShowcaseEditor({ supabase, userId, locale, name }: { supabase: Db; userId: string; locale: Locale; name: string }) {
  const own = await getOwnVetrina(supabase, userId);
  const L = showcaseLabels[locale];
  const showcase = isShowcaseBadge(own.badge);
  const decks = showcase && own.status === "ok" ? await listOwnPublishedDecks(supabase, userId) : [];
  const v = own.vetrina;
  const privacyHref = `${href(locale, "/privacy")}#profile-media`;
  const unavailable = (missing: string) => <p className="card-night mt-4 p-6 text-pale-muted">{own.status === "missing" ? missing : L.avatar.readError}</p>;

  return (
    <>
      <section id="avatar" className="mt-10 scroll-mt-24">
        <h2 className="t-section">{L.avatar.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.avatar.intro}</p>
        {own.status === "ok" ? (
          <AvatarUploader userId={userId} name={name} initialPath={v?.avatarPath ?? null} initialUrl={own.avatarUrl} labels={L.avatar} privacyHref={privacyHref} />
        ) : (
          unavailable(L.avatar.missing)
        )}
      </section>

      <section id="showcase" className="mt-10 scroll-mt-24">
        <h2 className="t-section">{L.editor.title}</h2>
        {own.status === "error" ? (
          <p className="card-night mt-4 p-6 text-pale-muted">{L.editor.readError}</p>
        ) : !showcase ? (
          <div className="card-night mt-4 p-6 text-pale-muted">
            <p>
              {L.editor.notForRole}{" "}
              <Link href={userInboxPath(locale)} className="link-mint">
                {L.editor.askRole}
              </Link>
            </p>
            {/* chi ha perso il ruolo: i dati della vetrina sono ancora nella riga, si possono togliere */}
            {own.status === "ok" && own.hasData ? (
              <>
                <p className="mt-3 text-sm">{L.editor.clearIntro}</p>
                <ClearShowcaseButton userId={userId} labels={L.editor} />
              </>
            ) : null}
          </div>
        ) : own.status === "missing" || !v ? (
          <p className="card-night mt-4 p-6 text-pale-muted">{L.editor.missing}</p>
        ) : (
          <>
            <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.editor.intro}</p>
            <ShowcaseForm
              userId={userId}
              locale={locale}
              labels={L.editor}
              presetNames={L.presets}
              accentNames={L.accents}
              initial={{
                coverPreset: v.coverPreset,
                coverPath: v.coverPath,
                backgroundPreset: v.backgroundPreset,
                backgroundPath: v.backgroundPath,
                accent: v.accent,
                tagline: v.tagline,
                favoriteLegendary: v.favoriteLegendary,
                featuredDeck: v.featuredDeck,
                featuredVideo: v.featuredVideo?.url ?? null,
                schedule: v.schedule,
                scheduleTz: v.scheduleTz,
              }}
              legendaries={legendaries}
              decks={decks.map((d) => ({ id: d.id, name: d.name }))}
              publicHref={own.username ? href(locale, `/u/${own.username}`) : undefined}
              privacyHref={privacyHref}
            />
          </>
        )}
      </section>
    </>
  );
}
