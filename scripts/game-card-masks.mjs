/**
 * Maschere dei render delle carte di Koin Games (14/11/2026; Pierluigi: "render + testo" per la carta al passaggio del
 * mouse). I render pubblici (https://cdn.origins-tcg.com/images/<variantKey>.webp, 2048 × 2048) hanno la carta su uno
 * sfondo grigio pieno, senza trasparenza, e il browser non può toglierlo (il server non manda CORS, quindi niente canvas).
 * Questo script ricava dai render una maschera per forma (personaggio, magia, Leggendaria con le ali), con lo stesso
 * ritaglio per tutte, e la scrive in src/game-card/icons/mask-<forma>.png (bianco con trasparenza: CSS mask-image).
 *
 *   node scripts/game-card-masks.mjs            scarica i tre render di esempio e scrive le maschere
 *   node scripts/game-card-masks.mjs --check    dice solo il ritaglio, non scrive
 *
 * Serve ffmpeg nel PATH (o FFMPEG=<percorso>). Il ritaglio stampato va copiato in src/game-card/card.css (.omg-render).
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const FF = process.env.FFMPEG || "ffmpeg";
const SIZE = 2048;
const OUT_W = 640;
const SAMPLES = { unit: "C00032_MB_V00000", spell: "C00015_SB_V00000", legendary: "C00118_MC_V00000" };
const check = process.argv.includes("--check");
const root = join(import.meta.dirname, "..");

async function raw(key) {
  const res = await fetch(`https://cdn.origins-tcg.com/images/${key}.webp`);
  if (!res.ok) throw new Error(`${key}: ${res.status}`);
  const webp = Buffer.from(await res.arrayBuffer());
  return execFileSync(FF, ["-loglevel", "error", "-i", "pipe:0", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${SIZE}x${SIZE}`, "pipe:1"], { input: webp, maxBuffer: SIZE * SIZE * 4 });
}

/** Fuori = i pixel color sfondo raggiungibili dal bordo dell'immagine (riempimento); la carta è tutto il resto. */
function cardMask(rgb) {
  const at = (i) => [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]];
  const bg = at(5 * SIZE + 5);
  const near = (i) => {
    const p = at(i);
    return Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) <= 24;
  };
  const out = new Uint8Array(SIZE * SIZE);
  const stack = [];
  for (let x = 0; x < SIZE; x++) stack.push(x, (SIZE - 1) * SIZE + x);
  for (let y = 0; y < SIZE; y++) stack.push(y * SIZE, y * SIZE + SIZE - 1);
  while (stack.length) {
    const i = stack.pop();
    if (out[i] || !near(i)) continue;
    out[i] = 1;
    const x = i % SIZE;
    if (x > 0) stack.push(i - 1);
    if (x < SIZE - 1) stack.push(i + 1);
    if (i >= SIZE) stack.push(i - SIZE);
    if (i < SIZE * (SIZE - 1)) stack.push(i + SIZE);
  }
  const card = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < card.length; i++) card[i] = out[i] ? 0 : 255;
  return card;
}

function bbox(mask) {
  let x0 = SIZE, y0 = SIZE, x1 = 0, y1 = 0;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (mask[y * SIZE + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x0, y0, x1, y1 };
}

const masks = {};
let box = { x0: SIZE, y0: SIZE, x1: 0, y1: 0 };
for (const [shape, key] of Object.entries(SAMPLES)) {
  masks[shape] = cardMask(await raw(key));
  const b = bbox(masks[shape]);
  console.log(shape, key, b);
  box = { x0: Math.min(box.x0, b.x0), y0: Math.min(box.y0, b.y0), x1: Math.max(box.x1, b.x1), y1: Math.max(box.y1, b.y1) };
}
const pad = 4;
box = { x0: box.x0 - pad, y0: box.y0 - pad, x1: box.x1 + pad, y1: box.y1 + pad };
const w = box.x1 - box.x0 + 1;
const h = box.y1 - box.y0 + 1;
const outH = Math.round((OUT_W * h) / w);
console.log(`ritaglio comune: x ${box.x0}, y ${box.y0}, ${w} × ${h} (rapporto ${(h / w).toFixed(4)})`);
console.log(`card.css: --omg-r-w ${((SIZE / w) * 100).toFixed(3)}%, left ${((-box.x0 / w) * 100).toFixed(3)}%, top ${((-box.y0 / h) * 100).toFixed(3)}%, aspect-ratio ${w} / ${h}`);
if (check) process.exit(0);

for (const [shape, m] of Object.entries(masks)) {
  // bianco con l'alfa della maschera, ritagliato e ridotto (i bordi vengono sfumati dalla riduzione)
  const ya = Buffer.alloc(w * h * 2);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 2;
      ya[o] = 255;
      ya[o + 1] = m[(box.y0 + y) * SIZE + box.x0 + x];
    }
  const png = execFileSync(FF, ["-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "ya8", "-s", `${w}x${h}`, "-i", "pipe:0", "-vf", `scale=${OUT_W}:${outH}:flags=area`, "-pix_fmt", "ya8", "-f", "image2", "-c:v", "png", "pipe:1"], { input: ya, maxBuffer: 64 * 1024 * 1024 });
  const file = join(root, "src", "game-card", "icons", `mask-${shape}.png`);
  writeFileSync(file, png);
  console.log("scritta", file, png.length, "byte");
}
