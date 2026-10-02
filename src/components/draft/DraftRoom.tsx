"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DraftAction, Seat } from "@/lib/draft/engine";
import { botKit } from "@/lib/draft/bot";
import { createDraftRoom, joinDraftRoom, leaveDraftRoom, loadDraftRoom, moveDraftRoom, type RoomResult } from "@/lib/draft/onlineActions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { fill } from "@/lib/tournament/types";
import type { DraftLabels } from "@/lib/draftLabels";
import { CopyButton } from "@/components/CopyButton";
import { DraftBoard, stageLabel, type DraftUiCard } from "./DraftBoard";

type Ok = Extract<RoomResult, { ok: true }>;

/** Controllo di riserva: ogni 4 s senza il tempo reale, ogni 15 s con (se un evento si perde). */
const POLL_OFFLINE = 4000;
const POLL_LIVE = 15000;

/**
 * Stanza del draft online (fase 2, 02/10/2026). Il browser non decide niente: manda la mossa al server
 * (`moveDraftRoom`) e mostra la vista del suo posto che torna indietro. Sa che c'è qualcosa di nuovo dal tempo reale di
 * Supabase (la riga della stanza in `draft_rooms`, che i due giocatori leggono) e, di riserva, con un controllo
 * periodico. Allo scadere del tempo chiede la stanza al server, che fa scegliere il Cervello per chi è in ritardo.
 */
