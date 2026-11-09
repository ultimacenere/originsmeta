// PROVA A SECCO del blocco "09/11/2026: ORDINE PER AGGIORNAMENTO" sul database vero (09/11/2026): esegue
// supabase/schema.sql in UNA transazione, prova sul trigger delle versioni quello che ha chiesto Pierluigi (le liste dei
// mazzi si ordinano per l'ultimo cambio di carte; un cambio di solo testo non sposta la data; il mazzo aggiornato tiene
// visite e voti) e alla fine fa SEMPRE rollback: sul database non resta nulla. Usa un admin come proprietario del mazzo
// di prova (nessun tetto ai mazzi) e un altro iscritto come votante, solo dentro la transazione.
// Uso, dalla radice del repo (checkout principale o worktree aggiornato): node scripts/deck-order-dry-run.mjs
// Legge .env.local della cartella corrente, altrimenti quello del checkout principale (i worktree non lo hanno).
// I controlli stanno in `deckOrderChecks`, che riceve un client con `query(text, params)`: la stessa prova gira anche su
// un Postgres locale (PGlite) con lo schema del repo.
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { schemaProblems, splitSchema } from "./schema-guard.mjs";

/**
 * I controlli, dentro una transazione già aperta da chi chiama (che poi fa rollback). `db.query(text, params)` come `pg`.
 * Restituisce il numero di controlli non passati.
 */
