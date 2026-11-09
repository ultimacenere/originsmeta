// PROVA A SECCO del blocco "09/11/2026: SVIZZERA, GIRONI E SIDEBOARD" (09/11/2026): esegue supabase/schema.sql in UNA
// transazione, crea utenti finti (email @dryrun.originsmeta.invalid, solo dentro la transazione) e gioca fino in fondo:
//   1) una svizzera da 29 con Top 8 in pausa, finale al meglio delle 5, liste segrete e sideboard (ritiro fra due turni,
//      turni generati dallo staff, classifica uguale a quella del sito, Top seedata dalla classifica);
//   2) una svizzera da 6 senza Top (vince il primo della classifica: riga champion, traguardo "torneo vinto");
//   3) un torneo a gironi da 18 (5 gironi da 4 e 3, passano 2, serpentina): calendario all'italiana, partite che diventano
//      pronte da sole, ritiro nel girone, fase finale da 10 con i bye, chiusura;
//   4) un torneo a eliminazione diretta di sempre (deve funzionare come prima);
//   5) una svizzera da 256 in blocco (otto turni senza rivincite: misura i tempi di "Genera il turno successivo");
//   6) gli abbinamenti del database (tm_swiss_pairs) uguali a swissPairs di src/lib/tournament/formats.ts su 400 casi.
// Alla fine fa SEMPRE rollback: sul database non resta nulla. Dentro una transazione now() non cambia.
// Uso, dalla radice del repo: node scripts/swiss-dry-run.mjs
//      node scripts/swiss-dry-run.mjs --no-schema → prova le funzioni GIÀ nel database (a migrazione fatta), senza
//      applicare lo schema: niente tabelle bloccate, si può lanciare con il sito acceso.
// ATTENZIONE: senza --no-schema lo schema si applica dentro la transazione, che tiene bloccate le tabelle fino al
// rollback: per tutta la durata il SITO NON RISPONDE. Sul database vero, prima della migrazione, lanciarla quando il sito
// non serve (niente tornei in corso) e senza altri comandi in parallelo; tutto il lavoro grosso è in blocco (pochi
// secondi su PGlite). Legge .env.local della cartella corrente, altrimenti quello del checkout principale.
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";
import { schemaProblems, splitSchema } from "./schema-guard.mjs";
import { compareStanding, defaultSwissRounds, groupCount, groupQualifiers, roundRobin, snakeGroups, standings, swissPairs, swissQualifiers } from "../src/lib/tournament/formats.ts";

