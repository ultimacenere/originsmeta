"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fillLabel, type RegiaLabels, type RegiaLang } from "@/lib/broadcast/labels";
import { LIVE_SAVE_EVERY_MS, uploadedImages, withImageRefs } from "@/lib/broadcast/live";
import type { LiveInfoResponse } from "@/lib/broadcast/liveTypes";
import type { BroadcastState } from "@/lib/broadcast/state";

/**
 * Broadcasting OM, "In diretta dal sito" (05/11/2026, docs/broadcasting.md): con l'accesso fatto la regia salva lo
 * stato su originsmeta.com, così l'overlay di OBS (/broadcast/live?id=…) si aggiorna su qualunque PC e l'estensione
 * Twitch lo manda a chi guarda. Un salvataggio al massimo ogni LIVE_SAVE_EVERY_MS (le modifiche fatte nel frattempo
 * partono insieme), le immagini caricate degli sponsor una volta sola (poi nello stato c'è "om:<impronta>").
 * Accesa resta accesa anche dopo un ricaricamento (in questo browser): la regia riprende lo stato salvato sul sito, e
 * se un'altra regia dello stesso account lo cambia lo riprende entro qualche secondo.
 */
const LIVE_KEY = "originsmeta.broadcast.live.v1";
const PULL_MS = 5000;

type Phase = "loading" | "login" | "unavailable" | "ready";
type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: string } | { kind: "retry" } | { kind: "tooMany" } | { kind: "off" };

type SyncEvents = {
  saving: () => void;
  saved: (r: { id: string; version: number; at: string }) => void;
  retry: () => void;
  tooMany: () => void;
  login: () => void;
  unavailable: () => void;
};

/** Il motore dei salvataggi, fuori da React: tiene l'ultimo stato e lo manda al ritmo giusto. */
class LiveSync {
  private latest: BroadcastState | null = null;
  private hashes = new Map<string, string>();
  private lastSent = "";
  private lastAt = 0;
  private timer: number | null = null;
  private busy = false;
  private stopped = false;
  /** ultimo salvataggio riuscito (o stato preso dal sito), per rimettere "salvato" dopo un tentativo superato */
  private lastSaved: { id: string; version: number; at: string } | null = null;
  private showing = false;
  version = 0;

  constructor(private events: SyncEvents) {}

  /** Lo stato preso dal sito (all'avvio o da un'altra regia): non si rimanda indietro. */
  adopt(state: BroadcastState, saved: { id: string; version: number; at: string }) {
    this.lastSent = JSON.stringify(state);
    this.version = saved.version;
    this.lastSaved = saved;
  }

  push(state: BroadcastState) {
    this.latest = state;
    this.schedule(0);
  }

  stop() {
    this.stopped = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(extra: number) {
    if (this.stopped || this.timer !== null) return;
    const wait = Math.max(extra, LIVE_SAVE_EVERY_MS - (Date.now() - this.lastAt));
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, wait);
  }

