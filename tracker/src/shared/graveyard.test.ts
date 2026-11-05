/**
 * Test dei cimiteri e dei round dopo il nono (05/11/2026, reconstruct.ts: `graveyard`, `graveyardStep`, `splitByPhase`):
 * `npm test` nella cartella tracker/. Partite finte con le fasi del round ("PRONTO" = pianificazione) e la mia mano.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { LIVE_DEATH_MS, PHASE_FRAMES, reconstruct, splitByPhase, type CardInfo, type ScanFrame } from "./reconstruct";
import { BOARD_SLOTS } from "./recognize";
import { graveRoleOf, GRAVE_ROLE_BY_SLUG, type GraveRole } from "./graveRoles";

const TOKENS = new Set(["T_MOUSE", "T_SWAN"]);
const LEGENDS = new Set(["L_ME", "L_OPP", "L_FRANK"]);
const ROLES: Record<string, GraveRole> = { L_FRANK: "reviver", ALIVE_SB: "revive", KOSCHEI: "hand", MUMMY: "rebirth", DUCK: "transform", DRAC: "recall" };
const info: CardInfo = { token: (k) => TOKENS.has(k), legendary: (k) => LEGENDS.has(k), grave: (k) => ROLES[k] ?? null };

const at = (side: "me" | "opp", lane: number, slot: number) => BOARD_SLOTS.findIndex((s) => s.side === side && s.lane === lane && s.slot === slot);
type Opts = { phase?: "plan" | "reveal"; hand?: string[]; result?: "W" | "L"; spell?: string | null };
/** Un fotogramma con le carte indicate ("me 1 1" → chiave), il mana massimo e, a richiesta, fase, mano, magia, esito. */
function frame(ms: number, maxMana: number | null, cards: Record<string, string> = {}, o: Opts = {}): ScanFrame {
  const board: (string | null)[] = BOARD_SLOTS.map(() => null);
  for (const [where, key] of Object.entries(cards)) {
    const [side, lane, slot] = where.split(" ");
    board[at(side as "me" | "opp", Number(lane), Number(slot))] = key;
  }
  return { ms, board, vs: null, maxMana, ...(o.result ? { result: o.result } : {}), ...(o.hand ? { hand: o.hand } : {}), ...(o.phase ? { phase: o.phase } : {}), ...(o.spell !== undefined ? { spell: o.spell } : {}) };
}
/** `n` fotogrammi uguali, uno al secondo da `t` (secondi). */
const run = (t: number, n: number, maxMana: number | null, cards: Record<string, string> = {}, o: Opts = {}) => Array.from({ length: n }, (_, i) => frame((t + i) * 1000, maxMana, cards, o));
const vsFrames = (t: number) => [0, 1].map((i) => ({ ...frame((t + i) * 1000, null), vs: { me: "L_ME", opp: "L_OPP" } }));
const names = (list: readonly string[]) => [...list].sort();

test("morti dei due lati; il tabellone che si svuota a fine partita non uccide nessuno", () => {
  const frames = [
    ...vsFrames(0),
    // round 1: piazzo A, l'avversario rivela X
    ...run(10, 3, 2, { "me 1 1": "A" }, { phase: "plan" }),
    ...run(13, 4, 2, { "me 1 1": "A", "opp 1 1": "X" }, { phase: "reveal" }),
    // round 2: X muore in combattimento (sparisce fino alla fine del round)
    ...run(20, 3, 3, { "me 1 1": "A", "opp 1 1": "X" }, { phase: "plan" }),
    ...run(23, 2, 3, { "me 1 1": "A", "opp 1 1": "X" }, { phase: "reveal" }),
    ...run(25, 6, 3, { "me 1 1": "A" }, { phase: "reveal" }),
    // round 3: muore A, poi lo stendardo e il tabellone vuoto
    ...run(31, 3, 4, { "me 1 1": "A" }, { phase: "plan" }),
    ...run(34, 2, 4, { "me 1 1": "A" }, { phase: "reveal" }),
    ...run(36, 6, 4, {}, { phase: "reveal" }),
    ...run(42, 3, null, { "me 2 1": "B" }),
    ...run(45, 3, null, {}),
    ...run(48, 3, null, {}, { result: "W" }),
  ];
  const m = reconstruct(frames, info);
  assert.deepEqual(m.graveyard, { me: ["A"], opp: ["X"] });
});

