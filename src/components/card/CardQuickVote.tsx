"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { voteCard } from "@/lib/community/cardVoteActions";
import { CARD_SCORES, fillVoteText } from "@/lib/cardVotes";
import { trackEvent } from "@/lib/analytics";
import type { CardVoteWidgetLabels } from "@/components/CardVote";

/**
 * Voto rapido nella griglia del database /cards (04/11/2026, Pierluigi: "votare le carte senza necessariamente dover
 * aprirle […] quando si è in mouseover ci deve essere la possibilità di votare da lì"). Al passaggio del mouse sulla
 * carta compare, al posto del piede, una fila di dieci tasti da 1 a 10: stessa Server Action `voteCard` e stessi testi
 * del widget della scheda carta (`CardVote`), che resta il posto con media, scala e spiegazioni.
 *
 * La carta è un link (FlipCard) e dentro un link non vanno tasti: la fila è sorella del link, nello stesso `<li>`
 * (`.card-qv-host`), e i suoi stili tengono girata la carta finché il mouse è sopra la fila. Solo dove il mouse esiste
 * (`hover: hover`): su touch il tocco apre la scheda, come sempre, e lì si vota col widget. Da tastiera la fila resta
 * fuori dal Tab (dieci tasti per 120 carte); si vota dalla scheda.
 *
 * Chi è loggato e i suoi voti si leggono UNA volta per tutta la griglia (`useMyCardVotes`, `card_votes` con RLS: ognuno
 * vede solo i suoi), non carta per carta come nel widget.
 */

export type MyCardVotes = {
  /** undefined mentre si legge la sessione, null senza accesso */
  userId: string | null | undefined;
  mine: Record<string, number>;
  setScore: (slug: string, score: number) => void;
};

export function useMyCardVotes(enabled: boolean): MyCardVotes {
  const [userId, setUserId] = useState<string | null | undefined>(supabaseEnabled ? undefined : null);
  const [mine, setMine] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) return;
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
        const { data } = await sb.from("card_votes").select("card, score").eq("user_id", uid);
        if (alive && data) setMine(Object.fromEntries((data as { card: string; score: number }[]).map((r) => [r.card, r.score])));
      }
    })();
    return () => {
      alive = false;
    };
  }, [enabled]);

  return { userId, mine, setScore: (slug, score) => setMine((m) => ({ ...m, [slug]: score })) };
}

export function CardQuickVote({
  slug,
  name,
  my,
  labels,
  loginHref,
  onVoted,
}: {
  slug: string;
  name: string;
  my: MyCardVotes;
  labels: CardVoteWidgetLabels;
  loginHref: string;
  onVoted: (slug: string, r: { avg: number; votes: number }) => void;
}) {
  const [hover, setHover] = useState(0);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const mine = my.mine[slug];

  // sessione ancora da leggere: niente fila, per non far lampeggiare "Accedi per votare" a chi è loggato
  if (my.userId === undefined) return null;

  if (!my.userId) {
    return (
      <div className="card-qv">
        <Link href={loginHref} tabIndex={-1} className="card-qv-login">
          {labels.loginToVote} →
        </Link>
      </div>
    );
  }

  const cast = (n: number) => {
    if (pending) return;
    start(async () => {
      const r = await voteCard(slug, n);
      if (r.error) {
        setMsg({ kind: "err", text: r.error === "unavailable" ? labels.unavailable : r.error === "limit" ? labels.limit : r.error === "notLoggedIn" ? labels.loginToVote : labels.voteError });
        return;
      }
      trackEvent("card_vote", { score: n, vote_type: mine ? "update" : "new", placement: "cards_grid" });
      my.setScore(slug, n);
      if (r.avg !== undefined && r.votes !== undefined) onVoted(slug, { avg: r.avg, votes: r.votes });
      setMsg({ kind: "ok", text: labels.voted });
    });
  };

  const shown = hover || mine || 0;
  const head = msg ? msg.text : mine ? fillVoteText(labels.yourVote, { n: mine }) : labels.title;

  return (
    <div className={`card-qv${pending ? " is-pending" : ""}`}>
      <p className={`card-qv-head${msg?.kind === "err" ? " is-err" : msg?.kind === "ok" ? " is-ok" : ""}`} aria-live="polite">
        {head}
      </p>
      <div className="card-qv-scale" role="group" aria-label={`${labels.rate} · ${name}`} onMouseLeave={() => setHover(0)}>
        {CARD_SCORES.map((n) => (
          <button
            key={n}
            type="button"
            tabIndex={-1}
            onClick={() => cast(n)}
            onMouseEnter={() => setHover(n)}
            disabled={pending}
            aria-label={`${n}/10`}
            aria-pressed={mine === n}
            className={`card-qv-btn${n <= shown ? " is-on" : ""}${mine === n ? " is-mine" : ""}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
