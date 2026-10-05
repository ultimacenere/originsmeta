"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { bracketSize, roundsOf } from "@/lib/tournament/bracket";
import { fill, type TournamentMatch, type TournamentStatus } from "@/lib/tournament/types";
import { LONG_MATCH_MINUTES, STALE_REPORT_MINUTES, checkinPhase, checkinWindow, formatCountdown, matchNeed, seatPlan, staffQueue, validNeedScore, type QueueKind } from "@/lib/tournament/rules";
import { addJudge, cancelTournament, dropPlayer, finishTournament, invitePlayer, removeJudge, revokeInvite, rotateInviteCode, setMatchResult, staffCheckIn, startTournament } from "@/lib/tournament/actions";
import { useNow } from "@/lib/useNow";
import { CopyButton } from "./CopyButton";
import { LocalTime } from "./LocalTime";

export type ManagedPlayer = { user_id: string; name: string; status: string; decks: boolean; checkedInAt: string | null; createdAt: string };
export type ManagedInvite = { user_id: string; name: string; registered: boolean };
export type ManagedJudge = { user_id: string; name: string };

type Props = {
  id: string;
  slug: string;
  status: TournamentStatus;
  size: number;
  bestOf: number;
  /** 05/10/2026: lunghezza della finale, minuti di assenza, check-in e inizio (finestra del check-in) */
  finalBestOf: number | null;
  noShowMinutes: number | null;
  checkin: boolean;
  startsAt: string;
  locale: string;
  players: ManagedPlayer[];
  matches: TournamentMatch[];
  tournamentHref: string;
  labels: Dictionary["tournaments"];
  /** tornei privati a invito: link segreto (solo organizzatore/admin) e invitati per nome utente */
  visibility: string;
  inviteLink: string | null;
  invites: ManagedInvite[];
  /** organizzatore o admin: inviti, arbitri, annullamento. Gli arbitri gestiscono tutto il resto. */
  canAdmin: boolean;
  judges: ManagedJudge[];
};

type Result = { error?: string; ok?: boolean };

/** Ogni quanto si rilegge la pagina mentre il torneo è vivo (check-in in corso o tabellone avviato). */
const REFRESH_MS = 20_000;

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pannello dello staff (organizzatore, arbitri, admin): coda "Da sistemare", check-in, iscritti (con rimozione),
 * avvio con ordine casuale o manuale e anteprima dei bye (con il check-in decide il database), risultati imposti e
 * scambi a torneo in corso, chiusura con referto; solo organizzatore e admin: inviti, arbitri, annullamento. Ogni
 * azione chiama una Server Action → RPC con lock; poi la pagina (dinamica) si ricarica, e mentre il torneo è vivo si
 * rilegge da sola ogni 20 secondi.
 */
