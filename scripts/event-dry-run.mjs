// PROVA A SECCO del blocco "10/11/2026: EVENTI DELLA COMMUNITY" (10/11/2026, Attrix Showmatch del 16/11): applica SOLO quel
// blocco di supabase/schema.sql in una transazione, crea utenti finti (email @dryrun.originsmeta.invalid, solo dentro la
// transazione), prova evento, regia, codici, mod, riscatto e lettura pubblica con le regole del blocco e alla fine fa
// SEMPRE rollback: sul database non resta nulla.
// Dura pochi secondi. Il blocco crea tabelle con la chiave esterna verso public.profiles, quindi fino al rollback le
// SCRITTURE sui profili (iscrizioni nuove, modifiche del profilo) aspettano; le letture no. Niente tornei in corso mentre
// gira. Con il blocco già migrato non crea niente e prova le funzioni che ci sono.
// Uso, dalla radice del repo (checkout principale aggiornato o worktree): node scripts/event-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { schemaProblems } from "./schema-guard.mjs";

const MARKER = "-- ===== 10/11/2026: EVENTI DELLA COMMUNITY =====";
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
async function mkUser(email, meta) {
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
    [id, email, JSON.stringify(meta)],
  );
  return id;
}

const SLUG = "zzdry-rumble";
const past = new Date(Date.now() - 3600_000).toISOString();
const future = new Date(Date.now() + 86400_000).toISOString();
const CONFIG = {
  name: "Prova",
  keyword: "!codice",
  maxCodesPerUser: 1,
  talent: [
    { id: "visto", name: "Visto", role: "player", twitch: "zzdry_visto", revealAt: past },
    { id: "segreto", name: "Nome Segreto", role: "player", twitch: "zzdry_segreto", photo: "https://example.org/x.png", revealAt: future },
    { id: "senzadata", name: "Senza Data", role: "caster" },
  ],
  pairs: [["visto", "segreto"]],
  slots: [
    { channel: "zzdry_visto", packs: 2, minutes: 6 },
    { channel: "zzdry_segreto", packs: 1, minutes: 6 },
  ],
};
const STATE = { assignments: [{ deck: "d1", players: ["visto", "segreto"], at: past }], matches: [], giveaway: { anchor: null, anchorIndex: 0, paused: null } };
const hash = (login) => createHash("sha256").update(`${SLUG}:${login}`, "utf8").digest("hex");

