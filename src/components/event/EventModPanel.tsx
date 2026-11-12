"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assignCodes, loadMod, swapCode } from "@/lib/event/actions";
import { canEnter, drawWinners, isEntry, type ChatMessage } from "@/lib/event/chat";
import { formatRemaining, giveawayClock, slotWindow, slotsOfChannel } from "@/lib/event/clock";
import { cryptoRand } from "@/lib/event/engine";
import { formatCode, twitchLogin } from "@/lib/event/codes";
import { eventLabels as L, fillEvent } from "@/lib/event/labels";
import { eventShortLink } from "@/lib/event/links";
import type { AssignResult, ModEvent } from "@/lib/event/types";
import { useTwitchChat } from "./useTwitchChat";
import { ToolHead, ToolHero, ToolShell } from "./EventTool";

/**
 * Pannello del mod di un canale (10/11/2026). Dalle note: "chat scrive comando (es. !codice) per 6 minuti, vincitori
 * estratti automaticamente", "Vincitori ricevono un codice univoco dal mod del canale". Il mod apre il suo link
 * (#k=<token>), collega la chat del suo canale (sola lettura, dal browser) e durante il suo slot il pannello raccoglie
 * chi scrive il comando; allo scadere estrae i vincitori, chiede i codici al sito (nello stesso passaggio una vincita a
 * persona; in tutto l'evento quante ne dice `maxWinsPerViewer`, 1 se manca: chi è già al tetto viene sostituito) e
 * prepara il messaggio da mandare in privato a ognuno. I nomi
 * della chat restano in questa scheda (sessionStorage); i nomi dei vincitori accanto ai codici restano in questo
 * browser (localStorage), il sito ne salva solo l'impronta.
 * Dall'11/11/2026 ha la grafica della Locandina (EventTool.tsx, event-tools.css).
 */


