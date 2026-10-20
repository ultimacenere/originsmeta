/**
 * Broadcasting OM (prototipo del 16/10/2026, nota Granola "tool broadcaster" e mockup di Pierluigi): l'overlay per le
 * dirette dei tornei, separato da OriginsMeta Tracker e dall'estensione Twitch del Deck tracker. Lo usa chi trasmette
 * il torneo (la regia, /broadcast) e lo guarda il pubblico (/broadcast/live, sorgente per OBS): nome e numero del
 * torneo, punteggio della serie, i due giocatori con i loro mazzi (Mazzo 1, 2, 3 del Conquest), la lista del mazzo in
 * campo con le copie rimaste e il tasto "Copia mazzo" (codice del gioco).
 *
 * Qui solo regole pure, senza database né DOM, con test in `state.test.ts`: forma dello stato, pulizia di quello che
 * arriva da un indirizzo o da un'altra finestra, codifica compatta per l'indirizzo dell'overlay, punteggio, copie.
 * Lo stato porta solo gli slug delle carte: nomi, costi e immagini li mette il catalogo (`catalog.ts`) quando si
 * disegna, così l'indirizzo per OBS resta corto.
 */

export const BROADCAST_LANGS = ["en", "it", "es", "fr", "pt", "de", "ru"] as const;
export type BroadcastLang = (typeof BROADCAST_LANGS)[number];

export const BEST_OF = [1, 3, 5] as const;
export type BroadcastBestOf = (typeof BEST_OF)[number];

/** Mazzi per giocatore: il Conquest ne vuole 3, il Tournament Organizer ne ammette da 2 a 4. */
export const MAX_DECKS = 4;
/** Carte base di un mazzo (ognuna in 2 copie) più la Leggendaria: 1 + 12 × 2 = 25. */
export const BASE_CARDS = 12;
export const BASE_COPIES = 2;

export const LIMITS = { player: 24, title: 40, tournament: 40, number: 12, tag: 12, phase: 28, sponsor: 32, url: 300 } as const;

/**
 * Sponsor (idea di Davdas del 19/10/2026; dal 19/10 sera, Pierluigi: "deve apparire in alternanza dove c'è lo score,
 * 20 secondi lo score e 7 secondi lo sponsor"): fino a 3, uno per volta al posto del punteggio, a giro.
 */
export const MAX_SPONSORS = 3;
export const SPONSOR_SECONDS = { min: 3, max: 60, default: 7 } as const;
export const SCORE_SECONDS = { min: 5, max: 120, default: 20 } as const;

export type ListSide = "left" | "right" | "off";

/** Un mazzo: Leggendaria, 12 carte base, copie già giocate (slug → quante) e un nome facoltativo. */
export type BroadcastDeck = { name: string; legendary: string | null; cards: string[]; played: Record<string, number> };

export type BroadcastPlayer = {
  name: string;
  /** riga sotto il nome (team, titolo, "Seed #1"): facoltativa */
  title: string;
  score: number;
  decks: BroadcastDeck[];
  /** indice del mazzo in campo */
  active: number;
  /** dove sta la lista del mazzo in campo: colonna a sinistra, a destra o nascosta */
  list: ListSide;
};

/**
 * Formati dell'immagine di uno sponsor (19/10/2026, Pierluigi: "la possibilità con misure esplicite del caricamento di
 * un logo dello sponsor o un bannerino"). Lo sponsor prende il posto del punteggio, un riquadro fisso di 332 × 128 px
 * sul palco di 1920 × 1080: tolta la cornice restano 326 × 122 px. Niente scritta "Sponsor": solo il logo, solo il
 * bannerino o solo il nome.
 * - logo: intero, mai tagliato, dentro 306 × 102 px (il riquadro meno il margine); si carica fino a 612 × 204 (il
 *   doppio, nitido anche sugli schermi densi), almeno 306 px di larghezza o 102 di altezza; PNG trasparente consigliato.
 * - banner: riempie tutto il riquadro, 326 × 122 px; si carica a 652 × 244 (il doppio), almeno 326 × 122, e
 *   un'immagine in altre proporzioni si ritaglia al centro.
 */
