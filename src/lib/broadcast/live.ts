import type { BroadcastBestOf, BroadcastDeck, BroadcastState } from "./state";

/**
 * Broadcasting OM "in diretta dal sito" (05/11/2026, Pierluigi: "Estensione Twitch"): la regia salva lo stato sul sito
 * (una diretta per account, tabella broadcast_lives) e da lì lo leggono l'overlay di OBS (`/broadcast/live?id=…`, su
 * qualunque PC) e l'estensione Twitch di Broadcasting OM (cartella `twitch-broadcast/`, con l'Extension PubSub).
 * Serve perché in OBS il pannello (dock) della regia e la fonte browser dell'overlay hanno due profili del browser
 * separati (verificato il 05/11/2026 nella cartella di obs-browser: `obs_profile_cookies/<id>` con il suo Local Storage
 * per i pannelli, quello della radice per le fonti): il canale del browser e il localStorage del prototipo non passano.
 *
 * Qui solo regole pure, senza database né DOM (test in `live.test.ts`): id della diretta, immagini degli sponsor
 * caricate (sul sito viaggiano a parte, l'overlay le prende dall'impronta), lo stato compatto per l'estensione e il
 * messaggio dell'Extension PubSub (5 KB al massimo, regola di Twitch).
 */

/** Id pubblico di una diretta (nell'indirizzo dell'overlay per OBS): 12 lettere minuscole e cifre. */
export const LIVE_ID_RE = /^[a-z0-9]{12}$/;
/** Impronta sha256 (esadecimale) di un'immagine caricata. */
export const IMAGE_HASH_RE = /^[0-9a-f]{64}$/;
/** Nello stato salvato sul sito un'immagine caricata è "om:<impronta>" invece del data URL. */
export const IMAGE_REF_PREFIX = "om:";
/** Tetto allo stato salvato sul sito, uguale al vincolo di broadcast_lives (byte del JSON). */
export const LIVE_STATE_MAX = 8192;
/** Tetto a un'immagine caricata (caratteri del data URL), uguale al vincolo di broadcast_images. */
export const LIVE_IMAGE_MAX = 200_000;
const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** La regia salva al massimo una volta ogni tanto (millisecondi): una modifica dopo l'altra diventa un salvataggio solo. */
export const LIVE_SAVE_EVERY_MS = 1000;
/** L'overlay di OBS rilegge lo stato ogni tanto (millisecondi). */
export const LIVE_POLL_MS = 1500;

export function isLiveId(id: unknown): id is string {
  return typeof id === "string" && LIVE_ID_RE.test(id);
}

/** Un data URL di immagine raster che il sito accetta per la diretta. */
export function isLiveImageData(src: unknown): src is string {
  return typeof src === "string" && src.length <= LIVE_IMAGE_MAX && DATA_IMAGE.test(src);
}

export function imageRef(hash: string): string {
  return IMAGE_REF_PREFIX + hash;
}

/** L'impronta di un riferimento "om:<impronta>", altrimenti null. */
export function refHash(src: string): string | null {
  if (!src.startsWith(IMAGE_REF_PREFIX)) return null;
  const h = src.slice(IMAGE_REF_PREFIX.length);
  return IMAGE_HASH_RE.test(h) ? h : null;
}

/** sha256 esadecimale di un testo (Web Crypto: browser e Node). È anche l'impronta che calcola il database. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** I data URL delle immagini caricate dalla regia (logo o bannerino degli sponsor), senza doppioni. */
export function uploadedImages(state: BroadcastState): string[] {
  return [...new Set(state.sponsors.items.map((x) => x.logo).filter((src) => src.startsWith("data:")))];
}

/**
 * Lo stato da salvare sul sito: ogni immagine caricata diventa "om:<impronta>" (le immagini si caricano a parte,
 * una volta). Un'immagine di cui non si conosce l'impronta si toglie: resta il nome dello sponsor.
 */
export function withImageRefs(state: BroadcastState, hashes: ReadonlyMap<string, string>): BroadcastState {
  if (!state.sponsors.items.some((x) => x.logo.startsWith("data:"))) return state;
  return {
    ...state,
    sponsors: {
      ...state.sponsors,
      items: state.sponsors.items.map((x) => {
        if (!x.logo.startsWith("data:")) return x;
        const h = hashes.get(x.logo);
        return { ...x, logo: h ? imageRef(h) : "" };
      }),
    },
  };
}

/** Indirizzo da cui l'overlay prende un'immagine caricata di una diretta. */
export function liveImageUrl(liveId: string, hash: string): string {
  return `/api/broadcast/live/image/${hash}?id=${liveId}`;
}

/** Lo stato letto dal sito con i riferimenti "om:<impronta>" trasformati negli indirizzi delle immagini. */
export function resolveLiveImages(state: BroadcastState, liveId: string): BroadcastState {
  if (!state.sponsors.items.some((x) => x.logo.startsWith(IMAGE_REF_PREFIX))) return state;
  return {
    ...state,
    sponsors: {
      ...state.sponsors,
      items: state.sponsors.items.map((x) => {
        const h = refHash(x.logo);
        return h ? { ...x, logo: liveImageUrl(liveId, h) } : x.logo.startsWith(IMAGE_REF_PREFIX) ? { ...x, logo: "" } : x;
      }),
    },
  };
}

/** Byte del JSON di un valore (per i tetti del database e di Twitch). */
export function jsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/* ---------------- estensione Twitch ---------------- */

