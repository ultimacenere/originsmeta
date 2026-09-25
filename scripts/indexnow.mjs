#!/usr/bin/env node
/**
 * Avvisa i motori di IndexNow (Bing, e con lui la ricerca di ChatGPT e Copilot; Yandex, Seznam, Naver…) degli URL
 * nuovi o cambiati del sito (Ondata 2 del piano SEO/GEO, 25/09/2026: GEO-05, TECH-08). Il protocollo e la chiave
 * stanno in src/lib/indexnow.ts; qui c'è solo il giro: quali URL, quando e con quali controlli.
 *
 * Due modi:
 *   1. push (la GitHub Action degli annunci, a ogni push su main che tocca news, guide o carte): confronta fra BEFORE e
 *      AFTER, letti da GitHub, news.ts, guides.ts, card-history.ts e card-lore.ts:
 *        - news e guide nuove: le pagine nelle tre lingue, più /news o /guides e le home che le mostrano;
 *        - news e guide con le date cambiate (`updated`: un articolo rivisto);
 *        - carte con lo storico o i testi cambiati (una patch, una rilettura nel gioco): le schede, più /metashifting
 *          quando cambia lo storico.
 *      Prima aspetta che il deploy di produzione di AFTER sia pronto (l'API "deployments" di GitHub, che Vercel
 *      aggiorna): un avviso partito prima farebbe leggere a Bing la versione vecchia.
 *   2. a mano: INDEXNOW_TARGETS (il campo "indexnow" del lancio a mano del workflow) e SLUGS (il campo "slugs", lo
 *      stesso degli annunci), voci separate da virgola:
 *        news:<slug>, guides:<slug>, decks:<slug>, cards:<slug>   la pagina nelle tre lingue
 *        /es/cards, https://originsmeta.com/it/news/<slug>        un percorso o un URL del sito
 *        sitemap:/es  (oppure sitemap:all)                         tutti gli URL delle sitemap il cui percorso comincia
 *                                                                  così: per il lancio di una lingua, una volta sola
 * Si manda solo un URL che risponde 200 e non è noindex (un mazzo non ancora tradotto, una pagina che non c'è più): il
 * controllo si fa sulla pagina vera. Le voci `sitemap:` no: le sitemap elencano già solo pagine indicizzabili.
 *
 * Mai un errore per colpa di IndexNow: un rifiuto del motore o un intoppo di rete è un avviso (::warning::), e la
 * GitHub Action va avanti. DRY_RUN=1 elenca gli URL senza mandarli (e senza controllarli). Altre variabili: SITE_URL
 * (da dove si leggono pagine e sitemap; gli URL mandati sono sempre di https://originsmeta.com), WAIT_MINUTES (attesa
 * del deploy, predefinita 10), GITHUB_TOKEN (per l'API di GitHub; senza, vale il limite delle richieste anonime).
 * Prove in locale:
 *   DRY_RUN=1 SLUGS=news:upgrade-meta-0925 node scripts/indexnow.mjs
 *   INDEXNOW_TARGETS=sitemap:/es node scripts/indexnow.mjs
 */
import { pathToFileURL } from "node:url";
import { INDEXNOW_SITE, indexNowUrls, keyFileUrl, localizedPaths, submitIndexNow } from "../src/lib/indexnow.ts";

/** Le lingue del sito, come `locales` in src/lib/i18n.ts (il test controlla che coincidano). */
export const LOCALES = ["en", "it", "es"];

const SITE = (process.env.SITE_URL || INDEXNOW_SITE).replace(/\/+$/, "");
const DRY_RUN = process.env.DRY_RUN === "1";
const WAIT_MS = Number(process.env.WAIT_MINUTES || 10) * 60_000;
const POLL_MS = 20_000;
/** Attesa di una pagina nuova quando il deploy risulta già pronto: basta per un ritardo della rete di Vercel. */
const SHORT_WAIT_MS = Math.min(WAIT_MS, 60_000);
/** Pausa quando il deploy non si può verificare e non ci sono pagine nuove da aspettare: una build tipica di Vercel. */
const FALLBACK_PAUSE_MS = 5 * 60_000;
/** Pagine controllate in parallelo. */
const CONCURRENCY = 6;

