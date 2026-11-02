#!/usr/bin/env node
/**
 * Le varianti ALPHA delle carte (illustrazioni alternative del materiale Koin Games, pacco creator del 19/09/2026) per la
 * sezione "Illustrazioni alternative" delle schede carta (02/11/2026): WebP intere da 480 px in `public/cards/alt/`
 * (`<slug>-v00011.webp`) e il manifest generato `src/lib/data/card-variants.json` con le misure e il giorno in cui ogni
 * variante è entrata sul sito (`since`, tenuto com'è nelle esecuzioni successive: è il giorno della scheda in sitemap).
 *
 * Uso:  node scripts/import-card-variants.mjs --src "<cartella con i PNG delle carte>" [--dry]
 *
 * Stessa cartella di `import-card-art.mjs`, che converte solo la variante base V00000: i PNG originali non entrano nel
 * repo e stanno nell'archivio (G:\Il mio Drive\OriginsMeta\10_Materiale_Koin, "Cards & Emojis"). Si convertono le
 * varianti (V00001, V00011–V00015) delle sole carte del nostro database: le carte non annunciate del pacco (Peter Pan,
 * Wukong, Nezha) restano fuori, come in `import-card-art.mjs`. Ogni variante deve avere il suo credito, trascritto a mano
 * dall'immagine, in `variantCredits` di `src/lib/data/card-credits.ts`: senza, lo script si ferma.
 *
 * Condizione d'uso posta da Koin (19/09/2026): il materiale è contenuto, non design. Le carte restano intere, con i
 * crediti impressi (`ILLUS // <illustratore>`, `KOIN GAMES INC | 2026`): mai ritagliate.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { variantCredits } from "../src/lib/data/card-credits.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/cards/alt");
const MANIFEST = path.join(ROOT, "src/lib/data/card-variants.json");
const WOO = path.join(ROOT, "src/lib/data/woo-cards.json");

/** Larghezza e qualità di `import-card-art.mjs` (carta intera della scheda): 480 px bastano fino a 240 px a doppia densità. */
const WIDTH = 480;
const WEBP = { quality: 78, effort: 6, alphaQuality: 90 };

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const src = opt("--src");
const dry = args.includes("--dry");

if (!src) {
  console.error('Manca la cartella dei PNG.  Uso: node scripts/import-card-variants.mjs --src "<cartella>" [--dry]');
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`Cartella non trovata: ${src}`);
  process.exit(1);
}

const KEY_RE = /(C\d{5}_[MS][BC])_(V\d{5})/;

const woo = JSON.parse(await readFile(WOO, "utf8"));
const byKey = new Map(woo.cards.filter((c) => c.key).map((c) => [c.key, c]));
// Stessa eccezione di import-card-art.mjs: chiavi che i dati importati non espongono.
const KEY_OVERRIDE = { "merry-man": "C00011_MB" };
for (const [slug, key] of Object.entries(KEY_OVERRIDE)) {
  const c = woo.cards.find((x) => x.slug === slug);
  if (c && !byKey.has(key)) byKey.set(key, c);
}

const found = []; // { id: "C00316_MC_V00011", card, file }
const outside = [];
for (const f of (await readdir(src)).filter((x) => x.toLowerCase().endsWith(".png")).sort()) {
  const m = f.match(KEY_RE);
  if (!m || /_Flat\.png$/i.test(f) || m[2] === "V00000") continue;
  const card = byKey.get(m[1]);
  if (!card) {
    outside.push(f);
    continue;
  }
  found.push({ id: `${m[1]}_${m[2]}`, code: m[2], card, file: f });
}

console.log(`${found.length} varianti di carte del database.`);
if (outside.length) console.log(`  Fuori database (non importate, non si pubblicano finché non sono di dominio pubblico): ${outside.join(", ")}`);
const noCredit = found.filter((v) => !variantCredits[v.id]?.illus);
if (noCredit.length) {
  console.error(`Senza credito in variantCredits (card-credits.ts), da trascrivere dall'immagine: ${noCredit.map((v) => v.id).join(", ")}`);
  process.exit(1);
}
const unused = Object.keys(variantCredits).filter((id) => !found.some((v) => v.id === id));
if (unused.length) console.log(`  Crediti senza file nella cartella: ${unused.join(", ")}`);

if (dry) {
  console.log("\n--dry: nessun file scritto.");
  process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });
const prev = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : { variants: {} };
const today = new Date().toISOString().slice(0, 10);
const variants = {};
const written = new Set();

for (const v of found) {
  const name = `${v.card.slug}-${v.code.toLowerCase()}.webp`;
  const info = await sharp(path.join(src, v.file)).resize({ width: WIDTH, kernel: "lanczos3" }).webp(WEBP).toFile(path.join(OUT_DIR, name));
  written.add(name);
  variants[v.id] = { slug: v.card.slug, w: info.width, h: info.height, since: prev.variants?.[v.id]?.since ?? today };
  console.log(`  ${v.id} → public/cards/alt/${name} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
}

// File di varianti non più nel materiale: si tolgono, altrimenti restano in public per sempre.
for (const f of await readdir(OUT_DIR)) {
  if (f.endsWith(".webp") && !written.has(f)) {
    await rm(path.join(OUT_DIR, f));
    console.log(`  rimosso file orfano: public/cards/alt/${f}`);
  }
}

const manifest = {
  source: "Materiale ufficiale Koin Games (canale creator, 19/09/2026): varianti ALPHA delle carte. Uso autorizzato per i contenuti, non per il design del sito.",
  width: WIDTH,
  variants,
};
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`\nScritte ${written.size} varianti in public/cards/alt/. Manifest: ${path.relative(ROOT, MANIFEST)}.`);