test("una carta coperta per qualche fotogramma non è morta", () => {
  const frames = [
    ...run(10, 3, 2, { "me 1 1": "A" }, { phase: "plan" }),
    ...run(13, 4, 2, { "me 1 1": "A", "opp 2 1": "X" }, { phase: "reveal" }),
    // un'anteprima copre A per due fotogrammi in mezzo e per uno alla fine del round
    ...run(20, 3, 3, { "me 1 1": "A", "opp 2 1": "X" }, { phase: "plan" }),
    ...run(23, 2, 3, { "opp 2 1": "X" }, { phase: "reveal" }),
    ...run(25, 3, 3, { "me 1 1": "A", "opp 2 1": "X" }, { phase: "reveal" }),
    frame(28_000, 3, { "opp 2 1": "X" }, { phase: "reveal" }),
    ...run(29, 3, 4, { "me 1 1": "A", "opp 2 1": "X" }, { phase: "plan" }),
    // una lettura sbagliata in un fotogramma solo (una mia carta letta dal lato dell'avversario) non va nel cimitero
    frame(32_000, 4, { "me 1 1": "A", "opp 2 1": "X", "opp 3 1": "A" }, { phase: "reveal" }),
    ...run(33, 5, 4, { "me 1 1": "A", "opp 2 1": "X" }, { phase: "reveal" }),
    ...run(38, 3, 5, { "me 1 1": "A", "opp 2 1": "X" }, { phase: "plan" }),
  ];
  const m = reconstruct(frames, info);
  assert.deepEqual(m.graveyard, { me: [], opp: [] });
});

test("Dr. Frank riporta in campo una carta dal cimitero: non è una giocata", () => {
  const frames = [
    // round 1: l'avversario rivela X, che muore
    ...run(10, 3, 2, {}, { phase: "plan" }),
    ...run(13, 2, 2, { "opp 1 1": "X" }, { phase: "reveal" }),
    ...run(15, 6, 2, {}, { phase: "reveal" }),
    // round 2: rivela Dr. Frank, e prima del combattimento X torna
    ...run(21, 3, 3, {}, { phase: "plan" }),
    ...run(24, 2, 3, { "opp 2 1": "L_FRANK" }, { phase: "reveal" }),
    ...run(26, 6, 3, { "opp 2 1": "L_FRANK", "opp 3 2": "X" }, { phase: "reveal" }),
    // round 3: X muore di nuovo
    ...run(32, 3, 4, { "opp 2 1": "L_FRANK", "opp 3 2": "X" }, { phase: "plan" }),
    ...run(35, 6, 4, { "opp 2 1": "L_FRANK" }, { phase: "reveal" }),
    ...run(41, 3, 5, { "opp 2 1": "L_FRANK" }, { phase: "plan" }),
  ];
  const m = reconstruct(frames, info);
  assert.deepEqual(m.plays.filter((p) => !p.me).map((p) => `${p.turn} ${p.card}`), ["1 X", "2 L_FRANK"], "X giocata una volta sola");
  assert.deepEqual(m.graveyard.opp, ["X"]);
  // fermata al round 2: X è in campo, il cimitero è vuoto
  assert.deepEqual(reconstruct(frames.filter((f) => f.ms < 32_000), info).graveyard.opp, []);
  // senza Dr. Frank (o It's Alive) la carta che ricompare è una giocata nuova e la prima resta nel cimitero
  const noFrank = frames.map((f) => ({ ...f, board: f.board.map((k) => (k === "L_FRANK" ? null : k)) }));
  const n = reconstruct(noFrank, info);
  assert.equal(n.plays.filter((p) => !p.me && p.card === "X").length, 2);
});

