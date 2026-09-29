// Per `node --test` sui file TypeScript dell'app e del sito: aggiunge `.ts` agli import relativi senza estensione
// (come l'hook dei test del sito, per esempio cardSynergy.test.ts). Node 24 toglie da solo i tipi.
import { registerHooks } from "node:module";

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
