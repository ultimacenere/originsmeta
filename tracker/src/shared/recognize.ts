/**
 * Riconoscitore delle carte dello scanner (S2, 10/10/2026; guida in docs/tracker.md "Scanner dello schermo").
 * Funzioni pure su pixel RGB/RGBA, senza Electron né Node: le usa l'app sulla ripresa del gioco e lo script di taratura
 * sui fotogrammi salvati.
 *
 * Come funziona: la zona dell'illustrazione di una carta (sul tabellone o nella schermata VS) si riduce a una griglia
 * `VEC × VEC` di colori medi, si toglie la media e si normalizza; la carta è quella dell'immagine del sito con la
 * correlazione più alta (`bestMatch`), purché stacchi di `ACCEPT.margin` la seconda. Uno spazio vuoto o il dorso di una
 * carta somigliano un po' a tutto e a niente in particolare: il distacco basso li scarta. Taratura del 10/10 su
 * 3 partite a 2560 × 1440: carte vere 0,62–0,96 con la seconda sotto 0,57, spazi vuoti 0,71 con distacco sotto 0,05.
 *
 * Le posizioni sono frazioni dell'area di gioco 16:9 (`gameArea`), misurate sui fotogrammi del 10/10/2026 (Demo 0.7,
 * interfaccia in italiano, tabellone a tre luoghi con tre spazi per lato).
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Side = "me" | "opp";
export type Slot = { side: Side; lane: 1 | 2 | 3; slot: 1 | 2 | 3; rect: Rect };

/** Un'immagine: pixel uno dopo l'altro, riga per riga, con 3 (RGB) o 4 (RGBA) canali. */
export type Img = { data: ArrayLike<number>; width: number; height: number; channels: 3 | 4 };

/** Lato della griglia dei colori medi: 20 × 20 × 3 = 1200 numeri per carta. */
export const VEC = 20;
export const VEC_LEN = VEC * VEC * 3;

/** Soglie del riconoscimento: correlazione minima e distacco minimo dalla seconda carta. */
export const ACCEPT = { min: 0.5, margin: 0.2 } as const;

/** Zona dell'illustrazione dentro l'immagine intera di una carta (480 × 690 sul sito; vale anche per la schermata VS). */
export const ART_IN_CARD: Rect = { x: 40 / 480, y: 62 / 690, w: 395 / 480, h: 303 / 690 };
/** Zona dell'illustrazione dentro uno spazio del tabellone, dove la parte bassa della carta mostra le statistiche. */
export const ART_IN_SLOT: Rect = { x: 0.08, y: 0.06, w: 0.84, h: 0.46 };

// Misure prese su 2000 × 1125 (fotogrammi 2560 × 1440 ridotti), qui in frazioni
const SW = 2000;
const SH = 1125;
const LANE_X = {
  opp: [[335, 465], [475, 605], [615, 745], [793, 922], [935, 1065], [1077, 1207], [1258, 1385], [1397, 1525], [1537, 1665]],
  me: [[297, 440], [447, 588], [595, 735], [785, 925], [935, 1065], [1080, 1215], [1265, 1405], [1412, 1552], [1557, 1697]],
} as const;
const ROW_Y = { opp: [275, 430], me: [543, 712] } as const;

/** I 18 spazi del tabellone: l'avversario in alto, il giocatore in basso; luoghi e spazi da sinistra. */
export const BOARD_SLOTS: readonly Slot[] = (["opp", "me"] as const).flatMap((side) =>
  LANE_X[side].map(([x0, x1], i) => ({
    side,
    lane: (Math.floor(i / 3) + 1) as 1 | 2 | 3,
    slot: ((i % 3) + 1) as 1 | 2 | 3,
    rect: { x: x0 / SW, y: ROW_Y[side][0] / SH, w: (x1 - x0) / SW, h: (ROW_Y[side][1] - ROW_Y[side][0]) / SH },
  })),
);

/**
 * Le due Leggendarie della schermata VS prima della partita: il giocatore a sinistra, l'avversario a destra. Due
 * posizioni per lato: la carta normale e la carta in teca (versione gradata, più grande e più in alto: la Leggendaria
 * dell'avversario nella partita del 10/10 delle 02:17). Vale quella riconosciuta con la correlazione più alta.
 */
