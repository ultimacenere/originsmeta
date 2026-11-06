// Promemoria agli iscritti di un torneo che non hanno consegnato i mazzi (06/11/2026, il giorno prima di EndGame First
// Blood; Pierluigi: "manda un messaggio ad ogni partecipante di ricordarsi di mandare i deck"). Il messaggio arriva nella
// casella del sito, con la busta nell'header, e l'utente lo vede firmato "Staff di OriginsMeta". Passa dalla RPC
// inbox_staff_start con la sessione di uno dello staff: stessi controlli del sito e stesso limite (200 messaggi l'ora).
// Chi ha già una conversazione con lo stesso oggetto non lo riceve due volte, quindi si può rilanciare; chi ha consegnato
// i mazzi nel frattempo resta fuori da solo.
// Uso, dalla radice del repo: node scripts/tournament-remind.mjs <TAG> <nome utente dello staff> <file.json>   (prova: scrive solo chi lo riceverebbe)
//                             node scripts/tournament-remind.mjs <TAG> <nome utente dello staff> <file.json> --apply
// Il file ha { "subject": "...", "body": "..." } (oggetto fino a 120 caratteri, testo fino a 4000).
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const [tagArg, staffName, file] = argv.filter((a) => !a.startsWith("--"));
if (!tagArg || !staffName || !file) {
  console.error("Uso: node scripts/tournament-remind.mjs <TAG> <nome utente dello staff> <file.json> [--apply]");
  process.exit(1);
}
const { subject, body } = JSON.parse(readFileSync(file, "utf8"));
if (!subject || !body || Array.from(subject).length > 120 || Array.from(body).length > 4000) {
  console.error("Oggetto o testo mancanti o troppo lunghi");
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(existsSync(".env.local") ? ".env.local" : "C:/Users/User/Desktop/originsmeta/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
await db.connect();

const tag = tagArg.toUpperCase().startsWith("OM-") ? tagArg.toUpperCase() : `OM-${tagArg.toUpperCase()}`;
const t = (await db.query("select id, name, status from public.tournaments where tag = $1", [tag])).rows[0];
const staff = (await db.query("select id, role, badge from public.profiles where lower(username) = lower($1)", [staffName.replace(/^@/, "")])).rows[0];
if (!t || t.status !== "open") {
  console.error(t ? `Il torneo "${t.name}" non è aperto (stato ${t.status})` : `Nessun torneo con tag ${tag}`);
  await db.end();
  process.exit(2);
}
if (!staff || !(staff.role === "admin" || staff.badge === "staff")) {
  console.error(`${staffName} non è dello staff`);
  await db.end();
  process.exit(2);
}

const { rows } = await db.query(
  `select pr.username, p.status from public.tournament_players p join public.profiles pr on pr.id = p.user_id
    where p.tournament_id = $1 and p.status in ('registered', 'waitlist') and not p.decks_submitted and pr.username is not null and pr.id <> $2
      and not exists (select 1 from public.conversations c where c.user_id = p.user_id and c.origin = 'staff' and c.subject = $3)
    order by p.created_at`,
  [t.id, staff.id, subject],
);
const waitlist = rows.filter((r) => r.status === "waitlist").length;
console.log(`${t.name} (${tag}): ${rows.length} destinatari senza mazzi (${rows.length - waitlist} iscritti, ${waitlist} in lista d'attesa)`);
console.log(`Oggetto: ${subject}`);
if (!apply) {
  console.log(`Primi: ${rows.slice(0, 8).map((r) => r.username).join(", ")}`);
  console.log("Prova: non è partito niente. Con --apply si manda.");
  await db.end();
  process.exit(0);
}

let sent = 0;
const failed = [];
for (const r of rows) {
  try {
    await db.query("begin");
    await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [JSON.stringify({ sub: staff.id, role: "authenticated" }), staff.id]);
    await db.query("set local role authenticated");
    await db.query("select public.inbox_staff_start($1, $2, $3)", [r.username, subject, body]);
    await db.query("commit");
    sent++;
  } catch (e) {
    await db.query("rollback").catch(() => {});
    failed.push(`${r.username}: ${e.message}`);
  }
}
console.log(`Mandati ${sent} su ${rows.length}.`);
if (failed.length) console.log(`Non partiti:\n${failed.join("\n")}`);
await db.end();
process.exit(failed.length ? 1 : 0);
