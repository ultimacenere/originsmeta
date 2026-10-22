// Numeri della dashboard privata (22/10/2026): chiama https://originsmeta.com/api/staff/kpi con il segreto del cron
// (CRON_SECRET di .env.local, mai stampato) e salva i giorni in un file JSON per la dashboard "Numeri di OriginsMeta" su
// claude.ai: iscrizioni, download del tracker, mazzi creati per giorno di Roma dal 15/09/2026, con `complete` = giorno
// finito. Lo lancia l'aggiornamento di ogni mattina di Claude.
// Uso: node scripts/kpi-pull.mjs <file di uscita.json> [https://originsmeta.com]
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const out = process.argv[2];
const site = (process.argv[3] ?? "https://originsmeta.com").replace(/\/+$/, "");
if (!out) {
  console.error("Uso: node scripts/kpi-pull.mjs <file di uscita.json>");
  process.exit(2);
}
const envPath = existsSync(".env.local") ? ".env.local" : "C:/Users/User/Desktop/originsmeta/.env.local";
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const secret = env.CRON_SECRET ?? "";
if (secret.length < 32) {
  console.error("CRON_SECRET mancante o troppo corto in .env.local");
  process.exit(1);
}

const res = await fetch(`${site}/api/staff/kpi?from=2026-09-15`, { headers: { authorization: `Bearer ${secret}` }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
const body = await res.json().catch(() => null);
if (!res.ok || !body?.ok || !Array.isArray(body.days)) {
  console.error(`La rotta ha risposto ${res.status}: ${body?.error ?? body?.skipped ?? "risposta non valida"}`);
  process.exit(1);
}
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
const days = body.days.map((d) => ({ ...d, complete: d.day < today }));
writeFileSync(out, JSON.stringify(days));
const done = days.filter((d) => d.complete);
console.log(`ok: ${days.length} giorni (dal ${days[0]?.day} al ${days.at(-1)?.day}), ultimo completo ${done.at(-1)?.day ?? "nessuno"} → ${out}`);
