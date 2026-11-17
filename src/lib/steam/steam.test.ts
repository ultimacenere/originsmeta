/**
 * Test dell'account Steam (09/11/2026): `node --test src/lib/steam/steam.test.ts`.
 * - openid.ts: indirizzo di Steam, controlli sull'asserzione (da Steam, ritorno di questo giro, account personale, firma,
 *   ora), conferma di Steam (check_authentication) con un fetch finto, cookie del giro;
 * - account.ts: indirizzo tecnico degli account nati con Steam, nome dal profilo Steam;
 * - link.ts: esiti del collegamento;
 * - il blocco "09/11/2026: STEAM" di supabase/schema.sql: stesse espressioni del codice, permessi chiusi;
 * - testi: steamLabels.ts e le chiavi `auth` dei dizionari nelle otto lingue, tipi di errore del pannello di accesso,
 *   segnale della misura con il metodo steam.
 * I moduli sono scritti per Next (import senza estensione): come showcase.test.ts, prima di caricarli il test registra un
 * piccolo hook di risoluzione dei moduli di Node che aggiunge `.ts` agli import senza estensione.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { schemaProblems, sqlStatements } from "../../../scripts/schema-guard.mjs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcUrl).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(spec, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const O: typeof import("./openid") = await import("./openid.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const A: typeof import("./account") = await import("./account.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const K: typeof import("./link") = await import("./link.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { steamLabels }: typeof import("../steamLabels") = await import("../steamLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const LL: typeof import("../loginLabels") = await import("../loginLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const AN: typeof import("../analytics") = await import("../analytics.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { locales }: typeof import("../i18n") = await import("../i18n.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { en }: typeof import("../dictionaries/en") = await import("../dictionaries/en.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { it }: typeof import("../dictionaries/it") = await import("../dictionaries/it.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { es }: typeof import("../dictionaries/es") = await import("../dictionaries/es.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { fr }: typeof import("../dictionaries/fr") = await import("../dictionaries/fr.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { pt }: typeof import("../dictionaries/pt") = await import("../dictionaries/pt.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { de }: typeof import("../dictionaries/de") = await import("../dictionaries/de.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { ru }: typeof import("../dictionaries/ru") = await import("../dictionaries/ru.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { zhCn }: typeof import("../dictionaries/zh-cn") = await import("../dictionaries/zh-cn.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const PE: typeof import("./pending") = await import("./pending.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const FL: typeof import("./firstLogin") = await import("./firstLogin.ts");

const ORIGIN = "https://originsmeta.com";
const STATE = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";
const STEAM_ID = "76561198012345678";
const NOW = Date.parse("2026-11-09T12:00:00Z");

/** Un'asserzione come quella che Steam manda al ritorno (i valori di firma sono finti: li controlla Steam). */
function assertion(over: Record<string, string | null> = {}): URLSearchParams {
  const base: Record<string, string> = {
    [O.STEAM_STATE_PARAM]: STATE,
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "id_res",
    "openid.op_endpoint": "https://steamcommunity.com/openid/login",
    "openid.claimed_id": `https://steamcommunity.com/openid/id/${STEAM_ID}`,
    "openid.identity": `https://steamcommunity.com/openid/id/${STEAM_ID}`,
    "openid.return_to": O.steamReturnTo(ORIGIN, STATE),
    "openid.response_nonce": "2026-11-09T11:59:30ZaBcDeFgHiJkLmNoP",
    "openid.assoc_handle": "1234567890",
    "openid.signed": "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
    "openid.sig": "c2lnbmF0dXJlLWZpbnRh",
  };
  const p = new URLSearchParams(base);
  for (const [k, v] of Object.entries(over)) {
    if (v === null) p.delete(k);
    else p.set(k, v);
  }
  return p;
}

describe("openid.ts: partenza verso Steam", () => {
  test("indirizzo di Steam con realm, ritorno con lo stato e identificatore da scegliere", () => {
    const url = new URL(O.steamLoginUrl(ORIGIN, STATE));
    assert.equal(`${url.origin}${url.pathname}`, "https://steamcommunity.com/openid/login");
    const p = url.searchParams;
    assert.equal(p.get("openid.mode"), "checkid_setup");
    assert.equal(p.get("openid.ns"), "http://specs.openid.net/auth/2.0");
    assert.equal(p.get("openid.realm"), "https://originsmeta.com/");
    assert.equal(p.get("openid.return_to"), `https://originsmeta.com/auth/steam/callback?s=${STATE}`);
    assert.equal(p.get("openid.identity"), "http://specs.openid.net/auth/2.0/identifier_select");
    assert.equal(p.get("openid.claimed_id"), "http://specs.openid.net/auth/2.0/identifier_select");
  });

  test("l'origine con la barra finale dà lo stesso indirizzo (anche in locale)", () => {
    assert.equal(O.steamReturnTo("https://originsmeta.com/", STATE), O.steamReturnTo(ORIGIN, STATE));
    assert.equal(O.steamReturnTo("http://localhost:3000", "x"), "http://localhost:3000/auth/steam/callback?s=x");
  });

  test("SteamID64 di un account personale", () => {
    assert.ok(O.isSteamId(STEAM_ID));
    assert.ok(!O.isSteamId("7656119801234567"), "16 cifre");
    assert.ok(!O.isSteamId("103582791429521408"), "un gruppo, non una persona");
    assert.ok(!O.isSteamId(` ${STEAM_ID}`));
    assert.ok(!O.isSteamId(76561198012345678));
    assert.equal(O.steamProfileUrl(STEAM_ID), `https://steamcommunity.com/profiles/${STEAM_ID}`);
  });
});

