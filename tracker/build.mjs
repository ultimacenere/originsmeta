// Build dell'app con esbuild: processo principale e preload per Node (CommonJS, electron esterno), interfaccia e overlay
// per il browser. Il lettore dei file (../src/lib/tracker/) entra nel pacchetto così com'è: una sola copia del codice,
// con i test del sito.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
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
await build({ ...node, entryPoints: [path.join(root, "src/preload/frames-preload.ts")], outfile: path.join(dist, "frames-preload.js"), sourcemap: false });
await build({ ...node, entryPoints: [path.join(root, "src/preload/deck-preload.ts")], outfile: path.join(dist, "deck-preload.js"), sourcemap: false });
await build({ ...browser, entryPoints: [path.join(root, "src/renderer/app.ts")], outfile: path.join(dist, "renderer/app.js") });
// la pagina dell'overlay: nella finestra sopra il gioco e nella sorgente per OBS (servita da overlay.ts)
await build({ ...browser, entryPoints: [path.join(root, "src/overlay/overlay.ts")], outfile: path.join(dist, "overlay/overlay.js") });
// il pannello del mazzo (10/10/2026): nella stessa cartella dell'overlay, così la sorgente per OBS ha anche font e logo
await build({ ...browser, entryPoints: [path.join(root, "src/overlay/deck.ts")], outfile: path.join(dist, "overlay/deck.js") });
// la finestra nascosta della modalità cattura dello scanner (main/frames.ts, solo con --frames)
await build({ ...browser, entryPoints: [path.join(root, "src/frames/frames.ts")], outfile: path.join(dist, "frames/frames.js") });

fs.copyFileSync(path.join(root, "src/renderer/index.html"), path.join(dist, "renderer/index.html"));
fs.copyFileSync(path.join(root, "src/renderer/style.css"), path.join(dist, "renderer/style.css"));
fs.copyFileSync(path.join(root, "src/overlay/overlay.html"), path.join(dist, "overlay/overlay.html"));
fs.copyFileSync(path.join(root, "src/overlay/overlay.css"), path.join(dist, "overlay/overlay.css"));
fs.copyFileSync(path.join(root, "src/overlay/deck.html"), path.join(dist, "overlay/deck.html"));
fs.copyFileSync(path.join(root, "src/overlay/deck.css"), path.join(dist, "overlay/deck.css"));
fs.copyFileSync(path.join(root, "src/frames/frames.html"), path.join(dist, "frames/frames.html"));
fs.copyFileSync(path.join(root, "assets/icon.ico"), path.join(dist, "icon.ico"));
// su Linux (0.6.0) finestre, barra e voce del menu vogliono il PNG: le immagini .ico lì non si leggono
fs.copyFileSync(path.join(root, "assets/icon.png"), path.join(dist, "icon.png"));
// Logo e font del sito (01/10/2026): accanto a ciascuna pagina, così i percorsi relativi valgono sia nella finestra
// (file://) sia nella sorgente per OBS, che il server locale serve solo da /overlay/ (overlay.ts)
for (const page of ["renderer", "overlay"]) {
  fs.mkdirSync(path.join(dist, page, "fonts"), { recursive: true });
  for (const f of fs.readdirSync(path.join(root, "assets/fonts"))) fs.copyFileSync(path.join(root, "assets/fonts", f), path.join(dist, page, "fonts", f));
  for (const f of ["logo-originsmeta.webp", "logo-originsmeta-sm.webp"]) fs.copyFileSync(path.join(root, "assets", f), path.join(dist, page, f));
}

// L'OCR di Windows senza PowerShell (03/11/2026, src/main/ocr.ts): dist/ocr/originsmeta-tracker-ocr.exe, compilato con
// il csc.exe di .NET Framework 4 che c'è in ogni Windows, contro i metadati di System32\WinMetadata, con la versione e
// l'icona dell'app. package.mjs lo mette accanto ad app.asar; senza csc l'app funziona ma senza OCR (bot e classificate).
const windows = process.env.SystemRoot ?? "C:\\Windows";
const csc = path.join(windows, "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");
if (process.platform === "win32" && fs.existsSync(csc)) {
  const ocr = path.join(dist, "ocr");
  fs.mkdirSync(ocr, { recursive: true });
  const { version } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const info = path.join(ocr, "version.cs");
  fs.writeFileSync(info, `[assembly: System.Reflection.AssemblyVersion("${version}.0")]\n[assembly: System.Reflection.AssemblyFileVersion("${version}.0")]\n`);
  const meta = path.join(windows, "System32", "WinMetadata");
  execFileSync(
    csc,
    [
      "/nologo",
      "/target:exe",
      "/platform:anycpu",
      "/optimize+",
      `/out:${path.join(ocr, "originsmeta-tracker-ocr.exe")}`,
      `/win32icon:${path.join(root, "assets", "icon.ico")}`,
      ...["Windows.Foundation", "Windows.Graphics", "Windows.Media", "Windows.Storage"].map((n) => `/r:${path.join(meta, `${n}.winmd`)}`),
      `/r:${path.join(path.dirname(csc), "System.Runtime.dll")}`,
      path.join(root, "src", "ocr", "OcrHelper.cs"),
      info,
    ],
    { stdio: "inherit" },
  );
  fs.rmSync(info);
} else console.warn("build dell'app: csc.exe non trovato, niente OCR (dist/ocr/originsmeta-tracker-ocr.exe)");
console.log("build dell'app: dist/");
