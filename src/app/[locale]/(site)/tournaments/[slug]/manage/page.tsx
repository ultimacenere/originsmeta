import type { Metadata } from "next";
import Link from "@/components/IntentLink";
import { notFound, redirect } from "next/navigation";
import { href, siteUrl } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getFormatOptions, getInviteCode, getStageOptions, getTournament, listBanProgress, listBanStats, listInvites, listJudges, listMatches, listPlayers, listVisibleDecks, withMatchStages } from "@/lib/tournament/queries";
import { defaultSwissRounds, groupCount, groupsProblem, isStagedFormat, openStageMatches } from "@/lib/tournament/formats";
import { formatMatchNames, formatRoundTitle, formatView } from "@/lib/tournament/formatView";
import { formatLabels } from "@/lib/tournament/formatLabels";
import { FormatControls } from "@/components/FormatControls";
import { DoubleElimControls } from "@/components/DoubleElimControls";
import { DeQualified, DoubleElimBracket, dePanelOf } from "@/components/DoubleElimBracket";
import { doubleElimLabels } from "@/lib/tournament/doubleElimLabels";
import { deMinPlayers, poolCounts } from "@/lib/tournament/doubleElim";
import { FormatRounds } from "@/components/FormatRounds";
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

  const staged = isStagedFormat(t.format);
  const [players, matches, invites, inviteCode, decks, stages, banProgress, banStats, fo] = await Promise.all([
    listPlayers(t.id, supabase),
    listMatches(t.id, supabase).then((ms) => withMatchStages(supabase, t.id, t.format, ms)),
    canAdmin ? listInvites(supabase, t.id) : Promise.resolve([]),
    canAdmin ? getInviteCode(supabase, t.id) : Promise.resolve(null),
    listVisibleDecks(t.id, supabase),
    // 08/11/2026 (blocco BRACKET E TOP CUT): opzioni, ban per partita e Leggendarie bannate (lo staff le vede sempre)
    getStageOptions(supabase, t.id),
    listBanProgress(supabase, t.id),
    listBanStats(supabase, t.id),
    getFormatOptions(supabase, t.id),
  ]);
  const sl = stageLabels[locale];
  const fl = formatLabels[locale];
  const dl = doubleElimLabels[locale];
  const sp = await searchParams;
  // svizzera e gironi (09/11/2026): fasi, nomi delle partite e dei turni, pausa della fase finale
  const fv = staged ? formatView({ ...t, ...stages, ...fo }, matches) : null;
  const plan = planOf(fv ? fv.bracket : matches, fv ? null : stages.top_cut);
  const holdFrom = fv ? fv.holdFrom : holdRound(stages, plan);
  const rounds = totalRounds(matches);
  const stage: ManagedStage | null = fv
    ? {
        names: formatMatchNames(locale, x, t.format, fv, matches),
        roundTitles: Object.fromEntries(Array.from({ length: rounds }, (_, i) => [i + 1, formatRoundTitle(locale, x, t.format, fv, i + 1)])),
        banCounts: Object.fromEntries(banProgress),
        banRounds: Array.from({ length: rounds }, (_, i) => i + 1).filter((r) => banApplies({ deck_ban: stages.deck_ban, deck_mode: t.deck_mode, conquest_decks: t.conquest_decks }, matchNeed(t.best_of, t.final_best_of, r, fv.finalRound))),
        release:
          holdFrom !== null && fv.cut
            ? { cut: fv.cut, ready: matches.filter((mt) => mt.round >= holdFrom && mt.status === "pending" && mt.player_a && mt.player_b && !mt.ready_at).length, podsRunning: 0 }
            : null,
        releasedCut: stages.top_cut_released_at && fv.cut ? fv.cut : null,
        labels: sl,
      }
    : plan.topRound !== null || stages.deck_ban
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
    !fv && plan.topRound !== null && plan.topCut
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
  // all'avvio di svizzera e gironi l'anteprima dei bye del tabellone non vale: si dice come parte la fase
  const eligibleN = players.filter((p) => p.status === "registered" && p.decks_submitted).length;
  const startNote = !fv
    ? undefined
    : t.format === "double_elim"
      ? fo.de_pools && fo.de_qualify
        ? eligibleN < deMinPlayers(fo.de_pools, fo.de_qualify) || Math.min(...poolCounts(eligibleN, fo.de_pools)) <= 2 * fo.de_qualify
          ? dl.errors.doubleElim
          : fo.de_pools === 1
            ? fill(dl.startNoteOne, { n: eligibleN, k: fo.de_qualify })
            : fill(dl.startNote, { n: eligibleN, pools: fo.de_pools, k: fo.de_qualify })
        : undefined
    : t.format === "swiss"
      ? `${fill(fl.startSwiss, { n: eligibleN, rounds: fo.swiss_rounds ?? defaultSwissRounds(eligibleN) })}${eligibleN % 2 ? ` ${fl.startSwissBye}` : ""}`
      : fo.group_size
        ? groupsProblem(eligibleN, fo.group_size, fo.group_advance ?? 1)
          ? fl.errors.groups_too_small
          : fill(fo.group_seeding === "random" ? fl.startGroupsRandom : fl.startGroups, { n: eligibleN, groups: groupCount(eligibleN, fo.group_size), k: fo.group_advance ?? 1 })
        : undefined;
  const stageList = fv ? matches.filter((mt) => mt.stage === "swiss" || mt.stage === "group") : [];
  const curRound = fv ? fv.stageRounds : 0;
  const curList = t.format === "swiss" ? stageList.filter((mt) => mt.round === curRound) : stageList;
  // una qualificazione senza fase finale (11/11/2026) si chiude quando tutte le sue partite sono chiuse
  const finishReady = fv ? (fv.qualifier ? matches.length > 0 && fv.open === 0 : fv.bracket.length ? undefined : t.format === "swiss" && !stages.top_cut && curRound >= 1 && openStageMatches(matches).length === 0) : undefined;
  // ... e in fondo alla pagina il riquadro "Chiudi il torneo" dice che finisce con i qualificati
  const panelLabels = fv?.qualifier ? { ...x, manage: { ...x.manage, finishTitle: dl.closeTitle, finishHint: dl.closeHint, finish: dl.close } } : x;
  const allErrors: Record<string, string> = { ...(sl.errors as Record<string, string>), ...(fl.errors as Record<string, string>), ...(dl.errors as Record<string, string>) };
  const deMatches = matches.filter((mt) => mt.stage === "upper" || mt.stage === "lower");

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

      {fv && t.status === "running" && t.format === "double_elim" ? (
        <div className="mt-8">
          <DoubleElimControls
            id={t.id}
            slug={t.slug}
            done={deMatches.filter((mt) => mt.status === "confirmed" || mt.status === "bye").length}
            total={deMatches.length}
            open={fv.open}
            cut={fv.cut ?? 0}
            finalStarted={fv.bracket.length > 0}
            labels={dl}
            warnOpen={fl.roundOpenWarn}
            errors={{ ...(x.errors as Record<string, string>), ...allErrors }}
            qualifier={fv.qualifier}
          />
        </div>
      ) : null}
      {fv && t.status === "running" && (t.format === "swiss" || t.format === "groups") ? (
        <div className="mt-8">
          <FormatControls
            id={t.id}
            slug={t.slug}
            format={t.format}
            round={curRound}
            total={t.format === "swiss" ? fv.plannedRounds : curRound}
            done={curList.filter((mt) => mt.status === "confirmed" || mt.status === "bye").length}
            matches={curList.length}
            open={fv.open}
            cut={t.format === "swiss" ? (stages.top_cut ?? null) : (fo.group_advance ?? null)}
            finalStarted={fv.bracket.length > 0 || Boolean(fv.champion)}
            labels={fl}
            errors={{ ...(x.errors as Record<string, string>), ...allErrors }}
          />
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
          labels={panelLabels}
          visibility={t.visibility}
          inviteLink={inviteLink}
          invites={invitedList}
          canAdmin={canAdmin}
          judges={judges.map((j) => ({ user_id: j.user_id, name: authorName(j.profile) }))}
          stage={stage}
          finalRound={fv ? fv.finalRound : undefined}
          finishReady={finishReady}
          startNote={startNote}
          extraErrors={allErrors}
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
        <section id="de" className="card-night mt-6 scroll-mt-24 p-5">
          <h2 className="t-section">
            {x.bracket}
            {/* gli scambi a due clic valgono nel tabellone a eliminazione diretta: nella doppia eliminazione solo nella fase finale, quando c'è */}
            {t.status === "running" && !(t.format === "double_elim" && !fv?.bracket.length) ? <span className="ml-2 text-sm font-normal text-pale-muted">· {x.manage.swapTitle}</span> : null}
          </h2>
          {fv ? (
            /* svizzera e gironi (09/11/2026): turni con le stanze, poi il tabellone della fase finale (scambi solo lì e nel turno svizzero in corso) */
            <>
              {t.format === "double_elim" && fv.de ? (
                <>
                  {fv.qualifier ? <DeQualified matches={matches} plan={fv.de} names={names} labels={dl} /> : null}
                  <DoubleElimBracket
                    matches={matches}
                    plan={fv.de}
                    names={names}
                    dict={d}
                    labels={dl}
                    panel={dePanelOf(typeof sp.b === "string" ? sp.b : undefined, fv.de, matches, null)}
                    hrefFor={(id) => `${back}/manage?b=${id}#de`}
                    open={{ linkBase: `${back}/match/`, viewer: null, all: true }}
                  />
                </>
              ) : (
                <FormatRounds matches={matches} names={names} total={t.format === "swiss" ? fv.plannedRounds : 0} groups={t.format === "groups"} dict={d} labels={fl} open={{ linkBase: `${back}/match/`, viewer: null, all: true }} />
              )}
              {fv.bracket.length ? (
                <div className="mt-5">
                  <h3 className="t-item">{t.format === "swiss" ? fill(sl.top, { n: fv.cut ?? 0 }) : t.format === "double_elim" ? fill(dl.final, { n: fv.cut ?? 0 }) : fl.finalStage}</h3>
                  {t.status === "running" ? (
                    <BracketEditor id={t.id} slug={t.slug} matches={fv.bracket} names={Object.fromEntries(names)} labels={x} linkBase={`${back}/match/`} />
                  ) : (
                    <div className="mt-2">
                      <Bracket matches={fv.bracket} names={names} dict={d} open={{ linkBase: `${back}/match/`, all: true }} />
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : t.status === "running" ? (
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
              formatText={fl}
              deText={dl}
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
                format: t.format,
                swiss_rounds: fo.swiss_rounds,
                group_size: fo.group_size,
                group_advance: fo.group_advance,
                group_seeding: fo.group_seeding,
                sideboard: fo.sideboard,
                de_pools: fo.de_pools,
                de_qualify: fo.de_qualify,
                de_qualifier: fo.de_qualifier,
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
