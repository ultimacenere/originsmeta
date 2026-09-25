#!/usr/bin/env node
/**
 * Pubblica sul Discord di OriginsMeta i contenuti del sito che nascono nel repository: news, guide e patch notes
 * (fase B del piano del server, doc "Discord OriginsMeta" del 22/09/2026). Regole di Pierluigi del 24/09/2026:
 * "tutti articoli e guide finiscono nel nostro Discord", le news "negli annunci" e in `#site-news` ("entrambi"),
 * "il metashifting sul canale giusto", e "quando pubblichiamo sul sito deve essere pubblicato live su Discord".
 * I mazzi della community e i tornei nascono sul sito, non nel repository: li annuncia il sito stesso nel momento in
 * cui vengono pubblicati (`src/lib/community/discordDeck.ts`, `src/lib/tournament/notify.ts`); qui i mazzi
 * passano solo per l'archivio.
 *
 * Dove va cosa (un webhook per canale; senza il suo webhook quel canale si salta, con un avviso):
 *   news          → #announcements (DISCORD_WEBHOOK_ANNOUNCEMENTS) e #site-news (DISCORD_WEBHOOK_NEWS)
 *   patch notes   → anche #metashifting (DISCORD_WEBHOOK_METASHIFTING), con il link alla patch su /metashifting;
 *                   una news è "patch notes" quando una patch di `cards.ts` la cita nel campo `news`
 *   guide         → #guides (DISCORD_WEBHOOK_GUIDES) o, finché non c'è, #site-news
 *   mazzi         → #community-decks (DISCORD_WEBHOOK_DECKS), solo nell'archivio
 *
 * Tre modi:
 *   1. push (la GitHub Action a ogni push su main): gli slug nuovi fra BEFORE e AFTER, letti da GitHub; ogni voce
 *      parte quando la sua pagina risponde 200 (il deploy di Vercel parte con lo stesso push). Una news corretta
 *      dopo l'uscita non si riannuncia: conta solo lo slug nuovo.
 *   2. archivio, BACKFILL_SINCE=aaaa-mm-gg (una volta, per popolare il server; scelta di Pierluigi: da settembre):
 *      le news da quella data, tutte le patch notes (solo in #metashifting quelle più vecchie), tutte le guide, i
 *      mazzi pubblicati da quella data; tutto in ordine cronologico, dal più vecchio.
 *   3. a mano, SLUGS="news:<slug>,guides:<slug>,decks:<slug>".
 * Titolo, descrizione e copertina vengono dai meta Open Graph delle pagine italiana, inglese e spagnola: esattamente
 * quello che vede chi apre il link. Nessuna menzione (allowed_mentions vuoto).
 *
 * Altre variabili: REPO ("proprietario/nome") e AFTER per leggere i file da GitHub (senza REPO si leggono dalla
 * cartella del repo, per le prove in locale); SITE_URL (predefinito https://originsmeta.com); WAIT_MINUTES
 * (predefinito 20, attesa del deploy); DRY_RUN=1 elenca cosa partirebbe senza mandare nulla (DRY_RUN_JSON=1 stampa
 * anche i messaggi). Prova in locale:
 *   DRY_RUN=1 BACKFILL_SINCE=2026-09-01 node scripts/discord-announce.mjs
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SITE = (process.env.SITE_URL || "https://originsmeta.com").replace(/\/+$/, "");
const DRY_RUN = process.env.DRY_RUN === "1";
const WAIT_MS = Number(process.env.WAIT_MINUTES || 20) * 60_000;
const POLL_MS = 20_000;
/**
 * Attesa delle pagine inglese e spagnola, lette dopo l'italiana: sono dello stesso deploy, quindi se l'italiana è online
 * lo sono anche loro. Un minuto basta per un intoppo di rete; una lingua che manca davvero resta fuori dal messaggio
 * senza fermare l'Action per WAIT_MINUTES a ogni voce.
 */
const SIBLING_WAIT_MS = Math.min(WAIT_MS, 60_000);
/** Pausa fra due messaggi: Discord accetta al massimo 5 richieste ogni 2 secondi per webhook e 30 al minuto per canale. */
const PAUSE_MS = 2_500;
/** Menta del sito (--color-mint #31e3bd). */
const MINT = 0x31e3bd;

