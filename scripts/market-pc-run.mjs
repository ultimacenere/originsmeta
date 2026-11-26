// Giro dei prezzi del Mercato di Steam dal PC di Pierluigi (25/11/2026). Steam risponde 429 ai server di GitHub
// e di Vercel, dal PC no: l'attività pianificata "OriginsMeta Mercato" lancia questo file ogni 10 minuti; GitHub
// Actions resta la riserva oraria. Ogni giro:
//   1. aggiorna repo\ all'ultimo main (clone leggero con i soli quattro file che servono);
//   2. lancia repo\scripts\market-collect.mjs con CRON_SECRET letto da secret.env (mai nel repository);
//   3. scrive l'uscita in log\AAAA-MM-GG.log e tiene 14 giorni di log.
// Senza rete o con git in errore usa i file che ha già. Nessuna dipendenza: solo Node e git.
//
// Installazione (copia di questo file in C:\Users\User\originsmeta-market\run.mjs; la cartella non è nel repository):
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/ultimacenere/originsmeta.git repo
//   git -C repo sparse-checkout set --no-cone scripts/market-collect.mjs src/lib/market/market.ts src/lib/supabase/env.ts src/lib/data/woo-cards.json
//   secret.env con la riga CRON_SECRET=… presa da .env.local (solo l'utente può leggerlo)
//   attività pianificata: conhost.exe --headless "<node.exe>" "C:\Users\User\originsmeta-market\run.mjs",
//   ogni 10 minuti, solo con l'utente collegato, durata massima 9 minuti, mai due insieme (README, "Tracker dei prezzi").
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, "repo");
const logDir = path.join(here, "log");
mkdirSync(logDir, { recursive: true });

const now = new Date();
const day = now.toISOString().slice(0, 10);
const logFile = path.join(logDir, `${day}.log`);
const log = (text) => appendFileSync(logFile, text.endsWith("\n") ? text : `${text}\n`);

log(`\n=== ${now.toISOString()} ===`);

const git = (...args) => spawnSync("git", ["-C", repo, ...args], { encoding: "utf8", timeout: 60_000, windowsHide: true });
const fetched = git("fetch", "-q", "--depth", "1", "origin", "main");
if (fetched.status === 0) {
  const reset = git("reset", "-q", "--hard", "FETCH_HEAD");
  if (reset.status !== 0) log(`git reset: ${(reset.stderr || reset.error?.message || "").trim()}`);
} else {
  log(`git fetch non riuscito, uso i file che ho: ${(fetched.stderr || fetched.error?.message || "").trim()}`);
}
const head = git("log", "--oneline", "-1");
if (head.status === 0) log(`main: ${head.stdout.trim()}`);

const env = { ...process.env };
try {
  for (const line of readFileSync(path.join(here, "secret.env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  log("manca secret.env (CRON_SECRET=…): giro non fatto");
  process.exit(1);
}

const run = spawnSync(process.execPath, [path.join(repo, "scripts", "market-collect.mjs"), "--budget", "240"], {
  cwd: repo,
  env,
  encoding: "utf8",
  timeout: 8 * 60_000,
  windowsHide: true,
});
log(`${run.stdout ?? ""}${run.stderr ?? ""}`.trim() || "(nessuna uscita)");
log(`uscita: ${run.status ?? run.error?.message ?? "?"}`);

for (const name of readdirSync(logDir)) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})\.log$/);
  if (m && now - new Date(`${m[1]}T00:00:00Z`) > 14 * 86_400_000) rmSync(path.join(logDir, name));
}
process.exit(run.status ?? 1);
