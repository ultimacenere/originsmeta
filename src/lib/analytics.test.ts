/**
 * Test della misura del sito (`analytics.ts`) con il runner integrato di Node: `node --test src/lib/analytics.test.ts`.
 *
 * Prima le parti pure (catalogo degli eventi, parametri, link verso Steam e Discord, home, posto del link, attributi
 * data-om-*, cookie, moduli compilati, indirizzi, segnale di accesso, termine cercato); poi l'invio, con un browser
 * finto e minimo (window = globalThis, location, history, localStorage, document.cookie, pochi elementi finti per i
 * clic) e `window.va`, la coda in cui `track()` di @vercel/analytics mette gli eventi: consenso, coda di GA4, codice
 * dello staff, ritiro del consenso, accesso, ricerca con l'attesa di 1,5 secondi, clic.
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
      assert.ok(props.length <= 2, `${name}: ${props.length} proprietà`);
      assert.match(name, /^[a-z][a-z0-9_]{0,39}$/, `nome in snake_case entro 40 caratteri: ${name}`);
    }
    assert.ok(A.isEventName("sign_up"));
    assert.ok(A.isEventName("tournament_create"));
    assert.ok(!A.isEventName("toString"), "niente nomi ereditati dagli oggetti");
    assert.ok(!A.isEventName("purchase"));
  });
  test("vercelProps: solo le proprietà dell'elenco, nell'ordine, se ci sono", () => {
    assert.deepEqual(A.vercelProps("steam_click", { target: "demo", placement: "header", cta: "button", lang: "it" }), { target: "demo", placement: "header" });
    assert.deepEqual(A.vercelProps("login_error", { kind: "expired" }), { kind: "expired" });
    assert.deepEqual(A.vercelProps("feedback_submit", { lang: "it" }), {}, "evento senza proprietà");
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
  test("Steam: gioco, demo, news (anche l'archivio della community), Next Fest, community, altro", () => {
    const target = (href: string) => {
      const ev = A.linkEvent(href, "content", "link");
      assert.equal(ev?.name, "steam_click", href);
      return ev?.name === "steam_click" ? ev.params.target : "";
    };
    assert.equal(target("https://store.steampowered.com/app/4429430/Origins_TCG/"), "store");
    assert.equal(target("https://store.steampowered.com/app/4756630/Origins_TCG_Demo/"), "demo");
    assert.equal(target("https://store.steampowered.com/news/app/4429430/view/1844115010502611"), "news");
    assert.equal(target("https://steamcommunity.com/app/4429430/allnews/"), "news", "officialLinks.news del footer");
    assert.equal(target("https://store.steampowered.com/sale/nextfest"), "next_fest");
    assert.equal(target("https://steamcommunity.com/app/4429430"), "community");
    assert.equal(target("https://store.steampowered.com/"), "other");
  });
  test("Discord: il nostro server, quello ufficiale e tutti gli altri; niente webhook", () => {
    const server = (href: string) => {
      const ev = A.linkEvent(href, "header", "icon");
      assert.equal(ev?.name, "discord_click", href);
      return ev?.name === "discord_click" ? ev.params : null;
    };
    assert.deepEqual(server("https://discord.gg/RAG7nnrNGP"), { server: "originsmeta", placement: "header", cta: "icon" });
    assert.equal(server("https://discord.com/invite/RAG7nnrNGP")?.server, "originsmeta");
    assert.equal(server("https://discord.gg/originstcg")?.server, "official");
    assert.equal(server("https://discord.gg/OriginsTCG/")?.server, "official", "l'indirizzo personalizzato non distingue le maiuscole");
    assert.equal(server("https://discord.com/invite/originstcg")?.server, "official");
    assert.equal(server("https://discord.gg/xyz123")?.server, "other", "il Discord di un torneo o di un creator");
    assert.equal(server("https://discord.com/channels/123/456")?.server, "other");
    assert.equal(server("https://discord.gg/rag7nnrngp")?.server, "other", "gli inviti a caso distinguono le maiuscole");
    assert.equal(A.linkEvent("https://discord.com/api/webhooks/1/abc", "content", "link"), null);
  });
  test("gli altri link non sono eventi (anche quelli che somigliano)", () => {
    for (const href of ["https://originsmeta.com/it/cards", "https://notsteampowered.com/app/1", "https://steampowered.com.evil.example/", "mailto:staff@originsmeta.com", "/it/decks", "non è un indirizzo"]) {
      assert.equal(A.linkEvent(href, "content", "link"), null, href);
    }
  });
});

describe("home (HOME-12)", () => {
  const origin = "https://originsmeta.com";
  test("isHomePath: solo /en, /it, /es", () => {
    for (const p of ["/it", "/en/", "/es"]) assert.ok(A.isHomePath(p), p);
    for (const p of ["/", "/it/cards", "/fr", "/itx"]) assert.ok(!A.isHomePath(p), p);
  });
  test("homeDestination: la sezione del sito, o dove porta un link in uscita", () => {
    const cases: [string, string | null][] = [
      ["/it/tier-list", "tier_list"],
      ["/it/tier-list#decks", "tier_list"],
      ["/en/tier-list/create", "tier_list_maker"],
      ["/es/tier-list/most-played#merlin", "tier_list_most_played"],
      ["/it/tier-list/community", "tier_list_community"],
      ["/it/decks", "decks"],
      ["/it/decks/community/healing-healsing-9411", "deck_page"],
      ["/it/decks/publish", "deck_publish"],
      ["/it/deck-builder", "builder"],
      ["/it/cards", "cards"],
      ["/en/cards/merlin", "card_page"],
      ["/it/news", "news"],
      ["/it/news/patch-0-6-3", "news_article"],
      ["/es/guides/is-origins-tcg-pay-to-win", "guide"],
      ["/it/metashifting", "metashifting"],
      ["/it/tournaments", "tournaments"],
      ["/t/OM-7KQ2", "tournaments"],
      ["https://originsmeta.com/it/deck-builder", "builder"],
      ["https://store.steampowered.com/app/4756630/", "steam"],
      ["https://discord.gg/RAG7nnrNGP", "discord"],
      ["https://www.youtube.com/watch?v=x", "youtube"],
      ["https://example.com/", "external"],
      ["/it", null],
      ["/it#main", null],
      ["mailto:staff@originsmeta.com", null],
    ];
    for (const [href, dest] of cases) assert.equal(A.homeDestination(href, origin), dest, href);
  });
});

/* ---------- elementi finti per placementOf e onDocumentClick ---------- */

