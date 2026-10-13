/**
 * Lo stato dal vivo che l'app OriginsMeta Tracker manda al sito durante la partita, per l'estensione Twitch "Deck
 * tracker" (13/10/2026, richiesta degli streamer riportata da Pierluigi: "l'integrazione con Twitch che permetta agli
 * utenti di interagire con il deck per leggersi le carte live"; docs/twitch.md). Funzioni pure, usate dall'app
 * (`liveStateOf`, dal pannello del mazzo) e dal sito (`parseLiveState`, che controlla la forma prima di salvarlo e di
 * inoltrarlo agli spettatori).
 *
 * Contiene solo quello che lo streamer mostra già in diretta col Deck tracker: il suo mazzo (chiavi delle carte e copie
 * pescate e giocate), il round, la Leggendaria dell'avversario e le carte che ha rivelato. Mai nomi né id di giocatori
 * o partite, mai il rank, mai se l'avversario è un bot (regole del tracker). Le carte sono chiavi del gioco: nomi,
 * testi e immagini li prende l'estensione dal sito.
 */

const KEY_RE = /^C\d{5}_[A-Z]{2}$/;
export const LIVE_STATE_VERSION = 1;
/** Un mazzo ha 13 carte diverse; le carte viste dell'avversario restano sotto questo tetto (5 KB di PubSub). */
export const LIVE_LIMITS = { deckCards: 13, seen: 30, name: 40, copies: 3 } as const;

/** [chiave, copie nel mazzo, pescate, giocate] */
export type LiveDeckCard = [string, number, number, number];
/** [chiave, copie viste] */
export type LiveSeenCard = [string, number];

export type LiveMana = { current: number; max: number } | null;
/**
 * Lo stile dei pannelli dell'app (14/10/2026, Pierluigi: "non possiamo renderlo identico come visuale alla versione del
 * tracker scelto dall'utente?"): template, opzioni del personalizzato, pannelli nascosti fuori partita, scanner acceso,
 * misure dello schermo e posizione dei due pannelli in pixel dello schermo (punti di Windows). Con l'estensione in
 * modalità "come l'app" i pannelli si disegnano sopra il video negli stessi punti. Facoltativo: le app 0.4.2 non lo mandano.
 */
export const LIVE_TEMPLATES = ["classic", "strips", "columns", "custom"] as const;
export type LiveTemplate = (typeof LIVE_TEMPLATES)[number];
export type LiveCustom = {
  orientation: "vertical" | "horizontal";
  cards: "art" | "names";
  perRow: number;
  opacity: number;
  hideOut: boolean;
  me: { legendary: boolean; deckLeft: boolean; life: boolean };
  opp: { legendary: boolean; deckLeft: boolean; life: boolean; mana: boolean };
};
export type LiveRect = { x: number; y: number; w: number; h: number };
export type LiveUi = { template: LiveTemplate; custom: LiveCustom | null; hidden: boolean; scanner: boolean; screen: { w: number; h: number }; panels: { deck: LiveRect | null; opp: LiveRect | null } };

export type LiveState = {
  v: typeof LIVE_STATE_VERSION;
  deck: { name: string | null; legendary: string | null; cards: LiveDeckCard[] } | null;
  live: {
    inMatch: boolean;
    round: number | null;
    deckLeft: number | null;
    opp: { legendary: string | null; deckLeft: number | null; seen: LiveSeenCard[] };
    /** dal 14/10/2026 (app 0.4.3): vita, mana dei due e verso del combattimento, per i pannelli "come l'app" */
    life?: { me: number | null; opp: number | null };
    mana?: { me: LiveMana; opp: LiveMana };
    direction?: "left" | "right" | null;
  } | null;
  ui?: LiveUi;
};

/** La forma minima del pannello del mazzo dell'app (tracker/src/shared/types.ts, `DeckTrackerView`). */
type ViewCard = { key: string; copies: number; drawn: number; played: number };
export type LiveSource = {
  deck: { name: string | null; legendary: ViewCard | null; cards: ViewCard[] } | null;
  live: {
    inMatch: boolean;
    round: number | null;
    deckLeft: number | null;
    opponent: { deckLeft: number | null; legendary: ViewCard | null; seen: ViewCard[] };
    life?: { me: number | null; opp: number | null };
    mana?: { me: LiveMana; opp: LiveMana };
    direction?: "left" | "right" | null;
  } | null;
};

