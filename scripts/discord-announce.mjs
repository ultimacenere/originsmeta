#!/usr/bin/env node
/**
 * Annuncia sul Discord di OriginsMeta le news e le guide nuove: fase B del piano del server (doc "Discord
 * OriginsMeta" del 22/09/2026, canale `#site-news`: "ogni news del sito, EN e IT, con copertina"), chiesta da
 * Pierluigi il 24/09/2026 ("tutti articoli e guide finiscono nel nostro Discord"). Lo lancia la GitHub Action
 * `.github/workflows/discord-announce.yml` a ogni push su main che tocca news o guide; si può lanciare anche a mano.
 *
 * Che cosa è nuovo: gli slug di `src/lib/data/news.ts` (campo `slug`) e di `src/lib/content/guides.ts` (elenco
 * `guideSlugs`) presenti dopo il push e non prima, letti da GitHub ai due commit. Così non serve tenere traccia di
 * cosa è già stato annunciato: una news corretta dopo l'uscita non si riannuncia. Uno slug nuovo parte solo quando
 * la sua pagina risponde 200 (il deploy di Vercel parte con lo stesso push): titolo, descrizione e copertina vengono
 * dai meta Open Graph delle pagine italiana e inglese, cioè esattamente quello che vede chi apre il link.
 *
 * Variabili d'ambiente (nella GitHub Action: Settings → Secrets and variables → Actions):
 * - DISCORD_WEBHOOK_NEWS: webhook di `#site-news`. Senza, lo script lo dice e finisce senza errori.
 * - DISCORD_WEBHOOK_GUIDES: webhook di `#guides` (fase 2 del server); se manca, anche le guide vanno in `#site-news`.
 * - REPO ("proprietario/nome"), BEFORE e AFTER (commit prima e dopo il push): li passa l'Action.
 * - SLUGS: in alternativa, cosa annunciare a mano, es. "news:upgrade-meta-0924,guides:origins-tcg-locations".
 * - SITE_URL (predefinito https://originsmeta.com), WAIT_MINUTES (predefinito 20): quanto aspettare il deploy.
 * - DRY_RUN=1: stampa i messaggi invece di mandarli, per provarlo senza scrivere nel canale:
 *     DRY_RUN=1 SLUGS=news:demo-patch-notes-0921 node scripts/discord-announce.mjs
 */
import { pathToFileURL } from "node:url";

const SITE = (process.env.SITE_URL || "https://originsmeta.com").replace(/\/+$/, "");
const DRY_RUN = process.env.DRY_RUN === "1";
const WAIT_MS = Number(process.env.WAIT_MINUTES || 20) * 60_000;
const POLL_MS = 20_000;
/** Menta del sito (--color-mint #31e3bd). */
const MINT = 0x31e3bd;

