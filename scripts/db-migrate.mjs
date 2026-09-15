// Applica supabase/schema.sql al database del progetto Supabase.
// Legge .env.local: SUPABASE_DB_PASSWORD e SUPABASE_PROJECT_REF (opzionale SUPABASE_DB_HOST/SUPABASE_DB_PORT/SUPABASE_DB_USER).
// Uso: node scripts/db-migrate.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ref = env.SUPABASE_PROJECT_REF;
const pwd = env.SUPABASE_DB_PASSWORD;
if (!ref || !pwd) throw new Error("SUPABASE_PROJECT_REF / SUPABASE_DB_PASSWORD mancanti in .env.local");
const sql = readFileSync("supabase/schema.sql", "utf8");

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

let done = false;
for (const c of candidates) {
  const client = new pg.Client({ host: c.host, port: c.port, user: c.user, password: pwd, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await client.query(sql);
    const r = await client.query("select table_name from information_schema.tables where table_schema='public' order by 1");
    console.log(`OK via ${c.name} (${c.host}:${c.port}). Tabelle/viste public: ${r.rows.map((x) => x.table_name).join(", ")}`);
    done = true;
    await client.end();
    break;
  } catch (e) {
    console.log(`${c.name}: ${e.message}`);
    try {
      await client.end();
    } catch {}
  }
}
if (!done) process.exit(1);
