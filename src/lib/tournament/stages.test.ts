/**
 * Test della qualificazione a bracket, della fase finale, della pausa e del ban (`stages.ts`, 08/11/2026): `npm test`.
 * Confrontano anche le regole con il blocco "08/11/2026: BRACKET E TOP CUT" di supabase/schema.sql, che è il giudice
 * vero, e le etichette nelle otto lingue (`stageLabels.ts`).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BAN_WAIT_MINUTES,
  BRACKETS_PRESET,
  TOP_CUTS,
  banApplies,
  banRate,
  banState,
  holdRound,
  isHeld,
  matchStage,
  planOf,
  podLetter,
  podMatches,
  podOf,
  podWinner,
  podsDone,
  remainingDecks,
  stagePlan,
  topMatches,
  type MatchBan,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./stages.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { STAGE_RPC_ERRORS, stageLabels } from "./stageLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { seedOrder } from "./bracket.ts";

const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
const MARK = "-- ===== 08/11/2026: BRACKET E TOP CUT =====";
const block = schema.slice(schema.indexOf(MARK));
const typesSrc = readFileSync(new URL("./types.ts", import.meta.url), "utf8");
const actionsSrc = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

describe("regole uguali al database", () => {
  test("il blocco c'è ed è l'ultimo che tocca i tornei", () => {
    assert.ok(schema.includes(MARK));
    // le funzioni ridefinite qui non vanno ridefinite di nuovo più sotto da un blocco vecchio
    for (const fn of ["tm_propagate", "swap_players", "report_match_result", "mark_match_seen", "tm_notify_ready"]) {
      const last = schema.lastIndexOf(`create or replace function public.${fn}(`);
      assert.ok(last > schema.indexOf(MARK), `${fn} è ridefinita dopo il blocco`);
    }
  });
  test("256 posti come TOURNAMENT_SIZES", () => {
    assert.ok(block.includes("check (size in (4, 8, 16, 32, 64, 128, 256))"));
    assert.ok(/TOURNAMENT_SIZES = \[4, 8, 16, 32, 64, 128, 256\]/.test(typesSrc));
  });
  test("fasi finali come TOP_CUTS", () => {
    assert.ok(block.includes(`top_cut in (${TOP_CUTS.join(", ")}) and top_cut < size`));
  });
  test("il ban vale solo nel Conquest e con abbastanza mazzi", () => {
    assert.ok(block.includes("check (not deck_ban or deck_mode = 'conquest')"));
    assert.ok(block.includes("t.deck_ban and t.deck_mode = 'conquest' and t.conquest_decks - 1 >= public.tm_need(tid, rnd)"));
  });
  test("primo turno della fase finale come tm_top_round", () => {
    assert.ok(block.includes("if total <= k then return null; end if;"));
    assert.ok(block.includes("return total - k + 1;"));
    // stessa formula: totale dei turni − log2(fase finale) + 1, e niente fase finale se il tabellone non è più grande
    for (const size of [4, 8, 16, 32, 64, 128, 256]) {
      for (const cut of TOP_CUTS) {
        const total = Math.log2(size);
        const k = Math.log2(cut);
        assert.equal(stagePlan(size, cut).topRound, total <= k ? null : total - k + 1, `${size}/${cut}`);
      }
    }
  });
  test("pausa come tm_held: dalla fase finale in su, finché non è avviata", () => {
    assert.ok(block.includes("t.top_cut_hold and t.top_cut_released_at is null and rnd >= public.tm_top_round(tid)"));
  });
  test("errori delle RPC: tutti sollevati dal blocco, cercati da actions.ts e tradotti", () => {
    for (const code of STAGE_RPC_ERRORS) {
      assert.ok(block.includes(`raise exception '${code}'`), code);
      for (const [l, lab] of Object.entries(stageLabels)) assert.ok((lab as { errors: Record<string, string> }).errors[code], `${l}: ${code}`);
    }
    assert.ok(actionsSrc.includes("...STAGE_RPC_ERRORS"));
  });
  test("ban, letture e avvio: grant giusti", () => {
    assert.ok(block.includes("grant execute on function public.ban_deck(uuid, int) to authenticated;"));
    assert.ok(block.includes("grant execute on function public.release_top_cut(uuid) to authenticated;"));
    assert.ok(block.includes("grant execute on function public.match_bans(uuid) to anon, authenticated;"));
    assert.ok(block.includes("revoke all on public.tournament_bans from anon, authenticated;"));
    assert.ok(!/grant [a-z, ]+ on public\.tournament_bans/.test(block));
  });
  test("preset del formato", () => {
    assert.equal(BRACKETS_PRESET.size, 256);
    assert.equal(BRACKETS_PRESET.top_cut, 16);
    assert.ok(banApplies(BRACKETS_PRESET, 2), "al meglio delle 3 con tre mazzi il ban vale");
    assert.equal(BRACKETS_PRESET.final_best_of, null);
  });
});

describe("piano del tabellone", () => {
  test("256 con la Top 16: 16 bracket da 16, quattro turni ciascuno", () => {
    const p = stagePlan(256, 16);
    assert.deepEqual(p, { size: 256, totalRounds: 8, topCut: 16, pods: 16, podSize: 16, podRounds: 4, topRound: 5 });
  });
  test("meno iscritti: tabellone da 128, 16 bracket da 8", () => {
    assert.deepEqual(stagePlan(128, 16), { size: 128, totalRounds: 7, topCut: 16, pods: 16, podSize: 8, podRounds: 3, topRound: 4 });
  });
  test("tabellone non più grande della fase finale: un tabellone solo", () => {
    assert.equal(stagePlan(16, 16).topRound, null);
    assert.equal(stagePlan(8, 16).topCut, null);
    assert.equal(stagePlan(64, null).topRound, null);
    assert.equal(stagePlan(64, 12).topRound, null, "valori fuori elenco ignorati");
  });
  test("fase della partita", () => {
    const p = stagePlan(256, 16);
    assert.deepEqual(matchStage(p, 1, 0), { phase: "pod", pod: 0, round: 1, last: false });
    assert.deepEqual(matchStage(p, 1, 8), { phase: "pod", pod: 1, round: 1, last: false });
    assert.deepEqual(matchStage(p, 1, 127), { phase: "pod", pod: 15, round: 1, last: false });
    assert.deepEqual(matchStage(p, 2, 4), { phase: "pod", pod: 1, round: 2, last: false });
    assert.deepEqual(matchStage(p, 4, 15), { phase: "pod", pod: 15, round: 4, last: true });
    assert.deepEqual(matchStage(p, 5, 3), { phase: "top", round: 1, rounds: 4 });
    assert.deepEqual(matchStage(p, 8, 0), { phase: "top", round: 4, rounds: 4 });
    assert.deepEqual(matchStage(stagePlan(64, null), 3, 1), { phase: "single", round: 3 });
  });
  test("lettere dei bracket", () => {
    assert.equal(podLetter(0), "A");
    assert.equal(podLetter(15), "P");
    assert.equal(podLetter(25), "Z");
    assert.equal(podLetter(26), "AA");
    assert.equal(podLetter(31), "AF");
  });
});

/** Tabellone finto da 256 come lo crea tm_start: tutte le partite di tutti i turni. */
function fullBracket(size: number) {
  const out: { id: string; round: number; position: number; player_a: string | null; player_b: string | null; winner: string | null; status: string; ready_at: string | null }[] = [];
  for (let r = 1, n = size / 2; n >= 1; r++, n /= 2) for (let pos = 0; pos < n; pos++) out.push({ id: `${r}-${pos}`, round: r, position: pos, player_a: null, player_b: null, winner: null, status: "pending", ready_at: null });
  return out;
}

