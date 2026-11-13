// Tabella delle carte per l'interfaccia dell'app, generata dal database del sito (src/lib/data/cards.ts): chiave del
// gioco → nome, slug della scheda, costo, tipo, Leggendaria e, dal 05/11/2026, il ruolo per il cimitero (`g`,
// src/shared/graveRoles.ts). Da rigenerare quando cambia il database (lo fa
// `npm run build`). Dal 13/11/2026 anche forza, salute, allineamento e testo (la carta del gioco); più avanti l'app la scaricherà dal sito (Fase 3).
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
  // `sp` (10/11/2026): la carta aggiunge magie casuali alla mano (Genie, Morgan le Fay, Spellbook): le magie che lancio
  // possono non essere nel mio mazzo (`makesSpells` di src/shared/reconstruct.ts)
  const sp = /add (?:a|\d+) random spells? to your hand/i.test(c.ability?.en ?? "");
  // `p`, `h`, `al`, `x` (13/11/2026): forza, salute, allineamento e testo en/it/es per la carta del gioco (src/game-card/,
  // anteprima al passaggio del mouse: src/overlay/cardPeek.ts)
  const x = { en: c.ability?.en ?? "", it: c.ability?.it ?? c.ability?.en ?? "", es: c.ability?.es ?? c.ability?.en ?? "" };
  table[c.key] = { n: c.name, s: c.slug, m: c.mana ?? null, t: c.type, l: c.legendary ? 1 : 0, a: c.status === "active" ? 1 : 0, ...(g ? { g } : {}), ...(sp ? { sp: 1 } : {}), p: c.power ?? null, h: c.health ?? null, al: c.alignment ?? null, ...(c.art ? { art: 1 } : {}), x };
}
fs.writeFileSync(path.join(root, "src/cards.json"), JSON.stringify(table));
console.log(`carte per l'app: ${Object.keys(table).length}`);
