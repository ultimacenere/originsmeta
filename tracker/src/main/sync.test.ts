/**
 * Test del collegamento e dell'invio delle partite (sync.ts) e del token cifrato (account.ts): `npm test` nella cartella
 * tracker/. La rete è finta (risposte scritte nel test) e la cifratura pure: niente Electron, niente sito vero.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { RETRY, SyncQueue, claimCode, siteBase, unlinkRemote, type FetchLike } from "./sync";
import { Account, type Cipher } from "./account";
import type { TrackedMatch } from "../../../src/lib/tracker/match";
import { isUpload } from "../../../src/lib/tracker/upload";

const TOKEN = `omt_${"ab".repeat(32)}`;
const T0 = Date.parse("2026-09-30T10:00:00Z");

const match = (n: number): TrackedMatch => ({
  v: 2,
  id: n.toString(16).padStart(32, "0"),
  endedAt: new Date(T0 - n * 60_000).toISOString(),
  result: n % 2 ? "W" : "L",
  queue: "normal",
  deck: { name: "On Death", legendary: "C00176_MC", cards: ["C00176_MC", "C00002_MB"], code: null },
  rank: "Bronze III",
  opponent: { legendary: "C00012_MC", cards: ["C00012_MC", "C00031_MB", "C00040_MB"] },
  arena: "03_Arena",
  locationPool: "Pool_0001",
  turns: 7,
  plays: [
    { turn: 1, me: true, card: "C00002_MB", lane: 0 },
    { turn: 2, me: false, card: "C00012_MC", lane: 1 },
  ],
  missed: "",
});

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
/** Rete finta: registra le richieste e risponde con le risposte in coda (status 0 = rete assente). */
function fakeNet(replies: { status: number; body?: unknown }[]) {
  const calls: Call[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : undefined });
    const r = replies.shift() ?? { status: 200, body: { added: 0 } };
    if (r.status === 0) throw new Error("offline");
    return { status: r.status, json: async () => r.body ?? {} };
  };
  return { calls, fetch };
}

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "om-sync-"));

describe("siteBase", () => {
  test("originsmeta.com, oppure https o localhost per le prove; tutto il resto torna a originsmeta.com", () => {
    assert.equal(siteBase(undefined), "https://originsmeta.com");
    assert.equal(siteBase("https://anteprima.vercel.app/qualcosa"), "https://anteprima.vercel.app");
    assert.equal(siteBase("http://localhost:3000"), "http://localhost:3000");
    assert.equal(siteBase("http://evil.example.com"), "https://originsmeta.com");
    assert.equal(siteBase("file:///C:/x"), "https://originsmeta.com");
    assert.equal(siteBase("non un indirizzo"), "https://originsmeta.com");
  });
});

describe("claimCode e unlinkRemote", () => {
  test("codice valido: token e nome utente; il codice parte normalizzato con il nome del PC", async () => {
    const net = fakeNet([{ status: 200, body: { token: TOKEN, username: "aldrymus" } }]);
    const r = await claimCode({ site: "https://originsmeta.com", fetch: net.fetch }, "abcd efgh", "PC-DI-PROVA");
    assert.deepEqual(r, { ok: true, token: TOKEN, username: "aldrymus" });
    assert.equal(net.calls[0].url, "https://originsmeta.com/api/tracker/link");
    assert.deepEqual(net.calls[0].body, { code: "ABCD-EFGH", name: "PC-DI-PROVA" });
    assert.equal(net.calls[0].headers.authorization, undefined);
  });

  test("errori: codice scritto male (senza chiamare il sito), sbagliato, troppi PC, sito non pronto, rete assente", async () => {
    const site = "https://originsmeta.com";
    const none = fakeNet([]);
    assert.deepEqual(await claimCode({ site, fetch: none.fetch }, "abc", "PC"), { ok: false, problem: "invalid_code" });
    assert.equal(none.calls.length, 0);
    for (const [reply, problem] of [
      [{ status: 400, body: { error: "invalid_code" } }, "invalid_code"],
      [{ status: 409, body: { error: "too_many_devices" } }, "too_many_devices"],
      [{ status: 503, body: { error: "unavailable" } }, "unavailable"],
      [{ status: 0 }, "offline"],
      [{ status: 500, body: { error: "error" } }, "error"],
      [{ status: 200, body: { token: "non-un-token" } }, "error"],
    ] as const) {
      assert.deepEqual(await claimCode({ site, fetch: fakeNet([reply]).fetch }, "ABCD-EFGH", "PC"), { ok: false, problem }, JSON.stringify(reply));
    }
  });

  test("scollegamento dal sito con il token", async () => {
    const net = fakeNet([{ status: 200, body: { ok: true } }]);
    assert.equal(await unlinkRemote({ site: "https://originsmeta.com", fetch: net.fetch }, TOKEN), true);
    assert.equal(net.calls[0].method, "DELETE");
    assert.equal(net.calls[0].headers.authorization, `Bearer ${TOKEN}`);
    assert.equal(await unlinkRemote({ site: "https://originsmeta.com", fetch: fakeNet([{ status: 0 }]).fetch }, TOKEN), false);
  });
});

