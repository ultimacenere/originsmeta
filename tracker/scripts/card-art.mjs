// Riferimenti del riconoscitore dello scanner (src/shared/recognize.ts): per ogni carta con la chiave del gioco, il
// vettore dei colori della sua illustrazione, preso dall'immagine del sito (public/cards/<slug>.webp). Scrive
// src/card-art.json e, solo con la parte sinistra dell'illustrazione per le carte della mano (`ART_IN_HAND`, dall'11/10/2026),
// src/card-art-hand.json e, con l'inquadratura del riquadro delle magie (`ART_IN_PREVIEW`, dal 13/10/2026),
// src/card-art-preview.json e, dal 10/11/2026, src/card-art-variants.json con le varianti delle carte che il sito ha già
// (varianti ALPHA in public/cards/alt, promo del Kickstarter in public/media/kickstarter/promos: `VARIANT_ART`).
// Si committano: la build non li rigenera, va rilanciato a mano quando cambiano carte, varianti o immagini
// (`npm run card-art`, dopo `npm run cards`). Le immagini si decodificano con sharp, che il sito ha già installato con
// Next: nessuna dipendenza nuova per l'app.
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { artVector, ART_IN_CARD, ART_IN_HAND, ART_IN_PREVIEW, inside, packVector, SLAB_CARD, VARIANT_ART, VARIANT_CARD, VARIANT_HAND_ART } from "../src/shared/recognize.ts";

const root = path.resolve(import.meta.dirname, "..");
const site = path.resolve(root, "..");
const require = createRequire(path.join(site, "package.json"));
const sharp = require("sharp");

const cards = JSON.parse(fs.readFileSync(path.join(root, "src/cards.json"), "utf8"));
const out = {};
const hand = {};
const preview = {};
let missing = [];

async function decode(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { img: { data, width: info.width, height: info.height, channels: 4 }, whole: { x: 0, y: 0, w: info.width, h: info.height } };
}

for (const [key, c] of Object.entries(cards)) {
  const file = path.join(site, "public/cards", `${c.s}.webp`);
  if (!fs.existsSync(file)) {
    missing.push(c.s);
    continue;
  }
  const { img, whole } = await decode(file);
  out[key] = packVector(artVector(img, inside(whole, ART_IN_CARD)));
  hand[key] = packVector(artVector(img, inside(whole, ART_IN_HAND)));
  preview[key] = packVector(artVector(img, inside(whole, ART_IN_PREVIEW)));
}
fs.writeFileSync(path.join(root, "src/card-art.json"), JSON.stringify(out));
fs.writeFileSync(path.join(root, "src/card-art-hand.json"), JSON.stringify(hand));
fs.writeFileSync(path.join(root, "src/card-art-preview.json"), JSON.stringify(preview));
console.log(`riferimenti dello scanner: ${Object.keys(out).length} carte${missing.length ? `, senza immagine: ${missing.join(", ")}` : ""}`);

// ---------- varianti: chiave della carta base → vettori delle sue varianti ----------
const keyOfSlug = new Map(Object.entries(cards).map(([key, c]) => [c.s, key]));
const variants = {};
const variantsHand = {};
const skipped = [];
const add = async (key, file, card, label) => {
  if (!key || !cards[key]) return skipped.push(`${label} (carta non nel database)`);
  if (!fs.existsSync(file)) return skipped.push(`${label} (immagine mancante)`);
  const { img, whole } = await decode(file);
  const inCard = inside(inside(whole, card), VARIANT_CARD);
  (variants[key] ??= []).push(packVector(artVector(img, inside(inCard, ART_IN_CARD))));
  (variantsHand[key] ??= []).push(packVector(artVector(img, inside(inCard, ART_IN_HAND))));
};
// varianti ALPHA del pacco creator: C00021_MB_V00011 → public/cards/alt/big-bad-wolf-v00011.webp
const manifest = JSON.parse(fs.readFileSync(path.join(site, "src/lib/data/card-variants.json"), "utf8"));
const FULL = { x: 0, y: 0, w: 1, h: 1 };
for (const [id, v] of Object.entries(manifest.variants)) {
  const code = id.match(/_(V\d+)$/)?.[1];
  await add(id.replace(/_V\d+$/, ""), path.join(site, "public/cards/alt", `${v.slug}-${code?.toLowerCase()}.webp`), FULL, id);
}
// promo Alpha del Kickstarter, dentro la teca; i "Character Profile" non sono carte
const { KICKSTARTER_PROMOS } = await import(pathToFileURL(path.join(site, "src/lib/kickstarterPromos.ts")).href);
for (const p of KICKSTARTER_PROMOS) {
  if (p.group === "profile") continue;
  await add(keyOfSlug.get(p.card), path.join(site, "public", p.image), SLAB_CARD, p.image);
}
fs.writeFileSync(path.join(root, "src", VARIANT_ART), JSON.stringify(variants));
fs.writeFileSync(path.join(root, "src", VARIANT_HAND_ART), JSON.stringify(variantsHand));
const n = Object.values(variants).reduce((s, l) => s + l.length, 0);
console.log(`varianti: ${n} immagini di ${Object.keys(variants).length} carte${skipped.length ? `, saltate: ${skipped.join(", ")}` : ""}`);