describe("bracket e fase finale a pezzi", () => {
  const p = stagePlan(256, 16);
  const all = fullBracket(256);
  test("ogni bracket è un tabellone da 16: 8 + 4 + 2 + 1 partite, posizioni da 0", () => {
    for (let pod = 0; pod < 16; pod++) {
      const ms = podMatches(all, p, pod);
      assert.equal(ms.length, 15);
      assert.deepEqual([1, 2, 3, 4].map((r) => ms.filter((m) => m.round === r).length), [8, 4, 2, 1]);
      assert.deepEqual(
        ms.filter((m) => m.round === 1).map((m) => m.position),
        [0, 1, 2, 3, 4, 5, 6, 7],
      );
      // le partite vere sono quelle del bracket giusto
      assert.ok(ms.every((m) => all.find((x) => x.id === m.id && matchStage(p, x.round, x.position).phase === "pod" && (matchStage(p, x.round, x.position) as { pod: number }).pod === pod)));
    }
  });
  test("i 16 bracket coprono tutte le partite della qualificazione una volta sola", () => {
    const ids = new Set<string>();
    for (let pod = 0; pod < 16; pod++) for (const m of podMatches(all, p, pod)) ids.add(m.id);
    assert.equal(ids.size, all.filter((m) => m.round < 5).length);
  });
  test("la Top 16 è un tabellone da 16 con i turni da 1", () => {
    const ms = topMatches(all, p);
    assert.equal(ms.length, 15);
    assert.deepEqual([1, 2, 3, 4].map((r) => ms.filter((m) => m.round === r).length), [8, 4, 2, 1]);
    assert.equal(ms.find((m) => m.round === 1 && m.position === 0)?.id, "5-0");
  });
  test("il vincitore del bracket entra nella Top 16 al posto giusto", () => {
    // finale del bracket k = turno 4, posizione k; il vincitore va al turno 5, posizione floor(k/2), lato k%2
    const ms = all.map((m) => (m.round === 4 && m.position === 5 ? { ...m, winner: "w5", status: "confirmed" } : m));
    assert.equal(podWinner(ms, p, 5), "w5");
    assert.equal(podWinner(ms, p, 4), null);
    assert.equal(podsDone(ms, p), 1);
  });
  test("bracket di un giocatore dal primo turno", () => {
    const ms = all.map((m) => (m.round === 1 && m.position === 42 ? { ...m, player_a: "u", player_b: "v" } : m));
    assert.equal(podOf(ms, p, "v"), 5);
    assert.equal(podOf(ms, p, "x"), null);
    assert.equal(podOf(ms, stagePlan(256, null), "v"), null);
  });
  test("planOf dalle partite", () => {
    assert.deepEqual(planOf(all, 16), p);
  });
});

