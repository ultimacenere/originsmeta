"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { bracketSize, roundsOf } from "@/lib/tournament/bracket";
import { fill, type TournamentMatch, type TournamentStatus } from "@/lib/tournament/types";
import { cancelTournament, dropPlayer, finishTournament, invitePlayer, revokeInvite, rotateInviteCode, setMatchResult, startTournament, swapPlayers } from "@/lib/tournament/actions";
import { CopyButton } from "./CopyButton";

export type ManagedPlayer = { user_id: string; name: string; status: string; decks: boolean };
export type ManagedInvite = { user_id: string; name: string; registered: boolean };

type Props = {
  id: string;
  slug: string;
  status: TournamentStatus;
  size: number;
  bestOf: number;
  players: ManagedPlayer[];
  matches: TournamentMatch[];
  tournamentHref: string;
  labels: Dictionary["tournaments"];
  /** tornei privati a invito: link segreto (solo organizzatore/admin) e invitati per nome utente */
  visibility: string;
  inviteLink: string | null;
  invites: ManagedInvite[];
};

type Result = { error?: string; ok?: boolean };

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pannello dell'organizzatore: iscritti (con rimozione), avvio con ordine casuale o manuale e anteprima dei bye,
 * risultati imposti e scambi a torneo in corso, chiusura con referto, annullamento. Ogni azione chiama una
 * Server Action → RPC con lock; poi la pagina (dinamica) si ricarica.
 */
