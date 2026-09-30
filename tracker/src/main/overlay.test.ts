/**
 * Test dell'overlay (overlay.ts): i dati mostrati e il server locale della sorgente per OBS. `npm test` nella cartella
 * tracker/. Il server si prova davvero su una porta di 127.0.0.1 presa per il test.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { hostAllowed, overlayView, startOverlayServer, type CardLookup } from "./overlay";
import type { TrackedMatch } from "../../../src/lib/tracker/match";

const T0 = Date.parse("2026-09-30T20:00:00Z");
const DECK = ["C00176_MC", "C00002_MB", "C00029_MB"];
const card: CardLookup = (k) => ({ C00176_MC: { name: "Mulan", legendary: true, slug: "mulan" }, C00012_MC: { name: "Robin Hood", legendary: true, slug: "robin-hood" } })[k];

const match = (min: number, result: "W" | "L", cards = DECK, opp = "C00012_MC"): TrackedMatch => ({
  v: 2,
  id: `${min}`.padStart(32, "0"),
  endedAt: new Date(T0 + min * 60_000).toISOString(),
  result,
  queue: "normal",
  deck: { name: "On Death", legendary: cards[0], cards, code: null },
  rank: "Bronze III",
  opponent: { legendary: opp, cards: [opp, "C00031_MB"] },
  arena: null,
  locationPool: null,
  turns: 8,
  plays: [],
  missed: "",
});

describe("overlayView", () => {
  const matches = [match(-120, "W"), match(-60, "L", ["C00012_MC", "C00031_MB"]), match(10, "W"), match(20, "L"), match(30, "W", DECK, "C00084_MC")];

  test("mazzo scelto, sessione, record del mazzo, ultima partita", () => {
    const v = overlayView({ matches, activeDeck: { name: "On Death", legendary: "C00176_MC", cards: [...DECK].reverse() }, sessionStart: T0, card, now: T0 });
    assert.deepEqual(v.deck, { name: "On Death", legendary: "C00176_MC", legendaryName: "Mulan", legendarySlug: "mulan" });
    assert.deepEqual(v.session, { wins: 2, losses: 1 });
    assert.deepEqual(v.deckRecord, { wins: 3, losses: 1, games: 4 });
    assert.deepEqual(v.last, { result: "W", opponentLegendary: "C00084_MC", opponentName: null, opponentSlug: null });
  });

  test("ultima partita contro una Leggendaria che la tabella conosce: nome e immagine", () => {
    const v = overlayView({ matches: [match(5, "L")], activeDeck: null, sessionStart: T0, card, now: T0 });
    assert.deepEqual(v.last, { result: "L", opponentLegendary: "C00012_MC", opponentName: "Robin Hood", opponentSlug: "robin-hood" });
  });

  test("nessun mazzo scelto e nessuna partita", () => {
    const v = overlayView({ matches: [], activeDeck: null, sessionStart: T0, card, now: T0 });
    assert.deepEqual([v.deck, v.session, v.deckRecord, v.last], [null, { wins: 0, losses: 0 }, null, null]);
  });

  test("mai nomi, id, rank, carte dell'avversario oltre la Leggendaria, bot", () => {
    const json = JSON.stringify(overlayView({ matches, activeDeck: null, sessionStart: 0, card, now: T0 }));
    for (const tell of ["C00031_MB", "Bronze", "Master", "bot", "queue", "rank"]) assert.ok(!json.includes(tell), tell);
  });
});

describe("server della sorgente per OBS", () => {
  test("Host controllato", () => {
    assert.equal(hostAllowed("127.0.0.1:47015", 47015), true);
    assert.equal(hostAllowed("localhost:47015", 47015), true);
    assert.equal(hostAllowed("evil.example.com:47015", 47015), false);
    assert.equal(hostAllowed("127.0.0.1:80", 47015), false);
    assert.equal(hostAllowed(undefined, 47015), false);
  });

  test("pagina, file e stato su 127.0.0.1; 403 con un Host estraneo o un metodo diverso; 404 per il resto", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "om-overlay-"));
    fs.writeFileSync(path.join(dir, "overlay.html"), "<p>overlay</p>");
    fs.writeFileSync(path.join(dir, "overlay.js"), "void 0;");
    fs.writeFileSync(path.join(dir, "overlay.css"), "p{}");
    fs.mkdirSync(path.join(dir, "fonts"));
    fs.writeFileSync(path.join(dir, "fonts", "manrope-latin.woff2"), Buffer.from([0x77, 0x4f, 0x46, 0x32, 0x00, 0xff]));
    fs.writeFileSync(path.join(dir, "logo-originsmeta-sm.webp"), Buffer.from("RIFF"));
    const port = 47_000 + Math.floor(Math.random() * 900);
    const server = await startOverlayServer({ dir, ports: [port], view: () => overlayView({ matches: [match(1, "W")], activeDeck: null, sessionStart: 0, card, now: T0 }) });
    assert.ok(server, "server partito");
    const get = (p: string, opts: { host?: string; method?: string } = {}) =>
      new Promise<{ status: number; type: string; body: string }>((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port, path: p, method: opts.method ?? "GET", headers: opts.host ? { host: opts.host } : undefined }, (res) => {
          let body = "";
          res.on("data", (c) => (body += c));
          res.on("end", () => resolve({ status: res.statusCode ?? 0, type: String(res.headers["content-type"] ?? ""), body }));
        });
        req.on("error", reject);
        req.end();
      });
    try {
      assert.equal(server!.url, `http://127.0.0.1:${port}/overlay/`);
      const page = await get("/overlay/?lang=it");
      assert.deepEqual([page.status, page.type.startsWith("text/html"), page.body], [200, true, "<p>overlay</p>"]);
      assert.equal((await get("/overlay/overlay.js")).status, 200);
      const st = await get("/overlay/state.json");
      assert.equal(st.status, 200);
      assert.deepEqual(JSON.parse(st.body).session, { wins: 1, losses: 0 });
      assert.equal((await get("/overlay/state.json", { host: "evil.example.com" })).status, 403);
      assert.equal((await get("/overlay/state.json", { method: "POST" })).status, 403);
      assert.equal((await get("/overlay/../account.json")).status, 404);
      assert.equal((await get("/altro")).status, 404);
      // logo e font del sito (01/10/2026), anche binari; nient'altro della cartella
      const font = await get("/overlay/fonts/manrope-latin.woff2");
      assert.deepEqual([font.status, font.type], [200, "font/woff2"]);
      assert.equal((await get("/overlay/logo-originsmeta-sm.webp")).type, "image/webp");
      for (const p of ["/overlay/fonts/../overlay.html", "/overlay/fonts/Manrope.WOFF2", "/overlay/fonts/x.woff2.map", "/overlay/overlay.html", "/overlay/logo.webp"]) assert.equal((await get(p)).status, 404, p);
      // la stessa porta occupata: null, non un errore
      assert.equal(await startOverlayServer({ dir, ports: [port], view: () => overlayView({ matches: [], activeDeck: null, sessionStart: 0, card }) }), null);
    } finally {
      server?.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