const FILES = {
  news: "src/lib/data/news.ts",
  guides: "src/lib/content/guides.ts",
  cards: "src/lib/data/cards.ts",
  supabase: "src/lib/supabase/env.ts",
};

/** I canali: variabile del webhook, canale di riserva e riga in cima al messaggio. */
export const CHANNELS = {
  announcements: { env: "DISCORD_WEBHOOK_ANNOUNCEMENTS", name: "#announcements", label: "📰 **Nuova news · New article · Nueva noticia**" },
  news: { env: "DISCORD_WEBHOOK_NEWS", name: "#site-news", label: "📰 **Nuova news · New article · Nueva noticia**" },
  guides: { env: "DISCORD_WEBHOOK_GUIDES", fallback: "news", name: "#guides", label: "📘 **Nuova guida · New guide · Nueva guía**" },
  metashifting: { env: "DISCORD_WEBHOOK_METASHIFTING", name: "#metashifting", label: "⚖️ **Patch notes · MetaShifting**" },
  decks: { env: "DISCORD_WEBHOOK_DECKS", name: "#community-decks", label: "🃏 **Nuovo mazzo · New deck · Nuevo mazo**" },
};

/** Percorso delle pagine per tipo di voce. */
const PATHS = { news: "news", guides: "guides", decks: "decks/community" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- lettura dei file del repo (testo, senza eseguire TypeScript) ---------- */

/** News in ordine di file: slug e data di ogni voce (il tipo scrive `slug: string`, senza virgolette, e non conta). */
export function newsEntries(source) {
  return [...source.matchAll(/^\s*slug:\s*"([a-z0-9-]+)",?[\s\S]*?^\s*date:\s*"(\d{4}-\d{2}-\d{2})"/gm)].map((m, index) => ({ slug: m[1], date: m[2], index }));
}

export function newsSlugs(source) {
  return new Set(newsEntries(source).map((e) => e.slug));
}

/** Guide: l'elenco `guideSlugs`, l'indice di tutte le guide pubblicate. */
export function guideSlugs(source) {
  const block = source.match(/export const guideSlugs = \[([\s\S]*?)\] as const/);
  return new Set(block ? [...block[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]) : []);
}

/** Data di aggiornamento di ogni guida (campo `updated`): serve solo a metterle in ordine nell'archivio. */
export function guideDates(source) {
  const out = new Map();
  for (const m of source.matchAll(/^\s*slug:\s*"([a-z0-9-]+)",?[\s\S]*?^\s*updated:\s*"(\d{4}-\d{2}-\d{2})"/gm)) if (!out.has(m[1])) out.set(m[1], m[2]);
  return out;
}

/** Patch notes: slug della news → { patch, date }, dal campo `news` delle patch in `cards.ts`. */
export function patchNews(source) {
  const start = source.indexOf("export const patches");
  if (start < 0) return new Map();
  const block = source.slice(start, source.indexOf("\n};", start));
  const keys = [...block.matchAll(/^\s{2}"([^"]+)":\s*\{/gm)];
  const out = new Map();
  keys.forEach((k, i) => {
    const chunk = block.slice(k.index, i + 1 < keys.length ? keys[i + 1].index : undefined);
    const news = chunk.match(/\bnews:\s*"([a-z0-9-]+)"/);
    const date = chunk.match(/\bdate:\s*"(\d{4}-\d{2}-\d{2})"/);
    if (news) out.set(news[1], { patch: k[1], date: date?.[1] ?? "" });
  });
  return out;
}

/** Slug presenti in `after` e non in `before`. */
export function added(before, after) {
  return [...after].filter((s) => !before.has(s));
}

/* ---------- dove va cosa ---------- */

/** Canali di una news: annunci e #site-news, più #metashifting se è patch notes. */
export function newsChannels(slug, patches) {
  return patches.has(slug) ? ["announcements", "news", "metashifting"] : ["announcements", "news"];
}

/**
 * Voci dell'archivio da una data (aaaa-mm-gg), in ordine cronologico: news da quella data (con #metashifting se
 * sono patch notes), patch notes più vecchie solo in #metashifting, tutte le guide, i mazzi da quella data.
 * A parità di giorno le news più in basso nel file (le più vecchie) vengono prima.
 */
export function backfillItems({ news, guides, guideDate, patches, decks = [] }, since) {
  const items = [];
  for (const e of news) {
    const base = { kind: "news", slug: e.slug, date: e.date, seq: -e.index, patch: patches.get(e.slug)?.patch };
    if (e.date >= since) items.push({ ...base, channels: newsChannels(e.slug, patches) });
    else if (patches.has(e.slug)) items.push({ ...base, channels: ["metashifting"] });
  }
  for (const slug of guides) items.push({ kind: "guides", slug, date: guideDate.get(slug) ?? "0000-00-00", seq: 0, channels: ["guides"] });
  for (const d of decks) if (d.date >= since) items.push({ kind: "decks", slug: d.slug, date: d.date, seq: Date.parse(d.createdAt) || 0, channels: ["decks"] });
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.seq - b.seq);
}