export const VS_CARDS: Record<Side, readonly Rect[]> = {
  me: [
    { x: 717 / SW, y: 828 / SH, w: 178 / SW, h: 260 / SH },
    { x: 706 / SW, y: 806 / SH, w: 204 / SW, h: 293 / SH },
  ],
  opp: [
    { x: 1105 / SW, y: 828 / SH, w: 178 / SW, h: 260 / SH },
    { x: 1094 / SW, y: 806 / SH, w: 204 / SW, h: 293 / SH },
  ],
};

/** L'area 16:9 del gioco dentro l'immagine (centrata: bande nere ai lati o sopra e sotto). */
export function gameArea(width: number, height: number): Rect {
  const target = 16 / 9;
  if (width / height > target) {
    const w = height * target;
    return { x: (width - w) / 2, y: 0, w, h: height };
  }
  const h = width / target;
  return { x: 0, y: (height - h) / 2, w: width, h };
}

/** Un rettangolo dentro un altro (frazioni → pixel). */
export function inside(outer: Rect, inner: Rect): Rect {
  return { x: outer.x + inner.x * outer.w, y: outer.y + inner.y * outer.h, w: inner.w * outer.w, h: inner.h * outer.h };
}

/** Griglia `VEC × VEC` dei colori medi di un rettangolo in pixel, senza media e di lunghezza 1. */
export function artVector(img: Img, r: Rect): Float32Array {
  const out = new Float32Array(VEC_LEN);
  const x0 = Math.max(0, Math.round(r.x));
  const y0 = Math.max(0, Math.round(r.y));
  const x1 = Math.min(img.width, Math.round(r.x + r.w));
  const y1 = Math.min(img.height, Math.round(r.y + r.h));
  if (x1 - x0 < VEC || y1 - y0 < VEC) return out;
  const ch = img.channels;
  const d = img.data;
  for (let gy = 0; gy < VEC; gy++) {
    const ya = y0 + Math.floor(((y1 - y0) * gy) / VEC);
    const yb = y0 + Math.floor(((y1 - y0) * (gy + 1)) / VEC);
    for (let gx = 0; gx < VEC; gx++) {
      const xa = x0 + Math.floor(((x1 - x0) * gx) / VEC);
      const xb = x0 + Math.floor(((x1 - x0) * (gx + 1)) / VEC);
      let r0 = 0;
      let g0 = 0;
      let b0 = 0;
      for (let y = ya; y < yb; y++) {
        let p = (y * img.width + xa) * ch;
        for (let x = xa; x < xb; x++, p += ch) {
          r0 += d[p];
          g0 += d[p + 1];
          b0 += d[p + 2];
        }
      }
      const n = (yb - ya) * (xb - xa) || 1;
      const o = (gy * VEC + gx) * 3;
      out[o] = r0 / n;
      out[o + 1] = g0 / n;
      out[o + 2] = b0 / n;
    }
  }
  return normalize(out);
}

