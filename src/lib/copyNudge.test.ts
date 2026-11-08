/**
 * Invito dopo la copia del codice del gioco (09/11/2026): `node --test src/lib/copyNudge.test.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const mod: typeof import("./copyNudge") = await import("./copyNudge.ts");
const { COPY_NUDGE_CLOSED_MS, COPY_NUDGE_GAP_MS, copyNudgeDue, copyNudgeLabels, parseCopyNudgeMemory } = mod;

const locales = ["en", "it", "es", "fr", "pt", "de", "ru", "zh-cn"] as const;
const NOW = Date.parse("2026-11-09T12:00:00Z");

describe("invito dopo la copia del codice", () => {
  test("testi in otto lingue, senza email né marketplace", () => {
    assert.deepEqual(Object.keys(copyNudgeLabels).sort(), [...locales].sort());
    for (const l of locales) {
      for (const [k, v] of Object.entries(copyNudgeLabels[l])) assert.ok(v.trim().length > 0, `${l}.${k}`);
      assert.match(copyNudgeLabels[l].discord, /Discord/, l);
      assert.doesNotMatch(Object.values(copyNudgeLabels[l]).join(" "), /e-?mail|newsletter|shop|marketplace|negozio/i, l);
    }
  });

  test("al massimo una volta al giorno, una settimana dopo la ×, mai dopo il Discord", () => {
    assert.equal(copyNudgeDue({}, NOW), true);
    assert.equal(copyNudgeDue({ shown: NOW - COPY_NUDGE_GAP_MS + 1 }, NOW), false);
    assert.equal(copyNudgeDue({ shown: NOW - COPY_NUDGE_GAP_MS }, NOW), true);
    assert.equal(copyNudgeDue({ closed: NOW - COPY_NUDGE_CLOSED_MS + 1 }, NOW), false);
    assert.equal(copyNudgeDue({ closed: NOW - COPY_NUDGE_CLOSED_MS }, NOW), true);
    assert.equal(copyNudgeDue({ joined: true }, NOW + 365 * COPY_NUDGE_GAP_MS), false);
  });

  test("la memoria del browser rotta vale niente", () => {
    assert.deepEqual(parseCopyNudgeMemory(null), {});
    assert.deepEqual(parseCopyNudgeMemory("{"), {});
    assert.deepEqual(parseCopyNudgeMemory("[1]"), { shown: undefined, closed: undefined, joined: undefined });
    assert.deepEqual(parseCopyNudgeMemory(JSON.stringify({ shown: 5, closed: "x", joined: "yes" })), { shown: 5, closed: undefined, joined: undefined });
    assert.deepEqual(parseCopyNudgeMemory(JSON.stringify({ joined: true })), { shown: undefined, closed: undefined, joined: true });
  });
});