export async function deckOrderChecks(db, sql, log = console.log) {
  let failures = 0;
  const check = (name, ok, detail = "") => {
    if (!ok) failures++;
    log(`${ok ? "ok  " : "NO  "} ${name}${detail ? ` — ${detail}` : ""}`);
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

  for (const part of splitSchema(sql)) {
    const r = await attempt(part.sql);
    check(`schema: ${part.name.slice(0, 70)}`, !r.error, r.error ?? "");
  }
  await as("postgres");

  // ---------- multinsieme delle carte ----------
  const key = async (a, b) => (await db.query(`select public.deck_cards_key($1::jsonb) = public.deck_cards_key($2::jsonb) as same`, [JSON.stringify(a), JSON.stringify(b)])).rows[0]?.same;
  check("deck_cards_key: stesse carte in un altro ordine = uguali", (await key(["b", "a", "c"], ["c", "b", "a"])) === true);
  check("deck_cards_key: una quantità diversa = diverse", (await key(["a", "a", "b"], ["a", "b", "b"])) === false);
  check("deck_cards_key: carte create in un altro ordine = uguali", (await key([{ slug: "custom:x", name: "X" }, { slug: "custom:y", name: "Y" }], [{ name: "Y", slug: "custom:y" }, { slug: "custom:x", name: "X" }])) === true);
  check("anon non chiama deck_cards_key", await (async () => {
    await as("anon");
    const r = await attempt(`select public.deck_cards_key('[]'::jsonb)`);
    await as("postgres");
    return Boolean(r.error);
  })());

  // ---------- mazzo di prova ----------
  const owner = (await db.query(`select id from public.profiles where role = 'admin' order by created_at limit 1`)).rows[0]?.id;
  const voter = (await db.query(`select id from public.profiles where id is distinct from $1 order by created_at limit 1`, [owner ?? null])).rows[0]?.id;
  check("un admin (proprietario) e un altro iscritto (votante) per la prova", Boolean(owner && voter));
  if (!owner || !voter) return failures;
  const cards = Array.from({ length: 12 }, (_, i) => `zz-prova-${i + 1}`);
  const ins = await attempt(
    `insert into public.community_decks (slug, owner, name, legendary, cards, custom_cards, archetype, guide, code_om, status)
     values ('zz-prova-ordine', $1, 'Prova ordine', 'zz-leg', $2::jsonb, '[]'::jsonb, 'midrange', $3::jsonb, 'OM1.prova', 'published') returning id`,
    [owner, JSON.stringify(cards), JSON.stringify({ lang: "it", summary: "Mazzo di prova della migrazione, sparisce col rollback." })],
  );
  check("mazzo di prova pubblicato", !ins.error && Boolean(ins.rows?.[0]?.id), ins.error ?? "");
  const id = ins.rows?.[0]?.id;
  if (!id) return failures;
  // pubblicato un anno fa (una correzione dello staff con la connessione diretta: auth.uid() nullo, guard_created_at la lascia passare)
  await db.query(`update public.community_decks set created_at = '2025-11-09T10:00:00Z' where id = $1`, [id]);
  // un secondo mazzo di prova, più recente, così l'ordine ha sempre qualcosa sopra il primo (anche su un database vuoto)
  const other = await attempt(
    `insert into public.community_decks (slug, owner, name, legendary, cards, custom_cards, archetype, guide, code_om, status)
     values ('zz-prova-ordine-2', $1, 'Prova ordine 2', 'zz-leg-2', $2::jsonb, '[]'::jsonb, 'midrange', $3::jsonb, 'OM1.prova', 'published') returning id`,
    [owner, JSON.stringify(cards.map((c) => `${c}-b`)), JSON.stringify({ lang: "it", summary: "Secondo mazzo di prova della migrazione." })],
  );
  check("secondo mazzo di prova, di una settimana fa", !other.error, other.error ?? "");
  if (other.rows?.[0]?.id) await db.query(`update public.community_decks set created_at = now() - interval '7 days' where id = $1`, [other.rows[0].id]);
  await db.query(`insert into public.deck_stats_daily (deck_id, day, views) values ($1, current_date, 7)`, [id]);
  const vote = await attempt(`insert into public.deck_votes (deck_id, user_id, stars) values ($1, $2, 4)`, [id, voter]);
  check("un voto e 7 visite sul mazzo di prova", !vote.error, vote.error ?? "");
  const state = async () => (await db.query(`select version, cards_updated_at, created_at, slug from public.community_decks where id = $1`, [id])).rows[0];
  const versions = async () => Number((await db.query(`select count(*)::int as n from public.community_deck_versions where deck_id = $1`, [id])).rows[0]?.n);
  const top = async () =>
    (await db.query(`select id from public.community_decks where status = 'published' order by coalesce(cards_updated_at, created_at) desc, created_at desc limit 1`)).rows[0]?.id;

  let s = await state();
  check("appena pubblicato: versione 1, nessuna data di aggiornamento", s?.version === 1 && s?.cards_updated_at === null);
  check("un mazzo di un anno fa non è in cima all'ordine", (await top()) !== id);

  // ---------- il proprietario, con la sua sessione ----------
  await as("authenticated", owner);
  const text = await attempt(`update public.community_decks set name = 'Prova ordine bis', guide = $2::jsonb, video_url = null where id = $1 returning id`, [
    id,
    JSON.stringify({ lang: "it", summary: "Guida riscritta: solo testo, le carte sono le stesse." }),
  ]);
  check("il proprietario cambia nome e guida", text.rows?.length === 1, text.error ?? "");
  s = await state();
  check("solo testo: la data delle carte non si sposta", s?.cards_updated_at === null && s?.version === 1);
  const reordered = await attempt(`update public.community_decks set cards = $2::jsonb where id = $1 returning id`, [id, JSON.stringify([...cards].reverse())]);
  check("il proprietario rimette le stesse carte in un altro ordine", reordered.rows?.length === 1, reordered.error ?? "");
  s = await state();
  check("stesse carte in un altro ordine: nessuna versione e nessuna data", s?.cards_updated_at === null && s?.version === 1 && (await versions()) === 0);
  check("…e il mazzo non sale in cima", (await top()) !== id);
  const changed = await attempt(`update public.community_decks set cards = $2::jsonb where id = $1 returning id`, [id, JSON.stringify([...cards.slice(1), "zz-prova-nuova"])]);
  check("il proprietario cambia una carta", changed.rows?.length === 1, changed.error ?? "");
  s = await state();
  check("carte cambiate: versione 2 e data delle carte di adesso", s?.version === 2 && s?.cards_updated_at !== null && new Date(s.cards_updated_at) > new Date(s.created_at));
  check("la versione di prima è salvata", (await versions()) === 1);
  check("lo stesso mazzo: slug e data di creazione invariati", s?.slug === "zz-prova-ordine" && new Date(s?.created_at).toISOString() === "2025-11-09T10:00:00.000Z");
  check("le carte cambiate portano il mazzo in cima all'ordine", (await top()) === id);
  const after = s?.cards_updated_at;
  await attempt(`update public.community_decks set guide = $2::jsonb where id = $1`, [id, JSON.stringify({ lang: "it", summary: "Altra guida dopo l'aggiornamento: la data resta." })]);
  s = await state();
  check("dopo l'aggiornamento, un cambio di guida non sposta la data", s?.version === 2 && String(s?.cards_updated_at) === String(after));
  check("la data delle carte non si scrive a mano", await (async () => {
    await attempt(`update public.community_decks set cards_updated_at = '2030-01-01T00:00:00Z', version = 99 where id = $1`, [id]);
    const x = await state();
    return x?.version === 2 && String(x?.cards_updated_at) === String(after);
  })());

  // ---------- visite e voti restano ----------
  await as("postgres");
  const views = (await db.query(`select coalesce(sum(views), 0)::int as n from public.deck_stats_daily where deck_id = $1`, [id])).rows[0]?.n;
  check("le visite restano al mazzo aggiornato", views === 7);
  const votes = (await db.query(`select count(*)::int as n from public.deck_votes where deck_id = $1`, [id])).rows[0]?.n;
  check("i voti restano in deck_votes", votes === 1);

  // ---------- informazione sui mazzi veri (sola lettura) ----------
  const fake = (
    await db.query(`
      with v as (
        select deck_id, version, legendary, cards, custom_cards from public.community_deck_versions
        union all
        select id, version, legendary, cards, custom_cards from public.community_decks where id <> $1
      ), s as (
        select deck_id, version, public.deck_cards_key(cards) as k, legendary, public.deck_cards_key(custom_cards) as c,
               lead(public.deck_cards_key(cards)) over w as nk, lead(legendary) over w as nl, lead(public.deck_cards_key(custom_cards)) over w as nc
          from v window w as (partition by deck_id order by version)
      )
      select count(*)::int as n from s where nk is not null and k = nk and legendary is not distinct from nl and c = nc`,
      [id],
    )
  ).rows[0]?.n;
  log(`info  versioni già salvate con le stesse carte della successiva (riordini, prima di questo blocco): ${fake}`);
  return failures;
}

async function main() {
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
  const { default: pg } = await import("pg");
  const db = new pg.Client({ host: env.SUPABASE_DB_HOST, port: Number(env.SUPABASE_DB_PORT || 5432), user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await db.connect();
  await db.query("begin");
  let failures = 0;
  try {
    failures = await deckOrderChecks(db, sql);
  } finally {
    await db.query("rollback");
    await db.end();
  }
  console.log(failures ? `\n${failures} controlli NON passati (rollback fatto: il database non è cambiato)` : "\nTutto a posto (rollback fatto: il database non è cambiato). Si può lanciare node scripts/db-migrate.mjs");
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
