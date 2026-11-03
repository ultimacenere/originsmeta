/**
 * Le immagini della news `dr-frank-boss-new-cards` (04/11/2026): le otto carte nuove del boss come Koin le ha date ai
 * creator per rivelarle (Bounty Blitz del Creator Program, 02/11/2026), intere su un fondo della palette del sito. Nel
 * testo le carte del gioco a gruppi (cartella "Cards w/ Stats & Abilities"), in copertina le otto nella cornice ALPHA
 * ("Cards Art Only"). Originali, provenienza e condizioni sul Drive in 10_Materiale_Koin/2026-11-02_dr-frank-bounty
 * (LEGGIMI.md). Usa sharp, che arriva con Next.
 *
 *   node scripts/dr-frank-images.mjs ["G:/Il mio Drive/OriginsMeta/10_Materiale_Koin/2026-11-02_dr-frank-bounty"]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2] ?? "G:/Il mio Drive/OriginsMeta/10_Materiale_Koin/2026-11-02_dr-frank-bounty";
const outDir = path.join(process.cwd(), "public", "media");
// --color-felt di globals.css
const FELT = { r: 21, g: 12, b: 44, alpha: 1 };

const GROUPS = {
  graveyard: ["dr-frank", "its-alive"],
  rebirth: ["franks-monster", "franken-bride"],
  discard: ["morgan-le-fay", "doppelganger", "necromancer"],
  "red-knight": ["red-knight"],
};

for (const [name, cards] of Object.entries(GROUPS)) {
  const height = cards.length > 2 ? 820 : 900;
  const margin = 56;
  const gap = 44;
  const tiles = [];
  for (const card of cards) {
    const file = path.join(src, "cards-stats-abilities", `${card}.png`);
    if (!fs.existsSync(file)) throw new Error(`manca ${file}`);
    const buf = await sharp(file).resize({ height }).png().toBuffer();
    const { width } = await sharp(buf).metadata();
    tiles.push({ buf, width });
  }
  const width = margin * 2 + tiles.reduce((s, t) => s + t.width, 0) + gap * (tiles.length - 1);
  let left = margin;
  const composite = tiles.map((t) => {
    const item = { input: t.buf, left, top: margin };
    left += t.width + gap;
    return item;
  });
  const out = path.join(outDir, `news-dr-frank-${name}.webp`);
  const info = await sharp({ create: { width, height: height + margin * 2, channels: 4, background: FELT } })
    .composite(composite)
    .webp({ quality: 84, effort: 6 })
    .toFile(out);
  console.log(`${name}: ${cards.join(", ")} → ${path.relative(process.cwd(), out)} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
}

// Copertina (16:9, 1600×900): le otto carte nella cornice ALPHA ("Cards Art Only"), intere e con i crediti impressi, su
// due file da quattro. Non la grafica del post Steam: è già la copertina della news balance-patch-dr-frank-roadmap-ama.
const COVER = ["dr-frank", "its-alive", "franks-monster", "franken-bride", "morgan-le-fay", "doppelganger", "necromancer", "red-knight"];
const cardH = 392;
const gapX = 34;
const gapY = 36;
const row = [];
for (const card of COVER) {
  const file = path.join(src, "cards-art-only", `${card}.png`);
  if (!fs.existsSync(file)) throw new Error(`manca ${file}`);
  const buf = await sharp(file).resize({ height: cardH }).png().toBuffer();
  const { width } = await sharp(buf).metadata();
  row.push({ buf, width });
}
const composite = [];
for (let r = 0; r < 2; r++) {
  const cards = row.slice(r * 4, r * 4 + 4);
  const rowW = cards.reduce((s, t) => s + t.width, 0) + gapX * (cards.length - 1);
  let left = Math.round((1600 - rowW) / 2);
  const top = Math.round((900 - (cardH * 2 + gapY)) / 2) + r * (cardH + gapY);
  for (const t of cards) {
    composite.push({ input: t.buf, left, top });
    left += t.width + gapX;
  }
}
const cover = path.join(outDir, "news-dr-frank-cards.webp");
const info = await sharp({ create: { width: 1600, height: 900, channels: 4, background: FELT } })
  .composite(composite)
  .webp({ quality: 86, effort: 6 })
  .toFile(cover);
console.log(`copertina: ${path.relative(process.cwd(), cover)} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
