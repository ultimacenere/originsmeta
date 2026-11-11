"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addCodes, controlAction, createEvent, forgetWinners, loadControl, rotateControl, syncMods, type ControlOp } from "@/lib/event/actions";
import { deckByPlayer, lastRound, roundComplete, spinsLeft } from "@/lib/event/engine";
import { formatRemaining, giveawayClock } from "@/lib/event/clock";
import { emptyConfig, totalPacks } from "@/lib/event/config";
import { pct, standings } from "@/lib/event/swiss";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { eventPath, overlayPath } from "@/lib/event/links";
import type { Assignment, ControlEvent } from "@/lib/event/types";
import { EventWheel } from "./EventWheel";

/**
 * Regia di un evento (10/11/2026): la pagina "visibile solo ai caster" delle note del 10/11. Si entra con il link
 * della regia (#k=<token> nell'indirizzo: il frammento non arriva mai al server né ai log) o da staff con l'accesso
 * fatto (senza link). Ruota dei mazzi, turni svizzeri e risultati, orologio del giveaway, codici, link dei mod, chi ha
 * riscattato e la configurazione in JSON. Ogni tasto è una Server Action che il database controlla.
 */

const card = "card-night space-y-3 p-4 sm:p-5";
const h2 = "font-display text-lg font-extrabold text-sky";
const fmtTime = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Rome" });

