/**
 * Test delle news (`newsMeta.ts`) con il runner integrato di Node: `node --test src/lib/data/newsMeta.test.ts`.
 * Come per gli altri test, gli import hanno l'estensione `.ts`. Fallisce se una news non ha title per la SERP o
 * description in una delle lingue del sito, se esce dai limiti di lunghezza (title finale via `pageTitle` entro 60,
 * description 120-158), se rimanda a guide, ancore, news o sezioni che non esistono o se è aggiornata senza il
 * paragrafo dell'aggiornamento. Controlla anche i collegamenti degli eventi (/tournaments) e delle FAQ approvate
 * (/faq), che puntano alle stesse news e guide, e la regola delle date delle versioni tradotte (`modifiedIn`).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  anchorsOf,
  duplicateMetaTitles,
  internalLinks,
  linkProblem,
  newsProblems,
  updateMarkers,
  type NewsChecks,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./newsMeta.ts";
import {
  TRANSLATED_SINCE,
  modifiedIn,
  news,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./news.ts";
import {
  LOCALE_SINCE,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "../lastmod.ts";
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

/**
 * `pageTitle` vera, ricostruita dal sorgente di page.ts: page.ts importa Next e non si carica in `node --test`, e una
 * copia della regola qui smetterebbe di valere in silenzio appena la regola cambia. Il corpo della funzione è
 * JavaScript semplice (niente tipi): se un giorno non lo fosse più, il test fallisce qui e lo dice.
 */
function realPageTitle(): (title: string) => string {
  const src = read("../page.ts");
  const body = src.match(/export function pageTitle\(title: string\): string \{\r?\n([\s\S]*?)\r?\n\}/)?.[1];
  const sep = src.match(/const SEP = "([^"]*)";/)?.[1];
  const max = Number(src.match(/export const TITLE_MAX = (\d+);/)?.[1]);
  assert.ok(body && sep && max, "pageTitle, SEP e TITLE_MAX non trovati in src/lib/page.ts: aggiornare realPageTitle");
  const fn = new Function("SEP", "TITLE_MAX", "title", body) as (s: string, m: number, t: string) => string;
  return (title) => fn(sep, max, title);
}
const pageTitle = realPageTitle();

