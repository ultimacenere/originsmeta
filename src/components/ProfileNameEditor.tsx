import { htmlLang, siteUrl, type Locale } from "@/lib/i18n";
import type { Db } from "@/lib/supabase/public";
import { namesMigrationMissing, nextUsernameChange } from "@/lib/community/profileNames";
import { usernamePinned } from "@/lib/community/pinnedUsernames";
import { profileNameLabels } from "@/lib/profileNameLabels";
import { ProfileNameForm } from "./ProfileNameForm";

/**
 * Sezione "Nome e nome utente" di /account/profile (#name, 23/10/2026), per ogni iscritto: il nome mostrato e il nome
 * utente, con il giorno da cui si potrà cambiare di nuovo il nome utente. Legge il profilo con la sessione che la pagina
 * ha già aperto. Prima della migrazione (colonne del blocco NOME UTENTE assenti) al posto del modulo c'è una riga che
 * dice che il cambio non è ancora attivo.
 */
export async function ProfileNameEditor({ supabase, userId, locale }: { supabase: Db; userId: string; locale: Locale }) {
  const L = profileNameLabels[locale];
  const res = await supabase.from("profiles").select("username, display_name, badge, role, username_changed_at").eq("id", userId).maybeSingle();
  const missing = namesMigrationMissing(res.error);
  if (res.error && !missing) console.error("[community] ProfileNameEditor:", res.error.message);
  const row = res.data as { username: string | null; display_name: string | null; badge: string | null; role: string | null; username_changed_at: string | null } | null;
  const staff = row?.role === "admin" || row?.badge === "staff";
  const next = staff ? null : nextUsernameChange(row?.username_changed_at);
  return (
    <section id="name" className="mt-10 scroll-mt-24">
      <h2 className="t-section">{L.section}</h2>
      <p className="mt-2 max-w-2xl text-sm text-chalk-muted">{L.intro}</p>
      {row ? (
        <ProfileNameForm
          initial={{ displayName: row.display_name ?? "", username: row.username ?? "" }}
          labels={L}
          locale={htmlLang[locale]}
          siteHost={new URL(siteUrl).host}
          staff={staff}
          locked={usernamePinned(row.username)}
          nextChange={next ? next.toISOString() : null}
        />
      ) : (
        <p className="card-night mt-4 p-6 text-pale-muted">{missing ? L.missing : L.readError}</p>
      )}
    </section>
  );
}