export function DraftRoom({
  initial,
  cards,
  labels: L,
  builderHref,
  draftHref,
  roomBase,
  roomUrl,
}: {
  initial: Ok;
  cards: DraftUiCard[];
  labels: DraftLabels;
  builderHref: string;
  draftHref: string;
  roomBase: string;
  roomUrl: string;
}) {
  const O = L.online;
  const router = useRouter();
  const kit = useMemo(() => botKit(cards), [cards]);
  const bySlug = useMemo(() => new Map(cards.map((c) => [c.slug, c])), [cards]);
  const [res, setRes] = useState<Ok>(initial);
  const [skew, setSkew] = useState(() => initial.now - Date.now());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [confirmLeave, setConfirmLeave] = useState(false);
  const inflight = useRef(false);
  const room = res.room;
  const view = res.view;
  const errorText = useCallback((code: string) => (O.errors as Record<string, string>)[code] ?? O.errors.generic, [O.errors]);

  const apply = useCallback((r: RoomResult) => {
    if (r.ok) {
      setRes(r);
      setSkew(r.now - Date.now());
      return true;
    }
    setError(errorText(r.error));
    return false;
  }, [errorText]);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const r = await loadDraftRoom(room.code);
      if (r.ok) apply(r);
    } catch {
      // rete: ci riprova il controllo successivo
    } finally {
      inflight.current = false;
    }
  }, [room.code, apply]);

  // tempo reale: la riga della stanza cambia a ogni mossa (solo per chi gioca: la policy lo vuole)
  const participant = room.seat !== null;
  useEffect(() => {
    if (!participant) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    const channel = sb
      .channel(`draft-room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "draft_rooms", filter: `id=eq.${room.id}` }, () => {
        void refresh();
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      void sb.removeChannel(channel);
    };
  }, [participant, room.id, refresh]);

  // controllo di riserva, solo a scheda visibile e finché il draft non è finito
  const finished = room.status === "done";
  useEffect(() => {
    if (!participant || finished) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, live ? POLL_LIVE : POLL_OFFLINE);
    return () => clearInterval(t);
  }, [participant, finished, live, refresh]);

  // orologio e scadenza: allo scadere (più un secondo di margine) il server fa scegliere il Cervello
  const deadline = view?.deadline ?? null;
  const fired = useRef<number | null>(null);
  useEffect(() => {
    if (deadline === null) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n + skew > deadline + 1000 && fired.current !== deadline) {
        fired.current = deadline;
        void refresh();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, skew, refresh]);

  // misura: il draft fra amici comincia (una volta per stanza e per scheda)
  useEffect(() => {
    if (room.status !== "drafting" || !participant) return;
    try {
      const k = `originsmeta.draft.started.${room.code}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      // senza storage si conta lo stesso
    }
    trackEvent("draft_start", { format: room.format, opponent: "friend" });
  }, [room.status, room.code, room.format, participant]);

  const run = async (fn: () => Promise<RoomResult>) => {
    setBusy(true);
    setError(null);
    try {
      apply(await fn());
    } catch {
      setError(O.errors.generic);
    }
    setBusy(false);
  };

  const act = (action: DraftAction) => {
    if (busy) return;
    void run(() => moveDraftRoom(room.code, action));
  };

  const rematch = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await createDraftRoom(room.format, room.code);
      if (r.ok) {
        router.push(`${roomBase}/${r.code}`);
        return;
      }
      if (r.error === "rematch_exists") await refresh();
      else setError(errorText(r.error));
    } catch {
      setError(O.errors.generic);
    }
    setBusy(false);
  };

  const fmt = L.formats[room.format];
  const me = room.seat;
  const oppName = (me === 0 ? room.joinerName : room.creatorName) ?? O.opponentFallback;
  const errorBox = error ? (
    <p className="text-sm text-crimson-soft" role="alert">
      {error}
    </p>
  ) : null;

  /* ---- stanza in attesa ---- */
  if (room.status === "waiting") {
    if (me === 0) {
      return (
        <section aria-labelledby="draft-wait" className="felt-panel-mint max-w-2xl space-y-4 p-5">
          <p className="kicker text-mint">{fmt.name}</p>
          <h2 id="draft-wait" className="t-section">
            {fill(O.waitingTitle, { code: room.code })}
          </h2>
          <p className="text-sm text-chalk">{O.waitingHint}</p>
          <p className="font-mono text-3xl tracking-[0.3em] text-sky" aria-label={`${O.code}: ${room.code.split("").join(" ")}`}>
            {room.code}
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={roomUrl} label={O.copyLink} copied={O.copied} className="btn btn-primary" />
            <CopyButton text={room.code} label={`${O.code} ${room.code}`} copied={O.copied} className="btn btn-ghost" />
          </div>
          <p className="text-xs text-chalk-muted" aria-live="polite">
            {live ? O.live : O.reconnecting}
          </p>
          {errorBox}
        </section>
      );
    }
    return (
      <section aria-labelledby="draft-join" className="felt-panel max-w-2xl space-y-4 p-5">
        {room.canJoin ? (
          <>
            <h2 id="draft-join" className="t-section">
              {fill(O.invite, { name: room.creatorName ?? O.opponentFallback, format: fmt.name })}
            </h2>
            <p className="text-sm text-chalk">{fmt.tagline}</p>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void run(() => joinDraftRoom(room.code))}>
              {O.enter}
            </button>
          </>
        ) : (
          <h2 id="draft-join" className="t-section">
            {room.invitedMe ? O.full : O.notInvited}
          </h2>
        )}
        {errorBox}
        <a href={draftHref} className="btn btn-ghost">
          {O.newDraft}
        </a>
      </section>
    );
  }

  /* ---- stanza piena, per chi non gioca ---- */
  if (me === null || !view) {
    return (
      <section className="felt-panel max-w-2xl space-y-4 p-5">
        <h2 className="t-section">{O.full}</h2>
        <a href={draftHref} className="btn btn-ghost">
          {O.newDraft}
        </a>
      </section>
    );
  }

  /* ---- draft in corso o finito ---- */
  const opp: Seat = me === 0 ? 1 : 0;
  const left = view.left;
  const remaining = deadline === null ? null : Math.max(0, Math.ceil((deadline - (now + skew)) / 1000));
  const draft = view.draft;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="kicker text-mint">
          {fmt.name} · {stageLabel(L, draft)}
        </p>
        <p className="text-sm font-bold text-chalk">{fill(O.vs, { name: oppName })}</p>
        <span className={`text-xs ${live ? "text-mint" : "text-chalk-muted"}`} aria-live="polite">
          ● {live ? O.live : O.reconnecting}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {remaining !== null && draft.phase !== "done" ? (
            <span className={`font-mono text-sm ${remaining <= 10 ? "text-crimson-soft" : "text-chalk"}`} title={O.timerHint} role="timer">
              {fill(O.timer, { s: remaining })}
            </span>
          ) : null}
          {draft.phase !== "done" && !left[me] ? (
            confirmLeave ? (
              <>
                <span className="text-sm text-chalk">{O.leaveConfirm}</span>
                <button type="button" className="btn btn-ghost text-xs" disabled={busy} onClick={() => { setConfirmLeave(false); void run(() => leaveDraftRoom(room.code)); }}>
                  {L.play.yes}
                </button>
                <button type="button" className="btn btn-ink text-xs" onClick={() => setConfirmLeave(false)}>
                  {L.play.no}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ink text-xs" onClick={() => setConfirmLeave(true)}>
                {O.leave}
              </button>
            )
          ) : null}
        </div>
      </div>
      {left[opp] && draft.phase !== "done" ? <p className="text-sm text-gold">{fill(O.left, { name: oppName })}</p> : null}
      {left[me] && draft.phase !== "done" ? <p className="text-sm text-gold">{O.youLeft}</p> : null}
      {errorBox}
      <DraftBoard
        L={L}
        view={draft}
        me={me}
        oppName={oppName}
        oppDeckTitle={fill(L.result.oppDeck, { name: oppName })}
        bySlug={bySlug}
        kit={kit}
        builderHref={builderHref}
        onAct={act}
        resultActions={
          <>
            {room.nextCode ? (
              <a href={`${roomBase}/${room.nextCode}`} className="btn btn-primary">
                {O.rematchGo}
              </a>
            ) : (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void rematch()}>
                {O.rematch}
              </button>
            )}
            <a href={draftHref} className="btn btn-ghost">
              {O.newDraft}
            </a>
          </>
        }
      />
    </div>
  );
}
