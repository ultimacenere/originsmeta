"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { addCodes, controlAction, createEvent, forgetWinners, loadControl, rotateControl, streamerCodes, syncMods, type ControlOp, type StreamerCodes } from "@/lib/event/actions";
import { deckByPlayer, drawOf, lastRound, roundComplete, spinsLeft, spinsOfDraw } from "@/lib/event/engine";
import { formatRemaining, formatSlotMinutes, giveawayClock, leaderOf, slotGroups } from "@/lib/event/clock";
import { emptyConfig, eventPacks, totalPacks } from "@/lib/event/config";
import { formatCode } from "@/lib/event/codes";
import { pct, standings } from "@/lib/event/swiss";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { eventPath, eventShortLink, overlayPath } from "@/lib/event/links";
import type { Assignment, ControlEvent, EventConfig } from "@/lib/event/types";
import { EventWheel } from "./EventWheel";
import { ToolHead, ToolHero, ToolShell } from "./EventTool";

/**
 * Regia di un evento (10/11/2026): la pagina "visibile solo ai caster" delle note del 10/11. Si entra con il link
 * della regia (#k=<token> nell'indirizzo: il frammento non arriva mai al server né ai log) o da staff con l'accesso
 * fatto (senza link). Ruota dei mazzi, turni svizzeri e risultati, orologio del giveaway, codici, link dei mod, chi ha
 * riscattato e la configurazione in JSON. Ogni tasto è una Server Action che il database controlla.
 * Dall'11/11/2026 ha la grafica della Locandina (EventTool.tsx, event-tools.css): la ruota in grande con i mazzi
 * estratti accanto, i tavoli con il "VS" (si tocca chi ha vinto), il giveaway come tabellone e, sotto, il "dietro le
 * quinte" (codici, link dei mod, riscatti, configurazione).
 */

const fmtTime = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Rome" });

