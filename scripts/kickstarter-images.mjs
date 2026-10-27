/**
 * Le schede ufficiali dei livelli del Kickstarter della Alpha Edition (Koin Games, passate da Pierluigi il 27/10/2026)
 * in WebP per la news `kickstarter-alpha-edition-reward-tiers`: intere, mai ritagliate (regola del materiale Koin), larghe
 * al massimo 1400 px. Gli originali stanno sul Drive in 10_Materiale_Koin/kickstarter-livelli, un file per livello con il
 * nome del livello (worthy, aspirant, apprentice, hero, champion, icon, myth, legend), in qualsiasi formato immagine.
 * Usa sharp, che arriva con Next (nessuna dipendenza nuova).
 *
 *   node scripts/kickstarter-images.mjs ["G:/Il mio Drive/OriginsMeta/10_Materiale_Koin/kickstarter-livelli"]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const TIERS = ["worthy", "aspirant", "apprentice", "hero", "champion", "icon", "myth", "legend"];
const src = process.argv[2] ?? "G:/Il mio Drive/OriginsMeta/10_Materiale_Koin/kickstarter-livelli";
const outDir = path.join(process.cwd(), "public", "media", "kickstarter");
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(src);
let missing = 0;
for (const tier of TIERS) {
  const file = files.find((f) => path.parse(f).name.toLowerCase() === tier);
  if (!file) {
    console.error(`manca il file di ${tier} in ${src}`);
    missing++;
    continue;
  }
  const out = path.join(outDir, `${tier}.webp`);
  const info = await sharp(path.join(src, file)).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 85, effort: 6 }).toFile(out);
  console.log(`${tier}: ${file} → ${path.relative(process.cwd(), out)} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
}
if (missing) process.exit(1);

// Copertina della news (16:9, 1600×900): la scheda di Worthy intera, adattata senza ritagli sul fondo scuro delle schede
const cover = path.join(process.cwd(), "public", "media", "news-kickstarter-tiers.webp");
const worthy = files.find((f) => path.parse(f).name.toLowerCase() === "worthy");
await sharp(path.join(src, worthy))
  .resize(1600, 900, { fit: "contain", background: { r: 26, g: 26, b: 28, alpha: 1 } })
  .webp({ quality: 85, effort: 6 })
  .toFile(cover);
console.log(`copertina: ${path.relative(process.cwd(), cover)} (1600×900)`);
