"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { checkIn, joinTournament, leaveTournament } from "@/lib/tournament/actions";
import { checkinPhase, checkinWindow, formatCountdown } from "@/lib/tournament/rules";
import { fill } from "@/lib/tournament/types";
import { trackEvent } from "@/lib/analytics";
import { useNow } from "@/lib/useNow";
import { LocalTime } from "./LocalTime";

/** Check-in e lista d'attesa (05/10/2026): quello che la pagina sa di chi guarda. */
export type CheckinInfo = {
  /** lingua della pagina (orari della finestra con LocalTime) */
  locale: string;
  /** inizio del torneo (ISO): la finestra del check-in si calcola da qui */
  startsAt: string;
  /** stato di chi guarda: iscritto, in lista d'attesa (con la posizione) o niente */
  status: "registered" | "waitlist" | null;
  checkedIn: boolean;
  waitlistPosition: number | null;
  /** posti lasciati liberi dagli iscritti senza check-in e posizione di chi guarda nella coda del check-in della lista */
  free: number;
  queuePosition: number | null;
};

type Props = {
  id: string;
  slug: string;
  status: string;
  players: number;
  size: number;
  /** id degli iscritti e di chi ha già consegnato i mazzi */
  registeredIds: string[];
  submittedIds: string[];
  organizerId: string;
  /**
   * Chi guarda, se la pagina lo sa già (la scheda torneo è dinamica e legge la sessione): id oppure null se
   * non è loggato. Con un valore il riquadro è già pieno nell'HTML; senza (undefined) lo si chiede al browser.
   */
  viewerId?: string | null;
  loginHref: string;
  deckHref: string;
  /** pagina di gestione (dalla fase 2): mostrata allo staff (organizzatore, arbitri, admin) */
  manageHref?: string;
  /** chi guarda gestisce il torneo (organizzatore, arbitro o admin): vede "Gestisci" */
  isStaff?: boolean;
  /** partite del tabellone (fase 3): chi gioca trova il link alla propria stanza partita */
  matches?: { id: string; round: number; a: string | null; b: string | null }[];
  matchHrefBase?: string;
  /** torneo con check-in e lista d'attesa (05/10/2026) */
  checkin?: CheckinInfo | null;
  /** a torneo in corso chi è ancora in gara può ritirarsi (perde la partita in corso) */
  canWithdraw?: boolean;
  labels: Dictionary["tournaments"];
};

/**
 * Riquadro iscrizione della scheda torneo. La pagina passa chi guarda (`viewerId`), così il riquadro esce già
 * completo dal server; solo se manca lo scopriamo nel browser, come fa StarRating. Iscrizione e ritiro passano
 * dalle Server Action (RPC con lock e controllo di capienza) e poi si ricarica la pagina.
 *
 * Con il check-in (05/10/2026): a torneo pieno ci si iscrive in lista d'attesa; il check-in apre 2 ore prima e chiude
 * 5 minuti prima (la lista d'attesa fino all'avvio), con il conto alla rovescia; a torneo in corso, "Ritirati".
 */
