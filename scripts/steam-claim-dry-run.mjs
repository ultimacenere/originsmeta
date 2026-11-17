// PROVA A SECCO del blocco "17/11/2026: STEAM, ACCOUNT DOPPI" sul database vero (17/11/2026): applica SOLO quel blocco di
// supabase/schema.sql in una transazione (due funzioni, nessuna tabella), crea utenti finti solo dentro la transazione
// (email @dryrun.originsmeta.invalid e indirizzi tecnici di account nati con Steam), prova lo spostamento del collegamento
// da un account vuoto nato con Steam e i casi in cui non si deve spostare niente, e alla fine fa SEMPRE rollback: sul
// database non resta nulla. Dura pochi secondi; fino al rollback aspettano solo le scritture sulle righe finte.
// Serve il blocco "09/11/2026: STEAM" già migrato (steam_links e steam_link_set) e CRON_SECRET in .env.local, lo stesso
// registrato con scripts/set-cron-key.mjs.
// Uso, dalla radice del repo (checkout principale aggiornato o worktree): node scripts/steam-claim-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { schemaProblems } from "./schema-guard.mjs";

const MARKER = "-- ===== 17/11/2026: STEAM, ACCOUNT DOPPI =====";
const sql = readFileSync("supabase/schema.sql", "utf8");
const problems = schemaProblems(sql);
if (problems.length) {
  console.error("schema.sql rifiutato da schema-guard:", problems);
  process.exit(1);
}
const start = sql.indexOf(MARKER);
if (start < 0) {
  console.error(`Manca il blocco "${MARKER}" in supabase/schema.sql.`);
  process.exit(1);
}
const nextBlock = sql.indexOf("\n-- ===== ", start + MARKER.length);
const block = sql.slice(start, nextBlock < 0 ? undefined : nextBlock);

const envFile = existsSync(".env.local") ? ".env.local" : "C:/Users/User/Desktop/originsmeta/.env.local";
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const KEY = (process.env.CRON_SECRET ?? env.CRON_SECRET ?? "").trim();
if (KEY.length < 32) {
  console.error("Manca CRON_SECRET in .env.local (lo stesso di Vercel e di scripts/set-cron-key.mjs).");
  process.exit(1);
}
const db = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER,
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: env.SUPABASE_DB_SSL === "off" ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

let failures = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  else passed++;
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
const err = (r) => r.error ?? "";
const val = async (text, params) => {
  const r = await attempt(text, params);
  return r.error ? `ERRORE: ${r.error}` : r.rows?.[0]?.v;
};
/** null = anonimo, "postgres" = proprietario (niente RLS), altrimenti un utente con l'accesso fatto */
async function as(uid) {
  await db.query("reset role");
  const id = uid && uid !== "postgres" ? uid : "";
  await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [id ? JSON.stringify({ sub: id, role: "authenticated" }) : "", id]);
  if (uid === "postgres") return;
  await db.query(`set local role ${id ? "authenticated" : "anon"}`);
}
async function mkUser(email, meta) {
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
    [id, email, JSON.stringify(meta)],
  );
  return id;
}
const steamEmail = (steamId) => `steam-${steamId}-0123456789abcdef@steam.originsmeta.local`;

// SteamID64 finti ma della forma giusta (17 cifre, 7656119…), mai collegati a nessuno: si controlla prima
const S = ["76561190000000011", "76561190000000012", "76561190000000013", "76561190000000014", "76561190000000015"];

