"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { declareSideSwaps } from "@/lib/tournament/actions";
import { fill } from "@/lib/tournament/types";
import type { FormatLabels } from "@/lib/tournament/formatLabels";

export type SidePanelSwap = { user_id: string; game: number; deck: number; swaps: { out: string; in: string }[] };

type Props = {
  matchId: string;
  /** chi guarda gioca la partita (il suo id) oppure è dello staff (null) */
  me: string | null;
  players: { id: string; name: string; side: string[] | null }[];
  /** mazzi di chi guarda: nome e carte base, nell'ordine di consegna */
  myDecks: { name: string; cards: string[] }[];
  /** partite dell'incontro (2 × vittorie che servono − 1) */
  games: number;
  swaps: SidePanelSwap[];
  cardNames: Record<string, string>;
  open: boolean;
  labels: FormatLabels;
  /** nomi dei mazzi di ogni giocatore per indice (Leggendaria o "Mazzo 2"), per gli scambi già dichiarati */
  deckNames: Record<string, string[]>;
  errors: Record<string, string>;
};

/**
 * Sideboard nella stanza partita (09/11/2026): le riserve dei due giocatori (quella dell'avversario solo se le liste
 * si vedono), gli scambi dichiarati partita per partita e, per chi gioca, il modulo per dichiararli prima della partita
 * 2, 3… (`declareSideSwaps`: sempre rispetto al mazzo consegnato, uno per uno).
 */
export function SidePanel({ matchId, me, players, myDecks, games, swaps, cardNames, open, labels, deckNames, errors }: Props) {
  const fl = labels;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const mine = me ? players.find((p) => p.id === me) : undefined;
  const mySide = mine?.side ?? [];
  const [game, setGame] = useState(2);
  const [deck, setDeck] = useState(0);
  const existing = swaps.find((s) => s.user_id === me && s.game === game);
  const [rows, setRows] = useState<{ out: string; in: string }[]>(existing?.swaps ?? []);
  const name = (slug: string) => cardNames[slug] ?? slug;
  const pickGame = (g: number) => {
    setGame(g);
    const ex = swaps.find((s) => s.user_id === me && s.game === g);
    setRows(ex?.swaps ?? []);
    if (ex) setDeck(ex.deck);
    setSaved(false);
  };
  const deckCards = myDecks[deck]?.cards ?? [];
  const selectCls = "rounded border border-sky bg-night px-2 py-1 text-xs text-pale";

  return (
    <section className="card-night p-4 sm:p-5">
      <h2 className="t-section">{fl.sideTitle}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {players.map((p) => (
          <div key={p.id} className="rounded-lg border-2 border-sky bg-night-2/70 p-3">
            <p className="kicker text-mint">{p.id === me ? fl.sideYours : fill(fl.sideTheirs, { name: p.name })}</p>
            {p.side === null ? (
              <p className="mt-1 text-xs text-pale-muted">{fl.sideHidden}</p>
            ) : p.side.length ? (
              <ul className="mt-2 flex flex-wrap gap-1">
                {p.side.map((s) => (
                  <li key={s} className="rounded border border-sky/60 px-2 py-0.5 text-xs text-pale">
                    {name(s)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-pale-muted">{fl.sideEmpty}</p>
            )}
            <ul className="mt-2 grid gap-1">
              {swaps
                .filter((s) => s.user_id === p.id)
                .map((s) => (
                  <li key={s.game} className="text-xs text-pale">
                    {fill(fl.sideDeclared, { game: s.game, swaps: s.swaps.length ? s.swaps.map((x) => `−${name(x.out)} +${name(x.in)}`).join(", ") : fl.sideNone })}
                    {(deckNames[p.id]?.length ?? 0) > 1 ? <span className="text-pale-muted"> · {deckNames[p.id]?.[s.deck] ?? s.deck + 1}</span> : null}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {me && open && mySide.length && games > 1 ? (
        <div className="mt-4 grid gap-3 border-t border-sky/40 pt-3">
          <p className="text-xs text-pale-muted">{fill(fl.sideHint, { n: game })}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-pale-muted">
              <select value={game} onChange={(e) => pickGame(Number(e.target.value))} className={selectCls} aria-label={fl.sideTitle}>
                {Array.from({ length: games - 1 }, (_, i) => i + 2).map((g) => (
                  <option key={g} value={g}>
                    {fill(fl.sideGame, { n: g })}
                  </option>
                ))}
              </select>
            </label>
            {myDecks.length > 1 ? (
              <label className="text-xs text-pale-muted">
                {fl.sideDeck}{" "}
                <select
                  value={deck}
                  onChange={(e) => {
                    setDeck(Number(e.target.value));
                    setRows([]);
                    setSaved(false);
                  }}
                  className={selectCls}
                >
                  {myDecks.map((d, i) => (
                    <option key={i} value={i}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <ul className="grid gap-2">
            {rows.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-xs">
                <label className="text-pale-muted">
                  {fl.sideOut}{" "}
                  <select value={r.out} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, out: e.target.value } : x)))} className={selectCls}>
                    <option value="">—</option>
                    {deckCards.map((c) => (
                      <option key={c} value={c}>
                        {name(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-pale-muted">
                  {fl.sideIn}{" "}
                  <select value={r.in} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, in: e.target.value } : x)))} className={selectCls}>
                    <option value="">—</option>
                    {mySide.map((c) => (
                      <option key={c} value={c}>
                        {name(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== i))} className="btn btn-ghost !px-1.5 !py-0 text-[11px]" aria-label={fl.sideRemove}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {rows.length < mySide.length ? (
              <button type="button" onClick={() => setRows([...rows, { out: "", in: "" }])} className="btn btn-ink text-xs">
                + {fl.sideAdd}
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending || rows.some((r) => !r.out || !r.in)}
              onClick={() =>
                start(async () => {
                  setError(null);
                  setSaved(false);
                  const r = await declareSideSwaps(matchId, game, deck, rows);
                  if (r.error) {
                    setError(errors[r.error] ?? errors.db ?? r.error);
                    return;
                  }
                  setSaved(true);
                  router.refresh();
                })
              }
              className="btn btn-primary text-xs"
            >
              {fill(fl.sideSave, { n: game })}
            </button>
          </div>
          {error ? (
            <p role="alert" className="alert-bad">
              {error}
            </p>
          ) : null}
          {saved && !error ? (
            <p role="status" className="alert-good">
              {fl.sideSaved}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