test("It's Alive: la mia carta che torna fuori dalla pianificazione esce dal cimitero e non è giocata", () => {
  const frames = [
    // round 1: piazzo A, muore
    ...run(10, 3, 2, { "me 1 1": "A" }, { phase: "plan", hand: ["ALIVE_SB"] }),
    ...run(13, 2, 2, { "me 1 1": "A" }, { phase: "reveal", hand: ["ALIVE_SB"] }),
    ...run(15, 6, 2, {}, { phase: "reveal", hand: ["ALIVE_SB"] }),
    // round 2: gioco It's Alive (la scelgo nella pianificazione), A torna nella rivelazione
    ...run(21, 2, 3, {}, { phase: "plan", hand: ["ALIVE_SB"] }),
    ...run(23, 2, 3, {}, { phase: "plan", hand: [], spell: "ALIVE_SB" }),
    ...run(25, 2, 3, {}, { phase: "reveal", hand: [], spell: "ALIVE_SB" }),
    ...run(27, 6, 3, { "me 3 3": "A" }, { phase: "reveal", hand: [] }),
    ...run(33, 3, 4, { "me 3 3": "A" }, { phase: "plan", hand: [] }),
  ];
  const m = reconstruct(frames, info);
  assert.deepEqual(m.plays.filter((p) => p.me).map((p) => `${p.turn} ${p.card}`), ["1 A", "2 ALIVE_SB"]);
  assert.deepEqual(m.graveyard.me, []);
  assert.equal(m.drawn.A, 1, "la carta tornata dal cimitero non è una seconda copia pescata");
});

test("Koschei torna in mano, la Rinascita torna in campo, Ugly Duckling si trasforma: nessuno nel cimitero", () => {
  const frames = [
    ...run(10, 3, 2, { "opp 1 1": "KOSCHEI", "opp 2 1": "MUMMY", "opp 3 1": "DUCK" }, { phase: "plan" }),
    ...run(13, 3, 2, { "opp 1 1": "KOSCHEI", "opp 2 1": "MUMMY", "opp 3 1": "DUCK" }, { phase: "reveal" }),
    // combattimento: Koschei muore (torna in mano), Mummy muore e rinasce, Ugly Duckling diventa Beautiful Swan
    ...run(16, 3, 2, { "opp 3 1": "DUCK" }, { phase: "reveal" }),
    ...run(19, 6, 2, { "opp 2 1": "MUMMY", "opp 3 1": "T_SWAN" }, { phase: "reveal" }),
    ...run(25, 3, 3, { "opp 2 1": "MUMMY", "opp 3 1": "T_SWAN" }, { phase: "plan" }),
  ];
  assert.deepEqual(reconstruct(frames, info).graveyard.opp, []);
  // la stessa partita senza i ruoli: tutti e tre morti
  const plain = reconstruct(frames, { ...info, grave: () => null });
  assert.deepEqual(names(plain.graveyard.opp), ["DUCK", "KOSCHEI"]);
});

test("Rinascita a cavallo fra due round: la carta che ricompare prima della pianificazione torna dal cimitero", () => {
  const frames = [
    ...run(10, 3, 2, { "opp 1 1": "MUMMY" }, { phase: "plan" }),
    ...run(13, 3, 2, { "opp 1 1": "MUMMY" }, { phase: "reveal" }),
    ...run(16, 6, 2, {}, { phase: "reveal" }),
    // il round dopo comincia (mana nuovo) e Mummy ricompare prima della pianificazione
    ...run(22, 3, 3, { "opp 1 1": "MUMMY" }, { phase: "reveal" }),
    ...run(25, 3, 3, { "opp 1 1": "MUMMY" }, { phase: "plan" }),
    ...run(28, 3, 3, { "opp 1 1": "MUMMY" }, { phase: "reveal" }),
  ];
  const m = reconstruct(frames, info);
  assert.deepEqual(m.graveyard.opp, []);
  assert.equal(m.plays.filter((p) => p.card === "MUMMY").length, 1);
});