export const FILES = {
  news: "src/lib/data/news.ts",
  guides: "src/lib/content/guides.ts",
  history: "src/lib/data/card-history.ts",
  lore: "src/lib/data/card-lore.ts",
};

/** Percorso delle pagine per tipo di voce ("news:<slug>"…). */
const KINDS = { news: "/news", guides: "/guides", decks: "/decks/community", cards: "/cards" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- lettura dei file del repo (testo, senza eseguire TypeScript) ---------- */

/**
 * Le voci di news.ts o guides.ts con le loro date: slug → "data|aggiornamento". Una voce comincia con `slug: "…"` a
 * inizio riga (gli slug annidati, come i mazzi citati da una guida, stanno dentro `{ slug: … }` e non contano); le
 * guide compaiono due volte (inglese e italiano) e le date si mettono in fila.
 */
export function itemDates(source) {
  const starts = [...source.matchAll(/^\s*slug:\s*"([a-z0-9-]+)"/gm)];
  const out = new Map();
  starts.forEach((m, i) => {
    const chunk = source.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : undefined);
    const date = chunk.match(/^\s*date:\s*"([^"]+)"/m)?.[1] ?? "";
    const updated = chunk.match(/^\s*updated:\s*"([^"]+)"/m)?.[1] ?? "";
    const sig = `${date}|${updated}`;
    out.set(m[1], out.has(m[1]) ? `${out.get(m[1])};${sig}` : sig);
  });
  return out;
}

/** Guide pubblicate: l'elenco `guideSlugs` di guides.ts. */
export function guideSlugList(source) {
  const block = source.match(/export const guideSlugs = \[([\s\S]*?)\] as const/);
  return new Set(block ? [...block[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]) : []);
}

/**
 * Le voci di un `Record<string, …>` scritto una per slug (card-history.ts, card-lore.ts): chiave a inizio riga con due
 * spazi, poi il testo fino alla chiave seguente. I testi su più righe (template literal) non hanno rientro e restano
 * nella loro voce. Fine riga normalizzati, così un file salvato con CRLF non sembra cambiato.
 */
