"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { banDeck } from "@/lib/tournament/actions";
import { fill } from "@/lib/tournament/types";
import { banState, remainingDecks, type MatchBan } from "@/lib/tournament/stages";
import type { StageLabels } from "@/lib/tournament/stageLabels";

/** Un mazzo consegnato, come lo vede chi guarda: indice (da 0), nome della Leggendaria, miniatura. */
export type BanDeck = { idx: number; name: string; thumb: string | null };

type Props = {
  matchId: string;
  /** "a" o "b" per chi gioca, null per lo staff */
  side: "a" | "b" | null;
  playerA: string;
  playerB: string;
  names: { a: string; b: string };
  decksA: BanDeck[];
  decksB: BanDeck[];
  initialBans: MatchBan[];
  /** si banna adesso: torneo in corso, due giocatori, partita da giocare, fase finale non in pausa */
  open: boolean;
  labels: StageLabels;
  /** testi degli errori (dizionario dei tornei più quelli del blocco BRACKET E TOP CUT) */
  errors: Record<string, string>;
};

const POLL_MS = 5000;

/**
 * Ban di un mazzo prima della partita (08/11/2026, blocco BRACKET E TOP CUT): ognuno sceglie un mazzo dell'avversario;
 * il database mostra il ban dell'altro solo quando hanno bannato tutti e due (`match_bans`), e prima dei due ban i
 * giocatori non refertano. Finché manca un ban la scheda rilegge i ban ogni 5 secondi; quando sono completi ricarica la
 * pagina, che sblocca il referto. Lo staff vede tutto e non banna.
 */
