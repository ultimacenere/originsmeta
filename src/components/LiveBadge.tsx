"use client";

import { useEffect, useState } from "react";
import { loadLive } from "@/lib/liveClient";
import { safeLiveUsers } from "@/lib/twitchLive";
import { fillCreator, type LiveLabels } from "@/lib/creatorLabels";

/**
 * Badge LIVE accanto al nome di un creator in diretta su Origins TCG (pacchetto CREATOR, 26/09/2026). Lo stato arriva
 * nel browser da /api/live, una richiesta sola per pagina anche con tanti badge (`loadLive` in src/lib/liveClient.ts,
 * promessa condivisa per 90 secondi come la cache della rotta): le pagine restano ISR. Finché la risposta non arriva, o
 * senza le chiavi di Twitch, o se nessuno è in diretta, non c'è nulla (niente segnaposto che sposta il testo). Il link
 * porta al canale Twitch, in una nuova scheda.
 *
 * Più visibile dal 28/09/2026 (Pierluigi: "rendi più visibile il bollino"): pastiglia magenta scuro (`crimson-deep`,
 * testo `chalk`, contrasto 6:1) con l'anello e l'alone magenta, pallino che pulsa (fermo con "riduci animazioni"), e tre
 * misure: `sm` nelle righe fitte di /decks, `md` accanto ai nomi (scheda del mazzo, /creators, /live), `lg` nella
 * testata del profilo /u, con gli spettatori. Stili `.live-badge` e `.live-dot` in globals.css.
 */
export function LiveBadge({
  username,
  labels,
  placement,
  size = "md",
  className = "",
}: {
  username: string;
  labels: LiveLabels;
  placement: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [live, setLive] = useState<{ channel: string; viewers: number } | null>(null);
  useEffect(() => {
    let alive = true;
    loadLive().then((res) => {
      const found = safeLiveUsers(res?.users)[username];
      if (alive && found) setLive(found);
    });
    return () => {
      alive = false;
    };
  }, [username]);
  if (!live) return null;
  const title = fillCreator(labels.title, { viewers: live.viewers });
  return (
    <a
      href={live.channel}
      target="_blank"
      rel="ugc nofollow noopener"
      title={title}
      aria-label={`${labels.badge}: ${title}`}
      data-om-event="creator_link_click"
      data-om-kind="twitch_live"
      data-om-placement={placement}
      className={`live-badge is-${size} ${className}`}
    >
      <span className="live-dot" aria-hidden="true" />
      {labels.badge}
      {size === "lg" ? (
        <span className="live-badge-viewers" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {live.viewers}
        </span>
      ) : null}
    </a>
  );
}