function tokenFromHash(): string | null {
  const m = /(?:^|[#&])k=([A-Za-z0-9_-]{32,200})/.exec(window.location.hash);
  return m ? m[1] : null;
}

function readJson<T>(store: Storage | null, key: string, fallback: T): T {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(store: Storage | null, key: string, value: unknown) {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage pieno o bloccato */
  }
}

export function EventModPanel({ slug }: { slug: string }) {
  const entrantsKey = `originsmeta.event.${slug}.entrants`;
  // il link del mod è nel frammento dell'indirizzo: letto al primo disegno nel browser (sul server la pagina dice
  // "Carico il pannello…" in tutti e due i casi)
  const [token] = useState<string | null>(() => (typeof window === "undefined" ? null : tokenFromHash()));
  const [ev, setEv] = useState<ModEvent | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "forbidden" | "unavailable">("loading");
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [chatOn, setChatOn] = useState(false);
  const [test, setTest] = useState(false);
  const [entrants, setEntrants] = useState<Record<string, string[]>>(() => readJson(typeof sessionStorage === "undefined" ? null : sessionStorage, entrantsKey, {}));
  const [winners, setWinners] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [testDraw, setTestDraw] = useState<string[] | null>(null);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const drawn = useRef(new Set<number>());
  const prevActive = useRef<number | null>(null);

  const winnersKey = ev ? `originsmeta.event.${slug}.winners.${ev.channel}` : null;
  const winnersRead = useRef(false);

  const load = useCallback(
    async (tok: string | null) => {
      if (!tok) {
        setStatus("forbidden");
        return;
      }
      const r = await loadMod(slug, tok);
      if (r.ok) {
        setEv(r.event);
        const diff = Date.parse(r.event.now) - Date.now();
        setOffset(Math.abs(diff) > 3000 ? diff : 0);
        setStatus("ready");
        // i nomi dei vincitori accanto ai codici restano in questo browser: si rileggono al primo caricamento
        if (!winnersRead.current) {
          winnersRead.current = true;
          setWinners(readJson(typeof localStorage === "undefined" ? null : localStorage, `originsmeta.event.${slug}.winners.${r.event.channel}`, {}));
        }
      } else setStatus(r.error === "forbidden" ? "forbidden" : "unavailable");
    },
    [slug],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- caricamento una tantum all'apertura, con il link letto dall'indirizzo */
  useEffect(() => {
    void load(token);
  }, [load, token]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [offset]);

  useEffect(() => {
    if (status !== "ready" || !token) return;
    const id = setInterval(() => void load(token), 15_000);
    return () => clearInterval(id);
  }, [status, token, load]);

  const clock = ev ? giveawayClock(ev.slots, ev.giveaway, now) : null;
  const mine = useMemo(() => (ev ? slotsOfChannel(ev.slots, ev.channel) : []), [ev]);
  const activeMine = clock && clock.status === "running" && clock.index !== null && ev && ev.slots[clock.index]?.channel === ev.channel ? clock.index : null;
  const collectKey = test ? "test" : activeMine !== null ? String(activeMine) : null;

  const onMessage = useCallback(
    (m: ChatMessage) => {
      if (!ev || !collectKey || !canEnter(m.login, ev.channel) || !isEntry(m.text, ev.keyword)) return;
      setEntrants((cur) => {
        const list = cur[collectKey] ?? [];
        if (list.includes(m.login)) return cur;
        const next = { ...cur, [collectKey]: [...list, m.login] };
        if (collectKey !== "test") writeJson(typeof sessionStorage === "undefined" ? null : sessionStorage, entrantsKey, next);
        return next;
      });
    },
    [ev, collectKey, entrantsKey],
  );

  const chat = useTwitchChat(ev?.channel ?? null, chatOn, onMessage);

  const codesOf = useCallback((slot: number) => (ev ? ev.codes.filter((c) => c.slot === slot) : []), [ev]);

  const saveWinners = useCallback(
    (next: Record<string, string>) => {
      setWinners(next);
      if (winnersKey) writeJson(typeof localStorage === "undefined" ? null : localStorage, winnersKey, next);
    },
    [winnersKey],
  );

  /** Estrae e dà i codici per lo slot `slot`: chi il sito rifiuta perché ha già vinto (dup) viene sostituito, fino a 5 giri. */
  const draw = useCallback(
    async (slot: number, extra: string[] = []) => {
      if (!ev || !token) return;
      const packs = ev.slots[slot]?.packs ?? 0;
      let left = packs - codesOf(slot).length;
      if (left <= 0) return;
      setBusy(true);
      setMsg(null);
      // fuori solo chi ha già un codice di questo slot: se può vincere ancora negli altri lo decide il sito (dup)
      const slotCodes = new Set(codesOf(slot).map((c) => c.code));
      const exclude = new Set<string>(Object.entries(winners).flatMap(([code, login]) => (slotCodes.has(code) ? [login] : [])));
      const pool = [...(entrants[String(slot)] ?? []), ...extra];
      const rand = cryptoRand();
      const got: Record<string, string> = { ...winners };
      const notesNext: Record<string, string> = {};
      try {
        for (let round = 0; round < 5 && left > 0; round++) {
          const pick = drawWinners(pool, left, rand, exclude);
          if (!pick.length) break;
          const r = await assignCodes(slug, token, slot, pick);
          if (!r.ok) {
            setMsg(L.control.errors[r.error as keyof typeof L.control.errors] ?? r.error);
            break;
          }
          let stop = false;
          for (const x of r.results as AssignResult[]) {
            exclude.add(x.login);
            if (x.status === "ok" && x.code) {
              got[x.code] = x.login;
              left -= 1;
            } else {
              notesNext[x.login] = L.mod.status[x.status];
              if (x.status === "full" || x.status === "none") stop = true;
            }
          }
          if (stop) break;
        }
        saveWinners(got);
        setNotes((n) => ({ ...n, ...notesNext }));
      } finally {
        setBusy(false);
        await load(token);
      }
    },
    [ev, token, codesOf, winners, entrants, slug, saveWinners, load],
  );

  // allo scadere dello slot del canale, l'estrazione parte da sola (una volta per slot in questa scheda)
  useEffect(() => {
    const prev = prevActive.current;
    prevActive.current = activeMine;
    if (prev !== null && prev !== activeMine && !drawn.current.has(prev)) {
      drawn.current.add(prev);
      void draw(prev);
    }
  }, [activeMine, draw]);

  if (status === "loading")
    return (
      <ToolShell>
        <p className="ev-empty">{L.mod.loading}</p>
      </ToolShell>
    );
  if (status === "forbidden" || !ev || !token)
    return (
      <ToolShell>
        <p className="ev-tool-alert">{status === "unavailable" ? L.control.errors.unavailable : L.mod.noAccess}</p>
      </ToolShell>
    );

  const lastMine = activeMine ?? [...mine].reverse().find((i) => clock?.status === "done" || (clock?.index ?? -1) > i || (ev.giveaway.anchor !== null && i < ev.giveaway.anchorIndex)) ?? mine[0];
  const slotLabel = (i: number) => {
    if (clock?.index === i && clock.status === "running") return fillEvent(L.mod.slotLive, { left: formatRemaining(clock.remainingMs) });
    if (clock?.index === i && clock.status === "paused") return L.mod.slotPaused;
    if (clock?.status === "done" || (clock?.index !== null && clock?.index !== undefined && i < clock.index) || (ev.giveaway.anchor && i < ev.giveaway.anchorIndex)) return L.mod.slotDone;
    const w = slotWindow(ev.slots, ev.giveaway, i);
    if (w && clock?.status === "running" && w.start > now) return fillEvent(L.mod.slotNext, { left: formatRemaining(w.start - now) });
    return L.mod.slotWait;
  };
  const whisper = (code: string) => fillEvent(L.mod.whisperText, { name: ev.name, code: formatCode(code), url: eventShortLink(slug) });

  return (
    <div className="ev ev--a ev-tool">
      <ToolHero kicker={L.mod.title} aside={`${L.mod.channel} ${ev.channel}`} name={ev.name}>
        <p className="ev-tagline">
          {L.mod.channel}: <b>{ev.channel}</b> · {fillEvent(L.mod.collecting, { keyword: ev.keyword })}
        </p>
        <p role="status" className="ev-tool-status">
          {busy ? "…" : msg}
        </p>
      </ToolHero>

      <div className="ev-wrap ev-main ev-main--narrow">
        <section className="ev-panel" aria-labelledby="mod-slots">
          <ToolHead id="mod-slots" n="01" k={L.mod.kickers.slots}>
            {L.mod.yourSlots}
          </ToolHead>
          <ul className="ev-ctl-slots">
            {mine.map((i) => (
              <li key={i} className={`ev-ctl-slot${activeMine === i ? " is-current" : ""}`}>
                <span className="ev-ctl-slot-n">{fillEvent(L.control.giveaway.slot, { n: i + 1 })}</span>
                <span className="ev-ctl-slot-ch">{ev.slots[i].packs === 1 ? L.clock.packsOne : fillEvent(L.clock.packs, { n: ev.slots[i].packs })}</span>
                <span className="ev-ctl-slot-state">{slotLabel(i)}</span>
                <span className="ev-ctl-slot-info ev-ctl-slot-end">
                  {fillEvent(L.mod.entrants, { n: (entrants[String(i)] ?? []).length })} · {codesOf(i).length}/{ev.slots[i].packs}
                </span>
              </li>
            ))}
          </ul>
          <div className="ev-cta ev-chat">
            <button type="button" className={`btn ${chatOn ? "btn-ghost" : "btn-primary"}`} onClick={() => setChatOn((x) => !x)}>
              {chatOn ? L.mod.disconnect : L.mod.connect}
            </button>
            <span className={`ev-chat-status is-${chat}`}>
              {chat === "on" ? fillEvent(L.mod.connected, { channel: ev.channel }) : chat === "joining" ? fillEvent(L.mod.joining, { channel: ev.channel }) : chat === "connecting" ? L.mod.connecting : chat === "error" ? L.mod.disconnected : ""}
            </span>
          </div>
          <p className="ev-note">{activeMine === null ? L.mod.notCollecting : L.mod.drawAuto}</p>
          {lastMine !== undefined ? (
            <div className="ev-cta">
              <button type="button" className="btn btn-ink text-xs" disabled={busy || ev.slots[lastMine].packs - codesOf(lastMine).length <= 0 || !(entrants[String(lastMine)] ?? []).length} onClick={() => void draw(lastMine)}>
                {fillEvent(L.mod.draw, { n: Math.max(0, ev.slots[lastMine].packs - codesOf(lastMine).length) })}
              </button>
            </div>
          ) : null}
        </section>

        <section className="ev-panel" aria-labelledby="mod-winners">
          <ToolHead id="mod-winners" n="02" k={L.mod.kickers.winners}>
            {L.mod.winners}
          </ToolHead>
          {ev.codes.length ? (
            <ul className="ev-codes">
              {ev.codes.map((c) => {
                const who = winners[c.code];
                const pool = (entrants[String(c.slot)] ?? []).filter((x) => !Object.values(winners).includes(x));
                return (
                  <li key={c.code} className={`ev-code${c.redeemed ? " is-redeemed" : ""}`}>
                    <span className="ev-code-slot">{fillEvent(L.control.giveaway.slot, { n: c.slot + 1 })}</span>
                    <span className="ev-code-who">{who ?? "?"}</span>
                    <span className="ev-code-code">{formatCode(c.code)}</span>
                    {c.redeemed ? <span className="ev-code-tag">{L.mod.redeemed}</span> : null}
                    <span className="ev-code-actions">
                      <button
                        type="button"
                        className="btn btn-primary text-xs"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(whisper(c.code));
                            setMsg(L.control.mods.copied);
                          } catch {
                            window.prompt(L.mod.whisper, whisper(c.code));
                          }
                        }}
                      >
                        {L.mod.whisper}
                      </button>
                      {!c.redeemed && pool.length ? (
                        <button
                          type="button"
                          className="btn btn-ghost text-xs"
                          title={L.mod.replaceNote}
                          disabled={busy}
                          onClick={async () => {
                            const [pick] = drawWinners(pool, 1, cryptoRand());
                            if (!pick) return;
                            setBusy(true);
                            const r = await swapCode(slug, token, c.code, pick);
                            setBusy(false);
                            if (r.ok && r.status === "ok") saveWinners({ ...winners, [c.code]: pick });
                            else setMsg(r.ok ? (L.mod.status[r.status as keyof typeof L.mod.status] ?? r.status) : r.error);
                            await load(token);
                          }}
                        >
                          {L.mod.replace}
                        </button>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ev-empty">{L.mod.noWinners}</p>
          )}
          {Object.keys(notes).length ? (
            <ul className="ev-tool-notes">
              {Object.entries(notes).map(([who, note]) => (
                <li key={who}>
                  {who}: {note}
                </li>
              ))}
            </ul>
          ) : null}
          {lastMine !== undefined ? (
            <form
              className="ev-tool-row"
              onSubmit={async (e) => {
                e.preventDefault();
                const login = twitchLogin(manual);
                if (!login) {
                  setMsg(L.mod.status.invalid);
                  return;
                }
                setBusy(true);
                const r = await assignCodes(slug, token, lastMine, [login]);
                setBusy(false);
                if (r.ok) {
                  const x = r.results[0];
                  if (x?.status === "ok" && x.code) saveWinners({ ...winners, [x.code]: x.login });
                  else if (x) setMsg(`${x.login}: ${L.mod.status[x.status]}`);
                  setManual("");
                } else setMsg(r.error);
                await load(token);
              }}
            >
              <label className="ev-tool-label">
                {L.mod.manual}
                <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder={L.mod.manualPlaceholder} className="ev-tool-input" />
              </label>
              <button type="submit" className="btn btn-ink text-xs" disabled={busy || !manual.trim()}>
                {L.mod.add}
              </button>
            </form>
          ) : null}
        </section>

        <section className="ev-panel" aria-labelledby="mod-test">
          <ToolHead id="mod-test" k={L.mod.kickers.test}>
            {L.mod.test}
          </ToolHead>
          <p className="ev-tool-text">{fillEvent(L.mod.testNote, { keyword: ev.keyword })}</p>
          <div className="ev-cta ev-chat">
            <button
              type="button"
              className="btn btn-ink text-xs"
              onClick={() => {
                setTest((t) => !t);
                setChatOn(true);
                setTestDraw(null);
                setEntrants((cur) => ({ ...cur, test: [] }));
              }}
            >
              {test ? L.mod.testStop : L.mod.test}
            </button>
            {test ? (
              <>
                <span className="ev-chat-status">{fillEvent(L.mod.entrants, { n: (entrants.test ?? []).length })}</span>
                <button type="button" className="btn btn-ghost text-xs" disabled={!(entrants.test ?? []).length} onClick={() => setTestDraw(drawWinners(entrants.test ?? [], 3, cryptoRand()))}>
                  {fillEvent(L.mod.draw, { n: 3 })}
                </button>
              </>
            ) : null}
          </div>
          {testDraw ? <p className="ev-tool-ok">{fillEvent(L.mod.testResult, { names: testDraw.join(", ") || "—" })}</p> : null}
        </section>

        <p className="ev-foot">{L.mod.privacy}</p>
      </div>
    </div>
  );
}
