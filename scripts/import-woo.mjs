#!/usr/bin/env node
/**
 * Importa il database carte di Origins TCG dal sito community World of Origins (worldoforigins.fun)
 * e scrive `src/lib/data/woo-cards.json`: solo dati (nomi, costi, statistiche, testi, tag, chiavi ufficiali),
 * nessuna immagine. Autorizzato da Pierluigi il 15/09/2026 perché la Demo 2.0 non mostra la collezione.
 *
 * Uso:  node scripts/import-woo.mjs [--patch demo-v2-2026:v0.6.3] [--offline <cartella con i chunk .js>]
 *
 * Come funziona: legge la home del sito, trova il bundle `index-*.js`, da lì i chunk `cardStats-*`,
 * `cardMetadata-*` e `cardKeyMapping-*`, li importa come moduli ES e unisce la patch più recente.
 * A fine corsa stampa le differenze rispetto al JSON precedente (carte nuove, rimosse, statistiche e
 * testi cambiati: i testi cambiati vanno ritradotti in `card-lore.ts`) e confronta lo storico scritto a mano
 * in `card-history.ts` con le statistiche per patch di World of Origins.
 */
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const SITE = "https://worldoforigins.fun";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/lib/data/woo-cards.json");

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const patchArg = opt("--patch");
const offline = opt("--offline");

