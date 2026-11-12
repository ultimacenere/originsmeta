"use client";

import { daysUntil, formatRemaining, giveawayClock, startHasTime, type GiveawayClock } from "@/lib/event/clock";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { twitchUrl } from "@/lib/event/codes";
import { trackNamedEvent } from "@/lib/analytics";
import { FaceImg, faceOf, useEventData, useEventNow, type Face, type LiveEvent } from "./EventLive";

/**
 * Countdown del giveaway (10/11/2026). Dalle note: "Countdown live in pagina: mostra canale attivo per il giveaway e
 * tempo rimanente", "Ritagliabile come overlay OBS dai creator (o fornire direttamente l'URL per OBS)". Lo stesso
 * calcolo (clock.ts) per la fascia della pagina e per l'overlay; prima dell'inizio dell'evento conta i giorni che
 * mancano.
 */

function untilText(ms: number, timed = true): string {
  // data senza ora (startsAt a mezzanotte): solo i giorni
  if (!timed) {
    const d = daysUntil(ms);
    return `${d} ${d === 1 ? L.clock.units.d1 : L.clock.units.d}`;
  }
  const days = Math.floor(ms / 86_400_000);
  return days > 0 ? `${days}${L.clock.days} ${formatRemaining(ms - days * 86_400_000)}` : formatRemaining(ms);
}

const packsText = (n: number) => (n === 1 ? L.clock.packsOne : fillEvent(L.clock.packs, { n }));

const two = (n: number) => String(n).padStart(2, "0");

