// Pubblica un mazzo torneo (tre mazzi Conquest con una guida) a nome di un iscritto, con il suo permesso (28/10/2026,
// richiesta di Pierluigi: le tre liste di SouL dalla Crimson Cup, "devono diventare un deck da torneo e devono essere
// linkate e i codici facilmente copiabili"). È il gemello di publish-deck-as.mjs per i Mazzi torneo: stesse regole della
// Server Action `publishDeckSet` (src/lib/community/deckSetActions.ts) per i tre mazzi, le regole Conquest, il nome e la
// guida, con le funzioni pure di src/lib/community/deckSets.ts (le stesse del sito); proprietario l'iscritto, stato
// published. Lo slug lo sceglie il file (`slug`), così un articolo può linkare la scheda prima della pubblicazione.
// Non passa dal sito, quindi NON fa: l'annuncio in #community-decks su Discord, l'avviso a chi lo segue, IndexNow e la
// traduzione automatica (le traduzioni arrivano già pronte dal file, con l'impronta della guida come translateDeckSetLater).
// Le pagine (/decks/tournament, la scheda, il profilo) si aggiornano da sole con l'ISR entro qualche minuto.
// Uso: node scripts/publish-deck-set-as.mjs <username> <file.json> [--apply] [--env <.env.local>]
// Il file: { slug, name, decks: [3 × { name, archetype, legendary, cards: [12 slug] }], guide: { lang, summary, deck_1?,
//            …, notes? }, translations?: { <lingua>: { summary, … } }, videos?: [{ url, title?, start? }], links?: [{ label, url }] }.
// Senza --apply è una prova: controlla tutto e mostra il trio, non scrive.
import * as nodeModule from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// deckSets.ts importa i suoi moduli senza estensione: come nei test, si aggiunge `.ts` agli import relativi (Node ≥ 22.15)
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
const { encodeOmCode } = await import("../src/lib/deckcode.ts");
const { readDeckMedia, videoFields, linkFields } = await import("../src/lib/videos.ts");
const { DECK_SET_GUIDE_SECTIONS, DECK_SET_SIZE, deckSetGuideHash, deckSetGuideText, deckSetIssue, deckSetWordCount, readDeckSetGuide } = await import(
  "../src/lib/community/deckSets.ts"
);
const { GUIDE_MIN_WORDS } = await import("../src/lib/community/deckQuality.ts");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const apply = args.includes("--apply");
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--env");
const [username, file] = positional;
if (!username || !file) {
  console.error("Uso: node scripts/publish-deck-set-as.mjs <username> <file.json> [--apply] [--env <.env.local>]");
  process.exit(1);
}
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const spec = JSON.parse(readFileSync(path.resolve(file), "utf8"));
const read = (rel) => readFileSync(path.join(root, rel), "utf8");
const LOCALES = JSON.parse(`[${/export const locales = \[([^\]]+)\]/.exec(read("src/lib/i18n.ts"))[1]}]`);
const ARCHETYPES = [...read("src/lib/data/decks.ts").matchAll(/^\s{2}(\w+): n\(/gm)].map((m) => m[1]);
const DISTINCT_CARDS = Number(/distinctCards:\s*(\d+)/.exec(read("src/lib/deckrules.ts"))[1]);
const cards = JSON.parse(read("src/lib/data/woo-cards.json")).cards;
const bySlug = new Map(cards.map((c) => [c.slug, c]));
// nome di un mazzo o del trio: 3-60 caratteri, spazi compattati (cleanDeckName di util.ts)
const cleanName = (v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 60);

// Slug: lo stesso vincolo di community_deck_sets_slug_check
const slug = String(spec.slug ?? "");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 80) fail(`Slug "${slug}" non valido.`);
const name = cleanName(spec.name);
if (name.length < 3) fail("Nome del mazzo torneo troppo corto.");

// I tre mazzi: le regole di checkDeck (util.ts) senza carte personalizzate, poi quelle Conquest (deckSetIssue)
if (!Array.isArray(spec.decks) || spec.decks.length !== DECK_SET_SIZE) fail(`Servono ${DECK_SET_SIZE} mazzi.`);
const decks = spec.decks.map((d, i) => {
  const leg = bySlug.get(d.legendary);
  if (!leg || !leg.legendary || leg.status !== "active") fail(`Mazzo ${i + 1}: "${d.legendary}" non è una Leggendaria attiva.`);
  const base = Array.isArray(d.cards) ? d.cards : [];
  if (base.length !== DISTINCT_CARDS || new Set(base).size !== base.length || base.includes(d.legendary)) fail(`Mazzo ${i + 1}: servono ${DISTINCT_CARDS} carte base diverse.`);
  for (const s of base) {
    const c = bySlug.get(s);
    if (!c || c.legendary || c.type === "token" || c.status !== "active") fail(`Mazzo ${i + 1}: "${s}" non è una carta base attiva.`);
  }
  if (!ARCHETYPES.includes(d.archetype)) fail(`Mazzo ${i + 1}: archetipo "${d.archetype}" sconosciuto (${ARCHETYPES.join(", ")}).`);
  const deckName = cleanName(d.name).length >= 3 ? cleanName(d.name) : leg.name;
  const state = { name: deckName, legendary: d.legendary, cards: base, customCards: [] };
  return { name: deckName, legendary: d.legendary, cards: base, custom_cards: [], archetype: d.archetype, code_om: encodeOmCode(state) };
});
const issue = deckSetIssue(decks.map((d) => ({ name: d.name, legendary: d.legendary, cards: d.cards, customCards: [] })));
if (issue) fail(`Regole Conquest non rispettate: ${JSON.stringify(issue)}`);