const FILES = { news: "src/lib/data/news.ts", guides: "src/lib/content/guides.ts" };
const LABEL = { news: "📰 **Nuova news · New article**", guides: "📘 **Nuova guida · New guide**" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Webhook del canale per ogni tipo di contenuto (le guide ricadono su `#site-news` finché `#guides` non c'è). */
function webhookFor(kind) {
  const news = (process.env.DISCORD_WEBHOOK_NEWS || "").trim();
  return kind === "guides" ? (process.env.DISCORD_WEBHOOK_GUIDES || "").trim() || news : news;
}

/** Slug delle news: ogni voce dell'array ha `slug: "..."` (il tipo scrive `slug: string`, senza virgolette). */
export function newsSlugs(source) {
  return new Set([...source.matchAll(/^\s*slug:\s*"([a-z0-9-]+)"/gm)].map((m) => m[1]));
}

/** Slug delle guide: l'elenco `guideSlugs`, l'indice di tutte le guide pubblicate. */
export function guideSlugs(source) {
  const block = source.match(/export const guideSlugs = \[([\s\S]*?)\] as const/);
  return new Set(block ? [...block[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]) : []);
}

/** Slug presenti in `after` e non in `before`. */
export function added(before, after) {
  return [...after].filter((s) => !before.has(s));
}

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

/** Titolo della pagina senza il marchio in coda (" · OriginsMeta"): nel nostro canale è ridondante. */
const titleOf = (html) => ogValue(html, "title").replace(/\s+·\s+OriginsMeta$/, "");

/** Messaggio per il canale: italiano per primo, con il titolo inglese collegato alla sua pagina. */
export function payload(kind, slug, itHtml, enHtml) {
  const itUrl = `${SITE}/it/${kind}/${slug}`;
  const enUrl = `${SITE}/en/${kind}/${slug}`;
  const image = ogValue(itHtml, "image");
  const enTitle = titleOf(enHtml);
  return {
    content: LABEL[kind],
    embeds: [
      {
        title: (titleOf(itHtml) || slug).slice(0, 256),
        url: itUrl,
        description: ogValue(itHtml, "description").slice(0, 2000),
        color: MINT,
        fields: enTitle ? [{ name: "🇬🇧 English", value: `[${enTitle.replace(/[[\]]/g, "")}](${enUrl})`.slice(0, 1024) }] : [],
        ...(image ? { image: { url: image } } : {}),
        footer: { text: "originsmeta.com" },
      },
    ],
    // nessuna menzione, mai: il testo viene dalle pagine del sito
    allowed_mentions: { parse: [] },
  };
}

async function fileAt(repo, sha, path) {
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/${sha}/${path}`);
  if (r.status === 404) return "";
  if (!r.ok) throw new Error(`GitHub ha risposto ${r.status} per ${path} al commit ${sha}`);
  return r.text();
}

/** Voci nuove fra due commit: [{ kind, slug }]. */
async function newItems(repo, before, after) {
  const out = [];
  for (const kind of ["news", "guides"]) {
    const [a, b] = await Promise.all([fileAt(repo, before, FILES[kind]), fileAt(repo, after, FILES[kind])]);
    const pick = kind === "news" ? newsSlugs : guideSlugs;
    for (const slug of added(pick(a), pick(b))) out.push({ kind, slug });
  }
  return out;
}

/** Aspetta che la pagina sia online e ne restituisce l'HTML; null se non arriva entro WAIT_MS. */
async function waitForPage(url) {
  const until = Date.now() + WAIT_MS;
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

async function post(webhook, body) {
  const r = await fetch(`${webhook}?wait=true`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Discord ha risposto ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

function itemsFromList(list) {
  return list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [kind, slug] = s.split(":");
      if (!(kind in FILES) || !/^[a-z0-9-]+$/.test(slug ?? "")) throw new Error(`Voce non valida: "${s}" (serve news:<slug> o guides:<slug>)`);
      return { kind, slug };
    });
}

async function main() {
  let items;
  if (process.env.SLUGS?.trim()) {
    items = itemsFromList(process.env.SLUGS);
  } else {
    const { REPO, BEFORE, AFTER } = process.env;
    if (!REPO || !AFTER) throw new Error("Servono REPO e AFTER (oppure SLUGS).");
    // primo push di un branch o nessun commit precedente: niente confronto, quindi niente annunci a raffica
    if (!BEFORE || /^0+$/.test(BEFORE)) {
      console.log("Nessun commit precedente da confrontare: nessun annuncio.");
      return;
    }
    items = await newItems(REPO, BEFORE, AFTER);
  }

  if (!items.length) {
    console.log("Nessuna news o guida nuova.");
    return;
  }
  console.log(`Da annunciare: ${items.map((i) => `${i.kind}:${i.slug}`).join(", ")}`);

  let failed = 0;
  for (const { kind, slug } of items) {
    const webhook = webhookFor(kind);
    if (!webhook && !DRY_RUN) {
      console.log(`::warning::Manca DISCORD_WEBHOOK_NEWS nei secret del repository: ${kind}/${slug} non annunciata.`);
      continue;
    }
    const itHtml = await waitForPage(`${SITE}/it/${kind}/${slug}`);
    if (itHtml === null) {
      console.log(`::error::${kind}/${slug} non è online dopo ${WAIT_MS / 60_000} minuti: non annunciata.`);
      failed++;
      continue;
    }
    const enHtml = (await waitForPage(`${SITE}/en/${kind}/${slug}`)) ?? "";
    const body = payload(kind, slug, itHtml, enHtml);
    if (DRY_RUN) {
      console.log(JSON.stringify(body, null, 2));
      continue;
    }
    try {
      await post(webhook, body);
      console.log(`Annunciata: ${kind}/${slug}`);
    } catch (e) {
      console.log(`::error::${kind}/${slug}: ${e.message}`);
      failed++;
    }
    await sleep(1500);
  }
  if (failed) process.exitCode = 1;
}

// eseguito come script, non quando lo importano i test
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`::error::${e.message}`);
    process.exit(1);
  });
}
