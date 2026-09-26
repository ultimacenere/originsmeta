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

/** Le sole grant ammesse su public.profiles (istruzioni normalizzate: spazi singoli, minuscole, senza `;`). */
export const PROFILES_GRANTS = [
  "grant select on public.profiles, public.community_decks, public.deck_votes, public.deck_ratings to anon, authenticated",
  "grant update (bio, links, content_langs) on public.profiles to authenticated",
];

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
 * - corpi di funzione con un dollaro solo (la migrazione intera fallirebbe, correzione compresa).
 */
export function schemaProblems(sql) {
  const problems = [];
  const stmts = sqlStatements(sql);

  for (const line of singleDollarLines(sql)) problems.push(`corpo di funzione con un dollaro solo: ${line.trim()}`);

  stmts.forEach((s) => {
    if (/^grant\b/.test(s) && ON_PROFILES.test(s) && !PROFILES_GRANTS.includes(s)) problems.push(`grant non prevista su public.profiles: ${s}`);
    if (/^grant\b/.test(s) && ALL_TABLES.test(s)) problems.push(`grant su tutte le tabelle dello schema public: ${s}`);
    if (/^alter default privileges\b/.test(s) && /\bgrant\b/.test(s) && /\bon tables\b/.test(s)) problems.push(`privilegi di default sulle tabelle: ${s}`);
  });

  const revokeAt = stmts.lastIndexOf(PROFILES_REVOKE);
  const grantAt = stmts.indexOf(PROFILES_GRANTS[1]);
  if (revokeAt < 0) problems.push(`manca "${PROFILES_REVOKE};" (commit 6c6756d)`);
  if (grantAt >= 0 && revokeAt > grantAt) problems.push("la revoke su public.profiles viene dopo la grant per colonna e la cancellerebbe");
  if (grantAt >= 0) {
    stmts.slice(grantAt + 1).forEach((s) => {
      if (/^revoke\b/.test(s) && (ON_PROFILES.test(s) || ALL_TABLES.test(s))) problems.push(`revoke dopo la grant per colonna di public.profiles (la cancellerebbe): ${s}`);
    });
  }

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

  return problems;
}

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
    { name: "pacchetti creator (CREATOR, VIDEO, STREAM, STATS, INBOX)", sql: sql.slice(at) },
  ];
}
