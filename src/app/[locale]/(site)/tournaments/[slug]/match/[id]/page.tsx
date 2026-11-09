import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { href } from "@/lib/i18n";
import { pageMeta, resolveLocale } from "@/lib/page";
import { currentUser } from "@/lib/supabase/server";
import { getFormatOptions, getMatch, getStageOptions, getTournament, listLegendaries, listMatchBans, listMatchSideSwaps, listMatches, listMessages, listPlayers, listSideboards, listVisibleDecks, withMatchStages } from "@/lib/tournament/queries";
import { isStagedFormat } from "@/lib/tournament/formats";
import { formatMatchName, formatView } from "@/lib/tournament/formatView";
import { formatLabels } from "@/lib/tournament/formatLabels";
import { SidePanel } from "@/components/SidePanel";
import { SCREENSHOT_BUCKET, bestOfLabel, fill, totalRounds } from "@/lib/tournament/types";
import { matchBestOf, matchNeed } from "@/lib/tournament/rules";
import { banApplies, banState, holdRound, isHeld, planOf } from "@/lib/tournament/stages";
import { stageLabels } from "@/lib/tournament/stageLabels";
import { stageMatchName } from "@/lib/tournament/stageNames";
import { BanPanel, type BanDeck } from "@/components/BanPanel";
import { authorName } from "@/lib/community/util";
import { decodeOmCode } from "@/lib/deckcode";
import { getCard } from "@/lib/data/cards";
import { CardChip } from "@/components/CardChip";
import { MatchRoom } from "@/components/MatchRoom";
import { withCarriedParams } from "@/lib/analytics";

type Params = Promise<{ locale: string; slug: string; id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Stanza della partita: solo i due giocatori e lo staff del torneo (organizzatore, arbitri, admin). Dinamica (sessione), passa dal proxy. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, id } = await params;
  const { locale, dict } = await resolveLocale(params);
  return { ...pageMeta(locale, `/tournaments/${slug}/match/${id}`, dict.tournaments.match.title, dict.tournaments.match.chatHint), robots: { index: false, follow: false } };
}

async function signedScreens(client: NonNullable<Awaited<ReturnType<typeof currentUser>>["supabase"]>, matchId: string, uid: string | null): Promise<string[]> {
  if (!uid) return [];
  const { data: files } = await client.storage.from(SCREENSHOT_BUCKET).list(`${matchId}/${uid}`, { limit: 10 });
  const paths = (files ?? []).filter((f) => f.name && !f.name.startsWith(".")).map((f) => `${matchId}/${uid}/${f.name}`);
  if (!paths.length) return [];
  const { data: signed } = await client.storage.from(SCREENSHOT_BUCKET).createSignedUrls(paths, 900);
  return (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => Boolean(u));
}

