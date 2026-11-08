// Torneo di prova del formato "16 bracket + Top 16" (08/11/2026; Pierluigi: gli organizzatori del torneo della
// community italiana del 28/11/2026 vogliono vedere "il funzionamento del tutto" con un torneo di prova "nascosto dal
// sito"). Crea un torneo PRIVATO (fuori da liste, calendario, sitemap e ricerca per tag; lo vedono organizzatore, admin,
// arbitri, iscritti e invitati) da 256 posti con le opzioni del blocco BRACKET E TOP CUT, lo riempie con i bot di
// seed-bots.mjs (stesse email, nomi bot-<n>), fa il check-in, lo avvia come start_tournament (tm_start + tm_after_start)
// e gioca la qualificazione con i bot come bot-play.mjs, ban compresi. Resta da mostrare dal vivo:
//   - la partita dei due giocatori veri (--players a,b: si incontrano al primo turno del bracket A): ban, chat, referto;
//   - una finale di bracket contestata (l'ultimo bracket), da sistemare dalla coda "Da sistemare" dello staff;
//   - la Top 16 in pausa, con il tasto "Avvia la Top 16" nella pagina di gestione.
// Poi: node scripts/bot-play.mjs <TAG> --all (--with-humans per chiudere anche le partite dei giocatori veri).
// Senza --apply fa tutto in una transazione e alla fine fa rollback (prova a secco: dice cosa farebbe); con --apply scrive.
// La connessione diretta scavalca RLS e RPC: solo per tornei di prova dello staff, mai su un torneo vero.
// Uso: node scripts/demo-tournament.mjs --organizer <nome utente> [--players a,b] [--judges x,y] [--invite u,v]
//        [--name "…"] [--lang it] [--starts 2026-11-28T09:30:00Z] [--stage start|qualifiers|top] [--apply]
//      node scripts/demo-tournament.mjs --remove <TAG> [--apply]   → cancella un torneo di prova (non i bot)
// A prove finite i bot si tolgono con node scripts/seed-bots.mjs --remove.
import { existsSync, readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

const envFile = existsSync(new URL("../.env.local", import.meta.url)) ? new URL("../.env.local", import.meta.url) : "C:/Users/User/Desktop/originsmeta/.env.local";
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const SITE = env.DEMO_SITE_URL || "https://originsmeta.com";
const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : undefined;
};
const list = (name) => (opt(name) ?? "").split(",").map((s) => s.trim().replace(/^@/, "")).filter(Boolean);
const APPLY = argv.includes("--apply");
const SIZE = 256;
const TOP_CUT = 16;
const DECKS = 3;
const BOT_DOMAIN = "bots.originsmeta.local";
const BOTS = /^bot-[0-9]+(-[0-9]+)?$/;

const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: env.SUPABASE_DB_SSL === "off" ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
await db.connect();
const q = (text, params = []) => db.query(text, params);
const one = async (text, params) => (await q(text, params)).rows[0];
const fail = async (msg) => {
  console.error(msg);
  await q("rollback").catch(() => {});
  await db.end();
  process.exit(1);
};

/* ---------- cancellazione di un torneo di prova ---------- */
const removeTag = opt("--remove");
if (removeTag) {
  const tag = removeTag.toUpperCase().startsWith("OM-") ? removeTag.toUpperCase() : `OM-${removeTag.toUpperCase()}`;
  const t = await one("select id, name, slug from public.tournaments where tag = $1", [tag]);
  if (!t) await fail(`Nessun torneo con tag ${tag}`);
  if (!t.slug.startsWith("torneo-di-prova-")) await fail(`"${t.name}" non è un torneo di prova di questo script (slug ${t.slug}): non lo cancello.`);
  if (APPLY) {
    await q("delete from public.tournaments where id = $1", [t.id]);
    console.log(`Cancellato "${t.name}" (${tag}) con iscrizioni, mazzi, partite, ban e chat. I bot restano: node scripts/seed-bots.mjs --remove`);
  } else console.log(`Prova a secco: cancellerei "${t.name}" (${tag}). Con --apply lo cancello.`);
  await db.end();
  process.exit(0);
}

const orgName = opt("--organizer");
if (!orgName) await fail("Uso: node scripts/demo-tournament.mjs --organizer <nome utente> [--players a,b] [--judges x,y] [--invite u,v] [--stage start|qualifiers|top] [--apply]");
const stage = opt("--stage") ?? "qualifiers";
if (!["start", "qualifiers", "top"].includes(stage)) await fail("--stage: start, qualifiers o top");
const lang = opt("--lang") ?? "it";
const name = (opt("--name") ?? "Torneo di prova · 16 bracket + Top 16").slice(0, 60);
const startsAt = opt("--starts") ? new Date(opt("--starts")) : new Date();
if (Number.isNaN(startsAt.getTime())) await fail("--starts: data non valida");

