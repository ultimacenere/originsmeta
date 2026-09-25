/**
 * Test delle news (`newsMeta.ts`) con il runner integrato di Node: `node --test src/lib/data/newsMeta.test.ts`.
 * Come per gli altri test, gli import hanno l'estensione `.ts`. Fallisce se una news non ha title per la SERP o
 * description in una delle lingue del sito, se esce dai limiti di lunghezza (title finale via la regola di
 * `pageTitle` entro 60, description 120-158) o se rimanda a guide, ancore o news che non esistono. Controlla anche i
 * collegamenti degli eventi (/tournaments) e delle FAQ approvate (/faq), che puntano alle stesse news e guide.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  TITLE_SEP,
  duplicateMetaTitles,
  internalLinks,
  newsProblems,
  serpTitle,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./newsMeta.ts";
import {
  news,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./news.ts";
import {
  events,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./events.ts";
import {
  faqs,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "../content/faq.ts";
import type { Locale } from "../i18n";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

// Lingue del sito e guide esistenti si leggono dai sorgenti (i18n.ts e guides.ts importano file senza estensione,
// che Node non carica): così una lingua o una guida nuova entra da sola nei controlli.
const locales = [...(read("../i18n.ts").match(/export const locales = \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z]{2})"/g)].map((m) => m[1]) as Locale[];
const guideList = read("../content/guides.ts").match(/export const guideSlugs = \[([^\]]*)\]/)?.[1] ?? "";
const guides = new Set([...guideList.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));
const newsSlugs = new Set(news.map((item) => item.slug));

describe("lettura dei sorgenti", () => {
  test("lingue e guide trovate", () => {
    assert.ok(locales.includes("en") && locales.includes("it") && locales.includes("es"), `lingue lette: ${locales.join(", ")}`);
    assert.ok(guides.has("steam-next-fest-2026") && guides.has("play-the-demo"), "elenco guideSlugs di guides.ts");
  });
  test("la regola del titolo è ancora quella di page.ts", () => {
    const page = read("../page.ts");
    assert.match(page, new RegExp(`export const TITLE_MAX = ${TITLE_MAX};`));
    assert.match(page, new RegExp(`export const DESCRIPTION_MAX = ${DESCRIPTION_MAX};`));
    assert.ok(page.includes(`const SEP = "${TITLE_SEP}";`), "stesso separatore");
  });
});

describe("serpTitle", () => {
  test("aggiunge la parola chiave e il marchio solo se mancano e se ci stanno", () => {
    assert.equal(serpTitle("Crimson Cup announced for Steam Next Fest"), "Crimson Cup announced for Steam Next Fest · Origins TCG");
    assert.equal(serpTitle("Origins TCG patch 0.6.2 notes"), "Origins TCG patch 0.6.2 notes · OriginsMeta");
    assert.equal(serpTitle("Upgrade Meta: what's new on OriginsMeta for Origins TCG"), "Upgrade Meta: what's new on OriginsMeta for Origins TCG");
    // 47 caratteri senza "Origins TCG": con la parola chiave arriva a 61, oltre il limite
    assert.ok(serpTitle("x".repeat(47)).length > TITLE_MAX);
  });
  test("link interni del Markdown", () => {
    assert.deepEqual(internalLinks("[a](/en/news/x) e [b](https://x.com/y) e [c](/it/guides/z#w)"), ["/en/news/x", "/it/guides/z#w"]);
  });
});

describe("newsProblems", () => {
  const l10n = (s: string) => ({ en: s, it: s, es: s });
  const ok = {
    slug: "prova",
    date: "2026-09-25",
    title: l10n("Titolo"),
    metaTitle: l10n("Origins TCG: prova"),
    summary: l10n("Riassunto."),
    description: l10n("d".repeat(140)),
    url: "https://example.com/",
    source: "press" as const,
    image: "/media/og.jpg",
  };
  const two: Locale[] = ["en", "it"];
  test("una news in regola non ha problemi", () => {
    assert.deepEqual(newsProblems(ok, two, new Set()), []);
  });
  test("segnala title troppo lungo, description fuori misura, ancore e link sbagliati, guide inesistenti", () => {
    const bad = {
      ...ok,
      metaTitle: { ...ok.metaTitle, it: "x".repeat(47) },
      description: { ...ok.description, en: "corta" },
      body: l10n("## Sezione {#sezione}\n\nVedi [la guida](/en/guides/play-the-demo)."),
      highlights: { en: [{ label: "A", anchor: "sezione" }], it: [{ label: "B", anchor: "manca" }], es: [] },
      guides: ["guida-che-non-esiste"],
    };
    const problems = newsProblems(bad as unknown as Parameters<typeof newsProblems>[0], two, new Set(["play-the-demo"]));
    assert.equal(problems.length, 5, problems.join("\n"));
    assert.ok(problems.some((p) => p.startsWith("prova [it]: title in SERP di 61")));
    assert.ok(problems.some((p) => p.startsWith("prova [en]: description di 5")));
    assert.ok(problems.some((p) => p.includes("[it]: l'ancora #manca")));
    assert.ok(problems.some((p) => p.includes("[it]: link interno senza il prefisso /it")));
    assert.ok(problems.some((p) => p.includes('"guida-che-non-esiste" non esiste')));
  });
});

describe("news", () => {
  test("uno slug per news", () => {
    assert.equal(newsSlugs.size, news.length);
  });
  test("metaTitle, description, testi e collegamenti in ogni lingua, entro i limiti", () => {
    const problems = news.flatMap((item) => newsProblems(item, locales, guides));
    assert.deepEqual(problems, []);
  });
  test("ogni news ha il suo title nella SERP", () => {
    assert.deepEqual(duplicateMetaTitles(news, locales), []);
  });
  test("una news aggiornata dichiara l'aggiornamento", () => {
    for (const item of news) {
      if (item.updated) assert.ok(item.updated >= item.date, `${item.slug}: updated prima di date`);
    }
  });
});

describe("eventi e FAQ approvate", () => {
  test("gli eventi rimandano a guide e news che esistono", () => {
    for (const e of events) {
      if (e.guide) assert.ok(guides.has(e.guide), `${e.slug}: la guida ${e.guide} non esiste`);
      if (e.rules) assert.ok(newsSlugs.has(e.rules), `${e.slug}: la news ${e.rules} non esiste`);
    }
    assert.equal(events.find((e) => e.slug === "next-fest-tournament")?.rules, "crimson-cup-format-check-in");
  });
  test("le FAQ approvate hanno le stesse domande in ogni lingua e collegamenti che esistono", () => {
    const ids = (l: Locale) => faqs[l].map((f) => f.id).join(",");
    for (const l of locales) {
      assert.equal(ids(l), ids("en"), `[${l}] stesse domande, nello stesso ordine`);
      for (const f of faqs[l]) {
        for (const g of f.guides ?? []) assert.ok(guides.has(g), `[${l}] ${f.id}: la guida ${g} non esiste`);
        for (const s of f.news ?? []) assert.ok(newsSlugs.has(s), `[${l}] ${f.id}: la news ${s} non esiste`);
      }
    }
  });
});