await db.connect();
await db.query("begin");
const t0 = Date.now();
try {
  const steamThere = await db.query(`select to_regclass('public.steam_links') is not null as t, to_regproc('public.steam_link_set') is not null as f`);
  check("il blocco STEAM del 09/11 c'è già (steam_links e steam_link_set)", steamThere.rows[0].t && steamThere.rows[0].f);
  if (failures) throw new Error("prima va migrato il blocco 09/11/2026: STEAM");
  const r = await attempt(block);
  check("il blocco ACCOUNT DOPPI si applica", !r.error, r.error ?? "");
  if (failures) throw new Error("blocco non applicato");
  check("il segreto del cron è quello registrato", (await val("select public.notify_key_ok($1) as v", [KEY])) === true);
  const used = await attempt(`select count(*)::int as n from public.steam_links where steam_id = any($1)`, [S]);
  check("gli SteamID di prova non sono di nessuno", used.rows?.[0]?.n === 0, err(used));
  const fks = await attempt(
    `select count(*)::int as n from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
      where c.contype = 'f' and c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass) and n.nspname <> 'auth'`,
  );
  console.log(`nota: ${fks.rows?.[0]?.n ?? "?"} chiavi esterne verso profili e utenti (fuori da auth) contano per "vuoto"`);

  await as("postgres");
  const M = await mkUser("claim-main@dryrun.originsmeta.invalid", { user_name: "zzdry-claim-main" }); // l'account di sempre
  const D = await mkUser(steamEmail(S[0]), { user_name: "zzdry-claim-main", full_name: "Doppio" }); // nato con Steam, vuoto
  const E = await mkUser(steamEmail(S[1]), { user_name: "zzdry-claim-e" }); // nato con Steam, con una tier list
  const F = await mkUser("claim-f@dryrun.originsmeta.invalid", { user_name: "zzdry-claim-f" }); // email, con Steam collegato
  const G = await mkUser("claim-g@dryrun.originsmeta.invalid", { user_name: "zzdry-claim-g" });
  check("utenti finti creati con il profilo", (await val(`select count(*)::int as v from public.profiles where id = any($1::uuid[])`, [[M, D, E, F, G]])) === 5);
  await db.query(`insert into public.steam_links (user_id, steam_id) values ($1, $2), ($3, $4), ($5, $6)`, [D, S[0], E, S[1], F, S[2]]);
  await db.query(`insert into public.tier_lists (owner, kind, code) values ($1, 'cards', 'TL1zzdry')`, [E]);
  check("D è vuoto", (await val(`select public.steam_account_empty($1) as v`, [D])) === true);
  check("E non è vuoto (una tier list)", (await val(`select public.steam_account_empty($1) as v`, [E])) === false);
  check("D è nato con Steam, F no", (await val(`select public.steam_account_only($1) and not public.steam_account_only($2) as v`, [D, F])) === true);

  // permessi
  await as(null);
  check("anon non chiama steam_link_claim", /permission denied/.test(err(await attempt(`select public.steam_link_claim($1, $2)`, [KEY, S[0]]))));
  await as(G);
  check("un iscritto non chiama steam_account_empty", /permission denied/.test(err(await attempt(`select public.steam_account_empty($1)`, [G]))));
  check("senza il segreto del server: forbidden", /forbidden/.test(err(await attempt(`select public.steam_link_claim($1, $2)`, ["x".repeat(40), S[0]]))));
  check("SteamID sbagliato: invalid", (await val(`select public.steam_link_claim($1, '12345') as v`, [KEY])) === "invalid");

  // non si sposta niente
  check("G prova lo Steam di E (nato con Steam ma con una tier list): taken", (await val(`select public.steam_link_claim($1, $2) as v`, [KEY, S[1]])) === "taken");
  check("G prova lo Steam di F (account con email): taken", (await val(`select public.steam_link_claim($1, $2) as v`, [KEY, S[2]])) === "taken");
  await as("postgres");
  check("E e F hanno ancora i loro collegamenti", (await val(`select count(*)::int as v from public.steam_links where user_id = any($1::uuid[])`, [[E, F]])) === 2);

  // il caso di Tankready: l'account di sempre M e il doppio D, vuoto, nato con Steam
  await as(M);
  check("M con steam_link_set: taken (come prima)", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S[0]])) === "taken");
  check("M con steam_link_claim: merged", (await val(`select public.steam_link_claim($1, $2) as v`, [KEY, S[0]])) === "merged");
  const st = await attempt(`select steam_id, steam_only from public.steam_link_status()`);
  check("M ora ha lo Steam del doppio", st.rows?.length === 1 && st.rows[0].steam_id === S[0] && st.rows[0].steam_only === false, err(st) || JSON.stringify(st.rows));
  await as("postgres");
  check("il doppio D non c'è più (utente e profilo)", (await val(`select (select count(*) from auth.users where id = $1) + (select count(*) from public.profiles where id = $1) as v`, [D])) === "0");
  await as(M);
  check("M di nuovo: same", (await val(`select public.steam_link_claim($1, $2) as v`, [KEY, S[0]])) === "same");
  check("M con un secondo Steam: other", (await val(`select public.steam_link_claim($1, $2) as v`, [KEY, S[3]])) === "other");
  await as(G);
  check("G con uno Steam libero: ok", (await val(`select public.steam_link_claim($1, $2) as v`, [KEY, S[4]])) === "ok");
} catch (e) {
  check("prova completata", false, e.message);
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
console.log(`\n${passed} controlli passati, ${failures} non passati in ${((Date.now() - t0) / 1000).toFixed(1)} s (rollback fatto: il database non è cambiato).`);
console.log(failures ? "NON applicare il blocco finché non passano tutti." : "Si può applicare il blocco (SQL Editor) o lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
