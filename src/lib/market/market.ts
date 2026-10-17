/**
 * Tracker dei prezzi del mercato di Steam (17/10/2026, Pierluigi: "il tool che risulterà un gamechanger è un tracker dei
 * prezzi delle carte in tempo reale, quindi vedere l'andamento di ogni singola variante e singolo oggetto"). Funzioni
 * pure, senza import a runtime (`node --test src/lib/market/market.test.ts`): le usano il raccoglitore del cron
 * (collect.ts), le letture (queries.ts), le pagine /market e il grafico nel browser.
 *
 * Come funziona: Steam non dà lo storico dei prezzi senza un accesso (market/pricehistory risponde 400), quindi lo
 * storico lo costruisce il sito. A ogni giro del cron /api/cron/market si leggono le pagine pubbliche di
 * market/search/render (10 oggetti per pagina, solo dollari: prezzo più basso in vendita e numero di offerte) e il
 * database tiene una riga per oggetto, una per ora (30 giorni) e una per giorno (per sempre): blocco MERCATO di
 * supabase/schema.sql. Gli euro si calcolano con il cambio BCE del giorno, e le pagine lo dicono.
 *
 * Fonti (`MARKET_SOURCES`): `origins`, il mercato di Origins TCG (chiuso il 17/10/2026: le pagine dicono "in arrivo"
 * finché non c'è un oggetto), e `standin`, la controfigura con cui si prova il motore prima del giorno 1 (gli oggetti di
 * Steam di Hades: carte, carte foil, emoticon e sfondi, cioè carte con varianti), mostrata solo su /market/demo.
 */

export type MarketSourceId = "origins" | "standin";
export type MarketKind = "card" | "pack" | "other";
export type MarketCurrency = "EUR" | "USD";
export const MARKET_CURRENCIES: readonly MarketCurrency[] = ["EUR", "USD"];

export type MarketSource = {
  id: MarketSourceId;
  appid: number;
  /** filtri in più della ricerca di Steam (già codificati) */
  query: string;
  /** l'appid dell'indirizzo della scheda su Steam (per la controfigura è 753, la comunità di Steam) */
  listingAppid: number;
  /** icone degli oggetti sulle pagine: sì per Origins (illustrazioni delle carte, contenuto), no per la controfigura */
  icons: boolean;
};

export const MARKET_SOURCES: Record<MarketSourceId, MarketSource> = {
  origins: { id: "origins", appid: 4429430, query: "", listingAppid: 4429430, icons: true },
  standin: { id: "standin", appid: 753, query: "category_753_Game%5B%5D=tag_app_1145360", listingAppid: 753, icons: false },
};
export const MARKET_SOURCE_IDS = Object.keys(MARKET_SOURCES) as MarketSourceId[];

/** Oggetti per pagina di market/search/render (Steam ignora `count` e ne dà 10). */
export const STEAM_PAGE_SIZE = 10;
/** Pausa fra due pagine dello stesso giro: Steam risponde 429 a chi va troppo veloce. */
export const STEAM_PAGE_GAP_MS = 2500;
/** Tetto di oggetti per chiamata di market_ingest (lo stesso controllo è nell'SQL). */
export const INGEST_MAX_ITEMS = 100;
/** Prezzo massimo accettato, in centesimi (1 milione di dollari), uguale al vincolo dell'SQL. */
export const PRICE_MAX = 100_000_000;
/** Ogni quanto gira il cron (vercel.json): le pagine dicono "controlliamo ogni 10 minuti". */
export const MARKET_CRON_MINUTES = 10;

export function searchUrl(source: MarketSource, start: number): string {
  const extra = source.query ? `&${source.query}` : "";
  return `https://steamcommunity.com/market/search/render/?appid=${source.appid}&norender=1&sort_column=name&sort_dir=asc&start=${Math.max(0, Math.floor(start))}${extra}`;
}

/** La scheda dell'oggetto sul mercato di Steam (per il tasto "Vedi su Steam"). */
export function listingUrl(source: MarketSource, hashName: string): string {
  return `https://steamcommunity.com/market/listings/${source.listingAppid}/${encodeURIComponent(hashName)}`;
}