export function recordChunks(source) {
  const text = source.replace(/\r\n/g, "\n");
  const starts = [...text.matchAll(/^ {2}(?:"([a-z0-9-]+)"|([a-z0-9]+)):\s*[[{]/gm)];
  const out = new Map();
  starts.forEach((m, i) => {
    const chunk = text.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : undefined);
    out.set(m[1] ?? m[2], chunk.replace(/\s+$/, ""));
  });
  return out;
}

/** Chiavi aggiunte, tolte o cambiate fra due versioni di un file (Map chiave → testo). */
export function changedKeys(before, after) {
  const keys = new Set([...before.keys(), ...after.keys()]);
  return [...keys].filter((k) => before.get(k) !== after.get(k));
}

/** Chiavi nuove (in `after` e non in `before`), per Set o Map. */
export function addedKeys(before, after) {
  return [...after.keys()].filter((k) => !before.has(k));
}

/**
 * Percorsi da segnalare dopo un push, divisi in pagine nuove (`fresh`: rispondono 404 fino al deploy) e cambiate
 * (`changed`). Un file che manca vale testo vuoto.
 */
export function pushPaths({ newsA = "", newsB = "", guidesA = "", guidesB = "", historyA = "", historyB = "", loreA = "", loreB = "" }) {
  const fresh = [];
  const changed = [];
  const at = (path) => localizedPaths(path, LOCALES);

  const newsBefore = itemDates(newsA);
  const newsAfter = itemDates(newsB);
  const addedNews = addedKeys(newsBefore, newsAfter);
  for (const slug of addedNews) fresh.push(...at(`/news/${slug}`));
  for (const [slug, sig] of newsAfter) if (newsBefore.has(slug) && newsBefore.get(slug) !== sig) changed.push(...at(`/news/${slug}`));
  if (addedNews.length) changed.push(...at(""), ...at("/news"));

  const guidesBefore = guideSlugList(guidesA);
  const guidesAfter = guideSlugList(guidesB);
  const addedGuides = addedKeys(guidesBefore, guidesAfter);
  for (const slug of addedGuides) fresh.push(...at(`/guides/${slug}`));
  const guideDatesA = itemDates(guidesA);
  const guideDatesB = itemDates(guidesB);
  for (const slug of guidesAfter) if (guidesBefore.has(slug) && guideDatesA.get(slug) !== guideDatesB.get(slug)) changed.push(...at(`/guides/${slug}`));
  if (addedGuides.length) changed.push(...at("/guides"));

  const historyChanged = changedKeys(recordChunks(historyA), recordChunks(historyB));
  const loreChanged = changedKeys(recordChunks(loreA), recordChunks(loreB));
  for (const slug of new Set([...historyChanged, ...loreChanged])) changed.push(...at(`/cards/${slug}`));
  if (historyChanged.length) changed.push(...at("/metashifting"));
  return { fresh: [...new Set(fresh)], changed: [...new Set(changed)] };
}

/**
 * Le voci scritte a mano (INDEXNOW_TARGETS, SLUGS): percorsi da controllare e prefissi di sitemap. Una voce che non
 * si capisce ferma tutto con un messaggio chiaro, meglio che mandare altro.
 */
export function parseTargets(text) {
  const paths = [];
  const sitemaps = [];
  for (const raw of text.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (raw.startsWith("/") || /^https?:\/\//i.test(raw)) {
      const [url] = indexNowUrls([raw]);
      if (!url) throw new Error(`"${raw}" non è un indirizzo di ${INDEXNOW_SITE}`);
      const u = new URL(url);
      paths.push(`${u.pathname}${u.search}`);
      continue;
    }
    const [kind, value = ""] = raw.split(/:(.*)/s).map((s) => s.trim());
    if (kind === "sitemap") sitemaps.push(value || "all");
    else if (kind in KINDS && /^[a-z0-9-]+$/.test(value)) paths.push(...localizedPaths(`${KINDS[kind]}/${value}`, LOCALES));
    else throw new Error(`Voce non valida: "${raw}" (serve news:, guides:, decks: o cards: con lo slug, sitemap:<prefisso>, oppure un percorso)`);
  }
  return { paths: [...new Set(paths)], sitemaps: [...new Set(sitemaps)] };
}

/* ---------- controlli sulle pagine ---------- */

/** La pagina chiede di non essere indicizzata? Meta robots (o bingbot) con noindex, oppure header X-Robots-Tag. */
export function isNoindex(html, robotsHeader = "") {
  if (/noindex/i.test(robotsHeader ?? "")) return true;
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/name=["'](?:robots|bingbot)["']/i.test(tag)) continue;
    if (/content=["'][^"']*noindex/i.test(tag)) return true;
  }
  return false;
}

/** Gli indirizzi `<loc>` di una sitemap o di un indice (non quelli delle immagini, che sono `<image:loc>`). */
export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}

/** Il percorso di un URL comincia con il prefisso? "/es" prende /es e /es/…, non /esempio; "all" prende tutto. */
export function matchesPrefix(url, prefix) {
  if (!prefix || prefix === "all") return true;
  const p = `/${prefix.replace(/^\/+|\/+$/g, "")}`;
  let path;
  try {
    path = new URL(url).pathname;
  } catch {
    return false;
  }
  return path === p || path.startsWith(`${p}/`);
}

/* ---------- rete ---------- */

async function fileAt(repo, sha, path) {
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/${sha}/${path}`);
  if (r.status === 404) return "";
  if (!r.ok) throw new Error(`GitHub ha risposto ${r.status} per ${path} al commit ${sha}`);
  return r.text();
}

/**
 * Aspetta il deploy di produzione del commit su Vercel, letto dall'API "deployments" di GitHub. "ready" se è pronto,
 * "failed" se è fallito, "timeout" se non arriva in tempo, "unknown" se l'API non risponde (token, limiti).
 */
export async function waitForProduction(repo, sha, waitMs = WAIT_MS) {
  const headers = { accept: "application/vnd.github+json", "user-agent": "originsmeta-indexnow" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const until = Date.now() + waitMs;
  for (;;) {
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/deployments?sha=${sha}&environment=Production&per_page=5`, { headers });
      if (!r.ok) {
        console.log(`  API deployments di GitHub → ${r.status}`);
        if ([401, 403, 404].includes(r.status)) return "unknown";
      } else {
        for (const d of await r.json()) {
          const s = await fetch(`${d.statuses_url}?per_page=5`, { headers });
          if (!s.ok) continue;
          // gli stati arrivano dal più recente
          const state = (await s.json())[0]?.state;
          if (state === "success") return "ready";
          if (state === "failure" || state === "error") return "failed";
        }
      }
    } catch (e) {
      console.log(`  API deployments di GitHub → ${e.message}`);
    }
    if (Date.now() + POLL_MS > until) return "timeout";
    console.log(`  deploy di ${sha.slice(0, 7)} non ancora pronto, riprovo tra ${POLL_MS / 1000} s`);
    await sleep(POLL_MS);
  }
}

