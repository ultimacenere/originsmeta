/**
 * Test del motore del tabellone (`bracket.ts`) con il runner integrato di Node: `npm test`
 * (equivale a `node --test src/lib/tournament/bracket.test.ts`). Node 24 esegue il TypeScript
 * direttamente: per questo l'import ha l'estensione `.ts` e il file usa solo sintassi cancellabile.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  BRACKET_SIZES,
  bracketSize,
  buildRound1,
  matchesInRound,
  nextSlot,
  roundLabel,
  roundsOf,
  seedOrder,
  standings,
  validateScore,
  type BestOf,
  type MatchLike,
  type Round1Pair,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta. Se il flag viene aggiunto al tsconfig,
  // tsc segnalerà questa direttiva come inutile e basterà toglierla.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./bracket.ts";

/** Nomi finti: `P1` è il seed 1, `P2` il seed 2 e così via. */
function names(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `P${i + 1}`);
}

function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n >= 2 && Number.isInteger(Math.log2(n));
}

function sorted(xs: string[]): string[] {
  return [...xs].sort();
}

function byesOf<T>(pairs: Round1Pair<T>[]): Round1Pair<T>[] {
  return pairs.filter((pair) => pair.b === null);
}

/** Riga finta della tabella delle partite; senza vincitore la partita è `pending`. */
function match(
  round: number,
  position: number,
  a: string | null,
  b: string | null,
  winner: string | null,
  status?: string,
): MatchLike {
  return { round, position, player_a: a, player_b: b, winner, status: status ?? (winner === null ? "pending" : "confirmed") };
}

/**
 * Gioca tutto il tabellone di `n` iscritti (dimensione minima) facendo vincere sempre il giocatore in `a`,
 * che al primo turno è il seed minore; i bye chiudono la partita con status `bye`. Controlla che dal secondo
 * turno in su nessun posto resti vuoto.
 */
function simulate(n: number, max = 128): { size: number; matches: MatchLike[] } {
  const size = bracketSize(n, max);
  const rounds = roundsOf(size);
  const matches: MatchLike[] = [];
  for (let round = 2; round <= rounds; round += 1) {
    for (let position = 0; position < matchesInRound(size, round); position += 1) {
      matches.push(match(round, position, null, null, null));
    }
  }
  const find = (round: number, position: number): MatchLike => {
    const found = matches.find((m) => m.round === round && m.position === position);
    if (found === undefined) throw new Error(`partita (${round}, ${position}) assente`);
    return found;
  };
  const advance = (round: number, position: number, winner: string): void => {
    if (round === rounds) return;
    const slot = nextSlot(round, position);
    const target = find(slot.round, slot.position);
    if (slot.side === "a") target.player_a = winner;
    else target.player_b = winner;
  };
  for (const pair of buildRound1(names(n), size)) {
    matches.push(match(1, pair.position, pair.a, pair.b, pair.a, pair.b === null ? "bye" : "confirmed"));
    advance(1, pair.position, pair.a);
  }
  for (let round = 2; round <= rounds; round += 1) {
    for (let position = 0; position < matchesInRound(size, round); position += 1) {
      const m = find(round, position);
      const a = m.player_a;
      assert.ok(a !== null, `posto a vuoto al turno ${round}, partita ${position}, con ${n} iscritti`);
      assert.ok(m.player_b !== null, `posto b vuoto al turno ${round}, partita ${position}, con ${n} iscritti`);
      m.winner = a;
      m.status = "confirmed";
      advance(round, position, a);
    }
  }
  return { size, matches };
}

describe("BRACKET_SIZES", () => {
  test("sono le potenze di 2 da 4 a 128", () => {
    assert.deepEqual([...BRACKET_SIZES], [4, 8, 16, 32, 64, 128]);
    for (const size of BRACKET_SIZES) assert.ok(isPowerOfTwo(size));
  });
});

