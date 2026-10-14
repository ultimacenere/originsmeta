// Immagini per la scheda dell'estensione nella console di Twitch (14/10/2026), misure della guida di Twitch
// (dev.twitch.tv/docs/extensions/life-cycle, "Image Assets"): logo 100 × 100 PNG, icona della barra 24 × 24 PNG
// (serve solo alle estensioni "component", la teniamo pronta), discovery 300 × 200 PNG senza trasparenza e con poco
// testo, screenshot 1024 × 768 (4:3) che mostrano l'estensione in azione.
// Logo e discovery sono nostri (logo del sito, src/app/icon.svg, e palette "ink & mint"): niente materiale Koin, che
// non si usa per l'identità. Gli screenshot si fanno dalla diretta e questo script li porta a 1024 × 768 senza tagliare
// niente (il 16:9 entra intero, con le fasce sopra e sotto nel colore del sito), così i pannelli ai lati restano dentro.
//
// Uso, dalla radice del repo:
//   node twitch-extension/dev/store-images.mjs                      logo, icona e discovery in twitch-extension/store/
//   node twitch-extension/dev/store-images.mjs shot <file.png> ...  screenshot 1024 × 768 accanto a quelli di prima
// Chrome o Edge headless, nessuna dipendenza (come scripts/make-favicon.mjs).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(root, "twitch-extension/store");
const FELT = "#150c2c";

function browserPath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("Chrome o Edge non trovati: indica l'eseguibile con CHROME_PATH");
  return found;
}

const tmp = mkdtempSync(path.join(tmpdir(), "om-twitch-store-"));
function shoot(name, width, height, html) {
  const page = path.join(tmp, `${path.parse(name).name}.html`);
  writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}</style>${html}`);
  const out = path.join(OUT, name);
  const res = spawnSync(browserPath(), [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    `--window-size=${width},${height}`, "--virtual-time-budget=6000", `--user-data-dir=${path.join(tmp, "profile")}`,
    `--screenshot=${out}`, pathToFileURL(page).href,
  ], { encoding: "utf8" });
  if (!existsSync(out)) throw new Error(`${name} non creato: ${res.stderr}`);
  const png = readFileSync(out);
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  if (w !== width || h !== height) throw new Error(`${name}: ${w} × ${h} invece di ${width} × ${height}`);
  console.log(`${path.relative(root, out)}  ${w} × ${h}`);
}

// logo del sito a tutto quadrato: senza angoli trasparenti, Twitch lo ritaglia da sé
const icon = readFileSync(path.join(root, "src/app/icon.svg"), "utf8").replace(/<rect width="64" height="64" rx="14"/, '<rect width="64" height="64"');
const svgAt = (size) => icon.replace(/^<svg\b/, `<svg width="${size}" height="${size}" style="display:block"`);
const FONTS = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700&family=Manrope:wght@600&display=block" rel="stylesheet">';

mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
try {
  if (args[0] === "shot") {
    const files = args.slice(1);
    if (!files.length) throw new Error("indica uno o più screenshot: node twitch-extension/dev/store-images.mjs shot <file.png>");
    files.forEach((file, i) => {
      const abs = path.resolve(file);
      const ext = path.extname(abs).slice(1).toLowerCase().replace("jpg", "jpeg");
      const data = `data:image/${ext};base64,${readFileSync(abs).toString("base64")}`;
      shoot(`screenshot-${i + 1}-1024x768.png`, 1024, 768,
        `<body style="background:${FELT};display:flex;align-items:center;justify-content:center"><img src="${data}" style="max-width:1024px;max-height:768px;display:block">`);
    });
  } else {
    shoot("logo-100.png", 100, 100, `<body style="background:#0b2e25">${svgAt(100)}`);
    shoot("taskbar-24.png", 24, 24, `<body style="background:#0b2e25">${svgAt(24)}`);
    shoot("discovery-300x200.png", 300, 200, `${FONTS}<body style="background:${FELT};display:flex;align-items:center;gap:18px;padding:0 24px;box-sizing:border-box">
      <div style="flex:none;border-radius:16px;overflow:hidden;outline:3px solid #3fc4e8;outline-offset:0">${svgAt(84)}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="font:700 20px/1.1 Unbounded,'Segoe UI',sans-serif;color:#d9dfe8">OriginsMeta</div>
        <div style="font:700 15px/1.15 Unbounded,'Segoe UI',sans-serif;color:#31e3bd">Deck tracker</div>
        <div style="font:600 12px/1.3 Manrope,'Segoe UI',sans-serif;color:#8e9bb1">for Origins TCG</div>
      </div>`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
