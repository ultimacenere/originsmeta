"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { joinTournament, leaveTournament } from "@/lib/tournament/actions";

type Props = {
  id: string;
  slug: string;
  status: string;
  players: number;
  size: number;
  /** id degli iscritti e di chi ha già consegnato i mazzi (dalla pagina ISR) */
  registeredIds: string[];
  submittedIds: string[];
  organizerId: string;
  loginHref: string;
  deckHref: string;
  /** pagina di gestione (dalla fase 2): mostrata solo all'organizzatore */
  manageHref?: string;
  labels: Dictionary["tournaments"];
};

/**
 * Riquadro iscrizione della scheda torneo. La pagina è statica (ISR): chi è loggato lo scopriamo nel browser,
 * come fa StarRating; iscrizione e ritiro passano dalle Server Action (RPC con lock e controllo di capienza)
 * e poi si ricarica la pagina, che le action hanno già rigenerato.
 */
export function JoinTournament(p: Props) {
  const x = p.labels;
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(supabaseEnabled ? undefined : null);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    sb.auth.getUser().then(({ data }) => {
      if (alive) setUserId(data.user?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (userId === undefined) return <div className="min-h-10" aria-busy="true" />;

  const isRegistered = registered ?? (userId ? p.registeredIds.includes(userId) : false);
  const submitted = userId ? p.submittedIds.includes(userId) : false;
  const isOrganizer = userId !== null && userId === p.organizerId;
  const open = p.status === "open";

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, next: boolean) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) {
        setError(x.errors[r.error as keyof typeof x.errors] ?? x.errors.db);
        return;
      }
      setRegistered(next);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!open ? <span className="stat-pill bg-night-3 text-pale">{x.statuses[p.status as keyof typeof x.statuses] ?? p.status}</span> : null}
        {open && !userId ? (
          <Link href={p.loginHref} className="btn btn-mint text-xs">
            {x.loginToJoin}
          </Link>
        ) : null}
        {open && userId && !isRegistered ? (
          p.players >= p.size ? (
            <span className="stat-pill bg-night-3 text-pale">{x.full}</span>
          ) : (
            <button type="button" disabled={pending} onClick={() => run(() => joinTournament(p.id, p.slug), true)} className="btn btn-mint text-xs">
              {pending ? x.working : x.join}
            </button>
          )
        ) : null}
        {isRegistered ? <span className="stat-pill bg-mint font-bold text-ink">{x.joined}</span> : null}
        {open && isRegistered ? (
          <button type="button" disabled={pending} onClick={() => run(() => leaveTournament(p.id, p.slug), false)} className="btn btn-ghost text-xs">
            {pending ? x.working : x.leave}
          </button>
        ) : null}
        {isOrganizer && p.manageHref ? (
          <Link href={p.manageHref} className="btn btn-ink text-xs">
            {x.manage}
          </Link>
        ) : null}
      </div>
      {open && isRegistered ? (
        <div className="rounded-lg border-2 border-sky bg-night-2/70 p-3 text-sm">
          <p className={`font-semibold ${submitted ? "text-good" : "text-gold"}`}>{submitted ? x.decksSubmitted : x.decksMissing}</p>
          <p className="mt-1 text-pale-muted">{x.decksDeadline}</p>
          <Link href={p.deckHref} className={`btn mt-2 text-xs ${submitted ? "btn-ink" : "btn-mint"}`}>
            {submitted ? x.editDecks : x.submitDecks}
          </Link>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
