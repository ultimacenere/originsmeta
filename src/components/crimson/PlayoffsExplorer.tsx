"use client";

import { useMemo, useState } from "react";
import { timeKey, type Side } from "@/lib/crimsonPlayoffs";
import { fillPo, poRoundLabel, type PlayoffsLabels } from "@/lib/crimsonPlayoffsLabels";
import { OmMark, PlayerName, PlayoffMatchCard, type PoMarkText, type PoNames, type PoOm, type PoTuple } from "./PlayoffMatch";

/*
  "Tutto il tabellone" della pagina dei playoff (25/10/2026): cerca un giocatore e ne mostra il percorso, oppure sfoglia
  un turno alla volta, lato per lato. Dati già nell'HTML (forma compatta, niente id Discord), nessuna richiesta.
*/

const SIDES: Side[] = ["winners", "losers", "grand"];
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");

type Player = { seat: number; name: string; w: number; l: number; alive: boolean };

export function PlayoffsExplorer({
  labels: L,
  players,
  matches,
  om,
  mark,
  wbRounds,
  lbRounds,
  finalists,
  initialSide,
}: {
  labels: PlayoffsLabels;
  players: Player[];
  matches: PoTuple[];
  om: PoOm;
  mark: PoMarkText;
  wbRounds: number;
  lbRounds: number;
  finalists: number[];
  initialSide: 0 | 1;
}) {
  const names: PoNames = useMemo(() => Object.fromEntries(players.map((p) => [p.seat, p.name])), [players]);
  const bySeat = useMemo(() => new Map(players.map((p) => [p.seat, p])), [players]);
  const roundsOf = (side: 0 | 1 | 2) => [...new Set(matches.filter((m) => m[1] === side).map((m) => m[2]))].sort((x, y) => x - y);
  const lastRound = (side: 0 | 1 | 2) => roundsOf(side).at(-1) ?? 1;

  const [side, setSide] = useState<0 | 1 | 2>(initialSide);
  const [round, setRound] = useState<number>(() => lastRound(initialSide));
  const [q, setQ] = useState("");
  const [seat, setSeat] = useState<number | null>(null);

  const label = (m: PoTuple) => poRoundLabel(L, SIDES[m[1]], m[2], wbRounds, lbRounds);
  const sidesPresent = ([0, 1, 2] as const).filter((s) => matches.some((m) => m[1] === s));
  const sideName = (s: 0 | 1 | 2) => (s === 0 ? L.sides.winners : s === 1 ? L.sides.losers : L.sides.grand);

  const suggestions = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return [];
    return players
      .filter((p) => norm(p.name).includes(n))
      .sort((x, y) => Number(!norm(x.name).startsWith(n)) - Number(!norm(y.name).startsWith(n)) || x.name.localeCompare(y.name))
      .slice(0, 8);
  }, [q, players]);

  const shown = matches.filter((m) => m[1] === side && m[2] === round).sort((x, y) => x[0] - y[0]);
  const path = seat
    ? matches
        .filter((m) => m[3] === seat || m[4] === seat)
        .sort((x, y) => timeKey(SIDES[x[1]], x[2]) - timeKey(SIDES[y[1]], y[2]) || x[0] - y[0])
    : [];
  const picked = seat ? bySeat.get(seat) : undefined;
  const lastLoss = picked && !picked.alive ? [...path].reverse().find((m) => m[7] !== 0 && m[7] !== seat) : undefined;

  const pick = (s: number) => {
    setSeat(s);
    setQ("");
  };

  return (
    <div className="po-explorer">
      <div className="po-search">
        <label htmlFor="po-search-input" className="kicker text-mint">
          {L.explorer.search}
        </label>
        <input
          id="po-search-input"
          type="search"
          value={q}
          placeholder={L.explorer.placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions[0]) {
              e.preventDefault();
              pick(suggestions[0].seat);
            }
            if (e.key === "Escape") setQ("");
          }}
          className="po-input"
          aria-describedby="po-search-hint"
        />
        {q.trim() ? (
          suggestions.length ? (
            <ul className="po-suggest" id="po-search-hint">
              {suggestions.map((p) => (
                <li key={p.seat}>
                  <button type="button" onClick={() => pick(p.seat)}>
                    <span>{p.name}</span>
                    <span className="font-mono text-xs an-muted">
                      {p.w}–{p.l}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p id="po-search-hint" className="mt-2 text-sm an-muted">
              {L.explorer.noResults}
            </p>
          )
        ) : null}
      </div>

      {picked ? (
        <section className="po-path an-panel" aria-labelledby="po-path-h">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="po-path-h" className="t-item text-sky">
                {fillPo(L.explorer.path, { name: picked.name })}
              </h3>
              <p className="mt-1 text-sm">
                <span className="font-mono" title={fillPo(L.explorer.record, { w: picked.w, l: picked.l })}>
                  {picked.w}–{picked.l}
                </span>
                <span className="an-muted"> · </span>
                {finalists.includes(picked.seat) ? (
                  <b className="text-gold">{L.explorer.finalist}</b>
                ) : picked.alive ? (
                  <b className="text-good">{L.explorer.alive}</b>
                ) : lastLoss ? (
                  <span className="an-muted">{fillPo(L.explorer.out, { round: label(lastLoss), name: names[lastLoss[7]] ?? "?" })}</span>
                ) : null}
              </p>
              {om[picked.seat] ? (
                <p className="mt-2">
                  <OmMark username={om[picked.seat]} name={picked.name} mark={mark} />
                </p>
              ) : null}
            </div>
            <button type="button" className="btn btn-ghost text-xs" onClick={() => setSeat(null)}>
              {L.explorer.clear}
            </button>
          </div>
          <ol className="po-path-list">
            {path.map((m) => {
              const opp = m[3] === seat ? m[4] : m[3];
              const mine = m[3] === seat ? m[5] : m[6];
              const theirs = m[3] === seat ? m[6] : m[5];
              const state = m[7] === 0 ? "pending" : m[7] === seat ? "won" : "lost";
              return (
                <li key={m[0]} className={`po-path-item is-${state}`}>
                  <span className="po-path-round">{label(m)}</span>
                  <span className="po-path-opp">
                    {opp ? (
                      <>
                        <span className="an-muted">{L.explorer.vs.split("{name}")[0]}</span>
                        <PlayerName seat={opp} names={names} om={om} mark={mark} />
                        <span className="an-muted">{L.explorer.vs.split("{name}")[1] ?? ""}</span>
                      </>
                    ) : (
                      <span className="an-muted">{L.stretch.tbd}</span>
                    )}
                  </span>
                  <span className="po-path-score">{state === "pending" ? "" : `${mine}–${theirs}`}</span>
                  <span className={`po-path-tag is-${state}`}>{state === "won" ? L.explorer.won : state === "lost" ? L.explorer.lost : L.explorer.pending}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <div className="po-browse">
        <div className="po-tabs" role="group" aria-label={L.explorer.sides}>
          {sidesPresent.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              className={side === s ? "is-on" : ""}
              onClick={() => {
                setSide(s);
                setRound(lastRound(s));
              }}
            >
              {sideName(s)}
            </button>
          ))}
        </div>
        {side !== 2 ? (
          <div className="po-chips" role="group" aria-label={L.explorer.rounds}>
            {roundsOf(side).map((r) => (
              <button key={r} type="button" aria-pressed={round === r} className={round === r ? "is-on" : ""} onClick={() => setRound(r)}>
                {r}
              </button>
            ))}
          </div>
        ) : null}
        <p className="po-browse-title">
          {poRoundLabel(L, SIDES[side], side === 2 ? 1 : round, wbRounds, lbRounds)}
          <span className="an-muted"> · {shown.length}</span>
        </p>
        <ul className="po-grid">
          {(side === 2 ? matches.filter((m) => m[1] === 2) : shown).map((m) => (
            <PlayoffMatchCard key={m[0]} m={m} names={names} om={om} mark={mark} highlight={seat} tbd={L.stretch.tbd} />
          ))}
        </ul>
      </div>
    </div>
  );
}
