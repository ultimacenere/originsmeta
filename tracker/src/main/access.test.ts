/**
 * Test di "Solo con l'account" (0.4.0, 12/10/2026; access.ts, ora della verifica in account.ts, `verifyToken` di
 * sync.ts): `npm test` nella cartella tracker/. Rete finta, cifratura finta, orologio scritto nel test.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ACCESS, checkDue, decideAccess, verifyOutcome } from "./access";
import { Account, type Cipher } from "./account";
import { verifyToken, type FetchLike } from "./sync";

const TOKEN = `omt_${"cd".repeat(32)}`;
const T0 = Date.parse("2026-10-12T10:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString();
const DAY = 24 * 3_600_000;
const base = { linked: true, unreadable: false, notice: null, verifiedAt: iso(T0), now: T0 } as const;

const cipher: Cipher = {
  available: () => true,
  encrypt: (text) => Buffer.from(text, "utf8").reverse(),
  decrypt: (data) => Buffer.from(data).reverse().toString("utf8"),
};
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "om-access-"));

describe("decideAccess: senza un collegamento verificato l'app non parte", () => {
  test("mai collegata, scollegata dal sito, collegamento illeggibile: bloccata, ognuna col suo motivo", () => {
    assert.deepEqual(decideAccess({ ...base, linked: false, verifiedAt: null }), { open: false, reason: "never" });
    assert.deepEqual(decideAccess({ ...base, linked: false, verifiedAt: null, notice: "unlinked" }), { open: false, reason: "unlinked" });
    assert.deepEqual(decideAccess({ ...base, linked: false, verifiedAt: null, unreadable: true }), { open: false, reason: "relink" });
    assert.deepEqual(decideAccess({ ...base, linked: false, verifiedAt: null, notice: "relink" }), { open: false, reason: "relink" });
  });

  test("collegata e verificata adesso: sbloccata fino a 7 giorni dopo la verifica", () => {
    assert.deepEqual(decideAccess(base), { open: true, verifiedAt: iso(T0), graceUntil: iso(T0 + 7 * DAY) });
    assert.equal(ACCESS.graceMs, 7 * DAY);
  });

  test("sito irraggiungibile: continua per 7 giorni dall'ultima verifica riuscita, poi si blocca", () => {
    assert.equal(decideAccess({ ...base, now: T0 + 6 * DAY }).open, true);
    assert.equal(decideAccess({ ...base, now: T0 + 7 * DAY }).open, true, "il settimo giorno vale ancora");
    assert.deepEqual(decideAccess({ ...base, now: T0 + 7 * DAY + 1 }), { open: false, reason: "expired" });
    assert.deepEqual(decideAccess({ ...base, now: T0 + 30 * DAY }), { open: false, reason: "expired" });
  });

  test("collegamento della 0.3.x senza verifica, ora illeggibile o nel futuro (orologio, file ritoccato): da verificare", () => {
    assert.deepEqual(decideAccess({ ...base, verifiedAt: null }), { open: false, reason: "verify" });
    assert.deepEqual(decideAccess({ ...base, verifiedAt: "ieri" }), { open: false, reason: "verify" });
    assert.deepEqual(decideAccess({ ...base, verifiedAt: iso(T0 + 365 * DAY) }), { open: false, reason: "verify" });
    // un orologio di pochi minuti avanti sul PC non blocca
    assert.equal(decideAccess({ ...base, verifiedAt: iso(T0 + 5 * 60_000) }).open, true);
  });
});

describe("verifyOutcome: risposte del sito", () => {
  test("200 e 429 = token valido; 401 = rifiutato; tutto il resto = tolleranza", () => {
    assert.equal(verifyOutcome(true, 200), "ok");
    assert.equal(verifyOutcome(true, 429), "ok", "il tetto delle partite si controlla dopo il token");
    assert.equal(verifyOutcome(true, 401), "revoked");
    for (const status of [400, 403, 404, 500, 502, 503, 504]) assert.equal(verifyOutcome(true, status), "unreachable", String(status));
    assert.equal(verifyOutcome(false, 0), "unreachable");
  });
});

describe("checkDue: quando verificare", () => {
  const due = (o: Partial<Parameters<typeof checkDue>[0]>) => checkDue({ linked: true, open: true, lastAttemptAt: T0, lastFailed: false, now: T0, ...o });
  test("subito all'avvio, poi ogni 4 ore da sbloccata e ogni 5 minuti da bloccata o dopo un tentativo fallito", () => {
    assert.equal(due({ lastAttemptAt: null }), true);
    assert.equal(due({ linked: false, lastAttemptAt: null }), false, "senza collegamento non c'è niente da verificare");
    assert.equal(due({ now: T0 + ACCESS.checkEveryMs - 1 }), false);
    assert.equal(due({ now: T0 + ACCESS.checkEveryMs }), true);
    assert.equal(due({ open: false, now: T0 + ACCESS.retryLockedMs - 1 }), false);
    assert.equal(due({ open: false, now: T0 + ACCESS.retryLockedMs }), true);
    assert.equal(due({ lastFailed: true, now: T0 + ACCESS.retryLockedMs }), true);
    assert.equal(due({ now: T0 - 60_000 }), true, "orologio tornato indietro: si verifica");
  });
});

describe("verifyToken", () => {
  test("zero partite a /api/tracker/sync con il token; esiti dalle risposte", async () => {
    const calls: { url: string; method: string; headers: Record<string, string>; body?: string }[] = [];
    const replies = [200, 401, 503, 0, 429];
    const fetch: FetchLike = async (url, init) => {
      calls.push({ url, ...init });
      const status = replies.shift()!;
      if (status === 0) throw new Error("offline");
      return { status, json: async () => ({}) };
    };
    const deps = { site: "https://originsmeta.com", fetch };
    assert.equal(await verifyToken(deps, TOKEN), "ok");
    assert.equal(calls[0].url, "https://originsmeta.com/api/tracker/sync");
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].headers.authorization, `Bearer ${TOKEN}`);
    assert.deepEqual(JSON.parse(calls[0].body!), { matches: [] });
    assert.equal(await verifyToken(deps, TOKEN), "revoked");
    assert.equal(await verifyToken(deps, TOKEN), "unreachable");
    assert.equal(await verifyToken(deps, TOKEN), "unreachable");
    assert.equal(await verifyToken(deps, TOKEN), "ok");
  });
});

describe("Account: ora dell'ultima verifica", () => {
  test("il collegamento vale come verifica; markVerified la sposta; salvata cifrata e riletta", () => {
    const dir = tmp();
    try {
      const a = new Account(dir, cipher);
      a.set(TOKEN, "aldrymus", "https://originsmeta.com", new Date(T0));
      assert.equal(a.verifiedAt, iso(T0));
      a.markVerified(new Date(T0 + DAY));
      const onDisk = fs.readFileSync(path.join(dir, "account.json"), "utf8");
      assert.ok(!onDisk.includes(iso(T0 + DAY)), "l'ora non è in chiaro: ritoccarla a mano non basta");
      const b = new Account(dir, cipher);
      b.load();
      assert.equal(b.verifiedAt, iso(T0 + DAY));
      assert.equal(decideAccess({ linked: b.linked, unreadable: b.unreadable, notice: null, verifiedAt: b.verifiedAt, now: T0 + 3 * DAY }).open, true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("file della 0.3.x (senza ora) o con l'ora illeggibile: collegata ma da verificare; il token resta", () => {
    const dir = tmp();
    try {
      const file = path.join(dir, "account.json");
      const old = { v: 1, token: cipher.encrypt(TOKEN).toString("base64"), username: "aldrymus", linkedAt: iso(T0), site: "https://originsmeta.com" };
      fs.writeFileSync(file, JSON.stringify(old));
      const a = new Account(dir, cipher);
      a.load();
      assert.deepEqual([a.linked, a.token, a.verifiedAt], [true, TOKEN, null]);
      assert.deepEqual(decideAccess({ linked: a.linked, unreadable: a.unreadable, notice: null, verifiedAt: a.verifiedAt, now: T0 }), { open: false, reason: "verify" });
      fs.writeFileSync(file, JSON.stringify({ ...old, verified: Buffer.from(iso(T0)).toString("base64") }));
      a.load();
      assert.deepEqual([a.linked, a.verifiedAt], [true, null], "un'ora scritta in chiaro non vale");
      // la prima verifica riuscita la salva
      a.markVerified(new Date(T0));
      const b = new Account(dir, cipher);
      b.load();
      assert.equal(b.verifiedAt, iso(T0));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test("dimenticare il collegamento non tocca lo storico delle partite", () => {
    const dir = tmp();
    try {
      fs.writeFileSync(path.join(dir, "matches.jsonl"), '{"v":2,"id":"x"}\n');
      const a = new Account(dir, cipher);
      a.set(TOKEN, null, "https://originsmeta.com", new Date(T0));
      a.clear();
      assert.equal(a.verifiedAt, null);
      assert.equal(fs.readFileSync(path.join(dir, "matches.jsonl"), "utf8"), '{"v":2,"id":"x"}\n');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
