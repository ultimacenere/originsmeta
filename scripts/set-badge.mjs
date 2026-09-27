// Assegna il ruolo (tag, colonna `badge`) a un profilo della community: community (default), creator, author, pro, staff.
// Ruoli del 27/09/2026 (Pierluigi: "Staff → tag Staff; Creator → tag Creator; Autore → tag Autore; Community → tag
// Community"; "Pro rimane, Influencer scompare"). L'Autore si può scrivere anche "autore", "autor" o "author".
// "influencer" non esiste più: la migrazione del 27/09 l'ha trasformato in creator, e qui si rifiuta con un messaggio.
// Il ruolo lo assegna solo lo staff, mai l'utente (note per sito 5.0, 15/09/2026). Permessi in src/lib/community/badges.ts
// (lo stesso elenco di tag: badges.test.ts lo confronta con questo file).
// Uso: node scripts/set-badge.mjs <username|email|parte del nome> <community|creator|author|pro|staff>
import { readFileSync } from "node:fs";
import pg from "pg";

const BADGES = ["community", "creator", "author", "pro", "staff"];
/** nomi del ruolo Autore nelle lingue del sito */
const ALIAS = { autore: "author", autor: "author" };
/** chi pubblica sul calendario e carica una copertina propria dei tornei (con gli admin): LISTING_BADGES di badges.ts */
const LISTING = ["creator", "pro", "staff"];
/** chi pubblica guide della community senza passare dallo staff (con gli admin): GUIDE_BADGES di badges.ts */
const GUIDES = ["author", "creator", "pro", "staff"];
const [needle, badgeRaw] = process.argv.slice(2);
const typed = String(badgeRaw ?? "").trim().toLowerCase();
if (typed === "influencer") {
  console.error('Il ruolo "influencer" non esiste più dal 27/09/2026: usa "creator" (stesso colore e stessi permessi).');
  process.exit(1);
}
const badge = ALIAS[typed] ?? typed;
if (!needle || !BADGES.includes(badge)) {
  console.error(`Uso: node scripts/set-badge.mjs <username|email|nome> <${BADGES.join("|")}>  (per l'Autore vale anche "autore")`);
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
const r = await db.query(
  `select p.id, p.username, p.display_name, p.badge, u.email
     from public.profiles p join auth.users u on u.id = p.id
    where p.username ilike $1 or p.display_name ilike $2 or u.email ilike $1
    order by p.created_at desc limit 5`,
  [needle, `%${needle}%`],
);
if (!r.rows.length) {
  console.log(`Nessun profilo trovato per "${needle}".`);
  await db.end();
  process.exit(2);
}
if (r.rows.length > 1) console.log("Più profili corrispondono, uso il primo:", r.rows.map((x) => `${x.username} (${x.email})`).join(", "));
const target = r.rows[0];
try {
  await db.query("update public.profiles set badge = $1 where id = $2", [badge, target.id]);
} catch (e) {
  // prima della migrazione del 27/09/2026 il vincolo profiles_badge_check non conosce ancora "author"
  if (e.code === "23514") console.error(`Il database rifiuta "${badge}": applica prima la migrazione (supabase/schema.sql, blocco "27/09/2026: TAG E BIO").`);
  else console.error(e.message);
  await db.end();
  process.exit(3);
}
console.log(`${target.display_name ?? target.username} (@${target.username}, ${target.email}): tag ${target.badge} → ${badge}`);
// Tournament Organizer: sul calendario restano solo i tornei di Creator/Pro/Staff (o di un admin). Chi passa a Autore o
// Community esce dal calendario (il trigger protect_tournament_listing guarda solo i tornei che si modificano).
if (!LISTING.includes(badge)) {
  const t = await db.query("update public.tournaments set listed = false where organizer = $1 and listed and not exists (select 1 from public.profiles p where p.id = $1 and p.role = 'admin')", [target.id]);
  if (t.rowCount) console.log(`Tornei tolti dal calendario: ${t.rowCount}`);
}
// Guide della community (revisione del 27/09/2026): chi perde il ruolo che le pubblica (per esempio per un abuso) non
// lascia online le sue guide. Le pubblicate tornano tra le bozze (non si cancellano: l'autore le ritrova in /account e,
// con il ruolo restituito, le ripubblica); le nascoste dallo staff restano nascoste. can_publish_guides blocca già le
// scritture nuove; le pagine e le sitemap si aggiornano da sole entro qualche minuto (ISR). Connessione diretta:
// il trigger guard_community_guide la tratta come staff. Prima della migrazione del pacchetto GUIDE la tabella non c'è.
if (!GUIDES.includes(badge)) {
  try {
    const g = await db.query(
      "update public.community_guides set status = 'draft' where owner = $1 and status = 'published' and not exists (select 1 from public.profiles p where p.id = $1 and p.role = 'admin')",
      [target.id],
    );
    if (g.rowCount) console.log(`Guide riportate tra le bozze: ${g.rowCount}`);
  } catch (e) {
    if (e.code !== "42P01") console.error(`Guide non riportate tra le bozze: ${e.message}`);
  }
}
await db.end();
