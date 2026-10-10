/** Test della partita ricostruita dallo scanner (reconstruct.ts): `npm test` nella cartella tracker/. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyScan, confirmMana, readScanFrame, reconstruct, scanFor, splitMatches, type CardInfo, type ScanFrame } from "./reconstruct";
import { BOARD_SLOTS } from "./recognize";
import type { TrackedMatch } from "../../../src/lib/tracker/match";

const TOKENS = new Set(["T_MOUSE"]);
const LEGENDS = new Set(["L_ME", "L_OPP"]);
const info: CardInfo = { token: (k) => TOKENS.has(k), legendary: (k) => LEGENDS.has(k) };

const at = (side: "me" | "opp", lane: number, slot: number) => BOARD_SLOTS.findIndex((s) => s.side === side && s.lane === lane && s.slot === slot);
/** Un fotogramma con le carte indicate ("me 1 1" → chiave). */
function frame(ms: number, maxMana: number | null, cards: Record<string, string> = {}, vs: ScanFrame["vs"] = null): ScanFrame {
  const board: (string | null)[] = BOARD_SLOTS.map(() => null);
  for (const [where, key] of Object.entries(cards)) {
    const [side, lane, slot] = where.split(" ");
    board[at(side as "me" | "opp", Number(lane), Number(slot))] = key;
  }
  return { ms, board, vs, maxMana };
}

/** Una partita di prova: VS, tabellone d'apertura con "0/10", tre round. */
function game(t0: number): ScanFrame[] {
  const s = (k: number) => t0 + k * 1000;
  return [
    frame(s(0), null, {}, { me: "L_ME", opp: "L_OPP" }),
    frame(s(1), null, {}, { me: "L_ME", opp: "L_OPP" }),
    frame(s(2), 10), // tabellone appena aperto: "0/10"
    frame(s(3), 10),
    // round 1: io gioco A nel luogo 1 (si vede già mentre la piazzo), l'avversario X nel luogo 3
    frame(s(10), 2),
    frame(s(11), 2, { "me 1 1": "A" }),
    frame(s(12), 2, { "me 1 1": "A" }),
    frame(s(13), 2, { "me 1 1": "A", "opp 3 1": "X" }),
    frame(s(14), 2, { "me 1 1": "A", "opp 3 1": "X" }),
    // round 2: A sparisce per un fotogramma (animazione), gioco due copie di B, un topolino creato non conta
    frame(s(20), 3, { "opp 3 1": "X" }),
    frame(s(21), 3, { "me 1 1": "A", "me 2 1": "B", "opp 3 1": "X" }),
    frame(s(22), 3, { "me 1 1": "A", "me 2 1": "B", "me 2 2": "B", "me 3 1": "T_MOUSE", "opp 3 1": "X" }),
    frame(s(23), 3, { "me 1 1": "A", "me 2 1": "B", "me 2 2": "B", "me 3 1": "T_MOUSE", "opp 3 1": "X" }),
    // round 3: un effetto sposta X nel luogo 2 (non è una giocata), l'avversario gioca la Leggendaria
    frame(s(30), null, { "me 1 1": "A", "me 2 1": "B", "me 2 2": "B", "opp 2 1": "X" }),
    frame(s(31), 4, { "me 1 1": "A", "me 2 1": "B", "me 2 2": "B", "opp 2 1": "X", "opp 1 1": "L_OPP" }),
    frame(s(32), 4, { "me 1 1": "A", "me 2 1": "B", "me 2 2": "B", "opp 2 1": "X", "opp 1 1": "L_OPP" }),
    // una lettura isolata sbagliata del mana non fa saltare il round
    frame(s(33), 9, { "me 1 1": "A", "me 2 1": "B", "me 2 2": "B", "opp 2 1": "X", "opp 1 1": "L_OPP" }),
    frame(s(34), 4, { "me 1 1": "A", "me 2 1": "B", "me 2 2": "B", "opp 2 1": "X", "opp 1 1": "L_OPP" }),
  ];
}

test("ricostruzione: round, copie, sparizioni, spostamenti e carte create", () => {
  const m = reconstruct(game(0), info);
  assert.equal(m.myLegendary, "L_ME");
  assert.equal(m.oppLegendary, "L_OPP");
  assert.equal(m.turns, 3);
  assert.deepEqual(
    m.plays.map((p) => `${p.turn} ${p.me ? "io" : "avv"} ${p.card} L${p.lane}`).sort(),
    ["1 avv X L3", "1 io A L1", "2 io B L2", "2 io B L2", "3 avv L_OPP L1"].sort(),
  );
  assert.deepEqual(m.opponentCards, ["L_OPP", "X"]);
});

test("mana: una lettura isolata o lontana nel tempo non vale", () => {
  const f = confirmMana([frame(0, 2), frame(1000, 2), frame(2000, 9), frame(3000, 2), frame(60_000, 3)]);
  assert.deepEqual(f.map((x) => x.maxMana), [2, 2, null, 2, null]);
});

