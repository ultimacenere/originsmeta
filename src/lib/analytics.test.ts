/**
 * Test della misura del sito (`analytics.ts`) con il runner integrato di Node: `node --test src/lib/analytics.test.ts`.
 *
 * Prima le parti pure (catalogo degli eventi, parametri, link verso Steam e Discord, attributi data-om-*, cookie,
 * indirizzi, segnale di accesso, termine cercato); poi l'invio, con un browser finto e minimo (window = globalThis,
 * location, history, localStorage, document.cookie) e `window.va`, la coda in cui `track()` di @vercel/analytics mette
 * gli eventi: consenso, coda di GA4, flag dello staff, ritiro del consenso, ricerca con l'attesa di 1,5 secondi.
 *
 * analytics.ts importa `./consent` e `./discord` senza estensione, come vuole Next: prima di caricarlo il test registra
 * un piccolo hook di risoluzione dei moduli di Node (`module.registerHooks`, come in cardTitles.test.ts) che aggiunge
 * `.ts` agli import relativi senza estensione.
 */
import * as nodeModule from "node:module";
import { before, describe, mock, test } from "node:test";
import assert from "node:assert/strict";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
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

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const A: typeof import("./analytics") = await import("./analytics.ts");

describe("catalogo degli eventi", () => {
  test("a Vercel al massimo due proprietà per evento (limite del piano Pro), tutte fra i parametri dell'evento", () => {
    for (const [name, props] of Object.entries(A.VERCEL_PROPS)) {
      assert.ok(props.length >= 1 && props.length <= 2, `${name}: ${props.length} proprietà`);
      assert.match(name, /^[a-z][a-z0-9_]{0,39}$/, `nome in snake_case entro 40 caratteri: ${name}`);
    }
    assert.ok(A.isEventName("sign_up"));
    assert.ok(!A.isEventName("toString"), "niente nomi ereditati dagli oggetti");
    assert.ok(!A.isEventName("purchase"));
  });
  test("vercelProps: solo le proprietà dell'elenco, nell'ordine, se ci sono", () => {
    assert.deepEqual(A.vercelProps("steam_click", { target: "demo", placement: "header", cta: "button", lang: "it" }), { target: "demo", placement: "header" });
    assert.deepEqual(A.vercelProps("login_error", { kind: "expired" }), { kind: "expired" });
  });
  test("cleanParams: nomi snake_case, stringhe non vuote tagliate a 100, numeri finiti e booleani", () => {
    assert.deepEqual(A.cleanParams({ ok: " sì ", vuoto: "  ", Bad: "x", "con-trattino": "x", n: 3, inf: Infinity, b: false, obj: { a: 1 }, u: undefined, lungo: "x".repeat(150) }), {
      ok: "sì",
      n: 3,
      b: false,
      lungo: "x".repeat(100),
    });
  });
  test("langOf e legendaryParam", () => {
    assert.equal(A.langOf("/it/decks/community/x"), "it");
    assert.equal(A.langOf("/es"), "es");
    assert.equal(A.langOf("/fr/cards"), "");
    assert.equal(A.langOf("/"), "");
    assert.equal(A.legendaryParam("merlin"), "merlin");
    assert.equal(A.legendaryParam("custom:il-mio-nome"), "custom", "il nome di una carta inserita a mano lo scrive l'utente");
    assert.equal(A.legendaryParam(null), "none");
  });
});

