/**
 * Partita ricostruita dallo scanner (S3, 10/10/2026): dai fotogrammi letti con recognize.ts (carte nei 18 spazi,
 * Leggendarie della schermata VS, mana massimo) alle giocate round per round, nello stesso formato `plays` che il
 * tracker riempiva col replay prima della patch 0.7. Funzioni pure.
 *
 * Perché non basta "una carta compare in uno spazio": durante animazioni e passaggi del mouse una carta sparisce per
 * qualche fotogramma e ricompare, le mie carte si vedono già mentre le piazzo (prima della rivelazione) e alcuni effetti
 * le spostano da un luogo all'altro. Quindi per ogni round si contano le copie di ogni carta su ciascun lato, stabili per
 * almeno `STABLE_FRAMES` fotogrammi, e si confrontano con il tabellone alla fine del round prima (il massimo degli
 * ultimi `END_FRAMES` fotogrammi, che regge le sparizioni momentanee): le copie in più sono giocate di quel round.
 * Limiti noti: una carta giocata e distrutta nello stesso round senza restare a schermo per due fotogrammi non si vede;
 * una magia non resta sul tabellone (S3 la legge solo se lascia una carta). Le carte create dal gioco (tipo "token")
 * non sono giocate e restano fuori.
 *
 * Il round è il mana massimo meno uno (`roundOf` di recognize.ts), portato avanti nei fotogrammi in cui il pannello non
 * si legge.
 */
import { BOARD_SLOTS, roundOf, type Side } from "./recognize";
import type { TrackedMatch } from "../../../src/lib/tracker/match";

export type ScanFrame = {
  ms: number;
  /** Le carte dei 18 spazi nell'ordine di BOARD_SLOTS (null: vuoto o non riconosciuto). */
  board: readonly (string | null)[];
  vs: { me: string; opp: string } | null;
  maxMana: number | null;
  /** Esito letto dallo stendardo di fine partita (recognize.ts, `readResult`); assente nei fotogrammi più vecchi. */
  result?: "W" | "L" | null;
};

export type ScannedPlay = { turn: number; me: boolean; card: string; lane: number };

export type ScannedMatch = {
  startMs: number;
  endMs: number;
  myLegendary: string | null;
  oppLegendary: string | null;
  turns: number | null;
  plays: ScannedPlay[];
  /** Le carte dell'avversario viste in partita (Leggendaria compresa, niente carte create), in ordine di comparsa. */
  opponentCards: string[];
  /**
   * La partita è stata vista dal round 1. Falso se la ripresa è cominciata a partita in corso (l'app avviata durante la
   * partita, 10/10/2026 alle 15:34): il pannello del mazzo la mostra lo stesso, ma nello storico e nelle statistiche
   * non entra, perché le carte giocate prima mancherebbero (`applyScan`).
   */
  complete: boolean;
  /** Esito dello stendardo di fine partita, confermato da `RESULT_FRAMES` fotogrammi; null se non si è visto. */
  result: "W" | "L" | null;
  /** Quando è comparso lo stendardo (ora del PC): la fine della partita. */
  resultAt: number | null;
};

/** Fotogrammi con lo stesso esito per crederci (una dissolvenza può somigliare allo stendardo per un fotogramma). */
export const RESULT_FRAMES = 2;

export type CardInfo = { token: (key: string) => boolean; legendary: (key: string) => boolean };

export const STABLE_FRAMES = 2;
export const END_FRAMES = 5;
/** Senza fotogrammi per più di 3 minuti la partita dopo è un'altra. */
export const MATCH_GAP_MS = 3 * 60_000;

/**
 * Il mana massimo vale solo se lo conferma un'altra lettura uguale entro `CONFIRM_MS`: una
 * lettura isolata e sbagliata (un "0/10" in un menu, il 10/10 alle 02:17) farebbe saltare il round o inventerebbe una
 * partita.
 */
export const CONFIRM_MS = 20_000;

export function confirmMana(frames: readonly ScanFrame[]): ScanFrame[] {
  const read = frames.map((f, i) => (f.maxMana === null ? -1 : i)).filter((i) => i >= 0);
  const ok = new Set<number>();
  read.forEach((i, j) => {
    const same = (k: number) => k !== j && frames[read[k]].maxMana === frames[i].maxMana;
    for (let k = j - 1; k >= 0 && frames[i].ms - frames[read[k]].ms <= CONFIRM_MS; k--) if (same(k)) return void ok.add(i);
    for (let k = j + 1; k < read.length && frames[read[k]].ms - frames[i].ms <= CONFIRM_MS; k++) if (same(k)) return void ok.add(i);
  });
  return frames.map((f, i) => (f.maxMana === null || ok.has(i) ? f : { ...f, maxMana: null }));
}

/**
 * Una partita comincia con un mana massimo basso (fino a `START_MAX_MANA`, cioè i primi round): prima, il tabellone
 * appena aperto mostra "0/10" come segnaposto (10/10, prima della seconda partita), e quel 10 farebbe partire la
 * partita dal round 9. Eccezione: la ripresa cominciata a partita in corso (primo pezzo della ripresa, mana letto entro
 * `MIDGAME_START_MS` dal primo fotogramma con carte sul tabellone, nessuna schermata VS), che comincia dal primo mana
 * letto e resta incompleta.
 */
