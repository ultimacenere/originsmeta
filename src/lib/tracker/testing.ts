/**
 * Replay finti per i test del tracker (usati da tracker.test.ts e dai test dell'app in tracker/): un piccolo
 * codificatore della stessa grammatica di replay.ts, così nel repo non entra nessun file del gioco (sono materiale di
 * Koin e contengono i nomi dei giocatori). Nessun import: si carica anche senza l'hook di risoluzione dei moduli.
 */

type Bytes = number[];
type Fields = [number, Bytes][];

const utf8 = new TextEncoder();
const u16 = (n: number): Bytes => [n & 0xff, (n >> 8) & 0xff];
const varint = (n: number): Bytes => {
  const out: Bytes = [];
  do {
    let c = n & 0x7f;
    n >>>= 7;
    if (n) c |= 0x80;
    out.push(c);
  } while (n);
  return out;
};
const rawString = (s: string): Bytes => {
  const b = [...utf8.encode(s)];
  return [...varint(b.length), ...b];
};
const body = (fields: Fields, kind = 2): Bytes => [kind, fields.length, ...fields.flatMap(([id, v]) => [id, ...v])];
const V = {
  nil: (): Bytes => [0x00],
  bool: (b: boolean): Bytes => [0x01, b ? 1 : 0],
  u8: (n: number): Bytes => [0x02, n],
  i32: (n: number): Bytes => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setInt32(0, n, true);
    return [0x05, ...b];
  },
  str: (s: string): Bytes => [0x0e, ...rawString(s)],
  obj: (fields: Fields): Bytes => [0x10, ...body(fields)],
  objects: (items: Fields[]): Bytes => [0x0f, 0x11, ...u16(items.length), ...items.flatMap((f) => [0x10, ...body(f)])],
  strings: (items: string[]): Bytes => [0x0f, 0x0e, ...u16(items.length), ...items.flatMap(rawString)],
};

/** Corsia delle giocate senza corsia (NO_LANE di replay.ts). */
const NO_LANE = 255;

export const ME = { id: "5550001", name: "PlayerOne" };
export const BOT = { id: "9990002", name: "RobotoName" };
/** Mazzi come nei file veri: Leggendaria per prima, poi 12 carte base; l'ultima base di MY_DECK è una magia (_SB). */
export const MY_DECK = ["C00176_MC_V00000", ...["C00002_MB", "C00029_MB", "C00032_MB", "C00036_MB", "C00093_MB", "C00159_MB", "C00208_MB", "C00234_SB", "C00267_MB", "C00274_MB", "C00361_MB", "C00169_SB"].map((k) => `${k}_V00000`)];
export const BOT_DECK = ["C00012_MC_V00000", ...["C00031_MB", "C00040_MB", "C00041_MB", "C00046_MB", "C00050_MB", "C00060_MB", "C00070_MB", "C00080_MB", "C00090_MB", "C00100_MB", "C00110_MB", "C00120_SB"].map((k) => `${k}_V00000`)];

const card = (key: string): Fields => [
  [0, V.str(key)],
  [3, V.str("CB00015")],
  [4, V.nil()],
  [5, V.i32(-1)],
];
const player = (p: { id: string; name: string }, bot: boolean, rank: string, deck: string[]): Fields => [
  [0, V.str(p.id)],
  [1, V.str(p.name)],
  [2, V.bool(bot)],
  [5, V.obj([[0, V.objects([...deck, "Tower_V00000"].map(card))]])],
  [7, V.str(rank)],
  [11, V.str("H0010_V00000")],
];
const event = (type: number, who: number, instance: number, lane?: number, slot?: number): Fields => {
  const f: Fields = [
    [0, V.u8(type)],
    [2, V.u8(who)],
    [50, V.u8(instance)],
  ];
  if (lane !== undefined) f.push([51, V.u8(lane)]);
  if (slot !== undefined) f.push([53, V.u8(slot)]);
  return f;
};
const record = (events: Fields[]): Fields => [
  [0, V.objects(events)],
  [1, V.strings([])],
];

/**
 * Replay finto: record 2 = mulligan, record 4 = turno 1, record 8 = turno 2. Il giocatore 0 è ME con MY_DECK;
 * l'avversario è un bot con rank "Master", salvo opzioni.
 */
export function syntheticReplay(opts: { opponentBot?: boolean; opponentRank?: string } = {}): Uint8Array {
  const records: Fields[] = Array.from({ length: 9 }, () => record([]));
  records[2] = record([event(1, 0, 4), event(1, 1, 33)]);
  records[4] = record([event(3, 0, 2, 0, 0), event(3, 1, 30, 1, 2)]);
  // istanze del mazzo: 1–25 per il giocatore 0, 30–54 per il giocatore 1; 26 e 55 sono carte generate in partita
  records[8] = record([event(3, 0, 26, NO_LANE, 0), event(3, 1, 55, NO_LANE, 0), event(3, 0, 1, 2, 1)]);
  return new Uint8Array([
    5,
    2,
    ...V.obj([
      [0, V.str("03_Arena")],
      [1, V.i32(123456)],
      [37, V.str("Pool_0001")],
    ]),
    3,
    ...V.objects([player(ME, false, "Bronze III", MY_DECK), player(BOT, opts.opponentBot ?? true, opts.opponentRank ?? "Master", BOT_DECK)]),
    4,
    ...V.objects(records),
  ]);
}

/** File delle statistiche del profilo come lo scrive la cache di Beamable. */
export function statsJson(stats: Record<string, string>, accountId: number | string = Number(ME.id)): string {
  return JSON.stringify({ results: [{ id: accountId, stats: Object.entries(stats).map(([k, v]) => ({ k, v })) }] });
}

/** Inventario con i mazzi: ogni mazzo {nome, carte con la variante}. */
export function inventoryJson(decks: { name: string; cards: string[]; preset?: string }[]): string {
  return JSON.stringify({
    currencies: [],
    items: [
      { id: "items.Avatar.PlayerAvatar", items: [] },
      {
        id: "items.Deck.Web2Deck",
        items: decks.map((d, i) => ({
          id: String(200 + i),
          properties: [
            { name: "Config", value: JSON.stringify({ DisplayName: d.name, Cards: d.cards.map((k, j) => ({ CardKey: k, CardId: j + 1 })) }) },
            { name: "DeckPresetKey", value: d.preset ?? "" },
          ],
        })),
      },
    ],
  });
}