/**
 * Lo stato per l'estensione Twitch: solo quello che serve a chi guarda per aprire i mazzi (giocatori, mazzo in campo,
 * liste con le copie giocate), chiavi corte perché il messaggio di PubSub sta in 5 KB. Niente sponsor (stanno già nel
 * video), niente lingua della regia (l'estensione usa quella di chi guarda). Le carte sono slug: nomi, testi e chiavi
 * per il codice del gioco li dà la tabella delle carte dell'estensione (`/api/broadcast/ext/cards/<lingua>`).
 */
export type ExtDeck = { n: string; l: string | null; c: string[]; p: Record<string, number> };
export type ExtPlayer = { n: string; t: string; s: number; a: number; d: ExtDeck[] };
export type ExtState = { v: 1; t: { n: string; no: string; ph: string; bo: BroadcastBestOf }; p: [ExtPlayer, ExtPlayer] };

const extDeck = (d: BroadcastDeck): ExtDeck => ({ n: d.name, l: d.legendary, c: [...d.cards], p: { ...d.played } });

export function extStateOf(state: BroadcastState): ExtState {
  const player = (i: 0 | 1): ExtPlayer => {
    const p = state.players[i];
    return { n: p.name, t: p.title, s: p.score, a: p.active, d: p.decks.map(extDeck) };
  };
  const t = state.tournament;
  return { v: 1, t: { n: t.name, no: t.number, ph: t.phase, bo: t.bestOf }, p: [player(0), player(1)] };
}

/** Lo stato per l'estensione c'è solo se almeno un mazzo ha delle carte: altrimenti l'estensione non mostra niente. */
export function extHasDecks(ext: ExtState | null): boolean {
  return Boolean(ext?.p.some((pl) => pl.d.some((d) => d.l || d.c.length)));
}

/** Tetto di Twitch a un messaggio dell'Extension PubSub (5 KB). */
export const PUBSUB_MAX = 5120;

/**
 * Il messaggio per gli spettatori: {t: "bc", id: diretta, v: versione, at: ora, s: stato per l'estensione | null}. Le
 * versioni contano dentro la stessa diretta: se il canale passa a un'altra regia (id diverso) si ricomincia. Se non sta
 * nei 5 KB (quattro mazzi pieni a testa con nomi lunghi), {t, id, v, at, r: 1}: l'estensione rilegge lo stato dal sito.
 */
export function pubsubMessage(id: string, version: number, at: string, ext: ExtState | null): string {
  const full = JSON.stringify({ t: "bc", id, v: version, at, s: ext });
  if (new TextEncoder().encode(full).length <= PUBSUB_MAX) return full;
  return JSON.stringify({ t: "bc", id, v: version, at, r: 1 });
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CTRL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;
const text = (v: unknown, max: number): string | null => (typeof v === "string" && v.length <= max * 4 ? [...v.replace(CTRL, "")].slice(0, max).join("") : null);
const int = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/**
 * Lo stato per l'estensione se ha la forma attesa, altrimenti null. È la stessa regola di `parseState` in
 * `twitch-broadcast/common.js` (un test le confronta): l'estensione ignora un messaggio diverso invece di rompersi.
 */
export function parseExtState(raw: unknown): ExtState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1 || !r.t || typeof r.t !== "object" || !Array.isArray(r.p) || r.p.length !== 2) return null;
  const t = r.t as Record<string, unknown>;
  const name = text(t.n, 40);
  const no = text(t.no, 12);
  const ph = text(t.ph, 28);
  if (name === null || no === null || ph === null || !(t.bo === 1 || t.bo === 3 || t.bo === 5)) return null;
  const players: ExtPlayer[] = [];
  for (const rawPlayer of r.p) {
    if (!rawPlayer || typeof rawPlayer !== "object") return null;
    const p = rawPlayer as Record<string, unknown>;
    const n = text(p.n, 24);
    const ti = text(p.t, 40);
    if (n === null || ti === null || !int(p.s, 0, 3) || !Array.isArray(p.d) || p.d.length < 1 || p.d.length > 4 || !int(p.a, 0, p.d.length - 1)) return null;
    const decks: ExtDeck[] = [];
    for (const rawDeck of p.d) {
      if (!rawDeck || typeof rawDeck !== "object") return null;
      const d = rawDeck as Record<string, unknown>;
      const dn = text(d.n, 24);
      if (dn === null || !(d.l === null || (typeof d.l === "string" && d.l.length <= 80 && SLUG.test(d.l)))) return null;
      if (!Array.isArray(d.c) || d.c.length > 12 || !d.c.every((s) => typeof s === "string" && s.length <= 80 && SLUG.test(s))) return null;
      if (!d.p || typeof d.p !== "object" || Array.isArray(d.p)) return null;
      const played: Record<string, number> = {};
      for (const [slug, count] of Object.entries(d.p as Record<string, unknown>)) {
        if (!SLUG.test(slug) || slug.length > 80 || !int(count, 1, 2)) return null;
        played[slug] = count;
      }
      decks.push({ n: dn, l: d.l as string | null, c: d.c as string[], p: played });
    }
    players.push({ n, t: ti, s: p.s as number, a: p.a as number, d: decks });
  }
  return { v: 1, t: { n: name, no, ph, bo: t.bo as BroadcastBestOf }, p: [players[0], players[1]] };
}