describe("openid.ts: controlli sull'asserzione", () => {
  const expected = O.steamReturnTo(ORIGIN, STATE);

  test("un'asserzione giusta dà lo SteamID", () => {
    assert.deepEqual(O.checkAssertion(assertion(), expected, NOW), { ok: true, steamId: STEAM_ID });
  });

  test("annullato su Steam", () => {
    assert.deepEqual(O.checkAssertion(assertion({ "openid.mode": "cancel" }), expected, NOW), { ok: false, reason: "cancel" });
  });

  test("risposta che non è un'asserzione positiva o non è OpenID 2.0", () => {
    assert.equal(O.checkAssertion(assertion({ "openid.mode": "setup_needed" }), expected, NOW).ok, false);
    assert.equal(O.checkAssertion(assertion({ "openid.mode": null }), expected, NOW).ok, false);
    assert.deepEqual(O.checkAssertion(assertion({ "openid.ns": "http://openid.net/signon/1.1" }), expected, NOW), { ok: false, reason: "ns" });
  });

  test("non viene da Steam", () => {
    assert.deepEqual(O.checkAssertion(assertion({ "openid.op_endpoint": "https://evil.example/openid/login" }), expected, NOW), { ok: false, reason: "endpoint" });
  });

  test("torna a un altro indirizzo: altro stato, altro sito, parametri in più", () => {
    for (const rt of [O.steamReturnTo(ORIGIN, "AltroStatoAltroStatoAltroStato00"), O.steamReturnTo("https://evil.example", STATE), `${expected}&x=1`, ""]) {
      assert.deepEqual(O.checkAssertion(assertion({ "openid.return_to": rt }), expected, NOW), { ok: false, reason: "return_to" }, rt);
    }
  });

  test("identità che non è un account Steam personale, o diversa dal claimed_id", () => {
    const bad = [
      "https://steamcommunity.com/openid/id/103582791429521408",
      "http://steamcommunity.com/openid/id/76561198012345678",
      "https://steamcommunity.com.evil.example/openid/id/76561198012345678",
      "https://steamcommunity.com/openid/id/76561198012345678/",
    ];
    for (const id of bad) assert.deepEqual(O.checkAssertion(assertion({ "openid.claimed_id": id, "openid.identity": id }), expected, NOW), { ok: false, reason: "claimed_id" }, id);
    assert.deepEqual(
      O.checkAssertion(assertion({ "openid.identity": "https://steamcommunity.com/openid/id/76561198000000001" }), expected, NOW),
      { ok: false, reason: "claimed_id" },
    );
  });

  test("la firma deve coprire i campi che contano", () => {
    for (const missing of ["op_endpoint", "claimed_id", "identity", "return_to", "response_nonce", "assoc_handle"]) {
      const signed = "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle".split(",").filter((f) => f !== missing).join(",");
      assert.deepEqual(O.checkAssertion(assertion({ "openid.signed": signed }), expected, NOW), { ok: false, reason: "signed" }, missing);
    }
    assert.deepEqual(O.checkAssertion(assertion({ "openid.sig": null }), expected, NOW), { ok: false, reason: "signed" });
  });

  test("asserzione di pochi minuti fa: vecchia, dal futuro o senza ora non vale", () => {
    assert.equal(O.nonceTime("2026-11-09T11:59:30ZaBc"), Date.parse("2026-11-09T11:59:30Z"));
    assert.equal(O.nonceTime("ieri"), null);
    assert.equal(O.nonceTime(null), null);
    assert.equal(O.checkAssertion(assertion({ "openid.response_nonce": "2026-11-09T11:55:01Zx" }), expected, NOW).ok, true, "5 minuti meno un secondo");
    assert.deepEqual(O.checkAssertion(assertion({ "openid.response_nonce": "2026-11-09T11:54:59Zx" }), expected, NOW), { ok: false, reason: "nonce" });
    assert.deepEqual(O.checkAssertion(assertion({ "openid.response_nonce": "2026-11-09T12:03:00Zx" }), expected, NOW), { ok: false, reason: "nonce" });
    assert.deepEqual(O.checkAssertion(assertion({ "openid.response_nonce": null }), expected, NOW), { ok: false, reason: "nonce" });
  });
});

