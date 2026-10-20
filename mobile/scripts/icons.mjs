// Icone dell'app Android dal logo del sito (src/app/icon.svg), mai da materiale Koin.
// Come scripts/make-favicon.mjs del sito: Chrome o Edge headless disegnano l'SVG su un canvas a ogni misura, nessuna
// dipendenza. Scrive nel progetto Android:
//   mipmap-<densità>/ic_launcher.png             logo intero (Android 7, senza icone adattive)
//   mipmap-<densità>/ic_launcher_round.png       carta su un cerchio verde (launcher che chiedono l'icona tonda)
//   mipmap-<densità>/ic_launcher_foreground.png  primo piano dell'icona adattiva (Android 8+), trasparente, 108 dp
//   values/ic_launcher_background.xml            sfondo dell'icona adattiva: il verde del logo
// e store/play-icon-512.png per la scheda di Google Play (quadrata: gli angoli li arrotonda Play).
//
// Uso, dalla cartella mobile/, dopo ogni modifica del logo:
//   npm run icons
//   CHROME_PATH=<eseguibile> npm run icons    se Chrome o Edge non stanno nei percorsi soliti
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.resolve(here, "..");
const LOGO = path.resolve(mobile, "../src/app/icon.svg");
const RES = path.join(mobile, "android/app/src/main/res");
const STORE = path.join(mobile, "store");

/** Densità di Android: icona del launcher 48 dp, primo piano adattivo 108 dp. */
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

/** Il logo: sfondo (il primo rect a tutta misura) e il resto (carta, M, pallino), che si ridisegna sugli altri fondi. */
export function splitLogo(svg) {
  const bg = svg.match(/<rect\s+width="64"\s+height="64"[^>]*fill="(#[0-9a-fA-F]{3,8})"[^>]*\/>/);
  if (!bg) throw new Error("icon.svg: non trovo il rect di sfondo 64 × 64");
  const inner = svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>")).replace(bg[0], "");
  return { background: bg[1].toLowerCase(), content: inner.trim() };
}

/**
 * Carta del logo al centro di un quadrato 108 × 108. Scala 1,2 per l'icona adattiva: tutto dentro il cerchio di 66 dp
 * (zona sicura delle maschere dei launcher, e della schermata d'avvio di Android 12+); 1,45 dove non c'è maschera.
 */
export function centered(content, scale, background) {
  const bg = background ? `<rect width="108" height="108" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">${bg}<g transform="translate(54 54) scale(${scale}) translate(-32 -32)">${content}</g></svg>`;
}

function round(content, background) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><circle cx="54" cy="54" r="54" fill="${background}"/><g transform="translate(54 54) scale(1.45) translate(-32 -32)">${content}</g></svg>`;
}

export function targets(svg) {
  const { background, content } = splitLogo(svg);
  const list = [];
  for (const [name, k] of Object.entries(DENSITIES)) {
    const dir = path.join(RES, `mipmap-${name}`);
    list.push({ file: path.join(dir, "ic_launcher.png"), size: 48 * k, svg });
    list.push({ file: path.join(dir, "ic_launcher_round.png"), size: 48 * k, svg: round(content, background) });
    list.push({ file: path.join(dir, "ic_launcher_foreground.png"), size: 108 * k, svg: centered(content, 1.2) });
  }
  list.push({ file: path.join(STORE, "play-icon-512.png"), size: 512, svg: centered(content, 1.45, background) });
  return { background, list };
}

function browserPath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("Chrome o Edge non trovati: indica l'eseguibile con CHROME_PATH");
  return found;
}

function sized(svg, size) {
  return svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag.replace(/\s(?:width|height)="[^"]*"/g, "").replace(/^<svg/, `<svg width="${size}" height="${size}"`),
  );
}

/** Disegna tutte le immagini in una pagina sola e le legge dal DOM (--dump-dom), come make-favicon.mjs. */
function render(list) {
  const dir = mkdtempSync(path.join(tmpdir(), "om-app-icons-"));
  try {
    const imgs = list.map(
      (t, i) => `<img data-i="${i}" data-size="${t.size}" src="data:image/svg+xml;base64,${Buffer.from(sized(t.svg, t.size)).toString("base64")}">`,
    );
    const html = path.join(dir, "icons.html");
    writeFileSync(
      html,
      `<!doctype html><meta charset="utf-8"><body>${imgs.join("")}<pre id="out"></pre><script>
addEventListener("load", async () => {
  const lines = [];
  for (const img of document.querySelectorAll("img")) {
    await img.decode();
    const size = Number(img.dataset.size);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d").drawImage(img, 0, 0, size, size);
    lines.push("ICON " + img.dataset.i + " " + canvas.toDataURL("image/png").split(",")[1]);
  }
  document.getElementById("out").textContent = lines.join(" ; ");
});
</script>`,
    );
    const run = spawnSync(
      browserPath(),
      [
        "--headless",
        "--disable-gpu",
        "--disable-extensions",
        "--no-first-run",
        "--no-default-browser-check",
        "--force-color-profile=srgb",
        `--user-data-dir=${path.join(dir, "profile")}`,
        "--virtual-time-budget=10000",
        "--dump-dom",
        pathToFileURL(html).href,
      ],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 120_000 },
    );
    if (run.error) throw run.error;
    const out = new Map();
    for (const [, i, png] of run.stdout.matchAll(/ICON ([0-9]+) ([A-Za-z0-9+/=]+)/g)) out.set(Number(i), Buffer.from(png, "base64"));
    return list.map((t, i) => {
      const png = out.get(i);
      const ok = png && png.toString("latin1", 1, 4) === "PNG" && png.readUInt32BE(16) === t.size && png.readUInt32BE(20) === t.size;
      if (!ok) throw new Error(`il browser non ha restituito ${path.basename(t.file)} da ${t.size} px\n${run.stderr.slice(-2000)}`);
      return png;
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const { background, list } = targets(readFileSync(LOGO, "utf8"));
  const pngs = render(list);
  list.forEach((t, i) => {
    mkdirSync(path.dirname(t.file), { recursive: true });
    writeFileSync(t.file, pngs[i]);
    console.log(`${path.relative(mobile, t.file)}  ${t.size} px`);
  });
  writeFileSync(
    path.join(RES, "values/ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<!-- Generato da scripts/icons.mjs: il verde dello sfondo del logo (src/app/icon.svg). -->\n<resources>\n    <color name="ic_launcher_background">${background.toUpperCase()}</color>\n</resources>\n`,
  );
  console.log(`values/ic_launcher_background.xml  ${background}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
