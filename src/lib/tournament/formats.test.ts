/**
 * Test di svizzera, gironi e sideboard (`formats.ts`, 09/11/2026): `npm test`. Confrontano anche costanti e regole con il
 * blocco "09/11/2026: SVIZZERA, GIRONI E SIDEBOARD" di supabase/schema.sql (il giudice vero; l'uguaglianza degli
 * abbinamenti e della classifica con le funzioni del database la prova scripts/swiss-dry-run.mjs) e le etichette nelle
 * otto lingue (`formatLabels.ts`).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  GROUP_ADVANCE_RANGE,
  GROUP_SIZE_RANGE,
  PCT_FLOOR,
  SIDEBOARD_RANGE,
  SWISS_PAIR_BUDGET,
  SWISS_PRESET,
  SWISS_ROUNDS_RANGE,
  applySwaps,
  bracketRenumbered,
  championOf,
  currentMatchOf,
  defaultSwissRounds,
  finalRoundOf,
  groupCount,
  groupLetter,
  groupQualifiers,
  groupsProblem,
  pairsOf,
  roundRobin,
  sideboardProblem,
  snakeGroups,
  standings,
  swapsProblem,
  swissPairs,
  swissQualifiers,
  type FormatMatch,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./formats.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { FORMAT_RPC_ERRORS, formatLabels } from "./formatLabels.ts";

const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
const MARK = "-- ===== 09/11/2026: SVIZZERA, GIRONI E SIDEBOARD =====";
const block = schema.slice(schema.indexOf(MARK));
const flat = block.replace(/\s+/g, " ");

/** Generatore pseudo-casuale con seme (i test devono dare sempre lo stesso risultato). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Gioca una svizzera finta come tm_swiss_round: ordine per vittorie e a caso fra pari, abbinamenti, vincitori a caso. */
function playSwiss(n: number, rounds: number, seed: number) {
  const rand = rng(seed);
  const ids = Array.from({ length: n }, (_, i) => `u${String(i).padStart(3, "0")}`);
  const matches: FormatMatch[] = [];
  const history: { round: number; partner: number[]; order: string[]; rematches: number }[] = [];
  for (let r = 1; r <= rounds; r++) {
    const wins = new Map(ids.map((u) => [u, matches.filter((m) => m.winner === u).length]));
    const order = ids
      .map((u) => ({ u, w: wins.get(u) ?? 0, k: rand() }))
      .sort((a, b) => b.w - a.w || a.k - b.k)
      .map((x) => x.u);
    const idx = new Map(order.map((u, i) => [u, i]));
    const hadBye = order.map((u) => matches.some((m) => m.status === "bye" && m.player_a === u));
    const played: [number, number][] = matches.filter((m) => m.player_b).map((m) => [idx.get(m.player_a as string) as number, idx.get(m.player_b as string) as number]);
    const partner = swissPairs(n, hadBye, played);
    const seen = new Set(played.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
    const { tables, bye } = pairsOf(partner);
    let rematches = 0;
    tables.forEach(([a, b], pos) => {
      if (seen.has(`${a}-${b}`)) rematches++;
      const aWins = rand() < 0.5;
      matches.push({ round: r, position: pos, stage: "swiss", player_a: order[a], player_b: order[b], winner: aWins ? order[a] : order[b], score_a: aWins ? 2 : rand() < 0.5 ? 1 : 0, score_b: aWins ? (rand() < 0.5 ? 1 : 0) : 2, status: "confirmed" });
    });
    if (bye !== null) matches.push({ round: r, position: tables.length, stage: "swiss", player_a: order[bye], player_b: null, winner: order[bye], score_a: 2, score_b: 0, status: "bye" });
    history.push({ round: r, partner, order, rematches });
  }
  return { ids, matches, history };
}

describe("regole uguali al database", () => {
  test("il blocco c'è ed è in fondo ai tornei", () => {
    assert.ok(schema.includes(MARK));
    for (const fn of ["tm_propagate", "tm_start", "tm_need", "tm_drop", "swap_players", "set_match_result", "finish_tournament", "tm_top_round", "tm_in_top4"]) {
      const last = schema.lastIndexOf(`create or replace function public.${fn}(`);
      assert.ok(last > schema.indexOf(MARK), `${fn} non è ridefinita nel blocco`);
    }
  });
  test("formati, turni, gironi e sideboard come le costanti", () => {
    assert.ok(flat.includes("check (format in ('single_elim', 'swiss', 'groups'))"));
    assert.ok(flat.includes(`swiss_rounds between ${SWISS_ROUNDS_RANGE.min} and ${SWISS_ROUNDS_RANGE.max}`));
    assert.ok(flat.includes(`group_size between ${GROUP_SIZE_RANGE.min} and ${GROUP_SIZE_RANGE.max}`));
    assert.ok(flat.includes(`group_advance between ${GROUP_ADVANCE_RANGE.min} and ${GROUP_ADVANCE_RANGE.max}`));
    assert.ok(flat.includes(`sideboard between ${SIDEBOARD_RANGE.min} and ${SIDEBOARD_RANGE.max}`));
    assert.ok(flat.includes("group_seeding in ('snake', 'random')"));
  });
  test("spareggi: 3 punti a vittoria, minimo 0.33, sei decimali, poi l'id", () => {
    assert.equal(PCT_FLOOR, 0.33);
    assert.ok(flat.includes("greatest(base.wins::numeric / base.played, 0.33)"));
    assert.ok(flat.includes("greatest(base.gf::numeric / base.gp, 0.33)"));
    assert.ok(flat.includes("order by f.points desc, f.omw desc, f.gw desc, f.ogw desc, f.uid"));
    assert.ok(flat.includes("pct.wins * 3 as points"));
    assert.ok(flat.includes("round(pct.mw, 6)"));
  });
  test("stesso limite di passi negli abbinamenti", () => {
    assert.ok(flat.includes(`budget constant int := ${SWISS_PAIR_BUDGET};`));
  });
  test("turni proposti come tm_swiss_default_rounds", () => {
    assert.deepEqual([2, 4, 5, 8, 9, 16, 17, 32, 33, 64, 65, 128, 129, 256].map(defaultSwissRounds), [1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]);
  });
  test("le funzioni nuove dello staff controllano lo staff e non sono per l'anonimo", () => {
    for (const fn of ["swiss_next_round", "start_final_stage"]) {
      const body = block.slice(block.indexOf(`create or replace function public.${fn}(`));
      assert.ok(body.slice(0, 1500).includes("public.is_tournament_staff(tid)"), fn);
      assert.ok(block.includes(`revoke all on function public.${fn}(uuid) from public, anon;`), fn);
    }
    for (const fn of ["tm_swiss_round(uuid, int)", "tm_swiss_pairs(int, boolean[], int[], int[])", "tm_groups_create(uuid, uuid[])", "tm_standings(uuid)", "tm_ready_round(uuid, int)", "tm_group_ready(uuid, uuid)"]) {
      assert.ok(block.includes(`revoke all on function public.${fn} from public, anon, authenticated;`), fn);
    }
  });
  test("scambi e classifica: nessuna lettura diretta, solo le funzioni", () => {
    assert.ok(flat.includes(`create policy "tournament side swaps no direct access" on public.tournament_side_swaps as restrictive for all to anon, authenticated using (false) with check (false);`));
    assert.ok(flat.includes("and public.tm_can_see_deck(m.tournament_id, s.user_id)"));
    assert.ok(flat.includes("select s.* from public.tm_standings(tid) s where public.can_view_tournament(tid)"));
  });
  test("SWISS_PRESET è un torneo valido: Top 8 più piccola dei posti, con la pausa", () => {
    assert.equal(SWISS_PRESET.format, "swiss");
    assert.ok(SWISS_PRESET.top_cut < SWISS_PRESET.size);
    assert.equal(SWISS_PRESET.top_cut_hold, true);
  });
});

describe("abbinamenti svizzeri", () => {
  test("ognuno una volta, un solo bye con i dispari, compagni reciproci", () => {
    for (const n of [2, 3, 4, 5, 7, 8, 9, 16, 17, 33, 64, 127, 256]) {
      const p = swissPairs(n, Array(n).fill(false), []);
      assert.equal(p.length, n);
      assert.equal(p.filter((x) => x === -1).length, n % 2, `n=${n}`);
      p.forEach((x, i) => {
        if (x >= 0) assert.equal(p[x], i, `n=${n} i=${i}`);
      });
    }
  });
  test("primo turno: dall'alto, 1 con 2, 3 con 4…; il bye all'ultimo", () => {
    assert.deepEqual(swissPairs(5, [false, false, false, false, false], []), [1, 0, 3, 2, -1]);
    assert.deepEqual(swissPairs(4, [false, false, false, false], []), [1, 0, 3, 2]);
  });
  test("niente rivincita: chi ha già giocato scala sul prossimo libero", () => {
    // 0-1 e 2-3 già giocate: 0 con 2, 1 con 3
    assert.deepEqual(swissPairs(4, [false, false, false, false], [[0, 1], [2, 3]]), [2, 3, 0, 1]);
    // la ricerca torna indietro: 0-2 e 1-3 già giocate, 0-1 libera → 0 con 1, poi 2 con 3
    assert.deepEqual(swissPairs(4, [false, false, false, false], [[0, 2], [1, 3]]), [1, 0, 3, 2]);
    // 0 può giocare solo con 3, e 1-2 restano: la ricerca deve trovarlo
    assert.deepEqual(swissPairs(4, [false, false, false, false], [[0, 1], [0, 2]]), [3, 2, 1, 0]);
  });
  test("bye al più basso che non l'ha avuto, e il bye che chiude gli abbinamenti", () => {
    // l'ultimo ha già avuto il bye: tocca al penultimo
    assert.equal(swissPairs(5, [false, false, false, false, true], []).indexOf(-1), 3);
    // tutti l'hanno avuto: al più basso
    assert.equal(swissPairs(3, [true, true, true], []).indexOf(-1), 2);
    // con il bye al 4 il 2 e il 3 dovrebbero rigiocare (0-1 libera, 2-3 già giocata): il bye passa al 3
    const p = swissPairs(5, [false, false, false, false, false], [[2, 3], [0, 2], [1, 2], [0, 3], [1, 3]]);
    assert.equal(p.indexOf(-1), 3);
  });
  test("rivincita solo se inevitabile: 4 giocatori al quarto turno", () => {
    // dopo un girone completo (tutti contro tutti) ogni coppia è una rivincita: si abbinano lo stesso, dall'alto
    const all: [number, number][] = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];
    assert.deepEqual(swissPairs(4, [false, false, false, false], all), [1, 0, 3, 2]);
  });
  test("tornei finti: nessuna rivincita nei turni proposti, nessun doppio bye finché c'è chi non l'ha avuto", () => {
    for (const [n, seed] of [[8, 1], [9, 2], [13, 3], [16, 4], [17, 5], [31, 6], [64, 7], [100, 8], [255, 9]]) {
      const rounds = defaultSwissRounds(n);
      const { matches, history } = playSwiss(n, rounds, seed);
      assert.equal(history.reduce((s, h) => s + h.rematches, 0), 0, `rivincite con ${n} giocatori`);
      const byes = matches.filter((m) => m.status === "bye").map((m) => m.player_a);
      assert.equal(new Set(byes).size, byes.length, `doppio bye con ${n}`);
      assert.equal(byes.length, n % 2 ? rounds : 0);
      for (let r = 1; r <= rounds; r++) {
        const inRound = matches.filter((m) => m.round === r).flatMap((m) => [m.player_a, m.player_b]).filter(Boolean);
        assert.equal(new Set(inRound).size, n, `turno ${r} con ${n}: tutti una volta`);
      }
    }
  });
  test("per punteggio: al primo tavolo i primi in classifica", () => {
    const { history, matches } = playSwiss(16, 3, 11);
    const h = history[2];
    const wins = (u: string) => matches.filter((m) => m.round < 3 && m.winner === u).length;
    const [a, b] = pairsOf(h.partner).tables[0];
    assert.equal(wins(h.order[a]), 2);
    assert.equal(wins(h.order[b]), 2);
  });
});

