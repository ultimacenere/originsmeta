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
 * una magia non resta sul tabellone: dal 13/10/2026 si legge dal riquadro in alto a sinistra (`spellPlays`). Le carte
 * create dal gioco (tipo "token") non sono giocate e restano fuori.
 *
 * Il round è il mana massimo meno uno (`roundOf` di recognize.ts), portato avanti nei fotogrammi in cui il pannello non
 * si legge. Dal 05/11/2026 i round dopo il nono, che hanno tutti il mana massimo a 10, si dividono dove comincia una
 * nuova pianificazione (`splitByPhase`), e la partita porta anche i due cimiteri (`graveyard`, `graveyardStep`).
 */
import { BOARD_SLOTS, isSpellKey, roundOf, type Side } from "./recognize";
import type { GraveRole } from "./graveRoles";
import type { TrackedMatch } from "../../../src/lib/tracker/match";

export type ScanFrame = {
  ms: number;
  /** Le carte dei 18 spazi nell'ordine di BOARD_SLOTS (null: vuoto o non riconosciuto). */
  board: readonly (string | null)[];
  vs: { me: string; opp: string } | null;
  maxMana: number | null;
  /** Esito letto dallo stendardo di fine partita (recognize.ts, `readResult`); assente nei fotogrammi più vecchi. */
  result?: "W" | "L" | null;
  /** Le carte nella mia mano, da sinistra (recognize.ts, `readHand`; dall'11/10/2026, assente prima). */
  hand?: readonly string[];
  /** Il bordo sinistro di ogni carta in mano, in frazione della larghezza (stesso ordine di `hand`; dal 14/10/2026). */
  handX?: readonly number[];
  /** Segmenti di vita accesi degli eroi, 0–2 (recognize.ts, `readLife`; null se non si leggono). */
  life?: { me: number | null; opp: number | null };
  /** Il mana di tutti e due, "rimasto/massimo" (recognize.ts, `readMana`; dall'11/10/2026 sera, assente prima). */
  mana?: { me: Mana | null; opp: Mana | null };
  /** Il verso della freccia "COMBAT DIRECTION" (recognize.ts, `readDirection`; dall'11/10/2026 sera). */
  direction?: Direction | null;
  /** Le carte coperte nella mano dell'avversario (recognize.ts, `readOppHand`; dal 12/10/2026, null se non si leggono). */
  oppHand?: number | null;
  /** La magia nel riquadro in alto a sinistra (recognize.ts, `readSpell`; dal 13/10/2026, null se non c'è o non si legge). */
  spell?: string | null;
  /** La fase del round dal tasto in basso a destra (recognize.ts, `readPhase`; dal 13/10/2026). */
  phase?: "plan" | "reveal";
};

export type Mana = { current: number; max: number };
export type Direction = "left" | "right";

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
  /**
   * Le copie pescate di ogni mia carta (Leggendaria compresa): il massimo, nei fotogrammi della partita, delle copie in
   * mano (viste in almeno `STABLE_FRAMES` fotogrammi del round) più quelle giocate nei round prima, e mai meno delle
   * giocate. Una carta pescata e scartata da un effetto senza passare dalla mano a schermo non si conta.
   */
  drawn: Record<string, number>;
  /** La vita degli eroi (segmenti accesi, 0–2): l'ultima lettura confermata da `STABLE_FRAMES` fotogrammi di fila. */
  life: { me: number | null; opp: number | null };
  /** Il mana dei due giocatori e il verso del combattimento: l'ultima lettura confermata, come la vita. */
  mana: { me: Mana | null; opp: Mana | null };
  direction: Direction | null;
  /**
   * Le carte pescate dall'avversario, stimate dalla sua mano (12/10/2026): la prima lettura confermata più ogni
   * aumento fra due letture confermate. Una carta che un effetto gli mette in mano conta come pescata; se la ripresa
   * comincia a partita in corso le pescate di prima mancano. Null senza letture.
   */
  oppDrawn: number | null;
  /**
   * I due cimiteri (05/11/2026): per lato, i personaggi (carte create comprese) che lo scanner ha visto morire sul
   * tabellone e, per me, quelli scartati dalla mano, meno quelli tornati in campo dal cimitero (Rinascita, Dr. Frank,
   * It's Alive) o in mano (Koschei, Aladdin, Dracula). Una voce per copia, nell'ordine in cui ci sono finiti. Le carte
   * scartate dall'avversario non si vedono (la sua mano è coperta). Vedi `graveyardStep`.
   */
  graveyard: { me: string[]; opp: string[] };
};

/** Fotogrammi con lo stesso esito per crederci (una dissolvenza può somigliare allo stendardo per un fotogramma). */
export const RESULT_FRAMES = 2;

/**
 * `myDeck`: le carte del mazzo scelto, se si sanno (13/10/2026): una magia che non c'è non può essere mia (`spellPlays`).
 * `grave`: il ruolo di una carta per il cimitero (src/shared/graveRoles.ts, 05/11/2026); senza, nessuna carta speciale.
 */
export type CardInfo = {
  token: (key: string) => boolean;
  legendary: (key: string) => boolean;
  myDeck?: () => readonly string[] | null;
  grave?: (key: string) => GraveRole | null;
};

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
/**
 * Fotogrammi col tabellone con carte dopo la schermata VS per dire che la partita è cominciata anche senza il mana
 * (13/10/2026: in 2 partite su 23 il "2/2" del round 1 non si legge mai, e la partita partiva dal round 2, con i pannelli
 * "solo durante la partita" accesi un minuto dopo la VS e le carte del round 1 contate nel round 2).
 */
