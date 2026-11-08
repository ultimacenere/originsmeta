import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getInviteCode, getStageOptions, getTournament, listBanProgress, listBanStats, listInvites, listJudges, listMatches, listPlayers, listVisibleDecks } from "@/lib/tournament/queries";
import { bestOfSummary, canListTournaments, fill, totalRounds, tournamentInviteLink, tournamentShortLink } from "@/lib/tournament/types";
import { matchNeed } from "@/lib/tournament/rules";
import { banApplies, banRate, holdRound, planOf, podLetter, podMatches, podWinner, podsDone, topMatches } from "@/lib/tournament/stages";
import { stageLabels } from "@/lib/tournament/stageLabels";
import { stageMatchNames, stageRoundTitle } from "@/lib/tournament/stageNames";
import { podRoundNames } from "@/components/StagedBracket";
import type { EditorGroup } from "@/components/BracketEditor";
import type { ManagedStage } from "@/components/ManagePanel";
import { authorName } from "@/lib/community/util";
import { decodeOmCode } from "@/lib/deckcode";
import { getCard } from "@/lib/data/cards";
import { CardChip } from "@/components/CardChip";
import { ManagePanel, type ManagedPlayer } from "@/components/ManagePanel";
import { TournamentForm } from "@/components/TournamentForm";
import { Bracket } from "@/components/Bracket";
import { BracketEditor } from "@/components/BracketEditor";
import { StagedBracket } from "@/components/StagedBracket";
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

  const [players, matches, invites, inviteCode, decks, stages, banProgress, banStats] = await Promise.all([
    listPlayers(t.id, supabase),
    listMatches(t.id, supabase),
    canAdmin ? listInvites(supabase, t.id) : Promise.resolve([]),
    canAdmin ? getInviteCode(supabase, t.id) : Promise.resolve(null),
    listVisibleDecks(t.id, supabase),
    // 08/11/2026 (blocco BRACKET E TOP CUT): opzioni, ban per partita e Leggendarie bannate (lo staff le vede sempre)
    getStageOptions(supabase, t.id),
    listBanProgress(supabase, t.id),
    listBanStats(supabase, t.id),
  ]);
  const sl = stageLabels[locale];
  const plan = planOf(matches, stages.top_cut);
  const holdFrom = holdRound(stages, plan);
  const rounds = totalRounds(matches);
  const stage: ManagedStage | null =
    plan.topRound !== null || stages.deck_ban
      ? {
          names: plan.topRound !== null ? stageMatchNames(locale, x, plan, matches) : {},
          roundTitles: plan.topRound !== null ? Object.fromEntries(Array.from({ length: rounds }, (_, i) => [i + 1, stageRoundTitle(locale, x, plan, i + 1)])) : {},
          banCounts: Object.fromEntries(banProgress),
          banRounds: Array.from({ length: rounds }, (_, i) => i + 1).filter((r) => banApplies({ deck_ban: stages.deck_ban, deck_mode: t.deck_mode, conquest_decks: t.conquest_decks }, matchNeed(t.best_of, t.final_best_of, r, rounds))),
          release:
            holdFrom !== null && plan.topCut
              ? {
                  cut: plan.topCut,
                  ready: matches.filter((mt) => mt.round >= holdFrom && mt.status === "pending" && mt.player_a && mt.player_b && !mt.ready_at).length,
                  podsRunning: plan.pods - podsDone(matches, plan),
                }
              : null,
          releasedCut: stages.top_cut_released_at && plan.topCut ? plan.topCut : null,
          labels: sl,
        }
      : null;
  // tabellone dello staff a schede, come quello pubblico (un bracket per scheda, poi la Top)
  const editorGroups: EditorGroup[] | undefined =
    plan.topRound !== null && plan.topCut
      ? [
          ...Array.from({ length: plan.pods }, (_, p) => ({
            id: podLetter(p),
            short: podLetter(p),
            label: fill(sl.pod, { letter: podLetter(p) }),
            done: Boolean(podWinner(matches, plan, p)),
            matches: podMatches(matches, plan, p),
            roundNames: podRoundNames(locale, plan),
            championLabel: fill(sl.podWinner, { n: plan.topCut ?? 0 }),
          })),
          { id: "top", short: fill(sl.top, { n: plan.topCut }), label: fill(sl.top, { n: plan.topCut }), top: true, matches: topMatches(matches, plan) },
        ]
      : undefined;
  const firstOpenPod = editorGroups ? editorGroups.findIndex((g) => !g.top && !g.done) : -1;
  const initialGroup = editorGroups ? (firstOpenPod >= 0 ? editorGroups[firstOpenPod].id : "top") : undefined;
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
          stage={stage}
        />
      </div>

      {/* Leggendarie bannate (08/11/2026): allo staff anche a torneo in corso, per la diretta */}
      {banStats.length ? (
        <section className="card-night mt-6 p-5">
          <h2 className="t-section">{sl.banStatsTitle}</h2>
          <p className="mt-1 text-sm text-pale-muted">{sl.banStatsHint}</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {banStats.slice(0, 16).map((b) => (
              <li key={b.legendary} className="flex items-center gap-3 rounded-lg border-2 border-sky bg-night-2/70 px-3 py-2">
                {getCard(b.legendary) ? <CardChip slug={b.legendary} locale={locale} /> : <span className="text-pale">{b.legendary}</span>}
                <span className="ml-auto font-mono text-sm text-pale">{Math.round(banRate(b) * 100)}%</span>
                <span className="font-mono text-[11px] text-pale-muted">{fill(sl.banStatsRow, { bans: b.bans, chances: b.chances })}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {matches.length ? (
        <section className="card-night mt-6 p-5">
          <h2 className="t-section">
            {x.bracket}
            {t.status === "running" ? <span className="ml-2 text-sm font-normal text-pale-muted">· {x.manage.swapTitle}</span> : null}
          </h2>
          {t.status === "running" ? (
            /* a torneo in corso il tabellone è interattivo: due clic scambiano i giocatori di partite dello stesso turno ancora da giocare */
            <BracketEditor id={t.id} slug={t.slug} matches={matches} names={Object.fromEntries(names)} labels={x} linkBase={`${back}/match/`} groups={editorGroups} initialGroup={initialGroup} tabsLabel={sl.tabsLabel} mineLabel={sl.yours} />
          ) : (
            <div className="mt-3">
              {plan.topRound !== null ? (
                <StagedBracket matches={matches} plan={plan} names={names} dict={d} locale={locale} open={{ linkBase: `${back}/match/`, all: true }} holdFrom={holdFrom} />
              ) : (
                <Bracket matches={matches} names={names} dict={d} open={{ linkBase: `${back}/match/`, all: true }} />
              )}
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
              stageText={sl}
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
                top_cut: stages.top_cut,
                top_cut_hold: stages.top_cut_hold,
                deck_ban: stages.deck_ban,
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
