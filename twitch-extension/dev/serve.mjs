// Server statico per le prove locali (fuori dallo zip), senza pacchetti: serve la cartella twitch-extension/.
//   node twitch-extension/dev/serve.mjs            → http://localhost:8080
//   node twitch-extension/dev/serve.mjs --https    → https://localhost:8080 con dev/certs/localhost.pem e -key.pem
// (certificato self-signed da creare una volta, vedi README "Prova in locale"). Ascolta solo su 127.0.0.1.
import { createServer as createHttp } from "node:http";
import { createServer as createHttps } from "node:https";
import { readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = normalize(join(here, ".."));
const port = Number(process.env.PORT || 8080);
const https = process.argv.includes("--https");

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

async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch (e) {
    res.writeHead(500).end(String(e && e.message));
  }
}

const server = https
  ? createHttps({ cert: readFileSync(join(here, "certs", "localhost.pem")), key: readFileSync(join(here, "certs", "localhost-key.pem")) }, handler)
  : createHttp(handler);
server.listen(port, "127.0.0.1", () => {
  console.log(`twitch-extension su ${https ? "https" : "http"}://localhost:${port}/  (prova: /dev/mock.html, /dev/mock.html?language=it, /dev/mock-mobile.html, /dev/mock-config.html)`);
});
