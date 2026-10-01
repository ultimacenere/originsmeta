import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale, type LocaleParams } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { isShowcaseBadge } from "@/lib/community/badges";
import type { Profile } from "@/lib/community/types";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ShowcaseEditor } from "@/components/showcase/ShowcaseEditor";
import { ShowStatsSetting } from "@/components/achievements/ShowStatsSetting";

/**
 * "Modifica la mia pagina pubblica" (01/10/2026, Pierluigi: "dobbiamo spostare tutte le opzioni della pagina profilo
 * pubblica in un sottomenu, altrimenti il profilo personale diventa innavigabile"). Qui sta tutto quello che cambia
 * /u/<nome>: profilo pubblico (#profile), foto profilo (#avatar), vetrina (#showcase) e numeri sulla vetrina
 * (#showcase-stats); /account tiene il tasto che porta qui, sotto "La tua pagina pubblica", e rimanda qui le vecchie
 * ancore (`AccountHashRedirect`). Pagina privata, dinamica, noindex; fuori da sitemap e hreflang.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  const P = dict.community.account.profilePage;
  return { ...pageMeta(locale, "/account/profile", P.title, P.intro), robots: { index: false, follow: false } };
}

export default async function AccountProfilePage({ params }: { params: LocaleParams }) {
  const { locale, dict: d } = await resolveLocale(params);
  const c = d.community;
  const P = c.account.profilePage;
  const { supabase, user } = await currentUser();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="card-night p-6 text-pale-muted">{c.account.disabled}</p>
      </div>
    );
  }
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, "/account/profile"))}`);

  const { data: profileRow } = await supabase.from("profiles").select("username, display_name, avatar_url, badge").eq("id", user.id).maybeSingle();
  const profile = (profileRow as (Profile & { badge: string | null }) | null) ?? null;
  const name = profile?.display_name || profile?.username || user.email?.split("@")[0] || "player";
  // i numeri sulla vetrina ci sono solo per i ruoli con vetrina (ShowStatsSetting non mostra nulla agli altri)
  const jump = [
    { id: "profile", label: P.sections.profile },
    { id: "avatar", label: P.sections.avatar },
    { id: "showcase", label: P.sections.showcase },
    ...(isShowcaseBadge(profile?.badge) ? [{ id: "showcase-stats", label: P.sections.stats }] : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={href(locale, "/account")} prefetch={false} className="link-mint font-bold">
          ← {P.back}
        </Link>
      </p>
      <h1 className="t-page mt-6">{P.title}</h1>
      <p className="mt-4 max-w-2xl text-chalk-muted">{P.intro}</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {profile?.username ? (
          <Link href={href(locale, `/u/${profile.username}`)} className="btn btn-ink text-xs">
            {c.account.publicPage} →
          </Link>
        ) : null}
      </div>
      <nav aria-label={P.jump} className="mt-6 flex flex-wrap gap-2">
        {jump.map((j) => (
          <a key={j.id} href={`#${j.id}`} className="btn btn-ghost text-xs">
            {j.label}
          </a>
        ))}
      </nav>

      {/* Profilo pubblico (pacchetto CREATOR, 26/09/2026): bio, canali, lingue e link breve /@nome */}
      <ProfileEditor supabase={supabase} userId={user.id} locale={locale} />
      {/* Foto profilo (tutti) e "Personalizza la vetrina" (Creator, Autore, Pro, Staff): pacchetto VETRINA, 27/09/2026 */}
      <ShowcaseEditor supabase={supabase} userId={user.id} locale={locale} name={name} />
      {/* "Mostra i numeri sulla vetrina": solo Creator, Autore, Pro e Staff (pacchetto TRAGUARDI, 27/09/2026) */}
      <ShowStatsSetting supabase={supabase} userId={user.id} locale={locale} />
    </div>
  );
}
