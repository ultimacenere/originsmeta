"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GameCardFace } from "@/components/GameCard";
import type { Locale } from "@/lib/i18n";
import type { ReplayTierOrNone } from "@/lib/tierReplay/types";
import { fill } from "@/lib/tierReplayLabels";
import {
  LANES,
  changesAt,
  fmtInt,
  fmtPct,
  gamesText,
  isShift,
  kindWord,
  laneCards,
  laneName,
  moveAt,
  movesCount,
  noun,
  tierWord,
  whyAt,
  type Replay,
  type ReplayCard,
} from "./frames";
import "./replay.css";

/**
 * Il replay delle patch della tier list (27/11/2026, scelto da Pierluigi fra i tre prototipi): il palco con le corsie
 * delle fasce, le carte che scivolano da una corsia all'altra (FLIP con la Web Animations API), la barra del tempo e la
 * storia di una carta. Due versioni: le Leggendarie (carte con nome e numeri) e le carte base (kind "card", carte
 * piccole e il filtro dei cambi). Il primo render, anche sul server, è il fotogramma 0. Testi da replay.l.
 */

const STEP_MS = 2600;
const tierClass = (t: ReplayTierOrNone) => `tlr-t-${t === "unranked" ? "n" : t}`;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ReplayStage({ replay }: { replay: Replay }) {
  const { frames, locale } = replay;
  const last = frames.length - 1;
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(replay.headlineSlug);
  const compact = replay.kind === "card";
  const words = noun(replay);
  const l = replay.l;
  const [onlyMoves, setOnlyMoves] = useState(false);
  const tiles = useRef(new Map<string, HTMLElement>());
  const before = useRef<Map<string, DOMRect> | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const go = useCallback(
    (next: number) => {
      const n = Math.max(0, Math.min(last, next));
      if (n === frame) return;
      const rects = new Map<string, DOMRect>();
      tiles.current.forEach((el, slug) => rects.set(slug, el.getBoundingClientRect()));
      before.current = rects;
      setFrame(n);
    },
    [frame, last],
  );

  // FLIP: ogni carta parte da dove era e scivola dove è ora
  useLayoutEffect(() => {
    const prev = before.current;
    before.current = null;
    if (!prev || reducedMotion()) return;
    tiles.current.forEach((el, slug) => {
      const a = prev.get(slug);
      if (!a) return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
        duration: 720,
        easing: "cubic-bezier(.2,.75,.2,1)",
      });
    });
  }, [frame]);

  // il replay: un fotogramma ogni STEP_MS, si ferma all'ultimo
  useEffect(() => {
    if (!playing) return;
    if (frame >= last) {
      const t = window.setTimeout(() => setPlaying(false), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => go(frame + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, frame, last, go]);

  // tastiera: ← e → cambiano fotogramma (fuori dai campi di testo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlaying(false);
        go(frame + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        go(frame - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frame, go]);

  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (frame >= last) go(0);
    setPlaying(true);
  };

  const frameFromX = (clientX: number) => {
    const el = railRef.current;
    if (!el) return frame;
    const box = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
    return Math.round(x * last);
  };
  const onTrackDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPlaying(false);
    go(frameFromX(e.clientX));
  };
  const onTrackMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) go(frameFromX(e.clientX));
  };
  const onTrackUp = () => {
    dragging.current = false;
  };

  const pick = (slug: string) => {
    setSelected(slug);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }));
    }
  };

  const f = frames[frame];
  const moved = movesCount(replay, frame);
  const card = replay.cards.find((c) => c.slug === selected) ?? replay.cards[0];
  const touched = new Set(f.events.filter((e) => (compact ? !e.legendary : e.legendary)).map((e) => e.slug));
  const filtering = compact && onlyMoves && frame > 0;

  return (
    <section className={`tlr-replay${compact ? " is-compact" : ""}`} aria-label={l.stage.aria}>
      <div className="tlr-board">
        <div className="tlr-stage">
          <header className="tlr-score">
            <div className="tlr-score-main">
              <span className={`tlr-status${f.published ? " is-pub" : ""}`}>{f.published ? l.status.published : l.status.applied}</span>
              <h2 className="tlr-score-title font-title">{f.title}</h2>
            </div>
            <dl className="tlr-score-nums">
              <div>
                <dt>{l.stage.games}</dt>
                <dd>{fmtInt(locale, f.games)}</dd>
              </div>
              <div>
                <dt>{l.stage.moves}</dt>
                <dd>{frame === 0 ? "–" : moved}</dd>
              </div>
              {f.baseline !== undefined ? (
                <div>
                  <dt>{l.stage.average}</dt>
                  <dd>{fmtPct(locale, f.baseline)}</dd>
                </div>
              ) : null}
              <div>
                <dt>{compact ? l.stage.patch : l.stage.frame}</dt>
                <dd>
                  {frame + 1}/{frames.length}
                </dd>
              </div>
            </dl>
          </header>

          <div className="tlr-ribbon" aria-live="polite">
            <p className="tlr-ribbon-lead">{f.lead}</p>
            {f.events.length ? (
              <ul className="tlr-ribbon-list">
                {f.events.map((e) => (
                  <li key={e.slug} className={`tlr-ev tlr-ev-${e.kind}${e.legendary ? " is-leg" : ""}`}>
                    <a href={e.href}>
                      {e.legendary ? <span className="tlr-star" aria-label={l.stage.star}>★</span> : null}
                      <strong>{e.name}</strong> {e.note}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {f.news ? (
              <a className="tlr-ribbon-news" href={f.news}>
                {f.published ? l.stage.newsPublished : l.stage.newsPatch}
              </a>
            ) : null}
          </div>

          {compact ? (
            <div className="tlr-filter">
              <label className="tlr-filter-opt">
                <input type="checkbox" checked={onlyMoves} onChange={(e) => setOnlyMoves(e.target.checked)} />
                <span>{l.stage.onlyMoves}</span>
              </label>
            </div>
          ) : null}

          <ol className="tlr-lanes">
            {LANES.map((lane) => {
              const all = laneCards(replay, lane, frame);
              const list = filtering ? all.filter((c) => isShift(replay, c, frame)) : all;
              return (
                <li key={lane} className={`tlr-lane ${tierClass(lane)}`}>
                  <div className="tlr-lane-head">
                    <span className="tlr-lane-letter font-title" aria-hidden={lane === "unranked" ? "true" : undefined}>
                      {lane === "unranked" ? "–" : lane}
                    </span>
                    <span className="tlr-lane-name">
                      {laneName(l, lane)}
                      {compact ? <span className="tlr-lane-count"> · {all.length}</span> : null}
                    </span>
                  </div>
                  {list.length ? (
                    <ul className="tlr-tiles">
                      {list.map((c) => (
                        <Tile
                          key={c.slug}
                          c={c}
                          k={frame}
                          replay={replay}
                          compact={compact}
                          selected={c.slug === card.slug}
                          touched={touched.has(c.slug)}
                          onPick={pick}
                          tileRef={(el) => {
                            tiles.current.set(c.slug, el);
                            return () => {
                              if (tiles.current.get(c.slug) === el) tiles.current.delete(c.slug);
                            };
                          }}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="tlr-lane-empty">{filtering && all.length ? l.stage.noneMoving : words.none}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="tlr-detail" ref={detailRef}>
          <Story replay={replay} card={card} k={frame} />
        </div>
      </div>

      <div className="tlr-timeline">
        <button type="button" className="tlr-play btn-primary" onClick={play} aria-label={playing ? l.stage.pause : l.stage.play}>
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
        </button>
        <div
          className="tlr-track"
          onPointerDown={onTrackDown}
          onPointerMove={onTrackMove}
          onPointerUp={onTrackUp}
          onPointerCancel={onTrackUp}
        >
          <div className="tlr-rail" aria-hidden="true" ref={railRef}>
            <div className="tlr-rail-fill" style={{ width: `${(frame / last) * 100}%` }} />
          </div>
          <ol className="tlr-stops">
            {frames.map((fr, i) => (
              <li key={fr.key} style={{ left: `${(i / last) * 100}%` }}>
                <button
                  type="button"
                  className={`tlr-stop${i === frame ? " is-on" : ""}${i < frame ? " is-past" : ""}${fr.published ? " is-pub" : ""}`}
                  aria-current={i === frame ? "step" : undefined}
                  onClick={() => {
                    setPlaying(false);
                    go(i);
                  }}
                >
                  <span className="tlr-stop-dot" aria-hidden="true" />
                  <span className="tlr-stop-label">{fr.label}</span>
                  <span className="tlr-stop-short" aria-hidden="true">{fr.short}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Tile({
  c,
  k,
  replay,
  compact,
  selected,
  touched,
  onPick,
  tileRef,
}: {
  c: ReplayCard;
  k: number;
  replay: Replay;
  compact: boolean;
  selected: boolean;
  touched: boolean;
  onPick: (slug: string) => void;
  tileRef: (el: HTMLLIElement) => () => void;
}) {
  const cell = c.cells[k];
  const l = replay.l;
  const move = moveAt(replay, c, k);
  const mods = changesAt(c, replay.frames[k]);
  if (compact) {
    const label = [c.name, cell.r === null ? l.stage.notPlayed : fmtPct(replay.locale, cell.r), move?.text, mods.length ? kindWord(l, mods[0].kind) : null]
      .filter(Boolean)
      .join(", ");
    return (
      <li className="tlr-tile is-mini" ref={tileRef}>
        <button
          type="button"
          className={`tlr-tile-btn${selected ? " is-sel" : ""}${touched ? " is-touched" : ""}`}
          aria-pressed={selected}
          aria-label={label}
          title={label}
          onClick={() => onPick(c.slug)}
        >
          <span className="tlr-card" aria-hidden="true">
            <GameCardFace input={c.game} lang={replay.locale as Locale} />
          </span>
          <span className="tlr-mini-foot" aria-hidden="true">
            {move ? (
              <span key={`${k}-m`} className={`tlr-mini-move is-${move.dir}`}>
                {move.dir === "up" || move.dir === "in" ? "▲" : "▼"}
              </span>
            ) : null}
            <span className="tlr-mini-wr">{fmtPct(replay.locale, cell.r)}</span>
            {mods.length ? <span className={`tlr-mini-mod is-${mods[0].kind}`}>●</span> : null}
          </span>
        </button>
      </li>
    );
  }
  return (
    <li className="tlr-tile" ref={tileRef}>
      <button type="button" className={`tlr-tile-btn${selected ? " is-sel" : ""}${touched ? " is-touched" : ""}`} aria-pressed={selected} onClick={() => onPick(c.slug)}>
        <span className="tlr-card" aria-hidden="true">
          <GameCardFace input={c.game} lang={replay.locale as Locale} />
        </span>
        <span className="tlr-tile-text">
          <span className="tlr-name">{c.name}</span>
          <span className="tlr-wr">
            {fmtPct(replay.locale, cell.r)}
            </span>
          {cell.games ? <span className="tlr-games">{gamesText(l, replay.locale, cell.games)}</span> : null}
          {move ? (
            <span key={`${k}-m`} className={`tlr-move is-${move.dir}`}>
              <span aria-hidden="true">{move.dir === "up" || move.dir === "in" ? "▲" : "▼"}</span> {move.text}
            </span>
          ) : null}
          {mods.length ? (
            <span key={`${k}-c`} className={`tlr-mod is-${mods[0].kind}`}>
              {kindWord(l, mods[0].kind)}
              <span className="tlr-mod-note">: {mods.map((m) => m.note).join(" ")}</span>
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function Story({ replay, card, k }: { replay: Replay; card: ReplayCard; k: number }) {
  const { locale, frames } = replay;
  const words = noun(replay);
  const l = replay.l;
  const cell = card.cells[k];
  const bases = frames.map((fr) => fr.baseline ?? null);
  const hasBase = bases.some((b) => b !== null);
  const why = whyAt(replay, card, k);
  // grafico: win rate con l'intervallo in ogni fotogramma
  const W = 300;
  const H = 112;
  const padX = 26;
  const top = 14;
  const bottom = 104;
  const los = card.cells.flatMap((x) => (x.lo === null ? [] : [x.lo]));
  const his = card.cells.flatMap((x) => (x.hi === null ? [] : [x.hi]));
  const baseVals = bases.flatMap((b) => (b === null ? [] : [b]));
  const min = Math.max(0, Math.min(0.42, ...los, ...baseVals) - 0.02);
  const max = Math.min(1, Math.max(0.58, ...his, ...baseVals) + 0.02);
  const y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top);
  const x = (i: number) => padX + (i / (frames.length - 1)) * (W - padX * 2);
  // la linea si interrompe nei fotogrammi in cui la carta non è stata giocata
  let path = "";
  card.cells.forEach((c, i) => {
    if (c.r === null) return;
    const joined = i > 0 && card.cells[i - 1].r !== null && path !== "";
    path += `${joined ? " L" : " M"}${x(i)},${y(c.r)}`;
  });
  path = path.trim();

  return (
    <article className="tlr-story" aria-labelledby="tlr-story-title">
      <div className="tlr-story-head">
        <span className="tlr-story-card" aria-hidden="true">
          <GameCardFace input={card.game} lang={locale as Locale} />
        </span>
        <div className="min-w-0">
          <h3 id="tlr-story-title" className="tlr-story-name font-title">
            {card.name}
          </h3>
          <p className="tlr-story-now">
            <span className={`tlr-chip ${tierClass(cell.tier)}`}>{cell.tier === "unranked" ? "–" : cell.tier}</span>
            <span>
              {cell.r === null ? fill(l.story.nowNotPlayed, { frame: frames[k].label }) : fill(l.story.now, { frame: frames[k].label, p: fmtPct(locale, cell.r) })}
            </span>
          </p>
          <a className="tlr-story-link" href={card.href}>
            {l.story.cardPage}
          </a>
        </div>
      </div>

      <svg className="tlr-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={fill(l.story.sparkAria, { card: card.name })}>
        {hasBase ? (
          <>
            <path
              className="tlr-spark-half"
              d={bases.map((b, i) => (b === null ? "" : `${i === 0 || bases[i - 1] === null ? "M" : "L"}${x(i)},${y(b)}`)).join(" ")}
            />
            <text className="tlr-spark-axis" x={2} y={y(bases[0] ?? 0.5) + 3}>
              {l.story.average}
            </text>
          </>
        ) : (
          <>
            <line className="tlr-spark-half" x1={padX - 8} x2={W - padX + 8} y1={y(0.5)} y2={y(0.5)} />
            <text className="tlr-spark-axis" x={2} y={y(0.5) + 3}>
              50%
            </text>
          </>
        )}
        {card.cells.map((c, i) =>
          c.lo === null || c.hi === null ? null : (
            <rect key={`b${i}`} className={`tlr-spark-band ${tierClass(c.tier)}`} x={x(i) - 7} width={14} y={y(c.hi)} height={Math.max(2, y(c.lo) - y(c.hi))} rx={4} />
          ),
        )}
        {path ? <path className="tlr-spark-line" d={path} /> : null}
        <line className="tlr-spark-now" x1={x(k)} x2={x(k)} y1={top - 8} y2={bottom + 4} />
        {card.cells.map((c, i) =>
          c.r === null ? null : <circle key={`p${i}`} className={`tlr-spark-dot ${tierClass(c.tier)}${i === k ? " is-on" : ""}`} cx={x(i)} cy={y(c.r)} r={i === k ? 5.5 : 4} />,
        )}
      </svg>

      <table className="tlr-story-table">
        <caption className="sr-only">{fill(l.story.tableCaption, { card: card.name })}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">{l.story.frame}</span>
            </th>
            {frames.map((fr, i) => (
              <th key={fr.key} scope="col" className={i === k ? "is-on" : undefined}>
                {fr.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{l.story.tier}</th>
            {card.cells.map((c, i) => (
              <td key={i} className={i === k ? "is-on" : undefined}>
                <span className={`tlr-chip ${tierClass(c.tier)}`}>{c.tier === "unranked" ? "–" : c.tier}</span>
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">{l.story.winrate}</th>
            {card.cells.map((c, i) => (
              <td key={i} className={i === k ? "is-on" : undefined}>
                {fmtPct(locale, c.r)}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">{words.share}</th>
            {card.cells.map((c, i) => (
              <td key={i} className={i === k ? "is-on" : undefined}>
                {fmtPct(locale, c.share)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="tlr-why">
        <p className="tlr-why-title font-display">
          {k === 0
            ? l.story.whyHere
            : moveAt(replay, card, k)
              ? fill(l.story.whyMoved, { a: tierWord(l, card.cells[k - 1].tier), b: tierWord(l, card.cells[k].tier) })
              : l.story.whyStayed}
        </p>
        {why.map((w) => (
          <p key={w}>{w}</p>
        ))}
      </div>

      {card.community || card.votes ? (
        <p className="tlr-story-others">
          {card.community ? (
            <span>
              {l.story.community} <span className={`tlr-chip tlr-t-${card.community.tier}`}>{card.community.tier}</span>
            </span>
          ) : null}
          {card.votes ? (
            <span>
              {fill(l.story.votes, { n: new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(card.votes.avg) })}
              {card.votes.tier ? (
                <>
                  {" "}
                  <span className={`tlr-chip tlr-t-${card.votes.tier}`}>{card.votes.tier}</span>
                </>
              ) : null}
            </span>
          ) : null}
        </p>
      ) : null}

      {card.changes.length ? (
        <div className="tlr-hist">
          <p className="tlr-why-title font-display">{l.story.history}</p>
          <ul>
            {card.changes.map((ch, i) => (
              <li key={i}>
                <span className="tlr-hist-patch">{ch.patchLabel}</span> {ch.note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
