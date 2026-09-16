import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getInviteCode, getTournament, listInvites, listMatches, listPlayers } from "@/lib/tournament/queries";
import { canListTournaments, fill, tournamentInviteLink } from "@/lib/tournament/types";
import { authorName } from "@/lib/community/util";
import { ManagePanel, type ManagedPlayer } from "@/components/ManagePanel";
import { TournamentForm } from "@/components/TournamentForm";
import { Bracket } from "@/components/Bracket";
import { LocalTime } from "@/components/LocalTime";

type Params = Promise<{ locale: string; slug: string }>;

/** Pagina dell'organizzatore (o di un admin): dinamica, legge la sessione, passa dal proxy. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, `/tournaments/${slug}/manage`, dict.tournaments.manage.title, dict.tournaments.manage.intro), robots: { index: false, follow: false } };
}

export default async function ManageTournamentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const path = href(locale, `/tournaments/${slug}/manage`);
  const back = href(locale, `/tournaments/${slug}`);
  const { supabase, user } = await currentUser();
  if (!supabase) return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><p className="card-night p-6 text-pale-muted">{x.errors.disabled}</p></div>;
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);

  const t = await getTournament(slug, supabase);
  if (!t) notFound();
  const { data: prof } = await supabase.from("profiles").select("badge, role").eq("id", user.id).maybeSingle();
  const profile = (prof as { badge: string; role: string } | null) ?? null;
  if (t.organizer !== user.id && profile?.role !== "admin") redirect(back);

  const [players, matches, invites, inviteCode] = await Promise.all([listPlayers(t.id, supabase), listMatches(t.id, supabase), listInvites(supabase, t.id), getInviteCode(supabase, t.id)]);
  const managed: ManagedPlayer[] = players.map((p) => ({ user_id: p.user_id, name: authorName(p.profile), status: p.status, decks: p.decks_submitted }));
  const names = new Map(managed.map((p) => [p.user_id, p.name]));
  const invitedList = invites.map((i) => ({ user_id: i.user_id, name: authorName(i.profile), registered: players.some((p) => p.user_id === i.user_id) }));
  const inviteLink = inviteCode ? tournamentInviteLink(siteUrl, t.tag, inviteCode) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={back} className="text-chalk-muted hover:text-chalk">
          ← {t.name}
        </Link>
      </p>
      <p className="mt-6 kicker text-mint">
        {x.kicker} · {t.tag} · {x.statuses[t.status]}
      </p>
      <h1 className="mt-2 text-4xl font-extrabold text-sky sm:text-5xl">{x.manage.title}</h1>
      <p className="mt-3 max-w-3xl text-chalk-muted">{x.manage.intro}</p>
      <p className="mt-2 flex flex-wrap gap-2 text-sm">
        <span className="stat-pill border border-sky text-crimson">
          {x.startsAt}: <LocalTime iso={t.starts_at} locale={locale} utcLabel={x.utc} />
        </span>
        <span className="stat-pill bg-night-3 text-pale">{x.deckModes[t.deck_mode]}</span>
        <span className="stat-pill bg-night-3 text-pale">{fill(x.bestOf, { n: t.best_of })}</span>
      </p>

      <div className="mt-8">
        <ManagePanel id={t.id} slug={t.slug} status={t.status} size={t.size} bestOf={t.best_of} players={managed} matches={matches} tournamentHref={back} labels={x} visibility={t.visibility} inviteLink={inviteLink} invites={invitedList} />
      </div>

      {matches.length ? (
        <section className="card-night mt-6 p-5">
          <h2 className="text-xl font-extrabold text-sky">{x.bracket}</h2>
          <div className="mt-3">
            <Bracket matches={matches} names={names} dict={d} />
          </div>
        </section>
      ) : null}

      {t.status === "open" || t.status === "running" ? (
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-sky">{x.manage.editTitle}</h2>
          <p className="mt-1 text-sm text-pale-muted">{x.manage.editHint}</p>
          <div className="mt-4">
            <TournamentForm
              mode="edit"
              locale={locale}
              userId={user.id}
              canList={canListTournaments(profile) || t.organizer !== user.id}
              labels={x}
              loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`}
              initial={{
                id: t.id,
                status: t.status,
                name: t.name,
                cover_url: t.cover_url,
                starts_at: t.starts_at,
                size: t.size,
                deck_mode: t.deck_mode,
                conquest_decks: t.conquest_decks,
                conquest_min_different: t.conquest_min_different,
                best_of: t.best_of,
                lang: t.lang,
                description: t.description,
                rules: t.rules,
                discord_url: t.discord_url,
                listed: t.listed,
                visibility: t.visibility,
              }}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