/** Legge una pagina: stato e, se risponde 200, se è noindex. I redirect non si seguono (l'URL da segnalare è quello vero). */
async function probe(url) {
  try {
    const r = await fetch(url, { redirect: "manual", headers: { "cache-control": "no-cache" } });
    if (r.status !== 200) return { status: r.status };
    return { status: 200, noindex: isNoindex(await r.text(), r.headers.get("x-robots-tag") ?? "") };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

/** Una pagina nuova: riprova finché risponde 200, per al massimo `waitMs`. */
async function probeUntilLive(url, waitMs) {
  const until = Date.now() + waitMs;
  for (;;) {
    const p = await probe(url);
    if (p.status === 200 || Date.now() + POLL_MS > until) return p;
    console.log(`  ${url} → ${p.status || p.error}, riprovo tra ${POLL_MS / 1000} s`);
    await sleep(POLL_MS);
  }
}

/** I percorsi che si possono segnalare: 200 e non noindex. Le pagine nuove (`fresh`) si aspettano per `freshWaitMs`. */
export async function livePaths(paths, fresh = new Set(), freshWaitMs = SHORT_WAIT_MS) {
  const ok = new Set();
  const queue = [...paths];
  const worker = async () => {
    for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
      const url = `${SITE}${path}`;
      const p = fresh.has(path) ? await probeUntilLive(url, freshWaitMs) : await probe(url);
      if (p.status !== 200) console.log(`  saltato ${path}: ${p.status || p.error}`);
      else if (p.noindex) console.log(`  saltato ${path}: noindex`);
      else ok.add(path);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, paths.length) }, worker));
  // stesso ordine dell'elenco di partenza, non quello di arrivo delle risposte
  return paths.filter((p) => ok.has(p));
}

/** Tutti gli URL delle sitemap il cui percorso comincia con `prefix`, a partire dall'indice /sitemap.xml. */
export async function sitemapUrls(prefix) {
  const read = async (url) => {
    const r = await fetch(url.replace(INDEXNOW_SITE, SITE));
    if (!r.ok) throw new Error(`${url} → ${r.status}`);
    return r.text();
  };
  const index = await read(`${INDEXNOW_SITE}/sitemap.xml`);
  // prima dell'Ondata 2 /sitemap.xml era una sitemap unica: vale anche quella
  const sitemaps = index.includes("<sitemapindex") ? await Promise.all(sitemapLocs(index).map(read)) : [index];
  return sitemaps.flatMap((xml) => sitemapLocs(xml).filter((u) => matchesPrefix(u, prefix)));
}