describe("link verso Steam e Discord", () => {
  test("Steam: gioco, demo, news, Next Fest, community, altro", () => {
    const target = (href: string) => {
      const ev = A.linkEvent(href, "content", "link");
      assert.equal(ev?.name, "steam_click", href);
      return ev?.name === "steam_click" ? ev.params.target : "";
    };
    assert.equal(target("https://store.steampowered.com/app/4429430/Origins_TCG/"), "store");
    assert.equal(target("https://store.steampowered.com/app/4756630/Origins_TCG_Demo/"), "demo");
    assert.equal(target("https://store.steampowered.com/news/app/4429430/view/1844115010502611"), "news");
    assert.equal(target("https://store.steampowered.com/sale/nextfest"), "next_fest");
    assert.equal(target("https://steamcommunity.com/app/4429430"), "community");
    assert.equal(target("https://store.steampowered.com/"), "other");
  });
  test("Discord: il nostro server distinto da quello ufficiale, niente webhook", () => {
    const server = (href: string) => {
      const ev = A.linkEvent(href, "header", "icon");
      assert.equal(ev?.name, "discord_click", href);
      return ev?.name === "discord_click" ? ev.params : null;
    };
    assert.deepEqual(server("https://discord.gg/RAG7nnrNGP"), { server: "originsmeta", placement: "header", cta: "icon" });
    assert.equal(server("https://discord.com/invite/RAG7nnrNGP")?.server, "originsmeta");
    assert.equal(server("https://discord.gg/originstcg")?.server, "official");
    assert.equal(server("https://discord.com/channels/123/456")?.server, "official");
    assert.equal(server("https://discord.gg/rag7nnrngp")?.server, "official", "i codici d'invito distinguono le maiuscole");
    assert.equal(A.linkEvent("https://discord.com/api/webhooks/1/abc", "content", "link"), null);
  });
  test("gli altri link non sono eventi (anche quelli che somigliano)", () => {
    for (const href of ["https://originsmeta.com/it/cards", "https://notsteampowered.com/app/1", "https://steampowered.com.evil.example/", "mailto:staff@originsmeta.com", "/it/decks", "non è un indirizzo"]) {
      assert.equal(A.linkEvent(href, "content", "link"), null, href);
    }
  });
});

describe("attributi data-om-*", () => {
  test("il nome da data-om-event, i parametri dagli altri data-om-* in snake_case", () => {
    assert.deepEqual(A.datasetEvent({ omEvent: "game_code_copy", omPlacement: "deck_page" }), { name: "game_code_copy", params: { placement: "deck_page" } });
    assert.deepEqual(A.datasetEvent({ omEvent: "home_route", omDestination: "tier_list", omCta: "button", other: "x" }), { name: "home_route", params: { destination: "tier_list" } });
    assert.equal(A.datasetEvent({ omEvent: "evento_inventato" }), null, "solo i nomi del catalogo");
    assert.equal(A.datasetEvent({ omPlacement: "x" }), null);
    assert.equal(A.datasetKeyToParam("omSearchArea"), "search_area");
    assert.equal(A.datasetKeyToParam("omx"), null);
    assert.equal(A.datasetKeyToParam("placement"), null);
  });
});

describe("cookie di Google Analytics", () => {
  test("gaCookieNames: _ga, _ga_<ID>, _gid, _gat…, e nient'altro", () => {
    assert.deepEqual(A.gaCookieNames("_ga=GA1.1.1; sb-abc-auth-token=x; _ga_9J5Q803XJS=GS1; _gid=1; _gat_UA=1; _gallery=no; _gcl_au=1; _ga=dup"), ["_ga", "_ga_9J5Q803XJS", "_gid", "_gat_UA", "_gcl_au"]);
    assert.deepEqual(A.gaCookieNames(""), []);
  });
  test("cookieDomains: il solo host e i domini sopra; niente per localhost e indirizzi IP", () => {
    assert.deepEqual(A.cookieDomains("originsmeta.com"), ["", "originsmeta.com"]);
    assert.deepEqual(A.cookieDomains("www.originsmeta.com"), ["", "www.originsmeta.com", "originsmeta.com"]);
    assert.deepEqual(A.cookieDomains("localhost"), [""]);
    assert.deepEqual(A.cookieDomains("127.0.0.1"), [""]);
    assert.equal(A.expiredCookie("_ga", "originsmeta.com"), "_ga=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=originsmeta.com");
    assert.equal(A.expiredCookie("_ga", ""), "_ga=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/");
  });
});

