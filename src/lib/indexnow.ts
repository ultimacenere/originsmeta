/**
 * IndexNow: avvisa Bing (e gli altri motori del protocollo: Yandex, Seznam, Naver…) che un URL del sito è nuovo o è
 * cambiato, così lo scansiona in pochi minuti invece di aspettare la sitemap (Ondata 2 del piano SEO/GEO, 25/09/2026:
 * GEO-05, TECH-08). Conta perché la ricerca di ChatGPT e Copilot pesca dall'indice di Bing, che è la nostra seconda
 * fonte di traffico, e perché le news, le patch e lo spagnolo devono arrivarci prima del Next Fest.
 *
 * Protocollo (indexnow.org/documentation): POST JSON a https://api.indexnow.org/indexnow con host, chiave, posizione
 * del file della chiave e fino a 10.000 URL, tutti dello stesso host. La chiave NON è un segreto: sta in chiaro in
 * public/<chiave>.txt, ed è così che il motore verifica che il sito è nostro. Per cambiarla: chiave nuova qui, file
 * nuovo in public/, e il vecchio file si toglie.
 *
 * Chi lo usa:
 *   - scripts/indexnow.mjs, nella GitHub Action degli annunci (news, guide e schede delle carte cambiate, dopo il
 *     deploy) e a mano (lancio di una lingua, invio di una sezione intera);
 *   - il sito, dopo la pubblicazione o la traduzione di un mazzo della community (dentro `after()`, solo in
 *     produzione: `indexNowEnabled`).
 * Nessun import (lo carica anche Node dallo script, senza Next): funzioni pure più `submitIndexNow`, che fa la
 * richiesta con il `fetch` che riceve. Test: `node --test src/lib/indexnow.test.ts`.
 */

/** La chiave del sito: 32 caratteri esadecimali, lo stesso testo del file public/<chiave>.txt. */
export const INDEXNOW_KEY = "6bb5ebabe63e7ffa7bf9c006e09c3ef7";

/** Punto d'ingresso comune: gira l'avviso a tutti i motori che aderiscono al protocollo. */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Al massimo 10.000 URL per richiesta. */
export const INDEXNOW_MAX_URLS = 10_000;

/** Il sito (lo stesso `siteUrl` di src/lib/i18n.ts: il test controlla che coincidano). */
export const INDEXNOW_SITE = "https://originsmeta.com";

/** Una chiave valida per il protocollo: da 8 a 128 caratteri fra lettere, cifre e trattino. */
export function isIndexNowKey(key: string): boolean {
  return /^[A-Za-z0-9-]{8,128}$/.test(key);
}

/** Indirizzo del file della chiave: nella radice del sito, così vale per tutti gli URL. */
export function keyFileUrl(site: string = INDEXNOW_SITE, key: string = INDEXNOW_KEY): string {
  return `${site.replace(/\/+$/, "")}/${key}.txt`;
}

/** Un percorso nelle lingue indicate: ("/news/x", ["en","it"]) → ["/en/news/x", "/it/news/x"]; "" → le home. */
export function localizedPaths(path: string, locales: readonly string[]): string[] {
  const clean = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return locales.map((l) => `/${l}${clean}`);
}

/**
 * Gli URL da mandare: assoluti, del solo nostro host e in https, senza frammento (#…) né barra finale, senza
 * doppioni, nell'ordine in cui arrivano. I percorsi (/it/news/…) diventano URL del sito; il resto si scarta, perché
 * il motore rifiuterebbe tutta la richiesta (422) per un solo URL di un altro host.
 */
