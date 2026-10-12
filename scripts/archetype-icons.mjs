/**
 * Simbolini degli archetipi (12/10/2026): i PNG trasparenti da 256 px disegnati da Pierluigi diventano WebP da 96 px in
 * public/media/archetypes/<id>.webp (sul sito si mostrano fra 16 e 40 px: 96 basta anche per gli schermi a densità 2).
 *
 *   node scripts/archetype-icons.mjs [cartella dei PNG]
 *
 * La cartella di default è design/win-rate/icone (non tracciata: gli originali restano nella cartella di Pierluigi). Usa
 * sharp, che arriva con Next (nessuna dipendenza nuova). "tempo" si converte anche se il sito non ha ancora quell'archetipo.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const IDS = ["aggro", "midrange", "control", "tempo", "discard", "swarm", "evil", "combo"];
const SIZE = 96;
const from = process.argv[2] ?? "design/win-rate/icone";
const to = "public/media/archetypes";

fs.mkdirSync(to, { recursive: true });
for (const id of IDS) {
  const src = path.join(from, `${id}.png`);
  if (!fs.existsSync(src)) {
    console.warn(`manca ${src}`);
    continue;
  }
  const out = path.join(to, `${id}.webp`);
  await sharp(src).resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(out);
  console.log(`${out} ${fs.statSync(out).size} byte`);
}
