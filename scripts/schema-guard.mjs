/**
 * Controlli su supabase/schema.sql prima di applicarlo (scripts/db-migrate.mjs) e nei test (`npm test`).
 *
 * Perché (revisione dell'integrazione dei pacchetti creator, 26/09/2026): fino al commit 6c6756d schema.sql dava
 * `grant update on public.profiles to authenticated` e ogni iscritto poteva cambiare via API qualsiasi colonna della
 * propria riga, `role` compreso (farsi admin). db-migrate applica sempre il file INTERO: lanciato con uno schema.sql
 * vecchio (un checkout di main precedente alla correzione, un worktree rimasto indietro) rimetterebbe la grant
 * sull'intera tabella e, con `create or replace`, il vecchio trigger senza il blocco dei campi riservati. Questo modulo
 * rifiuta uno schema che lo farebbe. Le copie vecchie di db-migrate non hanno il controllo: la regola resta "mai
 * db-migrate da main o da worktree precedenti a 232ee7e" (README, "Migrazione del database").
 *
 * Funzioni pure, senza dipendenze: `sqlStatements` legge le istruzioni fuori dai commenti (le stringhe e i corpi
 * $$…$$ restano interi, quindi un `;` al loro interno non spezza nulla), `schemaProblems` dice che cosa non va.
 */

/** Il titolo del primo blocco dei pacchetti creator: prima c'è lo schema di sempre, con la correzione 6c6756d. */
export const CREATOR_MARKER = "-- ===== 26/09/2026: CREATOR =====";

/**
 * Le sole grant ammesse su public.profiles (istruzioni normalizzate: spazi singoli, minuscole, senza `;`). Dopo la prima
 * (lettura) solo grant di UPDATE per colonna, mai sull'intera tabella:
 * - bio, canali e lingue del profilo pubblico (pacchetto CREATOR, 26/09/2026);
 * - foto profilo caricata e campi della vetrina (pacchetto VETRINA, 27/09/2026, blocco "27/09/2026: VETRINA" di
 *   schema.sql): `avatar_path` per tutti, gli altri li difende il trigger `guard_profile_vetrina`, che li rifiuta a chi
 *   non ha un ruolo con vetrina;
 * - `show_stats` (pacchetto TRAGUARDI, 27/09/2026, blocco "27/09/2026: TRAGUARDI"): la casella "Mostra i numeri sulla
 *   vetrina" di /account, un booleano che il trigger profiles_guard_show_stats rifiuta a chi non ha un ruolo con vetrina.
 * Nessuna di queste colonne dà permessi: ruolo, tag, nome utente e id restano chiusi, e ogni altra grant, anche per
 * colonna, resta rifiutata. I test di TRAGUARDI confrontano gli insiemi, quelli della vetrina cercano la sua grant in
 * posizione 2: l'ordine resta questo (lo stesso dei blocchi in schema.sql). `schemaProblems` vuole la revoke di 6c6756d
 * prima di OGNI grant per colonna.
 * - la lettura per colonna (blocco "25/10/2026: ID DISCORD PRIVATO", posizione 4, `PROFILES_SELECT_GRANT`): tutte le
 *   colonne tranne `PRIVATE_PROFILE_COLUMNS`, dopo `PROFILES_SELECT_REVOKE`, che toglie la lettura dell'intera tabella data
 *   dalla prima grant (rimessa a ogni migrazione e tolta di nuovo in fondo al file).
 */
export const PROFILES_GRANTS = [
  "grant select on public.profiles, public.community_decks, public.deck_votes, public.deck_ratings to anon, authenticated",
  "grant update (bio, links, content_langs) on public.profiles to authenticated",
  "grant update (avatar_path, cover_preset, cover_path, background_preset, background_path, accent, tagline, favorite_legendary, featured_deck, featured_video, schedule, schedule_tz) on public.profiles to authenticated",
  "grant update (show_stats) on public.profiles to authenticated",
  "grant select (id, username, display_name, avatar_url, role, created_at, badge, bio, links, content_langs, showcase_updated_at, avatar_path, cover_preset, cover_path, background_preset, background_path, accent, tagline, favorite_legendary, featured_deck, featured_video, schedule, schedule_tz, avatar_updated_at, vetrina_updated_at, show_stats, username_changed_at, display_name_changed_at) on public.profiles to anon, authenticated",
];