export function indexNowUrls(input: Iterable<string>, site: string = INDEXNOW_SITE): string[] {
  const base = new URL(site);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const value = raw?.trim();
    if (!value) continue;
    let u: URL;
    try {
      u = new URL(value, base);
    } catch {
      continue;
    }
    if (u.protocol !== "https:" || u.host !== base.host || u.username || u.password) continue;
    u.hash = "";
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
    const url = u.pathname === "/" && !u.search ? u.origin : u.href;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Gli URL in gruppi da `max` (10.000, il limite del protocollo). */
export function indexNowBatches<T>(urls: readonly T[], max: number = INDEXNOW_MAX_URLS): T[][] {
  const size = Math.max(1, Math.floor(max));
  const out: T[][] = [];
  for (let i = 0; i < urls.length; i += size) out.push(urls.slice(i, i + size));
  return out;
}

export type IndexNowBody = { host: string; key: string; keyLocation: string; urlList: string[] };

/** Il corpo JSON di una richiesta. */
export function indexNowBody(urls: readonly string[], site: string = INDEXNOW_SITE, key: string = INDEXNOW_KEY): IndexNowBody {
  return { host: new URL(site).host, key, keyLocation: keyFileUrl(site, key), urlList: [...urls] };
}

export type IndexNowRequest = { url: string; init: { method: "POST"; headers: Record<string, string>; body: string }; count: number };

export type IndexNowOptions = { site?: string; key?: string; endpoint?: string; max?: number };

/**
 * Le richieste per un elenco di URL: prima la pulizia (`indexNowUrls`), poi un POST ogni 10.000. Nessuna richiesta se
 * non resta nessun URL o se la chiave non è valida.
 */
export function indexNowRequests(urls: Iterable<string>, opts: IndexNowOptions = {}): IndexNowRequest[] {
  const site = opts.site ?? INDEXNOW_SITE;
  const key = opts.key ?? INDEXNOW_KEY;
  if (!isIndexNowKey(key)) return [];
  return indexNowBatches(indexNowUrls(urls, site), opts.max).map((batch) => ({
    url: opts.endpoint ?? INDEXNOW_ENDPOINT,
    init: {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowBody(batch, site, key)),
    },
    count: batch.length,
  }));
}

/** Che cosa vuol dire la risposta del motore (codici di indexnow.org). 200 e 202 vanno bene. */
export function describeIndexNowStatus(status: number): { ok: boolean; text: string } {
  switch (status) {
    case 200:
      return { ok: true, text: "ricevuti" };
    case 202:
      return { ok: true, text: "ricevuti, verifica della chiave in corso" };
    case 400:
      return { ok: false, text: "richiesta non valida (400)" };
    case 403:
      return { ok: false, text: "chiave non valida o file della chiave non raggiungibile (403)" };
    case 422:
      return { ok: false, text: "URL di un altro host o chiave che non corrisponde (422)" };
    case 429:
      return { ok: false, text: "troppe richieste, il motore chiede di rallentare (429)" };
    default:
      return { ok: status >= 200 && status < 300, text: `risposta ${status}` };
  }
}

/**
 * Il sito manda gli avvisi solo dalla produzione di Vercel: una prova in locale o in un'anteprima pubblicherebbe su
 * Bing URL di prova. `INDEXNOW=off` li spegne anche in produzione.
 */
export function indexNowEnabled(env: Readonly<Record<string, string | undefined>> = process.env): boolean {
  return env.VERCEL_ENV === "production" && env.INDEXNOW !== "off";
}

export type IndexNowResult = { count: number; ok: boolean; status?: number; text: string };

type FetchLike = (url: string, init: IndexNowRequest["init"] & { signal?: AbortSignal }) => Promise<{ status: number }>;

/**
 * Manda gli avvisi e restituisce l'esito di ogni richiesta. Non lancia mai: un errore di IndexNow non deve fermare
 * chi pubblica né la GitHub Action, al massimo lascia un avviso nei log. Timeout per richiesta: `timeoutMs`.
 */
export async function submitIndexNow(
  urls: Iterable<string>,
  opts: IndexNowOptions & { fetch?: FetchLike; timeoutMs?: number } = {},
): Promise<IndexNowResult[]> {
  const doFetch: FetchLike = opts.fetch ?? ((url, init) => fetch(url, init));
  const results: IndexNowResult[] = [];
  for (const req of indexNowRequests(urls, opts)) {
    try {
      const signal = AbortSignal.timeout(opts.timeoutMs ?? 10_000);
      const res = await doFetch(req.url, { ...req.init, signal });
      results.push({ count: req.count, status: res.status, ...describeIndexNowStatus(res.status) });
    } catch (e) {
      results.push({ count: req.count, ok: false, text: `rete: ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  for (const r of results) {
    if (!r.ok) console.warn(`[indexnow] ${r.count} URL non accettati: ${r.text}`);
  }
  return results;
}
