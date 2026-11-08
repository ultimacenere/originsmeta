"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { claimNoShow, markMatchSeen, reportMatchResult, sendMessage, setMatchResult } from "@/lib/tournament/actions";
import { SCREENSHOT_BUCKET, SCREENSHOTS_PER_PLAYER, fill, type TournamentMatch, type TournamentMessage } from "@/lib/tournament/types";
import { formatCountdown, noShowAt, validNeedScore } from "@/lib/tournament/rules";
import { SCREENSHOT_ACCEPT, pastedScreenshot } from "@/lib/tournament/screenshotPaste";
import { shrinkImage } from "@/lib/shrinkImage";
import { useNow } from "@/lib/useNow";

type Screens = { a: string[]; b: string[] };

type Props = {
  slug: string;
  matchId: string;
  me: string;
  /** "a" o "b" se chi guarda gioca la partita; null per organizzatore/admin */
  side: "a" | "b" | null;
  match: TournamentMatch;
  names: { a: string; b: string };
  /** vittorie che servono in questa partita (la finale può essere più lunga: matchNeed in rules.ts) */
  need: number;
  /** minuti di assenza prima della vittoria a tavolino (null = niente tavolino) */
  noShowMinutes: number | null;
  running: boolean;
  initialMessages: TournamentMessage[];
  /** URL firmati degli screenshot dei due giocatori (generati sul server) */
  screens: Screens;
  /** scheda del torneo: a partita chiusa il tasto per tornarci, è lì che si vede la partita dopo */
  tournamentHref: string;
  labels: Dictionary["tournaments"];
  /**
   * 08/11/2026 (blocco BRACKET E TOP CUT): `held` = partita della fase finale in pausa (niente presenza, tavolino né
   * referti finché lo staff non la avvia, con `heldText` che lo spiega); `reportLock` = perché i giocatori non refertano
   * ancora (i due ban mancano), null se possono. Lo staff impone il risultato comunque.
   */
  held?: boolean;
  heldText?: string | null;
  reportLock?: string | null;
  /** testi degli errori del blocco BRACKET E TOP CUT, accanto a quelli del dizionario */
  extraErrors?: Record<string, string>;
};

const POLL_MS = 5000;
/** stato della partita (presenza dell'avversario, referti): ogni 10 secondi */
const MATCH_POLL_MS = 10_000;
const MAX_UPLOAD = 2 * 1024 * 1024;

type Live = Pick<TournamentMatch, "status" | "seen_a" | "seen_b" | "ready_at" | "reported_by">;

/**
 * Stanza della partita: chat tra le parti (polling ogni 5 s sotto RLS), referto con doppia conferma e
 * screenshot caricati dal browser nel bucket privato (percorso <partita>/<utente>/<n>.webp; le policy
 * fanno da guardia), col selettore file o incollati con Ctrl+V. Dopo referto o upload la pagina (dinamica) si ricarica.
 */
