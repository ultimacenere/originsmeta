// Riscrive le sezioni di public/llms.txt che vengono dai dati: "## Legendaries" (una riga per Leggendaria in gioco)
// e "## Guides" (tutte le guide in inglese). Il resto del file è scritto a mano e non si tocca.
//   node scripts/llms-txt.mjs          aggiorna il file
//   node scripts/llms-txt.mjs --check  non scrive: esce con 1 se il file non è allineato ai dati
// Va lanciato dopo una patch che tocca una Leggendaria o dopo una guida nuova; se ce ne si dimentica, lo dice
// src/lib/llms.test.ts (in npm test). Il codice che scrive le sezioni è in src/lib/llms.ts (Ondata 3, 25/09/2026).
//
// llms.ts e il database carte sono scritti per Next (import senza estensione, JSON senza attributi): come nei test,
// un hook di risoluzione dei moduli di Node (`module.registerHooks`, Node >= 22.15) aggiunge `.ts` agli import
// relativi e dichiara i JSON.
import { registerHooks } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
      try {
        return next(`${specifier}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    const resolved = next(specifier, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

const { syncLlmsTxt } = await import("../src/lib/llms.ts");

const file = new URL("../public/llms.txt", import.meta.url);
const before = readFileSync(file, "utf8");
const after = syncLlmsTxt(before);

if (process.argv.includes("--check")) {
  if (after !== before) {
    console.error("public/llms.txt non è allineato ai dati: lancia node scripts/llms-txt.mjs");
    process.exit(1);
  }
  console.log("public/llms.txt è allineato ai dati.");
} else if (after === before) {
  console.log("public/llms.txt era già allineato: nessuna modifica.");
} else {
  writeFileSync(file, after);
  console.log("public/llms.txt aggiornato (sezioni Legendaries e Guides).");
}