/**
 * Le colonne di public.profiles che nessun client legge (25/10/2026): `discord_id` lega un profilo del sito al suo account
 * Discord. Le leggono solo le funzioni security definer (showcase_profiles_by_discord per i soli profili con vetrina).
 */
export const PRIVATE_PROFILE_COLUMNS = ["discord_id"];

/** La lettura per colonna di public.profiles (tutte le colonne tranne `PRIVATE_PROFILE_COLUMNS`). */
export const PROFILES_SELECT_GRANT = PROFILES_GRANTS[4];

/**
 * La sola revoke ammessa dopo le grant di UPDATE per colonna: toglie la lettura (dell'intera tabella e per colonna), non
 * le grant di UPDATE. Deve venire dopo l'ultima grant di lettura sull'intera tabella e prima di `PROFILES_SELECT_GRANT`.
 */
export const PROFILES_SELECT_REVOKE = "revoke select on public.profiles from anon, authenticated";

/**
 * schema.sql più i file dei pacchetti dell'ondata 2 (supabase/wave2-<PACCHETTO>.sql, 27/09/2026) che l'integratore
 * accoda in fondo e che non ci sono ancora dentro: lo schema che db-migrate applicherà. Un file già accodato (il suo
 * testo, a meno degli spazi e dei fine riga, sta in schema.sql) non si conta due volte. Solo per i test: db-migrate
 * applica schema.sql e basta. Dal 27/09/2026 i quattro pacchetti dei profili stanno tutti in schema.sql e non ci sono
 * più file wave2: la funzione resta per i pacchetti futuri che arrivassero allo stesso modo.
 */
export function withPendingBlocks(schema, pending) {
  const flat = (s) => s.replace(/\s+/g, " ").trim();
  const inSchema = flat(schema);
  return [schema, ...pending.filter((p) => flat(p) && !inSchema.includes(flat(p)))].join("\n");
}

/** La revoke che chiude la falla (6c6756d): deve esserci, e prima della grant per colonna. */
export const PROFILES_REVOKE = "revoke update on public.profiles from anon, authenticated";

/** Le colonne che il trigger protect_profile_badge deve proteggere dagli utenti (tag compreso). */
export const RESERVED_PROFILE_FIELDS = ["badge", "role", "username", "discord_id", "id", "created_at"];

const normalize = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Le istruzioni SQL di un file, nell'ordine, senza commenti (`-- …` e `/* … *\/`), normalizzate (spazi singoli) e in
 * minuscolo. Stringhe ('…', con '' e con gli escape di E'…'), identificatori fra virgolette e corpi fra dollari
 * ($$…$$, $tag$…$tag$) restano interi.
 */