describe("bracketSize", () => {
  test("esempi e casi limite", () => {
    assert.equal(bracketSize(50, 64), 64); // 14 bye
    assert.equal(bracketSize(6, 8), 8);
    assert.equal(bracketSize(5, 64), 8);
    assert.equal(bracketSize(1, 64), 2); // 1 iscritto → minimo 2
    assert.equal(bracketSize(0, 64), 2);
    assert.equal(bracketSize(2, 4), 2);
    assert.equal(bracketSize(3, 4), 4);
    assert.equal(bracketSize(4, 4), 4); // players = max
    assert.equal(bracketSize(64, 64), 64); // players = max
    assert.equal(bracketSize(65, 64), 64); // players > max → max, sta al chiamante rifiutare
    assert.equal(bracketSize(9, 8), 8);
    assert.equal(bracketSize(129, 128), 128);
    assert.equal(bracketSize(130, 128), 128);
  });

  test("da 2 a 130 iscritti con ogni massimo del menu", () => {
    for (const max of BRACKET_SIZES) {
      for (let players = 2; players <= 130; players += 1) {
        const size = bracketSize(players, max);
        const label = `${players} iscritti, massimo ${max}`;
        if (players > max) {
          assert.equal(size, max, label);
          continue;
        }
        assert.ok(isPowerOfTwo(size), label);
        assert.ok(size >= players, label);
        assert.ok(size <= max, label);
        assert.ok(size === 2 || size / 2 < players, `${label}: ${size} non è la dimensione minima`);
        assert.equal(size, 2 ** Math.ceil(Math.log2(players)), label);
      }
    }
  });

  test("massimo non valido", () => {
    for (const max of [0, 1, 3, 6, 100, -8, 2.5, NaN]) assert.throws(() => bracketSize(5, max), RangeError);
  });
});

describe("seedOrder", () => {
  test("valori attesi per 2, 4, 8 e 16", () => {
    assert.deepEqual(seedOrder(2), [1, 2]);
    assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);
    assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
    assert.deepEqual(seedOrder(16), [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]);
  });

  test("permutazione di 1..size con il seed minore per primo in ogni coppia", () => {
    for (const size of [2, ...BRACKET_SIZES]) {
      const order = seedOrder(size);
      const label = `size ${size}`;
      assert.equal(order.length, size, label);
      assert.deepEqual(
        [...order].sort((x, y) => x - y),
        Array.from({ length: size }, (_, i) => i + 1),
        label,
      );
      for (let i = 0; i < size / 2; i += 1) {
        assert.ok(order[2 * i] < order[2 * i + 1], `${label}, coppia ${i}`);
        assert.equal(order[2 * i] + order[2 * i + 1], size + 1, `${label}, coppia ${i}`);
      }
      // I primi elementi delle coppie sono esattamente i seed 1..size/2: è ciò che tiene i bye fuori da `a`.
      const firsts = order.filter((_, i) => i % 2 === 0).sort((x, y) => x - y);
      assert.deepEqual(firsts, Array.from({ length: size / 2 }, (_, i) => i + 1), label);
    }
  });

  test("i primi 2^k seed cadono in 2^k blocchi diversi (si incontrano solo dal turno log2(size) − k in su)", () => {
    for (const size of [2, ...BRACKET_SIZES]) {
      const order = seedOrder(size);
      for (let k = 1; 2 ** k <= size; k += 1) {
        const blockSize = size / 2 ** k;
        const blocks = new Set<number>();
        for (let seed = 1; seed <= 2 ** k; seed += 1) blocks.add(Math.floor(order.indexOf(seed) / blockSize));
        assert.equal(blocks.size, 2 ** k, `size ${size}, primi ${2 ** k} seed`);
      }
    }
  });

  test("errore se size non è una potenza di 2 maggiore o uguale a 2", () => {
    for (const bad of [0, 1, 3, 6, 12, -8, 2.5, NaN]) assert.throws(() => seedOrder(bad), RangeError);
  });
});

