// PROVA A SECCO del blocco "23/10/2026: NOME UTENTE" sul database vero: esegue supabase/schema.sql in UNA transazione (le
// due parti di splitSchema, una dopo l'altra), prova il cambio di nome mostrato e nome utente come lo usa il sito (un
// iscritto con l'accesso fatto, un visitatore anonimo, lo staff) e alla fine fa SEMPRE rollback: sul database non resta
// nulla. Usa due profili community e (se c'è) un profilo dello staff solo dentro la transazione.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/username-dry-run.mjs
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
const setNames = async (uid, display, username) => {
  await as("authenticated", uid);
  const r = await attempt("select public.profile_set_names($1, $2) as r", [display, username]);
  await as("postgres");
  return r.error ? { thrown: r.error } : r.rows[0].r;
};
const row = async (id) => (await db.query("select username, display_name from public.profiles where id = $1", [id])).rows[0];

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.profile_username_history') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella profile_username_history c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");
  const people = (
    await db.query(
      `select id, username, display_name from public.profiles
        where role is distinct from 'admin' and badge = 'community' and username is not null and username !~ '^bot-'
        order by created_at limit 2`,
    )
  ).rows;
  check("due profili community per la prova", people.length === 2);
  const [a, b] = people;
  const staff = (await db.query(`select id from public.profiles where role = 'admin' or badge = 'staff' limit 1`)).rows[0]?.id;

  // nome mostrato
  let r = await setNames(a.id, "  Prova   Nome ", null);
  check("nome mostrato pulito e salvato", r.ok === true && r.display === "ok" && (await row(a.id)).display_name === "Prova Nome", JSON.stringify(r));
  r = await setNames(a.id, "Staff OriginsMeta", null);
  check("nome mostrato riservato rifiutato", r.ok === false && r.display === "reserved", JSON.stringify(r));

  // nome utente (dentro la transazione now() è fermo: il secondo cambio cade nei 30 giorni)
  const fresh = `prova-nome-${Date.now().toString(36)}`;
  r = await setNames(a.id, null, fresh);
  check("nome utente cambiato", r.ok === true && r.username === "ok" && (await row(a.id)).username === fresh, JSON.stringify(r));
  r = await setNames(a.id, null, `${fresh}-2`);
  check("secondo cambio prima di 30 giorni rifiutato", r.ok === false && r.username === "too_soon", JSON.stringify(r));
  r = await setNames(b.id, null, a.username);
  check("il vecchio nome di un altro è preso", r.ok === false && r.username === "taken", JSON.stringify(r));
  r = await setNames(b.id, null, "bot-99");
  check("nome dei bot riservato", r.ok === false && r.username === "reserved", JSON.stringify(r));

  // redirect (anon)
  await as("anon");
  const moved = await attempt("select public.profile_username_moved($1) as u", [a.username]);
  await as("postgres");
  check("il vecchio indirizzo porta al nuovo (anon)", moved.rows?.[0]?.u === fresh, JSON.stringify(moved));

  // nessuna scrittura diretta, nessuna lettura dello storico
  await as("authenticated", b.id);
  const direct = await attempt("update public.profiles set username = 'prova-diretta' where id = $1", [b.id]);
  const read = await attempt("select * from public.profile_username_history limit 1");
  await as("postgres");
  check("UPDATE diretto del nome utente rifiutato", Boolean(direct.error), direct.error ?? "");
  check("nessun client legge lo storico", Boolean(read.error), read.error ?? "");

  // staff
  if (staff) {
    r = await setNames(staff, null, "staff-prova-nome");
    check("lo staff usa un nome riservato", r.ok === true, JSON.stringify(r));
  } else console.log("nota: nessun profilo dello staff, prova saltata");

  // registrazione con un nome lasciato da un altro: un utente nuovo con quel nome nei metadati (come seed-bots.mjs);
  // handle_new_user lo trova libero fra i profili, il trigger profiles_username_free gli dà il suffisso
  await as("postgres");
  const newId = (await db.query("select gen_random_uuid() as id")).rows[0].id;
  const reg = await attempt(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
    [newId, `${newId}@prova.invalid`, JSON.stringify({ user_name: a.username })],
  );
  const got = reg.error ? null : (await db.query("select username from public.profiles where id = $1", [newId])).rows[0]?.username;
  check("un profilo nuovo non prende il vecchio nome di un altro", typeof got === "string" && got !== a.username && got.startsWith(`${a.username}-`), reg.error ?? String(got));
} catch (e) {
  failures++;
  console.error("errore:", e.message);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto, niente scritto)` : "\ntutto a posto (rollback fatto, niente scritto): si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
