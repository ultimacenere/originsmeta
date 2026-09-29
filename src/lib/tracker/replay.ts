/**
 * Replay di Origins TCG (tracker/overlay, Fase 1, 29/09/2026): lettura pura, senza file system, così la stessa
 * funzione gira nell'app desktop, nei test e, se servirà, nel browser.
 *
 * Il gioco scrive a fine partita `Documenti\My Games\Origins TCG Demo\Replays\LatestMatch_<modalità>_<data>.replay`
 * e lo sovrascrive alla partita dopo (dettagli e regole in docs/tracker.md). È un binario a campi con tag; la
 * grammatica viene dal decodificatore pubblico github.com/bentodd1/origins-tracker (build 0.6.3, su Mac) più il tag
 * 0x00, un valore vuoto senza byte che la Demo 2.0 per Windows usa e quel decodificatore non conosceva:
 *
 *   file   := u8 versione, poi (idCampo u8, valore)* fino alla fine
 *   valore := tag u8 + contenuto
 *     00 vuoto · 01 bool (u8) · 02 u8 · 03 i8 · 04 i16le · 05 i32le · 07 u16le · 0e stringa (varint + utf8)
 *     0f array: tag degli elementi u8, numero u16le, elementi senza tag (11 = oggetti, ognuno preceduto da 0x10)
 *     10 oggetto: tipo u8, numero di campi u8, poi (idCampo u8, valore) per ogni campo
 *
 * Campi usati (confermati il 29/09/2026 su 5 replay della Demo 2.0): in testa 2 = configurazione (0 arena, 37 luoghi),
 * 3 = i due giocatori, 4 = i record dei turni. Giocatore: 0 id dell'account, 1 nome, 2 bot, 5.0 mazzo (13 carte più
 * una voce "Tower…" che non è una carta), 7 rank, 11 eroe. Record dei turni: 0 = eventi; evento 3 = giocata
 * confermata (2 giocatore, 50 istanza, 51 corsia, 255 = nessuna, 53 posto); evento 1 nel record 2 = carta del
 * mulligan (significato da confermare). Istanze: ogni carta del mazzo ne ha due consecutive nell'ordine della lista,
 * la Leggendaria una; il giocatore 0 parte da 1, il giocatore 1 da 30; oltre il mazzo sono carte generate in partita.
 * Turni: 4 record per turno (record 4 = turno 1, 8 = turno 2…), il record 2 è il mulligan.
 *
 * Privacy (regole del tracker, docs/tracker.md): nomi e id dei giocatori restano dentro questo modulo. `readReplay`
 * non li restituisce mai; l'id dell'account serve solo a riconoscere il giocatore e arriva da fuori (`accountId`).
 * Il flag bot (`ReplayPlayer.isBot`) e la modalità del nome del file ("BotBattle") servono solo qui e in `pickMe`:
 * il tracker non dice mai se l'avversario è un bot o una persona (Pierluigi, 29/09/2026), quindi non entrano nella
 * partita registrata (`TrackedMatch` di match.ts).
 */

export type ReplayValue = null | boolean | number | string | ReplayValue[] | ReplayObject;
export type ReplayObject = { kind: number; fields: Map<number, ReplayValue> };
export type ReplayTree = { version: number; fields: Map<number, ReplayValue> };

// niente proprietà nei parametri del costruttore: Node esegue i test togliendo solo i tipi e non le accetta
export class ReplayFormatError extends Error {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(`${message} (byte ${offset})`);
    this.name = "ReplayFormatError";
    this.offset = offset;
  }
}

/** Oltre questa misura il file non è un replay (i veri stanno fra 4 e 20 KB). */
export const REPLAY_MAX_BYTES = 4 * 1024 * 1024;

class Reader {
  private i = 0;
  private readonly bytes: Uint8Array;
  private readonly view: DataView;
  private readonly utf8 = new TextDecoder("utf-8");

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get done() {
    return this.i >= this.bytes.length;
  }

  private need(n: number) {
    if (this.i + n > this.bytes.length) throw new ReplayFormatError("il file finisce prima del previsto", this.i);
  }

  u8() {
    this.need(1);
    return this.bytes[this.i++];
  }

  private varint() {
    let value = 0;
    for (let shift = 0; shift <= 28; shift += 7) {
      const c = this.u8();
      value += (c & 0x7f) * 2 ** shift;
      if (!(c & 0x80)) return value;
    }
    throw new ReplayFormatError("lunghezza di una stringa non valida", this.i);
  }

