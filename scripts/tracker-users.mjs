// Sola lettura (11/10/2026): chi usa OriginsMeta Analytics collegata all'account OriginsMeta, con i PC collegati,
// l'ultimo contatto dell'app e le partite mandate. Chi usa l'app senza collegarla non compare (le partite restano sul
// suo PC). Uso: node scripts/tracker-users.mjs (legge .env.local del checkout, o del checkout principale da un worktree).
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const envFile = [new URL("../.env.local", import.meta.url), new URL("../../../../.env.local", import.meta.url)].find((u) => existsSync(u));
if (!envFile) throw new Error("manca .env.local con la password del database");
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query("begin read only");
const day = (d) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : "–");
const users = await db.query(`
  select p.username, coalesce(p.badge, 'community') as ruolo,
    (select count(*) from public.tracker_devices d where d.owner = p.id and d.revoked_at is null)::int as pc,
    (select min(d.created_at) from public.tracker_devices d where d.owner = p.id) as collegata_il,
    (select max(d.last_seen_at) from public.tracker_devices d where d.owner = p.id) as ultimo_contatto,
    (select count(*) from public.tracked_matches m where m.owner = p.id)::int as partite,
    (select count(*) from public.tracked_matches m where m.owner = p.id and m.created_at > now() - interval '24 hours')::int as ultime_24h,
    (select count(*) from public.tracked_matches m where m.owner = p.id and jsonb_array_length(m.plays) > 0)::int as con_giocate,
    (select max(m.ended_at) from public.tracked_matches m where m.owner = p.id) as ultima_partita
  from public.profiles p
  where exists (select 1 from public.tracker_devices d where d.owner = p.id)
     or exists (select 1 from public.tracker_link_codes c where c.owner = p.id)
  order by ultimo_contatto desc nulls last`);
console.log("Chi ha collegato l'app (o ha creato un codice per collegarla), ore in UTC:");
console.table(users.rows.map((r) => ({ ...r, collegata_il: day(r.collegata_il), ultimo_contatto: day(r.ultimo_contatto), ultima_partita: day(r.ultima_partita) })));
const codes = await db.query(`
  select p.username, c.created_at, c.used_at from public.tracker_link_codes c join public.profiles p on p.id = c.owner
  where c.created_at > now() - interval '3 days' order by c.created_at desc limit 20`);
console.log("Codici di collegamento degli ultimi 3 giorni (non usato = ci ha provato e non ha finito):");
console.table(codes.rows.map((r) => ({ utente: r.username, creato: day(r.created_at), usato: r.used_at ? day(r.used_at) : "no" })));
await db.query("rollback");
await db.end();
