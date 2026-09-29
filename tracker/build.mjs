// Build dell'app con esbuild: processo principale e preload per Node (CommonJS, electron esterno), interfaccia per il
// browser. Il lettore dei file (../src/lib/tracker/) entra nel pacchetto così com'è: una sola copia del codice, con
// i test del sito.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const root = import.meta.dirname;
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });

const node = { bundle: true, platform: "node", format: "cjs", target: "node22", external: ["electron"], sourcemap: true, logLevel: "warning" };
await build({ ...node, entryPoints: [path.join(root, "src/main/main.ts")], outfile: path.join(dist, "main.js") });
await build({ ...node, entryPoints: [path.join(root, "src/preload/preload.ts")], outfile: path.join(dist, "preload.js"), sourcemap: false });
await build({
  entryPoints: [path.join(root, "src/renderer/app.ts")],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "chrome120",
  outfile: path.join(dist, "renderer/app.js"),
  logLevel: "warning",
});

fs.copyFileSync(path.join(root, "src/renderer/index.html"), path.join(dist, "renderer/index.html"));
fs.copyFileSync(path.join(root, "src/renderer/style.css"), path.join(dist, "renderer/style.css"));
fs.copyFileSync(path.join(root, "assets/icon.ico"), path.join(dist, "icon.ico"));
console.log("build dell'app: dist/");