/** Giorni, ore, minuti e secondi che mancano, per i riquadri del conto alla rovescia. */
function untilParts(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return { d: Math.floor(total / 86_400), h: Math.floor((total % 86_400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

type View =
  | { kind: "loading" }
  | { kind: "before"; ms: number }
  | { kind: "running" | "paused"; clock: GiveawayClock; face: Face | null }
  | { kind: "waiting"; next: Face | null; nextAt: number | null }
  | { kind: "done" };

function faceForChannel(data: LiveEvent, channel: string): Face | null {
  if (!channel) return null;
  const t = data.config.talent.find((x) => !("hidden" in x) && x.twitch === channel);
  if (t) return faceOf(t, data.avatars, data.live, channel);
  return { id: channel, name: channel, img: null, twitch: channel, live: data.live.includes(channel), hidden: false };
}

function useView(): { view: View; data: LiveEvent } {
  const data = useEventData();
  const now = useEventNow();
  if (now === null) return { view: { kind: "loading" }, data };
  const clock = giveawayClock(data.config.slots, data.state.giveaway, now);
  if (clock.status === "running" || clock.status === "paused") return { view: { kind: clock.status, clock, face: faceForChannel(data, clock.slot?.channel ?? "") }, data };
  if (clock.status === "done") return { view: { kind: "done" }, data };
  const start = data.config.startsAt ? Date.parse(data.config.startsAt) : NaN;
  if (!Number.isNaN(start) && start > now && clock.next?.startsAt == null) return { view: { kind: "before", ms: start - now }, data };
  return { view: { kind: "waiting", next: clock.next ? faceForChannel(data, clock.next.slot.channel) : null, nextAt: clock.next?.startsAt ?? null }, data };
}

const channelName = (f: Face | null) => (f ? f.name : "un canale da svelare");

/**
 * La fascia della pagina dell'evento. Con la grafica "da evento" (EventShow) la fascia ha due posti: `slot="top"`, sopra
 * la testata, quando il giveaway è partito (chi arriva dalla chat di Twitch vede subito canale e tempo che manca), e
 * `slot="body"` prima (conto alla rovescia a riquadri con `units`). Il posto si decide dallo stato salvato, non
 * dall'ora, così l'HTML del server e il primo disegno del browser coincidono.
 */
export function EventClockBanner({ slot, units = false }: { slot?: "top" | "body"; units?: boolean } = {}) {
  const { view, data } = useView();
  const now = useEventNow();
  const keyword = data.config.keyword;
  const started = data.state.giveaway.anchor !== null;
  if (slot === "top" && !started) return null;
  if (slot === "body" && started) return null;
  if (view.kind === "loading") return <div className="ev-clock card-night min-h-24 p-4 sm:p-5" aria-hidden />;
  const timed = startHasTime(data.config.startsAt);
  if (units && view.kind === "before") {
    const p = untilParts(view.ms);
    const days = daysUntil(view.ms);
    const cells: [number, string][] = timed
      ? [
          [p.d, L.clock.units.d],
          [p.h, L.clock.units.h],
          [p.m, L.clock.units.m],
          [p.s, L.clock.units.s],
        ]
      : [[days, days === 1 ? L.clock.units.d1 : L.clock.units.d]];
    return (
      // niente aria-live: i secondi cambiano di continuo. Ai lettori di schermo va una frase che cambia una volta al minuto.
      <section aria-label={L.clock.startsIn} className="ev-clock is-before ev-count card-night relative overflow-hidden p-4 sm:p-5">
        <p className="ev-count-label kicker text-mint">{L.clock.startsIn}</p>
        <p className="sr-only">{timed ? fillEvent(L.clock.startsInLong, { d: p.d, h: p.h, m: p.m }) : days === 1 ? L.clock.startsTomorrow : fillEvent(L.clock.startsInDays, { d: days })}</p>
        <div className="ev-count-row" aria-hidden>
          {cells.map(([n, label]) => (
            <span key={label} className="ev-count-u">
              <b className="tabular-nums">{two(n)}</b>
              <small>{label}</small>
            </span>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section aria-live="polite" aria-label={L.nav.giveaway} className={`ev-clock is-${view.kind} card-night relative overflow-hidden p-4 sm:p-5 ${view.kind === "running" ? "!border-mint" : ""}`}>
      {view.kind === "before" ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="kicker text-mint">{L.clock.startsIn}</p>
          <p className="ev-clock-time font-mono text-3xl font-bold text-chalk sm:text-4xl">{untilText(view.ms, timed)}</p>
        </div>
      ) : null}
      {view.kind === "running" || view.kind === "paused" ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            {view.face ? <FaceImg face={view.face} size={56} /> : null}
            <div className="min-w-0">
              <p className="kicker text-mint">{view.kind === "running" ? L.clock.live : L.clock.paused}</p>
              <p className="truncate font-display text-xl font-extrabold text-sky sm:text-3xl">{channelName(view.face)}</p>
              <p className="text-sm text-pale">
                {fillEvent(L.clock.write, { keyword })} · {packsText(view.clock.slot?.packs ?? 0)}
              </p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-pale-muted">{L.clock.left}</p>
              <p className="ev-clock-time font-mono text-4xl font-bold text-chalk tabular-nums">{formatRemaining(view.clock.remainingMs)}</p>
            </div>
            {view.face?.twitch ? (
              <a
                href={twitchUrl(view.face.twitch)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={() => trackNamedEvent("event_channel_click", { placement: "clock", channel: view.face?.twitch ?? "" })}
              >
                {L.clock.goTo}
              </a>
            ) : null}
          </div>
          {view.clock.next ? (
            <p className="w-full text-sm text-pale-muted">
              {L.clock.next} {channelName(faceForChannel(data, view.clock.next.slot.channel))}
              {view.clock.next.startsAt && now ? ` (${formatRemaining(view.clock.next.startsAt - now)})` : ""}
            </p>
          ) : null}
        </div>
      ) : null}
      {view.kind === "waiting" ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {view.next ? (
            <div className="flex min-w-0 items-center gap-3">
              <FaceImg face={view.next} size={44} />
              <div className="min-w-0">
                <p className="kicker text-mint">{L.clock.nextAt}</p>
                <p className="truncate font-display text-xl font-extrabold text-sky">{channelName(view.next)}</p>
              </div>
              {view.nextAt && now ? <p className="ev-clock-time font-mono text-3xl font-bold text-chalk tabular-nums">{formatRemaining(view.nextAt - now)}</p> : <p className="text-sm text-pale">{L.clock.soon}</p>}
            </div>
          ) : null}
          <p className="text-sm text-pale">{L.clock.waiting}</p>
        </div>
      ) : null}
      {view.kind === "done" ? <p className="font-display text-lg font-bold text-sky">{L.clock.done}</p> : null}
    </section>
  );
}

/** L'overlay per OBS: sfondo trasparente, testi grandi, niente link. */
export function EventClockOverlay() {
  const { view, data } = useView();
  const keyword = data.config.keyword;
  const box = "inline-flex max-w-full flex-col gap-1 rounded-2xl border-[3px] border-sky bg-night/90 px-6 py-4 text-chalk shadow-[0_8px_30px_rgba(0,0,0,0.45)]";
  if (view.kind === "loading") return null;
  return (
    <div className="p-3" lang="it">
      <div className={box}>
        {view.kind === "running" || view.kind === "paused" ? (
          <>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-mint">{view.kind === "running" ? L.overlay.live : L.clock.paused}</p>
            <div className="flex items-center gap-3">
              {view.face ? <FaceImg face={view.face} size={52} /> : null}
              <p className="truncate font-display text-4xl font-extrabold text-sky">{channelName(view.face)}</p>
              <p className="ml-auto pl-4 font-mono text-5xl font-bold tabular-nums">{formatRemaining(view.clock.remainingMs)}</p>
            </div>
            <p className="font-display text-xl font-bold">{fillEvent(L.overlay.write, { keyword })}</p>
            {view.clock.next ? (
              <p className="text-base text-pale">
                {L.overlay.next}: {channelName(faceForChannel(data, view.clock.next.slot.channel))}
              </p>
            ) : null}
          </>
        ) : null}
        {view.kind === "before" ? (
          <>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-mint">{data.config.name}</p>
            <p className="font-display text-2xl font-extrabold text-sky">{L.overlay.startsIn}</p>
            <p className="font-mono text-5xl font-bold tabular-nums">{untilText(view.ms, startHasTime(data.config.startsAt))}</p>
          </>
        ) : null}
        {view.kind === "waiting" ? (
          <>
            <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-mint">{L.overlay.waiting}</p>
            {view.next ? (
              <p className="font-display text-3xl font-extrabold text-sky">
                {L.overlay.next}: {channelName(view.next)}
              </p>
            ) : null}
            <p className="font-display text-xl font-bold">{fillEvent(L.overlay.write, { keyword })}</p>
          </>
        ) : null}
        {view.kind === "done" ? <p className="font-display text-3xl font-extrabold text-sky">{L.overlay.done}</p> : null}
        <p className="mt-1 text-xs text-pale-muted">
          originsmeta.com · {L.overlay.unofficial}
        </p>
      </div>
    </div>
  );
}
