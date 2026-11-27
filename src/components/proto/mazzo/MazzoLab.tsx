"use client";

import { useEffect, useMemo, useState } from "react";
import { GameCardFace } from "@/components/GameCard";
import { baseKey, decodeGameCode, decodeOmCode, encodeGameCode, encodeOmCode, GAME_PREFIX, OM_PREFIX } from "@/lib/deckcode";
import {
  decodeHash,
  encodeHash,
  exactList,
  fullDeck,
  matchupsOf,
  nearLists,
  pct,
  readCards,
  type CardRead,
  type Deck,
  type MCard,
  type MMatchup,
  type MNum,
  type MPatch,
} from "@/lib/proto/mazzo";

/* Tutti i testi della pagina: poi si traducono nelle otto lingue. */
const L = {
  pasteLabel: "Codice del tuo mazzo",
  pastePlaceholder: "Incolla qui il codice del gioco (KGBLDC…)",
  read: "Leggi il mazzo",
  orStart: "Oppure parti da una lista giocata",
  games: (n: number) => `${n.toLocaleString("it-IT")} ${n === 1 ? "partita" : "partite"}`,
  patch: "Patch",
  errCode: "Questo codice non si legge: copialo di nuovo dal gioco.",
  errShape: (leg: number, n: number) => `Il codice ha ${leg === 1 ? "una Leggendaria" : `${leg} Leggendarie`} e ${n} carte: servono una Leggendaria e 12 carte.`,
  errUnknown: (n: number) => `${n === 1 ? "Una carta del codice non la conosciamo" : `${n} carte del codice non le conosciamo`} ancora.`,
  deckOf: (leg: string) => `Mazzo di ${leg}`,
  exactTitle: "Questa lista, esatta",
  exactRange: (lo: number, hi: number) => `Il vero valore sta probabilmente fra ${pct(lo)} e ${pct(hi)}.`,
  verdictUp: "vince, e non per caso",
  verdictDown: "perde più di quanto vince",
  verdictEven: "in equilibrio: servono altre partite",
  noExact: "Questa lista esatta non è ancora stata registrata in questa patch.",
  nearest: (n: number) => `La più vicina ha ${n} carte su 12 in comune:`,
  noNear: "Nessuna lista registrata le somiglia abbastanza.",
  legendaryLine: (leg: string, r: number, games: number) => `${leg} in generale: ${pct(r)} su ${games.toLocaleString("it-IT")} presenze, contando tutti e due i lati.`,
  copyCode: "Copia codice del gioco",
  openBuilder: "Apri nel deck builder",
  copyLink: "Copia l'indirizzo",
  copied: "Copiato",
  cardsTitle: "Carta per carta",
  cardsIntro: (leg: string, games: number) => `Fra tutte le liste di ${leg} registrate (${games.toLocaleString("it-IT")} partite): quanto c'è ogni carta e come vanno le liste con e senza.`,
  inShare: (s: number) => `in ${pct(s)} delle partite`,
  with: "con",
  without: "senza",
  turn: (t: number) => `giocata al round ${t.toLocaleString("it-IT", { maximumFractionDigits: 1 })}`,
  nobody: "nessuno la gioca qui",
  noteUp: (p: number) => `+${p} punti`,
  noteDown: (p: number) => `${p} punti`,
  swapsTitle: "Cosa cambierei",
  swapsIntro: "Liste vere con almeno 9 carte su 12 uguali alle tue che vanno meglio, dalla più solida.",
  take: "Togli",
  put: "Metti",
  tryThis: "Prova questa",
  fewGames: "poche partite, da provare",
  noSwaps: "Nessuna lista vicina fa meglio della tua con le partite di questa patch.",
  vsTitle: "Contro chi giocarlo",
  vsIntro: (leg: string) => `Gli scontri di ${leg}, contati da tutti e due i lati: la percentuale è quanto vinci tu.`,
  best: "Ti conviene",
  worst: "I più duri",
  allWon: "anche questi li vince",
  allVs: "Tutti gli scontri",
  noVs: "Ancora nessuno scontro abbastanza chiaro.",
  turnNote: "Il round medio è quello di tutte le partite registrate, non solo di questa Leggendaria.",
};

const byMana = (cards: Map<string, MCard>) => (a: string, b: string) =>
  (cards.get(a)?.mana ?? 99) - (cards.get(b)?.mana ?? 99) || (cards.get(a)?.name ?? a).localeCompare(cards.get(b)?.name ?? b);