/** Un elemento del DOM ridotto all'osso: tag, attributi, genitore, e i selettori semplici che usa analytics.ts. */
class FakeEl {
  // campi scritti per esteso: Node toglie i tipi ma non traduce le "parameter properties" di TypeScript
  readonly tagName: string;
  readonly attrs: Record<string, string>;
  readonly parent: FakeEl | null;
  constructor(tagName: string, attrs: Record<string, string> = {}, parent: FakeEl | null = null) {
    this.tagName = tagName;
    this.attrs = attrs;
    this.parent = parent;
  }
  private matchesOne(sel: string): boolean {
    const s = sel.trim();
    const tag = this.tagName.toLowerCase();
    if (s === "a[href]") return tag === "a" && "href" in this.attrs;
    if (s.startsWith("body > ")) return tag === s.slice(7) && this.parent?.tagName.toLowerCase() === "body";
    if (s.startsWith(".")) return (this.attrs.class ?? "").split(/\s+/).includes(s.slice(1));
    const attr = s.match(/^\[([a-z-]+)(?:="([^"]*)")?\]$/);
    if (attr) return attr[2] === undefined ? attr[1] in this.attrs : this.attrs[attr[1]] === attr[2];
    return tag === s;
  }
  matches(sel: string): boolean {
    return sel.split(",").some((s) => this.matchesOne(s));
  }
  closest(sel: string): FakeEl | null {
    return this.matches(sel) ? this : (this.parent?.closest(sel) ?? null);
  }
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
  get dataset(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(this.attrs)) {
      if (k.startsWith("data-")) out[k.slice(5).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
    }
    return out;
  }
}
class FakeAnchor extends FakeEl {
  get href(): string {
    return new URL(this.attrs.href, (globalThis as unknown as { location: { href: string } }).location.href).href;
  }
}
/** Albero minimo: body con header, main, footer, lo slider della home e la striscia del calendario. */
const body = new FakeEl("body");
const tree = {
  header: new FakeEl("header", {}, body),
  main: new FakeEl("main", { id: "main" }, body),
  footer: new FakeEl("footer", {}, body),
  slider: new FakeEl("section", { "aria-roledescription": "carousel" }, body),
  ticker: new FakeEl("div", { class: "ticker" }, body),
  banner: new FakeEl("div", { role: "dialog" }, body),
};

describe("posto del link (placementOf)", () => {
  test("data-om-placement vince; poi header, footer, main, slider, calendario, altro", () => {
    const moves = new FakeEl("section", { "data-om-placement": "home_moves" }, tree.main);
    assert.equal(A.placementOf(new FakeAnchor("a", { href: "/it/decks" }, moves)), "home_moves");
    assert.equal(A.placementOf(new FakeAnchor("a", { href: "/it" }, tree.header)), "header");
    assert.equal(A.placementOf(new FakeAnchor("a", { href: "/it" }, tree.footer)), "footer");
    assert.equal(A.placementOf(new FakeAnchor("a", { href: "/it" }, new FakeEl("div", {}, tree.main))), "content");
    assert.equal(A.placementOf(new FakeAnchor("a", { href: "https://store.steampowered.com/app/4756630/" }, new FakeEl("div", {}, tree.slider))), "slider");
    assert.equal(A.placementOf(new FakeAnchor("a", { href: "/it/tournaments" }, tree.ticker)), "calendar");
    assert.equal(A.placementOf(new FakeAnchor("a", { href: "/it/privacy" }, tree.banner)), "other");
  });
});

describe("attributi data-om-*", () => {
  test("il nome da data-om-event, i parametri dagli altri data-om-* in snake_case", () => {
    assert.deepEqual(A.datasetEvent({ omEvent: "game_code_copy", omPlacement: "deck_page" }), { name: "game_code_copy", params: { placement: "deck_page" } });
    assert.deepEqual(A.datasetEvent({ omEvent: "deck_original_open", omGuideLang: "it", omCta: "button", other: "x" }), { name: "deck_original_open", params: { guide_lang: "it" } });
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
  test("storageAffectsGa: consenso, flag dello staff e storage svuotato; il resto no", () => {
    assert.ok(A.storageAffectsGa("originsmeta.consent.v1"));
    assert.ok(A.storageAffectsGa(A.INTERNAL_KEY));
    assert.ok(A.storageAffectsGa(null));
    assert.ok(!A.storageAffectsGa("originsmeta.builder.v1"));
  });
});

describe("moduli compilati (ricaricamento rimandato)", () => {
  test("aree di testo, contenuti modificabili, campi e tendine dentro un <form>; niente ricerche né filtri", () => {
    const form = {};
    assert.ok(A.isUnsavedInputTarget({ tagName: "TEXTAREA" }));
    assert.ok(!A.isUnsavedInputTarget({ tagName: "TEXTAREA", readOnly: true }), "il campo in sola lettura del pannello Condividi");
    assert.ok(A.isUnsavedInputTarget({ tagName: "DIV", isContentEditable: true }));
    assert.ok(A.isUnsavedInputTarget({ tagName: "INPUT", type: "text", form }));
    assert.ok(A.isUnsavedInputTarget({ tagName: "INPUT", type: "datetime-local", form }), "data del torneo");
    assert.ok(A.isUnsavedInputTarget({ tagName: "SELECT", type: "select-one", form }));
    assert.ok(!A.isUnsavedInputTarget({ tagName: "INPUT", type: "search", form }), "la ricerca dell'header");
    assert.ok(!A.isUnsavedInputTarget({ tagName: "INPUT", type: "text", form: null }), "un filtro fuori da un modulo");
    assert.ok(!A.isUnsavedInputTarget({ tagName: "INPUT", type: "hidden", form }));
    assert.ok(!A.isUnsavedInputTarget({ tagName: "BUTTON", form }));
    assert.ok(!A.isUnsavedInputTarget(null));
  });
});

describe("indirizzi", () => {
  test("withoutParams toglie solo i parametri indicati e lascia gli altri come sono scritti", () => {
    assert.equal(A.withoutParams("?deck=OM1a+b/c%3D&staff=on&x=1", ["staff"]), "?deck=OM1a+b/c%3D&x=1");
    assert.equal(A.withoutParams("?staff=on", ["staff"]), "");
    assert.equal(A.withoutParams("", ["staff"]), "");
    assert.equal(A.withoutParams("?om%5Fauth=login&a", ["om_auth"]), "?a", "anche con la chiave codificata");
  });
  test("stripTrackingParams: via staff, om_auth e om_method; il resto (UTM compresi) e il frammento restano", () => {
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it/account?om_auth=sign_up&om_method=email&tab=2#private"), "https://originsmeta.com/it/account?tab=2#private");
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it?staff=abcd-efgh"), "https://originsmeta.com/it", "il codice dello staff non arriva a Vercel");
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it/cards?q=merlin&utm_source=discord"), "https://originsmeta.com/it/cards?q=merlin&utm_source=discord");
    assert.equal(A.stripTrackingParams("https://originsmeta.com/it/tier-list/create#TL1?staff=on"), "https://originsmeta.com/it/tier-list/create#TL1?staff=on", "un ? nel frammento non è una query");
  });
  test("staffParam: off (o 0) spegne, ogni altro valore è un codice da verificare", () => {
    assert.deepEqual(A.staffParam("?staff=off"), { off: true });
    assert.deepEqual(A.staffParam("?x=1&staff=OFF"), { off: true });
    assert.deepEqual(A.staffParam("?staff=0"), { off: true });
    assert.deepEqual(A.staffParam("?staff=on"), { token: "on" });
    assert.deepEqual(A.staffParam("?staff=%20abcd-efgh%20"), { token: "abcd-efgh" });
    assert.equal(A.staffParam("?staff="), null);
    assert.equal(A.staffParam(""), null);
  });
  test("l'impronta del codice dello staff è uno SHA-256 e sha256Hex la calcola come Node", async () => {
    assert.match(A.STAFF_TOKEN_SHA256, /^[0-9a-f]{64}$/);
    assert.equal(await A.sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    assert.notEqual(await A.sha256Hex("on"), A.STAFF_TOKEN_SHA256, "?staff=on non accende più il flag");
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
  test("isNewAccount: conferma appena avvenuta; creazione recente solo quando conta davvero", () => {
    const now = Date.parse("2026-09-25T12:00:00Z");
    const ago = (min: number) => new Date(now - min * 60_000).toISOString();
    // primo accesso con Discord: creato e confermato adesso
    assert.equal(A.isNewAccount({ created_at: ago(0), confirmed_at: ago(0) }, "discord", now), true);
    // Discord di nuovo 20 minuti dopo (un altro dispositivo): è un login
    assert.equal(A.isNewAccount({ created_at: ago(20), confirmed_at: ago(20) }, "discord", now), false);
    // link via email chiesto 20 minuti fa e aperto adesso
    assert.equal(A.isNewAccount({ created_at: ago(20), email_confirmed_at: ago(0) }, "email", now), true);
    // secondo link via email nella stessa ora, con le conferme accese: la conferma è vecchia, è un login
    assert.equal(A.isNewAccount({ created_at: ago(50), confirmed_at: ago(30) }, "email", now), false);
    // account creato giorni fa e mai completato: il primo link aperto è l'iscrizione
    assert.equal(A.isNewAccount({ created_at: ago(3 * 24 * 60), confirmed_at: ago(1) }, "email", now), true);
    // Supabase che conferma alla creazione (conferme spente): vale la creazione entro l'ora del link
    assert.equal(A.isNewAccount({ created_at: ago(45), confirmed_at: ago(45) }, "email", now), true);
    assert.equal(A.isNewAccount({ created_at: ago(45) }, "email", now), true);
    // chi torna
    assert.equal(A.isNewAccount({ created_at: ago(10 * 24 * 60), confirmed_at: ago(10 * 24 * 60) }, "email", now), false);
    assert.equal(A.isNewAccount({ created_at: ago(90) }, "email", now), false);
    assert.equal(A.isNewAccount({ created_at: ago(20) }, "discord", now), false);
    assert.equal(A.isNewAccount(null, "email", now), false);
    assert.equal(A.isNewAccount({ created_at: "non è una data" }, "email", now), false);
  });
  test("dedupeSignUp: un secondo sign_up nello stesso browser entro un'ora diventa login", () => {
    const now = Date.parse("2026-09-25T12:00:00Z");
    assert.equal(A.dedupeSignUp("sign_up", null, now), "sign_up");
    assert.equal(A.dedupeSignUp("sign_up", now - 20 * 60_000, now), "login");
    assert.equal(A.dedupeSignUp("sign_up", now - 2 * 60 * 60_000, now), "sign_up", "un altro account, più tardi");
    assert.equal(A.dedupeSignUp("sign_up", Number.NaN, now), "sign_up");
    assert.equal(A.dedupeSignUp("login", now, now), "login");
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
  test("senza window non parte niente e niente si rompe", async () => {
    assert.equal(typeof (globalThis as { window?: unknown }).window, "undefined");
    A.trackEvent("sign_up", { method: "email" });
    A.trackNamedEvent("tier_entry_open", { tier_source: "community", card: "merlin" });
    A.trackSearch("cards", "merlin", 1);
    A.consumeAuthSignal();
    await A.applyStaffSwitch();
    assert.equal(A.isInternalTraffic(), false);
    assert.equal(A.stopGoogleAnalytics("G-TEST"), false);
  });
});

/* ---------- browser finto ---------- */

const store = new Map<string, string>();
const vaCalls: unknown[][] = [];
const cookieWrites: string[] = [];
let cookieJar = "";
const loc = { href: "", origin: "", pathname: "", search: "", hash: "", hostname: "" };
const go = (href: string) => {
  const u = new URL(href, loc.href || undefined);
  Object.assign(loc, { href: u.href, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash, hostname: u.hostname });
};
const g = globalThis as unknown as Record<string, unknown>;
/** Gli eventi che Vercel ha ricevuto (nome e proprietà), dalla coda `window.va`. */
const vercelEvents = () => vaCalls.filter((c) => c[0] === "event").map((c) => c[1] as { name: string; data?: Record<string, unknown> });
/** I comandi arrivati a gtag, come array (dataLayer contiene oggetti `arguments`). */
const gaCommands = () => ((g.dataLayer as ArrayLike<unknown>[] | undefined) ?? []).map((a) => Array.from(a));
const gaEvents = () => gaCommands().filter((c) => c[0] === "event");
const setConsent = (v: "all" | "necessary" | null) => (v ? store.set("originsmeta.consent.v1", v) : store.delete("originsmeta.consent.v1"));
/** Un clic (o un clic con la rotellina) su un elemento finto, come lo vede l'ascoltatore del documento. */
const click = (target: FakeEl, type = "click", button = 0) => A.onDocumentClick({ type, button, target } as unknown as MouseEvent);

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
    define("Element", FakeEl);
    define("HTMLAnchorElement", FakeAnchor);
    define("va", (...args: unknown[]) => void vaCalls.push(args));
    mock.method(console, "info", () => {});
    go("https://originsmeta.com/it/deck-builder");
  });

  test("senza consenso: l'evento va a Vercel con al massimo due proprietà, a GA4 no", () => {
    setConsent("necessary");
    A.trackEvent("steam_click", { target: "demo", placement: "content", cta: "button" });
    assert.deepEqual(vercelEvents().at(-1), { name: "steam_click", data: { target: "demo", placement: "content" }, options: undefined });
    A.trackEvent("feedback_submit", {});
    assert.deepEqual(vercelEvents().at(-1), { name: "feedback_submit", data: {}, options: undefined });
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
    store.delete(A.SIGNUP_KEY);
    go("https://originsmeta.com/es/deck-builder?intent=save&om_auth=sign_up&om_method=discord#OM1x");
    A.consumeAuthSignal();
    assert.deepEqual(vercelEvents().at(-1), { name: "sign_up", data: { method: "discord" }, options: undefined });
    assert.deepEqual(gaEvents().at(-1), ["event", "sign_up", { method: "discord", lang: "es" }]);
    assert.equal(loc.search, "?intent=save");
    assert.equal(loc.hash, "#OM1x");
    assert.ok(store.has(A.SIGNUP_KEY), "il browser ricorda l'iscrizione appena contata");
    const n = vercelEvents().length;
    A.consumeAuthSignal();
    assert.equal(vercelEvents().length, n, "un ricaricamento non lo ripete");
    go("https://originsmeta.com/it/account?om_auth=hack&om_method=email");
    A.consumeAuthSignal();
    assert.equal(vercelEvents().length, n, "un segnale non valido si toglie senza eventi");
    assert.equal(loc.search, "");
    // lo stesso account che rientra nella stessa ora (secondo link, altro metodo): login, non un'altra iscrizione
    go("https://originsmeta.com/it/account?om_auth=sign_up&om_method=email");
    A.consumeAuthSignal();
    assert.deepEqual(vercelEvents().at(-1), { name: "login", data: { method: "email" }, options: undefined });
  });

  test("traffico interno: solo il codice giusto accende il flag; ?staff=off lo spegne; le pagine viste di Vercel lo seguono", async () => {
    const expected = (await A.sha256Hex("codice-di-prova")) as string;
    // ?staff=on non basta più: esclude solo la pagina in cui arriva, finché la verifica non finisce
    go("https://originsmeta.com/it?staff=on&x=1");
    assert.equal(A.isInternalTraffic(), true, "codice non ancora verificato: la pagina non si conta");
    await A.applyStaffSwitch(expected);
    assert.equal(loc.search, "?x=1", "il parametro sparisce comunque");
    assert.equal(store.has(A.INTERNAL_KEY), false);
    assert.equal(A.isInternalTraffic(), false);

    go("https://originsmeta.com/it?staff=codice-di-prova");
    assert.equal(A.vercelBeforeSend({ type: "pageview", url: loc.href }), null, "la prima pagina vista non arriva a Vercel");
    const pending = A.applyStaffSwitch(expected);
    assert.equal(loc.search, "", "tolto subito, prima della verifica");
    assert.equal(A.isInternalTraffic(), true, "durante la verifica");
    await pending;
    assert.equal(store.get(A.INTERNAL_KEY), "1");
    assert.equal(A.isInternalTraffic(), true);
    assert.equal(A.gaAllowed(), false);
    const v = vercelEvents().length;
    const ga = gaEvents().length;
    A.trackEvent("deck_publish", { legendary: "merlin", source: "builder" });
    assert.equal(vercelEvents().length, v);
    assert.equal(gaEvents().length, ga);
    assert.equal(A.vercelBeforeSend({ type: "pageview", url: "https://originsmeta.com/it" }), null);

    go("https://originsmeta.com/it?staff=off");
    assert.equal(A.isInternalTraffic(), false, "?staff=off vale subito");
    await A.applyStaffSwitch(expected);
    assert.equal(store.has(A.INTERNAL_KEY), false);
    assert.equal(A.isInternalTraffic(), false);
    assert.deepEqual(A.vercelBeforeSend({ type: "pageview", url: "https://originsmeta.com/it/account?om_auth=login&om_method=email" }), { type: "pageview", url: "https://originsmeta.com/it/account" });
  });

  test("clic: link verso Steam e Discord, attributi data-om-*, link della home", () => {
    setConsent("necessary");
    // scheda di un mazzo: "Apri nel deck builder" dichiarato con gli attributi
    go("https://originsmeta.com/it/decks/community/x");
    const builder = new FakeAnchor("a", { href: "/it/deck-builder#OM1x", "data-om-event": "deck_open_builder", "data-om-placement": "deck_page" }, tree.main);
    click(new FakeEl("span", {}, builder));
    assert.deepEqual(vercelEvents().at(-1), { name: "deck_open_builder", data: { placement: "deck_page" }, options: undefined });
    // tasto Discord ufficiale nel footer (DiscordButton ha data-om-cta="button")
    click(new FakeAnchor("a", { href: "https://discord.gg/originstcg", "data-om-cta": "button" }, tree.footer));
    assert.deepEqual(vercelEvents().at(-1), { name: "discord_click", data: { server: "official", placement: "footer" }, options: undefined });
    // clic destro: niente
    const n = vercelEvents().length;
    click(new FakeAnchor("a", { href: "https://discord.gg/originstcg" }, tree.footer), "auxclick", 2);
    assert.equal(vercelEvents().length, n);

    // home: il tasto Steam dello slider conta come steam_click e come home_route
    go("https://originsmeta.com/it");
    click(new FakeAnchor("a", { href: "https://store.steampowered.com/app/4756630/", "data-om-cta": "button" }, new FakeEl("div", {}, tree.slider)));
    assert.deepEqual(vercelEvents().slice(-2), [
      { name: "steam_click", data: { target: "demo", placement: "slider" }, options: undefined },
      { name: "home_route", data: { destination: "steam", section: "slider" }, options: undefined },
    ]);
    // un tasto di "Fai la tua mossa", con la sezione dichiarata sul contenitore
    const moves = new FakeEl("section", { "data-om-placement": "home_moves" }, tree.main);
    click(new FakeAnchor("a", { href: "/it/deck-builder" }, moves));
    assert.deepEqual(vercelEvents().at(-1), { name: "home_route", data: { destination: "builder", section: "home_moves" }, options: undefined });
    // un link con home_route già dichiarato non conta due volte
    const m = vercelEvents().length;
    click(new FakeAnchor("a", { href: "/it/tier-list", "data-om-event": "home_route", "data-om-destination": "tier_list", "data-om-section": "home_tier" }, tree.main));
    assert.equal(vercelEvents().length, m + 1);
    // header e footer della home non sono smistamento della home
    const h = vercelEvents().length;
    click(new FakeAnchor("a", { href: "/it/cards" }, tree.header));
    assert.equal(vercelEvents().length, h);
    // fuori dalla home niente home_route
    go("https://originsmeta.com/it/news");
    click(new FakeAnchor("a", { href: "/it/cards" }, tree.main));
    assert.equal(vercelEvents().length, h);
  });

  test("consenso ritirato: prima GA4 spento, poi il consenso negato; cookie _ga cancellati su ogni dominio; poi solo Vercel", () => {
    go("https://www.originsmeta.com/it");
    setConsent("all");
    cookieJar = "_ga=GA1.1.1; sb-x-auth-token=segreto; _ga_9J5Q803XJS=GS1.1";
    cookieWrites.length = 0;
    // il momento in cui arriva il consenso negato: GA4 deve essere già spento
    const realGtag = g.gtag as (...args: unknown[]) => void;
    let disabledWhenDenied: unknown = "mai chiamato";
    g.gtag = (...args: unknown[]) => {
      if (args[0] === "consent" && args[1] === "update") disabledWhenDenied = g["ga-disable-G-TEST"];
      realGtag(...args);
    };
    setConsent("necessary");
    try {
      assert.equal(A.stopGoogleAnalytics("G-TEST"), true, "GA4 girava: il componente ricarica la pagina");
      assert.equal(A.stopGoogleAnalytics("G-TEST"), false, "una volta sola (per esempio lo stesso ritiro arrivato da un'altra scheda)");
    } finally {
      g.gtag = realGtag;
    }
    assert.equal(disabledWhenDenied, true, "ga-disable impostato prima del consenso negato");
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

  test("consenso ridato nella stessa pagina (ricaricamento rimandato): GA4 si riaccende", () => {
    setConsent("all");
    A.startGoogleAnalytics("G-TEST");
    assert.equal(g["ga-disable-G-TEST"], false);
    assert.deepEqual(gaCommands().at(-1), ["consent", "update", { analytics_storage: "granted" }]);
    A.trackEvent("tier_list_save", { kind: "cards" });
    assert.deepEqual(gaEvents().at(-1), ["event", "tier_list_save", { kind: "cards", lang: "it" }]);
    const n = gaCommands().length;
    A.startGoogleAnalytics("G-TEST");
    assert.equal(gaCommands().length, n, "già acceso: niente comandi in più");
  });

  test("moduli compilati: l'ascoltatore input segna la pagina, il cambio di pagina la libera", () => {
    A.clearUnsavedInput();
    A.noteUnsavedInput({ target: { tagName: "INPUT", type: "search", form: {} } } as unknown as Event);
    assert.equal(A.hasUnsavedInput(), false);
    A.noteUnsavedInput({ target: { tagName: "TEXTAREA" } } as unknown as Event);
    assert.equal(A.hasUnsavedInput(), true);
    A.clearUnsavedInput();
    assert.equal(A.hasUnsavedInput(), false);
  });
});