describe("indirizzi", () => {
  test("withoutParams toglie solo i parametri indicati e lascia gli altri come sono scritti", () => {
    assert.equal(A.withoutParams("?deck=OM1a+b/c%3D&staff=on&x=1", ["staff"]), "?deck=OM1a+b/c%3D&x=1");
    assert.equal(A.withoutParams("?staff=on", ["staff"]), "");
    assert.equal(A.withoutParams("", ["staff"]), "");
    assert.equal(A.withoutParams("?om%5Fauth=login&a", ["om_auth"]), "?a", "anche con la chiave codificata");
  });
  test("stripTrackingParams: via staff, om_auth e om_method; il resto e il frammento restano", () => {
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it/account?om_auth=sign_up&om_method=email&tab=2#private"), "https://originsmeta.com/it/account?tab=2#private");
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it?staff=on"), "https://originsmeta.com/it");
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it/cards?q=merlin"), "https://originsmeta.com/it/cards?q=merlin");
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it/tier-list/create#TL1?staff=on"), "https://originsmeta.com/it/tier-list/create#TL1?staff=on", "un ? nel frammento non è una query");
  });
  test("staffSwitch", () => {
    assert.equal(A.staffSwitch("?staff=on"), true);
    assert.equal(A.staffSwitch("?staff=1"), true);
    assert.equal(A.staffSwitch("?x=1&staff=OFF"), false);
    assert.equal(A.staffSwitch("?staff=forse"), null);
    assert.equal(A.staffSwitch(""), null);
  });
});

describe("accesso e iscrizione", () => {
  test("withAuthSignal: il segnale nella query, prima del frammento", () => {
    assert.equal(A.withAuthSignal("/it/account", "sign_up", "discord"), "/it/account?om_auth=sign_up&om_method=discord");
    assert.equal(A.withAuthSignal("/it/deck-builder?intent=save&deck=OM1x", "login", "email"), "/it/deck-builder?intent=save&deck=OM1x&om_auth=login&om_method=email");
    assert.equal(A.withAuthSignal("/it/tier-list/create#TL1abc", "login", "discord"), "/it/tier-list/create?om_auth=login&om_method=discord#TL1abc");
    assert.equal(A.withAuthSignal("/it/decks/publish?", "login", "email"), "/it/decks/publish?om_auth=login&om_method=email");
    assert.deepEqual(A.readAuthSignal("?x=1&om_auth=sign_up&om_method=email"), { event: "sign_up", method: "email" });
    assert.equal(A.readAuthSignal("?om_auth=purchase&om_method=email"), null);
    assert.equal(A.readAuthSignal("?om_auth=login"), null);
  });
  test("isNewAccount: conferma negli ultimi 10 minuti o creazione nell'ultima ora", () => {
    const now = Date.parse("2026-09-25T12:00:00Z");
    const ago = (min: number) => new Date(now - min * 60_000).toISOString();
    // primo accesso con Discord: creato e confermato adesso
    assert.equal(A.isNewAccount({ created_at: ago(0), confirmed_at: ago(0) }, now), true);
    // link via email chiesto 20 minuti fa e aperto adesso
    assert.equal(A.isNewAccount({ created_at: ago(20), email_confirmed_at: ago(0) }, now), true);
    // account creato giorni fa e mai completato: il primo link aperto è l'iscrizione
    assert.equal(A.isNewAccount({ created_at: ago(3 * 24 * 60), confirmed_at: ago(1) }, now), true);
    // Supabase che conferma alla creazione: vale la creazione entro l'ora del link
    assert.equal(A.isNewAccount({ created_at: ago(45), confirmed_at: ago(45) }, now), true);
    // chi torna
    assert.equal(A.isNewAccount({ created_at: ago(10 * 24 * 60), confirmed_at: ago(10 * 24 * 60) }, now), false);
    assert.equal(A.isNewAccount({ created_at: ago(90) }, now), false);
    assert.equal(A.isNewAccount(null, now), false);
    assert.equal(A.isNewAccount({ created_at: "non è una data" }, now), false);
  });
});

