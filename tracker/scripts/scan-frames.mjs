// Taratura dello scanner sui fotogrammi salvati dalla modalità cattura (`npm run frames`): legge ogni JPEG di una
// sessione con il riconoscitore dell'app (src/shared/recognize.ts) e scrive una riga JSON per fotogramma con le carte
// dei 18 spazi e le Leggendarie della schermata VS. Uso: node scripts/scan-frames.mjs <cartella sessione> <uscita.jsonl>
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { loadRefs, readBoard, readMana, readVersus } from "../src/shared/recognize.ts";

const root = path.resolve(import.meta.dirname, "..");
const sharp = createRequire(path.join(root, "..", "package.json"))("sharp");
const refs = loadRefs(JSON.parse(fs.readFileSync(path.join(root, "src/card-art.json"), "utf8")));
const [dir, out] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();
const ws = fs.createWriteStream(out);
const t0 = Date.now();
let i = 0;
for (const f of files) {
  const { data, info } = await sharp(path.join(dir, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { data, width: info.width, height: info.height, channels: 3 };
  const board = readBoard(img, refs);
  const vs = readVersus(img, refs);
  ws.write(
    JSON.stringify({
      ms: Number(f.slice(0, 9)),
      board: board.map((m) => m.key),
      low: board.map((m) => (m.key ? Number(m.score.toFixed(2)) : null)),
      vs: vs.me.key && vs.opp.key ? { me: vs.me.key, opp: vs.opp.key } : null,
      mana: readMana(img),
    }) + "\n",
  );
  if (++i % 500 === 0) console.log(i, "/", files.length, `${Math.round((Date.now() - t0) / i)} ms a fotogramma`);
}
ws.end();
console.log(`fatto: ${files.length} fotogrammi in ${Math.round((Date.now() - t0) / 1000)} s`);