  private fixed(n: 1 | 2 | 4, read: (at: number) => number) {
    this.need(n);
    const v = read(this.i);
    this.i += n;
    return v;
  }

  private string() {
    const n = this.varint();
    this.need(n);
    const s = this.utf8.decode(this.bytes.subarray(this.i, this.i + n));
    this.i += n;
    return s;
  }

  private raw(tag: number): ReplayValue {
    switch (tag) {
      case 0x00:
        return null;
      case 0x01:
        return this.u8() !== 0;
      case 0x02:
        return this.u8();
      case 0x03:
        return this.fixed(1, (at) => this.view.getInt8(at));
      case 0x04:
        return this.fixed(2, (at) => this.view.getInt16(at, true));
      case 0x05:
        return this.fixed(4, (at) => this.view.getInt32(at, true));
      case 0x07:
        return this.fixed(2, (at) => this.view.getUint16(at, true));
      case 0x0e:
        return this.string();
      case 0x11: {
        const t = this.u8();
        if (t !== 0x10) throw new ReplayFormatError(`oggetto di un array con tag 0x${t.toString(16)}`, this.i - 1);
        return this.object();
      }
      default:
        throw new ReplayFormatError(`tag sconosciuto 0x${tag.toString(16).padStart(2, "0")}`, this.i - 1);
    }
  }

  value(): ReplayValue {
    const tag = this.u8();
    if (tag === 0x0f) {
      const elementTag = this.u8();
      const count = this.fixed(2, (at) => this.view.getUint16(at, true));
      const out: ReplayValue[] = [];
      for (let k = 0; k < count; k++) out.push(this.raw(elementTag));
      return out;
    }
    if (tag === 0x10) return this.object();
    return this.raw(tag);
  }

  object(): ReplayObject {
    const kind = this.u8();
    const count = this.u8();
    const fields = new Map<number, ReplayValue>();
    for (let k = 0; k < count; k++) {
      const id = this.u8();
      fields.set(id, this.value());
    }
    return { kind, fields };
  }
}

/** Albero grezzo del replay. Lancia `ReplayFormatError` se il file non segue la grammatica (formato cambiato o file rotto). */
export function parseReplay(bytes: Uint8Array): ReplayTree {
  if (bytes.length > REPLAY_MAX_BYTES) throw new ReplayFormatError("file troppo grande per essere un replay", 0);
  if (bytes.length < 2) throw new ReplayFormatError("file vuoto", 0);
  const r = new Reader(bytes);
  const version = r.u8();
  const fields = new Map<number, ReplayValue>();
  while (!r.done) {
    const id = r.u8();
    fields.set(id, r.value());
  }
  return { version, fields };
}

/* ---------- lettura dei campi ---------- */

const isObject = (v: ReplayValue | undefined): v is ReplayObject => typeof v === "object" && v !== null && !Array.isArray(v);
const field = (v: ReplayValue | undefined, id: number): ReplayValue | undefined => (isObject(v) ? v.fields.get(id) : undefined);
const text = (v: ReplayValue | undefined): string | null => (typeof v === "string" ? v : null);
const int = (v: ReplayValue | undefined): number | null => (typeof v === "number" ? v : null);
const list = (v: ReplayValue | undefined): ReplayValue[] => (Array.isArray(v) ? v : []);

/** Chiave della carta senza variante cosmetica: "C00176_MC_V00000" → "C00176_MC" (come `baseKey` di deckcode.ts). */
export const cardBaseKey = (key: string) => key.replace(/_V\d+$/, "");
/** Le Leggendarie hanno la seconda lettera del suffisso "C" (_MC unità, _SC magia); le carte base "B". */
export const isLegendaryKey = (key: string) => /_[A-Z]C(?:_V\d+)?$/.test(key);

/** Istanza del primo giocatore e del secondo (vedi l'intestazione). */
export const INSTANCE_START = [1, 30] as const;
/** Corsia di una giocata senza corsia (le magie). */
export const NO_LANE = 255;
/** Record dei turni per ogni turno; il record 2 è il mulligan. */
export const RECORDS_PER_TURN = 4;
const MULLIGAN_RECORD = 2;
const EVENT_PLAY = 3;
const EVENT_MULLIGAN = 1;

export type ReplayPlayer = {
  index: 0 | 1;
  /** true solo se l'id dell'account passato a `readReplay` è quello di questo giocatore. */
  isMe: boolean;
  /** Solo per riconoscere il giocatore (`pickMe`): non si mostra né si salva mai (vedi l'intestazione). */
  isBot: boolean;
  rank: string | null;
  /** Le 13 carte nell'ordine del file, con la variante (C00176_MC_V00000); la voce "Tower…" è tolta. */
  deck: string[];
  legendary: string | null;
};