describe("termine cercato", () => {
  test("minuscolo e compatto; via email, link, numeri lunghi e testi da codice", () => {
    assert.equal(A.searchTermForAnalytics("  Merlin   Reveal "), "merlin reveal");
    assert.equal(A.searchTermForAnalytics("m"), null, "una lettera sola non è una ricerca");
    assert.equal(A.searchTermForAnalytics("mario.rossi@example.com"), null);
    assert.equal(A.searchTermForAnalytics("https://originsmeta.com"), null);
    assert.equal(A.searchTermForAnalytics("+39 333 123 4567"), null);
    assert.equal(A.searchTermForAnalytics("KGBLDC".padEnd(80, "A")), null);
    assert.equal(A.searchTermForAnalytics("x".repeat(50)), "x".repeat(40));
    assert.equal(A.searchTermForAnalytics("0.6.3"), "0.6.3", "un numero di patch passa");
  });
});

describe("sul server", () => {
  test("senza window non parte niente e niente si rompe", () => {
    assert.equal(typeof (globalThis as { window?: unknown }).window, "undefined");
    A.trackEvent("sign_up", { method: "email" });
    A.trackNamedEvent("tier_entry_open", { tier_source: "community", card: "merlin" });
    A.trackSearch("cards", "merlin", 1);
    A.consumeAuthSignal();
    A.applyStaffSwitch();
    assert.equal(A.isInternalTraffic(), false);
    assert.equal(A.stopGoogleAnalytics("G-TEST"), false);
  });
});

/* ---------- browser finto ---------- */

const store = new Map<string, string>();
const vaCalls: unknown[][] = [];
const cookieWrites: string[] = [];
let cookieJar = "";
const loc = { href: "", pathname: "", search: "", hash: "", hostname: "" };
const go = (href: string) => {
  const u = new URL(href, loc.href || undefined);
  Object.assign(loc, { href: u.href, pathname: u.pathname, search: u.search, hash: u.hash, hostname: u.hostname });
};
const g = globalThis as unknown as Record<string, unknown>;
/** Gli eventi che Vercel ha ricevuto (nome e proprietà), dalla coda `window.va`. */
const vercelEvents = () => vaCalls.filter((c) => c[0] === "event").map((c) => c[1] as { name: string; data?: Record<string, unknown> });
/** I comandi arrivati a gtag, come array (dataLayer contiene oggetti `arguments`). */
const gaCommands = () => ((g.dataLayer as ArrayLike<unknown>[] | undefined) ?? []).map((a) => Array.from(a));
const gaEvents = () => gaCommands().filter((c) => c[0] === "event");
const setConsent = (v: "all" | "necessary" | null) => (v ? store.set("originsmeta.consent.v1", v) : store.delete("originsmeta.consent.v1"));

