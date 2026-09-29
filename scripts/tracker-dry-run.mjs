// PROVA A SECCO del blocco "30/09/2026: TRACKER" sul database vero (29–30/09/2026): esegue supabase/schema.sql in UNA
// transazione, prova le funzioni del tracker come le usano il sito (utente con l'accesso fatto), l'app (anon con il
// token) e le statistiche anonime (anon), e alla fine fa SEMPRE rollback: sul database non resta nulla. Usa i primi
// quattro profili iscritti solo dentro la transazione. Stessi controlli della prova su PGlite dello scratchpad.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/tracker-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { schemaProblems, splitSchema } from "./schema-guard.mjs";

const sql = readFileSync("supabase/schema.sql", "utf8");
const problems = schemaProblems(sql);
if (problems.length) {
  console.error("schema.sql rifiutato da schema-guard:", problems);
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(existsSync(".env.local") ? ".env.local" : "C:/Users/User/Desktop/originsmeta/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "NO  "} ${name}${detail ? ` — ${detail}` : ""}`);
};
// una query in un savepoint: righe o errore, senza rompere la transazione
async function attempt(text, params = []) {
  await db.query("savepoint t");
  try {
    const r = await db.query(text, params);
    await db.query("release savepoint t");
    return { rows: r.rows };
  } catch (e) {
    await db.query("rollback to savepoint t");
    return { error: e.message };
  }
}
async function as(role, uid = "") {
  await db.query("reset role");
  await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [uid ? JSON.stringify({ sub: uid, role }) : "", uid]);
  if (role !== "postgres") await db.query(`set local role ${role}`);
}