export type ReplayPlay = {
  turn: number;
  player: 0 | 1;
  /** Chiave della carta giocata; null per una carta generata in partita (istanza oltre il mazzo). */
  card: string | null;
  lane: number | null;
  slot: number | null;
};

export type ReplayMatch = {
  version: number;
  arena: string | null;
  locationPool: string | null;
  players: ReplayPlayer[];
  /** Ultimo turno con una giocata. */
  turns: number;
  plays: ReplayPlay[];
  mulligan: { player: 0 | 1; card: string | null }[];
  /** Giocate con un'istanza che non torna con la regola (0 nei replay veri): se sale, il formato è cambiato. */
  unmapped: number;
};

/** Mazzo espanso nell'ordine delle istanze: due copie per carta, una per la Leggendaria. */
export function instanceDeck(deck: string[]): string[] {
  const out: string[] = [];
  for (const key of deck) {
    out.push(key);
    if (!isLegendaryKey(key)) out.push(key);
  }
  return out;
}

/** Carta di un'istanza: la chiave, null se è una carta generata, undefined se l'istanza non torna con la regola. */
export function cardOfInstance(player: 0 | 1, instance: number, expanded: string[]): string | null | undefined {
  const j = instance - INSTANCE_START[player];
  if (j < 0) return undefined;
  return j < expanded.length ? expanded[j] : null;
}

export function readReplay(tree: ReplayTree, opts: { accountId?: string | null } = {}): ReplayMatch {
  const config = tree.fields.get(2);
  const rawPlayers = list(tree.fields.get(3)).slice(0, 2);
  const players: ReplayPlayer[] = rawPlayers.map((p, index) => {
    const deck = list(field(field(p, 5), 0))
      .map((c) => text(field(c, 0)))
      .filter((k): k is string => k !== null && !k.startsWith("Tower"));
    return {
      index: index as 0 | 1,
      isMe: Boolean(opts.accountId) && text(field(p, 0)) === opts.accountId,
      isBot: field(p, 2) === true,
      rank: text(field(p, 7)),
      deck,
      legendary: deck.find(isLegendaryKey) ?? null,
    };
  });
  const expanded = players.map((p) => instanceDeck(p.deck));

  const plays: ReplayPlay[] = [];
  const mulligan: ReplayMatch["mulligan"] = [];
  let turns = 0;
  let unmapped = 0;
  list(tree.fields.get(4)).forEach((record, recordIndex) => {
    for (const event of list(field(record, 0))) {
      const type = int(field(event, 0));
      const who = int(field(event, 2));
      const instance = int(field(event, 50));
      if ((who !== 0 && who !== 1) || instance === null || !expanded[who]) continue;
      const found = cardOfInstance(who, instance, expanded[who]);
      const card = found ?? null;
      if (type === EVENT_MULLIGAN && recordIndex === MULLIGAN_RECORD) {
        mulligan.push({ player: who, card });
      } else if (type === EVENT_PLAY) {
        if (found === undefined) unmapped++;
        const turn = Math.floor(recordIndex / RECORDS_PER_TURN);
        const lane = int(field(event, 51));
        turns = Math.max(turns, turn);
        plays.push({ turn, player: who, card, lane: lane === null || lane === NO_LANE ? null : lane, slot: int(field(event, 53)) });
      }
    }
  });

  return {
    version: tree.version,
    arena: text(field(config, 0)),
    locationPool: text(field(config, 37)),
    players,
    turns,
    plays,
    mulligan,
    unmapped,
  };
}

/**
 * Nome del file del replay → modalità e ora locale scritta nel nome. Su Windows la Demo 2.0 scrive
 * "LatestMatch_BotBattle_2026-09-29_02-51-19.replay"; su Mac il tracker pubblico ha visto
 * "LatestMatch_<nome>_vs_<nome>_<data>.replay": i nomi non si restituiscono mai (modalità "vs").
 */
export function replayFileInfo(filename: string): { mode: string; localStamp: string } | null {
  const m = /^LatestMatch_(.+)_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})\.replay$/.exec(filename);
  if (!m) return null;
  const localStamp = `${m[2]}T${m[3]}:${m[4]}:${m[5]}`;
  if (m[1].includes("_vs_")) return { mode: "vs", localStamp };
  return { mode: /^[A-Za-z0-9]{1,40}$/.test(m[1]) ? m[1] : "other", localStamp };
}