/** Toglie la media e porta a lunghezza 1 (un vettore piatto, tutto dello stesso colore, resta a zero). */
export function normalize(v: Float32Array): Float32Array {
  let mean = 0;
  for (let i = 0; i < v.length; i++) mean += v[i];
  mean /= v.length || 1;
  let norm = 0;
  for (let i = 0; i < v.length; i++) {
    v[i] -= mean;
    norm += v[i] * v[i];
  }
  norm = Math.sqrt(norm);
  if (norm < 1e-6) return v.fill(0);
  for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

export type CardRef = { key: string; v: Float32Array };
export type Match = { key: string | null; score: number; margin: number; best: string | null };

/** La carta più somigliante; `key` è null se non supera le soglie (spazio vuoto, dorso, carta coperta a metà). */
export function bestMatch(v: Float32Array, refs: readonly CardRef[]): Match {
  let best: CardRef | null = null;
  let s1 = -Infinity;
  let s2 = -Infinity;
  for (const ref of refs) {
    let s = 0;
    for (let i = 0; i < VEC_LEN; i++) s += v[i] * ref.v[i];
    if (s > s1) {
      s2 = s1;
      s1 = s;
      best = ref;
    } else if (s > s2) s2 = s;
  }
  if (!best) return { key: null, score: 0, margin: 0, best: null };
  const margin = s1 - (Number.isFinite(s2) ? s2 : 0);
  return { key: s1 >= ACCEPT.min && margin >= ACCEPT.margin ? best.key : null, score: s1, margin, best: best.key };
}

/** Le carte nei 18 spazi del tabellone, nell'ordine di `BOARD_SLOTS`. */
export function readBoard(img: Img, refs: readonly CardRef[]): Match[] {
  const area = gameArea(img.width, img.height);
  return BOARD_SLOTS.map((s) => bestMatch(artVector(img, inside(inside(area, s.rect), ART_IN_SLOT)), refs));
}

/** Le due Leggendarie della schermata VS (key null: non è la schermata VS o non si riconosce). */
export function readVersus(img: Img, refs: readonly CardRef[]): Record<Side, Match> {
  const area = gameArea(img.width, img.height);
  const at = (side: Side): Match => {
    const all = VS_CARDS[side].map((r) => bestMatch(artVector(img, inside(inside(area, r), ART_IN_CARD)), refs));
    return all.filter((m) => m.key).sort((a, b) => b.score - a.score)[0] ?? all[0];
  };
  return { me: at("me"), opp: at("opp") };
}

/* ---------- riferimenti: vettori delle carte del sito, in un JSON compatto (scripts/card-art.mjs) ---------- */

/** Un vettore in 1200 byte (int8, scala su 127) e base64: le correlazioni cambiano di meno di 0,001. */
export function packVector(v: Float32Array): string {
  let max = 0;
  for (let i = 0; i < v.length; i++) max = Math.max(max, Math.abs(v[i]));
  const bytes = new Uint8Array(v.length);
  for (let i = 0; i < v.length; i++) bytes[i] = (Math.round((v[i] / (max || 1)) * 127) + 256) % 256;
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function unpackVector(b64: string): Float32Array {
  const s = atob(b64);
  const v = new Float32Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const b = s.charCodeAt(i);
    v[i] = b > 127 ? b - 256 : b;
  }
  return normalize(v);
}

export function loadRefs(table: Record<string, string>): CardRef[] {
  return Object.entries(table)
    .filter(([, b64]) => typeof b64 === "string" && b64.length > 0)
    .map(([key, b64]) => ({ key, v: unpackVector(b64) }))
    .filter((r) => r.v.length === VEC_LEN);
}

/* ---------- mana del giocatore: "attuale/massimo", da cui il round ---------- */

/**
 * Il testo del mana del giocatore (pannello "MANA DATA" a destra, in basso). Il massimo è il round + 1 in tutte le
 * partite del 10/10/2026 (3 al round 2, 6 al 5, 8 al 7, 10 al 9): carte che danno mana in più potrebbero spostarlo, e
 * `roundOf` lo dice solo come stima. Cifre bianche su fondo scuro, uguali in tutte le lingue del gioco.
 */
export const MANA_TEXT: Rect = { x: 1800 / SW, y: 578 / SH, w: 100 / SW, h: 36 / SH };
const GLYPH_W = 8;
const GLYPH_H = 12;
/** Modelli dei caratteri (8 × 12, "#" acceso) con il rapporto larghezza/altezza, presi dai fotogrammi del 10/10. */
const GLYPHS: readonly (readonly [string, number, string])[] = [
  ["/", 0.52, "....####|...#####|...####.|...####.|..####..|..####..|..####..|.####...|.####...|####....|####....|####...."],
  ["0", 1.0, "..####..|.#####..|#######.|###.###.|###..###|###..###|###..###|###..###|###..###|.#######|.######.|..#####."],
  ["1", 0.68, "#######.|#######.|#######.|..#####.|..#####.|...####.|...#####|...#####|...#####|...#####|...#####|...#####"],
  ["2", 1.04, ".####...|.######.|#######.|.##.###.|....###.|....###.|...####.|..####..|..###...|.#######|.#######|.#######"],
  ["3", 0.96, "#######.|#######.|#######.|...###..|..####..|..#####.|..######|.....###|.....###|.#######|########|.######."],
  ["4", 1.16, "..###...|..###...|..###...|.###....|.###....|.######.|###.###.|########|########|########|....###.|....###."],
  ["5", 0.96, "#######.|#######.|#######.|###.....|######..|#######.|########|....####|.....###|########|#######.|#######."],
  ["6", 1.0, "..#####.|.######.|.######.|####....|###.....|#######.|########|###..###|###..###|.###.###|.#######|..#####."],
  ["7", 1.0, "########|########|########|###.####|###.###.|....###.|....###.|....###.|...####.|...###..|...###..|...###.."],
  ["8", 1.04, ".####...|.######.|#######.|###.###.|###.###.|.######.|.######.|###..###|###..###|####.###|.######.|.######."],
  ["9", 1.0, ".####...|######..|#######.|###.###.|###..###|########|.#######|..##.###|.....###|.######.|.######.|.#####.."],
];
const GLYPH_BITS = GLYPHS.map(([ch, aspect, rows]) => ({ ch, aspect, bits: rows.replace(/\|/g, "").split("").map((c) => (c === "#" ? 1 : 0)) }));
/** Distanza massima (pixel diversi + differenza di proporzioni) per accettare un carattere. */
const GLYPH_MAX_DIST = 20;
const WHITE = 200;

/** Le macchie bianche del rettangolo (componenti connesse), alte almeno il 70% della più alta, da sinistra. */
function whiteGlyphs(img: Img, r: Rect): { bits: number[]; aspect: number }[] {
  const x0 = Math.max(0, Math.round(r.x));
  const y0 = Math.max(0, Math.round(r.y));
  const w = Math.min(img.width, Math.round(r.x + r.w)) - x0;
  const h = Math.min(img.height, Math.round(r.y + r.h)) - y0;
  if (w <= 0 || h <= 0) return [];
  const on = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = ((y0 + y) * img.width + x0 + x) * img.channels;
      on[y * w + x] = img.data[p] > WHITE && img.data[p + 1] > WHITE && img.data[p + 2] > WHITE ? 1 : 0;
    }
  const label = new Int32Array(w * h);
  const parts: { id: number; x0: number; x1: number; y0: number; y1: number }[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!on[i] || label[i]) continue;
    const id = parts.length + 1;
    const part = { id, x0: w, x1: -1, y0: h, y1: -1 };
    const stack = [i];
    label[i] = id;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w;
      const y = (p - x) / w;
      part.x0 = Math.min(part.x0, x);
      part.x1 = Math.max(part.x1, x);
      part.y0 = Math.min(part.y0, y);
      part.y1 = Math.max(part.y1, y);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const q = yy * w + xx;
          if (on[q] && !label[q]) {
            label[q] = id;
            stack.push(q);
          }
        }
    }
    parts.push(part);
  }
  const tallest = Math.max(0, ...parts.map((p) => p.y1 - p.y0 + 1));
  if (tallest < 10) return [];
  return parts
    .filter((p) => p.y1 - p.y0 + 1 >= tallest * 0.7)
    .sort((a, b) => a.x0 - b.x0)
    .map((p) => {
      const pw = p.x1 - p.x0 + 1;
      const ph = p.y1 - p.y0 + 1;
      const bits: number[] = [];
      for (let gy = 0; gy < GLYPH_H; gy++)
        for (let gx = 0; gx < GLYPH_W; gx++) {
          const x = p.x0 + Math.floor((pw * (gx + 0.5)) / GLYPH_W);
          const y = p.y0 + Math.floor((ph * (gy + 0.5)) / GLYPH_H);
          bits.push(label[y * w + x] === p.id ? 1 : 0);
        }
      return { bits, aspect: pw / ph };
    });
}

