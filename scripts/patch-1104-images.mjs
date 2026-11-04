/**
 * La copertina della news `balance-patch-1104-cyber-queen` (04/11/2026): le dieci carte bilanciate dalla patch, intere e
 * con le immagini del sito (public/cards, senza costo né statistiche stampati), su due file da cinque e un fondo della
 * palette del sito. Usa sharp, che arriva con Next.
 *
 *   node scripts/patch-1104-images.mjs
 */
import path from "node:path";
import sharp from "sharp";

const cardsDir = path.join(process.cwd(), "public", "cards");
const out = path.join(process.cwd(), "public", "media", "news-patch-1104.webp");
// --color-felt di globals.css
const FELT = { r: 21, g: 12, b: 44, alpha: 1 };

const CARDS = ["dorothy", "obliterate", "genie", "searing-light", "guy-of-gisborne", "baby-bear", "mama-bear", "papa-bear", "banshee", "esmeralda"];
const cardH = 380;
const gapX = 30;
const gapY = 40;
const tiles = [];
for (const card of CARDS) {
  const buf = await sharp(path.join(cardsDir, `${card}.webp`)).resize({ height: cardH }).png().toBuffer();
  const { width } = await sharp(buf).metadata();
  tiles.push({ buf, width });
}
const composite = [];
for (let r = 0; r < 2; r++) {
  const row = tiles.slice(r * 5, r * 5 + 5);
  const rowW = row.reduce((s, t) => s + t.width, 0) + gapX * (row.length - 1);
  let left = Math.round((1600 - rowW) / 2);
  const top = Math.round((900 - (cardH * 2 + gapY)) / 2) + r * (cardH + gapY);
  for (const t of row) {
    composite.push({ input: t.buf, left, top });
    left += t.width + gapX;
  }
}
const info = await sharp({ create: { width: 1600, height: 900, channels: 4, background: FELT } })
  .composite(composite)
  .webp({ quality: 86, effort: 6 })
  .toFile(out);
console.log(`copertina: ${path.relative(process.cwd(), out)} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