export function sqlStatements(sql) {
  const out = [];
  let cur = "";
  let i = 0;
  const n = sql.length;
  const push = () => {
    const s = normalize(cur).toLowerCase();
    if (s) out.push(s);
    cur = "";
  };
  while (i < n) {
    const c = sql[i];
    const next = sql[i + 1];
    if (c === "-" && next === "-") {
      const j = sql.indexOf("\n", i);
      i = j < 0 ? n : j;
      continue;
    }
    if (c === "/" && next === "*") {
      const j = sql.indexOf("*/", i + 2);
      i = j < 0 ? n : j + 2;
      cur += " ";
      continue;
    }
    if (c === "'") {
      // E'…' ammette gli escape con la barra: \' non chiude la stringa
      const escapes = /[eE]/.test(sql[i - 1] ?? "") && !/[A-Za-z0-9_]/.test(sql[i - 2] ?? "");
      let j = i + 1;
      while (j < n) {
        if (escapes && sql[j] === "\\") {
          j += 2;
          continue;
        }
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          j += 1;
          break;
        }
        j += 1;
      }
      cur += sql.slice(i, j);
      i = j;
      continue;
    }
    if (c === '"') {
      const k = sql.indexOf('"', i + 1);
      const j = k < 0 ? n : k + 1;
      cur += sql.slice(i, j);
      i = j;
      continue;
    }
    if (c === "$") {
      const m = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i, i + 65));
      if (m) {
        const k = sql.indexOf(m[0], i + m[0].length);
        const j = k < 0 ? n : k + m[0].length;
        cur += sql.slice(i, j);
        i = j;
        continue;
      }
    }
    if (c === ";") {
      push();
      i += 1;
      continue;
    }
    cur += c;
    i += 1;
  }
  push();
  return out;
}

/** Righe che aprono o chiudono il corpo di una funzione con un dollaro solo (`as $`, `end $;`): errore di sintassi. */
export function singleDollarLines(sql) {
  return sql.split(/\r?\n/).filter((l) => /\bas \$\s*$|^\s*end \$;\s*$|^\s*\$;\s*$/i.test(l));
}

const ON_PROFILES = /\bon (?:table )?(?:[^;]*,\s*)?public\.profiles\b/;
const ALL_TABLES = /\bon all tables in schema public\b/;

/**
 * Che cosa, in schema.sql, riaprirebbe la scrittura dei profili agli utenti. Vuoto = si può applicare.
 * - grant su public.profiles diverse da `PROFILES_GRANTS` (anche per colonna: `grant update (role) …`), grant e
 *   `alter default privileges` su tutte le tabelle dello schema public;
 * - la revoke di 6c6756d assente o dopo la grant per colonna, e revoke su profiles (o su tutte le tabelle) dopo la
 *   grant per colonna, che la cancellerebbero a ogni migrazione;
 * - l'ultima definizione di protect_profile_badge senza il controllo di uno dei campi riservati, o il trigger che la
 *   usa tolto e non rimesso;
 * - con le grant della vetrina e di show_stats, i loro trigger (guard_profile_vetrina, guard_profile_show_stats) senza
 *   il controllo del ruolo o di una colonna, o tolti e non rimessi (`GUARDED_GRANTS`);
 * - corpi di funzione con un dollaro solo (la migrazione intera fallirebbe, correzione compresa).
 */
/**
 * Le ripetizioni {n} / {n,m} oltre 255 in un'espressione regolare: Postgres le rifiuta ("invalid repetition count(s)",
 * il suo limite è 255). Il 27/09/2026 una {1,300} nella regola della foto di Discord ha fatto fallire la migrazione e,
 * dentro handle_new_user (una funzione, controllata solo quando gira), avrebbe bloccato ogni nuova iscrizione.
 * Si guarda tutto il testo del file: fuori dalle regex le graffe con soli numeri non si usano.
 */
export const PG_REGEX_DUPMAX = 255;
export function overLongRepetitions(sql) {
  const found = [];
  for (const m of sql.matchAll(/\{(\d+)(?:,(\d*))?\}/g)) {
    const a = Number(m[1]);
    const b = m[2] === undefined || m[2] === "" ? a : Number(m[2]);
    if (a > PG_REGEX_DUPMAX || b > PG_REGEX_DUPMAX) found.push(m[0]);
  }
  return found;
}

