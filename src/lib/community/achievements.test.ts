/**
 * Test del pacchetto TRAGUARDI (`achievements.ts`, 27/09/2026) con il runner integrato di Node:
 * `node --test src/lib/community/achievements.test.ts`. Traguardi calcolati dai fatti, difesa in lettura delle risposte
 * delle funzioni SQL, tornei in evidenza e vincitori, etichette nelle tre lingue e coerenza fra il codice e
 * supabase/wave2-TRAGUARDI.sql (ruoli con vetrina, soglie, grant, sicurezza delle funzioni). Mai la rete.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PROFILES_GRANTS, schemaProblems, singleDollarLines, sqlStatements, withPendingBlocks } from "../../../scripts/schema-guard.mjs";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_LOOK,
  DECK_MILESTONES,
  DECK_OF_MONTH_MIN_STARS,
  DECK_OF_MONTH_MIN_VOTES,
  DEMO2_CUTOFF,
  FINISHED_SHOWN,
  SEED_BOT_USERNAME,
  STALE_OPEN_DAYS,
  UPCOMING_SHOWN,
  WELL_RATED,
  dayOf,
  earnedAchievements,
  featuredTournaments,
  fillAchievement,
  finalWinners,
  isMissing,
  isSeedBot,
  parsePublicStats,
  parseRemoteFacts,
  safeCover,
  type LocalFacts,
  type RemoteFacts,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come negli altri test.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./achievements.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { SHOWCASE_BADGES } from "./badges.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { achievementLabels } from "../achievementLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { steamNextFest } from "../data/events.ts";

const EMPTY: LocalFacts = { memberSince: null, decks: [], tierLists: [] };
const NO_TOURNAMENTS: RemoteFacts = { played: { count: 0, first: null }, organized: { count: 0, first: null }, won: { count: 0, first: null }, topMonths: [] };
const deck = (created_at: string, votes = 0, avg = 0, fullGuide = false) => ({ created_at, votes, avg, fullGuide });
const ids = (list: { id: string }[]) => list.map((e) => e.id);

describe("traguardi dai fatti", () => {
  test("nessun fatto, nessun traguardo", () => {
    assert.deepEqual(earnedAchievements(EMPTY, null), []);
    assert.deepEqual(earnedAchievements(EMPTY, NO_TOURNAMENTS), []);
  });

  test("Dalla Demo 2.0: account creato prima dell'inizio dello Steam Next Fest, non dopo né in quell'istante", () => {
    assert.equal(Date.parse(DEMO2_CUTOFF), Date.parse(steamNextFest.startAt), "stesso istante di events.ts");
    const at = (memberSince: string) => earnedAchievements({ ...EMPTY, memberSince }, null);
    assert.deepEqual(at("2026-09-21T08:30:00+00:00"), [{ id: "demo2", date: "2026-09-21", count: 1, months: [] }]);
    assert.deepEqual(ids(at("2026-10-19T16:59:59Z")), ["demo2"]);
    assert.deepEqual(at(DEMO2_CUTOFF), []);
    assert.deepEqual(at("2026-10-19T19:00:00+02:00"), [], "le 19:00 in Italia sono l'inizio del Next Fest");
    assert.deepEqual(at("non una data"), []);
  });

  test("mazzi: primo, quinto e decimo pubblicato, con la data di quel mazzo (anche se l'elenco arriva in disordine)", () => {
    const days = ["2026-09-30", "2026-09-22", "2026-09-25", "2026-09-23", "2026-09-28", "2026-09-24", "2026-09-26", "2026-09-27", "2026-09-29", "2026-10-01", "2026-09-21"];
    const four = earnedAchievements({ ...EMPTY, decks: days.slice(0, 4).map((d) => deck(`${d}T10:00:00Z`)) }, null);
    assert.deepEqual(four, [{ id: "first_deck", date: "2026-09-22", count: 1, months: [] }]);
    const eleven = earnedAchievements({ ...EMPTY, decks: days.map((d) => deck(`${d}T10:00:00Z`)) }, null);
    assert.deepEqual(ids(eleven), ["first_deck", "decks_5", "decks_10"]);
    const sorted = [...days].sort();
    assert.equal(eleven[0].date, sorted[DECK_MILESTONES.first_deck - 1]);
    assert.equal(eleven[1].date, sorted[DECK_MILESTONES.decks_5 - 1]);
    assert.equal(eleven[2].date, sorted[DECK_MILESTONES.decks_10 - 1]);
    assert.equal(eleven[2].date, "2026-09-30");
  });

  test("guida completa: il primo mazzo con la guida sopra la soglia", () => {
    const got = earnedAchievements({ ...EMPTY, decks: [deck("2026-09-25T00:00:00Z", 0, 0, true), deck("2026-09-22T00:00:00Z"), deck("2026-09-24T00:00:00Z", 0, 0, true)] }, null);
    assert.deepEqual(got.find((e) => e.id === "full_guide"), { id: "full_guide", date: "2026-09-24", count: 1, months: [] });
  });

  test("mazzo apprezzato: almeno 5 voti e media di almeno 4,5, contato per mazzo", () => {
    const rated = (votes: number, avg: number) => earnedAchievements({ ...EMPTY, decks: [deck("2026-09-22T00:00:00Z", votes, avg)] }, null).find((e) => e.id === "well_rated");
    assert.ok(rated(WELL_RATED.minVotes, WELL_RATED.minAvg));
    assert.ok(rated(12, 5));
    assert.equal(rated(4, 5), undefined, "4 voti non bastano");
    assert.equal(rated(5, 4.49), undefined, "4,49 non basta");
    const two = earnedAchievements({ ...EMPTY, decks: [deck("2026-09-22T00:00:00Z", 6, 4.8), deck("2026-09-23T00:00:00Z", 9, 4.5), deck("2026-09-24T00:00:00Z", 30, 4.2)] }, null);
    assert.deepEqual(two.find((e) => e.id === "well_rated"), { id: "well_rated", date: null, count: 2, months: [] });
  });

  test("prima tier list: serve almeno una carta classificata", () => {
    assert.deepEqual(earnedAchievements({ ...EMPTY, tierLists: [{ created_at: "2026-09-23T00:00:00Z", ranked: 0 }] }, null), []);
    const got = earnedAchievements({ ...EMPTY, tierLists: [{ created_at: "2026-09-26T00:00:00Z", ranked: 3 }, { created_at: "2026-09-24T00:00:00Z", ranked: 11 }] }, null);
    assert.deepEqual(got, [{ id: "tier_list", date: "2026-09-24", count: 1, months: [] }]);
  });

  test("tornei e mazzo del mese solo con i fatti della funzione SQL; senza, gli altri traguardi restano", () => {
    const local: LocalFacts = { memberSince: "2026-09-21T00:00:00Z", decks: [deck("2026-09-22T00:00:00Z")], tierLists: [] };
    const remote: RemoteFacts = {
      played: { count: 3, first: "2026-10-20T18:00:00+00:00" },
      organized: { count: 1, first: "2026-10-22T17:00:00+00:00" },
      won: { count: 2, first: "2026-10-21T18:00:00+00:00" },
      topMonths: ["2026-10", "2026-11"],
    };
    assert.deepEqual(ids(earnedAchievements(local, null)), ["demo2", "first_deck"]);
    const all = earnedAchievements(local, remote);
    assert.deepEqual(ids(all), ["demo2", "first_deck", "deck_of_month", "tournament_played", "tournament_organized", "tournament_won"]);
    assert.deepEqual(all.find((e) => e.id === "deck_of_month"), { id: "deck_of_month", date: null, count: 2, months: ["2026-10", "2026-11"] });
    assert.deepEqual(all.find((e) => e.id === "tournament_won"), { id: "tournament_won", date: "2026-10-21", count: 2, months: [] });
    assert.deepEqual(ids(earnedAchievements(local, NO_TOURNAMENTS)), ["demo2", "first_deck"]);
  });

  test("sempre nell'ordine del catalogo", () => {
    const local: LocalFacts = {
      memberSince: "2026-09-21T00:00:00Z",
      decks: Array.from({ length: 10 }, (_, i) => deck(`2026-09-${String(10 + i)}T00:00:00Z`, 5, 5, true)),
      tierLists: [{ created_at: "2026-09-23T00:00:00Z", ranked: 5 }],
    };
    const remote: RemoteFacts = { played: { count: 1, first: null }, organized: { count: 1, first: null }, won: { count: 1, first: null }, topMonths: ["2026-10"] };
    assert.deepEqual(ids(earnedAchievements(local, remote)), [...ACHIEVEMENTS]);
  });
});

describe("catalogo", () => {
  test("fra 8 e 12 traguardi, ognuno con disegno e tono; oro solo per il torneo vinto", () => {
    assert.ok(ACHIEVEMENTS.length >= 8 && ACHIEVEMENTS.length <= 12, `${ACHIEVEMENTS.length} traguardi`);
    assert.deepEqual(Object.keys(ACHIEVEMENT_LOOK).sort(), [...ACHIEVEMENTS].sort());
    for (const id of ACHIEVEMENTS) assert.equal(ACHIEVEMENT_LOOK[id].tone === "gold", id === "tournament_won", id);
    assert.equal(ACHIEVEMENT_LOOK.decks_10.mark, String(DECK_MILESTONES.decks_10));
  });
});

describe("difesa in lettura", () => {
  test("dayOf: giorno UTC o null", () => {
    assert.equal(dayOf("2026-09-27T23:30:00-02:00"), "2026-09-28");
    assert.equal(dayOf("2026-09-27"), "2026-09-27");
    assert.equal(dayOf(""), null);
    assert.equal(dayOf(null), null);
    assert.equal(dayOf("ieri"), null);
  });

  test("fatti della funzione SQL: forma attesa, conteggi anche come stringhe, mesi ripuliti", () => {
    const raw = {
      played: { count: 2, first: "2026-10-20T18:00:00+00:00" },
      organized: { count: "0", first: null },
      won: { count: 1, first: "2026-10-20T18:00:00+00:00" },
      top_months: ["2026-11", "2026-10", "2026-10", "2026-13", 7, "ottobre"],
    };
    assert.deepEqual(parseRemoteFacts(raw), {
      played: { count: 2, first: "2026-10-20T18:00:00+00:00" },
      organized: { count: 0, first: null },
      won: { count: 1, first: "2026-10-20T18:00:00+00:00" },
      topMonths: ["2026-10", "2026-11"],
    });
    // una data senza tornei non conta
    assert.deepEqual(parseRemoteFacts({ ...raw, won: { count: 0, first: "2026-10-20T18:00:00+00:00" } })?.won, { count: 0, first: null });
    assert.deepEqual(parseRemoteFacts({ ...raw, top_months: null })?.topMonths, []);
  });

  test("fatti della funzione SQL: una risposta strana non inventa traguardi", () => {
    for (const raw of [null, undefined, "x", 3, [], [{}], {}, { played: { count: 1 } }]) assert.equal(parseRemoteFacts(raw), null, JSON.stringify(raw));
    const base = { played: { count: 1, first: null }, organized: { count: 0, first: null }, won: { count: 0, first: null }, top_months: [] };
    for (const bad of [-1, 1.5, "tre", null, Number.NaN, 2 ** 60]) {
      assert.equal(parseRemoteFacts({ ...base, won: { count: bad, first: null } }), null, String(bad));
    }
    assert.equal(parseRemoteFacts({ ...base, played: { count: 1, first: 12 } })?.played.first, null);
  });

  test("numeri pubblici: una riga, bigint anche come stringhe, niente con zero mazzi o senza riga", () => {
    assert.deepEqual(parsePublicStats([{ decks: 4, views: "1250", code_copies: 87, votes: 19, since: "2026-09-26" }]), {
      decks: 4,
      views: 1250,
      codeCopies: 87,
      votes: 19,
      since: "2026-09-26",
    });
    assert.deepEqual(parsePublicStats({ decks: 1, views: 0, code_copies: 0, votes: 0, since: null })?.since, null);
    assert.equal(parsePublicStats([]), null, "show_stats spento: nessuna riga");
    assert.equal(parsePublicStats(null), null);
    assert.equal(parsePublicStats([{ decks: 0, views: 10, code_copies: 1, votes: 0, since: null }]), null);
    assert.equal(parsePublicStats([{ decks: 2, views: -1, code_copies: 1, votes: 0, since: null }]), null);
    assert.equal(parsePublicStats([{ decks: 2, views: 3, votes: 0, since: null }]), null);
  });

  test("funzione o colonna non ancora nel database", () => {
    assert.equal(isMissing({ status: 404, error: { code: "PGRST202" } }), true);
    assert.equal(isMissing({ status: 400, error: { code: "42703", message: "column profiles.show_stats does not exist" } }), true);
    assert.equal(isMissing({ error: { code: "42883" } }), true);
    assert.equal(isMissing({ status: 500, error: { code: "57014" } }), false);
    assert.equal(isMissing({ status: 200, error: null }), false);
    assert.equal(isMissing(null), false);
  });
});

describe("tornei in evidenza", () => {
  const t = (id: string, status: string, starts_at: string) => ({ id, status, starts_at });
  const NOW = Date.parse("2026-09-27T12:00:00Z");
  const all = { now: NOW, hasWinner: () => true };

  test("prima in corso e aperti (il più vicino per primo), poi i finiti dal più recente; annullati fuori", () => {
    const list = [
      t("f-old", "finished", "2026-09-01T18:00:00Z"),
      t("open-late", "open", "2026-11-10T18:00:00Z"),
      t("cancelled", "cancelled", "2026-10-05T18:00:00Z"),
      t("running", "running", "2026-09-26T18:00:00Z"),
      t("open-soon", "open", "2026-10-02T18:00:00Z"),
      t("f-new", "finished", "2026-09-20T18:00:00Z"),
    ];
    const { upcoming, finished } = featuredTournaments(list, all);
    assert.deepEqual(ids(upcoming), ["running", "open-soon", "open-late"]);
    assert.deepEqual(ids(finished), ["f-new", "f-old"]);
  });

  test("un torneo aperto con la data d'inizio passata da più di una settimana non si mostra; in corso sì, anche vecchio", () => {
    const day = 86_400_000;
    const iso = (ms: number) => new Date(ms).toISOString();
    const list = [
      t("open-dead", "open", iso(NOW - (STALE_OPEN_DAYS + 1) * day)),
      t("open-late-start", "open", iso(NOW - (STALE_OPEN_DAYS - 1) * day)),
      t("running-long", "running", iso(NOW - 30 * day)),
    ];
    assert.deepEqual(ids(featuredTournaments(list, all).upcoming), ["running-long", "open-late-start"]);
  });

  test("in arrivo: al massimo UPCOMING_SHOWN, i più vicini", () => {
    const list = Array.from({ length: UPCOMING_SHOWN + 2 }, (_, i) => t(`o${i}`, "open", `2026-10-${String(10 + i)}T18:00:00Z`));
    const { upcoming } = featuredTournaments(list, all);
    assert.equal(upcoming.length, UPCOMING_SHOWN);
    assert.equal(upcoming[0].id, "o0");
  });

  test("dei finiti solo quelli con un vincitore (finale giocata, niente bot), i più recenti", () => {
    const list = Array.from({ length: FINISHED_SHOWN + 3 }, (_, i) => t(`f${i}`, "finished", `2026-09-${String(10 + i)}T18:00:00Z`));
    const { finished } = featuredTournaments(list, all);
    assert.equal(finished.length, FINISHED_SHOWN);
    assert.equal(finished[0].id, `f${FINISHED_SHOWN + 2}`);
    // "finito" scritto via API senza finale: nessun vincitore, non compare
    const some = featuredTournaments(list, { now: NOW, hasWinner: (id) => id === "f1" || id === "f3" });
    assert.deepEqual(ids(some.finished), ["f3", "f1"]);
  });

  test("bot di prova di scripts/seed-bots.mjs: bot-<n> e bot-<n>-<k>, nient'altro", () => {
    for (const u of ["bot-1", "bot-12", "bot-3-1"]) assert.equal(isSeedBot(u), true, u);
    for (const u of ["bot", "bot-", "bot-master", "robot-1", "bot-1a", "abot-1", "", null, undefined]) assert.equal(isSeedBot(u), false, String(u));
    // lo script crea proprio questi nomi (user_name bot-<n> nei metadati, handle_new_user li tiene così)
    const script = readFileSync(new URL("../../../scripts/seed-bots.mjs", import.meta.url), "utf8");
    assert.ok(script.includes("user_name: `bot-${i}`"));
  });

  test("copertina: solo del media kit o caricata nella cartella dell'organizzatore, altrimenti quella di default", () => {
    const presets = ["/media/keyart-mulan.webp", "/media/hero-1920.webp"];
    const prefix = "https://x.supabase.co/storage/v1/object/public/tournament-covers/u1/";
    const fallback = "/media/keyart-king-arthur.webp";
    assert.equal(safeCover("/media/hero-1920.webp", presets, prefix, fallback), "/media/hero-1920.webp");
    assert.equal(safeCover(`${prefix}cover-1.webp`, presets, prefix, fallback), `${prefix}cover-1.webp`);
    for (const bad of [
      "https://tracker.example/pixel.gif",
      "https://x.supabase.co/storage/v1/object/public/tournament-covers/u2/cover.webp",
      `${prefix}../u2/cover.webp`,
      `${prefix}..`,
      `${prefix}.`,
      `${prefix}a/b.webp`,
      `${prefix}`,
      "/media/keyart-mulan.webp?x=1",
      "javascript:alert(1)",
      "",
      null,
      undefined,
    ]) {
      assert.equal(safeCover(bad, presets, prefix, fallback), fallback, String(bad));
    }
    assert.equal(safeCover("https://evil.example/u1/a.webp", presets, "", fallback), fallback, "prefisso vuoto: nessun caricato");
  });

  test("vincitore: la partita in posizione 0 dell'ultimo turno, confermata o bye", () => {
    const row = (tournament_id: string, round: number, winner: string | null, status = "confirmed", position = 0) => ({ tournament_id, round, position, winner, status });
    const winners = finalWinners([
      row("a", 1, "u1"),
      row("a", 3, "u9"),
      row("a", 2, "u2"),
      row("b", 2, "u3", "reported"),
      row("b", 1, "u4"),
      row("c", 1, "u5", "bye"),
      row("d", 2, null, "pending"),
      row("e", 5, "u7", "confirmed", 1),
      row("e", 4, "u8"),
    ]);
    assert.deepEqual(Object.fromEntries(winners), { a: "u9", c: "u5", e: "u8" });
  });
});

describe("etichette nelle tre lingue", () => {
  type Tree = { [key: string]: string | Tree };
  const leaves = (obj: Tree, prefix = ""): Map<string, string> => {
    const out = new Map<string, string>();
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") out.set(key, v);
      else for (const [kk, vv] of leaves(v, key)) out.set(kk, vv);
    }
    return out;
  };
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const en = leaves(achievementLabels.en as unknown as Tree);

  for (const locale of ["it", "es"] as const) {
    test(`${locale}: stesse chiavi e stessi segnaposto dell'inglese, nessun testo vuoto`, () => {
      const other = leaves(achievementLabels[locale] as unknown as Tree);
      assert.deepEqual([...other.keys()].sort(), [...en.keys()].sort());
      for (const [key, text] of other) {
        assert.ok(text.trim(), `${locale} ${key} vuota`);
        assert.deepEqual(placeholders(text), placeholders(en.get(key) ?? ""), `${locale} ${key}: segnaposto diversi`);
      }
    });
  }

  test("ogni traguardo ha nome e descrizione, nomi diversi fra loro in ogni lingua; spagnolo col tú", () => {
    for (const [locale, l] of Object.entries(achievementLabels)) {
      const names = ACHIEVEMENTS.map((id) => l.achievements.items[id].name);
      assert.equal(new Set(names).size, names.length, `${locale}: nomi doppi`);
      for (const id of ACHIEVEMENTS) assert.ok(l.achievements.items[id].description.length <= 160, `${locale} ${id}: descrizione lunga`);
    }
    for (const text of leaves(achievementLabels.es as unknown as Tree).values()) {
      assert.doesNotMatch(text, /\b(vosotros|usted|ordenador|móvil)\b/i, text);
    }
  });

  test("i segnaposto si riempiono tutti, senza interpretare i $", () => {
    const d = achievementLabels.it.achievements.items;
    assert.equal(fillAchievement(d.well_rated.description, { votes: 5, avg: "4,5" }), "Un mazzo pubblicato con almeno 5 voti e una media di 4,5 stelle o più.");
    assert.equal(
      fillAchievement(d.deck_of_month.description, { stars: DECK_OF_MONTH_MIN_STARS, min: DECK_OF_MONTH_MIN_VOTES }),
      "Il mazzo con più voti positivi (4 o 5 stelle) del sito in un mese, almeno 3 in quel mese.",
    );
    assert.equal(fillAchievement("{name} $& {x}", { name: "a$1" }), "a$1 $& {x}");
  });

  test("la privacy non promette più di quello che la funzione garantisce", () => {
    // con un solo mazzo i totali SONO i numeri di quel mazzo, e due letture a un giorno di distanza danno il giorno:
    // i testi lo dicono invece di promettere "mai per giorno o per mazzo"
    for (const l of Object.values(achievementLabels)) {
      assert.doesNotMatch(l.privacy, /mai i numeri per giorno|never the figures per day|nunca las cifras por día/i);
      assert.match(l.privacy, /single deck|solo mazzo|solo mazo/);
      assert.match(l.account.intro, /single published deck|solo mazzo pubblicato|solo mazo publicado/);
    }
  });
});

/*
  L'SQL del pacchetto: il blocco `-- ===== 27/09/2026: TRAGUARDI =====` di schema.sql quando l'integratore l'ha accodato
  (anche se poi cancella il file wave2), altrimenti supabase/wave2-TRAGUARDI.sql. Come notifications.test.ts di SEGUI.
*/
const MARKER = "-- ===== 27/09/2026: TRAGUARDI =====";
function traguardiSql(): string {
  const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
  const at = schema.indexOf(MARKER);
  if (at >= 0) {
    const next = schema.indexOf("\n-- ===== ", at + MARKER.length);
    return schema.slice(at, next < 0 ? undefined : next);
  }
  const file = new URL("../../../supabase/wave2-TRAGUARDI.sql", import.meta.url);
  assert.ok(existsSync(file), "manca l'SQL del pacchetto TRAGUARDI (supabase/wave2-TRAGUARDI.sql o il blocco in schema.sql)");
  return readFileSync(file, "utf8");
}

