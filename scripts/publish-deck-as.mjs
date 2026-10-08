// Pubblica un mazzo della community a nome di un iscritto, con il suo permesso (08/10/2026, richiesta di Pierluigi: il
// mazzo Van Helsing del video di coachcrono, "firmato coachcrono" con il video incorporato nella scheda).
// Il mazzo nasce come se l'avesse pubblicato lui dal deck builder: stesse regole della Server Action `publishDeck`
// (src/lib/community/actions.ts) per carte, guida, video, codice OM1 e slug; proprietario l'iscritto, stato published.
// Non passa dal sito, quindi NON fa: l'annuncio in #community-decks su Discord, l'avviso a chi lo segue, IndexNow e la
// traduzione automatica (le traduzioni, se ci sono, arrivano già pronte dal file con l'impronta della guida, come
// `translate-decks.mjs --from`). Le pagine (/decks, la scheda, il profilo, le schede carta) si aggiornano da sole
// con l'ISR entro qualche minuto (le schede carta entro un'ora).
// Uso: node scripts/publish-deck-as.mjs <username> <file.json> [--apply] [--env <.env.local>]
// Il file: { name, legendary, cards: [12 slug], archetype, deck_types, videos: [{ url, title?, start? }],
//            links: [{ label, url }], guide: { lang, summary, strengths?, … }, translations?: { <lingua>: { summary, … } } }.
// Senza --apply è una prova: controlla tutto e mostra la riga, non scrive.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { encodeOmCode } from "../src/lib/deckcode.ts";
import { readDeckMedia, videoFields, linkFields } from "../src/lib/videos.ts";
import { guideHash, guideSections, guideText, parseTranslation } from "../src/lib/community/deckTranslation.ts";

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
  console.error("Uso: node scripts/publish-deck-as.mjs <username> <file.json> [--apply] [--env <.env.local>]");
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
const DECK_TYPES = ["ladder", "competitive", "fun", "tournament"]; // deckTypes di src/lib/community/types.ts
const DISTINCT_CARDS = Number(/distinctCards:\s*(\d+)/.exec(read("src/lib/deckrules.ts"))[1]);
const cards = JSON.parse(read("src/lib/data/woo-cards.json")).cards;
const bySlug = new Map(cards.map((c) => [c.slug, c]));

