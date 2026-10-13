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

export type LiveState = {
  v: typeof LIVE_STATE_VERSION;
  deck: { name: string | null; legendary: string | null; cards: LiveDeckCard[] } | null;
  live: { inMatch: boolean; round: number | null; deckLeft: number | null; opp: { legendary: string | null; deckLeft: number | null; seen: LiveSeenCard[] } } | null;
};

/** La forma minima del pannello del mazzo dell'app (tracker/src/shared/types.ts, `DeckTrackerView`). */
type ViewCard = { key: string; copies: number; drawn: number; played: number };
export type LiveSource = {
  deck: { name: string | null; legendary: ViewCard | null; cards: ViewCard[] } | null;
  live: { inMatch: boolean; round: number | null; deckLeft: number | null; opponent: { deckLeft: number | null; legendary: ViewCard | null; seen: ViewCard[] } } | null;
};

const clean = (s: string | null | undefined): string | null => {
  const t = (s ?? "").replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, "").trim().slice(0, LIVE_LIMITS.name);
  return t || null;
};
const int = (n: unknown, min: number, max: number): n is number => Number.isInteger(n) && (n as number) >= min && (n as number) <= max;

/** Lo stato da mandare, dal pannello del mazzo dell'app. */
export function liveStateOf(view: LiveSource): LiveState {
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
        }
      : null,
  };
}

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
  }
  return { v: LIVE_STATE_VERSION, deck, live };
}

/** Il messaggio di Extension PubSub per gli spettatori: lo stato con l'ora, sotto i 5 KB di Twitch. */
export const PUBSUB_MAX_BYTES = 5 * 1024;
export function pubsubMessage(state: LiveState, at: string): string | null {
  const msg = JSON.stringify({ t: "state", at, s: state });
  return new TextEncoder().encode(msg).length <= PUBSUB_MAX_BYTES ? msg : null;
}