/** Icona di un oggetto dal CDN di Steam (passa da /_next/image: images.remotePatterns in next.config.ts). */
export function iconUrl(icon: string, size = 256): string {
  return `https://community.fastly.steamstatic.com/economy/image/${icon}/${size}fx${size}f`;
}

/** Un oggetto come lo dà una pagina di Steam, già ripulito. */
export type RawMarketItem = {
  hash_name: string;
  name: string;
  type: string;
  icon: string | null;
  name_color: string | null;
  /** centesimi di dollaro; null senza offerte */
  price: number | null;
  listings: number;
};

const cleanText = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩﻿]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

const intOr = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? Math.floor(v) : fallback);

/**
 * Una pagina di market/search/render (norender=1). Restituisce null se la risposta non è quella attesa (Steam a volte
 * risponde `success: false` o una pagina di errore). Gli oggetti senza nome o con numeri fuori scala si scartano.
 */
export function parseSearchPage(json: unknown): { total: number; items: RawMarketItem[] } | null {
  if (!json || typeof json !== "object") return null;
  const j = json as { success?: unknown; total_count?: unknown; results?: unknown };
  if (j.success !== true || !Array.isArray(j.results)) return null;
  const total = Math.max(0, intOr(j.total_count, 0));
  const items: RawMarketItem[] = [];
  for (const r of j.results) {
    if (!r || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    const desc = (row.asset_description && typeof row.asset_description === "object" ? row.asset_description : {}) as Record<string, unknown>;
    const hash = cleanText(row.hash_name ?? desc.market_hash_name, 300);
    const name = cleanText(row.name ?? desc.market_name ?? hash, 300);
    if (!hash || !name) continue;
    const listings = intOr(row.sell_listings, 0);
    const cents = intOr(row.sell_price, -1);
    if (listings < 0 || listings > PRICE_MAX) continue;
    const price = listings > 0 && cents >= 0 && cents <= PRICE_MAX ? cents : null;
    const icon = typeof desc.icon_url === "string" && /^[A-Za-z0-9_-]{1,1000}$/.test(desc.icon_url) ? desc.icon_url : null;
    const color = typeof desc.name_color === "string" && /^[0-9a-fA-F]{6}$/.test(desc.name_color) ? desc.name_color.toLowerCase() : null;
    items.push({ hash_name: hash, name, type: cleanText(desc.type, 200), icon, name_color: color, price, listings });
  }
  return { total, items };
}

/** Slug stabile dal nome dell'oggetto su Steam ("demo" è riservato a /market/demo). */
export function marketSlug(hashName: string): string {
  const base = hashName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
  if (!base) return `item-${hashCode(hashName)}`;
  return base === "demo" ? "demo-item" : base;
}

/** Impronta corta e stabile di un testo (per gli slug senza lettere, come le emoticon ":zag:"). */
export function hashCode(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** Che cosa è un oggetto: carta (con la carta del nostro database e la variante), busta o altro. */
export type MarketClass = { kind: MarketKind; card: string | null; variant: string | null };

/** Le carte del database, per riconoscere un oggetto di Origins (nome e slug bastano). */
export type MarketCardRef = { slug: string; name: string };

const PACK_RE = /\b(pack|booster|box|case|capsule|bundle|crate|chest|bustina|busta)\b/i;

/**
 * Classifica un oggetto. Controfigura (oggetti di Steam di Hades): "<gioco> Trading Card" e "<gioco> Foil Trading
 * Card" sono carte con variante Normale/Foil; emoticon, sfondi e il resto sono "altro". Origins: il formato dei nomi lo
 * vedremo il giorno 1; fino ad allora un oggetto il cui nome contiene il nome di una carta del database è quella carta
 * (il nome più lungo vince: "Baby Bear" prima di "Bear"), e la variante è il resto del nome; buste e confezioni sono
 * "pack" (dal tipo di Steam, o dal nome se non c'è una carta). Da rivedere con i nomi veri (fase 2).
 */
export function classifyItem(source: MarketSourceId, item: Pick<RawMarketItem, "name" | "type">, cards: readonly MarketCardRef[] = []): MarketClass {
  if (source === "standin") {
    if (/\bfoil trading card$/i.test(item.type)) return { kind: "card", card: null, variant: "foil" };
    if (/\btrading card$/i.test(item.type)) return { kind: "card", card: null, variant: "normal" };
    return { kind: "other", card: null, variant: null };
  }
  // il tipo di Steam che dice "busta" vince; nel nome conta solo se non c'è una carta (Jack-in-the-Box è una carta)
  if (PACK_RE.test(item.type)) return { kind: "pack", card: null, variant: null };
  const lower = item.name.toLowerCase();
  let best: MarketCardRef | null = null;
  for (const c of cards) {
    const n = c.name.toLowerCase();
    if (!n) continue;
    const at = lower.indexOf(n);
    if (at < 0) continue;
    const before = at === 0 || !/[a-z0-9]/.test(lower[at - 1]);
    const after = at + n.length === lower.length || !/[a-z0-9]/.test(lower[at + n.length]);
    if (before && after && (!best || n.length > best.name.length)) best = c;
  }
  if (!best) return { kind: PACK_RE.test(item.name) ? "pack" : "other", card: null, variant: null };
  const at = lower.indexOf(best.name.toLowerCase());
  const rest = (item.name.slice(0, at) + " " + item.name.slice(at + best.name.length))
    .replace(/[()[\]|·•,–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return { kind: "card", card: best.slug, variant: rest || null };
}

/** Una riga per market_ingest (stessi vincoli del blocco MERCATO). */
export type IngestRow = RawMarketItem & MarketClass & { slug: string };

export function ingestRows(source: MarketSourceId, items: readonly RawMarketItem[], cards: readonly MarketCardRef[] = []): IngestRow[] {
  return items.slice(0, INGEST_MAX_ITEMS).map((it) => ({ ...it, ...classifyItem(source, it, cards), slug: marketSlug(it.hash_name) }));
}

/** Dove riprendere dopo una pagina e se il giro è finito (pagine in ordine di nome, 10 alla volta). */
export function nextCursor(start: number, total: number, got: number): { next: number; done: boolean } {
  const next = start + Math.max(got, 0);
  if (got <= 0 || next >= total) return { next: 0, done: true };
  return { next, done: false };
}

/** Il cambio di riferimento BCE (dollari per un euro) dal file eurofxref-daily.xml; null se manca o è fuori scala. */
export function parseEcbUsd(xml: string): { day: string; usdPerEur: number } | null {
  const rate = /currency=['"]USD['"]\s+rate=['"]([0-9.]+)['"]/.exec(xml);
  const day = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml);
  const n = rate ? Number(rate[1]) : NaN;
  if (!day || !Number.isFinite(n) || n < 0.2 || n > 5) return null;
  return { day: day[1], usdPerEur: n };
}

/** Centesimi di dollaro nella valuta scelta (gli euro con il cambio del giorno). */
export function convertCents(usdCents: number, currency: MarketCurrency, usdPerEur: number | null): number | null {
  if (currency === "USD") return usdCents;
  if (!usdPerEur || usdPerEur <= 0) return null;
  return usdCents / usdPerEur;
}

export function formatMoney(cents: number | null, currency: MarketCurrency, locale: string): string {
  if (cents === null || !Number.isFinite(cents)) return "—";
  // simbolo corto ($, €) in ogni lingua: "0,64 USD" in italiano sarebbe più lungo e diverso dal resto
  return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

/** Variazione percentuale fra due prezzi (null se manca il prezzo di prima o quello di adesso). */
export function changePct(now: number | null, before: number | null): number | null {
  if (now === null || before === null || before <= 0) return null;
  return ((now - before) / before) * 100;
}

/** La valuta di partenza per lingua: dollari sulle pagine inglesi, euro sulle altre. */
export function defaultCurrency(locale: string): MarketCurrency {
  return locale === "en" ? "USD" : "EUR";
}

/** Una riga del tabellone (funzione market_board). */
export type BoardItem = {
  hash_name: string;
  slug: string;
  name: string;
  item_type: string;
  kind: MarketKind;
  card: string | null;
  variant: string | null;
  icon: string | null;
  name_color: string | null;
  price: number | null;
  listings: number;
  first_seen: string;
  last_seen: string;
  price_24h: number | null;
  price_7d: number | null;
  price_30d: number | null;
};

const KINDS: readonly MarketKind[] = ["card", "pack", "other"];
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString() : null);

/** Righe di market_board ricontrollate (quelle sporche si scartano). */
export function boardRows(rows: unknown): BoardItem[] {
  if (!Array.isArray(rows)) return [];
  const out: BoardItem[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const x = r as Record<string, unknown>;
    const hash = str(x.hash_name);
    const slug = str(x.slug);
    const name = str(x.name);
    const kind = KINDS.includes(x.kind as MarketKind) ? (x.kind as MarketKind) : null;
    if (!hash || !slug || !name || !kind) continue;
    out.push({
      hash_name: hash,
      slug,
      name,
      item_type: str(x.item_type) ?? "",
      kind,
      card: str(x.card),
      variant: str(x.variant),
      icon: str(x.icon),
      name_color: str(x.name_color),
      price: num(x.price),
      listings: num(x.listings) ?? 0,
      first_seen: str(x.first_seen) ?? "",
      last_seen: str(x.last_seen) ?? "",
      price_24h: num(x.price_24h),
      price_7d: num(x.price_7d),
      price_30d: num(x.price_30d),
    });
  }
  return out;
}

/** Un punto dello storico: ora (o giorno, a mezzogiorno UTC) e prezzi in centesimi di dollaro. */
export type PricePoint = { t: string; low: number; high: number; close: number; listings: number };

export type MarketRange = "24h" | "7d" | "30d" | "all";
export const MARKET_RANGES: readonly MarketRange[] = ["24h", "7d", "30d", "all"];
const RANGE_MS: Record<Exclude<MarketRange, "all">, number> = { "24h": 24 * 3600_000, "7d": 7 * 24 * 3600_000, "30d": 30 * 24 * 3600_000 };

/** Righe orarie o giornaliere ricontrollate e in ordine di tempo. */
export function pricePoints(rows: unknown, timeKey: "hour" | "day"): PricePoint[] {
  if (!Array.isArray(rows)) return [];
  const out: PricePoint[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const x = r as Record<string, unknown>;
    const raw = str(x[timeKey]);
    const close = num(x.close);
    if (!raw || close === null) continue;
    const t = timeKey === "day" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00.000Z` : raw;
    if (Number.isNaN(Date.parse(t))) continue;
    out.push({ t: new Date(t).toISOString(), low: num(x.low) ?? close, high: num(x.high) ?? close, close, listings: num(x.listings) ?? 0 });
  }
  return out.sort((a, b) => a.t.localeCompare(b.t));
}

/**
 * I punti di un intervallo del grafico: 24 ore, 7 e 30 giorni dallo storico orario (quello che c'è), "tutto" dal
 * giornaliero. Se lo storico orario non copre l'intervallo si usa quello che c'è: niente punti inventati.
 */
export function rangePoints(range: MarketRange, hourly: readonly PricePoint[], daily: readonly PricePoint[], now: number): { points: PricePoint[]; byDay: boolean } {
  if (range === "all") return daily.length >= 2 || hourly.length === 0 ? { points: [...daily], byDay: true } : { points: [...hourly], byDay: false };
  const from = now - RANGE_MS[range];
  const h = hourly.filter((p) => Date.parse(p.t) >= from);
  if (range === "30d" && h.length < 2) return { points: daily.filter((p) => Date.parse(p.t) >= from), byDay: true };
  return { points: h, byDay: false };
}

/**
 * I prezzi di 24 ore, 7 e 30 giorni fa dallo storico di un oggetto, con le regole di market_board: l'ultima ora che
 * comincia almeno 24 ore prima dell'ora in corso, l'ultimo giorno almeno 7 (o 30) giorni prima di oggi (UTC).
 */
export function pastPrices(hourly: readonly PricePoint[], daily: readonly PricePoint[], now: number): Pick<BoardItem, "price_24h" | "price_7d" | "price_30d"> {
  const hourNow = Math.floor(now / 3600_000) * 3600_000;
  const lastBefore = (points: readonly PricePoint[], limit: number) => {
    let best: PricePoint | null = null;
    for (const p of points) if (Date.parse(p.t) <= limit && (!best || p.t > best.t)) best = p;
    return best?.close ?? null;
  };
  const today = Date.parse(new Date(now).toISOString().slice(0, 10) + "T12:00:00.000Z");
  return {
    price_24h: lastBefore(hourly, hourNow - 24 * 3600_000),
    price_7d: lastBefore(daily, today - 7 * 24 * 3600_000),
    price_30d: lastBefore(daily, today - 30 * 24 * 3600_000),
  };
}

/** Un cambio per giorno (YYYY-MM-DD → dollari per euro), con il giorno noto più vicino prima per i giorni senza. */
export function fxFor(day: string, fx: ReadonlyMap<string, number>, fallback: number | null): number | null {
  if (fx.has(day)) return fx.get(day)!;
  let best: string | null = null;
  for (const d of fx.keys()) if (d <= day && (!best || d > best)) best = d;
  return best ? fx.get(best)! : fallback;
}

/** Geometria del grafico: punti in pixel e tacche dell'asse dei prezzi (tre o quattro valori tondi). */
export type ChartGeometry = { xs: number[]; ys: number[]; min: number; max: number; ticks: number[] };

export function chartGeometry(values: readonly number[], times: readonly number[], width: number, height: number, pad = { top: 12, right: 8, bottom: 8, left: 8 }): ChartGeometry | null {
  if (values.length === 0 || values.length !== times.length) return null;
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    const d = Math.max(1, Math.abs(min) * 0.05);
    min -= d;
    max += d;
  }
  const ticks = niceTicks(min, max, 4);
  min = Math.min(min, ticks[0]);
  max = Math.max(max, ticks[ticks.length - 1]);
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const xs = times.map((t) => pad.left + (t1 === t0 ? w / 2 : ((t - t0) / (t1 - t0)) * w));
  const ys = values.map((v) => pad.top + (1 - (v - min) / (max - min)) * h);
  return { xs, ys, min, max, ticks };
}

/** Valori tondi fra min e max (1, 2, 2,5 o 5 per una potenza di dieci), mai sotto il centesimo intero: i valori sono centesimi. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / Math.max(1, count - 1);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw && s >= 1 && Number.isInteger(s)) ?? Math.max(1, Math.ceil(10 * pow));
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; out.length < 8; v += step) {
    out.push(Math.round(v * 1e6) / 1e6);
    if (v >= max) break;
  }
  return out;
}

/** Fra le righe del tabellone, le variazioni più grandi in 24 ore (su e giù), solo con un prezzo di prima. */
export function movers(items: readonly BoardItem[], n = 3): { up: BoardItem[]; down: BoardItem[] } {
  const withChange = items
    .map((it) => ({ it, c: changePct(it.price, it.price_24h) }))
    .filter((x): x is { it: BoardItem; c: number } => x.c !== null && x.c !== 0);
  const up = withChange.filter((x) => x.c > 0).sort((a, b) => b.c - a.c).slice(0, n).map((x) => x.it);
  const down = withChange.filter((x) => x.c < 0).sort((a, b) => a.c - b.c).slice(0, n).map((x) => x.it);
  return { up, down };
}

/** Il nome del gruppo di un oggetto nel tabellone: la carta (Origins), il nome (controfigura), o l'oggetto stesso. */
export function groupKey(item: Pick<BoardItem, "card" | "name" | "kind">): string {
  return item.card ?? (item.kind === "card" ? item.name : `${item.kind}:${item.name}`);
}
