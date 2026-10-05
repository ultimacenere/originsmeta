import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getInviteCode, getTournament, listInvites, listJudges, listMatches, listPlayers, listVisibleDecks } from "@/lib/tournament/queries";
import { bestOfSummary, canListTournaments, tournamentInviteLink, tournamentShortLink } from "@/lib/tournament/types";
import { authorName } from "@/lib/community/util";
import { decodeOmCode } from "@/lib/deckcode";
import { getCard } from "@/lib/data/cards";
import { CardChip } from "@/components/CardChip";
import { ManagePanel, type ManagedPlayer } from "@/components/ManagePanel";
import { TournamentForm } from "@/components/TournamentForm";
import { Bracket } from "@/components/Bracket";
import { BracketEditor } from "@/components/BracketEditor";
import { LocalTime } from "@/components/LocalTime";
import { CopyButton } from "@/components/CopyButton";
import { contactEmail } from "@/components/Footer";
import { withCarriedParams } from "@/lib/analytics";

type Params = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Pagina dello staff del torneo (organizzatore, arbitri dal 05/10/2026, admin): dinamica, legge la sessione, passa dal proxy. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, `/tournaments/${slug}/manage`, dict.tournaments.manage.title, dict.tournaments.manage.intro), robots: { index: false, follow: false } };
}

export default async function ManageTournamentPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
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
  const canAdmin = t.organizer === user.id || profile?.role === "admin";
  const judges = await listJudges(t.id, supabase);
  const isJudge = judges.some((j) => j.user_id === user.id);
  // chi non fa parte dello staff torna alla scheda, con il segnale dell'accesso se arriva dal login (lo conta la scheda)
  if (!canAdmin && !isJudge) redirect(withCarriedParams(back, await searchParams));

  const [players, matches, invites, inviteCode, decks] = await Promise.all([listPlayers(t.id, supabase), listMatches(t.id, supabase), canAdmin ? listInvites(supabase, t.id) : Promise.resolve([]), canAdmin ? getInviteCode(supabase, t.id) : Promise.resolve(null), listVisibleDecks(t.id, supabase)]);
  const managed: ManagedPlayer[] = players.map((p) => ({ user_id: p.user_id, name: authorName(p.profile), status: p.status, decks: p.decks_submitted, checkedInAt: p.checked_in_at, createdAt: p.created_at }));
  const names = new Map(managed.map((p) => [p.user_id, p.name]));
  const invitedList = invites.map((i) => ({ user_id: i.user_id, name: authorName(i.profile), registered: players.some((p) => p.user_id === i.user_id) }));
  const inviteLink = inviteCode ? tournamentInviteLink(siteUrl, t.tag, inviteCode) : null;
  const shortLink = tournamentShortLink(siteUrl, t.tag);

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
      <h1 className="t-page mt-2">{x.manage.title}</h1>
      <p className="mt-3 max-w-3xl text-chalk-muted">{x.manage.intro}</p>
      {!canAdmin ? <p className="mt-2 text-sm text-gold">{x.manage.asJudge}</p> : null}
      <p className="mt-2 flex flex-wrap gap-2 text-sm">
        <span className="stat-pill border border-sky text-pale">
          {x.startsAt}: <LocalTime iso={t.starts_at} locale={locale} utcLabel={x.utc} />
        </span>
        <span className="stat-pill bg-night-3 text-pale">{x.deckModes[t.deck_mode]}</span>
        <span className="stat-pill bg-night-3 text-pale">{bestOfSummary(x, t.best_of, t.final_best_of)}</span>
      </p>
      {/* link breve anche qui, dove l'organizzatore torna più spesso (UX-9); per i privati si condivide il link d'invito, sotto */}
      {t.visibility === "public" && (t.status === "open" || t.status === "running") ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border-2 border-sky bg-night-2/70 p-3">
          <span className="kicker text-mint">{x.shortLinkLabel}</span>
          <code className="max-w-full break-all rounded bg-night px-2 py-1 font-mono text-sm text-chalk">{shortLink}</code>
          <CopyButton text={shortLink} label={x.copyLink} copied={x.copied} className="btn btn-ink text-xs" />
        </div>
      ) : null}

      <div className="mt-8">
        <ManagePanel
          id={t.id}
          slug={t.slug}
          status={t.status}
          size={t.size}
          bestOf={t.best_of}
          finalBestOf={t.final_best_of}
          noShowMinutes={t.no_show_minutes}
          checkin={t.checkin}
          startsAt={t.starts_at}
          locale={locale}
          players={managed}
          matches={matches}
          tournamentHref={back}
          labels={x}
          visibility={t.visibility}
          inviteLink={inviteLink}
          invites={invitedList}
          canAdmin={canAdmin}
          judges={judges.map((j) => ({ user_id: j.user_id, name: authorName(j.profile) }))}
        />
      </div>

      {matches.length ? (
        <section className="card-night mt-6 p-5">
          <h2 className="t-section">
            {x.bracket}
            {t.status === "running" ? <span className="ml-2 text-sm font-normal text-pale-muted">· {x.manage.swapTitle}</span> : null}
          </h2>
          {t.status === "running" ? (
            /* a torneo in corso il tabellone è interattivo: due clic scambiano i giocatori di partite dello stesso turno ancora da giocare */
            <BracketEditor id={t.id} slug={t.slug} matches={matches} names={Object.fromEntries(names)} labels={x} linkBase={`${back}/match/`} />
          ) : (
            <div className="mt-3">
              <Bracket matches={matches} names={names} dict={d} open={{ linkBase: `${back}/match/`, all: true }} />
            </div>
          )}
        </section>
      ) : null}

      {/* Controllo dei mazzi: tutte le liste consegnate (lo staff le legge sempre, per policy) */}
      {decks.length ? (
        <details className="card-night group mt-6 p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <h2 className="t-section">
              {x.manage.decksTitle} <span className="font-mono text-sm font-normal text-pale-muted">{decks.length}</span>
            </h2>
            <span aria-hidden="true" className="font-mono text-lg text-sky transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <p className="mt-2 text-sm text-pale-muted">{x.manage.decksHint}</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {decks.map((row) => (
              <li key={row.user_id} className="rounded-lg border-2 border-sky bg-night-2/70 p-3">
                <p className="t-item text-base">{names.get(row.user_id) ?? "?"}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {row.codes.map((code, i) => {
                    const deck = decodeOmCode(code);
                    const leg = deck?.legendary ? getCard(deck.legendary) : undefined;
                    return (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        {leg ? <CardChip slug={leg.slug} locale={locale} /> : null}
                        <Link href={`${href(locale, "/deck-builder")}#${code}`} className="btn btn-ink text-xs">
                          {d.community.openInBuilder}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {canAdmin && (t.status === "open" || t.status === "running") ? (
        <section className="mt-10">
          <h2 className="t-section">{x.manage.editTitle}</h2>
          <p className="mt-1 text-sm text-pale-muted">{x.manage.editHint}</p>
          <div className="mt-4">
            <TournamentForm
              mode="edit"
              locale={locale}
              userId={user.id}
              canList={canListTournaments(profile) || t.organizer !== user.id}
              labels={x}
              loginHref={`${href(locale, "/login")}?next=${encodeURIComponent(path)}`}
              contactEmail={contactEmail}
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
                final_best_of: t.final_best_of,
                checkin: t.checkin,
                hidden_decklists: t.hidden_decklists,
                no_show_minutes: t.no_show_minutes,
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
