// PROVA A SECCO del blocco "13/10/2026: TWITCH" sul database vero (estensione Twitch "Deck tracker", docs/twitch.md):
// esegue supabase/schema.sql in UNA transazione, prova le funzioni come le usano il sito (utente con l'accesso fatto),
// la rotta del collegamento (anon con il segreto del cron), l'app (anon con il token) e l'estensione (anon), e alla
// fine fa SEMPRE rollback: sul database non resta nulla. Usa i primi due profili iscritti solo dentro la transazione.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/twitch-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
// Serve CRON_SECRET in .env.local, lo stesso registrato con scripts/set-cron-key.mjs (twitch_link_claim lo ricontrolla).
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
if (!env.CRON_SECRET) {
  console.error("Manca CRON_SECRET in .env.local (lo stesso di Vercel e di scripts/set-cron-key.mjs).");
  process.exit(1);
}
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

const STATE = { v: 1, deck: { name: "Prova", legendary: "C00065_MC", cards: [["C00065_MC", 1, 1, 0]] }, live: { inMatch: true, round: 3, deckLeft: 20, opp: { legendary: "C00042_SC", deckLeft: null, seen: [["C00026_SB", 1]] } } };
const CHANNEL = "900000000001";

await db.connect();
await db.query("begin");
try {
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  const users = (await db.query(`select id from public.profiles order by created_at limit 2`)).rows;
  check("due profili per la prova", users.length === 2);
  const [u1, u2] = users.map((u) => u.id);

  // token dell'app per u1 (blocco TRACKER)
  await as("authenticated", u1);
  const tcode = (await attempt("select public.tracker_link_code() as c")).rows?.[0]?.c;
  await as("anon");
  const token = (await attempt("select * from public.tracker_link_claim($1, 'PC di prova')", [tcode])).rows?.[0]?.token;
  check("token dell'app", /^omt_[0-9a-f]{64}$/.test(token ?? ""));

  // senza canale: niente salvato
  const before = await attempt("select public.tracker_live_push($1, $2::jsonb) as c", [token, JSON.stringify(STATE)]);
  check("senza canale collegato: null e niente salvato", !before.error && before.rows[0].c === null, before.error ?? "");
  await as("postgres");
  check("tracker_live vuota", Number((await db.query("select count(*) as n from public.tracker_live")).rows[0].n) === 0);

  // codice per Twitch
  await as("anon");
  check("anon non crea codici Twitch", Boolean((await attempt("select public.twitch_link_code()")).error));
  await as("authenticated", u1);
  const code = (await attempt("select public.twitch_link_code() as c")).rows?.[0]?.c;
  check("codice Twitch creato", /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code ?? ""));
  check("i codici non si leggono", Boolean((await attempt("select * from public.twitch_link_codes")).error));

  // collegamento dalla rotta (anon + segreto)
  await as("anon");
  check("senza il segreto: forbidden", /forbidden/.test((await attempt("select public.twitch_link_claim('sbagliato', $1, $2)", [code, CHANNEL])).error ?? ""));
  check("canale non valido: invalid_code", /invalid_code/.test((await attempt("select public.twitch_link_claim($1, $2, 'abc')", [env.CRON_SECRET, code])).error ?? ""));
  const claim = await attempt("select public.twitch_link_claim($1, $2, $3) as u", [env.CRON_SECRET, code.toLowerCase(), CHANNEL]);
  check("canale collegato (codice in minuscolo)", !claim.error && typeof claim.rows[0].u === "string", claim.error ?? "");
  check("codice usato una volta sola", /invalid_code/.test((await attempt("select public.twitch_link_claim($1, $2, $3)", [env.CRON_SECRET, code, CHANNEL])).error ?? ""));

  // stato dal vivo
  const push = await attempt("select public.tracker_live_push($1, $2::jsonb) as c", [token, JSON.stringify(STATE)]);
  check("stato salvato, torna il canale", !push.error && push.rows[0].c === CHANNEL, push.error ?? "");
  check("subito dopo: too_fast", /too_fast/.test((await attempt("select public.tracker_live_push($1, $2::jsonb)", [token, JSON.stringify(STATE)])).error ?? ""));
  check("token sbagliato: invalid_token", /invalid_token/.test((await attempt("select public.tracker_live_push($1, $2::jsonb)", ["omt_" + "0".repeat(64), JSON.stringify(STATE)])).error ?? ""));
  check("stato non oggetto: invalid_state", /invalid_state/.test((await attempt("select public.tracker_live_push($1, '[1]'::jsonb)", [token])).error ?? ""));
  const read = await attempt("select * from public.twitch_live_state($1)", [CHANNEL]);
  check("l'estensione legge lo stato del canale", !read.error && read.rows.length === 1 && read.rows[0].state.live.round === 3, read.error ?? "");
  check("canale sconosciuto: niente", (await attempt("select * from public.twitch_live_state('1')")).rows?.length === 0);
  check("anon non legge le tabelle", Boolean((await attempt("select * from public.tracker_live")).error) && Boolean((await attempt("select * from public.twitch_links")).error));

  // il proprietario vede il suo canale, un altro no
  await as("authenticated", u1);
  check("il proprietario legge il suo canale", (await attempt("select channel_id from public.twitch_links")).rows?.[0]?.channel_id === CHANNEL);
  await as("authenticated", u2);
  check("un altro utente non lo vede", (await attempt("select channel_id from public.twitch_links")).rows?.length === 0);
  check("un altro utente non scollega niente", (await attempt("select public.twitch_unlink() as ok")).rows?.[0]?.ok === false);

  // lo stesso canale collegato da un altro account passa a lui
  const code2 = (await attempt("select public.twitch_link_code() as c")).rows?.[0]?.c;
  await as("anon");
  await attempt("select public.twitch_link_claim($1, $2, $3)", [env.CRON_SECRET, code2, CHANNEL]);
  await as("postgres");
  const owners = (await db.query("select owner from public.twitch_links where channel_id = $1", [CHANNEL])).rows;
  check("un canale sta con un solo account (l'ultimo che lo collega)", owners.length === 1 && owners[0].owner === u2);
  check("lo stato del vecchio proprietario non si legge più", (await attempt("select * from public.twitch_live_state($1)", [CHANNEL])).rows?.length === 0);

  // scollegamento
  await as("authenticated", u2);
  check("scollegamento", (await attempt("select public.twitch_unlink() as ok")).rows?.[0]?.ok === true);

  // privilegi
  await as("postgres");
  const privs = (await attempt(`select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon, has_function_privilege('authenticated', p.oid, 'execute') as auth
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and (p.proname like 'twitch%' or p.proname = 'tracker_live_push') order by 1`)).rows ?? [];
  const who = Object.fromEntries(privs.map((p) => [p.proname, `${p.anon ? "A" : "-"}${p.auth ? "U" : "-"}`]));
  check(
    "privilegi delle funzioni",
    JSON.stringify(who) === JSON.stringify({ tracker_live_push: "AU", twitch_link_claim: "AU", twitch_link_code: "-U", twitch_live_state: "AU", twitch_unlink: "-U" }),
    JSON.stringify(who),
  );
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `CI SONO ${failures} CONTROLLI FALLITI (rollback: nulla è stato scritto).` : "TUTTO OK: nulla è stato scritto (rollback).");
process.exit(failures ? 1 : 0);
