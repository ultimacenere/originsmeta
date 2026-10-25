// PROVA A SECCO del blocco "25/10/2026: ID DISCORD PRIVATO" sul database vero: esegue supabase/schema.sql in UNA
// transazione (le due parti di splitSchema, una dopo l'altra), controlla che con la chiave pubblica (ruoli anon e
// authenticated) discord_id non si legga più e tutto il resto sì, che le scritture dei profili restino quelle di prima e
// che showcase_profiles_by_discord risponda solo per i profili con vetrina; alla fine fa SEMPRE rollback: sul database non
// resta nulla.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/discord-id-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";
import { PRIVATE_PROFILE_COLUMNS, schemaProblems, splitSchema } from "./schema-guard.mjs";

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
const columnPrivileges = async (role, privilege) =>
  (
    await db.query(
      `select c.column_name as col, has_column_privilege($1, 'public.profiles', c.column_name, $2) as ok
         from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'profiles' order by c.ordinal_position`,
      [role, privilege],
    )
  ).rows;

await db.connect();
await db.query("begin");
try {
  const before = (await db.query(`select has_column_privilege('anon', 'public.profiles', 'discord_id', 'SELECT') as open`)).rows[0].open;
  console.log(before ? "prima: discord_id si legge con la chiave pubblica (migrazione da fare)" : "nota: discord_id è già chiuso (migrazione già fatta?)");
  const updatesBefore = await columnPrivileges("authenticated", "UPDATE");

  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");

  for (const role of ["anon", "authenticated"]) {
    const table = (await db.query(`select has_table_privilege($1, 'public.profiles', 'SELECT') as v`, [role])).rows[0].v;
    check(`${role}: niente lettura dell'intera tabella`, table === false);
    const closed = (await columnPrivileges(role, "SELECT")).filter((r) => !r.ok).map((r) => r.col);
    check(`${role}: si legge ogni colonna tranne ${PRIVATE_PROFILE_COLUMNS.join(", ")}`, JSON.stringify(closed) === JSON.stringify(PRIVATE_PROFILE_COLUMNS), closed.join(", "));
  }
  const updatesAfter = await columnPrivileges("authenticated", "UPDATE");
  check("authenticated: le scritture dei profili sono quelle di prima", JSON.stringify(updatesAfter) === JSON.stringify(updatesBefore), updatesAfter.filter((r) => r.ok).map((r) => r.col).join(", "));

  const showcase = (await db.query(`select id, username, discord_id from public.profiles where badge in ('creator','author','pro','staff') and discord_id is not null and username is not null limit 1`)).rows[0];
  const community = (await db.query(`select id, discord_id from public.profiles where badge = 'community' and discord_id is not null limit 1`)).rows[0];
  check("un profilo con vetrina e uno community con l'id Discord, per la prova", Boolean(showcase && community));

  await as("anon");
  let r = await attempt("select discord_id from public.profiles limit 1");
  check("anon: select discord_id rifiutata", Boolean(r.error), r.error ?? "");
  r = await attempt("select count(*)::int as n from public.profiles where discord_id is not null");
  check("anon: niente filtri su discord_id", Boolean(r.error));
  r = await attempt("select id, username, display_name, avatar_url, badge, role, created_at, bio, links, content_langs, show_stats from public.profiles where username is not null limit 1");
  check("anon: le colonne pubbliche si leggono", r.rows?.length === 1, r.error ?? "");
  r = await attempt("select c.slug, p.username, p.badge from public.community_decks c join public.profiles p on p.id = c.owner limit 1");
  check("anon: i mazzi con chi li ha pubblicati (gli embed di PostgREST)", !r.error, r.error ?? "");
  if (showcase && community) {
    r = await attempt("select username from public.showcase_profiles_by_discord($1)", [[showcase.discord_id, community.discord_id]]);
    check("funzione: risponde per il profilo con vetrina e non per quello community", JSON.stringify(r.rows?.map((x) => x.username)) === JSON.stringify([showcase.username]), r.error ?? JSON.stringify(r.rows));
  }

  if (community) {
    await as("authenticated", community.id);
    r = await attempt("select discord_id from public.profiles where id = $1", [community.id]);
    check("authenticated: neanche il proprio discord_id", Boolean(r.error));
    r = await attempt("update public.profiles set bio = bio where id = $1", [community.id]);
    check("authenticated: la propria bio si scrive come prima", !r.error, r.error ?? "");
    r = await attempt("update public.profiles set role = 'admin' where id = $1", [community.id]);
    check("authenticated: il ruolo resta chiuso", Boolean(r.error));
  }
} catch (e) {
  failures++;
  console.error("errore:", e.message);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto, niente scritto)` : "\ntutto a posto (rollback fatto, niente scritto): si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
