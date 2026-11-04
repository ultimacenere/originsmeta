"use client";

import { useEffect, useState, useTransition } from "react";
import { supabaseEnabled } from "@/lib/supabase/env";
import { myCardVotes, voteCard } from "@/lib/community/cardVoteActions";
import { CARD_SCORES, fillVoteText } from "@/lib/cardVotes";
import { trackEvent } from "@/lib/analytics";
import type { CardVoteWidgetLabels } from "@/components/CardVote";

/**
 * Voto rapido nella griglia del database /cards (04/11/2026, Pierluigi: "votare le carte senza necessariamente dover
 * aprirle […] quando si è in mouseover ci deve essere la possibilità di votare da lì"). Al passaggio del mouse sulla
 * carta compare, al posto del piede, una fila di dieci tasti da 1 a 10: stessa Server Action `voteCard` e stessi testi
 * del widget della scheda carta (`CardVote`), che resta il posto con media, scala e spiegazioni. Si vota anche senza
 * account (Pierluigi, stesso giorno: "il voto deve essere libero, senza iscrizione").
 *
 * La carta è un link (FlipCard) e dentro un link non vanno tasti: la fila è sorella del link, nello stesso `<li>`
 * (`.card-qv-host`), e i suoi stili tengono girata la carta finché il mouse è sopra la fila. Solo dove il mouse esiste
 * (`hover: hover`): su touch il tocco apre la scheda, come sempre, e lì si vota col widget. Da tastiera la fila resta
 * fuori dal Tab (dieci tasti per 120 carte); si vota dalla scheda.
 *
 * I voti di chi guarda si leggono UNA volta per tutta la griglia (`useMyCardVotes`), non carta per carta.
 */

export type MyCardVotes = {
  mine: Record<string, number>;
  setScore: (slug: string, score: number) => void;
};

export function useMyCardVotes(enabled: boolean): MyCardVotes {
  const [mine, setMine] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled || !supabaseEnabled) return;
    let alive = true;
    myCardVotes()
      .then((m) => {
        if (alive) setMine((now) => ({ ...m, ...now }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);

  return { mine, setScore: (slug, score) => setMine((m) => ({ ...m, [slug]: score })) };
}

export function CardQuickVote({
  slug,
  name,
  my,
  labels,
  onVoted,
}: {
  slug: string;
  name: string;
  my: MyCardVotes;
  labels: CardVoteWidgetLabels;
  onVoted: (slug: string, r: { avg: number; votes: number }) => void;
}) {
  const [hover, setHover] = useState(0);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const mine = my.mine[slug];

  const cast = (n: number) => {
    if (pending) return;
    start(async () => {
      const r = await voteCard(slug, n);
      if (r.error) {
        setMsg({ kind: "err", text: r.error === "unavailable" ? labels.unavailable : r.error === "limit" ? labels.limit : labels.voteError });
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
