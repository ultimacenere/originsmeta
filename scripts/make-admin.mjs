// Assegna (o toglie) il ruolo admin a un profilo della community.
// Uso: node scripts/make-admin.mjs <username|email|parte del nome> [--revoke] [--wait <minuti>]
// --wait: se il profilo non esiste ancora (l'utente deve ancora fare il primo accesso), riprova ogni 30 s.
import { readFileSync } from "node:fs";
import pg from "pg";

const args = process.argv.slice(2);
const needle = args.find((a) => !a.startsWith("--"));
if (!needle) {
  console.error("Uso: node scripts/make-admin.mjs <username|email|nome> [--revoke] [--wait <minuti>]");
  process.exit(1);
}
const revoke = args.includes("--revoke");
const waitIdx = args.indexOf("--wait");
const waitMinutes = waitIdx >= 0 ? Number(args[waitIdx + 1] || 30) : 0;

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();

const find = async () => {
  const r = await db.query(
    `select p.id, p.username, p.display_name, p.role, u.email
       from public.profiles p join auth.users u on u.id = p.id
      where p.username ilike $1 or p.display_name ilike $2 or u.email ilike $1
      order by p.created_at desc limit 5`,
    [needle, `%${needle}%`],
  );
  return r.rows;
};

const deadline = Date.now() + waitMinutes * 60_000;
let rows = await find();
while (!rows.length && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 30_000));
  rows = await find();
}
if (!rows.length) {
  console.log(`Nessun profilo trovato per "${needle}"${waitMinutes ? ` dopo ${waitMinutes} minuti` : ""}.`);
  await db.end();
  process.exit(2);
}
if (rows.length > 1) console.log("Più profili corrispondono, uso il primo:", rows.map((r) => `${r.username} (${r.email})`).join(", "));
const target = rows[0];
const role = revoke ? "user" : "admin";
await db.query("update public.profiles set role = $1 where id = $2", [role, target.id]);
console.log(`${target.display_name ?? target.username} (@${target.username}, ${target.email}) → ruolo ${role}`);
await db.end();
