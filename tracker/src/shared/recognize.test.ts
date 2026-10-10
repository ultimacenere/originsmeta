/** Test del riconoscitore dello scanner (recognize.ts) su immagini sintetiche: `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import cardArt from "../card-art.json";
import cards from "../cards.json";
import {
  ACCEPT,
  ART_IN_SLOT,
  artVector,
  BOARD_SLOTS,
  bestMatch,
  gameArea,
  inside,
  loadRefs,
  MANA_TEXT,
  packVector,
  readBoard,
  readMana,
  resultFromBanner,
  readVersus,
  unpackVector,
  VEC,
  VS_CARDS,
  type CardRef,
  type Img,
  type Rect,
} from "./recognize";

const refs = loadRefs(cardArt as Record<string, string>);
const W = 1280;
const H = 720;
const blank = (): Img => ({ data: new Uint8ClampedArray(W * H * 4).fill(30), width: W, height: H, channels: 4 });

/** Dipinge in un rettangolo la griglia dei colori di un riferimento (la correlazione non guarda scala e luminosità). */
function paint(img: Img, r: Rect, ref: CardRef) {
  const d = img.data as Uint8ClampedArray;
  for (let gy = 0; gy < VEC; gy++)
    for (let gx = 0; gx < VEC; gx++) {
      const o = (gy * VEC + gx) * 3;
      const ya = Math.round(r.y + (r.h * gy) / VEC);
      const yb = Math.round(r.y + (r.h * (gy + 1)) / VEC);
      const xa = Math.round(r.x + (r.w * gx) / VEC);
      const xb = Math.round(r.x + (r.w * (gx + 1)) / VEC);
      for (let y = ya; y < yb; y++)
        for (let x = xa; x < xb; x++) {
          const p = (y * W + x) * 4;
          for (let c = 0; c < 3; c++) d[p + c] = 128 + ref.v[o + c] * 1500;
        }
    }
}

const ref = (name: string) => {
  const key = Object.entries(cards as Record<string, { n: string }>).find(([, c]) => c.n === name)?.[0];
  const r = refs.find((x) => x.key === key);
  assert.ok(r, name);
  return r;
};

test("riferimenti: uno per carta con immagine, nessuna coppia quasi uguale", () => {
  assert.ok(refs.length >= 220, `riferimenti: ${refs.length}`);
  for (const r of refs) assert.ok(r.key in (cards as object), `${r.key} non è nella tabella delle carte`);
  let worst = 0;
  for (let i = 0; i < refs.length; i++)
    for (let j = i + 1; j < refs.length; j++) {
      let s = 0;
      for (let k = 0; k < refs[i].v.length; k++) s += refs[i].v[k] * refs[j].v[k];
      worst = Math.max(worst, s);
    }
  // Mama Bear e Papa Bear il 10/10: 0,71. Sopra 0,8 il distacco minimo non basterebbe più a separarle
  assert.ok(worst < 0.8, `due carte troppo simili: ${worst}`);
});

test("vettori: compressi senza perdere la correlazione; un'immagine piatta non somiglia a niente", () => {
  for (const r of refs.slice(0, 20)) {
    const back = unpackVector(packVector(r.v));
    let s = 0;
    for (let i = 0; i < back.length; i++) s += back[i] * r.v[i];
    assert.ok(s > 0.999);
  }
  const flat = artVector(blank(), { x: 10, y: 10, w: 200, h: 200 });
  assert.equal(bestMatch(flat, refs).key, null);
  assert.equal(artVector(blank(), { x: 0, y: 0, w: 5, h: 5 }).every((x) => x === 0), true, "rettangolo troppo piccolo");
});

test("tabellone: la carta giusta nello spazio giusto, gli altri vuoti", () => {
  const img = blank();
  const area = gameArea(W, H);
  const billy = ref("Billy");
  const merlin = ref("Merlin");
  const iMe = BOARD_SLOTS.findIndex((s) => s.side === "me" && s.lane === 1 && s.slot === 3);
  const iOpp = BOARD_SLOTS.findIndex((s) => s.side === "opp" && s.lane === 2 && s.slot === 2);
  paint(img, inside(inside(area, BOARD_SLOTS[iMe].rect), ART_IN_SLOT), billy);
  paint(img, inside(inside(area, BOARD_SLOTS[iOpp].rect), ART_IN_SLOT), merlin);
  const board = readBoard(img, refs);
  assert.equal(board[iMe].key, billy.key);
  assert.equal(board[iOpp].key, merlin.key);
  assert.ok(board[iMe].margin >= ACCEPT.margin);
  assert.equal(board.filter((m) => m.key).length, 2);
});

