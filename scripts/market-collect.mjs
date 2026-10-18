// Raccoglitore dei prezzi del Mercato di Steam fuori da Vercel (18/10/2026). Steam risponde 429 alle richieste dei
// server di Vercel già alla prima pagina (provato il 18/10: `rateLimited: true` da /api/cron/market), quindi il giro lo
// fa GitHub Actions (.github/workflows/market-collect.yml, ogni 10 minuti) o, se serve, un PC con questo script. Stessa
// logica di src/lib/market/collect.ts e stesso modulo puro (src/lib/market/market.ts): per ogni fonte riprende il giro
// dal cursore di market_sources, legge una pagina di market/search/render ogni 2,5 secondi e la salva con la funzione
// market_ingest del database, che accetta solo il segreto del cron (CRON_SECRET, lo stesso di Vercel e di
// scripts/set-cron-key.mjs). Indirizzo e chiave pubblica di Supabase da src/lib/supabase/env.ts.
// Uso: CRON_SECRET=… node scripts/market-collect.mjs [--budget <secondi>]   (Node 24: importa i .ts direttamente)
// Esce con 0 anche se Steam limita (lo scrive): il giro dopo riprende dal cursore.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MARKET_SOURCE_IDS, MARKET_SOURCES, STEAM_PAGE_GAP_MS, ingestRows, nextCursor, parseEcbUsd, parseSearchPage, searchUrl } from "../src/lib/market/market.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const budgetArg = args.indexOf("--budget");
const budgetMs = (budgetArg >= 0 ? Number(args[budgetArg + 1]) : 300) * 1000;
const secret = (process.env.CRON_SECRET ?? "").trim();
if (secret.length < 32) {
  console.error("Manca CRON_SECRET (almeno 32 caratteri): lo stesso di Vercel, registrato con scripts/set-cron-key.mjs.");
  process.exit(1);
}

const envTs = readFileSync(path.join(root, "src/lib/supabase/env.ts"), "utf8");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envTs.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || envTs.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
if (!supabaseUrl || !supabaseKey) {
  console.error("Indirizzo o chiave pubblica di Supabase non trovati in src/lib/supabase/env.ts");
  process.exit(1);
}
const woo = JSON.parse(readFileSync(path.join(root, "src/lib/data/woo-cards.json"), "utf8"));
const cardRefs = (woo.cards ?? woo).map((c) => ({ slug: c.slug, name: c.name }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headers = { apikey: supabaseKey, authorization: `Bearer ${supabaseKey}`, "content-type": "application/json" };

async function rest(pathAndQuery, init = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${pathAndQuery}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : null };
}

async function usdPerEur() {
  try {
    const res = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", { signal: AbortSignal.timeout(10_000) });
    return res.ok ? (parseEcbUsd(await res.text())?.usdPerEur ?? null) : null;
  } catch {
    return null;
  }
}

const deadline = Date.now() + budgetMs;
const fx = await usdPerEur();
console.log(`Cambio BCE: ${fx ?? "non disponibile"}`);
let rateLimited = false;
let failed = false;

for (const id of MARKET_SOURCE_IDS) {
  if (rateLimited || Date.now() > deadline) break;
  const source = MARKET_SOURCES[id];
  const cur = await rest(`market_sources?select=cursor_start&id=eq.${id}`);
  if (!cur.ok) {
    console.error(`[${id}] lettura del cursore: ${cur.status} ${JSON.stringify(cur.body)}`);
    failed = true;
    continue;
  }
  let start = cur.body?.[0]?.cursor_start ?? 0;
  let pages = 0;
  let saved = 0;
  while (Date.now() < deadline) {
    let json;
    try {
      const res = await fetch(searchUrl(source, start), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
      if (res.status === 429) {
        rateLimited = true;
        console.warn(`[${id}] Steam 429 (troppe richieste) alla pagina da ${start}: riprendo al prossimo giro`);
        break;
      }
      if (!res.ok) {
        console.error(`[${id}] Steam ${res.status} alla pagina da ${start}`);
        failed = true;
        break;
      }
      json = await res.json();
    } catch (error) {
      console.error(`[${id}] Steam: ${error instanceof Error ? error.message : error}`);
      failed = true;
      break;
    }
    const page = parseSearchPage(json);
    if (!page) {
      console.error(`[${id}] risposta di Steam inattesa`);
      failed = true;
      break;
    }
    const rows = ingestRows(id, page.items, id === "origins" ? cardRefs : []);
    const { next, done } = nextCursor(start, page.total, page.items.length);
    const r = await rest("rpc/market_ingest", {
      method: "POST",
      body: JSON.stringify({ p_key: secret, p_source: id, p_appid: source.appid, p_items: rows, p_next: next, p_total: page.total, p_done: done, p_usd_per_eur: fx }),
    });
    if (!r.ok) {
      console.error(`[${id}] market_ingest: ${r.status} ${JSON.stringify(r.body)}`);
      failed = true;
      break;
    }
    pages += 1;
    saved += Number(r.body) || 0;
    if (done) {
      console.log(`[${id}] giro finito: ${pages} pagine, ${saved} oggetti salvati, ${page.total} sul mercato`);
      break;
    }
    start = next;
    await sleep(STEAM_PAGE_GAP_MS);
  }
  if (pages && Date.now() >= deadline) console.log(`[${id}] tempo finito: ${pages} pagine, ${saved} oggetti; riprendo dal cursore ${start}`);
  await sleep(STEAM_PAGE_GAP_MS);
}

if (failed) process.exit(1);
console.log(rateLimited ? "Fermato da Steam (429): nessun errore, il prossimo giro riprende." : "Fatto.");
