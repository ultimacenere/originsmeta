// PROVA A SECCO del blocco "25/10/2026: STATISTICHE IN UNA LETTURA" sul database vero: misura quanto ci mettono oggi le
// sette funzioni tracker_stats_* sulla patch in corso e sulla precedente, esegue supabase/schema.sql in UNA transazione
// (le due parti di splitSchema), misura tracker_stats_bundle, confronta parte per parte le sue righe con quelle delle
// sette funzioni (stessi valori, stesso ordine) e prova che anon la può chiamare. Alla fine fa SEMPRE rollback: sul
// database non resta nulla (anche l'indice nuovo sparisce). Durante la prova l'indice tiene ferme per qualche secondo le
// scritture sulle partite del Tracker (l'app riprova da sola).
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/tracker-bundle-dry-run.mjs
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

// le patch del sito, dalla fine di patchOrder in src/lib/data/cards.ts (la in corso e la precedente)
const cards = readFileSync("src/lib/data/cards.ts", "utf8");
const order = /export const patchOrder[^=]*=\s*\[([^\]]*)\]/.exec(cards)?.[1].match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) ?? [];
const PATCHES = order.slice(-2).reverse();
const FNS = ["overview", "legendaries", "lists", "archetypes", "cards", "matchups", "opponents"];

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
async function timed(text, params) {
  const t0 = performance.now();
  const r = await attempt(text, params);
  return { ...r, ms: Math.round(performance.now() - t0) };
}
const rowsOf = (fn) => `select coalesce(jsonb_agg(to_jsonb(x) - 'ordinality' order by x.ordinality), '[]'::jsonb) as j from public.tracker_stats_${fn}($1) with ordinality as x`;

await db.connect();
await db.query("begin");
try {
  check("patch da provare", PATCHES.length > 0, PATCHES.join(", "));
  const count = (await db.query("select patch, count(*)::int as n from public.tracked_matches group by patch order by n desc")).rows;
  console.log(`partite registrate per patch: ${count.map((r) => `${r.patch ?? "?"} ${r.n}`).join(", ")}`);

  const before = {};
  for (const patch of PATCHES) {
    let total = 0;
    const parts = [];
    for (const fn of FNS) {
      const r = await timed(rowsOf(fn), [patch]);
      check(`oggi: tracker_stats_${fn}(${patch})`, !r.error, r.error ?? `${r.ms} ms`);
      total += r.ms;
      parts.push(r.ms);
      before[`${patch}:${fn}`] = r.rows?.[0]?.j;
    }
    console.log(`     oggi, patch ${patch}: ${total} ms in tutto per le sette funzioni (la più lenta ${Math.max(...parts)} ms; il timeout del ruolo anon è di pochi secondi)`);
  }

  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }

  for (const patch of PATCHES) {
    const r = await timed("select public.tracker_stats_bundle($1) as b", [patch]);
    check(`dopo: tracker_stats_bundle(${patch})`, !r.error, r.error ?? `${r.ms} ms, una lettura sola`);
    const bundle = r.rows?.[0]?.b;
    if (!bundle) continue;
    for (const fn of FNS) {
      const old = before[`${patch}:${fn}`];
      check(`patch ${patch}: ${fn} uguale alla funzione di oggi`, JSON.stringify(old) === JSON.stringify(bundle[fn]), `${Array.isArray(old) ? old.length : "?"} righe`);
    }
    // le sette funzioni con l'indice nuovo
    let total = 0;
    for (const fn of FNS) total += (await timed(rowsOf(fn), [patch])).ms;
    console.log(`     dopo, patch ${patch}: le sette funzioni con l'indice ${total} ms in tutto`);
  }

  await db.query("set local role anon");
  const anon = await attempt("select jsonb_typeof(public.tracker_stats_bundle($1)) as t", [PATCHES[0]]);
  check("anon può chiamare tracker_stats_bundle", anon.rows?.[0]?.t === "object", anon.error ?? "");
  await db.query("reset role");
} catch (e) {
  failures++;
  console.error("errore:", e.message);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto, niente scritto)` : "\ntutto a posto (rollback fatto, niente scritto): si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
