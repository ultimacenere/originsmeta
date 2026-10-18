// Crea il profilo OriginsTCG (18/10/2026, Pierluigi: "crea un utente OriginsTCG e con i suoi link ufficiali", "metti una
// mail BOT", "mettilo direttamente creator"): un utente in auth.users con un indirizzo finto che non riceve posta e non può
// accedere (originstcg@profiles.originsmeta.local: dominio .local, nessuna password; NON @bots.originsmeta.local, che
// `seed-bots.mjs --remove` cancella), come gli utenti di prova di seed-bots.mjs. Il trigger handle_new_user crea il
// profilo con username "originstcg" e nome "OriginsTCG" (dai metadati); poi bio, canali e lingua da
// scripts/data/originstcg-profile.json (scripts/set-profile.mjs, stesse regole del modulo) e ruolo Creator
// (scripts/set-badge.mjs). Si può rilanciare: un utente che c'è già non si ricrea.
// Uso, dal checkout principale dopo git pull (serve .env.local): node scripts/create-originstcg.mjs [--apply]
// Senza --apply mostra solo che cosa farebbe.
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");
const EMAIL = "originstcg@profiles.originsmeta.local";
const USERNAME = "originstcg";
const DISPLAY = "OriginsTCG";
const PROFILE = path.join(root, "scripts/data/originstcg-profile.json");

const env = Object.fromEntries(
  readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();

try {
  const user = (await db.query("select id from auth.users where email = $1", [EMAIL])).rows[0];
  const taken = (await db.query("select id from public.profiles where username = $1", [USERNAME])).rows[0];
  if (taken && (!user || taken.id !== user.id)) {
    console.error(`Il nome utente "${USERNAME}" è già di un altro profilo (${taken.id}): mi fermo.`);
    process.exit(1);
  }
  if (user) console.log(`L'utente ${EMAIL} c'è già (${user.id}): non lo ricreo.`);
  else if (!apply) console.log(`Creerei l'utente ${EMAIL} con username "${USERNAME}" e nome "${DISPLAY}".`);
  else {
    const id = randomUUID();
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
         created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
         email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
       values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
         '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
      [id, EMAIL, JSON.stringify({ user_name: USERNAME, full_name: DISPLAY })],
    );
    const p = (await db.query("select username, display_name from public.profiles where id = $1", [id])).rows[0];
    console.log(`Utente creato (${id}): profilo ${p?.username} / ${p?.display_name}`);
    if (p?.username !== USERNAME) {
      console.error("Il profilo non ha il nome utente atteso: controlla prima di andare avanti.");
      process.exit(1);
    }
  }
} finally {
  await db.end();
}

if (!apply) {
  console.log(`Poi: node scripts/set-profile.mjs ${USERNAME} scripts/data/originstcg-profile.json --apply e node scripts/set-badge.mjs ${USERNAME} creator.`);
  console.log("Prova finita: per farlo davvero aggiungi --apply.");
  process.exit(0);
}
const run = (script, args) => execFileSync(process.execPath, [path.join(root, "scripts", script), ...args], { cwd: root, stdio: "inherit" });
run("set-profile.mjs", [USERNAME, PROFILE, "--apply"]);
run("set-badge.mjs", [USERNAME, "creator"]);
console.log(`Fatto: https://originsmeta.com/it/u/${USERNAME}`);
