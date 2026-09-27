// Traduce le guide della community (pacchetto GUIDE, 27/09/2026) che non hanno ancora la traduzione, o l'hanno rimasta
// indietro rispetto al testo, nelle altre lingue del sito, e la salva nella colonna community_guides.translations.
//
// Serve per ritentare quando la traduzione dopo la pubblicazione non è riuscita (rete, API, tempo della funzione) e per
// gli arretrati. Il sito, dopo ogni pubblicazione o modifica, fa da solo lo stesso lavoro (guideTranslate.ts): lo
// script usa lo stesso codice (guideTranslateCore.ts: a pezzi di 8000 caratteri, riusando le parti già tradotte).
//
// Uso (dalla cartella del repo; .env.local con la password del database, come db-migrate.mjs e translate-decks.mjs):
//   node scripts/translate-guides.mjs --dry-run            elenca che cosa manca e quanto testo va tradotto, non scrive nulla
//   node scripts/translate-guides.mjs                      traduce con l'API (serve ANTHROPIC_API_KEY) e salva
//   node scripts/translate-guides.mjs --only <slug>        solo quella guida
//   --redo <lingue>                                        rifà da capo anche le traduzioni ancora valide in quelle lingue
//                                                          (es. "it,es"), dopo un cambio del prompt
//   --env <file>                                           .env.local da usare (di default quello del repo principale)
// Le traduzioni si scrivono solo se il testo della guida è ancora quello da cui sono state fatte (impronta), e il
// trigger del database le ricontrolla (testo semplice, stesse sezioni dell'originale).
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import * as nodeModule from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";

// I moduli del sito sono scritti per Next (import senza estensione): come nei test, un hook aggiunge ".ts".
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
const G = await import("../src/lib/community/guides.ts");
const { translateGuideText } = await import("../src/lib/community/guideTranslateCore.ts");
const { namesIn } = await import("../src/lib/community/deckTranslation.ts");

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

// Nomi ufficiali da non tradurre: carte (da woo-cards.json) e luoghi (da locations.ts), come translate-decks.mjs.
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
  `select id, slug, lang, summary, sections, translations from public.community_guides
    where status = 'published' ${only ? "and slug = $1" : ""} order by published_at`,
  only ? [only] : [],
);
const guideOf = (r) => ({
  lang: LOCALES.includes(r.lang) ? r.lang : "en",
  summary: r.summary ?? "",
  sections: G.storedSections(r.sections),
  translations: r.translations && typeof r.translations === "object" && !Array.isArray(r.translations) ? r.translations : {},
});
// --redo: lingue da rifare anche se la traduzione c'è ed è valida (mai la lingua in cui l'autore ha scritto), da capo
const redo = (opt("--redo") ?? "").split(",").map((s) => s.trim()).filter((l) => LOCALES.includes(l));
const todo = rows
  .map((r) => {
    const g = guideOf(r);
    const missing = [...new Set([...G.missingGuideLocales(g, LOCALES), ...redo.filter((l) => l !== g.lang)])];
    const source = { ...g, translations: Object.fromEntries(Object.entries(g.translations).filter(([l]) => !redo.includes(l))) };
    return { ...r, g, source, missing };
  })
  .filter((r) => r.missing.length && r.g.summary && r.g.sections.length);
console.log(`${rows.length} guide pubblicate lette, ${todo.length} con traduzioni da fare (lingue del sito: ${LOCALES.join(", ")})`);
for (const r of todo) {
  const plans = r.missing.map((l) => {
    const plan = G.planGuideTranslation(r.source, r.source.translations[l]);
    const chars = plan.chunks.reduce((n, c) => n + Object.values(c).reduce((a, v) => a + v.length, 0), 0);
    return `${l}: ${plan.chunks.length} richieste, ${chars} caratteri`;
  });
  console.log(`- ${r.slug} (${r.g.lang} → ${plans.join("; ")})`);
}

/** Salva le traduzioni di una guida, solo se il testo è ancora quello da cui sono state fatte. */
async function save(r, done) {
  const hash = G.communityGuideHash(r.g);
  await db.query("begin");
  try {
    const cur = await db.query("select lang, summary, sections, translations from public.community_guides where id = $1 for update", [r.id]);
    const row = cur.rows[0];
    if (!row || G.communityGuideHash(guideOf(row)) !== hash) {
      await db.query("rollback");
      console.log(`  ${r.slug}: la guida è cambiata nel frattempo, traduzioni scartate`);
      return 0;
    }
    const next = { ...(row.translations ?? {}), ...done };
    delete next[row.lang];
    await db.query("update public.community_guides set translations = $1::jsonb where id = $2", [JSON.stringify(next), r.id]);
    await db.query("commit");
    return Object.keys(done).length;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

if (flag("--dry-run")) {
  await db.end();
} else {
  const key = process.env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("serve ANTHROPIC_API_KEY (variabile d'ambiente o .env.local)");
  const client = new Anthropic({ apiKey: key, maxRetries: 2 });
  let saved = 0;
  for (const r of todo) {
    const names = namesIn(G.guideTranslationDoc(r.g), NAMES);
    const done = await translateGuideText(client, r.source, r.missing, names, {
      onError: (to, e) => console.log(`  ${r.slug} ${to}: errore ${e instanceof Error ? e.message : e}`),
    });
    for (const l of r.missing) if (!done[l]) console.log(`  ${r.slug} ${l}: nessuna traduzione valida (rifiuto, testo troncato, errore o controlli non superati)`);
    if (!Object.keys(done).length) continue;
    try {
      const n = await save(r, done);
      saved += n;
      if (n) console.log(`  ${r.slug}: salvate ${Object.keys(done).join(", ")}`);
    } catch (e) {
      console.log(`  ${r.slug}: salvataggio non riuscito: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`${saved} traduzioni salvate (le pagine si aggiornano da sole entro qualche minuto: ISR)`);
  await db.end();
}
