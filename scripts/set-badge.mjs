// Assegna il tag autore (badge) a un profilo della community: community (default), influencer, pro, staff.
// Il tag lo assegna solo lo staff, mai l'utente (note per sito 5.0, 15/09/2026).
// Uso: node scripts/set-badge.mjs <username|email|parte del nome> <community|influencer|pro|staff>
import { readFileSync } from "node:fs";
import pg from "pg";

const BADGES = ["community", "influencer", "pro", "staff"];
const [needle, badge] = process.argv.slice(2);
if (!needle || !BADGES.includes(badge)) {
  console.error(`Uso: node scripts/set-badge.mjs <username|email|nome> <${BADGES.join("|")}>`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
const r = await db.query(
  `select p.id, p.username, p.display_name, p.badge, u.email
     from public.profiles p join auth.users u on u.id = p.id
    where p.username ilike $1 or p.display_name ilike $2 or u.email ilike $1
    order by p.created_at desc limit 5`,
  [needle, `%${needle}%`],
);
if (!r.rows.length) {
  console.log(`Nessun profilo trovato per "${needle}".`);
  await db.end();
  process.exit(2);
}
if (r.rows.length > 1) console.log("Più profili corrispondono, uso il primo:", r.rows.map((x) => `${x.username} (${x.email})`).join(", "));
const target = r.rows[0];
await db.query("update public.profiles set badge = $1 where id = $2", [badge, target.id]);
console.log(`${target.display_name ?? target.username} (@${target.username}, ${target.email}): tag ${target.badge} → ${badge}`);
await db.end();
