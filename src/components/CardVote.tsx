"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { voteCard, type CardVoteResult } from "@/lib/community/cardVoteActions";
import { CARD_SCORES, fillVoteText, votesWord } from "@/lib/cardVotes";
import type { CardVoteLabels } from "@/lib/cardVoteLabels";
import { trackEvent } from "@/lib/analytics";

export type CardVoteWidgetLabels = CardVoteLabels["widget"];

/**
 * Voto a una carta da 1 (scarsa) a 10 (ottima), 06/10/2026: dieci tasti, la media e il numero di voti, il proprio voto.
 * Le pagine che lo montano sono in ISR (scheda carta, tier list dei voti): media e voti arrivano dall'HTML, chi è
 * loggato e il suo voto si leggono nel browser (`card_votes`, RLS: ognuno vede solo i suoi). Il clic chiama la Server
 * Action `voteCard`; la risposta porta media e voti aggiornati, che il widget mostra subito (`onChange` li passa a chi
 * lo ospita, per esempio al dettaglio del TierExplorer). Senza accesso il tasto è il link alla pagina di accesso, con il
 * ritorno; `available = false` (migrazione non ancora applicata) dice solo che i voti non sono attivi.
 * Lo stesso schema di StarRating (voti ai mazzi), senza il caso "mazzo proprio": una carta si può sempre votare.
 */
export function CardVote({
  slug,
  avg,
  votes,
  labels,
  loginHref,
  placement,
  locale,
  available = true,
  onChange,
}: {
  slug: string;
  avg: number;
  votes: number;
  labels: CardVoteWidgetLabels;
  loginHref: string;
  placement: "card_page" | "tier_list";
  locale: string;
  available?: boolean;
  onChange?: (r: { avg: number; votes: number }) => void;
}) {
  const [userId, setUserId] = useState<string | null | undefined>(supabaseEnabled ? undefined : null);
  const [mine, setMine] = useState<number | null>(null);
  const [stats, setStats] = useState({ avg, votes });
  const [hover, setHover] = useState(0);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb || !available) return;
    let alive = true;
    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      const uid = session?.user.id ?? null;
      if (!alive) return;
      setUserId(uid);
      if (uid) {
        const { data } = await sb.from("card_votes").select("score").eq("card", slug).eq("user_id", uid).maybeSingle();
        if (alive && data) setMine((data as { score: number }).score);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, available]);

  const canVote = available && Boolean(userId) && !pending;
  const oneDecimal = (n: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

  const cast = (n: number) => {
    if (!canVote) return;
    start(async () => {
      const r: CardVoteResult = await voteCard(slug, n);
      if (r.error) {
        setMsg({ kind: "err", text: r.error === "unavailable" ? labels.unavailable : r.error === "limit" ? labels.limit : r.error === "notLoggedIn" ? labels.loginToVote : labels.voteError });
        return;
      }
      trackEvent("card_vote", { score: n, vote_type: mine ? "update" : "new", placement });
      setMine(n);
      if (r.avg !== undefined && r.votes !== undefined) {
        setStats({ avg: r.avg, votes: r.votes });
        onChange?.({ avg: r.avg, votes: r.votes });
      }
      setMsg({ kind: "ok", text: labels.voted });
    });
  };

  const shown = hover || mine || 0;
  const status = !supabaseEnabled || !available ? (
    available ? null : labels.unavailable
  ) : userId === undefined ? null : !userId ? (
    <Link href={loginHref} className="font-semibold text-mint underline underline-offset-2 hover:text-sky">
      {labels.loginToVote}
    </Link>
  ) : mine ? (
    fillVoteText(labels.yourVote, { n: mine })
  ) : (
    labels.rate
  );

  return (
    <div className="card-vote">
      <div className="card-vote-stats">
        <p className="kicker text-pale-muted">{labels.title}</p>
        <p className="card-vote-avg">
          {stats.votes ? oneDecimal(stats.avg) : "–"}
          <span className="card-vote-max">/ 10</span>
        </p>
        <p className="card-vote-n">{stats.votes ? votesWord({ one: labels.votesOne, many: labels.votesMany }, stats.votes) : labels.noVotes}</p>
      </div>
      <div className="card-vote-scale-wrap">
        <div className="card-vote-scale" role="group" aria-label={labels.rate} onMouseLeave={() => setHover(0)}>
          {CARD_SCORES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => cast(n)}
              onMouseEnter={() => canVote && setHover(n)}
              onFocus={() => canVote && setHover(n)}
              onBlur={() => setHover(0)}
              disabled={!canVote}
              aria-label={`${n}/10`}
              aria-pressed={mine === n}
              className={`card-vote-btn${n <= shown ? " is-on" : ""}${mine === n ? " is-mine" : ""}`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="card-vote-ends" aria-hidden="true">
          <span>1 · {labels.low}</span>
          <span>10 · {labels.high}</span>
        </p>
        <p className={`card-vote-status ${msg?.kind === "err" ? "text-error" : canVote && !mine ? "font-semibold text-pale" : "text-pale-muted"}`} aria-live="polite">
          {msg ? msg.text : status}
        </p>
      </div>
    </div>
  );
}