describe("buildRound1", () => {
  test("6 iscritti su 8: due bye, entrambi in b, ai seed 1 e 2", () => {
    const pairs = buildRound1(names(6), 8);
    assert.deepEqual(pairs, [
      { position: 0, a: "P1", b: null },
      { position: 1, a: "P4", b: "P5" },
      { position: 2, a: "P2", b: null },
      { position: 3, a: "P3", b: "P6" },
    ]);
    const byes = byesOf(pairs);
    assert.equal(byes.length, 2);
    assert.deepEqual(sorted(byes.map((pair) => pair.a)), ["P1", "P2"]);
  });

  test("50 iscritti su 64: 14 bye, tutti in b, ai seed 1..14", () => {
    const pairs = buildRound1(names(50), 64);
    assert.equal(pairs.length, 32);
    assert.deepEqual(
      pairs.map((pair) => pair.position),
      Array.from({ length: 32 }, (_, i) => i),
    );
    assert.ok(pairs.every((pair) => pair.a !== null));
    const byes = byesOf(pairs);
    assert.equal(byes.length, 14);
    assert.deepEqual(sorted(byes.map((pair) => pair.a)), sorted(names(14)));
  });

  test("5 iscritti su 8: tre bye", () => {
    const pairs = buildRound1(names(5), 8);
    assert.deepEqual(pairs, [
      { position: 0, a: "P1", b: null },
      { position: 1, a: "P4", b: "P5" },
      { position: 2, a: "P2", b: null },
      { position: 3, a: "P3", b: null },
    ]);
    assert.equal(byesOf(pairs).length, 3);
  });

  test("8 iscritti su 8: nessun bye", () => {
    const pairs = buildRound1(names(8), 8);
    assert.equal(byesOf(pairs).length, 0);
    assert.deepEqual(pairs, [
      { position: 0, a: "P1", b: "P8" },
      { position: 1, a: "P4", b: "P5" },
      { position: 2, a: "P2", b: "P7" },
      { position: 3, a: "P3", b: "P6" },
    ]);
  });

  test("funziona con qualunque tipo di giocatore", () => {
    const players = [{ id: "x" }, { id: "y" }, { id: "z" }];
    assert.deepEqual(buildRound1(players, 4), [
      { position: 0, a: { id: "x" }, b: null },
      { position: 1, a: { id: "y" }, b: { id: "z" } },
    ]);
  });

  test("errori: meno di 2 iscritti, più di size, tabellone sovradimensionato, size non valida", () => {
    assert.throws(() => buildRound1(names(1), 2), RangeError);
    assert.throws(() => buildRound1([], 4), RangeError);
    assert.throws(() => buildRound1(names(9), 8), RangeError);
    assert.throws(() => buildRound1(names(4), 8), RangeError); // n ≤ size/2: andrebbe usato bracketSize
    assert.throws(() => buildRound1(names(5), 64), RangeError);
    assert.throws(() => buildRound1(names(3), 6), RangeError);
  });

  test("proprietà generali per ogni n da 2 a 128 con size = bracketSize(n, 128)", () => {
    for (let n = 2; n <= 128; n += 1) {
      const size = bracketSize(n, 128);
      const players = names(n);
      const pairs = buildRound1(players, size);
      const label = `${n} iscritti su ${size}`;
      assert.equal(pairs.length, size / 2, label);
      pairs.forEach((pair, i) => assert.equal(pair.position, i, label));
      assert.ok(pairs.every((pair) => pair.a !== null), `${label}: posto a vuoto`);
      const present = pairs.flatMap((pair) => (pair.b === null ? [pair.a] : [pair.a, pair.b]));
      assert.equal(present.length, n, label);
      assert.equal(new Set(present).size, n, `${label}: giocatore ripetuto`);
      assert.deepEqual(sorted(present), sorted(players), label);
      const byes = byesOf(pairs);
      assert.equal(byes.length, size - n, label);
      // I bye toccano esattamente i primi (size − n) seed.
      assert.deepEqual(sorted(byes.map((pair) => pair.a)), sorted(players.slice(0, size - n)), label);
    }
  });

  test("distribuzione dei bye: al secondo turno mai due reduci da bye, quando è possibile", () => {
    // Le partite del primo turno (2k, 2k+1) confluiscono nella partita k del secondo turno, che ha size/4
    // partite. Con bye ≤ size/4 (cioè n ≥ 3·size/4) l'ordine standard non mette mai due bye nella stessa
    // coppia; con più bye di così è impossibile per qualunque disposizione (principio dei cassetti) e
    // l'ordine standard produce il minimo di incontri "bye contro bye", cioè bye − size/4.
    for (let n = 3; n <= 128; n += 1) {
      const size = bracketSize(n, 128);
      const pairs = buildRound1(names(n), size);
      const byes = size - n;
      const groups = size / 4;
      const perGroup = Array.from({ length: groups }, (_, k) => byesOf([pairs[2 * k], pairs[2 * k + 1]]).length);
      const label = `${n} iscritti su ${size} (${byes} bye, ${groups} partite al secondo turno)`;
      assert.ok(Math.max(...perGroup) - Math.min(...perGroup) <= 1, `${label}: bye sbilanciati ${perGroup.join(",")}`);
      if (byes <= groups) {
        assert.ok(perGroup.every((count) => count <= 1), `${label}: bye contro bye evitabile`);
      } else {
        assert.equal(perGroup.filter((count) => count === 2).length, byes - groups, label);
      }
    }
    // Esempi concreti: 6 su 8 (2 bye su 2 partite) nessun bye contro bye; 5 su 8 (3 bye su 2 partite) uno inevitabile.
    const six = buildRound1(names(6), 8);
    assert.deepEqual([byesOf([six[0], six[1]]).length, byesOf([six[2], six[3]]).length], [1, 1]);
    const five = buildRound1(names(5), 8);
    assert.deepEqual([byesOf([five[0], five[1]]).length, byesOf([five[2], five[3]]).length], [1, 2]);
    const fifty = buildRound1(names(50), 64);
    for (let k = 0; k < 16; k += 1) assert.ok(byesOf([fifty[2 * k], fifty[2 * k + 1]]).length <= 1, `50 su 64, gruppo ${k}`);
  });

  test("simulazione completa: dal secondo turno nessun posto vuoto, size − 1 partite, bye solo al primo turno", () => {
    for (let n = 2; n <= 128; n += 1) {
      const { size, matches } = simulate(n);
      assert.equal(matches.length, size - 1, `${n} iscritti`);
      const byes = matches.filter((m) => m.status === "bye");
      assert.equal(byes.length, size - n, `${n} iscritti`);
      assert.ok(byes.every((m) => m.round === 1), `${n} iscritti: bye oltre il primo turno`);
    }
  });
});