// Nome (3-60 caratteri, spazi compattati: cleanDeckName di util.ts)
const name = String(spec.name ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
if (name.length < 3) fail("Nome del mazzo troppo corto.");

// Carte: le regole di checkDeck (util.ts), senza carte personalizzate
const leg = bySlug.get(spec.legendary);
if (!leg || !leg.legendary || leg.status !== "active") fail(`"${spec.legendary}" non è una Leggendaria attiva.`);
const base = Array.isArray(spec.cards) ? spec.cards : [];
if (base.length !== DISTINCT_CARDS || new Set(base).size !== base.length || base.includes(spec.legendary)) fail(`Servono ${DISTINCT_CARDS} carte base diverse.`);
for (const s of base) {
  const c = bySlug.get(s);
  if (!c || c.legendary || c.type === "token" || c.status !== "active") fail(`"${s}" non è una carta base attiva.`);
}

if (!ARCHETYPES.includes(spec.archetype)) fail(`Archetipo "${spec.archetype}" sconosciuto (${ARCHETYPES.join(", ")}).`);
const deckTypes = [...new Set(spec.deck_types ?? [])].filter((t) => DECK_TYPES.includes(t));
if (!deckTypes.length) fail("Serve almeno un tipo di mazzo (ladder, competitive, fun, tournament).");

// Guida: parseGuide di util.ts (riassunto 20-600 caratteri, sezioni fino a 2000)
const clip = (v, max) => String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
const g = spec.guide ?? {};
if (!LOCALES.includes(g.lang)) fail(`Lingua della guida "${g.lang}" non valida.`);
const guide = { lang: g.lang, summary: clip(g.summary, 600) };
if (guide.summary.length < 20) fail("Riassunto della guida troppo corto (almeno 20 caratteri).");
for (const k of guideSections) {
  const v = clip(g[k], 2000);
  if (v) guide[k] = v;
}
for (const k of Object.keys(g)) if (k !== "lang" && k !== "summary" && !guideSections.includes(k)) fail(`Sezione "${k}" sconosciuta.`);
const words = Object.values(guideText(guide)).join(" ").split(/\s+/).filter(Boolean).length;

// Video e risorse: le regole del modulo (readDeckMedia di videos.ts) con i nomi dei suoi campi
const fields = {};
(spec.videos ?? []).forEach((v, i) => {
  const f = videoFields(i);
  fields[f.url] = v.url ?? "";
  fields[f.title] = v.title ?? "";
  fields[f.start] = v.start != null ? String(v.start) : "";
});
(spec.links ?? []).forEach((l, i) => {
  const f = linkFields(i);
  fields[f.url] = l.url ?? "";
  fields[f.label] = l.label ?? "";
});
const media = readDeckMedia((k) => (k in fields ? fields[k] : null));
if (!media.ok) fail(`Video o link non validi: ${media.code} (riga ${media.index + 1}).`);

// Traduzioni pronte: stessi campi della guida, con l'impronta del testo da cui sono fatte (come translate-decks --from)
const hash = guideHash(guide);
const at = new Date().toISOString();
const translations = {};
for (const [locale, t] of Object.entries(spec.translations ?? {})) {
  if (!LOCALES.includes(locale) || locale === guide.lang) fail(`Traduzione in "${locale}" non ammessa.`);
  const text = parseTranslation(guideText(guide), JSON.stringify(t));
  if (!text) fail(`Traduzione in "${locale}" scartata: campi diversi dalla guida o testo non valido.`);
  translations[locale] = { hash, at, model: opt("--model") ?? "manual", guide: text };
}

const slugify = (s) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const newSlug = () => `${slugify(name).slice(0, 40).replace(/-+$/, "") || "deck"}-${randomUUID().replace(/-/g, "").slice(0, 4)}`;

const row = {
  name,
  legendary: spec.legendary,
  cards: base,
  custom_cards: [],
  archetype: spec.archetype,
  deck_types: deckTypes,
  video_url: media.videos[0]?.url ?? null,
  videos: media.videos,
  links: media.links,
  guide,
  translations,
  code_om: encodeOmCode({ name, legendary: spec.legendary, cards: base, customCards: [] }),
};

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
  // lo stesso mazzo già pubblicato (secondo lancio dello script): non si crea un doppione
  const same = await db.query("select slug, status from public.community_decks where owner = $1 and code_om = $2 and status <> 'draft'", [p.id, row.code_om]);
  console.log(`Proprietario: ${p.display_name ?? p.username} (@${p.username}, ruolo ${p.badge ?? "community"})`);
  console.log(`Mazzo: ${name} · ${leg.name} + ${base.map((s) => bySlug.get(s).name).join(", ")}`);
  console.log(`Archetipo ${row.archetype}, tipi ${deckTypes.join(", ")}, guida in ${guide.lang} (${words} parole), traduzioni: ${Object.keys(translations).join(", ") || "nessuna"}`);
  console.log(`Video: ${media.videos.map((v) => v.url + (v.title ? ` («${v.title}»)` : "")).join(", ") || "nessuno"}`);
  if (same.rowCount) {
    console.log(`Già pubblicato: https://originsmeta.com/${guide.lang}/decks/community/${same.rows[0].slug} (stato ${same.rows[0].status}). Niente scritto.`);
  } else if (!apply) {
    console.log("Prova a secco: niente scritto. Per pubblicare, rilanciare con --apply.");
  } else {
    let slug = newSlug();
    for (let attempt = 0; ; attempt++) {
      try {
        await db.query(
          `insert into public.community_decks
             (slug, owner, status, name, legendary, cards, custom_cards, archetype, deck_types, video_url, videos, links, guide, translations, code_om)
           values ($1, $2, 'published', $3, $4, $5::jsonb, $6::jsonb, $7, $8::text[], $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14)`,
          [slug, p.id, row.name, row.legendary, JSON.stringify(row.cards), JSON.stringify(row.custom_cards), row.archetype, row.deck_types, row.video_url,
            JSON.stringify(row.videos), JSON.stringify(row.links), JSON.stringify(row.guide), JSON.stringify(row.translations), row.code_om],
        );
        break;
      } catch (e) {
        if (e.code !== "23505" || attempt >= 5) throw e;
        slug = newSlug();
      }
    }
    console.log(`Pubblicato: https://originsmeta.com/${guide.lang}/decks/community/${slug} (in /decks e sul profilo entro qualche minuto).`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 4;
} finally {
  await db.end();
}
