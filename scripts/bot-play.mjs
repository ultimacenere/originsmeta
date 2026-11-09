// Prova generale di un torneo (05/10/2026): chiude le partite pronte fra due bot di scripts/seed-bots.mjs (vincitore a
// caso, punteggio valido per la lunghezza della partita, finale compresa) e fa avanzare il tabellone con le funzioni del
// database (tm_need, tm_propagate), come un risultato imposto dall'arbitro. Le partite con un giocatore vero non le
// tocca: lì si gioca, si referta, si prova la vittoria a tavolino (i bot non aprono mai la stanza partita).
// Dall'08/11/2026 (blocco BRACKET E TOP CUT): nei tornei con il ban i due bot bannano un mazzo a caso prima di chiudere
// la partita, e le partite della fase finale in pausa (tm_held) restano ferme finché lo staff non la avvia.
// Dal 09/11/2026 (blocco SVIZZERA, GIRONI E SIDEBOARD): in una svizzera, con --all, quando il turno è chiuso genera il
// turno dopo come "Genera il turno successivo" (tm_swiss_round + tm_ready_round), fino ai turni previsti, e si ferma lì:
// la Top la crea lo staff dalla gestione ("Chiudi la svizzera e avvia la Top"). Nei gironi chiude le partite fra bot di
// tutti i turni. Le partite di un giocatore vero bloccano il turno dopo finché non si giocano (o --with-humans).
// La connessione diretta scavalca RLS e RPC: solo per le prove dello staff, mai su un torneo vero.
// Uso: node scripts/bot-play.mjs <TAG>                → chiude le partite fra bot pronte adesso (un giro)
//      node scripts/bot-play.mjs <TAG> --all          → ripete finché restano partite fra bot da chiudere
//      opzioni: --until <turno>  solo fino a quel turno (es. 4 = la qualificazione di un torneo da 256 con la Top 16)
//               --leave <n>      lascia da giocare le ultime n partite fra bot che chiuderebbe (per mostrare partite in corso)
//               --with-humans    chiude anche le partite con un giocatore vero (vincitore a caso): solo nei tornei di prova
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const envFile = existsSync(new URL("../.env.local", import.meta.url)) ? new URL("../.env.local", import.meta.url) : "C:/Users/User/Desktop/originsmeta/.env.local";
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const argv = process.argv.slice(2);
const all = argv.includes("--all");
const humans = argv.includes("--with-humans");
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const until = opt("--until") ? Number(opt("--until")) : Infinity;
const leave = opt("--leave") ? Math.max(0, Number(opt("--leave"))) : 0;
const skipValues = new Set([opt("--until"), opt("--leave")].filter(Boolean));
const arg = argv.find((a) => !a.startsWith("--") && !skipValues.has(a));
if (!arg) {
  console.error("Uso: node scripts/bot-play.mjs <TAG> [--all] [--until <turno>] [--leave <n>] [--with-humans]");
  process.exit(1);
}
const tag = arg.toUpperCase().startsWith("OM-") ? arg.toUpperCase() : `OM-${arg.toUpperCase()}`;
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: env.SUPABASE_DB_SSL === "off" ? false : { rejectUnauthorized: false } });
await db.connect();

const { rows: trows } = await db.query("select id, name, status, format from public.tournaments where tag = $1", [tag]);
const t = trows[0];
if (!t) {
  console.error(`Nessun torneo con tag ${tag}`);
  process.exit(2);
}
if (t.status !== "running") {
  console.error(`Il torneo "${t.name}" non è in corso (stato ${t.status})`);
  process.exit(3);
}
// il blocco BRACKET E TOP CUT c'è? (prima della migrazione niente ban né pausa)
const stages = (await db.query("select to_regproc('public.tm_held') is not null as held, to_regclass('public.tournament_bans') is not null as bans")).rows[0];

