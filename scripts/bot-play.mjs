// Prova generale di un torneo (05/10/2026): chiude le partite pronte fra due bot di scripts/seed-bots.mjs (vincitore a
// caso, punteggio valido per la lunghezza della partita, finale compresa) e fa avanzare il tabellone con le funzioni del
// database (tm_need, tm_propagate), come un risultato imposto dall'arbitro. Le partite con un giocatore vero non le
// tocca: lì si gioca, si referta, si prova la vittoria a tavolino (i bot non aprono mai la stanza partita).
// La connessione diretta scavalca RLS e RPC: solo per le prove dello staff, mai su un torneo vero.
// Uso: node scripts/bot-play.mjs <TAG>          → chiude le partite fra bot pronte adesso (un giro)
//      node scripts/bot-play.mjs <TAG> --all    → ripete finché restano partite fra bot da chiudere
import { readFileSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const argv = process.argv.slice(2);
const all = argv.includes("--all");
const arg = argv.find((a) => !a.startsWith("--"));
if (!arg) {
  console.error("Uso: node scripts/bot-play.mjs <TAG> [--all]");
  process.exit(1);
}
const tag = arg.toUpperCase().startsWith("OM-") ? arg.toUpperCase() : `OM-${arg.toUpperCase()}`;
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();

const { rows: trows } = await db.query("select id, name, status from public.tournaments where tag = $1", [tag]);
const t = trows[0];
if (!t) {
  console.error(`Nessun torneo con tag ${tag}`);
  process.exit(2);
}
if (t.status !== "running") {
  console.error(`Il torneo "${t.name}" non è in corso (stato ${t.status})`);
  process.exit(3);
}

const BOTS = "^bot-[0-9]+(-[0-9]+)?$";
let closed = 0;
for (let pass = 0; pass < 10; pass++) {
  const { rows: ready } = await db.query(
    `select m.id, m.round, m.player_a, m.player_b from public.tournament_matches m
       join public.profiles a on a.id = m.player_a join public.profiles b on b.id = m.player_b
      where m.tournament_id = $1 and m.status in ('pending', 'reported') and a.username ~ $2 and b.username ~ $2
      order by m.round, m.position`,
    [t.id, BOTS],
  );
  if (!ready.length) break;
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
      const need = (await db.query("select public.tm_need($1, $2) as n", [t.id, m.round])).rows[0].n;
      const aWins = Math.random() < 0.5;
      const loser = Math.floor(Math.random() * need);
      await db.query(
        `update public.tournament_matches set winner = $2, status = 'confirmed', reported_by = null, score_a = $3, score_b = $4 where id = $1`,
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
  if (!all) break;
}
const { rows: left } = await db.query(
  "select count(*) filter (where status in ('pending', 'reported', 'disputed') and player_a is not null and player_b is not null)::int as ready, count(*) filter (where status in ('pending', 'reported', 'disputed'))::int as open from public.tournament_matches where tournament_id = $1",
  [t.id],
);
console.log(`Torneo "${t.name}" (${tag}): ${closed} partite fra bot chiuse; ${left[0].ready} partite pronte ancora da giocare, ${left[0].open} in tutto.`);
await db.end();