const NO_SCHEMA = process.argv.includes("--no-schema");
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
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: env.SUPABASE_DB_SSL === "off" ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });

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
const one = async (text, params) => (await attempt(text, params)).rows?.[0];
const rows = async (text, params) => (await attempt(text, params)).rows ?? [];
/** null = anonimo, "postgres" = proprietario (niente RLS), altrimenti un utente con l'accesso fatto */
async function as(uid) {
  await db.query("reset role");
  const id = uid && uid !== "postgres" ? uid : "";
  await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [id ? JSON.stringify({ sub: id, role: "authenticated" }) : "", id]);
  if (uid === "postgres") return;
  await db.query(`set local role ${id ? "authenticated" : "anon"}`);
}
const DOMAIN = "dryrun.originsmeta.invalid";
/** `n` utenti finti con un insert solo (il trigger crea il profilo `zzdry-<prefisso><i>`), in ordine. */
async function mkUsers(prefix, n) {
  await as("postgres");
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $1 || lpad(g::text, 3, '0') || '@${DOMAIN}', '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('user_name', 'zzdry-' || $1 || g), now(), now(), '', '', '', '', '', '', '', '', false, false
       from generate_series(0, $2 - 1) g`,
    [prefix, n],
  );
  return (await db.query(`select u.id from auth.users u join public.profiles p on p.id = u.id where u.email like $1 order by u.email`, [`${prefix}___@${DOMAIN}`])).rows.map((r) => r.id);
}
// codice OM1 come encodeOmCode di src/lib/deckcode.ts
const b64url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const om = (leg, i, cards) => `OM1.${b64url(JSON.stringify({ n: `Deck ${i}`, l: leg, c: cards ?? Array.from({ length: 12 }, (_, k) => `card-${k}`), x: [] }))}`;
const trio = (i) => JSON.stringify([om("merlin", i, Array.from({ length: 12 }, (_, k) => `card-${k}`)), om("king-arthur", i, Array.from({ length: 12 }, (_, k) => `card-${k + 12}`)), om("mulan", i, Array.from({ length: 12 }, (_, k) => `card-${k + 24}`))]);
const single = (i) => JSON.stringify([om("merlin", i)]);
const isUuid = (s) => /^[0-9a-f-]{36}$/.test(s);

/** Iscrive e consegna i mazzi in blocco (come seed-bots): solo per i giocatori che non servono a provare le RPC. */
async function bulkJoin(tid, ids, codes) {
  await as("postgres");
  await db.query(`insert into public.tournament_players (tournament_id, user_id, status, decks_submitted) select $1, x, 'registered', true from unnest($2::uuid[]) x`, [tid, ids]);
  await db.query(`insert into public.tournament_decks (tournament_id, user_id, codes) select $1, x, $3::jsonb from unnest($2::uuid[]) x`, [tid, ids, codes]);
}
/** Chiude in blocco le partite aperte di un turno (vincitore player_a, oppure a caso col seme), come bot-play. */
async function closeRound(tid, round, random = false) {
  if (!isUuid(tid)) throw new Error("id del torneo strano");
  await as("postgres");
  return db.query(`do $do$
    declare m record; need int; aw boolean;
    begin
      for m in select * from public.tournament_matches where tournament_id = '${tid}' and round = ${Number(round)} and status in ('pending', 'reported') and player_a is not null and player_b is not null order by position loop
        need := public.tm_need(m.tournament_id, m.round);
        aw := ${random ? "random() < 0.5" : "true"};
        update public.tournament_matches set winner = case when aw then m.player_a else m.player_b end, status = 'confirmed',
               score_a = case when aw then need else (random() * need)::int % need end,
               score_b = case when aw then (random() * need)::int % need else need end
         where id = m.id;
        perform public.tm_propagate(m.id);
      end loop;
    end $do$`);
}
const matchesOf = async (tid) => {
  await as("postgres");
  return (await db.query(`select * from public.tournament_matches where tournament_id = $1 order by round, position`, [tid])).rows;
};
const droppedOf = async (tid) => (await db.query(`select user_id from public.tournament_players where tournament_id = $1 and status = 'dropped'`, [tid])).rows.map((r) => r.user_id);
const rematches = (ms) => {
  const seen = new Map();
  let n = 0;
  for (const m of ms.filter((x) => x.stage === "swiss" && x.player_b)) {
    const k = [m.player_a, m.player_b].sort().join("|");
    if (seen.has(k)) n++;
    seen.set(k, true);
  }
  return n;
};
/** Classifica del database e del sito: stesso ordine e stessi numeri. */
async function sameStandings(tid, label) {
  await as(null);
  const dbRows = await rows(`select * from public.tournament_standings($1)`, [tid]);
  const ms = await matchesOf(tid);
  const ts = standings(ms, { dropped: await droppedOf(tid) }).sort(compareStanding);
  const norm = (r) => [r.user_id, r.grp ?? null, Number(r.rank), Number(r.points), Number(r.wins), Number(r.losses), Number(r.byes), Number(r.mw), Number(r.gw), Number(r.omw), Number(r.ogw), Boolean(r.dropped)].join(";");
  const a = dbRows.map(norm);
  const b = ts.map(norm);
  const diff = a.findIndex((x, i) => x !== b[i]);
  check(`${label}: classifica del database = classifica del sito (${a.length} righe)`, a.length === b.length && diff === -1, diff >= 0 ? `riga ${diff}: db ${a[diff]} / sito ${b[diff]}` : "");
  return ts;
}

await db.connect();
await db.query("begin");
try {
  for (const part of NO_SCHEMA ? [] : splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  const there = await one(`select to_regproc('public.swiss_next_round') is not null as ok`);
  if (!there?.ok) {
    await db.query("rollback");
    await db.end();
    console.log(`\nIl database non ha il blocco 09/11/2026: SVIZZERA, GIRONI E SIDEBOARD${NO_SCHEMA ? " (con --no-schema si provano solo le funzioni già migrate)" : ""}: niente da provare (rollback fatto).`);
    process.exit(failures ? 1 : 0);
  }
  if (failures) {
    await db.query("rollback");
    await db.end();
    console.log(`\nLo schema non si applica: ${failures} controlli NON passati (rollback fatto: il database non è cambiato). Non migrare.`);
    process.exit(1);
  }

  /* ---------- 6) abbinamenti: database = sito ---------- */
  await as("postgres");
  const rand = (() => {
    let s = 20261109;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  })();
  const cases = [];
  for (let c = 0; c < 400; c++) {
    const n = 2 + Math.floor(rand() * 40);
    const hb = Array.from({ length: n }, () => rand() < 0.15);
    const played = [];
    const k = Math.floor(rand() * n * 3);
    for (let x = 0; x < k; x++) {
      const a = Math.floor(rand() * n);
      const b = Math.floor(rand() * n);
      if (a !== b) played.push([a, b]);
    }
    cases.push({ n, hb, played });
  }
  const sqlPairs = await rows(
    `select c.ord, public.tm_swiss_pairs(c.n, c.hb, c.pa, c.pb) as p
       from jsonb_to_recordset($1::jsonb) as c(ord int, n int, hb boolean[], pa int[], pb int[])`,
    [JSON.stringify(cases.map((c, i) => ({ ord: i, n: c.n, hb: c.hb, pa: c.played.map((p) => p[0] + 1), pb: c.played.map((p) => p[1] + 1) })))],
  );
  const mismatch = cases.findIndex((c, i) => {
    const d = (sqlPairs.find((r) => r.ord === i)?.p ?? []).map((x) => x - 1);
    return JSON.stringify(d) !== JSON.stringify(swissPairs(c.n, c.hb, c.played));
  });
  check("tm_swiss_pairs = swissPairs del sito su 400 casi casuali (bye, rivincite, ricerca all'indietro)", sqlPairs.length === 400 && mismatch === -1, mismatch >= 0 ? JSON.stringify(cases[mismatch]) : "");
  check("turni proposti uguali (tm_swiss_default_rounds)", (await one(`select array_agg(public.tm_swiss_default_rounds(x) order by x) as v from unnest(array[2, 8, 9, 16, 17, 64, 65, 129, 256]) x`))?.v.join() === [2, 8, 9, 16, 17, 64, 65, 129, 256].map(defaultSwissRounds).join());

  /* ---------- 1) svizzera da 29 con Top 8 ---------- */
  const [O] = await mkUsers("so", 1);
  const [J] = await mkUsers("sj", 1);
  const [X] = await mkUsers("sx", 1);
  const P = await mkUsers("sp", 29);
  check("utenti finti creati in blocco, con il profilo", P.length === 29 && Boolean(O && J && X));
  await as(O);
  const ins = await attempt(
    `insert into public.tournaments (slug, organizer, name, starts_at, size, format, swiss_rounds, top_cut, top_cut_hold, deck_mode, conquest_decks, conquest_min_different, best_of, final_best_of, hidden_decklists, sideboard)
     values ('zzdry-swiss', $1, 'Prova svizzera', now() + interval '1 day', 32, 'swiss', 5, 8, true, 'conquest', 3, 8, 3, 5, true, 3)`,
    [O],
  );
  check("l'organizzatore crea una svizzera da 32 con Top 8, pausa, liste segrete e sideboard da 3", !ins.error, err(ins));
  const T = (await one(`select id from public.tournaments where slug = 'zzdry-swiss'`))?.id;
  check("vincoli: i gironi senza group_size sono rifiutati", /tournaments_format_options_check/.test(err(await attempt(`insert into public.tournaments (slug, organizer, name, starts_at, size, format) values ('zzdry-bad', $1, 'Bad', now() + interval '1 day', 8, 'groups')`, [O]))));
  check("vincoli: i turni svizzeri solo nella svizzera", /tournaments_format_options_check/.test(err(await attempt(`insert into public.tournaments (slug, organizer, name, starts_at, size, swiss_rounds) values ('zzdry-bad2', $1, 'Bad', now() + interval '1 day', 8, 4)`, [O]))));
  check("add_judge", !(await attempt(`select public.add_judge($1, 'zzdry-sj0')`, [T])).error);
  // quattro giocatori con le RPC (iscrizione, mazzi, sideboard), gli altri in blocco
  for (const i of [0, 1, 2, 3]) {
    await as(P[i]);
    const j = await attempt(`select public.join_tournament($1)`, [T]);
    const d = await attempt(`select public.submit_tournament_decks($1, $2::jsonb)`, [T, trio(i)]);
    if (j.error || d.error) check(`iscrizione e mazzi di p${i}`, false, j.error ?? d.error);
  }
  await as(P[0]);
  check("sideboard con una carta di un mazzo: side_in_deck", /side_in_deck/.test(err(await attempt(`select public.submit_tournament_sideboard($1, '["card-3", "side-a"]'::jsonb)`, [T]))));
  check("sideboard con la Leggendaria di un mazzo: side_in_deck", /side_in_deck/.test(err(await attempt(`select public.submit_tournament_sideboard($1, '["mulan"]'::jsonb)`, [T]))));
  check("sideboard troppo lunga: side_count", /side_count/.test(err(await attempt(`select public.submit_tournament_sideboard($1, '["s-a", "s-b", "s-c", "s-d"]'::jsonb)`, [T]))));
  check("sideboard con doppioni: side_invalid", /side_invalid/.test(err(await attempt(`select public.submit_tournament_sideboard($1, '["s-a", "s-a"]'::jsonb)`, [T]))));
  check("sideboard valida", !(await attempt(`select public.submit_tournament_sideboard($1, '["side-a", "side-b", "side-c"]'::jsonb)`, [T])).error);
  await as(P[1]);
  check("sideboard di p1", !(await attempt(`select public.submit_tournament_sideboard($1, '["side-a", "side-b", "side-c"]'::jsonb)`, [T])).error);
  await as(X);
  check("un estraneo non consegna sideboard", /not_registered/.test(err(await attempt(`select public.submit_tournament_sideboard($1, '["side-a"]'::jsonb)`, [T]))));
  await as(P[1]);
  check("un altro giocatore non legge la sideboard di p0 (liste segrete)", (await rows(`select sideboard from public.tournament_decks where tournament_id = $1 and user_id = $2`, [T, P[0]])).length === 0);
  // se cambiano i mazzi, le carte finite in un mazzo escono dalla riserva
  await as(P[0]);
  await attempt(`select public.submit_tournament_decks($1, $2::jsonb)`, [T, JSON.stringify([om("merlin", 0, ["side-a", ...Array.from({ length: 11 }, (_, k) => `card-${k}`)]), om("king-arthur", 0, Array.from({ length: 12 }, (_, k) => `card-${k + 12}`)), om("mulan", 0, Array.from({ length: 12 }, (_, k) => `card-${k + 24}`))])]);
  await as("postgres");
  check("mazzi cambiati: la carta entrata nel mazzo esce dalla sideboard", JSON.stringify((await one(`select sideboard from public.tournament_decks where tournament_id = $1 and user_id = $2`, [T, P[0]]))?.sideboard) === JSON.stringify(["side-b", "side-c"]));
  await as(P[0]);
  await attempt(`select public.submit_tournament_decks($1, $2::jsonb)`, [T, trio(0)]);
  await attempt(`select public.submit_tournament_sideboard($1, '["side-a", "side-b", "side-c"]'::jsonb)`, [T]);
  await bulkJoin(T, P.slice(4), trio(9));

  await as(P[5]);
  check("un giocatore non avvia", /forbidden/.test(err(await attempt(`select public.start_tournament($1, $2::uuid[])`, [T, P]))));
  await as(O);
  const st = await attempt(`select public.start_tournament($1, $2::uuid[])`, [T, P]);
  check("l'organizzatore avvia la svizzera da 29", !st.error, err(st));
  await as("postgres");
  check("turni svizzeri fissati all'avvio (5 scelti)", (await one(`select swiss_rounds, status from public.tournaments where id = $1`, [T]))?.swiss_rounds === 5);
  let ms = await matchesOf(T);
  const r1 = ms.filter((m) => m.round === 1);
  check("primo turno: 14 partite e un bye, tutte svizzere", r1.length === 15 && r1.filter((m) => m.status === "bye").length === 1 && r1.every((m) => m.stage === "swiss"));
  const bye1 = r1.find((m) => m.status === "bye");
  check("il bye vale una vittoria 2-0 (al meglio delle 3)", bye1?.winner === bye1?.player_a && bye1?.score_a === 2 && bye1?.score_b === 0 && bye1?.player_b === null);
  check("le 14 partite sono pronte, con l'avviso", r1.filter((m) => m.status === "pending").every((m) => m.ready_at) && (await one(`select count(*)::int as n from public.notifications where kind = 'match_ready' and target like '/tournaments/zzdry-swiss/match/%'`))?.n === 28);
  check("prima della Top non ci sono partite del tabellone né semifinalisti", (await one(`select public.tm_top_round($1) as r, public.tm_in_top4($1, $2) as t4, public.tm_need($1, 1) as need`, [T, P[0]]))?.r === null && (await one(`select public.tm_in_top4($1, $2) as t4`, [T, P[0]]))?.t4 === false);
  check("in svizzera le partite sono al meglio delle 3 anche con la finale al meglio delle 5", (await one(`select public.tm_need($1, 1) as n`, [T]))?.n === 2);
  check("nessuna rivincita al turno 1 e tutti una volta", new Set(r1.flatMap((m) => [m.player_a, m.player_b]).filter(Boolean)).size === 29);

  // chi prova sideboard e scambi: p0, o p1 se a p0 è toccato il bye (tutti e due hanno la stessa sideboard)
  const ME = [P[0], P[1]].find((u) => r1.some((m) => m.status === "pending" && (m.player_a === u || m.player_b === u)));
  const p0m = r1.find((m) => m.player_a === ME || m.player_b === ME);
  const opp0 = p0m.player_a === ME ? p0m.player_b : p0m.player_a;
  // con le liste segrete l'avversario vede solo le Leggendarie: niente liste, niente sideboard, niente scambi
  await as(opp0);
  check("liste segrete: l'avversario non legge la lista né la sideboard del giocatore", (await rows(`select codes, sideboard from public.tournament_decks where tournament_id = $1 and user_id = $2`, [T, ME])).length === 0);
  check("…ma vede le sue Leggendarie", (await rows(`select * from public.tournament_legendaries($1)`, [T])).some((r) => r.user_id === ME));
  if (p0m.status === "pending") {
    await as(ME);
    check("scambio prima della partita 1: bad_game", /bad_game/.test(err(await attempt(`select public.declare_side_swaps($1, 1, 0, '[{"out": "card-1", "in": "side-a"}]'::jsonb)`, [p0m.id]))));
    check("scambio con una carta che non è nel mazzo: bad_side_swap", /bad_side_swap/.test(err(await attempt(`select public.declare_side_swaps($1, 2, 0, '[{"out": "card-20", "in": "side-a"}]'::jsonb)`, [p0m.id]))));
    check("scambio con una carta fuori dalla sideboard: bad_side_swap", /bad_side_swap/.test(err(await attempt(`select public.declare_side_swaps($1, 2, 0, '[{"out": "card-1", "in": "side-z"}]'::jsonb)`, [p0m.id]))));
    check("la stessa carta due volte: bad_side_swap", /bad_side_swap/.test(err(await attempt(`select public.declare_side_swaps($1, 2, 0, '[{"out": "card-1", "in": "side-a"}, {"out": "card-1", "in": "side-b"}]'::jsonb)`, [p0m.id]))));
    check("partita 4 in un al meglio delle 3: bad_game", /bad_game/.test(err(await attempt(`select public.declare_side_swaps($1, 4, 0, '[]'::jsonb)`, [p0m.id]))));
    const sw = await attempt(`select public.declare_side_swaps($1, 2, 1, '[{"out": "card-13", "in": "side-a"}, {"out": "card-14", "in": "side-b"}]'::jsonb)`, [p0m.id]);
    check("scambi validi per la partita 2 (mazzo 2: carte 12–23)", !sw.error, err(sw));
    check("chi dichiara rilegge i suoi scambi", (await rows(`select * from public.match_side_swaps($1)`, [p0m.id])).length === 1);
    await as(opp0);
    check("con le liste segrete l'avversario non vede gli scambi", (await rows(`select * from public.match_side_swaps($1)`, [p0m.id])).length === 0);
    await as(J);
    check("l'arbitro vede gli scambi", (await rows(`select * from public.match_side_swaps($1)`, [p0m.id])).length === 1);
    await as(X);
    check("un estraneo non vede gli scambi", (await rows(`select * from public.match_side_swaps($1)`, [p0m.id])).length === 0);
    check("nessuno legge la tabella degli scambi", Boolean(err(await attempt(`select * from public.tournament_side_swaps`))));
    // referto vero dei due giocatori
    await as(ME);
    const a = p0m.player_a === ME;
    check("il giocatore referta", !(await attempt(`select public.report_match_result($1, $2, $3)`, [p0m.id, a ? 2 : 1, a ? 1 : 2])).error);
    await as(opp0);
    check("l'avversario conferma", !(await attempt(`select public.report_match_result($1, $2, $3)`, [p0m.id, a ? 2 : 1, a ? 1 : 2])).error);
  }
  await as(O);
  check("turno successivo con partite aperte: round_open", /round_open/.test(err(await attempt(`select public.swiss_next_round($1)`, [T]))));
  await as(P[3]);
  check("un giocatore non genera turni", /forbidden/.test(err(await attempt(`select public.swiss_next_round($1)`, [T]))));
  await as("postgres");
  await closeRound(T, 1, true);
  // ritiro fra un turno e l'altro: non viene più abbinato
  await as(J);
  check("l'arbitro ritira p7 fra il turno 1 e il 2", !(await attempt(`select public.drop_player($1, $2)`, [T, P[7]])).error);
  check("l'arbitro genera il turno 2", (await one(`select public.swiss_next_round($1) as r`, [T]))?.r === 2);
  ms = await matchesOf(T);
  const r2 = ms.filter((m) => m.round === 2);
  check("turno 2: 28 in gara, 14 partite, nessun bye, p7 fuori", r2.length === 14 && r2.every((m) => m.player_b) && !r2.some((m) => m.player_a === P[7] || m.player_b === P[7]));
  check("turno 2: nessuna rivincita", rematches(ms) === 0);
  const wins1 = (u) => ms.filter((m) => m.round === 1 && m.winner === u).length;
  check("turno 2 per punteggio: i vincitori giocano fra loro (al più una partita mista)", r2.filter((m) => wins1(m.player_a) !== wins1(m.player_b)).length <= 1);
  check("il turno 2 parte con l'avviso", r2.every((m) => m.ready_at));
  // la svizzera fino all'ultimo turno, con un ritiro a turno in corso
  await as(P[8]);
  const m8 = r2.find((m) => m.player_a === P[8] || m.player_b === P[8]);
  check("p8 si ritira a turno in corso: perde la partita", !(await attempt(`select public.leave_tournament($1)`, [T])).error);
  await as("postgres");
  const m8b = await one(`select * from public.tournament_matches where id = $1`, [m8.id]);
  check("…a tavolino, vinta dall'avversario", m8b.status === "confirmed" && m8b.forfeit && m8b.winner !== P[8] && m8b.note === "drop");
  for (let r = 2; r <= 4; r++) {
    await closeRound(T, r, true);
    await as(O);
    const nx = await attempt(`select public.swiss_next_round($1) as r`, [T]);
    check(`turno ${r + 1} generato`, nx.rows?.[0]?.r === r + 1, err(nx));
  }
  ms = await matchesOf(T);
  const r3 = ms.filter((m) => m.round === 3);
  check("dal turno 3 i ritirati (27 in gara): un bye a turno, mai due volte allo stesso", r3.filter((m) => m.status === "bye").length === 1 && new Set(ms.filter((m) => m.status === "bye").map((m) => m.player_a)).size === ms.filter((m) => m.status === "bye").length);
  check("cinque turni senza rivincite", rematches(ms) === 0);
  await as(O);
  check("formato bloccato a torneo avviato", /format_locked/.test(err(await attempt(`update public.tournaments set format = 'single_elim' where id = $1`, [T]))));
  check("Top prima della fine dell'ultimo turno: round_open", /round_open/.test(err(await attempt(`select public.start_final_stage($1)`, [T]))));
  await as("postgres");
  await closeRound(T, 5, true);
  await as(O);
  check("dopo i turni previsti niente turno 6: swiss_over", /swiss_over/.test(err(await attempt(`select public.swiss_next_round($1)`, [T]))));
  const ts = await sameStandings(T, "svizzera da 29");
  const expectedTop = swissQualifiers(ts, 8).map((r) => r.user_id);
  await as(J);
  const sf = await attempt(`select public.start_final_stage($1) as n`, [T]);
  check("l'arbitro chiude la svizzera e crea la Top 8", sf.rows?.[0]?.n === 8, err(sf));
  ms = await matchesOf(T);
  const top = ms.filter((m) => !m.stage);
  check("Top 8 nei turni 6–8: 4 + 2 + 1 partite", top.filter((m) => m.round === 6).length === 4 && top.filter((m) => m.round === 7).length === 2 && top.filter((m) => m.round === 8).length === 1);
  const seed = (u) => expectedTop.indexOf(u) + 1;
  const q1 = top.filter((m) => m.round === 6).sort((a, b) => a.position - b.position).map((m) => [seed(m.player_a), seed(m.player_b)]);
  check("Top seedata dalla classifica del sito: 1–8, 4–5, 2–7, 3–6", JSON.stringify(q1) === JSON.stringify([[1, 8], [4, 5], [2, 7], [3, 6]]), JSON.stringify(q1));
  check("i ritirati non entrano nella Top", !top.some((m) => [P[7], P[8]].includes(m.player_a) || [P[7], P[8]].includes(m.player_b)));
  check("Top in pausa: nessuna partita pronta, inizia al turno 6", top.every((m) => !m.ready_at) && (await one(`select public.tm_top_round($1) as r`, [T]))?.r === 6);
  check("finale della Top al meglio delle 5, quarti al meglio delle 3", (await one(`select public.tm_need($1, 8) as f, public.tm_need($1, 6) as q`, [T]))?.f === 3 && (await one(`select public.tm_need($1, 6) as q`, [T]))?.q === 2);
  await as(J);
  check("Top già creata: already_started", /already_started/.test(err(await attempt(`select public.start_final_stage($1)`, [T]))));
  const qf = top.find((m) => m.round === 6);
  await as(qf.player_a);
  check("in pausa non si referta", /top_cut_on_hold/.test(err(await attempt(`select public.report_match_result($1, 2, 0)`, [qf.id]))));
  await as(J);
  const swissMatch = ms.find((m) => m.stage === "swiss" && m.status === "confirmed" && m.player_b);
  check("risultati della svizzera bloccati dopo la Top", /next_match_started/.test(err(await attempt(`select public.set_match_result($1, 0, 2)`, [swissMatch.id]))));
  check("\"Avvia la Top\": 4 partite pronte", (await one(`select public.release_top_cut($1) as n`, [T]))?.n === 4);
  await as(qf.player_a);
  check("con le liste segrete i quarti non rendono pubbliche le liste (solo dalla semifinale)", (await one(`select public.tm_in_top4($1, $2) as v`, [T, qf.player_a]))?.v === false);
  check("dopo l'avvio si referta", !(await attempt(`select public.report_match_result($1, 2, 0)`, [qf.id])).error);
  await as(qf.player_b);
  check("…e si conferma: il vincitore va in semifinale", !(await attempt(`select public.report_match_result($1, 2, 0)`, [qf.id])).error && (await one(`select player_a from public.tournament_matches where tournament_id = $1 and round = 7 and position = 0`, [T]))?.player_a === qf.player_a);
  await as("postgres");
  await closeRound(T, 6);
  check("semifinalisti: le liste diventano pubbliche (tm_in_top4)", (await one(`select public.tm_in_top4($1, $2) as v`, [T, qf.player_a]))?.v === true);
  await closeRound(T, 7);
  await closeRound(T, 8);
  const fin = await one(`select * from public.tournament_matches where tournament_id = $1 and round = 8`, [T]);
  check("finale chiusa 3-0 (al meglio delle 5)", fin.status === "confirmed" && fin.score_a === 3);
  await as(J);
  check("la svizzera con la Top si chiude", !(await attempt(`select public.finish_tournament($1, 'GG')`, [T])).error);
  await as(null);
  check("traguardo \"torneo vinto\" al vincitore della Top", (await one(`select (public.profile_achievement_facts($1) -> 'won' ->> 'count')::int as n`, [fin.winner]))?.n === 1);
  check("a torneo finito tutti vedono gli scambi", (await rows(`select * from public.match_side_swaps($1)`, [p0m.id])).length === (p0m.status === "pending" ? 1 : 0));

  /* ---------- 2) svizzera da 6 senza Top ---------- */
  const S = await mkUsers("ss", 6);
  await as(O);
  await attempt(`insert into public.tournaments (slug, organizer, name, starts_at, size, format, best_of) values ('zzdry-swiss6', $1, 'Prova svizzera 6', now() + interval '1 day', 8, 'swiss', 1)`, [O]);
  const T2 = (await one(`select id from public.tournaments where slug = 'zzdry-swiss6'`))?.id;
  await bulkJoin(T2, S, single(1));
  await as(O);
  check("svizzera senza Top avviata", !(await attempt(`select public.start_tournament($1, $2::uuid[])`, [T2, S])).error);
  check("turni proposti per 6 giocatori: 3", (await one(`select swiss_rounds from public.tournaments where id = $1`, [T2]))?.swiss_rounds === 3);
  check("senza Top niente fase finale: no_final_stage", /no_final_stage/.test(err(await attempt(`select public.start_final_stage($1)`, [T2]))));
  await as("postgres");
  await closeRound(T2, 1, true);
  await as(O);
  await attempt(`select public.swiss_next_round($1)`, [T2]);
  await as("postgres");
  await closeRound(T2, 2, true);
  await as(O);
  await attempt(`select public.swiss_next_round($1)`, [T2]);
  check("chiusura con il turno 3 aperto: round_open", /round_open/.test(err(await attempt(`select public.finish_tournament($1, null)`, [T2]))));
  await as("postgres");
  await closeRound(T2, 3, true);
  const ts2 = await sameStandings(T2, "svizzera da 6");
  check("tre turni da 6 senza rivincite", rematches(await matchesOf(T2)) === 0);
  await as(O);
  check("la svizzera senza Top si chiude", !(await attempt(`select public.finish_tournament($1, null)`, [T2])).error);
  const champ = await one(`select * from public.tournament_matches where tournament_id = $1 and stage = 'champion'`, [T2]);
  check("vince il primo della classifica (riga champion dopo l'ultimo turno, posizione 0)", champ?.winner === ts2[0].user_id && champ?.round === 4 && champ?.position === 0 && champ?.status === "bye");
  await as(null);
  check("…con il traguardo \"torneo vinto\"", (await one(`select (public.profile_achievement_facts($1) -> 'won' ->> 'count')::int as n`, [ts2[0].user_id]))?.n === 1);

  /* ---------- 3) gironi da 18 ---------- */
  const G = await mkUsers("sg", 18);
  await as(O);
  const ig = await attempt(
    `insert into public.tournaments (slug, organizer, name, starts_at, size, format, group_size, group_advance, group_seeding, top_cut_hold, best_of, deck_mode)
     values ('zzdry-groups', $1, 'Prova gironi', now() + interval '1 day', 32, 'groups', 4, 2, 'snake', false, 3, 'free')`,
    [O],
  );
  check("l'organizzatore crea un torneo a gironi da 4, passano 2, serpentina", !ig.error, err(ig));
  const T3 = (await one(`select id from public.tournaments where slug = 'zzdry-groups'`))?.id;
  check("gironi con una Top: rifiutato dal vincolo", /tournaments_format_options_check/.test(err(await attempt(`update public.tournaments set top_cut = 8 where id = $1`, [T3]))));
  await bulkJoin(T3, G, single(2));
  await as(O);
  check("gironi avviati", !(await attempt(`select public.start_tournament($1, $2::uuid[])`, [T3, G])).error);
  let gm = await matchesOf(T3);
  const g = groupCount(18, 4);
  const expect = snakeGroups(18, g);
  const groupOf = new Map();
  for (const m of gm) for (const u of [m.player_a, m.player_b]) groupOf.set(u, m.grp);
  check(`5 gironi a serpentina, come snakeGroups del sito`, g === 5 && G.every((u, i) => groupOf.get(u) === expect[i]), JSON.stringify(G.map((u) => groupOf.get(u))));
  const sizes = Array.from({ length: g }, (_, k) => G.filter((u) => groupOf.get(u) === k).length);
  // a serpentina con 18 e 5 gironi le ultime tre posizioni (15, 16, 17) vanno ai gironi E, D, C: A e B restano da 3
  check("gironi da 3, 3, 4, 4, 4 e 24 partite (3 + 3 + 6 + 6 + 6)", JSON.stringify(sizes) === "[3,3,4,4,4]" && gm.length === 24, `${sizes} ${gm.length}`);
  const pairKeys = gm.map((m) => [m.player_a, m.player_b].sort().join("|"));
  check("all'italiana: ogni coppia del girone una volta, mai fra gironi", new Set(pairKeys).size === 24 && gm.every((m) => groupOf.get(m.player_a) === groupOf.get(m.player_b) && m.stage === "group"));
  check("turni come roundRobin del sito: 3 turni con 4 e con 3 giocatori", Math.max(...gm.map((m) => m.round)) === roundRobin(4).length && roundRobin(3).length === 3);
  check("pronte solo le partite del turno 1", gm.filter((m) => m.ready_at).every((m) => m.round === 1) && gm.filter((m) => m.round === 1).every((m) => m.ready_at));
  // un girone da 3 (posto vuoto): chi riposa al turno 1 ha la partita del turno 2 pronta appena l'avversario ha finito
  const smallGrp = sizes.indexOf(3);
  const small = gm.filter((m) => m.grp === smallGrp);
  const resting = [...new Set(small.flatMap((m) => [m.player_a, m.player_b]))].find((u) => !small.some((m) => m.round === 1 && (m.player_a === u || m.player_b === u)));
  const r1small = small.find((m) => m.round === 1);
  await as(r1small.player_a);
  await attempt(`select public.report_match_result($1, 2, 0)`, [r1small.id]);
  await as(r1small.player_b);
  check("girone da 3: referto e conferma del turno 1", !(await attempt(`select public.report_match_result($1, 2, 0)`, [r1small.id])).error);
  await as("postgres");
  gm = await matchesOf(T3);
  const nextOfRest = gm.find((m) => m.grp === smallGrp && m.round === 2 && (m.player_a === resting || m.player_b === resting));
  check("…e la partita del turno 2 di chi riposava diventa pronta da sola", Boolean(nextOfRest?.ready_at), JSON.stringify(nextOfRest));
  const notReady = gm.find((m) => m.grp === 2 && m.round === 2);
  check("nel girone C (da 4) il turno 2 aspetta il turno 1", !notReady.ready_at);
  // ritiro nel girone: perde tutte le partite che restano
  // G[2] è il primo seed del girone C, da 4: tre partite
  const dropper = G[2];
  await as(O);
  check("l'organizzatore ritira un giocatore del girone C", !(await attempt(`select public.drop_player($1, $2)`, [T3, dropper])).error);
  await as("postgres");
  gm = await matchesOf(T3);
  const left = gm.filter((m) => m.player_a === dropper || m.player_b === dropper);
  check("…che perde a tavolino tutte e tre le partite del girone", left.length === 3 && left.every((m) => m.status === "confirmed" && m.forfeit && m.winner !== dropper));
  await as(O);
  check("scambi vietati nei gironi", /bad_swap/.test(err(await attempt(`select public.swap_players($1, $2, $3)`, [T3, gm.find((m) => m.status === "pending").player_a, gm.filter((m) => m.status === "pending").at(-1).player_a]))));
  check("fase finale con i gironi aperti: round_open", /round_open/.test(err(await attempt(`select public.start_final_stage($1)`, [T3]))));
  await as("postgres");
  for (let r = 1; r <= 3; r++) await closeRound(T3, r, true);
  const ts3 = await sameStandings(T3, "gironi da 18");
  const expQ = groupQualifiers(ts3, 2).map((r) => r.user_id);
  await as(O);
  const fs = await attempt(`select public.start_final_stage($1) as n`, [T3]);
  check("fase finale con i primi 2 di 5 gironi: 10 giocatori", fs.rows?.[0]?.n === 10, err(fs));
  gm = await matchesOf(T3);
  const fb = gm.filter((m) => !m.stage);
  const seedG = (u) => expQ.indexOf(u) + 1;
  const fr1 = fb.filter((m) => m.round === 4).sort((a, b) => a.position - b.position);
  check("tabellone da 16 nei turni 4–7 con 6 bye ai seed più alti", fr1.length === 8 && fr1.filter((m) => m.status === "bye").length === 6 && fr1.filter((m) => m.status === "bye").every((m) => seedG(m.player_a) <= 6));
  check("seed della fase finale come groupQualifiers del sito: 1° contro il bye, 8° contro il 9°", seedG(fr1[0].player_a) === 1 && fr1[0].status === "bye" && fr1.some((m) => [seedG(m.player_a), seedG(m.player_b)].sort().join() === "8,9" || [seedG(m.player_a), seedG(m.player_b)].sort((x, y) => x - y).join() === "8,9"));
  check("il ritirato non è nella fase finale", !fb.some((m) => m.player_a === dropper || m.player_b === dropper));
  check("senza pausa la fase finale parte subito (partite con i due giocatori pronte)", fb.filter((m) => m.player_a && m.player_b && m.status === "pending").every((m) => m.ready_at));
  await as("postgres");
  for (let r = 4; r <= 7; r++) await closeRound(T3, r);
  await as(O);
  check("il torneo a gironi si chiude con la finale", !(await attempt(`select public.finish_tournament($1, null)`, [T3])).error);

  /* ---------- 4) eliminazione diretta di sempre ---------- */
  const E = await mkUsers("se", 6);
  await as(O);
  await attempt(`insert into public.tournaments (slug, organizer, name, starts_at, size, best_of, final_best_of) values ('zzdry-se', $1, 'Prova diretta', now() + interval '1 day', 8, 1, 3)`, [O]);
  const T4 = (await one(`select id from public.tournaments where slug = 'zzdry-se'`))?.id;
  await bulkJoin(T4, E, single(3));
  await as(O);
  check("eliminazione diretta avviata come prima", !(await attempt(`select public.start_tournament($1, $2::uuid[])`, [T4, E])).error);
  let em = await matchesOf(T4);
  check("7 partite del tabellone da 8, senza stage, 2 bye propagati", em.length === 7 && em.every((m) => m.stage === null) && em.filter((m) => m.status === "bye").length === 2);
  check("finale al meglio delle 3, il resto partita secca", (await one(`select public.tm_need($1, 3) as f, public.tm_need($1, 1) as r`, [T4]))?.f === 2 && (await one(`select public.tm_need($1, 1) as r`, [T4]))?.r === 1);
  await as("postgres");
  for (let r = 1; r <= 3; r++) await closeRound(T4, r);
  em = await matchesOf(T4);
  check("i vincitori avanzano come prima", em.find((m) => m.round === 3).winner !== null);
  await as(O);
  check("il torneo a eliminazione diretta si chiude come prima", !(await attempt(`select public.finish_tournament($1, null)`, [T4])).error);
  await as(null);
  check("nessuna classifica per l'eliminazione diretta", (await rows(`select * from public.tournament_standings($1)`, [T4])).length === 0);

  /* ---------- 5) svizzera da 256 in blocco ---------- */
  const B = await mkUsers("sb", 256);
  await as(O);
  await attempt(`insert into public.tournaments (slug, organizer, name, starts_at, size, format, top_cut, best_of) values ('zzdry-swiss256', $1, 'Prova svizzera 256', now() + interval '1 day', 256, 'swiss', 32, 3)`, [O]);
  const T5 = (await one(`select id from public.tournaments where slug = 'zzdry-swiss256'`))?.id;
  await bulkJoin(T5, B, single(4));
  await as(O);
  let t0 = Date.now();
  check("svizzera da 256 avviata", !(await attempt(`select public.start_tournament($1, $2::uuid[])`, [T5, B])).error, `${Date.now() - t0} ms`);
  const times = [];
  for (let r = 1; r <= 7; r++) {
    await as("postgres");
    await closeRound(T5, r, true);
    await as(O);
    t0 = Date.now();
    const nx = await attempt(`select public.swiss_next_round($1) as r`, [T5]);
    times.push(Date.now() - t0);
    if (nx.error) check(`turno ${r + 1} da 256`, false, nx.error);
  }
  const big = await matchesOf(T5);
  check("otto turni da 256 (128 partite a turno) senza rivincite", big.filter((m) => m.round === 8).length === 128 && rematches(big) === 0, `tempi di "Genera il turno": ${times.join(", ")} ms`);
  check("ogni turno da 256 si genera in meno di 5 secondi", Math.max(...times) < 5000, `${Math.max(...times)} ms`);
  await as("postgres");
  await closeRound(T5, 8, true);
  await sameStandings(T5, "svizzera da 256");
  await as(O);
  t0 = Date.now();
  check("Top 32 dalla svizzera da 256", (await one(`select public.start_final_stage($1) as n`, [T5]))?.n === 32, `${Date.now() - t0} ms`);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati, ${passed} passati (rollback fatto: il database non è cambiato)` : `\nTutti i ${passed} controlli passati (rollback fatto: il database non è cambiato).${NO_SCHEMA ? "" : " Si può lanciare node scripts/db-migrate.mjs"}`);
process.exit(failures ? 1 : 0);
