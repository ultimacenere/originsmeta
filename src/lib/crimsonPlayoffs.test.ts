/**
 * Test del tabellone dei playoff della Crimson Cup (25/10/2026): `node --test src/lib/crimsonPlayoffs.test.ts`.
 * - Il lettore della risposta di Tourney Bot (crimsonPlayoffs.ts) sulla fotografia del repository: lati e turni coerenti
 *   con una doppia eliminazione da 256 posti, sconfitte contate nell'ordine di gioco, chi è in corsa e dove aspetta, i
 *   quattro delle finali.
 * - Un tabellone piccolo scritto a mano (8 posti) giocato fino alla gran finale.
 * - I testi (crimsonPlayoffsLabels.ts): title e description nei limiti di Google, stessi segnaposto in ogni lingua,
 *   tipografia francese, nessun numero di giocatori.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  aliveRanked,
  cleanName,
  compact,
  dropRound,
  lbMatchesIn,
  matchesIn,
  openMatches,
  parsePlayoffs,
  pathOf,
  timeKey,
  topFourDecided,
  waitingIn,
  wbMatchesIn,
  type Playoffs,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./crimsonPlayoffs.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { crimsonPlayoffsLabels } from "./crimsonPlayoffsLabels.ts";

const LOCALES = ["en", "it", "es", "fr", "pt", "de", "ru"] as const;
const raw = JSON.parse(fs.readFileSync(new URL("./data/crimsonPlayoffsSnapshot.json", import.meta.url), "utf8"));
const p = parsePlayoffs(raw) as Playoffs;

describe("Playoff: lettura della fotografia", () => {
  test("è una doppia eliminazione da 256 posti", () => {
    assert.ok(p);
    assert.equal(p.size, 256);
    assert.equal(p.wbRounds, 8);
    assert.equal(p.lbRounds, 14);
    assert.equal(p.bestOf, 3);
    assert.match(p.startTime, /^2026-10-24T14:00/);
  });

  test("nessun id Discord nella fotografia", () => {
    const text = JSON.stringify(raw);
    assert.ok(!/realUserId|guild|banner/.test(text));
    assert.ok(p.players.every((pl) => pl.discord === undefined));
  });

  test("ogni turno ha al massimo le partite di una doppia eliminazione e i turni completi le hanno tutte", () => {
    for (let r = 1; r <= p.wbRounds; r++) assert.ok(matchesIn(p, "winners", r).length <= wbMatchesIn(p.size, r), `vincenti ${r}`);
    for (let r = 1; r <= p.lbRounds; r++) assert.ok(matchesIn(p, "losers", r).length <= lbMatchesIn(p.size, r), `perdenti ${r}`);
    // un posto libero al primo turno (255 giocatori): una partita in meno al primo turno dei vincenti e dei perdenti
    assert.equal(matchesIn(p, "winners", 1).length, 127);
    assert.equal(matchesIn(p, "losers", 1).length, 63);
    for (const r of [2, 3, 4, 5, 6, 7]) assert.equal(matchesIn(p, "winners", r).length, wbMatchesIn(p.size, r), `vincenti ${r}`);
    for (const r of [2, 3, 4, 5, 6, 7, 8]) assert.equal(matchesIn(p, "losers", r).length, lbMatchesIn(p.size, r), `perdenti ${r}`);
  });

  test("nel tabellone vincenti giocano solo imbattuti, in quello dei perdenti chi ha una sconfitta", () => {
    for (const pl of p.players) {
      let losses = 0;
      for (const m of pathOf(p, pl.seat)) {
        if (m.side === "winners") assert.equal(losses, 0, `${pl.name} #${m.id}`);
        if (m.side === "losers") assert.equal(losses, 1, `${pl.name} #${m.id}`);
        if (m.w !== null && m.w !== pl.seat) losses++;
      }
      assert.equal(losses, pl.losses, pl.name);
      assert.ok(losses <= 2, pl.name);
    }
  });

  test("chi perde nei vincenti scende al turno giusto dei perdenti", () => {
    for (const pl of p.players) {
      const path = pathOf(p, pl.seat);
      const fall = path.findIndex((m) => m.side === "winners" && m.w !== null && m.w !== pl.seat);
      const after = fall >= 0 ? path[fall + 1] : undefined;
      // al primo turno dei perdenti c'è un posto libero: chi lo prende gioca direttamente il secondo
      if (after) assert.ok(after.round === dropRound(path[fall].round) || (path[fall].round === 1 && after.round === 2), `${pl.name} #${after.id}`);
    }
  });

  test("timeKey mette i turni nell'ordine di gioco", () => {
    assert.ok(timeKey("winners", 1) < timeKey("losers", 1));
    assert.ok(timeKey("losers", 1) < timeKey("winners", 2));
    assert.ok(timeKey("winners", 3) < timeKey("losers", 4));
    assert.ok(timeKey("losers", 3) < timeKey("winners", 3));
    assert.ok(timeKey("losers", 13) < timeKey("winners", 8));
    assert.ok(timeKey("winners", 8) < timeKey("losers", 14));
    assert.ok(timeKey("losers", 14) < timeKey("grand", 1));
  });

  test("gli eliminati hanno la partita della seconda sconfitta e chi li ha battuti", () => {
    for (const pl of p.players.filter((x) => !x.alive)) {
      assert.ok(pl.out, pl.name);
      const m = p.matches.find((x) => x.id === pl.out!.match)!;
      assert.equal(m.side, "losers", pl.name);
      assert.equal(pl.out!.by, m.w);
      assert.notEqual(m.w, pl.seat);
      // dopo la seconda sconfitta non gioca più
      const path = pathOf(p, pl.seat);
      assert.equal(path[path.length - 1].id, m.id, pl.name);
    }
  });

  test("chi è in corsa ha una partita aperta o aspetta in un turno preciso", () => {
    const alive = aliveRanked(p);
    assert.ok(alive.length > 0);
    for (const pl of alive) {
      assert.ok(pl.losses <= 1, pl.name);
      assert.ok((pl.open !== undefined) !== (pl.next !== undefined), pl.name);
    }
    // prima gli imbattuti
    const firstBeaten = alive.findIndex((pl) => pl.losses > 0);
    assert.ok(alive.slice(firstBeaten).every((pl) => pl.losses === 1));
    // le partite aperte hanno tutti e due i giocatori in corsa
    for (const m of openMatches(p)) {
      for (const s of [m.a, m.b]) assert.ok(p.players.find((x) => x.seat === s)?.alive);
    }
  });

  test("i finalisti dai vincenti sono i due della finale dei vincenti, quelli dai perdenti i vincitori del turno 12", () => {
    const wbFinal = matchesIn(p, "winners", p.wbRounds)[0];
    if (wbFinal) assert.deepEqual(p.finalists.winners, [wbFinal.a, wbFinal.b]);
    const lb12 = matchesIn(p, "losers", 12).filter((m) => m.w !== null);
    assert.deepEqual(p.finalists.losers, lb12.map((m) => m.w));
    assert.equal(topFourDecided(p), p.finalists.winners.length === 2 && lb12.length === 2);
  });

  test("chi aspetta in un turno dei perdenti arriva dal turno giusto", () => {
    for (let r = 1; r <= p.lbRounds; r++) {
      for (const x of waitingIn(p, "losers", r)) {
        const last = pathOf(p, x.seat).at(-1)!;
        // dai vincenti (sconfitta al turno che scende qui) o dal turno prima dei perdenti (vittoria)
        if (last.side === "winners") assert.equal(dropRound(last.round), r, x.name);
        else assert.equal(last.round + 1, r, x.name);
      }
    }
  });

  test("la forma compatta non porta id Discord e conserva le partite", () => {
    const c = compact(p);
    assert.equal(c.matches.length, p.matches.length);
    assert.ok(!JSON.stringify(c).includes("discord"));
  });
});

/** Un tabellone da 8 posti scritto a mano, nella forma di Tourney Bot (id dei giocatori = posti). */
function tiny(results: [number, number, number, number, number][]) {
  // [id partita, turno, giocatore 1, giocatore 2, vincitore]
  return {
    tourney: { id: 1, name: "Prova", participant_size: 8, best_of: 3, start_time: "2026-10-24T14:00:00.000Z" },
    players: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `p${i + 1}`, realUserId: `${1000000 + i}` })),
    games: results.map(([id, round, a, b, w]) => ({
      id,
      round,
      winner: w ? `u${w}` : null,
      player1: { id: a, name: `p${a}`, score: w === a ? 2 : 0, user_id: `u${a}` },
      player2: { id: b, name: `p${b}`, score: w === b ? 2 : 0, user_id: `u${b}` },
    })),
  };
}