describe("nextSlot", () => {
  test("esempi", () => {
    assert.deepEqual(nextSlot(1, 0), { round: 2, position: 0, side: "a" });
    assert.deepEqual(nextSlot(1, 1), { round: 2, position: 0, side: "b" });
    assert.deepEqual(nextSlot(1, 6), { round: 2, position: 3, side: "a" });
    assert.deepEqual(nextSlot(3, 1), { round: 4, position: 0, side: "b" });
  });

  test("le partite 2k e 2k+1 confluiscono nella partita k del turno dopo, sui due lati", () => {
    for (let k = 0; k < 32; k += 1) {
      assert.deepEqual(nextSlot(1, 2 * k), { round: 2, position: k, side: "a" });
      assert.deepEqual(nextSlot(1, 2 * k + 1), { round: 2, position: k, side: "b" });
    }
  });
});

describe("roundsOf, matchesInRound, roundLabel", () => {
  test("tabellone da 8", () => {
    assert.equal(roundsOf(8), 3);
    assert.deepEqual([1, 2, 3].map((round) => matchesInRound(8, round)), [4, 2, 1]);
    assert.equal(roundLabel(1, 8), "quarterfinal");
    assert.equal(roundLabel(2, 8), "semifinal");
    assert.equal(roundLabel(3, 8), "final");
  });

  test("tabellone da 64", () => {
    assert.equal(roundsOf(64), 6);
    assert.deepEqual([1, 2, 3, 4, 5, 6].map((round) => matchesInRound(64, round)), [32, 16, 8, 4, 2, 1]);
    assert.deepEqual(roundLabel(1, 64), { of: 64 });
    assert.deepEqual(roundLabel(2, 64), { of: 32 });
    assert.deepEqual(roundLabel(3, 64), { of: 16 });
    assert.equal(roundLabel(4, 64), "quarterfinal");
    assert.equal(roundLabel(5, 64), "semifinal");
    assert.equal(roundLabel(6, 64), "final");
  });

  test("tabelloni piccoli e grandi", () => {
    assert.equal(roundsOf(2), 1);
    assert.equal(roundsOf(4), 2);
    assert.equal(roundsOf(128), 7);
    assert.equal(roundLabel(1, 2), "final");
    assert.equal(roundLabel(1, 4), "semifinal");
    assert.equal(roundLabel(2, 4), "final");
    assert.deepEqual(roundLabel(1, 128), { of: 128 });
    assert.equal(matchesInRound(128, 7), 1);
    // In ogni turno le partite valgono il doppio del turno seguente e la finale è una sola.
    for (const size of [2, ...BRACKET_SIZES]) {
      const total = roundsOf(size);
      assert.equal(matchesInRound(size, 1), size / 2);
      assert.equal(matchesInRound(size, total), 1);
      for (let round = 1; round < total; round += 1) {
        assert.equal(matchesInRound(size, round), 2 * matchesInRound(size, round + 1));
      }
    }
  });

  test("errori su size o turno non validi", () => {
    assert.throws(() => roundsOf(6), RangeError);
    assert.throws(() => roundsOf(1), RangeError);
    assert.throws(() => matchesInRound(8, 0), RangeError);
    assert.throws(() => matchesInRound(8, 4), RangeError);
    assert.throws(() => matchesInRound(8, 1.5), RangeError);
    assert.throws(() => roundLabel(4, 8), RangeError);
    assert.throws(() => roundLabel(0, 8), RangeError);
    assert.throws(() => roundLabel(1, 12), RangeError);
  });
});