export function MatchRoom({ slug, matchId, me, side, match, names, need, noShowMinutes, running, initialMessages, screens, tournamentHref, labels, held = false, heldText = null, reportLock = null, extraErrors }: Props) {
  const x = labels;
  const l = x.match;
  const router = useRouter();
  const [messages, setMessages] = useState<TournamentMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const lastId = useRef(initialMessages.length ? initialMessages[initialMessages.length - 1].id : 0);
  const listRef = useRef<HTMLOListElement>(null);
  const fromMatch = (mt: TournamentMatch): Live => ({ status: mt.status, seen_a: mt.seen_a, seen_b: mt.seen_b, ready_at: mt.ready_at, reported_by: mt.reported_by });
  const [live, setLive] = useState<Live>(() => fromMatch(match));
  // dopo un ricaricamento (referto, tavolino, avversario arrivato) vale la partita appena letta dal server
  const [seenMatch, setSeenMatch] = useState(match);
  if (seenMatch !== match) {
    setSeenMatch(match);
    setLive(fromMatch(match));
  }
  const ready = Boolean(match.player_a && match.player_b);
  // fase finale in pausa (08/11/2026): finché lo staff non la avvia la partita non è "attiva" (niente presenza né tavolino)
  const pausedNow = held && !live.ready_at;
  const active = running && ready && !pausedNow && (live.status === "pending" || live.status === "reported" || live.status === "disputed");
  const opponentId = side === "a" ? match.player_b : side === "b" ? match.player_a : null;
  const myName = side === "a" ? names.a : side === "b" ? names.b : null;
  const theirName = side === "a" ? names.b : side === "b" ? names.a : null;
  // da 0–0 (06/11/2026): con "2–0 per me" già scritto chi ha perso e inviava senza guardare si dava la vittoria
  const [mine, setMine] = useState<number>(0);
  const [theirs, setTheirs] = useState<number>(0);
  // risultato imposto dallo staff dalla stanza, dopo aver letto chat e screenshot
  const [staffA, setStaffA] = useState<number>(match.score_a ?? 0);
  const [staffB, setStaffB] = useState<number>(match.score_b ?? 0);
  const [staffForfeit, setStaffForfeit] = useState(false);
  const [uploading, setUploading] = useState(false);
  // l'ultimo numero caricato: col Ctrl+V il secondo arriva prima che la pagina si rilegga e sovrascriverebbe il primo
  const lastSent = useRef(0);
  const myScreens = side === "a" ? screens.a : side === "b" ? screens.b : [];
  const theirScreens = side === "a" ? screens.b : side === "b" ? screens.a : [];

  const errText = (code: string) => x.errors[code as keyof typeof x.errors] ?? extraErrors?.[code] ?? x.errors.db;

  // Presenza (05/10/2026): chi gioca ha aperto la stanza. Si segna dal browser, una volta, solo a partita pronta.
  const mySeen = side === "a" ? live.seen_a : side === "b" ? live.seen_b : null;
  useEffect(() => {
    if (!side || !active || mySeen) return;
    let alive = true;
    markMatchSeen(matchId).then((r) => {
      if (alive && r.ok) setLive((v) => ({ ...v, [side === "a" ? "seen_a" : "seen_b"]: new Date().toISOString() }));
    });
    return () => {
      alive = false;
    };
  }, [side, active, mySeen, matchId]);

  // Stato della partita: presenza dell'avversario e referti; se cambiano stato o giocatori (l'avversario arriva mentre
  // la stanza è già aperta), la pagina si ricarica e la partita diventa "pronta" anche qui.
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !running) return;
    let alive = true;
    const poll = async () => {
      const { data } = await sb.from("tournament_matches").select("status, seen_a, seen_b, ready_at, reported_by, player_a, player_b").eq("id", matchId).maybeSingle();
      const row = data as (Live & { player_a: string | null; player_b: string | null }) | null;
      if (!alive || !row) return;
      // anche quando la partita diventa pronta: lo staff ha avviato la fase finale in pausa (08/11/2026)
      const changed = row.status !== match.status || row.reported_by !== match.reported_by || row.player_a !== match.player_a || row.player_b !== match.player_b || Boolean(row.ready_at) !== Boolean(match.ready_at);
      setLive(row);
      if (changed) router.refresh();
    };
    const timer = setInterval(poll, MATCH_POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [matchId, running, match.status, match.reported_by, match.player_a, match.player_b, match.ready_at, router]);

  const opponentSeen = side === "a" ? Boolean(live.seen_b) : side === "b" ? Boolean(live.seen_a) : false;
  const opponentWrote = opponentId ? messages.some((msg) => msg.user_id === opponentId) : false;
  const opponentHere = opponentSeen || opponentWrote || (live.status === "reported" && live.reported_by === opponentId);
  const deadline = noShowAt(live.ready_at, noShowMinutes);
  const watchNoShow = Boolean(side && active && deadline !== null && !opponentHere && (live.status === "pending" || (live.status === "reported" && live.reported_by === me)));
  const now = useNow(1000, watchNoShow);
  const left = watchNoShow && deadline !== null && now !== null ? deadline - now : null;

  const claim = () => {
    if (!window.confirm(l.claimConfirm)) return;
    start(async () => {
      setError(null);
      const r = await claimNoShow(matchId, slug);
      if (r.error) {
        setError(errText(r.error));
        return;
      }
      router.refresh();
    });
  };

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

  // Conferma con un tasto (06/11/2026): si manda il punteggio dell'avversario così com'è. Le caselle sono "le tue" e "le
  // sue", il referto è nell'ordine del tabellone: chi riscriveva "lo stesso punteggio" lo rovesciava e contestava la partita.
  const confirm = () =>
    start(async () => {
      setError(null);
      if (match.score_a === null || match.score_b === null) return;
      const r = await reportMatchResult(matchId, slug, match.score_a, match.score_b);
      if (r.error) {
        setError(errText(r.error));
        return;
      }
      router.refresh();
    });

  const saveStaffResult = () =>
    start(async () => {
      setError(null);
      const r = await setMatchResult(matchId, slug, staffA, staffB, staffForfeit);
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
      const n = Math.min(SCREENSHOTS_PER_PLAYER, Math.max(myScreens.length, lastSent.current) + 1);
      const path = `${matchId}/${me}/${n}.webp`;
      const { error: upErr } = await sb.storage.from(SCREENSHOT_BUCKET).upload(path, blob, { contentType: "image/webp", upsert: true });
      if (upErr) throw upErr;
      lastSent.current = n;
      router.refresh();
    } catch {
      setError(x.errors.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  // Ctrl+V (07/11/2026, richiesta di Gami): su tutta la pagina, così funziona anche senza aver cliccato nel riquadro.
  // Stesso percorso del selettore file; qui si controlla solo il tipo, che il selettore limita con `accept`
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    const clip = event.clipboardData;
    if (!clip) return;
    const target = event.target;
    const inTextField = target instanceof HTMLElement && (target.matches("input, textarea") || target.isContentEditable);
    const pasted = pastedScreenshot(Array.from(clip.files), clip.types.includes("text/plain"), inTextField);
    if (pasted.kind === "none") return;
    event.preventDefault();
    if (uploading) return;
    if (pasted.kind === "bad") setError(l.pasteBadType);
    else if (Math.max(myScreens.length, lastSent.current) >= SCREENSHOTS_PER_PLAYER) setError(fill(l.pasteFull, { n: SCREENSHOTS_PER_PLAYER }));
    else upload(pasted.file);
  });
  const canPaste = running && side !== null;
  useEffect(() => {
    if (!canPaste) return;
    const listener = (event: ClipboardEvent) => onPaste(event);
    document.addEventListener("paste", listener);
    return () => document.removeEventListener("paste", listener);
  }, [canPaste]);

  const reportedByMe = match.status === "reported" && match.reported_by === me;
  const reportedByThem = match.status === "reported" && match.reported_by !== me;
  const scoreLine = match.score_a !== null && match.score_b !== null ? `${names.a} ${match.score_a} – ${match.score_b} ${names.b}` : null;
  const canReport = running && side !== null && !pausedNow && !reportLock && Boolean(match.player_a && match.player_b) && (match.status === "pending" || match.status === "reported" || match.status === "disputed");
  const validScore = mine !== theirs && Math.max(mine, theirs) === need && Math.min(mine, theirs) < need;
  const scoreText = (a: number, b: number) => `${Math.max(a, b)}–${Math.min(a, b)}`;
  const reportedWinner = match.score_a !== null && match.score_b !== null ? (match.score_a > match.score_b ? names.a : names.b) : null;
  const staffCan = side === null && running && Boolean(match.player_a && match.player_b) && match.status !== "bye";
  const staffValid = validNeedScore(need, staffA, staffB) && (!staffForfeit || Math.min(staffA, staffB) === 0);

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
        {pausedNow && heldText ? <p className="mt-3 rounded-lg border-2 border-gold bg-gold/10 p-3 text-sm text-pale">{heldText}</p> : null}
        {!pausedNow && reportLock && side !== null && running && match.status === "pending" ? <p className="mt-3 text-sm font-semibold text-gold">{reportLock}</p> : null}
        {side && active && noShowMinutes ? (
          <div className={`mt-4 rounded-lg border-2 p-3 text-sm ${opponentHere ? "border-good/60" : "border-gold bg-gold/10"}`}>
            {opponentHere ? (
              <p className="text-good">✓ {l.opponentHere}</p>
            ) : left !== null && left > 0 ? (
              <p className="text-pale">
                {l.opponentNotYet} {fill(l.noShowWait, { time: formatCountdown(left), n: noShowMinutes })}
              </p>
            ) : watchNoShow ? (
              <>
                <p className="text-pale">{fill(l.noShowReady, { n: noShowMinutes })}</p>
                <button type="button" disabled={pending} onClick={claim} className="btn btn-gold mt-2 text-xs">
                  {l.claim}
                </button>
              </>
            ) : (
              <p className="text-pale-muted">{l.opponentNotYet}</p>
            )}
          </div>
        ) : null}
        {side !== null && match.status === "confirmed" ? (
          <Link href={tournamentHref} className="btn btn-primary mt-3 text-xs">
            {l.back}
          </Link>
        ) : null}
        {canReport && reportedByThem && reportedWinner !== null ? (
          <button type="button" disabled={pending} onClick={confirm} className="btn btn-primary mt-3 text-xs">
            {fill(l.confirmReport, { name: reportedWinner, score: scoreText(match.score_a ?? 0, match.score_b ?? 0) })}
          </button>
        ) : null}
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
              <button type="button" disabled={pending || !validScore} onClick={report} className={`btn text-xs ${reportedByThem ? "btn-ink" : "btn-primary"}`}>
                {l.submitReport}
              </button>
            </div>
            {validScore ? <p className="mt-2 text-sm font-semibold text-pale">{fill(l.reportPreview, { name: (mine > theirs ? myName : theirName) ?? "?", score: scoreText(mine, theirs) })}</p> : null}
          </div>
        ) : null}
        {side === null ? <p className="mt-3 text-xs text-pale-muted">{l.organizerView}</p> : null}
        {staffCan ? (
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-sky/40 pt-3 text-xs">
            <label className="text-sm">
              <span className="block text-xs text-pale-muted">{names.a}</span>
              <input type="number" min={0} max={need} value={staffA} onChange={(e) => setStaffA(Number(e.target.value))} className="mt-1 w-20 rounded-lg border border-sky bg-night px-3 py-2 font-mono text-pale" />
            </label>
            <label className="text-sm">
              <span className="block text-xs text-pale-muted">{names.b}</span>
              <input type="number" min={0} max={need} value={staffB} onChange={(e) => setStaffB(Number(e.target.value))} className="mt-1 w-20 rounded-lg border border-sky bg-night px-3 py-2 font-mono text-pale" />
            </label>
            <label className="flex items-center gap-1 text-pale-muted">
              <input type="checkbox" checked={staffForfeit} onChange={(e) => setStaffForfeit(e.target.checked)} className="accent-mint" /> {x.manage.forfeit}
            </label>
            <button type="button" disabled={pending || !staffValid} onClick={saveStaffResult} className="btn btn-primary text-xs">
              {x.manage.setResult}
            </button>
          </div>
        ) : null}

        <h3 className="mt-6 font-display text-lg font-bold text-chalk">{l.screenshotsTitle}</h3>
        <p className="mt-1 text-xs text-pale-muted">{l.screenshotsHint}</p>
        {side !== null ? (
          <div className="mt-3">
            <p className="kicker text-pale-muted">{l.yours}</p>
            <ScreenList urls={myScreens} empty={l.none} />
            {running && myScreens.length < SCREENSHOTS_PER_PLAYER ? (
              <>
                <label className="mt-2 block text-sm text-pale">
                  <span className="btn btn-ink text-xs">{uploading ? l.uploading : l.upload}</span>
                  <input type="file" accept={SCREENSHOT_ACCEPT} className="sr-only" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
                </label>
                <p className="mt-1 hidden text-xs text-pale-muted md:block">{l.pasteHint}</p>
              </>
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
