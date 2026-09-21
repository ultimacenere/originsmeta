#!/usr/bin/env node
/**
 * Converte le illustrazioni ufficiali delle carte (materiale Koin Games) in due misure WebP dentro
 * `public/cards/` e scrive il manifest generato `src/lib/data/card-art.json`, indicizzato per chiave
 * ufficiale (`C00064_MB`), che `cards.ts` usa per popolare i campi `image` e `art`.
 *
 * Uso:  node scripts/import-card-art.mjs --src "<cartella con i PNG delle carte>" [--dry] [--only C00064_MB]
 *
 * I PNG originali NON entrano nel repo: stanno nell'archivio (G:\Il mio Drive\OriginsMeta\10_Materiale_Koin).
 * Il nome del file porta la chiave ufficiale, la stessa del campo `key` di `woo-cards.json` e dei codici
 * mazzo KGBLDC: `C00064_MB_V00000 - Aladdin.png`. Si importa solo la variante base V00000; le varianti
 * alternative (V00001, V00011-V00015, le skin con badge ALPHA) sono elencate nel manifest ma non convertite,
 * perché non sono l'aspetto normale della carta.
 *
 * Condizione d'uso posta da Koin (19/09/2026): il materiale non si usa per il design del sito. Le carte sono
 * contenuto e restano intere, con i crediti impressi (`ILLUS // <illustratore>`, `KOIN GAMES INC | 2026`):
 * non si ritagliano mai. Le carte assenti dal nostro database non vengono importate.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public/cards");
const OUT_SM = path.join(OUT_DIR, "sm");
const OUT_ART = path.join(OUT_DIR, "art");
const OUT_COVER = path.join(OUT_DIR, "cover");
const MANIFEST = path.join(ROOT, "src/lib/data/card-art.json");
const WOO = path.join(ROOT, "src/lib/data/woo-cards.json");

/** Larghezze: `sm` per i chip e la griglia (44x60 e 64x88, il doppio su schermi retina), piena per la scheda carta e l'anteprima social. */
const SIZES = { sm: 160, full: 480, art: 560, cover: 1200 };
const WEBP = { quality: 78, effort: 6, alphaQuality: 90 };

/**
 * Finestra d'arte: la parte alta della carta, sopra il nome dipinto. Serve alla carta di gioco che il sito
 * disegna con i propri dati (componente `GameCard`), dove la cornice è la nostra.
 * Unità e magie hanno cornici diverse — le magie sono più larghe e hanno l'angolo in alto a destra smussato —
 * quindi due riquadri, in frazioni del lato così valgono a qualunque risoluzione.
 */
const FINESTRA = {
  unit: { left: 0.04, top: 0.06, width: 0.92, height: 0.5 },
  spell: { left: 0.1, top: 0.12, width: 0.8, height: 0.42 },
};
const finestraDi = (tipo, w, h) => {
  const f = FINESTRA[tipo === "spell" ? "spell" : "unit"];
  return { left: Math.round(w * f.left), top: Math.round(h * f.top), width: Math.round(w * f.width), height: Math.round(h * f.height) };
};

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const src = opt("--src");
const only = opt("--only");
const dry = args.includes("--dry");

if (!src) {
  console.error('Manca la cartella dei PNG.  Uso: node scripts/import-card-art.mjs --src "<cartella>" [--dry] [--only C00064_MB]');
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`Cartella non trovata: ${src}`);
  process.exit(1);
}

/** La chiave sta nel nome del file, non sempre in testa: 4 file la portano in mezzo (`Golden_Egg_C00048_MB_V00000_Flat.png`). */
const KEY_RE = /(C\d{5}_[MS][BC])_(V\d{5})/;

const woo = JSON.parse(await readFile(WOO, "utf8"));
const byKey = new Map(woo.cards.filter((c) => c.key).map((c) => [c.key, c]));

// Chiavi che World of Origins non espone (le carte create), lette dai nomi dei file ufficiali.
// Stessi valori del campo `key` di `card-lore.ts`: se se ne aggiungono, vanno tenuti allineati.
const KEY_OVERRIDE = { "merry-man": "C00011_MB" };
for (const [slug, key] of Object.entries(KEY_OVERRIDE)) {
  const c = woo.cards.find((x) => x.slug === slug);
  if (c && !byKey.has(key)) byKey.set(key, c);
}

const files = (await readdir(src)).filter((f) => f.toLowerCase().endsWith(".png"));
const base = new Map(); // key -> nome file della variante V00000
const variants = new Map(); // key -> [V00011, ...]
const flat = []; // i file "_Flat": arte quadrata senza cornice, non sono la carta
const unknown = new Map(); // chiavi che il database non conosce

