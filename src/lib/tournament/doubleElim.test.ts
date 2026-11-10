/**
 * Test della qualificazione a doppia eliminazione (`doubleElim.ts`, 10/11/2026): `npm test`. Simulano tabelloni interi
 * con risultati casuali (bye compresi; i ritiri li provano gli scenari sul database) e confrontano le costanti con il
 * blocco "10/11/2026: DOPPIA ELIMINAZIONE" di supabase/schema.sql. L'uguaglianza con le funzioni del database la prova
 * 00_KB/_sim_torneo_2026-11-06/de-dry.mjs (PGlite), partita per partita.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DE_POOLS_RANGE,
  DE_QUALIFY_OPTIONS,
  deCreate,
  deFeeder,
  deLoserTo,
  deMatchCount,
  deMinPlayers,
  dePlan,
  dePlanOf,
  deQualifiers,
  deReady,
  deReport,
  deSlotOf,
  deSlots,
  deWinnerTo,
  poolCounts,
  type DeMatch,
  type DePlan,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./doubleElim.ts";

/** Generatore deterministico (mulberry32): le simulazioni si ripetono uguali. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function playAll(plan: DePlan, matches: DeMatch[], rand: () => number): number {
  let played = 0;
  for (;;) {
    const ready = deReady(matches);
    if (!ready.length) break;
    for (const m of ready) {
      deReport(plan, matches, m, rand() < 0.5);
      played += 1;
    }
  }
  return played;
}

describe("piano", () => {
  test("2 × 512 con 32 + 32 per tabellone: 4 turni dei vincenti, 6 dei perdenti, 1856 partite, 7 turni di gioco", () => {
    const plan = dePlan(1024, 2, 32);
    assert.notEqual(plan, "too_few_players");
    const p = plan as DePlan;
    assert.deepEqual(p, { pools: 2, poolSize: 512, qualify: 32, upperRounds: 4, lowerRounds: 6 });
    assert.equal(deMatchCount(p), 1856);
    assert.equal(deSlots(p), 7);
  });
  test("i tabelloni si riempiono a turno e P è la potenza di 2 del più pieno", () => {
    assert.deepEqual(poolCounts(513, 2), [257, 256]);
    assert.equal((dePlan(513, 2, 32) as DePlan).poolSize, 512);
    assert.equal((dePlan(512, 2, 32) as DePlan).poolSize, 256);
    assert.equal((dePlan(300, 2, 32) as DePlan).poolSize, 256);
  });
  test("ogni tabellone deve avere più di 2Q iscritti", () => {
    assert.equal(dePlan(128, 2, 32), "too_few_players");
    assert.notEqual(dePlan(130, 2, 32), "too_few_players");
    assert.equal(deMinPlayers(2, 32), 130);
    assert.equal(dePlan(129, 2, 32), "too_few_players");
  });
  test("con Q = P/4 i perdenti hanno 2 turni", () => {
    const p = dePlan(16, 1, 4) as DePlan;
    assert.equal(p.upperRounds, 2);
    assert.equal(p.lowerRounds, 2);
  });
});

describe("instradamento", () => {
  const plan = dePlan(1024, 2, 32) as DePlan;
  test("ogni posto dei perdenti ha un solo feeder, che ci manda davvero", () => {
    for (let k = 1; k <= plan.lowerRounds; k++) {
      const c = plan.poolSize >> (Math.ceil(k / 2) + 1);
      for (let j = 0; j < c; j++)
        for (const side of [0, 1] as const) {
          const f = deFeeder(plan, { stage: "lower", local: k, index: j }, side);
          assert.ok(f);
          const to = f.gives === "winner" ? deWinnerTo(plan, { stage: f.stage, local: f.local, index: f.index, pool: 0 }) : deLoserTo(plan, { stage: f.stage, local: f.local, index: f.index, pool: 0 });
          assert.deepEqual(to, { stage: "lower", local: k, index: j, side });
        }
    }
  });
  test("chi perde nei perdenti è fuori, chi vince l'ultimo turno di ogni lato è qualificato", () => {
    assert.equal(deLoserTo(plan, { stage: "lower", local: 3, index: 0, pool: 0 }), "out");
    assert.equal(deWinnerTo(plan, { stage: "upper", local: 4, index: 5, pool: 1 }), "qualified");
    assert.equal(deWinnerTo(plan, { stage: "lower", local: 6, index: 31, pool: 1 }), "qualified");
  });
  test("posizione e turno nel database tornano al posto", () => {
    assert.deepEqual(deSlotOf(plan, { stage: "lower", round: 4 + 3, position: 64 + 5 }), { stage: "lower", pool: 1, local: 3, index: 5 });
    assert.deepEqual(deSlotOf(plan, { stage: "upper", round: 1, position: 256 }), { stage: "upper", pool: 1, local: 1, index: 0 });
    assert.equal(deSlotOf(plan, { stage: null, round: 11, position: 0 }), null);
  });
});

describe("simulazioni intere", () => {
  const cases: [number, number, number][] = [
    [1024, 2, 32],
    [1000, 2, 32],
    [777, 2, 32],
    [513, 2, 32],
    [300, 2, 32],
    [131, 2, 32],
    [64, 1, 4],
    [37, 3, 2],
    [9, 1, 1],
    [200, 4, 8],
  ];
  for (const [n, pools, q] of cases) {
    test(`${n} iscritti, ${pools} tabelloni, ${q} + ${q} qualificati`, () => {
      const players = Array.from({ length: n }, (_, i) => `p${String(i).padStart(4, "0")}`);
      const { plan, matches } = deCreate(players, pools, q);
      assert.equal(matches.length, deMatchCount(plan));
      playAll(plan, matches, rng(n * 31 + pools * 7 + q));
      assert.equal(matches.filter((m) => m.status === "pending").length, 0, "nessuna partita resta ferma");
      const qual = deQualifiers(plan, matches);
      assert.equal(qual.length, pools * 2 * q);
      for (let p = 0; p < pools; p++) {
        assert.equal(qual.filter((x: { pool: number; from: string }) => x.pool === p && x.from === "upper").length, q);
        assert.equal(qual.filter((x: { pool: number; from: string }) => x.pool === p && x.from === "lower").length, q);
      }
      assert.equal(new Set(qual.map((x: { uid: string }) => x.uid)).size, qual.length);
      const losses = new Map<string, number>(players.map((u) => [u, 0]));
      for (const m of matches)
        if (m.status === "confirmed") {
          const l = m.winner === m.player_a ? m.player_b! : m.player_a!;
          losses.set(l, (losses.get(l) ?? 0) + 1);
        }
      const qset = new Map(qual.map((x: { uid: string; from: string }) => [x.uid, x.from]));
      for (const u of players) {
        const l = losses.get(u)!;
        if (qset.get(u) === "upper") assert.equal(l, 0, `${u} qualificato dai vincenti senza sconfitte`);
        else if (qset.get(u) === "lower") assert.equal(l, 1, `${u} qualificato dai perdenti con una sconfitta`);
        else assert.equal(l, 2, `${u} eliminato con due sconfitte`);
      }
      // nessuno gioca due partite contemporaneamente: ogni giocatore sta al più in una partita non chiusa in ogni momento
      // (verificato a fine simulazione sulla sequenza: ogni giocatore ha una sola partita per turno del suo lato)
      const seen = new Set<string>();
      for (const m of matches)
        for (const u of [m.player_a, m.player_b])
          if (u) {
            const k = `${m.stage}:${m.round}:${u}`;
            assert.ok(!seen.has(k), `${u} due volte nel turno ${m.round}`);
            seen.add(k);
          }
    });
  }
});

describe("piano dalle partite", () => {
  test("dePlanOf ricostruisce il piano dalle partite salvate", () => {
    const players = Array.from({ length: 700 }, (_, i) => `u${i}`);
    const { plan, matches } = deCreate(players, 2, 32);
    assert.deepEqual(dePlanOf(matches, 2, 32), plan);
  });
});

describe("schema", () => {
  const sql = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
  const block = sql.slice(sql.indexOf("===== 10/11/2026: DOPPIA ELIMINAZIONE ====="));
  test("il blocco SQL c'è", () => {
    assert.ok(block.length > 1000);
  });
  test("i vincoli del database sono quelli del sito", () => {
    assert.match(block, new RegExp(`de_pools between ${DE_POOLS_RANGE.min} and ${DE_POOLS_RANGE.max}`));
    assert.match(block, new RegExp(`de_qualify in \\(${DE_QUALIFY_OPTIONS.join(", ")}\\)`));
    assert.match(block, /size in \(4, 8, 16, 32, 64, 128, 256, 512, 1024\)/);
  });
});

describe("testi", () => {
  test("le otto lingue hanno le stesse chiavi e gli stessi segnaposto", async () => {
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const { doubleElimLabels } = await import("./doubleElimLabels.ts");
    const flat = (o: Record<string, unknown>, pre = ""): Record<string, string> =>
      Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[pre + k, v]] : Object.entries(flat(v as Record<string, unknown>, `${pre}${k}.`)))));
    const en = flat(doubleElimLabels.en);
    const marks = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const [loc, labels] of Object.entries(doubleElimLabels)) {
      const l = flat(labels as Record<string, unknown>);
      assert.deepEqual(Object.keys(l).sort(), Object.keys(en).sort(), loc);
      for (const k of Object.keys(en)) assert.equal(marks(l[k]), marks(en[k]), `${loc}.${k}`);
    }
  });
});