export function MazzoLab({ patches, cards }: { patches: MPatch[]; cards: MCard[] }) {
  const bySlug = useMemo(() => new Map(cards.map((c) => [c.slug, c])), [cards]);
  const byKey = useMemo(() => new Map(cards.filter((c) => c.key).map((c) => [baseKey(c.key as string), c])), [cards]);
  const [patchId, setPatchId] = useState(patches[0].patch);
  const p = patches.find((x) => x.patch === patchId) ?? patches[0];
  const firstList = patches[0].lists[0];
  const [deck, setDeck] = useState<Deck | null>(firstList ? { legendary: firstList.legendary, cards: firstList.cards } : null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // stato dall'indirizzo condiviso, una volta sola
  useEffect(() => {
    const h = decodeHash(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura dell'indirizzo al primo disegno nel browser
    if (h.patch && patches.some((x) => x.patch === h.patch)) setPatchId(h.patch);
    if (h.deck && bySlug.get(h.deck.legendary)?.legendary && h.deck.cards.every((c) => bySlug.has(c))) setDeck(h.deck);
    setReady(true);
  }, [patches, bySlug]);

  useEffect(() => {
    if (!ready) return;
    window.history.replaceState(null, "", encodeHash(patchId, deck));
  }, [ready, patchId, deck]);

  const starts = useMemo(() => {
    const seen = new Set<string>();
    return p.lists.filter((l) => (seen.has(l.legendary) ? false : (seen.add(l.legendary), true))).slice(0, 12);
  }, [p]);

  async function read() {
    setError(null);
    const t = code.trim();
    if (!t) return;
    let slugs: string[] = [];
    if (t.includes(GAME_PREFIX)) {
      const res = await decodeGameCode(t);
      if ("error" in res) return setError(L.errCode);
      const unknown = res.keys.filter((k) => !byKey.has(baseKey(k)));
      if (unknown.length) return setError(L.errUnknown(new Set(unknown.map(baseKey)).size));
      slugs = res.keys.map((k) => (byKey.get(baseKey(k)) as MCard).slug);
    } else if (t.includes(OM_PREFIX)) {
      const d = decodeOmCode(t.slice(t.indexOf(OM_PREFIX)));
      if (!d) return setError(L.errCode);
      slugs = [d.legendary, ...d.cards].filter((s): s is string => !!s);
    } else return setError(L.errCode);
    const uniq = [...new Set(slugs)];
    const legs = uniq.filter((s) => bySlug.get(s)?.legendary);
    const rest = uniq.filter((s) => !bySlug.get(s)?.legendary);
    if (legs.length !== 1 || rest.length !== 12) return setError(L.errShape(legs.length, rest.length));
    setDeck({ legendary: legs[0], cards: rest });
    setCode("");
  }

  async function copy(what: "code" | "link") {
    if (!deck) return;
    try {
      let text = window.location.href;
      if (what === "code") {
        const keys = [deck.legendary, ...deck.cards].map((s) => bySlug.get(s)?.key).filter((k): k is string => !!k);
        text = await encodeGameCode(keys);
      }
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  const name = (s: string) => bySlug.get(s)?.name ?? s;
  const ok = fullDeck(deck);
  const exact = ok ? exactList(p, deck) : null;
  const legStat = ok ? p.legendaries.find((l) => l.slug === deck.legendary) : null;
  const reads = ok ? readCards(p, deck) : null;
  const near = ok ? nearLists(p, deck) : [];
  const swaps = (exact ? near.filter((s) => s.list.r > exact.r) : near).slice(0, 3);
  const vs = ok ? matchupsOf(p, deck.legendary) : null;
  const builderHref = ok ? `/it/deck-builder#${encodeOmCode({ name: L.deckOf(name(deck.legendary)), legendary: deck.legendary, cards: deck.cards, customCards: [] })}` : "#";

  return (
    <div className="mt-6">
      {/* scelta del mazzo */}
      <div className="card-night p-4 sm:p-5">
        <label htmlFor="mz-code" className="font-display text-sm font-semibold text-sky">
          {L.pasteLabel}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="mz-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && read()}
            placeholder={L.pastePlaceholder}
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border-2 border-sky/40 bg-felt px-3 py-2 font-mono text-sm text-chalk placeholder:text-pale-muted focus:border-mint focus:outline-none"
          />
          <button type="button" className="btn btn-primary" onClick={read}>
            {L.read}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}
        <p className="mt-4 text-sm text-pale">{L.orStart}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {starts.map((l) => {
            const on = ok && deck.legendary === l.legendary && exact?.cards.join() === l.cards.join();
            return (
              <li key={l.legendary}>
                <button
                  type="button"
                  onClick={() => setDeck({ legendary: l.legendary, cards: l.cards })}
                  aria-pressed={on}
                  className={`rounded-full border-2 px-3 py-1 text-sm transition ${on ? "border-mint bg-mint/15 text-mint" : "border-sky/40 text-chalk hover:border-mint hover:text-mint"}`}
                >
                  <span className="legendary-star" aria-hidden="true">★</span> {name(l.legendary)} <span className="text-pale-muted">· {L.games(l.games)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {patches.length > 1 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-pale">{L.patch}</span>
            {patches.map((x) => (
              <button
                key={x.patch}
                type="button"
                onClick={() => setPatchId(x.patch)}
                aria-pressed={x.patch === patchId}
                className={`rounded-full px-3 py-1 font-display ${x.patch === patchId ? "bg-sky text-ink" : "border border-sky/40 text-chalk hover:border-mint"}`}
              >
                {x.label} <span className={x.patch === patchId ? "text-ink/70" : "text-pale-muted"}>· {L.games(x.games)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {ok && reads ? (
        <>
          {/* pagella */}
          <section className="mt-8 grid grid-cols-1 items-start gap-6 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
            <div className="mx-auto w-44 sm:w-full">
              {bySlug.get(deck.legendary) ? <GameCardFace input={(bySlug.get(deck.legendary) as MCard).input} lang="it" /> : null}
            </div>
            <div className="min-w-0">
              <h2 className="t-section text-sky">{L.deckOf(name(deck.legendary))}</h2>
              {exact ? (
                <div className="mt-3">
                  <p className="text-sm text-pale">{L.exactTitle}</p>
                  <p className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
                    <span className={`pen-num ${exact.lo > 0.5 ? "text-good" : exact.hi < 0.5 ? "text-bad" : "text-gold"}`}>{pct(exact.r)}</span>
                    <span className="font-mono text-chalk">{L.games(exact.games)}</span>
                    <span className="pen-note">{exact.lo > 0.5 ? L.verdictUp : exact.hi < 0.5 ? L.verdictDown : L.verdictEven}</span>
                  </p>
                  <p className="mt-3 text-sm text-pale">{L.exactRange(exact.lo, exact.hi)}</p>
                </div>
              ) : (
                <div className="mt-3 text-pale">
                  <p>{L.noExact}</p>
                  {near[0] ? (
                    <p className="mt-2">
                      {L.nearest(near[0].shared)}{" "}
                      <button type="button" className="text-mint underline-offset-2 hover:underline" onClick={() => setDeck({ legendary: deck.legendary, cards: near[0].list.cards })}>
                        {pct(near[0].list.r)} · {L.games(near[0].list.games)}
                      </button>
                    </p>
                  ) : (
                    <p className="mt-2">{L.noNear}</p>
                  )}
                </div>
              )}
              {legStat ? <p className="mt-3 text-sm text-pale">{L.legendaryLine(name(deck.legendary), legStat.r, legStat.games)}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary" onClick={() => copy("code")}>
                  {copied === "code" ? L.copied : L.copyCode}
                </button>
                <a href={builderHref} className="btn btn-ghost">
                  {L.openBuilder}
                </a>
                <button type="button" className="btn btn-ghost" onClick={() => copy("link")}>
                  {copied === "link" ? L.copied : L.copyLink}
                </button>
              </div>
            </div>
          </section>

          {/* carta per carta */}
          <section className="mt-10">
            <h2 className="t-section text-sky">{L.cardsTitle}</h2>
            <p className="mt-1 max-w-2xl text-sm text-pale">{L.cardsIntro(name(deck.legendary), reads.legendaryGames)}</p>
            <ul className="mt-5 grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
              {[...reads.cards].sort((a, b) => byMana(bySlug)(a.slug, b.slug)).map((c) => (
                <CardCell key={c.slug} read={c} card={bySlug.get(c.slug)} />
              ))}
            </ul>
            <p className="mt-4 text-xs text-pale-muted">{L.turnNote}</p>
          </section>

          {/* cosa cambierei */}
          <section className="mt-10">
            <h2 className="t-section text-sky">{L.swapsTitle}</h2>
            <p className="mt-1 text-sm text-pale">{L.swapsIntro}</p>
            {swaps.length ? (
              <ol className="mt-4 grid grid-cols-1 gap-3">
                {swaps.map((s, i) => (
                  <li key={s.list.cards.join()} className={`card-night flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${s.list.hi - s.list.lo > 0.3 ? "opacity-80" : ""}`}>
                    <span className="pen-num shrink-0 text-gold">{i + 1}</span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p>
                        <span className="text-pale">{L.take} </span>
                        {s.out.map((c, j) => (
                          <span key={c} className="font-display font-semibold text-bad">
                            {j ? ", " : ""}
                            {name(c)}
                          </span>
                        ))}
                      </p>
                      <p className="mt-1">
                        <span className="text-pale">{L.put} </span>
                        {s.in.map((c, j) => (
                          <span key={c} className="font-display font-semibold text-good">
                            {j ? ", " : ""}
                            {name(c)}
                          </span>
                        ))}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-chalk">
                      <b className={s.list.lo > 0.5 ? "text-good" : "text-chalk"}>{pct(s.list.r)}</b> · {L.games(s.list.games)}
                      {s.list.hi - s.list.lo > 0.3 ? <span className="pen-note is-quiet mt-1 block text-[1rem]">{L.fewGames}</span> : null}
                    </p>
                    <button type="button" className="btn btn-ghost shrink-0" onClick={() => setDeck({ legendary: deck.legendary, cards: s.list.cards })}>
                      {L.tryThis}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-pale">{L.noSwaps}</p>
            )}
          </section>

          {/* scontri */}
          {vs ? (
            <section className="mt-10">
              <h2 className="t-section text-sky">{L.vsTitle}</h2>
              <p className="mt-1 text-sm text-pale">{L.vsIntro(name(deck.legendary))}</p>
              {vs.best.length || vs.worst.length ? (
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <VsList title={L.best} tone="good" rows={vs.best} bySlug={bySlug} />
                  <VsList title={L.worst} tone={vs.worst.some((m) => m.r < 0.5) ? "bad" : "good"} note={vs.worst.length > 0 && vs.worst.every((m) => m.lo > 0.5) ? L.allWon : undefined} rows={vs.worst} bySlug={bySlug} />
                </div>
              ) : (
                <p className="mt-4 text-pale">{L.noVs}</p>
              )}
              {vs.all.length ? (
                <details className="mt-5">
                  <summary className="cursor-pointer font-display text-sm text-mint">{L.allVs}</summary>
                  <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {vs.all.map((m) => (
                      <li key={m.b} className="flex items-baseline justify-between gap-3 border-b border-sky/15 py-1">
                        <span className="truncate text-chalk">{name(m.b)}</span>
                        <span className="shrink-0 font-mono text-pale">
                          <b className={m.lo > 0.5 ? "text-good" : m.hi < 0.5 ? "text-bad" : "text-chalk"}>{pct(m.r)}</b> · {L.games(m.games)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Line({ label, n }: { label: string; n: MNum | null }) {
  if (!n) return null;
  return (
    <span className="block">
      {label} <b className="text-chalk">{pct(n.r)}</b> <span className="text-pale-muted">({n.games.toLocaleString("it-IT")})</span>
    </span>
  );
}

function CardCell({ read, card }: { read: CardRead; card: MCard | undefined }) {
  return (
    <li className="relative min-w-0">
      {card ? <GameCardFace input={card.input} lang="it" /> : <p className="text-chalk">{read.slug}</p>}
      {read.verdict && read.points !== null ? (
        <span className={`pen-note pointer-events-none absolute -right-1 top-1 text-[1.15rem] sm:text-[1.4rem] ${read.verdict === "up" ? "text-good" : "text-bad"}`} style={{ rotate: read.verdict === "up" ? "-8deg" : "6deg" }}>
          {read.verdict === "up" ? L.noteUp(read.points) : L.noteDown(read.points)}
        </span>
      ) : null}
      <p className="mt-2 text-[0.72rem] leading-snug text-pale sm:text-xs">
        {read.with ? (
          <>
            <span className="block text-chalk">{L.inShare(read.share)}</span>
            <Line label={L.with} n={read.with} />
            <Line label={L.without} n={read.without} />
          </>
        ) : (
          <span className="pen-note is-quiet block text-[1rem]">{L.nobody}</span>
        )}
        {read.avgTurn !== null ? <span className="mt-0.5 block text-pale-muted">{L.turn(read.avgTurn)}</span> : null}
      </p>
    </li>
  );
}

function VsList({ title, tone, note, rows, bySlug }: { title: string; tone: "good" | "bad"; note?: string; rows: MMatchup[]; bySlug: Map<string, MCard> }) {
  return (
    <div>
      <h3 className="font-display font-semibold text-sky">
        {title} {note ? <span className="pen-note is-quiet ml-2 text-[1.1rem]">{note}</span> : null}
      </h3>
      {rows.length ? (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {rows.map((m) => (
            <li key={m.b} className="min-w-0 text-center">
              {bySlug.get(m.b) ? <GameCardFace input={(bySlug.get(m.b) as MCard).input} lang="it" /> : null}
              <p className="mt-2 font-mono text-sm">
                <b className={tone === "good" ? "text-good" : "text-bad"}>{pct(m.r)}</b>
              </p>
              <p className="text-xs text-pale-muted">{L.games(m.games)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-pale">{L.noVs}</p>
      )}
    </div>
  );
}
