// PROVA A SECCO del blocco "06/10/2026: VOTI ALLE CARTE" sul database vero: esegue supabase/schema.sql in UNA
// transazione (le due parti di splitSchema, una dopo l'altra), prova i voti alle carte come li usa il sito (iscritti con
// l'accesso fatto, visitatori anonimi) e alla fine fa SEMPRE rollback: sul database non resta nulla. Usa i primi due
// profili iscritti solo dentro la transazione. Stessi controlli della prova su PGlite del 06/10/2026 (22 passati).
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/card-votes-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
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
const vote = (card, uid, score) =>
  attempt("insert into public.card_votes (card, user_id, score) values ($1, $2, $3) on conflict (card, user_id) do update set score = excluded.score returning score", [card, uid, score]);

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.card_votes') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella card_votes c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");
  const [first, second] = (await db.query(`select id from public.profiles order by created_at limit 2`)).rows;
  check("due profili per la prova", Boolean(first && second));
  const [a, b] = [first?.id, second?.id];

  await as("authenticated", a);
  check("A vota Dorothy 8", (await vote("zz-prova-dorothy", a, 8)).rows?.[0]?.score === 8);
  check("A cambia il voto a 9 (upsert)", (await vote("zz-prova-dorothy", a, 9)).rows?.[0]?.score === 9);
  check("punteggio 11 rifiutato", /check/.test((await vote("zz-prova-merlin", a, 11)).error ?? ""));
  check("punteggio 0 rifiutato", /check/.test((await vote("zz-prova-merlin", a, 0)).error ?? ""));
  check("slug sporco rifiutato", /check/.test((await vote("Bad Slug!", a, 5)).error ?? ""));
  check("non si vota a nome di un altro", Boolean((await vote("zz-prova-merlin", b, 5)).error));
  const own = await attempt("select score from public.card_votes where card = 'zz-prova-dorothy'");
  check("A legge il suo voto", own.rows?.length === 1 && own.rows[0].score === 9, own.error ?? JSON.stringify(own.rows));
  const back = await attempt("update public.card_votes set created_at = '2020-01-01' where card = 'zz-prova-dorothy' and user_id = $1 returning created_at", [a]);
  check("la data di creazione non si retrodata", !back.error && new Date(back.rows?.[0]?.created_at).getFullYear() >= 2026, back.error ?? "");

  await as("authenticated", b);
  check("B vota Dorothy 6", (await vote("zz-prova-dorothy", b, 6)).rows?.[0]?.score === 6);
  check("B vota Merlin 10", (await vote("zz-prova-merlin", b, 10)).rows?.[0]?.score === 10);
  const others = await attempt("select user_id from public.card_votes where card like 'zz-prova-%'");
  check("B non vede i voti di A", others.rows?.length === 2 && others.rows.every((r) => r.user_id === b), JSON.stringify(others));
  await attempt("delete from public.card_votes where card = 'zz-prova-dorothy' and user_id = $1", [a]);
  await as("postgres");
  check("B non cancella i voti di A", (await attempt("select 1 from public.card_votes where card = 'zz-prova-dorothy' and user_id = $1", [a])).rows?.length === 1);

  await as("anon");
  check("anon non legge la tabella", Boolean((await attempt("select * from public.card_votes")).error));
  check("anon non scrive", Boolean((await vote("zz-prova-x", a, 5)).error));
  const ratings = await attempt("select card, avg_score, votes, dist from public.card_ratings() where card like 'zz-prova-%'");
  const dor = ratings.rows?.find((r) => r.card === "zz-prova-dorothy");
  check("anon legge le medie: Dorothy 7,5 su 2 voti, distribuzione {6:1, 9:1}", Number(dor?.avg_score) === 7.5 && dor?.votes === 2 && JSON.stringify(dor?.dist) === JSON.stringify({ 6: 1, 9: 1 }), ratings.error ?? JSON.stringify(dor));
  const one = await attempt("select card, avg_score from public.card_ratings('zz-prova-merlin')");
  check("card_ratings('merlin') dà solo Merlin", one.rows?.length === 1 && Number(one.rows[0].avg_score) === 10, one.error ?? JSON.stringify(one.rows));
  const totals = await attempt("select votes, voters, cards, latest from public.card_vote_totals()");
  check("totali: almeno 3 voti, 2 votanti, 2 carte, ultimo voto presente", Number(totals.rows?.[0]?.votes) >= 3 && Number(totals.rows?.[0]?.voters) >= 2 && Number(totals.rows?.[0]?.cards) >= 2 && Boolean(totals.rows?.[0]?.latest), totals.error ?? JSON.stringify(totals.rows));
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
