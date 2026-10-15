// Sola lettura (15/10/2026, Pierluigi: "voglio avere accortezza di chi scarica il tracker, quindi il numero di click sul
// tasto di download"): i clic sul tasto di /tracker registrati dalla rotta /api/tracker/download (tabella
// tracker_downloads, blocco "15/10/2026: DOWNLOAD DEL TRACKER" di supabase/schema.sql), chi ha scaricato e se poi ha
// collegato l'app e mandato partite; in fondo i download degli zip contati da GitHub (comprendono anche gli
// aggiornamenti automatici dell'app e chi scarica dall'indirizzo diretto).
// Uso: node scripts/tracker-downloads.mjs [giorni]   (default 30; legge .env.local del checkout, o del checkout
// principale da un worktree)
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const days = Math.max(1, Number(process.argv[2]) || 30);
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
const since = `now() - interval '${days} days'`;

const tot = await db.query(`
  select count(*)::int as clic,
         count(*) filter (where owner is not null)::int as con_accesso,
         count(*) filter (where owner is null)::int as senza_accesso,
         count(distinct owner)::int as account_diversi,
         count(*) filter (where created_at > now() - interval '24 hours')::int as ultime_24h,
         count(*) filter (where created_at > now() - interval '7 days')::int as ultimi_7_giorni,
         min(created_at) as primo_clic
    from public.tracker_downloads where created_at > ${since}`);
console.log(`Clic sul tasto di download, ultimi ${days} giorni (senza accesso = rimandati alla pagina di accesso):`);
console.table(tot.rows.map((r) => ({ ...r, primo_clic: day(r.primo_clic) })));

// "nuovi" = account al loro primo clic in assoluto quel giorno: il numero da confrontare con l'obiettivo di Pierluigi
// (15/10/2026: "se facciamo 350 utenti al giorno, mi aspetterei una ventina di nuovi utenti ogni giorno")
const TARGET_NEW = 20;
const perDay = await db.query(`
  with first as (select owner, min(created_at) as at from public.tracker_downloads where owner is not null group by owner)
  select to_char(date_trunc('day', t.created_at), 'YYYY-MM-DD') as giorno, count(*)::int as clic,
         count(*) filter (where t.owner is not null)::int as con_accesso, count(distinct t.owner)::int as account,
         (select count(*) from first f where date_trunc('day', f.at) = date_trunc('day', t.created_at))::int as nuovi,
         count(*) filter (where t.lang = 'it')::int as it, count(*) filter (where t.lang = 'en')::int as en,
         count(*) filter (where t.lang = 'es')::int as es, count(*) filter (where t.lang = 'fr')::int as fr
    from public.tracker_downloads t where t.created_at > ${since} group by 1, date_trunc('day', t.created_at) order by 1 desc`);
console.log(`Per giorno (UTC) e lingua della pagina; nuovi = account al primo download (obiettivo ${TARGET_NEW} al giorno):`);
console.table(perDay.rows.map((r) => ({ ...r, obiettivo: r.nuovi >= TARGET_NEW ? "ok" : `${r.nuovi - TARGET_NEW}` })));

const who = await db.query(`
  select p.username, coalesce(p.badge, 'community') as ruolo, count(*)::int as clic, min(t.created_at) as primo, max(t.created_at) as ultimo,
         exists (select 1 from public.tracker_devices d where d.owner = p.id) as app_collegata,
         (select count(*) from public.tracked_matches m where m.owner = p.id)::int as partite
    from public.tracker_downloads t join public.profiles p on p.id = t.owner
   where t.created_at > ${since}
   group by p.id, p.username, p.badge order by max(t.created_at) desc`);
const linked = who.rows.filter((r) => r.app_collegata).length;
console.log(`Chi ha scaricato (${who.rows.length} account; ${linked} hanno collegato l'app, ${who.rows.filter((r) => r.partite > 0).length} hanno mandato partite), ore in UTC:`);
console.table(who.rows.map((r) => ({ utente: r.username, ruolo: r.ruolo, clic: r.clic, primo: day(r.primo), ultimo: day(r.ultimo), app_collegata: r.app_collegata ? "sì" : "no", partite: r.partite })));
await db.query("rollback");
await db.end();

try {
  const res = await fetch("https://api.github.com/repos/ultimacenere/originsmeta/releases?per_page=100", { headers: { accept: "application/vnd.github+json", "user-agent": "originsmeta-staff" } });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const rows = [];
  for (const r of await res.json()) for (const a of r.assets) if (/^OriginsMeta-(Tracker|Analytics)-/.test(a.name)) rows.push({ release: r.tag_name, pubblicata: r.published_at?.slice(0, 16).replace("T", " "), zip: a.name, download: a.download_count });
  console.log(`Download degli zip contati da GitHub (tutti i tempi; Tracker: ${rows.filter((r) => r.zip.includes("Tracker")).reduce((n, r) => n + r.download, 0)}, Analytics: ${rows.filter((r) => r.zip.includes("Analytics")).reduce((n, r) => n + r.download, 0)}; contano anche gli aggiornamenti automatici):`);
  console.table(rows);
} catch (e) {
  console.log("Contatore di GitHub non raggiungibile:", e instanceof Error ? e.message : e);
}
