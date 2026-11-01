// PROVA A SECCO del blocco "02/11/2026: STATISTICHE DEI FUMETTI" sul database vero: esegue supabase/schema.sql in UNA
// transazione, prova i contatori dei fumetti come li usa il sito (visitatori anonimi, chi ha disegnato il fumetto con
// l'accesso fatto, un altro iscritto, lo staff) e alla fine fa SEMPRE rollback: sul database non resta nulla. Usa un
// fumetto pubblicato che c'è già (il primo per data) e i profili iscritti solo dentro la transazione.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/comic-stats-dry-run.mjs
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
const bump = (slug, lang, kind) => attempt("select public.bump_comic_stat($1, $2, $3)", [slug, lang, kind]);
const rowsOf = async (comicId) => (await attempt("select lang, views, reads from public.comic_stats_daily where comic_id = $1 order by lang", [comicId])).rows ?? [];

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.comic_stats_daily') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella comic_stats_daily c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");
  const comic = (await db.query(`select id, slug, owner from public.community_comics where status = 'published' order by published_at limit 1`)).rows[0];
  check("un fumetto pubblicato su cui provare", Boolean(comic), comic ? comic.slug : "nessun fumetto pubblicato: i controlli sui contatori saltano");
  const other = comic ? (await db.query(`select id from public.profiles where id <> $1 and role is distinct from 'admin' and badge is distinct from 'staff' order by created_at limit 1`, [comic.owner])).rows[0] : null;
  const staff = (await db.query(`select id from public.profiles where role = 'admin' or badge = 'staff' order by created_at limit 1`)).rows[0];
  const hidden = (await db.query(`select slug from public.community_comics where status <> 'published' order by updated_at desc limit 1`)).rows[0];

  await as("anon");
  check("anon non legge le statistiche", Boolean((await attempt("select * from public.comic_stats_daily")).error));
  check("anon non scrive direttamente", Boolean((await attempt("insert into public.comic_stats_daily (comic_id, day, lang) values (gen_random_uuid(), current_date, 'it')")).error));
  if (comic) {
    check("anon conta una visita (it)", !(await bump(comic.slug, "it", "view")).error);
    check("anon conta una visita (en) e una lettura (en)", !(await bump(comic.slug, "en", "view")).error && !(await bump(comic.slug, "en", "read")).error);
    check("tipo sconosciuto: nessun errore", !(await bump(comic.slug, "it", "code")).error);
    check("lingua sconosciuta: nessun errore", !(await bump(comic.slug, "jp", "view")).error);
    check("slug inesistente: nessun errore", !(await bump("zz-fumetto-che-non-esiste", "it", "view")).error);
    if (hidden) check("fumetto non pubblicato: nessun errore", !(await bump(hidden.slug, "it", "view")).error);

    await as("authenticated", comic.owner);
    check("l'autore con l'accesso non conta sul proprio fumetto", !(await bump(comic.slug, "it", "view")).error);
    const own = await rowsOf(comic.id);
    check("l'autore legge le sue righe: it 1 visita, en 1 visita e 1 lettura", JSON.stringify(own.map((r) => [r.lang, Number(r.views), Number(r.reads)])) === JSON.stringify([["en", 1, 1], ["it", 1, 0]]), JSON.stringify(own));
    check("l'autore non scrive direttamente", Boolean((await attempt("update public.comic_stats_daily set views = 999 where comic_id = $1 returning views", [comic.id])).error || (await attempt("select views from public.comic_stats_daily where comic_id = $1 and lang = 'it'", [comic.id])).rows?.[0]?.views !== 999));

    if (other) {
      await as("authenticated", other.id);
      check("un altro iscritto conta una visita", !(await bump(comic.slug, "es", "view")).error);
      check("un altro iscritto non legge le righe", ((await attempt("select * from public.comic_stats_daily where comic_id = $1", [comic.id])).rows ?? []).length === 0);
    } else console.log("nota: nessun altro iscritto non staff: salto la prova dell'altro utente");

    if (staff) {
      await as("authenticated", staff.id);
      const seen = await rowsOf(comic.id);
      check("lo staff legge le righe di tutti", seen.length >= 2, JSON.stringify(seen));
    } else console.log("nota: nessun admin o Staff: salto la prova dello staff");

    if (hidden) {
      await as("authenticated", staff?.id ?? comic.owner);
      check("il fumetto non pubblicato non ha righe", ((await attempt("select 1 from public.comic_stats_daily s join public.community_comics c on c.id = s.comic_id where c.slug = $1", [hidden.slug])).rows ?? []).length === 0);
    }
  }

  await as("postgres");
  const def = (await db.query("select pg_get_constraintdef(oid) as def from pg_constraint where conrelid = 'public.comic_stats_daily'::regclass and contype = 'p'")).rows[0]?.def ?? "";
  check("chiave primaria (comic_id, day, lang)", def.includes("(comic_id, day, lang)"), def);
  const rls = (await db.query("select relrowsecurity from pg_class where oid = 'public.comic_stats_daily'::regclass")).rows[0];
  check("RLS attiva", rls?.relrowsecurity === true);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
