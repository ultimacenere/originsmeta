/**
 * Prova del riconoscimento dei bot (14/10/2026) sui fotogrammi salvati con `npm run frames`: per ogni schermata VS
 * ritaglia il nome dell'avversario come la finestra nascosta dello scanner (frames/frames.ts), lo legge con l'OCR di
 * Windows (main/ocr.ts) e stampa il testo letto e se è un bot. Resta sul PC: i fotogrammi hanno i nomi dei giocatori.
 * Uso (dalla cartella tracker/, con un fotogramma della schermata VS per partita):
 *   npx esbuild scripts/bot-names-check.ts --bundle --platform=node --format=cjs --external:electron --outfile=out/botcheck/main.js
 *   echo {"main":"main.js"} > out/botcheck/package.json
 *   node_modules/electron/dist/electron.exe out/botcheck <file.jpg> [<file.jpg> ...]
 * Prova del 14/10/2026 su 15 schermate VS del 10–12/10: "BIG BOB" e "(BOT)" bot, gli altri 13 nomi no.
 */
import { app, BrowserWindow } from "electron";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isBotName } from "../src/shared/botNames";
import { readNameText } from "../src/main/ocr";
import { VS_NAME_SCALE, VS_NAME_SHEAR, VS_OPP_NAME, layoutFor } from "../src/shared/recognize";

const files = process.argv.slice(2).filter((a) => /\.jpe?g$/i.test(a));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { webSecurity: false } });
  await win.loadURL("data:text/html,<html></html>");
  for (const file of files) {
    const crop = (await win.webContents.executeJavaScript(`(async () => {
      const im = new Image(); im.src = ${JSON.stringify(pathToFileURL(file).href)}; await im.decode();
      return { w: im.naturalWidth, h: im.naturalHeight };
    })()`)) as { w: number; h: number };
    // a schermo intero l'area interna è l'immagine intera (i fotogrammi salvati sono 2560 × 1440)
    const vs = layoutFor({ x: 0, y: 0, w: crop.w, h: crop.h }).vs;
    const r = { x: vs.x + VS_OPP_NAME.x * vs.w, y: vs.y + VS_OPP_NAME.y * vs.h, w: VS_OPP_NAME.w * vs.w, h: VS_OPP_NAME.h * vs.h };
    const bytes = (await win.webContents.executeJavaScript(`(async () => {
      const im = new Image(); im.src = ${JSON.stringify(pathToFileURL(file).href)}; await im.decode();
      const r = ${JSON.stringify(r)}, k = ${VS_NAME_SCALE}, shear = ${VS_NAME_SHEAR};
      const c = document.createElement("canvas"); c.width = Math.round(r.w * k); c.height = Math.round(r.h * k);
      const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
      g.setTransform(1, 0, shear, 1, -shear * c.height / 2, 0);
      g.drawImage(im, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    })()`)) as number[];
    const text = await readNameText(path.join(os.tmpdir(), "originsmeta-ocr-check"), new Uint8Array(bytes));
    console.log(`${path.basename(path.dirname(file))}/${path.basename(file)}\t${JSON.stringify(text)}\t${text !== null && isBotName(text) ? "BOT" : "-"}`);
  }
  app.exit(0);
});
