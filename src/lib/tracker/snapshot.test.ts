/**
 * Test dei numeri derivati di /analytics (design "Meta Snapshot v2.0", 12/10/2026): `node --test src/lib/tracker/snapshot.test.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  THIN_GAMES,
  axisFor,
  band,
  bothSides,
  byPrudent,
  cardHighlights,
  deltaPoints,
  deltaText,
  dirOf,
  fmtInt,
  legendaryCodes,
  matchupGrid,
  matchupOrder,
  metaMapLayout,
  notableMatchup,
  pct,
  pos,
  rated,
  shortName,
  ticks,
  tintAlpha,
  verdictOf,
  vsLists,
  watchLegendary,
  wilson,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./snapshot.ts";

const near = (a: number, b: number, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

describe("intervallo di Wilson e win rate prudente", () => {
  test("valori noti", () => {
    const [lo, hi] = wilson(124, 214);
    near(lo, 0.5126, 1e-3);
    near(hi, 0.6436, 1e-3);
    // una partita vinta su una: intervallo larghissimo, mai fuori da 0–1
    const [lo1, hi1] = wilson(1, 1);
    assert.ok(lo1 > 0.2 && lo1 < 0.21);
    assert.equal(hi1, 1);
    assert.deepEqual(wilson(0, 0), [0, 1]);
  });
  test("57% su 54 partite non scavalca 58% su 214", () => {
    const small = rated({ games: 54, wins: 31 });
    const big = rated({ games: 214, wins: 124 });
    assert.ok(small.r < big.r + 0.01);
    assert.deepEqual([small, big].sort(byPrudent)[0], big);
  });
  test("senza partite il win rate è 0,5", () => {
    assert.equal(rated({ games: 0, wins: 0 }).r, 0.5);
  });
});

describe("delta, fasce e giudizi", () => {
  test("punti dal 50% a un decimale, freccia coerente con il numero", () => {
    assert.equal(deltaPoints(4 / 7), 7.1);
    assert.equal(deltaPoints(0.5), 0);
    assert.equal(dirOf(0.50004), "even");
    assert.equal(dirOf(0.6), "up");
    assert.equal(dirOf(0.4), "down");
  });
  test("fasce dalla forbice", () => {
    assert.equal(band(rated({ games: 400, wins: 260 })), "up-sure");
    assert.equal(band(rated({ games: 10, wins: 6 })), "up");
    assert.equal(band(rated({ games: 2, wins: 1 })), "even");
    assert.equal(band(rated({ games: 10, wins: 4 })), "down");
    assert.equal(band(rated({ games: 400, wins: 140 })), "down-sure");
  });
  test("giudizio di uno scontro", () => {
    assert.equal(verdictOf(rated({ games: 400, wins: 260 })), "upSure");
    assert.equal(verdictOf(rated({ games: 10, wins: 6 })), "up");
    assert.equal(verdictOf(rated({ games: 10, wins: 5 })), "even");
    assert.equal(verdictOf(rated({ games: 10, wins: 4 })), "down");
    assert.equal(verdictOf(rated({ games: 400, wins: 140 })), "downSure");
  });
});

describe("assi", () => {
  test("la scala più stretta che contiene i valori", () => {
    assert.deepEqual(axisFor([0.4, 0.62]), { min: 0.25, max: 0.75 });
    assert.deepEqual(axisFor([0.2, 0.62]), { min: 0.1, max: 0.9 });
    assert.deepEqual(axisFor([0, 1]), { min: 0, max: 1 });
    assert.equal(pos(0.5, { min: 0.25, max: 0.75 }), 50);
    assert.equal(pos(2, { min: 0, max: 1 }), 100);
    assert.ok(ticks({ min: 0.25, max: 0.75 }).includes(0.5));
    assert.deepEqual(ticks({ min: 0, max: 1 }), [0, 0.25, 0.5, 0.75, 1]);
  });
});

const mu = (legendary: string, opponent: string, games: number, wins: number) => rated({ legendary, opponent, games, wins });

describe("scontri", () => {
  test("lo scontro più sbilanciato preferisce i campioni da almeno 20 partite e salta gli specchi", () => {
    const list = [mu("A", "B", 2, 2), mu("A", "C", 30, 21), mu("B", "B", 50, 40), mu("C", "A", 25, 13)];
    assert.equal(notableMatchup(list)?.opponent, "C");
    assert.equal(notableMatchup([mu("A", "B", 2, 2), mu("A", "C", 3, 2)])?.opponent, "B");
    assert.equal(notableMatchup([mu("A", "A", 3, 2)]), null);
    assert.equal(notableMatchup([]), null);
  });
  test("tutti e due i lati: la vittoria di uno è la sconfitta dell'altro", () => {
    // chi registra vince 7 su 10 con A contro B, 3 su 4 con B contro C, 2 su 2 con B contro A e uno specchio A contro A
    const both = bothSides([mu("A", "B", 10, 7), mu("B", "C", 4, 3), mu("B", "A", 2, 2), mu("A", "A", 3, 1), mu("C", "B", 0, 0)]);
    assert.equal(both.games, 19);
    const legs = new Map(both.legendaries.map((l) => [l.legendary, l]));
    // A: 7 vinte su 10, 0 su 2 dall'altra parte, specchio = 3 vinte su 6 presenze
    assert.deepEqual(legs.get("A"), { legendary: "A", games: 18, wins: 10 });
    assert.deepEqual(legs.get("B"), { legendary: "B", games: 16, wins: 8 });
    assert.deepEqual(legs.get("C"), { legendary: "C", games: 4, wins: 1 });
    const all = both.legendaries.reduce((s, l) => ({ games: s.games + l.games, wins: s.wins + l.wins }), { games: 0, wins: 0 });
    assert.equal(all.games, 2 * both.games);
    assert.equal(all.wins * 2, all.games);
    const pair = new Map(both.matchups.map((m) => [`${m.legendary}|${m.opponent}`, m]));
    assert.deepEqual(pair.get("A|B"), { legendary: "A", opponent: "B", games: 12, wins: 7 });
    assert.deepEqual(pair.get("B|A"), { legendary: "B", opponent: "A", games: 12, wins: 5 });
    assert.deepEqual(pair.get("C|B"), { legendary: "C", opponent: "B", games: 4, wins: 1 });
    assert.deepEqual(pair.get("A|A"), { legendary: "A", opponent: "A", games: 3, wins: 1 });
    assert.equal(bothSides([]).legendaries.length, 0);
  });
  test("negli scontri simmetrici lo scontro della patch si racconta dal lato di chi vince", () => {
    const both = bothSides([mu("A", "B", 30, 9)]).matchups.map(rated);
    assert.equal(notableMatchup(both)?.legendary, "B");
  });
  test("solo le Leggendarie con partite, le più giocate prima", () => {
    const order = matchupOrder([mu("A", "B", 3, 2), mu("C", "A", 1, 0), mu("D", "E", 0, 0)], new Map([["C", 50], ["A", 10]]));
    assert.deepEqual(order, ["C", "A", "B"]);
  });
  test("tabella con specchi, celle vuote e campioni piccoli", () => {
    const grid = matchupGrid([mu("A", "B", 3, 2), mu("A", "A", 4, 2), mu("B", "A", THIN_GAMES, 5)], ["A", "B"]);
    assert.equal(grid[0][0].kind, "mirror");
    assert.equal(grid[0][1].kind, "thin");
    assert.equal(grid[1][0].kind, "ok");
    assert.equal(grid[1][1].kind, "mirror");
    assert.equal(tintAlpha(grid[0][0]), 0);
    assert.ok(tintAlpha(grid[1][0]) > tintAlpha({ ...grid[1][0], kind: "thin" }));
    const empty = matchupGrid([], ["A", "B"]);
    assert.equal(empty[0][1].kind, "none");
  });
  test("vince contro / soffre contro ordinati per forbice", () => {
    const [row] = matchupGrid(
      [mu("A", "B", 100, 70), mu("A", "C", 3, 3), mu("A", "D", 100, 30), mu("A", "E", 4, 1), mu("A", "F", 2, 1)],
      ["A", "B", "C", "D", "E", "F"],
    );
    const { best, worst } = vsLists(row);
    // 3 su 3 è il 100%, ma la sua forbice parte più in basso del 70% su 100
    assert.deepEqual(best.map((c) => c.b), ["B", "C"]);
    assert.deepEqual(worst.map((c) => c.b), ["D", "E"]);
  });
});

describe("nomi corti e sigle", () => {
  const names = ["Dorothy", "Dracula", "King Arthur", "Legion of the Dead", "Merlin", "Mulan", "Queen of Hearts", "Robin Hood", "Three Not So Little Pigs", "Van Helsing", "Wicked Stepmother"];
  test("sigle di tre lettere tutte diverse", () => {
    const codes = legendaryCodes(names);
    assert.equal(new Set(codes).size, names.length);
    assert.ok(codes.every((c) => /^[A-Z0-9]{3}$/.test(c)));
    assert.equal(codes[4], "MER");
    assert.equal(codes[8], "PIG");
    // due nomi che iniziano allo stesso modo
    assert.deepEqual(legendaryCodes(["Merlin", "Merlin Two"]), ["MER", "TWO"]);
  });
  test("nomi corti", () => {
    assert.equal(shortName("Merlin"), "Merlin");
    assert.equal(shortName("Queen of Hearts"), "Queen");
    assert.equal(shortName("Three Not So Little Pigs"), "Pigs");
  });
});

describe("carte in evidenza", () => {
  const c = (card: string, dg: number, dw: number, pg: number, pw: number) => ({
    card,
    deck: dg ? rated({ games: dg, wins: dw }) : null,
    played: pg ? { ...rated({ games: pg, wins: pw }), avgTurn: 2 } : null,
  });
  test("tre carte diverse, e l'effetto della giocata solo con campioni veri", () => {
    const h = cardHighlights([c("a", 100, 50, 80, 40), c("b", 60, 30, 50, 40), c("c", 40, 20, 30, 24), c("d", 5, 1, 5, 5)]);
    assert.equal(h.most?.card, "a");
    assert.equal(h.win?.card, "b");
    assert.equal(h.swing?.card, "c");
    const few = cardHighlights([c("a", 2, 1, 1, 1)]);
    assert.equal(few.most?.card, "a");
    assert.equal(few.win, null);
    assert.equal(few.swing, null);
  });
});

describe("storie", () => {
  test("da tenere d'occhio: vince più della più solida ma con meno partite", () => {
    const list = [rated({ legendary: "A", games: 300, wins: 180 }), rated({ legendary: "B", games: 12, wins: 9 }), rated({ legendary: "C", games: 40, wins: 18 })].sort(byPrudent);
    assert.equal(list[0].legendary, "A");
    assert.equal(watchLegendary(list)?.legendary, "B");
    assert.equal(watchLegendary(list.slice(0, 1)), null);
  });
});

describe("mappa del meta", () => {
  test("punti dentro il grafico ed etichette che non si sovrappongono", () => {
    const points = [
      { key: "a", label: "Merlin", share: 0.2, r: 0.58 },
      { key: "b", label: "Dracula", share: 0.21, r: 0.54 },
      { key: "c", label: "Queen of Hearts", share: 0.15, r: 0.52 },
      { key: "d", label: "Mulan", share: 0.12, r: 0.49 },
    ];
    const q = ["Forti, rare", "Forti e giocate", "Deboli, rare", "Deboli e giocate"] as const;
    for (const W of [340, 640]) {
      const L = metaMapLayout(points, { W, narrow: W < 560, quadrants: q });
      for (const d of L.dots) {
        assert.ok(d.x >= L.box.l && d.x <= L.box.l + L.box.w);
        assert.ok(d.y >= L.box.t && d.y <= L.box.t + L.box.h);
      }
      assert.equal(L.labels.length, points.length);
      assert.ok(L.yTicks.some((t) => t.v === 50));
    }
  });
  test("due punti uguali hanno le etichette in due posti diversi", () => {
    const same = [
      { key: "a", label: "King Arthur", share: 0.014, r: 1 },
      { key: "b", label: "Dracula", share: 0.014, r: 1 },
    ];
    const L = metaMapLayout(same, { W: 640, narrow: false, quadrants: ["A", "B", "C", "D"] });
    assert.notDeepEqual([L.labels[0].x, L.labels[0].y], [L.labels[1].x, L.labels[1].y]);
  });
});

describe("numeri nelle cinque lingue", () => {
  test("migliaia, percentuali e delta", () => {
    assert.equal(fmtInt(1240, "en"), "1,240");
    assert.equal(fmtInt(1240, "it"), "1.240");
    assert.equal(fmtInt(1240, "es"), "1240");
    assert.equal(fmtInt(12400, "es"), "12.400");
    assert.equal(fmtInt(1240, "fr"), "1 240");
    assert.equal(pct(4 / 7, "it"), "57,1%");
    assert.equal(pct(4 / 7, "en"), "57.1%");
    assert.equal(pct(4 / 7, "fr"), "57,1 %");
    assert.equal(pct(4 / 7, "es"), "57,1 %");
    assert.equal(deltaText(4 / 7, "it"), "+7,1");
    assert.equal(deltaText(0.4, "en"), "−10.0");
    assert.equal(deltaText(0.5, "fr"), "0,0");
    // portoghese del Brasile (20/10/2026, docs/portoghese.md): "10.000", "3,5", "98%"
    assert.equal(fmtInt(1240, "pt"), "1.240");
    assert.equal(pct(4 / 7, "pt"), "57,1%");
    assert.equal(deltaText(4 / 7, "pt"), "+7,1");
    // tedesco (20/10/2026, docs/tedesco.md): "10.000", "3,5", "98 %" con lo spazio insecabile
    assert.equal(fmtInt(1240, "de"), "1.240");
    assert.equal(pct(4 / 7, "de"), "57,1 %");
    assert.equal(deltaText(4 / 7, "de"), "+7,1");
    // russo (20/10/2026, docs/russo.md): "10 000" con lo spazio insecabile, "3,5", "98%"
    assert.equal(fmtInt(1240, "ru"), "1\u00a0240");
    assert.equal(pct(4 / 7, "ru"), "57,1%");
    assert.equal(deltaText(4 / 7, "ru"), "+7,1");
  });
});
