// Sola lettura (11/10/2026): quante partite registrate dall'app corrispondono ai mazzi pubblicati sul sito, con la lista
// esatta (Leggendaria + 12 carte uguali) o simile (stessa Leggendaria e almeno 10 carte su 12 uguali). Solo conteggi.
// Uso: node scripts/tracker-deck-match.mjs
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const envFile = [new URL("../.env.local", import.meta.url), new URL("../../../../.env.local", import.meta.url)].find((u) => existsSync(u));
if (!envFile) throw new Error("manca .env.local con la password del database");
const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const cards = JSON.parse(readFileSync(new URL("../tracker/src/cards.json", import.meta.url), "utf8"));
const keyOf = Object.fromEntries(Object.entries(cards).map(([k, c]) => [c.s, k]));
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query("begin read only");
const played = (
  await db.query(`select deck_legendary, deck_cards, count(*)::int as games, count(*) filter (where result = 'W')::int as wins, count(distinct owner)::int as players
    from public.tracked_matches where cardinality(deck_cards) = 13 group by deck_legendary, deck_cards`)
).rows;
const decks = (await db.query(`select slug, name, legendary, cards from public.community_decks where status = 'published'`)).rows;
await db.query("rollback");
await db.end();

const out = [];
for (const d of decks) {
  const leg = keyOf[d.legendary];
  const base = [...new Set((Array.isArray(d.cards) ? d.cards : []).map((c) => keyOf[typeof c === "string" ? c : c?.slug]).filter(Boolean))].filter((k) => k !== leg);
  let exact = { games: 0, wins: 0, players: new Set() };
  let similar = { games: 0, wins: 0, players: 0 };
  for (const p of played) {
    if (p.deck_legendary !== leg) continue;
    const pb = p.deck_cards.filter((k) => k !== leg);
    const same = pb.filter((k) => base.includes(k)).length;
    if (same === 12 && base.length === 12) {
      exact.games += p.games;
      exact.wins += p.wins;
    }
    if (same >= 10) {
      similar.games += p.games;
      similar.wins += p.wins;
      similar.players += p.players;
    }
  }
  if (exact.games || similar.games) out.push({ mazzo: d.name, esatta: `${exact.games} (${exact.wins} V)`, simile: `${similar.games} (${similar.wins} V)`, giocatori_simile: similar.players });
}
console.log(`mazzi pubblicati: ${decks.length}; liste diverse giocate con l'app: ${played.length}; partite: ${played.reduce((s, p) => s + p.games, 0)}`);
console.table(out);
