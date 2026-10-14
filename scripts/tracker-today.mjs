// Sola lettura (13/10/2026): il giro di OriginsMeta Tracker in un giorno (oggi, ora italiana, o la data passata):
// chi l'ha collegata per la prima volta, chi ha collegato un altro PC o l'ha ricollegata, chi l'ha usata dopo l'uscita
// dell'ultima versione, codici creati e non usati, partite arrivate. Il database NON sa la versione dell'app (l'app non
// la manda): "dopo l'uscita della 0.4.1" vuol dire solo che l'app ha contattato il sito dopo quell'ora; un PC collegato
// dopo l'uscita ha scaricato lo zip di quel momento, quindi quasi certamente la versione nuova.
// Uso: node scripts/tracker-today.mjs [AAAA-MM-GG] [--release 2026-10-12T22:19:13Z]
// Legge .env.local del checkout, o del checkout principale da un worktree.
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const args = process.argv.slice(2);
const dayArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? null;
const relIdx = args.indexOf("--release");
// uscita della 0.4.1 su GitHub (analytics-v0.4.1, published_at)
const release = relIdx >= 0 ? args[relIdx + 1] : "2026-10-12T22:19:13Z";

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
await db.query("set local timezone = 'Europe/Rome'");

const { rows: [span] } = await db.query(
  `select coalesce($1::date, (now())::date) as giorno,
     coalesce($1::date, (now())::date)::timestamptz as da,
     (coalesce($1::date, (now())::date) + 1)::timestamptz as a`,
  [dayArg],
);
const hm = (d) => (d ? d.toLocaleString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "–");
const p = [span.da, span.a, release];
console.log(`OriginsMeta Tracker, ${span.giorno.toLocaleDateString("it-IT")} (ora italiana). Uscita della versione di riferimento: ${hm(new Date(release))}\n`);

const linked = await db.query(
  `select p.username, coalesce(p.badge, 'community') as ruolo, d.name as pc, d.created_at, d.last_seen_at, d.revoked_at,
     (select min(o.created_at) from public.tracker_devices o where o.owner = d.owner) as primo_collegamento,
     (select count(*) from public.tracked_matches m where m.device_id = d.id)::int as partite
   from public.tracker_devices d join public.profiles p on p.id = d.owner
   where d.created_at >= $1 and d.created_at < $2 order by d.created_at`,
  p.slice(0, 2),
);
const first = linked.rows.filter((r) => +r.primo_collegamento === +r.created_at);
const again = linked.rows.filter((r) => +r.primo_collegamento !== +r.created_at);
const show = (r) => ({ utente: r.username, ruolo: r.ruolo, pc: r.pc, collegata: hm(r.created_at), ultimo_contatto: hm(r.last_seen_at), partite: r.partite, scollegata: r.revoked_at ? hm(r.revoked_at) : "", versione: +r.created_at >= +new Date(release) ? "nuova (zip dopo l'uscita)" : "precedente" });
console.log(`PRIMO COLLEGAMENTO nel giorno: ${first.length} (chi aveva la 0.3.x senza account e si è aggiornato da solo compare qui la prima volta che collega)`);
if (first.length) console.table(first.map(show));
console.log(`\nALTRO PC O NUOVO COLLEGAMENTO di chi l'aveva già: ${again.length}`);
if (again.length) console.table(again.map((r) => ({ ...show(r), primo_collegamento: hm(r.primo_collegamento) })));

const active = await db.query(
  `select p.username, coalesce(p.badge, 'community') as ruolo,
     min(d.created_at) as primo_collegamento, max(d.last_seen_at) as ultimo_contatto,
     bool_or(d.created_at >= $1::timestamptz) as pc_dopo_uscita,
     (select count(*) from public.tracked_matches m where m.owner = p.id and m.created_at >= $1::timestamptz)::int as partite_dopo_uscita
   from public.tracker_devices d join public.profiles p on p.id = d.owner
   where d.revoked_at is null
   group by p.id, p.username, p.badge order by max(d.last_seen_at) desc nulls last`,
  [release],
);
const after = active.rows.filter((r) => r.ultimo_contatto && +r.ultimo_contatto >= +new Date(release));
const before = active.rows.filter((r) => !r.ultimo_contatto || +r.ultimo_contatto < +new Date(release));
console.log(`\nAPP ACCESA DOPO L'USCITA (contatto col sito dopo ${hm(new Date(release))}): ${after.length}`);
console.log("  aggiornata = collegata dopo l'uscita; per gli altri l'aggiornamento automatico parte 30 s dopo l'avvio e si installa a gioco chiuso");
if (after.length) console.table(after.map((r) => ({ utente: r.username, ruolo: r.ruolo, ultimo_contatto: hm(r.ultimo_contatto), stato: r.pc_dopo_uscita ? "installata dopo l'uscita" : "da verificare", partite_dopo_uscita: r.partite_dopo_uscita })));
console.log(`\nNON ANCORA VISTE DOPO L'USCITA (probabilmente ancora sulla versione precedente): ${before.length}`);
if (before.length) console.table(before.map((r) => ({ utente: r.username, ruolo: r.ruolo, ultimo_contatto: hm(r.ultimo_contatto) })));

const codes = await db.query(
  `select p.username, c.created_at, c.used_at from public.tracker_link_codes c join public.profiles p on p.id = c.owner
   where c.created_at >= $1 and c.created_at < $2 order by c.created_at`,
  p.slice(0, 2),
);
const unused = codes.rows.filter((r) => !r.used_at);
console.log(`\nCODICI DI COLLEGAMENTO creati nel giorno: ${codes.rows.length}, mai usati: ${unused.length} (non usato = ha provato e non ha finito)`);
if (unused.length) console.table(unused.map((r) => ({ utente: r.username, creato: hm(r.created_at) })));

const { rows: [m] } = await db.query(
  `select count(*)::int as partite, count(distinct owner)::int as account from public.tracked_matches where created_at >= $1 and created_at < $2`,
  p.slice(0, 2),
);
console.log(`\nPARTITE ARRIVATE nel giorno: ${m.partite} da ${m.account} account`);

await db.query("rollback");
await db.end();