await db.connect();
await db.query("begin");
const t0 = Date.now();
try {
  const before = await db.query(`select to_regclass('public.community_events') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella community_events c'è già (migrazione già fatta?): provo le funzioni che ci sono");
  const r = await attempt(block);
  check("il blocco EVENTI DELLA COMMUNITY si applica", !r.error, r.error ?? "");
  if (failures) throw new Error("blocco non applicato");
  check("lo slug di prova è libero", (await val(`select count(*)::int as v from public.community_events where slug = $1`, [SLUG])) === 0);

  await as("postgres");
  const STAFF = await mkUser("ev-staff@dryrun.originsmeta.invalid", { user_name: "zzdry-ev-staff" });
  const A = await mkUser("ev-a@dryrun.originsmeta.invalid", { user_name: "zzdry-ev-a" });
  const B = await mkUser("ev-b@dryrun.originsmeta.invalid", { user_name: "zzdry-ev-b" });
  await db.query(`update public.profiles set role = 'admin' where id = $1`, [STAFF]);
  check("utenti finti creati con il profilo", (await val(`select count(*)::int as v from public.profiles where id = any($1::uuid[])`, [[STAFF, A, B]])) === 3);

  // nessun client tocca le tabelle
  await as(null);
  for (const t of ["community_events", "community_event_mods", "community_event_codes", "community_event_redeem_fails"]) {
    check(`anon non legge ${t}`, /permission denied/.test(err(await attempt(`select * from public.${t}`))));
  }
  await as(A);
  check("un iscritto non legge community_event_codes", /permission denied/.test(err(await attempt(`select * from public.community_event_codes`))));
  check("un iscritto non crea un evento", /forbidden/.test(err(await attempt(`select public.community_event_create($1, '{}'::jsonb)`, [SLUG]))));
  check("un iscritto non chiama community_event_new_code", /permission denied/.test(err(await attempt(`select public.community_event_new_code()`))));

  // lo staff crea l'evento
  await as(STAFF);
  const tok = await val(`select public.community_event_create($1, $2::jsonb) as v`, [SLUG, JSON.stringify(CONFIG)]);
  check("lo staff crea l'evento e riceve il link della regia", typeof tok === "string" && tok.length === 64, String(tok));
  check("slug sbagliato: invalid_slug", /invalid_slug/.test(err(await attempt(`select public.community_event_create('A B', '{}'::jsonb)`))));
  check("stesso slug: exists", /exists/.test(err(await attempt(`select public.community_event_create($1, '{}'::jsonb)`, [SLUG]))));
  const ctrlStaff = await val(`select public.community_event_control($1, null) as v`, [SLUG]);
  check("lo staff entra nella regia senza link e vede il link", ctrlStaff?.controlToken === tok && ctrlStaff?.version === 0, JSON.stringify(ctrlStaff)?.slice(0, 120));

  // la regia con il link
  await as(null);
  check("anon senza link: forbidden", /forbidden/.test(err(await attempt(`select public.community_event_control($1, $2)`, [SLUG, "x".repeat(40)]))));
  const ctrl = await val(`select public.community_event_control($1, $2) as v`, [SLUG, tok]);
  check("anon con il link entra nella regia (senza vedere il link)", ctrl?.slug === SLUG && ctrl?.controlToken === null && ctrl?.config?.talent?.length === 3);
  const v1 = await val(`select public.community_event_save($1, $2, null, $3::jsonb, 0) as v`, [SLUG, tok, JSON.stringify(STATE)]);
  check("la regia salva lo stato sulla versione letta", v1 === 1, String(v1));
  check("versione vecchia: conflict", /conflict/.test(err(await attempt(`select public.community_event_save($1, $2, null, '{}'::jsonb, 0)`, [SLUG, tok]))));
  check("config non oggetto: invalid_config", /invalid_config/.test(err(await attempt(`select public.community_event_save($1, $2, '[]'::jsonb, null, 1)`, [SLUG, tok]))));
  check("senza link non si salva", /forbidden/.test(err(await attempt(`select public.community_event_save($1, $2, null, '{}'::jsonb, 1)`, [SLUG, "y".repeat(40)]))));

  // lettura pubblica: il talent da svelare non esce
  const pub = await val(`select public.community_event_public($1) as v`, [SLUG]);
  const txt = JSON.stringify(pub ?? {});
  check("la lettura pubblica risponde", pub?.slug === SLUG && pub?.version === 1);
  check("il nome da svelare non esce", !txt.includes("Nome Segreto") && !txt.includes("zzdry_segreto") && !txt.includes("example.org"), txt.slice(0, 200));
  check("l'id da svelare non esce nemmeno dallo stato", !txt.includes('"segreto"'));
  check("nello stato il giocatore da svelare diventa hidden-2", JSON.stringify(pub?.state?.assignments?.[0]?.players) === JSON.stringify(["visto", "hidden-2"]), JSON.stringify(pub?.state?.assignments));
  check("il talent da svelare esce come hidden", pub?.config?.talent?.[1]?.hidden === true && pub?.config?.talent?.[1]?.id === "hidden-2");
  check("il talent svelato e quello senza data escono interi", pub?.config?.talent?.[0]?.name === "Visto" && pub?.config?.talent?.[2]?.name === "Senza Data");
  check("lo slot del canale da svelare esce senza canale", pub?.config?.slots?.[1]?.channel === "" && pub?.config?.slots?.[0]?.channel === "zzdry_visto");
  check("niente coppie, codici né link nella lettura pubblica", !("pairs" in (pub?.config ?? {})) && !txt.includes(tok));
  check("slug che non c'è: null", (await val(`select public.community_event_public('zzdry-nessuno') as v`)) === null);

  // codici e link dei mod
  check("anon senza link non genera codici", /forbidden/.test(err(await attempt(`select public.community_event_codes_add($1, null, 5)`, [SLUG]))));
  const total = await val(`select public.community_event_codes_add($1, $2, 5) as v`, [SLUG, tok]);
  check("la regia genera 5 codici", total === 5, String(total));
  check("troppi codici in una volta: bad_count", /bad_count/.test(err(await attempt(`select public.community_event_codes_add($1, $2, 501)`, [SLUG, tok]))));
  await as("postgres");
  const shapes = await db.query(`select code from public.community_event_codes where slug = $1`, [SLUG]);
  check("i codici hanno la forma giusta", shapes.rows.every((x) => /^[A-HJKMNP-Z2-9]{10}$/.test(x.code)), shapes.rows.map((x) => x.code).join(" "));
  await as(null);
  const mods = await val(`select public.community_event_mods_sync($1, $2) as v`, [SLUG, tok]);
  check("i link dei mod per i due canali", Array.isArray(mods) && mods.length === 2 && mods.every((m) => m.token.length === 64), JSON.stringify(mods)?.slice(0, 160));
  const again = await val(`select public.community_event_mods_sync($1, $2) as v`, [SLUG, tok]);
  check("ricreare i link non li cambia", JSON.stringify(again) === JSON.stringify(mods));
  const modV = mods.find((m) => m.channel === "zzdry_visto").token;
  const modS = mods.find((m) => m.channel === "zzdry_segreto").token;

  const view = await val(`select public.community_event_mod_view($1, $2) as v`, [SLUG, modV]);
  check("il mod vede il suo canale e gli slot", view?.channel === "zzdry_visto" && view?.slots?.length === 2 && view?.keyword === "!codice");
  check("link del mod sbagliato: forbidden", /forbidden/.test(err(await attempt(`select public.community_event_mod_view($1, $2)`, [SLUG, "z".repeat(40)]))));

  // assegnazione
  const a1 = await val(`select public.community_event_assign($1, $2, 0, $3::text[]) as v`, [SLUG, modV, ["Mario_Rossi", "@x", "luigi"]]);
  check("due vincitori ricevono un codice, un nome sbagliato no", a1?.[0]?.status === "ok" && a1?.[1]?.status === "invalid" && a1?.[2]?.status === "ok", JSON.stringify(a1));
  const codeMario = a1?.[0]?.code;
  const again1 = await val(`select public.community_event_assign($1, $2, 0, $3::text[]) as v`, [SLUG, modV, ["mario_rossi"]]);
  check("lo stesso vincitore nello stesso slot riceve lo stesso codice", again1?.[0]?.status === "ok" && again1?.[0]?.code === codeMario);
  const full = await val(`select public.community_event_assign($1, $2, 0, $3::text[]) as v`, [SLUG, modV, ["terzo"]]);
  check("lo slot da 2 pacchetti è pieno", full?.[0]?.status === "full", JSON.stringify(full));
  check("un mod non dà codici nello slot di un altro canale", /not_your_slot/.test(err(await attempt(`select public.community_event_assign($1, $2, 1, $3::text[])`, [SLUG, modV, ["qualcuno"]]))));
  check("slot che non c'è: bad_slot", /bad_slot/.test(err(await attempt(`select public.community_event_assign($1, $2, 9, $3::text[])`, [SLUG, modV, ["qualcuno"]]))));
  const dup = await val(`select public.community_event_assign($1, $2, 1, $3::text[]) as v`, [SLUG, modS, ["mario_rossi"]]);
  check("chi ha già vinto non vince in un altro slot: dup", dup?.[0]?.status === "dup", JSON.stringify(dup));
  await as("postgres");
  const stored = await db.query(`select winner_hash, channel, slot from public.community_event_codes where code = $1`, [codeMario]);
  check("si salva l'impronta del nome, non il nome", stored.rows[0]?.winner_hash === hash("mario_rossi") && stored.rows[0]?.channel === "zzdry_visto" && stored.rows[0]?.slot === 0);
  await as(null);

  // scambio e rilascio
  const codeLuigi = a1?.[2]?.code;
  check("il codice passa a un altro vincitore", (await val(`select public.community_event_swap($1, $2, $3, 'anna') as v`, [SLUG, modV, codeLuigi])) === "ok");
  check("non a chi ha già vinto", (await val(`select public.community_event_swap($1, $2, $3, 'mario_rossi') as v`, [SLUG, modV, codeLuigi])) === "dup");
  check("un mod non tocca i codici di un altro canale", (await val(`select public.community_event_swap($1, $2, $3, 'bea') as v`, [SLUG, modS, codeLuigi])) === "not_found");
  check("il codice torna libero", (await val(`select public.community_event_release($1, $2, $3) as v`, [SLUG, modV, codeLuigi])) === "ok");
  const reassigned = await val(`select public.community_event_assign($1, $2, 0, $3::text[]) as v`, [SLUG, modV, ["anna"]]);
  check("dopo il rilascio lo slot ha di nuovo posto", reassigned?.[0]?.status === "ok", JSON.stringify(reassigned));
  const codeAnna = reassigned?.[0]?.code;

  // riscatto
  check("anon non riscatta", /permission denied/.test(err(await attempt(`select public.community_event_redeem($1, $2)`, [SLUG, codeMario]))));
  await as(A);
  const pretty = `${codeMario.slice(0, 5).toLowerCase()} - ${codeMario.slice(5)}`;
  check("A riscatta il codice scritto con spazi e minuscole", (await val(`select public.community_event_redeem($1, $2) as v`, [SLUG, pretty])) === "ok");
  check("A di nuovo: mine", (await val(`select public.community_event_redeem($1, $2) as v`, [SLUG, codeMario])) === "mine");
  check("A con un secondo codice: limit", (await val(`select public.community_event_redeem($1, $2) as v`, [SLUG, codeAnna])) === "limit");
  const mine = await attempt(`select code from public.community_event_my_codes($1)`, [SLUG]);
  check("A vede il suo codice", mine.rows?.length === 1 && mine.rows[0].code === codeMario, err(mine));
  await as(B);
  check("B con il codice di A: taken", (await val(`select public.community_event_redeem($1, $2) as v`, [SLUG, codeMario])) === "taken");
  await as("postgres");
  const free = await db.query(`select code from public.community_event_codes where slug = $1 and slot is null limit 1`, [SLUG]);
  await as(B);
  check("B con un codice mai dato: invalid", (await val(`select public.community_event_redeem($1, $2) as v`, [SLUG, free.rows[0].code])) === "invalid");
  for (let i = 0; i < 9; i++) await val(`select public.community_event_redeem($1, 'AAAAAAAAAA') as v`, [SLUG]);
  check("dopo 10 tentativi sbagliati: too_many", (await val(`select public.community_event_redeem($1, $2) as v`, [SLUG, codeAnna])) === "too_many");
  const mineB = await attempt(`select code from public.community_event_my_codes($1)`, [SLUG]);
  check("B non vede i codici di A", mineB.rows?.length === 0, err(mineB));

  // la regia vede i riscatti e i conteggi
  await as(null);
  const ctrl2 = await val(`select public.community_event_control($1, $2) as v`, [SLUG, tok]);
  check("la regia conta codici dati e riscattati", ctrl2?.codes?.total === 5 && ctrl2?.codes?.assigned === 2 && ctrl2?.codes?.redeemed === 1, JSON.stringify(ctrl2?.codes));
  check("la regia vede chi ha riscattato (nome utente)", ctrl2?.redeemers?.length === 1 && ctrl2.redeemers[0].username === "zzdry-ev-a", JSON.stringify(ctrl2?.redeemers));
  const pub2 = await val(`select public.community_event_public($1) as v`, [SLUG]);
  check("la lettura pubblica ha solo i conteggi", pub2?.stats?.redeemed === 1 && !JSON.stringify(pub2).includes(codeMario));

  // chiusura del riscatto
  await as(STAFF);
  const ver = (await val(`select public.community_event_control($1, null) as v`, [SLUG]))?.version;
  await val(`select public.community_event_save($1, null, $2::jsonb, null, $3) as v`, [SLUG, JSON.stringify({ ...CONFIG, redeemUntil: past }), ver]);
  await as(B);
  check("con redeemUntil passato: closed", (await val(`select public.community_event_redeem($1, $2) as v`, [SLUG, codeAnna])) === "closed");

  // link della regia cambiato e oblio
  await as(STAFF);
  const tok2 = await val(`select public.community_event_rotate($1) as v`, [SLUG]);
  await as(null);
  check("dopo il cambio il vecchio link non vale", /forbidden/.test(err(await attempt(`select public.community_event_control($1, $2)`, [SLUG, tok]))) && (await val(`select (public.community_event_control($1, $2))->>'slug' as v`, [SLUG, tok2])) === SLUG);
  await as(A);
  check("un iscritto non cancella i dati", /forbidden/.test(err(await attempt(`select public.community_event_forget($1)`, [SLUG]))));
  await as(STAFF);
  const forgot = await val(`select public.community_event_forget($1) as v`, [SLUG]);
  await as("postgres");
  const left = await db.query(`select count(*) filter (where winner_hash is not null or redeemed_by is not null)::int as n, count(*) filter (where redeemed_at is not null)::int as r from public.community_event_codes where slug = $1`, [SLUG]);
  check("lo staff toglie impronte e account, restano i conteggi", forgot === 2 && left.rows[0].n === 0 && left.rows[0].r === 1, `${forgot} ${JSON.stringify(left.rows[0])}`);
  await db.query(`delete from auth.users where id = $1`, [A]);
  check("cancellato un account, i suoi tentativi se ne vanno", (await val(`select count(*)::int as v from public.community_event_redeem_fails where user_id = $1`, [A])) === 0);
} catch (e) {
  check("prova completata", false, e.message);
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
console.log(`\n${passed} controlli passati, ${failures} non passati in ${((Date.now() - t0) / 1000).toFixed(1)} s (rollback fatto: il database non è cambiato).`);
console.log(failures ? "NON migrare finché non passano tutti." : "Si può migrare: node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