test("divisione in partite: VS, mana che riparte, pause; il tabellone d'apertura non apre una partita", () => {
  const two = [...game(0), ...game(100_000)];
  const parts = splitMatches(two);
  assert.equal(parts.length, 2);
  assert.ok(parts[1][0].vs, "la seconda partita comincia dalla sua schermata VS");
  assert.equal(reconstruct(parts[1], info).turns, 3);
  // solo menu e tabellone d'apertura: nessuna partita
  assert.equal(splitMatches([frame(0, null), frame(1000, 10), frame(2000, 10)]).length, 0);
  // la partita giusta per un'ora di fine
  assert.equal(scanFor(two, 50_000, info)?.startMs, 0);
  assert.equal(scanFor(two, 150_000, info)?.startMs, 100_000);
  assert.equal(scanFor(two, -1, info), null);
});

const tracked = (over: Partial<TrackedMatch> = {}): TrackedMatch => ({
  v: 2,
  id: "x",
  endedAt: "2026-10-10T00:11:31.466Z",
  result: "W",
  queue: "normal",
  deck: { name: "On Death", legendary: "L_ME", cards: ["L_ME", "A", "B"], code: null },
  rank: null,
  opponent: null,
  arena: null,
  locationPool: null,
  turns: null,
  plays: [],
  missed: "",
  ...over,
});

test("storico: le carte lette riempiono la partita senza replay; mie solo quelle del mazzo, luoghi da 0", () => {
  const scan = reconstruct(game(0), info);
  scan.plays.push({ turn: 2, me: true, card: "GENERATA", lane: 3 });
  const m = applyScan(tracked(), scan);
  assert.deepEqual(m.opponent, { legendary: "L_OPP", cards: ["L_OPP", "X"] });
  assert.equal(m.turns, 3);
  assert.ok(!m.plays.some((p) => p.card === "GENERATA"), "carta generata da un effetto sul mio lato");
  assert.ok(m.plays.every((p) => p.lane !== null && p.lane >= 0 && p.lane <= 2));
  assert.equal(m.plays.find((p) => p.card === "X")?.lane, 2);
  // col replay vince il replay; senza scanner non cambia niente
  const withReplay = tracked({ plays: [{ turn: 1, me: true, card: "A", lane: 0 }] });
  assert.equal(applyScan(withReplay, scan), withReplay);
  assert.equal(applyScan(tracked(), null).plays.length, 0);
});

test("fotogrammi dalla finestra nascosta: solo la forma attesa, l'ora la mette il processo principale", () => {
  const ok = { ms: 1, board: BOARD_SLOTS.map((_, i) => (i === 3 ? "C00032_MB" : null)), vs: { me: "C00176_MC", opp: "C00118_MC" }, maxMana: 6 };
  assert.deepEqual(readScanFrame(ok, 500), { ...ok, ms: 500 });
  assert.equal(readScanFrame({ ...ok, board: ok.board.slice(1) }, 0), null, "spazi mancanti");
  assert.equal(readScanFrame({ ...ok, board: ok.board.map((k, i) => (i === 0 ? "<script>" : k)) }, 0), null, "chiave non valida");
  assert.equal(readScanFrame({ ...ok, vs: { me: "C00176_MC" } }, 0), null);
  assert.equal(readScanFrame({ ...ok, maxMana: 2.5 }, 0), null);
  assert.equal(readScanFrame({ ...ok, maxMana: 99 }, 0), null);
  assert.equal(readScanFrame(null, 0), null);
  assert.deepEqual(readScanFrame({ ...ok, vs: null, maxMana: null }, 7)?.vs, null);
});

test("ripresa cominciata a partita in corso: si legge dal primo mana, ma la partita resta incompleta e non va nello storico", () => {
  const mid = [
    frame(0, 4, { "me 1 1": "A", "opp 3 1": "X" }),
    frame(1000, 4, { "me 1 1": "A", "opp 3 1": "X" }),
    frame(10_000, 5, { "me 1 1": "A", "me 2 1": "B", "opp 3 1": "X" }),
    frame(11_000, 5, { "me 1 1": "A", "me 2 1": "B", "opp 3 1": "X" }),
  ];
  const parts = splitMatches(mid);
  assert.equal(parts.length, 1);
  const m = reconstruct(parts[0], info);
  assert.equal(m.complete, false);
  assert.equal(m.turns, 4);
  assert.ok(m.plays.some((p) => p.card === "B" && p.turn === 4));
  assert.equal(applyScan(tracked(), m).opponent, null, "incompleta: lo storico non cambia");
  // la partita intera di prima resta completa
  assert.equal(reconstruct(game(0), info).complete, true);
  // il primo pezzo comincia a metà solo se il mana arriva subito: dopo un minuto di menu, un "0/10" non apre una partita
  assert.equal(splitMatches([frame(0, null), frame(70_000, 10), frame(71_000, 10)]).length, 0);
});