export const SPONSOR_FORMATS = {
  logo: { width: 612, height: 204, shown: { width: 306, height: 102 } },
  banner: { width: 652, height: 244, shown: { width: 326, height: 122 } },
} as const;
export type SponsorKind = keyof typeof SPONSOR_FORMATS;
/** Peso massimo di un file scelto dal computer, prima della ricodifica. */
export const SPONSOR_FILE_MAX_BYTES = 2 * 1024 * 1024;
/** Peso massimo dell'immagine ricodificata (WebP o JPEG), che viaggia nello stato come data URL. */
export const SPONSOR_IMAGE_MAX_BYTES = 140 * 1024;
const SPONSOR_DATA_MAX = Math.ceil((SPONSOR_IMAGE_MAX_BYTES * 4) / 3) + 40;
const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Uno sponsor: nome, immagine (logo o bannerino: indirizzo https o file caricato dalla regia, che resta nel browser come
 * data URL) e sito (https, facoltativo: cliccabile dal pubblico).
 */
export type BroadcastSponsor = { name: string; kind: SponsorKind; logo: string; url: string };

/**
 * Lo spazio sponsor: spento di default, si accende dalla regia quando il torneo ha degli sponsor. `scoreSeconds` è il
 * tempo del punteggio, `seconds` quello di ogni sponsor.
 */
export type BroadcastSponsors = { on: boolean; scoreSeconds: number; seconds: number; items: BroadcastSponsor[] };

export const emptySponsor = (): BroadcastSponsor => ({ name: "", kind: "logo", logo: "", url: "" });

export type BroadcastTournament = { name: string; number: string; tag: string; phase: string; bestOf: BroadcastBestOf };

export type BroadcastState = {
  v: 1;
  lang: BroadcastLang;
  tournament: BroadcastTournament;
  /** [0] = il giocatore in alto nella schermata del gioco, [1] = quello in basso */
  players: [BroadcastPlayer, BroadcastPlayer];
  sponsors: BroadcastSponsors;
};

export const emptyDeck = (): BroadcastDeck => ({ name: "", legendary: null, cards: [], played: {} });

export function emptyPlayer(list: ListSide): BroadcastPlayer {
  return { name: "", title: "", score: 0, decks: [emptyDeck(), emptyDeck(), emptyDeck()], active: 0, list };
}

export function emptyState(lang: BroadcastLang = "en"): BroadcastState {
  return {
    v: 1,
    lang,
    tournament: { name: "", number: "", tag: "", phase: "", bestOf: 3 },
    // come il mockup: la lista del giocatore in alto a destra, quella del giocatore in basso a sinistra
    players: [emptyPlayer("right"), emptyPlayer("left")],
    sponsors: { on: false, scoreSeconds: SCORE_SECONDS.default, seconds: SPONSOR_SECONDS.default, items: [emptySponsor()] },
  };
}

/* ---------------- punteggio ---------------- */

/** Vittorie che chiudono la serie: 1 su Bo1, 2 su Bo3, 3 su Bo5. */
export function winsNeeded(bestOf: BroadcastBestOf): number {
  return Math.floor(bestOf / 2) + 1;
}

/** Punteggio fra 0 e le vittorie che chiudono la serie. */
export function clampScore(score: unknown, bestOf: BroadcastBestOf): number {
  const n = typeof score === "number" && Number.isFinite(score) ? Math.trunc(score) : 0;
  return Math.min(Math.max(n, 0), winsNeeded(bestOf));
}

/** Chi ha vinto la serie (0 o 1), o null se è ancora aperta. Se i due punteggi chiudono tutti e due, nessuno. */
export function seriesWinner(state: Pick<BroadcastState, "tournament" | "players">): 0 | 1 | null {
  const need = winsNeeded(state.tournament.bestOf);
  const a = state.players[0].score >= need;
  const b = state.players[1].score >= need;
  if (a === b) return null;
  return a ? 0 : 1;
}

/** Punteggio dopo un clic su + o −: la serie chiusa non va oltre le vittorie necessarie. */
export function bumpScore(state: BroadcastState, player: 0 | 1, delta: 1 | -1): BroadcastState {
  const players = [...state.players] as BroadcastState["players"];
  players[player] = { ...players[player], score: clampScore(players[player].score + delta, state.tournament.bestOf) };
  return { ...state, players };
}

/* ---------------- copie ---------------- */

