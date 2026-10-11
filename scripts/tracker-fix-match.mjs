// Corregge una partita di OriginsMeta Analytics già arrivata sul sito (12/10/2026): il sito la salva una volta sola
// (`tracker_submit`: on conflict do nothing), quindi una partita registrata male dall'app non si corregge rimandandola.
// Uso: node scripts/tracker-fix-match.mjs <utente> <id della partita> <W|L|delete> [--apply]
// Senza --apply mostra la riga e che cosa cambierebbe, e non scrive niente. Serve la password del database in .env.local.
// Primo uso: la vittoria contro il boss dell'11/10 alle 23:20 UTC registrata come sconfitta (stendardo giallo "BOSS
// SCONFITTO!") e il doppione della vittoria delle 23:05 (statistiche del gioco arrivate dopo un riavvio dell'app).
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const [username, id, action] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
if (!username || !/^[0-9a-f]{32}$/.test(id ?? "") || !["W", "L", "delete"].includes(action ?? "")) {
  console.error("uso: node scripts/tracker-fix-match.mjs <utente> <id di 32 caratteri> <W|L|delete> [--apply]");
  process.exit(1);
}
// pg dal checkout (anche da un worktree senza node_modules: quello del checkout principale)
const roots = [new URL("../package.json", import.meta.url), new URL("../../../../package.json", import.meta.url)].filter((u) => existsSync(new URL("node_modules/pg", u)));
if (!roots.length) throw new Error("manca il pacchetto pg: npm ci nel checkout");
const pg = createRequire(roots[0])("pg");
const envFile = [new URL("../.env.local", import.meta.url), new URL("../../../../.env.local", import.meta.url)].find((u) => existsSync(u));
if (!envFile) throw new Error("manca .env.local con la password del database");
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
try {
  await db.query("begin");
  const r = await db.query(
    `select m.owner, m.id, m.ended_at, m.result, m.deck_name, m.opponent_legendary, m.turns, jsonb_array_length(m.plays) as giocate
       from public.tracked_matches m join public.profiles p on p.id = m.owner
      where p.username = $1 and m.id = $2`,
    [username, id],
  );
  if (r.rows.length !== 1) throw new Error(`partita non trovata per ${username}: ${id}`);
  const row = r.rows[0];
  console.log("partita:", JSON.stringify({ ...row, owner: undefined }));
  if (action === "delete") {
    const d = await db.query("delete from public.tracked_matches where owner = $1 and id = $2", [row.owner, id]);
    console.log(`cancellata: ${d.rowCount} riga`);
  } else if (row.result === action) {
    console.log(`l'esito è già ${action}: niente da cambiare`);
  } else {
    const u = await db.query("update public.tracked_matches set result = $3 where owner = $1 and id = $2", [row.owner, id, action]);
    console.log(`esito ${row.result} -> ${action}: ${u.rowCount} riga`);
  }
  await db.query(apply ? "commit" : "rollback");
  console.log(apply ? "scritto nel database" : "prova: niente scritto (aggiungi --apply)");
} catch (e) {
  await db.query("rollback").catch(() => {});
  throw e;
} finally {
  await db.end();
}
