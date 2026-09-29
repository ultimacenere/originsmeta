// Unisce in un fumetto solo i fumetti che sono lo stesso fumetto in lingue diverse (30/09/2026). Vega aveva pubblicato lo
// stesso fumetto tre volte, una per lingua, e Pierluigi ha chiesto: "Vega ha fatto tre fumetti in 3 lingue, unificali in
// una sola news subito". Il primo slug è il fumetto che resta (la sua lingua, la sua data di pubblicazione, il suo indirizzo);
// gli altri diventano le sue versioni disegnate (colonna `editions`: tavole, titolo, presentazione e copertina di
// ognuno) e i loro indirizzi finiscono in `former_slugs`, che la pagina /news/comics/<slug> porta al fumetto che resta
// con un 308 (link su Discord, avvisi, motori di ricerca). Le traduzioni automatiche del fumetto che resta nelle lingue
// che ora hanno la versione disegnata si tolgono (non servono più). Gli avvisi "ha pubblicato un fumetto" dei fumetti
// uniti puntano a quello che resta, uno per persona. Poi le righe degli altri si cancellano; i file restano, perché ora
// li usa il fumetto che resta (profile_media_in_use conosce le versioni disegnate).
//
// Serve la migrazione del blocco "30/09/2026: FUMETTI IN PIÙ LINGUE" di supabase/schema.sql (colonne `editions` e
// `former_slugs`). Tutto avviene in una transazione, con le regole del database (vincoli e trigger dei fumetti): se
// qualcosa non va non cambia nulla.
//
// Uso (dal checkout con .env.local, come set-badge.mjs):
//   node scripts/merge-comics.mjs --list <username|email|parte del nome>
//     i fumetti di un utente, dal più vecchio: slug, lingua, stato, tavole, pubblicazione, titolo, versioni
//   node scripts/merge-comics.mjs <slug che resta>[:<lingua>] <slug>[:<lingua>] [<slug>[:<lingua>]] [--apply]
//     senza --apply prova tutto e annulla (mostra che cosa farebbe); con --apply scrive. La data della news resta quella
//     del fumetto che resta. ":<lingua>" (en, it, es) corregge la lingua salvata: i tre fumetti di Vega del 29/09/2026
//     erano tutti "es" (caricati dal sito in spagnolo senza cambiare "Lingua dei testi"), anche quello inglese e
//     quello italiano.
// Dopo: home, /news e le pagine dei fumetti si rinnovano da sole (ISR, entro 5 minuti). Gli annunci su Discord dei
// fumetti uniti (canale di DISCORD_WEBHOOK_COMICS) si tolgono a mano; i loro link portano comunque al fumetto che resta.
import { readFileSync } from "node:fs";
import pg from "pg";

const args = process.argv.slice(2);
const apply = process.argv.includes("--apply");
const listAt = args.indexOf("--list");
const LANG_NAMES = { en: "inglese", it: "italiano", es: "spagnolo" };
const SITE = "https://originsmeta.com";
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

function usage() {
  console.error("Uso: node scripts/merge-comics.mjs --list <username|email|nome>");
  console.error("     node scripts/merge-comics.mjs <slug che resta>[:<lingua>] <slug>[:<lingua>] [<slug>[:<lingua>]] [--apply]");
  process.exit(1);
}

const needle = listAt >= 0 ? args[listAt + 1] : null;
// "slug" o "slug:lingua" (la lingua vera, se quella salvata è sbagliata)
const wanted = listAt >= 0 ? [] : args.filter((a) => !a.startsWith("--")).map((a) => ({ slug: a.split(":")[0], lang: a.split(":")[1] }));
const slugs = wanted.map((w) => w.slug);
if (listAt >= 0 && (!needle || needle.startsWith("--"))) usage();
if (listAt < 0 && (slugs.length < 2 || slugs.length > 3 || new Set(slugs).size !== slugs.length || !slugs.every((s) => SLUG_RE.test(s)) || wanted.some((w) => w.lang !== undefined && !LANG_NAMES[w.lang]))) usage();

const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();

const migrated = (await db.query("select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_comics' and column_name in ('editions', 'former_slugs')")).rowCount === 2;

if (needle) {
  const r = await db.query(
    `select c.slug, c.lang, c.status, jsonb_array_length(c.pages) as pages, c.published_at, c.title,
            ${migrated ? "(select coalesce(string_agg(k, ', ' order by k), '') from jsonb_object_keys(c.editions) as k)" : "''"} as editions
       from public.community_comics c
       join public.profiles p on p.id = c.owner
       join auth.users u on u.id = p.id
      where p.username ilike $1 or p.display_name ilike $2 or u.email ilike $1
      order by c.created_at`,
    [needle, `%${needle}%`],
  );
  if (!r.rows.length) console.log(`Nessun fumetto per "${needle}".`);
  for (const c of r.rows) {
    const when = c.published_at ? new Date(c.published_at).toISOString().slice(0, 16).replace("T", " ") : "mai pubblicato";
    console.log(`${c.slug}  [${c.lang}] ${c.status}, ${c.pages} tavole, ${when} UTC${c.editions ? `, versioni: ${c.editions}` : ""}\n    ${c.title}`);
  }
  if (!migrated) console.log("\n(Manca la migrazione del blocco FUMETTI IN PIÙ LINGUE: prima di unire va applicata.)");
  await db.end();
  process.exit(0);
}