/** Copie nel mazzo: 1 per la Leggendaria, 2 per le carte base, 0 per una carta che il mazzo non ha. */
export function copiesOf(deck: BroadcastDeck, slug: string): number {
  if (deck.legendary === slug) return 1;
  return deck.cards.includes(slug) ? BASE_COPIES : 0;
}

/** Copie ancora nel mazzo (non giocate). */
export function copiesLeft(deck: BroadcastDeck, slug: string): number {
  return Math.max(copiesOf(deck, slug) - (deck.played[slug] ?? 0), 0);
}

/** Segna una copia giocata (+1) o rimessa nel mazzo (−1), sempre fra 0 e le copie della carta. */
export function markPlayed(deck: BroadcastDeck, slug: string, delta: 1 | -1): BroadcastDeck {
  const total = copiesOf(deck, slug);
  if (!total) return deck;
  const next = Math.min(Math.max((deck.played[slug] ?? 0) + delta, 0), total);
  const played = { ...deck.played };
  if (next) played[slug] = next;
  else delete played[slug];
  return { ...deck, played };
}

/** Un clic sulla riga in regia: toglie una copia; quando sono finite, il clic rimette tutte le copie. */
export function cyclePlayed(deck: BroadcastDeck, slug: string): BroadcastDeck {
  if (!copiesOf(deck, slug)) return deck;
  if (copiesLeft(deck, slug) > 0) return markPlayed(deck, slug, 1);
  const played = { ...deck.played };
  delete played[slug];
  return { ...deck, played };
}

/* ---------------- pulizia ---------------- */

const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;

/** Testo semplice, una riga, senza caratteri invisibili, tagliato al massimo. */
export function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return [...raw.slice(0, max * 4).replace(CONTROL, " ").replace(/\s+/g, " ").trim()].slice(0, max).join("").trim();
}

function cleanDeck(raw: unknown, isCard: (slug: string) => boolean): BroadcastDeck {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const legendary = typeof r.legendary === "string" && isCard(r.legendary) ? r.legendary : null;
  const seen = new Set<string>();
  const cards: string[] = [];
  for (const s of Array.isArray(r.cards) ? r.cards : []) {
    if (cards.length >= BASE_CARDS) break;
    if (typeof s !== "string" || s === legendary || seen.has(s) || !isCard(s)) continue;
    seen.add(s);
    cards.push(s);
  }
  const deck: BroadcastDeck = { name: cleanText(r.name, LIMITS.player), legendary, cards, played: {} };
  const played = (r.played && typeof r.played === "object" ? r.played : {}) as Record<string, unknown>;
  for (const [slug, n] of Object.entries(played)) {
    const total = copiesOf(deck, slug);
    if (!total || typeof n !== "number" || !Number.isFinite(n)) continue;
    const v = Math.min(Math.max(Math.trunc(n), 0), total);
    if (v) deck.played[slug] = v;
  }
  return deck;
}

function cleanPlayer(raw: unknown, isCard: (slug: string) => boolean, bestOf: BroadcastBestOf, fallbackSide: ListSide): BroadcastPlayer {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const decks = (Array.isArray(r.decks) ? r.decks : []).slice(0, MAX_DECKS).map((d) => cleanDeck(d, isCard));
  if (!decks.length) decks.push(emptyDeck());
  const active = typeof r.active === "number" && Number.isInteger(r.active) && r.active >= 0 && r.active < decks.length ? r.active : 0;
  const list: ListSide = r.list === "left" || r.list === "right" || r.list === "off" ? r.list : fallbackSide;
  return { name: cleanText(r.name, LIMITS.player), title: cleanText(r.title, LIMITS.title), score: clampScore(r.score, bestOf), decks, active, list };
}

/** Indirizzo https pulito (logo o sito di uno sponsor), oppure "": mai altri protocolli, credenziali o spazi. */
export function cleanUrl(raw: unknown, max: number = LIMITS.url): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t || t.length > max) return "";
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) return "";
    return u.toString().length > max ? "" : u.toString();
  } catch {
    return "";
  }
}

/** Un'immagine caricata dalla regia (data URL di un PNG, JPEG o WebP entro il peso massimo)? */
export function isUploadedImage(src: string): boolean {
  return src.startsWith("data:");
}

