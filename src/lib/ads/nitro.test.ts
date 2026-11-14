/**
 * Test della pubblicità con Nitro (14/11/2026): `node --test src/lib/ads/nitro.test.ts`.
 * Pagine con e senza annunci, indirizzi di Nitro, id del sito uguale in next.config.ts con il redirect 301 di /ads.txt,
 * annunci finti fuori dalla produzione, testi nelle otto lingue con il nome vero del link dei cookie, e nessun dato
 * degli iscritti passato a Nitro (niente `addUserToken` nel codice del sito).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
// TypeScript segnala TS5097 sulle righe seguenti e le ignoriamo apposta, come in hubMeta.test.ts.
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { AD_SECTIONS, GLOBAL_PLACEMENTS, IN_CONTENT_SLOTS, NITRO_GA_CONSENT_ID, NITRO_SITE_ID, adsAllowedPath, adsEnabled, nitroAdsTxtUrl, nitroDemo, nitroScriptUrl } from "./nitro.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { adsLabels } from "../adsLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "../dictionaries/en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it as itDict } from "../dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "../dictionaries/es.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { fr } from "../dictionaries/fr.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { pt } from "../dictionaries/pt.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { de } from "../dictionaries/de.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { ru } from "../dictionaries/ru.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { zhCn } from "../dictionaries/zh-cn.ts";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const dicts = { en, it: itDict, es, fr, pt, de, ru, "zh-cn": zhCn } as const;

/** Le lingue del sito come le scrive i18n.ts (letto come testo: i18n.ts importa i dizionari senza estensione). */
function siteLocales(): string[] {
  const src = readFileSync(join(ROOT, "src", "lib", "i18n.ts"), "utf8");
  const m = /export const locales = \[([^\]]+)\]/.exec(src);
  assert.ok(m, "locales non trovate in i18n.ts");
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

describe("interruttore e indirizzi", () => {
  test("annunci accesi solo con un id del sito valido", () => {
    assert.equal(adsEnabled(null), false);
    assert.equal(adsEnabled("1234"), true);
    assert.equal(adsEnabled("abc-123"), true);
    assert.equal(adsEnabled(""), false);
    assert.equal(adsEnabled("12 34"), false);
    assert.equal(adsEnabled("../x"), false);
  });

  test("script e ads.txt di Nitro con l'id del sito", () => {
    assert.equal(nitroScriptUrl("1234"), "https://s.nitropay.com/ads-1234.js");
    assert.equal(nitroAdsTxtUrl("1234"), "https://api.nitropay.com/v1/ads-1234.txt");
  });

  test("lo stesso id in next.config.ts, con il redirect 301 di /ads.txt", () => {
    const config = readFileSync(join(ROOT, "next.config.ts"), "utf8");
    const m = /const NITRO_SITE_ID: string \| null = (null|"[^"]*");/.exec(config);
    assert.ok(m, "NITRO_SITE_ID non trovato in next.config.ts");
    assert.equal(m[1] === "null" ? null : m[1].slice(1, -1), NITRO_SITE_ID);
    assert.match(config, /source: "\/ads\.txt", destination: `https:\/\/api\.nitropay\.com\/v1\/ads-\$\{NITRO_SITE_ID\}\.txt`, statusCode: 301/);
  });

  test("consenso per Google Analytics: nessuno o un numero intero positivo", () => {
    assert.ok(NITRO_GA_CONSENT_ID === null || (Number.isInteger(NITRO_GA_CONSENT_ID) && NITRO_GA_CONSENT_ID > 0));
  });

  test("annunci finti fuori dalla produzione", () => {
    assert.equal(nitroDemo("originsmeta.com"), false);
    assert.equal(nitroDemo("www.originsmeta.com"), false);
    assert.equal(nitroDemo("OriginsMeta.com"), false);
    assert.equal(nitroDemo("originsmeta-git-claude-nitro.vercel.app"), true);
    assert.equal(nitroDemo("originsmeta.vercel.app"), true);
    assert.equal(nitroDemo("localhost"), true);
  });
});