const BOTS = "^bot-[0-9]+(-[0-9]+)?$";
let closed = 0;
let banned = 0;
let generated = 0;
/** Svizzera: turno chiuso e altri turni previsti → genera il prossimo (come swiss_next_round, senza i controlli dello staff). */
async function nextSwissRound() {
  if (t.format !== "swiss") return false;
  const { rows } = await db.query(
    `select t.swiss_rounds,
            (select coalesce(max(round), 0) from public.tournament_matches where tournament_id = t.id and stage = 'swiss') as cur,
            exists (select 1 from public.tournament_matches where tournament_id = t.id and stage = 'swiss' and status in ('pending', 'reported', 'disputed')) as open,
            exists (select 1 from public.tournament_matches where tournament_id = t.id and (stage is null or stage = 'champion')) as over
       from public.tournaments t where t.id = $1`,
    [t.id],
  );
  const r = rows[0];
  if (!r || r.open || r.over || r.cur >= (r.swiss_rounds ?? 0) || r.cur + 1 > until) return false;
  await db.query("begin");
  try {
    await db.query("select 1 from public.tournaments where id = $1 for update", [t.id]);
    await db.query("select public.tm_swiss_round($1, $2)", [t.id, r.cur + 1]);
    await db.query("select public.tm_ready_round($1, $2)", [t.id, r.cur + 1]);
    await db.query("commit");
    generated++;
    return true;
  } catch (e) {
    await db.query("rollback");
    console.error(`turno svizzero ${r.cur + 1}: ${e.message}`);
    return false;
  }
}
for (let pass = 0; pass < 40; pass++) {
  const { rows: found } = await db.query(
    `select m.id, m.round, m.position, m.player_a, m.player_b from public.tournament_matches m
       join public.profiles a on a.id = m.player_a join public.profiles b on b.id = m.player_b
      where m.tournament_id = $1 and m.status in ('pending', 'reported') and m.round <= $3
        and ($4 or (a.username ~ $2 and b.username ~ $2))
        ${stages.held ? "and not public.tm_held(m.tournament_id, m.round)" : ""}
      order by m.round, m.position`,
    [t.id, BOTS, Number.isFinite(until) ? until : 1000, humans],
  );
  // --leave: le ultime n del giro restano da giocare (solo al primo giro, poi il tabellone avanza solo fin lì)
  const ready = pass === 0 && leave ? found.slice(0, Math.max(0, found.length - leave)) : found;
  if (!ready.length) {
    if (all && (await nextSwissRound())) continue;
    break;
  }
  for (const m of ready) {
    await db.query("begin");
    try {
      // stesso ordine dei lock delle RPC: prima il torneo, poi la partita
      await db.query("select 1 from public.tournaments where id = $1 for update", [t.id]);
      const { rows } = await db.query("select status from public.tournament_matches where id = $1 for update", [m.id]);
      if (!rows[0] || !["pending", "reported"].includes(rows[0].status)) {
        await db.query("rollback");
        continue;
      }
      if (stages.bans && (await db.query("select public.tm_ban_applies($1, $2) as v", [t.id, m.round])).rows[0].v) {
        // un mazzo a caso a testa, come farebbe ban_deck (con la Leggendaria per le statistiche)
        const { rows: dk } = await db.query("select user_id, legendaries, (select conquest_decks from public.tournaments where id = $1) as n from public.tournament_decks where tournament_id = $1 and user_id = any($2::uuid[])", [t.id, [m.player_a, m.player_b]]);
        const legsOf = (uid) => dk.find((r) => r.user_id === uid)?.legendaries ?? [];
        const count = dk[0]?.n ?? 3;
        for (const [who, target] of [[m.player_a, m.player_b], [m.player_b, m.player_a]]) {
          const idx = Math.floor(Math.random() * count);
          const r = await db.query("insert into public.tournament_bans (match_id, user_id, target, deck, legendary) values ($1, $2, $3, $4, nullif($5, '')) on conflict (match_id, user_id) do nothing", [m.id, who, target, idx, legsOf(target)[idx] ?? ""]);
          banned += r.rowCount;
        }
      }
      const need = (await db.query("select public.tm_need($1, $2) as n", [t.id, m.round])).rows[0].n;
      const aWins = Math.random() < 0.5;
      const loser = Math.floor(Math.random() * need);
      await db.query(
        `update public.tournament_matches set winner = $2, status = 'confirmed', reported_by = null, score_a = $3, score_b = $4,
                seen_a = coalesce(seen_a, now()), seen_b = coalesce(seen_b, now()) where id = $1`,
        [m.id, aWins ? m.player_a : m.player_b, aWins ? need : loser, aWins ? loser : need],
      );
      await db.query("select public.tm_propagate($1)", [m.id]);
      await db.query("commit");
      closed++;
    } catch (e) {
      await db.query("rollback");
      console.error(`partita ${m.id}: ${e.message}`);
    }
  }
  if (!all || (pass === 0 && leave)) break;
}
const { rows: left } = await db.query(
  `select count(*) filter (where status in ('pending', 'reported', 'disputed') and player_a is not null and player_b is not null)::int as ready,
          count(*) filter (where status in ('pending', 'reported', 'disputed'))::int as open
     from public.tournament_matches where tournament_id = $1`,
  [t.id],
);
console.log(`Torneo "${t.name}" (${tag}): ${closed} partite chiuse${banned ? ` (${banned} ban)` : ""}${generated ? `, ${generated} turni svizzeri generati` : ""}; ${left[0].ready} partite con i due giocatori ancora da giocare, ${left[0].open} in tutto.`);
await db.end();