  private async flush() {
    if (this.stopped || !this.latest) return;
    if (this.busy) return this.schedule(200);
    this.busy = true;
    try {
      const state = this.latest;
      for (const src of uploadedImages(state)) {
        if (this.hashes.has(src)) continue;
        const res = await fetch("/api/broadcast/live/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ data: src }), cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as { hash?: unknown };
          if (typeof body.hash === "string") this.hashes.set(src, body.hash);
        } else if (res.status === 429) this.events.tooMany();
      }
      const payload = withImageRefs(state, this.hashes);
      const json = JSON.stringify(payload);
      if (json === this.lastSent) {
        // niente di nuovo da mandare: se la regia diceva "Salvo…" (tentativo rimandato), torna "salvato"
        if (this.showing && this.lastSaved) this.events.saved(this.lastSaved);
        this.showing = false;
        return;
      }
      this.events.saving();
      this.showing = true;
      const res = await fetch("/api/broadcast/live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ state: payload }), cache: "no-store" });
      this.lastAt = Date.now();
      if (res.ok) {
        const body = (await res.json()) as { id: string; version: number; at: string };
        this.lastSent = json;
        this.version = body.version;
        this.lastSaved = body;
        this.showing = false;
        this.events.saved(body);
      } else if (res.status === 429) {
        this.schedule(700);
      } else if (res.status === 401) {
        this.events.login();
      } else if (res.status === 503) {
        this.events.unavailable();
      } else {
        this.events.retry();
        this.schedule(4000);
      }
    } catch {
      this.events.retry();
      this.schedule(4000);
    } finally {
      this.busy = false;
    }
  }
}

type Props = {
  L: RegiaLabels;
  ui: RegiaLang;
  state: BroadcastState;
  /** lo stato preso dal sito (ripresa dopo un ricaricamento o modifica da un'altra regia) */
  onAdopt: (state: BroadcastState) => void;
  /** l'id della diretta quando è accesa (per l'indirizzo di OBS e l'anteprima delle immagini), null quando è spenta */
  onLiveId: (id: string | null) => void;
  decode: (raw: unknown) => BroadcastState | null;
};

export function BroadcastLiveBox({ L, ui, state, onAdopt, onLiveId, decode }: Props) {
  const T = L.live;
  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<LiveInfoResponse | null>(null);
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [code, setCode] = useState<string | null>(null);
  const sync = useRef<LiveSync | null>(null);
  const stateRef = useRef(state);

  const loadInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/broadcast/live", { cache: "no-store" });
      if (res.status === 401) return setPhase("login");
      if (!res.ok) return setPhase("unavailable");
      setInfo((await res.json()) as LiveInfoResponse);
      setPhase("ready");
    } catch {
      setPhase("unavailable");
    }
  }, []);

  /** lo stato salvato sul sito, per riprenderlo; null se non c'è */
  const fetchServer = useCallback(
    async (id: string): Promise<{ state: BroadcastState | null; version: number; at: string | null } | null> => {
      try {
        const res = await fetch(`/api/broadcast/live/state?id=${id}`, { cache: "no-store" });
        if (!res.ok) return null;
        const body = (await res.json()) as { state: unknown; version: number; at?: string | null };
        return { state: body.state ? decode(body.state) : null, version: typeof body.version === "number" ? body.version : 0, at: typeof body.at === "string" ? body.at : null };
      } catch {
        return null;
      }
    },
    [decode],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- lettura una tantum della sessione e della scelta salvata */
  useEffect(() => {
    void loadInfo();
    try {
      setOn(window.localStorage.getItem(LIVE_KEY) === "1");
    } catch {
      /* niente preferenze: resta spenta */
    }
  }, [loadInfo]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // accesa e pronta: il motore dei salvataggi, la ripresa dello stato del sito e il controllo delle altre regie
  const active = on && phase === "ready";
  useEffect(() => {
    if (!active) {
      onLiveId(null);
      return;
    }
    let alive = true;
    const engine = new LiveSync({
      saving: () => alive && setStatus({ kind: "saving" }),
      saved: (r) => {
        if (!alive) return;
        setStatus({ kind: "saved", at: r.at });
        setInfo((i) => (i ? { ...i, live: { id: r.id, version: r.version, updatedAt: r.at, live: true, channels: i.live?.channels ?? [] } } : i));
        onLiveId(r.id);
      },
      retry: () => alive && setStatus({ kind: "retry" }),
      tooMany: () => alive && setStatus({ kind: "tooMany" }),
      login: () => alive && setPhase("login"),
      unavailable: () => alive && setPhase("unavailable"),
    });
    const start = async () => {
      // la diretta c'è già (ricaricamento, altro PC): si riprende il suo stato invece di sovrascriverlo
      const id = info?.live?.id;
      const server = id && info?.live?.live ? await fetchServer(id) : null;
      if (!alive) return;
      sync.current = engine;
      if (id && server?.state) {
        // la regia prende lo stato del sito: arriva al motore con il suo prossimo render, uguale a quello preso
        const saved = { id, version: server.version, at: server.at ?? info?.live?.updatedAt ?? new Date().toISOString() };
        engine.adopt(server.state, saved);
        onAdopt(server.state);
        onLiveId(id);
        setStatus({ kind: "saved", at: saved.at });
      } else {
        engine.push(stateRef.current);
      }
    };
    void start();
    // un'altra regia dello stesso account ha salvato una versione nuova: la si riprende
    const pull = window.setInterval(async () => {
      const id = info?.live?.id;
      if (!id || document.visibilityState !== "visible") return;
      const server = await fetchServer(id);
      if (alive && server?.state && server.version > engine.version) {
        engine.adopt(server.state, { id, version: server.version, at: server.at ?? new Date().toISOString() });
        onAdopt(server.state);
      }
    }, PULL_MS);
    return () => {
      alive = false;
      window.clearInterval(pull);
      engine.stop();
      sync.current = null;
    };
    // info.live.id basta: canali e ore non riavviano il motore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, info?.live?.id]);

  // ogni modifica della regia va al motore
  useEffect(() => {
    stateRef.current = state;
    sync.current?.push(state);
  }, [state]);

  const turnOn = () => {
    setOn(true);
    try {
      window.localStorage.setItem(LIVE_KEY, "1");
    } catch {
      /* resta per questa visita */
    }
  };
  const turnOff = async () => {
    setOn(false);
    try {
      window.localStorage.removeItem(LIVE_KEY);
    } catch {
      /* niente */
    }
    try {
      await fetch("/api/broadcast/live", { method: "DELETE", cache: "no-store" });
    } catch {
      /* la diretta si spegne da sola dopo 18 ore */
    }
    setStatus({ kind: "off" });
    setInfo((i) => (i?.live ? { ...i, live: { ...i.live, live: false } } : i));
  };

  const createCode = async () => {
    try {
      const res = await fetch("/api/broadcast/live/link", { method: "POST", cache: "no-store" });
      const body = (await res.json()) as { code?: string; error?: string };
      if (body.code) setCode(body.code);
      else if (res.status === 429) setStatus({ kind: "tooMany" });
    } catch {
      setStatus({ kind: "retry" });
    }
  };
  const unlink = async (channel: string) => {
    await fetch(`/api/broadcast/live/link?channel=${channel}`, { method: "DELETE", cache: "no-store" }).catch(() => null);
    await loadInfo();
  };

  // con un codice in vista si ricontrollano i canali (il collegamento avviene su Twitch)
  useEffect(() => {
    if (!code) return;
    const id = window.setInterval(() => void loadInfo(), 10_000);
    const end = window.setTimeout(() => setCode(null), 10 * 60_000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(end);
    };
  }, [code, loadInfo]);

  const time = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(ui === "it" ? "it-IT" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  const statusText =
    status.kind === "saving" ? T.saving : status.kind === "saved" ? fillLabel(T.saved, { time: time(status.at) }) : status.kind === "retry" ? T.retry : status.kind === "tooMany" ? T.tooMany : status.kind === "off" ? T.offStatus : "";
  const channels = info?.live?.channels ?? [];

  return (
    <section className="bcr-box bcr-live" data-on={active ? "" : undefined}>
      <div className="bcr-box-head">
        <h2>
          {active ? <span className="bcr-live-dot" aria-hidden="true" /> : null}
          {T.title}
        </h2>
        {phase === "ready" ? (
          active ? (
            <button type="button" className="bcr-btn bcr-btn-ghost" onClick={turnOff}>
              {T.off}
            </button>
          ) : (
            <button type="button" className="bcr-btn bcr-btn-primary" onClick={turnOn}>
              {T.on}
            </button>
          )
        ) : null}
      </div>
      <p className="bcr-note">{T.text}</p>

      {phase === "login" ? (
        <p className="bcr-note">
          {T.login}{" "}
          <a className="bcr-link" href={`/${ui}/login?next=${encodeURIComponent("/broadcast")}`}>
            {T.loginCta}
          </a>
        </p>
      ) : null}
      {phase === "unavailable" ? <p className="bcr-notice bcr-notice-error">{T.unavailable}</p> : null}

      {phase === "ready" ? (
        <>
          {info?.username ? <p className="bcr-note">{fillLabel(T.as, { user: info.username })}</p> : null}
          {statusText ? (
            <p className={`bcr-notice bcr-notice-${status.kind === "retry" || status.kind === "tooMany" ? "error" : "ok"}`} role="status" aria-live="polite">
              {statusText}
            </p>
          ) : null}
          <div className="bcr-live-twitch">
            <h3>{T.twitch}</h3>
            {info?.twitch ? (
              <>
                <p className="bcr-note">{T.twitchText}</p>
                <div className="bcr-row">
                  <button type="button" className="bcr-btn" onClick={createCode}>
                    {T.linkCreate}
                  </button>
                  <button type="button" className="bcr-btn bcr-btn-ghost" onClick={() => void loadInfo()}>
                    {T.refresh}
                  </button>
                </div>
                {code ? (
                  <div className="bcr-live-code">
                    <strong>{fillLabel(T.linkCode, { code })}</strong>
                    <span className="bcr-note">{T.linkHelp}</span>
                  </div>
                ) : null}
                <p className="bcr-note">
                  <strong>{T.channels}:</strong> {channels.length ? null : T.channelNone}
                </p>
                {channels.length ? (
                  <ul className="bcr-live-channels">
                    {channels.map((c) => (
                      <li key={c.id}>
                        <span>{c.login ? `twitch.tv/${c.login}` : fillLabel(T.channelId, { id: c.id })}</span>
                        <button type="button" className="bcr-link" onClick={() => void unlink(c.id)}>
                          {T.unlink}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="bcr-note">{T.twitchOff}</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
