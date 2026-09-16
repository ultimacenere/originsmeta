// Popola un torneo con giocatori "bot" per provare tabellone e gestione (solo per test dello staff).
// Crea utenti finti in auth.users (email bot<n>@bots.originsmeta.local, mai in grado di accedere), il trigger
// crea i profili (username bot-<n>); li iscrive al torneo con liste legali già consegnate (Conquest: Leggendarie
// diverse e mazzi con carte tutte diverse tra loro). La connessione diretta scavalca RLS e RPC: usare solo in test.
// Uso: node scripts/seed-bots.mjs <TAG> [numero=7]      → iscrive i bot al torneo (crea quelli mancanti)
//      node scripts/seed-bots.mjs --remove               → elimina tutti i bot (profili, iscrizioni, mazzi, inviti)
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();

const BOT_DOMAIN = "bots.originsmeta.local";
const [arg, countArg] = process.argv.slice(2);

if (arg === "--remove") {
  const r = await db.query("delete from auth.users where email like $1 returning email", [`%@${BOT_DOMAIN}`]);
  console.log(`Bot eliminati: ${r.rowCount}`);
  await db.end();
  process.exit(0);
}
if (!arg) {
  console.error("Uso: node scripts/seed-bots.mjs <TAG> [numero] | --remove");
  process.exit(1);
}

const tag = arg.toUpperCase().startsWith("OM-") ? arg.toUpperCase() : `OM-${arg.toUpperCase()}`;
const n = Math.max(1, Math.min(64, Number(countArg || 7)));
const { rows: trows } = await db.query("select id, name, size, deck_mode, conquest_decks, status from public.tournaments where tag = $1", [tag]);
if (!trows.length) {
  console.error(`Nessun torneo con tag ${tag}`);
  process.exit(2);
}
const t = trows[0];
if (t.status !== "open") {
  console.error(`Il torneo "${t.name}" non è aperto (stato ${t.status})`);
  process.exit(3);
}

/* carte dal database del sito */
const woo = JSON.parse(readFileSync(new URL("../src/lib/data/woo-cards.json", import.meta.url), "utf8"));
const legendaries = woo.cards.filter((c) => c.status === "active" && c.legendary && c.type !== "token").map((c) => c.slug);
const bases = woo.cards.filter((c) => c.status === "active" && !c.legendary && c.type !== "token" && !c.tokenOnly).map((c) => c.slug);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const omCode = (deck) => `OM1.${Buffer.from(JSON.stringify({ n: deck.name, l: deck.legendary, c: deck.cards, x: [] }), "utf8").toString("base64url")}`;
const decksFor = (botName) => {
  const count = t.deck_mode === "conquest" ? t.conquest_decks : 1;
  const legs = shuffle(legendaries).slice(0, count);
  const pool = shuffle(bases);
  return legs.map((l, i) => omCode({ name: `${botName} · ${String.fromCharCode(65 + i)}`, legendary: l, cards: pool.slice(i * 12, i * 12 + 12) }));
};

/* utenti bot: creati se mancano (il trigger handle_new_user crea il profilo) */
const botIds = [];
for (let i = 1; i <= n; i++) {
  const email = `bot${i}@${BOT_DOMAIN}`;
  const { rows } = await db.query("select id from auth.users where email = $1", [email]);
  if (rows.length) {
    botIds.push(rows[0].id);
    continue;
  }
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
    [id, email, JSON.stringify({ user_name: `bot-${i}`, full_name: `Bot ${i}` })],
  );
  botIds.push(id);
}

/* iscrizioni con mazzi consegnati (fino a riempire i posti) */
const { rows: existing } = await db.query("select user_id from public.tournament_players where tournament_id = $1", [t.id]);
const taken = new Set(existing.map((r) => r.user_id));
let added = 0;
for (let i = 0; i < botIds.length; i++) {
  if (taken.has(botIds[i])) continue;
  if (taken.size >= t.size) break;
  await db.query("insert into public.tournament_players (tournament_id, user_id, status, decks_submitted) values ($1, $2, 'registered', true)", [t.id, botIds[i]]);
  await db.query("insert into public.tournament_decks (tournament_id, user_id, codes) values ($1, $2, $3::jsonb) on conflict (tournament_id, user_id) do update set codes = excluded.codes", [t.id, botIds[i], JSON.stringify(decksFor(`Bot ${i + 1}`))]);
  taken.add(botIds[i]);
  added++;
}
console.log(`Torneo "${t.name}" (${tag}): bot aggiunti ${added}, iscritti totali ${taken.size}/${t.size}, formato ${t.deck_mode}${t.deck_mode === "conquest" ? ` × ${t.conquest_decks}` : ""}.`);
await db.end();