describe("pagine con gli annunci", () => {
  test("le pagine da leggere sì, in tutte le lingue", () => {
    for (const locale of siteLocales()) {
      for (const path of [
        "",
        "/",
        "/news/patch-0-7",
        "/guides/origins-tcg-legendaries",
        "/guides/community/una-guida",
        "/cards/merlin",
        "/locations",
        "/tier-list",
        "/tier-list/community",
        "/metashifting",
        "/decks",
        "/decks/community/glinda-pigs",
        "/decks/tournament/tre-mazzi",
        "/analytics/crimson-cup/playoffs",
        "/creators",
        "/faq",
        "/authors",
        "/u/coachcrono",
        "/theory-craft/decks",
      ]) {
        assert.equal(adsAllowedPath(`/${locale}${path}`), true, `/${locale}${path}`);
      }
    }
    assert.equal(adsAllowedPath("/it/news/patch-0-7?x=1#in-breve"), true);
  });

  test("mai negli strumenti, nei moduli, nell'account, nei tornei, negli eventi e nelle landing", () => {
    for (const path of [
      "/",
      "/xx/news",
      "/news",
      "/it/deck-builder",
      "/it/draft",
      "/it/draft/r/abcd",
      "/it/tracker",
      "/it/market",
      "/it/account",
      "/it/account/messages",
      "/it/login",
      "/it/tournaments",
      "/it/tournaments/om-btgp/manage",
      "/it/events/attrix-showmatch",
      "/it/events/attrix-showmatch/regia",
      "/it/kickstarter",
      "/it/twitch",
      "/it/for-creators",
      "/it/live",
      "/it/privacy",
      "/it/terms",
      "/it/about",
      "/it/style",
      "/it/theory-craft",
      "/it/tier-list/create",
      "/it/decks/publish",
      "/it/decks/tournament/publish",
      "/it/decks/community/glinda-pigs/edit",
      "/it/guides/new",
      "/it/guides/submit",
      "/it/guides/community/una-guida/edit",
      "/it/news/comics/new",
      "/it/news/comics/un-fumetto/edit",
      "/overlay/deck/glinda-pigs",
      "/broadcast",
    ]) {
      assert.equal(adsAllowedPath(path), false, path);
    }
  });

  test("il prefisso delle lingue di nitro.ts copre tutte le lingue del sito", () => {
    const src = readFileSync(join(ROOT, "src", "lib", "ads", "nitro.ts"), "utf8");
    const m = /const LOCALE_PREFIX = \/\^\\\/\(([^)]+)\)/.exec(src);
    assert.ok(m, "LOCALE_PREFIX non trovato");
    assert.deepEqual(m[1].split("|").sort(), siteLocales().sort());
  });

  test("le sezioni con gli annunci non sono strumenti", () => {
    for (const s of ["deck-builder", "draft", "tracker", "market", "account", "login", "tournaments", "events", "kickstarter", "live"]) {
      assert.equal((AD_SECTIONS as readonly string[]).includes(s), false, s);
    }
  });

  test("gli spazi hanno id tutti diversi", () => {
    const ids = [...GLOBAL_PLACEMENTS.map((p: { id: string }) => p.id), ...Object.values(IN_CONTENT_SLOTS)];
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe("testi nelle otto lingue", () => {
  test("scritta degli spazi e paragrafo dell'informativa in ogni lingua", () => {
    assert.deepEqual(Object.keys(adsLabels).sort(), siteLocales().sort());
    for (const [locale, l] of Object.entries(adsLabels) as [keyof typeof dicts, { label: string; privacy: string }][]) {
      assert.ok(l.label.length > 0 && l.label.length <= 20, `${locale}: label`);
      for (const must of ["Nitro", "Overwolf", "IAB TCF", "Google Analytics", "Do Not Sell My Personal Information", "nitropay.com/privacy"]) {
        assert.ok(l.privacy.includes(must), `${locale}: manca "${must}"`);
      }
      // il link del piede che riapre le scelte, col suo nome vero
      assert.ok(l.privacy.includes(dicts[locale].cookies.manage), `${locale}: manca "${dicts[locale].cookies.manage}"`);
    }
  });
});

describe("dati degli iscritti", () => {
  test("nessuna chiamata ad addUserToken nel codice del sito", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(?:ts|tsx)$/.test(name) && !name.endsWith(".test.ts") && /addUserToken\s*\(/.test(readFileSync(p, "utf8"))) hits.push(p);
      }
    };
    walk(join(ROOT, "src"));
    assert.deepEqual(hits, []);
  });
});
