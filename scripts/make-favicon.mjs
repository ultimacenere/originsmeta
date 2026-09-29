// Rigenera src/app/favicon.ico dal logo del sito, src/app/icon.svg. Fino al 29/09/2026 favicon.ico era quella del modello
// create-next-app (il triangolo di Vercel) e Next la dichiara in ogni pagina accanto all'SVG, quindi browser e Google
// potevano mostrare quella al posto del logo.
// Chrome o Edge headless (già installati: nessuna dipendenza) disegnano l'SVG su un canvas a ogni misura, 16, 32, 48 e
// 256 px, ognuna dal vettore e non rimpicciolendo la grande, trasparente fuori dagli angoli arrotondati; il .ico ha la
// forma di quello di prima: 16, 32 e 48 px in BMP a 32 bit con alfa (la forma che leggono tutti), 256 px in PNG.
//
// Uso, dopo ogni modifica di icon.svg (il .ico si tiene nel repo):
//   node scripts/make-favicon.mjs
//   CHROME_PATH=<eseguibile> node scripts/make-favicon.mjs    se Chrome o Edge non stanno nei percorsi soliti
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SVG = path.join(root, "src/app/icon.svg");
const ICO = path.join(root, "src/app/favicon.ico");
const SIZES = [16, 32, 48, 256];
/** Da questa misura in su l'immagine entra nel .ico come PNG, sotto come BMP. */
const PNG_FROM = 256;

function browserPath() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error("Chrome o Edge non trovati: indica l'eseguibile con CHROME_PATH");
  return found;
}

/** L'SVG ha solo il viewBox: con larghezza e altezza esplicite il browser lo disegna direttamente a quella misura. */
function sizedSvg(svg, size) {
  return svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag.replace(/\s(?:width|height)="[^"]*"/g, "").replace(/^<svg/, `<svg width="${size}" height="${size}"`),
  );
}

/** Pagina che disegna ogni misura su un canvas e scrive nel DOM, per --dump-dom, il PNG e i pixel RGBA in base64. */
function renderPage(svg) {
  const imgs = SIZES.map(
    (size) => `<img data-size="${size}" src="data:image/svg+xml;base64,${Buffer.from(sizedSvg(svg, size)).toString("base64")}">`,
  );
  return `<!doctype html><meta charset="utf-8"><body>${imgs.join("")}<pre id="out"></pre><script>
addEventListener("load", async () => {
  const lines = [];
  for (const img of document.querySelectorAll("img")) {
    await img.decode();
    const size = Number(img.dataset.size);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    const rgba = ctx.getImageData(0, 0, size, size).data;
    let bin = "";
    for (let i = 0; i < rgba.length; i += 32768) bin += String.fromCharCode.apply(null, rgba.subarray(i, i + 32768));
    lines.push(["ICON", size, canvas.toDataURL("image/png").split(",")[1], btoa(bin)].join(" "));
  }
  document.getElementById("out").textContent = lines.join(" ; ");
});
</script>`;
}

function render(svg) {
  const dir = mkdtempSync(path.join(tmpdir(), "om-favicon-"));
  try {
    const html = path.join(dir, "icon.html");
    writeFileSync(html, renderPage(svg));
    const exe = browserPath();
    console.log(`browser: ${exe}`);
    const run = spawnSync(
      exe,
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
    const images = new Map();
    for (const [, size, png, rgba] of run.stdout.matchAll(/ICON ([0-9]+) ([A-Za-z0-9+/=]+) ([A-Za-z0-9+/=]+)/g)) {
      images.set(Number(size), { png: Buffer.from(png, "base64"), rgba: Buffer.from(rgba, "base64") });
    }
    for (const size of SIZES) {
      const img = images.get(size);
      const ok =
        img &&
        img.png.length > 24 &&
        img.png.toString("latin1", 1, 4) === "PNG" &&
        img.png.readUInt32BE(16) === size &&
        img.png.readUInt32BE(20) === size &&
        img.rgba.length === size * size * 4;
      if (!ok) throw new Error(`il browser non ha restituito l'immagine da ${size} px\n${run.stderr.slice(-2000)}`);
    }
    return images;
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  }
}

/** Immagine BMP del .ico: altezza doppia (colore + maschera), pixel BGRA dal basso, maschera a 1 bit (1 = trasparente). */
function bmp(size, rgba) {
  const maskRow = Math.ceil(size / 32) * 4;
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(size * size * 4 + maskRow * size, 20);
  const pixels = Buffer.alloc(size * size * 4);
  const mask = Buffer.alloc(maskRow * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const from = ((size - 1 - y) * size + x) * 4;
      const to = (y * size + x) * 4;
      pixels[to] = rgba[from + 2];
      pixels[to + 1] = rgba[from + 1];
      pixels[to + 2] = rgba[from];
      pixels[to + 3] = rgba[from + 3];
      if (rgba[from + 3] === 0) mask[y * maskRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return Buffer.concat([header, pixels, mask]);
}

function ico(entries) {
  const header = Buffer.alloc(6 + 16 * entries.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  entries.forEach(({ size, data }, i) => {
    const o = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, o);
    header.writeUInt8(size >= 256 ? 0 : size, o + 1);
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(data.length, o + 8);
    header.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...entries.map((e) => e.data)]);
}

const images = render(readFileSync(SVG, "utf8"));
const entries = SIZES.map((size) => {
  const { png, rgba } = images.get(size);
  return { size, data: size >= PNG_FROM ? png : bmp(size, rgba) };
});
const out = ico(entries);
writeFileSync(ICO, out);
const parts = entries.map(({ size, data }) => `${size} px ${size >= PNG_FROM ? "PNG" : "BMP"} ${data.length} byte`);
console.log(`src/app/favicon.ico: ${parts.join(", ")}; ${out.length} byte in tutto`);
