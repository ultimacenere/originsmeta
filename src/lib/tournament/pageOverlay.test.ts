import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { overlayMatches, overlayPlayers } from "./pageOverlay.ts";

const p = (user_id: string, created_at: string, status = "registered") => ({ user_id, created_at, status });
const m = (id: string, round: number, position: number, status = "pending") => ({ id, round, position, status });

test("overlayPlayers: senza chi guarda o senza lettura resta la copia in cache", () => {
  const list = [p("a", "2026-11-13T21:00:01Z"), p("b", "2026-11-13T21:00:02Z")];
  assert.equal(overlayPlayers(list, null, p("a", "x")), list);
  assert.equal(overlayPlayers(list, "a", undefined), list);
});

test("overlayPlayers: la riga fresca prende il posto di quella in cache", () => {
  const list = [p("a", "2026-11-13T21:00:01Z", "waitlist"), p("b", "2026-11-13T21:00:02Z")];
  const out = overlayPlayers(list, "a", p("a", "2026-11-13T21:00:01Z", "registered"));
  assert.deepEqual(out.map((x) => [x.user_id, x.status]), [["a", "registered"], ["b", "registered"]]);
});

test("overlayPlayers: chi si è appena iscritto entra al suo posto in ordine di iscrizione", () => {
  const list = [p("a", "2026-11-13T21:00:01Z"), p("c", "2026-11-13T21:00:03Z")];
  const out = overlayPlayers(list, "b", p("b", "2026-11-13T21:00:02Z", "waitlist"));
  assert.deepEqual(out.map((x) => x.user_id), ["a", "b", "c"]);
  const last = overlayPlayers(list, "d", p("d", "2026-11-13T21:00:09Z"));
  assert.deepEqual(last.map((x) => x.user_id), ["a", "c", "d"]);
});

test("overlayPlayers: chi si è ritirato sparisce anche se la cache lo ha ancora", () => {
  const list = [p("a", "2026-11-13T21:00:01Z"), p("b", "2026-11-13T21:00:02Z")];
  assert.deepEqual(overlayPlayers(list, "a", null).map((x) => x.user_id), ["b"]);
});

test("overlayMatches: le partite di chi guarda sostituiscono le copie e quelle nuove si aggiungono in ordine", () => {
  const list = [m("1", 1, 0, "confirmed"), m("2", 1, 1, "pending"), m("3", 2, 0)];
  assert.equal(overlayMatches(list, []), list);
  const out = overlayMatches(list, [m("2", 1, 1, "reported"), m("4", 1, 2)]);
  assert.deepEqual(out.map((x) => [x.id, x.status]), [["1", "confirmed"], ["2", "reported"], ["4", "pending"], ["3", "pending"]]);
});
