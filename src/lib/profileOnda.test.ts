/**
 * Test della pagina /u nella grafica «In onda» (27/11/2026): `node --test src/lib/profileOnda.test.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { VS_MIN_GAMES, listSig, listTotals, mostUsedLegendary, playedLists, vsMeta } from "./profileOnda.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { THIN_GAMES } from "./tracker/snapshot.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ondaLabels, pluralOnda, type OndaLabels } from "./profileOndaLabels.ts";

const deck = (legendary: string | null, cards: string[], winrate: { games: number; wins: number } | null) => ({ legendary, cards, winrate });

describe("liste e totali", () => {
  test("la firma non dipende dall'ordine delle carte", () => {
    assert.equal(listSig(deck("glinda", ["a", "b", "b"], null)), listSig(deck("glinda", ["b", "a", "b"], null)));
    assert.notEqual(listSig(deck("glinda", ["a"], null)), listSig(deck("merlin", ["a"], null)));
  });
  test("una lista con due mazzi conta una volta, senza partite non conta", () => {
    const decks = [deck("g", ["a", "b"], { games: 10, wins: 6 }), deck("g", ["b", "a"], { games: 10, wins: 6 }), deck("m", ["c"], { games: 4, wins: 1 }), deck("x", ["d"], null)];
    assert.equal(playedLists(decks).length, 2);
    assert.deepEqual(listTotals(decks), { games: 14, wins: 7 });
  });
});

describe("contro il meta", () => {
  test("le sue liste contro le altre della stessa Leggendaria", () => {
    const rows = vsMeta([deck("g", ["a"], { games: 40, wins: 26 })], [{ legendary: "g", games: 140, wins: 76 }]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0].others, { games: 100, wins: 50 });
    assert.equal(rows[0].diff, 15);
    assert.equal(rows[0].verdict, "better");
  });
  test("senza altre partite niente riga; poche partite niente verdetto", () => {
    assert.equal(vsMeta([deck("g", ["a"], { games: 40, wins: 26 })], [{ legendary: "g", games: 40, wins: 26 }]).length, 0);
    assert.equal(vsMeta([deck("g", ["a"], { games: 5, wins: 4 })], [{ legendary: "g", games: 100, wins: 50 }])[0].verdict, "thin");
    assert.equal(vsMeta([deck("g", ["a"], { games: 50, wins: 25 })], [{ legendary: "g", games: 60, wins: 30 }])[0].verdict, "thin");
  });
  test("in linea sotto i due punti", () => {
    assert.equal(vsMeta([deck("g", ["a"], { games: 100, wins: 51 })], [{ legendary: "g", games: 200, wins: 101 }])[0].verdict, "even");
  });
  test("la soglia è quella di /analytics", () => {
    assert.equal(VS_MIN_GAMES, THIN_GAMES);
  });
});

test("Leggendaria più usata", () => {
  assert.equal(mostUsedLegendary([{ legendary: "a" }, { legendary: "b" }, { legendary: "b" }, { legendary: null }]), "b");
  assert.equal(mostUsedLegendary([{ legendary: null }]), null);
});

describe("testi nelle otto lingue", () => {
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const flat = (o: unknown, path = ""): [string, string][] =>
    typeof o === "string" ? [[path, o]] : Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flat(v, path ? `${path}.${k}` : k));
  const base = new Map(flat(ondaLabels.en));
  for (const [locale, labels] of Object.entries(ondaLabels) as [string, OndaLabels][]) {
    test(`${locale}: stesse chiavi e stessi segnaposto dell'inglese`, () => {
      const mine = new Map(flat(labels));
      for (const [key, text] of base) {
        if (key.startsWith("games.") || key.startsWith("votes.")) continue;
        assert.ok(mine.has(key), `${locale} senza ${key}`);
        assert.deepEqual(placeholders(mine.get(key)!), placeholders(text), `${locale} ${key}`);
      }
      for (const key of mine.keys()) if (!key.startsWith("games.") && !key.startsWith("votes.")) assert.ok(base.has(key), `${locale} ha in più ${key}`);
      for (const form of Object.values({ ...labels.games, ...labels.votes })) assert.ok(form.includes("{n}"), `${locale}: plurale senza {n}`);
    });
  }
  test("mai il numero di giocatori né bot", () => {
    const all = Object.values(ondaLabels).flatMap((l) => flat(l).map(([, t]) => t.toLowerCase()));
    for (const t of all) assert.ok(!/giocator|players|\bbot\b|umano|human/.test(t), t);
  });
  test("plurali", () => {
    assert.equal(pluralOnda("it", 1, ondaLabels.it.games), "1 partita");
    assert.equal(pluralOnda("ru", 3, ondaLabels.ru.games), "3 партии");
    assert.equal(pluralOnda("ru", 5, ondaLabels.ru.games), "5 партий");
    assert.equal(pluralOnda("zh-cn", 2, ondaLabels["zh-cn"].games), "2 局");
    assert.equal(pluralOnda("en", 1200, ondaLabels.en.games, "1,200"), "1,200 games");
  });
});