describe("openid.ts: conferma di Steam (check_authentication)", () => {
  type Call = { url: string; init: RequestInit };
  const fakeFetch = (status: number, text: string, calls: Call[] = []) =>
    (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(text, { status });
    }) as typeof fetch;

  test("is_valid:true → confermata; manda a Steam gli stessi parametri openid.* con mode=check_authentication", async () => {
    const calls: Call[] = [];
    assert.equal(await O.confirmWithSteam(assertion(), fakeFetch(200, "ns:http://specs.openid.net/auth/2.0\nis_valid:true\n", calls)), true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://steamcommunity.com/openid/login");
    assert.equal(calls[0].init.method, "POST");
    const body = new URLSearchParams(String(calls[0].init.body));
    assert.equal(body.get("openid.mode"), "check_authentication");
    assert.equal(body.get("openid.claimed_id"), `https://steamcommunity.com/openid/id/${STEAM_ID}`);
    assert.equal(body.get("openid.sig"), "c2lnbmF0dXJlLWZpbnRh");
    assert.equal(body.get(O.STEAM_STATE_PARAM), null, "lo stato del sito non va a Steam");
  });

  test("is_valid:false, risposta strana, errore HTTP o di rete → non confermata", async () => {
    assert.equal(await O.confirmWithSteam(assertion(), fakeFetch(200, "ns:http://specs.openid.net/auth/2.0\nis_valid:false\n")), false);
    assert.equal(await O.confirmWithSteam(assertion(), fakeFetch(200, "<html>is_valid:true</html>")), false);
    assert.equal(await O.confirmWithSteam(assertion(), fakeFetch(503, "is_valid:true\n")), false);
    const broken = (async () => {
      throw new Error("rete");
    }) as typeof fetch;
    assert.equal(await O.confirmWithSteam(assertion(), broken), false);
  });
});

describe("openid.ts: cookie del giro e pagine di ritorno", () => {
  const user = "0f8b9c2e-1a2b-4c3d-8e9f-a0b1c2d3e4f5";

  test("stato casuale lungo, diverso ogni volta, adatto all'indirizzo", () => {
    const a = O.newStateToken();
    const b = O.newStateToken();
    assert.match(a, /^[A-Za-z0-9_-]{32}$/);
    assert.notEqual(a, b);
  });

  test("andata e ritorno del cookie", () => {
    const st = { s: STATE, m: "link" as const, n: "/it/account", u: user, t: NOW };
    const raw = O.encodeSteamState(st);
    assert.match(raw, /^[A-Za-z0-9_-]+$/);
    assert.deepEqual(O.decodeSteamState(raw, NOW + 60_000), st);
    assert.deepEqual(O.decodeSteamState(O.encodeSteamState({ s: STATE, m: "login", n: "/es/decks?x=1#y", t: NOW }), NOW), { s: STATE, m: "login", n: "/es/decks?x=1#y", t: NOW });
  });

  test("scaduto dopo 10 minuti, rovinato o con campi sbagliati: null", () => {
    const good = { s: STATE, m: "login" as const, n: "/it/account", t: NOW };
    assert.equal(O.decodeSteamState(O.encodeSteamState(good), NOW + 601_000), null);
    assert.equal(O.decodeSteamState(undefined), null);
    assert.equal(O.decodeSteamState("non base64 !"), null);
    assert.equal(O.decodeSteamState(O.encodeSteamState(good).slice(0, -4), NOW), null);
    const bad = [
      { ...good, s: "corto" },
      { ...good, m: "admin" },
      { ...good, n: "https://evil.example" },
      { ...good, n: "//evil.example" },
      { ...good, u: "non-un-uuid" },
      { ...good, t: "ieri" },
    ];
    for (const b of bad) assert.equal(O.decodeSteamState(O.encodeSteamState(b as never), NOW), null, JSON.stringify(b));
  });

  test("pagina di ritorno: solo percorsi interni", () => {
    assert.equal(O.safeNextPath("/it/account", "/x"), "/it/account");
    assert.equal(O.safeNextPath("/it/deck-builder?deck=OM1#TL1", "/x"), "/it/deck-builder?deck=OM1#TL1");
    for (const bad of [null, "", "https://evil.example", "//evil.example", "/\\evil.example", "it/account", `/${"a".repeat(1001)}`, "/it/\naccount"]) assert.equal(O.safeNextPath(bad, "/x"), "/x", String(bad));
  });

  test("esito nella query, prima del frammento", () => {
    assert.equal(O.withQueryParam("/it/account", "steam", "linked"), "/it/account?steam=linked");
    assert.equal(O.withQueryParam("/it/account?tab=1", "steam", "taken"), "/it/account?tab=1&steam=taken");
    assert.equal(O.withQueryParam("/it/account#steam", "steam", "error"), "/it/account?steam=error#steam");
  });
});

