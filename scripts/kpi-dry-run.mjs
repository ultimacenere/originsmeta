// PROVA A SECCO del blocco "22/10/2026: NUMERI DELLA DASHBOARD" sul database vero: esegue supabase/schema.sql in UNA
// transazione (le due parti di splitSchema), chiama kpi_daily come la rotta /api/staff/kpi (ruolo anon, con il segreto
// del cron di .env.local) e con un segreto sbagliato, e alla fine fa SEMPRE rollback: sul database non resta nulla.
// Stampa solo i totali del periodo, non le righe.
// Uso, dalla radice del repo (checkout principale aggiornato): node scripts/kpi-dry-run.mjs
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
const secret = (env.CRON_SECRET ?? "").replace(/^"|"$/g, "");
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

await db.connect();
await db.query("begin");
try {
  check("CRON_SECRET in .env.local", secret.length >= 32);
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await db.query("set local role anon");
  const bad = await attempt("select * from public.kpi_daily($1, $2)", ["x".repeat(40), "2026-09-15"]);
  check("segreto sbagliato rifiutato", /forbidden/.test(bad.error ?? ""), bad.error ?? "nessun errore");
  const res = await attempt("select * from public.kpi_daily($1, $2)", [secret, "2026-09-15"]);
  check("con il segreto del cron risponde", Array.isArray(res.rows) && res.rows.length > 30, res.error ?? `${res.rows?.length} giorni`);
  if (res.rows?.length) {
    const sum = (k) => res.rows.reduce((n, r) => n + Number(r[k] ?? 0), 0);
    const first = res.rows[0].day instanceof Date ? res.rows[0].day.toISOString().slice(0, 10) : String(res.rows[0].day);
    check("parte dal 15/09/2026, un giorno per riga", res.rows.length === new Set(res.rows.map((r) => String(r.day))).size, `primo giorno ${first}`);
    console.log("     totali dal 15/09:", { iscrizioni: sum("signups"), download_tracker: sum("tracker_downloads"), mazzi_creati: sum("decks_created"), mazzi_torneo: sum("deck_sets_created") });
  }
  const anonTable = await attempt("select count(*) from public.tracker_downloads");
  check("anon non legge le tabelle", Boolean(anonTable.error));
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