export function ManagePanel(props: Props) {
  const { id, slug, status, size, bestOf, finalBestOf, noShowMinutes, checkin, startsAt, locale, players, matches, tournamentHref, labels, visibility, inviteLink, invites, canAdmin, judges } = props;
  const x = labels;
  const m = x.manage;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const live = status === "running" || (status === "open" && checkin);
  const now = useNow(1000, live);

  // rilettura automatica: solo con la scheda visibile e senza un'azione in corso
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [live, router]);

  const registered = players.filter((p) => p.status === "registered");
  const waitlist = players.filter((p) => p.status === "waitlist").sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const eligible = useMemo(() => players.filter((p) => p.status === "registered" && p.decks), [players]);
  const excluded = registered.filter((p) => !p.decks).length;
  const [order, setOrder] = useState<string[] | null>(null);
  const seeding = order ?? eligible.map((p) => p.user_id);
  const nameOf = useMemo(() => new Map(players.map((p) => [p.user_id, p.name])), [players]);
  const plan = checkin ? seatPlan(players.map((p) => ({ user_id: p.user_id, status: p.status, checked_in_at: p.checkedInAt, decks_submitted: p.decks, created_at: p.createdAt })), size) : null;

  const run = (fn: () => Promise<Result>, afterHref?: string) =>
    start(async () => {
      setError(null);
      setNotice(null);
      const r = await fn();
      if (r.error) {
        setError(x.errors[r.error as keyof typeof x.errors] ?? x.errors.db);
        return;
      }
      setNotice(m.done);
      if (afterHref) router.push(afterHref);
      else router.refresh();
    });

  const bracket = seeding.length >= 2 ? bracketSize(seeding.length, size) : 0;
  const byes = bracket ? bracket - seeding.length : 0;
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= seeding.length) return;
    const next = [...seeding];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const rounds = new Map<number, TournamentMatch[]>();
  for (const mt of matches) rounds.set(mt.round, [...(rounds.get(mt.round) ?? []), mt]);
  const total = matches.length ? roundsOf(matches.filter((mt) => mt.round === 1).length * 2) : 0;
  const final = total ? matches.find((mt) => mt.round === total && mt.position === 0) : undefined;
  const finalDone = Boolean(final && final.winner && (final.status === "confirmed" || final.status === "bye"));
  const [report, setReport] = useState("");
  const queue = status === "running" && now !== null ? staffQueue(matches, { now, noShowMinutes }) : [];
  const actionable = (mt: TournamentMatch) => Boolean(mt.player_a && mt.player_b) && (mt.status === "pending" || mt.status === "reported" || mt.status === "disputed");
  const cw = checkinWindow(startsAt);
  const phase = now === null ? null : checkinPhase(startsAt, now);
  const queueText = (kind: QueueKind) => fill(m.queueKinds[kind], { n: kind === "bothAbsent" ? (noShowMinutes ?? 0) : kind === "staleReport" ? STALE_REPORT_MINUTES : LONG_MATCH_MINUTES });

  return (
    <div className="grid gap-6">
      {error ? (
        <p role="alert" className="alert-bad">
          {error}
        </p>
      ) : null}
      {notice && !error ? (
        <p role="status" className="alert-good">
          {notice}
        </p>
      ) : null}
      {live ? <p className="text-xs text-pale-muted">{m.autoRefresh}</p> : null}

      {/* Da sistemare (torneo in corso) */}
      {status === "running" ? (
        <section className={`card-night p-5 ${queue.length ? "border-gold" : ""}`}>
          <h2 className="t-section">
            {m.queueTitle} <span className="font-mono text-sm font-normal text-pale-muted">{queue.length}</span>
          </h2>
          {queue.length ? (
            <ul className="mt-3 grid gap-2">
              {queue.map((q) => (
                <li key={q.match.id} className={`flex flex-wrap items-center gap-2 rounded-lg border-2 bg-night-2/70 px-3 py-2 text-sm ${q.kind === "disputed" || q.kind === "bothAbsent" ? "border-bad" : "border-gold"}`}>
                  <span className="font-mono text-[11px] uppercase text-pale-muted">{fill(m.roundTitle, { n: q.match.round })}</span>
                  <span className="min-w-0 truncate text-pale">
                    {nameOf.get(q.match.player_a ?? "") ?? "?"} – {nameOf.get(q.match.player_b ?? "") ?? "?"}
                  </span>
                  <span className={`font-semibold ${q.kind === "disputed" || q.kind === "bothAbsent" ? "text-bad" : "text-gold"}`}>{queueText(q.kind)}</span>
                  <Link href={`${tournamentHref}/match/${q.match.id}`} className="ml-auto btn btn-ink !px-2 !py-0.5 text-[11px]">
                    {m.openMatch}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-pale-muted">{m.queueEmpty}</p>
          )}
        </section>
      ) : null}

      {/* Check-in (torneo aperto con il check-in) */}
      {status === "open" && checkin && plan ? (
        <section className="card-night p-5">
          <h2 className="t-section">{x.checkin.title}</h2>
          <p className="mt-1 text-sm text-pale-muted">
            {x.checkin.window}: <LocalTime iso={new Date(cw.opensAt).toISOString()} locale={locale} utcLabel={x.utc} /> → <LocalTime iso={new Date(cw.closesAt).toISOString()} locale={locale} utcLabel={x.utc} />
          </p>
          <p className="mt-2 font-mono text-sm text-pale">
            {fill(m.checkinCounts, { checked: plan.registeredIn.length, registered: registered.length, waitlist: waitlist.length, wchecked: plan.waitlistQueue.length })}
          </p>
          <p className="mt-2 text-sm text-pale">{fill(m.startCheckin, { n: plan.registeredIn.length, w: plan.waitlistIn.length, total: plan.registeredIn.length + plan.waitlistIn.length })}</p>
          {phase === "late" ? (
            <button type="button" disabled={pending || plan.registeredIn.length + plan.waitlistIn.length < 2} onClick={() => run(() => startTournament(id, slug, []))} className="btn btn-primary mt-3 text-xs">
              {pending ? m.starting : m.startNow}
            </button>
          ) : now !== null ? (
            <p className="mt-3 text-sm text-gold">{fill(m.startCheckinWait, { time: formatCountdown(cw.closesAt - now) })}</p>
          ) : null}
        </section>
      ) : null}

      {/* Iscritti */}
      <section className="card-night p-5">
        <h2 className="t-section">
          {m.players} <span className="font-mono text-sm font-normal text-pale-muted">{registered.length}/{size}</span>
          {waitlist.length ? <span className="ml-2 font-mono text-sm font-normal text-gold">+{waitlist.length}</span> : null}
        </h2>
        {players.length ? (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[...registered, ...waitlist, ...players.filter((p) => p.status !== "registered" && p.status !== "waitlist")].map((p) => {
              const inGame = p.status === "registered" || p.status === "waitlist";
              const wpos = p.status === "waitlist" ? waitlist.indexOf(p) + 1 : 0;
              return (
                <li key={p.user_id} className="flex flex-wrap items-center gap-2 rounded-lg border border-sky bg-night-2/60 px-3 py-2 text-sm">
                  <span className={`min-w-0 truncate ${inGame ? "text-pale" : "text-pale-muted line-through"}`}>{p.name}</span>
                  {wpos ? <span className="font-mono text-[11px] text-gold">{fill(m.waitlisted, { n: wpos })}</span> : null}
                  <span className={`font-mono text-[11px] ${!inGame ? "text-pale-muted" : p.decks ? "text-good" : "text-gold"}`}>{!inGame ? m.dropped : p.decks ? m.decksOk : m.decksMissing}</span>
                  {checkin && inGame && status === "open" ? <span className={`font-mono text-[11px] ${p.checkedInAt ? "text-good" : "text-pale-muted"}`}>{p.checkedInAt ? m.checkedIn : m.notCheckedIn}</span> : null}
                  <span className="ml-auto flex gap-1">
                    {checkin && inGame && status === "open" && p.decks ? (
                      <button type="button" disabled={pending} onClick={() => run(() => staffCheckIn(id, slug, p.user_id, Boolean(p.checkedInAt)))} className="btn btn-ink !px-2 !py-0.5 text-[11px]">
                        {p.checkedInAt ? m.staffUndo : m.staffCheckIn}
                      </button>
                    ) : null}
                    {(p.status === "registered" || (p.status === "waitlist" && status === "open")) && status !== "finished" && status !== "cancelled" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(m.dropConfirm)) run(() => dropPlayer(id, slug, p.user_id));
                        }}
                        className="btn btn-danger !px-2 !py-0.5 text-[11px]"
                      >
                        {m.drop}
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-pale-muted">{x.noPlayers}</p>
        )}
      </section>

      {/* Arbitri (organizzatore e admin) */}
      {canAdmin && (status === "open" || status === "running") ? (
        <section className="card-night p-5">
          <h2 className="t-section">{m.judgesTitle}</h2>
          <p className="mt-1 text-sm text-pale-muted">{m.judgesHint}</p>
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = judgeName.trim();
              if (!name) return;
              run(async () => {
                const r = await addJudge(id, slug, name);
                if (!r.error) setJudgeName("");
                return r;
              });
            }}
          >
            <label className="block text-sm">
              <span className="kicker text-mint">{m.inviteByName}</span>
              <input value={judgeName} onChange={(e) => setJudgeName(e.target.value)} placeholder={m.invitePlaceholder} maxLength={60} autoComplete="off" className="mt-1 block w-56 rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale focus:border-mint" />
            </label>
            <button type="submit" disabled={pending || !judgeName.trim()} className="btn btn-primary text-xs">
              {m.addJudge}
            </button>
          </form>
          {judges.length ? (
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {judges.map((j) => (
                <li key={j.user_id} className="flex items-center gap-2 rounded-lg border border-sky bg-night-2/60 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-pale">{j.name}</span>
                  <button type="button" disabled={pending} onClick={() => run(() => removeJudge(id, slug, j.user_id))} className="ml-auto btn btn-danger !px-2 !py-0.5 text-[11px]">
                    {m.revoke}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-pale-muted">{m.noJudges}</p>
          )}
        </section>
      ) : null}

      {/* Inviti (tornei privati; per i pubblici il link è solo comodo da condividere) */}
      {canAdmin && (status === "open" || status === "running") ? (
        <section className="card-night p-5">
          <h2 className="t-section">
            {m.inviteTitle} <span className="ml-2 stat-pill bg-night-3 text-[11px] font-semibold uppercase text-pale">{x.visibilities[visibility as keyof typeof x.visibilities] ?? visibility}</span>
          </h2>
          <p className="mt-1 text-sm text-pale-muted">{visibility === "private" ? m.inviteHint : m.publicNote}</p>
          {inviteLink ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="max-w-full truncate rounded bg-night px-2 py-1 font-mono text-xs text-pale">{inviteLink}</code>
              <CopyButton text={inviteLink} label={m.copyInvite} copied={x.copied} className="btn btn-gold text-xs" />
              <button
                type="button"
                disabled={pending}
                title={m.rotateInviteHint}
                onClick={() => {
                  if (window.confirm(m.rotateInviteHint)) run(() => rotateInviteCode(id, slug));
                }}
                className="btn btn-ghost text-xs"
              >
                {m.rotateInvite}
              </button>
            </div>
          ) : null}
          <form
            className="mt-4 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = inviteName.trim();
              if (!name) return;
              run(async () => {
                const r = await invitePlayer(id, slug, name);
                if (!r.error) setInviteName("");
                return r;
              });
            }}
          >
            <label className="block text-sm">
              <span className="kicker text-mint">{m.inviteByName}</span>
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder={m.invitePlaceholder} maxLength={60} autoComplete="off" className="mt-1 block w-56 rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale focus:border-mint" />
            </label>
            <button type="submit" disabled={pending || !inviteName.trim()} className="btn btn-primary text-xs">
              {m.invite}
            </button>
          </form>
          <p className="mt-4 kicker text-pale-muted">{m.invited}</p>
          {invites.length ? (
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {invites.map((i) => (
                <li key={i.user_id} className="flex items-center gap-2 rounded-lg border border-sky bg-night-2/60 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-pale">{i.name}</span>
                  {i.registered ? <span className="font-mono text-[11px] text-good">✓</span> : null}
                  <button type="button" disabled={pending} onClick={() => run(() => revokeInvite(id, slug, i.user_id))} className="ml-auto btn btn-danger !px-2 !py-0.5 text-[11px]">
                    {m.revoke}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-pale-muted">{m.noInvites}</p>
          )}
        </section>
      ) : null}

      {/* Avvio senza check-in: ordine casuale o manuale */}
      {status === "open" && !checkin ? (
        <section className="card-night p-5">
          <h2 className="t-section">{m.startTitle}</h2>
          <p className="mt-1 text-sm text-pale-muted">{m.startIntro}</p>
          {excluded ? <p className="mt-2 text-sm text-gold">{fill(m.excluded, { n: excluded })}</p> : null}
          {seeding.length < 2 ? (
            <p className="mt-3 text-sm text-error">{m.tooFew}</p>
          ) : (
            <>
              <p className="mt-3 font-mono text-xs text-pale">{byes ? fill(m.byesPreview, { n: seeding.length, size: bracket, byes }) : fill(m.noByes, { n: seeding.length, size: bracket })}</p>
              <ol className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {seeding.map((uid, i) => (
                  <li key={uid} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${i < byes ? "border-gold bg-gold/10" : "border-sky bg-night-2/60"}`}>
                    <span className="w-6 font-mono text-xs text-pale-muted">{i + 1}.</span>
                    <span className="min-w-0 flex-1 truncate text-pale">{nameOf.get(uid) ?? "?"}</span>
                    <button type="button" onClick={() => move(i, -1)} className="btn btn-ink !px-2 !py-0.5 text-[11px]" aria-label={m.moveUp} disabled={i === 0}>
                      ↑
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="btn btn-ink !px-2 !py-0.5 text-[11px]" aria-label={m.moveDown} disabled={i === seeding.length - 1}>
                      ↓
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setOrder(shuffle(seeding))} className="btn btn-ink text-xs" disabled={pending}>
                  {m.shuffle}
                </button>
                <button type="button" onClick={() => run(() => startTournament(id, slug, seeding))} className="btn btn-primary text-xs" disabled={pending}>
                  {pending ? m.starting : m.start}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* Risultati e scambi: un turno per riquadro, aperti solo quelli con partite da sistemare */}
      {status === "running" ? (
        <>
          {[...rounds.entries()].map(([round, list]) => {
            const open = list.some(actionable);
            const need = matchNeed(bestOf, finalBestOf, round, total);
            return (
              <details key={round} open={open} className="card-night group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <h2 className="t-section">
                    {fill(m.roundTitle, { n: round })}
                    <span className="ml-2 font-mono text-sm font-normal text-pale-muted">
                      {list.filter((mt) => mt.status === "confirmed" || mt.status === "bye").length}/{list.length}
                    </span>
                  </h2>
                  <span aria-hidden="true" className="font-mono text-lg text-sky transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {list
                    .sort((a, b) => a.position - b.position)
                    .map((mt) => (
                      <MatchEditor key={mt.id} mt={mt} nameOf={nameOf} need={need} labels={x} disabled={pending} matchHref={`${tournamentHref}/match/${mt.id}`} onSave={(a, b, forfeit) => run(() => setMatchResult(mt.id, slug, a, b, forfeit))} />
                    ))}
                </ul>
              </details>
            );
          })}

          <section className="card-night p-5">
            <h2 className="t-section">{m.finishTitle}</h2>
            <p className="mt-1 text-sm text-pale-muted">{m.finishHint}</p>
            <label className="mt-3 block text-sm">
              <span className="kicker text-mint">{m.report}</span>
              <textarea value={report} onChange={(e) => setReport(e.target.value)} rows={4} maxLength={2000} className="mt-1 w-full rounded-lg border border-sky bg-night px-3 py-2 text-pale focus:border-mint" />
            </label>
            <button type="button" disabled={pending || !finalDone} onClick={() => run(() => finishTournament(id, slug, report), tournamentHref)} className="btn btn-gold mt-3 text-xs">
              {m.finish}
            </button>
          </section>
        </>
      ) : null}

      {canAdmin && (status === "open" || status === "running") ? (
        <section className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(m.cancelConfirm)) run(() => cancelTournament(id, slug), tournamentHref);
            }}
            className="btn btn-danger text-xs"
          >
            {m.cancel}
          </button>
        </section>
      ) : null}
    </div>
  );
}

function MatchEditor({ mt, nameOf, need, labels, disabled, matchHref, onSave }: { mt: TournamentMatch; nameOf: Map<string, string>; need: number; labels: Dictionary["tournaments"]; disabled: boolean; matchHref: string; onSave: (a: number, b: number, forfeit: boolean) => void }) {
  const m = labels.manage;
  const [a, setA] = useState<number>(mt.score_a ?? 0);
  const [b, setB] = useState<number>(mt.score_b ?? 0);
  const [forfeit, setForfeit] = useState(false);
  const ready = Boolean(mt.player_a && mt.player_b);
  const tone = mt.status === "disputed" ? "border-bad" : mt.status === "reported" ? "border-gold" : mt.status === "confirmed" ? "border-good/60" : "border-sky";
  const names = [mt.player_a, mt.player_b].map((id) => (id ? (nameOf.get(id) ?? "?") : mt.status === "bye" ? "bye" : labels.tbd));
  const valid = validNeedScore(need, a, b) && (!forfeit || Math.min(a, b) === 0);
  const note = mt.note === "no_show" ? m.noteNoShow : mt.note === "drop" ? m.noteDrop : mt.note;
  return (
    <li className={`rounded-lg border-2 bg-night-2/70 p-3 ${tone}`}>
      <p className="flex items-center justify-between text-sm">
        <span className={mt.winner && mt.winner === mt.player_a ? "font-bold text-good" : "text-pale"}>
          {names[0]}
          {mt.seen_a && mt.status !== "confirmed" ? <span className="ml-1 text-[10px] text-good">●</span> : null}
        </span>
        <span className="font-mono text-xs text-pale-muted">{mt.score_a ?? "·"}</span>
      </p>
      <p className="flex items-center justify-between text-sm">
        <span className={mt.winner && mt.winner === mt.player_b ? "font-bold text-good" : mt.status === "bye" ? "text-pale-muted" : "text-pale"}>
          {names[1]}
          {mt.seen_b && mt.status !== "confirmed" ? <span className="ml-1 text-[10px] text-good">●</span> : null}
        </span>
        <span className="font-mono text-xs text-pale-muted">{mt.score_b ?? "·"}</span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-1 font-mono text-[10px] uppercase text-pale-muted">
        {m.statuses[mt.status]}
        {note ? ` · ${note}` : ""}
        {mt.forfeit && !note ? ` · ${m.forfeit}` : ""}
        {need > 2 ? ` · ${labels.bestOf.replace("{n}", String(need * 2 - 1))}` : ""}
        {ready && mt.status !== "bye" ? (
          <Link href={matchHref} className="ml-auto normal-case text-sky hover:text-chalk">
            {m.openMatch} →
          </Link>
        ) : null}
      </p>
      {ready && mt.status !== "bye" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-sky/40 pt-2 text-xs">
          <input type="number" min={0} max={need} value={a} onChange={(e) => setA(Number(e.target.value))} className="w-14 rounded border border-sky bg-night px-2 py-1 font-mono text-pale" aria-label={names[0]} />
          <span className="text-pale-muted">–</span>
          <input type="number" min={0} max={need} value={b} onChange={(e) => setB(Number(e.target.value))} className="w-14 rounded border border-sky bg-night px-2 py-1 font-mono text-pale" aria-label={names[1]} />
          <label className="flex items-center gap-1 text-pale-muted">
            <input type="checkbox" checked={forfeit} onChange={(e) => setForfeit(e.target.checked)} className="accent-mint" /> {m.forfeit}
          </label>
          <button type="button" disabled={disabled || !valid} onClick={() => onSave(a, b, forfeit)} className="btn btn-ink !px-2 !py-1 text-[11px]">
            {m.setResult}
          </button>
        </div>
      ) : null}
    </li>
  );
}