describe("account.ts: account nati con Steam", () => {
  test("indirizzo tecnico con SteamID e parte casuale, riconosciuto dall'espressione", () => {
    const e = A.steamAccountEmail(STEAM_ID, "0123456789abcdef");
    assert.equal(e, `steam-${STEAM_ID}-0123456789abcdef@steam.originsmeta.local`);
    const r1 = A.steamAccountEmail(STEAM_ID);
    const r2 = A.steamAccountEmail(STEAM_ID);
    assert.notEqual(r1, r2, "nessuno lo può indovinare in anticipo");
    for (const x of [e, r1, r2, e.toUpperCase()]) assert.ok(A.isSteamAccountEmail(x), x);
    for (const x of [null, "", "pier@example.com", `steam-${STEAM_ID}@steam.originsmeta.local`, `steam-${STEAM_ID}-0123456789abcdef@steam.originsmeta.local.evil`, "originstcg@profiles.originsmeta.local"]) {
      assert.ok(!A.isSteamAccountEmail(x), String(x));
    }
  });

  test("nome dal profilo Steam in XML", () => {
    assert.equal(A.parsePersonaXml("<profile><steamID64>1</steamID64><steamID><![CDATA[ Coach Crono ]]></steamID></profile>"), "Coach Crono");
    assert.equal(A.parsePersonaXml("<profile><steamID><![CDATA[]]></steamID></profile>"), null);
    assert.equal(A.parsePersonaXml("<response><error>The specified profile could not be found.</error></response>"), null);
  });

  test("lettura del profilo Steam: errori e tempi lunghi danno null", async () => {
    const ok = (async () => new Response("<profile><steamID><![CDATA[Vega]]></steamID></profile>", { status: 200 })) as typeof fetch;
    assert.equal(await A.fetchSteamPersona(STEAM_ID, ok), "Vega");
    const down = (async () => new Response("rate limited", { status: 429 })) as typeof fetch;
    assert.equal(await A.fetchSteamPersona(STEAM_ID, down), null);
    const broken = (async () => {
      throw new Error("rete");
    }) as typeof fetch;
    assert.equal(await A.fetchSteamPersona(STEAM_ID, broken), null);
  });

  test("nomi dell'account nuovo con le regole del sito", () => {
    assert.deepEqual(A.steamSignupNames("Coach Crono"), { full_name: "Coach Crono", user_name: "coach-crono" });
    assert.deepEqual(A.steamSignupNames("Vega"), { full_name: "Vega", user_name: "vega" });
    // parole dello staff e del sito: niente nome mostrato né nome utente presi da lì
    assert.deepEqual(A.steamSignupNames("OriginsMeta Staff"), { user_name: "player" });
    assert.deepEqual(A.steamSignupNames("admin"), { user_name: "player" });
    // senza lettere latine il nome utente riparte da "player", il nome mostrato resta
    assert.deepEqual(A.steamSignupNames("Пьер"), { full_name: "Пьер", user_name: "player" });
    assert.deepEqual(A.steamSignupNames("x"), { user_name: "player" });
    assert.deepEqual(A.steamSignupNames(null), { user_name: "player" });
    assert.equal(A.usernameFromPersona("--Pier__Luigi--"), "pier-luigi");
  });
});

describe("link.ts: esiti del collegamento", () => {
  test("risposte delle funzioni SQL → esiti", () => {
    assert.equal(K.linkOutcome("ok"), "linked");
    assert.equal(K.linkOutcome("same"), "already");
    assert.equal(K.linkOutcome("other"), "other");
    assert.equal(K.linkOutcome("taken"), "taken");
    assert.equal(K.linkOutcome("merged"), "merged", "steam_link_claim: spostato da un account vuoto nato con Steam");
    assert.equal(K.linkOutcome("invalid"), "error");
    assert.equal(K.linkOutcome(null), "error");
    assert.equal(K.unlinkOutcome("ok"), "unlinked");
    assert.equal(K.unlinkOutcome("none"), "unlinked");
    assert.equal(K.unlinkOutcome("steam_only"), "steamOnly");
    assert.equal(K.unlinkOutcome(undefined), "error");
  });

  test("esito dall'indirizzo: solo quelli conosciuti", () => {
    assert.equal(K.parseSteamOutcome("linked"), "linked");
    assert.equal(K.parseSteamOutcome(["taken", "linked"]), "taken");
    assert.equal(K.parseSteamOutcome("<script>"), null);
    assert.equal(K.parseSteamOutcome(undefined), null);
  });

  test("stato del collegamento", () => {
    assert.deepEqual(K.parseSteamLinkStatus([{ steam_id: STEAM_ID, linked_at: "2026-11-09T12:00:00Z", steam_only: true }]), { steamId: STEAM_ID, linkedAt: "2026-11-09T12:00:00Z", steamOnly: true });
    assert.equal(K.parseSteamLinkStatus([]), null);
    assert.equal(K.parseSteamLinkStatus([{ steam_id: "123" }]), null);
    assert.equal(K.parseSteamLinkStatus(null), null);
  });

  test("migrazione mancante: funzione o tabella sconosciute", () => {
    for (const code of ["PGRST202", "PGRST205", "42883", "42P01"]) assert.ok(K.steamMigrationMissing({ code }), code);
    assert.ok(!K.steamMigrationMissing({ code: "42501" }));
    assert.ok(!K.steamMigrationMissing(null));
  });
});

