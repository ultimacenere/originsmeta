"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { GameCardFace } from "@/components/GameCard";
import type { GameCardInput } from "@/game-card/model";
import type { CardWith, Num, ProtoLegendary, ProtoMatchup } from "@/lib/proto/analyticsProto";
import "./tavolo.css";

/*
  Prototipo A, «Il tavolo» (26/11/2026). Tu in basso, l'avversario in alto, come nel gioco: le due Leggendarie si
  guardano attraverso la barra dello scontro e ognuna ha in mano le carte che porta più spesso nelle liste registrate.
  Si cambia Leggendaria toccandola, si apre una carta toccandola. Stato nell'indirizzo (?tu=&contro=&patch=).
*/

const L = {
  you: "Tu",
  them: "Contro",
  change: "Cambia",
  swap: "Scambia i lati",
  pick: "Scegli la Leggendaria",
  close: "Chiudi",
  games: (n: number) => `${n.toLocaleString("it-IT")} ${n === 1 ? "partita" : "partite"}`,
  patch: "Patch",
  overall: (r: string, share: string) => `${r} di vittorie · in campo nel ${share} delle partite`,
  hand: "Le carte che porta più spesso",
  handNone: "Nessuna lista esatta registrata in questa patch.",
  verdict: {
    mirror: "Lo specchio",
    none: "Mai incontrate in questa patch",
    up: "Favorevole",
    down: "Sfavorevole",
    thin: "Pochi dati, per ora",
    even: "Alla pari",
  },
  mirrorText: "Una vittoria e una sconfitta per partita: lo specchio non ha win rate.",
  noneText: "Nessuna partita registrata fra queste due Leggendarie in questa patch.",
  range: (lo: string, hi: string) => `fra ${lo} e ${hi} con il 95% di sicurezza`,
  ladder: (name: string) => `Tutti gli scontri di ${name}`,
  ladderNote: "Contati da tutti e due i lati. Le righe più chiare hanno meno di 20 partite.",
  soon: "Torri, mana e luoghi round per round",
  soonText: "Arrivano con il Tracker V2 e la 0.9: qui ci sarà la partita tipo fra queste due.",
  inGames: (share: string, games: string) => `C'è nel ${share} delle sue partite (${games})`,
  withWithout: (w: string, wo: string) => `${w} di vittorie con, ${wo} senza`,
  withOnly: (w: string) => `${w} di vittorie con la carta`,
  turn: (t: string) => `In tutte le partite si gioca in media al round ${t}`,
  cardNote: "Dalle liste esatte registrate, dal lato di chi gioca la Leggendaria.",
};

export type TavoloCard = { slug: string; name: string; input: GameCardInput; art: string | null };
export type HandCard = CardWith & { turn: number | null };
export type TavoloPatch = {
  patch: string;
  label: string;
  games: number;
  matchedGames: number;
  legendaries: ProtoLegendary[];
  matchups: ProtoMatchup[];
  hands: Record<string, { games: number; cards: HandCard[] }>;
};