test("schermata VS: le due Leggendarie, anche nella teca della carta gradata", () => {
  const img = blank();
  const area = gameArea(W, H);
  const art = { x: 40 / 480, y: 62 / 690, w: 395 / 480, h: 303 / 690 };
  paint(img, inside(inside(area, VS_CARDS.me[0]), art), ref("Queen of Hearts"));
  paint(img, inside(inside(area, VS_CARDS.opp[1]), art), ref("Dracula"));
  const vs = readVersus(img, refs);
  assert.equal(vs.me.key, ref("Queen of Hearts").key);
  assert.equal(vs.opp.key, ref("Dracula").key);
  assert.equal(readVersus(blank(), refs).opp.key, null);
});

test("area di gioco 16:9 dentro immagini di altre proporzioni", () => {
  assert.deepEqual(gameArea(2560, 1440), { x: 0, y: 0, w: 2560, h: 1440 });
  assert.deepEqual(gameArea(3440, 1440), { x: 440, y: 0, w: 2560, h: 1440 });
  assert.deepEqual(gameArea(1920, 1200), { x: 0, y: 60, w: 1920, h: 1080 });
});

/** Scrive un testo con i modelli delle cifre, ingranditi, dentro il pannello del mana. */
function writeMana(img: Img, text: string) {
  const glyphs: Record<string, string> = {
    "/": "....####|...#####|...####.|...####.|..####..|..####..|..####..|.####...|.####...|####....|####....|####....",
    "1": "#######.|#######.|#######.|..#####.|..#####.|...####.|...#####|...#####|...#####|...#####|...#####|...#####",
    "3": "#######.|#######.|#######.|...###..|..####..|..#####.|..######|.....###|.....###|.#######|########|.######.",
    "0": "..####..|.#####..|#######.|###.###.|###..###|###..###|###..###|###..###|###..###|.#######|.######.|..#####.",
    "6": "..#####.|.######.|.######.|####....|###.....|#######.|########|###..###|###..###|.###.###|.#######|..#####.",
  };
  const r = inside(gameArea(W, H), MANA_TEXT);
  const d = img.data as Uint8ClampedArray;
  const scale = 1.5;
  let x0 = Math.round(r.x + 4);
  const y0 = Math.round(r.y + 2);
  for (const ch of text) {
    const rows = glyphs[ch].split("|");
    for (let gy = 0; gy < 12; gy++)
      for (let gx = 0; gx < 8; gx++)
        if (rows[gy][gx] === "#")
          for (let yy = 0; yy < scale; yy++)
            for (let xx = 0; xx < scale; xx++) {
              const p = ((y0 + Math.floor(gy * scale) + yy) * W + x0 + Math.floor(gx * scale) + xx) * 4;
              d[p] = d[p + 1] = d[p + 2] = 255;
            }
    x0 += Math.ceil(8 * scale) + 2;
  }
}

test("mana: legge 'attuale/massimo' e scarta il resto", () => {
  const a = blank();
  writeMana(a, "3/6");
  assert.deepEqual(readMana(a), { current: 3, max: 6 });
  const b = blank();
  writeMana(b, "0/10");
  assert.deepEqual(readMana(b), { current: 0, max: 10 });
  assert.equal(readMana(blank()), null, "pannello vuoto");
  const c = blank();
  writeMana(c, "6/3");
  assert.equal(readMana(c), null, "attuale oltre il massimo");
});

test("stendardo di fine partita: menta vittoria, magenta sconfitta, niente stendardo niente esito", () => {
  // misure prese dai fotogrammi veri dell'11/10 (demo e playtest)
  assert.equal(resultFromBanner({ white: 58, dark: 34, topDark: 95, mint: 4.1, magenta: 0 }), "W");
  assert.equal(resultFromBanner({ white: 55, dark: 37, topDark: 92, mint: 5.4, magenta: 0 }), "W");
  assert.equal(resultFromBanner({ white: 46, dark: 36, topDark: 100, mint: 0, magenta: 6.2 }), "L");
  // tabellone o menu con molto bianco: la parte alta non è scura
  assert.equal(resultFromBanner({ white: 75, dark: 10, topDark: 31, mint: 1.2, magenta: 0 }), null);
  // dissolvenza simile allo stendardo ma senza colore
  assert.equal(resultFromBanner({ white: 32, dark: 30, topDark: 97, mint: 0, magenta: 0 }), null);
  // colori quasi pari: incerto
  assert.equal(resultFromBanner({ white: 50, dark: 30, topDark: 95, mint: 1, magenta: 0.9 }), null);
});
