"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { reportMatchResult, sendMessage } from "@/lib/tournament/actions";
import { SCREENSHOT_BUCKET, SCREENSHOTS_PER_PLAYER, fill, type TournamentMatch, type TournamentMessage } from "@/lib/tournament/types";
import { shrinkImage } from "@/lib/shrinkImage";

type Screens = { a: string[]; b: string[] };

type Props = {
  slug: string;
  matchId: string;
  me: string;
  /** "a" o "b" se chi guarda gioca la partita; null per organizzatore/admin */
  side: "a" | "b" | null;
  match: TournamentMatch;
  names: { a: string; b: string };
  bestOf: number;
  running: boolean;
  initialMessages: TournamentMessage[];
  /** URL firmati degli screenshot dei due giocatori (generati sul server) */
  screens: Screens;
  labels: Dictionary["tournaments"];
};

const POLL_MS = 5000;
const MAX_UPLOAD = 2 * 1024 * 1024;

/**
 * Stanza della partita: chat tra le parti (polling ogni 5 s sotto RLS), referto con doppia conferma e
 * screenshot caricati dal browser nel bucket privato (percorso <partita>/<utente>/<n>.webp; le policy
 * fanno da guardia). Dopo referto o upload la pagina (dinamica) si ricarica.
 */
export function MatchRoom({ slug, matchId, me, side, match, names, bestOf, running, initialMessages, screens, labels }: Props) {
  const x = labels;
  const l = x.match;
  const router = useRouter();
  const [messages, setMessages] = useState<TournamentMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const lastId = useRef(initialMessages.length ? initialMessages[initialMessages.length - 1].id : 0);
  const listRef = useRef<HTMLOListElement>(null);
  const need = (bestOf + 1) / 2;
  const myName = side === "a" ? names.a : side === "b" ? names.b : null;
  const theirName = side === "a" ? names.b : side === "b" ? names.a : null;
  const [mine, setMine] = useState<number>(need);
  const [theirs, setTheirs] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const myScreens = side === "a" ? screens.a : side === "b" ? screens.b : [];
  const theirScreens = side === "a" ? screens.b : side === "b" ? screens.a : [];

  const errText = (code: string) => x.errors[code as keyof typeof x.errors] ?? x.errors.db;

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !running) return;
    let alive = true;
    const poll = async () => {
      const { data } = await sb.from("tournament_messages").select("id, match_id, user_id, body, created_at").eq("match_id", matchId).gt("id", lastId.current).order("id", { ascending: true }).limit(200);
      const rows = (data ?? []) as TournamentMessage[];
      if (!alive || !rows.length) return;
      lastId.current = rows[rows.length - 1].id;
      setMessages((prev) => [...prev, ...rows]);
    };
    const timer = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [matchId, running]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = () =>
    start(async () => {
      setError(null);
      const body = text.trim();
      if (!body) return;
      const r = await sendMessage(matchId, body);
      if (r.error) {
        setError(errText(r.error));
        return;
      }
      setText("");
      const sb = supabaseBrowser();
      if (!sb) return;
      const { data } = await sb.from("tournament_messages").select("id, match_id, user_id, body, created_at").eq("match_id", matchId).gt("id", lastId.current).order("id", { ascending: true }).limit(200);
      const rows = (data ?? []) as TournamentMessage[];
      if (rows.length) {
        lastId.current = rows[rows.length - 1].id;
        setMessages((prev) => [...prev, ...rows]);
      }
    });

  const report = () =>
    start(async () => {
      setError(null);
      const a = side === "a" ? mine : theirs;
      const b = side === "a" ? theirs : mine;
      const r = await reportMatchResult(matchId, slug, a, b);
      if (r.error) {
        setError(errText(r.error));
        return;
      }
      router.refresh();
    });

  const upload = async (file: File | undefined) => {
    if (!file || !side) return;
    setError(null);
    setUploading(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error("disabled");
      const blob = await shrinkImage(file, 1600, 0.8);
      if (blob.size > MAX_UPLOAD) throw new Error("too_big");
      const n = Math.min(SCREENSHOTS_PER_PLAYER, myScreens.length + 1);
      const path = `${matchId}/${me}/${n}.webp`;
      const { error: upErr } = await sb.storage.from(SCREENSHOT_BUCKET).upload(path, blob, { contentType: "image/webp", upsert: true });
      if (upErr) throw upErr;
      router.refresh();
    } catch {
      setError(x.errors.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const reportedByMe = match.status === "reported" && match.reported_by === me;
  const reportedByThem = match.status === "reported" && match.reported_by !== me;
  const scoreLine = match.score_a !== null && match.score_b !== null ? `${names.a} ${match.score_a} – ${match.score_b} ${names.b}` : null;
  const canReport = running && side !== null && Boolean(match.player_a && match.player_b) && (match.status === "pending" || match.status === "reported" || match.status === "disputed");
  const validScore = mine !== theirs && Math.max(mine, theirs) === need && Math.min(mine, theirs) < need;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Stato e referto */}
      <section className="card-night p-5">
        <h2 className="t-section">{l.reportTitle}</h2>
        {scoreLine ? <p className="mt-2 font-mono text-sm text-pale">{scoreLine}</p> : null}
        <p className={`mt-2 text-sm ${match.status === "confirmed" ? "text-good" : match.status === "disputed" ? "text-bad" : "text-pale-muted"}`}>
          {match.status === "confirmed"
            ? `${fill(l.statusConfirmed, { a: match.score_a ?? 0, b: match.score_b ?? 0 })}${match.forfeit ? ` ${l.statusForfeit}` : ""} ${l.winner}: ${match.winner === match.player_a ? names.a : names.b}.`
            : match.status === "disputed"
              ? fill(l.statusDisputed, { note: match.note ?? "" })
              : reportedByMe
                ? fill(l.statusReportedByYou, { a: match.score_a ?? 0, b: match.score_b ?? 0 })
                : reportedByThem
                  ? fill(l.statusReportedByThem, { a: match.score_a ?? 0, b: match.score_b ?? 0 })
                  : match.status === "bye"
                    ? l.bye
                    : !match.player_a || !match.player_b
                      ? l.tbd
                      : l.statusPending}
        </p>
        {canReport ? (
          <div className="mt-4 border-t border-sky/40 pt-4">
            <p className="text-xs text-pale-muted">{l.reportHint}</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="kicker block text-mint">{l.yourGames}</span>
                <span className="mt-1 block text-xs text-pale-muted">{myName}</span>
                <input type="number" min={0} max={need} value={mine} onChange={(e) => setMine(Number(e.target.value))} className="mt-1 w-20 rounded-lg border border-sky bg-night px-3 py-2 font-mono text-pale" />
              </label>
              <label className="text-sm">
                <span className="kicker block text-mint">{l.theirGames}</span>
                <span className="mt-1 block text-xs text-pale-muted">{theirName}</span>
                <input type="number" min={0} max={need} value={theirs} onChange={(e) => setTheirs(Number(e.target.value))} className="mt-1 w-20 rounded-lg border border-sky bg-night px-3 py-2 font-mono text-pale" />
              </label>
              <button type="button" disabled={pending || !validScore} onClick={report} className="btn btn-primary text-xs">
                {l.submitReport}
              </button>
            </div>
          </div>
        ) : null}
        {side === null ? <p className="mt-3 text-xs text-pale-muted">{l.organizerView}</p> : null}

        <h3 className="mt-6 font-display text-lg font-bold text-chalk">{l.screenshotsTitle}</h3>
        <p className="mt-1 text-xs text-pale-muted">{l.screenshotsHint}</p>
        {side !== null ? (
          <div className="mt-3">
            <p className="kicker text-pale-muted">{l.yours}</p>
            <ScreenList urls={myScreens} empty={l.none} />
            {running && myScreens.length < SCREENSHOTS_PER_PLAYER ? (
              <label className="mt-2 block text-sm text-pale">
                <span className="btn btn-ink text-xs">{uploading ? l.uploading : l.upload}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
              </label>
            ) : null}
            <p className="mt-3 kicker text-pale-muted">{l.theirs}</p>
            <ScreenList urls={theirScreens} empty={l.none} />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="kicker text-pale-muted">{names.a}</p>
              <ScreenList urls={screens.a} empty={l.none} />
            </div>
            <div>
              <p className="kicker text-pale-muted">{names.b}</p>
              <ScreenList urls={screens.b} empty={l.none} />
            </div>
          </div>
        )}
        {error ? (
          <p role="alert" className="alert-bad mt-3">
            {error}
          </p>
        ) : null}
      </section>

      {/* Chat */}
      <section className="card-night flex flex-col p-5">
        <h2 className="t-section">{l.chatTitle}</h2>
        <p className="mt-1 text-xs text-pale-muted">{l.chatHint}</p>
        <ol ref={listRef} className="mt-3 flex max-h-96 min-h-48 flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-sky bg-night-2/60 p-3" aria-live="polite">
          {messages.length ? (
            messages.map((msg) => {
              const own = msg.user_id === me;
              const who = msg.user_id === match.player_a ? names.a : msg.user_id === match.player_b ? names.b : "★";
              return (
                <li key={msg.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${own ? "self-end bg-mint/15 text-pale" : "self-start bg-night-3 text-pale"}`}>
                  <span className="block font-mono text-[10px] text-pale-muted">
                    {own ? l.you : who} · {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="whitespace-pre-line break-words">{msg.body}</span>
                </li>
              );
            })
          ) : (
            <li className="text-sm text-pale-muted">{l.chatEmpty}</li>
          )}
        </ol>
        {running ? (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={l.chatPlaceholder} className="min-w-0 flex-1 rounded-lg border border-sky bg-night px-3 py-2 text-sm text-pale focus:border-mint" />
            <button type="submit" disabled={pending || !text.trim()} className="btn btn-primary text-xs">
              {l.send}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function ScreenList({ urls, empty }: { urls: string[]; empty: string }) {
  if (!urls.length) return <p className="mt-1 text-xs text-pale-muted">{empty}</p>;
  return (
    <ul className="mt-1 flex flex-wrap gap-2">
      {urls.map((u, i) => (
        <li key={i}>
          <a href={u} target="_blank" rel="noopener" className="block h-20 w-32 overflow-hidden rounded-lg border-2 border-sky">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
          </a>
        </li>
      ))}
    </ul>
  );
}