describe("blocco STEAM di supabase/schema.sql", () => {
  const sql = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
  const start = sql.indexOf("-- ===== 09/11/2026: STEAM =====");
  const end = sql.indexOf("\n-- ===== ", start + 10);
  const block = sql.slice(start, end < 0 ? undefined : end);

  test("c'è, in fondo al file, dopo il blocco dell'ID Discord privato", () => {
    assert.ok(start > sql.indexOf("-- ===== 25/10/2026: ID DISCORD PRIVATO ====="));
  });

  test("stessa espressione dello SteamID nel vincolo e in steam_link_set", () => {
    const sqlRe = O.STEAM_ID_PATTERN;
    assert.ok(block.includes(`check (steam_id ~ '${sqlRe}')`));
    assert.ok(block.includes(`p_steam_id !~ '${sqlRe}'`));
  });

  test("stessa espressione dell'indirizzo tecnico in steam_account_only", () => {
    assert.ok(block.includes(`~ '${A.STEAM_ACCOUNT_EMAIL_PATTERN}'`));
    assert.ok(A.STEAM_ACCOUNT_EMAIL_PATTERN.includes(A.STEAM_ACCOUNT_EMAIL_DOMAIN.replace(/\./g, "\\.")));
  });

  test("tabella chiusa ai client, funzioni security definer con search_path, scrittura solo con il segreto del server", () => {
    assert.ok(block.includes("alter table public.steam_links enable row level security;"));
    assert.ok(block.includes("revoke all on public.steam_links from anon, authenticated;"));
    assert.ok(!/grant [^;]* on public\.steam_links to [^;]*(anon|authenticated)/.test(block), "nessuna grant ai client");
    assert.ok(!/create policy/.test(block), "nessuna policy: i client non vedono righe");
    for (const fn of ["steam_account_only", "steam_link_status", "steam_link_set", "steam_link_remove"]) {
      const at = block.indexOf(`create or replace function public.${fn}(`);
      assert.ok(at >= 0, fn);
      assert.match(block.slice(at, at + 400), /security definer set search_path = public, pg_temp/, fn);
    }
    const setBody = block.slice(block.indexOf("function public.steam_link_set("), block.indexOf("revoke all on function public.steam_link_set"));
    assert.ok(setBody.indexOf("notify_key_ok(p_key)") < setBody.indexOf("insert into public.steam_links"), "prima il segreto, poi la scrittura");
    assert.ok(block.includes("revoke all on function public.steam_account_only(uuid) from public, anon, authenticated;"));
    for (const sig of ["steam_link_status()", "steam_link_set(text, text)", "steam_link_remove()"]) {
      assert.ok(block.includes(`revoke all on function public.${sig} from public, anon;`), sig);
      assert.ok(block.includes(`grant execute on function public.${sig} to authenticated;`), sig);
    }
  });

  test("non tocca i profili (schema-guard resta com'è) e lo schema intero passa schema-guard", () => {
    const stmts = sqlStatements(block);
    assert.ok(stmts.length > 10);
    for (const s of stmts) {
      assert.ok(!/^(grant|revoke)\b/.test(s) || !/\bpublic\.profiles\b/.test(s), s);
      assert.ok(!/^alter table (only )?public\.profiles\b/.test(s), s);
    }
    assert.ok(block.includes("references public.profiles(id) on delete cascade"));
    assert.deepEqual(schemaProblems(sql), []);
  });
});

