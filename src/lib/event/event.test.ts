/**
 * Test degli eventi della community (10/11/2026, Attrix Showmatch del 16/11): `node --test src/lib/event/event.test.ts`.
 * Codici e nomi Twitch uguali al blocco SQL, configurazione, orologio del giveaway, ruota dei mazzi, svizzera,
 * classifica, lettura della chat di Twitch, lettura pubblica che non mostra i talent da svelare, testi e link breve.
 * I moduli si importano fra loro senza estensione (come vuole Next): un piccolo hook di risoluzione li rende caricabili.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcRoot = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcRoot).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(spec, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const C: typeof import("./codes") = await import("./codes.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const CFG: typeof import("./config") = await import("./config.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const K: typeof import("./clock") = await import("./clock.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const E: typeof import("./engine") = await import("./engine.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const S: typeof import("./swiss") = await import("./swiss.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const CH: typeof import("./chat") = await import("./chat.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const V: typeof import("./view") = await import("./view.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const LB: typeof import("./labels") = await import("./labels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const LK: typeof import("./links") = await import("./links.ts");

type EventConfig = import("./types").EventConfig;
type EventState = import("./types").EventState;

const SQL = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const MARK = "-- ===== 10/11/2026: EVENTI DELLA COMMUNITY =====";
const BLOCK = (() => {
  const start = SQL.indexOf(MARK);
  const end = SQL.indexOf("\n-- ===== ", start + MARK.length);
  return start < 0 ? "" : SQL.slice(start, end < 0 ? undefined : end);
})();

const T0 = Date.parse("2026-11-16T18:00:00.000Z");
const MIN = 60_000;

const sampleConfig = (): Record<string, unknown> => ({
  name: "Attrix Showmatch",
  tagline: "I creator italiani di Origins TCG",
  startsAt: "2026-11-16T19:00:00+01:00",
  talent: [
    { id: "atrix", name: "Atrix", role: "host", twitch: "Atrix" },
    { id: "c1", name: "Caster Uno", role: "caster", twitch: "@caster_uno" },
    { id: "p1", name: "Uno", role: "player", twitch: "https://www.twitch.tv/p_uno" },
    { id: "p2", name: "Due", role: "player", twitch: "p_due", photo: "https://example.org/due.png", links: [{ label: "YouTube", url: "https://youtube.com/@due" }] },
    { id: "p3", name: "Tre", role: "player", twitch: "p_tre", revealAt: "2026-11-15T20:00:00+01:00" },
    { id: "p4", name: "Quattro", role: "player", twitch: "p_quattro" },
  ],
  decks: [
    { id: "rosso", name: "Rosso", code: "KGBLDCdjF8QzA=:0123abcd", color: "#E53935" },
    { id: "blu", name: "Blu", code: "KGBLDCdjF8QzB=:4567abcd", color: "#1e88e5" },
    { id: "verde", name: "Verde", code: "KGBLDCdjF8QzC=:89abcdef", color: "#43a047" },
  ],
  slots: [
    { channel: "atrix", packs: 7, minutes: 6 },
    { channel: "p_uno", packs: 10, minutes: 6 },
    { channel: "p_due", packs: 5, minutes: 6 },
  ],
});

const parsed = (): EventConfig => {
  const r = CFG.parseConfig(sampleConfig(), "strict");
  assert.deepEqual(r.errors, []);
  return r.config;
};

describe("codici e nomi Twitch", () => {
  test("alfabeto senza caratteri che si confondono, uguale al blocco SQL", () => {
    assert.equal(C.CODE_ALPHABET.length, 31);
    for (const bad of "ILO01") assert.ok(!C.CODE_ALPHABET.includes(bad), bad);
    for (const ch of C.CODE_ALPHABET) assert.ok(C.CODE_PATTERN.test(ch.repeat(10)), ch);
    assert.ok(BLOCK.includes(`alphabet constant text := '${C.CODE_ALPHABET}'`), "alfabeto del blocco SQL");
    assert.ok(BLOCK.includes(`code ~ '${C.CODE_PATTERN.source}'`), "vincolo della tabella dei codici");
    assert.ok(BLOCK.includes(`'${C.TWITCH_LOGIN_PATTERN.source}'`), "forma dei nomi Twitch nel blocco");
  });
  test("normalizza, controlla e mostra un codice", () => {
    assert.equal(C.normalizeCode(" abcde-fghjk "), "ABCDEFGHJK");
    assert.equal(C.formatCode("abcdefghjk"), "ABCDE-FGHJK");
    assert.ok(C.isCodeShape("abcde fghjk"));
    assert.ok(!C.isCodeShape("ABCDE-FGHJI"), "la I non c'è");
    assert.ok(!C.isCodeShape("ABCDE"));
  });
  test("nomi Twitch da @, indirizzo e maiuscole", () => {
    assert.equal(C.twitchLogin("@Atrix"), "atrix");
    assert.equal(C.twitchLogin("https://www.twitch.tv/CoachCrono?x=1"), "coachcrono");
    assert.equal(C.twitchLogin("twitch.tv/r0bip/videos"), "r0bip");
    assert.equal(C.twitchLogin("mario rossi"), "mario", "si prende la prima parola");
    assert.equal(C.twitchLogin("ab"), null);
    assert.equal(C.twitchLogin("nome-con-trattini"), null);
  });
});

describe("configurazione", () => {
  test("un evento scritto bene passa e si normalizza", () => {
    const c = parsed();
    assert.equal(c.talent[0].twitch, "atrix");
    assert.equal(c.talent[1].twitch, "caster_uno");
    assert.equal(c.talent[2].twitch, "p_uno");
    assert.equal(c.decks[0].color, "#e53935");
    assert.equal(c.keyword, "!codice");
    assert.equal(c.maxCodesPerUser, 1);
    assert.equal(c.mirror, "avoid");
    assert.equal(c.startsAt, "2026-11-16T18:00:00.000Z");
    assert.equal(CFG.totalPacks(c.slots), 22);
    assert.equal(CFG.totalMinutes(c.slots), 18);
  });
  test("gli errori dicono dove sono", () => {
    const bad = sampleConfig();
    (bad.talent as Record<string, unknown>[]).push({ id: "p1", name: "Doppio", role: "player" }, { id: "x", name: "Foto", role: "player", photo: "http://example.org/a.png" }, { id: "y", name: "Ruolo", role: "boss" });
    (bad.decks as Record<string, unknown>[]).push({ id: "nero", name: "Nero", code: "OM1.abc", color: "black" });
    (bad.slots as Record<string, unknown>[]).push({ channel: "a b", packs: 0, minutes: 99 });
    bad.keyword = "codice";
    bad.pairs = [["p1", "p1"], ["p1", "atrix"]];
    bad.startsAt = "domani";
    const { errors } = CFG.parseConfig(bad, "strict");
    const has = (prefix: string) => assert.ok(errors.some((e) => e.startsWith(prefix)), `${prefix} in ${errors.join(" | ")}`);
    has("talent[6].id");
    has("talent[7].photo");
    has("talent[8].role");
    has("decks[3].code");
    has("decks[3].color");
    has("slots[3].channel");
    has("slots[3].packs");
    has("slots[3].minutes");
    has("keyword");
    has("pairs[0]");
    has("pairs[1]");
    has("startsAt");
  });
  test("in lettura le voci sbagliate si scartano, ma gli slot restano al loro posto", () => {
    const raw = sampleConfig();
    (raw.slots as unknown[]).splice(1, 0, { channel: "??", packs: 3 });
    (raw.talent as Record<string, unknown>[])[3].photo = "javascript:alert(1)";
    const { config } = CFG.parseConfig(raw, "lenient");
    assert.equal(config.slots.length, 4);
    assert.equal(config.slots[1].channel, "");
    assert.equal(config.slots[2].channel, "p_uno");
    assert.equal(config.talent.find((t) => t.id === "p2")?.photo, undefined, "un indirizzo non https non diventa un link");
  });
  test("foto dei talent: un indirizzo https o un file del sito in /media/events/", () => {
    assert.equal(CFG.photoUrl("/media/events/attrix-showmatch/p-1a2b3c4d.webp"), "/media/events/attrix-showmatch/p-1a2b3c4d.webp");
    assert.equal(CFG.photoUrl("https://example.org/a.png"), "https://example.org/a.png");
    for (const bad of ["/media/events/../segreto.png", "/media/altro/x.webp", "media/events/a/b.webp", "/media/events/a/b.gif", "/media/events/a/b/c.webp", "http://example.org/a.png", "javascript:alert(1)", 5, null]) {
      assert.equal(CFG.photoUrl(bad), null, String(bad));
    }
    const raw = sampleConfig();
    (raw.talent as Record<string, unknown>[])[2].photo = "/media/events/attrix-showmatch/p-1a2b3c4d.webp";
    const { config, errors } = CFG.parseConfig(raw, "strict");
    assert.deepEqual(errors, []);
    assert.equal(config.talent[2].photo, "/media/events/attrix-showmatch/p-1a2b3c4d.webp");
  });
  test("più vincite per spettatore: da 1 a 60, con l'avviso se un account ne riscatta di meno", () => {
    const base = sampleConfig();
    assert.equal(CFG.parseConfig(base, "strict").config.maxWinsPerViewer, 1);
    const many = CFG.parseConfig({ ...base, maxWinsPerViewer: 60, maxCodesPerUser: 60 }, "strict");
    assert.deepEqual(many.errors, []);
    assert.equal(many.config.maxWinsPerViewer, 60);
    assert.deepEqual(CFG.configWarnings(many.config), []);
    assert.ok(CFG.parseConfig({ ...base, maxWinsPerViewer: 0 }, "strict").errors.some((e) => e.startsWith("maxWinsPerViewer")));
    assert.ok(CFG.parseConfig({ ...base, maxWinsPerViewer: 61 }, "strict").errors.some((e) => e.startsWith("maxWinsPerViewer")));
    const warn = CFG.configWarnings(CFG.parseConfig({ ...base, maxWinsPerViewer: 5 }, "strict").config);
    assert.ok(warn.some((w) => w.includes("maxCodesPerUser")));
  });
  test("coppie: solo giocatori, una volta ciascuno", () => {
    const raw = sampleConfig();
    raw.pairs = [["p1", "p2"], ["p3", "p4"]];
    const { config, errors } = CFG.parseConfig(raw, "strict");
    assert.deepEqual(errors, []);
    assert.deepEqual(config.pairs, [["p1", "p2"], ["p3", "p4"]]);
  });
  test("avvisi: mazzi che non bastano, canali estranei, pacchetti oltre i codici", () => {
    const c = parsed();
    c.decks = c.decks.slice(0, 1);
    c.slots.push({ channel: "estraneo", packs: 3, minutes: 6 });
    const w = CFG.configWarnings(c, 10);
    assert.ok(w.some((x) => x.includes("4 giocatori e 1 mazzi")));
    assert.ok(w.some((x) => x.includes("estraneo")));
    assert.ok(w.some((x) => x.includes("25 pacchetti ma i codici sono 10")));
  });
  test("testi puliti dai caratteri invisibili", () => {
    assert.equal(CFG.cleanText("a\u200bb\u0007c  d"), "ab c d");
    assert.equal(CFG.cleanText("riga\r\n\r\n\r\n\r\naltra", true), "riga\n\naltra");
  });
});

describe("orologio del giveaway", () => {
  const slots = [
    { channel: "a", packs: 7, minutes: 6 },
    { channel: "b", packs: 10, minutes: 6 },
    { channel: "c", packs: 5, minutes: 4 },
  ];
  test("fermo: il primo slot è il prossimo, senza orario", () => {
    const c = K.giveawayClock(slots, K.IDLE_RUN, T0);
    assert.equal(c.status, "idle");
    assert.equal(c.next?.index, 0);
    assert.equal(c.next?.startsAt, null);
  });
  test("avviato: slot in corso, minuti che restano, prossimo canale con l'orario", () => {
    const run = K.startRun(T0);
    const c = K.giveawayClock(slots, run, T0 + 2 * MIN);
    assert.equal(c.status, "running");
    assert.equal(c.index, 0);
    assert.equal(c.remainingMs, 4 * MIN);
    assert.equal(c.next?.index, 1);
    assert.equal(c.next?.startsAt, T0 + 6 * MIN);
    const c2 = K.giveawayClock(slots, run, T0 + 13 * MIN);
    assert.equal(c2.index, 2);
    assert.equal(c2.remainingMs, 3 * MIN);
    assert.equal(c2.next, null);
    assert.equal(K.giveawayClock(slots, run, T0 + 16 * MIN).status, "done");
  });
  test("pausa e ripresa spostano tutto della durata della pausa", () => {
    const run = K.startRun(T0);
    const paused = K.pauseRun(slots, run, T0 + 2 * MIN);
    const p = K.giveawayClock(slots, paused, T0 + 10 * MIN);
    assert.equal(p.status, "paused");
    assert.equal(p.index, 0);
    assert.equal(p.remainingMs, 4 * MIN);
    assert.equal(p.endsAt, null);
    const resumed = K.resumeRun(paused, T0 + 10 * MIN);
    const r = K.giveawayClock(slots, resumed, T0 + 11 * MIN);
    assert.equal(r.status, "running");
    assert.equal(r.remainingMs, 3 * MIN);
    assert.equal(K.pauseRun(slots, K.IDLE_RUN, T0), K.IDLE_RUN, "fermo: la pausa non fa niente");
  });
  test("salta: il prossimo parte adesso; dall'ultimo si chiude", () => {
    const run = K.startRun(T0);
    const s1 = K.skipRun(slots, run, T0 + MIN);
    const c = K.giveawayClock(slots, s1, T0 + MIN);
    assert.equal(c.index, 1);
    assert.equal(c.remainingMs, 6 * MIN);
    const s2 = K.skipRun(slots, K.skipRun(slots, s1, T0 + 2 * MIN), T0 + 3 * MIN);
    assert.equal(K.giveawayClock(slots, s2, T0 + 3 * MIN).status, "done");
    const fromIdle = K.skipRun(slots, K.IDLE_RUN, T0);
    assert.equal(K.giveawayClock(slots, fromIdle, T0).index, 0, "da fermo salta = avvia");
  });
  test("partenza nel futuro: il primo slot è il prossimo con l'orario", () => {
    const run = { anchor: new Date(T0 + 5 * MIN).toISOString(), anchorIndex: 0, paused: null };
    const c = K.giveawayClock(slots, run, T0);
    assert.equal(c.status, "idle");
    assert.equal(c.next?.startsAt, T0 + 5 * MIN);
  });
  test("finestre degli slot e slot di un canale", () => {
    const run = K.startRun(T0, 1);
    assert.equal(K.slotWindow(slots, run, 0), null, "prima della partenza");
    assert.deepEqual(K.slotWindow(slots, run, 2), { start: T0 + 6 * MIN, end: T0 + 10 * MIN });
    assert.deepEqual(K.slotsOfChannel([...slots, { channel: "a", packs: 1, minutes: 1 }], "a"), [0, 3]);
  });
  test("tempo che resta scritto bene", () => {
    assert.equal(K.formatRemaining(0), "0:00");
    assert.equal(K.formatRemaining(65_000), "1:05");
    assert.equal(K.formatRemaining(3_723_000), "1:02:03");
    assert.equal(K.formatRemaining(1), "0:01", "si arrotonda per eccesso");
  });
  test("lo stato letto male torna fermo", () => {
    assert.deepEqual(K.normalizeRun({ anchor: "ieri", anchorIndex: -2, paused: 3 }), K.IDLE_RUN);
  });
});

describe("ruota dei mazzi e svizzera", () => {
  test("la ruota dà prima le coppie decise, poi coppie a caso; si ferma con i mazzi o i giocatori", () => {
    const c = parsed();
    c.pairs = [["p3", "p4"]];
    let s = E.emptyState();
    const rand = E.seededRand(7);
    assert.equal(E.spinsLeft(c, s), 2);
    const r1 = E.spin(c, s, rand, T0);
    assert.ok(r1.ok);
    if (!r1.ok) return;
    assert.deepEqual(r1.assignment.players, ["p3", "p4"]);
    s = r1.state;
    const r2 = E.spin(c, s, rand, T0);
    assert.ok(r2.ok);
    if (!r2.ok) return;
    assert.deepEqual([...r2.assignment.players].sort(), ["p1", "p2"]);
    assert.notEqual(r2.assignment.deck, r1.assignment.deck);
    s = r2.state;
    assert.equal(E.spinsLeft(c, s), 0);
    const r3 = E.spin(c, s, rand, T0);
    assert.deepEqual(r3, { ok: false, error: "no_players_left" });
    const few = { ...c, decks: c.decks.slice(0, 1), pairs: [] as [string, string][] };
    const f1 = E.spin(few, E.emptyState(), rand, T0);
    assert.ok(f1.ok);
    if (f1.ok) assert.deepEqual(E.spin(few, f1.state, rand, T0), { ok: false, error: "no_decks_left" });
  });
  test("annulla l'ultimo giro solo prima dei turni", () => {
    const c = parsed();
    const r = E.spin(c, E.emptyState(), E.seededRand(1), T0);
    assert.ok(r.ok);
    if (!r.ok) return;
    const u = E.undoSpin(r.state);
    assert.ok(u.ok && u.state.assignments.length === 0);
    assert.deepEqual(E.undoSpin(E.emptyState()), { ok: false, error: "nothing_to_undo" });
    const withRound = E.nextRound(c, r.state, E.seededRand(2));
    assert.ok(withRound.ok);
    if (withRound.ok) assert.deepEqual(E.undoSpin(withRound.state), { ok: false, error: "matches_started" });
  });
  test("nuova estrazione: tutti cambiano mazzo e nessuno riprende uno già avuto", () => {
    // 8 giocatori e 4 mazzi: quattro estrazioni possibili (ognuno li gioca tutti), la quinta no
    const c = parsed();
    c.talent = Array.from({ length: 8 }, (_, i) => ({ id: `g${i + 1}`, name: `G${i + 1}`, role: "player" as const }));
    c.decks = ["rosso", "blu", "verde", "giallo"].map((id, i) => ({ id, name: id, code: "", color: ["#e53935", "#1e88e5", "#43a047", "#fdd835"][i] }));
    const rand = E.seededRand(11);
    let s = E.emptyState();
    const spinAll = () => {
      while (E.spinsLeft(c, s) > 0) {
        const r = E.spin(c, s, rand, T0);
        assert.ok(r.ok, r.ok ? "" : r.error);
        if (!r.ok) return;
        s = r.state;
      }
    };
    assert.deepEqual(E.newDraw(c, s, rand), { ok: false, error: "draw_open" });
    spinAll();
    assert.equal(E.spinsOfDraw(s, 1).length, 4);
    assert.deepEqual(E.spin(c, s, rand, T0), { ok: false, error: "no_decks_left" });
    const firstDecks = [...E.deckByPlayer(s)].sort();
    // un turno aperto blocca la nuova estrazione
    const r1 = E.nextRound(c, s, rand);
    assert.ok(r1.ok);
    if (!r1.ok) return;
    s = r1.state;
    assert.deepEqual(E.newDraw(c, s, rand), { ok: false, error: "round_open" });
    for (const m of s.matches) {
      const w = E.setWinner(s, m.id, m.a);
      assert.ok(w.ok);
      if (w.ok) s = w.state;
    }
    for (let draw = 2; draw <= 4; draw++) {
      const n = E.newDraw(c, s, rand);
      assert.ok(n.ok, n.ok ? "" : n.error);
      if (!n.ok) return;
      s = n.state;
      assert.equal(E.drawOf(s), draw);
      assert.equal(E.spinsLeft(c, s), 4, "la ruota torna piena");
      spinAll();
      const cur = E.spinsOfDraw(s, draw);
      assert.equal(new Set(cur.map((a) => a.deck)).size, 4, "ogni mazzo una volta per estrazione");
      assert.equal(new Set(cur.flatMap((a) => a.players)).size, 8, "tutti i giocatori hanno un mazzo");
      for (const [p, decks] of E.decksHad(s)) assert.equal(decks.size, draw, `${p}: un mazzo diverso a ogni estrazione`);
      for (const a of cur) for (const p of a.players) assert.equal(E.deckByPlayer(s).get(p), a.deck, "vale l'ultimo mazzo");
    }
    // nel turno 1 ognuno aveva il mazzo della prima estrazione
    assert.deepEqual([...E.deckByPlayerAt(s, 1)].sort(), firstDecks);
    assert.deepEqual(E.newDraw(c, s, rand), { ok: false, error: "no_new_deck" });
    // lo stato riletto dal database tiene estrazione e turno di ogni giro
    const again = E.normalizeState(JSON.parse(JSON.stringify(s)));
    assert.equal(E.drawOf(again), 4);
    assert.deepEqual(again.assignments, s.assignments);
  });
  test("annulla dopo la prima estrazione: il giro finché non nasce un turno, poi l'estrazione vuota si richiude", () => {
    const c = parsed();
    const rand = E.seededRand(5);
    let s = E.emptyState();
    while (E.spinsLeft(c, s) > 0) {
      const r = E.spin(c, s, rand, T0);
      assert.ok(r.ok);
      if (!r.ok) return;
      s = r.state;
    }
    const n = E.newDraw(c, s, rand);
    assert.ok(n.ok);
    if (!n.ok) return;
    // estrazione aperta e ancora vuota: "annulla" la richiude
    const closed = E.undoSpin(n.state);
    assert.ok(closed.ok && E.drawOf(closed.state) === 1 && closed.state.assignments.length === s.assignments.length);
    const sp = E.spin(c, n.state, rand, T0);
    assert.ok(sp.ok);
    if (!sp.ok) return;
    assert.equal(sp.assignment.draw, 2);
    for (const p of sp.assignment.players) assert.notEqual(E.deckByPlayer(s).get(p), sp.assignment.deck, "mazzo nuovo");
    const undone = E.undoSpin(sp.state);
    assert.ok(undone.ok && undone.state.assignments.length === s.assignments.length && E.drawOf(undone.state) === 2);
    // nato un turno dopo il giro, il giro non si annulla più
    const round = E.nextRound(c, sp.state, rand);
    assert.ok(round.ok);
    if (round.ok) assert.deepEqual(E.undoSpin(round.state), { ok: false, error: "matches_started" });
  });
  test("primo turno: tutti abbinati; dispari = un bye vinto; niente stesso mazzo quando si può", () => {
    const c = parsed();
    let s: EventState = { ...E.emptyState(), assignments: [{ deck: "rosso", players: ["p1", "p2"], at: "" }, { deck: "blu", players: ["p3", "p4"], at: "" }] };
    for (let seed = 1; seed <= 30; seed++) {
      const r = E.nextRound(c, s, E.seededRand(seed));
      assert.ok(r.ok);
      if (!r.ok) return;
      const m = r.state.matches;
      assert.equal(m.length, 2);
      for (const x of m) assert.notEqual(E.deckByPlayer(s).get(x.a), E.deckByPlayer(s).get(x.b as string), `seme ${seed}: stesso mazzo`);
    }
    const odd = { ...c, talent: [...c.talent, { id: "p5", name: "Cinque", role: "player" as const }] };
    const r = E.nextRound(odd, s, E.seededRand(3));
    assert.ok(r.ok);
    if (!r.ok) return;
    const bye = r.state.matches.find((m) => m.b === null);
    assert.ok(bye && bye.winner === bye.a, "il bye ha già il vincitore");
    s = r.state;
    assert.deepEqual(E.nextRound(odd, s, E.seededRand(4)), { ok: false, error: "round_open" });
  });
  test("risultati, classifica e secondo turno senza rivincite", () => {
    const c = parsed();
    let s = E.emptyState();
    const r1 = E.nextRound(c, s, E.seededRand(11));
    assert.ok(r1.ok);
    if (!r1.ok) return;
    s = r1.state;
    const [m1, m2] = s.matches;
    assert.deepEqual(E.setWinner(s, m1.id, "nessuno"), { ok: false, error: "bad_winner" });
    assert.deepEqual(E.setWinner(s, "r9-t9", m1.a), { ok: false, error: "unknown_match" });
    let w = E.setWinner(s, m1.id, m1.a);
    assert.ok(w.ok);
    if (!w.ok) return;
    assert.deepEqual(E.undoRound(w.state), { ok: false, error: "round_has_results" });
    w = E.setWinner(w.state, m2.id, m2.b);
    assert.ok(w.ok);
    if (!w.ok) return;
    s = w.state;
    const table = S.standings(E.playersOf(c).map((p) => p.id), s.matches);
    assert.equal(table[0].points, 3);
    assert.equal(table[2].points, 0);
    assert.equal(table[0].rank, 1);
    assert.equal(table[1].rank, 1, "a pari punti, OMW% e vittorie la stessa posizione");
    const r2 = E.nextRound(c, s, E.seededRand(12));
    assert.ok(r2.ok);
    if (!r2.ok) return;
    const round2 = r2.state.matches.filter((m) => m.round === 2);
    const before = new Set(s.matches.map((m) => [m.a, m.b].sort().join("|")));
    for (const m of round2) assert.ok(!before.has([m.a, m.b].sort().join("|")), "rivincita");
    const winners = new Set([m1.a, m2.b]);
    assert.ok(round2.some((m) => winners.has(m.a) && winners.has(m.b as string)), "i vincenti si incontrano fra loro");
    const u = E.undoRound(r2.state);
    assert.ok(u.ok && E.lastRound(u.state) === 1);
  });
  test("bye e OMW% nella classifica", () => {
    const m = [
      { id: "r1-t1", round: 1, table: 1, a: "a", b: "b", winner: "a" },
      { id: "r1-bye", round: 1, table: 2, a: "c", b: null, winner: "c" },
      { id: "r2-t1", round: 2, table: 1, a: "a", b: "c", winner: "c" },
    ];
    const rows = S.standings(["a", "b", "c"], m);
    assert.deepEqual(rows.map((r) => r.player), ["c", "a", "b"]);
    assert.equal(rows[0].byes, 1);
    assert.equal(rows[0].points, 6);
    assert.equal(rows[1].omw, S.PCT_FLOOR === 0.33 ? Math.round(((0.33 + 1) / 2) * 1e6) / 1e6 : rows[1].omw);
    assert.equal(S.pct(0.625), "62,5");
  });
  test("lo stato letto male si ripulisce", () => {
    const s = E.normalizeState({ assignments: [{ deck: "x", players: ["a", 2] }, { deck: "y", players: ["b"] }], matches: [{ id: "r1-t1", round: 1, table: 1, a: "a", b: "b", winner: "z" }, { nope: true }], giveaway: null });
    assert.equal(s.assignments.length, 1);
    assert.equal(s.matches.length, 1);
    assert.equal(s.matches[0].winner, null, "un vincitore che non gioca la partita si toglie");
    assert.deepEqual(s.giveaway, K.IDLE_RUN);
  });
});

describe("chat di Twitch", () => {
  test("messaggio con i tag e il nome mostrato", () => {
    const m = CH.parseChatLine("@badge-info=;color=#FF0000;display-name=Mario\\sRossi;mod=0 :mario_rossi!mario_rossi@mario_rossi.tmi.twitch.tv PRIVMSG #atrix :!codice\r\n");
    assert.deepEqual(m, { login: "mario_rossi", displayName: "Mario Rossi", channel: "atrix", text: "!codice" });
    assert.equal(CH.parseChatLine(":tmi.twitch.tv 001 justinfan123 :Welcome"), null);
    assert.ok(CH.isPing("PING :tmi.twitch.tv"));
  });
  test("partecipa chi scrive il comando come prima parola", () => {
    assert.ok(CH.isEntry("!codice", "!codice"));
    assert.ok(CH.isEntry("  !Codice pls", "!codice"));
    assert.ok(CH.isEntry("!codice\u200b", "!codice"), "carattere invisibile in fondo");
    assert.ok(!CH.isEntry("voglio il !codice", "!codice"));
    assert.ok(!CH.isEntry("!codice2", "!codice"));
  });
  test("niente bot né il proprietario del canale", () => {
    assert.ok(!CH.canEnter("nightbot", "atrix"));
    assert.ok(!CH.canEnter("atrix", "atrix"));
    assert.ok(CH.canEnter("mario", "atrix"));
  });
  test("estrazione: nomi diversi, senza gli esclusi, mai più dei partecipanti", () => {
    const list = ["a", "b", "c", "a", "d", "e"];
    const w = CH.drawWinners(list, 3, E.seededRand(5), new Set(["e"]));
    assert.equal(w.length, 3);
    assert.equal(new Set(w).size, 3);
    assert.ok(!w.includes("e"));
    assert.equal(CH.drawWinners(["a"], 5, E.seededRand(1)).length, 1);
    assert.deepEqual(CH.drawWinners([], 5, E.seededRand(1)), []);
  });
  test("collegamento anonimo in sola lettura", () => {
    const h = CH.ircHandshake("atrix", 42);
    assert.equal(h[1], "PASS SCHMOOPIIE");
    assert.match(h[2], /^NICK justinfan\d+$/);
    assert.equal(h[3], "JOIN #atrix");
  });
});

describe("lettura pubblica", () => {
  test("i talent da svelare restano nascosti e al loro posto; gli slot pure", () => {
    const raw = {
      slug: "attrix-showmatch",
      version: 3,
      now: "2026-11-14T10:00:00Z",
      stats: { codes: 150, assigned: 0, redeemed: 0 },
      state: { assignments: [], matches: [], giveaway: { anchor: null, anchorIndex: 0, paused: null } },
      config: {
        ...sampleConfig(),
        talent: [
          { id: "p1", name: "Uno", role: "player", twitch: "p_uno" },
          { id: "hidden-2", role: "player", hidden: true, revealAt: "2026-11-15T19:00:00Z" },
          { id: "p3", name: "Tre", role: "player", photo: "http://example.org/x.png" },
        ],
        slots: [
          { channel: "p_uno", packs: 10, minutes: 6 },
          { channel: "", packs: 5, minutes: 6 },
        ],
      },
    };
    const ev = V.parsePublicEvent(raw);
    assert.ok(ev);
    if (!ev) return;
    assert.equal(ev.config.talent.length, 3);
    assert.deepEqual(ev.config.talent[1], { id: "hidden-2", role: "player", hidden: true, revealAt: "2026-11-15T19:00:00.000Z" });
    assert.equal((ev.config.talent[2] as { photo?: string }).photo, undefined);
    assert.deepEqual(ev.config.slots.map((s) => s.channel), ["p_uno", ""]);
    assert.ok(!("pairs" in ev.config));
    assert.equal(V.parsePublicEvent({ nope: 1 }), null);
    assert.deepEqual(V.talentOfRole([ev.config.talent[1], ev.config.talent[0]], "player").map((t) => t.id), ["p1", "hidden-2"], "i nascosti in fondo");
  });
});

describe("blocco SQL", () => {
  test("c'è, ha tutte le funzioni e i permessi giusti", () => {
    assert.ok(BLOCK.length > 1000, "blocco 10/11/2026: EVENTI DELLA COMMUNITY");
    const grantTo = (fn: string) => {
      const m = new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to ([a-z, ]+);`).exec(BLOCK);
      return m ? m[1].split(",").map((x) => x.trim()).sort() : [];
    };
    assert.deepEqual(grantTo("community_event_public"), ["anon", "authenticated"]);
    assert.deepEqual(grantTo("community_event_redeem"), ["authenticated"]);
    assert.deepEqual(grantTo("community_event_my_codes"), ["authenticated"]);
    assert.deepEqual(grantTo("community_event_create"), ["authenticated"]);
    assert.deepEqual(grantTo("community_event_forget"), ["authenticated"]);
    for (const fn of ["community_event_ts", "community_event_can_control", "community_event_new_code"]) {
      assert.ok(new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from public, anon, authenticated;`).test(BLOCK), fn);
      assert.deepEqual(grantTo(fn), [], `${fn} non si chiama da fuori`);
    }
    for (const t of ["community_events", "community_event_mods", "community_event_codes", "community_event_redeem_fails"]) {
      assert.ok(BLOCK.includes(`alter table public.${t} enable row level security;`), `${t}: RLS`);
      assert.ok(BLOCK.includes(`revoke all on public.${t} from anon, authenticated;`), `${t}: chiusa`);
    }
    assert.ok(!/on public\.profiles/.test(BLOCK.replace(/references public\.profiles/g, "")), "nessuna grant né revoke su public.profiles");
    assert.ok(/security definer/.test(BLOCK));
  });
  test("più vincite: una per passaggio nel vincolo, il tetto da maxWinsPerViewer", () => {
    assert.ok(BLOCK.includes("create unique index if not exists community_event_codes_winner_slot_idx on public.community_event_codes (slug, slot, winner_hash)"));
    assert.ok(BLOCK.includes("drop constraint if exists community_event_codes_slug_winner_hash_key"), "il vincolo di prima si toglie dove c'era");
    assert.ok(!BLOCK.includes("unique (slug, winner_hash)"), "niente più una vincita a persona in tutto l'evento");
    assert.equal(BLOCK.split("maxWinsPerViewer").length - 1 >= 4, true, "assign e swap leggono il tetto dalla configurazione");
    assert.equal(CFG.LIMITS.maxWinsPerViewer <= 99 && CFG.LIMITS.maxCodesPerUser <= 99, true, "l'SQL legge numeri di una o due cifre");
  });
  test("le funzioni del blocco sono nei tipi del database", () => {
    const types = readFileSync(new URL("../supabase/database.ts", import.meta.url), "utf8");
    const fns = [...BLOCK.matchAll(/create or replace function public\.(community_event_[a-z_]+)\(/g)].map((m) => m[1]);
    const internal = new Set(["community_event_ts", "community_event_can_control", "community_event_new_code"]);
    for (const fn of fns.filter((f) => !internal.has(f))) assert.ok(types.includes(`${fn}:`), fn);
  });
});

describe("testi e link", () => {
  test("ogni errore del motore e ogni esito del riscatto ha il suo testo", () => {
    const engineErrors = ["no_decks_left", "no_players_left", "no_new_deck", "draw_open", "nothing_to_undo", "matches_started", "round_open", "not_enough_players", "round_has_results", "unknown_match", "bad_winner"];
    for (const e of engineErrors) assert.ok((LB.eventLabels.control.errors as Record<string, string>)[e], e);
    for (const r of ["ok", "mine", "taken", "invalid", "limit", "too_many", "closed", "not_logged_in", "unavailable"]) assert.ok((LB.eventLabels.redeem.result as Record<string, string>)[r], r);
    for (const s of ["ok", "dup", "full", "none", "invalid"]) assert.ok((LB.eventLabels.mod.status as Record<string, string>)[s], s);
    assert.equal(LB.fillEvent("{a} e {b} {c}", { a: 1, b: "x" }), "1 e x {c}");
  });
  test("il link breve è lo stesso in next.config.ts", () => {
    const conf = readFileSync(new URL("../../../next.config.ts", import.meta.url), "utf8");
    for (const [slug, path] of Object.entries(LK.EVENT_SHORT_PATHS)) {
      assert.ok(conf.includes(`{ source: "${path}", destination: "${LK.eventPath(slug)}", permanent: false }`), path);
    }
    assert.equal(LK.eventShortLink("attrix-showmatch"), "originsmeta.com/showmatch");
    assert.equal(LK.eventShortLink("altro"), "originsmeta.com/it/events/altro");
  });
  test("un evento online ma non annunciato resta nascosto", () => {
    assert.equal(LK.eventAnnounced("un-evento-qualunque"), false);
    const page = readFileSync(new URL("../../app/[locale]/(site)/events/[slug]/page.tsx", import.meta.url), "utf8");
    assert.ok(page.includes("noindex: !eventAnnounced(slug)"), "la pagina di un evento non annunciato è noindex");
    // menu, footer, calendario, sitemap, popup dei tornei, informativa e llms.txt non ne scrivono l'indirizzo né il nome
    const places = ["../../components/Header.tsx", "../../components/Footer.tsx", "../data/events.ts", "../sitemapEntries.ts", "../tournamentPromo.ts", "../eventPrivacy.ts", "../../../public/llms.txt"];
    for (const [slug, short] of Object.entries(LK.EVENT_SHORT_PATHS)) {
      if (LK.eventAnnounced(slug)) continue;
      const words = [`events/${slug}`, short, slug.replace(/-/g, " ")];
      for (const place of places) {
        const text = readFileSync(new URL(place, import.meta.url), "utf8").toLowerCase();
        for (const w of words) assert.ok(!text.includes(w.toLowerCase()), `${place}: ${w}`);
      }
    }
  });
});
