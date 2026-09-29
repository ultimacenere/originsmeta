/** Test dello storico sul PC (store.ts): `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Store } from "./store";
import type { TrackedMatch } from "../../../src/lib/tracker/match";

const match = (id: string): TrackedMatch => ({
  v: 1,
  id,
  endedAt: "2026-09-29T00:51:19.000Z",
  result: "W",
  deck: { name: "On Death", legendary: "C00176_MC", cards: ["C00176_MC"], code: null },
  rank: "Bronze III",
  opponent: null,
  arena: null,
  locationPool: null,
  turns: null,
  plays: [],
  missed: "",
});

test("storico: aggiunte senza doppioni, stato salvato, righe rotte saltate", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "om-store-"));
  try {
    const a = new Store(dir);
    assert.equal(a.load(), false, "primo avvio");
    assert.equal(a.add(match("m1")), true);
    assert.equal(a.add(match("m1")), false);
    assert.equal(a.add(match("m2")), true);
    a.save({ lastFingerprint: "abc", results: "WL" });
    a.save({ missed: "L" });
    fs.appendFileSync(path.join(dir, "matches.jsonl"), '{"v":1,"id":"rotta"\n');

    const b = new Store(dir);
    assert.equal(b.load(), true);
    assert.deepEqual(
      b.matches.map((m) => m.id),
      ["m1", "m2"],
    );
    assert.deepEqual(b.saved, { v: 1, lastFingerprint: "abc", results: "WL", missed: "L" });
    assert.equal(fs.existsSync(path.join(dir, "state.json.tmp")), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
