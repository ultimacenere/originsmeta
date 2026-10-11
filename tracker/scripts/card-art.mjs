// Riferimenti del riconoscitore dello scanner (src/shared/recognize.ts): per ogni carta con la chiave del gioco, il
// vettore dei colori della sua illustrazione, preso dall'immagine del sito (public/cards/<slug>.webp). Scrive
// src/card-art.json e, solo con la parte sinistra dell'illustrazione per le carte della mano (`ART_IN_HAND`, dall'11/10/2026),
// src/card-art-hand.json, che si committano: la build non lo rigenera, va rilanciato a mano quando cambiano carte o immagini
// (`npm run card-art`, dopo `npm run cards`). Le immagini si decodificano con sharp, che il sito ha già installato con
// Next: nessuna dipendenza nuova per l'app.
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { artVector, ART_IN_CARD, ART_IN_HAND, inside, packVector } from "../src/shared/recognize.ts";

const root = path.resolve(import.meta.dirname, "..");
const site = path.resolve(root, "..");
const require = createRequire(path.join(site, "package.json"));
const sharp = require("sharp");

const cards = JSON.parse(fs.readFileSync(path.join(root, "src/cards.json"), "utf8"));
const out = {};
const hand = {};
let missing = [];
for (const [key, c] of Object.entries(cards)) {
  const file = path.join(site, "public/cards", `${c.s}.webp`);
  if (!fs.existsSync(file)) {
    missing.push(c.s);
    continue;
  }
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { data, width: info.width, height: info.height, channels: 4 };
  const whole = { x: 0, y: 0, w: info.width, h: info.height };
  out[key] = packVector(artVector(img, inside(whole, ART_IN_CARD)));
  hand[key] = packVector(artVector(img, inside(whole, ART_IN_HAND)));
}
fs.writeFileSync(path.join(root, "src/card-art.json"), JSON.stringify(out));
fs.writeFileSync(path.join(root, "src/card-art-hand.json"), JSON.stringify(hand));
console.log(`riferimenti dello scanner: ${Object.keys(out).length} carte${missing.length ? `, senza immagine: ${missing.join(", ")}` : ""}`);
