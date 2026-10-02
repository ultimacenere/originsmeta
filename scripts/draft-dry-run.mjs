// PROVA A SECCO del blocco "02/10/2026: DRAFT ONLINE" sul database vero (02/10/2026): esegue supabase/schema.sql in UNA
// transazione, prova le funzioni del draft online come le usa il sito (giocatori con l'accesso fatto + il segreto del
// cron) e la pulizia del cron (anon + segreto), e alla fine fa SEMPRE rollback: sul database non resta nulla. Usa i
// primi tre profili iscritti solo dentro la transazione. Stessi controlli della prova su PGlite fatta il 02/10/2026.
// Serve CRON_SECRET in .env.local, lo stesso registrato con scripts/set-cron-key.mjs (le funzioni lo ricontrollano).
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/draft-dry-run.mjs
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
const KEY = (process.env.CRON_SECRET ?? env.CRON_SECRET ?? "").trim();
if (KEY.length < 32) {
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
async function as(role, uid = "") {
  await db.query("reset role");
  await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [uid ? JSON.stringify({ sub: uid, role }) : "", uid]);
  if (role !== "postgres") await db.query(`set local role ${role}`);
}
// codici di prova che le stanze vere non useranno mai (alfabeto valido, prefisso ZZ)
const CODE = "ZZQPRV";
const REMATCH = "ZZQPRW";

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.draft_rooms') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella draft_rooms c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");
  const keyOk = (await attempt("select public.notify_key_ok($1) as ok", [KEY])).rows?.[0]?.ok;
  check("il segreto di .env.local è quello registrato (set-cron-key.mjs)", keyOk === true);
  const users = (await db.query(`select id, username from public.profiles order by created_at limit 3`)).rows;
  check("tre profili per la prova", users.length === 3);
  const [a, b, c] = users.map((u) => u.id);

  await as("authenticated", a);
  check("A crea una stanza", !(await attempt("select public.draft_room_create($1, $2, 'triple')", [KEY, CODE])).error);
  check("senza il segreto: forbidden", /forbidden/.test((await attempt("select public.draft_room_create($1, 'ZZQPRX', 'triple')", ["x".repeat(40)])).error ?? ""));
  await as("anon");
  check("anon non crea", Boolean((await attempt("select public.draft_room_create($1, 'ZZQPRX', 'triple')", [KEY])).error));
  check("anon non legge le stanze", Boolean((await attempt("select * from public.draft_rooms")).error));

  await as("authenticated", c);
  check("lo stato non si legge direttamente", Boolean((await attempt("select * from public.draft_room_states")).error));
  check("C non vede la riga della stanza di A", (await attempt("select code from public.draft_rooms where code = $1", [CODE])).rows?.length === 0);
  const seen = (await attempt("select seat, state, creator_name from public.draft_room_get($1, $2)", [KEY, CODE])).rows?.[0];
  check("C vede la stanza in attesa senza stato né posto", seen && seen.seat === null && seen.state === null);

  await as("authenticated", a);
  check("A non entra nella sua stanza", /own_room/.test((await attempt("select public.draft_room_join($1, $2, '{\"v\":1}'::jsonb)", [KEY, CODE])).error ?? ""));
  await as("authenticated", b);
  const joined = await attempt("select public.draft_room_join($1, $2, '{\"v\":1,\"n\":0}'::jsonb) as v", [KEY, CODE]);
  check("B entra e la stanza parte", joined.rows?.[0]?.v === 1, joined.error ?? "");
  const mine = (await attempt("select seat, state from public.draft_room_get($1, $2)", [KEY, CODE])).rows?.[0];
  check("B legge lo stato con il suo posto", mine?.seat === 1 && mine?.state?.n === 0);
  check("B legge la riga della stanza (tempo reale)", (await attempt("select status from public.draft_rooms where code = $1", [CODE])).rows?.[0]?.status === "drafting");
  check("B salva con la versione giusta", (await attempt("select public.draft_room_put($1, $2, 1, '{\"v\":1,\"n\":1}'::jsonb, false) as v", [KEY, CODE])).rows?.[0]?.v === 2);
  check("versione vecchia: null", (await attempt("select public.draft_room_put($1, $2, 1, '{\"v\":1}'::jsonb, false) as v", [KEY, CODE])).rows?.[0]?.v === null);
  await as("authenticated", c);
  check("C non scrive nella stanza di altri", /forbidden/.test((await attempt("select public.draft_room_put($1, $2, 2, '{\"v\":1}'::jsonb, false)", [KEY, CODE])).error ?? ""));
  check("C non entra in una stanza piena", /room_full/.test((await attempt("select public.draft_room_join($1, $2, '{\"v\":1}'::jsonb)", [KEY, CODE])).error ?? ""));
  await as("authenticated", a);
  check("A chiude il draft", (await attempt("select public.draft_room_put($1, $2, 2, '{\"v\":1,\"n\":2}'::jsonb, true) as v", [KEY, CODE])).rows?.[0]?.v === 3);
  check("A propone la rivincita", !(await attempt("select public.draft_room_create($1, $2, 'packs', $3)", [KEY, REMATCH, CODE])).error);
  await as("authenticated", c);
  check("C non entra nella rivincita di A e B", /not_invited/.test((await attempt("select public.draft_room_join($1, $2, '{\"v\":1}'::jsonb)", [KEY, REMATCH])).error ?? ""));
  await as("authenticated", b);
  check("B entra nella rivincita", !(await attempt("select public.draft_room_join($1, $2, '{\"v\":1}'::jsonb)", [KEY, REMATCH])).error);

  await as("postgres");
  await attempt("update public.draft_rooms set updated_at = now() - interval '3 days' where code in ($1, $2)", [CODE, REMATCH]);
  await as("anon");
  const cleaned = await attempt("select public.draft_rooms_cleanup($1) as n", [KEY]);
  check("la pulizia del cron cancella le stanze vecchie", cleaned.rows?.[0]?.n >= 1, cleaned.error ?? `cancellate ${cleaned.rows?.[0]?.n}`);
  const pub = (await attempt("select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'draft_rooms'")).rows ?? [];
  check("draft_rooms nella pubblicazione del tempo reale", pub.length === 1);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