/** Immagine di uno sponsor pulita: data URL di un'immagine raster entro il peso massimo, o indirizzo https; altrimenti "". */
export function cleanImage(raw: unknown): string {
  if (typeof raw !== "string") return "";
  if (raw.startsWith("data:")) return raw.length <= SPONSOR_DATA_MAX && DATA_IMAGE.test(raw) ? raw : "";
  return cleanUrl(raw);
}

function cleanSponsors(raw: unknown): BroadcastSponsors {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const items = (Array.isArray(r.items) ? r.items : []).slice(0, MAX_SPONSORS).map((x) => {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    return { name: cleanText(o.name, LIMITS.sponsor), kind: o.kind === "banner" ? ("banner" as const) : ("logo" as const), logo: cleanImage(o.logo), url: cleanUrl(o.url) };
  });
  const secs = (v: unknown, lim: { min: number; max: number; default: number }) =>
    Math.min(Math.max(typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : lim.default, lim.min), lim.max);
  return {
    on: r.on === true,
    scoreSeconds: secs(r.scoreSeconds, SCORE_SECONDS),
    seconds: secs(r.seconds, SPONSOR_SECONDS),
    items: items.length ? items : [emptySponsor()],
  };
}

/** Gli sponsor da mostrare: solo con lo spazio acceso e almeno un nome o un logo. */
export function visibleSponsors(s: BroadcastSponsors): BroadcastSponsor[] {
  return s.on ? s.items.filter((x) => x.name || x.logo) : [];
}

/**
 * Il giro del riquadro del punteggio: il passo 0 è il punteggio, il 1 il primo sponsor, il 2 di nuovo il punteggio, il
 * 3 il secondo sponsor, e così via (con un solo sponsor sempre lui). Senza sponsor da mostrare, sempre il punteggio.
 */
export type ScoreSlot = { show: "score" } | { show: "sponsor"; index: number };

export function scoreSlot(step: number, sponsorCount: number): ScoreSlot {
  if (sponsorCount < 1 || step % 2 === 0) return { show: "score" };
  return { show: "sponsor", index: Math.floor(step / 2) % sponsorCount };
}

/** Quanto resta in onda il passo: i secondi del punteggio o quelli dello sponsor. */
export function slotSeconds(step: number, sponsors: Pick<BroadcastSponsors, "scoreSeconds" | "seconds">, sponsorCount: number): number {
  return scoreSlot(step, sponsorCount).show === "score" ? sponsors.scoreSeconds : sponsors.seconds;
}

/** Stato pulito da qualunque cosa (indirizzo, altra finestra, risposta di rete): mai un errore, al peggio lo stato vuoto. */
export function sanitizeState(raw: unknown, isCard: (slug: string) => boolean): BroadcastState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const t = (r.tournament && typeof r.tournament === "object" ? r.tournament : {}) as Record<string, unknown>;
  const bestOf: BroadcastBestOf = t.bestOf === 1 || t.bestOf === 5 ? t.bestOf : 3;
  const lang: BroadcastLang = (BROADCAST_LANGS as readonly unknown[]).includes(r.lang) ? (r.lang as BroadcastLang) : "en";
  const p = Array.isArray(r.players) ? r.players : [];
  return {
    v: 1,
    lang,
    tournament: {
      name: cleanText(t.name, LIMITS.tournament),
      number: cleanText(t.number, LIMITS.number),
      tag: cleanText(t.tag, LIMITS.tag).toUpperCase(),
      phase: cleanText(t.phase, LIMITS.phase),
      bestOf,
    },
    players: [cleanPlayer(p[0], isCard, bestOf, "right"), cleanPlayer(p[1], isCard, bestOf, "left")],
    sponsors: cleanSponsors(r.sponsors),
  };
}

/* ---------------- codifica per l'indirizzo ---------------- */

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** Prefisso del formato: se cambia la forma dello stato, si passa a B2 e si legge ancora B1. */
export const STATE_PREFIX = "B1.";
/** Tetto all'indirizzo: due giocatori con 4 mazzi pieni stanno sotto i 4.000 caratteri. */
export const STATE_MAX = 8000;
/**
 * Tetto allo stato che passa nel browser (localStorage e canale fra regia e overlay): può portare le immagini caricate
 * degli sponsor, che nell'indirizzo non entrano (`withoutUploads`).
 */