describe("i bye si spartiscono fra i bracket alla pari (ordine standard dei seed)", () => {
  test("da 129 a 256 iscritti, in 16 bracket da 16: al più un bye di differenza", () => {
    const order = seedOrder(256);
    for (let n = 129; n <= 256; n++) {
      const byes = Array.from({ length: 16 }, () => 0);
      for (let pos = 0; pos < 128; pos++) if (order[2 * pos + 1] > n) byes[Math.floor(pos / 8)] += 1;
      assert.ok(Math.max(...byes) - Math.min(...byes) <= 1, `${n} iscritti: ${byes.join(",")}`);
      assert.equal(byes.reduce((a, b) => a + b, 0), 256 - n);
    }
  });
});

describe("pausa prima della fase finale", () => {
  const p = stagePlan(256, 16);
  test("solo con la pausa accesa e non ancora avviata", () => {
    assert.equal(holdRound({ top_cut_hold: true, top_cut_released_at: null }, p), 5);
    assert.equal(holdRound({ top_cut_hold: true, top_cut_released_at: "2026-11-28T14:00:00Z" }, p), null);
    assert.equal(holdRound({ top_cut_hold: false }, p), null);
    assert.equal(holdRound({ top_cut_hold: true }, stagePlan(16, 16)), null, "senza qualificazione niente pausa");
  });
  test("ferme le partite della fase finale senza ready_at", () => {
    assert.ok(isHeld({ round: 5, ready_at: null }, 5));
    assert.ok(isHeld({ round: 7 }, 5));
    assert.ok(!isHeld({ round: 4, ready_at: null }, 5));
    assert.ok(!isHeld({ round: 5, ready_at: "2026-11-28T14:00:00Z" }, 5));
    assert.ok(!isHeld({ round: 5, ready_at: null }, null));
  });
});

