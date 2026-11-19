// PROVA A SECCO del blocco "19/11/2026: ANNUNCI DEI TORNEI" sul database vero (19/11/2026): applica SOLO quel blocco di
// supabase/schema.sql in una transazione (una tabella, cinque funzioni, i vincoli dei tipi di avviso), crea utenti e tornei
// finti solo dentro la transazione (email @dryrun.originsmeta.invalid, slug zzdry-…), prova chi può pubblicare, modificare e
// cancellare, chi legge, gli avvisi agli iscritti, e alla fine fa SEMPRE rollback: sul database non resta nulla. Dura pochi
// secondi; fino al rollback aspettano solo le scritture sulle righe finte (e chi cambia i vincoli di `notifications`).
// Uso, dalla radice del repo (checkout principale aggiornato o worktree): node scripts/announcements-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { schemaProblems } from "./schema-guard.mjs";

const MARKER = "-- ===== 19/11/2026: ANNUNCI DEI TORNEI =====";
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
async function mkUser(name) {
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
    [id, `${name}@dryrun.originsmeta.invalid`, JSON.stringify({ user_name: name })],
  );
  return id;
}
async function mkTournament(slug, organizer, startsAt, visibility = "public") {
  const r = await db.query(
    `insert into public.tournaments (slug, organizer, name, starts_at, size, visibility) values ($1, $2, $3, $4, 8, $5) returning id`,
    [slug, organizer, `Dry run ${slug}`, startsAt, visibility],
  );
  return r.rows[0].id;
}
const post = (tids, title, body = "", link = null, pinned = false) =>
  attempt(`select public.tournament_announcement_post($1::uuid[], $2, $3, $4, $5) as v`, [tids, title, body, link, pinned]);