/* ---------- messaggi ---------- */

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Valore di un meta Open Graph, con gli attributi in qualunque ordine e le entità HTML sciolte ("" se manca). */
export function ogValue(html, property) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!new RegExp(`property=["']og:${property}["']`, "i").test(tag)) continue;
    const content = tag.match(/content=(["'])([\s\S]*?)\1/i);
    if (content) return decodeEntities(content[2]);
  }
  return "";
}

/** Il titolo vero della pagina (H1): quello dei meta è pensato per Google, spesso accorciato con "…" e con il marchio in coda. */
export function h1Of(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? decodeEntities(m[1].replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() : "";
}

/** Titolo per il messaggio: l'H1, oppure il titolo dei meta senza il marchio in coda. */
const titleOf = (html) => h1Of(html) || ogValue(html, "title").replace(/\s+·\s+(?:OriginsMeta|Origins TCG)$/, "");

/**
 * Messaggio per un canale: italiano per primo, poi i titoli inglese e spagnolo collegati alle loro pagine (lo spagnolo
 * dal 25/09/2026, Ondata 1: prima i lettori ispanofoni arrivavano solo alle versioni IT ed EN), copertina; su
 * #metashifting il link alla patch. Una lingua di cui non si è letta la pagina (HTML vuoto) resta fuori.
 */
export function payload(channel, item, itHtml, enHtml, esHtml = "") {
  const path = PATHS[item.kind];
  const itUrl = `${SITE}/it/${path}/${item.slug}`;
  const enUrl = `${SITE}/en/${path}/${item.slug}`;
  const esUrl = `${SITE}/es/${path}/${item.slug}`;
  const image = ogValue(itHtml, "image");
  const enTitle = titleOf(enHtml);
  const esTitle = titleOf(esHtml);
  const fields = [];
  if (enTitle) fields.push({ name: "🇬🇧 English", value: `[${enTitle.replace(/[[\]]/g, "")}](${enUrl})`.slice(0, 1024) });
  if (esTitle) fields.push({ name: "🇪🇸 Español", value: `[${esTitle.replace(/[[\]]/g, "")}](${esUrl})`.slice(0, 1024) });
  if (channel === "metashifting" && item.patch) {
    fields.push({ name: "MetaShifting", value: `[Tutte le modifiche della patch · All the changes · Todos los cambios](${SITE}/it/metashifting#patch-${item.patch})` });
  }
  return {
    content: CHANNELS[channel].label,
    embeds: [
      {
        title: (titleOf(itHtml) || item.slug).slice(0, 256),
        url: itUrl,
        description: ogValue(itHtml, "description").slice(0, 2000),
        color: MINT,
        fields,
        ...(image ? { image: { url: image } } : {}),
        footer: { text: "originsmeta.com" },
      },
    ],
    // nessuna menzione, mai: il testo viene dalle pagine del sito
    allowed_mentions: { parse: [] },
  };
}

/* ---------- rete ---------- */

/** Webhook di un canale, con il canale di riserva (le guide vanno in #site-news finché #guides non ha il suo). */
export function webhookFor(channel, env = process.env) {
  const c = CHANNELS[channel];
  const own = (env[c.env] || "").trim();
  if (own) return own;
  return c.fallback ? (env[CHANNELS[c.fallback].env] || "").trim() : "";
}

/**
 * Un file del repo: da GitHub al commit indicato, oppure dalla cartella locale del repo (prove). Un file che al
 * commit indicato non c'è (commit sbagliato, percorso cambiato) ferma tutto: meglio un errore di un "niente da
 * annunciare" silenzioso.
 */
async function source(path) {
  const { REPO, AFTER } = process.env;
  if (!REPO || !AFTER) return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const text = await fileAt(REPO, AFTER, path);
  if (!text) throw new Error(`${path} non trovato su GitHub al commit ${AFTER}`);
  return text;
}

async function fileAt(repo, sha, path) {
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/${sha}/${path}`);
  if (r.status === 404) return "";
  if (!r.ok) throw new Error(`GitHub ha risposto ${r.status} per ${path} al commit ${sha}`);
  return r.text();
}

/** Mazzi pubblicati da una data, letti come li legge chiunque (chiave pubblica di Supabase, policy RLS). */
async function decksSince(since) {
  const env = await source(FILES.supabase);
  const url = process.env.SUPABASE_URL || env.match(/supabaseUrl\s*=[^"]*"([^"]+)"/)?.[1];
  const key = process.env.SUPABASE_ANON_KEY || env.match(/supabaseKey\s*=[^"]*"([^"]+)"/)?.[1];
  if (!url || !key) throw new Error("Configurazione pubblica di Supabase non trovata");
  const r = await fetch(`${url}/rest/v1/community_decks?select=slug,created_at&status=eq.published&created_at=gte.${since}&order=created_at.asc`, { headers: { apikey: key } });
  if (!r.ok) throw new Error(`Supabase ha risposto ${r.status}`);
  return (await r.json()).map((d) => ({ slug: d.slug, date: String(d.created_at).slice(0, 10), createdAt: d.created_at }));
}

/** Aspetta che la pagina sia online e ne restituisce l'HTML; null se non arriva entro `waitMs` (di norma WAIT_MS). */
async function waitForPage(url, waitMs = WAIT_MS) {
  const until = Date.now() + waitMs;
  for (;;) {
    try {
      const r = await fetch(url, { headers: { "cache-control": "no-cache" }, redirect: "follow" });
      if (r.ok) return r.text();
      console.log(`  ${url} → ${r.status}, riprovo tra ${POLL_MS / 1000} s`);
    } catch (e) {
      console.log(`  ${url} → ${e.message}, riprovo tra ${POLL_MS / 1000} s`);
    }
    if (Date.now() + POLL_MS > until) return null;
    await sleep(POLL_MS);
  }
}

/** Manda il messaggio; se Discord chiede di rallentare (429) aspetta quanto dice e riprova. */
async function post(webhook, body) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(`${webhook}?wait=true`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 429) {
      const wait = Number((await r.json().catch(() => ({}))).retry_after) || 2;
      await sleep(Math.ceil(wait * 1000) + 250);
      continue;
    }
    if (!r.ok) throw new Error(`Discord ha risposto ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return;
  }
  throw new Error("Discord continua a chiedere di rallentare (429)");
}

/* ---------- cosa annunciare ---------- */

async function pushItems() {
  const { REPO, BEFORE, AFTER } = process.env;
  if (!REPO || !AFTER) throw new Error("Servono REPO e AFTER (oppure SLUGS o BACKFILL_SINCE).");
  // primo push di un branch o nessun commit precedente: niente confronto, quindi niente annunci a raffica
  if (!BEFORE || /^0+$/.test(BEFORE)) {
    console.log("Nessun commit precedente da confrontare: nessun annuncio.");
    return [];
  }
  // prima del push un file può non esserci ancora (vale vuoto); dopo il push deve esserci
  const [newsA, newsB, guidesA, guidesB, cards] = await Promise.all([
    fileAt(REPO, BEFORE, FILES.news),
    source(FILES.news),
    fileAt(REPO, BEFORE, FILES.guides),
    source(FILES.guides),
    source(FILES.cards),
  ]);
  const patches = patchNews(cards);
  const newsItems = added(newsSlugs(newsA), newsSlugs(newsB)).map((slug) => ({ kind: "news", slug, patch: patches.get(slug)?.patch, channels: newsChannels(slug, patches) }));
  const guideItems = added(guideSlugs(guidesA), guideSlugs(guidesB)).map((slug) => ({ kind: "guides", slug, channels: ["guides"] }));
  return [...newsItems, ...guideItems];
}

async function manualItems(list) {
  const patches = patchNews(await source(FILES.cards));
  return list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [kind, slug] = s.split(":");
      if (!(kind in PATHS) || !/^[a-z0-9-]+$/.test(slug ?? "")) throw new Error(`Voce non valida: "${s}" (serve news:<slug>, guides:<slug> o decks:<slug>)`);
      if (kind === "news") return { kind, slug, patch: patches.get(slug)?.patch, channels: newsChannels(slug, patches) };
      return { kind, slug, channels: [kind] };
    });
}

