// Prove locali dell'estensione Broadcasting OM (fuori dallo zip), senza pacchetti: serve la cartella twitch-broadcast/
// e inoltra al sito in sviluppo (`next dev` su http://localhost:3000, con BROADCAST_LIVE_DEV=1) tutto il resto: le
// richieste che l'estensione fa a originsmeta.com (/api/, /cards/) e la pagina dell'overlay di OBS usata come "video",
// con le sue risorse di Next. Il ricaricamento a caldo di Next (un WebSocket) non passa: errori innocui in console.
//   node twitch-broadcast/dev/serve.mjs     → http://localhost:8081/dev/mock.html?language=it
// Ascolta solo su 127.0.0.1. Un altro indirizzo del sito: --site http://localhost:3010 (o SITE=…).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = normalize(join(here, ".."));
const port = Number(process.env.PORT || 8081);
const siteArg = process.argv.indexOf("--site");
const site = process.env.SITE || (siteArg > 0 ? process.argv[siteArg + 1] : "") || "http://localhost:3000";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".md": "text/plain; charset=utf-8"
};

async function proxy(req, res, url) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = Object.fromEntries(Object.entries(req.headers).filter(([k]) => !["host", "connection", "origin", "referer"].includes(k)));
  const r = await fetch(site + url.pathname + url.search, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined, redirect: "manual" });
  const out = {};
  r.headers.forEach((v, k) => {
    if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) out[k] = v;
  });
  res.writeHead(r.status, out);
  res.end(Buffer.from(await r.arrayBuffer()));
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    // la pagina di prova chiede dove sta il sito: l'overlay di OBS (il "video") lo carica direttamente da lì, perché
    // in sviluppo Next aspetta il suo WebSocket, che qui non passa
    if (url.pathname === "/dev/site.json") return void res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify({ site }));
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) return void res.writeHead(403).end("Forbidden");
    const info = await stat(file).catch(() => null);
    // un file del pacchetto o delle prove si serve da qui, tutto il resto lo risponde il sito
    if (!info || !info.isFile()) return await proxy(req, res, url);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(await readFile(file));
  } catch (e) {
    res.writeHead(502).end(String(e && e.message));
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`twitch-broadcast su http://localhost:${port}/  (prova: /dev/mock.html?language=it, /dev/mock-config.html?language=it) — sito: ${site}`);
});
