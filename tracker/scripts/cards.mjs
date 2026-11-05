// Tabella delle carte per l'interfaccia dell'app, generata dal database del sito (src/lib/data/cards.ts): chiave del
// gioco → nome, slug della scheda, costo, tipo, Leggendaria e, dal 05/11/2026, il ruolo per il cimitero (`g`,
// src/shared/graveRoles.ts). Nessun testo né illustrazione. Da rigenerare quando cambia il database (lo fa
// `npm run build`); più avanti l'app la scaricherà dal sito (Fase 3).
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const { cards } = await import(pathToFileURL(path.join(root, "../src/lib/data/cards.ts")).href);
const { graveRoleOf } = await import(pathToFileURL(path.join(root, "src/shared/graveRoles.ts")).href);
const table = {};
for (const c of cards) {
  if (!c.key) continue;
  const g = graveRoleOf(c);
  table[c.key] = { n: c.name, s: c.slug, m: c.mana ?? null, t: c.type, l: c.legendary ? 1 : 0, a: c.status === "active" ? 1 : 0, ...(g ? { g } : {}) };
}
fs.writeFileSync(path.join(root, "src/cards.json"), JSON.stringify(table));
console.log(`carte per l'app: ${Object.keys(table).length}`);