if (!migrated) {
  console.error('Manca la migrazione: applica supabase/schema.sql (blocco "30/09/2026: FUMETTI IN PIÙ LINGUE") con node scripts/db-migrate.mjs, poi riprova.');
  await db.end();
  process.exit(2);
}

await db.query("begin");
let ok = false;
try {
  // le righe si bloccano prima di leggerle: nessun salvataggio dal sito in mezzo
  const r = await db.query(
    `select id, slug, owner, lang, title, summary, pages, cover_path, status, editions, former_slugs, translations, published_at
       from public.community_comics where slug = any($1::text[]) for update`,
    [slugs],
  );
  const bySlug = new Map(r.rows.map((x) => [x.slug, x]));
  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length) throw new Error(`fumetti che non ci sono: ${missing.join(", ")}`);
  const [main, ...others] = slugs.map((s) => bySlug.get(s));
  const storedLang = main.lang;
  for (const w of wanted) if (w.lang) bySlug.get(w.slug).lang = w.lang;
  const langs = new Set([main.lang]);
  for (const o of others) {
    if (o.owner !== main.owner) throw new Error(`${o.slug} è di un altro autore`);
    if (langs.has(o.lang)) throw new Error(`${o.slug} è in ${LANG_NAMES[o.lang] ?? o.lang}, come un altro dei fumetti da unire`);
    langs.add(o.lang);
    if (main.editions?.[o.lang]) throw new Error(`${main.slug} ha già la versione in ${LANG_NAMES[o.lang] ?? o.lang}`);
    if (Object.keys(o.editions ?? {}).length) throw new Error(`${o.slug} ha già delle versioni disegnate sue: uniscile prima a mano`);
    if (o.status !== "published") console.log(`Attenzione: ${o.slug} non è pubblicato (${o.status}); la sua versione vale per ${main.slug}, che è ${main.status}.`);
    if (o.published_at && main.published_at && o.published_at < main.published_at) console.log(`Attenzione: ${o.slug} è uscito prima di ${main.slug}; la news tiene la data di ${main.slug}.`);
  }

  const editions = { ...(main.editions ?? {}) };
  for (const o of others) editions[o.lang] = { title: o.title, summary: o.summary, pages: o.pages, cover_path: o.cover_path };
  const former = [...new Set([...(main.former_slugs ?? []), ...others.flatMap((o) => [o.slug, ...(o.former_slugs ?? [])])])];
  // le traduzioni automatiche servono solo alle lingue senza versione disegnata (e mai a quella del fumetto)
  const translations = Object.fromEntries(Object.entries(main.translations ?? {}).filter(([l]) => !editions[l] && l !== main.lang));
  await db.query("update public.community_comics set lang = $5, editions = $2::jsonb, former_slugs = $3::text[], translations = $4::jsonb where id = $1", [
    main.id,
    JSON.stringify(editions),
    former,
    JSON.stringify(translations),
    main.lang,
  ]);

  // gli avvisi a chi segue: uno per persona, verso il fumetto che resta
  const mainTarget = `/news/comics/${main.slug}`;
  const oldTargets = others.map((o) => `/news/comics/${o.slug}`);
  const dropped = await db.query(
    `delete from public.notifications n
      where n.kind = 'comic_published' and n.event_key = any($2::text[])
        and (exists (select 1 from public.notifications m where m.user_id = n.user_id and m.kind = n.kind and m.event_key = $1)
             or exists (select 1 from public.notifications o where o.user_id = n.user_id and o.kind = n.kind and o.event_key = any($2::text[]) and o.id < n.id))`,
    [mainTarget, oldTargets],
  );
  const moved = await db.query("update public.notifications set target = $1, event_key = $1 where kind = 'comic_published' and event_key = any($2::text[])", [mainTarget, oldTargets]);

  const gone = await db.query("delete from public.community_comics where id = any($1::uuid[]) returning slug", [others.map((o) => o.id)]);
  const after = (await db.query("select editions, former_slugs, status from public.community_comics where id = $1", [main.id])).rows[0];

  console.log(`Fumetto che resta: ${main.slug} [${main.lang}${main.lang !== storedLang ? `, era ${storedLang}` : ""}] (${main.status})`);
  for (const o of others) {
    console.log(`  + versione in ${LANG_NAMES[o.lang] ?? o.lang} da ${o.slug}: ${o.pages.length} tavole, "${o.title}"${o.cover_path ? ", con la sua copertina" : ""}`);
  }
  console.log(`Versioni disegnate: ${Object.keys(after.editions).join(", ")} · indirizzi di prima: ${after.former_slugs.join(", ")}`);
  console.log(`Avvisi a chi segue: ${moved.rowCount} spostati sul fumetto che resta, ${dropped.rowCount} doppioni tolti`);
  console.log(`Righe cancellate: ${gone.rows.map((x) => x.slug).join(", ")} (i file restano: ora li usa ${main.slug})`);
  console.log("Pagine:");
  for (const l of ["en", "it", "es"]) console.log(`  ${SITE}/${l}/news/comics/${main.slug}`);
  for (const o of others) console.log(`  ${SITE}/${o.lang}/news/comics/${o.slug} → 308 verso ${main.slug}`);
  ok = true;
} catch (e) {
  console.error(`Niente di fatto: ${e.message}`);
} finally {
  await db.query(apply && ok ? "commit" : "rollback");
  await db.end();
}
if (ok) console.log(apply ? "\nFatto: scritto nel database." : "\nProva: nulla è stato scritto. Per scrivere: aggiungi --apply.");
process.exit(ok ? 0 : 1);