export default async function MatchPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug, id } = await params;
  const { locale, dict: d } = await resolveLocale(params);
  const x = d.tournaments;
  const l = x.match;
  const path = href(locale, `/tournaments/${slug}/match/${id}`);
  const back = href(locale, `/tournaments/${slug}`);
  const { supabase, user } = await currentUser();
  if (!supabase) return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><p className="card-night p-6 text-pale-muted">{x.errors.disabled}</p></div>;
  if (!user) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(path)}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const t = await getTournament(slug, supabase);
  if (!t) notFound();
  const match = await getMatch(id, supabase);
  if (!match || match.tournament_id !== t.id) notFound();

  const side: "a" | "b" | null = match.player_a === user.id ? "a" : match.player_b === user.id ? "b" : null;
  // organizzatore, arbitri e admin (05/10/2026: anche gli arbitri) vedono tutte le partite
  const { data: staff } = side === null ? await supabase.rpc("is_tournament_staff", { tid: t.id }) : { data: false };
  // chi non gioca la partita torna alla scheda, con il segnale dell'accesso se arriva dal login (lo conta la scheda)
  if (side === null && staff !== true) redirect(withCarriedParams(back, await searchParams));

  const staged = isStagedFormat(t.format);
  const [players, decks, legendaries, allMatches, messages, screensA, screensB, stages, bans, fo, sides, sideSwaps] = await Promise.all([
    listPlayers(t.id, supabase),
    listVisibleDecks(t.id, supabase),
    listLegendaries(t.id, supabase),
    listMatches(t.id, supabase).then((ms) => withMatchStages(supabase, t.id, t.format, ms)),
    listMessages(match.id, supabase),
    signedScreens(supabase, match.id, match.player_a),
    signedScreens(supabase, match.id, match.player_b),
    // 08/11/2026: fase finale in pausa e ban (letture che reggono il database non ancora migrato)
    getStageOptions(supabase, t.id),
    listMatchBans(supabase, match.id),
    // 09/11/2026: sideboard (riserve visibili con le regole delle liste e scambi dichiarati)
    getFormatOptions(supabase, t.id),
    listSideboards(supabase, t.id),
    listMatchSideSwaps(supabase, match.id),
  ]);
  const sl = stageLabels[locale];
  const fl = formatLabels[locale];
  const fv = staged ? formatView({ ...t, ...stages, ...fo }, allMatches) : null;
  const thisMatch = allMatches.find((m) => m.id === match.id) ?? match;
  const plan = planOf(fv ? fv.bracket : allMatches, fv ? null : stages.top_cut);
  const held = isHeld(match, fv ? fv.holdFrom : holdRound(stages, plan));
  const nameOf = new Map(players.map((p) => [p.user_id, authorName(p.profile)]));
  const names = { a: match.player_a ? nameOf.get(match.player_a) ?? "?" : l.tbd, b: match.player_b ? nameOf.get(match.player_b) ?? "?" : match.status === "bye" ? "bye" : l.tbd };

  // svizzera e gironi: la finale è l'ultimo turno del tabellone (0 finché non c'è)
  const rounds = fv ? fv.finalRound : totalRounds(allMatches);
  const need = matchNeed(t.best_of, t.final_best_of, match.round, rounds);
  const isFinal = Boolean(t.final_best_of) && match.round === rounds;
  const stageName = fv ? formatMatchName(locale, x, t.format, fv, thisMatch) : plan.topRound !== null ? stageMatchName(locale, x, plan, match.round, match.position) : fill(l.round, { n: match.round });

  // Ban (08/11/2026): mazzi dei due giocatori nell'ordine di consegna, con la Leggendaria (dalla lista se si vede, se no
  // dalle Leggendarie che il database mostra all'avversario)
  const withBan = Boolean(stages.deck_ban) && t.deck_mode === "conquest";
  const banHere = banApplies({ deck_ban: stages.deck_ban, deck_mode: t.deck_mode, conquest_decks: t.conquest_decks }, need);
  const decksOf = (uid: string | null): BanDeck[] => {
    if (!uid) return [];
    const row = decks.find((r) => r.user_id === uid);
    const slugs: (string | null)[] = row ? row.codes.map((c) => decodeOmCode(c)?.legendary ?? null) : (legendaries.get(uid) ?? []);
    return Array.from({ length: t.conquest_decks }, (_, i) => {
      const card = slugs[i] ? getCard(slugs[i] as string) : undefined;
      return { idx: i, name: card?.name ?? fill(sl.deckN, { n: i + 1 }), thumb: card?.thumb ?? card?.image ?? null };
    });
  };
  const bothPlayers = Boolean(match.player_a && match.player_b);
  const bansDone = banState(bans, match.player_a ?? "", match.player_b).done;
  const reportLock = banHere && bothPlayers && !bansDone ? sl.banReportFirst : null;
  const extraErrors: Record<string, string> = { ...sl.errors, ...fl.errors };
  // sideboard: riserva propria sempre, dell'avversario solo se la sua lista si vede (stesse regole); carte per nome
  const sideOf = (uid: string | null) => (uid ? (decks.some((r) => r.user_id === uid) ? (sides.get(uid) ?? []) : null) : null);
  const sidePlayers = [match.player_a, match.player_b].filter((u): u is string => Boolean(u)).map((u) => ({ id: u, name: nameOf.get(u) ?? "?", side: sideOf(u) }));
  const cardName = (slug: string) => getCard(slug)?.name ?? slug;
  const myCodes = side ? (decks.find((r) => r.user_id === user.id)?.codes ?? []) : [];
  const myDecks = myCodes.map((c, i) => {
    const deck = decodeOmCode(c);
    return { name: deck?.legendary ? cardName(deck.legendary) : fill(sl.deckN, { n: i + 1 }), cards: deck?.cards ?? [] };
  });
  const cardNames = Object.fromEntries([...new Set([...myDecks.flatMap((dk) => dk.cards), ...sidePlayers.flatMap((p) => p.side ?? []), ...sideSwaps.flatMap((s) => s.swaps.flatMap((x) => [x.out, x.in]))])].map((sg) => [sg, cardName(sg)]));
  const deckNames = Object.fromEntries(sidePlayers.map((p) => [p.id, (decks.find((r) => r.user_id === p.id)?.codes ?? []).map((c, i) => { const dk = decodeOmCode(c); return dk?.legendary ? cardName(dk.legendary) : fill(sl.deckN, { n: i + 1 }); })]));

  const deckBlock = (uid: string | null, title: string) => {
    if (!uid) return null;
    const row = decks.find((r) => r.user_id === uid);
    // liste segrete (05/10/2026): dell'avversario si vedono solo le Leggendarie, come nel ban della Crimson Cup
    const legs = row ? [] : (legendaries.get(uid) ?? []);
    if (!row && legs.length)
      return (
        <div className="rounded-lg border-2 border-sky bg-night-2/70 p-3">
          <p className="kicker text-mint">{title}</p>
          <p className="mt-1 text-sm font-semibold text-pale">{nameOf.get(uid) ?? "?"}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {legs.map((slug, i) => {
              const leg = getCard(slug);
              return <li key={i}>{leg ? <CardChip slug={leg.slug} locale={locale} /> : null}</li>;
            })}
          </ul>
          <p className="mt-2 text-xs text-pale-muted">{l.hiddenNote}</p>
        </div>
      );
    return (
      <div className="rounded-lg border-2 border-sky bg-night-2/70 p-3">
        <p className="kicker text-mint">{title}</p>
        <p className="mt-1 text-sm font-semibold text-pale">{nameOf.get(uid) ?? "?"}</p>
        {row?.codes.length ? (
          <ul className="mt-2 flex flex-col gap-2">
            {row.codes.map((code, i) => {
              const deck = decodeOmCode(code);
              const leg = deck?.legendary ? getCard(deck.legendary) : undefined;
              return (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  {leg ? <CardChip slug={leg.slug} locale={locale} /> : null}
                  <Link href={`${href(locale, "/deck-builder")}#${code}`} className="btn btn-ink text-xs">
                    {l.openDeck}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-pale-muted">{l.noDecks}</p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm">
        <Link href={back} className="text-chalk-muted hover:text-chalk">
          ← {t.name}
        </Link>
      </p>
      <p className="mt-6 kicker text-mint">
        {x.kicker} · {t.tag} · {stageName}
      </p>
      <h1 className="t-page mt-2">
        {names.a} <span className="text-pale-muted">{l.vs}</span> {names.b}
      </h1>
      <p className="mt-2 text-sm text-pale-muted">
        {x.deckModes[t.deck_mode]} · {bestOfLabel(x, matchBestOf(t.best_of, t.final_best_of, match.round, rounds))}
        {isFinal ? ` · ${l.finalNote}` : ""}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {deckBlock(match.player_a, side === "a" ? l.yourDecks : side === "b" ? l.opponentDecks : names.a)}
        {deckBlock(match.player_b, side === "b" ? l.yourDecks : side === "a" ? l.opponentDecks : names.b)}
      </div>

      {withBan && bothPlayers && match.status !== "bye" ? (
        <div className="mt-6">
          {banHere ? (
            <BanPanel
              matchId={match.id}
              side={side}
              playerA={match.player_a as string}
              playerB={match.player_b as string}
              names={names}
              decksA={decksOf(match.player_a)}
              decksB={decksOf(match.player_b)}
              initialBans={bans}
              open={t.status === "running" && match.status === "pending" && !held}
              labels={sl}
              errors={{ ...x.errors, ...extraErrors }}
            />
          ) : (
            <p className="card-night p-4 text-sm text-pale-muted">{sl.banNone}</p>
          )}
        </div>
      ) : null}

      {fo.sideboard && bothPlayers && match.status !== "bye" ? (
        <div className="mt-6">
          <SidePanel
            matchId={match.id}
            me={side ? user.id : null}
            players={sidePlayers}
            myDecks={myDecks}
            games={need * 2 - 1}
            swaps={sideSwaps}
            cardNames={cardNames}
            open={t.status === "running" && match.status === "pending" && !held}
            labels={fl}
            deckNames={deckNames}
            errors={{ ...(x.errors as Record<string, string>), ...extraErrors }}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <MatchRoom
          slug={t.slug}
          matchId={match.id}
          me={user.id}
          side={side}
          match={match}
          names={names}
          need={need}
          noShowMinutes={t.no_show_minutes}
          running={t.status === "running"}
          initialMessages={messages}
          screens={{ a: screensA, b: screensB }}
          tournamentHref={back}
          labels={x}
          held={held}
          heldText={held ? fill(sl.holdRoom, { n: fv ? (fv.cut ?? 0) : (plan.topCut ?? 0) }) : null}
          reportLock={reportLock}
          extraErrors={extraErrors}
        />
      </div>
    </div>
  );
}