await db.connect();
await db.query("begin");
const t0 = Date.now();
try {
  const base = await db.query(`select to_regproc('public.is_tournament_staff') is not null as s, to_regclass('public.notifications') is not null as n`);
  check("ci sono già is_tournament_staff e notifications", base.rows[0].s && base.rows[0].n);
  if (failures) throw new Error("schema di base mancante");
  const r = await attempt(block);
  check("il blocco ANNUNCI DEI TORNEI si applica", !r.error, r.error ?? "");
  if (failures) throw new Error("blocco non applicato");
  const again = await attempt(block);
  check("e si riapplica (idempotente)", !again.error, again.error ?? "");

  await as("postgres");
  const ORG = await mkUser("zzdry-ann-org");
  const JUDGE = await mkUser("zzdry-ann-judge");
  const ADMIN = await mkUser("zzdry-ann-admin");
  const P1 = await mkUser("zzdry-ann-p1");
  const P2 = await mkUser("zzdry-ann-p2");
  const P3 = await mkUser("zzdry-ann-p3");
  const OUT = await mkUser("zzdry-ann-out");
  await db.query(`update public.profiles set role = 'admin' where id = $1`, [ADMIN]);
  const T1 = await mkTournament("zzdry-ann-q1", ORG, "2026-11-28T15:00:00Z");
  const T2 = await mkTournament("zzdry-ann-q2", ORG, "2026-11-28T21:00:00Z");
  const TX = await mkTournament("zzdry-ann-other", OUT, "2026-11-28T15:00:00Z");
  const TP = await mkTournament("zzdry-ann-private", ORG, "2026-11-30T15:00:00Z", "private");
  await db.query(`insert into public.tournament_judges (tournament_id, user_id) values ($1, $2)`, [T1, JUDGE]);
  await db.query(
    `insert into public.tournament_players (tournament_id, user_id, status) values
       ($1, $3, 'registered'), ($1, $4, 'waitlist'), ($1, $5, 'registered'), ($2, $5, 'registered'), ($2, $6, 'dropped'), ($7, $6, 'registered')`,
    [T1, T2, P1, P2, P3, OUT, TP],
  );
  check("utenti e tornei finti creati", (await val(`select count(*)::int as v from public.profiles where id = any($1::uuid[])`, [[ORG, JUDGE, ADMIN, P1, P2, P3, OUT]])) === 7);

  // permessi di scrittura
  await as(null);
  check("anon non pubblica", /permission denied/.test(err(await post([T1], "Hello everyone"))));
  await as(OUT);
  check("chi non è staff: forbidden", /forbidden/.test(err(await post([T1], "Hello everyone"))));
  check("staff di un altro torneo ma non di questo: forbidden", /forbidden/.test(err(await post([T1, TX], "Hello everyone"))));
  check("scrittura diretta nella tabella rifiutata", Boolean(err(await attempt(`insert into public.tournament_announcements (tournament_ids, title) values ($1::uuid[], 'Direct write')`, [[TX]]))));
  await as(JUDGE);
  check("l'arbitro di Q1 non scrive a Q1 + Q2 (non è arbitro di Q2): forbidden", /forbidden/.test(err(await post([T1, T2], "Judge note"))));
  const byJudge = await post([T1], "Judge note for Q1");
  check("l'arbitro di Q1 scrive a Q1", !byJudge.error, err(byJudge));
  await as(ORG);
  check("titolo troppo corto: invalid", /invalid/.test(err(await post([T1], "Hi"))));
  check("link non https: invalid", /invalid/.test(err(await post([T1], "Rules update", "", "http://example.com"))));
  check("nessun torneo: invalid", /invalid/.test(err(await post([], "Rules update"))));
  check("torneo che non esiste: not_found", /not_found/.test(err(await post([randomUUID()], "Rules update"))));
  const main = await post([T1, T2, T1], "Check-in opens at 9:45 ET", "**Be on time.**\r\nGood luck!  ", "https://pitch.com/v/rulebook", true);
  check("l'organizzatore scrive a Q1 + Q2", !main.error, err(main));
  const res = main.rows?.[0]?.v ?? {};
  check("avvisi a 3 persone (P1, P2 in attesa, P3 in tutti e due una volta sola; non chi si è ritirato)", res.recipients === 3, JSON.stringify(res));
  await as("postgres");
  const saved = await attempt(`select tournament_ids, body, recipients from public.tournament_announcements where id = $1`, [res.id]);
  check("tornei senza doppioni, testo pulito, destinatari salvati", saved.rows?.[0]?.tournament_ids?.length === 2 && saved.rows[0].body === "**Be on time.**\nGood luck!" && saved.rows[0].recipients === 3, err(saved) || JSON.stringify(saved.rows?.[0]));
  const notes = await attempt(`select user_id, target from public.notifications where kind = 'tournament_announcement' and event_key = $1 order by target`, [`announcement:${res.id}`]);
  check("avviso a P3 verso Q1 (il primo dei suoi tornei)", notes.rows?.find((n) => n.user_id === P3)?.target === "/tournaments/zzdry-ann-q1", err(notes) || JSON.stringify(notes.rows));
  check("nessun avviso a chi ha pubblicato né a chi si è ritirato", !notes.rows?.some((n) => n.user_id === ORG || n.user_id === OUT));

  // lettura
  await as(null);
  const anonRead = await attempt(`select id, title from public.tournament_announcements where tournament_ids && $1::uuid[]`, [[T1, T2]]);
  check("anon legge gli annunci di un torneo pubblico", anonRead.rows?.length === 2, err(anonRead));
  check("anon non legge `recipients`", /permission denied/.test(err(await attempt(`select recipients from public.tournament_announcements limit 1`))));
  await as(ORG);
  const priv = await post([TP], "Private note");
  check("annuncio su un torneo privato", !priv.error, err(priv));
  await as(null);
  check("anon non lo vede", (await val(`select count(*)::int as v from public.tournament_announcements where id = $1`, [priv.rows?.[0]?.v?.id])) === 0);
  await as(OUT);
  check("l'iscritto al torneo privato lo vede", (await val(`select count(*)::int as v from public.tournament_announcements where id = $1`, [priv.rows?.[0]?.v?.id])) === 1);
  await as(P1);
  check("chi non è iscritto al privato non lo vede", (await val(`select count(*)::int as v from public.tournament_announcements where id = $1`, [priv.rows?.[0]?.v?.id])) === 0);
  check("P1 legge i suoi due avvisi (arbitro e organizzatore), non quelli degli altri", (await val(`select count(*)::int as v from public.notifications where kind = 'tournament_announcement'`)) === 2);

  // modifica e cancellazione
  await as(JUDGE);
  check("l'arbitro di Q1 non modifica l'annuncio a Q1 + Q2", /forbidden/.test(err(await attempt(`select public.tournament_announcement_edit($1, 'Changed', '', null, false)`, [res.id]))));
  check("né lo cancella", /forbidden/.test(err(await attempt(`select public.tournament_announcement_delete($1)`, [res.id]))));
  await as(P1);
  check("un iscritto non modifica", /forbidden/.test(err(await attempt(`select public.tournament_announcement_edit($1, 'Changed', '', null, false)`, [res.id]))));
  check("aggiornamento diretto rifiutato", (await attempt(`update public.tournament_announcements set title = 'Hacked' where id = $1 returning id`, [res.id])).rows?.length !== 1);
  await as(ORG);
  const ed = await attempt(`select public.tournament_announcement_edit($1, 'Check-in opens at 9:40 ET', 'Updated', null, false)`, [res.id]);
  check("l'organizzatore modifica", !ed.error, err(ed));
  await as("postgres");
  const after = await attempt(`select title, pinned, link_url, edited_at is not null as edited from public.tournament_announcements where id = $1`, [res.id]);
  check("titolo, evidenza e link cambiati, segnato come modificato", after.rows?.[0]?.title === "Check-in opens at 9:40 ET" && after.rows[0].pinned === false && after.rows[0].link_url === null && after.rows[0].edited === true, err(after) || JSON.stringify(after.rows?.[0]));
  check("la modifica non manda altri avvisi", (await val(`select count(*)::int as v from public.notifications where kind = 'tournament_announcement' and event_key = $1`, [`announcement:${res.id}`])) === 3);
  await db.query(`update public.notifications set read_at = now() where user_id = $1 and event_key = $2`, [P1, `announcement:${res.id}`]);
  await as(ADMIN);
  const del = await attempt(`select public.tournament_announcement_delete($1)`, [res.id]);
  check("l'admin del sito cancella", !del.error, err(del));
  await as("postgres");
  check("annuncio cancellato", (await val(`select count(*)::int as v from public.tournament_announcements where id = $1`, [res.id])) === 0);
  check("restano solo gli avvisi già letti (quello di P1)", (await val(`select count(*)::int as v from public.notifications where kind = 'tournament_announcement' and event_key = $1`, [`announcement:${res.id}`])) === 1);

  // tetto: 20 annunci l'ora per autore
  await as(ORG);
  await as("postgres");
  const already = Number(await val(`select count(*)::int as v from public.tournament_announcements where author = $1 and created_at > now() - interval '1 hour'`, [ORG]));
  await as(ORG);
  let last = null;
  for (let i = already; i < 20; i++) last = await post([T2], `Flood ${i + 1}`);
  check("al ventunesimo annuncio dell'ora: too_many", !last?.error && /too_many/.test(err(await post([T2], "One too many"))), err(last ?? {}));
} catch (e) {
  check("prova completata", false, e.message);
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
console.log(`\n${passed} controlli passati, ${failures} non passati in ${((Date.now() - t0) / 1000).toFixed(1)} s (rollback fatto: il database non è cambiato).`);
console.log(failures ? "NON applicare il blocco finché non passano tutti." : "Si può applicare il blocco (SQL Editor) o lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