for (const f of files) {
  const m = f.match(KEY_RE);
  if (!m) {
    console.log(`  saltato (senza chiave nel nome): ${f}`);
    continue;
  }
  const [, key, variant] = m;
  if (/_Flat\.png$/i.test(f)) {
    flat.push(f);
    continue;
  }
  if (!byKey.has(key)) {
    unknown.set(key, f);
    continue;
  }
  if (variant === "V00000") base.set(key, f);
  else variants.set(key, [...(variants.get(key) ?? []), variant]);
}

console.log(`${files.length} file letti: ${base.size} carte del database, ${[...variants.values()].flat().length} varianti alternative, ${flat.length} file "_Flat", ${unknown.size} chiavi fuori database.`);
if (unknown.size) console.log(`  Fuori database (non importate, non si pubblicano finché non sono di dominio pubblico): ${[...unknown.keys()].join(", ")}`);

const senzaImmagine = woo.cards.filter((c) => c.key && !base.has(c.key));
if (senzaImmagine.length) console.log(`  Carte del database senza illustrazione (${senzaImmagine.length}): ${senzaImmagine.map((c) => `${c.name} [${c.status}]`).join(", ")}`);

if (dry) {
  console.log("\n--dry: nessun file scritto.");
  process.exit(0);
}

for (const d of [OUT_SM, OUT_ART, OUT_COVER]) await mkdir(d, { recursive: true });

const art = {};
let scritti = 0;
const attesi = new Set();

for (const [key, file] of [...base].sort(([a], [b]) => a.localeCompare(b))) {
  if (only && key !== only) continue;
  const card = byKey.get(key);
  const srcFile = path.join(src, file);
  const meta = await sharp(srcFile).metadata();

  // carta intera: scheda carta, anteprima social (full) e chip/griglia (sm)
  const full = await sharp(srcFile).resize({ width: SIZES.full, kernel: "lanczos3" }).webp(WEBP).toFile(path.join(OUT_DIR, `${card.slug}.webp`));
  await sharp(srcFile).resize({ width: SIZES.sm, kernel: "lanczos3" }).webp(WEBP).toFile(path.join(OUT_SM, `${card.slug}.webp`));

  // finestra d'arte per la carta di gioco disegnata dal sito
  const box = finestraDi(card.type, meta.width, meta.height);
  const face = await sharp(srcFile).extract(box).resize({ width: SIZES.art, kernel: "lanczos3" }).webp(WEBP).toFile(path.join(OUT_ART, `${card.slug}.webp`));

  attesi.add(`${card.slug}.webp`);
  art[key] = { slug: card.slug, w: full.width, h: full.height, aw: face.width, ah: face.height };
  if (variants.get(key)?.length) art[key].variants = variants.get(key).sort();

  // copertina 16:9 dalla finestra d'arte: la usano i mazzi della community, che prendono la Leggendaria
  if (card.legendary) {
    const h16 = Math.round((box.width * 9) / 16);
    await sharp(srcFile)
      .extract({ left: box.left, top: box.top + Math.max(0, Math.round((box.height - h16) / 2)), width: box.width, height: Math.min(h16, box.height) })
      .resize({ width: SIZES.cover, kernel: "lanczos3" })
      .webp({ ...WEBP, quality: 80 })
      .toFile(path.join(OUT_COVER, `${card.slug}.webp`));
    art[key].cover = true;
  }

  scritti += 1;
  if (scritti % 25 === 0) console.log(`  ${scritti}/${base.size}…`);
  if (!meta.hasAlpha) console.log(`  nota: ${file} non ha canale alfa`);
}

// File di carte non più presenti nel materiale: si tolgono, altrimenti restano in public per sempre.
if (!only) {
  for (const dir of [OUT_DIR, OUT_SM, OUT_ART, OUT_COVER]) {
    for (const f of await readdir(dir)) {
      if (!f.endsWith(".webp")) continue;
      const atteso = dir === OUT_COVER ? [...base.keys()].some((k) => byKey.get(k)?.legendary && `${byKey.get(k).slug}.webp` === f) : attesi.has(f);
      if (!atteso) {
        await rm(path.join(dir, f));
        console.log(`  rimosso file orfano: ${path.relative(ROOT, path.join(dir, f))}`);
      }
    }
  }
}

const manifest = {
  source: "Materiale ufficiale Koin Games (canale creator, 19/09/2026). Uso autorizzato per i contenuti, non per il design del sito.",
  generated: new Date().toISOString().slice(0, 10),
  sizes: SIZES,
  art,
};
if (only) {
  const prev = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : { art: {} };
  manifest.art = { ...prev.art, ...art };
}
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);

console.log(`\nScritte ${scritti} carte in public/cards/ (${SIZES.full} px) e public/cards/sm/ (${SIZES.sm} px).`);
console.log(`Manifest: ${path.relative(ROOT, MANIFEST)} — ${Object.keys(manifest.art).length} chiavi.`);