const clean = (s: string | null | undefined): string | null => {
  const t = (s ?? "").replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, "").trim().slice(0, LIVE_LIMITS.name);
  return t || null;
};
const int = (n: unknown, min: number, max: number): n is number => Number.isInteger(n) && (n as number) >= min && (n as number) <= max;

/** Lo stato da mandare, dal pannello del mazzo dell'app (con lo stile dei pannelli, se c'è). */
export function liveStateOf(view: LiveSource, ui?: LiveUi | null): LiveState {
  const card = (c: ViewCard): LiveDeckCard => [c.key, c.copies, c.drawn, c.played];
  const deck = view.deck
    ? { name: clean(view.deck.name), legendary: view.deck.legendary?.key ?? null, cards: [...(view.deck.legendary ? [view.deck.legendary] : []), ...view.deck.cards].slice(0, LIVE_LIMITS.deckCards).map(card) }
    : null;
  const l = view.live;
  return {
    v: LIVE_STATE_VERSION,
    deck,
    live: l
      ? {
          inMatch: l.inMatch,
          round: l.round,
          deckLeft: l.deckLeft,
          opp: { legendary: l.opponent.legendary?.key ?? null, deckLeft: l.opponent.deckLeft, seen: l.opponent.seen.slice(0, LIVE_LIMITS.seen).map((c) => [c.key, c.copies] as LiveSeenCard) },
          ...(l.life ? { life: { me: l.life.me, opp: l.life.opp } } : {}),
          ...(l.mana ? { mana: { me: l.mana.me ? { current: l.mana.me.current, max: l.mana.me.max } : null, opp: l.mana.opp ? { current: l.mana.opp.current, max: l.mana.opp.max } : null } } : {}),
          ...(l.direction !== undefined ? { direction: l.direction } : {}),
        }
      : null,
    ...(ui ? { ui } : {}),
  };
}

const bool = (b: unknown): b is boolean => typeof b === "boolean";

/** Le opzioni del personalizzato, se hanno la forma attesa (come `readCustom` dell'app). */
function readLiveCustom(raw: unknown): LiveCustom | null {
  const c = raw as Record<string, unknown> | null;
  if (!c || typeof c !== "object") return null;
  const me = c.me as Record<string, unknown> | null;
  const opp = c.opp as Record<string, unknown> | null;
  if (c.orientation !== "vertical" && c.orientation !== "horizontal") return null;
  if (c.cards !== "art" && c.cards !== "names") return null;
  if (!int(c.perRow, 1, 13) || !int(c.opacity, 0, 100) || !bool(c.hideOut)) return null;
  if (!me || typeof me !== "object" || !bool(me.legendary) || !bool(me.deckLeft) || !bool(me.life)) return null;
  if (!opp || typeof opp !== "object" || !bool(opp.legendary) || !bool(opp.deckLeft) || !bool(opp.life) || !bool(opp.mana)) return null;
  return {
    orientation: c.orientation,
    cards: c.cards,
    perRow: c.perRow,
    opacity: c.opacity,
    hideOut: c.hideOut,
    me: { legendary: me.legendary, deckLeft: me.deckLeft, life: me.life },
    opp: { legendary: opp.legendary, deckLeft: opp.deckLeft, life: opp.life, mana: opp.mana },
  };
}

const readRect = (raw: unknown): LiveRect | null => {
  const r = raw as Record<string, unknown> | null;
  return r && typeof r === "object" && int(r.x, -20000, 40000) && int(r.y, -20000, 40000) && int(r.w, 1, 20000) && int(r.h, 1, 20000) ? { x: r.x, y: r.y, w: r.w, h: r.h } : null;
};

/** Lo stile dei pannelli, se ha la forma attesa; altrimenti niente (l'estensione usa la sua linguetta). */
function readLiveUi(raw: unknown): LiveUi | null {
  const u = raw as Record<string, unknown> | null;
  if (!u || typeof u !== "object" || !LIVE_TEMPLATES.includes(u.template as LiveTemplate) || !bool(u.hidden) || !bool(u.scanner)) return null;
  const screen = u.screen as Record<string, unknown> | null;
  if (!screen || typeof screen !== "object" || !int(screen.w, 100, 20000) || !int(screen.h, 100, 20000)) return null;
  const panels = u.panels as Record<string, unknown> | null;
  if (!panels || typeof panels !== "object") return null;
  const custom = u.custom === null ? null : readLiveCustom(u.custom);
  if (u.custom !== null && !custom) return null;
  return { template: u.template as LiveTemplate, custom, hidden: u.hidden, scanner: u.scanner, screen: { w: screen.w, h: screen.h }, panels: { deck: readRect(panels.deck), opp: readRect(panels.opp) } };
}