// Guida: readDeckSetGuide (riassunto 20-600 caratteri, sezioni fino a 2000, chiavi di deck_set_guide_ok)
const g = spec.guide ?? {};
if (!LOCALES.includes(g.lang)) fail(`Lingua della guida "${g.lang}" non valida.`);
for (const k of Object.keys(g)) if (k !== "lang" && k !== "summary" && !DECK_SET_GUIDE_SECTIONS.includes(k)) fail(`Sezione "${k}" sconosciuta.`);
const guide = readDeckSetGuide((k) => g[k], LOCALES, g.lang);
if (!guide) fail("Riassunto della guida troppo corto (almeno 20 caratteri).");
for (const k of [...DECK_SET_GUIDE_SECTIONS, "summary"]) if (g[k] && g[k].trim().length !== (guide[k] ?? "").length) fail(`Sezione "${k}" oltre il limite di lunghezza.`);
const words = deckSetWordCount({ guide });

// Traduzioni pronte: gli stessi campi della guida, con l'impronta del testo da cui sono fatte (come translateDeckSetLater)
const hash = deckSetGuideHash(guide);
const fields = Object.keys(deckSetGuideText(guide)).sort().join(",");
const at = new Date().toISOString();
const translations = {};
for (const [locale, t] of Object.entries(spec.translations ?? {})) {
  if (!LOCALES.includes(locale) || locale === guide.lang) fail(`Traduzione in "${locale}" non ammessa.`);
  const text = readDeckSetGuide((k) => t[k], LOCALES, locale);
  if (!text || Object.keys(deckSetGuideText(text)).sort().join(",") !== fields) fail(`Traduzione in "${locale}": servono gli stessi campi della guida (${fields}).`);
  translations[locale] = { hash, at, model: opt("--model") ?? "manual", guide: deckSetGuideText(text) };
}

// Video e risorse: le regole del modulo (readDeckMedia di videos.ts) con i nomi dei suoi campi
const mediaFields = {};
(spec.videos ?? []).forEach((v, i) => {
  const f = videoFields(i);
  mediaFields[f.url] = v.url ?? "";
  mediaFields[f.title] = v.title ?? "";
  mediaFields[f.start] = v.start != null ? String(v.start) : "";
});
(spec.links ?? []).forEach((l, i) => {
  const f = linkFields(i);
  mediaFields[f.url] = l.url ?? "";
  mediaFields[f.label] = l.label ?? "";
});
const media = readDeckMedia((k) => (k in mediaFields ? mediaFields[k] : null));
if (!media.ok) fail(`Video o link non validi: ${media.code} (riga ${media.index + 1}).`);

const row = { slug, name, decks, guide, translations, videos: media.videos, links: media.links };

// Il trio, prima di collegarsi al database (la prova mostra i controlli anche senza rete)
console.log(`Mazzo torneo: ${name} (/${guide.lang}/decks/tournament/${slug})`);
decks.forEach((d, i) => console.log(`  ${i + 1}. ${d.name} [${d.archetype}] · ${bySlug.get(d.legendary).name} + ${d.cards.map((s) => bySlug.get(s).name).join(", ")}`));
console.log(
  `Guida in ${guide.lang} (${words} parole${words < GUIDE_MIN_WORDS ? `, sotto le ${GUIDE_MIN_WORDS}: scheda noindex` : ""}), traduzioni: ${Object.keys(translations).join(", ") || "nessuna"}`,
);

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
const db = new pg.Client({
  host: env.SUPABASE_DB_HOST || `db.${env.SUPABASE_PROJECT_REF}.supabase.co`,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER || "postgres",
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await db.connect();
try {
  const r = await db.query("select id, username, display_name, badge from public.profiles where username = $1", [username.toLowerCase()]);
  const p = r.rows[0];
  if (!p) throw new Error(`Nessun profilo con nome utente "${username}".`);
  // lo stesso slug già usato (secondo lancio dello script o slug di un altro trio): non si crea niente
  const same = await db.query("select slug, status, owner from public.community_deck_sets where slug = $1", [slug]);
  console.log(`Proprietario: ${p.display_name ?? p.username} (@${p.username}, ruolo ${p.badge ?? "community"})`);
  if (same.rowCount) {
    const mine = same.rows[0].owner === p.id;
    console.log(`${mine ? "Già pubblicato" : "Slug già usato da un altro mazzo torneo"}: https://originsmeta.com/${guide.lang}/decks/tournament/${slug} (stato ${same.rows[0].status}). Niente scritto.`);
    if (!mine) process.exitCode = 3;
  } else if (!apply) {
    console.log("Prova a secco: niente scritto. Per pubblicare, rilanciare con --apply.");
  } else {
    await db.query(
      `insert into public.community_deck_sets (slug, owner, status, name, decks, guide, translations, videos, links)
       values ($1, $2, 'published', $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)`,
      [slug, p.id, name, JSON.stringify(decks), JSON.stringify(guide), JSON.stringify(translations), JSON.stringify(row.videos), JSON.stringify(row.links)],
    );
    console.log(`Pubblicato: https://originsmeta.com/${guide.lang}/decks/tournament/${slug} (in /decks/tournament e sul profilo entro qualche minuto).`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 4;
} finally {
  await db.end();
}
