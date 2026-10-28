// Traduce le guide dei mazzi della community che non hanno ancora la traduzione (o l'hanno vecchia) nelle altre
// lingue del sito, e la salva nella colonna community_decks.translations (25/09/2026).
//
// Serve per gli arretrati (i mazzi pubblicati prima della traduzione automatica) e per ritentare quando la
// traduzione dopo la pubblicazione non è riuscita. Il sito, dopo ogni pubblicazione o modifica, fa da solo lo
// stesso lavoro (src/lib/community/translate.ts): lo script usa le stesse funzioni (deckTranslation.ts).
//
// Uso (dalla cartella del repo; .env.local con la password del database, come db-migrate.mjs):
//   node scripts/translate-decks.mjs --dry-run            elenca che cosa manca, non scrive nulla
//   node scripts/translate-decks.mjs                      traduce con l'API (serve ANTHROPIC_API_KEY) e salva
//   node scripts/translate-decks.mjs --only <slug>        solo quel mazzo
//   node scripts/translate-decks.mjs --export <file>      scrive in un JSON i testi da tradurre (per tradurli fuori)
//   node scripts/translate-decks.mjs --from <file>        salva traduzioni già pronte: { "<slug>": { "<lingua>": { summary, … } } }
//   --redo <lingue>                                       rifà anche le traduzioni ancora valide in quelle lingue (es. "it,es"),
//                                                         dopo un cambio del prompt; con --export aggiunge la traduzione attuale
//   --env <file>                                          .env.local da usare (di default quello del repo principale)
//   --sets                                                i Mazzi torneo (community_deck_sets) invece dei mazzi singoli, con
//                                                         le stesse opzioni (28/10/2026: prima gli arretrati dei trii non si
//                                                         recuperavano, si traducevano solo alla modifica successiva)
// Le traduzioni si scrivono solo se il testo della guida è ancora quello da cui sono state fatte (impronta).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import * as nodeModule from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";
import { guideHash, guideText, missingLocales, namesIn, parseTranslation, translateDocWith, translateGuideWith, TRANSLATION_MODEL } from "../src/lib/community/deckTranslation.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

// Lingue del sito: le stesse di src/lib/i18n.ts (lette dal file, così non si copiano a mano).
const i18n = readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
const SITE_LOCALES = JSON.parse(`[${/export const locales = \[([^\]]+)\]/.exec(i18n)[1]}]`);
// Le lingue che il database non accetta ancora (DB_PENDING_LOCALES di src/lib/community/translate.ts) si saltano.
const pendingSrc = /DB_PENDING_LOCALES: readonly Locale\[\] = \[([^\]]*)\]/.exec(readFileSync(path.join(root, "src/lib/community/translate.ts"), "utf8"));
const PENDING = pendingSrc && pendingSrc[1].trim() ? JSON.parse(`[${pendingSrc[1]}]`) : [];
const LOCALES = SITE_LOCALES.filter((l) => !PENDING.includes(l));

