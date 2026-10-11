// Sola lettura (11/10/2026): l'uso di OriginsMeta Analytics a un'ora passata e adesso, per account collegato, dai tempi
// che il database registra (collegamento del PC, arrivo di ogni partita). Uso: node scripts/tracker-usage-compare.mjs <ISO>
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const then = new Date(process.argv[2] ?? Date.now() - 3600_000);
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
const r = await db.query(
  `select p.username,
     (select count(*) from public.tracked_matches m where m.owner = p.id and m.created_at <= $1)::int as prima,
     (select count(*) from public.tracked_matches m where m.owner = p.id)::int as adesso,
     (select count(*) from public.tracked_matches m where m.owner = p.id and jsonb_array_length(m.plays) > 0 and m.created_at <= $1)::int as giocate_prima,
     (select count(*) from public.tracked_matches m where m.owner = p.id and jsonb_array_length(m.plays) > 0)::int as giocate_adesso,
     exists (select 1 from public.tracker_devices d where d.owner = p.id and d.created_at <= $1) as collegato_prima
   from public.profiles p
   where exists (select 1 from public.tracker_devices d where d.owner = p.id)
   order by adesso desc`,
  [then],
);
const total = (k) => r.rows.reduce((s, x) => s + x[k], 0);
console.log(JSON.stringify({ then: then.toISOString(), now: new Date().toISOString(), rows: r.rows, collegati_prima: r.rows.filter((x) => x.collegato_prima).length, collegati_adesso: r.rows.length, partite_prima: total("prima"), partite_adesso: total("adesso"), giocate_prima: total("giocate_prima"), giocate_adesso: total("giocate_adesso") }));
await db.query("rollback");
await db.end();
