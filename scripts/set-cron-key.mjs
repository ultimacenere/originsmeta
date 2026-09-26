// Registra nel database l'impronta del segreto della rotta /api/cron/live (pacchetto SEGUI, 27/09/2026).
// La rotta, chiamata dal cron di Vercel ogni 10 minuti, crea gli avvisi di diretta con la RPC notify_live, che gira senza
// sessione (anon) e parte solo con il segreto giusto: il database ne tiene l'impronta SHA-256 nella tabella
// public.notify_keys (nessun client la legge). Il segreto vero sta solo nelle variabili d'ambiente.
//
// Uso (dopo la migrazione del pacchetto SEGUI):
//   1. genera un segreto lungo, per esempio: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
//   2. mettilo in CRON_SECRET su Vercel (Settings → Environment Variables, Production, tipo Secret) e in .env.local
//   3. node scripts/set-cron-key.mjs        (legge CRON_SECRET e la connessione al database da .env.local)
// Se cambi il segreto su Vercel, rilancia lo script con quello nuovo: finché non coincidono, gli avvisi di diretta non partono.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";

/** Lunghezza minima: CRON_SECRET_MIN in src/lib/community/notifications.ts e il controllo di notify_live. */
const MIN = 32;

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const secret = (process.env.CRON_SECRET ?? env.CRON_SECRET ?? "").trim();
if (secret.length < MIN || secret.length > 256) {
  console.error(`CRON_SECRET manca o non va bene: serve un segreto di ${MIN}-256 caratteri, lo stesso di Vercel (in .env.local o nell'ambiente).`);
  process.exit(1);
}
const hash = createHash("sha256").update(secret, "utf8").digest("hex");

const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
try {
  await db.query(
    "insert into public.notify_keys (name, key_hash, updated_at) values ('live', $1, now()) on conflict (name) do update set key_hash = excluded.key_hash, updated_at = now()",
    [hash],
  );
  console.log(`Impronta del segreto registrata (sha256 …${hash.slice(-8)}): gli avvisi di diretta partono al prossimo giro del cron.`);
} catch (e) {
  if (e.code === "42P01") console.error("Manca la tabella public.notify_keys: applica prima la migrazione del pacchetto SEGUI.");
  else console.error(e.message);
  process.exitCode = 2;
} finally {
  await db.end();
}
