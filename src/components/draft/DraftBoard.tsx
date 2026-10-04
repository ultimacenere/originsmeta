"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DECK_BASE, HIDDEN, opponentKnowledge, progress, type DraftAction, type DraftState, type Seat } from "@/lib/draft/engine";
import { bestDeck, deckReport, type BotCard, type BotKit, type DeckReport } from "@/lib/draft/bot";
import { encodeGameCode, encodeOmCode } from "@/lib/deckcode";
import { tierTone } from "@/lib/tiercode";
import { trackEvent } from "@/lib/analytics";
import { fill } from "@/lib/tournament/types";
import type { DraftLabels } from "@/lib/draftLabels";
import { CopyButton } from "@/components/CopyButton";

/** La carta come la mostra il tavolo: quello che serve al bot più nome, immagini e testo nella lingua della pagina. */
export type DraftUiCard = BotCard & { name: string; key?: string; image?: string; thumb?: string; ability?: string };

/**
 * Il tavolo del draft (02/10/2026): il giro, la colonna con le carte, la costruzione e il risultato. Lo usano il draft
 * contro il Cervello (DraftTable, stato intero nel browser) e la stanza online (DraftRoom, solo la vista del proprio
 * posto, `viewFor` di engine.ts: le carte nascoste dell'avversario arrivano come `HIDDEN` e qui non si mostrano).
 */
export function DraftBoard({
  L,
  view,
  me,
  oppName,
  oppDeckTitle,
  bySlug,
  kit,
  builderHref,
  onAct,
  resultActions,
}: {
  L: DraftLabels;
  view: DraftState;
  me: Seat;
  oppName: string;
  oppDeckTitle: string;
  bySlug: Map<string, DraftUiCard>;
  kit: BotKit;
  builderHref: string;
  onAct: (a: DraftAction) => void;
  resultActions: ReactNode;
}) {
  if (view.phase === "done") return <Result L={L} draft={view} me={me} oppDeckTitle={oppDeckTitle} kit={kit} bySlug={bySlug} builderHref={builderHref} actions={resultActions} />;
  if (view.phase === "build" && view.seats[me].pending) {
    return <Build L={L} draft={view} seat={me} kit={kit} bySlug={bySlug} onConfirm={(legendary, chosen) => onAct({ seat: me, type: "build", legendary, cards: chosen })} />;
  }
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* la chiave azzera le scelte di Tieni / Regala a ogni decisione nuova */}
      <Turn key={JSON.stringify(view.seats[me].pending)} L={L} draft={view} me={me} oppName={oppName} bySlug={bySlug} onAct={onAct} />
      <Side L={L} draft={view} seat={me} oppName={oppName} bySlug={bySlug} />
    </div>
  );
}

/** Dove siamo del draft, per l'occhiello: Leggendaria, giro o busta, costruzione, fine. */
export function stageLabel(L: DraftLabels, view: DraftState): string {
  const pr = progress(view);
  if (view.phase === "legendary") return L.play.legendaryPhase;
  if (view.phase === "main") return fill(view.format === "packs" ? L.play.pack : L.play.round, { n: pr.round, total: pr.rounds });
  return view.phase === "build" ? L.play.build : L.result.title;
}

/* ------------------------------------------------------------------------------------------------ una carta */

function stats(c: DraftUiCard): string {
  const cost = c.mana !== undefined ? `${c.mana}` : "?";
  return c.spell || c.power === undefined ? `◆ ${cost}` : `◆ ${cost} · ${c.power}/${c.health}`;
}

function CardName({ c, className = "" }: { c: DraftUiCard; className?: string }) {
  return (
    <span className={className}>
      {c.legendary ? (
        <span className="legendary-star" aria-hidden="true">
          ★
        </span>
      ) : null}
      {c.name}
    </span>
  );
}