describe("validateScore", () => {
  const valid: Array<[BestOf, number, number]> = [
    [1, 1, 0],
    [1, 0, 1],
    [3, 2, 0],
    [3, 2, 1],
    [3, 0, 2],
    [3, 1, 2],
    [5, 3, 0],
    [5, 3, 1],
    [5, 3, 2],
    [5, 0, 3],
    [5, 1, 3],
    [5, 2, 3],
  ];

  test("tutte le combinazioni valide di Bo1, Bo3 e Bo5", () => {
    for (const [bestOf, a, b] of valid) assert.equal(validateScore(bestOf, a, b), true, `Bo${bestOf} ${a}–${b}`);
  });

  test("punteggi non validi", () => {
    const invalid: Array<[BestOf, number, number]> = [
      [1, 1, 1], // pari
      [3, 2, 2],
      [5, 0, 0],
      [3, -1, 2], // negativi
      [3, 2, -1],
      [3, 1.5, 2], // decimali
      [5, 3, 0.5],
      [3, 3, 0], // troppi game per il formato
      [1, 2, 0],
      [5, 4, 1],
      [5, 2, 0], // partita non finita
      [3, 1, 0],
      [5, 3, 3],
      [5, 3, NaN],
      [1, Infinity, 0],
    ];
    for (const [bestOf, a, b] of invalid) assert.equal(validateScore(bestOf, a, b), false, `Bo${bestOf} ${a}–${b}`);
    // Formato sconosciuto arrivato a runtime (es. da un form): mai valido.
    assert.equal(validateScore(2 as BestOf, 1, 0), false);
    assert.equal(validateScore(7 as BestOf, 4, 0), false);
  });

  test("su tutti i punteggi da 0 a 6 le combinazioni valide sono esattamente quelle attese", () => {
    for (const bestOf of [1, 3, 5] as const) {
      const found: string[] = [];
      for (let a = 0; a <= 6; a += 1) {
        for (let b = 0; b <= 6; b += 1) if (validateScore(bestOf, a, b)) found.push(`${a}-${b}`);
      }
      const expected = valid.filter(([format]) => format === bestOf).map(([, a, b]) => `${a}-${b}`);
      assert.deepEqual(found.sort(), expected.sort(), `Bo${bestOf}`);
      assert.equal(found.length, bestOf + 1);
    }
  });
});

