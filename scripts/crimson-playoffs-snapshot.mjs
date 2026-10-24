#!/usr/bin/env node
/*
  Fotografia del tabellone dei playoff della Crimson Cup (25/10/2026): legge la risposta pubblica di Tourney Bot e la scrive
  in src/lib/data/crimsonPlayoffsSnapshot.json, nella stessa forma ma SENZA gli id Discord (i giocatori restano nel
  repository solo con il posto e il nome): al posto di `user_id` e `winner` c'è il posto del giocatore, che
  `parsePlayoffs` confronta allo stesso modo. La pagina la usa quando Tourney Bot non risponde durante la build, i test
  di crimsonPlayoffs.test.ts la leggono come dato di prova.

    node scripts/crimson-playoffs-snapshot.mjs            # torneo dei playoff (73203)
    node scripts/crimson-playoffs-snapshot.mjs --check    # legge e controlla, non scrive
*/
import fs from "node:fs";

const ID = 73203;
const OUT = new URL("../src/lib/data/crimsonPlayoffsSnapshot.json", import.meta.url);
const check = process.argv.includes("--check");

const res = await fetch(`https://tourneybot.gg/api/v1/tourneys/${ID}`, { headers: { "user-agent": "OriginsMeta (+https://originsmeta.com)" } });
if (!res.ok) {
  console.error(`Tourney Bot ha risposto ${res.status}`);
  process.exit(1);
}
const raw = await res.json();
const t = raw.tourney;
// il vincitore si riconosce partita per partita (gli id della risposta hanno perso le ultime cifre: fra due giocatori
// qualsiasi potrebbero coincidere, fra i due di una partita no)
const winnerSeat = (g) => {
  if (!g.winner) return null;
  for (const p of [g.player1, g.player2]) if (p && String(p.user_id) === String(g.winner)) return String(p.id);
  return null;
};

const side = (p) => (p ? { id: p.id, name: p.name, score: p.score ?? 0, user_id: String(p.id) } : null);
const out = {
  fetchedAt: new Date().toISOString(),
  tourney: {
    id: t.id,
    name: t.name,
    status: t.status,
    bracket_type: t.bracket_type,
    best_of: t.best_of,
    participant_size: t.participant_size,
    start_time: t.start_time,
  },
  players: raw.players.map((p) => ({ id: p.id, name: p.name })),
  games: raw.games.map((g) => ({
    id: g.id,
    round: g.round,
    winner: winnerSeat(g),
    player1: side(g.player1),
    player2: side(g.player2),
  })),
};
const done = out.games.filter((g) => g.winner).length;
console.log(`${t.name}: ${out.games.length} partite, ${done} finite, letto alle ${out.fetchedAt}`);
if (!check) {
  fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
  console.log(`scritto ${OUT.pathname}`);
}
