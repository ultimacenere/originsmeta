/**
 * Test del draft online (fase 2): `node --test src/lib/draft/online.test.ts`. Le Server Action non si provano qui (vogliono
 * il database): si provano le regole pure che usano, cioè la vista per posto (`viewFor` di engine.ts: niente carte
 * future né nascoste), il Cervello a tempo scaduto e per chi lascia (`online.ts`), i codici delle stanze, e che codice
 * e SQL del blocco DRAFT ONLINE di schema.sql dicano le stesse cose. Hook dei moduli come in bot.test.ts.
 */
import * as nodeModule from "node:module";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

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
    const resolved = next(spec, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const E: typeof import("./engine") = await import("./engine.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const B: typeof import("./bot") = await import("./bot.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const O: typeof import("./online") = await import("./online.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { draftPool }: typeof import("./pool") = await import("./pool.ts");

type DraftState = import("./engine").DraftState;
type Seat = import("./engine").Seat;

const pool = draftPool();
const kit = B.botKit(pool);
const other = (s: Seat): Seat => (s === 0 ? 1 : 0);

/** Tutti gli slug veri che compaiono in una vista (i segnaposto no). */
function slugsIn(view: DraftState): Set<string> {
  const out = new Set<string>();
  const known = new Set(pool.map((c) => c.slug));
  JSON.stringify(view, (_k, v) => {
    if (typeof v === "string" && known.has(v)) out.add(v);
    return v;
  });
  return out;
}

/** Gioca un draft bot contro bot e, a ogni passo e per ogni posto, controlla la vista. */
function checkViews(format: import("./engine").DraftFormat, seed: number) {
  let s = E.createDraft(format, seed, pool);
  for (let guard = 0; s.phase !== "done"; guard++) {
    assert.ok(guard < 500);
    for (const seat of [0, 1] as Seat[]) {
      const v = E.viewFor(s, seat);
      const opp = other(seat);
      const where = `${format} seme ${seed}, passo ${guard}, posto ${seat}`;
      assert.equal(v.seed, 0, `${where}: seme visibile`);
      assert.deepEqual([v.deckBase, v.deckLegendary, v.sealed], [[], [], []], `${where}: mazzi da distribuire visibili`);
      const seen = slugsIn(v);
      // nessuna carta ancora da distribuire
      const future = [...s.deckBase, ...s.deckLegendary, ...s.sealed.flat()].filter((c) => seen.has(c));
      assert.deepEqual(future, [], `${where}: carte future nella vista`);
      assert.equal(v.seats[opp].deck, null, `${where}: mazzo dell'avversario visibile prima della fine`);
      const oppPending = s.seats[opp].pending;
      const shared = format !== "exchange" && (s.phase === "legendary" || format === "triple") && s.table.length > 0;
      if (oppPending && oppPending.kind !== "build" && !shared) {
        const leaked = oppPending.options.filter((c) => seen.has(c) && !s.seats[seat].pool.includes(c) && !(s.seats[seat].pending && "options" in s.seats[seat].pending! && (s.seats[seat].pending as { options: string[] }).options.includes(c)));
        assert.deepEqual(leaked, [], `${where}: opzioni dell'avversario visibili`);
      }
      if (format === "packs" && s.phase === "main") {
        const hiddenPool = s.seats[opp].pool.filter((c) => seen.has(c));
        assert.deepEqual(hiddenPool, [], `${where}: scelte dell'avversario visibili nelle Buste`);
        assert.ok(v.seats[opp].pool.every((c) => c === E.HIDDEN));
      }
      if (format === "exchange") {
        const delivered = new Set(s.seats[seat].given.filter((c) => c !== s.seats[seat].outbox));
        const kept = s.seats[opp].pool.filter((c) => !delivered.has(c) && seen.has(c) && !s.seats[seat].pool.includes(c));
        assert.deepEqual(kept, [], `${where}: carte tenute dall'avversario visibili`);
        assert.ok(v.seats[opp].legendaries.every((c) => c === E.HIDDEN), `${where}: Leggendaria dell'avversario visibile`);
        const out = s.seats[opp].outbox;
        if (out) assert.ok(!seen.has(out) || s.seats[seat].pool.includes(out), `${where}: regalo del giro visibile prima della fine del giro`);
      }
    }
    const seat = E.waitingFor(s)[0];
    s = (E.applyAction(s, B.botAction(s, seat, kit)) as { state: DraftState }).state;
  }
  // a draft finito si vede tutto
  const end = E.viewFor(s, 0);
  assert.deepEqual(end.seats[1].deck, s.seats[1].deck);
  assert.equal(end.seed, s.seed);
}

describe("vista per posto: niente carte future né nascoste", () => {
  for (const format of E.DRAFT_FORMATS) {
    test(`${format}: tre draft interi controllati passo per passo`, () => {
      for (const seed of [11, 222, 3333]) checkViews(format, seed);
    });
  }
  test("Tris: tutto sul tavolo, anche le scelte dell'avversario", () => {
    let s = E.createDraft("triple", 5, pool, 0);
    for (let i = 0; i < 6; i++) s = (E.applyAction(s, B.botAction(s, E.waitingFor(s)[0], kit)) as { state: DraftState }).state;
    const v = E.viewFor(s, 0);
    assert.deepEqual(v.seats[1].pool, s.seats[1].pool);
    assert.deepEqual(v.seats[1].legendaries, s.seats[1].legendaries);
  });
});

describe("il Cervello subentra", () => {
  const T0 = 1_000_000;
  test("a tempo scaduto sceglie per chi è in ritardo, e la decisione nuova ha il suo tempo intero", () => {
    const st = O.startOnline(E.createDraft("triple", 9, pool, 0), T0);
    assert.equal(st.deadline, T0 + O.TIMERS.legendary * 1000);
    // prima della scadenza non succede niente
    assert.deepEqual(O.autoplay(st, T0 + 1000, kit), st);
    const late = T0 + O.TIMERS.legendary * 1000 + 1;
    const after = O.autoplay(st, late, kit);
    // il primo era in ritardo: ha scelto il Cervello; il secondo ha il suo turno con il tempo intero
    assert.equal(after.draft.seats[0].legendaries.length, 1);
    assert.ok(after.draft.seats[1].pending);
    assert.equal(after.deadline, late + O.TIMERS.legendary * 1000);
  });
  test("una mossa arrivata dopo la scadenza non vale: ha già scelto il Cervello", () => {
    const st = O.startOnline(E.createDraft("exchange", 4, pool), T0);
    const p = st.draft.seats[0].pending as { options: string[] };
    const late = T0 + O.TIMERS.legendary * 1000 + 5;
    const res = O.playOnline(st, 0, { seat: 0, type: "pick", card: p.options[0] }, late, kit);
    assert.ok("error" in res && res.error === "notYourTurn");
  });
  test("chi lascia: il Cervello sceglie per lui e l'altro finisce il draft da solo", () => {
    let st = O.leaveOnline(O.startOnline(E.createDraft("packs", 77, pool), T0), 1, T0, kit);
    let now = T0;
    for (let guard = 0; st.draft.phase !== "done"; guard++) {
      assert.ok(guard < 200, "il draft non finisce");
      assert.equal(st.draft.seats[1].pending, null, "il posto lasciato non deve mai restare in attesa");
      now += 1000;
      const res = O.playOnline(st, 0, B.botAction(st.draft, 0, kit), now, kit);
      assert.ok("state" in res, "error" in res ? res.error : "");
      st = res.state;
    }
    assert.ok(st.draft.seats[1].deck);
    assert.equal(st.deadline, null);
  });
  test("il posto lo decide il server: quello scritto nella mossa non conta", () => {
    const st = O.startOnline(E.createDraft("exchange", 8, pool), T0);
    const p = st.draft.seats[1].pending as { options: string[] };
    const res = O.playOnline(st, 1, { seat: 0, type: "pick", card: p.options[0] }, T0 + 10, kit);
    assert.ok("state" in res);
    assert.deepEqual(res.state.draft.seats[1].legendaries, [p.options[0]]);
    assert.deepEqual(res.state.draft.seats[0].legendaries, []);
  });
  test("la vista online porta scadenza, chi ha lasciato e il posto", () => {
    const st = O.startOnline(E.createDraft("triple", 3, pool), T0);
    const v = O.onlineView(st, 1);
    assert.equal(v.seat, 1);
    assert.equal(v.deadline, st.deadline);
    assert.equal(v.draft.seed, 0);
  });
});

describe("codici, errori e SQL", () => {
  test("codici delle stanze", () => {
    for (let i = 0; i < 200; i++) assert.match(O.newRoomCode(), O.ROOM_CODE_RE);
    assert.equal(O.normalizeRoomCode(" abc-def "), "ABCDEF");
    assert.equal(O.normalizeRoomCode("ABCDE0"), null, "lo zero non c'è nell'alfabeto");
    assert.equal(O.normalizeRoomCode("ABCDEFG"), null);
  });
  test("errori del database", () => {
    assert.equal(O.roomErrorCode({ code: "PGRST202", message: "x" }), "unavailable");
    assert.equal(O.roomErrorCode({ code: "P0001", message: "rate_limited" }), "rate_limited");
    assert.equal(O.roomErrorCode({ code: "P0001", message: "not_drafting" }), "finished");
    assert.equal(O.roomErrorCode({ code: "P0001", message: "boh" }), "db");
  });
  test("codice e SQL dicono le stesse cose (codice della stanza, formati, tetto delle stanze)", () => {
    const sql = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
    const block = sql.slice(sql.indexOf("-- ===== 02/10/2026: DRAFT ONLINE ====="));
    assert.ok(block.length > 1000, "manca il blocco DRAFT ONLINE");
    assert.ok(block.includes(`code ~ '${O.ROOM_CODE_RE.source}'`), "regola del codice diversa dall'SQL");
    assert.ok(block.includes(`format in (${E.DRAFT_FORMATS.map((f) => `'${f}'`).join(", ")})`), "formati diversi dall'SQL");
    for (const fn of ["draft_room_create", "draft_room_get", "draft_room_join", "draft_room_put", "draft_rooms_cleanup"]) {
      assert.ok(block.includes(`create or replace function public.${fn}(`), fn);
    }
    // tutte le funzioni dei giocatori vogliono il segreto e la sessione
    assert.equal((block.match(/public\.draft_server_ok\(p_key\)/g) ?? []).length, 4);
    // lo stato non si legge mai direttamente
    assert.ok(/revoke all on public\.draft_room_states from anon, authenticated;/.test(block));
    assert.ok(!/grant [^;]*on public\.draft_room_states/.test(block));
  });
});