describe("standings", () => {
  const full8: MatchLike[] = [
    match(1, 0, "P1", "P8", "P1"),
    match(1, 1, "P4", "P5", "P5"),
    match(1, 2, "P2", "P7", "P2"),
    match(1, 3, "P3", "P6", "P3"),
    match(2, 0, "P1", "P5", "P1"),
    match(2, 1, "P2", "P3", "P3"),
    match(3, 0, "P1", "P3", "P3"),
  ];

  test("tabellone da 8 completo: vincitore, finalista e i due semifinalisti in ordine di posizione", () => {
    assert.deepEqual(standings(full8, 8), { winner: "P3", runnerUp: "P1", semifinalists: ["P5", "P2"] });
  });

  test("tabellone incompleto: nessun vincitore finché la finale non è confermata", () => {
    const pending = full8.map((m) => (m.round === 3 ? match(3, 0, "P1", "P3", null) : m));
    assert.deepEqual(standings(pending, 8), { winner: null, runnerUp: null, semifinalists: ["P5", "P2"] });
    const reported = full8.map((m) => (m.round === 3 ? match(3, 0, "P1", "P3", "P3", "reported") : m));
    assert.deepEqual(standings(reported, 8), { winner: null, runnerUp: null, semifinalists: ["P5", "P2"] });
    const noWinner = full8.map((m) => (m.round === 3 ? match(3, 0, "P1", "P3", null, "confirmed") : m));
    assert.equal(standings(noWinner, 8).winner, null);
    assert.deepEqual(standings([], 8), { winner: null, runnerUp: null, semifinalists: [] });
    assert.deepEqual(standings(full8.filter((m) => m.round === 1), 8), { winner: null, runnerUp: null, semifinalists: [] });
  });

  test("size 2: solo la finale, nessun semifinalista", () => {
    assert.deepEqual(standings([match(1, 0, "P1", "P2", "P2")], 2), { winner: "P2", runnerUp: "P1", semifinalists: [] });
    assert.deepEqual(standings([match(1, 0, "P1", "P2", null)], 2), { winner: null, runnerUp: null, semifinalists: [] });
  });

  test("bye e giocatori sconosciuti restano null", () => {
    // 3 iscritti su 4: la semifinale con il bye non produce alcun semifinalista sconfitto.
    const three: MatchLike[] = [
      match(1, 0, "P1", null, "P1", "bye"),
      match(1, 1, "P2", "P3", "P3"),
      match(2, 0, "P1", "P3", "P1"),
    ];
    assert.deepEqual(standings(three, 4), { winner: "P1", runnerUp: "P3", semifinalists: ["P2"] });
    // Finale chiusa con un bye: il finalista sconfitto non esiste.
    assert.deepEqual(standings([match(1, 0, "P1", null, "P1", "bye")], 2), { winner: "P1", runnerUp: null, semifinalists: [] });
    // Vincitore che non è nessuno dei due giocatori: dato incoerente, il finalista resta null.
    assert.deepEqual(standings([match(1, 0, "P1", "P2", "X")], 2), { winner: "X", runnerUp: null, semifinalists: [] });
  });

  test("simulazione per ogni n da 2 a 128: vince il seed 1, finalista il seed 2, semifinalisti i seed 4 e 3", () => {
    for (let n = 2; n <= 128; n += 1) {
      const { size, matches } = simulate(n);
      const semifinalists = n === 2 ? [] : n === 3 ? ["P3"] : ["P4", "P3"];
      assert.deepEqual(standings(matches, size), { winner: "P1", runnerUp: "P2", semifinalists }, `${n} iscritti su ${size}`);
    }
  });
});