const pct = (r: number, digits = 0) => `${(r * 100).toLocaleString("it-IT", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
const THIN = 20;

type Verdict = keyof typeof L.verdict;
function verdictOf(m: Num | null, mirror: boolean): Verdict {
  if (mirror) return "mirror";
  if (!m || m.games === 0) return "none";
  if (m.lo > 0.5) return "up";
  if (m.hi < 0.5) return "down";
  return m.games < THIN ? "thin" : "even";
}

export function Tavolo({ data, cards }: { data: TavoloPatch[]; cards: Record<string, TavoloCard> }) {
  const [pi, setPi] = useState(0);
  const P = data[pi] ?? data[0];
  const legs = P.legendaries;
  const mx = useMemo(() => new Map(P.matchups.map((m) => [`${m.a}|${m.b}`, m])), [P]);
  const opponentsOf = (slug: string) =>
    P.matchups.filter((m) => m.a === slug && m.b !== slug).sort((x, y) => y.games - x.games);

  const [you, setYou] = useState(legs[0]?.slug ?? "");
  const [vs, setVs] = useState(() => opponentsOf(legs[0]?.slug ?? "")[0]?.b ?? legs[1]?.slug ?? "");
  const [picking, setPicking] = useState<"you" | "vs" | null>(null);
  const [open, setOpen] = useState<{ card: HandCard; owner: string } | null>(null);
  const [ready, setReady] = useState(false);
  const board = useRef<HTMLDivElement>(null);

  // stato dall'indirizzo, una volta sola
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = data.findIndex((d) => d.patch === q.get("patch"));
    const has = (s: string | null) => !!s && data.some((d) => d.legendaries.some((l) => l.slug === s));
    /* eslint-disable react-hooks/set-state-in-effect -- lo stato iniziale arriva dall'indirizzo solo nel browser */
    if (p >= 0) setPi(p);
    if (has(q.get("tu"))) setYou(q.get("tu")!);
    if (has(q.get("contro"))) setVs(q.get("contro")!);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [data]);
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams({ tu: you, contro: vs, patch: P.patch });
    window.history.replaceState(null, "", `?${q}`);
  }, [ready, you, vs, P.patch]);

  const youLeg = legs.find((l) => l.slug === you) ?? null;
  const vsLeg = legs.find((l) => l.slug === vs) ?? null;
  const mirror = you === vs;
  const m = mirror ? null : (mx.get(`${you}|${vs}`) ?? null);
  const verdict = verdictOf(m, mirror);
  const ladder = opponentsOf(you).sort((x, y) => y.r - x.r);

  const choose = (slug: string) => {
    if (picking === "you") setYou(slug);
    if (picking === "vs") setVs(slug);
    setPicking(null);
  };

  return (
    <div className="tv">
      <div className="tv-top">
        <h1 className="t-page text-sky">Il tavolo</h1>
        <div className="tv-patches" role="group" aria-label={L.patch}>
          {data.map((d, i) => (
            <button key={d.patch} type="button" className={`tv-patch${i === pi ? " is-on" : ""}`} aria-pressed={i === pi} onClick={() => setPi(i)}>
              <b>{d.label}</b>
              <span>{L.games(d.games)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tv-board" ref={board}>
        <Side side="vs" leg={vsLeg} card={cards[vs]} hand={P.hands[vs]} cards={cards} onPick={() => setPicking("vs")} onCard={(c) => setOpen({ card: c, owner: vs })} />

        <div className="tv-mid">
          <Bar m={m} verdict={verdict} you={cards[you]?.name ?? ""} vs={cards[vs]?.name ?? ""} />
          <button type="button" className="tv-swap" onClick={() => { setYou(vs); setVs(you); }}>
            {L.swap}
          </button>
          <div className="tv-soon" aria-label={L.soon}>
            <span className="tv-lanes" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <b>{L.soon}</b> {L.soonText}
            </span>
          </div>
        </div>

        <Side side="you" leg={youLeg} card={cards[you]} hand={P.hands[you]} cards={cards} onPick={() => setPicking("you")} onCard={(c) => setOpen({ card: c, owner: you })} />
      </div>

      <section className="tv-ladder" aria-labelledby="tv-ladder-h">
        <h2 id="tv-ladder-h" className="t-section text-sky">{L.ladder(cards[you]?.name ?? "")}</h2>
        <ul>
          {ladder.map((r) => (
            <li key={r.b}>
              <button
                type="button"
                className={`tv-row${r.b === vs ? " is-on" : ""}${r.games < THIN ? " is-thin" : ""}`}
                onClick={() => {
                  setVs(r.b);
                  board.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Portrait card={cards[r.b]} size="sm" />
                <span className="tv-row-name">{cards[r.b]?.name}</span>
                <Diverge m={r} />
                <span className="tv-row-num">
                  <b>{pct(r.r)}</b>
                  <span>{L.games(r.games)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="tv-note">{L.ladderNote}</p>
      </section>

      {picking ? (
        <Sheet title={L.pick} onClose={() => setPicking(null)}>
          <div className="tv-picker">
            {legs.map((l) => (
              <button key={l.slug} type="button" className={`tv-pick${(picking === "you" ? you : vs) === l.slug ? " is-on" : ""}`} onClick={() => choose(l.slug)}>
                <Portrait card={cards[l.slug]} size="md" />
                <span>{cards[l.slug]?.name}</span>
                <small>{pct(l.r)}</small>
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}

      {open ? (
        <Sheet title={cards[open.card.slug]?.name ?? ""} onClose={() => setOpen(null)}>
          <div className="tv-detail">
            <div className="tv-detail-card">{cards[open.card.slug] ? <GameCardFace input={cards[open.card.slug].input} lang="it" /> : null}</div>
            <div className="tv-detail-text">
              <p className="tv-detail-big">{L.inGames(pct(open.card.share), L.games(open.card.with.games))}</p>
              <p>{open.card.without ? L.withWithout(pct(open.card.with.r), pct(open.card.without.r)) : L.withOnly(pct(open.card.with.r))}</p>
              {open.card.turn ? <p>{L.turn(open.card.turn.toLocaleString("it-IT", { maximumFractionDigits: 1 }))}</p> : null}
              <p className="tv-note">{L.cardNote}</p>
            </div>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}

function Side({
  side,
  leg,
  card,
  hand,
  cards,
  onPick,
  onCard,
}: {
  side: "you" | "vs";
  leg: ProtoLegendary | null;
  card: TavoloCard | undefined;
  hand: { games: number; cards: HandCard[] } | undefined;
  cards: Record<string, TavoloCard>;
  onPick: () => void;
  onCard: (c: HandCard) => void;
}) {
  return (
    <div className={`tv-side is-${side}`}>
      <div className="tv-hero">
        <button type="button" className="tv-leg" onClick={onPick} aria-label={`${L.change}: ${card?.name ?? ""}`}>
          {card ? <GameCardFace input={card.input} lang="it" /> : null}
          <span className="tv-change">{L.change}</span>
        </button>
        <div className="tv-hero-text">
          <span className="tv-who">{side === "you" ? L.you : L.them}</span>
          <span className="tv-name">{card?.name}</span>
          {leg ? <span className="tv-overall">{L.overall(pct(leg.r), pct(leg.share))}</span> : null}
        </div>
      </div>
      <div className="tv-hand">
        <span className="tv-hand-title">{L.hand}</span>
        {hand && hand.cards.length ? (
          <ul>
            {hand.cards.map((c) => (
              <li key={c.slug}>
                <button type="button" className="tv-card" onClick={() => onCard(c)} aria-label={cards[c.slug]?.name}>
                  {cards[c.slug] ? <GameCardFace input={cards[c.slug].input} lang="it" /> : null}
                  <span className="tv-share">{pct(c.share)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tv-note">{L.handNone}</p>
        )}
      </div>
    </div>
  );
}

function Bar({ m, verdict, you, vs }: { m: Num | null; verdict: Verdict; you: string; vs: string }) {
  if (!m) {
    return (
      <div className="tv-bar is-empty">
        <p className={`tv-verdict is-${verdict}`}>{L.verdict[verdict]}</p>
        <p className="tv-note">{verdict === "mirror" ? L.mirrorText : L.noneText}</p>
      </div>
    );
  }
  const style = { "--r": m.r, "--lo": m.lo, "--hi": m.hi } as CSSProperties;
  return (
    <div className={`tv-bar${m.games < THIN ? " is-thin" : ""}`} style={style}>
      <div className="tv-score">
        <span className="tv-score-you">
          <b>{pct(m.r)}</b>
          <span>{you}</span>
        </span>
        <span className={`tv-verdict is-${verdict}`}>{L.verdict[verdict]}</span>
        <span className="tv-score-vs">
          <b>{pct(1 - m.r)}</b>
          <span>{vs}</span>
        </span>
      </div>
      <div className="tv-rope" aria-hidden="true">
        <span className="tv-rope-you" />
        <span className="tv-rope-range" />
        <span className="tv-rope-mid" />
      </div>
      <p className="tv-note">
        {L.games(m.games)} · {L.range(pct(m.lo), pct(m.hi))}
      </p>
    </div>
  );
}

function Diverge({ m }: { m: Num }) {
  const d = Math.max(-0.25, Math.min(0.25, m.r - 0.5));
  const style = { "--d": d / 0.25 } as CSSProperties;
  return (
    <span className={`tv-div${d >= 0 ? " is-up" : " is-down"}`} style={style} aria-hidden="true">
      <span />
    </span>
  );
}

function Portrait({ card, size }: { card: TavoloCard | undefined; size: "sm" | "md" }) {
  return (
    <span className={`tv-portrait is-${size}`} aria-hidden="true">
      {card?.art ? (
        // eslint-disable-next-line @next/next/no-img-element -- ritaglio tondo dell'arte, già in WebP piccolo
        <img src={card.art} alt="" loading="lazy" decoding="async" />
      ) : null}
    </span>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="tv-sheet"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="tv-sheet-in">
        <div className="tv-sheet-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} className="tv-close">
            {L.close}
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