await q("begin");

/* ---------- controlli ---------- */
const schemaOk = await one("select to_regproc('public.release_top_cut') is not null and to_regclass('public.tournament_bans') is not null as ok");
if (!schemaOk.ok) await fail("Il database non ha il blocco 08/11/2026: BRACKET E TOP CUT: prima node scripts/tournament-dry-run.mjs, poi node scripts/db-migrate.mjs.");
const byName = async (u) => one("select id, username, display_name, role, badge from public.profiles where lower(username) = lower($1)", [u]);
const org = await byName(orgName);
if (!org) await fail(`Nessun profilo con nome utente "${orgName}"`);
const humans = [];
for (const u of list("--players").slice(0, 2)) {
  const p = await byName(u);
  if (!p) await fail(`Nessun profilo con nome utente "${u}" (--players)`);
  humans.push(p);
}
const judges = [];
for (const u of list("--judges")) {
  const p = await byName(u);
  if (!p) await fail(`Nessun profilo con nome utente "${u}" (--judges)`);
  if (p.id === org.id || humans.some((h) => h.id === p.id)) await fail(`${u}: un arbitro non può essere l'organizzatore né giocare`);
  judges.push(p);
}
const invited = [];
for (const u of list("--invite")) {
  const p = await byName(u);
  if (!p) await fail(`Nessun profilo con nome utente "${u}" (--invite)`);
  invited.push(p);
}

/* ---------- mazzi legali dal database delle carte del sito (come seed-bots.mjs) ---------- */
const woo = JSON.parse(readFileSync(new URL("../src/lib/data/woo-cards.json", import.meta.url), "utf8"));
const legendaries = woo.cards.filter((c) => c.status === "active" && c.legendary && c.type !== "token").map((c) => c.slug);
const bases = woo.cards.filter((c) => c.status === "active" && !c.legendary && c.type !== "token" && !c.tokenOnly).map((c) => c.slug);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const omCode = (deck) => `OM1.${Buffer.from(JSON.stringify({ n: deck.name, l: deck.legendary, c: deck.cards, x: [] }), "utf8").toString("base64url")}`;
/** tre mazzi Conquest: Leggendarie diverse, carte base tutte diverse fra i mazzi (12 a mazzo) */
const trio = (label) => {
  const legs = shuffle(legendaries).slice(0, DECKS);
  const pool = shuffle(bases);
  return { legs, codes: legs.map((l, i) => omCode({ name: `${label} · ${String.fromCharCode(65 + i)}`, legendary: l, cards: pool.slice(i * 12, i * 12 + 12) })) };
};

/* ---------- il torneo ---------- */
const description = [
  "Torneo di prova per vedere come funziona il torneo del 28 novembre: 256 posti, giocatori finti (bot), nessun premio.",
  "",
  "Programma della giornata (ora italiana):",
  "10:00 Apertura della diretta e Learn to Play",
  "10:30 Qualificazioni, turno 1",
  "11:30 Qualificazioni, turno 2",
  "12:30 Qualificazioni, turno 3",
  "13:30 Qualificazioni, turno 4: i vincitori dei 16 bracket vanno nella Top 16",
  "14:30 Talk e intervista speciale",
  "15:00 Top 16, turno 1",
  "16:00 Top 16, turno 2",
  "17:00 Top 16, turno 3",
  "18:00 Finale e proclamazione del vincitore",
].join("\n");
const rules = [
  "Conquest con tre mazzi: Leggendarie diverse e almeno 8 carte uniche fra due mazzi qualsiasi; le liste restano segrete (l'avversario vede le Leggendarie).",
  "Prima di ogni partita ognuno banna un mazzo dell'avversario: si gioca al meglio delle 3 e bisogna vincere una partita con ciascuno dei due mazzi rimasti.",
  "Qualificazioni in 16 bracket da 16 a eliminazione diretta, poi la Top 16 a eliminazione diretta: la Top 16 parte quando la avvia lo staff.",
  "Check-in obbligatorio (apre 2 ore prima, chiude 5 minuti prima). Chi non apre la stanza della partita entro 15 minuti perde a tavolino.",
  "Il risultato lo refertano tutti e due i giocatori nella stanza della partita, con gli screenshot.",
].join("\n");
const slug = `torneo-di-prova-${randomBytes(2).toString("hex")}`;
await q(
  `insert into public.tournaments (slug, organizer, name, cover_url, description, rules, lang, starts_at, size, deck_mode, conquest_decks, conquest_min_different,
     best_of, final_best_of, checkin, hidden_decklists, no_show_minutes, top_cut, top_cut_hold, deck_ban, visibility, listed)
   values ($1, $2, $3, '/media/keyart-red-wide.webp', $4, $5, $6, $7, $8, 'conquest', $9, 8, 3, null, true, true, 15, $10, true, true, 'private', false)`,
  [slug, org.id, name, description, rules, lang, startsAt.toISOString(), SIZE, DECKS, TOP_CUT],
);
const t = await one("select t.id, t.tag, s.invite_code from public.tournaments t left join public.tournament_secrets s on s.tournament_id = t.id where t.slug = $1", [slug]);

