/** Test del riconoscitore dello scanner (recognize.ts) su immagini sintetiche: `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import cardArt from "../card-art.json";
import cards from "../cards.json";
import {
  ACCEPT,
  ART_IN_SLOT,
  artVector,
  ART_IN_HAND,
  handGeometry,
  LIFE_RINGS,
  LIFE_SEGMENTS,
  readHand,
  readLife,
  BOARD_SLOTS,
  bestMatch,
  boardScale,
  gameArea,
  inside,
  layoutFor,
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
  windowContent,
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
          const p = (y * img.width + x) * 4;
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

test("finestre di qualunque forma: scala del tabellone, aree e schermo 16:9 come prima", () => {
  const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
  near(boardScale(16 / 9), 16 / 9);
  near(boardScale(1160 / 869), 1221 / 869);
  near(boardScale(2042 / 853), 1759 / 853);
  // sempre crescente: una finestra più larga, a pari altezza, non rimpicciolisce il tabellone
  for (let r = 1; r < 4; r += 0.05) assert.ok(boardScale(r + 0.05) > boardScale(r));
  const full = layoutFor({ x: 0, y: 0, w: 2560, h: 1440 });
  for (const k of ["x", "y", "w", "h"] as const) {
    near(full.board[k], gameArea(2560, 1440)[k], 1e-6);
    near(full.ui[k], gameArea(2560, 1440)[k], 1e-6);
  }
  // la finestra larga dell'11/10: tabellone centrato largo 1759, interfaccia alta come la finestra
  const wide = layoutFor({ x: 2, y: 45, w: 2042, h: 853 });
  near(wide.board.w, 1759, 1e-6);
  near(wide.board.x + wide.board.w / 2, 1023);
  near(wide.board.y + wide.board.h / 2, 45 + 853 / 2);
  near(wide.ui.h, 853);
  near(full.vs.w, 2560);
  near(full.vs.y, 0);
  // la schermata VS della partita online dell'11/10 in una finestra 4:3: larga come la finestra, appoggiata in basso
  const square = layoutFor({ x: 2, y: 45, w: 1160, h: 869 });
  near(square.vs.w, 1160);
  near(square.vs.y + square.vs.h, 45 + 869);
  near(inside(square.vs, VS_CARDS.me[0]).x, 417.86, 0.01);
});

test("finestre: la barra del titolo di Windows si toglie, lo schermo intero no", () => {
  const w = 1164;
  const h = 916;
  const img: Img = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h, channels: 4 };
  const d = img.data as Uint8ClampedArray;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      // barra chiara di 45 px, bordo di 2 px, sotto il gioco (scuro e vario)
      const bar = y < 45 || x < 2 || x >= w - 2 || y >= h - 2;
      d.set(bar ? [243, 243, 243, 255] : [(x * 7) % 90, (y * 5) % 70, 60 + ((x + y) % 80), 255], p);
    }
  assert.deepEqual(windowContent(img, false), { x: 2, y: 45, w: w - 4, h: h - 47 });
  assert.deepEqual(windowContent(img, true), { x: 0, y: 0, w, h }, "schermo intero");
  // una fascia uniforme ma colorata in alto è il gioco (una dissolvenza a schermo intero), non la barra di Windows
  for (let y = 0; y < 45; y++) for (let x = 0; x < w; x++) d.set([105, 22, 38, 255], (y * w + x) * 4);
  assert.deepEqual(windowContent(img, false), { x: 0, y: 0, w, h }, "fascia colorata");
  // la tinta Mica della barra attiva (quasi grigia) vale come barra
  for (let y = 0; y < 45; y++) for (let x = 0; x < w; x++) d.set([229, 250, 245, 255], (y * w + x) * 4);
  assert.equal(windowContent(img, false).y, 45, "tinta Mica");
  // senza barra (finestra senza bordi): l'immagine intera
  for (let y = 0; y < 45; y++)
    for (let x = 0; x < w; x++) d.set([(x * 7) % 90, (y * 5) % 70, 60, 255], (y * w + x) * 4);
  assert.deepEqual(windowContent(img, false), { x: 0, y: 0, w, h });
});

test("finestre: una carta si legge nell'area del tabellone della finestra", () => {
  const w = 1164;
  const h = 916;
  const img: Img = { data: new Uint8ClampedArray(w * h * 4).fill(30), width: w, height: h, channels: 4 };
  const board = layoutFor({ x: 2, y: 45, w: 1160, h: 869 }).board;
  const ref = refs.find((r) => r.key === Object.keys(cardArt)[3])!;
  paint(img, inside(inside(board, BOARD_SLOTS[4].rect), ART_IN_SLOT), ref);
  const read = readBoard(img, refs, board);
  assert.equal(read[4].key, ref.key);
  assert.equal(readBoard(img, refs)[4].key, null, "con l'area 16:9 di prima non si legge");
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
  // boss battuto (12/10/2026): "BOSS SCONFITTO!" con la pennellata gialla è una vittoria, anche nel fotogramma di
  // passaggio con l'alone rosso e blu che prima si leggeva come sconfitta
  assert.equal(resultFromBanner({ white: 37.8, dark: 34.3, topDark: 85, mint: 0, magenta: 0.4, yellow: 5.9 }), "W");
  assert.equal(resultFromBanner({ white: 40.7, dark: 44.3, topDark: 85, mint: 0, magenta: 0, yellow: 2.7 }), "W");
  // una sconfitta vera resta sconfitta anche con un po' di giallo
  assert.equal(resultFromBanner({ white: 46, dark: 36, topDark: 100, mint: 0, magenta: 6.2, yellow: 0.5 }), "L");
  // sconfitta dopo l'animazione della Leggendaria avversaria (11/10 sera): sfondo viola, parte alta poco scura
  assert.equal(resultFromBanner({ white: 60.6, dark: 34.3, topDark: 19.4, mint: 0, magenta: 0.8 }), "L");
  // tabellone durante la partita (i quasi stendardi più frequenti) e un menu molto bianco: niente esito
  assert.equal(resultFromBanner({ white: 29.4, dark: 57.6, topDark: 33.6, mint: 1.5, magenta: 2.9 }), null);
  assert.equal(resultFromBanner({ white: 46.6, dark: 22.4, topDark: 0.3, mint: 0, magenta: 0.8 }), null);
});

test("mano: le carte affiancate e coperte a destra si leggono da sinistra, nelle tre forme", async () => {
  const handArt = loadRefs((await import("../card-art-hand.json")).default as Record<string, string>);
  const keys = Object.keys(cardArt).slice(10, 14);
  for (const content of [{ x: 0, y: 0, w: 1280, h: 720 }, { x: 2, y: 45, w: 1160, h: 869 }, { x: 2, y: 45, w: 2042, h: 853 }]) {
    const w = Math.ceil(content.x + content.w + 2);
    const h = Math.ceil(content.y + content.h + 2);
    const img: Img = { data: new Uint8ClampedArray(w * h * 4).fill(30), width: w, height: h, channels: 4 };
    const g = handGeometry(content);
    keys.forEach((k, i) => {
      const card = { x: content.x + content.w * 0.35 + i * g.w * 0.85, y: g.top, w: g.w, h: g.h };
      paint(img, inside(card, ART_IN_HAND), handArt.find((r) => r.key === k)!);
    });
    assert.deepEqual(readHand(img, handArt, content), keys, `${content.w}×${content.h}`);
  }
  assert.deepEqual(readHand(blank(), refs, { x: 0, y: 0, w: W, h: H }), []);
});

test("vita: i due segmenti frontali accesi o spenti, un lampo bianco non si legge", () => {
  const img = blank();
  const board = { x: 0, y: 0, w: W, h: H };
  const d = img.data as Uint8ClampedArray;
  const ring = (side: "me" | "opp", segs: number[], color: number[]) => {
    const r = LIFE_RINGS[side];
    for (const s of segs) {
      const [a0, a1] = LIFE_SEGMENTS[s];
      for (let a = a0 - 3; a <= a1 + 3; a += 0.5)
        for (let k = 0.85; k <= 1.15; k += 0.01) {
          const x = Math.round(r.x * W + r.r * W * k * Math.cos((a * Math.PI) / 180));
          const y = Math.round(r.y * H + r.r * W * k * Math.sin((a * Math.PI) / 180));
          d.set([...color, 255], (y * W + x) * 4);
        }
    }
  };
  ring("me", [0, 1], [60, 220, 240]);
  ring("opp", [1], [240, 60, 90]);
  assert.deepEqual(readLife(img, board), { me: 2, opp: 1 });
  ring("me", [0, 1], [255, 255, 255]);
  assert.equal(readLife(img, board).me, null, "lampo bianco");
});
