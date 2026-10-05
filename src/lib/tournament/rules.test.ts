/**
 * Test delle regole del torneo con check-in e tempo di assenza (`rules.ts`, 05/10/2026): `npm test`. Confrontano anche i
 * numeri con il blocco "05/10/2026: TORNEO CRIMSON" di supabase/schema.sql, che è il giudice vero.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CHECKIN_CLOSES_MINUTES,
  CHECKIN_OPENS_MINUTES,
  CRIMSON_PRESET,
  MAX_JUDGES,
  NO_SHOW_RANGE,
  checkinPhase,
  checkinWindow,
  formatCountdown,
  matchBestOf,
  matchNeed,
  noShowAt,
  seatPlan,
  staffQueue,
  validNeedScore,
  waitlistPosition,
  type QueueMatch,
  type SeatPlayer,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./rules.ts";

const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
const MARK = "-- ===== 05/10/2026: TORNEO CRIMSON =====";
const block = schema.slice(schema.indexOf(MARK));
const MIN = 60_000;

describe("numeri uguali al database", () => {
  test("il blocco c'è", () => assert.ok(schema.includes(MARK)));
  test("finestra del check-in", () => {
    assert.equal(CHECKIN_OPENS_MINUTES, 120);
    assert.ok(block.includes("now() < t.starts_at - interval '2 hours'"));
    assert.equal(CHECKIN_CLOSES_MINUTES, 5);
    assert.ok(block.includes("now() > t.starts_at - interval '5 minutes'"));
    assert.ok(block.includes("now() < t.starts_at - interval '5 minutes' then raise exception 'checkin_still_open'"));
  });
  test("minuti di assenza, finale, arbitri", () => {
    assert.ok(block.includes(`no_show_minutes between ${NO_SHOW_RANGE.min} and ${NO_SHOW_RANGE.max}`));
    assert.ok(block.includes("final_best_of in (1, 3, 5)"));
    assert.ok(block.includes(`>= ${MAX_JUDGES} then raise exception 'too_many_judges'`));
  });
  test("preset Crimson Cup coerente con le regole", () => {
    assert.equal(CRIMSON_PRESET.conquest_decks, 3);
    assert.equal(CRIMSON_PRESET.conquest_min_different, 8);
    assert.equal(CRIMSON_PRESET.best_of, 3);
    assert.equal(CRIMSON_PRESET.final_best_of, 5);
    assert.equal(CRIMSON_PRESET.no_show_minutes, 15);
  });
});

describe("check-in", () => {
  const start = Date.parse("2026-10-15T17:00:00Z");
  test("finestra", () => {
    const w = checkinWindow(start);
    assert.equal(start - w.opensAt, 120 * MIN);
    assert.equal(start - w.closesAt, 5 * MIN);
  });
  test("fasi", () => {
    assert.equal(checkinPhase(start, start - 121 * MIN), "before");
    assert.equal(checkinPhase(start, start - 120 * MIN), "open");
    assert.equal(checkinPhase(start, start - 5 * MIN), "open");
    assert.equal(checkinPhase(start, start - 4 * MIN), "late");
    assert.equal(checkinPhase(new Date(start).toISOString(), start + MIN), "late");
  });
});

describe("partite", () => {
  test("finale al meglio delle cinque, il resto delle tre", () => {
    assert.equal(matchBestOf(3, 5, 6, 6), 5);
    assert.equal(matchBestOf(3, 5, 5, 6), 3);
    assert.equal(matchBestOf(3, null, 6, 6), 3);
    assert.equal(matchNeed(3, 5, 6, 6), 3);
    assert.equal(matchNeed(3, 5, 1, 6), 2);
    assert.equal(matchNeed(1, null, 1, 3), 1);
  });
  test("punteggi", () => {
    assert.ok(validNeedScore(2, 2, 1));
    assert.ok(validNeedScore(3, 1, 3));
    assert.ok(!validNeedScore(2, 3, 1));
    assert.ok(!validNeedScore(3, 2, 1));
    assert.ok(!validNeedScore(2, 2, 2));
  });
  test("tavolino", () => {
    assert.equal(noShowAt("2026-10-15T17:00:00Z", 15), Date.parse("2026-10-15T17:15:00Z"));
    assert.equal(noShowAt(null, 15), null);
    assert.equal(noShowAt("2026-10-15T17:00:00Z", null), null);
  });
  test("conto alla rovescia", () => {
    assert.equal(formatCountdown(0), "00:00");
    assert.equal(formatCountdown(61_000), "01:01");
    assert.equal(formatCountdown(3_725_000), "1:02:05");
    assert.equal(formatCountdown(-5), "00:00");
  });
});

describe("coda degli arbitri", () => {
  const now = Date.parse("2026-10-15T18:00:00Z");
  const iso = (minAgo: number) => new Date(now - minAgo * MIN).toISOString();
  const m = (over: Partial<QueueMatch>): QueueMatch => ({ id: Math.random().toString(36), round: 1, position: 0, player_a: "a", player_b: "b", status: "pending", ready_at: iso(1), ...over });
  test("motivi e ordine", () => {
    const list = [
      m({ id: "long", ready_at: iso(80), seen_a: iso(70), seen_b: iso(70) }),
      m({ id: "absent", ready_at: iso(20) }),
      m({ id: "stale", status: "reported", ready_at: iso(30), reported_at: iso(12), seen_a: iso(25) }),
      m({ id: "dispute", status: "disputed", ready_at: iso(40) }),
      m({ id: "fresh", ready_at: iso(5) }),
      m({ id: "one-present", ready_at: iso(20), seen_a: iso(19) }),
      m({ id: "done", status: "confirmed", ready_at: iso(90) }),
      m({ id: "tbd", player_b: null, ready_at: null }),
    ];
    const q = staffQueue(list, { now, noShowMinutes: 15 });
    assert.deepEqual(
      q.map((i) => `${i.match.id}:${i.kind}`),
      ["dispute:disputed", "absent:bothAbsent", "stale:staleReport", "long:long"],
    );
  });
  test("senza il tempo di assenza niente 'assenti'", () => {
    assert.equal(staffQueue([m({ ready_at: iso(20) })], { now, noShowMinutes: null }).length, 0);
  });
});

describe("posti all'avvio con il check-in", () => {
  const p = (id: string, status: string, checkedMinAgo: number | null, createdMin: number, decks = true): SeatPlayer => ({
    user_id: id,
    status,
    checked_in_at: checkedMinAgo === null ? null : new Date(Date.parse("2026-10-15T17:00:00Z") - checkedMinAgo * MIN).toISOString(),
    decks_submitted: decks,
    created_at: new Date(Date.parse("2026-10-01T00:00:00Z") + createdMin * MIN).toISOString(),
  });
  const players = [
    p("r1", "registered", 60, 1),
    p("r2", "registered", 50, 2),
    p("r3", "registered", null, 3),
    p("r4", "registered", 40, 4, false),
    p("w1", "waitlist", 10, 5),
    p("w2", "waitlist", 30, 6),
    p("w3", "waitlist", null, 7),
    p("x", "dropped", 50, 0),
  ];
  test("chi entra", () => {
    const plan = seatPlan(players, 3);
    assert.deepEqual(plan.registeredIn, ["r1", "r2"]);
    assert.deepEqual(plan.registeredOut, ["r3", "r4"]);
    assert.deepEqual(plan.waitlistQueue, ["w2", "w1"], "ordine di arrivo al check-in");
    assert.equal(plan.free, 1);
    assert.deepEqual(plan.waitlistIn, ["w2"]);
  });
  test("posizione in lista d'attesa (ordine di iscrizione)", () => {
    assert.equal(waitlistPosition(players, "w1"), 1);
    assert.equal(waitlistPosition(players, "w3"), 3);
    assert.equal(waitlistPosition(players, "r1"), null);
  });
});
