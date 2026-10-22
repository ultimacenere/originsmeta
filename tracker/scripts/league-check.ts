/**
 * Prova del riconoscimento della classificata (22/10/2026) sui fotogrammi salvati con `npm run frames`: per ogni
 * schermata VS ritaglia la zona sopra il mio ritratto come la finestra nascosta dello scanner (frames/frames.ts:
 * `VS_MY_LEAGUE`, alta `LEAGUE_TEXT_H` pixel, nera su bianco con `inkOnWhite`), la legge con l'OCR di Windows
 * (main/ocr.ts) e stampa il testo letto e se c'è una lega (`isLeagueText`). Resta sul PC.
 * Uso (dalla cartella tracker/, con i fotogrammi della schermata VS):
 *   npx esbuild scripts/league-check.ts --bundle --platform=node --format=cjs --external:electron --outfile=out/leaguecheck/main.js
 *   echo {"main":"main.js"} > out/leaguecheck/package.json
 *   node_modules/electron/dist/electron.exe out/leaguecheck <file.jpg> [<file.jpg> ...]
 * Prova del 22/10/2026 su 16 schermate VS del 10–12/10: lega letta nelle 11 classificate del playtest, in nessuna delle
 * 5 altre (demo 0.7 prima della classificata, Battaglia Boss, allenamento contro Big Bob).
 */
import { app, BrowserWindow } from "electron";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isLeagueText } from "../../src/lib/tracker/queue";
import { readNameText } from "../src/main/ocr";
import { inkOnWhite, LEAGUE_TEXT_H, VS_MY_LEAGUE, layoutFor } from "../src/shared/recognize";

const files = process.argv.slice(2).filter((a) => /\.jpe?g$/i.test(a));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { webSecurity: false } });
  await win.loadURL("data:text/html,<html></html>");
  for (const file of files) {
    const size = (await win.webContents.executeJavaScript(`(async () => {
      const im = new Image(); im.src = ${JSON.stringify(pathToFileURL(file).href)}; await im.decode();
      return { w: im.naturalWidth, h: im.naturalHeight };
    })()`)) as { w: number; h: number };
    // a schermo intero l'area interna è l'immagine intera (i fotogrammi salvati sono 2560 × 1440)
    const vs = layoutFor({ x: 0, y: 0, w: size.w, h: size.h }).vs;
    const r = { x: vs.x + VS_MY_LEAGUE.x * vs.w, y: vs.y + VS_MY_LEAGUE.y * vs.h, w: VS_MY_LEAGUE.w * vs.w, h: VS_MY_LEAGUE.h * vs.h };
    const h = LEAGUE_TEXT_H;
    const w = Math.round((r.w * h) / r.h);
    // i pixel del ritaglio ridotto come nella finestra nascosta, poi nero su bianco con la stessa funzione dell'app
    const raw = (await win.webContents.executeJavaScript(`(async () => {
      const im = new Image(); im.src = ${JSON.stringify(pathToFileURL(file).href)}; await im.decode();
      const r = ${JSON.stringify(r)};
      const c = document.createElement("canvas"); c.width = ${w}; c.height = ${h};
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(im, r.x, r.y, r.w, r.h, 0, 0, c.width, c.height);
      return Array.from(g.getImageData(0, 0, c.width, c.height).data);
    })()`)) as number[];
    const px = new Uint8ClampedArray(raw);
    inkOnWhite(px);
    const bytes = (await win.webContents.executeJavaScript(`(async () => {
      const c = document.createElement("canvas"); c.width = ${w}; c.height = ${h};
      const g = c.getContext("2d");
      g.putImageData(new ImageData(new Uint8ClampedArray(${JSON.stringify(Array.from(px))}), ${w}, ${h}), 0, 0);
      const blob = await new Promise((res) => c.toBlob(res, "image/png"));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    })()`)) as number[];
    const text = await readNameText(path.join(os.tmpdir(), "originsmeta-ocr-check"), new Uint8Array(bytes));
    console.log(`${path.basename(path.dirname(file))}/${path.basename(file)}\t${JSON.stringify(text)}\t${isLeagueText(text) ? "CLASSIFICATA" : "-"}`);
  }
  app.exit(0);
});