describe("classifica e spareggi", () => {
  // A batte B 2-0, C batte D 2-1, A batte C 2-1, D batte B 2-0
  const ms: FormatMatch[] = [
    { round: 1, position: 0, stage: "swiss", player_a: "a", player_b: "b", winner: "a", score_a: 2, score_b: 0, status: "confirmed" },
    { round: 1, position: 1, stage: "swiss", player_a: "c", player_b: "d", winner: "c", score_a: 2, score_b: 1, status: "confirmed" },
    { round: 2, position: 0, stage: "swiss", player_a: "a", player_b: "c", winner: "a", score_a: 2, score_b: 1, status: "confirmed" },
    { round: 2, position: 1, stage: "swiss", player_a: "b", player_b: "d", winner: "d", score_a: 0, score_b: 2, status: "confirmed" },
  ];
  test("punti, vittorie e percentuali", () => {
    const rows = standings(ms);
    const by = Object.fromEntries(rows.map((r) => [r.user_id, r]));
    assert.equal(by.a.points, 6);
    assert.equal(by.a.mw, 1);
    assert.equal(by.a.gw, 0.8); // 4 su 5
    assert.equal(by.b.mw, 0.33); // 0 su 2, minimo 33%
    assert.equal(by.b.gw, 0.33); // 0 su 4, minimo 33%
    assert.equal(by.a.omw, round((0.33 + 0.5) / 2)); // B 0,33 (minimo), C 0,5
    assert.equal(by.c.gw, round(3 / 6));
  });
  test("a pari punti decide l'OMW%: C (ha giocato con A) prima di D", () => {
    const rows = standings(ms);
    assert.deepEqual(
      rows.map((r) => r.user_id),
      ["a", "c", "d", "b"],
    );
    const by = Object.fromEntries(rows.map((r) => [r.user_id, r]));
    assert.equal(by.c.points, by.d.points);
    assert.ok(by.c.omw > by.d.omw);
  });
  test("il bye vale una vittoria ma non è un avversario", () => {
    const rows = standings([...ms, { round: 3, position: 2, stage: "swiss", player_a: "e", player_b: null, winner: "e", score_a: 2, score_b: 0, status: "bye" }]);
    const e = rows.find((r) => r.user_id === "e")!;
    assert.equal(e.points, 3);
    assert.equal(e.byes, 1);
    assert.equal(e.omw, 0.33);
    assert.equal(e.mw, 1);
  });
  test("a parità di tutto decide l'id", () => {
    const two: FormatMatch[] = [
      { round: 1, position: 0, stage: "swiss", player_a: "z", player_b: "y", winner: "z", score_a: 2, score_b: 0, status: "confirmed" },
      { round: 1, position: 1, stage: "swiss", player_a: "x", player_b: "w", winner: "x", score_a: 2, score_b: 0, status: "confirmed" },
    ];
    assert.deepEqual(
      standings(two).map((r) => r.user_id),
      ["x", "z", "w", "y"],
    );
  });
  test("turno per turno, partite aperte escluse, ritirati segnati, iscritti senza partite in fondo", () => {
    const rows = standings([...ms, { round: 3, position: 0, stage: "swiss", player_a: "a", player_b: "d", winner: null, score_a: null, score_b: null, status: "pending" }], { upTo: 1, dropped: ["b"], include: [{ user_id: "q", grp: null }] });
    assert.equal(rows.find((r) => r.user_id === "a")!.played, 1);
    assert.equal(rows.find((r) => r.user_id === "b")!.dropped, true);
    assert.equal(rows.at(-1)!.user_id, "q");
  });
  test("la Top sono i primi in gara", () => {
    const rows = standings(ms, { dropped: ["c"] });
    assert.deepEqual(
      swissQualifiers(rows, 2).map((r) => r.user_id),
      ["a", "d"],
    );
  });
});

