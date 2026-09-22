import type { Metadata } from "next";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { canListTournaments } from "@/lib/tournament/types";
import { TournamentForm } from "@/components/TournamentForm";
import { LoginPanel } from "@/components/LoginPanel";
import { loginLabels } from "@/lib/loginLabels";
import { contactEmail } from "@/components/Footer";

/** Pagina "Organizza un torneo": renderizzata sul server (legge la sessione), quindi passa dal proxy per il refresh dei cookie. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, "/tournaments/new", dict.tournaments.create.title, dict.tournaments.create.intro), robots: { index: false, follow: true } };
}

export default async function NewTournamentPage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const path = href(locale, "/tournaments/new");
  const { supabase, user } = await currentUser();

  let body: React.ReactNode;
  if (!supabase) {
    body = <p className="card-night p-6 text-pale-muted">{x.errors.disabled}</p>;
  } else if (!user) {
    body = (
      <div className="card-night p-6 sm:p-8">
        <p className="mb-4 text-pale">{x.create.loginFirst}</p>
        <LoginPanel next={path} labels={loginLabels(d)} locale={locale} />
      </div>
    );
  } else {
    const { data } = await supabase.from("profiles").select("badge, role").eq("id", user.id).maybeSingle();
    const profile = (data as { badge: string; role: string } | null) ?? null;
    body = <TournamentForm locale={locale} userId={user.id} canList={canListTournaments(profile)} labels={x} loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`} contactEmail={contactEmail} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="kicker text-mint">{d.nav.events}</p>
      <h1 className="t-page mt-2">{x.create.title}</h1>
      <p className="mt-4 max-w-3xl text-chalk-muted">{x.create.intro}</p>
      <div className="mt-8">{body}</div>
    </div>
  );
}
