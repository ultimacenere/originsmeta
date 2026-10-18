"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { encodeGameCode } from "@/lib/deckcode";
import type { BroadcastCard, PeekLabels } from "@/lib/broadcast/catalog";
import { fillLabel, overlayLabels } from "@/lib/broadcast/labels";
import { copiesLeft, copiesOf, scoreSlot, seriesWinner, slotSeconds, visibleSponsors, type BroadcastDeck, type BroadcastLang, type BroadcastSponsor, type BroadcastState, type ListSide } from "@/lib/broadcast/state";

/**
 * Broadcasting OM (prototipo del 16/10/2026): il livello sopra la partita, disegnato su un palco di 1920 × 1080
 * (la sorgente di OBS) e scalato alla larghezza del contenitore. Posizioni dal mockup di Pierluigi: targhette dei due
 * giocatori in alto (con Mazzo 1, 2, 3), punteggio della serie in alto a destra prima dell'ingranaggio del gioco,
 * liste del mazzo in campo ai lati, sopra le corsie ma fuori dal tabellone centrale e dalla mano.
 *
 * Due modi: `live` (pubblico: clic sulla targhetta apre o chiude la lista, le linguette mostrano gli altri mazzi, il tasto
 * copia il codice del gioco) e `regia` (anteprima di chi trasmette: in più un clic su una carta segna una copia giocata).
 * Le carte sono contenuto: intere, con i crediti stampati, mai ritagliate. La dicitura "non affiliato a Koin Games" è
 * sempre sotto il punteggio.
 */
export type OverlayMode = "live" | "regia";

type Props = {
  state: BroadcastState;
  catalog: Map<string, BroadcastCard>;
  /** tipo e allineamento nelle lingue dell'overlay, per l'anteprima della carta */
  peekLabels: PeekLabels;
  mode: OverlayMode;
  /** regia: clic su una carta della lista (giocatore, slug) */
  onCardClick?: (player: 0 | 1, slug: string) => void;
  /** sfondo del palco (solo anteprima): un'immagine della partita o niente (trasparente) */
  background?: string | null;
  /** regia: cambia a ogni clic su "Mostra lo sponsor adesso" (il riquadro del punteggio passa subito allo sponsor) */
  sponsorNow?: number;
};

const STAGE_W = 1920;
const STAGE_H = 1080;

function defaultSide(player: 0 | 1): Exclude<ListSide, "off"> {
  return player === 0 ? "right" : "left";
}

/** Le carte del mazzo da mostrare: Leggendaria in testa, poi per costo e nome. */
function deckRows(deck: BroadcastDeck, catalog: Map<string, BroadcastCard>): BroadcastCard[] {
  const base = deck.cards.map((s) => catalog.get(s)).filter((c): c is BroadcastCard => Boolean(c));
  base.sort((a, b) => (a.mana ?? 99) - (b.mana ?? 99) || a.name.localeCompare(b.name));
  const legendary = deck.legendary ? catalog.get(deck.legendary) : undefined;
  return legendary ? [legendary, ...base] : base;
}

/** Altezza massima del pannello d'anteprima sul palco: serve a tenerlo dentro lo schermo. */
const PEEK_H = 300;

/**
 * Anteprima della carta al passaggio del mouse (19/10/2026, Pierluigi: "devono mostrare le loro statistiche e non solo
 * l'immagine"): lo stesso pannello del deck builder e delle schede (classi .deck-peek-* di globals.css), metà carta
 * intera con i crediti, metà costo, nome, potenza e salute, tipo, allineamento e testo nella lingua dell'overlay.
 * Si apre verso il centro dello schermo, accanto alla lista.
 */
function CardPeekPanel({ card, side, top, lang, labels }: { card: BroadcastCard; side: "left" | "right"; top: number; lang: BroadcastLang; labels: PeekLabels[BroadcastLang] }) {
  const ability = card.ability?.[lang] ?? card.ability?.en;
  return (
    <div className={`bc-peek bc-peek-${side}`} style={{ top }} aria-hidden="true">
      <span className={`deck-peek-panel${card.legendary ? " is-legendary" : ""}`}>
        {card.image ?? card.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- carta intera già in WebP, come CardPeek
          <img className="deck-peek-art" src={card.image ?? card.thumb} alt="" />
        ) : (
          <span />
        )}
        <span className="deck-peek-body">
          <span className="flex items-start gap-2">
            {card.mana !== undefined ? <span className="deck-peek-mana shrink-0">{card.mana}</span> : null}
            <span className="deck-peek-name min-w-0 self-center">
              {card.legendary ? (
                <span className="legendary-star" aria-hidden="true">
                  ★{" "}
                </span>
              ) : null}
              {card.name}
            </span>
          </span>
          <span className="deck-peek-tags">
            {!card.spell && card.power !== undefined ? (
              <span className="deck-peek-stats">
                {card.power} / {card.health ?? "?"}
              </span>
            ) : null}
            <span className="deck-peek-type">{card.spell ? labels.spell : labels.unit}</span>
            {card.alignment ? <span className={`deck-peek-align is-${card.alignment}`}>{labels[card.alignment]}</span> : null}
          </span>
          {ability ? <span className="deck-peek-text">{ability}</span> : null}
        </span>
      </span>
    </div>
  );
}