describe("ban", () => {
  test("vale con tre mazzi al meglio delle 3, non al meglio delle 5, non nel formato libero", () => {
    const t = { deck_ban: true, deck_mode: "conquest", conquest_decks: 3 };
    assert.ok(banApplies(t, 2));
    assert.ok(!banApplies(t, 3));
    assert.ok(!banApplies({ ...t, deck_mode: "free" }, 2));
    assert.ok(!banApplies({ ...t, deck_ban: false }, 2));
    assert.ok(banApplies({ ...t, conquest_decks: 4 }, 3));
  });
  const ban = (user_id: string, target: string, deck: number | null): MatchBan => ({ user_id, target, deck, legendary: deck === null ? null : `leg-${deck}`, created_at: "2026-11-28T10:31:00Z" });
  test("stato dei ban", () => {
    assert.deepEqual(banState([], "a", "b"), { mine: null, theirs: null, done: false });
    const one = banState([ban("a", "b", 1)], "a", "b");
    assert.equal(one.mine?.deck, 1);
    assert.equal(one.done, false);
    const hidden = banState([ban("b", "a", null)], "a", "b");
    assert.ok(hidden.theirs && hidden.theirs.deck === null && !hidden.done, "il ban dell'avversario c'è ma è nascosto");
    assert.ok(banState([ban("a", "b", 1), ban("b", "a", 0)], "a", "b").done);
  });
  test("mazzi rimasti", () => {
    assert.deepEqual(remainingDecks(3, 1), [0, 2]);
    assert.deepEqual(remainingDecks(3, null), [0, 1, 2]);
  });
  test("ban rate", () => {
    assert.equal(banRate({ bans: 3, chances: 4 }), 0.75);
    assert.equal(banRate({ bans: 0, chances: 0 }), 0);
  });
  test("coda dello staff", () => assert.equal(BAN_WAIT_MINUTES, 10));
});

describe("etichette nelle otto lingue", () => {
  const en = stageLabels.en;
  const holes = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(",");
  const flat = (o: Record<string, unknown>, prefix = ""): [string, string][] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : flat(v as Record<string, unknown>, `${prefix}${k}.`)));
  const ref = new Map(flat(en));
  test("otto lingue", () => assert.deepEqual(Object.keys(stageLabels).sort(), ["de", "en", "es", "fr", "it", "pt", "ru", "zh-cn"]));
  for (const [l, lab] of Object.entries(stageLabels)) {
    test(`${l}: stesse chiavi e stessi segnaposto dell'inglese, niente testo vuoto`, () => {
      const mine = new Map(flat(lab as Record<string, unknown>));
      assert.deepEqual([...mine.keys()].sort(), [...ref.keys()].sort());
      for (const [k, v] of mine) {
        assert.ok(v.trim().length > 0, `${l}.${k} vuoto`);
        assert.equal(holes(v), holes(ref.get(k) as string), `${l}.${k}`);
      }
    });
  }
  test("francese: spazio insecabile prima di : ; ? !", () => {
    for (const [k, v] of flat(stageLabels.fr)) assert.ok(!/ [:;?!]/.test(v), `fr.${k}: ${v}`);
  });
  test("niente bianco pieno né nomi del vecchio database delle carte", () => {
    for (const lab of Object.values(stageLabels)) for (const [, v] of flat(lab as Record<string, unknown>)) assert.ok(!/world of origins|worldoforigins/i.test(v));
  });
});
