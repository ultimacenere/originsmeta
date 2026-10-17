// PROVA A SECCO del blocco "17/10/2026: MERCATO" sul database vero (tracker dei prezzi del mercato di Steam): esegue
// supabase/schema.sql in UNA transazione (le due parti di splitSchema, una dopo l'altra), prova market_ingest come la
// usa la rotta del cron (anon con il segreto del server) e le letture come le fanno le pagine (anon), e alla fine fa
// SEMPRE rollback: sul database non resta nulla. Stessi controlli della prova su PGlite del 17/10/2026 (18 passati, con
// oggetti veri di Steam); qui gli oggetti sono finti, con il prefisso "zz-prova".
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/market-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
// Serve CRON_SECRET in .env.local, lo stesso registrato con scripts/set-cron-key.mjs (market_ingest lo ricontrolla).
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
if (!env.CRON_SECRET) {
  console.error("Manca CRON_SECRET in .env.local (lo stesso di Vercel e di scripts/set-cron-key.mjs).");
  process.exit(1);
}
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
async function as(role) {
  await db.query("reset role");
  if (role !== "postgres") await db.query(`set local role ${role}`);
}
const row = (n, price, listings = 5) => ({
  hash_name: `zz-prova ${n}`,
  slug: `zz-prova-${n}`,
  name: `ZZ prova ${n}`,
  type: "Prova",
  kind: "card",
  card: null,
  variant: n % 2 ? "foil" : "normal",
  icon: null,
  name_color: null,
  price,
  listings,
});
const ingest = (key, rows, next, total, done, source = "zz-prova") =>
  attempt("select public.market_ingest($1, $2, 753, $3::jsonb, $4, $5, $6, 1.1253) as n", [key, source, JSON.stringify(rows), next, total, done]);

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.market_items') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella market_items c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  const key = env.CRON_SECRET;
  const rows = Array.from({ length: 12 }, (_, i) => row(i + 1, 100 + i));

  await as("anon");
  check("segreto sbagliato rifiutato", /forbidden/.test((await ingest("y".repeat(40), rows.slice(0, 2), 2, 12, false)).error ?? ""));
  check("più di 100 oggetti rifiutati", /bad_items/.test((await ingest(key, Array(101).fill(rows[0]), 0, 1, false)).error ?? ""));
  const p1 = await ingest(key, rows.slice(0, 10), 10, 12, false);
  check("prima pagina salvata (10 oggetti)", p1.rows?.[0]?.n === 10, p1.error ?? JSON.stringify(p1.rows));
  const mid = await attempt("select cursor_start, sweep_started_at is not null as running from public.market_sources where id = 'zz-prova'");
  check("giro in corso: cursore a 10", mid.rows?.[0]?.cursor_start === 10 && mid.rows[0].running, JSON.stringify(mid));
  const p2 = await ingest(key, rows.slice(10), 0, 12, true);
  check("ultima pagina: giro finito", p2.rows?.[0]?.n === 2, p2.error ?? JSON.stringify(p2.rows));
  const src = await attempt("select cursor_start, total, last_sweep_at is not null as done from public.market_sources where id = 'zz-prova'");
  check("cursore a 0, totale e ora dell'ultimo giro", src.rows?.[0]?.cursor_start === 0 && src.rows[0].total === 12 && src.rows[0].done, JSON.stringify(src));
  check("anon non scrive direttamente", Boolean((await attempt("update public.market_items set price = 1 where source = 'zz-prova'")).error));
  check("authenticated non scrive direttamente", await (async () => { await as("authenticated"); const r = await attempt("insert into public.market_fx values ('2000-01-01', 1)"); await as("anon"); return Boolean(r.error); })());

  const dirty = await ingest(key, [{ ...rows[0], hash_name: "zz-prova sporco", slug: "Bad Slug!" }, rows[1]], 2, 12, false);
  check("oggetto sporco saltato, gli altri salvati", dirty.rows?.[0]?.n === 1, dirty.error ?? JSON.stringify(dirty.rows));
  await ingest(key, [{ ...rows[1], price: 120 }], 2, 12, false);
  await ingest(key, [{ ...rows[1], price: 90 }], 2, 12, false);
  const h = await attempt("select low, high, close from public.market_prices_hourly where source = 'zz-prova' and hash_name = $1", [rows[1].hash_name]);
  check("ora: minimo, massimo e ultimo", h.rows?.[0]?.low === 90 && h.rows[0].high === 120 && h.rows[0].close === 90, JSON.stringify(h));

  await as("postgres");
  await db.query("insert into public.market_prices_hourly (source, hash_name, hour, open, low, high, close, listings) values ('zz-prova', $1, date_trunc('hour', now()) - interval '25 hours', 80, 80, 80, 80, 5)", [rows[1].hash_name]);
  await as("anon");
  const board = await attempt("select slug, price, price_24h from public.market_board('zz-prova')");
  const b1 = board.rows?.find((r) => r.slug === rows[1].slug);
  check("tabellone per anon: prezzo e prezzo di 24 ore fa", board.rows?.length === 12 && b1?.price === 90 && b1?.price_24h === 80, board.error ?? JSON.stringify(b1));
  const fx = await attempt("select usd_per_eur::float as r from public.market_fx where day = (now() at time zone 'utc')::date");
  check("cambio del giorno salvato", Math.abs((fx.rows?.[0]?.r ?? 0) - 1.1253) < 1e-9, JSON.stringify(fx));

  const o = await attempt("select public.market_ingest($1, 'zz-vuoto', 4429430, '[]'::jsonb, 0, 0, true, null) as n", [key]);
  check("mercato chiuso: giro vuoto senza errori", o.rows?.[0]?.n === 0, o.error ?? "");
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