export function schemaProblems(sql) {
  const problems = [];
  const stmts = sqlStatements(sql);

  for (const rep of overLongRepetitions(sql)) problems.push(`ripetizione ${rep} in una regex: Postgres accetta al massimo ${PG_REGEX_DUPMAX}`);

  for (const line of singleDollarLines(sql)) problems.push(`corpo di funzione con un dollaro solo: ${line.trim()}`);

  stmts.forEach((s) => {
    if (/^grant\b/.test(s) && ON_PROFILES.test(s) && !PROFILES_GRANTS.includes(s)) problems.push(`grant non prevista su public.profiles: ${s}`);
    if (/^grant\b/.test(s) && ALL_TABLES.test(s)) problems.push(`grant su tutte le tabelle dello schema public: ${s}`);
    if (/^alter default privileges\b/.test(s) && /\bgrant\b/.test(s) && /\bon tables\b/.test(s)) problems.push(`privilegi di default sulle tabelle: ${s}`);
  });

  const revokeAt = stmts.lastIndexOf(PROFILES_REVOKE);
  // la prima grant per colonna (bio e canali, poi quella della vetrina): la revoke deve venire prima di tutte
  const columnGrants = PROFILES_GRANTS.slice(1)
    .map((g) => stmts.indexOf(g))
    .filter((i) => i >= 0);
  const grantAt = columnGrants.length ? Math.min(...columnGrants) : -1;
  if (revokeAt < 0) problems.push(`manca "${PROFILES_REVOKE};" (commit 6c6756d)`);
  if (grantAt >= 0 && revokeAt > grantAt) problems.push("la revoke su public.profiles viene dopo la grant per colonna e la cancellerebbe");
  if (grantAt >= 0) {
    stmts.slice(grantAt + 1).forEach((s) => {
      if (s === PROFILES_SELECT_REVOKE) return; // solo lettura: le grant di UPDATE per colonna restano
      if (/^revoke\b/.test(s) && (ON_PROFILES.test(s) || ALL_TABLES.test(s))) problems.push(`revoke dopo la grant per colonna di public.profiles (la cancellerebbe): ${s}`);
    });
  }

  // Lettura per colonna (25/10/2026): discord_id e le altre colonne private non le legge nessun client. Il blocco sta in
  // fondo al file: la sola prima parte di splitSchema (db-migrate --base) non lo ha e non si controlla qui (applicata da
  // sola rimette la lettura dell'intera tabella fino alla migrazione completa).
  if (sql.includes(CREATOR_MARKER)) problems.push(...selectProblems(stmts));

  const defs = stmts.filter((s) => /^create (?:or replace )?function public\.protect_profile_badge\(/.test(s));
  const body = defs.at(-1);
  if (!body) problems.push("manca la funzione public.protect_profile_badge");
  else {
    for (const f of RESERVED_PROFILE_FIELDS) {
      if (!body.includes(`new.${f} is distinct from old.${f}`)) problems.push(`protect_profile_badge non protegge ${f}`);
    }
  }
  const trigger = "create trigger profiles_protect_badge before update on public.profiles for each row execute function public.protect_profile_badge()";
  const triggerAt = stmts.lastIndexOf(trigger);
  const dropAt = stmts.lastIndexOf("drop trigger if exists profiles_protect_badge on public.profiles");
  if (triggerAt < 0 || dropAt > triggerAt) problems.push("manca il trigger profiles_protect_badge su public.profiles");

  // Le grant per colonna della vetrina e di show_stats sono sicure solo con i loro trigger (revisione del 27/09/2026):
  // se un blocco accodato li togliesse, o ridefinisse le funzioni senza il controllo del ruolo, ogni iscritto potrebbe
  // impostarsi via API copertina, frase, video, orari, mazzo in evidenza o i numeri pubblici.
  for (const guard of GUARDED_GRANTS) {
    if (!stmts.includes(guard.grant)) continue;
    const fnDefs = stmts.filter((s) => s.startsWith(`create or replace function public.${guard.fn}(`) || s.startsWith(`create function public.${guard.fn}(`));
    const fnBody = fnDefs.at(-1);
    if (!fnBody) problems.push(`manca la funzione public.${guard.fn}, che difende "${guard.grant}"`);
    else for (const part of guard.checks) if (!fnBody.includes(part)) problems.push(`${guard.fn} non controlla: ${part}`);
    const create = `create trigger ${guard.trigger} before update on public.profiles for each row execute function public.${guard.fn}()`;
    const createAt = stmts.lastIndexOf(create);
    const dropGuardAt = stmts.lastIndexOf(`drop trigger if exists ${guard.trigger} on public.profiles`);
    if (createAt < 0 || dropGuardAt > createAt) problems.push(`manca il trigger ${guard.trigger} su public.profiles`);
  }

  return problems;
}

/**
 * Che cosa non va nella lettura per colonna di public.profiles (25/10/2026): la revoke di lettura assente o seguita da
 * una nuova lettura dell'intera tabella (riaprirebbe discord_id), la lettura per colonna assente o prima della revoke
 * (il sito non leggerebbe più i profili), una colonna privata dentro, una colonna della tabella fuori o una che la tabella
 * non ha, una colonna aggiunta dopo la grant.
 */
export function selectProblems(stmts) {
  const problems = [];
  const revokeAt = stmts.lastIndexOf(PROFILES_SELECT_REVOKE);
  const grantAt = stmts.lastIndexOf(PROFILES_SELECT_GRANT);
  const tableGrantAt = stmts.lastIndexOf(PROFILES_GRANTS[0]);
  if (revokeAt < 0) problems.push(`manca "${PROFILES_SELECT_REVOKE};": ${PRIVATE_PROFILE_COLUMNS.join(", ")} resterebbe leggibile con la chiave pubblica`);
  else if (tableGrantAt > revokeAt) problems.push("la lettura dell'intera tabella public.profiles viene dopo la revoke di lettura e riapre le colonne private");
  if (grantAt < 0 || grantAt < revokeAt) problems.push("manca la lettura per colonna di public.profiles dopo la revoke di lettura: il sito non leggerebbe più i profili");
  const granted = selectColumns(PROFILES_SELECT_GRANT);
  for (const c of PRIVATE_PROFILE_COLUMNS) if (granted.includes(c)) problems.push(`la lettura per colonna di public.profiles comprende ${c}, che è privata`);
  const columns = profileColumns(stmts);
  for (const c of columns) {
    if (!granted.includes(c) && !PRIVATE_PROFILE_COLUMNS.includes(c)) problems.push(`colonna ${c} di public.profiles fuori dalla lettura per colonna: aggiungila a PROFILES_SELECT_GRANT (o a PRIVATE_PROFILE_COLUMNS)`);
  }
  for (const c of granted) if (!columns.includes(c)) problems.push(`la lettura per colonna di public.profiles nomina ${c}, che la tabella non ha`);
  const lastAddColumn = stmts.reduce((at, s, i) => (/^alter table (?:only )?public\.profiles add column\b/.test(s) ? i : at), -1);
  if (grantAt >= 0 && lastAddColumn > grantAt) problems.push("una colonna di public.profiles è aggiunta dopo la lettura per colonna: su un database nuovo la grant non la troverebbe");
  return problems;
}

/** Il ruolo con vetrina come lo scrivono i trigger (SHOWCASE_BADGES di src/lib/community/badges.ts). */
const SHOWCASE_SQL = "('creator', 'author', 'pro', 'staff')";

/** Colonne di una grant per colonna di `PROFILES_GRANTS` (senza le parentesi). */
function grantColumns(grant) {
  return (/^grant update \(([^)]+)\)/.exec(grant)?.[1] ?? "").split(",").map((c) => c.trim()).filter(Boolean);
}