/** Il carattere più vicino fra i modelli, o null. */
function readGlyph(g: { bits: number[]; aspect: number }): string | null {
  let best: string | null = null;
  let bd = Infinity;
  for (const t of GLYPH_BITS) {
    let d = Math.abs(t.aspect - g.aspect) * 40;
    for (let i = 0; i < t.bits.length; i++) if (t.bits[i] !== g.bits[i]) d++;
    if (d < bd) {
      bd = d;
      best = t.ch;
    }
  }
  return bd <= GLYPH_MAX_DIST ? best : null;
}

/** Il mana del giocatore ("3/6" → { current: 3, max: 6 }), null se il pannello non si legge. */
export function readMana(img: Img): { current: number; max: number } | null {
  const text = whiteGlyphs(img, inside(gameArea(img.width, img.height), MANA_TEXT)).map(readGlyph);
  if (text.some((c) => c === null)) return null;
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(text.join(""));
  if (!m) return null;
  const current = Number(m[1]);
  const max = Number(m[2]);
  return max >= 1 && max <= 20 && current <= max ? { current, max } : null;
}

/** Il round stimato dal mana massimo (vedi `MANA_TEXT`). */
export const roundOf = (maxMana: number): number => maxMana - 1;

/* ---------- esito dallo stendardo di fine partita ---------- */

/**
 * Lo stendardo di fine partita (11/10/2026): testo bianco enorme su una fascia scura, con la parte alta dello schermo
 * scurita, e una pennellata **menta** per la vittoria ("VITTORIA!", "VICTORY!") o **magenta** per la sconfitta
 * ("SCONFITTA!"). Uguale nella demo e nel playtest, e il colore non dipende dalla lingua. Serve dove il gioco non
 * scrive l'esito sul PC: nel playtest le partite online e classificate non lasciano traccia nei file (solo le
 * "offline"). Soglie tarate l'11/10 su 3.700 fotogrammi (3 vittorie e 1 sconfitta della demo, 1 vittoria del
 * playtest): 53 stendardi su 55 riconosciuti, nessun esito sbagliato, l'unico falso stendardo (una dissolvenza) senza
 * colore e quindi senza esito. I conti si fanno su una griglia di 320 × 180 medie, come nella taratura.
 */
