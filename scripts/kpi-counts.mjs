// Conteggi della community in sola lettura (iscritti, mazzi, tornei, draft, voti, tier list, segui, messaggi…).
// Uso: node scripts/kpi-counts.mjs   (dal checkout con .env.local: SUPABASE_PROJECT_REF e SUPABASE_DB_PASSWORD, come db-migrate)
//
// Stampa, per ogni misura, il totale, gli ultimi 7 giorni e oggi (giorno di Roma). Non scrive nulla: la sessione è
// aperta con default_transaction_read_only. Ogni misura è una query a sé: se una tabella o una colonna non c'è ancora
// (migrazione non lanciata), la riga dice l'errore e le altre vengono stampate lo stesso.
import { readFileSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const ref = env.SUPABASE_PROJECT_REF;
const pwd = env.SUPABASE_DB_PASSWORD;
if (!ref || !pwd) throw new Error("SUPABASE_PROJECT_REF / SUPABASE_DB_PASSWORD mancanti in .env.local");

const candidates = [];
if (env.SUPABASE_DB_HOST) {
  candidates.push({ name: "host da .env.local", host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER || `postgres.${ref}` });
}
candidates.push({ name: "diretta", host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" });
for (const r of ["eu-west-1", "eu-central-1", "eu-west-2", "eu-north-1", "eu-west-3"]) {
  for (const p of ["aws-0", "aws-1"]) {
    for (const [label, port] of [["session", 5432], ["transaction", 6543]]) {
      candidates.push({ name: `pooler ${p}-${r} (${label})`, host: `${p}-${r}.pooler.supabase.com`, port, user: `postgres.${ref}` });
    }
  }
}

let client = null;
for (const c of candidates) {
  const attempt = new pg.Client({ host: c.host, port: c.port, user: c.user, password: pwd, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  try {
    await attempt.connect();
    await attempt.query("set default_transaction_read_only = on");
    await attempt.query("set statement_timeout = '30s'");
    client = attempt;
    console.log(`Collegato via ${c.name}\n`);
    break;
  } catch (e) {
    console.log(`${c.name}: ${e.message}`);
    try {
      await attempt.end();
    } catch {}
  }
}
if (!client) process.exit(1);

// Confini del giorno di Roma, calcolati dal database (così valgono anche da un PC con un altro fuso).
const { rows: [b] } = await client.query(
  `select (date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome') as today,
          (date_trunc('day', now() at time zone 'Europe/Rome') at time zone 'Europe/Rome') - interval '7 days' as week,
          to_char(now() at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI') as now_rome`,
);
console.log(`Ora di Roma: ${b.now_rome}. Colonne: totale · ultimi 7 giorni (dal ${new Date(b.week).toLocaleDateString("it-IT")}) · oggi\n`);

/** Una misura con tre finestre: `sql` conta le righe di `from` filtrate su `col` (timestamp). */
async function windows(label, from, col = "created_at", extra = "") {
  const where = extra ? `where ${extra}` : "";
  const and = extra ? `and ${extra}` : "";
  try {
    const { rows: [r] } = await client.query(
      `select (select count(*) from ${from} ${where}) as total,
              (select count(*) from ${from} where ${col} >= $1 ${and}) as week,
              (select count(*) from ${from} where ${col} >= $2 ${and}) as today`,
      [b.week, b.today],
    );
    console.log(`${label.padEnd(46)} ${String(r.total).padStart(6)} ${String(r.week).padStart(8)} ${String(r.today).padStart(6)}`);
  } catch (e) {
    console.log(`${label.padEnd(46)} — (${e.message.split("\n")[0]})`);
  }
}

/** Una riga libera: la query deve restituire una sola riga, stampata colonna per colonna. */
async function line(label, sql, params = []) {
  try {
    const { rows: [r] } = await client.query(sql, params);
    const txt = Object.entries(r ?? {}).map(([k, v]) => `${k}=${v ?? "—"}`).join("  ");
    console.log(`${label.padEnd(46)} ${txt}`);
  } catch (e) {
    console.log(`${label.padEnd(46)} — (${e.message.split("\n")[0]})`);
  }
}

/** Un raggruppamento: stampa "valore: conteggio" su una riga. */
async function groups(label, sql) {
  try {
    const { rows } = await client.query(sql);
    console.log(`${label.padEnd(46)} ${rows.map((r) => `${r.k ?? "—"}: ${r.n}`).join("  ") || "nessuna riga"}`);
  } catch (e) {
    console.log(`${label.padEnd(46)} — (${e.message.split("\n")[0]})`);
  }
}

console.log(`${"".padEnd(46)} ${"totale".padStart(6)} ${"7 giorni".padStart(8)} ${"oggi".padStart(6)}`);
console.log("— Account —");
await windows("Account creati", "auth.users");
await windows("  di cui con almeno un accesso", "auth.users", "created_at", "last_sign_in_at is not null");
await windows("Accessi (ultimo accesso nella finestra)", "auth.users", "last_sign_in_at");
await line("Tornati in un giorno diverso dall'iscrizione", `select count(*) as n from auth.users where last_sign_in_at is not null and (created_at at time zone 'Europe/Rome')::date <> (last_sign_in_at at time zone 'Europe/Rome')::date`);
await groups("Provider dell'accesso", `select coalesce(raw_app_meta_data->>'provider', '—') as k, count(*) as n from auth.users group by 1 order by 2 desc`);
await groups("Ruoli dei profili", `select badge as k, count(*) as n from public.profiles group by 1 order by 2 desc`);
await groups("Account creati per giorno (ultimi 10)", `select to_char(created_at at time zone 'Europe/Rome', 'DD/MM') as k, count(*) as n from auth.users where created_at >= now() - interval '10 days' group by 1 order by min(created_at)`);

console.log("\n— Mazzi singoli —");
await windows("Mazzi pubblicati (status published)", "public.community_decks", "created_at", "status = 'published'");
await windows("Mazzi privati (status draft)", "public.community_decks", "created_at", "status = 'draft'");
await windows("Mazzi nascosti (status hidden)", "public.community_decks", "created_at", "status = 'hidden'");
await windows("Mazzi creati in tutto", "public.community_decks");
await line("Autori distinti dei pubblicati", `select count(distinct owner) as n from public.community_decks where status = 'published'`);
await line("Versioni nuove dei mazzi (aggiornamenti)", `select count(*) as n, count(distinct deck_id) as mazzi from public.community_deck_versions`);
await groups("Leggendarie dei pubblicati (prime 6)", `select coalesce(legendary, '—') as k, count(*) as n from public.community_decks where status = 'published' group by 1 order by 2 desc limit 6`);
await windows("Voti ai mazzi (1–5 stelle)", "public.deck_votes");
await line("  votanti distinti e media", `select count(distinct user_id) as votanti, round(avg(stars)::numeric, 2) as media from public.deck_votes`);
await windows("Mazzi salvati (preferiti)", "public.deck_favorites");
await line("Statistiche dei mazzi, ultimi 7 giorni", `select coalesce(sum(views), 0) as visite, coalesce(sum(code_copies), 0) as copie_codice, coalesce(sum(link_clicks), 0) as clic_link, coalesce(sum(video_plays), 0) as video from public.deck_stats_daily where day >= ($1 at time zone 'Europe/Rome')::date`, [b.week]);
await line("Statistiche dei mazzi, oggi", `select coalesce(sum(views), 0) as visite, coalesce(sum(code_copies), 0) as copie_codice from public.deck_stats_daily where day = ($1 at time zone 'Europe/Rome')::date`, [b.today]);

console.log("\n— Mazzi torneo (trii Conquest) —");
await windows("Mazzi torneo pubblicati", "public.community_deck_sets", "created_at", "status = 'published'");
await windows("Voti ai mazzi torneo", "public.deck_set_votes");

console.log("\n— Tornei —");
await windows("Tornei creati", "public.tournaments");
await groups("  per stato", `select status as k, count(*) as n from public.tournaments group by 1 order by 2 desc`);
await groups("  per visibilità", `select visibility as k, count(*) as n from public.tournaments group by 1 order by 2 desc`);
await line("  in calendario (listed)", `select count(*) as n from public.tournaments where listed`);
await windows("Iscrizioni ai tornei", "public.tournament_players");
await line("  giocatori distinti", `select count(distinct user_id) as n from public.tournament_players`);
await windows("Mazzi consegnati per i tornei", "public.tournament_decks");

console.log("\n— Draft contro un amico (le stanze online; il draft contro il Cervello non tocca il database) —");
await windows("Stanze create", "public.draft_rooms");
await groups("  per stato", `select status as k, count(*) as n from public.draft_rooms group by 1 order by 2 desc`);
await groups("  per formato", `select format as k, count(*) as n from public.draft_rooms group by 1 order by 2 desc`);
await line("  persone distinte (creatori + ospiti)", `select count(distinct u) as n from (select creator as u from public.draft_rooms union select joiner from public.draft_rooms where joiner is not null) s`);

console.log("\n— Voti alle carte e tier list —");
await windows("Voti alle carte (1–10)", "public.card_votes");
await line("  votanti, carte votate e media", `select count(distinct user_id) as votanti, count(distinct card) as carte, round(avg(score)::numeric, 2) as media from public.card_votes`);
await windows("Tier list salvate", "public.tier_lists");
await groups("  per tipo", `select kind as k, count(*) as n from public.tier_lists group by 1 order by 1`);
await line("  persone distinte", `select count(distinct owner) as n from public.tier_lists`);

console.log("\n— Profili, segui, messaggi, contenuti —");
await windows("Segui", "public.follows");
await line("  profili seguiti distinti", `select count(distinct followed) as n from public.follows`);
await windows("Conversazioni utente ↔ staff", "public.conversations");
await groups("  per origine", `select origin as k, count(*) as n from public.conversations group by 1 order by 2 desc`);
await windows("Messaggi", "public.messages");
await windows("Guide della community (tutte)", "public.community_guides");
await groups("  per stato", `select status as k, count(*) as n from public.community_guides group by 1 order by 2 desc`);
await windows("Fumetti (tutti)", "public.community_comics");
await groups("  per stato", `select status as k, count(*) as n from public.community_comics group by 1 order by 2 desc`);
await line("Profili con bio / canali / foto caricata", `select count(*) filter (where coalesce(bio, '') <> '') as bio, count(*) filter (where jsonb_array_length(coalesce(links, '[]'::jsonb)) > 0) as canali, count(*) filter (where avatar_url like '%profile-media%') as foto from public.profiles`);
await windows("Interesse per OriginsMeta Analytics", "public.analytics_interest");
await windows("Partite registrate dall'app Analytics", "public.tracked_matches");
await line("  dispositivi collegati", `select count(*) as n from public.tracker_devices`);

await client.end();
