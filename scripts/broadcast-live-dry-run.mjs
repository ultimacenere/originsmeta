// PROVA A SECCO del blocco "05/11/2026: BROADCASTING IN DIRETTA" sul database vero (Broadcasting OM in diretta dal sito
// ed estensione Twitch, docs/broadcasting.md): esegue supabase/schema.sql in UNA transazione, prova le funzioni come le
// usano la regia (utente con l'accesso fatto), l'overlay di OBS e l'estensione (anon) e la rotta del collegamento
// (anon con il segreto del cron), e alla fine fa SEMPRE rollback: sul database non resta nulla. Usa i primi due profili
// iscritti solo dentro la transazione.
// Uso, dalla radice del repo (checkout principale aggiornato o worktree): node scripts/broadcast-live-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
// Serve CRON_SECRET in .env.local, lo stesso registrato con scripts/set-cron-key.mjs (broadcast_link_claim lo ricontrolla).
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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

const STATE = { v: 1, lang: "it", tournament: { name: "Prova a secco", number: "#1", tag: "", phase: "Finale", bestOf: 3 }, players: [], sponsors: {} };
const CHANNEL = "900000000077";
const IMG = "data:image/webp;base64,UklGRhYAAABXRUJQVlA4TAoAAAAvAAAAAAfQ//73vw==";

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

  await as("anon");
  check("anon non apre una diretta", Boolean((await attempt("select * from public.broadcast_live_info(true)")).error));
  check("anon non legge le tabelle", Boolean((await attempt("select * from public.broadcast_lives")).error) && Boolean((await attempt("select * from public.broadcast_twitch_links")).error));

  await as("authenticated", u1);
  const open = await attempt("select * from public.broadcast_live_info(true)");
  const liveId = open.rows?.[0]?.id;
  check("diretta creata con un id di 12 caratteri", !open.error && /^[a-z0-9]{12}$/.test(liveId ?? ""), open.error ?? "");
  const save = await attempt("select * from public.broadcast_live_save($1::jsonb)", [JSON.stringify(STATE)]);
  check("stato salvato", !save.error && save.rows[0]?.id === liveId && save.rows[0]?.version === 1, save.error ?? JSON.stringify(save.rows));
  check("subito dopo: too_fast", /too_fast/.test((await attempt("select * from public.broadcast_live_save($1::jsonb)", [JSON.stringify(STATE)])).error ?? ""));
  check("stato non oggetto: invalid_state", /invalid_state/.test((await attempt("select * from public.broadcast_live_save('[1]'::jsonb)")).error ?? ""));
  const put = await attempt("select public.broadcast_image_put($1) as h", [IMG]);
  check("immagine caricata con l'impronta sha256", put.rows?.[0]?.h === createHash("sha256").update(IMG, "utf8").digest("hex"), put.error ?? "");
  check("SVG rifiutato", /invalid_image/.test((await attempt("select public.broadcast_image_put('data:image/svg+xml;base64,PHN2Zz4=')")).error ?? ""));

  await as("anon");
  const read = await attempt("select * from public.broadcast_live_state($1)", [liveId]);
  check("l'overlay legge lo stato dall'id", !read.error && read.rows[0]?.state?.tournament?.name === "Prova a secco", read.error ?? "");
  check("l'overlay prende l'immagine", (await attempt("select public.broadcast_image_get($1, $2) as d", [liveId, put.rows?.[0]?.h])).rows?.[0]?.d === IMG);

  await as("authenticated", u1);
  const code = (await attempt("select public.broadcast_link_code() as c")).rows?.[0]?.c;
  check("codice per Twitch creato", /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code ?? ""));
  await as("anon");
  check("senza il segreto: forbidden", /forbidden/.test((await attempt("select public.broadcast_link_claim('sbagliato', $1, $2)", [code, CHANNEL])).error ?? ""));
  const claim = await attempt("select public.broadcast_link_claim($1, $2, $3, 'canaleprova') as u", [env.CRON_SECRET, code, CHANNEL]);
  check("canale collegato", !claim.error && typeof claim.rows[0]?.u === "string", claim.error ?? "");
  const ch = await attempt("select * from public.broadcast_channel_state($1)", [CHANNEL]);
  check("l'estensione legge lo stato del canale con l'id della diretta", !ch.error && ch.rows[0]?.id === liveId && ch.rows[0]?.state?.tournament?.phase === "Finale", ch.error ?? "");

  await as("authenticated", u2);
  check("un altro utente non scollega il canale", (await attempt("select public.broadcast_unlink($1) as ok", [CHANNEL])).rows?.[0]?.ok === false);
  await as("authenticated", u1);
  const clear = await attempt("select * from public.broadcast_live_clear()");
  check("diretta spenta: id, versione e canale da avvisare", !clear.error && clear.rows[0]?.id === liveId && JSON.stringify(clear.rows[0]?.channels) === JSON.stringify([CHANNEL]), clear.error ?? JSON.stringify(clear.rows));
  check("scollegamento", (await attempt("select public.broadcast_unlink($1) as ok", [CHANNEL])).rows?.[0]?.ok === true);

  await as("postgres");
  const privs = (await attempt(`select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon, has_function_privilege('authenticated', p.oid, 'execute') as auth
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'broadcast%' order by 1`)).rows ?? [];
  const who = Object.fromEntries(privs.map((p) => [p.proname, `${p.anon ? "A" : "-"}${p.auth ? "U" : "-"}`]));
  check(
    "privilegi delle funzioni",
    JSON.stringify(who) ===
      JSON.stringify({
        broadcast_channel_state: "AU",
        broadcast_image_get: "AU",
        broadcast_image_put: "-U",
        broadcast_link_claim: "AU",
        broadcast_link_code: "-U",
        broadcast_live_clear: "-U",
        broadcast_live_info: "-U",
        broadcast_live_save: "-U",
        broadcast_live_state: "AU",
        broadcast_new_id: "--",
        broadcast_unlink: "-U",
      }),
    JSON.stringify(who),
  );
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `CI SONO ${failures} CONTROLLI FALLITI (rollback: nulla è stato scritto).` : "TUTTO OK: nulla è stato scritto (rollback).");
process.exit(failures ? 1 : 0);