describe("blocco STEAM, ACCOUNT DOPPI di supabase/schema.sql (17/11/2026)", () => {
  const sql = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8");
  const TITLE = "-- ===== 17/11/2026: STEAM, ACCOUNT DOPPI =====";
  const start = sql.indexOf(TITLE);
  const end = sql.indexOf("\n-- ===== ", start + 10);
  const block = sql.slice(start, end < 0 ? undefined : end);
  const body = (fn: string) => block.slice(block.indexOf(`function public.${fn}(`), block.indexOf(`revoke all on function public.${fn}(`));

  test("c'è, dopo il blocco STEAM, e la prova a secco legge lo stesso titolo", () => {
    assert.ok(start > sql.indexOf("-- ===== 09/11/2026: STEAM ====="));
    const dry = readFileSync(new URL("../../../scripts/steam-claim-dry-run.mjs", import.meta.url), "utf8");
    assert.ok(dry.includes(`const MARKER = "${TITLE}";`));
  });

  test("solo funzioni: nessuna tabella, nessuna grant né revoke sui profili, schema-guard contento", () => {
    for (const s of sqlStatements(block)) {
      assert.ok(!/^create table\b/.test(s), s);
      assert.ok(!/^(grant|revoke)\b/.test(s) || !/\bpublic\.profiles\b/.test(s), s);
    }
    assert.deepEqual(schemaProblems(sql), []);
  });

  test("security definer con search_path; steam_account_empty chiusa ai client, steam_link_claim solo agli iscritti", () => {
    for (const fn of ["steam_account_empty", "steam_link_claim"]) {
      const at = block.indexOf(`create or replace function public.${fn}(`);
      assert.ok(at >= 0, fn);
      assert.match(block.slice(at, at + 400), /security definer set search_path = public, pg_temp/, fn);
    }
    assert.ok(block.includes("revoke all on function public.steam_account_empty(uuid) from public, anon, authenticated;"));
    assert.ok(!/grant execute on function public\.steam_account_empty/.test(block));
    assert.ok(block.includes("revoke all on function public.steam_link_claim(text, text) from public, anon;"));
    assert.ok(block.includes("grant execute on function public.steam_link_claim(text, text) to authenticated;"));
  });

  test("vuoto = nessuna riga nelle tabelle con una chiave esterna verso profili o utenti, tranne profilo e collegamento", () => {
    const empty = body("steam_account_empty");
    assert.ok(empty.includes("c.contype = 'f'"));
    assert.ok(empty.includes("c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)"));
    assert.ok(empty.includes("c.conrelid not in ('public.profiles'::regclass, 'public.steam_links'::regclass)"));
    assert.ok(empty.includes("n.nspname <> 'auth'"), "le tabelle di auth (identità, sessioni) se ne vanno con l'utente");
    assert.match(empty, /exception when others then\s+return false;/, "una tabella che non si legge conta come non vuota");
  });

  test("steam_link_claim: prima il segreto, poi i controlli, poi la cancellazione dell'account doppio e il collegamento", () => {
    const claim = body("steam_link_claim");
    const at = (s: string) => {
      const i = claim.indexOf(s);
      assert.ok(i >= 0, s);
      return i;
    };
    assert.ok(claim.includes(`p_steam_id !~ '${O.STEAM_ID_PATTERN}'`), "stessa espressione dello SteamID");
    assert.ok(at("notify_key_ok(p_key)") < at("pg_advisory_xact_lock(hashtext('steam_link:' || p_steam_id))"));
    assert.ok(at("hashtext('steam_link:' || p_steam_id)") > 0, "stesso lock di steam_link_set");
    const guard = at("if not public.steam_account_only(holder) or not public.steam_account_empty(holder) then return 'taken'; end if;");
    const del = at("delete from auth.users u where u.id = holder;");
    assert.ok(guard < del, "si cancella solo un account nato con Steam e vuoto");
    assert.match(claim.slice(del), /exception when foreign_key_violation then\s+return 'taken';/);
    assert.ok(del < claim.lastIndexOf("insert into public.steam_links (user_id, steam_id) values (uid, p_steam_id);"));
    assert.ok(claim.includes("return 'merged';"));
    // gli esiti che non sono 'merged' sono quelli di steam_link_set, che la rotta traduce con linkOutcome
    for (const r of ["'same'", "'other'", "'taken'", "'ok'", "'invalid'"]) assert.ok(claim.includes(`return ${r}`), r);
  });
});

