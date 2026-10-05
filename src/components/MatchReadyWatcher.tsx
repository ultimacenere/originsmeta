"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fill } from "@/lib/tournament/types";
import { formatCountdown, noShowAt } from "@/lib/tournament/rules";
import { useNow } from "@/lib/useNow";

export type WatchedMatch = { id: string; round: number; player_a: string | null; player_b: string | null; status: string; ready_at: string | null; seen_a: string | null; seen_b: string | null };

type Props = {
  tournamentId: string;
  viewerId: string;
  initial: WatchedMatch | null;
  /** nomi dei giocatori (id → nome) e dei turni (numero → "Semifinali"…) già pronti dal server */
  names: Record<string, string>;
  roundNames: Record<number, string>;
  matchHrefBase: string;
  noShowMinutes: number | null;
  labels: Dictionary["tournaments"];
};

const POLL_MS = 20_000;
const ACTIVE = new Set(["pending", "reported", "disputed"]);

/**
 * Riquadro "la tua partita è pronta" nella scheda del torneo, per chi gioca (05/10/2026). Il tabellone scorre (ogni
 * partita parte quando sono finite le due prima), quindi il giocatore non sa quando tocca a lui: il riquadro rilegge
 * ogni 20 secondi la sua partita più avanzata (una query piccola, sotto RLS), mostra il conto alla rovescia del tempo
 * di assenza finché non entra nella stanza e cambia il titolo della scheda del browser, così si vede anche da un'altra
 * scheda. Quando la partita cambia, ricarica la pagina (tabellone e iscritti).
 */
export function MatchReadyWatcher({ tournamentId, viewerId, initial, names, roundNames, matchHrefBase, noShowMinutes, labels }: Props) {
  const x = labels;
  const b = x.liveBanner;
  const router = useRouter();
  const [match, setMatch] = useState<WatchedMatch | null>(initial);
  const firstId = useRef(initial?.id ?? null);
  const now = useNow(1000, Boolean(match && noShowMinutes));

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    const poll = async () => {
      const { data } = await sb
        .from("tournament_matches")
        .select("id, round, player_a, player_b, status, ready_at, seen_a, seen_b")
        .eq("tournament_id", tournamentId)
        .or(`player_a.eq.${viewerId},player_b.eq.${viewerId}`)
        .order("round", { ascending: false })
        .limit(1);
      if (!alive) return;
      const row = ((data ?? []) as WatchedMatch[])[0] ?? null;
      setMatch(row);
      const key = row ? `${row.id}:${row.player_a}:${row.player_b}:${row.status}` : null;
      if (key !== firstId.current) {
        firstId.current = key;
        if (document.visibilityState === "visible") router.refresh();
      }
    };
    firstId.current = initial ? `${initial.id}:${initial.player_a}:${initial.player_b}:${initial.status}` : null;
    const timer = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [tournamentId, viewerId, initial, router]);

  const live = match && ACTIVE.has(match.status) ? match : null;
  const ready = Boolean(live && live.player_a && live.player_b);
  const mine = live ? (live.player_a === viewerId ? "a" : "b") : null;
  const seenByMe = live ? Boolean(mine === "a" ? live.seen_a : live.seen_b) : false;
  const opponent = live ? (mine === "a" ? live.player_b : live.player_a) : null;

  // titolo della scheda: "🔔" finché la partita è pronta e chi gioca non è ancora entrato nella stanza
  useEffect(() => {
    if (!ready || seenByMe) return;
    const base = document.title;
    document.title = `🔔 ${b.tabTitle} · ${base}`;
    return () => {
      document.title = base;
    };
  }, [ready, seenByMe, b.tabTitle]);

  if (!live) return null;
  const deadline = ready ? noShowAt(live.ready_at, noShowMinutes) : null;
  const left = deadline !== null && now !== null ? deadline - now : null;

  return (
    <section className={`card-night mt-6 flex flex-wrap items-center justify-between gap-4 p-5 ${ready && !seenByMe ? "border-gold" : ""}`} aria-live="polite" aria-label={x.statuses.running}>
      <div className="min-w-0">
        <p className="kicker text-mint">
          {x.statuses.running} · {roundNames[live.round] ?? fill(x.match.round, { n: live.round })}
        </p>
        <p className="mt-1 font-display text-lg font-extrabold text-chalk">{ready ? b.title : b.titleWaiting}</p>
        {ready && opponent ? <p className="mt-1 text-sm text-pale">{fill(b.detail, { name: names[opponent] ?? "?" })}</p> : null}
        {ready && !seenByMe && left !== null ? (
          <p className={`mt-2 font-mono text-sm ${left > 0 ? "text-gold" : "text-bad"}`}>{left > 0 ? fill(b.enterWithin, { time: formatCountdown(left) }) : b.enterLate}</p>
        ) : null}
      </div>
      {ready ? (
        <Link href={`${matchHrefBase}${live.id}`} className="btn btn-primary">
          {b.cta}
        </Link>
      ) : null}
    </section>
  );
}
