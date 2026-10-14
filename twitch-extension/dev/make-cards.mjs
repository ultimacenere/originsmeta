// Solo per le prove locali (cartella dev/, fuori dallo zip): crea dev/cards-en.json nella forma di
// /api/twitch/cards/<lingua> ([nome, slug, tipo, costo, forza, salute, leggendaria, testo, immagine]) dai dati del
// repo (src/lib/data/woo-cards.json, testi inglesi dell'import; il sito usa quelli letti nel gioco).
// Uso: node twitch-extension/dev/make-cards.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const woo = JSON.parse(readFileSync(join(root, "src", "lib", "data", "woo-cards.json"), "utf8"));
const out = {};
for (const c of woo.cards) {
  if (!c.key || c.status === "removed") continue;
  const img = existsSync(join(root, "public", "cards", `${c.slug}.webp`)) ? `/cards/${c.slug}.webp` : null;
  out[c.key] = [c.name, c.slug, c.type, c.mana ?? null, c.power ?? null, c.health ?? null, c.legendary ? 1 : 0, c.ability ?? "", img];
}
writeFileSync(join(here, "cards-en.json"), JSON.stringify(out));
console.log(`dev/cards-en.json: ${Object.keys(out).length} carte`);
