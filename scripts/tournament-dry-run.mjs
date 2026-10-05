// PROVA A SECCO del blocco "05/10/2026: TORNEO CRIMSON" sul database vero (05/10/2026): esegue supabase/schema.sql in
// UNA transazione, crea 76 utenti finti (email @dryrun.originsmeta.invalid, solo dentro la transazione), gioca un torneo
// da 64 con check-in, lista d'attesa, liste segrete, finale al meglio delle cinque, tavolino, ritiri e arbitri, poi un
// torneo senza le opzioni nuove (deve funzionare come prima), e alla fine fa SEMPRE rollback: sul database non resta
// nulla. Stessi controlli della prova su PGlite fatta il 05/10/2026 (72 controlli passati).
// Dentro una transazione now() non cambia: gli orari che contano (iscrizione, check-in, partita pronta) si spostano a
// mano con degli update.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/tournament-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
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
/** null = anonimo, "postgres" = proprietario (niente RLS), altrimenti un utente con l'accesso fatto */
async function as(uid) {
  await db.query("reset role");
  const id = uid && uid !== "postgres" ? uid : "";
  await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [id ? JSON.stringify({ sub: id, role: "authenticated" }) : "", id]);
  if (uid === "postgres") return;
  await db.query(`set local role ${id ? "authenticated" : "anon"}`);
}
const DOMAIN = "dryrun.originsmeta.invalid";
async function mkUser(name) {
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, phone_change_token,
       email_change_token_current, reauthentication_token, is_sso_user, is_anonymous)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(), '', '', '', '', '', '', '', '', false, false)`,
    [id, `${name}@${DOMAIN}`, JSON.stringify({ user_name: `zzdry-${name}` })],
  );
  return id;
}
// codice OM1 come encodeOmCode di src/lib/deckcode.ts
const b64url = (s) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const om = (leg, i) => `OM1.${b64url(JSON.stringify({ n: `Deck ${i} è`, l: leg, c: Array.from({ length: 12 }, (_, k) => `card-${k}`), x: [] }))}`;
const trio = (i) => JSON.stringify([om("merlin", i), om("king-arthur", i), om("mulan", i)]);
const one = async (text, params) => (await attempt(text, params)).rows?.[0];

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.tournament_judges') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella tournament_judges c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }

  await as("postgres");
  const O = await mkUser("organizer");
  const J = await mkUser("judge");
  const STRANGER = await mkUser("stranger");
  const P = [];
  for (let i = 0; i < 72; i++) P.push(await mkUser(`p${i}`));
  check("utenti finti creati (con il profilo)", (await one(`select count(*)::int as n from public.profiles where id = any($1::uuid[])`, [[O, J, ...P]]))?.n === 74);
  const statusOf = async (tid, uid) => (await one(`select status from public.tournament_players where tournament_id = $1 and user_id = $2`, [tid, uid]))?.status;

  // ---------- torneo con le regole della Crimson Cup ----------
  await as(O);
  const ins = await attempt(
    `insert into public.tournaments (slug, organizer, name, starts_at, size, deck_mode, conquest_decks, conquest_min_different, best_of, final_best_of, checkin, hidden_decklists, no_show_minutes)
     values ('zzdry-crimson', $1, 'Prova Crimson', now() + interval '3 hours', 64, 'conquest', 3, 8, 3, 5, true, true, 15)`,
    [O],
  );
  check("l'organizzatore crea il torneo (insert senza returning, come createTournament)", !ins.error, err(ins));
  const T = (await one(`select id from public.tournaments where slug = 'zzdry-crimson'`))?.id;
  check("…e lo rilegge per slug", Boolean(T));
  check("add_judge per nome utente", !(await attempt(`select public.add_judge($1, 'zzdry-judge')`, [T])).error);
  await as(J);
  check("un arbitro non nomina arbitri", /forbidden/.test(err(await attempt(`select public.add_judge($1, 'zzdry-p1')`, [T]))));
  check("un arbitro non si iscrive", /judge_is_player/.test(err(await attempt(`select public.join_tournament($1)`, [T]))));

  for (let i = 0; i < 70; i++) {
    await as(P[i]);
    const r = await attempt(`select public.join_tournament($1)`, [T]);
    if (r.error) check(`iscrizione p${i}`, false, r.error);
  }
  await as("postgres");
  // dentro la transazione now() è fisso: l'ordine di iscrizione lo diamo noi
  for (let i = 0; i < 70; i++) await db.query(`update public.tournament_players set created_at = now() - make_interval(secs => $3) where tournament_id = $1 and user_id = $2`, [T, P[i], 1000 - i]);
  const counts = (await db.query(`select status, count(*)::int as n from public.tournament_players where tournament_id = $1 group by status`, [T])).rows;
  const cnt = (s) => counts.find((c) => c.status === s)?.n ?? 0;
  check("64 iscritti e 6 in lista d'attesa", cnt("registered") === 64 && cnt("waitlist") === 6, JSON.stringify(counts));

  for (let i = 0; i < 70; i++) {
    await as(P[i]);
    const r = await attempt(`select public.submit_tournament_decks($1, $2::jsonb)`, [T, trio(i)]);
    if (r.error) check(`mazzi p${i}`, false, r.error);
  }
  await as("postgres");
  const legs = (await one(`select legendaries from public.tournament_decks where tournament_id = $1 and user_id = $2`, [T, P[0]]))?.legendaries;
  check("Leggendarie lette dal codice OM1", JSON.stringify(legs) === JSON.stringify(["merlin", "king-arthur", "mulan"]), JSON.stringify(legs));
  check("niente avvio automatico con il check-in", (await one(`select status from public.tournaments where id = $1`, [T]))?.status === "open");

  await as(P[0]);
  check("check-in troppo presto", /checkin_not_open/.test(err(await attempt(`select public.check_in($1)`, [T]))));
  await as("postgres");
  await db.query(`update public.tournaments set starts_at = now() + interval '1 hour' where id = $1`, [T]);
  for (let i = 0; i < 60; i++) {
    await as(P[i]);
    const r = await attempt(`select public.check_in($1)`, [T]);
    if (r.error) check(`check-in p${i}`, false, r.error);
  }
  for (const i of [62, 63]) {
    await as(P[i]);
    check(`p${i} si ritira prima dell'inizio`, !(await attempt(`select public.leave_tournament($1)`, [T])).error);
  }
  check("i due posti liberi vanno ai primi due in lista (p64, p65)", (await statusOf(T, P[64])) === "registered" && (await statusOf(T, P[65])) === "registered");
  for (const i of [64, 66, 67]) {
    await as(P[i]);
    const r = await attempt(`select public.check_in($1)`, [T]);
    check(`check-in p${i}`, !r.error, err(r));
  }
  await as(J);
  check("avvio prima della chiusura: rifiutato", /checkin_still_open/.test(err(await attempt(`select public.start_tournament($1, '{}')`, [T]))));
  check("l'arbitro fa il check-in per p60", !(await attempt(`select public.staff_check_in($1, $2)`, [T, P[60]])).error);
  await as(P[5]);
  check("un giocatore non fa il check-in per altri", /forbidden/.test(err(await attempt(`select public.staff_check_in($1, $2)`, [T, P[61]]))));

  await as("postgres");
  await db.query(`update public.tournaments set starts_at = now() + interval '2 minutes' where id = $1`, [T]);
  await as(P[61]);
  check("iscritto dopo la chiusura: checkin_closed", /checkin_closed/.test(err(await attempt(`select public.check_in($1)`, [T]))));
  check("mazzi dopo la chiusura: decks_closed", /decks_closed/.test(err(await attempt(`select public.submit_tournament_decks($1, $2::jsonb)`, [T, trio(61)]))));
  await as(P[68]);
  check("lista d'attesa dopo la chiusura: check-in ancora possibile", !(await attempt(`select public.check_in($1)`, [T])).error);
  await as("postgres");
  // ordine di arrivo al check-in della lista: p67, poi p66, poi p68
  await db.query(`update public.tournament_players set checked_in_at = now() - interval '30 minutes' where tournament_id = $1 and user_id = $2`, [T, P[67]]);
  await db.query(`update public.tournament_players set checked_in_at = now() - interval '20 minutes' where tournament_id = $1 and user_id = $2`, [T, P[66]]);

  await as(P[3]);
  check("un giocatore non avvia", /forbidden/.test(err(await attempt(`select public.start_tournament($1, '{}')`, [T]))));
  await as(J);
  const st = await attempt(`select public.start_tournament($1, '{}')`, [T]);
  check("l'arbitro avvia il torneo", !st.error, err(st));
  await as("postgres");
  const inBracket = (await db.query(`select distinct x as uid from public.tournament_matches m, unnest(array[m.player_a, m.player_b]) x where m.tournament_id = $1 and m.round = 1 and x is not null`, [T])).rows.map((r) => r.uid);
  const has = (i) => inBracket.includes(P[i]);
  check("64 giocatori nel tabellone", inBracket.length === 64, String(inBracket.length));
  check("entrano p67 e p66 dalla lista (primi ad arrivare), non p68", has(66) && has(67) && !has(68));
  check("fuori p61 (niente check-in) e p65 (promosso senza check-in)", !has(61) && !has(65));
  check("p61 risulta fuori (dropped), p68 resta in lista", (await statusOf(T, P[61])) === "dropped" && (await statusOf(T, P[68])) === "waitlist");
  const r1 = (await db.query(`select * from public.tournament_matches where tournament_id = $1 and round = 1 order by position`, [T])).rows;
  check("32 partite al primo turno, tutte pronte", r1.length === 32 && r1.every((m) => m.ready_at && m.status === "pending"));
  const notes = (await one(`select count(*)::int as n from public.notifications where kind = 'match_ready' and user_id = any($1::uuid[])`, [P]))?.n;
  check("64 avvisi 'partita pronta'", notes === 64, String(notes));

  const m0 = r1[0];
  await as(m0.player_a);
  const seenDecks = (await attempt(`select user_id from public.tournament_decks where tournament_id = $1`, [T])).rows ?? [];
  check("liste segrete: il giocatore vede solo le sue", seenDecks.length === 1 && seenDecks[0].user_id === m0.player_a, String(seenDecks.length));
  const seenLegs = (await attempt(`select user_id, legendaries from public.tournament_legendaries($1)`, [T])).rows ?? [];
  check("…e le Leggendarie sue e dell'avversario", seenLegs.length === 2 && seenLegs.some((r) => r.user_id === m0.player_b));
  await as(null);
  check("l'anonimo non vede liste", ((await attempt(`select user_id from public.tournament_decks where tournament_id = $1`, [T])).rows ?? []).length === 0);
  await as(J);
  check("l'arbitro vede tutte le liste (68)", ((await attempt(`select user_id from public.tournament_decks where tournament_id = $1`, [T])).rows ?? []).length === 68);
  check("l'arbitro scrive nella chat della partita", !(await attempt(`select public.send_message($1, 'arbitro qui')`, [m0.id])).error);
  await as(STRANGER);
  check("un estraneo non scrive nella chat", Boolean(err(await attempt(`select public.send_message($1, 'ciao')`, [m0.id]))));

  const play = async (m, a, b) => {
    await as(m.player_a);
    const x = await attempt(`select public.report_match_result($1, $2, $3)`, [m.id, a, b]);
    if (x.error) return x;
    await as(m.player_b);
    return attempt(`select public.report_match_result($1, $2, $3)`, [m.id, a, b]);
  };
  const statusM = async (id) => (await one(`select status from public.tournament_matches where id = $1`, [id]))?.status;

  await as(m0.player_a);
  await attempt(`select public.report_match_result($1, 2, 1)`, [m0.id]);
  await as(m0.player_b);
  await attempt(`select public.report_match_result($1, 1, 2)`, [m0.id]);
  await as("postgres");
  check("referti diversi: contestata", (await statusM(m0.id)) === "disputed");
  await as(m0.player_b);
  check("sulla contestata si referta di nuovo", !(await attempt(`select public.report_match_result($1, 2, 1)`, [m0.id])).error);
  await as(m0.player_a);
  check("e l'altro conferma", !(await attempt(`select public.report_match_result($1, 2, 1)`, [m0.id])).error);
  await as("postgres");
  check("partita 0 confermata", (await statusM(m0.id)) === "confirmed");

  const m1 = r1[1];
  await as(m1.player_a);
  check("presenza registrata aprendo la stanza", (await one(`select public.mark_match_seen($1) as v`, [m1.id]))?.v === true);
  check("tavolino troppo presto", /no_show_too_early/.test(err(await attempt(`select public.claim_no_show($1)`, [m1.id]))));
  await as("postgres");
  await db.query(`update public.tournament_matches set ready_at = now() - interval '16 minutes' where id = $1`, [m1.id]);
  await as(m1.player_a);
  check("dopo 15 minuti: vittoria a tavolino", !(await attempt(`select public.claim_no_show($1)`, [m1.id])).error);
  await as("postgres");
  const m1r = await one(`select * from public.tournament_matches where id = $1`, [m1.id]);
  check("2-0 a tavolino per chi c'era", m1r?.status === "confirmed" && m1r.forfeit && m1r.note === "no_show" && m1r.winner === m1.player_a && m1r.score_a === 2 && m1r.score_b === 0);

  const m2 = r1[2];
  await as(m2.player_b);
  await attempt(`select public.send_message($1, 'eccomi')`, [m2.id]);
  await as("postgres");
  await db.query(`update public.tournament_matches set ready_at = now() - interval '16 minutes' where id = $1`, [m2.id]);
  await as(m2.player_a);
  check("chi ha scritto in chat è presente: niente tavolino", /opponent_present/.test(err(await attempt(`select public.claim_no_show($1)`, [m2.id]))));
  await play(m2, 2, 0);

  const m3 = r1[3];
  await as(m3.player_a);
  check("un giocatore non impone risultati", /forbidden/.test(err(await attempt(`select public.set_match_result($1, 2, 0, false)`, [m3.id]))));
  await as(J);
  check("l'arbitro impone 0-2", !(await attempt(`select public.set_match_result($1, 0, 2, false)`, [m3.id])).error);

  const m4 = r1[4];
  const m5 = r1[5];
  await play(m4, 2, 1);
  await as(m4.player_a);
  check("ritiro con l'avversario non ancora noto: nessun errore", !(await attempt(`select public.leave_tournament($1)`, [T])).error);
  await play(m5, 2, 1);
  await as("postgres");
  const r2m = await one(`select * from public.tournament_matches where tournament_id = $1 and round = 2 and position = 2`, [T]);
  check("quando arriva l'avversario la partita gli va a tavolino", r2m?.status === "confirmed" && r2m.winner === m5.player_a && r2m.note === "drop");

  for (const m of r1.slice(6)) {
    const r = await play(m, 2, 1);
    if (r.error) check(`turno 1 pos ${m.position}`, false, r.error);
  }
  await as("postgres");
  const r2 = (await db.query(`select * from public.tournament_matches where tournament_id = $1 and round = 2 order by position`, [T])).rows;
  check("turno 2: 16 partite con i due giocatori, pronte", r2.every((m) => m.player_a && m.player_b) && r2.filter((m) => m.status === "pending").every((m) => m.ready_at));
  await as(r2[0].player_a);
  check("bo3: 3-1 non valido", /bad_score/.test(err(await attempt(`select public.report_match_result($1, 3, 1)`, [r2[0].id]))));
  const pend = r2.filter((m) => m.status === "pending");
  await as(J);
  check("l'arbitro scambia due giocatori del turno 2", !(await attempt(`select public.swap_players($1, $2, $3)`, [T, pend[0].player_a, pend[1].player_a])).error);

  const playRound = async (round) => {
    await as("postgres");
    const ms = (await db.query(`select * from public.tournament_matches where tournament_id = $1 and round = $2 and status = 'pending' order by position`, [T, round])).rows;
    for (const m of ms) {
      const r = await play(m, 2, 0);
      if (r.error) check(`turno ${round} pos ${m.position}`, false, r.error);
    }
  };
  for (const round of [2, 3, 4]) await playRound(round);
  await as("postgres");
  const semis = (await db.query(`select * from public.tournament_matches where tournament_id = $1 and round = 5 order by position`, [T])).rows;
  check("semifinali con 4 giocatori", semis.length === 2 && semis.every((m) => m.player_a && m.player_b));
  const semiPlayers = semis.flatMap((m) => [m.player_a, m.player_b]);
  await as(null);
  const pubDecks = ((await attempt(`select user_id from public.tournament_decks where tournament_id = $1`, [T])).rows ?? []).map((r) => r.user_id);
  check("top 4: le loro liste sono pubbliche, le altre no", pubDecks.length === 4 && semiPlayers.every((u) => pubDecks.includes(u)), String(pubDecks.length));
  await playRound(5);
  await as("postgres");
  const fin = await one(`select * from public.tournament_matches where tournament_id = $1 and round = 6`, [T]);
  check("finale pronta", Boolean(fin?.player_a && fin?.player_b && fin?.ready_at));
  await as(fin.player_a);
  check("finale al meglio delle cinque: 2-1 non valido", /bad_score/.test(err(await attempt(`select public.report_match_result($1, 2, 1)`, [fin.id]))));
  check("finale: 3-2 valido", !(await play(fin, 3, 2)).error);
  await as(J);
  check("l'arbitro non annulla il torneo", /forbidden/.test(err(await attempt(`select public.cancel_tournament($1)`, [T]))));
  check("l'arbitro chiude il torneo", !(await attempt(`select public.finish_tournament($1, 'GG')`, [T])).error);
  await as(null);
  check("a torneo finito tutte le liste sono pubbliche", ((await attempt(`select user_id from public.tournament_decks where tournament_id = $1`, [T])).rows ?? []).length === 68);

  // ---------- torneo senza le opzioni nuove: come prima ----------
  await as(O);
  await attempt(`insert into public.tournaments (slug, organizer, name, starts_at, size, best_of) values ('zzdry-plain', $1, 'Prova semplice', now() + interval '1 day', 8, 1)`, [O]);
  const T2 = (await one(`select id from public.tournaments where slug = 'zzdry-plain'`))?.id;
  for (let i = 0; i < 8; i++) {
    await as(P[i]);
    await attempt(`select public.join_tournament($1)`, [T2]);
  }
  await as(P[9]);
  check("senza check-in, torneo pieno: 'full'", /full/.test(err(await attempt(`select public.join_tournament($1)`, [T2]))));
  for (let i = 0; i < 8; i++) {
    await as(P[i]);
    await attempt(`select public.submit_tournament_decks($1, $2::jsonb)`, [T2, JSON.stringify([om("merlin", i)])]);
  }
  await as("postgres");
  check("senza check-in parte da solo quando è pieno", (await one(`select status from public.tournaments where id = $1`, [T2]))?.status === "running");
  const mm = await one(`select * from public.tournament_matches where tournament_id = $1 and round = 1 order by position limit 1`, [T2]);
  await as(mm.player_b);
  check("senza liste segrete l'avversario vede le liste complete", ((await attempt(`select user_id from public.tournament_decks where tournament_id = $1`, [T2])).rows ?? []).length === 2);
  await as(mm.player_a);
  check("tavolino spento in un torneo senza il tempo", /no_show_off/.test(err(await attempt(`select public.claim_no_show($1)`, [mm.id]))));
  check("bo1: 1-0 valido", !(await play(mm, 1, 0)).error);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati, ${passed} passati (rollback fatto: il database non è cambiato)` : `\nTutti i ${passed} controlli passati (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs`);
process.exit(failures ? 1 : 0);