const round = (x: number) => Math.round(x * 1e6) / 1e6;

describe("gironi", () => {
  test("numero di gironi e serpentina", () => {
    assert.equal(groupCount(10, 4), 3);
    assert.equal(groupCount(16, 4), 4);
    assert.deepEqual(snakeGroups(10, 3), [0, 1, 2, 2, 1, 0, 0, 1, 2, 2]);
    const sizes = (n: number, g: number) => snakeGroups(n, g).reduce((acc, x) => ((acc[x] = (acc[x] ?? 0) + 1), acc), [] as number[]);
    for (const n of [7, 10, 13, 22, 50]) {
      const s = sizes(n, groupCount(n, 4));
      assert.ok(Math.max(...s) - Math.min(...s) <= 1, `gironi sbilanciati con ${n}`);
    }
    assert.equal(groupLetter(0), "A");
    assert.equal(groupLetter(27), "AB");
  });
  test("gironi troppo piccoli", () => {
    assert.equal(groupsProblem(16, 4, 2), null);
    assert.equal(groupsProblem(5, 4, 2), "groups_too_small"); // 3 e 2: nel girone da 2 passano tutti
    assert.equal(groupsProblem(3, 4, 1), "groups_too_small"); // un girone solo con un qualificato: nessuna fase finale
    assert.equal(groupsProblem(8, 4, 1), null);
  });
  test("all'italiana: ogni coppia una volta, chi è dispari riposa una volta", () => {
    for (const m of [2, 3, 4, 5, 6, 7, 8]) {
      const rounds = roundRobin(m);
      assert.equal(rounds.length, m + (m % 2) - 1);
      const pairs = rounds.flat().map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`);
      assert.equal(pairs.length, (m * (m - 1)) / 2, `m=${m}`);
      assert.equal(new Set(pairs).size, pairs.length, `m=${m}: coppia doppia`);
      for (const r of rounds) {
        const seats = r.flat();
        assert.equal(new Set(seats).size, seats.length, `m=${m}: un giocatore due volte nello stesso turno`);
        assert.equal(seats.length, m - (m % 2));
      }
    }
  });
  test("chi passa: i primi K di ogni girone, prima i primi poi i secondi, a pari piazzamento per percentuali", () => {
    const g = (grp: number, user_id: string, points: number, mw: number, gw = 0.5): ReturnType<typeof standings>[number] => ({ user_id, grp, rank: 0, points, wins: points / 3, losses: 0, byes: 0, played: 3, mw, gw, omw: 0.5, ogw: 0.5, dropped: false });
    const rows = [g(0, "a1", 9, 1), g(0, "a2", 6, 0.66), g(0, "a3", 0, 0.33), g(1, "b1", 6, 0.66, 0.6), g(1, "b2", 6, 0.66, 0.55), g(1, "b3", 3, 0.33)];
    assert.deepEqual(
      groupQualifiers(rows, 2).map((r) => r.user_id),
      ["a1", "b1", "b2", "a2"],
    );
    rows[0].dropped = true;
    assert.deepEqual(
      groupQualifiers(rows, 1).map((r) => r.user_id),
      ["b1", "a2"],
    );
  });
});

describe("fasi del torneo", () => {
  const ms = [
    { id: "s1", round: 1, position: 0, stage: "swiss", player_a: "a", player_b: "b", winner: "a", status: "confirmed" },
    { id: "s2", round: 2, position: 0, stage: "swiss", player_a: "a", player_b: "c", winner: "a", status: "confirmed" },
    { id: "t1", round: 3, position: 0, stage: null, player_a: "a", player_b: "c", winner: null, status: "pending" },
    { id: "t2", round: 3, position: 1, stage: null, player_a: "b", player_b: "d", winner: null, status: "pending" },
    { id: "t3", round: 4, position: 0, stage: null, player_a: null, player_b: null, winner: null, status: "pending" },
  ];
  test("il tabellone dopo la svizzera si rinumera dal turno 1; la finale è l'ultimo turno del tabellone", () => {
    const { matches, base } = bracketRenumbered(ms);
    assert.equal(base, 2);
    assert.deepEqual(
      matches.map((m) => [m.id, m.round]),
      [
        ["t1", 1],
        ["t2", 1],
        ["t3", 2],
      ],
    );
    assert.equal(finalRoundOf("swiss", ms), 4);
    assert.equal(finalRoundOf("swiss", ms.slice(0, 2)), 0);
    assert.equal(finalRoundOf("single_elim", ms.slice(0, 2)), 2);
  });
  test("partita di adesso e campione", () => {
    assert.equal(currentMatchOf(ms, "a")?.id, "t1");
    assert.equal(currentMatchOf(ms.slice(0, 2), "a")?.id, "s2");
    const groups = [
      { id: "g1", round: 1, stage: "group", player_a: "a", player_b: "b", status: "confirmed", ready_at: "x" },
      { id: "g2", round: 2, stage: "group", player_a: "a", player_b: "c", status: "pending", ready_at: null },
      { id: "g3", round: 3, stage: "group", player_a: "a", player_b: "d", status: "pending", ready_at: null },
    ];
    assert.equal(currentMatchOf(groups, "a")?.id, "g2");
    assert.equal(championOf([{ stage: "champion", winner: "a" }]), "a");
    assert.equal(championOf(ms), null);
  });
});

describe("sideboard", () => {
  const decks = [{ legendary: "merlin", cards: ["c1", "c2", "c3"] }];
  test("riserva: quante carte, doppioni, carte già nel mazzo", () => {
    assert.equal(sideboardProblem(["c4", "c5"], decks, 5), null);
    assert.equal(sideboardProblem(["c4", "c5", "c6"], decks, 2), "side_count");
    assert.equal(sideboardProblem(["c4", "c4"], decks, 5), "side_invalid");
    assert.equal(sideboardProblem(["C4"], decks, 5), "side_invalid");
    assert.equal(sideboardProblem(["c1"], decks, 5), "side_in_deck");
    assert.equal(sideboardProblem(["merlin"], decks, 5), "side_in_deck");
    assert.equal(sideboardProblem(["c9"], decks, 5, (s) => s !== "c9"), "side_invalid");
  });
  test("scambi: esce dal mazzo, entra dalla riserva, uno per uno", () => {
    assert.equal(swapsProblem([{ out: "c1", in: "c4" }], ["c1", "c2"], ["c4", "c5"], 5), null);
    assert.equal(swapsProblem([{ out: "c9", in: "c4" }], ["c1", "c2"], ["c4"], 5), "bad_side_swap");
    assert.equal(swapsProblem([{ out: "c1", in: "c2" }], ["c1", "c2"], ["c4"], 5), "bad_side_swap");
    assert.equal(swapsProblem([{ out: "c1", in: "c4" }, { out: "c1", in: "c5" }], ["c1", "c2"], ["c4", "c5"], 5), "bad_side_swap");
    assert.equal(swapsProblem([{ out: "c1", in: "c4" }, { out: "c2", in: "c5" }], ["c1", "c2"], ["c4", "c5"], 1), "bad_side_swap");
    assert.deepEqual(applySwaps(["c1", "c2", "c3"], [{ out: "c2", in: "c9" }]), ["c1", "c9", "c3"]);
  });
  test("il database controlla le stesse cose", () => {
    assert.ok(flat.includes("raise exception 'side_in_deck'"));
    assert.ok(flat.includes("raise exception 'side_count'"));
    assert.ok(flat.includes("not (d.sideboard ? (x ->> 'in'))"));
    assert.ok(flat.includes("not ((x ->> 'out') = any(deck_cards))"));
  });
});

describe("etichette", () => {
  test("otto lingue con le stesse chiavi e gli stessi segnaposto", () => {
    const en = formatLabels.en as Record<string, unknown>;
    const keys = (o: Record<string, unknown>, p = ""): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));
    const get = (o: Record<string, unknown>, path: string) => path.split(".").reduce<unknown>((a, k) => (a as Record<string, unknown>)?.[k], o) as string;
    const enKeys = keys(en);
    assert.deepEqual(Object.keys(formatLabels).sort(), ["de", "en", "es", "fr", "it", "pt", "ru", "zh-cn"]);
    for (const [loc, l] of Object.entries(formatLabels)) {
      assert.deepEqual(keys(l as Record<string, unknown>), enKeys, loc);
      for (const k of enKeys) {
        const v = get(l as Record<string, unknown>, k);
        assert.ok(typeof v === "string" && v.trim().length > 0, `${loc}.${k} vuota`);
        const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
        assert.equal(ph(v), ph(get(en, k)), `${loc}.${k}: segnaposto diversi`);
      }
    }
  });
  test("ogni errore delle RPC nuove ha un testo", () => {
    for (const code of FORMAT_RPC_ERRORS) {
      assert.ok(block.includes(`raise exception '${code}'`), `${code} non è nel blocco`);
      for (const l of Object.values(formatLabels)) assert.ok((l as { errors: Record<string, string> }).errors[code], code);
    }
  });
});