describe("testi nelle otto lingue", () => {
  const dicts = { en, it, es, fr, pt, de, ru, "zh-cn": zhCn } as const;
  const NBSP = String.fromCharCode(160);
  const authKeys = ["steam", "redirectingSteam", "errorSteamCancelled", "errorSteam", "errorSteamExpired", "errorSteamUnavailable", "errorSteamNoEmail", "introSteam"] as const;

  test("steamLabels: ogni lingua, ogni testo, ogni esito", () => {
    for (const l of locales) {
      const L = steamLabels[l];
      assert.ok(L, l);
      for (const [k, v] of Object.entries(L)) if (typeof v === "string") assert.ok(v.trim().length > 0, `${l}.${k}`);
      for (const o of K.STEAM_LINK_OUTCOMES) assert.ok(L.outcomes[o]?.trim(), `${l}.outcomes.${o}`);
      assert.ok(L.linkedOn.includes("{date}"), `${l}.linkedOn`);
      assert.ok(L.privacy.includes("SteamID"), `${l}.privacy`);
    }
  });

  test("dizionari: i testi di \"Continua con Steam\" e l'informativa degli account con SteamID", () => {
    for (const [l, d] of Object.entries(dicts)) {
      for (const k of authKeys) assert.ok(String(d.auth[k]).trim(), `${l}.auth.${k}`);
      assert.ok(d.auth.steam.includes("Steam"), `${l}.auth.steam`);
      assert.ok(d.auth.introSteam.includes("Steam"), `${l}.auth.introSteam`);
      assert.ok(d.privacy.accounts.includes("SteamID"), `${l}.privacy.accounts`);
    }
  });

  test("francese: spazio insecabile prima di : ; ? ! e dentro « »", () => {
    const texts = [...Object.values(steamLabels.fr).flatMap((v) => (typeof v === "string" ? [v] : Object.values(v))), ...authKeys.map((k) => fr.auth[k])];
    for (const t of texts) {
      assert.ok(!/ [:;?!»]/.test(t) && !/« /.test(t), t);
      if (/[:;?!»]/.test(t)) assert.ok(t.includes(NBSP), t);
    }
  });

  test("pannello di accesso: tipi di errore di Steam e interruttore", () => {
    for (const k of ["steamCancelled", "steam", "steamExpired", "steamUnavailable", "steamNoEmail"] as const) assert.equal(LL.authErrorKind(k), k);
    assert.equal(LL.authErrorKind("steamQualcosa"), "generic");
    assert.equal(LL.loginLabels(it).steamOn, false);
    assert.equal(LL.loginLabels(it, true).steamOn, true);
    assert.equal(LL.loginLabels(it, true).steam, "Continua con Steam");
  });

  test("misura: segnale dell'accesso con il metodo steam, account nuovo come con Discord", () => {
    assert.equal(AN.withAuthSignal("/it/account", "sign_up", "steam"), "/it/account?om_auth=sign_up&om_method=steam");
    assert.deepEqual(AN.readAuthSignal("?om_auth=login&om_method=steam"), { event: "login", method: "steam" });
    assert.equal(AN.readAuthSignal("?om_auth=login&om_method=github"), null);
    const ago = (min: number) => new Date(NOW - min * 60_000).toISOString();
    assert.equal(AN.isNewAccount({ created_at: ago(1), confirmed_at: ago(1) }, "steam", NOW), true);
    assert.equal(AN.isNewAccount({ created_at: ago(20), confirmed_at: ago(20) }, "steam", NOW), false);
    assert.equal(AN.isNewAccount({ created_at: ago(60 * 24 * 30), confirmed_at: ago(60 * 24 * 30) }, "steam", NOW), false);
  });
});