export const STORED_STATE_MAX = 900_000;

/** Stato → testo per l'indirizzo dell'overlay (#s=…) o per il browser. */
export function encodeState(state: BroadcastState): string {
  return STATE_PREFIX + toBase64Url(JSON.stringify(state));
}

/** Lo stato senza le immagini caricate dal computer (per l'indirizzo: resta il nome dello sponsor). */
export function withoutUploads(state: BroadcastState): BroadcastState {
  if (!state.sponsors.items.some((x) => isUploadedImage(x.logo))) return state;
  return { ...state, sponsors: { ...state.sponsors, items: state.sponsors.items.map((x) => (isUploadedImage(x.logo) ? { ...x, logo: "" } : x)) } };
}

/** Lo stato del browser quando l'indirizzo è la stessa diretta senza le immagini: si tiene quello del browser, che le ha. */
export function preferStored(fromUrl: BroadcastState | null, stored: BroadcastState | null): BroadcastState | null {
  if (!fromUrl) return stored;
  if (stored && encodeState(withoutUploads(stored)) === encodeState(fromUrl)) return stored;
  return fromUrl;
}

/** Testo dell'indirizzo (o del browser, con `max` = STORED_STATE_MAX) → stato pulito, o null se non è un nostro stato. */
export function decodeState(raw: string | null | undefined, isCard: (slug: string) => boolean, max: number = STATE_MAX): BroadcastState | null {
  const s = (raw ?? "").trim();
  if (!s.startsWith(STATE_PREFIX) || s.length > max) return null;
  try {
    return sanitizeState(JSON.parse(fromBase64Url(s.slice(STATE_PREFIX.length))), isCard);
  } catch {
    return null;
  }
}

/** Il valore di `s` nell'hash dell'indirizzo (#s=B1.…), o null. */
export function stateFromHash(hash: string): string | null {
  const h = hash.replace(/^#/, "");
  for (const part of h.split("&")) {
    const [k, ...v] = part.split("=");
    if (k === "s") return v.join("=");
  }
  return null;
}

/* ---------------- mazzi da codici e tornei ---------------- */

/**
 * Mazzo dalle chiavi ufficiali di un codice del gioco (KGBLDC…): la Leggendaria a parte, le altre carte nell'ordine del
 * codice; `unknown` conta le chiavi che il nostro database non conosce (carte che non si possono mostrare).
 */
export function deckFromKeys(keys: readonly string[], bySlugKey: (baseKey: string) => { slug: string; legendary: boolean } | undefined): { deck: BroadcastDeck; unknown: number } {
  const deck = emptyDeck();
  let unknown = 0;
  for (const raw of keys) {
    const card = bySlugKey(raw.replace(/_V\d+$/, ""));
    if (!card) {
      unknown++;
      continue;
    }
    if (card.legendary) {
      if (!deck.legendary) deck.legendary = card.slug;
    } else if (!deck.cards.includes(card.slug) && deck.cards.length < BASE_CARDS) deck.cards.push(card.slug);
  }
  return { deck, unknown };
}

/** Nome della fase dal turno del tabellone: finale, semifinale, quarti, altrimenti "Turno N". */
export type PhaseLabels = { final: string; semi: string; quarter: string; round: string };

export function phaseOf(round: number, totalRounds: number, labels: PhaseLabels): string {
  if (totalRounds > 0 && round === totalRounds) return labels.final;
  if (totalRounds > 1 && round === totalRounds - 1) return labels.semi;
  if (totalRounds > 2 && round === totalRounds - 2) return labels.quarter;
  return labels.round.replace("{n}", String(round));
}

/** Risposta di /api/broadcast/tournament: il torneo come lo usa la regia (nessun dato personale oltre al nome mostrato). */
export type BroadcastTournamentResponse = {
  name: string;
  tag: string;
  bestOf: number;
  finalBestOf: number | null;
  totalRounds: number;
  players: { id: string; name: string }[];
  matches: { id: string; round: number; position: number; a: string | null; b: string | null; scoreA: number | null; scoreB: number | null; status: string }[];
  decks: Record<string, { name: string; legendary: string | null; cards: string[] }[]>;
};