/* ---------- iscritti: i giocatori veri, poi i bot fino a 256 ---------- */
const decksOf = new Map();
const register = async (uid, label) => {
  const d = trio(label);
  decksOf.set(uid, d.legs);
  await q("insert into public.tournament_players (tournament_id, user_id, status, decks_submitted, checked_in_at) values ($1, $2, 'registered', true, now())", [t.id, uid]);
  await q("insert into public.tournament_decks (tournament_id, user_id, codes) values ($1, $2, $3::jsonb)", [t.id, uid, JSON.stringify(d.codes)]);
};
for (const h of humans) await register(h.id, h.display_name || h.username);
const botIds = [];
let created = 0;
for (let i = 1; botIds.length < SIZE - humans.length; i++) {
  const email = `bot${i}@${BOT_DOMAIN}`;
  const found = await one("select u.id, p.username from auth.users u left join public.profiles p on p.id = u.id where u.email = $1", [email]);
  if (found) {
    if (found.username && BOTS.test(found.username)) botIds.push(found.id);
    continue;
  }
  const id = randomUUID();
  await q(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
    [id, email, JSON.stringify({ user_name: `bot-${i}`, full_name: `Bot ${i}` })],
  );
  created++;
  botIds.push(id);
}
for (const [i, id] of botIds.entries()) await register(id, `Bot ${i + 1}`);
for (const j of judges) await q("insert into public.tournament_judges (tournament_id, user_id, added_by) values ($1, $2, $3)", [t.id, j.id, org.id]);
for (const v of invited) await q("insert into public.tournament_invites (tournament_id, user_id, invited_by) values ($1, $2, $3) on conflict do nothing", [t.id, v.id, org.id]);

/* ---------- avvio: come start_tournament (ordine casuale; i due giocatori veri si incontrano al primo turno del bracket A) ---------- */
// con l'ordine standard il seed 1 e il seed 256 stanno nella partita 0 del primo turno
const seeded = shuffle(botIds);
if (humans[0]) seeded.unshift(humans[0].id);
if (humans[1]) seeded.push(humans[1].id);
await q("select public.tm_start($1, $2::uuid[])", [t.id, seeded]);
await q("select public.tm_after_start($1)", [t.id]);
const isHuman = (uid) => humans.some((h) => h.id === uid);