export function JoinTournament(p: Props) {
  const x = p.labels;
  const c = x.checkin;
  const router = useRouter();
  const known = p.viewerId !== undefined;
  const [userId, setUserId] = useState<string | null | undefined>(known ? p.viewerId : supabaseEnabled ? undefined : null);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ci = p.checkin ?? null;
  const open = p.status === "open";
  const now = useNow(1000, Boolean(ci && open));

  useEffect(() => {
    if (known) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getUser().then(({ data }) => {
      if (alive) setUserId(data.user?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, [known]);

  if (userId === undefined) return <div className="min-h-10" aria-busy="true" />;

  const onWaitlist = ci?.status === "waitlist";
  const isRegistered = registered ?? (userId ? p.registeredIds.includes(userId) || onWaitlist : false);
  const submitted = userId ? p.submittedIds.includes(userId) : false;
  const isOrganizer = userId !== null && userId === p.organizerId;
  const full = p.players >= p.size;
  // la partita "attuale" di chi guarda: quella del turno più alto in cui compare
  const myMatch = userId && p.matches?.length ? [...p.matches].filter((m) => m.a === userId || m.b === userId).sort((m1, m2) => m2.round - m1.round)[0] : undefined;

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, next: boolean | null, event?: "join") =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) {
        setError(x.errors[r.error as keyof typeof x.errors] ?? x.errors.db);
        return;
      }
      if (next !== null) setRegistered(next);
      if (event === "join") trackEvent("tournament_join", { size: p.size });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!open ? <span className="stat-pill bg-night-3 text-pale">{x.statuses[p.status as keyof typeof x.statuses] ?? p.status}</span> : null}
        {open && !userId ? (
          <Link href={p.loginHref} className="btn btn-primary text-xs">
            {x.loginToJoin}
          </Link>
        ) : null}
        {open && userId && !isRegistered ? (
          full && !ci ? (
            <span className="stat-pill bg-night-3 text-pale">{x.full}</span>
          ) : (
            <button type="button" disabled={pending} onClick={() => run(() => joinTournament(p.id, p.slug), true, "join")} className="btn btn-primary text-xs">
              {pending ? x.working : full ? c.joinWaitlist : x.join}
            </button>
          )
        ) : null}
        {isRegistered && !onWaitlist ? <span className="stat-pill bg-mint font-bold text-ink">✓ {x.joined}</span> : null}
        {onWaitlist ? <span className="stat-pill bg-gold font-bold text-ink">{fill(c.onWaitlist, { n: ci?.waitlistPosition ?? "?" })}</span> : null}
        {open && isRegistered ? (
          <button type="button" disabled={pending} onClick={() => run(() => leaveTournament(p.id, p.slug), false)} className="btn btn-danger text-xs">
            {pending ? x.working : x.leave}
          </button>
        ) : null}
        {myMatch && p.matchHrefBase && (p.status === "running" || p.status === "finished") ? (
          <Link href={`${p.matchHrefBase}${myMatch.id}`} className="btn btn-primary text-xs">
            {x.myMatch}
          </Link>
        ) : null}
        {p.status === "running" && p.canWithdraw ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(x.withdrawConfirm)) run(() => leaveTournament(p.id, p.slug), null);
            }}
            className="btn btn-danger text-xs"
          >
            {x.withdraw}
          </button>
        ) : null}
        {(isOrganizer || p.isStaff) && p.manageHref ? (
          <Link href={p.manageHref} className="btn btn-ink text-xs">
            {x.manageCta}
          </Link>
        ) : null}
      </div>
      {onWaitlist ? <p className="text-sm text-pale-muted">{c.waitlistHint}</p> : null}
      {open && ci && isRegistered ? <CheckinBox ci={ci} now={now} submitted={submitted} pending={pending} labels={x} onCheckIn={() => run(() => checkIn(p.id, p.slug), null)} /> : null}
      {open && isRegistered ? (
        <div className="rounded-lg border-2 border-sky bg-night-2/70 p-3 text-sm">
          <p className={`font-semibold ${submitted ? "text-good" : "text-gold"}`}>{submitted ? `✓ ${x.decksSubmitted}` : x.decksMissing}</p>
          <p className="mt-1 text-pale-muted">{ci ? c.decksDeadline : x.decksDeadline}</p>
          <Link href={p.deckHref} className={`btn mt-2 text-xs ${submitted ? "btn-ink" : "btn-primary"}`}>
            {submitted ? x.editDecks : x.submitDecks}
          </Link>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="alert-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckinBox({ ci, now, submitted, pending, labels, onCheckIn }: { ci: CheckinInfo; now: number | null; submitted: boolean; pending: boolean; labels: Dictionary["tournaments"]; onCheckIn: () => void }) {
  const c = labels.checkin;
  const w = checkinWindow(ci.startsAt);
  // prima del montaggio (now null) si mostra solo la finestra, senza fase: niente differenze fra server e browser
  const phase = now === null ? null : checkinPhase(ci.startsAt, now);
  const waitlist = ci.status === "waitlist";
  const canCheck = !ci.checkedIn && submitted && (phase === "open" || (phase === "late" && waitlist));
  let state: string | null = null;
  if (ci.checkedIn) {
    state = waitlist ? (ci.queuePosition !== null && ci.queuePosition <= ci.free ? c.waitlistIn : fill(c.waitlistQueue, { n: ci.queuePosition ?? "?", free: ci.free })) : c.done;
  } else if (phase === "before" && now !== null) state = fill(c.opensIn, { time: formatCountdown(w.opensAt - now) });
  else if (phase === "open" && now !== null) state = fill(c.closesIn, { time: formatCountdown(w.closesAt - now) });
  else if (phase === "late") state = waitlist ? c.lateWaitlist : c.missed;
  return (
    <div className={`rounded-lg border-2 p-3 text-sm ${ci.checkedIn ? "border-good/60" : "border-gold bg-gold/10"}`}>
      <p className="kicker text-mint">{c.title}</p>
      <p className="mt-1 text-pale-muted">{c.rule}</p>
      <p className="mt-1 text-xs text-pale-muted">
        {c.window}: <LocalTime iso={new Date(w.opensAt).toISOString()} locale={ci.locale} utcLabel={labels.utc} /> → <LocalTime iso={new Date(w.closesAt).toISOString()} locale={ci.locale} utcLabel={labels.utc} />
      </p>
      {state ? <p className={`mt-2 font-semibold ${ci.checkedIn ? "text-good" : phase === "late" && !waitlist ? "text-bad" : "text-pale"}`}>{ci.checkedIn ? `✓ ${state}` : state}</p> : null}
      {!ci.checkedIn && !submitted ? <p className="mt-1 text-xs text-gold">{c.needDecks}</p> : null}
      {canCheck ? (
        <button type="button" disabled={pending} onClick={onCheckIn} className="btn btn-primary mt-2 text-xs">
          {pending ? labels.working : c.button}
        </button>
      ) : null}
    </div>
  );
}
