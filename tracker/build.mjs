// Build dell'app con esbuild: processo principale e preload per Node (CommonJS, electron esterno), interfaccia e overlay
// per il browser. Il lettore dei file (../src/lib/tracker/) entra nel pacchetto così com'è: una sola copia del codice,
// con i test del sito.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });

const node = { bundle: true, platform: "node", format: "cjs", target: "node22", external: ["electron"], sourcemap: true, logLevel: "warning" };
const browser = { bundle: true, platform: "browser", format: "iife", target: "chrome120", logLevel: "warning" };
await build({ ...node, entryPoints: [path.join(root, "src/main/main.ts")], outfile: path.join(dist, "main.js") });
await build({ ...node, entryPoints: [path.join(root, "src/preload/preload.ts")], outfile: path.join(dist, "preload.js"), sourcemap: false });
await build({ ...node, entryPoints: [path.join(root, "src/preload/overlay-preload.ts")], outfile: path.join(dist, "overlay-preload.js"), sourcemap: false });
await build({ ...browser, entryPoints: [path.join(root, "src/renderer/app.ts")], outfile: path.join(dist, "renderer/app.js") });
// la pagina dell'overlay: nella finestra sopra il gioco e nella sorgente per OBS (servita da overlay.ts)
await build({ ...browser, entryPoints: [path.join(root, "src/overlay/overlay.ts")], outfile: path.join(dist, "overlay/overlay.js") });

fs.copyFileSync(path.join(root, "src/renderer/index.html"), path.join(dist, "renderer/index.html"));
fs.copyFileSync(path.join(root, "src/renderer/style.css"), path.join(dist, "renderer/style.css"));
fs.copyFileSync(path.join(root, "src/overlay/overlay.html"), path.join(dist, "overlay/overlay.html"));
fs.copyFileSync(path.join(root, "src/overlay/overlay.css"), path.join(dist, "overlay/overlay.css"));
fs.copyFileSync(path.join(root, "assets/icon.ico"), path.join(dist, "icon.ico"));
// Logo e font del sito (01/10/2026): accanto a ciascuna pagina, così i percorsi relativi valgono sia nella finestra
// (file://) sia nella sorgente per OBS, che il server locale serve solo da /overlay/ (overlay.ts)
for (const page of ["renderer", "overlay"]) {
  fs.mkdirSync(path.join(dist, page, "fonts"), { recursive: true });
  for (const f of fs.readdirSync(path.join(root, "assets/fonts"))) fs.copyFileSync(path.join(root, "assets/fonts", f), path.join(dist, page, "fonts", f));
  for (const f of ["logo-originsmeta.webp", "logo-originsmeta-sm.webp"]) fs.copyFileSync(path.join(root, "assets", f), path.join(dist, page, f));
}
console.log("build dell'app: dist/");
