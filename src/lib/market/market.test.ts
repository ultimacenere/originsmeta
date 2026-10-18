/**
 * Test del tracker dei prezzi del mercato di Steam (17/10/2026): `node --test src/lib/market/market.test.ts`.
 * - Funzioni pure di market.ts: lettura di una pagina di market/search/render (anche righe sporche), slug, classificazione
 *   degli oggetti (controfigura e Origins), cursore del giro, cambio BCE, valute, variazioni, storico, grafico.
 * - Testi di marketLabels.ts nelle quattro lingue: titoli e description nei limiti di Google, stessi segnaposto,
 *   spazio insecabile del francese.
 * - Blocco MERCATO di schema.sql uguale alle regole del codice: tetti, scrittura solo con il segreto, letture per tutti.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  INGEST_MAX_ITEMS,
  MARKET_SOURCES,
  PRICE_MAX,
  boardRows,
  changePct,
  chartGeometry,
  classifyItem,
  convertCents,
  defaultCurrency,
  formatMoney,
  fxFor,
  ingestRows,
  marketSlug,
  movers,
  nextCursor,
  niceTicks,
  parseEcbUsd,
  parseSearchPage,
  pastPrices,
  pricePoints,
  rangePoints,
  searchUrl,
  workflowDispatchRequest,
  sortBoard,
  defaultSortDir,
  type BoardItem,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./market.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { marketLabels } from "../marketLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { MARKET_PUBLIC, canSeeMarket } from "../community/badges.ts";

const steamRow = (over: Record<string, unknown> = {}) => ({
  name: "Lord Hades",
  hash_name: "1145360-Lord Hades",
  sell_listings: 3412,
  sell_price: 7,
  sell_price_text: "$0.07",
  asset_description: { appid: 753, icon_url: "IzMF03bk9WpSBq-S", name_color: "", type: "Hades Trading Card", market_hash_name: "1145360-Lord Hades" },
  ...over,
});

describe("pagina di Steam", () => {
  test("legge prezzo, offerte, tipo e icona", () => {
    const page = parseSearchPage({ success: true, total_count: 36, results: [steamRow()] });
    assert.deepEqual(page, { total: 36, items: [{ hash_name: "1145360-Lord Hades", name: "Lord Hades", type: "Hades Trading Card", icon: "IzMF03bk9WpSBq-S", name_color: null, price: 7, listings: 3412 }] });
  });
  test("senza offerte il prezzo è null; righe sporche scartate", () => {
    const page = parseSearchPage({
      success: true,
      total_count: 3,
      results: [steamRow({ sell_listings: 0, sell_price: 0 }), steamRow({ hash_name: "", name: "" }), steamRow({ sell_price: PRICE_MAX + 1 }), null, "x"],
    });
    assert.equal(page?.items.length, 2);
    assert.equal(page?.items[0].price, null);
    assert.equal(page?.items[1].price, null, "prezzo fuori scala = nessun prezzo");
  });
  test("icona con caratteri strani scartata, testo ripulito dai caratteri invisibili", () => {
    const page = parseSearchPage({ success: true, total_count: 1, results: [steamRow({ name: "Lord​  Hades‮", asset_description: { icon_url: "../x", type: "T" } })] });
    assert.equal(page?.items[0].icon, null);
    assert.equal(page?.items[0].name, "Lord Hades");
  });
  test("risposta di errore = null", () => {
    assert.equal(parseSearchPage({ success: false }), null);
    assert.equal(parseSearchPage(null), null);
    assert.equal(parseSearchPage({ success: true }), null);
  });
  test("indirizzo della ricerca con i filtri della fonte", () => {
    assert.match(searchUrl(MARKET_SOURCES.standin, 20), /appid=730&norender=1&sort_column=name&sort_dir=asc&start=20&category_730_ItemSet%5B%5D=tag_set_community_30$/);
    assert.match(searchUrl(MARKET_SOURCES.origins, -5), /appid=4429430&.*start=0$/);
  });
});

describe("slug e classificazione", () => {
  test("slug stabile, senza accenti né simboli; demo riservato", () => {
    assert.equal(marketSlug("1145360-Lord Hades"), "1145360-lord-hades");
    assert.equal(marketSlug("Mérlin (Foil) & Co."), "merlin-foil-and-co");
    assert.equal(marketSlug("Demo"), "demo-item");
    assert.equal(marketSlug("★ StatTrak™ AK-47 | Nightwish (Factory New)"), "stattrak-ak-47-nightwish-factory-new");
    assert.match(marketSlug(":::"), /^item-[a-z0-9]+$/);
    assert.ok(marketSlug("x".repeat(300)).length <= 100);
  });
  test("controfigura CS2: skin con StatTrak/Souvenir e usura, la cassa è una busta", () => {
    assert.deepEqual(classifyItem("standin", { name: "AK-47 | Nightwish (Field-Tested)", type: "Covert Rifle" }), { kind: "card", card: null, variant: "Field-Tested" });
    assert.deepEqual(classifyItem("standin", { name: "StatTrak™ AK-47 | Nightwish (Factory New)", type: "StatTrak™ Covert Rifle" }), { kind: "card", card: null, variant: "StatTrak™ · Factory New" });
    assert.deepEqual(classifyItem("standin", { name: "★ StatTrak™ Karambit | Doppler (Minimal Wear)", type: "★ Covert Knife" }), { kind: "card", card: null, variant: "★ StatTrak™ · Minimal Wear" });
    assert.deepEqual(classifyItem("standin", { name: "Dreams & Nightmares Case", type: "Base Grade Container" }), { kind: "pack", card: null, variant: null });
    assert.equal(classifyItem("standin", { name: "Sticker | Something", type: "Sticker" }).variant, null);
    assert.equal(classifyItem("standin", { name: "Music Kit", type: "Music Kit" }).kind, "other");
  });
  const cards = [
    { slug: "bear", name: "Bear" },
    { slug: "baby-bear", name: "Baby Bear" },
    { slug: "jack-in-the-box", name: "Jack-in-the-Box" },
    { slug: "merlin", name: "Merlin" },
  ];
  test("Origins: il nome più lungo vince e il resto è la variante", () => {
    assert.deepEqual(classifyItem("origins", { name: "Baby Bear (Foil) - Grade 9.5", type: "Collectible Card" }, cards), { kind: "card", card: "baby-bear", variant: "Foil Grade 9.5" });
    assert.deepEqual(classifyItem("origins", { name: "Merlin", type: "Card" }, cards), { kind: "card", card: "merlin", variant: null });
    assert.equal(classifyItem("origins", { name: "Merlinda", type: "Card" }, cards).kind, "other", "solo parole intere");
  });
  test("Origins: Jack-in-the-Box è una carta, una busta è una busta", () => {
    assert.equal(classifyItem("origins", { name: "Jack-in-the-Box", type: "Card" }, cards).card, "jack-in-the-box");
    assert.equal(classifyItem("origins", { name: "Myths and Legends Booster Pack", type: "Pack" }, cards).kind, "pack");
    assert.equal(classifyItem("origins", { name: "Merlin Capsule", type: "Sealed Product Box" }, cards).kind, "pack", "il tipo di Steam vince");
  });
  test("righe per market_ingest: al massimo 100, con slug e classe", () => {
    const items = parseSearchPage({ success: true, total_count: 1, results: [steamRow({ name: "AK-47 | Nightwish (Field-Tested)", hash_name: "AK-47 | Nightwish (Field-Tested)", asset_description: { type: "Covert Rifle" } })] })!.items;
    const rows = ingestRows("standin", Array(150).fill(items[0]));
    assert.equal(rows.length, INGEST_MAX_ITEMS);
    assert.equal(rows[0].slug, "ak-47-nightwish-field-tested");
    assert.equal(rows[0].kind, "card");
    assert.equal(rows[0].variant, "Field-Tested");
  });
});

describe("giro, cambio e prezzi", () => {
  test("cursore: avanti di pagina in pagina, a zero alla fine", () => {
    assert.deepEqual(nextCursor(0, 36, 10), { next: 10, done: false });
    assert.deepEqual(nextCursor(30, 36, 6), { next: 0, done: true });
    assert.deepEqual(nextCursor(40, 36, 0), { next: 0, done: true }, "pagina vuota = giro finito");
    assert.deepEqual(nextCursor(0, 0, 0), { next: 0, done: true }, "mercato chiuso");
  });
  test("cambio BCE dal file del giorno", () => {
    const xml = "<Cube time='2026-10-16'><Cube currency='USD' rate='1.1253'/><Cube currency='JPY' rate='170.1'/></Cube>";
    assert.deepEqual(parseEcbUsd(xml), { day: "2026-10-16", usdPerEur: 1.1253 });
    assert.equal(parseEcbUsd("<Cube time='2026-10-16'><Cube currency='USD' rate='99'/></Cube>"), null);
    assert.equal(parseEcbUsd("niente"), null);
  });
  test("valute e formati", () => {
    assert.equal(convertCents(1125, "USD", 1.125), 1125);
    assert.equal(convertCents(1125, "EUR", 1.125), 1000);
    assert.equal(convertCents(1125, "EUR", null), null);
    assert.equal(formatMoney(1000, "EUR", "it"), "10,00 €");
    assert.equal(formatMoney(7, "USD", "en"), "$0.07");
    assert.equal(formatMoney(64, "USD", "it"), "0,64 $");
    assert.equal(formatMoney(null, "USD", "en"), "—");
    assert.equal(defaultCurrency("en"), "USD");
    assert.equal(defaultCurrency("fr"), "EUR");
  });
  test("variazioni", () => {
    assert.equal(changePct(110, 100), 10);
    assert.equal(changePct(90, 100), -10);
    assert.equal(changePct(null, 100), null);
    assert.equal(changePct(100, 0), null);
  });
});

const item = (over: Partial<BoardItem>): BoardItem => ({
  hash_name: "h",
  slug: "h",
  name: "H",
  item_type: "",
  kind: "card",
  card: null,
  variant: null,
  icon: null,
  name_color: null,
  price: 100,
  listings: 1,
  first_seen: "",
  last_seen: "",
  price_24h: null,
  price_7d: null,
  price_30d: null,
  ...over,
});

describe("tabellone e storico", () => {
  test("righe del tabellone ricontrollate", () => {
    const rows = boardRows([{ hash_name: "a", slug: "a", name: "A", kind: "card", price: "12", listings: 3, price_24h: null }, { hash_name: "b", slug: "b", name: "B", kind: "weird" }, null]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].price, 12, "i numeri come testo diventano numeri");
  });
  test("ordinamenti: A→Z e Z→A, prezzo e offerte nei due versi, senza prezzo sempre in fondo", () => {
    const list = [
      item({ hash_name: "b", name: "Beta", price: 300, listings: 1 }),
      item({ hash_name: "a", name: "alfa", price: 100, listings: 50 }),
      item({ hash_name: "n", name: "Nullo", price: null, listings: 0 }),
      item({ hash_name: "g", name: "Gamma", price: 200, listings: 7, price_24h: 100 }),
    ];
    const names = (key: "name" | "price" | "listings" | "change", dir: "asc" | "desc") => sortBoard(list, key, dir, "it").map((x) => x.hash_name).join("");
    assert.equal(names("name", "asc"), "abgn", "A→Z senza badare alle maiuscole");
    assert.equal(names("name", "desc"), "ngba");
    assert.equal(names("price", "desc"), "bgan");
    assert.equal(names("price", "asc"), "agbn", "senza prezzo in fondo anche dal più basso");
    assert.equal(names("listings", "desc"), "agbn");
    assert.equal(names("listings", "asc"), "nbga");
    assert.equal(names("change", "desc")[0], "g", "chi ha una variazione prima di chi non ce l'ha");
    assert.equal(list[0].hash_name, "b", "l'elenco di partenza non cambia");
    assert.equal(defaultSortDir("name"), "asc");
    assert.equal(defaultSortDir("price"), "desc");
  });
  test("chi sale e chi scende in 24 ore, senza i fermi e senza storico", () => {
    const list = [item({ slug: "a", price: 150, price_24h: 100 }), item({ slug: "b", price: 50, price_24h: 100 }), item({ slug: "c", price: 100, price_24h: 100 }), item({ slug: "d", price: 999 })];
    const m = movers(list, 3);
    assert.deepEqual(m.up.map((x) => x.slug), ["a"]);
    assert.deepEqual(m.down.map((x) => x.slug), ["b"]);
  });
  const hourly = pricePoints(
    [
      { hour: "2026-10-16T10:00:00+00:00", low: 90, high: 110, close: 100, listings: 5 },
      { hour: "2026-10-17T09:00:00+00:00", close: 120, listings: 6 },
      { hour: "2026-10-17T11:00:00+00:00", close: 130, listings: 4 },
      { hour: "rotto", close: 1 },
    ],
    "hour",
  );
  const daily = pricePoints(
    [
      { day: "2026-09-10", close: 50, listings: 1 },
      { day: "2026-10-09", close: 80, listings: 2 },
      { day: "2026-10-16", close: 100, listings: 5 },
      { day: "2026-10-17", close: 130, listings: 4 },
    ],
    "day",
  );
  const now = Date.parse("2026-10-17T11:30:00Z");
  test("punti in ordine, righe rotte scartate, minimo e massimo di riserva", () => {
    assert.equal(hourly.length, 3);
    assert.equal(hourly[1].low, 120);
    assert.equal(daily[0].t, "2026-09-10T12:00:00.000Z");
  });
  test("prezzi di prima con le regole di market_board", () => {
    assert.deepEqual(pastPrices(hourly, daily, now), { price_24h: 100, price_7d: 80, price_30d: 50 });
    assert.deepEqual(pastPrices([], [], now), { price_24h: null, price_7d: null, price_30d: null });
  });
  test("intervalli del grafico: orario fino a 30 giorni, giornaliero per tutto, niente punti inventati", () => {
    assert.deepEqual(rangePoints("24h", hourly, daily, now).points.map((p) => p.close), [120, 130]);
    assert.equal(rangePoints("7d", hourly, daily, now).points.length, 3);
    assert.equal(rangePoints("all", hourly, daily, now).byDay, true);
    assert.equal(rangePoints("all", hourly, [], now).byDay, false, "senza giornaliero si usa l'orario");
    assert.equal(rangePoints("30d", hourly.slice(0, 1), daily, now).byDay, true);
  });
  test("cambio del giorno, o del giorno noto più vicino prima", () => {
    const fx = new Map([["2026-10-15", 1.1], ["2026-10-17", 1.2]]);
    assert.equal(fxFor("2026-10-17", fx, null), 1.2);
    assert.equal(fxFor("2026-10-16", fx, null), 1.1);
    assert.equal(fxFor("2026-10-01", fx, 1.3), 1.3);
  });
  test("geometria del grafico dentro i margini, tacche tonde", () => {
    const g = chartGeometry([100, 200, 150], [0, 1, 2], 720, 260, { top: 16, right: 12, bottom: 28, left: 64 })!;
    assert.equal(g.xs[0], 64);
    assert.equal(g.xs[2], 708);
    assert.ok(g.ys.every((y) => y >= 16 && y <= 232));
    assert.deepEqual(niceTicks(100, 200, 4), [100, 150, 200]);
    assert.ok(niceTicks(60, 68, 4).every(Number.isInteger), "centesimi interi");
    assert.deepEqual(niceTicks(60.8, 67.2, 4), [60, 65, 70], "le tacche coprono minimo e massimo");
    assert.deepEqual(niceTicks(5, 5.4, 4), [5, 6]);
    assert.ok(chartGeometry([5, 5], [0, 1], 100, 100), "prezzo fermo: niente divisione per zero");
    assert.equal(chartGeometry([], [], 100, 100), null);
  });
});

describe("testi nelle quattro lingue", () => {
  const TITLE_MAX = 60;
  const fullTitle = (t: string) => (/origins tcg|originsmeta/i.test(t) ? t : `${t} · Origins TCG`);
  const keys = (o: unknown, p = ""): string[] =>
    o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [`${p}${k}`] : keys(v, `${p}${k}.`))) : [];
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
  const get = (o: unknown, path: string) => path.split(".").reduce<unknown>((x, k) => (x as Record<string, unknown>)[k], o);
  for (const [locale, l] of Object.entries(marketLabels)) {
    test(`${locale}: titoli e description nei limiti`, () => {
      assert.ok(fullTitle(l.meta.title).length <= TITLE_MAX, l.meta.title);
      assert.ok(fullTitle(l.meta.demoTitle).length <= TITLE_MAX, l.meta.demoTitle);
      for (const d of [l.meta.description, l.meta.demoDescription]) assert.ok(d.length >= 120 && d.length <= 158, `${d.length}: ${d}`);
    });
    test(`${locale}: stesse chiavi e stessi segnaposto dell'inglese`, () => {
      assert.deepEqual(keys(l), keys(marketLabels.en));
      for (const k of keys(marketLabels.en)) assert.equal(placeholders(get(l, k) as string), placeholders(get(marketLabels.en, k) as string), k);
      assert.equal(l.notes.points.length, marketLabels.en.notes.points.length);
    });
  }
  test("francese: spazio insecabile prima di : ; ? !", () => {
    const all = JSON.stringify(marketLabels.fr);
    assert.doesNotMatch(all, / [:;?!]/);
    assert.doesNotMatch(all, /[A-Za-zÀ-ÿ)][;?!]/);
  });
});

describe("blocco MERCATO di schema.sql", () => {
  const sql = fs.readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
  const start = sql.indexOf("-- ===== 17/10/2026: MERCATO =====");
  const next = sql.indexOf("-- ===== ", start + 10);
  const block = sql.slice(start, next > 0 ? next : undefined);
  test("c'è, una volta sola", () => {
    assert.ok(start > 0);
    assert.equal(sql.split("-- ===== 17/10/2026: MERCATO =====").length, 2);
  });
  test("stessi tetti del codice", () => {
    assert.match(block, new RegExp(`jsonb_array_length\\(p_items\\) > ${INGEST_MAX_ITEMS}`));
    assert.match(block, new RegExp(`price between 0 and ${PRICE_MAX}`));
  });
  test("scrive solo market_ingest con il segreto; tutti leggono, nessuno scrive direttamente", () => {
    assert.match(block, /if not public\.notify_key_ok\(p_key\) then raise exception 'forbidden'/);
    assert.match(block, /revoke all on public\.market_sources, public\.market_items, public\.market_prices_hourly, public\.market_prices_daily, public\.market_fx from anon, authenticated;/);
    assert.match(block, /grant select on public\.market_sources, public\.market_items, public\.market_prices_hourly, public\.market_prices_daily, public\.market_fx to anon, authenticated;/);
    assert.doesNotMatch(block, /grant (insert|update|delete|all)/i);
    assert.match(block, /market_ingest[\s\S]*security definer/);
    assert.match(block, /market_board[\s\S]*security invoker/);
  });
  test("le fonti del codice rispettano il vincolo dell'SQL", () => {
    for (const id of Object.keys(MARKET_SOURCES)) assert.match(id, /^[a-z][a-z0-9-]{1,30}$/);
  });
});

describe("prova riservata del Mercato (18/10/2026)", () => {
  test("finché è chiuso lo aprono solo gli admin (Pierluigi e Davdas)", () => {
    assert.equal(MARKET_PUBLIC, false);
    assert.equal(canSeeMarket("admin"), true);
    for (const role of ["user", null, undefined, "staff", "creator"]) assert.equal(canSeeMarket(role), false, String(role));
  });
  test("le pagine /market passano dal proxy, che rinnova la sessione", () => {
    const proxy = fs.readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
    assert.match(proxy, /"\/:locale\(en\|it\|es\|fr\)\/market"/);
    assert.match(proxy, /"\/:locale\(en\|it\|es\|fr\)\/market\/:path\*"/);
  });
  test("pagina riservata e lucchetto nelle quattro lingue", () => {
    for (const l of Object.values(marketLabels)) assert.ok(l.locked.text.length > 40 && l.locked.kicker && l.locked.back);
  });
});

describe("giro avviato da Vercel su GitHub (18/10/2026)", () => {
  test("richiesta di workflow_dispatch per market-collect.yml su main, con il token", () => {
    const { url, init } = workflowDispatchRequest("tok123");
    assert.equal(url, "https://api.github.com/repos/ultimacenere/originsmeta/actions/workflows/market-collect.yml/dispatches");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.authorization, "Bearer tok123");
    assert.deepEqual(JSON.parse(init.body), { ref: "main" });
  });
  test("il file del lavoro esiste, il cron di Vercel chiama la rotta, GitHub tiene la riserva oraria", () => {
    const wf = fs.readFileSync(new URL("../../../.github/workflows/market-collect.yml", import.meta.url), "utf8");
    assert.match(wf, /workflow_dispatch:/);
    assert.ok(wf.includes('cron: "17 * * * *"'), "riserva oraria di GitHub");
    const vercel = JSON.parse(fs.readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8"));
    assert.ok(vercel.crons.some((c: { path: string; schedule: string }) => c.path === "/api/cron/market-dispatch" && c.schedule === "*/10 * * * *"));
    assert.ok(!vercel.crons.some((c: { path: string }) => c.path === "/api/cron/market"), "il giro su Vercel riceve 429 da Steam: non va nel cron");
  });
});
