// Solo per le prove locali (cartella dev/, fuori dallo zip): crea dev/cards-<lingua>.json (en, it, es, fr) nella forma di
// /api/twitch/cards/<lingua> ([nome, slug, tipo, costo, forza, salute, leggendaria, testo, immagine, allineamento]) dal
// database del sito (src/lib/data/cards.ts, gli stessi testi del sito: dal 13/11/2026; prima l'import inglese).
// Uso: node twitch-extension/dev/make-cards.mjs
import { writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
// gli import senza estensione del database del sito (come gli script dell'app)
await import(pathToFileURL(join(root, "tracker", "scripts", "ts-hooks.mjs")).href);
const { cards } = await import(pathToFileURL(join(root, "src", "lib", "data", "cards.ts")).href);
for (const lang of ["en", "it", "es", "fr"]) {
  const out = {};
  for (const c of cards) {
    if (!c.key || c.status === "removed") continue;
    const img = existsSync(join(root, "public", "cards", `${c.slug}.webp`)) ? `/cards/${c.slug}.webp` : null;
    const text = c.ability?.[lang] || c.ability?.en || "";
    out[c.key] = [c.name, c.slug, c.type, c.mana ?? null, c.power ?? null, c.health ?? null, c.legendary ? 1 : 0, text, img, c.alignment ?? null];
  }
  writeFileSync(join(here, `cards-${lang}.json`), JSON.stringify(out));
  console.log(`dev/cards-${lang}.json: ${Object.keys(out).length} carte`);
}