export const START_MAX_MANA = 3;
export const MIDGAME_START_MS = 60_000;

/** Divide i fotogrammi di una sessione in partite: una schermata VS dopo il gioco, il mana che riparte o una pausa. */
export function splitMatches(all: readonly ScanFrame[]): ScanFrame[][] {
  const frames = confirmMana(all);
  const out: ScanFrame[][] = [];
  const keep: boolean[] = [];
  let cur: ScanFrame[] = [];
  let lastMax: number | null = null;
  let played = false;
  let sawVs = false;
  const firstMs = frames[0]?.ms ?? 0;
  for (const f of frames) {
    const prev = cur[cur.length - 1];
    const restart =
      cur.length > 0 &&
      ((prev && f.ms - prev.ms > MATCH_GAP_MS) || (f.vs !== null && played) || (f.maxMana !== null && lastMax !== null && f.maxMana < lastMax - 1));
    if (restart) {
      out.push(cur);
      keep.push(played);
      cur = [];
      lastMax = null;
      played = false;
      sawVs = false;
    }
    cur.push(f);
    if (f.vs) sawVs = true;
    // una partita in corso ha carte sul tabellone; il tabellone d'apertura ("0/10") è vuoto
    const midgame = out.length === 0 && !sawVs && f.ms - firstMs <= MIDGAME_START_MS && f.board.some(Boolean);
    if (f.maxMana !== null && (played || f.maxMana <= START_MAX_MANA || midgame)) {
      lastMax = f.maxMana;
      played = true;
    }
  }
  if (cur.length) {
    out.push(cur);
    keep.push(played);
  }
  // solo i pezzi in cui si è giocato davvero
  return out.filter((_, i) => keep[i]);
}

const sideOf = (i: number): Side => BOARD_SLOTS[i].side;

/** Copie di ogni carta per lato in un fotogramma: "me|C00032_MB" → 2. */
function counts(f: ScanFrame): Map<string, number> {
  const m = new Map<string, number>();
  f.board.forEach((k, i) => {
    if (!k) return;
    const id = `${sideOf(i)}|${k}`;
    m.set(id, (m.get(id) ?? 0) + 1);
  });
  return m;
}

/** Il valore più frequente (a pari merito il primo incontrato), o null. */
function mode<T>(list: readonly T[]): T | null {
  const n = new Map<T, number>();
  let best: T | null = null;
  let bn = 0;
  for (const x of list) {
    const c = (n.get(x) ?? 0) + 1;
    n.set(x, c);
    if (c > bn) {
      bn = c;
      best = x;
    }
  }
  return best;
}