function tokenFromHash(): string | null {
  const m = /(?:^|[#&])k=([A-Za-z0-9_-]{32,200})/.exec(window.location.hash);
  return m ? m[1] : null;
}

function errText(code: string): string {
  return (L.control.errors as Record<string, string>)[code] ?? fillEvent(L.control.error, { msg: code });
}

/**
 * I codici di ogni streamer, da consegnare a mano (14/11/2026, nota della riunione: lo streamer fa l'estrazione con il
 * suo bot e dà i codici in privato). Solo per lo staff: la regia lo mostra quando la configurazione ha `manualCodes`.
 */
function StreamerCodesPanel({ slug, config }: { slug: string; config: EventConfig }) {
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<StreamerCodes[] | null>(null);
  const [free, setFree] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const run = useCallback(
    async (prepare: boolean) => {
      setBusy(true);
      setMsg(null);
      try {
        const r = await streamerCodes(slug, prepare);
        if (r.ok) {
          setList(r.streamers);
          setFree(r.free);
          if (prepare) setMsg(L.control.streamers.prepared);
        } else setMsg(errText(r.error));
      } catch {
        setMsg(errText("unavailable"));
      } finally {
        setBusy(false);
      }
    },
    [slug],
  );
  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum all'apertura (le altre le fanno i tasti) */
  useEffect(() => {
    void run(false);
  }, [run]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const groups = slotGroups(config.slots);
  const blockOf = (slot: number) => groups.findIndex((g) => g.includes(slot)) + 1;
  const talentOf = (ch: string) => config.talent.find((t) => t.twitch === ch);
  const ready = (list ?? []).reduce((n, s) => n + s.codes.length, 0);
  const message = (s: StreamerCodes) =>
    [
      fillEvent(L.control.streamers.messageHead, { name: config.name }),
      ...s.slots.flatMap((slot) => [
        "",
        fillEvent(L.control.streamers.block, { n: blockOf(slot), packs: config.slots[slot].packs }),
        ...s.codes.filter((c) => c.slot === slot).map((c) => formatCode(c.code)),
      ]),
      "",
      fillEvent(L.control.streamers.messageEnd, { url: `https://${eventShortLink(slug)}` }),
    ].join("\n");

  return (
    <section className="ev-panel is-wide" aria-labelledby="ctl-streamers">
      <ToolHead id="ctl-streamers" k={L.control.kickers.backstage}>
        {L.control.streamers.title}
      </ToolHead>
      <p className="ev-tool-text">{L.control.streamers.intro}</p>
      <div className="ev-cta">
        <button type="button" className="btn btn-primary text-xs" disabled={busy} onClick={() => void run(true)}>
          {L.control.streamers.prepare}
        </button>
        <button type="button" className="btn btn-ghost text-xs" disabled={busy} onClick={() => void run(false)}>
          {L.control.streamers.refresh}
        </button>
      </div>
      <p role="status" className="ev-tool-status">
        {busy ? "…" : msg}
      </p>
      {list ? <p className="ev-note">{fillEvent(L.control.streamers.total, { ready, packs: totalPacks(config.slots), free })}</p> : null}
      {list && !ready ? <p className="ev-note">{L.control.streamers.none}</p> : null}
      {list && ready ? (
        <ul className="ev-list ev-list--two">
          {list.map((s) => {
            const t = talentOf(s.channel);
            return (
              <li key={s.channel} className="ev-streamer">
                <span className="ev-list-name">{t?.name ?? s.channel}</span>
                <span className="ev-list-sub">{fillEvent(L.control.streamers.count, { ready: s.codes.length, packs: s.packs, redeemed: s.codes.filter((c) => c.redeemed).length })}</span>
                {t?.user ? (
                  <a className="ev-list-sub underline" href={`/it/u/${t.user}`} target="_blank" rel="noopener noreferrer">
                    {L.control.streamers.profile}
                  </a>
                ) : null}
                <CopyLink text={message(s)} label={L.control.streamers.copy} />
                {s.slots.map((slot) => (
                  <p key={slot} className="ev-streamer-codes">
                    <b>{fillEvent(L.control.streamers.block, { n: blockOf(slot), packs: config.slots[slot].packs })}</b>{" "}
                    {s.codes
                      .filter((c) => c.slot === slot)
                      .map((c) => (
                        <code key={c.code} className={c.redeemed ? "is-redeemed" : undefined} title={c.redeemed ? L.control.streamers.redeemed : undefined}>
                          {formatCode(c.code)}
                        </code>
                      ))}
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function CopyLink({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ink text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          window.prompt(label, text);
        }
      }}
    >
      {done ? L.control.mods.copied : label}
    </button>
  );
}

export function EventControl({ slug }: { slug: string }) {
  // il link della regia è nel frammento dell'indirizzo: letto al primo disegno nel browser (sul server resta undefined,
  // e tutte e due le volte la pagina dice "Carico la regia…")
  const [token, setToken] = useState<string | null | undefined>(() => (typeof window === "undefined" ? undefined : tokenFromHash()));
  const [event, setEvent] = useState<ControlEvent | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "forbidden" | "missing" | "unavailable">("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [json, setJson] = useState("");
  const [codeCount, setCodeCount] = useState(25);
  const [spin, setSpin] = useState<{ deck: string; key: number } | null>(null);
  const [lastSpin, setLastSpin] = useState<Assignment | null>(null);
  const [revealSpin, setRevealSpin] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [newLink, setNewLink] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const apply = useCallback((ev: ControlEvent, warn: string[]) => {
    setEvent(ev);
    setWarnings(warn);
    setJson((cur) => (cur ? cur : JSON.stringify(ev.config, null, 2)));
    setStatus("ready");
  }, []);

  const load = useCallback(
    async (tok: string | null) => {
      const r = await loadControl(slug, tok);
      if (r.ok) apply(r.event, r.warnings);
      else setStatus(r.error === "not_found" ? "missing" : r.error === "forbidden" ? "forbidden" : "unavailable");
    },
    [slug, apply],
  );

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- caricamento una tantum all'apertura (i successivi li fa `act`) */
  useEffect(() => {
    if (token !== undefined) void load(token);
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // un altro caster può aver cambiato qualcosa: si rilegge ogni 15 secondi
  useEffect(() => {
    if (status !== "ready" || token === undefined) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && !busy) void loadControl(slug, token).then((r) => r.ok && (setEvent(r.event), setWarnings(r.warnings)));
    }, 15_000);
    return () => clearInterval(id);
  }, [status, token, slug, busy]);

  const act = async (op: ControlOp) => {
    if (busy || token === undefined) return;
    setBusy(true);
    setMsg(null);
    setErrors([]);
    try {
      const r = await controlAction(slug, token, op);
      if (r.ok) {
        setEvent(r.event);
        setWarnings(r.warnings);
        if (op.type === "config") setJson(JSON.stringify(r.event.config, null, 2));
        if (r.assignment) {
          setLastSpin(r.assignment);
          setRevealSpin(false);
          setSpin({ deck: r.assignment.deck, key: Date.now() });
        }
        if (op.type === "reset") {
          setLastSpin(null);
          setSpin(null);
          setRevealSpin(true);
        }
        setMsg(op.type === "reset" ? L.control.reset.done : L.control.saved);
      } else {
        setMsg(errText(r.error));
        if (r.errors) setErrors(r.errors);
        if (r.error === "conflict") void load(token);
      }
    } catch {
      setMsg(errText("unavailable"));
    } finally {
      setBusy(false);
    }
  };

  const decks = useMemo(() => event?.config.decks ?? [], [event]);
  // sulla ruota restano sbiaditi i mazzi già usciti nell'estrazione in corso (una nuova estrazione li rimette tutti)
  const usedDecks = useMemo(() => new Set(event ? spinsOfDraw(event.state, drawOf(event.state)).map((a) => a.deck) : []), [event]);
  const name = useCallback((id: string) => event?.config.talent.find((t) => t.id === id)?.name ?? id, [event]);

  if (status === "loading" || token === undefined)
    return (
      <ToolShell>
        <p className="ev-empty">{L.control.loading}</p>
      </ToolShell>
    );
  if (status === "forbidden")
    return (
      <ToolShell>
        <p className="ev-tool-alert">{L.control.noAccess}</p>
      </ToolShell>
    );
  if (status === "unavailable")
    return (
      <ToolShell>
        <p className="ev-tool-alert">{L.control.errors.unavailable}</p>
      </ToolShell>
    );
  if (status === "missing") {
    return (
      <ToolShell>
        <div className="ev-panel">
        <p className="ev-tool-text">{L.control.staffCreate}</p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await createEvent(slug, { ...emptyConfig("Attrix Showmatch") });
            setBusy(false);
            if (r.ok) {
              window.location.hash = `k=${r.token}`;
              setToken(r.token);
              await load(r.token);
            } else setMsg(errText(r.error));
          }}
        >
          {L.control.create}
        </button>
        {msg ? <p className="ev-tool-warn">{msg}</p> : null}
        </div>
      </ToolShell>
    );
  }
  if (!event) return null;

  const { config, state } = event;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://originsmeta.com";
  const left = spinsLeft(config, state);
  const last = lastRound(state);
  const open = last > 0 && !roundComplete(state, last);
  const clock = giveawayClock(config.slots, state.giveaway, now);
  const assigned = deckByPlayer(state);
  const draw = drawOf(state);
  const drawSpins = spinsOfDraw(state, draw);
  // finché la ruota gira, il giro appena uscito non compare né nell'elenco né nei giri rimasti (14/11/2026, nota della
  // riunione: "la ruota mostra il risultato prima di fermarsi")
  const isSpinning = (a: Assignment) => Boolean(lastSpin && !revealSpin && a.deck === lastSpin.deck && a.at === lastSpin.at);
  const shownSpins = drawSpins.filter((a) => !isSpinning(a));
  const shownLeft = left + (drawSpins.length - shownSpins.length);
  const lastAssignment = state.assignments[state.assignments.length - 1];
  // l'ultimo giro si annulla finché dopo non è nato un turno; un'estrazione aperta e ancora vuota si richiude
  const canUndoSpin = drawSpins.length ? last <= (lastAssignment?.afterRound ?? 0) : draw > 1;
  const earlierDraws = Array.from({ length: draw - 1 }, (_, k) => draw - 1 - k);
  const assignedRow = (a: Assignment, i: number) => (
    <li key={`${a.deck}-${a.draw ?? 1}-${i}`} className="ev-deck" style={{ "--deck": config.decks.find((d) => d.id === a.deck)?.color ?? "transparent" } as React.CSSProperties}>
      <span className="ev-deck-body">
        <span className="ev-deck-name">{deckName(a.deck)}</span>
        <span className="ev-deck-sub">{a.players.map(name).join(" · ")}</span>
      </span>
    </li>
  );
  const deckName = (id: string | undefined) => config.decks.find((d) => d.id === id)?.name ?? "—";
  const rows = standings(config.talent.filter((t) => t.role === "player").map((t) => t.id), state.matches);
  const slotCodes = new Map(event.slotCodes.map((s) => [s.slot, s]));
  const packs = eventPacks(config);
  // i canali di un passaggio (più di uno quando gli slot partono insieme)
  const channelsOf = (group: number[]) => group.map((i) => config.slots[i]?.channel ?? "").join(" + ");
  const controlLink = event.controlToken ? `${origin}${eventPath(slug, "/regia")}#k=${event.controlToken}` : null;

  return (
    <div className="ev ev--a ev-tool">
      <ToolHero kicker={L.control.title} aside={L.control.castersOnly} name={config.name}>
        <div className="ev-cta">
          <a href={eventPath(slug)} target="_blank" rel="noopener noreferrer" className="btn btn-ink text-xs">
            {L.control.publicPage}
          </a>
          <CopyLink text={`${origin}${overlayPath(slug)}`} label={L.control.overlay} />
        </div>
        <p role="status" className="ev-tool-status">
          {busy ? "…" : msg}
        </p>
        {errors.length ? (
          <div className="ev-tool-alert is-bad">
            <p>{fillEvent(L.control.config.invalid, { n: errors.length })}</p>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {warnings.length ? (
          <div className="ev-tool-alert">
            <p>{L.control.config.warnings}</p>
            <ul>
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </ToolHero>

      <div className="ev-wrap ev-main">
        <section className="ev-panel ev-panel--wheel" aria-labelledby="ctl-wheel">
          <ToolHead id="ctl-wheel" n="01" k={L.control.kickers.wheel}>
            {L.control.wheel.title}
          </ToolHead>
          <div className="ev-wheel-box">
            {decks.length ? (
              <div className="ev-wheel-stage">
                <EventWheel decks={decks} used={usedDecks} target={spin} onDone={() => setRevealSpin(true)} />
              </div>
            ) : (
              <p className="ev-empty">{L.decks.empty}</p>
            )}
            <div className="ev-wheel-side">
              <p className="ev-wheel-left">
                {draw > 1 ? `${fillEvent(L.control.wheel.draw, { n: draw })} · ` : ""}
                {shownLeft ? fillEvent(L.control.wheel.left, { n: shownLeft }) : L.control.wheel.none}
              </p>
              {lastSpin && revealSpin ? <p className="ev-result">{fillEvent(L.control.wheel.result, { players: lastSpin.players.map(name).join(" e "), deck: deckName(lastSpin.deck) })}</p> : null}
              <div className="ev-cta">
                <button type="button" className="btn btn-primary" disabled={busy || !left} onClick={() => act({ type: "spin" })}>
                  {busy ? L.control.wheel.spinning : L.control.wheel.spin}
                </button>
                <button type="button" className="btn btn-ghost text-xs" disabled={busy || !canUndoSpin} onClick={() => act({ type: "undoSpin" })}>
                  {drawSpins.length || draw === 1 ? L.control.wheel.undo : fillEvent(L.control.wheel.undoDraw, { n: draw })}
                </button>
              </div>
              {shownSpins.length ? <ol className="ev-decks ev-assigned">{shownSpins.map(assignedRow)}</ol> : null}
              {!shownLeft && state.assignments.length ? (
                <div className="ev-newdraw">
                  <button
                    type="button"
                    className="btn btn-ink text-xs"
                    disabled={busy || open}
                    onClick={() => {
                      if (window.confirm(L.control.wheel.newDrawConfirm)) void act({ type: "newDraw" });
                    }}
                  >
                    {L.control.wheel.newDraw}
                  </button>
                  <p className="ev-tool-note">{L.control.wheel.newDrawNote}</p>
                </div>
              ) : null}
              {earlierDraws.length ? (
                <details className="ev-earlier">
                  <summary>{L.control.wheel.earlier}</summary>
                  {earlierDraws.map((d) => (
                    <div key={d}>
                      <p className="ev-earlier-title">{fillEvent(L.control.wheel.draw, { n: d })}</p>
                      <ol className="ev-decks ev-assigned">{spinsOfDraw(state, d).map(assignedRow)}</ol>
                    </div>
                  ))}
                </details>
              ) : null}
            </div>
          </div>
        </section>

        <section className="ev-panel" aria-labelledby="ctl-rounds">
          <ToolHead id="ctl-rounds" n="02" k={L.control.kickers.rounds}>
            {L.control.rounds.title}
          </ToolHead>
          <div className="ev-cta">
            <button type="button" className="btn btn-primary" disabled={busy || open} onClick={() => act({ type: "nextRound" })}>
              {fillEvent(L.control.rounds.create, { n: last + 1 })}
            </button>
            {last ? (
              <button type="button" className="btn btn-ghost text-xs" disabled={busy} onClick={() => act({ type: "undoRound" })}>
                {fillEvent(L.control.rounds.undo, { n: last })}
              </button>
            ) : null}
          </div>
          {open ? <p className="ev-tool-warn">{fillEvent(L.control.rounds.openFirst, { n: last })}</p> : null}
          {Array.from({ length: last }, (_, k) => last - k).map((round) => (
            <div key={round} className="ev-ctl-round">
              <h3 className="ev-round-title">{fillEvent(L.pairings.round, { n: round })}</h3>
              <ul className="ev-ctl-matches">
                {state.matches
                  .filter((m) => m.round === round)
                  .sort((a, b) => a.table - b.table)
                  .map((m) => (
                    <li key={m.id} className={`ev-match ev-ctl-match${m.winner ? " is-done" : ""}`}>
                      {m.b ? (
                        <>
                          <p className="ev-match-top">{fillEvent(L.pairings.table, { n: m.table })}</p>
                          <div className="ev-ctl-row">
                            {[m.a, m.b].map((p, i) => (
                              <Fragment key={p}>
                                {i === 1 ? (
                                  <span className="ev-vs" aria-hidden>
                                    {L.pairings.vs}
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => act({ type: "winner", match: m.id, winner: m.winner === p ? null : p })}
                                  className={`ev-pick${m.winner === p ? " is-won" : ""}`}
                                  aria-pressed={m.winner === p}
                                  aria-label={fillEvent(L.control.rounds.winsA, { name: name(p) })}
                                >
                                  <span className="ev-pick-name">{name(p)}</span>
                                  <span className="ev-pick-deck">{deckName(assigned.get(p))}</span>
                                  {m.winner === p ? <span className="ev-won">{L.pairings.winner}</span> : null}
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="ev-bye">
                          {name(m.a)}: {L.pairings.bye}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {state.matches.length ? (
            <div className="ev-standings overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-sm">
                <thead className="text-xs uppercase">
                  <tr>
                    <th>#</th>
                    <th>{L.standings.player}</th>
                    <th className="text-right">{L.standings.wins}</th>
                    <th className="text-right">{L.standings.losses}</th>
                    <th className="text-right">{L.standings.points}</th>
                    <th className="text-right">{L.standings.omw}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.player} data-rank={r.rank} className="border-t border-night-3 text-pale">
                      <td className="font-mono">{r.rank}</td>
                      <td className="font-bold text-sky">{name(r.player)}</td>
                      <td className="text-right font-mono">{r.wins}</td>
                      <td className="text-right font-mono">{r.losses}</td>
                      <td className="text-right font-mono text-mint">{r.points}</td>
                      <td className="text-right font-mono">{r.played ? `${pct(r.omw)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="ev-panel" aria-labelledby="ctl-give">
          <ToolHead id="ctl-give" n="03" k={L.control.kickers.giveaway}>
            {L.control.giveaway.title}
          </ToolHead>
          <p className={`ev-ctl-clock is-${clock.status}`}>
            {clock.status === "running" || clock.status === "paused" ? (
              <>
                <span className="ev-ctl-clock-ch">{channelsOf(clock.group)}</span>
                {clock.status === "paused" ? <span className="ev-ctl-clock-note">{L.control.giveaway.pause}</span> : null}
                <span className="ev-ctl-clock-time">{formatRemaining(clock.remainingMs)}</span>
              </>
            ) : (
              <span className="ev-ctl-clock-ch">{clock.status === "done" ? L.overlay.done : clock.next ? `${L.overlay.next}: ${channelsOf(clock.next.group)}` : "—"}</span>
            )}
          </p>
          <div className="ev-cta">
            <button type="button" className="btn btn-primary text-xs" disabled={busy || !config.slots.length || clock.status === "running" || clock.status === "paused"} onClick={() => act({ type: "giveaway", op: "start", index: clock.next?.index ?? 0 })}>
              {L.control.giveaway.start}
            </button>
            <button type="button" className="btn btn-ink text-xs" disabled={busy || clock.status !== "running"} onClick={() => act({ type: "giveaway", op: "skip" })}>
              {L.control.giveaway.skip}
            </button>
            <button type="button" className="btn btn-ink text-xs" disabled={busy || clock.status !== "running"} onClick={() => act({ type: "giveaway", op: "pause" })}>
              {L.control.giveaway.pause}
            </button>
            <button type="button" className="btn btn-ink text-xs" disabled={busy || clock.status !== "paused"} onClick={() => act({ type: "giveaway", op: "resume" })}>
              {L.control.giveaway.resume}
            </button>
            <button
              type="button"
              className="btn btn-danger text-xs"
              disabled={busy || clock.status === "idle"}
              onClick={() => {
                if (window.confirm(L.control.giveaway.stopConfirm)) void act({ type: "giveaway", op: "stop" });
              }}
            >
              {L.control.giveaway.stop}
            </button>
          </div>
          <ol className="ev-ctl-slots">
            {config.slots.map((s, i) => {
              const sc = slotCodes.get(i);
              const current = clock.group.includes(i);
              return (
                <li key={i} className={`ev-ctl-slot${current ? " is-current" : ""}`}>
                  <span className="ev-ctl-slot-n">{fillEvent(L.control.giveaway.slot, { n: i + 1 })}</span>
                  <span className="ev-ctl-slot-ch">{s.channel}</span>
                  <span className="ev-ctl-slot-info">
                    {s.packs} · {s.together ? fillEvent(L.control.giveaway.with, { n: leaderOf(config.slots, i) + 1 }) : formatSlotMinutes(s.minutes)} · {fillEvent(L.control.giveaway.codes, { assigned: sc?.assigned ?? 0, packs: s.packs, redeemed: sc?.redeemed ?? 0 })}
                  </span>
                  {s.together ? null : (
                    <button type="button" className="btn btn-ghost text-[11px]" disabled={busy} onClick={() => act({ type: "giveaway", op: "start", index: i })}>
                      {L.control.giveaway.startFrom}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="ev-backstage">
          <p className="ev-backstage-title">{L.control.kickers.backstage}</p>

          <section className="ev-panel" aria-labelledby="ctl-codes">
            <ToolHead id="ctl-codes" k={L.control.kickers.backstage}>
              {L.control.codes.title}
            </ToolHead>
            <p className="ev-tool-text">{fillEvent(L.control.codes.stats, event.codes)}</p>
            {packs ? <p className="ev-note">{fillEvent(L.control.codes.packsHint, { packs })}</p> : null}
            <div className="ev-tool-row">
              <label className="ev-tool-label">
                {L.control.codes.howMany}
                <input type="number" min={1} max={500} value={codeCount} onChange={(e) => setCodeCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="ev-tool-input ev-tool-input--num" />
              </label>
              <button
                type="button"
                className="btn btn-primary text-xs"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const r = await addCodes(slug, token, codeCount);
                  setBusy(false);
                  setMsg(r.ok ? `${L.control.saved}: ${r.total}` : errText(r.error));
                  await load(token);
                }}
              >
                {L.control.codes.add}
              </button>
            </div>
          </section>

          {/* codici consegnati a mano (14/11/2026): al posto dei link dei mod, i codici di ogni streamer, solo per lo staff */}
          {config.manualCodes ? (
            event.controlToken ? <StreamerCodesPanel slug={slug} config={config} /> : null
          ) : (
          <section className="ev-panel" aria-labelledby="ctl-mods">
            <ToolHead id="ctl-mods" k={L.control.kickers.backstage}>
              {L.control.mods.title}
            </ToolHead>
            <p className="ev-tool-text">{L.control.mods.intro}</p>
            <div className="ev-cta">
              <button
                type="button"
                className="btn btn-ink text-xs"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const r = await syncMods(slug, token);
                  setBusy(false);
                  setMsg(r.ok ? L.control.saved : errText(r.error));
                  await load(token);
                }}
              >
                {L.control.mods.sync}
              </button>
            </div>
            {event.mods.length ? (
              <ul className="ev-list">
                {event.mods.map((m) => (
                  <li key={m.channel}>
                    <span className="ev-list-name">{m.channel}</span>
                    <CopyLink text={`${origin}${eventPath(slug, "/mod")}#k=${m.token}`} label={L.control.mods.copy} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ev-note">{L.control.mods.none}</p>
            )}
          </section>
          )}

          <section className="ev-panel is-wide" aria-labelledby="ctl-redeem">
            <ToolHead id="ctl-redeem" k={L.control.kickers.backstage}>
              {L.control.redeemers.title}
            </ToolHead>
            <p className="ev-tool-text">{fillEvent(L.control.redeemers.intro, { fresh: event.redeemers.filter((r) => r.isNew).length, total: event.redeemers.length })}</p>
            {event.redeemers.length ? (
              <ul className="ev-list ev-list--two">
                {event.redeemers.map((r, i) => (
                  <li key={`${r.username}-${i}`}>
                    <span className="ev-list-name">{r.display ?? r.username ?? "?"}</span>
                    {r.username ? <span className="ev-list-sub">@{r.username}</span> : null}
                    <span className="ev-list-sub">{r.at ? fmtTime.format(Date.parse(r.at)) : ""}</span>
                    {r.isNew ? <span className="ev-code-tag">{L.control.redeemers.fresh}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ev-note">{L.control.redeemers.none}</p>
            )}
          </section>

          <section className="ev-panel is-wide" aria-labelledby="ctl-config">
            <ToolHead id="ctl-config" k={L.control.kickers.backstage}>
              {L.control.config.title}
            </ToolHead>
            <p className="ev-tool-text">{L.control.config.intro}</p>
            <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} rows={22} className="ev-tool-input ev-tool-input--code" aria-label={L.control.config.title} />
            <div className="ev-cta">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => {
                  let parsed: unknown;
                  try {
                    parsed = JSON.parse(json);
                  } catch {
                    setMsg(L.control.config.json);
                    return;
                  }
                  void act({ type: "config", config: parsed });
                }}
              >
                {L.control.config.save}
              </button>
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setJson(JSON.stringify(config, null, 2))}>
                ↺
              </button>
            </div>
          </section>

          {controlLink || newLink ? (
            <section className="ev-panel is-wide" aria-labelledby="ctl-link">
              <ToolHead id="ctl-link" k={L.control.kickers.backstage}>
                {L.control.controlLink}
              </ToolHead>
              <p className="ev-tool-text">{L.control.controlLinkNote}</p>
              <div className="ev-cta">
                <CopyLink text={newLink ?? controlLink ?? ""} label={L.control.mods.copy} />
                <button
                  type="button"
                  className="btn btn-danger text-xs"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const r = await rotateControl(slug);
                    setBusy(false);
                    if (r.ok) setNewLink(`${origin}${eventPath(slug, "/regia")}#k=${r.token}`);
                    else setMsg(errText(r.error));
                  }}
                >
                  {L.control.rotate}
                </button>
              </div>
              <p className="ev-tool-text">{L.control.forgetNote}</p>
              <div className="ev-cta">
                <button
                  type="button"
                  className="btn btn-danger text-xs"
                  disabled={busy}
                  onClick={async () => {
                    if (!window.confirm(L.control.forgetConfirm)) return;
                    setBusy(true);
                    const r = await forgetWinners(slug);
                    setBusy(false);
                    setMsg(r.ok ? fillEvent(L.control.forgetDone, { n: r.cleared }) : errText(r.error));
                    await load(token ?? null);
                  }}
                >
                  {L.control.forget}
                </button>
              </div>
            </section>
          ) : null}

          {event.controlToken ? (
            <section className="ev-panel is-wide" aria-labelledby="ctl-reset">
              <ToolHead id="ctl-reset" k={L.control.kickers.backstage}>
                {L.control.reset.title}
              </ToolHead>
              <p className="ev-tool-text">{L.control.reset.note}</p>
              <div className="ev-cta">
                <button
                  type="button"
                  className="btn btn-danger text-xs"
                  disabled={busy || state.giveaway.anchor !== null}
                  onClick={() => {
                    if (window.confirm(L.control.reset.confirm)) void act({ type: "reset" });
                  }}
                >
                  {L.control.reset.button}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
