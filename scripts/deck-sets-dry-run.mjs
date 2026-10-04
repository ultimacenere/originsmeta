// PROVA A SECCO del blocco "04/10/2026: MAZZI TORNEO" sul database vero (04/10/2026): esegue supabase/schema.sql in UNA
// transazione, prova i mazzi torneo come li usa il sito (utenti con l'accesso fatto, visitatori anonimi) e alla fine fa
// SEMPRE rollback: sul database non resta nulla. Usa i primi due profili iscritti solo dentro la transazione. Stessi
// controlli della prova su PGlite fatta il 04/10/2026 (32 controlli passati).
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/deck-sets-dry-run.mjs
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
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => `zz-prova-${from + i}`);
const deck = (leg, cards) => ({ name: `Prova ${leg}`, legendary: leg, cards, custom_cards: [], archetype: "midrange", code_om: "OM1.prova" });
const good = [deck("zz-leg-1", range(1, 12)), deck("zz-leg-2", range(9, 20)), deck("zz-leg-3", range(21, 32))];
const guide = { lang: "it", summary: "Trio di prova della migrazione, si cancella da solo.", deck_1: "Prova" };
const insert = (slug, owner, decks, g = guide) =>
  attempt("insert into public.community_deck_sets (slug, owner, name, decks, guide) values ($1, $2, 'Trio di prova', $3, $4) returning id, legendaries", [slug, owner, JSON.stringify(decks), JSON.stringify(g)]);

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.community_deck_sets') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella community_deck_sets c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");
  // A: il primo iscritto; B: il primo iscritto che NON è admin (un admin può modificare i trii degli altri, come i mazzi:
  // policy "deck sets: owners update"); C: un admin, se c'è, per provare proprio quel permesso
  const first = (await db.query(`select id from public.profiles order by created_at limit 1`)).rows[0];
  const plain = (await db.query(`select id from public.profiles where role is distinct from 'admin' and id <> $1 order by created_at limit 1`, [first?.id])).rows[0];
  const admin = (await db.query(`select id from public.profiles where role = 'admin' and id <> $1 order by created_at limit 1`, [first?.id])).rows[0];
  check("due profili per la prova (B non admin)", Boolean(first && plain));
  const [a, b] = [first?.id, plain?.id];

  await as("authenticated", a);
  const ok = await insert("zz-prova-trio-a", a, good);
  check("A pubblica un trio valido", !ok.error, ok.error ?? "");
  check("le Leggendarie le scrive il trigger", JSON.stringify(ok.rows?.[0]?.legendaries) === JSON.stringify(["zz-leg-1", "zz-leg-2", "zz-leg-3"]));
  const id = ok.rows?.[0]?.id;
  check("Leggendaria ripetuta rifiutata", /deck_set_legendaries/.test((await insert("zz-prova-trio-b", a, [good[0], deck("zz-leg-1", range(40, 51)), good[2]])).error ?? ""));
  check("mazzi troppo simili rifiutati", /deck_set_similar/.test((await insert("zz-prova-trio-c", a, [good[0], deck("zz-leg-2", range(6, 17)), good[2]])).error ?? ""));
  check("11 carte rifiutate", /deck_set_invalid/.test((await insert("zz-prova-trio-d", a, [deck("zz-leg-1", range(1, 11)), good[1], good[2]])).error ?? ""));
  check("riassunto troppo corto rifiutato", /guide_check/.test((await insert("zz-prova-trio-e", a, good, { lang: "it", summary: "corto" })).error ?? ""));
  check("non si pubblica a nome di un altro", Boolean((await insert("zz-prova-trio-f", b, good)).error));
  check("voto sul proprio trio rifiutato", Boolean((await attempt("insert into public.deck_set_votes (set_id, user_id, stars) values ($1, $2, 5)", [id, a])).error));

  await as("authenticated", b);
  const vote = await attempt("insert into public.deck_set_votes (set_id, user_id, stars) values ($1, $2, 4) on conflict (set_id, user_id) do update set stars = excluded.stars", [id, b]);
  check("B vota il trio di A", !vote.error, vote.error ?? "");
  check("B (non admin) non modifica il trio di A", (await attempt("update public.community_deck_sets set name = 'Furto' where id = $1 returning id", [id])).rows?.length === 0);
  if (admin && admin.id !== b) {
    await as("authenticated", admin.id);
    check("un admin può modificare il trio di A (come i mazzi)", (await attempt("update public.community_deck_sets set name = 'Trio di prova' where id = $1 returning id", [id])).rows?.length === 1);
    await as("authenticated", b);
  }

  await as("anon");
  const rating = (await attempt("select avg_stars, votes from public.deck_set_ratings where set_id = $1", [id])).rows?.[0];
  check("la media si legge da anon", rating?.votes === 1 && Number(rating?.avg_stars) === 4);
  check("anon conta una visita", !(await attempt("select public.bump_deck_set_stat('zz-prova-trio-a', 'view')")).error);
  check("anon non legge le statistiche", Boolean((await attempt("select * from public.deck_set_stats_daily")).error));
  check("anon non scrive", Boolean((await attempt("insert into public.community_deck_sets (slug, owner, name, decks, guide) values ('zz-x', $1, 'xxx', '[]', '{}')", [a])).error));

  await as("authenticated", a);
  const stats = (await attempt("select views from public.deck_set_stats_daily where set_id = $1", [id])).rows?.[0];
  check("A legge le statistiche del suo trio", stats?.views === 1);
  const hidden = await attempt("update public.community_deck_sets set status = 'hidden' where id = $1 returning status", [id]);
  check("A nasconde il suo trio", hidden.rows?.[0]?.status === "hidden", hidden.error ?? "");
  await as("anon");
  check("il trio nascosto non si vede", (await attempt("select 1 from public.community_deck_sets where id = $1", [id])).rows?.length === 0);

  await as("postgres");
  const kinds = (await db.query("select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'notifications_kind_check'")).rows[0]?.def ?? "";
  check("avvisi: il tipo deck_set_published è ammesso", kinds.includes("deck_set_published"));
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