const readMana = (raw: unknown): LiveMana | undefined => {
  if (raw === null) return null;
  const m = raw as Record<string, unknown> | undefined;
  return m && typeof m === "object" && int(m.max, 1, 20) && int(m.current, 0, m.max as number) ? { current: m.current, max: m.max } : undefined;
};
const lifeOk = (n: unknown): n is number | null => n === null || int(n, 0, 2);

/** Lo stato arrivato dall'app, se ha la forma attesa (altrimenti null): il sito lo salva e lo inoltra così com'è. */
export function parseLiveState(raw: unknown): LiveState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  if (s.v !== LIVE_STATE_VERSION) return null;
  const key = (k: unknown): k is string => typeof k === "string" && KEY_RE.test(k);
  let deck: LiveState["deck"] = null;
  if (s.deck !== null) {
    const d = s.deck as Record<string, unknown> | undefined;
    if (!d || typeof d !== "object" || !Array.isArray(d.cards) || d.cards.length > LIVE_LIMITS.deckCards) return null;
    if (d.name !== null && typeof d.name !== "string") return null;
    if (d.legendary !== null && !key(d.legendary)) return null;
    const cards: LiveDeckCard[] = [];
    for (const c of d.cards) {
      if (!Array.isArray(c) || c.length !== 4 || !key(c[0]) || !int(c[1], 0, LIVE_LIMITS.copies) || !int(c[2], 0, LIVE_LIMITS.copies) || !int(c[3], 0, LIVE_LIMITS.copies)) return null;
      cards.push([c[0], c[1], c[2], c[3]]);
    }
    deck = { name: clean(d.name as string | null), legendary: (d.legendary as string | null) ?? null, cards };
  }
  let live: LiveState["live"] = null;
  if (s.live !== null) {
    const l = s.live as Record<string, unknown> | undefined;
    if (!l || typeof l !== "object" || typeof l.inMatch !== "boolean") return null;
    if (l.round !== null && !int(l.round, 0, 50)) return null;
    if (l.deckLeft !== null && !int(l.deckLeft, 0, 60)) return null;
    const o = l.opp as Record<string, unknown> | undefined;
    if (!o || typeof o !== "object" || !Array.isArray(o.seen) || o.seen.length > LIVE_LIMITS.seen) return null;
    if (o.legendary !== null && !key(o.legendary)) return null;
    if (o.deckLeft !== null && !int(o.deckLeft, 0, 60)) return null;
    const seen: LiveSeenCard[] = [];
    for (const c of o.seen) {
      if (!Array.isArray(c) || c.length !== 2 || !key(c[0]) || !int(c[1], 1, 20)) return null;
      seen.push([c[0], c[1]]);
    }
    live = { inMatch: l.inMatch, round: l.round as number | null, deckLeft: l.deckLeft as number | null, opp: { legendary: o.legendary as string | null, deckLeft: o.deckLeft as number | null, seen } };
    // i campi del 14/10/2026: facoltativi, e se non hanno la forma attesa si lasciano fuori
    const life = l.life as Record<string, unknown> | undefined;
    if (life && typeof life === "object" && lifeOk(life.me) && lifeOk(life.opp)) live.life = { me: life.me, opp: life.opp };
    const mana = l.mana as Record<string, unknown> | undefined;
    if (mana && typeof mana === "object") {
      const me = readMana(mana.me);
      const opp = readMana(mana.opp);
      if (me !== undefined && opp !== undefined) live.mana = { me, opp };
    }
    if (l.direction === "left" || l.direction === "right" || l.direction === null) live.direction = l.direction;
  }
  const ui = s.ui === undefined ? null : readLiveUi(s.ui);
  return { v: LIVE_STATE_VERSION, deck, live, ...(ui ? { ui } : {}) };
}

/** Il messaggio di Extension PubSub per gli spettatori: lo stato con l'ora, sotto i 5 KB di Twitch. */
export const PUBSUB_MAX_BYTES = 5 * 1024;
export function pubsubMessage(state: LiveState, at: string): string | null {
  const msg = JSON.stringify({ t: "state", at, s: state });
  return new TextEncoder().encode(msg).length <= PUBSUB_MAX_BYTES ? msg : null;
}