async function text(url) {
  const r = await fetch(url, { headers: { "user-agent": "OriginsMeta importer (staff@originsmeta.com)" } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
}

/** Scarica (o legge da cartella) i chunk e li restituisce come moduli. */
async function loadChunks() {
  const names = ["cardStats", "cardMetadata", "cardKeyMapping"];
  const dir = offline ? path.resolve(offline) : await mkdtemp(path.join(tmpdir(), "woo-"));
  const files = {};
  if (offline) {
    const { readdir } = await import("node:fs/promises");
    const all = await readdir(dir);
    for (const n of names) {
      const f = all.find((x) => x.startsWith(`${n}-`) && x.endsWith(".js"));
      if (!f) throw new Error(`Chunk ${n}-*.js non trovato in ${dir}`);
      files[n] = path.join(dir, f);
    }
  } else {
    const html = await text(`${SITE}/`);
    const indexJs = html.match(/assets\/index-[\w-]+\.js/)?.[0];
    if (!indexJs) throw new Error("Bundle index-*.js non trovato nella home di World of Origins");
    const index = await text(`${SITE}/${indexJs}`);
    for (const n of names) {
      const chunk = index.match(new RegExp(`${n}-[\\w-]+\\.js`))?.[0];
      if (!chunk) throw new Error(`Chunk ${n}-*.js non referenziato da ${indexJs}`);
      const src = await text(`${SITE}/assets/${chunk}`);
      files[n] = path.join(dir, chunk.replace(/\.js$/, ".mjs"));
      await writeFile(files[n], src);
    }
  }
  const mods = {};
  for (const n of names) mods[n] = await import(pathToFileURL(files[n]).href);
  return mods;
}

/** I nomi degli export sono minificati: si riconoscono dalla forma dei dati. */
function pick(mod, test, what) {
  for (const v of Object.values(mod)) if (test(v)) return v;
  throw new Error(`Export non riconosciuto: ${what}`);
}
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const mods = await loadChunks();
const statsByPatch = pick(mods.cardStats, (v) => isObj(v) && Object.values(v).some((p) => isObj(p) && Object.values(p).some((c) => isObj(c) && "cost" in c && "name" in c)), "cardStats");
const metaByPatch = pick(mods.cardMetadata, (v) => isObj(v) && Object.values(v).some((p) => isObj(p) && Object.values(p).some((c) => isObj(c) && ("ability" in c || "keywords" in c))), "cardMetadata abilities");
const tokensByPatch = pick(mods.cardMetadata, (v) => isObj(v) && Object.values(v).some((p) => Array.isArray(p) && p.some((t) => isObj(t) && "id" in t && "cardType" in t)), "cardMetadata tokens");
const keyMap = pick(mods.cardKeyMapping, (v) => isObj(v) && Object.values(v).some((k) => typeof k === "string" && /^C\d+_[MS][BC]$/.test(k)), "cardKeyMapping");

const patchKeys = Object.keys(statsByPatch);
const patch = patchArg ?? patchKeys[patchKeys.length - 1];
if (!statsByPatch[patch]) throw new Error(`Patch ${patch} non trovata. Disponibili: ${patchKeys.join(", ")}`);
const S = statsByPatch[patch];
const M = metaByPatch[patch] ?? {};
const T = tokensByPatch[patch] ?? [];

const isVariant = (id) => /_token_\d+$/.test(id) || /_\d+$/.test(id);
const clean = (s) => (typeof s === "string" ? s.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim() : undefined);
const formerName = (s) => (typeof s === "string" && s && !s.endsWith("\\") ? s : undefined);

const entries = [];
for (const [id, st] of Object.entries(S)) {
  if (isVariant(id)) continue;
  const md = M[id] ?? {};
  const minion = st.cardType === "minion";
  entries.push({
    id,
    slug: slugify(st.name),
    key: keyMap[id],
    name: st.name,
    formerName: formerName(st.formerName),
    type: minion ? "unit" : "spell",
    legendary: Boolean(st.isLegendary),
    status: st.status === "active" ? "active" : "removed",
    mana: st.cost,
    power: minion ? st.power : undefined,
    health: minion ? st.health : undefined,
    alignment: st.alignment,
    rarity: md.rarity,
    series: md.series,
    keywords: Array.isArray(md.keywords) ? md.keywords : [],
    ability: clean(md.ability) || undefined,
    tokenIds: (md.tokens ?? []).filter((t) => !t.isTextToken && !isVariant(t.id)).map((t) => t.id),
  });
}
for (const t of T) {
  if (S[t.id] || isVariant(t.id) || t.isTextToken) continue;
  const minion = t.cardType === "minion";
  entries.push({
    id: t.id,
    slug: slugify(t.name),
    key: keyMap[t.id],
    name: t.name,
    type: "token",
    tokenOnly: true,
    legendary: false,
    status: "active",
    mana: t.cost,
    power: minion ? t.power : undefined,
    health: minion ? t.health : undefined,
    alignment: t.alignment,
    keywords: Array.isArray(t.keywords) ? t.keywords : [],
    ability: clean(t.ability) || undefined,
    tokenIds: [],
  });
}

// slug unici
const bySlug = new Map();
for (const e of entries) {
  if (bySlug.has(e.slug)) throw new Error(`Slug duplicato "${e.slug}": ${bySlug.get(e.slug).id} e ${e.id}`);
  bySlug.set(e.slug, e);
}
const idToSlug = new Map(entries.map((e) => [e.id, e.slug]));
for (const e of entries) {
  // in World of Origins `tokens` elenca le carte collegate (create o richiamate dal testo)
  e.related = e.tokenIds.map((id) => idToSlug.get(id)).filter(Boolean);
  delete e.tokenIds;
  if (!e.related.length) delete e.related;
  for (const k of Object.keys(e)) if (e[k] === undefined) delete e[k];
}
entries.sort((a, b) => a.name.localeCompare(b.name, "en"));

const out = {
  source: SITE,
  license: "Dati della community World of Origins, usati con il consenso implicito del sito pubblico; nessuna immagine importata.",
  patch,
  fetched: new Date().toISOString().slice(0, 10),
  cards: entries,
};

// ---------- differenze rispetto al JSON precedente ----------
let prev = null;
if (existsSync(OUT)) {
  try {
    prev = JSON.parse(await readFile(OUT, "utf8"));
  } catch {
    prev = null;
  }
}
if (prev?.cards) {
  const old = new Map(prev.cards.map((c) => [c.id, c]));
  const cur = new Map(entries.map((c) => [c.id, c]));
  const lines = [];
  for (const [id, c] of cur) {
    const o = old.get(id);
    if (!o) {
      lines.push(`NUOVA     ${id} (${c.name}) → aggiungere saga/origine/traduzione in card-lore.ts`);
      continue;
    }
    const d = [];
    for (const f of ["name", "status", "mana", "power", "health", "type", "legendary", "rarity", "alignment", "key"]) if (o[f] !== c[f]) d.push(`${f} ${o[f]} → ${c[f]}`);
    if ((o.ability ?? "") !== (c.ability ?? "")) d.push("testo abilità cambiato → aggiornare la traduzione IT in card-lore.ts");
    if (JSON.stringify(o.keywords) !== JSON.stringify(c.keywords)) d.push("keywords cambiate");
    if (d.length) lines.push(`CAMBIATA  ${id}: ${d.join("; ")}`);
  }
  for (const id of old.keys()) if (!cur.has(id)) lines.push(`SPARITA   ${id}`);
  console.log(lines.length ? `Differenze rispetto a ${prev.patch} (${prev.fetched}):\n  ${lines.join("\n  ")}` : `Nessuna differenza rispetto a ${prev.patch} (${prev.fetched}).`);
}

await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
const active = entries.filter((e) => e.status === "active" && !e.tokenOnly);
console.log(`Scritto ${path.relative(ROOT, OUT)}: patch ${patch}, ${active.length} carte attive, ${entries.filter((e) => e.status === "removed").length} rimosse, ${entries.filter((e) => e.tokenOnly).length} carte create.`);
console.log(`Senza chiave ufficiale: ${entries.filter((e) => !e.key).map((e) => e.id).join(", ") || "nessuna"}`);

// ---------- controllo incrociato dello storico scritto a mano ----------
const historyFile = path.join(ROOT, "src/lib/data/card-history.ts");
if (existsSync(historyFile)) {
  try {
    const { cardHistory } = await import(pathToFileURL(historyFile).href);
    const base = patch.split(":")[0];
    const slugToId = new Map(entries.map((e) => [e.slug, e.id]));
    const problems = [];
    for (const [slug, changes] of Object.entries(cardHistory)) {
      const id = slugToId.get(slug);
      if (!id) {
        problems.push(`${slug}: slug non presente nel database`);
        continue;
      }
      for (const ch of changes) {
        if (!ch.from || !ch.to) continue;
        const cur = statsByPatch[`${base}:v${ch.patch}`]?.[id];
        if (!cur) continue;
        const want = { mana: ch.to.mana, power: ch.to.power, health: ch.to.health };
        const got = { mana: cur.cost, power: cur.cardType === "minion" ? cur.power : undefined, health: cur.cardType === "minion" ? cur.health : undefined };
        for (const f of ["mana", "power", "health"]) if (want[f] !== undefined && want[f] !== got[f]) problems.push(`${slug} @${ch.patch}: ${f} atteso ${want[f]}, World of Origins dice ${got[f]}`);
      }
    }
    console.log(problems.length ? `Storico da verificare:\n  ${problems.join("\n  ")}` : "Storico scritto a mano coerente con le statistiche per patch di World of Origins.");
  } catch (e) {
    console.log(`Controllo storico saltato: ${e.message}`);
  }
}
