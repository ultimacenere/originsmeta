import { href, siteUrl, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { getOwnShowcase } from "@/lib/community/creators";
import { shortLinkLabel } from "@/lib/community/shortLink";
import { creatorLabels } from "@/lib/creatorLabels";
import { CopyButton } from "./CopyButton";
import { ProfileForm } from "./ProfileForm";

/**
 * Sezione "Il tuo profilo pubblico" di /account (pacchetto CREATOR, 26/09/2026), per ogni iscritto: il modulo di bio,
 * lingue e canali, e il link breve originsmeta.com/@<nome> da copiare. Legge il profilo con la sessione dell'utente
 * che la pagina ha già aperto (niente seconda verifica dell'accesso). Se le colonne non sono ancora nel database o la
 * lettura fallisce, al posto del modulo c'è una riga che lo dice: un modulo vuoto salvato cancellerebbe i canali.
 */
export async function ProfileEditor({ supabase, userId, locale }: { supabase: Db; userId: string; locale: Locale }) {
  const own = await getOwnShowcase(supabase, userId);
  const L = creatorLabels[locale];
  const publicHref = own.username ? href(locale, `/u/${own.username}`) : undefined;
  return (
    <section id="profile" className="mt-10 scroll-mt-24">
      <h2 className="t-section">{L.form.title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.form.intro}</p>
      {own.status === "ok" ? (
        <ProfileForm
          initial={{ bio: own.showcase.bio, links: own.showcase.links, contentLangs: own.showcase.contentLangs }}
          labels={L.form}
          websiteLabel={L.channels.website}
          langNames={L.langNames}
          publicHref={publicHref}
        />
      ) : (
        <p className="card-night mt-4 p-6 text-pale-muted">{own.status === "missing" ? L.form.missing : L.form.readError}</p>
      )}
      {own.username ? (
        <div className="card-night mt-4 flex flex-wrap items-center gap-3 p-5">
          <div className="min-w-0 flex-1 basis-64">
            <p className="kicker text-mint">{L.form.shortLink}</p>
            <p className="mt-1 break-all font-mono text-pale">{shortLinkLabel(own.username)}</p>
            <p className="mt-1 text-xs text-pale-muted">{L.form.shortLinkHint}</p>
          </div>
          <CopyButton text={`${siteUrl}/@${own.username}`} label={L.form.copy} copied={L.form.copied} />
        </div>
      ) : null}
    </section>
  );
}
