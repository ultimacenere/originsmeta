/**
 * I pannelli dell'app per l'estensione Twitch "OriginsMeta Deck tracker" (14/10/2026, Pierluigi: "non possiamo renderlo
 * identico come visuale alla versione del tracker scelto dall'utente?"; scelta della modalità nella configurazione
 * dell'estensione). Si compila con `npm run twitch-panels` in twitch-extension/panels.js (esbuild, non minificato: le
 * regole di Twitch vogliono codice leggibile) e lo usa twitch-extension/overlay.js in modalità "come l'app".
 *
 * Espone `window.OMPanels`: `viewFromState` (lo stato dal vivo di src/lib/tracker/live.ts più la tabella delle carte di
 * /api/twitch/cards/<lingua> → il `DeckTrackerView` dei pannelli dell'app) e `create` (un pannello, il mio mazzo o
 * l'avversario, disegnato con deckRender.ts come nella sorgente per OBS, senza × né maniglia, con la dicitura "non
 * affiliato a Koin Games").
 */
import { parseLiveState, type LiveState } from "../../../src/lib/tracker/live";
import type { DeckCard, DeckTrackerView, PanelTemplate } from "../shared/types";
import { createDeckRenderer, shapeOf, type Lang, type PanelSide } from "./deckRender";
import { BOARD_SLOTS, handGeometry, inside, layoutFor } from "../shared/recognize";

/** [nome, slug, tipo, costo, forza, salute, leggendaria (0/1), testo, immagine] (src/lib/twitchExt/cards.ts) */
type ExtCard = [string, string, string, number | null, number | null, number | null, 0 | 1, string, string | null];
type CardTable = Record<string, ExtCard>;

function deckCard(table: CardTable, key: string, copies: number, drawn: number, played: number): DeckCard {
  const c = table[key];
  return { key, name: c?.[0] ?? key, slug: c?.[1] ?? null, mana: c?.[3] ?? null, spell: c?.[2] === "spell", legendary: c?.[6] === 1, copies, played, drawn };
}

export function viewFromState(s: LiveState, table: CardTable): DeckTrackerView {
  const legKey = s.deck?.legendary ?? null;
  const all = s.deck?.cards ?? [];
  const leg = all.find((c) => c[0] === legKey) ?? null;
  const live = s.live;
  return {
    deck: s.deck
      ? { name: s.deck.name, legendary: leg ? deckCard(table, leg[0], leg[1], leg[2], leg[3]) : null, cards: all.filter((c) => c[0] !== legKey).map((c) => deckCard(table, c[0], c[1], c[2], c[3])) }
      : null,
    record: null,
    scanner: s.ui?.scanner ?? true,
    live: live
      ? {
          inMatch: live.inMatch,
          round: live.round,
          deckLeft: live.deckLeft,
          life: live.life ?? { me: null, opp: null },
          mana: live.mana ?? { me: null, opp: null },
          direction: live.direction ?? null,
          opponent: {
            deckLeft: live.opp.deckLeft,
            legendary: live.opp.legendary ? deckCard(table, live.opp.legendary, 1, 1, 1) : null,
            seen: live.opp.seen.map(([k, n]) => deckCard(table, k, n, n, n)),
          },
        }
      : null,
    custom: s.ui?.custom ?? null,
    hidden: s.ui?.hidden ?? false,
    updatedAt: new Date().toISOString(),
  };
}

/** Un pannello: la radice `.dt` dentro `host`, con le classi della forma sul contenitore (il CSS dell'app le cerca lì). */
export function create(host: HTMLElement, view: PanelSide, lang: Lang, logo: string) {
  const { L, paint } = createDeckRenderer({ view, lang, inWindow: false, logo });
  const root = document.createElement("div");
  root.className = "dt";
  root.setAttribute("aria-label", L.spot(view === "opp"));
  host.appendChild(root);
  root.addEventListener(
    "error",
    (e) => {
      if (e.target instanceof HTMLImageElement) e.target.closest(".cardimg")?.classList.add("noimg");
    },
    true,
  );
  let drawnKey = "";
  let legendaryWasOut = false;
  return {
    root,
    update(layout: PanelTemplate, v: DeckTrackerView) {
      const key = JSON.stringify({ layout, v: { ...v, updatedAt: null } });
      if (key === drawnKey) return;
      drawnKey = key;
      for (const s of ["strips", "columns", "custom"]) host.classList.toggle(`layout-${s}`, shapeOf(layout, view) === s);
      host.classList.toggle("is-opp", view === "opp");
      const leg = v.deck?.legendary ?? null;
      const legOut = Boolean(v.live && leg && leg.drawn >= 1);
      const zoom = view === "me" && legOut && !legendaryWasOut ? " just" : "";
      legendaryWasOut = legOut;
      paint(root, layout, v, zoom);
    },
  };
}

/**
 * I 18 spazi del tabellone sopra il video (14/10/2026, come l'estensione di Hearthstone: chi guarda passa sopra una carta
 * in gioco e la legge): le stesse misure con cui lo scanner legge il tabellone (recognize.ts: area del tabellone di
 * `layoutFor` e `BOARD_SLOTS`), sul rettangolo del video. Vale con il gioco a schermo intero nella ripresa (o una
 * finestra senza bordi grande quanto il video).
 */
export function boardRects(video: { x: number; y: number; w: number; h: number }) {
  const board = layoutFor(video).board;
  return BOARD_SLOTS.map((s) => ({ side: s.side, ...inside(board, s.rect) }));
}

/**
 * Le carte in mano sopra il video (14/10/2026): stessa geometria con cui lo scanner legge la mano (`handGeometry`), dal
 * bordo sinistro di ogni carta fino a quello della carta dopo (le carte si sovrappongono), l'ultima intera.
 */
export function handRects(video: { x: number; y: number; w: number; h: number }, xs: readonly number[]) {
  const g = handGeometry(video);
  return xs.map((x, i) => {
    const left = video.x + x * video.w;
    const next = i + 1 < xs.length ? video.x + xs[i + 1] * video.w : left + g.w;
    return { x: left, y: g.top, w: Math.max(8, Math.min(g.w, next - left)), h: g.h };
  });
}

declare global {
  interface Window {
    OMPanels: { viewFromState: typeof viewFromState; create: typeof create; parseLiveState: typeof parseLiveState; boardRects: typeof boardRects; handRects: typeof handRects };
  }
}
// il controllo dello stato del sito (src/lib/tracker/live.ts), con lo stile dei pannelli
window.OMPanels = { viewFromState, create, parseLiveState, boardRects, handRects };
