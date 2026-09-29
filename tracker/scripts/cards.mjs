// Tabella delle carte per l'interfaccia dell'app, generata dal database del sito (src/lib/data/cards.ts): chiave del
// gioco → nome, slug della scheda, costo, tipo, Leggendaria. Nessun testo né illustrazione. Da rigenerare quando cambia
// il database (lo fa `npm run build`); più avanti l'app la scaricherà dal sito (Fase 3).
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const { cards } = await import(pathToFileURL(path.join(root, "../src/lib/data/cards.ts")).href);
const table = {};
for (const c of cards) {
  if (!c.key) continue;
  table[c.key] = { n: c.name, s: c.slug, m: c.mana ?? null, t: c.type, l: c.legendary ? 1 : 0, a: c.status === "active" ? 1 : 0 };
}
fs.writeFileSync(path.join(root, "src/cards.json"), JSON.stringify(table));
console.log(`carte per l'app: ${Object.keys(table).length}`);