function tokenFromHash(): string | null {
  const m = /(?:^|[#&])k=([A-Za-z0-9_-]{32,200})/.exec(window.location.hash);
  return m ? m[1] : null;
}

function errText(code: string): string {
  return (L.control.errors as Record<string, string>)[code] ?? fillEvent(L.control.error, { msg: code });
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
        setMsg(L.control.saved);
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
  const usedDecks = useMemo(() => new Set(event?.state.assignments.map((a) => a.deck) ?? []), [event]);
  const name = useCallback((id: string) => event?.config.talent.find((t) => t.id === id)?.name ?? id, [event]);

  if (status === "loading" || token === undefined) return <p className="text-pale">{L.control.loading}</p>;
  if (status === "forbidden") return <p className="card-night p-5 text-gold">{L.control.noAccess}</p>;
  if (status === "unavailable") return <p className="card-night p-5 text-gold">{L.control.errors.unavailable}</p>;
  if (status === "missing") {
    return (
      <div className={card}>
        <p className="text-pale">{L.control.staffCreate}</p>
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
        {msg ? <p className="text-sm text-gold">{msg}</p> : null}
      </div>
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
  const deckName = (id: string | undefined) => config.decks.find((d) => d.id === id)?.name ?? "—";
  const rows = standings(config.talent.filter((t) => t.role === "player").map((t) => t.id), state.matches);
  const slotCodes = new Map(event.slotCodes.map((s) => [s.slot, s]));
  const packs = totalPacks(config.slots);
  const controlLink = event.controlToken ? `${origin}${eventPath(slug, "/regia")}#k=${event.controlToken}` : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="kicker text-mint">{L.control.title}</p>
        <h1 className="t-page text-sky">{config.name}</h1>
        <div className="flex flex-wrap gap-2">
          <a href={eventPath(slug)} target="_blank" rel="noopener noreferrer" className="btn btn-ink text-xs">
            {L.control.publicPage}
          </a>
          <CopyLink text={`${origin}${overlayPath(slug)}`} label={L.control.overlay} />
        </div>
        <p role="status" className="min-h-5 text-sm font-bold text-gold">
          {busy ? "…" : msg}
        </p>
        {errors.length ? (
          <div className="rounded-lg border-2 border-bad bg-night-2 p-3 text-sm text-pale">
            <p className="font-bold text-bad">{fillEvent(L.control.config.invalid, { n: errors.length })}</p>
            <ul className="mt-1 list-disc pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {warnings.length ? (
          <div className="rounded-lg border-2 border-gold bg-night-2 p-3 text-sm text-pale">
            <p className="font-bold text-gold">{L.control.config.warnings}</p>
            <ul className="mt-1 list-disc pl-5">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card} aria-labelledby="ctl-wheel">
          <h2 id="ctl-wheel" className={h2}>
            {L.control.wheel.title}
          </h2>
          {decks.length ? <EventWheel decks={decks} used={usedDecks} target={spin} onDone={() => setRevealSpin(true)} /> : <p className="text-pale">{L.decks.empty}</p>}
          <p className="text-sm text-pale">{left ? fillEvent(L.control.wheel.left, { n: left }) : L.control.wheel.none}</p>
          {lastSpin && revealSpin ? (
            <p className="rounded-lg border-2 border-mint bg-night-2 p-3 font-display font-bold text-mint">
              {fillEvent(L.control.wheel.result, { players: lastSpin.players.map(name).join(" e "), deck: deckName(lastSpin.deck) })}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={busy || !left} onClick={() => act({ type: "spin" })}>
              {busy ? L.control.wheel.spinning : L.control.wheel.spin}
            </button>
            <button type="button" className="btn btn-ghost text-xs" disabled={busy || !state.assignments.length || state.matches.length > 0} onClick={() => act({ type: "undoSpin" })}>
              {L.control.wheel.undo}
            </button>
          </div>
          {state.assignments.length ? (
            <ol className="space-y-1 text-sm text-pale">
              {state.assignments.map((a, i) => (
                <li key={`${a.deck}-${i}`} className="flex items-center gap-2">
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: config.decks.find((d) => d.id === a.deck)?.color }} />
                  <span>
                    {deckName(a.deck)}: {a.players.map(name).join(" e ")}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </section>

        <section className={card} aria-labelledby="ctl-give">
          <h2 id="ctl-give" className={h2}>
            {L.control.giveaway.title}
          </h2>
          <p className="font-mono text-2xl font-bold text-chalk">
            {clock.status === "running" || clock.status === "paused"
              ? `${clock.slot?.channel} · ${formatRemaining(clock.remainingMs)}${clock.status === "paused" ? ` (${L.control.giveaway.pause})` : ""}`
              : clock.status === "done"
                ? L.overlay.done
                : clock.next
                  ? `${L.overlay.next}: ${clock.next.slot.channel}`
                  : "—"}
          </p>
          <div className="flex flex-wrap gap-2">
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
          <ol className="space-y-1 text-sm">
            {config.slots.map((s, i) => {
              const sc = slotCodes.get(i);
              const current = clock.index === i;
              return (
                <li key={i} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border-2 px-3 py-2 ${current ? "border-mint" : "border-night-3"}`}>
                  <span className="font-mono text-pale-muted">{fillEvent(L.control.giveaway.slot, { n: i + 1 })}</span>
                  <span className="font-bold text-sky">{s.channel}</span>
                  <span className="text-pale-muted">
                    {s.packs} · {s.minutes} min · {fillEvent(L.control.giveaway.codes, { assigned: sc?.assigned ?? 0, packs: s.packs, redeemed: sc?.redeemed ?? 0 })}
                  </span>
                  <button type="button" className="btn btn-ghost ml-auto text-[11px]" disabled={busy} onClick={() => act({ type: "giveaway", op: "start", index: i })}>
                    {L.control.giveaway.startFrom}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className={card} aria-labelledby="ctl-rounds">
        <h2 id="ctl-rounds" className={h2}>
          {L.control.rounds.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy || open} onClick={() => act({ type: "nextRound" })}>
            {fillEvent(L.control.rounds.create, { n: last + 1 })}
          </button>
          {last ? (
            <button type="button" className="btn btn-ghost text-xs" disabled={busy} onClick={() => act({ type: "undoRound" })}>
              {fillEvent(L.control.rounds.undo, { n: last })}
            </button>
          ) : null}
        </div>
        {open ? <p className="text-sm text-gold">{fillEvent(L.control.rounds.openFirst, { n: last })}</p> : null}
        {Array.from({ length: last }, (_, k) => last - k).map((round) => (
          <div key={round}>
            <h3 className="mt-2 font-display font-bold text-chalk">{fillEvent(L.pairings.round, { n: round })}</h3>
            <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {state.matches
                .filter((m) => m.round === round)
                .sort((a, b) => a.table - b.table)
                .map((m) => (
                  <li key={m.id} className="rounded-lg border-2 border-night-3 bg-night/60 p-2 text-sm">
                    {m.b ? (
                      <>
                        <p className="text-xs text-pale-muted">{fillEvent(L.pairings.table, { n: m.table })}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {[m.a, m.b].map((p) => (
                            <button
                              key={p}
                              type="button"
                              disabled={busy}
                              onClick={() => act({ type: "winner", match: m.id, winner: m.winner === p ? null : p })}
                              className={`btn text-xs ${m.winner === p ? "btn-mint" : "btn-ink"}`}
                              aria-pressed={m.winner === p}
                            >
                              {fillEvent(L.control.rounds.winsA, { name: name(p) })}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-pale-muted">
                          {deckName(assigned.get(m.a))} · {deckName(assigned.get(m.b))}
                        </p>
                      </>
                    ) : (
                      <p className="text-pale">
                        {name(m.a)}: {L.pairings.bye}
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
        {state.matches.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <thead className="text-xs uppercase text-pale-muted">
                <tr>
                  <th className="py-1 pr-2">#</th>
                  <th className="py-1 pr-2">{L.standings.player}</th>
                  <th className="py-1 pr-2 text-right">{L.standings.wins}</th>
                  <th className="py-1 pr-2 text-right">{L.standings.losses}</th>
                  <th className="py-1 pr-2 text-right">{L.standings.points}</th>
                  <th className="py-1 text-right">{L.standings.omw}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.player} className="border-t border-night-3 text-pale">
                    <td className="py-1 pr-2 font-mono">{r.rank}</td>
                    <td className="py-1 pr-2 font-bold text-sky">{name(r.player)}</td>
                    <td className="py-1 pr-2 text-right font-mono">{r.wins}</td>
                    <td className="py-1 pr-2 text-right font-mono">{r.losses}</td>
                    <td className="py-1 pr-2 text-right font-mono text-mint">{r.points}</td>
                    <td className="py-1 text-right font-mono">{r.played ? `${pct(r.omw)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card} aria-labelledby="ctl-codes">
          <h2 id="ctl-codes" className={h2}>
            {L.control.codes.title}
          </h2>
          <p className="text-pale">{fillEvent(L.control.codes.stats, event.codes)}</p>
          {packs ? <p className="text-sm text-pale-muted">{fillEvent(L.control.codes.packsHint, { packs })}</p> : null}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm text-pale">
              {L.control.codes.howMany}
              <input type="number" min={1} max={500} value={codeCount} onChange={(e) => setCodeCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="mt-1 block w-24 rounded-lg border border-sky bg-night px-3 py-2 text-pale" />
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

        <section className={card} aria-labelledby="ctl-mods">
          <h2 id="ctl-mods" className={h2}>
            {L.control.mods.title}
          </h2>
          <p className="text-sm text-pale">{L.control.mods.intro}</p>
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
          {event.mods.length ? (
            <ul className="space-y-1 text-sm">
              {event.mods.map((m) => (
                <li key={m.channel} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate font-bold text-sky">{m.channel}</span>
                  <CopyLink text={`${origin}${eventPath(slug, "/mod")}#k=${m.token}`} label={L.control.mods.copy} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-pale-muted">{L.control.mods.none}</p>
          )}
        </section>
      </div>

      <section className={card} aria-labelledby="ctl-redeem">
        <h2 id="ctl-redeem" className={h2}>
          {L.control.redeemers.title}
        </h2>
        <p className="text-sm text-pale">{fillEvent(L.control.redeemers.intro, { fresh: event.redeemers.filter((r) => r.isNew).length, total: event.redeemers.length })}</p>
        {event.redeemers.length ? (
          <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {event.redeemers.map((r, i) => (
              <li key={`${r.username}-${i}`} className="text-pale">
                <span className="font-bold text-sky">{r.display ?? r.username ?? "?"}</span> {r.username ? <span className="text-pale-muted">@{r.username}</span> : null}{" "}
                <span className="text-xs text-pale-muted">· {r.at ? fmtTime.format(Date.parse(r.at)) : ""}</span>
                {r.isNew ? <span className="ml-1 rounded bg-mint px-1 text-[10px] font-bold text-ink">{L.control.redeemers.fresh}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-pale-muted">{L.control.redeemers.none}</p>
        )}
      </section>

      <section className={card} aria-labelledby="ctl-config">
        <h2 id="ctl-config" className={h2}>
          {L.control.config.title}
        </h2>
        <p className="text-sm text-pale">{L.control.config.intro}</p>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} rows={22} className="w-full rounded-lg border border-sky bg-night p-3 font-mono text-xs text-pale" aria-label={L.control.config.title} />
        <div className="flex flex-wrap gap-2">
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
        <section className={card} aria-labelledby="ctl-link">
          <h2 id="ctl-link" className={h2}>
            {L.control.controlLink}
          </h2>
          <p className="text-sm text-pale">{L.control.controlLinkNote}</p>
          <div className="flex flex-wrap gap-2">
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
          <p className="pt-2 text-sm text-pale">{L.control.forgetNote}</p>
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
        </section>
      ) : null}
    </div>
  );
}