/** La partita dai suoi fotogrammi (uno dei pezzi di `splitMatches`). */
export function reconstruct(raw: readonly ScanFrame[], cards: CardInfo): ScannedMatch {
  const frames = confirmMana(raw);
  // round di ogni fotogramma: il mana massimo portato avanti, dal primo mana dei primi round (o dal primo mana letto, se
  // la ripresa è cominciata a partita in corso); prima la partita non è cominciata
  const start = frames.findIndex((f) => f.maxMana !== null && f.maxMana <= START_MAX_MANA);
  const from = start >= 0 ? start : frames.findIndex((f) => f.maxMana !== null);
  let max: number | null = null;
  const byRound = new Map<number, ScanFrame[]>();
  for (const [i, f] of frames.entries()) {
    if (i < from || from < 0) continue;
    if (f.maxMana !== null && (max === null || f.maxMana >= max)) max = f.maxMana;
    if (max === null) continue;
    const r = roundOf(max);
    if (r < 1) continue;
    if (!byRound.has(r)) byRound.set(r, []);
    byRound.get(r)!.push(f);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  const plays: ScannedPlay[] = [];
  let before = new Map<string, number>();
  for (const r of rounds) {
    const fs = byRound.get(r)!;
    const per = fs.map(counts);
    const ids = new Set(per.flatMap((m) => [...m.keys()]));
    for (const id of ids) {
      const [side, key] = id.split("|") as [Side, string];
      if (cards.token(key)) continue;
      // copie stabili: il numero più alto raggiunto in almeno STABLE_FRAMES fotogrammi
      const seen = per.map((m) => m.get(id) ?? 0).sort((a, b) => b - a);
      const stable = seen[STABLE_FRAMES - 1] ?? 0;
      const fresh = stable - (before.get(id) ?? 0);
      if (fresh <= 0) continue;
      // il luogo: dove compare la prima volta in questo round
      const first = fs.findIndex((f) => f.board.some((k, i) => k === key && sideOf(i) === side));
      const slot = first >= 0 ? fs[first].board.findIndex((k, i) => k === key && sideOf(i) === side) : -1;
      for (let c = 0; c < fresh; c++) plays.push({ turn: r, me: side === "me", card: key, lane: slot >= 0 ? BOARD_SLOTS[slot].lane : 0 });
    }
    // il tabellone alla fine del round: il massimo degli ultimi END_FRAMES fotogrammi
    const end = new Map<string, number>();
    for (const m of per.slice(-END_FRAMES)) for (const [id, c] of m) end.set(id, Math.max(end.get(id) ?? 0, c));
    before = end;
  }

  const vs = frames.filter((f) => f.vs);
  const opponentCards: string[] = [];
  const oppLegendary = mode(vs.map((f) => f.vs!.opp)) ?? plays.find((p) => !p.me && cards.legendary(p.card))?.card ?? null;
  if (oppLegendary) opponentCards.push(oppLegendary);
  for (const p of plays) if (!p.me && !opponentCards.includes(p.card)) opponentCards.push(p.card);

  return {
    startMs: frames[0]?.ms ?? 0,
    endMs: frames[frames.length - 1]?.ms ?? 0,
    myLegendary: mode(vs.map((f) => f.vs!.me)),
    oppLegendary,
    turns: rounds.length ? rounds[rounds.length - 1] : null,
    plays,
    opponentCards,
    complete: rounds[0] === 1,
    ...resultOf(frames),
  };
}

/** L'esito più visto fra i fotogrammi dello stendardo, se lo confermano almeno `RESULT_FRAMES` fotogrammi. */
function resultOf(frames: readonly ScanFrame[]): { result: "W" | "L" | null; resultAt: number | null } {
  const seen = frames.filter((f) => f.result === "W" || f.result === "L");
  const w = seen.filter((f) => f.result === "W");
  const l = seen.filter((f) => f.result === "L");
  const best = w.length >= l.length ? w : l;
  if (best.length < RESULT_FRAMES || best.length === seen.length - best.length) return { result: null, resultAt: null };
  return { result: best[0].result as "W" | "L", resultAt: best[0].ms };
}

/* ---------- dalla partita letta dallo schermo alla partita dello storico ---------- */

/**
 * La partita dello storico con i dati dello scanner, quando il replay non c'è (dalla patch 0.7): Leggendaria e carte
 * viste dell'avversario, round e giocate. Delle mie giocate restano solo le carte del mio mazzo: quelle generate da
 * effetti o evocate da un luogo (Christopher Robin, Ali Baba e Big Bad Wolf nelle partite del 10/10) non sono carte
 * giocate dal mazzo e sporcherebbero le statistiche. Il luogo passa da 1–3 a 0–2, come nel replay. Se il replay c'è,
 * vince lui; una partita vista solo a metà (`complete` falso) non cambia niente.
 */
export function applyScan(match: TrackedMatch, scan: ScannedMatch | null): TrackedMatch {
  if (!scan || !scan.complete || match.plays.length || match.opponent) return match;
  const mine = new Set(match.deck.cards);
  const plays = scan.plays
    .filter((p) => !p.me || mine.has(p.card))
    .map((p) => ({ turn: p.turn, me: p.me, card: p.card, lane: p.lane >= 1 && p.lane <= 3 ? p.lane - 1 : null }));
  return {
    ...match,
    opponent: scan.oppLegendary || scan.opponentCards.length ? { legendary: scan.oppLegendary, cards: scan.opponentCards } : null,
    turns: scan.turns,
    plays,
  };
}

/**
 * La partita dei fotogrammi che corrisponde a una partita finita a `endedAtMs` (ora del PC): l'ultima cominciata prima
 * della fine e non più di `MAX_MATCH_MS` prima.
 */
export const MAX_MATCH_MS = 40 * 60_000;

export function scanFor(frames: readonly ScanFrame[], endedAtMs: number, cards: CardInfo): ScannedMatch | null {
  const pieces = splitMatches(frames).filter((p) => p[0].ms <= endedAtMs && p[0].ms >= endedAtMs - MAX_MATCH_MS);
  const piece = pieces[pieces.length - 1];
  return piece ? reconstruct(piece.filter((f) => f.ms <= endedAtMs + 5_000), cards) : null;
}

const KEY_RE = /^C\d{5}_[A-Z]{2}$/;

/** Un fotogramma letto, come lo manda la finestra nascosta (main/frames.ts); null se la forma non è quella attesa. */
export function readScanFrame(raw: unknown, now: number): ScanFrame | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  const key = (k: unknown): k is string => typeof k === "string" && KEY_RE.test(k);
  if (!Array.isArray(f.board) || f.board.length !== BOARD_SLOTS.length || !f.board.every((k) => k === null || key(k))) return null;
  const vs = f.vs as Record<string, unknown> | null;
  if (vs !== null && !(vs && typeof vs === "object" && key(vs.me) && key(vs.opp))) return null;
  const max = f.maxMana;
  if (max !== null && !(Number.isInteger(max) && (max as number) >= 1 && (max as number) <= 20)) return null;
  const result = f.result === "W" || f.result === "L" ? f.result : null;
  if (f.result !== undefined && f.result !== null && result === null) return null;
  return { ms: now, board: f.board as (string | null)[], vs: vs ? { me: vs.me as string, opp: vs.opp as string } : null, maxMana: max as number | null, result };
}
