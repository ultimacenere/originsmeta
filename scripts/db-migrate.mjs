// Applica supabase/schema.sql al database del progetto Supabase.
// Legge .env.local: SUPABASE_DB_PASSWORD e SUPABASE_PROJECT_REF (opzionale SUPABASE_DB_HOST/SUPABASE_DB_PORT/SUPABASE_DB_USER).
// Uso: node scripts/db-migrate.mjs           tutto il file, in due transazioni (vedi sotto)
//      node scripts/db-migrate.mjs --base    solo lo schema di sempre con la correzione dei profili (6c6756d), senza i
//                                            blocchi dei pacchetti creator: si può lanciare anche prima del loro deploy
//
// Prima di collegarsi controlla il file (scripts/schema-guard.mjs): uno schema.sql che riaprirebbe la scrittura dei
// profili agli utenti (grant sull'intera tabella, trigger senza i campi riservati, un corpo con un dollaro solo) viene
// rifiutato. MAI lanciarlo da main o da un worktree precedente a 232ee7e: quelle copie non hanno il controllo e
// rimetterebbero la falla chiusa da 6c6756d (README, "Migrazione del database").
//
// Due transazioni: prima la parte fino a "-- ===== 26/09/2026: CREATOR =====", poi il resto. Postgres esegue una query
// con più istruzioni in una transazione sola: con il file intero in una query, un errore nei blocchi nuovi annullava
// anche la revoke sui profili. Ora la prima parte resta applicata anche se la seconda fallisce.
import { readFileSync } from "node:fs";
import pg from "pg";
import { schemaProblems, splitSchema } from "./schema-guard.mjs";

const baseOnly = process.argv.includes("--base");
const sql = readFileSync("supabase/schema.sql", "utf8");
const problems = schemaProblems(sql);
if (problems.length) {
  console.error("schema.sql rifiutato: riaprirebbe public.profiles agli utenti (commit 6c6756d) o non si può applicare.");
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
const parts = splitSchema(sql);
const todo = baseOnly ? parts.slice(0, 1) : parts;

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ref = env.SUPABASE_PROJECT_REF;
const pwd = env.SUPABASE_DB_PASSWORD;
if (!ref || !pwd) throw new Error("SUPABASE_PROJECT_REF / SUPABASE_DB_PASSWORD mancanti in .env.local");

const candidates = [];
if (env.SUPABASE_DB_HOST) {
  candidates.push({ name: "host da .env.local", host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER || `postgres.${ref}` });
}
candidates.push({ name: "diretta", host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" });
const regions = ["eu-west-1", "eu-central-1", "eu-west-2", "eu-north-1", "eu-west-3"];
for (const r of regions) {
  for (const p of ["aws-0", "aws-1"]) {
    for (const [label, port] of [["session", 5432], ["transaction", 6543]]) {
      candidates.push({ name: `pooler ${p}-${r} (${label})`, host: `${p}-${r}.pooler.supabase.com`, port, user: `postgres.${ref}` });
    }
  }
}

// Il primo collegamento che risponde; gli errori di collegamento fanno provare il successivo.
let client = null;
let via = "";
for (const c of candidates) {
  const attempt = new pg.Client({ host: c.host, port: c.port, user: c.user, password: pwd, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  try {
    await attempt.connect();
    await attempt.query("select 1");
    client = attempt;
    via = `${c.name} (${c.host}:${c.port})`;
    break;
  } catch (e) {
    console.log(`${c.name}: ${e.message}`);
    try {
      await attempt.end();
    } catch {}
  }
}
if (!client) process.exit(1);

// Gli errori dell'SQL non dipendono dal collegamento: ci si ferma alla parte che fallisce (le precedenti restano).
let failed = false;
for (const part of todo) {
  try {
    await client.query(part.sql);
    console.log(`OK via ${via}: ${part.name}`);
  } catch (e) {
    console.error(`ERRORE in "${part.name}": ${e.message}${e.position ? ` (posizione ${e.position} nella parte)` : ""}`);
    if (part !== todo[0]) console.error(`Le parti precedenti restano applicate.`);
    failed = true;
    break;
  }
}
if (!failed) {
  const r = await client.query("select table_name from information_schema.tables where table_schema='public' order by 1");
  console.log(`Tabelle/viste public: ${r.rows.map((x) => x.table_name).join(", ")}`);
  if (baseOnly) console.log("Solo la parte base (--base): i blocchi dei pacchetti creator non sono stati applicati.");
}
await client.end();
if (failed) process.exit(1);
