/**
 * Il replay delle patch della tier list (27/11/2026): `node --test src/lib/tierReplay/replay.test.ts`.
 * - Testi nelle otto lingue con le stesse chiavi e gli stessi segnaposto (tierReplayLabels.ts).
 * - La regola delle carte base (media della patch al posto del 50%) e i fotogrammi di carte e Leggendarie.
 *
 * Un hook di risoluzione aggiunge `.ts` agli import e traduce l'alias `@/`, come in theoryCraft.test.ts.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcUrl).href : specifier;
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
const labelsModule: typeof import("../tierReplayLabels") = await import("../tierReplayLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardFrames: typeof import("../../components/tierReplay/cardFrames") = await import("../../components/tierReplay/cardFrames.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const frames: typeof import("../../components/tierReplay/frames") = await import("../../components/tierReplay/frames.ts");

const { tierReplayLabels, fill } = labelsModule;
const { cardTier, buildCardReplay } = cardFrames;
const { buildReplay, isShift, whyAt } = frames;
type CardsData = Parameters<typeof buildCardReplay>[0];
type LegData = Parameters<typeof buildReplay>[0];

/** tutte le stringhe di un oggetto, per percorso */
function leaves(o: unknown, path = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof o === "string") out.set(path, o);
  else if (Array.isArray(o)) o.forEach((v, i) => leaves(v, `${path}[${i}]`).forEach((s, k) => out.set(k, s)));
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) leaves(v, path ? `${path}.${k}` : k).forEach((s, p) => out.set(p, s));
  return out;
}
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("testi del replay", () => {
  const base = leaves(tierReplayLabels.it);
  for (const [lang, l] of Object.entries(tierReplayLabels)) {
    test(`${lang}: stesse chiavi e stessi segnaposto dell'italiano, niente testo vuoto`, () => {
      const mine = leaves(l);
      assert.deepEqual([...mine.keys()].sort(), [...base.keys()].sort());
      for (const [k, v] of mine) {
        assert.ok(v.trim().length > 0 || k === "frame.changesOne", `${lang} ${k} vuoto`);
        assert.equal(holes(v), holes(base.get(k) as string), `${lang} ${k}: segnaposto diversi`);
      }
    });
  }
  test("fill lascia com'è un segnaposto senza valore", () => {
    assert.equal(fill("{a} e {b}", { a: 1 }), "1 e {b}");
  });
});

describe("regola delle carte base", () => {
  test("la media della patch al posto del 50%: S col bordo basso sopra, poi A, B a −5, C a −10, D; sotto 100 niente", () => {
    const b = 0.55;
    assert.equal(cardTier(99, 90, b), "unranked");
    assert.equal(cardTier(1000, 620, b), "S");
    assert.equal(cardTier(200, 112, b), "A");
    assert.equal(cardTier(200, 104, b), "B");
    assert.equal(cardTier(200, 94, b), "C");
    assert.equal(cardTier(200, 80, b), "D");
  });
  test("con la media al 50% è la regola delle Leggendarie", () => {
    assert.equal(cardTier(1000, 560, 0.5), "S");
    assert.equal(cardTier(100, 52, 0.5), "A");
    assert.equal(cardTier(100, 46, 0.5), "B");
    assert.equal(cardTier(100, 41, 0.5), "C");
    assert.equal(cardTier(100, 30, 0.5), "D");
  });
});

const game = {} as CardsData["cards"][number]["game"];
const patch = (id: string, date: string, games: number, baseline: number | null) => ({
  id,
  label: id,
  date,
  games,
  url: "https://example.com",
  changeCount: 0,
  events: [],
  baseline,
});

describe("fotogrammi delle carte base", () => {
  const data: CardsData = {
    locale: "it",
    trackerMissing: false,
    patches: [patch("p1", "2026-09-29", 10000, 0.6), patch("p2", "2026-11-04", 0, null), patch("p3", "2026-11-17", 5000, 0.5)],
    cards: [
      // da S (p1) a D (p3): il salto più grosso
      { slug: "a", name: "Alfa", href: "/it/cards/a", game, changes: [], notYet: [false, false, false], stats: [{ games: 1000, wins: 700 }, null, { games: 500, wins: 150 }] },
      // sempre S
      { slug: "b", name: "Beta", href: "/it/cards/b", game, changes: [], notYet: [false, false, false], stats: [{ games: 1000, wins: 700 }, null, { games: 1000, wins: 600 }] },
      // entra nel gioco con p3
      { slug: "c", name: "Gamma", href: "/it/cards/c", game, changes: [], notYet: [true, true, false], stats: [null, null, { games: 300, wins: 150 }] },
    ],
  };
  const r = buildCardReplay(data, tierReplayLabels.it);
  test("una patch senza partite non diventa un fotogramma", () => {
    assert.deepEqual(r.frames.map((f) => f.patch), ["p1", "p3"]);
  });
  test("fasce dalla media della patch, salto più grosso e carte sempre in S", () => {
    const a = r.cards.find((c) => c.slug === "a")!;
    assert.deepEqual(a.cells.map((c) => c.tier), ["S", "D"]);
    assert.ok(r.headline.includes("Alfa") && r.headline.includes("da S a D"), r.headline);
    assert.ok(r.steady?.includes("Beta") && !r.steady.includes("Alfa"), r.steady ?? "");
    assert.equal(r.headlineSlug, "a");
  });
  test("una carta non ancora nel gioco lo dice, e l'entrata fra le fasce non conta come cambio", () => {
    const c = r.cards.find((x) => x.slug === "c")!;
    assert.deepEqual(whyAt(r, c, 0), [tierReplayLabels.it.why.notYet]);
    assert.equal(isShift(r, c, 1), false);
    assert.equal(isShift(r, r.cards.find((x) => x.slug === "a")!, 1), true);
  });
});

describe("fotogrammi delle Leggendarie", () => {
  const rate = (games: number, wins: number) => ({ games, wins, r: wins / games, lo: 0.4, hi: 0.6 });
  const data = {
    locale: "it",
    officialRead: "2026-11-09",
    officialReadLabel: "9 novembre 2026",
    officialPatch: "p1",
    officialGames: 3000,
    officialNews: "/it/news/x",
    latestPatch: "p2",
    readAt: "2026-11-27T00:00:00Z",
    trackerMissing: false,
    patches: [patch("p1", "2026-11-04", 9000, null), patch("p2", "2026-11-17", 0, null)],
    legendaries: [
      {
        slug: "l",
        name: "Leggenda",
        href: "/it/cards/l",
        game,
        official: { tier: "A", ladderTier: "A", boosted: false, rate: rate(1000, 520), rank: 1, crimson: null, changedAfterCrimson: false },
        used: 3,
        usedRank: 1,
        patches: { p1: { ...rate(2000, 1200), share: 0.2, ruleTier: "S", matchups: [] } },
        changes: [],
      },
    ],
  } as unknown as LegData;
  const r = buildReplay(data, tierReplayLabels.it);
  test("il primo fotogramma è la tier list pubblicata, poi solo le patch con partite", () => {
    assert.deepEqual(r.frames.map((f) => [f.key, f.published]), [["published", true], ["p1", false]]);
    assert.deepEqual(r.cards[0].cells.map((c) => c.tier), ["A", "S"]);
  });
  test("le frasi sono in italiano e senza segnaposto rimasti", () => {
    for (const f of r.frames) for (const s of [f.label, f.title, f.lead, f.when]) assert.ok(!/\{\w+\}/.test(s), s);
    assert.ok(!/\{\w+\}/.test(r.headline), r.headline);
  });
});