const hex = (n) => randomBytes(Math.ceil(n / 2)).toString("hex").slice(0, n);
const base = (n) => `C${String(n).padStart(5, "0")}_MB`;
const DECK_A = ["C00176_MC", ...[2, 29, 32, 36, 93, 159, 208, 234, 267, 274, 361, 169].map(base)];
const DECK_B = ["C00012_MC", ...[31, 40, 41, 46, 50, 60, 70, 80, 90, 100, 110, 120].map(base)];
const DECK_C = ["C00084_MC", ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(base)];
const PATCH = "zz-prova";
const match = (over = {}) => ({
  id: hex(32),
  endedAt: new Date(Date.now() - 3_600_000).toISOString(),
  result: "W",
  queue: "normal",
  deckName: "On Death",
  deckLegendary: DECK_A[0],
  deckCards: DECK_A,
  deckCode: "KGBLDCdjF8QzAwMDAyX01C:6d5e3a43",
  rank: "Bronze III",
  oppLegendary: "C00012_MC",
  oppPlayed: ["C00012_MC", "C00031_MB"],
  turns: 9,
  plays: [
    { t: 1, m: true, c: base(2), l: 0 },
    { t: 2, m: false, c: "C00012_MC", l: 1 },
    { t: 3, m: true, c: base(29), l: 2 },
  ],
  patch: PATCH,
  archetype: "midrange",
  ...over,
});

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.tracked_matches') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella tracked_matches c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  const users = (await db.query(`select id, username from public.profiles order by created_at limit 4`)).rows;
  check("quattro profili per la prova", users.length === 4);
  const [u1, u2, u3, u4] = users.map((u) => u.id);

  const codeFor = async (uid) => {
    await as("authenticated", uid);
    return (await attempt("select public.tracker_link_code() as c")).rows?.[0]?.c;
  };
  const tokenFor = async (uid) => {
    const c = await codeFor(uid);
    await as("anon");
    return (await attempt("select * from public.tracker_link_claim($1, 'PC di prova')", [c])).rows?.[0]?.token;
  };
  const submit = async (tok, list) => {
    await as("anon");
    return attempt("select public.tracker_submit($1, $2::jsonb) as n", [tok, JSON.stringify(list)]);
  };

  // ---------- collegamento ----------
  await as("anon");
  check("anon non crea codici", Boolean((await attempt("select public.tracker_link_code()")).error));
  const code = await codeFor(u1);
  check("codice creato", /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code ?? ""), code ? "formato ABCD-EFGH" : "");
  await as("authenticated", u1);
  check("i codici non si leggono", Boolean((await attempt("select * from public.tracker_link_codes")).error));
  await as("anon");
  check("codice sbagliato rifiutato", /invalid_code/.test((await attempt("select * from public.tracker_link_claim('ZZZZ-ZZZZ', 'x')")).error ?? ""));
  const claim = await attempt("select * from public.tracker_link_claim($1, 'PC di prova')", [code.toLowerCase().replace("-", " ")]);
  const token = claim.rows?.[0]?.token;
  check("token ottenuto (codice in minuscolo e con lo spazio)", /^omt_[0-9a-f]{64}$/.test(token ?? ""), claim.error ?? "");
  check("codice usato una volta sola", /invalid_code/.test((await attempt("select * from public.tracker_link_claim($1, 'x')", [code])).error ?? ""));

  // ---------- invio ----------
  const good = [match(), match({ result: "L", endedAt: null, deckLegendary: null, oppLegendary: null, turns: null, plays: [], deckCards: DECK_A.slice(0, 5), patch: null, archetype: null, queue: "ranked" })];
  const bad = [match({ queue: "BotBattle" }), match({ opponentDeck: DECK_B }), match({ oppRank: "Master" }), match({ patch: "0.7<x" }), match({ plays: [{ t: 1, m: true, c: null }] }), match({ endedAt: "2026-13-45T25:61:61Z" }), match({ id: "nope" })];
  const sent = await submit(token, [...good, ...bad]);
  check("partite valide aggiunte, quelle rotte scartate", sent.rows?.[0]?.n === good.length, sent.error ?? `aggiunte ${sent.rows?.[0]?.n} su ${good.length + bad.length}`);
  check("stesse partite una seconda volta: nessun doppione", (await submit(token, good)).rows?.[0]?.n === 0);
  check("token sbagliato rifiutato", /invalid_token/.test((await submit("omt_" + hex(64), [])).error ?? ""));
  check("più di 50 partite rifiutate", /invalid_matches/.test((await submit(token, Array.from({ length: 51 }, () => match()))).error ?? ""));
  check("anon non legge le partite", Boolean((await attempt("select * from public.tracked_matches")).error));
  check("anon non chiama le righe grezze delle statistiche", Boolean((await attempt("select * from public.tracker_stat_rows($1)", [PATCH])).error));
  await as("postgres");
  const stored = (await attempt("select deck_list, queue from public.tracked_matches where owner = $1 and cardinality(deck_cards) = 13", [u1])).rows?.[0];
  check("lista esatta calcolata dal database", stored?.deck_list === [...DECK_A].sort().join(","), stored?.deck_list ?? "");

  // ---------- lettura, isolamento, scollegamento, cancellazione ----------
  await as("authenticated", u1);
  check("il proprietario legge le sue partite", (await attempt("select count(*)::int as n from public.tracked_matches")).rows?.[0]?.n === good.length);
  const devs = await attempt("select id, last_seen_at from public.tracker_devices");
  check("il proprietario vede il PC collegato", devs.rows?.length >= 1 && devs.rows[0].last_seen_at !== null, devs.error ?? "");
  check("l'impronta del token non si legge", Boolean((await attempt("select token_hash from public.tracker_devices")).error));
  // le query esatte della pagina /account/tracker (trackerQueries.ts)
  check("pagina: PC collegati senza filtro su owner", !(await attempt("select id, name, created_at, last_seen_at from public.tracker_devices where revoked_at is null order by created_at desc")).error);
  const pageMatches = await attempt("select id, ended_at, created_at, result, patch, deck_name, deck_legendary, deck_list, opponent_legendary, turns from public.tracked_matches where owner = $1 order by created_at desc limit 3000", [u1]);
  check("pagina: partite con le colonne della pagina", pageMatches.rows?.length === good.length, pageMatches.error ?? "");
  await as("authenticated", u2);
  check("un altro utente non vede niente", (await attempt("select count(*)::int as n from public.tracked_matches")).rows?.[0]?.n === 0);
  check("un altro utente non scollega il PC", (await attempt("select public.tracker_revoke($1) as r", [devs.rows[0].id])).rows?.[0]?.r === false);
  const second = await tokenFor(u1);
  await as("anon");
  check("l'app si scollega con il suo token", (await attempt("select public.tracker_device_unlink($1) as r", [second])).rows?.[0]?.r === true);
  check("token scollegato dall'app rifiutato", /invalid_token/.test((await submit(second, [])).error ?? ""));
  await as("authenticated", u1);
  check("il proprietario scollega il PC dal sito", (await attempt("select public.tracker_revoke($1) as r", [devs.rows[0].id])).rows?.[0]?.r === true);
  check("token scollegato dal sito rifiutato", /invalid_token/.test((await submit(token, [])).error ?? ""));
  await as("authenticated", u1);
  check("il proprietario cancella le sue partite", (await attempt("select public.tracker_forget() as n")).rows?.[0]?.n === good.length);
  await as("postgres");
  await db.query("delete from public.tracker_link_codes");

  // ---------- statistiche anonime (patch di prova "zz-prova") ----------
  const t = { u1: await tokenFor(u1), u2: await tokenFor(u2), u3: await tokenFor(u3), u4: await tokenFor(u4) };
  const many = (n, wins, over) => Array.from({ length: n }, (_, i) => match({ result: i < wins ? "W" : "L", ...over }));
  await submit(t.u1, many(10, 7, {}));
  await submit(t.u2, many(6, 3, {}));
  await submit(t.u3, many(4, 2, {}));
  await submit(t.u1, many(15, 9, { deckLegendary: DECK_B[0], deckCards: DECK_B, archetype: "control", oppLegendary: "C00084_MC", plays: [] }));
  await submit(t.u2, many(10, 4, { deckLegendary: DECK_B[0], deckCards: DECK_B, archetype: "control", oppLegendary: "C00084_MC", plays: [] }));
  for (const [k, n] of [["u1", 5], ["u2", 5], ["u3", 5], ["u4", 4]]) await submit(t[k], many(n, 2, { deckLegendary: DECK_C[0], deckCards: DECK_C, archetype: "aggro", oppLegendary: null, oppPlayed: [], plays: [] }));
  await as("anon");
  const leg = (await attempt("select * from public.tracker_stats_legendaries($1)", [PATCH])).rows ?? [];
  const A = leg.find((r) => r.legendary === "C00176_MC");
  check("Leggendaria sopra soglia: 20 partite, 12 vinte, 3 giocatori", A && Number(A.games) === 20 && Number(A.wins) === 12 && Number(A.players) === 3, JSON.stringify(A));
  check("sotto soglia (2 giocatori, 19 partite): nascoste", !leg.some((r) => r.legendary !== "C00176_MC"), JSON.stringify(leg.map((r) => r.legendary)));
  check("nessuna colonna con proprietari o id", leg.length > 0 && Object.keys(leg[0]).join(",") === "legendary,games,wins,players");
  const ov = (await attempt("select * from public.tracker_stats_overview($1)", [PATCH])).rows?.[0];
  check("panoramica: 64 partite di 4 giocatori", ov && Number(ov.games) === 64 && Number(ov.players) === 4, JSON.stringify(ov));
  check("liste, archetipi, carte, scontri, avversarie: rispondono", await (async () => {
    for (const f of ["lists", "archetypes", "cards", "matchups", "opponents"]) if ((await attempt(`select * from public.tracker_stats_${f}($1)`, [PATCH])).error) return false;
    return true;
  })());
  check("patch assente: nessuna riga", (await attempt("select * from public.tracker_stats_legendaries(null)")).rows?.length === 0);

  // ---------- privilegi ----------
  await as("postgres");
  const privs = (await attempt(`select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon, has_function_privilege('authenticated', p.oid, 'execute') as auth
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'tracker%' order by 1`)).rows ?? [];
  const who = Object.fromEntries(privs.map((p) => [p.proname, `${p.anon ? "A" : "-"}${p.auth ? "U" : "-"}`]));
  const anonOk = ["tracker_device_unlink", "tracker_link_claim", "tracker_submit", "tracker_stats_archetypes", "tracker_stats_cards", "tracker_stats_legendaries", "tracker_stats_lists", "tracker_stats_matchups", "tracker_stats_opponents", "tracker_stats_overview"];
  check("anon esegue solo collegamento, invio, scollegamento e statistiche", Object.entries(who).every(([f, p]) => (anonOk.includes(f) ? p === "AU" : p[0] === "-")) && who.tracker_stat_rows === "--", JSON.stringify(who));
  const tablePrivs = (await attempt(`select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type) as p from information_schema.role_table_grants
    where table_name in ('tracked_matches', 'tracker_devices', 'tracker_link_codes') and grantee in ('anon', 'authenticated') group by 1, 2 order by 1, 2`)).rows ?? [];
  check("tabelle: solo SELECT delle proprie partite per authenticated", JSON.stringify(tablePrivs) === JSON.stringify([{ table_name: "tracked_matches", grantee: "authenticated", p: "SELECT" }]), JSON.stringify(tablePrivs));
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `CI SONO ${failures} CONTROLLI FALLITI (rollback: nulla è stato scritto).` : "TUTTO OK: nulla è stato scritto (rollback).");
process.exit(failures ? 1 : 0);