async function gameCodeOf(deck: BroadcastDeck, catalog: Map<string, BroadcastCard>): Promise<string | null> {
  const slugs = [deck.legendary, ...deck.cards].filter((s): s is string => Boolean(s));
  if (!slugs.length) return null;
  const keys = slugs.map((s) => catalog.get(s)?.key);
  if (keys.some((k) => !k)) return null;
  try {
    return await encodeGameCode(keys as string[]);
  } catch {
    return null;
  }
}

export function BroadcastOverlay({ state, catalog, peekLabels, mode, onCardClick, background, sponsorNow = 0 }: Props) {
  const labels = overlayLabels[state.lang];
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // scelte del pubblico, solo in questo browser: lista aperta o chiusa (null = come dice la regia) e mazzo guardato
  const [open, setOpen] = useState<[boolean | null, boolean | null]>([null, null]);
  const [viewing, setViewing] = useState<[number | null, number | null]>([null, null]);
  const [peek, setPeek] = useState<{ player: 0 | 1; slug: string; top: number } | null>(null);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / STAGE_W || 1);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // riquadro del punteggio: il punteggio per scoreSeconds, poi uno sponsor per seconds, a giro (`scoreSlot`)
  const sponsors = visibleSponsors(state.sponsors);
  const sponsorCount = sponsors.length;
  const [step, setStep] = useState(0);
  const [nowSeen, setNowSeen] = useState(sponsorNow);
  if (sponsorNow !== nowSeen) {
    // clic in regia: si passa subito allo sponsor che tocca (stato aggiornato durante il render, come vuole React)
    setNowSeen(sponsorNow);
    setStep((n) => (n % 2 === 0 ? n + 1 : n));
  }
  const delay = slotSeconds(step, state.sponsors, sponsorCount);
  useEffect(() => {
    if (!sponsorCount) return;
    const id = window.setTimeout(() => setStep((n) => n + 1), delay * 1000);
    return () => window.clearTimeout(id);
  }, [step, sponsorCount, delay]);
  const slot = scoreSlot(step, sponsorCount);
  const [broken, setBroken] = useState<Record<string, true>>({});

  const winner = seriesWinner(state);
  const { tournament } = state;
  const meta = [tournament.number && `${tournament.name} ${tournament.number}`.trim(), !tournament.number && tournament.name, tournament.phase, fillLabel(labels.bestOf, { n: tournament.bestOf })].filter(Boolean).join(" · ");

  const players = [0, 1] as const;
  const listOpen = (p: 0 | 1) => open[p] ?? state.players[p].list !== "off";
  const sideOf = (p: 0 | 1) => (state.players[p].list === "off" ? defaultSide(p) : state.players[p].list) as "left" | "right";
  const deckIndex = (p: 0 | 1) => {
    const v = viewing[p];
    return v !== null && v < state.players[p].decks.length ? v : state.players[p].active;
  };
  // due liste dallo stesso lato: la seconda va dall'altro
  const sides: ["left" | "right", "left" | "right"] = [sideOf(0), sideOf(1)];
  if (sides[0] === sides[1] && listOpen(0) && listOpen(1)) sides[1] = sides[0] === "left" ? "right" : "left";

  const togglePlayer = (p: 0 | 1) => setOpen((o) => (p === 0 ? [!listOpen(0), o[1]] : [o[0], !listOpen(1)]));
  const showDeck = (p: 0 | 1, i: number) => {
    setViewing((v) => (p === 0 ? [i, v[1]] : [v[0], i]));
    setOpen((o) => (p === 0 ? [true, o[1]] : [o[0], true]));
  };

  const peekCard = peek ? catalog.get(peek.slug) : undefined;

  return (
    <div ref={frame} className="bc-frame" data-mode={mode}>
      <div className="bc-stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- sfondo dell'anteprima a misura del palco */}
        {background ? <img className="bc-bg" src={background} alt="" width={STAGE_W} height={STAGE_H} /> : null}

        {players.map((p) => {
          const player = state.players[p];
          return (
            <div key={`plate-${p}`} className={`bc-plate bc-plate-${p}`} data-winner={winner === p ? "" : undefined}>
              <button type="button" className="bc-plate-name" onClick={() => togglePlayer(p)} aria-expanded={listOpen(p)}>
                <span className="bc-name">{player.name || "—"}</span>
                {player.title ? <span className="bc-title">{player.title}</span> : null}
                <span className="bc-hint">{listOpen(p) ? labels.hideDeck : labels.showDeck}</span>
              </button>
              <div className="bc-tabs" role="tablist">
                {player.decks.map((d, i) => {
                  const legendary = d.legendary ? catalog.get(d.legendary)?.name : null;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={listOpen(p) && deckIndex(p) === i}
                      className="bc-tab"
                      data-active={player.active === i ? "" : undefined}
                      title={[d.name, legendary].filter(Boolean).join(" · ") || undefined}
                      onClick={() => showDeck(p, i)}
                    >
                      {fillLabel(labels.deck, { n: i + 1 })}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="bc-score" data-show={slot.show}>
          {slot.show === "sponsor" && sponsors[slot.index] ? (
            <SponsorSlot
              key={`sponsor-${step}`}
              item={sponsors[slot.index]}
              mode={mode}
              broken={Boolean(broken[sponsors[slot.index].logo])}
              onBroken={(src) => setBroken((x) => ({ ...x, [src]: true }))}
            />
          ) : (
            <div className="bc-score-in" key={`score-${step}`} aria-live="polite">
              {meta ? <div className="bc-score-meta">{meta}</div> : null}
              <div className="bc-score-row">
                <span className="bc-score-label">{labels.score}</span>
                {players.map((p) => (
                  <div key={p} className="bc-score-side" data-winner={winner === p ? "" : undefined}>
                    <span className="bc-score-player">{state.players[p].name || "—"}</span>
                    <span className="bc-score-digit">{state.players[p].score}</span>
                  </div>
                ))}
              </div>
              {winner !== null ? <div className="bc-score-win">{fillLabel(labels.wins, { name: state.players[winner].name })}</div> : null}
            </div>
          )}
        </div>
        {/* la dicitura su Koin Games resta sempre in onda, anche mentre c'è lo sponsor */}
        <div className="bc-score-note">{labels.unofficial}</div>

        {players.map((p) => {
          if (!listOpen(p)) return null;
          const player = state.players[p];
          const i = deckIndex(p);
          const deck = player.decks[i];
          if (!deck) return null;
          return (
            <DeckPanel
              key={`list-${p}`}
              player={p}
              side={sides[p]}
              deck={deck}
              index={i}
              inPlay={player.active === i}
              owner={player.name}
              catalog={catalog}
              labels={labels}
              mode={mode}
              onCardClick={onCardClick}
              onPeek={(slug, top) => setPeek(slug ? { player: p, slug, top } : null)}
            />
          );
        })}

        {peek && peekCard ? (
          <CardPeekPanel
            card={peekCard}
            side={sides[peek.player]}
            top={Math.min(Math.max(peek.top - PEEK_H / 2, 120), STAGE_H - PEEK_H - 20)}
            lang={state.lang}
            labels={peekLabels[state.lang]}
          />
        ) : null}
      </div>
    </div>
  );
}

type PanelProps = {
  player: 0 | 1;
  side: "left" | "right";
  deck: BroadcastDeck;
  index: number;
  inPlay: boolean;
  owner: string;
  catalog: Map<string, BroadcastCard>;
  labels: (typeof overlayLabels)["en"];
  mode: OverlayMode;
  onCardClick?: (player: 0 | 1, slug: string) => void;
  onPeek: (slug: string | null, top: number) => void;
};

function DeckPanel({ player, side, deck, index, inPlay, owner, catalog, labels, mode, onCardClick, onPeek }: PanelProps) {
  const rows = useMemo(() => deckRows(deck, catalog), [deck, catalog]);
  // codice del gioco calcolato nel browser (Web Crypto): vale solo per la lista da cui è fatto
  const sig = [deck.legendary, ...deck.cards].join("|");
  const [computed, setComputed] = useState<{ sig: string; code: string | null } | null>(null);
  const code = computed?.sig === sig ? computed.code : undefined;
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    gameCodeOf(deck, catalog).then((c) => alive && setComputed({ sig, code: c }));
    return () => {
      alive = false;
    };
  }, [deck, catalog, sig]);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // senza permesso per gli appunti (iframe, http): selezione a mano
      const area = document.createElement("textarea");
      area.value = code;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const rowTop = (el: HTMLElement) => {
    const box = panel.current;
    if (!box) return 0;
    return box.offsetTop + el.offsetTop + el.offsetHeight / 2;
  };

  return (
    <div ref={panel} className={`bc-list bc-list-${side} bc-list-p${player}`} onMouseLeave={() => onPeek(null, 0)}>
      <div className="bc-list-head">
        <span className="bc-list-title">{deck.name || fillLabel(labels.deck, { n: index + 1 })}</span>
        <span className="bc-list-sub">
          {owner ? <span>{owner}</span> : null}
          {deck.name ? <span>{fillLabel(labels.deck, { n: index + 1 })}</span> : null}
          {inPlay ? <span className="bc-inplay">{labels.inPlay}</span> : null}
        </span>
      </div>
      <ul className="bc-rows">
        {rows.map((card) => {
          const total = copiesOf(deck, card.slug);
          const left = copiesLeft(deck, card.slug);
          const Tag = mode === "regia" ? "button" : "div";
          const artSrc = card.art ?? card.image ?? card.thumb;
          // riga del deck builder (classi .builder-row di globals.css) ridotta all'essenziale (19/10/2026, Pierluigi:
          // "rimuovi l'icona delle carte e le statistiche o magia sotto i nomi"): costo, nome e copie rimaste, con
          // l'illustrazione sfumata sulla metà destra, magie su fondo rosa, Leggendaria con la cornice oro. Le
          // statistiche stanno nell'anteprima al passaggio del mouse
          return (
            <li key={card.slug}>
              <Tag
                {...(mode === "regia" ? { type: "button" as const, onClick: () => onCardClick?.(player, card.slug) } : { tabIndex: 0 })}
                className={["builder-row is-in-deck bc-brow", card.legendary ? "is-legendary" : "", card.spell ? "row-spell" : ""].filter(Boolean).join(" ")}
                style={artSrc ? ({ ["--row-art" as string]: `url(${artSrc})` } as React.CSSProperties) : undefined}
                data-out={left === 0 ? "" : undefined}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => onPeek(card.slug, rowTop(e.currentTarget))}
                onFocus={(e: React.FocusEvent<HTMLElement>) => onPeek(card.slug, rowTop(e.currentTarget))}
                onBlur={() => onPeek(null, 0)}
              >
                <span className="bc-brow-mana">{card.mana ?? "?"}</span>
                <span className="builder-row-text">
                  <span className="builder-row-name">
                    {card.legendary ? (
                      <span className="legendary-star" aria-hidden="true">
                        ★
                      </span>
                    ) : null}
                    {card.name}
                  </span>
                </span>
                <span className="builder-row-copies bc-brow-copies" aria-label={`${left}/${total} ${labels.left}`}>
                  {left}/{total}
                </span>
              </Tag>
            </li>
          );
        })}
      </ul>
      <button type="button" className="bc-copy" onClick={copy} disabled={!code} data-done={copied ? "" : undefined}>
        {copied ? labels.copied : code === null ? labels.noCode : labels.copyDeck}
      </button>
    </div>
  );
}

/**
 * Uno sponsor nel riquadro del punteggio (19/10/2026; Pierluigi: "in alternanza dove c'è lo score… non deve apparire
 * la scritta sponsor ma solo la scritta o solo il logo o il banner"): il bannerino riempie il riquadro (326 × 122), il
 * logo sta intero dentro 306 × 102, senza immagine (o se non si carica) il nome. Nessuna etichetta. Il pubblico può
 * aprire il sito dello sponsor (link "sponsored"); in regia non è un link.
 */
function SponsorSlot({ item, mode, broken, onBroken }: { item: BroadcastSponsor; mode: OverlayMode; broken: boolean; onBroken: (src: string) => void }) {
  const showImage = Boolean(item.logo) && !broken;
  const kind = showImage ? item.kind : "name";
  const body = showImage ? (
    // eslint-disable-next-line @next/next/no-img-element -- immagine dello sponsor scelta dalla regia (file caricato o indirizzo https)
    <img className="bc-slot-img" src={item.logo} alt={item.name} referrerPolicy="no-referrer" onError={() => onBroken(item.logo)} />
  ) : (
    <span className="bc-slot-name">{item.name}</span>
  );
  return mode === "live" && item.url ? (
    <a className="bc-slot" data-kind={kind} href={item.url} target="_blank" rel="sponsored noopener noreferrer">
      {body}
    </a>
  ) : (
    <div className="bc-slot" data-kind={kind}>
      {body}
    </div>
  );
}