async function archiveItems(since) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error(`BACKFILL_SINCE deve essere una data aaaa-mm-gg, non "${since}"`);
  const [news, guides, cards] = await Promise.all([source(FILES.news), source(FILES.guides), source(FILES.cards)]);
  let decks = [];
  try {
    decks = await decksSince(since);
  } catch (e) {
    console.log(`::warning::Mazzi della community non letti (${e.message}): l'archivio parte senza.`);
  }
  return backfillItems({ news: newsEntries(news), guides: guideSlugs(guides), guideDate: guideDates(guides), patches: patchNews(cards), decks }, since);
}

async function main() {
  const since = process.env.BACKFILL_SINCE?.trim();
  // Lanciata a mano senza data né voci: prima finiva in verde senza fare nulla (24/09/2026, archivio lanciato senza
  // `backfill_since`, 7 secondi e nessun messaggio). Meglio un errore che dica che cosa manca.
  if (process.env.EVENT === "workflow_dispatch" && !since && !process.env.SLUGS?.trim()) {
    throw new Error("Lancio a mano senza backfill_since né slugs: per l'archivio scrivi la data (es. 2026-09-01) nel campo backfill_since.");
  }
  const items = process.env.SLUGS?.trim() ? await manualItems(process.env.SLUGS) : since ? await archiveItems(since) : await pushItems();
  if (!items.length) {
    console.log("Niente da annunciare.");
    return;
  }
  const posts = items.reduce((n, i) => n + i.channels.length, 0);
  console.log(`Da annunciare: ${items.length} voci, ${posts} messaggi.`);

  const missing = new Set();
  let failed = 0;
  let sent = 0;
  for (const item of items) {
    const targets = item.channels.map((channel) => ({ channel, webhook: webhookFor(channel) })).filter((t) => {
      if (t.webhook || DRY_RUN) return true;
      missing.add(t.channel);
      return false;
    });
    if (!targets.length) continue;
    const path = PATHS[item.kind];
    const itHtml = await waitForPage(`${SITE}/it/${path}/${item.slug}`);
    if (itHtml === null) {
      console.log(`::error::${item.kind}/${item.slug} non è online dopo ${WAIT_MS / 60_000} minuti: non annunciata.`);
      failed++;
      continue;
    }
    const enHtml = (await waitForPage(`${SITE}/en/${path}/${item.slug}`, SIBLING_WAIT_MS)) ?? "";
    const esHtml = (await waitForPage(`${SITE}/es/${path}/${item.slug}`, SIBLING_WAIT_MS)) ?? "";
    for (const { channel, webhook } of targets) {
      const body = payload(channel, item, itHtml, enHtml, esHtml);
      if (DRY_RUN) {
        console.log(`[prova] ${CHANNELS[channel].name.padEnd(17)} ← ${item.kind}/${item.slug}${item.date ? ` (${item.date})` : ""} · ${body.embeds[0].title}`);
        if (process.env.DRY_RUN_JSON === "1") console.log(JSON.stringify(body, null, 2));
        continue;
      }
      try {
        await post(webhook, body);
        sent++;
        console.log(`Pubblicata in ${CHANNELS[channel].name}: ${item.kind}/${item.slug}`);
      } catch (e) {
        console.log(`::error::${item.kind}/${item.slug} in ${CHANNELS[channel].name}: ${e.message}`);
        failed++;
      }
      await sleep(PAUSE_MS);
    }
  }
  for (const channel of missing) console.log(`::warning::Manca ${CHANNELS[channel].env} nei secret del repository: niente messaggi in ${CHANNELS[channel].name}.`);
  if (!DRY_RUN) console.log(`Messaggi mandati: ${sent}${failed ? `, non riusciti: ${failed}` : ""}.`);
  if (failed) process.exitCode = 1;
}

// eseguito come script, non quando lo importano i test
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`::error::${e.message}`);
    // exitCode e non exit(): Node chiude da solo quando le connessioni sono finite (con exit() su Windows libuv protesta)
    process.exitCode = 1;
  });
}