test("scarti: una carta che lascia la mia mano senza essere giocata va nel cimitero, ma solo se manca anche nella pianificazione dopo", () => {
  const frames = [
    // round 1: in mano A, B, C; gioco A; nella rivelazione C viene scartata (e per tre secondi la mano si legge male)
    ...run(10, 3, 2, {}, { phase: "plan", hand: ["A", "B", "C"] }),
    ...run(13, 2, 2, { "me 1 1": "A" }, { phase: "plan", hand: ["B", "C"] }),
    ...run(15, 3, 2, { "me 1 1": "A" }, { phase: "reveal", hand: ["B"] }),
    ...run(18, 3, 2, { "me 1 1": "A" }, { phase: "reveal", hand: [] }),
    ...run(21, 3, 2, { "me 1 1": "A" }, { phase: "reveal", hand: ["B"] }),
    // round 2: pesco D; C non c'è più
    ...run(24, 4, 3, { "me 1 1": "A" }, { phase: "plan", hand: ["B", "D"] }),
    ...run(28, 3, 3, { "me 1 1": "A" }, { phase: "reveal", hand: ["B", "D"] }),
  ];
  assert.deepEqual(reconstruct(frames, info).graveyard.me, ["C"]);
  // la stessa partita senza lo scarto: la mano letta male nel combattimento non scarta niente
  const kept = frames.map((f) => (f.ms >= 24_000 ? { ...f, hand: ["B", "C", "D"] } : f));
  assert.deepEqual(reconstruct(kept, info).graveyard.me, []);
  // e prima della pianificazione dopo lo scarto non si vede ancora
  assert.deepEqual(reconstruct(frames.filter((f) => f.ms < 24_000), info).graveyard.me, []);
});

test("scarti: una carta piazzata prima che la mano si legga non è scartata; Dracula torna in mano quando scarto", () => {
  const frames = [
    // round 1: DRAC muore sul tabellone
    ...run(10, 3, 2, { "me 1 1": "DRAC" }, { phase: "plan", hand: ["B", "C"] }),
    ...run(13, 2, 2, { "me 1 1": "DRAC" }, { phase: "reveal", hand: ["B", "C"] }),
    ...run(15, 6, 2, {}, { phase: "reveal", hand: ["B", "C"] }),
    // round 2: B la piazzo subito (la prima lettura della mano non la ha più); C viene scartata, quindi Dracula torna in mano
    ...run(21, 3, 3, { "me 2 1": "B" }, { phase: "plan", hand: ["C"] }),
    ...run(24, 3, 3, { "me 2 1": "B" }, { phase: "reveal", hand: [] }),
    ...run(27, 3, 3, { "me 2 1": "B" }, { phase: "reveal", hand: ["DRAC"] }),
    ...run(30, 3, 4, { "me 2 1": "B" }, { phase: "plan", hand: ["DRAC", "E"] }),
  ];
  const m = reconstruct(frames, info);
  assert.deepEqual(m.graveyard.me, ["C"], "B giocata, C scartata, Dracula tornato in mano");
});

test("mai più copie di quelle di un mazzo nel cimitero (letture sbagliate)", () => {
  const frames: ScanFrame[] = [];
  let t = 10;
  // tre volte la stessa carta base che compare e muore, una Leggendaria due volte
  for (let r = 0; r < 3; r++) {
    const mana = r + 2;
    frames.push(...run(t, 3, mana, {}, { phase: "plan" }), ...run(t + 3, 3, mana, { "opp 1 1": "X", "opp 2 1": "L_OPP" }, { phase: "reveal" }), ...run(t + 6, 6, mana, {}, { phase: "reveal" }));
    t += 12;
  }
  // il round dopo chiude il terzo (dal vivo una carta arrivata nel round in corso non muore prima della fine del round)
  frames.push(...run(t, 3, 5, {}, { phase: "plan" }));
  const m = reconstruct(frames, info);
  assert.deepEqual(names(m.graveyard.opp), ["L_OPP", "X", "X"]);
});

