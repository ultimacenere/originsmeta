/**
 * Test dei voti alle carte da 1 a 10 e della tier list dei voti (06/10/2026): `node --test src/lib/cardVotes.test.ts`.
 * - Funzioni pure di cardVotes.ts: fasce dalla media, righe della funzione card_ratings ridotte a punteggi (righe sporche
 *   ignorate, fascia solo da CARD_RANKED_MIN_VOTES voti), distribuzione, ordine, stato della pagina.
 * - Etichette nelle tre lingue (cardVoteLabels.ts): titoli e description nei limiti di Google (le regole di `pageTitle` e
 *   `cleanDescription`, come hubMeta.test.ts), stessi segnaposto in ogni lingua, informativa con il contatto e l'indirizzo.
 * - Lo stesso blocco VOTI ALLE CARTE di schema.sql: punteggio 1–10, tetto per iscritto uguale a CARD_VOTES_PER_USER_MAX,
 *   tabella chiusa ad anon e letta solo per le proprie righe, funzioni degli aggregati per anon.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  CARD_RANKED_MIN_VOTES,
  CARD_SCORES,
  CARD_SCORE_MAX,
  CARD_SCORE_MIN,
  CARD_VOTES_MIN_VOTERS,
  CARD_VOTES_PER_USER_MAX,
  SCORE_TIERS,
  cardRatingsFrom,
  distributionFrom,
  fillVoteText,
  isCardScore,
  ratingOrder,
  tierFromScore,
  votesStage,
  votesWord,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./cardVotes.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { cardVoteLabels } from "./cardVoteLabels.ts";

const LOCALES = ["en", "it", "es"] as const;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 158;

describe("voti alle carte: numeri", () => {
  test("la scala va da 1 a 10, interi", () => {
    assert.equal(CARD_SCORE_MIN, 1);
    assert.equal(CARD_SCORE_MAX, 10);
    assert.deepEqual(CARD_SCORES, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const n of CARD_SCORES) assert.ok(isCardScore(n));
    for (const bad of [0, 11, 5.5, -1, NaN, "7", null]) assert.ok(!isCardScore(bad), String(bad));
  });

  test("fasce dalla media: S da 8,5, A da 7, B da 5,5, C da 4, D sotto", () => {
    assert.deepEqual(SCORE_TIERS, { S: 8.5, A: 7, B: 5.5, C: 4 });
    assert.equal(tierFromScore(10), "S");
    assert.equal(tierFromScore(8.5), "S");
    assert.equal(tierFromScore(8.49), "A");
    assert.equal(tierFromScore(7), "A");
    assert.equal(tierFromScore(6.99), "B");
    assert.equal(tierFromScore(5.5), "B");
    assert.equal(tierFromScore(5.49), "C");
    assert.equal(tierFromScore(4), "C");
    assert.equal(tierFromScore(3.99), "D");
    assert.equal(tierFromScore(1), "D");
  });

  test("distribuzione: dieci numeri dal JSON punteggio → quanti, fuori scala ignorati", () => {
    assert.deepEqual(distributionFrom({ "9": 1, "6": 2, "11": 5, x: 3, "0": 1 }), [0, 0, 0, 0, 0, 2, 0, 0, 1, 0]);
    assert.deepEqual(distributionFrom(null), Array(10).fill(0));
    assert.deepEqual(distributionFrom("sporco"), Array(10).fill(0));
  });

  test("cardRatingsFrom: media, voti, distribuzione e fascia solo da 3 voti; righe sporche ignorate", () => {
    const out = cardRatingsFrom([
      { card: "dorothy", avg_score: "7.50", votes: "2", dist: { "6": 1, "9": 1 } },
      { card: "merlin", avg_score: 9.17, votes: 3, dist: { "9": 2, "10": 1 } },
      { card: "Bad Slug", avg_score: 5, votes: 3, dist: {} },
      { card: "zero", avg_score: 5, votes: 0, dist: {} },
      { card: "fuori", avg_score: 12, votes: 3, dist: {} },
    ]);
    assert.deepEqual(Object.keys(out).sort(), ["dorothy", "merlin"]);
    assert.deepEqual(out.dorothy, { avg: 7.5, votes: 2, dist: [0, 0, 0, 0, 0, 1, 0, 0, 1, 0] });
    assert.equal(out.dorothy.tier, undefined, "sotto i 3 voti niente fascia");
    assert.equal(out.merlin.tier, "S");
    assert.equal(out.merlin.avg, 9.17);
    assert.equal(CARD_RANKED_MIN_VOTES, 3);
    // la soglia si può passare: con 2 voti Dorothy ha la fascia
    assert.equal(cardRatingsFrom([{ card: "dorothy", avg_score: 7.5, votes: 2, dist: {} }], 2).dorothy.tier, "A");
  });

  test("ratingOrder: media più alta, poi più voti, poi costo e nome; senza voti in fondo", () => {
    const a = { name: "A", mana: 3, rating: { avg: 8, votes: 3 } };
    const b = { name: "B", mana: 2, rating: { avg: 8, votes: 5 } };
    const c = { name: "C", mana: 1, rating: { avg: 9, votes: 1 } };
    const z = { name: "Z", mana: 0 };
    assert.deepEqual([a, z, b, c].sort(ratingOrder).map((x) => x.name), ["C", "B", "A", "Z"]);
    const d = { name: "D", mana: 1, rating: { avg: 8, votes: 5 } };
    assert.deepEqual([b, d].sort(ratingOrder).map((x) => x.name), ["D", "B"], "a pari media e voti vince il costo più basso");
  });

  test("votesStage: vuota, anteprima sotto 5 votanti, a regime da 5", () => {
    assert.equal(CARD_VOTES_MIN_VOTERS, 5);
    assert.equal(votesStage(0, 0), "empty");
    assert.equal(votesStage(1, 0), "empty");
    assert.equal(votesStage(1, 3), "preview");
    assert.equal(votesStage(4, 40), "preview");
    assert.equal(votesStage(5, 5), "live");
    assert.equal(votesStage(2, 9, 2), "live");
  });

  test("fillVoteText e votesWord", () => {
    assert.equal(fillVoteText("{n} su {min} ({x})", { n: 2, min: 5 }), "2 su 5 ({x})");
    assert.equal(fillVoteText("$& {n}", { n: "$&" }), "$& $&", "niente sostituzioni speciali di String.replace");
    assert.equal(votesWord({ one: "1 voto", many: "{n} voti" }, 1), "1 voto");
    assert.equal(votesWord({ one: "1 voto", many: "{n} voti" }, 12), "12 voti");
  });
});

describe("voti alle carte: etichette nelle tre lingue", () => {
  const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
  const en = cardVoteLabels.en;
  for (const l of LOCALES) {
    const x = cardVoteLabels[l];
    test(`${l}: titoli e description per la SERP`, () => {
      for (const title of [x.page.title, x.page.titlePreview]) {
        assert.ok(title.includes("Origins TCG"), title);
        assert.ok(title.length <= TITLE_MAX, `${title.length}: ${title}`);
      }
      assert.ok(x.page.description.length >= DESC_MIN && x.page.description.length <= DESC_MAX, `${x.page.description.length}: ${x.page.description}`);
      assert.ok(x.page.description.includes("Origins TCG"));
      assert.ok(x.page.h1.length < x.page.title.length);
    });

    test(`${l}: stessi segnaposto dell'inglese in ogni frase`, () => {
      const walk = (a: unknown, b: unknown, path: string) => {
        if (typeof a === "string") {
          assert.equal(typeof b, "string", path);
          assert.deepEqual(placeholders(b as string), placeholders(a), `${path}: ${b}`);
        } else if (Array.isArray(a)) {
          assert.ok(Array.isArray(b) && b.length === a.length, path);
          a.forEach((item, i) => walk(item, (b as unknown[])[i], `${path}[${i}]`));
        } else if (a && typeof a === "object") {
          for (const [k, v] of Object.entries(a)) walk(v, (b as Record<string, unknown>)[k], `${path}.${k}`);
        }
      };
      walk(en, x, l);
      assert.equal(x.page.how.length, 4);
    });

    test(`${l}: informativa con il contatto e l'indirizzo della pagina, scala 1–10 nei testi`, () => {
      assert.ok(x.privacy.includes("staff@originsmeta.com"));
      assert.ok(x.privacy.includes("/tier-list/votes"));
      assert.ok(/IP/.test(x.privacy));
      assert.ok(x.widget.rate.includes("1") && x.widget.rate.includes("10"));
      assert.ok(x.explorer.scale.startsWith("1 ") && x.explorer.scale.includes("10"));
    });
  }
});

describe("voti alle carte: come il blocco VOTI ALLE CARTE di schema.sql", () => {
  const sql = fs.readFileSync(new URL("../../supabase/schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const at = sql.indexOf("-- ===== 06/10/2026: VOTI ALLE CARTE =====");
  const next = sql.indexOf("\n-- ===== ", at + 10);
  const block = sql.slice(at, next < 0 ? undefined : next);

  test("blocco presente, punteggio 1–10, tetto per iscritto uguale al codice", () => {
    assert.ok(at > 0);
    assert.match(block, /score smallint not null check \(score between 1 and 10\)/);
    assert.ok(block.includes(`>= ${CARD_VOTES_PER_USER_MAX} then`), `tetto ${CARD_VOTES_PER_USER_MAX} nel trigger`);
    assert.match(block, /primary key \(card, user_id\)/);
  });

  test("tabella chiusa ad anon, letta solo per le proprie righe; aggregati dalle funzioni per anon e authenticated", () => {
    assert.match(block, /revoke all on public\.card_votes from anon, authenticated;/);
    assert.match(block, /grant select, insert, update, delete on public\.card_votes to authenticated;/);
    assert.match(block, /for select to authenticated using \(user_id = auth\.uid\(\)\)/);
    assert.ok(!/for select using \(true\)/.test(block), "nessuna lettura pubblica dei voti");
    assert.match(block, /grant execute on function public\.card_ratings\(text\) to anon, authenticated;/);
    assert.match(block, /grant execute on function public\.card_vote_totals\(\) to anon, authenticated;/);
    assert.match(block, /security definer/);
    assert.match(block, /execute function public\.guard_created_at\(\)/);
  });
});
