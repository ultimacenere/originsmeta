// PROVA A SECCO del blocco "22/10/2026: COMMENTI AI MAZZI" sul database vero: esegue supabase/schema.sql in UNA
// transazione (le due parti di splitSchema, una dopo l'altra), prova i commenti come li usa il sito (iscritti con
// l'accesso fatto, chi ha pubblicato il mazzo, staff, visitatori anonimi) e alla fine fa SEMPRE rollback: sul database
// non resta nulla. Usa un mazzo pubblicato, il suo proprietario, altri due profili e (se c'è) un profilo dello staff solo
// dentro la transazione.
// Dentro una transazione now() non cambia: dopo ogni commento la prova sposta indietro di un minuto il registro degli
// invii, altrimenti il tetto dei 10 secondi fermerebbe il commento successivo.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/deck-comments-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";
import { schemaProblems, splitSchema } from "./schema-guard.mjs";

const sql = readFileSync("supabase/schema.sql", "utf8");
const problems = schemaProblems(sql);
if (problems.length) {
  console.error("schema.sql rifiutato da schema-guard:", problems);
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(existsSync(".env.local") ? ".env.local" : "C:/Users/User/Desktop/originsmeta/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });

let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "NO  "} ${name}${detail ? ` — ${detail}` : ""}`);
};
async function attempt(text, params = []) {
  await db.query("savepoint t");
  try {
    const r = await db.query(text, params);
    await db.query("release savepoint t");
    return { rows: r.rows };
  } catch (e) {
    await db.query("rollback to savepoint t");
    return { error: e.message };
  }
}
async function as(role, uid = "") {
  await db.query("reset role");
  await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [uid ? JSON.stringify({ sub: uid, role }) : "", uid]);
  if (role !== "postgres") await db.query(`set local role ${role}`);
}
/** Il registro degli invii un minuto indietro: il prossimo commento non è "troppo veloce" (now() è fermo nella transazione). */
async function age(uid) {
  await as("postgres");
  await db.query("update public.deck_comment_events set created_at = created_at - interval '1 minute' where user_id = $1", [uid]);
}
const add = (deck, parent, body) => attempt("select public.deck_comment_add($1, null, $2, $3) as id", [deck, parent, body]);
const visibleTo = async (role, uid, deck) => {
  await as(role, uid);
  return (await attempt("select id, status, body from public.deck_comments where deck_id = $1 order by id", [deck])).rows ?? [];
};

await db.connect();
await db.query("begin");
try {
  const before = await db.query(`select to_regclass('public.deck_comments') is not null as there`);
  if (before.rows[0].there) console.log("nota: la tabella deck_comments c'è già (migrazione già fatta?)");
  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");
  const deck = (await db.query(`select id, owner, slug from public.community_decks where status = 'published' order by created_at limit 1`)).rows[0];
  check("un mazzo pubblicato per la prova", Boolean(deck));
  const others = (await db.query(`select id from public.profiles where id <> $1 and role is distinct from 'admin' and badge is distinct from 'staff' order by created_at limit 2`, [deck.owner])).rows;
  check("due profili che non hanno pubblicato il mazzo", others.length === 2);
  const staff = (await db.query(`select id from public.profiles where (role = 'admin' or badge = 'staff') and id <> $1 limit 1`, [deck.owner])).rows[0]?.id;
  const [a, b] = [others[0]?.id, others[1]?.id];
  const owner = deck.owner;

  // --- scrivere ---
  await as("authenticated", a);
  const c1 = await add(deck.id, null, "Prova **uno** con Merlin");
  check("A commenta il mazzo", Boolean(c1.rows?.[0]?.id), c1.error ?? "");
  const id1 = c1.rows?.[0]?.id;
  check("A di nuovo subito: troppo veloce", /too_fast/.test((await add(deck.id, null, "ancora")).error ?? ""));
  await age(a);
  await as("authenticated", a);
  check("testo vuoto rifiutato", /invalid_body/.test((await add(deck.id, null, "")).error ?? ""));
  check("41 righe rifiutate", /invalid_body/.test((await add(deck.id, null, Array(41).fill("x").join("\n"))).error ?? ""));
  check("2001 caratteri rifiutati", /invalid_body/.test((await add(deck.id, null, "x".repeat(2001))).error ?? ""));
  check("mazzo e mazzo torneo insieme rifiutati", /invalid_target/.test((await attempt("select public.deck_comment_add($1, $1, null, 'x')", [deck.id])).error ?? ""));
  check("mazzo che non c'è", /target_unavailable/.test((await add("00000000-0000-4000-8000-000000000000", null, "x")).error ?? ""));
  check("niente scritture dirette", Boolean((await attempt("insert into public.deck_comments (deck_id, author, body) values ($1, $2, 'diretto')", [deck.id, a])).error));

  // --- rispondere, avvisi ---
  await as("authenticated", b);
  const c2 = await add(deck.id, id1, "Risposta di B");
  check("B risponde ad A", Boolean(c2.rows?.[0]?.id), c2.error ?? "");
  const id2 = c2.rows?.[0]?.id;
  await age(b);
  await as("authenticated", b);
  check("niente risposte alle risposte", /invalid_parent/.test((await add(deck.id, id2, "Risposta alla risposta")).error ?? ""));
  await as("postgres");
  const notes = (await db.query(`select user_id, kind, actor_id, target from public.notifications where event_key in ($1, $2)`, [`comment:${id1}`, `comment:${id2}`])).rows;
  const has = (user, kind, actor) => notes.some((n) => n.user_id === user && n.kind === kind && n.actor_id === actor && n.target === `/decks/community/${deck.slug}`);
  check("avviso a chi ha pubblicato il mazzo per il commento di A", has(owner, "deck_comment", a), JSON.stringify(notes));
  check("avviso ad A per la risposta di B", has(a, "comment_reply", b), JSON.stringify(notes));
  check("avviso a chi ha pubblicato il mazzo per la risposta di B", has(owner, "deck_comment", b), JSON.stringify(notes));

  // --- leggere ---
  check("anon legge i due commenti", (await visibleTo("anon", "", deck.id)).length === 2);
  await as("anon");
  check("anon non scrive", Boolean((await add(deck.id, null, "anonimo")).error));

  // --- modificare ---
  await as("authenticated", a);
  check("A modifica il suo", !(await attempt("select public.deck_comment_edit($1, 'Prova *uno* modificata')", [id1])).error);
  await as("authenticated", b);
  check("B non modifica quello di A", /not_allowed/.test((await attempt("select public.deck_comment_edit($1, 'no')", [id1])).error ?? ""));
  await as("postgres");
  const edited = (await db.query("select body, edited_at from public.deck_comments where id = $1", [id1])).rows[0];
  check("testo e data della modifica", edited?.body === "Prova *uno* modificata" && Boolean(edited?.edited_at), JSON.stringify(edited));

  // --- segnalare ---
  await as("authenticated", b);
  check("B segnala il commento di A: prima segnalazione", (await attempt("select public.deck_comment_report($1, 'spam') as first", [id1])).rows?.[0]?.first === true);
  check("B di nuovo: non è la prima", (await attempt("select public.deck_comment_report($1, '') as first", [id1])).rows?.[0]?.first === false);
  await as("authenticated", a);
  check("A non segnala se stesso", /not_allowed/.test((await attempt("select public.deck_comment_report($1, '')", [id1])).error ?? ""));
  check("nessuno legge le segnalazioni", Boolean((await attempt("select * from public.deck_comment_reports")).error));

  // --- nascondere (staff) ---
  if (staff) {
    await as("authenticated", b);
    check("B non nasconde", /not_allowed/.test((await attempt("select public.deck_comment_hide($1, true)", [id2])).error ?? ""));
    await as("authenticated", staff);
    check("lo staff nasconde la risposta di B", !(await attempt("select public.deck_comment_hide($1, true)", [id2])).error);
    check("anon non vede più la risposta nascosta", (await visibleTo("anon", "", deck.id)).every((r) => r.id !== id2));
    check("B vede la sua risposta nascosta", (await visibleTo("authenticated", b, deck.id)).some((r) => r.id === id2 && r.status === "hidden"));
    check("lo staff la vede", (await visibleTo("authenticated", staff, deck.id)).some((r) => r.id === id2));
    await as("authenticated", staff);
    check("lo staff la rimette online", !(await attempt("select public.deck_comment_hide($1, false)", [id2])).error);
  } else console.log("nota: nessun profilo dello staff, salto le prove di Nascondi");

  // --- eliminare ---
  await as("authenticated", b);
  check("B non elimina il commento di A", /not_allowed/.test((await attempt("select public.deck_comment_delete($1)", [id1])).error ?? ""));
  await as("authenticated", owner);
  check("chi ha pubblicato il mazzo elimina il commento di A, che ha una risposta: resta il posto", (await attempt("select public.deck_comment_delete($1) as r", [id1])).rows?.[0]?.r === "emptied");
  const placeholder = (await visibleTo("anon", "", deck.id)).find((r) => r.id === id1);
  check("anon vede il posto vuoto", placeholder?.status === "deleted" && placeholder.body === "", JSON.stringify(placeholder));
  await as("postgres");
  check("gli avvisi del commento eliminato se ne vanno", Number((await db.query("select count(*)::int as n from public.notifications where event_key = $1", [`comment:${id1}`])).rows[0].n) === 0);
  await as("authenticated", b);
  check("B elimina la sua risposta", (await attempt("select public.deck_comment_delete($1) as r", [id2])).rows?.[0]?.r === "deleted");
  check("e il posto vuoto se ne va con lei", (await visibleTo("anon", "", deck.id)).length === 0);
} finally {
  await db.query("rollback");
  await db.end();
}
console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
process.exit(failures ? 1 : 0);