export const BANNER = {
  text: { x: 0.04, y: 0.42, w: 0.92, h: 0.2 } as Rect,
  top: { x: 0.04, y: 0.05, w: 0.92, h: 0.2 } as Rect,
  swoosh: { x: 0, y: 0.25, w: 1, h: 0.53 } as Rect,
  minWhite: 20,
  minDark: 10,
  minTopDark: 80,
  minColor: 0.3,
  colorRatio: 1.5,
} as const;
const GRID_W = 320;
const GRID_H = 180;

/** Le medie di colore dell'area di gioco su una griglia 320 × 180 (RGB uno dopo l'altro). */
function colorGrid(img: Img): Uint8Array {
  const area = gameArea(img.width, img.height);
  const out = new Uint8Array(GRID_W * GRID_H * 3);
  const ch = img.channels;
  const d = img.data;
  for (let gy = 0; gy < GRID_H; gy++) {
    const ya = Math.floor(area.y + (area.h * gy) / GRID_H);
    const yb = Math.max(ya + 1, Math.floor(area.y + (area.h * (gy + 1)) / GRID_H));
    for (let gx = 0; gx < GRID_W; gx++) {
      const xa = Math.floor(area.x + (area.w * gx) / GRID_W);
      const xb = Math.max(xa + 1, Math.floor(area.x + (area.w * (gx + 1)) / GRID_W));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      // ogni secondo pixel: la media cambia di poco e il conto si dimezza due volte
      for (let y = ya; y < yb && y < img.height; y += 2)
        for (let x = xa; x < xb && x < img.width; x += 2) {
          const p = (y * img.width + x) * ch;
          r += d[p];
          g += d[p + 1];
          b += d[p + 2];
          n++;
        }
      const o = (gy * GRID_W + gx) * 3;
      out[o] = n ? r / n : 0;
      out[o + 1] = n ? g / n : 0;
      out[o + 2] = n ? b / n : 0;
    }
  }
  return out;
}

/** Percentuale delle celle di un rettangolo (frazioni dell'area di gioco) che passano il controllo. */
function share(grid: Uint8Array, r: Rect, test: (r: number, g: number, b: number) => boolean): number {
  let c = 0;
  let n = 0;
  for (let y = Math.round(GRID_H * r.y); y < Math.round(GRID_H * (r.y + r.h)); y++)
    for (let x = Math.round(GRID_W * r.x); x < Math.round(GRID_W * (r.x + r.w)); x++) {
      const p = (y * GRID_W + x) * 3;
      n++;
      if (test(grid[p], grid[p + 1], grid[p + 2])) c++;
    }
  return n ? (100 * c) / n : 0;
}

export type BannerFeatures = { white: number; dark: number; topDark: number; mint: number; magenta: number };

export function bannerFeatures(img: Img): BannerFeatures {
  const g = colorGrid(img);
  return {
    white: share(g, BANNER.text, (r, gg, b) => r > 200 && gg > 200 && b > 200),
    dark: share(g, BANNER.text, (r, gg, b) => r + gg + b < 150),
    topDark: share(g, BANNER.top, (r, gg, b) => r + gg + b < 150),
    mint: share(g, BANNER.swoosh, (r, gg, b) => gg > 170 && b > 120 && r < 120 && gg - r > 90),
    magenta: share(g, BANNER.swoosh, (r, gg, b) => r > 170 && b > 100 && gg < 90 && r - gg > 110),
  };
}

/** L'esito dalle misure dello stendardo: "W", "L" o null (niente stendardo, o colore incerto). */
export function resultFromBanner(f: BannerFeatures): "W" | "L" | null {
  if (f.white < BANNER.minWhite || f.dark < BANNER.minDark || f.topDark < BANNER.minTopDark) return null;
  if (f.mint >= BANNER.minColor && f.mint > f.magenta * BANNER.colorRatio) return "W";
  if (f.magenta >= BANNER.minColor && f.magenta > f.mint * BANNER.colorRatio) return "L";
  return null;
}

export const readResult = (img: Img): "W" | "L" | null => resultFromBanner(bannerFeatures(img));
