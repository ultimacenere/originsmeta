"use client";

import { useEffect, useState } from "react";
import type { LiveResponse } from "@/lib/twitchLive";
import { fillCreator, type LiveLabels } from "@/lib/creatorLabels";

/**
 * Badge LIVE accanto al nome di un creator in diretta su Origins TCG (pacchetto CREATOR, 26/09/2026). Lo stato arriva
 * nel browser da /api/live, una richiesta sola per pagina anche con tanti badge (la promessa è condivisa e vale 90
 * secondi, come la cache della rotta): le pagine restano ISR. Finché la risposta non arriva, o senza le chiavi di
 * Twitch, o se nessuno è in diretta, non c'è nulla (niente segnaposto che sposta il testo). Il link porta al canale
 * Twitch, in una nuova scheda; il puntino pulsa solo se il sistema non chiede di ridurre le animazioni.
 */

const TTL_MS = 90_000;
let shared: { at: number; promise: Promise<LiveResponse | null> } | null = null;

function loadLive(): Promise<LiveResponse | null> {
  if (!shared || Date.now() - shared.at > TTL_MS) {
    shared = {
      at: Date.now(),
      promise: fetch("/api/live")
        .then((r) => (r.ok ? (r.json() as Promise<LiveResponse>) : null))
        .catch(() => null),
    };
  }
  return shared.promise;
}

export function LiveBadge({ username, labels, placement, className = "" }: { username: string; labels: LiveLabels; placement: string; className?: string }) {
  const [live, setLive] = useState<{ channel: string; viewers: number } | null>(null);
  useEffect(() => {
    let alive = true;
    loadLive().then((res) => {
      const found = res?.users?.[username];
      if (alive && found && /^https:\/\/www\.twitch\.tv\/[a-z0-9_]{3,25}$/.test(found.channel)) setLive(found);
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
      className={`inline-flex items-center gap-1 rounded-md bg-bad px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:brightness-110 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink motion-safe:animate-pulse" aria-hidden="true" />
      {labels.badge}
    </a>
  );
}
