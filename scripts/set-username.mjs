// Cambia il nome utente (e, se si vuole, il nome mostrato) di un profilo della community. Lo fa solo lo staff con la
// connessione diretta: `username` è un campo riservato (trigger protect_profile_badge in supabase/schema.sql, che lascia
// passare solo auth.uid() nullo o un admin) e `display_name` non ha nessun grant per gli utenti.
// Nato il 06/10/2026 per la segnalazione di Fabio (EagleAxe93): il suo profilo era nato dal primo accesso con il link via
// email, quindi handle_new_user aveva preso il nome dalla parte prima della @; l'accesso con Discord fatto dopo riusa lo
// stesso account e non tocca il profilo.
// Uso: node scripts/set-username.mjs <username|email|parte del nome> <nuovo-username> [--display "Nome mostrato"] [--dry-run]
// Il nuovo nome utente: minuscole, cifre e trattini, da 3 a 39 caratteri, né all'inizio né alla fine un trattino, mai
// "bot-<n>" (riservato ai bot di seed-bots.mjs), e dev'essere libero. Le pagine (/u/<nome>, /@<nome>, mazzi, elenchi,
// sitemap) si aggiornano da sole entro qualche minuto (ISR); il vecchio indirizzo /u/<vecchio> risponde 404.
import { readFileSync } from "node:fs";
import pg from "pg";

const USERNAME = /^[a-z0-9][a-z0-9-]{1,37}[a-z0-9]$/;
const RESERVED = /^bot-[0-9]+(-[0-9]+)?$/;
const DISPLAY_MAX = 40;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const displayAt = args.indexOf("--display");
const display = displayAt >= 0 ? String(args[displayAt + 1] ?? "").trim() : null;
// senza --display, displayAt è -1 e nessun indice va saltato
const positional = args.filter((a, i) => a !== "--dry-run" && a !== "--display" && (displayAt < 0 || i !== displayAt + 1));
const [needle, wanted] = positional;

if (!needle || !wanted) {
  console.error('Uso: node scripts/set-username.mjs <username|email|nome> <nuovo-username> [--display "Nome mostrato"] [--dry-run]');
  process.exit(1);
}
const next = wanted.trim().toLowerCase();
if (!USERNAME.test(next) || RESERVED.test(next)) {
  console.error(`"${wanted}" non va bene come nome utente: minuscole, cifre e trattini, da 3 a 39 caratteri, non "bot-<n>".`);
  process.exit(1);
}
if (display !== null && (display === "" || display.length > DISPLAY_MAX || /[\p{Cc}\p{Cf}]/u.test(display))) {
  console.error(`Il nome mostrato va da 1 a ${DISPLAY_MAX} caratteri, senza caratteri di controllo.`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
try {
  const r = await db.query(
    `select p.id, p.username, p.display_name, p.badge, u.email
       from public.profiles p join auth.users u on u.id = p.id
      where p.username ilike $1 or p.display_name ilike $2 or u.email ilike $1
      order by p.created_at desc limit 5`,
    [needle, `%${needle}%`],
  );
  if (!r.rows.length) {
    console.log(`Nessun profilo trovato per "${needle}".`);
    process.exit(2);
  }
  if (r.rows.length > 1) console.log("Più profili corrispondono, uso il primo:", r.rows.map((x) => `${x.username} (${x.email})`).join(", "));
  const target = r.rows[0];
  const taken = await db.query("select 1 from public.profiles where username = $1 and id <> $2", [next, target.id]);
  if (taken.rowCount) {
    console.error(`Il nome utente "${next}" è già di un altro profilo.`);
    process.exit(3);
  }
  const newDisplay = display ?? target.display_name;
  console.log(`${target.display_name ?? target.username} (@${target.username}, ${target.email}, tag ${target.badge ?? "community"})`);
  console.log(`  nome utente:  ${target.username} → ${next}`);
  console.log(`  nome mostrato: ${target.display_name ?? "(vuoto)"} → ${newDisplay ?? "(vuoto)"}`);
  if (dryRun) {
    console.log("Prova a secco: niente scritto.");
  } else {
    await db.query("update public.profiles set username = $1, display_name = $2 where id = $3", [next, newDisplay, target.id]);
    console.log(`Fatto. Pagina pubblica: https://originsmeta.com/it/u/${next} (anche /@${next}); le pagine si aggiornano entro qualche minuto, /u/${target.username} risponderà 404.`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 4;
} finally {
  await db.end();
}
