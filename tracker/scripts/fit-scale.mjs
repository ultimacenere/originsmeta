// Taratura delle finestre (11/10/2026): il tabellone è 3D e cambia scala con la forma della finestra, centrato
// sull'area interna. Cerca la larghezza S dell'area 16:9 "virtuale" e lo scarto del centro.
// Uso: node scripts/fit-scale.mjs <cartella> <ms da> <ms a> <passo> <x0,y0,w,h dell'area interna>
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { loadRefs, BOARD_SLOTS, ART_IN_SLOT, inside, artVector, bestMatch } from "../src/shared/recognize.ts";
const root = path.resolve(import.meta.dirname, "..");
const sharp = createRequire(path.join(root, "..", "package.json"))("sharp");
const refs = loadRefs(JSON.parse(fs.readFileSync(path.join(root, "src/card-art.json"), "utf8")));
const [dir, from, to, stepArg, boxArg] = process.argv.slice(2);
const [bx, by, bw, bh] = boxArg.split(",").map(Number);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).filter((f) => +f.slice(0, 9) >= +from && +f.slice(0, 9) <= +to).sort().filter((_, i) => i % +stepArg === 0);
const imgs = [];
for (const f of files) {
  const { data, info } = await sharp(path.join(dir, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  imgs.push({ data, width: info.width, height: info.height, channels: 3 });
}
const cx = bx + bw / 2, cy = by + bh / 2;
const score = (S, dx, dy) => { const a = { x: cx + dx - S / 2, y: cy + dy - (S * 9) / 32, w: S, h: (S * 9) / 16 }; let n = 0, s = 0; for (const img of imgs) for (const sl of BOARD_SLOTS) { const m = bestMatch(artVector(img, inside(inside(a, sl.rect), ART_IN_SLOT)), refs); if (m.key) { n++; s += m.score; } } return { n, s }; };
let best = null;
let g = { S: [bw * 0.6, bw * 1.5, bw * 0.05], dx: [0, 0, 1], dy: [0, 0, 1] };
for (let round = 0; round < 4; round++) {
  const r = [];
  for (let S = g.S[0]; S <= g.S[1] + 1e-6; S += g.S[2]) for (let dx = g.dx[0]; dx <= g.dx[1]; dx += g.dx[2]) for (let dy = g.dy[0]; dy <= g.dy[1]; dy += g.dy[2]) r.push({ S: Math.round(S), dx, dy, ...score(S, dx, dy) });
  r.sort((a, b) => b.n - a.n || b.s - a.s);
  best = r[0];
  console.log(`giro ${round}:`, r.slice(0, 3).map((x) => JSON.stringify({ ...x, s: +x.s.toFixed(1) })).join(" "));
  const st = g.S[2];
  const d = round === 0 ? 24 : Math.max(2, (g.dx[2] || 24) / 3);
  g = { S: [best.S - st, best.S + st, st / 4], dx: [best.dx - 2 * d, best.dx + 2 * d, d], dy: [best.dy - 2 * d, best.dy + 2 * d, d] };
}
console.log(`${imgs.length} fotogrammi; area interna ${bw}x${bh} (rapporto ${(bw / bh).toFixed(3)}): S = ${best.S} = ${(best.S / bw).toFixed(3)} W = ${(best.S / bh).toFixed(3)} H; centro +${best.dx},+${best.dy}`);