// .env.local: quello indicato, quello del repo o quello del checkout principale (i worktree non lo hanno).
function envFile() {
  const candidates = [opt("--env"), path.join(root, ".env.local")];
  try {
    const common = execSync("git rev-parse --path-format=absolute --git-common-dir", { cwd: root, encoding: "utf8" }).trim();
    candidates.push(path.join(path.dirname(common), ".env.local"));
  } catch {}
  const found = candidates.find((f) => f && existsSync(f));
  if (!found) throw new Error(".env.local non trovato: indicarlo con --env <file>");
  return found;
}
const env = Object.fromEntries(
  readFileSync(envFile(), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

// Nomi ufficiali da non tradurre: carte (da woo-cards.json) e luoghi (da locations.ts).
const woo = JSON.parse(readFileSync(path.join(root, "src/lib/data/woo-cards.json"), "utf8"));
const locationNames = [...readFileSync(path.join(root, "src/lib/data/locations.ts"), "utf8").matchAll(/^\s*name: "([^"]+)",/gm)].map((m) => m[1]);
const NAMES = [...new Set([...woo.cards.map((c) => c.name), ...locationNames])];

const db = new pg.Client({
  host: env.SUPABASE_DB_HOST || `db.${env.SUPABASE_PROJECT_REF}.supabase.co`,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER || "postgres",
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await db.connect();

// Mazzi singoli o Mazzi torneo (--sets): tabella, testo, impronta, lingue mancanti e traduzione di ciascuno, con le
// funzioni del sito (translate.ts e deckSetTranslate.ts fanno lo stesso dopo la pubblicazione).
async function deckKind() {
  if (!flag("--sets")) {
    return {
      table: "community_decks",
      label: "mazzi",
      text: guideText,
      hash: guideHash,
      missing: (r) => missingLocales(r, LOCALES),
      translate: (client, r, to, names) => translateGuideWith(client, r.guide, to, names),
    };
  }
  // deckSets.ts importa senza estensione, come vuole Next: un hook aggiunge ".ts" (come translate-guides.mjs)
  nodeModule.registerHooks({
    resolve(specifier, context, next) {
      if (/^\.\.?\//.test(specifier) && !/\.(?:[cm]?[jt]sx?|json)$/.test(specifier)) {
        try {
          return next(`${specifier}.ts`, context);
        } catch {
          // non è un modulo .ts: si risolve com'è scritto
        }
      }
      return next(specifier, context);
    },
  });
  const S = await import("../src/lib/community/deckSets.ts");
  return {
    table: "community_deck_sets",
    label: "mazzi torneo",
    text: S.deckSetGuideText,
    hash: S.deckSetGuideHash,
    missing: (r) => S.missingSetLocales(r, LOCALES),
    translate: async (client, r, to, names) => {
      const res = await translateDocWith(client, S.deckSetGuideText(r.guide), r.guide.lang, to, names, S.DECK_SET_TRANSLATION_SYSTEM);
      return res ? { guide: res.doc, model: res.model } : null;
    },
  };
}
const kind = await deckKind();

const only = opt("--only");
const { rows } = await db.query(
  `select id, slug, name, status, guide, translations from public.${kind.table}
    where status in ('published','hidden') ${only ? "and slug = $1" : ""} order by created_at`,
  only ? [only] : [],
);
// --redo: lingue da rifare anche se la traduzione c'è ed è valida (mai la lingua in cui l'autore ha scritto)
const redo = (opt("--redo") ?? "").split(",").map((s) => s.trim()).filter((l) => LOCALES.includes(l));
const todo = rows
  .map((r) => ({ ...r, missing: [...new Set([...kind.missing(r), ...redo.filter((l) => l !== r.guide?.lang)])] }))
  .filter((r) => r.missing.length && r.guide?.summary);
console.log(`${rows.length} ${kind.label} letti, ${todo.length} con traduzioni da fare (lingue del sito: ${LOCALES.join(", ")})`);
for (const r of todo) console.log(`- ${r.slug} (${r.guide.lang} → ${r.missing.join(", ")})`);

/** Salva una traduzione, solo se la guida è ancora quella da cui è stata fatta. */
async function save(deck, locale, text, model) {
  const hash = kind.hash(deck.guide);
  await db.query("begin");
  try {
    const cur = await db.query(`select guide, translations from public.${kind.table} where id = $1 for update`, [deck.id]);
    const row = cur.rows[0];
    if (!row || kind.hash(row.guide) !== hash) {
      await db.query("rollback");
      console.log(`  ${deck.slug} ${locale}: la guida è cambiata nel frattempo, traduzione scartata`);
      return false;
    }
    const next = { ...(row.translations ?? {}), [locale]: { hash, at: new Date().toISOString(), model, guide: text } };
    delete next[row.guide.lang];
    await db.query(`update public.${kind.table} set translations = $1::jsonb where id = $2`, [JSON.stringify(next), deck.id]);
    await db.query("commit");
    return true;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

if (flag("--dry-run")) {
  await db.end();
} else if (opt("--export")) {
  const current = (r) => Object.fromEntries(r.missing.filter((l) => r.translations?.[l]?.guide).map((l) => [l, r.translations[l].guide]));
  const out = Object.fromEntries(
    todo.map((r) => [r.slug, { name: r.name, lang: r.guide.lang, missing: r.missing, names: namesIn(kind.text(r.guide), NAMES), guide: kind.text(r.guide), ...(redo.length ? { current: current(r) } : {}) }]),
  );
  writeFileSync(opt("--export"), JSON.stringify(out, null, 1));
  console.log(`testi da tradurre scritti in ${opt("--export")}`);
  await db.end();
} else if (opt("--from")) {
  const ready = JSON.parse(readFileSync(opt("--from"), "utf8"));
  let saved = 0;
  for (const r of todo) {
    for (const locale of r.missing) {
      const t = ready[r.slug]?.[locale];
      if (!t) continue;
      const text = parseTranslation(kind.text(r.guide), JSON.stringify(t));
      if (!text) {
        console.log(`  ${r.slug} ${locale}: traduzione scartata (campi diversi dall'originale o testo non valido)`);
        continue;
      }
      if (await save(r, locale, text, opt("--model") ?? "manual")) saved++;
    }
  }
  console.log(`${saved} traduzioni salvate`);
  await db.end();
} else {
  const key = process.env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("serve ANTHROPIC_API_KEY (variabile d'ambiente o .env.local), oppure --export/--from");
  const client = new Anthropic({ apiKey: key, maxRetries: 2 });
  let saved = 0;
  for (const r of todo) {
    const names = namesIn(kind.text(r.guide), NAMES);
    for (const locale of r.missing) {
      try {
        const res = await kind.translate(client, r, locale, names);
        if (!res) {
          console.log(`  ${r.slug} ${locale}: nessuna traduzione valida (rifiuto, testo troncato o controlli non superati)`);
          continue;
        }
        if (await save(r, locale, res.guide, res.model ?? TRANSLATION_MODEL)) {
          saved++;
          console.log(`  ${r.slug} ${locale}: salvata`);
        }
      } catch (e) {
        console.log(`  ${r.slug} ${locale}: errore ${e instanceof Error ? e.message : e}`);
      }
    }
  }
  console.log(`${saved} traduzioni salvate`);
  await db.end();
}