describe("primo accesso con Steam (pending.ts, firstLogin.ts; 18/11/2026)", () => {
  const SECRET = "s".repeat(40);

  test("cookie firmato: andata e ritorno, nome del profilo Steam tagliato a 64 caratteri", () => {
    const raw = PE.encodeSteamPending({ id: STEAM_ID, name: `  Tank${"x".repeat(100)}  `, t: NOW }, SECRET);
    assert.match(raw, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/);
    const back = PE.decodeSteamPending(raw, SECRET, NOW + 60_000);
    assert.equal(back?.id, STEAM_ID);
    assert.equal(back?.t, NOW);
    assert.equal(back?.name?.length, 64);
    assert.ok(back?.name?.startsWith("Tank"));
    assert.equal(PE.decodeSteamPending(PE.encodeSteamPending({ id: STEAM_ID, name: null, t: NOW }, SECRET), SECRET, NOW)?.name, null);
  });

  test("cookie firmato: altro segreto, firma o contenuto toccati, scaduto, dal futuro, forma sbagliata → null", () => {
    const raw = PE.encodeSteamPending({ id: STEAM_ID, name: "Tank", t: NOW }, SECRET);
    const [payload, sig] = raw.split(".");
    assert.equal(PE.decodeSteamPending(raw, "t".repeat(40), NOW), null, "altro segreto");
    assert.equal(PE.decodeSteamPending(raw, "corto", NOW), null, "segreto troppo corto: niente cookie");
    assert.equal(PE.decodeSteamPending(`${payload}.${sig.slice(0, -1)}${sig.endsWith("A") ? "B" : "A"}`, SECRET, NOW), null, "firma toccata");
    // un altro SteamID nello stesso cookie: la firma non torna
    const other = Buffer.from(JSON.stringify({ i: "76561198000000000", n: "Tank", t: NOW })).toString("base64url");
    assert.equal(PE.decodeSteamPending(`${other}.${sig}`, SECRET, NOW), null, "contenuto toccato");
    assert.equal(PE.decodeSteamPending(raw, SECRET, NOW + PE.STEAM_PENDING_MAX_AGE_S * 1000 + 1), null, "più di 10 minuti");
    assert.ok(PE.decodeSteamPending(raw, SECRET, NOW + PE.STEAM_PENDING_MAX_AGE_S * 1000 - 1), "10 minuti meno un istante");
    assert.equal(PE.decodeSteamPending(raw, SECRET, NOW - 120_000), null, "dal futuro");
    for (const bad of ["", "abc", `${payload}.`, `.${sig}`, `${payload}.${sig}.x`, "x".repeat(2000)]) assert.equal(PE.decodeSteamPending(bad, SECRET, NOW), null, bad.slice(0, 20));
    // uno SteamID non valido, anche se firmato giusto
    const notSteam = PE.encodeSteamPending({ id: "12345", name: null, t: NOW }, SECRET);
    assert.equal(PE.decodeSteamPending(notSteam, SECRET, NOW), null);
  });

  test("cookie: solo per /auth, httpOnly, SameSite=Lax, 10 minuti (0 per toglierlo)", () => {
    assert.deepEqual(PE.steamPendingCookieOptions(true), { httpOnly: true, sameSite: "lax", secure: true, path: "/auth", maxAge: 600 });
    assert.equal(PE.steamPendingCookieOptions(false, true).maxAge, 0);
    assert.equal(PE.STEAM_PENDING_COOKIE_PATH, "/auth", "il ritorno /auth/callback e le rotte /auth/steam lo ricevono");
    assert.ok(!PE.STEAM_PENDING_COOKIE.startsWith(O.STEAM_STATE_COOKIE + "="));
    assert.ok(PE.pendingSecretOk("x".repeat(32)) && !PE.pendingSecretOk("x".repeat(31)) && !PE.pendingSecretOk(undefined));
  });

  test("indirizzi della scelta e del profilo", () => {
    assert.equal(FL.steamChoicePath("it", "/it/decks?x=1#a"), "/it/login?steam=new&next=%2Fit%2Fdecks%3Fx%3D1%23a");
    assert.equal(FL.steamChoicePath("fr", "/fr/account", "reserved"), "/fr/login?steam=new&next=%2Ffr%2Faccount&name_error=reserved");
    assert.equal(FL.steamLinkedPath("de", "merged"), "/de/account?steam=merged#steam");
    assert.equal(FL.parseSteamNameError("invalid"), "invalid");
    assert.equal(FL.parseSteamNameError("<b>"), null);
    assert.equal(FL.STEAM_CREATE_ROUTE, "/auth/steam/create");
    assert.equal(FL.STEAM_PENDING_ROUTE, "/auth/steam/pending");
    assert.ok(FL.STEAM_CREATE_ROUTE.startsWith(PE.STEAM_PENDING_COOKIE_PATH) && FL.STEAM_PENDING_ROUTE.startsWith(PE.STEAM_PENDING_COOKIE_PATH));
  });

  test("risposta di GET /auth/steam/pending: il nome solo con la scelta aperta", () => {
    assert.deepEqual(FL.parsePendingInfo({ pending: true, name: " Tank " }), { pending: true, name: "Tank" });
    assert.deepEqual(FL.parsePendingInfo({ pending: false, name: "Tank" }), { pending: false, name: null });
    assert.deepEqual(FL.parsePendingInfo({ pending: "true" }), { pending: false, name: null });
    assert.deepEqual(FL.parsePendingInfo(null), { pending: false, name: null });
    assert.equal(FL.parsePendingInfo({ pending: true, name: "x".repeat(100) }).name?.length, 64);
  });

  test("testi della scelta in ogni lingua; l'avviso di scadenza nomina il tasto vero", () => {
    const dicts = { en, it, es, fr, pt, de, ru, "zh-cn": zhCn } as const;
    for (const l of locales) {
      const f = steamLabels[l].firstLogin;
      for (const [k, v] of Object.entries(f)) assert.ok(v.trim().length > 0, `${l}.firstLogin.${k}`);
      assert.ok(f.expired.includes(dicts[l].auth.steam), `${l}: "${dicts[l].auth.steam}" nell'avviso`);
      assert.ok(f.title.includes("Steam") && f.title.includes("OriginsMeta"), `${l}.title`);
    }
  });

  test("misura della scelta", () => {
    assert.deepEqual(AN.vercelProps("steam_new_choice", { choice: "create", lang: "it" }), { choice: "create" });
    assert.ok(AN.isEventName("steam_new_choice"));
  });
});
