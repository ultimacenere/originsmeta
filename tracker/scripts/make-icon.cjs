// Icona dell'app dal logo del sito (src/app/icon.svg): Electron disegna l'SVG in una finestra invisibile, poi si
// scrivono assets/icon.ico (16–256 px, immagini PNG) e assets/icon.png (256 px). Si lancia con
// `npx electron scripts/make-icon.cjs` dalla cartella tracker/ e i due file si tengono nel repo.
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const svg = fs.readFileSync(path.join(root, "../src/app/icon.svg"), "utf8");
const SIZES = [16, 24, 32, 48, 64, 128, 256];

function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.png)]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 256, height: 256, frame: false, transparent: true, useContentSize: true, webPreferences: { offscreen: true } });
  const html = `<html><body style="margin:0;background:transparent;overflow:hidden"><img width="256" height="256" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></body></html>`;
  await win.loadURL(`data:text/html;base64,${Buffer.from(html).toString("base64")}`);
  await new Promise((r) => setTimeout(r, 400));
  const shot = await win.webContents.capturePage();
  const big = shot.resize({ width: 256, height: 256, quality: "best" });
  const pngs = SIZES.map((size) => ({ size, png: (size === 256 ? big : big.resize({ width: size, height: size, quality: "best" })).toPNG() }));
  fs.writeFileSync(path.join(root, "assets/icon.ico"), ico(pngs));
  fs.writeFileSync(path.join(root, "assets/icon.png"), big.toPNG());
  console.log(`icona: ${SIZES.join(", ")} px`);
  app.exit(0);
});