describe("SyncQueue", () => {
  test("manda tutto a gruppi di 50, dalla più vecchia, con la forma che il sito accetta; poi niente da mandare", async () => {
    const dir = tmp();
    try {
      const matches = Array.from({ length: 120 }, (_, i) => match(120 - i));
      const net = fakeNet([]);
      const q = new SyncQueue(dir, { site: "https://originsmeta.com", fetch: net.fetch, now: () => T0 });
      q.load();
      assert.equal(q.status(matches).pending, 120);
      const r = await q.run(matches, TOKEN);
      assert.deepEqual(r, { sent: 120, unlinked: false });
      assert.deepEqual(
        net.calls.map((c) => (c.body as { matches: unknown[] }).matches.length),
        [50, 50, 20],
      );
      const first = (net.calls[0].body as { matches: { id: string }[] }).matches;
      assert.equal(first[0].id, matches[0].id);
      assert.ok(first.every((m) => isUpload(m, T0)));
      assert.equal(net.calls[0].headers.authorization, `Bearer ${TOKEN}`);
      assert.equal(net.calls[0].url, "https://originsmeta.com/api/tracker/sync");
      // dell'avversario solo la Leggendaria e le carte giocate
      assert.ok(!JSON.stringify(net.calls[0].body).includes("C00031_MB"));
      const s = q.status(matches);
      assert.deepEqual([s.pending, s.problem, s.lastSyncAt], [0, null, new Date(T0).toISOString()]);
      // un'altra copia dell'app legge quello che è già stato mandato
      const again = new SyncQueue(dir, { site: "https://originsmeta.com", fetch: net.fetch, now: () => T0 });
      again.load();
      assert.equal(again.status(matches).pending, 0);
      assert.deepEqual(await again.run(matches, TOKEN), { sent: 0, unlinked: false });
      assert.equal(net.calls.length, 3);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("rete assente: si ferma, riprova dopo un minuto e poi con attese crescenti; \"Invia ora\" non aspetta", async () => {
    const dir = tmp();
    try {
      let now = T0;
      const net = fakeNet([{ status: 0 }, { status: 0 }, { status: 200, body: { added: 3 } }]);
      const q = new SyncQueue(dir, { site: "https://originsmeta.com", fetch: net.fetch, now: () => now });
      const matches = [match(1), match(2), match(3)];
      await q.run(matches, TOKEN);
      const s = q.status(matches);
      assert.deepEqual([s.problem, s.pending, s.retryAt], ["offline", 3, new Date(T0 + RETRY.offline[0]).toISOString()]);
      now += 30_000;
      await q.run(matches, TOKEN);
      assert.equal(net.calls.length, 1, "prima dell'ora del tentativo non riparte");
      now += 30_000;
      await q.run(matches, TOKEN);
      assert.equal(net.calls.length, 2);
      assert.equal(q.status(matches).retryAt, new Date(now + RETRY.offline[1]).toISOString());
      await q.run(matches, TOKEN, { force: true });
      assert.deepEqual([q.status(matches).problem, q.status(matches).pending], [null, 0]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("tetto giornaliero (429): un'ora; sito non pronto (503): 15 minuti; errore nostro (400): quelle partite non si riprovano", async () => {
    const dir = tmp();
    try {
      const matches = [match(1), match(2)];
      const q429 = new SyncQueue(dir, { site: "https://originsmeta.com", fetch: fakeNet([{ status: 429, body: { error: "too_many_matches" } }]).fetch, now: () => T0 });
      await q429.run(matches, TOKEN);
      assert.deepEqual([q429.status(matches).problem, q429.status(matches).retryAt], ["rate_limited", new Date(T0 + RETRY.rateLimited).toISOString()]);
      const q503 = new SyncQueue(dir, { site: "https://originsmeta.com", fetch: fakeNet([{ status: 503, body: { error: "unavailable" } }]).fetch, now: () => T0 });
      await q503.run(matches, TOKEN);
      assert.deepEqual([q503.status(matches).problem, q503.status(matches).retryAt], ["unavailable", new Date(T0 + RETRY.unavailable).toISOString()]);
      const q400 = new SyncQueue(dir, { site: "https://originsmeta.com", fetch: fakeNet([{ status: 400, body: { error: "bad_request" } }]).fetch, now: () => T0 });
      assert.deepEqual(await q400.run(matches, TOKEN), { sent: 0, unlinked: false });
      assert.equal(q400.status(matches).pending, 0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("token non più valido (401): il chiamante scollega; reset: si manda tutto da capo", async () => {
    const dir = tmp();
    try {
      const matches = [match(1), match(2)];
      const q = new SyncQueue(dir, { site: "https://originsmeta.com", fetch: fakeNet([{ status: 200 }, { status: 401, body: { error: "invalid_token" } }]).fetch, now: () => T0 });
      await q.run([matches[0]], TOKEN);
      assert.equal(q.status(matches).pending, 1);
      assert.deepEqual(await q.run(matches, TOKEN), { sent: 0, unlinked: true });
      assert.equal(q.status(matches).problem, "unlinked");
      q.reset();
      assert.deepEqual([q.status(matches).pending, q.status(matches).problem, q.status(matches).lastSyncAt], [2, null, null]);
      assert.equal(fs.existsSync(path.join(dir, "sync.json")), false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("Account (token cifrato)", () => {
  // cifratura finta: inverte i byte (basta a controllare che su disco non ci sia il token in chiaro)
  const cipher = (available = true): Cipher => ({
    available: () => available,
    encrypt: (text) => Buffer.from(text, "utf8").reverse(),
    decrypt: (data) => Buffer.from(data).reverse().toString("utf8"),
  });

  test("salvato cifrato, riletto, dimenticato", () => {
    const dir = tmp();
    try {
      const a = new Account(dir, cipher());
      a.load();
      assert.equal(a.linked, false);
      assert.equal(a.set(TOKEN, "aldrymus", "https://originsmeta.com", new Date(T0)), true);
      const onDisk = fs.readFileSync(path.join(dir, "account.json"), "utf8");
      assert.ok(!onDisk.includes(TOKEN), "mai il token in chiaro");
      const b = new Account(dir, cipher());
      b.load();
      assert.deepEqual([b.linked, b.token, b.username, b.linkedAt, b.site, b.persisted], [true, TOKEN, "aldrymus", new Date(T0).toISOString(), "https://originsmeta.com", true]);
      b.clear();
      assert.equal(fs.existsSync(path.join(dir, "account.json")), false);
      const c = new Account(dir, cipher());
      c.load();
      assert.equal(c.linked, false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("senza cifratura: solo in memoria, mai su disco; file illeggibile = non collegato", () => {
    const dir = tmp();
    try {
      const a = new Account(dir, cipher(false));
      assert.equal(a.set(TOKEN, null, "https://originsmeta.com"), false);
      assert.deepEqual([a.linked, a.persisted], [true, false]);
      assert.equal(fs.existsSync(path.join(dir, "account.json")), false);
      fs.writeFileSync(path.join(dir, "account.json"), JSON.stringify({ v: 1, token: Buffer.from("rotto").toString("base64") }));
      const b = new Account(dir, cipher());
      b.load();
      assert.equal(b.linked, false);
      assert.throws(() => b.set("omt_corto", null, "x"));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("collegamento salvato che non si decifra più (chiave cambiata, 01/10/2026): non collegato e da rifare", () => {
    const dir = tmp();
    try {
      new Account(dir, cipher()).set(TOKEN, "aldrymus", "https://originsmeta.com");
      // un'altra chiave: il token si decifra in qualcosa che non è un token
      const other: Cipher = { available: () => true, encrypt: (t) => Buffer.from(t), decrypt: (d) => Buffer.from(d).toString("utf8") };
      const a = new Account(dir, other);
      a.load();
      assert.deepEqual([a.linked, a.unreadable], [false, true]);
      // una chiave che lancia, come safeStorage con un file d'altri
      const throwing: Cipher = { available: () => true, encrypt: (t) => Buffer.from(t), decrypt: () => { throw new Error("Error while decrypting the ciphertext provided to safeStorage.decryptString."); } };
      const b = new Account(dir, throwing);
      b.load();
      assert.deepEqual([b.linked, b.unreadable], [false, true]);
      // ricollegando l'avviso sparisce
      b.set(TOKEN, "aldrymus", "https://originsmeta.com");
      assert.deepEqual([b.linked, b.unreadable], [true, false]);
      // nessun file: né collegato né da rifare
      const empty = new Account(tmp(), cipher());
      empty.load();
      assert.deepEqual([empty.linked, empty.unreadable], [false, false]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