/* ---------- giro ---------- */

async function pushTargets() {
  const { REPO, BEFORE, AFTER } = process.env;
  if (!REPO || !AFTER || !BEFORE || /^0+$/.test(BEFORE)) {
    console.log("Nessun commit precedente da confrontare: niente da segnalare.");
    return [];
  }
  const names = Object.keys(FILES);
  const texts = await Promise.all(names.flatMap((n) => [fileAt(REPO, BEFORE, FILES[n]), fileAt(REPO, AFTER, FILES[n])]));
  const input = {};
  names.forEach((n, i) => {
    input[`${n}A`] = texts[2 * i];
    input[`${n}B`] = texts[2 * i + 1];
  });
  const { fresh, changed } = pushPaths(input);
  const all = [...fresh, ...changed];
  if (!all.length || DRY_RUN) return all;
  console.log(`Da controllare: ${fresh.length} pagine nuove e ${changed.length} cambiate. Attendo il deploy di ${AFTER.slice(0, 7)}…`);
  const deploy = await waitForProduction(REPO, AFTER);
  if (deploy === "failed") {
    console.log("::warning::Il deploy di produzione non è riuscito: nessun avviso a IndexNow.");
    return [];
  }
  if (deploy === "unknown") {
    // Senza l'API di GitHub il segnale sono le pagine nuove (404 fino al deploy), aspettate per tutto WAIT_MINUTES;
    // se ci sono solo pagine cambiate, una pausa della durata tipica di una build di Vercel.
    console.log("::warning::Deploy di produzione non verificabile: mi regolo sulle pagine.");
    if (!fresh.length) await sleep(Math.min(WAIT_MS, FALLBACK_PAUSE_MS));
    return livePaths(all, new Set(fresh), WAIT_MS);
  }
  // "timeout": l'attesa c'è già stata, si segnala quello che risponde adesso
  if (deploy === "timeout") console.log("::warning::Deploy di produzione non confermato in tempo: controllo le pagine così come sono.");
  return livePaths(all, new Set(fresh), SHORT_WAIT_MS);
}

async function manualTargets(text) {
  const { paths, sitemaps } = parseTargets(text);
  const fromPages = DRY_RUN ? paths : await livePaths(paths);
  const fromSitemaps = (await Promise.all(sitemaps.map(sitemapUrls))).flat();
  return [...fromPages, ...fromSitemaps];
}

async function main() {
  const manual = [process.env.INDEXNOW_TARGETS, process.env.SLUGS].filter((s) => s?.trim()).join(",");
  let urls;
  if (manual) urls = await manualTargets(manual);
  else if (process.env.EVENT === "push" || (process.env.EVENT !== "workflow_dispatch" && process.env.REPO && process.env.AFTER)) urls = await pushTargets();
  else {
    console.log("Niente da segnalare (nessun push, né INDEXNOW_TARGETS o SLUGS).");
    return;
  }
  const list = indexNowUrls(urls);
  if (!list.length) {
    console.log("Niente da segnalare.");
    return;
  }
  console.log(`URL per IndexNow: ${list.length} (chiave in ${keyFileUrl()})`);
  for (const u of list.slice(0, 50)) console.log(`  ${u}`);
  if (list.length > 50) console.log(`  … e altri ${list.length - 50}`);
  if (DRY_RUN) {
    console.log("[prova] niente inviato.");
    return;
  }
  const results = await submitIndexNow(list, { timeoutMs: 20_000 });
  for (const r of results) {
    if (r.ok) console.log(`IndexNow: ${r.count} URL ${r.text}.`);
    else console.log(`::warning::IndexNow: ${r.count} URL non accettati (${r.text}).`);
  }
}

// eseguito come script, non quando lo importano i test
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    // un errore qui (GitHub non risponde, una voce scritta male) è un avviso: IndexNow non deve mai fermare l'Action
    console.log(`::warning::IndexNow non inviato: ${e.message}`);
  });
}
