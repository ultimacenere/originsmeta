/**
 * Test del bot del draft (`bot.ts`, `ratings.ts`) sul pool vero della demo, con il runner integrato di Node:
 * `node --test src/lib/draft/bot.test.ts`. Il database carte è scritto per Next (import senza estensione, alias `@/`,
 * JSON senza attributi): come in cardTitles.test.ts, un piccolo hook di risoluzione dei moduli lo rende caricabile.
 *
 * Il test della forza è una simulazione: il bot contro un drafter a caso e contro un drafter "goloso" (prende sempre la
 * carta col voto più alto e costruisce con le 12 migliori per voto), su molti semi e in tutti i formati. Il metro è il
 * punteggio del mazzo del bot stesso (`deckScore`), quindi dice che il bot sfrutta bene sinergie, curva e negazione
 * rispetto a chi guarda solo il valore delle carte: la prova vera restano le partite.
 */
import * as nodeModule from "node:module";
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
const { RATINGS }: typeof import("./ratings") = await import("./ratings.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { draftPool }: typeof import("./pool") = await import("./pool.ts");

type DraftState = import("./engine").DraftState;
type DraftAction = import("./engine").DraftAction;
type Seat = import("./engine").Seat;
type Drafter = (s: DraftState, seat: Seat, rand: () => number) => DraftAction;

const pool = draftPool();
const kit = B.botKit(pool);
const bot: Drafter = (s, seat) => B.botAction(s, seat, kit);
const random: Drafter = (s, seat, rand) => {
  const p = s.seats[seat].pending!;
  if (p.kind === "build") return { seat, type: "build", legendary: s.seats[seat].legendaries[0], cards: E.shuffle(s.seats[seat].pool, rand).slice(0, 12) };
  const o = E.shuffle(p.options, rand);
  if (p.kind === "keepGive") return { seat, type: "keepGive", keep: o[0], give: o[1] };
  return { seat, type: "pick", card: o[0] };
};
const r = (c: string) => kit.info(c).r;
const greedy: Drafter = (s, seat) => {
  const p = s.seats[seat].pending!;
  if (p.kind === "build") {
    return { seat, type: "build", legendary: [...s.seats[seat].legendaries].sort((a, b) => r(b) - r(a))[0], cards: [...s.seats[seat].pool].sort((a, b) => r(b) - r(a)).slice(0, 12) };
  }
  const o = [...p.options].sort((a, b) => r(b) - r(a));
  if (p.kind === "keepGive") return { seat, type: "keepGive", keep: o[0], give: o[o.length - 1] };
  return { seat, type: "pick", card: o[0] };
};

function play(format: import("./engine").DraftFormat, seed: number, a: Drafter, b: Drafter): { state: DraftState; scores: number[] } {
  let s = E.createDraft(format, seed, pool);
  const rand = E.rng(seed ^ 0x5bd1e995);
  const ds = [a, b];
  for (let guard = 0; s.phase !== "done"; guard++) {
    assert.ok(guard < 500, "il draft non finisce");
    const seat = E.waitingFor(s)[0];
    const res = E.applyAction(s, ds[seat](s, seat, rand));
    assert.ok("state" in res, `mossa rifiutata: ${"error" in res ? res.error : ""}`);
    s = res.state;
  }
  return { state: s, scores: s.seats.map((x) => B.deckScore(kit, x.deck!.legendary, x.deck!.cards).score) };
}

describe("voti delle carte", () => {
  test("ogni carta giocabile ha il suo voto, e nessun voto è di una carta che non c'è più", () => {
    const slugs = new Set(pool.map((c) => c.slug));
    const missing = pool.filter((c) => !RATINGS[c.slug]).map((c) => c.slug);
    assert.deepEqual(missing, [], "carte nuove senza voto: aggiungerle in ratings.ts");
    const stale = Object.keys(RATINGS).filter((s) => !slugs.has(s));
    assert.deepEqual(stale, [], "voti di carte non più giocabili: toglierli da ratings.ts");
  });
  test("voti fra 0 e 10, Leggendarie segnate come tali", () => {
    for (const c of pool) {
      const v = RATINGS[c.slug].r;
      assert.ok(v >= 0 && v <= 10, `${c.slug}: ${v}`);
    }
    assert.equal(pool.filter((c) => c.legendary).length, 11);
  });
});

describe("il bot gioca secondo le regole", () => {
  for (const format of E.DRAFT_FORMATS) {
    test(`${format}: 25 draft completi contro se stesso, mosse sempre valide`, () => {
      for (let seed = 1; seed <= 25; seed++) play(format, seed * 31, bot, bot);
    });
  }
  test("stesso stato, stessa mossa", () => {
    const s = E.createDraft("triple", 99, pool);
    const seat = E.waitingFor(s)[0];
    assert.deepEqual(B.botAction(s, seat, kit), B.botAction(s, seat, kit));
  });
  test("non sbircia: le carte nascoste dell'avversario non cambiano la sua scelta", () => {
    for (const format of ["exchange", "packs"] as const) {
      let s = E.createDraft(format, 4242, pool);
      for (let i = 0; i < 14; i++) s = (E.applyAction(s, bot(s, E.waitingFor(s)[0], Math.random)) as { state: DraftState }).state;
      const seat = E.waitingFor(s)[0];
      const opp = seat === 0 ? 1 : 0;
      const peek = JSON.parse(JSON.stringify(s)) as DraftState;
      // l'avversario "ha" altre carte nel pool: quelle che il bot non ha visto passare
      const hidden = s.seats[opp].pool.filter((c) => !s.seats[seat].given.includes(c));
      peek.seats[opp].pool = [...s.seats[opp].pool.filter((c) => !hidden.includes(c)), ...pool.filter((c) => !c.legendary).slice(0, hidden.length).map((c) => c.slug)];
      assert.deepEqual(B.botAction(peek, seat, kit), B.botAction(s, seat, kit), format);
    }
  });
});

describe("il bot è forte", () => {
  const N = 60;
  // soglie prudenti rispetto alle prove del 02/10/2026 (su 150 semi: 100% contro il caso; contro il goloso 67%
  // nello Scambio, 83% nel Tris, 88% nelle Buste): se il bot peggiora, il test se ne accorge
  const minVsGreedy: Record<string, number> = { exchange: 0.55, triple: 0.7, packs: 0.75 };
  for (const format of E.DRAFT_FORMATS) {
    test(`${format}: batte sempre il drafter a caso e quasi sempre quello goloso`, () => {
      let vsRandom = 0;
      let vsGreedy = 0;
      for (let seed = 1; seed <= N; seed++) {
        if (play(format, seed * 7919, bot, random).scores.reduce((a, b) => a - b) > 0) vsRandom++;
        if (play(format, seed * 7919, bot, greedy).scores.reduce((a, b) => a - b) > 0) vsGreedy++;
      }
      assert.equal(vsRandom, N);
      assert.ok(vsGreedy / N >= minVsGreedy[format], `contro il goloso solo ${vsGreedy}/${N}`);
    });
  }
});

describe("giudizio del Cervello", () => {
  test("i mazzi del bot prendono quasi sempre almeno B, quelli a caso quasi mai", () => {
    const grades = { bot: [] as string[], random: [] as string[] };
    for (let seed = 1; seed <= 40; seed++) {
      const { state } = play("triple", seed * 13, bot, random);
      for (const [who, seat] of [["bot", 0], ["random", 1]] as const) {
        const d = state.seats[seat].deck!;
        grades[who].push(B.deckReport(kit, d.legendary, d.cards).grade);
      }
    }
    const atLeastB = (g: string[]) => g.filter((x) => x === "S" || x === "A" || x === "B").length / g.length;
    assert.ok(atLeastB(grades.bot) >= 0.8, `bot: ${grades.bot.join("")}`);
    assert.ok(atLeastB(grades.random) <= 0.1, `a caso: ${grades.random.join("")}`);
  });
  test("il rapporto conta curva, rimozioni e carte da 2", () => {
    const { state } = play("packs", 5, bot, bot);
    const d = state.seats[0].deck!;
    const rep = B.deckReport(kit, d.legendary, d.cards);
    assert.equal(rep.curve.reduce((a, b) => a + b), 12);
    assert.equal(rep.early, rep.curve[0] + rep.curve[1]);
    assert.ok(rep.removal >= 2, "il bot costruisce con almeno due rimozioni");
  });
});
