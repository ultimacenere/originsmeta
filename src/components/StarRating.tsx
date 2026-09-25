"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { voteDeck } from "@/lib/community/actions";
import { trackEvent } from "@/lib/analytics";

export type RatingLabels = {
  rating: string;
  votes: string;
  vote: string;
  noVotes: string;
  yourVote: string;
  rate: string;
  loginToVote: string;
  ownDeck: string;
  voted: string;
  voteError: string;
};

/** Media e voto dell'utente (1–5 stelle). La pagina è statica: chi è loggato lo scopriamo nel browser. */
export function StarRating({
  deckId,
  ownerId,
  avg,
  votes,
  path,
  loginHref,
  labels,
}: {
  deckId: string;
  ownerId: string;
  avg: number;
  votes: number;
  path: string;
  loginHref: string;
  labels: RatingLabels;
}) {
  const [userId, setUserId] = useState<string | null | undefined>(supabaseEnabled ? undefined : null);
  const [mine, setMine] = useState<number | null>(null);
  const [stats, setStats] = useState({ avg, votes });
  const [hover, setHover] = useState(0);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      const uid = session?.user.id ?? null;
      if (!alive) return;
      setUserId(uid);
      if (uid) {
        const { data } = await sb.from("deck_votes").select("stars").eq("deck_id", deckId).eq("user_id", uid).maybeSingle();
        if (alive && data) setMine((data as { stars: number }).stars);
      }
    })();
    return () => {
      alive = false;
    };
  }, [deckId]);

  const isOwner = Boolean(userId) && userId === ownerId;
  const canVote = Boolean(userId) && !isOwner && !pending;

  const cast = (n: number) => {
    if (!canVote) return;
    start(async () => {
      const r = await voteDeck(deckId, n, path);
      if (r.error) setMsg({ kind: "err", text: r.error === "ownDeck" ? labels.ownDeck : labels.voteError });
      else {
        // misura: voto nuovo o cambiato (`mine` è ancora quello di prima del clic)
        trackEvent("deck_vote", { stars: n, vote_type: mine ? "update" : "new" });
        setMine(n);
        if (r.avg !== undefined && r.votes !== undefined) setStats({ avg: r.avg, votes: r.votes });
        setMsg({ kind: "ok", text: labels.voted });
      }
    });
  };

  const shown = hover || mine || Math.round(stats.avg);
  const status = !supabaseEnabled ? null : userId === undefined ? null : !userId ? (
    <Link href={loginHref} className="font-semibold text-mint underline underline-offset-2 hover:text-sky">
      {labels.loginToVote}
    </Link>
  ) : isOwner ? (
    labels.ownDeck
  ) : mine ? (
    `${labels.yourVote}: ${mine}/5`
  ) : (
    labels.rate
  );

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border-2 border-sky bg-night-2/60 px-4 py-3">
      <div>
        <p className="kicker text-pale-muted">{labels.rating}</p>
        <p className="mt-0.5 font-display text-3xl font-extrabold leading-none text-sky">
          {stats.votes ? stats.avg.toFixed(1) : "–"}
          <span className="ml-1 text-sm font-medium text-pale-muted">/ 5</span>
        </p>
        <p className="mt-1 font-mono text-xs text-pale-muted">{stats.votes ? `${stats.votes} ${stats.votes === 1 ? labels.vote : labels.votes}` : labels.noVotes}</p>
      </div>
      <div className="flex flex-col gap-1">
        {/* stelle vuote in pale-muted: prima erano pale/25 (1,89:1) e il comando per votare quasi non si vedeva */}
        <div className="flex gap-0.5" role="group" aria-label={labels.rate} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => cast(n)}
              onMouseEnter={() => canVote && setHover(n)}
              onFocus={() => canVote && setHover(n)}
              onBlur={() => setHover(0)}
              disabled={!canVote}
              aria-label={`${n}/5`}
              aria-pressed={mine === n}
              className={`text-3xl leading-none transition ${n <= shown ? "text-mint" : "text-pale-muted"} ${canVote ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
            >
              {n <= shown ? "★" : "☆"}
            </button>
          ))}
        </div>
        <p className={`text-xs ${msg?.kind === "err" ? "text-error" : canVote && !mine ? "font-semibold text-pale" : "text-pale-muted"}`} aria-live="polite">
          {msg ? msg.text : status}
        </p>
      </div>
    </div>
  );
}