export function BanPanel({ matchId, side, playerA, playerB, names, decksA, decksB, initialBans, open, labels: s, errors }: Props) {
  const router = useRouter();
  const [bans, setBans] = useState<MatchBan[]>(initialBans);
  const [pick, setPick] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const me = side === "a" ? playerA : side === "b" ? playerB : playerA;
  const opp = side === "a" ? playerB : side === "b" ? playerA : playerB;
  const st = banState(bans, me, opp);
  const doneRef = useRef(st.done);

  // dopo un ricaricamento valgono i ban appena letti dal server
  const [seen, setSeen] = useState(initialBans);
  if (seen !== initialBans) {
    setSeen(initialBans);
    setBans(initialBans);
  }

  useEffect(() => {
    if (!open || st.done) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    let alive = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      const { data, error: e } = await sb.rpc("match_bans", { mid: matchId });
      if (!alive || e) return;
      const rows = (Array.isArray(data) ? data : []) as MatchBan[];
      setBans(rows);
      const done = banState(rows, me, opp).done;
      if (done && !doneRef.current) {
        doneRef.current = true;
        router.refresh();
      }
    };
    const timer = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [open, st.done, matchId, me, opp, router]);

  const nameOfDeck = (decks: BanDeck[], idx: number | null | undefined) => (idx === null || idx === undefined ? "?" : (decks.find((d) => d.idx === idx)?.name ?? fill(s.deckN, { n: idx + 1 })));
  const myDecks = side === "b" ? decksB : decksA;
  const theirDecks = side === "b" ? decksA : decksB;
  const theirName = side === "b" ? names.a : names.b;

  const submit = () => {
    if (pick === null) return;
    start(async () => {
      setError(null);
      const r = await banDeck(matchId, pick);
      if (r.error) {
        setError(errors[r.error] ?? errors.db ?? r.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  // ---------- staff: i due ban, senza scegliere ----------
  if (side === null) {
    const banOf = (uid: string) => bans.find((b) => b.user_id === uid);
    const line = (uid: string, name: string, targetDecks: BanDeck[]) => {
      const b = banOf(uid);
      return <li className={b ? "text-pale" : "text-gold"}>{b ? fill(s.banStaffDone, { name, deck: nameOfDeck(targetDecks, b.deck) }) : fill(s.banStaffMissing, { name })}</li>;
    };
    return (
      <section className="card-night p-5" aria-label={s.banTitle}>
        <h2 className="t-section">{s.banTitle}</h2>
        <ul className="mt-2 grid gap-1 text-sm">
          {line(playerA, names.a, decksB)}
          {line(playerB, names.b, decksA)}
        </ul>
      </section>
    );
  }

  const showPicker = open && (!st.mine || editing) && !st.done;
  return (
    <section className={`card-night p-5 ${st.done ? "" : "border-gold"}`} aria-label={s.banTitle} aria-live="polite">
      <h2 className="t-section">{s.banTitle}</h2>

      {st.done ? (
        <div className="mt-2 grid gap-1 text-sm">
          <p className="text-pale">{fill(s.banYours, { deck: nameOfDeck(theirDecks, st.mine?.deck) })}</p>
          <p className="text-pale">{fill(s.banTheirs, { name: theirName, deck: nameOfDeck(myDecks, st.theirs?.deck) })}</p>
          <p className="mt-1 font-semibold text-good">
            {fill(s.banPlayWith, {
              decks: remainingDecks(myDecks.length, st.theirs?.deck)
                .map((i) => nameOfDeck(myDecks, i))
                .join(" · "),
            })}
          </p>
          <p className="text-pale-muted">
            {fill(s.banOpponentPlays, {
              name: theirName,
              decks: remainingDecks(theirDecks.length, st.mine?.deck)
                .map((i) => nameOfDeck(theirDecks, i))
                .join(" · "),
            })}
          </p>
        </div>
      ) : (
        <div className="mt-2 grid gap-1 text-sm">
          {st.mine && !editing ? <p className="text-pale">{fill(s.banYours, { deck: nameOfDeck(theirDecks, st.mine.deck) })}</p> : null}
          {st.theirs ? <p className="text-pale">{fill(s.banTheirsHidden, { name: theirName })}</p> : st.mine ? <p className="text-gold">{fill(s.banWaiting, { name: theirName })}</p> : null}
          {st.mine && !editing && open ? (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setPick(st.mine?.deck ?? null);
              }}
              className="btn btn-ink mt-1 w-fit text-xs"
            >
              {s.banChange}
            </button>
          ) : null}
        </div>
      )}

      {showPicker ? (
        <div className="mt-4">
          <p className="kicker text-mint">{fill(s.banPick, { name: theirName })}</p>
          <p className="mt-1 text-xs text-pale-muted">{fill(s.banHint, { name: theirName })}</p>
          <div role="radiogroup" aria-label={fill(s.banPick, { name: theirName })} className="mt-3 flex flex-wrap gap-2">
            {theirDecks.map((d) => {
              const on = pick === d.idx;
              return (
                <button
                  key={d.idx}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPick(d.idx)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition ${on ? "border-crimson bg-crimson/15 text-chalk" : "border-sky text-pale hover:bg-sky/10"}`}
                >
                  {d.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.thumb} alt="" className="h-10 w-7 rounded object-cover" loading="lazy" />
                  ) : null}
                  <span>
                    <span className="block font-mono text-[10px] uppercase text-pale-muted">{fill(s.deckN, { n: d.idx + 1 })}</span>
                    <span className="font-semibold">{d.name}</span>
                  </span>
                  {on ? <span aria-hidden="true" className="ml-1 font-mono text-crimson">✕</span> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" disabled={pending || pick === null} onClick={submit} className="btn btn-primary text-xs">
              {s.banButton}
              {pick !== null ? ` · ${nameOfDeck(theirDecks, pick)}` : ""}
            </button>
            {editing ? (
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost text-xs">
                {s.banCancel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!st.done ? <p className="mt-3 text-xs text-pale-muted">{s.banReportFirst}</p> : null}
      {error ? (
        <p role="alert" className="alert-bad mt-3">
          {error}
        </p>
      ) : null}
    </section>
  );
}
