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
// Dal 09/11/2026 anche svizzera e gironi (blocco SVIZZERA, GIRONI E SIDEBOARD), con la sideboard di 3 carte:
//      node scripts/demo-tournament.mjs --format swiss --organizer <utente> [--players a,b] [--stage start|rounds|top] [--apply]
//        → 30 iscritti, 5 turni svizzeri, Top 8 in pausa. start: turno 1 (i due giocatori veri si incontrano); rounds
//          (predefinito): turni 1–4 giocati, nel turno 5 resta la partita dei giocatori veri; top: svizzera finita e Top 8
//          creata, in pausa ("Avvia la Top 8" dalla gestione).
//      node scripts/demo-tournament.mjs --format groups … → 24 iscritti in 6 gironi da 4, passano 2 (i giocatori veri nel
//          girone A). start: turno 1 fra bot; rounds (predefinito): tutte le partite fra bot; top: gironi finiti e fase
//          finale creata, in pausa. Servono almeno 30 bot di seed-bots.mjs.
// Dal 10/11/2026 anche la doppia eliminazione di apix (blocco DOPPIA ELIMINAZIONE), un mazzo con sideboard di 3:
//      node scripts/demo-tournament.mjs --format double_elim --organizer <utente> [--players a,b] [--judges x,y] [--count 300]
//        [--stage start|qualifiers|ready] [--lang en] [--apply]
//        → 2 tabelloni, 32 + 32 qualificati per tabellone, Top 128 in pausa. Le fasi sono spiegate nel blocco del formato.
//      DEMO_ENV_FILE=<file> sceglie il file con le credenziali del database (di base .env.local).
import { existsSync, readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

const envFile = process.env.DEMO_ENV_FILE ? process.env.DEMO_ENV_FILE : existsSync(new URL("../.env.local", import.meta.url)) ? new URL("../.env.local", import.meta.url) : "C:/Users/User/Desktop/originsmeta/.env.local";
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
const FORMAT = opt("--format") ?? "brackets";
if (!["brackets", "swiss", "groups", "double_elim"].includes(FORMAT)) await fail("--format: brackets (predefinito), swiss, groups o double_elim");
const stage = FORMAT === "brackets" ? (opt("--stage") ?? "qualifiers") : "qualifiers";
if (!["start", "qualifiers", "top"].includes(stage)) await fail("--stage: start, qualifiers o top");
const sstage = FORMAT === "brackets" || FORMAT === "double_elim" ? null : (opt("--stage") ?? "rounds");
if (sstage !== null && !["start", "rounds", "top"].includes(sstage)) await fail("--stage con --format swiss o groups: start, rounds o top");
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

/* ---------- 10/11/2026: torneo di prova a doppia eliminazione (--format double_elim) ---------- */
// Il formato di apix per il 28–29/11: 2 tabelloni a doppia eliminazione, passano 32 dai vincenti + 32 dai perdenti di
// ognuno, poi la Top 128 sorteggiata, un mazzo con sideboard di 3, Bo3. Con --count iscritti (predefinito 300: tabelloni
// da 256, 3 turni dei vincenti e 4 dei perdenti). Tutte le partite fra bot si chiudono dentro il database in un colpo
// solo (pg_temp.demo_de_play), niente migliaia di richieste una per una come la notte dell'08/11.
//   --stage start       → primo turno pronto, niente giocato
//   --stage qualifiers  → (predefinito) giocate tutte le partite fra bot; restano aperte quelle dei giocatori veri e
//                          una partita dei perdenti contestata (da sistemare dalla coda dello staff)
//   --stage ready       → qualificazione finita (anche le partite dei giocatori veri, a caso): tocca allo staff
//                          "Chiudi la qualificazione e avvia la Top 128", poi "Avvia la Top 128"
if (FORMAT === "double_elim") {
  const deOk = await one("select to_regproc('public.tm_de_create') is not null as ok");
  if (!deOk.ok) await fail("Il database non ha il blocco 10/11/2026: DOPPIA ELIMINAZIONE: prima node scripts/db-migrate.mjs.");
  const dstage = opt("--stage") ?? "qualifiers";
  if (!["start", "qualifiers", "ready"].includes(dstage)) await fail("--stage con --format double_elim: start, qualifiers o ready");
  const N = Number(opt("--count") ?? 300);
  const POOLS = 2;
  const QUAL = 32;
  const SIDE = 3;
  if (!Number.isInteger(N) || N < 2 * (2 * QUAL + 1) || N > 1024) await fail(`--count: fra ${2 * (2 * QUAL + 1)} e 1024 (ogni tabellone deve avere più di ${2 * QUAL} iscritti)`);
  const title = (opt("--name") ?? "Test tournament · 2 × 512 double elimination").slice(0, 60);
  const desc = [
    `Test tournament for the 28–29 November event: ${N} fake players (bots), no prizes.`,
    "",
    "Two double-elimination brackets. From each bracket 32 players qualify from the winners side and 32 from the losers side: 128 in total.",
    "Then a single-elimination Top 128 with a random draw (no seeding). The Top 128 starts when the staff starts it.",
  ].join("\n");
  const rulesText = [
    "One deck with a 3-card sideboard. The sideboard can only contain cards that are not in the deck.",
    "Game 1 is played with the submitted deck; before games 2 and 3 you may swap sideboard cards in, one for one.",
    "All matches best of 3. Check-in is required; a player who does not open the match room within 15 minutes loses by no-show.",
    "Both players report the result in the match room, with screenshots.",
  ].join("\n");
  const dslug = `torneo-di-prova-${randomBytes(2).toString("hex")}`;
  await q(
    `insert into public.tournaments (slug, organizer, name, cover_url, description, rules, lang, starts_at, size, deck_mode, best_of, checkin, hidden_decklists,
       no_show_minutes, top_cut, top_cut_hold, deck_ban, visibility, listed, format, de_pools, de_qualify, sideboard)
     values ($1, $2, $3, '/media/keyart-red-wide.webp', $4, $5, $6, $7, 1024, 'free', 3, true, false, 15, null, true, false, 'private', false, 'double_elim', $8, $9, $10)`,
    [dslug, org.id, title, desc, rulesText, lang, startsAt.toISOString(), POOLS, QUAL, SIDE],
  );
  const dt = await one("select t.id, t.tag, s.invite_code from public.tournaments t left join public.tournament_secrets s on s.tournament_id = t.id where t.slug = $1", [dslug]);

  // bot mancanti creati con un insert solo (stesse email di seed-bots.mjs)
  const need = N - humans.length;
  const made = await one(
    `with want as (select i, 'bot' || i || '@${BOT_DOMAIN}' as email from generate_series(1, $1::int) i),
          ins as (
            insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
              created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
              email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
            select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', w.email, '', now(),
              '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('user_name', 'bot-' || w.i, 'full_name', 'Bot ' || w.i), now(), now(),
              '', '', '', '', '', '', '', '', false, false
              from want w where not exists (select 1 from auth.users u where u.email = w.email)
            returning 1)
     select count(*)::int as n from ins`,
    [need + 20],
  );
  const { rows: botRows } = await q(
    `select u.id, p.username from auth.users u join public.profiles p on p.id = u.id
      where u.email like $1 order by (substring(u.email from '^bot([0-9]+)@'))::int`,
    [`bot%@${BOT_DOMAIN}`],
  );
  const bots = botRows.filter((r) => BOTS.test(r.username ?? "")).slice(0, need).map((r) => r.id);
  if (bots.length < need) await fail(`Bot insufficienti: ${bots.length} su ${need}`);

  // iscrizioni e mazzi in blocco: un mazzo libero a testa (12 carte) e 3 carte di sideboard fuori dal mazzo
  const deckOf = (label) => {
    const pool = shuffle(bases);
    const leg = shuffle(legendaries)[0];
    return { code: omCode({ name: label, legendary: leg, cards: pool.slice(0, 12) }), side: pool.slice(12, 12 + SIDE) };
  };
  const everyone = [...humans.map((h) => ({ id: h.id, label: h.display_name || h.username })), ...bots.map((id, i) => ({ id, label: `Bot ${i + 1}` }))];
  const decks = everyone.map((p) => ({ ...p, ...deckOf(p.label) }));
  await q(
    `insert into public.tournament_players (tournament_id, user_id, status, decks_submitted, checked_in_at)
     select $1, x, 'registered', true, now() from unnest($2::uuid[]) x`,
    [dt.id, decks.map((d) => d.id)],
  );
  await q(
    `insert into public.tournament_decks (tournament_id, user_id, codes, sideboard)
     select $1, x.u, jsonb_build_array(x.c), x.s::jsonb from unnest($2::uuid[], $3::text[], $4::text[]) as x(u, c, s)`,
    [dt.id, decks.map((d) => d.id), decks.map((d) => d.code), decks.map((d) => JSON.stringify(d.side))],
  );
  for (const j of judges) await q("insert into public.tournament_judges (tournament_id, user_id, added_by) values ($1, $2, $3)", [dt.id, j.id, org.id]);
  for (const v of invited) await q("insert into public.tournament_invites (tournament_id, user_id, invited_by) values ($1, $2, $3) on conflict do nothing", [dt.id, v.id, org.id]);

  // avvio come start_tournament (i giocatori veri in testa: uno per tabellone, contro un bot al primo turno)
  const order = [...humans.map((h) => h.id), ...shuffle(bots)];
  await q("select public.tm_start($1, $2::uuid[])", [dt.id, order]);
  await q("select public.tm_after_start($1)", [dt.id]);

  // partite fra bot giocate dentro il database, ondata dopo ondata, finché ce ne sono
  await q(`create or replace function pg_temp.demo_de_play(tid uuid, keep uuid[], dispute boolean) returns int language plpgsql as $f$
    declare m record; n int; total int := 0; need int; aw boolean; lo int; disputed boolean := false;
    begin
      loop
        n := 0;
        for m in select * from public.tournament_matches
                  where tournament_id = tid and stage in ('upper', 'lower') and status = 'pending'
                    and player_a is not null and player_b is not null and ready_at is not null
                    and not (player_a = any(keep)) and not (player_b = any(keep))
                  order by round, position loop
          if dispute and not disputed and m.stage = 'lower' then
            update public.tournament_matches set status = 'disputed', score_a = 2, score_b = 1, reported_by = m.player_a, reported_at = now(),
              note = '2-1 vs 1-2', seen_a = now(), seen_b = now() where id = m.id;
            disputed := true;
            continue;
          end if;
          need := public.tm_need(tid, m.round);
          aw := random() < 0.5;
          lo := floor(random() * need)::int;
          update public.tournament_matches set winner = case when aw then m.player_a else m.player_b end, status = 'confirmed', reported_by = null,
            score_a = case when aw then need else lo end, score_b = case when aw then lo else need end,
            seen_a = coalesce(seen_a, now()), seen_b = coalesce(seen_b, now())
           where id = m.id;
          perform public.tm_propagate(m.id);
          n := n + 1;
        end loop;
        total := total + n;
        exit when n = 0;
      end loop;
      return total;
    end $f$`);
  let played = 0;
  if (dstage === "qualifiers") played = (await one("select pg_temp.demo_de_play($1, $2::uuid[], true) as n", [dt.id, humans.map((h) => h.id)])).n;
  if (dstage === "ready") played = (await one("select pg_temp.demo_de_play($1, '{}'::uuid[], false) as n", [dt.id])).n;

  const c = await one(
    `select count(*)::int as matches, count(*) filter (where status in ('confirmed', 'bye'))::int as done,
            count(*) filter (where status = 'disputed')::int as disputed,
            count(*) filter (where status = 'pending' and player_a is not null and player_b is not null and ready_at is not null)::int as ready,
            count(*) filter (where stage is null)::int as final
       from public.tournament_matches where tournament_id = $1`,
    [dt.id],
  );
  const hm = humans.length ? await one("select id from public.tournament_matches where tournament_id = $1 and status = 'pending' and (player_a = $2 or player_b = $2) order by round limit 1", [dt.id, humans[0].id]) : null;
  const dbase = `${SITE}/${lang}/tournaments/${dslug}`;
  console.log(`
${APPLY ? "Creato" : "PROVA A SECCO (rollback: nulla è stato scritto)"}: "${title}" · ${dt.tag} · privato · doppia eliminazione 2 tabelloni, 32 + 32 per tabellone, Top 128 in pausa · sideboard di ${SIDE}
  iscritti ${N} (${humans.length} veri${humans.length ? `: ${humans.map((h) => h.username).join(", ")}` : ""}, ${bots.length} bot, ${made.n} bot nuovi), check-in fatto per tutti
  partite ${c.matches}: ${c.done} chiuse (${played} da questo script), ${c.disputed} contestata, ${c.ready} pronte da giocare, ${c.final} della Top 128
  fase: ${dstage}${dstage === "ready" ? " (tocca allo staff: \"Chiudi la qualificazione e avvia la Top 128\")" : ""}
  organizzatore: ${org.username} · arbitri: ${judges.map((j) => j.username).join(", ") || "nessuno"} · invitati: ${invited.map((v) => v.username).join(", ") || "nessuno"}

  Scheda:      ${dbase}
  Gestione:    ${dbase}/manage
  Invito:      ${SITE}/t/${dt.tag}/${dt.invite_code}${hm ? `\n  Partita di un giocatore vero: ${dbase}/match/${hm.id}` : ""}
  Cancellare la prova:  node scripts/demo-tournament.mjs --remove ${dt.tag} --apply
`);
  if (APPLY) await q("commit");
  else await q("rollback");
  await db.end();
  process.exit(0);
}

/* ---------- 09/11/2026: torneo di prova svizzero o a gironi (--format swiss | groups) ---------- */
if (FORMAT !== "brackets") {
  const fmtOk = await one("select to_regproc('public.swiss_next_round') is not null as ok");
  if (!fmtOk.ok) await fail("Il database non ha il blocco 09/11/2026: SVIZZERA, GIRONI E SIDEBOARD: prima node scripts/swiss-dry-run.mjs, poi node scripts/db-migrate.mjs.");
  const swiss = FORMAT === "swiss";
  const N = swiss ? 30 : 24;
  const SLOTS = 32;
  const SIDE = 3;
  const title = (opt("--name") ?? (swiss ? "Torneo di prova · Svizzera + Top 8" : "Torneo di prova · Gironi + fase finale")).slice(0, 60);
  const desc = swiss
    ? "Torneo di prova del formato svizzero: 30 giocatori finti (bot), 5 turni svizzeri, poi la Top 8 dopo una pausa. Nessun premio."
    : "Torneo di prova della fase a gironi: 24 giocatori finti (bot) in 6 gironi da 4, passano i primi 2, poi la fase finale a eliminazione diretta dopo una pausa. Nessun premio.";
  const rulesText = [
    "Conquest con tre mazzi: Leggendarie diverse e almeno 8 carte uniche fra due mazzi; prima di ogni partita ognuno banna un mazzo dell'avversario. Al meglio delle 3.",
    swiss
      ? "Svizzera: 3 punti a vittoria, bye a chi ha meno punti (vale una vittoria), niente rivincite quando si può; spareggi OMW%, GW%, OGW% (almeno 33%). Poi la Top 8 seedata dalla classifica."
      : "Gironi da 4 all'italiana; passano i primi 2 di ogni girone, spareggi OMW%, GW%, OGW% (almeno 33%). Poi la fase finale a eliminazione diretta.",
    "Sideboard di 3 carte (opzione del torneo, non una regola del gioco): scambi uno per uno fra una partita e l'altra, dichiarati nella stanza partita.",
  ].join("\n");
  const sslug = `torneo-di-prova-${randomBytes(2).toString("hex")}`;
  await q(
    `insert into public.tournaments (slug, organizer, name, cover_url, description, rules, lang, starts_at, size, deck_mode, conquest_decks, conquest_min_different,
       best_of, checkin, hidden_decklists, no_show_minutes, top_cut, top_cut_hold, deck_ban, visibility, listed, format, swiss_rounds, group_size, group_advance, group_seeding, sideboard)
     values ($1, $2, $3, '/media/keyart-mulan.webp', $4, $5, $6, $7, $8, 'conquest', $9, 8, 3, true, true, 15, $10, true, true, 'private', false, $11, $12, $13, $14, $15, $16)`,
    [sslug, org.id, title, desc, rulesText, lang, startsAt.toISOString(), SLOTS, DECKS, swiss ? 8 : null, FORMAT, swiss ? 5 : null, swiss ? null : 4, swiss ? null : 2, swiss ? null : "snake", SIDE],
  );
  const st = await one("select t.id, t.tag, s.invite_code from public.tournaments t left join public.tournament_secrets s on s.tournament_id = t.id where t.slug = $1", [sslug]);
  const sideOf = new Map();
  const reg = async (uid, label) => {
    const d = trio(label);
    sideOf.set(uid, d.legs);
    const used = new Set(d.codes.flatMap((c) => JSON.parse(Buffer.from(c.slice(4), "base64url").toString("utf8")).c));
    const side = shuffle(bases.filter((b) => !used.has(b))).slice(0, SIDE);
    await q("insert into public.tournament_players (tournament_id, user_id, status, decks_submitted, checked_in_at) values ($1, $2, 'registered', true, now())", [st.id, uid]);
    await q("insert into public.tournament_decks (tournament_id, user_id, codes, sideboard) values ($1, $2, $3::jsonb, $4::jsonb)", [st.id, uid, JSON.stringify(d.codes), JSON.stringify(side)]);
  };
  for (const h of humans) await reg(h.id, h.display_name || h.username);
  const bots = [];
  for (let i = 1; bots.length < N - humans.length; i++) {
    const found = await one("select u.id, p.username from auth.users u left join public.profiles p on p.id = u.id where u.email = $1", [`bot${i}@${BOT_DOMAIN}`]);
    if (found?.username && BOTS.test(found.username)) bots.push(found.id);
    if (i > 2000) await fail("Bot insufficienti: prima node scripts/seed-bots.mjs <TAG> 30 (o --remove dopo).");
    if (!found && i > N + 50) await fail("Mancano i bot di seed-bots.mjs (bot<n>@bots.originsmeta.local): creane almeno 30 con node scripts/seed-bots.mjs.");
  }
  for (const [i, id] of bots.entries()) await reg(id, `Bot ${i + 1}`);
  for (const j of judges) await q("insert into public.tournament_judges (tournament_id, user_id, added_by) values ($1, $2, $3)", [st.id, j.id, org.id]);
  for (const v of invited) await q("insert into public.tournament_invites (tournament_id, user_id, invited_by) values ($1, $2, $3) on conflict do nothing", [st.id, v.id, org.id]);
  // avvio come start_tournament: nei gironi i due giocatori veri in testa all'ordine finiscono nei gironi A e B (serpentina),
  // quindi il secondo va spostato accanto al primo (posizione 11 = girone A anche lui, con 6 gironi)
  const order = shuffle(bots);
  if (humans[0]) order.unshift(humans[0].id);
  if (humans[1]) order.splice(swiss ? 1 : 11, 0, humans[1].id);
  await q("select public.tm_start($1, $2::uuid[])", [st.id, order]);
  await q("select public.tm_after_start($1)", [st.id]);
  const human = (u) => humans.some((h) => h.id === u);
  // svizzera: i due giocatori veri si incontrano al turno 1 (scambio diretto delle due partite)
  if (swiss && humans.length === 2) {
    const ms = (await q("select * from public.tournament_matches where tournament_id = $1 and round = 1 and status = 'pending'", [st.id])).rows;
    const a = ms.find((m) => m.player_a === humans[0].id || m.player_b === humans[0].id);
    const b = ms.find((m) => m.player_a === humans[1].id || m.player_b === humans[1].id);
    if (a && b && a.id !== b.id) {
      const oppA = a.player_a === humans[0].id ? "player_b" : "player_a";
      const hB = b.player_a === humans[1].id ? "player_a" : "player_b";
      await q(`update public.tournament_matches set ${hB} = $2 where id = $1`, [b.id, a[oppA]]);
      await q(`update public.tournament_matches set ${oppA} = $2 where id = $1`, [a.id, humans[1].id]);
    }
  }
  let closedN = 0;
  const playBots = async (withHumans = false) => {
    for (let pass = 0; pass < 20; pass++) {
      const { rows } = await q("select * from public.tournament_matches where tournament_id = $1 and status = 'pending' and player_a is not null and player_b is not null order by round, position", [st.id]);
      const todo = rows.filter((m) => withHumans || (!human(m.player_a) && !human(m.player_b)));
      if (!todo.length) return;
      for (const m of todo) {
        for (const [who, target] of [[m.player_a, m.player_b], [m.player_b, m.player_a]]) {
          const idx = Math.floor(Math.random() * DECKS);
          await q("insert into public.tournament_bans (match_id, user_id, target, deck, legendary) values ($1, $2, $3, $4, $5) on conflict (match_id, user_id) do nothing", [m.id, who, target, idx, sideOf.get(target)?.[idx] ?? null]);
        }
        const need = (await one("select public.tm_need($1, $2) as n", [st.id, m.round])).n;
        const aw = Math.random() < 0.5;
        const lo = Math.floor(Math.random() * need);
        await q("update public.tournament_matches set winner = $2, status = 'confirmed', reported_by = null, score_a = $3, score_b = $4, seen_a = coalesce(seen_a, now()), seen_b = coalesce(seen_b, now()) where id = $1", [m.id, aw ? m.player_a : m.player_b, aw ? need : lo, aw ? lo : need]);
        await q("select public.tm_propagate($1)", [m.id]);
        closedN++;
      }
    }
  };
  // le RPC dello staff con l'organizzatore come utente (dentro la transazione dello script)
  const asOrganizer = () => q("select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)", [JSON.stringify({ sub: org.id, role: "authenticated" }), org.id]);
  if (sstage === "start") await playBots(false);
  else {
    if (swiss) {
      // svizzera: i turni fra bot fino all'ultimo; la partita dei giocatori veri del turno 1 si chiude a caso, poi si gioca
      // l'ultimo turno con la loro partita aperta (stage "rounds"), oppure tutto e la Top 8 in pausa (stage "top")
      for (let r = 1; r <= 5; r++) {
        await playBots(r < 5 || sstage === "top");
        if (r < 5) {
          await asOrganizer();
          await q("select public.swiss_next_round($1)", [st.id]);
        }
      }
      if (sstage === "top") {
        await asOrganizer();
        await q("select public.start_final_stage($1)", [st.id]);
      }
    } else {
      // gironi: tutte le partite fra bot (stage "rounds"), poi anche quelle dei giocatori veri e la fase finale in pausa (stage "top")
      await playBots(sstage === "top");
      if (sstage === "top") {
        await asOrganizer();
        await q("select public.start_final_stage($1)", [st.id]);
      }
    }
  }
  const c = await one(
    `select count(*)::int as matches, count(*) filter (where status in ('confirmed', 'bye'))::int as done,
            count(*) filter (where status = 'pending' and player_a is not null and player_b is not null and ready_at is not null)::int as ready,
            count(*) filter (where stage is null)::int as bracket
       from public.tournament_matches where tournament_id = $1`,
    [st.id],
  );
  const hm = humans.length ? await one("select id from public.tournament_matches where tournament_id = $1 and status = 'pending' and (player_a = $2 or player_b = $2) order by round limit 1", [st.id, humans[0].id]) : null;
  const sbase = `${SITE}/${lang}/tournaments/${sslug}`;
  console.log(`
${APPLY ? "Creato" : "PROVA A SECCO (rollback: nulla è stato scritto)"}: "${title}" · ${st.tag} · privato · ${swiss ? "svizzera, 5 turni, Top 8 in pausa" : "6 gironi da 4, passano 2, fase finale in pausa"} · sideboard di ${SIDE}
  iscritti ${N} (${humans.length} veri${humans.length ? `: ${humans.map((h) => h.username).join(", ")}` : ""}, ${bots.length} bot), check-in fatto per tutti
  partite ${c.matches}: ${c.done} chiuse (${closedN} da questo script), ${c.ready} pronte da giocare, ${c.bracket} del tabellone finale
  arbitri: ${judges.map((j) => j.username).join(", ") || "nessuno"} · invitati: ${invited.map((v) => v.username).join(", ") || "nessuno"}

  Scheda:      ${sbase}
  Gestione:    ${sbase}/manage
  Invito:      ${SITE}/t/${st.tag}/${st.invite_code}${hm ? `\n  Partita dei giocatori veri: ${sbase}/match/${hm.id}` : ""}
  Altri turni fra bot:  node scripts/bot-play.mjs ${st.tag} --all   (in svizzera genera anche i turni dopo)
  Cancellare la prova:  node scripts/demo-tournament.mjs --remove ${st.tag} --apply
`);
  if (APPLY) await q("commit");
  else await q("rollback");
  await db.end();
  process.exit(0);
}

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
