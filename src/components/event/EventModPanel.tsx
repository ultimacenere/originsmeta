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

/**
 * Pannello del mod di un canale (10/11/2026). Dalle note: "chat scrive comando (es. !codice) per 6 minuti, vincitori
 * estratti automaticamente", "Vincitori ricevono un codice univoco dal mod del canale". Il mod apre il suo link
 * (#k=<token>), collega la chat del suo canale (sola lettura, dal browser) e durante il suo slot il pannello raccoglie
 * chi scrive il comando; allo scadere estrae i vincitori, chiede i codici al sito (una vincita a persona in tutto
 * l'evento: chi ha già vinto altrove viene sostituito) e prepara il messaggio da mandare in privato a ognuno. I nomi
 * della chat restano in questa scheda (sessionStorage); i nomi dei vincitori accanto ai codici restano in questo
 * browser (localStorage), il sito ne salva solo l'impronta.
 */

const card = "card-night space-y-3 p-4 sm:p-5";
const h2 = "font-display text-lg font-extrabold text-sky";

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

  /** Estrae e dà i codici per lo slot `slot`: chi ha già vinto altrove (dup) viene sostituito, fino a 5 giri. */
  const draw = useCallback(
    async (slot: number, extra: string[] = []) => {
      if (!ev || !token) return;
      const packs = ev.slots[slot]?.packs ?? 0;
      let left = packs - codesOf(slot).length;
      if (left <= 0) return;
      setBusy(true);
      setMsg(null);
      const exclude = new Set<string>(Object.values(winners));
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

  if (status === "loading") return <p className="text-pale">{L.mod.loading}</p>;
  if (status === "forbidden" || !ev || !token) return <p className="card-night p-5 text-gold">{status === "unavailable" ? L.control.errors.unavailable : L.mod.noAccess}</p>;

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
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="kicker text-mint">{L.mod.title}</p>
        <h1 className="t-page text-sky">{ev.name}</h1>
        <p className="text-pale">
          {L.mod.channel}: <span className="font-bold text-sky">{ev.channel}</span> · {fillEvent(L.mod.collecting, { keyword: ev.keyword })}
        </p>
        <p role="status" className="min-h-5 text-sm font-bold text-gold">
          {busy ? "…" : msg}
        </p>
      </header>

      <section className={card} aria-labelledby="mod-slots">
        <h2 id="mod-slots" className={h2}>
          {L.mod.yourSlots}
        </h2>
        <ul className="space-y-1">
          {mine.map((i) => (
            <li key={i} className={`flex flex-wrap items-center gap-x-3 rounded-lg border-2 px-3 py-2 text-sm ${activeMine === i ? "border-mint" : "border-night-3"}`}>
              <span className="font-mono text-pale-muted">{fillEvent(L.control.giveaway.slot, { n: i + 1 })}</span>
              <span className="text-pale">{ev.slots[i].packs === 1 ? L.clock.packsOne : fillEvent(L.clock.packs, { n: ev.slots[i].packs })}</span>
              <span className="font-bold text-chalk">{slotLabel(i)}</span>
              <span className="ml-auto text-xs text-pale-muted">
                {fillEvent(L.mod.entrants, { n: (entrants[String(i)] ?? []).length })} · {codesOf(i).length}/{ev.slots[i].packs}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={`btn ${chatOn ? "btn-ghost" : "btn-primary"}`} onClick={() => setChatOn((x) => !x)}>
            {chatOn ? L.mod.disconnect : L.mod.connect}
          </button>
          <span className="text-sm text-pale">
            {chat === "on" ? fillEvent(L.mod.connected, { channel: ev.channel }) : chat === "joining" ? fillEvent(L.mod.joining, { channel: ev.channel }) : chat === "connecting" ? L.mod.connecting : chat === "error" ? L.mod.disconnected : ""}
          </span>
        </div>
        <p className="text-xs text-pale-muted">{activeMine === null ? L.mod.notCollecting : L.mod.drawAuto}</p>
        {lastMine !== undefined ? (
          <button type="button" className="btn btn-ink text-xs" disabled={busy || ev.slots[lastMine].packs - codesOf(lastMine).length <= 0 || !(entrants[String(lastMine)] ?? []).length} onClick={() => void draw(lastMine)}>
            {fillEvent(L.mod.draw, { n: Math.max(0, ev.slots[lastMine].packs - codesOf(lastMine).length) })}
          </button>
        ) : null}
      </section>

      <section className={card} aria-labelledby="mod-winners">
        <h2 id="mod-winners" className={h2}>
          {L.mod.winners}
        </h2>
        {ev.codes.length ? (
          <ul className="space-y-2">
            {ev.codes.map((c) => {
              const who = winners[c.code];
              const pool = (entrants[String(c.slot)] ?? []).filter((x) => !Object.values(winners).includes(x));
              return (
                <li key={c.code} className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-night-3 bg-night/60 p-2 text-sm">
                  <span className="font-mono text-pale-muted">{fillEvent(L.control.giveaway.slot, { n: c.slot + 1 })}</span>
                  <span className="font-bold text-sky">{who ?? "?"}</span>
                  <span className="font-mono text-chalk">{formatCode(c.code)}</span>
                  {c.redeemed ? <span className="rounded bg-mint px-1 text-[10px] font-bold text-ink">{L.mod.redeemed}</span> : null}
                  <span className="ml-auto flex flex-wrap gap-2">
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
          <p className="text-sm text-pale-muted">—</p>
        )}
        {Object.keys(notes).length ? (
          <ul className="text-xs text-pale-muted">
            {Object.entries(notes).map(([who, note]) => (
              <li key={who}>
                {who}: {note}
              </li>
            ))}
          </ul>
        ) : null}
        {lastMine !== undefined ? (
          <form
            className="flex flex-wrap items-end gap-2"
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
            <label className="text-sm text-pale">
              {L.mod.manual}
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder={L.mod.manualPlaceholder} className="mt-1 block w-56 rounded-lg border border-sky bg-night px-3 py-2 text-pale" />
            </label>
            <button type="submit" className="btn btn-ink text-xs" disabled={busy || !manual.trim()}>
              {L.mod.add}
            </button>
          </form>
        ) : null}
      </section>

      <section className={card} aria-labelledby="mod-test">
        <h2 id="mod-test" className={h2}>
          {L.mod.test}
        </h2>
        <p className="text-sm text-pale">{fillEvent(L.mod.testNote, { keyword: ev.keyword })}</p>
        <div className="flex flex-wrap items-center gap-2">
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
              <span className="text-sm text-pale">{fillEvent(L.mod.entrants, { n: (entrants.test ?? []).length })}</span>
              <button type="button" className="btn btn-ghost text-xs" disabled={!(entrants.test ?? []).length} onClick={() => setTestDraw(drawWinners(entrants.test ?? [], 3, cryptoRand()))}>
                {fillEvent(L.mod.draw, { n: 3 })}
              </button>
            </>
          ) : null}
        </div>
        {testDraw ? <p className="text-sm text-mint">{fillEvent(L.mod.testResult, { names: testDraw.join(", ") || "—" })}</p> : null}
      </section>

      <p className="text-xs text-pale-muted">{L.mod.privacy}</p>
    </div>
  );
}