/* ---------- partite fra bot (ban a caso, vincitore a caso), come bot-play.mjs ---------- */
const podRounds = Math.log2(SIZE / TOP_CUT);
const lastPod = TOP_CUT - 1;
let closed = 0;
let disputed = null;
const ban = async (m) => {
  for (const [who, target] of [[m.player_a, m.player_b], [m.player_b, m.player_a]]) {
    const idx = Math.floor(Math.random() * DECKS);
    await q("insert into public.tournament_bans (match_id, user_id, target, deck, legendary) values ($1, $2, $3, $4, $5) on conflict (match_id, user_id) do nothing", [m.id, who, target, idx, decksOf.get(target)?.[idx] ?? null]);
  }
};
const playUpTo = async (maxRound, opts = {}) => {
  for (let pass = 0; pass < 20; pass++) {
    const { rows } = await q(
      `select id, round, position, player_a, player_b from public.tournament_matches
        where tournament_id = $1 and status = 'pending' and player_a is not null and player_b is not null and ready_at is not null and round <= $2
        order by round, position`,
      [t.id, maxRound],
    );
    const todo = rows.filter((m) => !isHuman(m.player_a) && !isHuman(m.player_b) && !(opts.skip && opts.skip(m)));
    if (!todo.length) return;
    for (const m of todo) {
      await ban(m);
      // la finale dell'ultimo bracket resta contestata: la sistema lo staff dalla coda
      if (opts.dispute && m.round === podRounds && m.position === lastPod && !disputed) {
        await q(`update public.tournament_matches set status = 'disputed', score_a = 2, score_b = 1, reported_by = player_a, reported_at = now(), note = '2-1 vs 1-2', seen_a = now(), seen_b = now() where id = $1`, [m.id]);
        disputed = m.id;
        continue;
      }
      const need = (await one("select public.tm_need($1, $2) as n", [t.id, m.round])).n;
      const aWins = Math.random() < 0.5;
      const loser = Math.floor(Math.random() * need);
      await q(
        `update public.tournament_matches set winner = $2, status = 'confirmed', reported_by = null, score_a = $3, score_b = $4, seen_a = coalesce(seen_a, now()), seen_b = coalesce(seen_b, now()) where id = $1`,
        [m.id, aWins ? m.player_a : m.player_b, aWins ? need : loser, aWins ? loser : need],
      );
      await q("select public.tm_propagate($1)", [m.id]);
      closed++;
    }
  }
};
if (stage !== "start") await playUpTo(podRounds, { dispute: true });
if (stage === "top") {
  // avvio della fase finale come release_top_cut, poi un turno della Top fra bot
  await q("update public.tournaments set top_cut_released_at = now() where id = $1", [t.id]);
  const top = (await one("select public.tm_top_round($1) as r", [t.id])).r;
  const { rows: rel } = await q(
    `update public.tournament_matches set ready_at = now(), seen_a = null, seen_b = null
      where tournament_id = $1 and round >= $2 and status = 'pending' and player_a is not null and player_b is not null and ready_at is null returning id`,
    [t.id, top],
  );
  for (const r of rel) await q("select public.tm_notify_ready($1)", [r.id]);
  await playUpTo(top);
}

/* ---------- resoconto ---------- */
const counts = await one(
  `select count(*)::int as matches,
          count(*) filter (where status = 'confirmed')::int as confirmed,
          count(*) filter (where status = 'disputed')::int as disputed,
          count(*) filter (where status = 'pending' and player_a is not null and player_b is not null and ready_at is not null)::int as ready,
          count(*) filter (where status = 'pending' and player_a is not null and player_b is not null and ready_at is null)::int as held
     from public.tournament_matches where tournament_id = $1`,
  [t.id],
);
const bansN = (await one("select count(*)::int as n from public.tournament_bans b join public.tournament_matches m on m.id = b.match_id where m.tournament_id = $1", [t.id])).n;
const podsDone = (await one("select count(*)::int as n from public.tournament_matches where tournament_id = $1 and round = $2 and status = 'confirmed'", [t.id, podRounds])).n;
const humanMatch = humans.length ? await one("select id from public.tournament_matches where tournament_id = $1 and round = 1 and (player_a = $2 or player_b = $2)", [t.id, humans[0].id]) : null;
const base = `${SITE}/${lang}/tournaments/${slug}`;
console.log(`
${APPLY ? "Creato" : "PROVA A SECCO (rollback: nulla è stato scritto)"}: "${name}" · ${t.tag} · privato · organizzatore ${org.username}
  iscritti ${SIZE} (${humans.length} veri${humans.length ? `: ${humans.map((h) => h.username).join(", ")}` : ""}, ${botIds.length} bot, ${created} bot nuovi), check-in fatto per tutti
  partite ${counts.matches}: ${counts.confirmed} chiuse da questo script (${closed}), ${counts.disputed} contestata, ${counts.ready} da giocare, ${counts.held} della Top 16 in pausa · ban ${bansN}
  bracket finiti ${podsDone} su ${TOP_CUT}${humans.length ? " (il bracket A aspetta la partita dei giocatori veri)" : ""}${disputed ? ", l'ultimo ha la finale contestata" : ""}
  arbitri: ${judges.map((j) => j.username).join(", ") || "nessuno"} · invitati: ${invited.map((v) => v.username).join(", ") || "nessuno"}

  Scheda:      ${base}
  Gestione:    ${base}/manage
  Invito:      ${SITE}/t/${t.tag}/${t.invite_code}${humanMatch ? `\n  Partita dei giocatori veri: ${base}/match/${humanMatch.id}` : ""}
  Altri turni fra bot:  node scripts/bot-play.mjs ${t.tag} --all   (con --with-humans anche le partite dei giocatori veri)
  Cancellare la prova:  node scripts/demo-tournament.mjs --remove ${t.tag} --apply
`);
if (APPLY) await q("commit");
else await q("rollback");
await db.end();
