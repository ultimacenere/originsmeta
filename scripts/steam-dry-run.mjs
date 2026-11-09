// PROVA A SECCO del blocco "09/11/2026: STEAM" sul database vero (09/11/2026): applica SOLO quel blocco di
// supabase/schema.sql in una transazione, crea tre utenti finti (email @dryrun.originsmeta.invalid e un indirizzo tecnico
// di un account nato con Steam, solo dentro la transazione), prova collegamento, stato e scollegamento con le regole del
// blocco e alla fine fa SEMPRE rollback: sul database non resta nulla.
// Dura pochi secondi. Il blocco crea una tabella con la chiave esterna verso public.profiles, quindi fino al rollback le
// SCRITTURE sui profili (iscrizioni nuove, modifiche del profilo) aspettano; le letture no. Con il blocco già migrato
// non crea niente e prova le funzioni che ci sono.
// Serve CRON_SECRET in .env.local, lo stesso registrato con scripts/set-cron-key.mjs (steam_link_set lo ricontrolla).
// Uso, dalla radice del repo (checkout principale aggiornato o worktree): node scripts/steam-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { schemaProblems } from "./schema-guard.mjs";

const MARKER = "-- ===== 09/11/2026: STEAM =====";
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

// SteamID64 finti ma della forma giusta (17 cifre, 7656119…), mai collegati a nessuno: si controlla prima
const S1 = "76561190000000001";
const S2 = "76561190000000002";
const S3 = "76561190000000003";

await db.connect();
await db.query("begin");
const t0 = Date.now();
try {
  const before = await db.query(`select to_regclass('public.steam_links') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella steam_links c'è già (migrazione già fatta?): provo le funzioni che ci sono");
  const r = await attempt(block);
  check("il blocco STEAM si applica", !r.error, r.error ?? "");
  if (failures) throw new Error("blocco non applicato");
  check("il segreto del cron è quello registrato", (await val("select public.notify_key_ok($1) as v", [KEY])) === true);
  const used = await attempt(`select count(*)::int as n from public.steam_links where steam_id = any($1)`, [[S1, S2, S3]]);
  check("gli SteamID di prova non sono di nessuno", used.rows?.[0]?.n === 0, err(used));

  await as("postgres");
  const A = await mkUser(`steam-a@dryrun.originsmeta.invalid`, { user_name: "zzdry-steam-a" });
  const B = await mkUser(`steam-${S2}-0123456789abcdef@steam.originsmeta.local`, { user_name: "zzdry-steam-b", full_name: "Steam B" });
  const C = await mkUser(`steam-c@dryrun.originsmeta.invalid`, { user_name: "zzdry-steam-c" });
  check("utenti finti creati con il profilo", (await val(`select count(*)::int as v from public.profiles where id = any($1::uuid[])`, [[A, B, C]])) === 3);

  // nessun client legge o scrive la tabella
  await as(null);
  check("anon non legge steam_links", /permission denied/.test(err(await attempt(`select * from public.steam_links`))));
  check("anon non chiama steam_link_status", /permission denied/.test(err(await attempt(`select * from public.steam_link_status()`))));
  check("anon non chiama steam_link_set", /permission denied/.test(err(await attempt(`select public.steam_link_set($1, $2)`, [KEY, S1]))));
  await as(A);
  check("un iscritto non legge steam_links", /permission denied/.test(err(await attempt(`select * from public.steam_links`))));
  check("un iscritto non scrive in steam_links", /permission denied/.test(err(await attempt(`insert into public.steam_links (user_id, steam_id) values ($1, $2)`, [A, S1]))));
  check("un iscritto non chiama steam_account_only", /permission denied/.test(err(await attempt(`select public.steam_account_only($1)`, [A]))));

  // collegamento
  check("senza il segreto del server: forbidden", /forbidden/.test(err(await attempt(`select public.steam_link_set($1, $2)`, ["x".repeat(40), S1]))));
  check("SteamID sbagliato: invalid", (await val(`select public.steam_link_set($1, '12345') as v`, [KEY])) === "invalid");
  check("A collega S1: ok", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S1])) === "ok");
  check("A ricollega S1: same", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S1])) === "same");
  check("A prova un secondo account Steam: other", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S3])) === "other");
  const st = await attempt(`select steam_id, steam_only from public.steam_link_status()`);
  check("A legge il suo collegamento", st.rows?.length === 1 && st.rows[0].steam_id === S1 && st.rows[0].steam_only === false, err(st) || JSON.stringify(st.rows));
  await as(C);
  check("C prova S1 di A: taken", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S1])) === "taken");
  const none = await attempt(`select * from public.steam_link_status()`);
  check("C non vede il collegamento di A", !none.error && none.rows.length === 0, err(none));
  check("C scollega senza collegamento: none", (await val(`select public.steam_link_remove() as v`)) === "none");

  // account nato con Steam: il collegamento resta
  await as(B);
  check("B (nato con Steam) collega S2: ok", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S2])) === "ok");
  const sb = await attempt(`select steam_only from public.steam_link_status()`);
  check("B risulta nato con Steam", sb.rows?.[0]?.steam_only === true, err(sb) || JSON.stringify(sb.rows));
  check("B non scollega: steam_only", (await val(`select public.steam_link_remove() as v`)) === "steam_only");
  await as("postgres");
  // con il savepoint di attempt: un errore qui non interrompe la transazione. Le colonne di auth.identities cambiano fra
  // le versioni di Supabase: se la riga non entra, il controllo si salta.
  const ident = await attempt(
    `insert into auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at) values (gen_random_uuid(), $1, 'discord', 'zzdry-discord', '{}'::jsonb, now(), now())`,
    [B],
  );
  if (ident.error) console.log(`nota: identità Discord di prova non scritta (${ident.error}): controllo saltato`);
  const hasDiscord = await val(`select count(*)::int as v from auth.identities where user_id = $1 and provider = 'discord'`, [B]);
  if (hasDiscord === 1) {
    await as(B);
    check("B con anche Discord scollega: ok", (await val(`select public.steam_link_remove() as v`)) === "ok");
  }

  // scollegamento e cancellazione dell'account
  await as(A);
  check("A scollega: ok", (await val(`select public.steam_link_remove() as v`)) === "ok");
  check("dopo: nessun collegamento", (await attempt(`select * from public.steam_link_status()`)).rows?.length === 0);
  check("A ricollega S1", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S1])) === "ok");
  await as("postgres");
  await db.query(`delete from auth.users where id = $1`, [A]);
  check("cancellato l'account, il collegamento se ne va", (await val(`select count(*)::int as v from public.steam_links where user_id = $1`, [A])) === 0);
  await as(C);
  check("…e S1 torna libero per C", (await val(`select public.steam_link_set($1, $2) as v`, [KEY, S1])) === "ok");
} catch (e) {
  check("prova completata", false, e.message);
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
console.log(`\n${passed} controlli passati, ${failures} non passati in ${((Date.now() - t0) / 1000).toFixed(1)} s (rollback fatto: il database non è cambiato).`);
console.log(failures ? "NON migrare finché non passano tutti." : "Si può migrare: node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
