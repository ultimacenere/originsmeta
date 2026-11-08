"use client";

import { useEffect, useRef, useState } from "react";
import { onTrackedEvent, trackEvent } from "@/lib/analytics";
import { ORIGINSMETA_DISCORD } from "@/lib/discord";
import { COPY_NUDGE_KEY, copyNudgeDue, copyNudgeLabels, parseCopyNudgeMemory, type CopyNudgeMemory } from "@/lib/copyNudge";
import type { Locale } from "@/lib/i18n";
import { DiscordButton } from "./DiscordButton";

/**
 * Invito dopo la copia del codice del gioco (09/11/2026, regole e testi in src/lib/copyNudge.ts). Ascolta gli eventi
 * `game_code_copy` del sito (`onTrackedEvent`: nel browser dello staff non arriva nulla, come per Vercel e GA4) e, al
 * massimo una volta al giorno, mostra il riquadro: entra nel Discord di OriginsMeta e, se la pagina ha il tasto Segui
 * dell'autore (`data-follow-author`, schede dei mazzi), "Segui l'autore", che porta al tasto. Misura: `copy_nudge_view`
 * e `copy_nudge_click` (target discord | follow | close); il clic sul Discord manda anche `discord_click` con placement
 * copy_nudge, dal riconoscimento dei link di analytics.ts. Montato nel layout delle pagine (site), niente dati.
 */
const read = (): CopyNudgeMemory => {
  try {
    return parseCopyNudgeMemory(window.localStorage.getItem(COPY_NUDGE_KEY));
  } catch {
    return {};
  }
};
const write = (patch: CopyNudgeMemory) => {
  try {
    window.localStorage.setItem(COPY_NUDGE_KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {
    /* memoria del browser bloccata: il riquadro può ricomparire, nient'altro */
  }
};
/** Il tasto Segui dell'autore, se la pagina lo mostra (compare solo per i profili con vetrina). */
const followTarget = (): HTMLElement | null => document.querySelector<HTMLElement>("[data-follow-author] button, [data-follow-author] a");

export function CopyNudge({ locale }: { locale: Locale }) {
  const L = copyNudgeLabels[locale];
  const [open, setOpen] = useState<{ placement: string; follow: boolean } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onTrackedEvent((name, params) => {
        if (name !== "game_code_copy") return;
        const now = Date.now();
        if (!copyNudgeDue(read(), now)) return;
        const placement = String(params.placement ?? "other");
        write({ shown: now });
        setOpen({ placement, follow: Boolean(followTarget()) });
        trackEvent("copy_nudge_view", { placement });
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function close() {
    if (open) trackEvent("copy_nudge_click", { target: "close", placement: open.placement });
    write({ closed: Date.now() });
    setOpen(null);
  }

  return (
    <div
      ref={panel}
      role="status"
      aria-live="polite"
      data-om-placement="copy_nudge"
      className="card-night fixed inset-x-4 bottom-24 z-50 p-4 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-96"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="t-panel text-sky">✓ {L.title}</p>
        <button type="button" onClick={close} aria-label={L.close} className="-mt-1 shrink-0 rounded px-2 text-lg leading-none text-pale-muted hover:text-chalk">
          ×
        </button>
      </div>
      <p className="mt-2 text-sm text-pale">{L.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          onClickCapture={() => {
            trackEvent("copy_nudge_click", { target: "discord", placement: open.placement });
            write({ joined: true });
            setOpen(null);
          }}
        >
          <DiscordButton href={ORIGINSMETA_DISCORD} size="sm">
            {L.discord}
          </DiscordButton>
        </span>
        {open.follow ? (
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => {
              trackEvent("copy_nudge_click", { target: "follow", placement: open.placement });
              const target = followTarget();
              setOpen(null);
              if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "center" });
                target.focus({ preventScroll: true });
              }
            }}
          >
            {L.follow}
          </button>
        ) : null}
      </div>
    </div>
  );
}
