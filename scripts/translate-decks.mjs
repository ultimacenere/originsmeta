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
// Le traduzioni si scrivono solo se il testo della guida è ancora quello da cui sono state fatte (impronta).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";
import { guideHash, guideText, missingLocales, namesIn, parseTranslation, translateGuideWith, TRANSLATION_MODEL } from "../src/lib/community/deckTranslation.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

// Lingue del sito: le stesse di src/lib/i18n.ts (lette dal file, così non si copiano a mano).
const i18n = readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
const LOCALES = JSON.parse(`[${/export const locales = \[([^\]]+)\]/.exec(i18n)[1]}]`);

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

const only = opt("--only");
const { rows } = await db.query(
  `select id, slug, name, status, guide, translations from public.community_decks
    where status in ('published','hidden') ${only ? "and slug = $1" : ""} order by created_at`,
  only ? [only] : [],
);
// --redo: lingue da rifare anche se la traduzione c'è ed è valida (mai la lingua in cui l'autore ha scritto)
const redo = (opt("--redo") ?? "").split(",").map((s) => s.trim()).filter((l) => LOCALES.includes(l));
const todo = rows
  .map((r) => ({ ...r, missing: [...new Set([...missingLocales(r, LOCALES), ...redo.filter((l) => l !== r.guide?.lang)])] }))
  .filter((r) => r.missing.length && r.guide?.summary);
console.log(`${rows.length} mazzi letti, ${todo.length} con traduzioni da fare (lingue del sito: ${LOCALES.join(", ")})`);
for (const r of todo) console.log(`- ${r.slug} (${r.guide.lang} → ${r.missing.join(", ")})`);

/** Salva una traduzione, solo se la guida è ancora quella da cui è stata fatta. */
async function save(deck, locale, text, model) {
  const hash = guideHash(deck.guide);
  await db.query("begin");
  try {
    const cur = await db.query("select guide, translations from public.community_decks where id = $1 for update", [deck.id]);
    const row = cur.rows[0];
    if (!row || guideHash(row.guide) !== hash) {
      await db.query("rollback");
      console.log(`  ${deck.slug} ${locale}: la guida è cambiata nel frattempo, traduzione scartata`);
      return false;
    }
    const next = { ...(row.translations ?? {}), [locale]: { hash, at: new Date().toISOString(), model, guide: text } };
    delete next[row.guide.lang];
    await db.query("update public.community_decks set translations = $1::jsonb where id = $2", [JSON.stringify(next), deck.id]);
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
    todo.map((r) => [r.slug, { name: r.name, lang: r.guide.lang, missing: r.missing, names: namesIn(guideText(r.guide), NAMES), guide: guideText(r.guide), ...(redo.length ? { current: current(r) } : {}) }]),
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
      const text = parseTranslation(guideText(r.guide), JSON.stringify(t));
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
  if (!key) throw new Error("serve ANTHROPIC_API_KEY (variabile d'ambiente o .env.local)");
  const client = new Anthropic({ apiKey: key, maxRetries: 2 });
  let saved = 0;
  for (const r of todo) {
    const names = namesIn(guideText(r.guide), NAMES);
    for (const locale of r.missing) {
      try {
        const res = await translateGuideWith(client, r.guide, locale, names);
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