describe("nel browser", () => {
  before(() => {
    const define = (key: string, value: unknown) => Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    define("window", globalThis);
    define("location", loc);
    define("history", { replaceState: (_s: unknown, _t: string, url: string) => go(url) });
    define("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    });
    define("document", {
      get cookie() {
        return cookieJar;
      },
      set cookie(v: string) {
        cookieWrites.push(v);
      },
    });
    define("va", (...args: unknown[]) => void vaCalls.push(args));
    mock.method(console, "info", () => {});
    go("https://originsmeta.com/it/deck-builder");
  });

  test("senza consenso: l'evento va a Vercel con al massimo due proprietà, a GA4 no", () => {
    setConsent("necessary");
    A.trackEvent("steam_click", { target: "demo", placement: "content", cta: "button" });
    assert.deepEqual(vercelEvents().at(-1), { name: "steam_click", data: { target: "demo", placement: "content" }, options: undefined });
    assert.equal(g.gtag, undefined);
    assert.deepEqual(gaCommands(), []);
  });

  test("prima che <Analytics> di Vercel sia montato l'evento aspetta nella coda window.vaq, come fa inject()", () => {
    const spy = g.va;
    delete g.va;
    try {
      A.trackEvent("login", { method: "email" });
      assert.deepEqual(g.vaq, [["event", { name: "login", data: { method: "email" }, options: undefined }]]);
      assert.equal(typeof g.va, "function");
    } finally {
      g.va = spy;
      delete g.vaq;
    }
  });

  test("con il consenso: GA4 riceve anche lang; prima dell'avvio l'evento aspetta, poi parte dopo config", () => {
    setConsent("all");
    A.trackEvent("deck_vote", { stars: 4, vote_type: "new" });
    assert.deepEqual(vercelEvents().at(-1), { name: "deck_vote", data: { stars: 4, vote_type: "new" }, options: undefined });
    assert.deepEqual(gaCommands(), [], "GA4 non ancora avviato: l'evento è in coda");
    A.startGoogleAnalytics("G-TEST");
    A.startGoogleAnalytics("G-TEST");
    const cmds = gaCommands();
    assert.deepEqual(
      cmds.map((c) => c[0]),
      ["consent", "js", "config", "event"],
      "una volta sola, e l'evento in coda dopo config",
    );
    assert.deepEqual(cmds[0], ["consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" }]);
    assert.deepEqual(cmds[2], ["config", "G-TEST"], "niente anonymize_ip, che in GA4 non fa niente");
    assert.deepEqual(cmds[3], ["event", "deck_vote", { stars: 4, vote_type: "new", lang: "it" }]);
    assert.equal(g["ga-disable-G-TEST"], false);
    A.trackNamedEvent("tier_entry_open", { tier_source: "community", card: "merlin" });
    A.trackNamedEvent("evento_inventato", { a: 1 });
    assert.deepEqual(gaEvents().at(-1), ["event", "tier_entry_open", { tier_source: "community", card: "merlin", lang: "it" }]);
    assert.equal(vercelEvents().at(-1)?.name, "tier_entry_open");
  });

  test("ricerca: un evento quando si smette di scrivere; il termine arrivato con ?q= va solo a Vercel", () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const before = vercelEvents().length;
      A.trackSearch("deck_builder", "m", 120);
      A.trackSearch("deck_builder", "mer", 10);
      A.trackSearch("deck_builder", "Merlin", 1);
      mock.timers.tick(A.SEARCH_DELAY_MS - 1);
      assert.equal(vercelEvents().length, before, "ancora nessun evento");
      mock.timers.tick(1);
      assert.deepEqual(vercelEvents().at(-1), { name: "view_search_results", data: { search_term: "merlin", results: 1 }, options: undefined });
      assert.deepEqual(gaEvents().at(-1), ["event", "view_search_results", { search_term: "merlin", results: 1, search_area: "deck_builder", lang: "it" }]);
      // lo stesso termine di nuovo (un filtro cambiato): nessun doppione
      A.trackSearch("deck_builder", "merlin ", 3);
      mock.timers.tick(A.SEARCH_DELAY_MS);
      assert.equal(vercelEvents().length, before + 1);

      go("https://originsmeta.com/it/cards?q=Dracula");
      const gaBefore = gaEvents().length;
      A.trackSearch("cards", "Dracula", 1);
      mock.timers.tick(A.SEARCH_DELAY_MS);
      assert.equal(vercelEvents().at(-1)?.data?.search_term, "dracula");
      assert.equal(gaEvents().length, gaBefore, "la ricerca dell'header la conta già la misurazione avanzata di GA4");
      A.trackSearch("cards", "dracula bite", 0);
      mock.timers.tick(A.SEARCH_DELAY_MS);
      assert.deepEqual(gaEvents().at(-1), ["event", "view_search_results", { search_term: "dracula bite", results: 0, search_area: "cards", lang: "it" }]);
    } finally {
      mock.timers.reset();
      go("https://originsmeta.com/it/deck-builder");
    }
  });

  test("arrivo dopo l'accesso: sign_up una volta, e il segnale sparisce dall'indirizzo", () => {
    go("https://originsmeta.com/es/deck-builder?intent=save&om_auth=sign_up&om_method=discord#OM1x");
    A.consumeAuthSignal();
    assert.deepEqual(vercelEvents().at(-1), { name: "sign_up", data: { method: "discord" }, options: undefined });
    assert.deepEqual(gaEvents().at(-1), ["event", "sign_up", { method: "discord", lang: "es" }]);
    assert.equal(loc.search, "?intent=save");
    assert.equal(loc.hash, "#OM1x");
    const n = vercelEvents().length;
    A.consumeAuthSignal();
    assert.equal(vercelEvents().length, n, "un ricaricamento non lo ripete");
    go("https://originsmeta.com/it/account?om_auth=hack&om_method=email");
    A.consumeAuthSignal();
    assert.equal(vercelEvents().length, n, "un segnale non valido si toglie senza eventi");
    assert.equal(loc.search, "");
  });

  test("traffico interno: ?staff=on spegne GA4 e Vercel (anche le pagine viste), ?staff=off li riaccende", () => {
    go("https://originsmeta.com/it?staff=on&x=1");
    assert.equal(A.isInternalTraffic(), true, "vale già dall'indirizzo, prima che il flag sia salvato");
    A.applyStaffSwitch();
    assert.equal(store.get(A.INTERNAL_KEY), "1");
    assert.equal(loc.search, "?x=1");
    assert.equal(A.isInternalTraffic(), true);
    assert.equal(A.gaAllowed(), false);
    const v = vercelEvents().length;
    const ga = gaEvents().length;
    A.trackEvent("deck_publish", { legendary: "merlin", source: "builder" });
    assert.equal(vercelEvents().length, v);
    assert.equal(gaEvents().length, ga);
    assert.equal(A.vercelBeforeSend({ type: "pageview", url: "https://originsmeta.com/it" }), null);

    go("https://originsmeta.com/it?staff=off");
    A.applyStaffSwitch();
    assert.equal(store.has(A.INTERNAL_KEY), false);
    assert.equal(A.isInternalTraffic(), false);
    assert.deepEqual(A.vercelBeforeSend({ type: "pageview", url: "https://originsmeta.com/it/account?om_auth=login&om_method=email" }), { type: "pageview", url: "https://originsmeta.com/it/account" });
  });

  test("consenso ritirato: consenso negato, GA4 spento, cookie _ga cancellati su ogni dominio; poi solo Vercel", () => {
    go("https://www.originsmeta.com/it");
    cookieJar = "_ga=GA1.1.1; sb-x-auth-token=segreto; _ga_9J5Q803XJS=GS1.1";
    cookieWrites.length = 0;
    setConsent("necessary");
    assert.equal(A.stopGoogleAnalytics("G-TEST"), true, "GA4 girava: il componente ricarica la pagina");
    assert.deepEqual(gaCommands().at(-1), ["consent", "update", { analytics_storage: "denied" }]);
    assert.equal(g["ga-disable-G-TEST"], true);
    for (const name of ["_ga", "_ga_9J5Q803XJS"]) {
      for (const domain of ["", "www.originsmeta.com", "originsmeta.com"]) assert.ok(cookieWrites.includes(A.expiredCookie(name, domain)), `${name} su "${domain}"`);
    }
    assert.ok(!cookieWrites.some((w) => w.startsWith("sb-")), "il cookie della sessione non si tocca");
    const ga = gaEvents().length;
    A.trackEvent("game_code_copy", { placement: "deck_page" });
    assert.equal(gaEvents().length, ga);
    assert.deepEqual(vercelEvents().at(-1), { name: "game_code_copy", data: { placement: "deck_page" }, options: undefined });
  });
});