describe("Playoff: tabellone da 8 posti", () => {
  // vincenti: 1-2, 3-4, 5-6, 7-8 → 1-3, 5-7 → 1-5; perdenti: 2-4, 6-8 → (2 e 6) contro 3 e 7 → … finale perdenti → gran finale
  const games: [number, number, number, number, number][] = [
    [2, 1, 1, 2, 1],
    [3, 1, 3, 4, 3],
    [4, 1, 5, 6, 5],
    [5, 1, 7, 8, 7],
    [6, 1, 2, 4, 2],
    [7, 1, 6, 8, 6],
    [8, 2, 2, 7, 2],
    [9, 2, 6, 3, 3],
    [10, 2, 1, 3, 1],
    [11, 2, 5, 7, 5],
    [12, 3, 2, 3, 3],
    [13, 3, 1, 5, 1],
    [14, 4, 3, 5, 5],
    [15, 5, 1, 5, 0],
  ];
  const t = parsePlayoffs(tiny(games)) as Playoffs;

  test("lati e turni", () => {
    assert.equal(t.wbRounds, 3);
    assert.equal(t.lbRounds, 4);
    const side = (id: number) => t.matches.find((m) => m.id === id)!;
    for (const id of [2, 3, 4, 5, 10, 11, 13]) assert.equal(side(id).side, "winners", `#${id}`);
    for (const id of [6, 7, 8, 9, 12, 14]) assert.equal(side(id).side, "losers", `#${id}`);
    assert.equal(side(15).side, "grand");
    assert.equal(side(15).round, 1);
  });

  test("i quattro delle finali con 3 turni dei vincenti: finale dei vincenti e turno 2 dei perdenti", () => {
    assert.deepEqual(t.finalists.winners, [1, 5]);
    assert.deepEqual(t.finalists.losers.sort(), [2, 3]);
    assert.equal(topFourDecided(t), true);
  });

  test("gran finale aperta e piazzamenti", () => {
    assert.deepEqual(
      openMatches(t).map((m) => m.id),
      [15],
    );
    assert.deepEqual(
      aliveRanked(t).map((x) => x.seat),
      [1, 5],
    );
    const three = t.players.find((x) => x.seat === 3)!;
    assert.equal(three.alive, false);
    assert.equal(three.out!.match, 14);
    assert.equal(three.out!.by, 5);
  });

  test("gli id Discord dalla risposta dal vivo restano sul giocatore", () => {
    assert.equal(t.players[0].discord, "1000000");
  });

  test("risposte non valide", () => {
    assert.equal(parsePlayoffs(null), null);
    assert.equal(parsePlayoffs({}), null);
    assert.equal(parsePlayoffs({ tourney: { id: 1, participant_size: 12 }, games: [], players: [] }), null);
  });

  test("nomi puliti", () => {
    assert.equal(cleanName("  ab\u200bc\u0007 "), "abc");
    assert.equal(cleanName(""), "?");
    assert.equal(cleanName("x".repeat(60)).length, 40);
  });
});

