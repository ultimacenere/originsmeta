// Taratura delle finestre (11/10/2026): mana, schermata VS e stendardo con aree diverse.
// Uso: node scripts/fit-ui.mjs <cartella> <ms da> <ms a> <passo> <x0,y0,w,h area interna> <S del tabellone>
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { loadRefs, readMana, readVersus, readResult, bannerFeatures, gameArea } from "../src/shared/recognize.ts";
const root = path.resolve(import.meta.dirname, "..");
const sharp = createRequire(path.join(root, "..", "package.json"))("sharp");
const refs = loadRefs(JSON.parse(fs.readFileSync(path.join(root, "src/card-art.json"), "utf8")));
const [dir, from, to, stepArg, boxArg, sArg] = process.argv.slice(2);
const [bx, by, bw, bh] = boxArg.split(",").map(Number);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).filter((f) => +f.slice(0, 9) >= +from && +f.slice(0, 9) <= +to).sort().filter((_, i) => i % +stepArg === 0);
const cx = bx + bw / 2, cy = by + bh / 2;
const at = (S) => ({ x: cx - S / 2, y: cy - (S * 9) / 32, w: S, h: (S * 9) / 16 });
const fit = gameArea(bw, bh);
const cands = { board: at(+sArg), fit: { ...fit, x: fit.x + bx, y: fit.y + by }, cover: at(Math.max(bw, (bh * 16) / 9)), full: { x: bx, y: by, w: bw, h: bh } };
const tally = Object.fromEntries(Object.keys(cands).map((k) => [k, { mana: 0, vs: 0, W: 0, L: 0 }]));
const manaSeen = {};
for (const f of files) {
  const { data, info } = await sharp(path.join(dir, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { data, width: info.width, height: info.height, channels: 3 };
  for (const [k, a] of Object.entries(cands)) {
    const m = readMana(img, a);
    if (m) { tally[k].mana++; (manaSeen[k] ??= new Set()).add(`${m.current}/${m.max}`); }
    const v = readVersus(img, refs, a);
    if (v.me.key && v.opp.key) tally[k].vs++;
    const r = readResult(img, a);
    if (r) tally[k][r]++;
  }
}
console.log(files.length, "fotogrammi");
for (const k of Object.keys(cands)) console.log(k, JSON.stringify(cands[k], (_, v) => (typeof v === "number" ? Math.round(v) : v)), tally[k], [...(manaSeen[k] ?? [])].slice(0, 12).join(" "));