describe("SQL del pacchetto TRAGUARDI: le stesse regole del codice", () => {
  const sql = traguardiSql();
  const stmts = sqlStatements(sql);
  const quoted = (s: string) => [...s.matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
  const fn = (name: string) => stmts.find((s) => s.startsWith(`create or replace function public.${name}(`)) ?? "";

  test("ruoli con vetrina: lo stesso elenco di SHOWCASE_BADGES nel trigger e nei numeri pubblici", () => {
    const guard = /new\.badge not in \(([^)]*)\)/.exec(fn("guard_profile_show_stats"));
    const stats = /p\.badge in \(([^)]*)\)/.exec(fn("profile_public_stats"));
    assert.ok(guard && stats);
    assert.deepEqual(quoted(guard[1]), [...SHOWCASE_BADGES].sort());
    assert.deepEqual(quoted(stats[1]), [...SHOWCASE_BADGES].sort());
  });

  test("mazzo del mese: stessa soglia di voti positivi, solo mesi chiusi, solo mazzi pubblicati", () => {
    const facts = fn("profile_achievement_facts");
    assert.ok(facts.includes(`having count(*) >= ${DECK_OF_MONTH_MIN_VOTES}`), "soglia di voti diversa fra codice e database");
    // i voti positivi, sia nei mesi del profilo sia nel massimo del sito
    assert.equal(facts.split(`v.stars >= ${DECK_OF_MONTH_MIN_STARS}`).length - 1, 2, "stelle diverse fra codice e database");
    assert.ok(facts.includes("v.created_at < date_trunc('month', now() at time zone 'utc') at time zone 'utc'"), "solo mesi chiusi");
    assert.equal(facts.split("d.status = 'published'").length - 1, 2);
    // il massimo del sito solo nei mesi del profilo, non su tutta deck_votes
    assert.ok(facts.includes("where d.owner = pid and d.status = 'published'"));
    assert.ok(facts.includes("v.created_at >= mm.month at time zone 'utc' and v.created_at < (mm.month + interval '1 month') at time zone 'utc'"));
    assert.ok(stmts.includes("create index if not exists deck_votes_created_idx on public.deck_votes (created_at)"));
  });

  test("tornei: pubblici, finiti e con una finale valida (come finish_tournament), senza bot, a partire dal profilo", () => {
    const facts = fn("profile_achievement_facts");
    assert.ok(facts.includes("t.status = 'finished' and t.visibility = 'public'"));
    assert.ok(facts.includes("f.position = 0 and f.status in ('confirmed', 'bye') and f.winner is not null"), "finale valida");
    assert.ok(facts.includes("f.round = (select max(r.round) from public.tournament_matches r where r.tournament_id = t.id)"), "ultimo turno");
    // `status` e `starts_at` li può scrivere l'organizzatore: la data viene dalla partita di finale
    assert.doesNotMatch(facts, /starts_at/);
    assert.equal(facts.split("min(pub.done_at)").length - 1, 3);
    assert.ok(facts.includes(`bp.username ~ '${SEED_BOT_USERNAME}'`), "bot di prova: stessa espressione del codice");
    for (const from of ["where m.player_a = pid", "where m.player_b = pid", "where t.organizer = pid"]) assert.ok(facts.includes(from), from);
    // la regola della finale è quella di finish_tournament in schema.sql
    const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
    assert.ok(schema.includes("f.winner is null or f.status not in ('confirmed', 'bye')"));
  });

  test("sicurezza delle funzioni: search_path fissato, invoker per i fatti, definer solo per gli aggregati, execute ristretto", () => {
    for (const name of ["guard_profile_show_stats", "profile_public_stats", "profile_achievement_facts"]) {
      assert.match(fn(name), /set search_path = public, pg_temp/, name);
    }
    assert.match(fn("profile_achievement_facts"), /security invoker/);
    assert.doesNotMatch(fn("profile_achievement_facts"), /security definer/);
    assert.match(fn("profile_public_stats"), /security definer/);
    for (const name of ["profile_public_stats", "profile_achievement_facts"]) {
      const revoke = stmts.indexOf(`revoke all on function public.${name}(uuid) from public`);
      const grant = stmts.indexOf(`grant execute on function public.${name}(uuid) to anon, authenticated`);
      assert.ok(revoke >= 0 && grant > revoke, `${name}: revoke da public e poi execute ad anon e authenticated`);
    }
    // i numeri pubblici: solo somme e conteggi, mai le righe di deck_stats_daily
    const stats = fn("profile_public_stats");
    assert.match(stats, /where p\.id = pid and p\.show_stats/);
    assert.doesNotMatch(stats, /select \* from public\.deck_stats_daily|x\.day,/);
  });

  test("profili: una sola grant, per colonna, già fra quelle ammesse; nessuna revoke; accodato a schema.sql passa i controlli", () => {
    const onProfiles = stmts.filter((s) => /^(grant|revoke)\b/.test(s) && /\bpublic\.profiles\b/.test(s));
    assert.deepEqual(onProfiles, ["grant update (show_stats) on public.profiles to authenticated"]);
    assert.ok(PROFILES_GRANTS.includes(onProfiles[0]));
    assert.deepEqual(singleDollarLines(sql), []);
    const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
    assert.deepEqual(schemaProblems(withPendingBlocks(schema, [sql])), []);
  });

  test("idempotente: colonna, trigger e funzioni si possono riapplicare", () => {
    assert.ok(stmts.includes("alter table public.profiles add column if not exists show_stats boolean not null default false"));
    const create = stmts.indexOf("create trigger profiles_guard_show_stats before update on public.profiles for each row execute function public.guard_profile_show_stats()");
    assert.ok(create > stmts.indexOf("drop trigger if exists profiles_guard_show_stats on public.profiles"));
    for (const s of stmts.filter((x) => /^create (function|table|trigger|policy)\b/.test(x))) {
      assert.ok(/^create trigger profiles_guard_show_stats\b/.test(s), `non idempotente: ${s.slice(0, 80)}`);
    }
    for (const s of stmts.filter((x) => /^create (unique )?index\b/.test(x))) assert.match(s, /^create (unique )?index if not exists\b/, s);
  });
});