// Sezioni del sito: le cartelle delle rotte sotto [locale]/(site) e [locale]/(home), senza gruppi né parametri.
const appDir = (group: string) => new URL(`../../app/[locale]/${group}/`, import.meta.url);
const sections = new Set(
  ["(site)", "(home)"].flatMap((g) => readdirSync(appDir(g), { withFileTypes: true }).filter((e) => e.isDirectory() && !/^[[(_]/.test(e.name)).map((e) => e.name)),
);

const checks: NewsChecks = { pageTitle, guides, news, sections };

describe("lettura dei sorgenti", () => {
  test("lingue, guide e sezioni trovate", () => {
    assert.ok(locales.includes("en") && locales.includes("it") && locales.includes("es"), `lingue lette: ${locales.join(", ")}`);
    assert.ok(guides.has("steam-next-fest-2026") && guides.has("play-the-demo"), "elenco guideSlugs di guides.ts");
    for (const s of ["news", "guides", "cards", "metashifting", "tier-list"]) assert.ok(sections.has(s), `sezione ${s}`);
  });
  test("i limiti sono quelli di page.ts", () => {
    const page = read("../page.ts");
    assert.match(page, new RegExp(`export const TITLE_MAX = ${TITLE_MAX};`));
    assert.match(page, new RegExp(`export const DESCRIPTION_MAX = ${DESCRIPTION_MAX};`));
  });
  test("la pageTitle ricostruita aggiunge parola chiave e marchio solo se mancano e se ci stanno", () => {
    assert.equal(pageTitle("Crimson Cup announced for Steam Next Fest"), "Crimson Cup announced for Steam Next Fest · Origins TCG");
    assert.equal(pageTitle("Origins TCG patch 0.6.2 notes"), "Origins TCG patch 0.6.2 notes · OriginsMeta");
    assert.equal(pageTitle("Upgrade Meta: what's new on OriginsMeta for Origins TCG"), "Upgrade Meta: what's new on OriginsMeta for Origins TCG");
    // 47 caratteri senza "Origins TCG": con la parola chiave arriva a 61, oltre il limite
    assert.ok(pageTitle("x".repeat(47)).length > TITLE_MAX);
  });
});

describe("funzioni di supporto", () => {
  test("link interni del Markdown", () => {
    assert.deepEqual(internalLinks("[a](/en/news/x) e [b](https://x.com/y) e [c](/it/guides/z#w)"), ["/en/news/x", "/it/guides/z#w"]);
  });
  test("ancore scritte e generate dai titoli", () => {
    assert.deepEqual([...anchorsOf("## Uno {#uno}\n\ntesto\n\n### Perché **conta**\n\n## Déjà vu: 20–25 ottobre")], ["uno", "perche-conta", "deja-vu-20-25-ottobre"]);
  });
  test("paragrafo dell'aggiornamento nelle tre lingue", () => {
    assert.deepEqual(updateMarkers("en", "2026-09-05"), ["Update, 5 September", "Update of 5 September"]);
    assert.deepEqual(updateMarkers("it", "2026-09-25"), ["Aggiornamento del 25 settembre"]);
    assert.deepEqual(updateMarkers("es", "2026-10-01"), ["Actualización del 1 de octubre"]);
  });
  test("destinazione dei link", () => {
    assert.equal(linkProblem("/en/news/crimson-cup-format-check-in#check-in", "en", checks), undefined);
    assert.equal(linkProblem("/it/guides/submit", "it", checks), undefined);
    assert.equal(linkProblem("/es/metashifting", "es", checks), undefined);
    assert.match(linkProblem("/en/news/crimson-cup-format-chek-in", "en", checks) ?? "", /news che non esiste/);
    assert.match(linkProblem("/it/news/crimson-cup-format-check-in#check-in-2", "it", checks) ?? "", /ancora che non c'è/);
    assert.match(linkProblem("/es/guides/steam-next-fest-2025", "es", checks) ?? "", /guida che non esiste/);
    assert.match(linkProblem("/en/tierlist", "en", checks) ?? "", /sezione che non esiste/);
    assert.match(linkProblem("/en/news/x", "it", checks) ?? "", /senza il prefisso \/it/);
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
    assert.deepEqual(newsProblems(ok, two, checks), []);
  });
  test("segnala title troppo lungo, description fuori misura, ancore e link sbagliati, guide inesistenti", () => {
    const bad = {
      ...ok,
      metaTitle: { ...ok.metaTitle, it: "x".repeat(47) },
      description: { ...ok.description, en: "corta" },
      body: l10n("## Sezione {#sezione}\n\nVedi [la guida](/en/guides/play-the-demo) e [le regole](/en/news/non-esiste)."),
      highlights: { en: [{ label: "A", anchor: "sezione" }], it: [{ label: "B", anchor: "manca" }], es: [] },
      guides: ["guida-che-non-esiste"],
    };
    const problems = newsProblems(bad as unknown as Parameters<typeof newsProblems>[0], two, checks);
    assert.equal(problems.length, 7, problems.join("\n"));
    assert.ok(problems.some((p) => p.startsWith("prova [it]: title in SERP di 61")));
    assert.ok(problems.some((p) => p.startsWith("prova [en]: description di 5")));
    assert.ok(problems.some((p) => p.includes("[it]: l'ancora #manca")));
    assert.ok(problems.some((p) => p.includes("[it]: link interno senza il prefisso /it")));
    assert.ok(problems.some((p) => p.includes("[en]: link a una news che non esiste: /en/news/non-esiste")));
    assert.ok(problems.some((p) => p.includes('"guida-che-non-esiste" non esiste')));
  });
  test("una news aggiornata senza il paragrafo dell'aggiornamento", () => {
    const upd = { ...ok, date: "2026-09-20", updated: "2026-09-25", body: { en: "## A\n\nUpdate, 25 September: sì.", it: "## A\n\nNessun aggiornamento.", es: "## A\n\nActualización del 25 de septiembre: sí." } };
    assert.deepEqual(newsProblems(upd, locales, checks), ["prova [it]: aggiornata il 2026-09-25 ma il testo non ha il paragrafo \"Aggiornamento del 25 settembre…\""]);
  });
  test("un title senza Origins TCG in SERP", () => {
    const brand = { ...ok, metaTitle: l10n("Novità di OriginsMeta") };
    assert.equal(newsProblems(brand, ["en"], checks).length, 1);
  });
});

describe("news", () => {
  test("uno slug per news", () => {
    assert.equal(newsSlugs.size, news.length);
  });
  test("metaTitle, description, testi, collegamenti e aggiornamenti in ogni lingua, entro i limiti", () => {
    const problems = news.flatMap((item) => newsProblems(item, locales, checks));
    assert.deepEqual(problems, []);
  });
  test("ogni news ha il suo title nella SERP", () => {
    assert.deepEqual(duplicateMetaTitles(news, locales), []);
  });
  test("nessuna news ha lo stesso title di una guida", () => {
    // I title delle guide stanno in guides.ts (EN e IT) e guides-es.ts: si leggono dai sorgenti come le guide.
    const guideTitles = new Set(
      ["../content/guides.ts", "../content/guides-es.ts"].flatMap((f) => [...read(f).matchAll(/metaTitle: "([^"]+)"/g)].map((m) => m[1].trim().toLowerCase())),
    );
    assert.ok(guideTitles.size > 10, "title delle guide letti");
    for (const item of news) {
      for (const l of locales) assert.ok(!guideTitles.has(item.metaTitle[l].trim().toLowerCase()), `${item.slug} [${l}]: stesso title di una guida`);
    }
  });
});

describe("date delle versioni tradotte (news e guide)", () => {
  test("lo spagnolo non si dichiara modificato prima di esistere; inglese e italiano restano con la data dell'articolo", () => {
    assert.equal(modifiedIn("es", "2026-03-13"), "2026-09-25");
    assert.equal(modifiedIn("es", "2026-09-25"), "2026-09-25");
    assert.equal(modifiedIn("es", "2026-10-02"), "2026-10-02");
    assert.equal(modifiedIn("en", "2026-03-13"), "2026-03-13");
    assert.equal(modifiedIn("it", "2026-09-09"), "2026-09-09");
  });
  test("la soglia di ogni lingua tradotta è il giorno in cui è nata, lo stesso della sitemap", () => {
    assert.deepEqual(Object.keys(TRANSLATED_SINCE), ["es"]);
    for (const [l, day] of Object.entries(TRANSLATED_SINCE)) assert.equal(day, LOCALE_SINCE[l as Locale], l);
  });
  test("nessuna news spagnola risulta modificata prima di essere pubblicata", () => {
    for (const item of news) assert.ok(modifiedIn("es", item.updated ?? item.date) >= item.date, item.slug);
  });
});

describe("eventi e FAQ approvate", () => {
  test("gli eventi rimandano a guide e news che esistono, con l'etichetta del link in ogni lingua", () => {
    for (const e of events) {
      if (e.guide) assert.ok(guides.has(e.guide), `${e.slug}: la guida ${e.guide} non esiste`);
      if (!e.rules) continue;
      assert.ok(newsSlugs.has(e.rules.news), `${e.slug}: la news ${e.rules.news} non esiste`);
      for (const l of locales) assert.ok(e.rules.label[l]?.trim(), `${e.slug} [${l}]: manca l'etichetta del link alle regole`);
    }
    assert.equal(events.find((e) => e.slug === "next-fest-tournament")?.rules?.news, "crimson-cup-format-check-in");
  });
  test("le FAQ approvate hanno le stesse domande in ogni lingua e collegamenti che esistono", () => {
    const ids = (l: Locale) => faqs[l].map((f) => f.id).join(",");
    const newsOf = (l: Locale) => faqs[l].map((f) => (f.news ?? []).map((n) => n.slug).join("+")).join(",");
    for (const l of locales) {
      assert.equal(ids(l), ids("en"), `[${l}] stesse domande, nello stesso ordine`);
      assert.equal(newsOf(l), newsOf("en"), `[${l}] stessi articoli collegati`);
      for (const f of faqs[l]) {
        for (const g of f.guides ?? []) assert.ok(guides.has(g), `[${l}] ${f.id}: la guida ${g} non esiste`);
        for (const n of f.news ?? []) {
          assert.ok(newsSlugs.has(n.slug), `[${l}] ${f.id}: la news ${n.slug} non esiste`);
          assert.ok(n.label.trim(), `[${l}] ${f.id}: manca il testo del link a ${n.slug}`);
        }
      }
    }
  });
});