test("i round dopo il nono: il mana resta a 10, i round si contano dalle pianificazioni", () => {
  const frames: ScanFrame[] = [];
  let t = 10;
  // round 1–8 veloci, poi tre round con il mana massimo a 10
  for (let max = 2; max <= 9; max++) {
    frames.push(...run(t, PHASE_FRAMES, max, {}, { phase: "plan" }), ...run(t + PHASE_FRAMES, PHASE_FRAMES, max, {}, { phase: "reveal" }));
    t += 2 * PHASE_FRAMES;
  }
  const capped = ["A", "B", "C"];
  capped.forEach((k, i) => {
    const board = Object.fromEntries(capped.slice(0, i + 1).map((c, j) => [`me ${j + 1} 1`, c]));
    // il mana coperto nel combattimento (fotogrammi senza fase) non divide il round
    frames.push(...run(t, PHASE_FRAMES, 10, board, { phase: "plan" }), ...run(t + PHASE_FRAMES, PHASE_FRAMES, 10, board, { phase: "reveal" }), ...run(t + 2 * PHASE_FRAMES, 2, null, board));
    t += 2 * PHASE_FRAMES + 2;
  });
  const m = reconstruct(frames, info);
  assert.equal(m.turns, 11);
  assert.deepEqual(m.plays.map((p) => `${p.turn} ${p.card}`), ["9 A", "10 B", "11 C"]);
  // una pianificazione corta (meno di PHASE_FRAMES fotogrammi) o senza rivelazione prima non divide
  const short = splitByPhase([...run(0, 3, 10, {}, { phase: "plan" }), ...run(3, 3, 10, {}, { phase: "reveal" }), ...run(6, PHASE_FRAMES - 1, 10, {}, { phase: "plan" }), ...run(8, 3, 10, {}, { phase: "reveal" })]);
  assert.equal(short.length, 1);
  assert.equal(splitByPhase([...run(0, 3, 10, {}, { phase: "reveal" }), ...run(3, 3, 10, {}, { phase: "plan" })]).length, 1);
});

test("dal vivo: una carta in campo dal round prima è morta solo dopo LIVE_DEATH_MS; una arrivata adesso aspetta la fine del round", () => {
  const start = [
    ...run(10, 3, 2, { "me 1 1": "A" }, { phase: "plan" }),
    ...run(13, 4, 2, { "me 1 1": "A" }, { phase: "reveal" }),
    ...run(20, 3, 3, { "me 1 1": "A" }, { phase: "plan" }),
    ...run(23, 3, 3, { "me 1 1": "A", "me 2 1": "B" }, { phase: "reveal" }),
  ];
  const gone = Math.ceil(LIVE_DEATH_MS / 1000);
  // A e B spariscono: per meno di LIVE_DEATH_MS nessuno è morto
  const early = [...start, ...run(26, gone - 2, 3, {}, { phase: "reveal" })];
  assert.deepEqual(reconstruct(early, info).graveyard.me, []);
  // dopo, A sì (era in campo dal round 1); B, arrivata in questo round, solo a fine round
  const later = [...start, ...run(26, gone + 2, 3, {}, { phase: "reveal" })];
  assert.deepEqual(reconstruct(later, info).graveyard.me, ["A"]);
  const next = [...later, ...run(40, 3, 4, {}, { phase: "plan" })];
  assert.deepEqual(names(reconstruct(next, info).graveyard.me), ["A", "B"]);
});

test("ruoli per il cimitero: dalla tabella e dalle parole chiave", () => {
  assert.equal(graveRoleOf({ slug: "dr-frank", keywords: ["Summon", "Graveyard"] }), "reviver");
  assert.equal(graveRoleOf({ slug: "its-alive" }), "revive");
  assert.equal(graveRoleOf({ slug: "koschei", keywords: ["On Death", "Discard", "Return"] }), "hand");
  assert.equal(graveRoleOf({ slug: "mummy", keywords: ["Rebirth"] }), "rebirth");
  assert.equal(graveRoleOf({ slug: "ugly-duckling", keywords: ["Discard", "Transform"] }), "transform");
  assert.equal(graveRoleOf({ slug: "billy", keywords: ["On Death"] }), null);
  assert.deepEqual(Object.keys(GRAVE_ROLE_BY_SLUG).sort(), ["aladdin", "dr-frank", "dracula", "its-alive", "koschei"]);
});