/** Colonne di una grant di lettura per colonna (`grant select (a, b) on …`). */
export function selectColumns(grant) {
  return (/^grant select \(([^)]+)\)/.exec(grant)?.[1] ?? "").split(",").map((c) => c.trim()).filter(Boolean);
}

/**
 * Le colonne di public.profiles come le costruisce lo schema (istruzioni di `sqlStatements`): quelle di `create table`
 * più le `alter table … add column`, meno le `drop column`.
 */
export function profileColumns(stmts) {
  const cols = [];
  const create = stmts.find((s) => /^create table (?:if not exists )?public\.profiles \(/.test(s));
  if (create) {
    const open = create.indexOf("(");
    let depth = 0;
    let item = "";
    const items = [];
    for (const ch of create.slice(open + 1)) {
      if (ch === "(") depth++;
      if (ch === ")") {
        if (depth === 0) break;
        depth--;
      }
      if (ch === "," && depth === 0) {
        items.push(item);
        item = "";
      } else item += ch;
    }
    items.push(item);
    for (const it of items) {
      const name = it.trim().split(/\s+/)[0];
      if (name && !/^(?:constraint|primary|unique|check|foreign|exclude|like)$/.test(name)) cols.push(name.replace(/"/g, ""));
    }
  }
  const COL = '"?([a-z_][a-z0-9_]*)"?';
  for (const s of stmts) {
    const add = new RegExp(`^alter table (?:only )?public\\.profiles add column (?:if not exists )?${COL}`).exec(s);
    if (add && !cols.includes(add[1])) cols.push(add[1]);
    const drop = new RegExp(`^alter table (?:only )?public\\.profiles drop column (?:if exists )?${COL}`).exec(s);
    if (drop && cols.includes(drop[1])) cols.splice(cols.indexOf(drop[1]), 1);
  }
  return cols;
}

/**
 * Le grant per colonna che un trigger deve difendere, con i pezzi (normalizzati come `sqlStatements`) che l'ultima
 * definizione della funzione deve contenere: per la vetrina il controllo del ruolo e una condizione per ogni colonna
 * della grant (tranne avatar_path, la foto profilo di tutti); per show_stats il ruolo e lo spegnimento.
 */
export const GUARDED_GRANTS = [
  {
    grant: PROFILES_GRANTS[2],
    fn: "guard_profile_vetrina",
    trigger: "profiles_guard_vetrina",
    checks: [
      "auth.uid() is not null and not public.is_admin()",
      `old.badge not in ${SHOWCASE_SQL}`,
      ...grantColumns(PROFILES_GRANTS[2])
        .filter((c) => c !== "avatar_path")
        .map((c) => (c === "schedule" ? "new.schedule <> '[]'::jsonb and new.schedule is distinct from old.schedule" : `new.${c} is not null and new.${c} is distinct from old.${c}`)),
      "raise exception",
    ],
  },
  {
    grant: PROFILES_GRANTS[3],
    fn: "guard_profile_show_stats",
    trigger: "profiles_guard_show_stats",
    checks: [`if new.show_stats and new.badge not in ${SHOWCASE_SQL} then`, "new.show_stats := false", "raise exception"],
  },
];

/**
 * schema.sql in due parti, da applicare una dopo l'altra (due transazioni): lo schema di sempre con la correzione
 * 6c6756d, poi i blocchi dei pacchetti creator. Così un errore nei blocchi nuovi non annulla la revoke sui profili.
 * Senza il titolo del primo blocco, una parte sola.
 */
export function splitSchema(sql) {
  const at = sql.indexOf(CREATOR_MARKER);
  if (at < 0) return [{ name: "schema", sql }];
  return [
    { name: "base (schema di sempre + correzione dei profili)", sql: sql.slice(0, at) },
    { name: "pacchetti creator (CREATOR, VIDEO, STREAM, STATS, INBOX), TAG E BIO, profili del 27/09 (VETRINA, SEGUI, TRAGUARDI, GUIDE, DATE E FOTO), IMMAGINI e FUMETTI del 29–30/09, TRACKER del 30/09, INTERESSE ANALYTICS e DRAFT ONLINE del 02/10, MAZZI TORNEO del 04/10, TORNEO CRIMSON del 05/10, VOTI ALLE CARTE del 06/10, … ID DISCORD PRIVATO del 25/10", sql: sql.slice(at) },
  ];
}