export const BOARD_START_FRAMES = 2;
/**
 * Il tabellone con carte tiene la partita "in corso" fino a 2 minuti dopo l'ultimo mana letto (13/10/2026: nei round
 * finali il mana resta coperto fino a 78 secondi e i pannelli "solo durante la partita" sparivano a partita in corso,
 * in 9 partite su 24). Lo stendardo di fine partita chiude prima.
 */
export const BOARD_GRACE_MS = 120_000;

/** Divide i fotogrammi di una sessione in partite: una schermata VS dopo il gioco, il mana che riparte o una pausa. */
export function splitMatches(all: readonly ScanFrame[]): ScanFrame[][] {
  const frames = confirmMana(all);
  const out: ScanFrame[][] = [];
  const keep: boolean[] = [];
  let cur: ScanFrame[] = [];
  let lastMax: number | null = null;
  let played = false;
  let sawVs = false;
  let boardAfterVs = 0;
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
      boardAfterVs = 0;
    }
    cur.push(f);
    if (f.vs) sawVs = true;
    // il round 1 si riconosce anche dal tabellone dopo la VS, quando il suo mana non si legge (`BOARD_START_FRAMES`)
    if (sawVs && !f.vs && f.board.some(Boolean) && ++boardAfterVs >= BOARD_START_FRAMES) played = true;
    // una partita in corso ha carte sul tabellone; il tabellone d'apertura ("0/10") è vuoto
    const midgame = out.length === 0 && !sawVs && f.ms - firstMs <= MIDGAME_START_MS && f.board.some(Boolean);
    // dopo una partenza riconosciuta dal tabellone il segnaposto "0/10" non vale: conta solo da un mana già valido
    if (f.maxMana !== null && (lastMax !== null || f.maxMana <= START_MAX_MANA || midgame)) {
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

/**
 * Copie di ogni carta per lato in un fotogramma: "me|C00032_MB" → 2. Le magie non restano sul tabellone: una magia letta
 * in uno spazio è un'altra carta scambiata (13/10/2026: Searing Light in 53 letture su 10 sessioni, tutte false), e le
 * magie si leggono dal riquadro in alto a sinistra (`spellPlays`).
 */
function counts(f: ScanFrame): Map<string, number> {
  const m = new Map<string, number>();
  f.board.forEach((k, i) => {
    if (!k || isSpellKey(k)) return;
    const id = `${sideOf(i)}|${k}`;
    m.set(id, (m.get(id) ?? 0) + 1);
  });
  return m;
}

/**
 * Una stessa magia letta di nuovo entro questo tempo nel riquadro è la stessa rivelazione (il riquadro entra scorrendo e
 * durante l'effetto si legge a tratti).
 */
export const SPELL_GAP_MS = 3000;

/** Le apparizioni di ogni magia nel riquadro fra questi fotogrammi: letture vicine della stessa magia, almeno `minFrames`. */
function spellRuns(frames: readonly ScanFrame[], minFrames = STABLE_FRAMES): Map<string, number> {
  const out = new Map<string, number>();
  let cur: { key: string; n: number; last: number } | null = null;
  const close = () => {
    if (cur && cur.n >= minFrames) out.set(cur.key, (out.get(cur.key) ?? 0) + 1);
  };
  for (const f of frames) {
    if (!f.spell) continue;
    if (cur && cur.key === f.spell && f.ms - cur.last <= SPELL_GAP_MS) {
      cur.n++;
      cur.last = f.ms;
      continue;
    }
    close();
    cur = { key: f.spell, n: 1, last: f.ms };
  }
  close();
  return out;
}

/** Le copie di una carta nella mia mano lette in almeno `STABLE_FRAMES` fotogrammi di fila, nell'ordine. */
function handCounts(frames: readonly ScanFrame[], key: string): number[] {
  const seq = frames.filter((f) => f.hand !== undefined).map((f) => f.hand!.filter((k) => k === key).length);
  const stable: number[] = [];
  for (let i = 0; i + STABLE_FRAMES <= seq.length; i++) if (seq.slice(i, i + STABLE_FRAMES).every((n) => n === seq[i])) stable.push(seq[i]);
  return stable;
}

/**
 * Le copie di una carta uscite dalla mia mano nel round: il massimo letto prima della fine della pianificazione meno
 * l'ultima lettura della pianificazione. Il massimo, non la prima lettura, perché la carta può lasciare la mano già
 * durante l'animazione d'inizio round, prima che il tasto diventi verde (partita del 12/10 alle 00:07, round 4).
 */
function leftHand(frames: readonly ScanFrame[], key: string): number {
  let end = -1;
  frames.forEach((f, i) => {
    if (f.phase === "plan") end = i;
  });
  if (end < 0) return 0;
  const before = handCounts(frames.slice(0, end + 1), key);
  const plan = handCounts(frames.slice(0, end + 1).filter((f) => f.phase === "plan"), key);
  return before.length && plan.length ? Math.max(0, Math.max(...before) - plan[plan.length - 1]) : 0;
}

/**
 * Le magie giocate in un round (13/10/2026, Pierluigi: "dobbiamo leggere le spell e sappiamo che vengono visualizzate in
 * alto a sinistra"). Il riquadro le mostra durante la rivelazione, le mie e quelle dell'avversario, e durante la
 * pianificazione solo le mie (mentre scelgo il bersaglio). Una magia rivelata è mia fino al numero di copie che ho
 * giocato in quel round, cioè il più alto fra le volte che l'ho vista mentre sceglievo il bersaglio e le copie uscite
 * dalla mia mano entro la fine della pianificazione (`leftHand`); le altre sono dell'avversario. Le carte create (token) restano fuori, come
 * sul tabellone; il luogo non si sa (0).
 */
export function spellPlays(frames: readonly ScanFrame[], turn: number, cards: CardInfo): ScannedPlay[] {
  const reveal = spellRuns(frames.filter((f) => f.phase !== "plan"));
  // durante la pianificazione il riquadro mostra solo le mie magie: basta un fotogramma
  const aimed = spellRuns(frames.filter((f) => f.phase === "plan"), 1);
  const deck = cards.myDeck?.() ?? null;
  const out: ScannedPlay[] = [];
  for (const [key, n] of reveal) {
    if (cards.token(key)) continue;
    const mine = deck && !deck.includes(key) ? 0 : Math.min(n, Math.max(aimed.get(key) ?? 0, leftHand(frames, key)));
    for (let i = 0; i < mine; i++) out.push({ turn, me: true, card: key, lane: 0 });
    for (let i = mine; i < n; i++) out.push({ turn, me: false, card: key, lane: 0 });
  }
  return out;
}

/**
 * L'ultimo segno di partita in un pezzo (13/10/2026, pannelli "solo durante la partita"): il mana, o il tabellone con
 * carte entro `BOARD_GRACE_MS` dall'ultimo mana (o dalla VS) e prima dello stendardo di fine partita. Null senza mana né VS.
 */
export function lastActivity(piece: readonly ScanFrame[]): number | null {
  let mana: number | null = null;
  let vs: number | null = null;
  let banner: number | null = null;
  for (const f of piece) {
    if (f.maxMana !== null) mana = f.ms;
    if (f.vs) vs = f.ms;
    if (f.result && banner === null && (mana !== null || vs !== null)) banner = f.ms;
  }
  const anchor = mana ?? vs;
  if (anchor === null) return null;
  let last = mana;
  for (const f of piece) {
    if (f.ms <= anchor || f.ms > anchor + BOARD_GRACE_MS || (banner !== null && f.ms >= banner) || f.vs || !f.board.some(Boolean)) continue;
    last = Math.max(last ?? 0, f.ms);
  }
  return last;
}

/** Fotogrammi di fila con la stessa fase del round per crederci (tasto in basso a destra, `readPhase`). */
export const PHASE_FRAMES = 3;

/**
 * Un round di mana diviso dove comincia una nuova pianificazione (05/11/2026). Dal round 9 il mana massimo resta 10 e
 * tutti i round dopo il nono finivano nel nono (la partita del 12/10 alle 00:39 è arrivata al round 12): giocate dei
 * round 10–12 contate nel 9 e, peggio per il cimitero, una carta morta e rigiocata nella stessa finestra invisibile.
 * Una nuova pianificazione è una fila di `PHASE_FRAMES` fotogrammi "PRONTO" dopo una fila di altrettanti fotogrammi di
 * rivelazione o combattimento, a loro volta dopo una pianificazione; i fotogrammi senza fase (mana coperto) non
 * contano. Il pezzo nuovo comincia dal primo fotogramma della pianificazione. Chi chiama decide se il round si divide
 * davvero (`reconstruct`: mai fino al numero del round di mana dopo).
 */
export function splitByPhase(frames: readonly ScanFrame[]): ScanFrame[][] {
  const runs: { phase: "plan" | "reveal"; from: number; n: number }[] = [];
  frames.forEach((f, i) => {
    if (!f.phase) return;
    const last = runs[runs.length - 1];
    if (last && last.phase === f.phase) last.n++;
    else runs.push({ phase: f.phase, from: i, n: 1 });
  });
  const cuts: number[] = [];
  let planned = false;
  let revealed = false;
  for (const r of runs) {
    if (r.n < PHASE_FRAMES) continue;
    if (r.phase === "plan") {
      if (planned && revealed) cuts.push(r.from);
      planned = true;
      revealed = false;
    } else if (planned) revealed = true;
  }
  const out: ScanFrame[][] = [];
  let prev = 0;
  for (const c of cuts) {
    out.push(frames.slice(prev, c));
    prev = c;
  }
  out.push(frames.slice(prev));
  return out;
}

/** Copie di una carta in un mazzo: la Leggendaria 1, le carte base 2 (regole del deck builder del sito). */
const maxCopies = (legendary: boolean) => (legendary ? 1 : 2);

/** Le copie stabili di ogni id ("me|C…") in questi fotogrammi: il numero più alto visto in almeno `STABLE_FRAMES` fotogrammi. */
function stableCounts(per: readonly Map<string, number>[]): Map<string, number> {
  const ids = new Set(per.flatMap((m) => [...m.keys()]));
  const out = new Map<string, number>();
  for (const id of ids) {
    const seen = per.map((m) => m.get(id) ?? 0).sort((a, b) => b - a);
    const n = seen[STABLE_FRAMES - 1] ?? 0;
    if (n > 0) out.set(id, n);
  }
  return out;
}

/** Le copie più alte di ogni id in questi fotogrammi. */
function maxCounts(per: readonly Map<string, number>[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of per) for (const [id, c] of m) out.set(id, Math.max(out.get(id) ?? 0, c));
  return out;
}

/** Il tabellone alla fine di un pezzo di round: il massimo degli ultimi `END_FRAMES` fotogrammi (regge le sparizioni momentanee). */
const endCounts = (per: readonly Map<string, number>[]) => maxCounts(per.slice(-END_FRAMES));

/**
 * Le copie di ogni carta nella mia mano in questi fotogrammi: `max`, il massimo delle copie stabili per
 * `STABLE_FRAMES` fotogrammi; `last`, l'ultima lettura, se le ultime `STABLE_FRAMES` sono uguali. Null senza letture
 * (o, per `last`, se la mano sta cambiando proprio adesso).
 */
function handSummary(frames: readonly ScanFrame[], pick: "max" | "last"): Map<string, number> | null {
  const read = frames.filter((f) => f.hand !== undefined);
  if (read.length < STABLE_FRAMES) return null;
  const out = new Map<string, number>();
  if (pick === "last") {
    const tail = read.slice(-STABLE_FRAMES).map((f) => [...f.hand!].sort().join(","));
    if (!tail.every((h) => h === tail[0])) return null;
    for (const k of read[read.length - 1].hand!) out.set(k, (out.get(k) ?? 0) + 1);
    return out;
  }
  for (const k of new Set(read.flatMap((f) => f.hand!))) {
    const stable = handCounts(read, k);
    const n = stable.length ? Math.max(...stable) : 0;
    if (n > 0) out.set(k, n);
  }
  return out;
}

/** La mia mano in un round, per gli scarti: le copie più alte prima della fine della pianificazione e quelle uscite per giocarle. */
type GraveHand = { plan: Map<string, number>; used: Map<string, number> };

/** Dopo l'ultimo "PRONTO" letto, per tanto il round in corso si considera ancora in pianificazione (nessuno muore). */
export const PLAN_HOLD_MS = 5000;
/**
 * Nel round in corso una carta è morta solo se manca da tanto (05/11/2026): dal vivo un'anteprima o un'animazione la
 * coprono per qualche secondo, e senza questa attesa il pannello la metteva nel cimitero e poi la toglieva (partita del
 * 12/10 alle 00:39 rigiocata: Three Blind Mice e Little John per mezzo minuto nel cimitero, vivi).
 */
export const LIVE_DEATH_MS = 8000;

/** Quello che `graveyardStep` sa di un round e delle sue carte arrivate sul tabellone. */
type GraveRound = {
  frames: readonly ScanFrame[];
  per: readonly Map<string, number>[];
  /** il tabellone alla fine del round prima */
  before: ReadonlyMap<string, number>;
  /** le copie arrivate in questo round per id ("me|C…"), carte create comprese */
  arrivals: ReadonlyMap<string, number>;
  /** le magie giocate in questo round (`spellPlays`) */
  spells: readonly ScannedPlay[];
  /** le giocate dei round prima */
  plays: readonly ScannedPlay[];
  /** i cimiteri fino al round prima: `graveyardStep` li aggiorna */
  grave: { me: string[]; opp: string[] };
  /** le carte con Rinascita morte nel round prima, per lato: possono tornare in campo in questo */
  reborn: Record<Side, Map<string, number>>;
  /** la mia mano nel round prima (`GraveHand`): i suoi scarti si confermano qui */
  prevHand: GraveHand | null;
  /** l'ultimo round letto (dal vivo può essere ancora in pianificazione) */
  ongoing: boolean;
  cards: CardInfo;
};

type GraveStep = { back: Map<string, number>; reborn: Record<Side, Map<string, number>>; hand: GraveHand | null };

/**
 * Il cimitero di un round (05/11/2026), con le regole del gioco completo (graveRoles.ts). In quest'ordine:
 * 1. **scarti** (solo i miei: la mano dell'avversario è coperta): le copie di una carta nella mia mano prima della fine
 *    della pianificazione, meno quelle che ho giocato, meno quelle ancora in mano dopo (rivelazione e combattimento);
 *    vanno nel cimitero i personaggi, e se ho scartato qualcosa Dracula torna dal cimitero in mano;
 * 2. **carte tornate dal cimitero**: un arrivo sul tabellone di una carta che sta nel cimitero di quel lato, se c'è
 *    qualcosa che la riporta in campo nel round: Dr. Frank in campo (uno per round), It's Alive giocata (uno), la
 *    Rinascita di una carta morta proprio alla fine del round prima (ricompare prima della pianificazione: di solito
 *    muore e torna nello stesso round, e allora non cambia niente), o le copie già tutte giocate (una carta base non
 *    entra una terza volta dalla mano). Per me conta solo un arrivo fuori dalla pianificazione: quelle che piazzo io
 *    vengono dalla mano. Queste carte escono dal cimitero e **non sono giocate** (`back`);
 * 3. **morti**: le copie che erano sul tabellone (alla fine del round prima, più quelle arrivate) e alla fine del round
 *    non ci sono più. Non muoiono: Koschei e Aladdin (tornano in mano), le mie carte che ricompaiono nella mia mano
 *    (rimandate in mano da White Queen o Stroke of Midnight) e le carte che si trasformano (Ugly Duckling, Doppelganger:
 *    al loro posto c'è un'altra carta). Durante la pianificazione nessuno muore: nel round in corso, finché si pianifica,
 *    una carta che sparisce è coperta da un'anteprima.
 * Il round per il cimitero finisce allo stendardo di fine partita (dopo, il tabellone si svuota senza morti). Limiti:
 * una carta dell'avversario rimandata in mano per il tracker è morta; una carta morta e rigiocata nello stesso round,
 * dopo la morte, non si vede (come la giocata).
 */
function graveyardStep(g: GraveRound): GraveStep {
  const { before, arrivals, spells, plays, grave, cards } = g;
  const role = (k: string) => cards.grave?.(k) ?? null;
  const inGrave = (side: Side, k: string) => grave[side].filter((x) => x === k).length;
  const take = (side: Side, k: string) => {
    const i = grave[side].lastIndexOf(k);
    if (i >= 0) grave[side].splice(i, 1);
  };
  // mai più copie di quelle che un mazzo può avere (la Leggendaria 1, le carte base 2; le carte create senza limite):
  // di più vuol dire una lettura sbagliata
  const bury = (side: Side, k: string) => {
    if (!cards.token(k) && inGrave(side, k) >= maxCopies(cards.legendary(k))) return false;
    grave[side].push(k);
    return true;
  };
  const back = new Map<string, number>();
  const reborn: Record<Side, Map<string, number>> = { me: new Map(), opp: new Map() };

  // il round per il cimitero: fino allo stendardo di fine partita, senza i fotogrammi finali col tabellone vuoto e senza mana
  let stop = g.frames.findIndex((f) => f.result === "W" || f.result === "L");
  // la partita è ancora in corso (dal vivo): le morti aspettano `LIVE_DEATH_MS`
  const live = g.ongoing && stop < 0;
  if (stop < 0) stop = g.frames.length;
  while (stop > 0 && g.frames[stop - 1].maxMana === null && !g.frames[stop - 1].board.some(Boolean)) stop--;
  const fs = g.frames.slice(0, stop);
  const per = g.per.slice(0, stop);
  let planIdx = -1;
  fs.forEach((f, i) => {
    if (f.phase === "plan") planIdx = i;
  });
  const lastPhase = [...fs].reverse().find((f) => f.phase)?.phase;
  // il round in corso è ancora in pianificazione (dal vivo): né scarti né morti finché non si rivela
  const planning = g.ongoing && lastPhase === "plan" && fs[fs.length - 1].ms - fs[planIdx].ms <= PLAN_HOLD_MS;
  const firstPlan = fs.findIndex((f) => f.phase === "plan");
  const firstSeen = (side: Side, key: string) => fs.findIndex((f) => f.board.some((k, s) => k === key && sideOf(s) === side));

  // le mie carte piazzate nella pianificazione (dalla mano): le copie stabili nei fotogrammi "PRONTO" più quelle uscite
  // dalla mano; senza fasi lette, tutte (come le giocate)
  const planStable = stableCounts(per.filter((_, i) => i <= planIdx && fs[i].phase === "plan"));
  const planned = (key: string) => {
    const id = `me|${key}`;
    const n = arrivals.get(id) ?? 0;
    if (planIdx < 0) return n;
    return Math.min(n, Math.max(0, (planStable.get(id) ?? 0) - (before.get(id) ?? 0), leftHand(g.frames, key)));
  };

  // 1. scarti del round prima, confermati dalla mia mano in questa pianificazione: una carta è scartata se non compare
  // mai nella mano di questa pianificazione. Durante il combattimento la lettura della mano a volte perde quasi tutte
  // le carte per qualche secondo (partita del 11/10 alle 18:16, round 1: solo "Mowgli" per 5 secondi), e anche una
  // lettura sola all'inizio della pianificazione può perderne una: le carte sembravano scartate
  const handPlan = planIdx >= 0 ? handSummary(fs.slice(0, planIdx + 1), "max") : null;
  const handEnd = planIdx >= 0 && !planning ? handSummary(fs.slice(planIdx + 1), "last") : null;
  const planHand = handSummary(fs.filter((f, i) => i <= planIdx && f.phase === "plan"), "max");
  // le carte che gioco in questo round erano ancora in mano, anche se le piazzo prima che la mano si legga (partita
  // del 11/10 alle 00:35: Robin Hood sul tabellone già alla prima lettura della pianificazione)
  const playedNow = (k: string) => (isSpellKey(k) ? spells.filter((p) => p.me && p.card === k).length : (arrivals.get(`me|${k}`) ?? 0));
  if (g.prevHand && planHand) {
    let discarded = 0;
    for (const [k, n] of g.prevHand.plan) {
      const d = Math.max(0, n - (g.prevHand.used.get(k) ?? 0) - (planHand.get(k) ?? 0) - playedNow(k));
      discarded += d;
      if (!isSpellKey(k)) for (let i = 0; i < d; i++) bury("me", k);
    }
    if (discarded > 0) for (const k of new Set(grave.me)) if (role(k) === "recall") take("me", k);
  }
  // la mano di questo round, per gli scarti che si confermano nel round dopo: le copie uscite dalla mano sono quelle
  // arrivate sul mio tabellone (anche fuori dalla pianificazione: Aladdin scartato si evoca da solo) e le mie magie
  const hand: GraveHand | null = handPlan ? { plan: handPlan, used: new Map([...handPlan.keys()].map((k) => [k, playedNow(k)] as [string, number])) } : null;

  // 2. carte tornate in campo dal cimitero: le fonti del round (Dr. Frank in campo, It's Alive giocata)
  const present = stableCounts(per);
  const sources: Record<Side, number> = { me: 0, opp: 0 };
  for (const id of new Set([...present.keys(), ...before.keys()])) {
    const [side, key] = id.split("|") as [Side, string];
    if (role(key) === "reviver") sources[side] += Math.max(present.get(id) ?? 0, before.get(id) ?? 0);
  }
  for (const p of spells) if (role(p.card) === "revive") sources[p.me ? "me" : "opp"]++;
  for (const [id, n] of arrivals) {
    const [side, key] = id.split("|") as [Side, string];
    const fresh = side === "me" ? n - planned(key) : n;
    let left = Math.min(fresh, inGrave(side, key));
    if (left <= 0) continue;
    let k = 0;
    // le copie già tutte giocate: non viene dalla mano
    if (!cards.token(key)) {
      const earlier = plays.filter((p) => p.me === (side === "me") && p.card === key).length;
      const excess = Math.max(0, earlier + n - maxCopies(cards.legendary(key)));
      const e = Math.min(left, excess);
      k += e;
      left -= e;
    }
    // Rinascita a cavallo fra due round: la carta ricompare prima della pianificazione di questo
    const seen = firstSeen(side, key);
    if (firstPlan > 0 && seen >= 0 && seen < firstPlan) {
      const r = Math.min(left, g.reborn[side].get(key) ?? 0);
      k += r;
      left -= r;
    }
    const fromSource = Math.min(left, sources[side]);
    sources[side] -= fromSource;
    k += fromSource;
    if (!k) continue;
    back.set(id, k);
    for (let i = 0; i < k; i++) take(side, key);
  }

  // 3. morti. Durante la pianificazione nessuno muore (una carta che sparisce lì è coperta da un'anteprima): nel round
  // in corso che sta pianificando si guarda il tabellone di prima della pianificazione (dal round 10 il round di mana
  // contiene anche i round prima, finché `splitByPhase` non vede tre fotogrammi "PRONTO": senza, le carte morte nel
  // round 9 uscivano dal cimitero per qualche secondo, Robin Hood nella partita del 11/10 alle 00:35)
  let cut = per.length;
  if (planning) {
    for (let i = planIdx; i >= 0 && fs[i].phase !== "reveal"; i--) if (fs[i].phase === "plan") cut = i;
  }
  if (cut <= 0) return { back, reborn, hand };
  const dfs = fs.slice(0, cut);
  const dper = per.slice(0, cut);
  // il tabellone alla fine del round; dal vivo, il massimo degli ultimi `LIVE_DEATH_MS` (e, se il round è appena
  // cominciato, anche quello alla fine del round prima: una carta è morta solo se manca da tanto)
  const lastMs = dfs[dfs.length - 1].ms;
  const end = live ? maxCounts([...dper.filter((_, i) => dfs[i].ms >= lastMs - LIVE_DEATH_MS), ...dper.slice(-END_FRAMES), ...(lastMs - dfs[0].ms < LIVE_DEATH_MS ? [new Map(before)] : [])]) : endCounts(dper);
  const tail = dfs.slice(-END_FRAMES);
  for (const id of new Set([...before.keys(), ...present.keys()])) {
    const [side, key] = id.split("|") as [Side, string];
    // dal vivo muore solo una carta che era in campo dal round prima: una arrivata in questo round può essere una mia
    // carta trascinata e poi rimessa in mano mentre il mana è coperto (partita del 12/10 alle 00:39, Little John al
    // round 10); quelle morte nel round in cui sono arrivate entrano a fine round
    let d = live ? Math.max(0, (before.get(id) ?? 0) - (end.get(id) ?? 0)) : (before.get(id) ?? 0) + (arrivals.get(id) ?? 0) - (end.get(id) ?? 0);
    if (d <= 0 || role(key) === "hand") continue;
    // una mia carta rimandata in mano (White Queen, Stroke of Midnight) ricompare nella mia mano: le copie in mano dopo
    // la pianificazione più di quelle che ci erano rimaste
    if (side === "me" && handPlan && handEnd) d -= Math.min(d, Math.max(0, (handEnd.get(key) ?? 0) - Math.max(0, (handPlan.get(key) ?? 0) - planned(key))));
    // una carta che si trasforma lascia il suo spazio a un'altra carta
    if (d > 0 && role(key) === "transform") {
      let slot = -1;
      for (let i = dfs.length - 1; i >= 0 && slot < 0; i--) slot = dfs[i].board.findIndex((k, s) => k === key && sideOf(s) === side);
      if (slot >= 0 && tail.some((f) => f.board[slot] !== null && f.board[slot] !== key)) d--;
    }
    let buried = 0;
    for (let i = 0; i < d; i++) if (bury(side, key)) buried++;
    if (buried > 0 && role(key) === "rebirth") reborn[side].set(key, (reborn[side].get(key) ?? 0) + buried);
  }
  return { back, reborn, hand };
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
  let from = start >= 0 ? start : frames.findIndex((f) => f.maxMana !== null);
  const manaFrom = from;
  let max: number | null = null;
  // round 1 senza mana letto (`BOARD_START_FRAMES`): dopo l'ultima VS, il primo tabellone con carte è il round 1
  const firstMax = from >= 0 ? frames[from].maxMana : null;
  if (firstMax === null || firstMax <= START_MAX_MANA) {
    const end = from >= 0 ? from : frames.length;
    let lastVs = -1;
    for (let i = 0; i < end; i++) if (frames[i].vs) lastVs = i;
    const board1 = lastVs >= 0 ? frames.findIndex((f, i) => i > lastVs && i < end && !f.vs && f.board.some(Boolean)) : -1;
    if (board1 >= 0) {
      from = board1;
      max = 2;
    }
  }
  const manaRounds = new Map<number, ScanFrame[]>();
  const byRound = new Map<number, ScanFrame[]>();
  for (const [i, f] of frames.entries()) {
    if (i < from || from < 0) continue;
    if (f.maxMana !== null && (manaFrom < 0 || i >= manaFrom) && (max === null || f.maxMana >= max)) max = f.maxMana;
    if (max === null) continue;
    const r = roundOf(max);
    if (r < 1) continue;
    if (!manaRounds.has(r)) manaRounds.set(r, []);
    manaRounds.get(r)!.push(f);
  }
  // i round dopo il nono hanno tutti il mana massimo a 10: si dividono dove comincia una nuova pianificazione
  // (`splitByPhase`, 05/11/2026), mai fino al numero del round di mana dopo (allora la divisione sarebbe sbagliata)
  const sortedMana = [...manaRounds.keys()].sort((a, b) => a - b);
  sortedMana.forEach((r, i) => {
    const fs = manaRounds.get(r)!;
    const parts = splitByPhase(fs);
    const next = sortedMana[i + 1] ?? Infinity;
    if (parts.length > 1 && r + parts.length - 1 < next) parts.forEach((p, j) => byRound.set(r + j, p));
    else byRound.set(r, fs);
  });
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  const plays: ScannedPlay[] = [];
  const drawn: Record<string, number> = {};
  const graveyard: { me: string[]; opp: string[] } = { me: [], opp: [] };
  let reborn: Record<Side, Map<string, number>> = { me: new Map(), opp: new Map() };
  let prevHand: GraveHand | null = null;
  let before = new Map<string, number>();
  for (const r of rounds) {
    const fs = byRound.get(r)!;
    const per = fs.map(counts);
    const ids = new Set(per.flatMap((m) => [...m.keys()]));
    // le copie arrivate sul tabellone (carte create comprese, che servono al cimitero) e dove compaiono
    const arrivals = new Map<string, number>();
    const lanes = new Map<string, number>();
    for (const id of ids) {
      const [side, key] = id.split("|") as [Side, string];
      // copie stabili: il numero più alto raggiunto in almeno STABLE_FRAMES fotogrammi
      const seen = per.map((m) => m.get(id) ?? 0).sort((a, b) => b - a);
      const stable = seen[STABLE_FRAMES - 1] ?? 0;
      const fresh = stable - (before.get(id) ?? 0);
      if (fresh <= 0) continue;
      arrivals.set(id, fresh);
      // il luogo: dove compare la prima volta in questo round
      const first = fs.findIndex((f) => f.board.some((k, i) => k === key && sideOf(i) === side));
      const slot = first >= 0 ? fs[first].board.findIndex((k, i) => k === key && sideOf(i) === side) : -1;
      lanes.set(id, slot >= 0 ? BOARD_SLOTS[slot].lane : 0);
    }
    // le magie, che non restano sul tabellone: dal riquadro in alto a sinistra (13/10/2026)
    const spells = spellPlays(fs, r, cards);
    // il cimitero (05/11/2026): le carte tornate in campo dal cimitero non sono giocate
    const step = graveyardStep({ frames: fs, per, before, arrivals, spells, plays, grave: graveyard, reborn, prevHand, ongoing: r === rounds[rounds.length - 1], cards });
    reborn = step.reborn;
    prevHand = step.hand;
    for (const [id, fresh] of arrivals) {
      const [side, key] = id.split("|") as [Side, string];
      if (cards.token(key)) continue;
      const n = fresh - (step.back.get(id) ?? 0);
      for (let c = 0; c < n; c++) plays.push({ turn: r, me: side === "me", card: key, lane: lanes.get(id) ?? 0 });
    }
    plays.push(...spells);
    // carte pescate: in mano adesso più le giocate nei round prima (copie in mano stabili per STABLE_FRAMES fotogrammi)
    const handSeen = new Map<string, number[]>();
    for (const f of fs) {
      const n = new Map<string, number>();
      for (const k of f.hand ?? []) n.set(k, (n.get(k) ?? 0) + 1);
      for (const [k, c] of n) handSeen.set(k, [...(handSeen.get(k) ?? []), c]);
    }
    for (const [k, list] of handSeen) {
      const stable = list.sort((a, b) => b - a)[STABLE_FRAMES - 1] ?? 0;
      if (!stable) continue;
      const before = plays.filter((p) => p.me && p.card === k && p.turn < r).length;
      drawn[k] = Math.max(drawn[k] ?? 0, stable + before);
    }
    // il tabellone alla fine del round: il massimo degli ultimi END_FRAMES fotogrammi, ma solo con le copie viste davvero
    // nel round (stabili): una lettura sbagliata in uno degli ultimi fotogrammi (una mia carta letta per un attimo dal
    // lato dell'avversario mentre attacca) sembrava una carta morta nel round dopo (05/11/2026, cimiteri)
    const stableNow = stableCounts(per);
    before = new Map([...endCounts(per)].map(([id, n]) => [id, Math.min(n, stableNow.get(id) ?? 0)] as [string, number]).filter(([, n]) => n > 0));
  }

  const vs = frames.filter((f) => f.vs);
  const opponentCards: string[] = [];
  // solo Leggendarie vere: una magia letta al posto della carta della schermata VS (Defense Matrix, patch 0.7, 19/10/2026)
  // finiva nelle statistiche come Leggendaria avversaria
  const oppLegendary = mode(vs.map((f) => f.vs!.opp).filter((k) => cards.legendary(k))) ?? plays.find((p) => !p.me && cards.legendary(p.card))?.card ?? null;
  if (oppLegendary) opponentCards.push(oppLegendary);
  for (const p of plays) if (p.me) drawn[p.card] = Math.max(drawn[p.card] ?? 0, plays.filter((q) => q.me && q.card === p.card).length);
  for (const p of plays) if (!p.me && !opponentCards.includes(p.card)) opponentCards.push(p.card);

  return {
    startMs: frames[0]?.ms ?? 0,
    endMs: frames[frames.length - 1]?.ms ?? 0,
    myLegendary: mode(vs.map((f) => f.vs!.me).filter((k) => cards.legendary(k))),
    oppLegendary,
    turns: rounds.length ? rounds[rounds.length - 1] : null,
    plays,
    opponentCards,
    complete: rounds[0] === 1,
    ...resultOf(frames),
    drawn,
    life: { me: lifeOf(frames, "me"), opp: lifeOf(frames, "opp") },
    mana: { me: stableLast(frames, (f) => f.mana?.me ?? null), opp: stableLast(frames, (f) => f.mana?.opp ?? null) },
    direction: stableLast(frames, (f) => f.direction ?? null),
    oppDrawn: oppDrawnOf(frames),
    graveyard,
  };
}

/** L'ultima vita letta per un eroe e confermata da `STABLE_FRAMES` fotogrammi di fila (lampi e animazioni non contano). */
function lifeOf(frames: readonly ScanFrame[], side: Side): number | null {
  return stableLast(frames, (f) => f.life?.[side] ?? null);
}

/**
 * Letture uguali di fila per credere a una mano dell'avversario: 6, circa 3 secondi (12/10/2026: mentre gioca una
 * carta la fila si muove e per un paio di fotogrammi si legge un numero sbagliato; nella partita delle 00:39 con 2
 * letture le pescate erano 17, con 6 sono 14).
 */
export const OPP_HAND_STABLE = 6;
/**
 * La mano dell'avversario deve leggersi in almeno questa parte dei fotogrammi col tabellone, altrimenti la stima non
 * si dà (12/10/2026: i dorsi bianchi e rossi del boss si leggono solo con 3–4 carte, e la stima veniva sbagliata).
 */
export const OPP_HAND_MIN_SHARE = 0.3;

/** Le pescate dell'avversario dalla sua mano: prima lettura confermata più gli aumenti (vedi `oppDrawn`). */
export function oppDrawnOf(frames: readonly ScanFrame[]): number | null {
  const onBoard = frames.filter((f) => f.maxMana !== null).length;
  const read = frames.filter((f) => f.maxMana !== null && typeof f.oppHand === "number").length;
  if (!onBoard || read / onBoard < OPP_HAND_MIN_SHARE) return null;
  let run = 0;
  let prev: number | null = null;
  let held: number | null = null;
  let drawn: number | null = null;
  for (const f of frames) {
    const v = f.oppHand ?? null;
    if (v === null) continue;
    run = v === prev ? run + 1 : 1;
    prev = v;
    if (run !== OPP_HAND_STABLE) continue;
    if (held === null) drawn = v;
    else if (v > held) drawn = (drawn ?? 0) + (v - held);
    held = v;
  }
  return drawn;
}

/** L'ultimo valore letto e confermato da `STABLE_FRAMES` fotogrammi di fila (i fotogrammi senza lettura non contano). */
function stableLast<T>(frames: readonly ScanFrame[], read: (f: ScanFrame) => T | null): T | null {
  let run = 0;
  let prev = "";
  let last: T | null = null;
  for (const f of frames) {
    const v = read(f);
    if (v === null) continue;
    const k = JSON.stringify(v);
    run = k === prev ? run + 1 : 1;
    prev = k;
    if (run >= STABLE_FRAMES) last = v;
  }
  return last;
}

/**
 * L'esito dello stendardo comparso intorno a `atMs` (da 5 s prima a 60 s dopo), anche senza una partita ricostruita:
 * in una finestra piccola il mana si legge a tratti e la partita può non risultare vista dal round 1, ma l'esito resta
 * buono (11/10/2026, Magic in finestra: pannelli giusti, vittorie e sconfitte mai registrate).
 */
export function resultAround(frames: readonly ScanFrame[], atMs: number): { result: "W" | "L" | null; resultAt: number | null } {
  return resultOf(frames.filter((f) => f.ms >= atMs - 5_000 && f.ms <= atMs + 60_000));
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
  if (f.hand !== undefined && !(Array.isArray(f.hand) && f.hand.length <= 12 && f.hand.every(key))) return null;
  const lifeOk = (v: unknown) => v === null || (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 2);
  const life = f.life as Record<string, unknown> | undefined;
  if (life !== undefined && !(life && typeof life === "object" && lifeOk(life.me) && lifeOk(life.opp))) return null;
  const manaOk = (v: unknown): v is Mana | null => {
    if (v === null) return true;
    const m = v as Record<string, unknown> | undefined;
    return Boolean(m && typeof m === "object" && Number.isInteger(m.current) && Number.isInteger(m.max) && (m.max as number) >= 1 && (m.max as number) <= 20 && (m.current as number) >= 0 && (m.current as number) <= (m.max as number));
  };
  const mana = f.mana as Record<string, unknown> | undefined;
  if (mana !== undefined && !(mana && typeof mana === "object" && manaOk(mana.me) && manaOk(mana.opp))) return null;
  if (f.direction !== undefined && f.direction !== null && f.direction !== "left" && f.direction !== "right") return null;
  if (f.oppHand !== undefined && f.oppHand !== null && !(Number.isInteger(f.oppHand) && (f.oppHand as number) >= 0 && (f.oppHand as number) <= 20)) return null;
  if (f.handX !== undefined && !(Array.isArray(f.handX) && Array.isArray(f.hand) && f.handX.length === f.hand.length && f.handX.every((x) => typeof x === "number" && x >= 0 && x <= 1))) return null;
  if (f.spell !== undefined && f.spell !== null && !key(f.spell)) return null;
  if (f.phase !== undefined && f.phase !== "plan" && f.phase !== "reveal") return null;
  const pick = (m: Mana | null) => (m ? { current: m.current, max: m.max } : null);
  return {
    ms: now,
    board: f.board as (string | null)[],
    vs: vs ? { me: vs.me as string, opp: vs.opp as string } : null,
    maxMana: max as number | null,
    result,
    ...(f.hand ? { hand: f.hand as string[] } : {}),
    ...(f.handX ? { handX: f.handX as number[] } : {}),
    ...(life ? { life: { me: life.me as number | null, opp: life.opp as number | null } } : {}),
    ...(mana ? { mana: { me: pick(mana.me as Mana | null), opp: pick(mana.opp as Mana | null) } } : {}),
    ...(f.direction === "left" || f.direction === "right" ? { direction: f.direction } : {}),
    ...(typeof f.oppHand === "number" ? { oppHand: f.oppHand } : {}),
    ...(key(f.spell) ? { spell: f.spell } : f.spell === null ? { spell: null } : {}),
    ...(f.phase === "plan" || f.phase === "reveal" ? { phase: f.phase } : {}),
  };
}
