// I pannelli dell'app per l'estensione Twitch (14/10/2026; src/overlay/twitchPanels.ts): `npm run twitch-panels` dalla
// cartella tracker/. Scrive in ../twitch-extension/ panels.js (esbuild, NON minificato: Twitch vuole codice leggibile),
// panels.css (il CSS dei pannelli dell'app, deck.css, più le regole per stare sopra il video), i font e il logo piccolo.
// I file generati si committano e vanno nello zip dell'estensione (twitch-extension/README.md). Da rilanciare quando
// cambiano deckRender.ts, deck.css o twitchPanels.ts.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.resolve(root, "..", "twitch-extension");

await build({
  entryPoints: [path.join(root, "src/overlay/twitchPanels.ts")],
  outfile: path.join(out, "panels.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "chrome100",
  minify: false,
  legalComments: "none",
  banner: { js: "/* OriginsMeta Deck tracker: i pannelli dell'app OriginsMeta Tracker (generato da tracker/scripts/twitch-panels.mjs, non modificare a mano) */" },
  logLevel: "warning",
});

// le variabili dell'app valgono solo dentro i pannelli, così non cambiano i colori della linguetta dell'estensione
const css = fs.readFileSync(path.join(root, "src/overlay/deck.css"), "utf8").replace(/:root\s*\{/g, ".om-app {");
const extra = `
/* ---------- sopra il video di Twitch (twitch-panels.mjs) ---------- */
/* le regole di pagina dell'app (html, body) non servono: i pannelli stanno in un contenitore scalato da overlay.js */
.om-app { position: absolute; transform-origin: 0 0; font-family: var(--body); font-size: 14px; line-height: 1.3; color: var(--chalk); pointer-events: auto; }
.om-app .dt { width: auto; margin-left: 0; margin-right: 0; }
.om-app .gc, .om-app .nrow, .om-app .legband { cursor: help; }
`;
fs.writeFileSync(path.join(out, "panels.css"), `/* OriginsMeta Deck tracker: il CSS dei pannelli dell'app (deck.css), generato da tracker/scripts/twitch-panels.mjs */\n${css}\n${extra}`);
fs.mkdirSync(path.join(out, "fonts"), { recursive: true });
for (const f of fs.readdirSync(path.join(root, "assets/fonts"))) fs.copyFileSync(path.join(root, "assets/fonts", f), path.join(out, "fonts", f));
fs.copyFileSync(path.join(root, "assets/logo-originsmeta-sm.webp"), path.join(out, "logo-originsmeta-sm.webp"));
console.log("pannelli per l'estensione Twitch: twitch-extension/panels.js, panels.css, fonts/, logo");