describe("Playoff: testi", () => {
  const TITLE_MAX = 60;
  const TITLE_MAX_NO_BRAND = 46;
  const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const flat = (o: unknown, path = ""): [string, string][] =>
    typeof o === "string" ? [[path, o]] : o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => flat(v, path ? `${path}.${k}` : k)) : [];

  test("title e description nei limiti", () => {
    for (const l of LOCALES) {
      const { title, description } = crimsonPlayoffsLabels[l].meta;
      const max = /origins tcg/i.test(title) ? TITLE_MAX : TITLE_MAX_NO_BRAND;
      assert.ok(title.length <= max, `${l}: ${title.length}`);
      assert.ok(description.length >= 120 && description.length <= 158, `${l}: ${description.length}`);
    }
  });

  test("stesse chiavi e stessi segnaposto in ogni lingua", () => {
    const en = new Map(flat(crimsonPlayoffsLabels.en));
    for (const l of LOCALES) {
      const other = new Map(flat(crimsonPlayoffsLabels[l]));
      assert.deepEqual([...other.keys()].sort(), [...en.keys()].sort(), l);
      for (const [k, v] of en) assert.deepEqual(holes(other.get(k)!), holes(v), `${l}.${k}`);
    }
  });

  test("francese: spazio insecabile prima di : ; ? !", () => {
    for (const [k, v] of flat(crimsonPlayoffsLabels.fr)) assert.ok(!/[^\u00a0\u202f\s][:;?!](\s|$)/.test(v.replace(/https?:\/\/\S+/g, "")), `fr.${k}: ${v}`);
  });

  test("nessun numero di giocatori nei testi", () => {
    for (const l of LOCALES) for (const [k, v] of flat(crimsonPlayoffsLabels[l])) assert.ok(!/\b25[56]\b/.test(v), `${l}.${k}`);
  });
});