export function ManagePanel({ id, slug, status, size, bestOf, players, matches, tournamentHref, labels, visibility, inviteLink, invites }: Props) {
  const x = labels;
  const m = x.manage;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");

  const eligible = useMemo(() => players.filter((p) => p.status === "registered" && p.decks), [players]);
  const excluded = players.filter((p) => p.status === "registered" && !p.decks).length;
  const [order, setOrder] = useState<string[] | null>(null);
  const seeding = order ?? eligible.map((p) => p.user_id);
  const nameOf = useMemo(() => new Map(players.map((p) => [p.user_id, p.name])), [players]);
  const need = (bestOf + 1) / 2;

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
  const swappable = matches.filter((mt) => mt.status === "pending" && mt.player_a && mt.player_b);
  const swapOptions = swappable.flatMap((mt) => [mt.player_a as string, mt.player_b as string]);
  const [swapA, setSwapA] = useState("");
  const [swapB, setSwapB] = useState("");
  const [report, setReport] = useState("");

  return (
    <div className="grid gap-6">
      {error ? (
        <p role="alert" className="rounded-lg border-2 border-bad bg-bad/10 p-3 text-sm text-bad">
          {error}
        </p>
      ) : null}
      {notice && !error ? (
        <p role="status" className="text-sm text-good">
          {notice}
        </p>
      ) : null}

      {/* Iscritti */}
      <section className="card-night p-5">
        <h2 className="text-xl font-extrabold text-sky">
          {m.players} <span className="font-mono text-sm font-normal text-pale-muted">{players.filter((p) => p.status === "registered").length}/{size}</span>
        </h2>
        {players.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {players.map((p) => (
              <li key={p.user_id} className="flex items-center gap-2 rounded-lg border border-sky bg-night-2/60 px-3 py-2 text-sm">
                <span className={`truncate ${p.status === "registered" ? "text-pale" : "text-pale-muted line-through"}`}>{p.name}</span>
                <span className={`font-mono text-[11px] ${p.status !== "registered" ? "text-pale-muted" : p.decks ? "text-good" : "text-gold"}`}>{p.status !== "registered" ? m.dropped : p.decks ? m.decksOk : m.decksMissing}</span>
                {p.status === "registered" && status !== "finished" && status !== "cancelled" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(m.dropConfirm)) run(() => dropPlayer(id, slug, p.user_id));
                    }}
                    className="ml-auto btn border border-crimson/40 !px-2 !py-0.5 text-[11px] text-crimson hover:bg-crimson hover:text-chalk"
                  >
                    {m.drop}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-pale-muted">{x.noPlayers}</p>
        )}
      </section>

      {/* Inviti (tornei privati; per i pubblici il link è solo comodo da condividere) */}
      {status === "open" || status === "running" ? (
        <section className="card-night p-5">
          <h2 className="text-xl font-extrabold text-sky">
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
            <button type="submit" disabled={pending || !inviteName.trim()} className="btn btn-mint text-xs">
              {m.invite}
            </button>
          </form>
          <p className="mt-4 kicker text-pale-muted">{m.invited}</p>
          {invites.length ? (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {invites.map((i) => (
                <li key={i.user_id} className="flex items-center gap-2 rounded-lg border border-sky bg-night-2/60 px-3 py-2 text-sm">
                  <span className="truncate text-pale">{i.name}</span>
                  {i.registered ? <span className="font-mono text-[11px] text-good">✓</span> : null}
                  <button type="button" disabled={pending} onClick={() => run(() => revokeInvite(id, slug, i.user_id))} className="ml-auto btn border border-crimson/40 !px-2 !py-0.5 text-[11px] text-crimson hover:bg-crimson hover:text-chalk">
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

      {/* Avvio */}
      {status === "open" ? (
        <section className="card-night p-5">
          <h2 className="text-xl font-extrabold text-sky">{m.startTitle}</h2>
          <p className="mt-1 text-sm text-pale-muted">{m.startIntro}</p>
          {excluded ? <p className="mt-2 text-sm text-gold">{fill(m.excluded, { n: excluded })}</p> : null}
          {seeding.length < 2 ? (
            <p className="mt-3 text-sm text-bad">{m.tooFew}</p>
          ) : (
            <>
              <p className="mt-3 font-mono text-xs text-pale">{byes ? fill(m.byesPreview, { n: seeding.length, size: bracket, byes }) : fill(m.noByes, { n: seeding.length, size: bracket })}</p>
              <ol className="mt-3 grid gap-1 sm:grid-cols-2">
                {seeding.map((uid, i) => (
                  <li key={uid} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${i < byes ? "border-gold bg-gold/10" : "border-sky bg-night-2/60"}`}>
                    <span className="w-6 font-mono text-xs text-pale-muted">{i + 1}.</span>
                    <span className="flex-1 truncate text-pale">{nameOf.get(uid) ?? "?"}</span>
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
                <button type="button" onClick={() => run(() => startTournament(id, slug, seeding))} className="btn btn-mint text-xs" disabled={pending}>
                  {pending ? m.starting : m.start}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {/* Risultati e scambi */}
      {status === "running" ? (
        <>
          {[...rounds.entries()].map(([round, list]) => (
            <section key={round} className="card-night p-5">
              <h2 className="text-xl font-extrabold text-sky">{fill(m.roundTitle, { n: round })}</h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {list
                  .sort((a, b) => a.position - b.position)
                  .map((mt) => (
                    <MatchEditor key={mt.id} mt={mt} nameOf={nameOf} need={need} labels={x} disabled={pending} onSave={(a, b, forfeit) => run(() => setMatchResult(mt.id, slug, a, b, forfeit))} />
                  ))}
              </ul>
            </section>
          ))}

          {swappable.length >= 1 ? (
            <section className="card-night p-5">
              <h2 className="text-xl font-extrabold text-sky">{m.swapTitle}</h2>
              <p className="mt-1 text-sm text-pale-muted">{m.swapHint}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[
                  [swapA, setSwapA],
                  [swapB, setSwapB],
                ].map(([val, set], i) => (
                  <select key={i} value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} className="rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale">
                    <option value="">—</option>
                    {swapOptions.map((uid) => (
                      <option key={uid} value={uid}>
                        {nameOf.get(uid) ?? uid}
                      </option>
                    ))}
                  </select>
                ))}
                <button type="button" disabled={pending || !swapA || !swapB || swapA === swapB} onClick={() => run(() => swapPlayers(id, slug, swapA, swapB))} className="btn btn-ink text-xs">
                  {m.swap}
                </button>
              </div>
            </section>
          ) : null}

          <section className="card-night p-5">
            <h2 className="text-xl font-extrabold text-sky">{m.finishTitle}</h2>
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

      {status === "open" || status === "running" ? (
        <section className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(m.cancelConfirm)) run(() => cancelTournament(id, slug), tournamentHref);
            }}
            className="btn border border-crimson/40 text-xs text-crimson hover:bg-crimson hover:text-chalk"
          >
            {m.cancel}
          </button>
        </section>
      ) : null}
    </div>
  );
}

function MatchEditor({ mt, nameOf, need, labels, disabled, onSave }: { mt: TournamentMatch; nameOf: Map<string, string>; need: number; labels: Dictionary["tournaments"]; disabled: boolean; onSave: (a: number, b: number, forfeit: boolean) => void }) {
  const m = labels.manage;
  const [a, setA] = useState<number>(mt.score_a ?? 0);
  const [b, setB] = useState<number>(mt.score_b ?? 0);
  const [forfeit, setForfeit] = useState(false);
  const ready = Boolean(mt.player_a && mt.player_b);
  const tone = mt.status === "disputed" ? "border-bad" : mt.status === "reported" ? "border-gold" : mt.status === "confirmed" ? "border-good/60" : "border-sky";
  const names = [mt.player_a, mt.player_b].map((id) => (id ? nameOf.get(id) ?? "?" : mt.status === "bye" ? "bye" : labels.tbd));
  const valid = a !== b && Math.max(a, b) === need && Math.min(a, b) < need && (!forfeit || Math.min(a, b) === 0);
  return (
    <li className={`rounded-lg border-2 bg-night-2/70 p-3 ${tone}`}>
      <p className="flex items-center justify-between text-sm">
        <span className={mt.winner && mt.winner === mt.player_a ? "font-bold text-good" : "text-pale"}>{names[0]}</span>
        <span className="font-mono text-xs text-pale-muted">{mt.score_a ?? "·"}</span>
      </p>
      <p className="flex items-center justify-between text-sm">
        <span className={mt.winner && mt.winner === mt.player_b ? "font-bold text-good" : mt.status === "bye" ? "text-pale-muted" : "text-pale"}>{names[1]}</span>
        <span className="font-mono text-xs text-pale-muted">{mt.score_b ?? "·"}</span>
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase text-pale-muted">
        {m.statuses[mt.status]}
        {mt.note ? ` · ${mt.note}` : ""}
        {mt.forfeit ? ` · ${m.forfeit}` : ""}
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