/** Carta grande: illustrazione ufficiale intera (mai ritagliata, i crediti restano), nome, costo, testo nella lingua. */
function BigCard({ c, al, children, dim = false, mark }: { c: DraftUiCard; al: DraftLabels["alignment"]; children?: React.ReactNode; dim?: boolean; mark?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${dim ? "opacity-45" : ""}`}>
      <div className={`relative overflow-hidden rounded-xl border-[3px] bg-night-2 ${c.legendary ? "border-gold" : "border-sky"}`}>
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt={c.name} loading="lazy" decoding="async" className="block h-auto w-full" />
        ) : (
          <div className="grid aspect-[5/7] place-items-center p-3 text-center font-display text-lg text-sky">{c.name}</div>
        )}
        {mark ? <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-bold text-chalk">{mark}</span> : null}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-sky">
          <CardName c={c} />
        </p>
        {/* allineamento accanto a costo e statistiche (04/10/2026, Pierluigi): la pastiglia dell'anteprima delle carte */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-chalk-muted">
          <span>{stats(c)}</span>
          {c.alignment ? <span className={`deck-peek-align is-${c.alignment} font-sans`}>{al[c.alignment]}</span> : null}
        </p>
        {/* sul telefono la carta è stretta: il testo resta sull'immagine, sotto solo nome e numeri */}
        {c.ability ? (
          <p className="mt-1 hidden sm:block">
            <span className="line-clamp-3 text-xs text-chalk">{c.ability}</span>
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Row({ c, note }: { c: DraftUiCard; note?: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="w-5 shrink-0 text-right font-mono text-xs text-sky">{c.mana ?? "?"}</span>
      <span className={`card-chip-art !h-9 !w-7 shrink-0 text-[9px] ${c.legendary ? "is-legendary" : ""}`}>
        {c.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.thumb} alt="" loading="lazy" decoding="async" />
        ) : (
          c.name.slice(0, 2)
        )}
      </span>
      <CardName c={c} className="min-w-0 flex-1 truncate text-chalk" />
      {note ? <span className="shrink-0 text-[11px] text-mint">{note}</span> : null}
    </li>
  );
}

const byMana = (bySlug: Map<string, DraftUiCard>) => (a: string, b: string) =>
  (bySlug.get(a)?.mana ?? 99) - (bySlug.get(b)?.mana ?? 99) || (bySlug.get(a)?.name ?? a).localeCompare(bySlug.get(b)?.name ?? b);

/** Curva di mana più quanti personaggi e quante magie (04/10/2026, Pierluigi). */
function Curve({ slugs, bySlug, L }: { slugs: string[]; bySlug: Map<string, DraftUiCard>; L: DraftLabels }) {
  const label = L.play.curve;
  const counts = [0, 0, 0, 0, 0, 0];
  for (const s of slugs) counts[Math.max(0, Math.min(5, (bySlug.get(s)?.mana ?? 3) - 1))]++;
  const max = Math.max(1, ...counts);
  const names = ["≤1", "2", "3", "4", "5", "6+"];
  const spells = slugs.filter((s) => bySlug.get(s)?.spell).length;
  return (
    <figure>
      <p className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="deck-peek-stats">
          {L.play.characters} {slugs.length - spells}
        </span>
        <span className="deck-peek-stats">
          {L.play.spells} {spells}
        </span>
      </p>
      <figcaption className="kicker text-chalk-muted">{label}</figcaption>
      <div className="mt-2 flex h-16 items-end gap-1.5" role="img" aria-label={`${label}: ${names.map((n, i) => `${n}: ${counts[i]}`).join(", ")}`}>
        {counts.map((n, i) => (
          <div key={names[i]} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-chalk">{n}</span>
            <span className="w-full rounded-t bg-sky" style={{ height: `${(n / max) * 40}px`, minHeight: n ? 4 : 1, opacity: n ? 1 : 0.25 }} />
            <span className="font-mono text-[10px] text-chalk-muted">{names[i]}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------------------------------------ il giro */

function lastOppNote(L: DraftLabels, draft: DraftState, opp: Seat, oppName: string, bySlug: Map<string, DraftUiCard>): string | null {
  for (let i = draft.log.length - 1; i >= 0; i--) {
    const e = draft.log[i];
    if (!("seat" in e) || e.seat !== opp) continue;
    const name = (s: string) => bySlug.get(s)?.name ?? s;
    if (e.type === "keepGive") {
      // il regalo si scopre a giro chiuso, come arriva nel pool (engine.ts, outbox)
      if (e.phase === draft.phase && e.round === draft.round) continue;
      return fill(L.play.oppGave, { name: oppName, card: name(e.give) });
    }
    if (draft.format === "packs" && e.phase === "main") return fill(L.play.oppPickedHidden, { name: oppName });
    if (draft.format === "exchange") return null;
    if (e.card === HIDDEN) return null;
    return fill(L.play.oppPicked, { name: oppName, card: name(e.card) });
  }
  return null;
}

function Turn({ L, draft, me, oppName, bySlug, onAct }: { L: DraftLabels; draft: DraftState; me: Seat; oppName: string; bySlug: Map<string, DraftUiCard>; onAct: (a: DraftAction) => void }) {
  const pending = draft.seats[me].pending;
  const [keep, setKeep] = useState<string | null>(null);
  const [give, setGive] = useState<string | null>(null);
  const note = lastOppNote(L, draft, me === 0 ? 1 : 0, oppName, bySlug);
  const card = (s: string) => bySlug.get(s);

  let title = fill(L.play.waitingOpp, { name: oppName });
  let body: React.ReactNode = null;
  if (pending?.kind === "pick") {
    title = draft.phase === "legendary" ? L.play.pickLegendary : draft.format === "packs" ? L.play.pickFromPack : L.play.pick;
    body = (
      <ul className="grid max-w-4xl grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-4">
        {pending.options.map((s) => {
          const c = card(s);
          if (!c) return null;
          return (
            <li key={s}>
              <button type="button" className="block w-full text-left transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-mint" onClick={() => onAct({ seat: me, type: "pick", card: s })}>
                <BigCard al={L.alignment} c={c} />
              </button>
            </li>
          );
        })}
      </ul>
    );
  } else if (pending?.kind === "keepGive") {
    title = L.play.keepGive;
    body = (
      <>
        <ul className="grid max-w-3xl grid-cols-3 gap-2 sm:gap-3">
          {pending.options.map((s) => {
            const c = card(s);
            if (!c) return null;
            const isKeep = keep === s;
            const isGive = give === s;
            const burned = keep !== null && give !== null && !isKeep && !isGive;
            return (
              <li key={s}>
                <BigCard al={L.alignment} c={c} dim={burned} mark={isKeep ? L.play.kept : isGive ? L.play.given : burned ? L.play.burned : undefined}>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                    <button type="button" aria-pressed={isKeep} className={`btn flex-1 justify-center px-2 text-xs ${isKeep ? "btn-mint" : "btn-ghost"}`} onClick={() => { setKeep(s); if (give === s) setGive(null); }}>
                      {L.play.keep}
                    </button>
                    <button type="button" aria-pressed={isGive} className={`btn flex-1 justify-center px-2 text-xs ${isGive ? "btn-gold" : "btn-ghost"}`} onClick={() => { setGive(s); if (keep === s) setKeep(null); }}>
                      {L.play.give}
                    </button>
                  </div>
                </BigCard>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-primary mt-4" disabled={!keep || !give} onClick={() => keep && give && onAct({ seat: me, type: "keepGive", keep, give })}>
          {L.play.confirm}
        </button>
      </>
    );
  } else if (draft.table.length) {
    // Tris e Leggendarie a serpentina: tocca all'avversario, le carte restano a vista
    body = (
      <ul className="grid max-w-4xl grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-4" aria-busy="true">
        {draft.table.map((s) => {
          const c = card(s);
          return c ? (
            <li key={s}>
              <BigCard al={L.alignment} c={c} dim />
            </li>
          ) : null;
        })}
      </ul>
    );
  }

  return (
    <section aria-labelledby="draft-turn" className="min-w-0">
      <h2 id="draft-turn" className="t-section" aria-live="polite">
        {title}
      </h2>
      {note ? (
        <p className="mt-1 text-sm text-mint" aria-live="polite">
          <span className="text-chalk-muted">{L.play.lastMove}:</span> {note}
        </p>
      ) : null}
      <div className="mt-4">{body}</div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------ colonna laterale */

function Side({ L, draft, seat, oppName, bySlug }: { L: DraftLabels; draft: DraftState; seat: Seat; oppName: string; bySlug: Map<string, DraftUiCard> }) {
  const me = draft.seats[seat];
  const opp = opponentKnowledge(draft, seat);
  const sorted = [...me.pool].sort(byMana(bySlug));
  const received = new Set(me.received);
  return (
    <aside className="space-y-4">
      <div className="felt-panel p-4">
        {me.legendaries.length ? (
          <>
            <h3 className="t-panel text-sky">{L.play.yourLegendaries}</h3>
            <ul className="mt-2 space-y-1.5">
              {me.legendaries.map((s) => {
                const c = bySlug.get(s);
                return c ? <Row key={s} c={c} /> : null;
              })}
            </ul>
          </>
        ) : null}
        <h3 className={`t-panel text-sky ${me.legendaries.length ? "mt-4" : ""}`}>
          {L.play.yourCards} ({me.pool.length})
        </h3>
        {sorted.length ? (
          <ul className="mt-2 space-y-1.5">
            {sorted.map((s) => {
              const c = bySlug.get(s);
              return c ? <Row key={s} c={c} note={received.has(s) ? L.play.received : undefined} /> : null;
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-chalk-muted">{L.play.empty}</p>
        )}
        {sorted.length ? (
          <div className="mt-4">
            <Curve slugs={me.pool} bySlug={bySlug} L={L} />
          </div>
        ) : null}
      </div>
      <div className="felt-panel p-4">
        <h3 className="t-panel text-sky">{L.play.oppCards}</h3>
        <p className="text-xs text-chalk-muted">{oppName}</p>
        {opp.legendaries.length ? (
          <ul className="mt-2 space-y-1.5">
            {opp.legendaries.map((s) => {
              const c = bySlug.get(s);
              return c ? <Row key={s} c={c} /> : null;
            })}
          </ul>
        ) : null}
        {draft.format === "triple" ? (
          opp.pool.length ? (
            <ul className="mt-2 space-y-1.5">
              {[...opp.pool].sort(byMana(bySlug)).map((s) => {
                const c = bySlug.get(s);
                return c ? <Row key={s} c={c} /> : null;
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-chalk-muted">{L.play.empty}</p>
          )
        ) : draft.format === "exchange" ? (
          <>
            <p className="mt-2 text-xs text-chalk-muted">{L.play.youGave}</p>
            {me.given.length ? (
              <ul className="mt-1.5 space-y-1.5">
                {me.given.map((s) => {
                  const c = bySlug.get(s);
                  return c ? <Row key={s} c={c} /> : null;
                })}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-chalk-muted">{L.play.empty}</p>
            )}
            <p className="mt-3 text-xs text-chalk-muted">{fill(L.play.oppHidden, { n: Math.max(0, opp.count - (me.given.length - (me.outbox ? 1 : 0))) })}</p>
          </>
        ) : (
          <p className="mt-2 text-xs text-chalk-muted">{fill(L.play.oppHidden, { n: opp.count })}</p>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------------------------------------ costruzione */

function Build({
  L,
  draft,
  seat,
  kit,
  bySlug,
  onConfirm,
}: {
  L: DraftLabels;
  draft: DraftState;
  seat: Seat;
  kit: BotKit;
  bySlug: Map<string, DraftUiCard>;
  onConfirm: (legendary: string, cards: string[]) => void;
}) {
  const me = draft.seats[seat];
  const [legendary, setLegendary] = useState<string | null>(me.legendaries.length === 1 ? me.legendaries[0] : null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [warn, setWarn] = useState(false);
  const pool = [...me.pool].sort(byMana(bySlug));
  const toggle = (s: string) => {
    setWarn(false);
    if (chosen.includes(s)) setChosen(chosen.filter((x) => x !== s));
    else if (chosen.length >= DECK_BASE) setWarn(true);
    else setChosen([...chosen, s]);
  };
  const auto = () => {
    const best = bestDeck(kit, me.legendaries, me.pool);
    setLegendary(best.legendary);
    setChosen(best.cards);
    setWarn(false);
  };
  const ready = legendary !== null && chosen.length === DECK_BASE;
  return (
    <section aria-labelledby="draft-build" className="space-y-4">
      <div>
        <h2 id="draft-build" className="t-section">
          {L.buildStep.title}
        </h2>
        <p className="mt-1 text-sm text-chalk-muted">{L.buildStep.hint}</p>
      </div>
      {me.legendaries.length > 1 ? (
        <fieldset>
          <legend className="t-panel text-sky">{L.buildStep.chooseLegendary}</legend>
          <div className="mt-2 grid max-w-md grid-cols-2 gap-3">
            {me.legendaries.map((s) => {
              const c = bySlug.get(s);
              if (!c) return null;
              const on = legendary === s;
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => setLegendary(s)} className={`rounded-2xl p-1 text-left ${on ? "ring-4 ring-mint" : "opacity-70 hover:opacity-100"}`}>
                  <BigCard al={L.alignment} c={c} />
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`font-mono text-sm ${chosen.length === DECK_BASE ? "text-mint" : "text-chalk"}`}>{fill(L.buildStep.count, { n: chosen.length })}</span>
        <button type="button" className="btn btn-ghost text-xs" onClick={auto} title={L.buildStep.autoHint}>
          {L.buildStep.auto}
        </button>
        <button type="button" className="btn btn-ink text-xs" onClick={() => setChosen([])} disabled={!chosen.length}>
          {L.buildStep.clear}
        </button>
        <button type="button" className="btn btn-primary ml-auto" disabled={!ready} onClick={() => legendary && onConfirm(legendary, chosen)}>
          {L.buildStep.confirm}
        </button>
      </div>
      <p className="text-xs text-chalk-muted">{L.buildStep.autoHint}</p>
      {warn ? (
        <p className="text-sm text-crimson-soft" role="status">
          {L.buildStep.full}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {pool.map((s) => {
            const c = bySlug.get(s);
            if (!c) return null;
            const on = chosen.includes(s);
            return (
              <li key={s}>
                <button type="button" aria-pressed={on} onClick={() => toggle(s)} className={`block w-full rounded-xl text-left transition ${on ? "ring-4 ring-mint" : "opacity-60 hover:opacity-100"}`}>
                  <span className="block overflow-hidden rounded-lg border-2 border-sky bg-night-2">
                    {c.thumb || c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image ?? c.thumb} alt={c.name} loading="lazy" decoding="async" className="block h-auto w-full" />
                    ) : (
                      <span className="grid aspect-[5/7] place-items-center p-1 text-center text-xs text-sky">{c.name}</span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-chalk">{c.name}</span>
                  {c.alignment ? <span className={`deck-peek-align is-${c.alignment} mt-1 inline-block !text-[9px]`}>{L.alignment[c.alignment]}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="felt-panel h-fit p-4">
          <Curve slugs={chosen} bySlug={bySlug} L={L} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------ risultato */

function Result({
  L,
  draft,
  me,
  oppDeckTitle,
  kit,
  bySlug,
  builderHref,
  actions,
}: {
  L: DraftLabels;
  draft: DraftState;
  me: Seat;
  oppDeckTitle: string;
  kit: BotKit;
  bySlug: Map<string, DraftUiCard>;
  builderHref: string;
  actions: ReactNode;
}) {
  const decks = useMemo(() => draft.seats.map((s) => s.deck!), [draft]);
  const reports = useMemo(() => decks.map((d) => deckReport(kit, d.legendary, d.cards)), [decks, kit]);
  const [codes, setCodes] = useState<(string | null)[]>([null, null]);
  const tracked = useRef(false);
  const opp: Seat = me === 0 ? 1 : 0;

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("draft_complete", { format: draft.format, grade: reports[me].grade });
  }, [draft.format, reports, me]);

  const deckKey = JSON.stringify(decks);
  useEffect(() => {
    let alive = true;
    Promise.all(
      decks.map(async (d) => {
        const keys = [d.legendary, ...d.cards].map((s) => bySlug.get(s)?.key);
        if (keys.some((k) => !k)) return null;
        try {
          return await encodeGameCode(keys as string[]);
        } catch {
          return null;
        }
      }),
    ).then((c) => alive && setCodes(c));
    return () => {
      alive = false;
    };
    // i mazzi di un draft finito non cambiano più: si ricalcola solo se arrivano mazzi diversi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  const builderLink = (d: { legendary: string; cards: string[] }) =>
    `${builderHref}#${encodeOmCode({ name: `${L.result.deckName} · ${L.formats[draft.format].name}`, legendary: d.legendary, cards: d.cards, customCards: [] })}`;

  return (
    <section aria-labelledby="draft-result" className="space-y-6">
      <h2 id="draft-result" className="t-section">
        {L.result.title}
      </h2>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {([me, opp] as Seat[]).map((seat) => (
          <DeckPanel
            key={seat}
            L={L}
            title={seat === me ? L.result.yourDeck : oppDeckTitle}
            deck={decks[seat]}
            report={reports[seat]}
            code={codes[seat]}
            bySlug={bySlug}
            builderLink={builderLink(decks[seat])}
          />
        ))}
      </div>
      <p className="text-xs text-chalk-muted">{L.result.verdictNote}</p>
      <div className="felt-panel flex flex-wrap items-center gap-3 p-4">{actions}</div>
    </section>
  );
}

function DeckPanel({
  L,
  title,
  deck,
  report,
  code,
  bySlug,
  builderLink,
}: {
  L: DraftLabels;
  title: string;
  deck: { legendary: string; cards: string[] };
  report: DeckReport;
  code: string | null;
  bySlug: Map<string, DraftUiCard>;
  builderLink: string;
}) {
  const legend = bySlug.get(deck.legendary);
  const cards = [...deck.cards].sort(byMana(bySlug));
  return (
    <div className="card-night p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="t-item text-sky">{title}</h3>
        <div className="text-right">
          <p className="kicker text-chalk-muted">{L.result.verdict}</p>
          <p className="mt-1 flex items-center justify-end gap-2">
            <span className={`tier-letter ${tierTone[report.grade]}`}>{report.grade}</span>
            <span className="text-sm font-bold text-chalk">{L.grades[report.grade]}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
        {legend ? (
          <div className="max-w-[9rem]">
            <BigCard al={L.alignment} c={legend} />
          </div>
        ) : null}
        <ul className="space-y-1.5">
          {cards.map((s) => {
            const c = bySlug.get(s);
            return c ? <Row key={s} c={c} note="×2" /> : null;
          })}
        </ul>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-chalk sm:grid-cols-2">
        <li>{fill(L.result.early, { n: report.early })}</li>
        <li>{fill(L.result.removal, { n: report.removal })}</li>
        <li>{fill(L.result.barrier, { n: report.barrier })}</li>
        <li>{fill(L.result.draw, { n: report.draw })}</li>
        <li className="sm:col-span-2">
          {L.result.packages}: {report.packages.length ? report.packages.map((p) => L.packages[p]).join(", ") : L.result.noPackage}
        </li>
      </ul>
      <div className="mt-4">
        <Curve slugs={deck.cards} bySlug={bySlug} L={L} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {code ? (
          <CopyButton text={code} label={L.result.copyGame} copied={L.result.copied} className="btn btn-mint text-xs" event={{ name: "game_code_copy", params: { placement: "draft" } }} />
        ) : (
          <span className="text-xs text-chalk-muted">{L.result.gameMissing}</span>
        )}
        <a href={builderLink} className="btn btn-ghost text-xs" onClick={() => trackEvent("deck_open_builder", { placement: "draft" })}>
          {L.result.openBuilder}
        </a>
      </div>
    </div>
  );
}

