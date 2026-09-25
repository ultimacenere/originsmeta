/**
 * Test di llms.txt e llms-full.txt (`llms.ts`), con il runner integrato di Node: `node --test src/lib/llms.test.ts`.
 * Controlla le funzioni che puliscono i testi, la forma di llms-full.txt sui dati veri (guide, news e carte di oggi),
 * che public/llms.txt abbia le sezioni generate allineate ai dati (se fallisce: `node scripts/llms-txt.mjs`) e che
 * ogni suo link verso originsmeta.com porti a una pagina che esiste.
 *
 * llms.ts importa il database carte, le news e le guide, scritti per Next (import senza estensione, JSON senza
 * attributi): come in cardTitles.test.ts, un hook di risoluzione dei moduli di Node (`module.registerHooks`,
 * Node ≥ 22.15) aggiunge `.ts` agli import relativi e dichiara i JSON.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
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
    const resolved = next(specifier, context);
    return resolved.url.endsWith(".json") ? { ...resolved, importAttributes: { type: "json" } } : resolved;
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const llms: typeof import("./llms") = await import("./llms.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("./data/cards") = await import("./data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const newsModule: typeof import("./data/news") = await import("./data/news.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const guidesModule: typeof import("./content/guides") = await import("./content/guides.ts");

const { cleanMarkdown, plainCardText, replaceSection, syncLlmsTxt, llmsFull, activeLegendaries, LLMS_GENERATED, LLMS_FULL_PATH } = llms;
const { cards, getCard } = cardsModule;
const SITE = "https://originsmeta.com";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const lf = (s: string) => s.replace(/\r\n/g, "\n");

describe("pulizia dei testi", () => {
  test("le statistiche delle carte diventano parole e le righe diventano frasi", () => {
    assert.equal(plainCardText("I have +1⚔️/+1❤️ for each ally."), "I have +1 Power/+1 Health for each ally.");
    assert.equal(plainCardText("Summon a Zombie [2⚔️/2❤️]."), "Summon a Zombie [2 Power/2 Health].");
    assert.equal(plainCardText("Destroy the ally with the lowest ⚔️."), "Destroy the ally with the lowest Power.");
    assert.equal(plainCardText("It gets +10⚔️."), "It gets +10 Power.");
    assert.equal(plainCardText("Shield\nOn Reveal: Give your Good characters Shield."), "Shield. On Reveal: Give your Good characters Shield.");
    assert.equal(plainCardText("I can Move each round.\nI have +1⚔️/+1❤️."), "I can Move each round. I have +1 Power/+1 Health.");
  });
  test("Markdown: via le ancore, titoli abbassati di due livelli, link interni assoluti", () => {
    const md = "\n## Uno {#uno}\n\nVedi [la guida](/en/guides/play-the-demo) e [Steam](https://store.steampowered.com/).\n\n\n\n### Due\r\n\ntesto\n";
    assert.equal(
      cleanMarkdown(md),
      "#### Uno\n\nVedi [la guida](https://originsmeta.com/en/guides/play-the-demo) e [Steam](https://store.steampowered.com/).\n\n##### Due\n\ntesto",
    );
    assert.equal(cleanMarkdown("###### Sei {#sei}"), "###### Sei");
  });
  test("una sezione si sostituisce fino alla successiva, con il fine riga del file", () => {
    const text = "# T\r\n\r\n## A\r\n\r\nvecchio\r\n\r\n## B\r\n\r\nresta\r\n";
    assert.equal(replaceSection(text, "A", "nuovo\n\n- uno"), "# T\r\n\r\n## A\r\n\r\nnuovo\r\n\r\n- uno\r\n\r\n## B\r\n\r\nresta\r\n");
    assert.equal(replaceSection("# T\n\n## B\n\nvecchio\n", "B", "nuovo"), "# T\n\n## B\n\nnuovo\n");
    assert.throws(() => replaceSection(text, "C", "x"), /non trovata/);
  });
});

describe("llms-full.txt", () => {
  const full = llmsFull();
  const guides = guidesModule.getGuides("en");
  const news = newsModule.sortedNews;

  test("apre con il titolo, dice che non è affiliato a Koin Games e rimanda all'indice", () => {
    assert.ok(full.startsWith("# OriginsMeta: full text\n\n> "));
    assert.match(full, /not affiliated with Koin Games/);
    assert.ok(full.includes(`${SITE}/llms.txt`));
    assert.ok(full.endsWith("\n") && !full.endsWith("\n\n"));
    assert.doesNotMatch(full, /\n{3,}/);
  });
  test("tre sezioni principali e un solo titolo di primo livello", () => {
    const lines = full.split("\n");
    assert.deepEqual(
      lines.filter((l) => /^# /.test(l)),
      ["# OriginsMeta: full text"],
    );
    assert.deepEqual(
      lines.filter((l) => /^## /.test(l)),
      ["## Guides", "## News", "## Cards of the Demo 2.0"],
    );
  });
  test("ogni guida e ogni news in inglese, con titolo e indirizzo", () => {
    for (const g of guides) {
      assert.ok(full.includes(`### ${g.title}\n\nURL: ${SITE}/en/guides/${g.slug}\n`), `guida ${g.slug}`);
    }
    for (const n of news) {
      assert.ok(full.includes(`### ${n.title.en}\n\nURL: ${SITE}/en/news/${n.slug}\n`), `news ${n.slug}`);
      assert.ok(full.includes(n.summary.en), `riassunto di ${n.slug}`);
    }
    assert.ok(full.includes(`${guides.length} guides, ${news.length} news articles`));
  });
  test("i titoli dei testi stanno sotto quelli del documento: nessun ## o ### dentro guide e news", () => {
    const titles = new Set([...guides.map((g) => g.title), ...news.map((n) => n.title.en), "Legendaries", "Units", "Spells", "Created cards"]);
    for (const line of full.split("\n").filter((l) => /^### /.test(l))) {
      const title = line.slice(4).replace(/ \(\d+\)$/, "");
      assert.ok(titles.has(title), `titolo di terzo livello inatteso: ${line}`);
    }
  });
  test("testo pulito: niente ancore, link interni relativi, emoji delle statistiche o HTML", () => {
    assert.doesNotMatch(full, /\{#[a-z0-9-]+\}/);
    assert.doesNotMatch(full, /\]\(\/[^)]*\)/);
    assert.doesNotMatch(full, /[⚔❤]/);
    assert.doesNotMatch(full, /<\/?(?:a|span|div|p|br)\b/i);
  });
  test("ogni carta in gioco e ogni carta creata, con la scheda; nessuna carta rimossa", () => {
    for (const c of cards) {
      const line = `- [${c.name}](${SITE}/en/cards/${c.slug}): `;
      if (c.status === "active") assert.ok(full.includes(line), `manca ${c.slug}`);
      else assert.ok(!full.includes(line), `carta rimossa presente: ${c.slug}`);
    }
    const legendaries = activeLegendaries();
    assert.ok(legendaries.length >= 1);
    assert.ok(full.includes(`### Legendaries (${legendaries.length})`));
    assert.ok(full.includes("- [Mulan](https://originsmeta.com/en/cards/mulan): Legendary unit, "));
  });
});

describe("public/llms.txt", () => {
  const text = read("../../public/llms.txt");

  test("le sezioni generate sono allineate ai dati (altrimenti: node scripts/llms-txt.mjs)", () => {
    assert.equal(lf(syncLlmsTxt(text)), lf(text), "public/llms.txt non è allineato ai dati: lancia node scripts/llms-txt.mjs");
  });
  test("le sezioni generate ci sono, e le Leggendarie sono quelle in gioco", () => {
    for (const heading of Object.values(LLMS_GENERATED)) assert.match(lf(text), new RegExp(`\\n## ${heading}\\n`));
    const section = lf(text).split("\n## Legendaries\n")[1].split("\n## ")[0];
    const lines = section.split("\n").filter((l) => l.startsWith("- ["));
    assert.deepEqual(
      lines.map((l) => l.match(/cards\/([a-z0-9-]+)\)/)?.[1]),
      activeLegendaries().map((c) => c.slug),
    );
  });
  test("rimanda a llms-full.txt e non toglie la dicitura su Koin Games", () => {
    assert.ok(text.includes(`${SITE}${LLMS_FULL_PATH}`));
    assert.match(text, /not affiliated with Koin Games/);
  });
  test("ogni link verso originsmeta.com porta a una pagina che esiste", () => {
    const guideSlugs = new Set<string>(guidesModule.guideSlugs);
    const newsSlugs = new Set(newsModule.news.map((n) => n.slug));
    const app = (p: string) => new URL(`../app/${p}`, import.meta.url);
    const fixed = new Set(["/sitemap.xml", "/llms.txt", LLMS_FULL_PATH]);
    const problems: string[] = [];
    for (const [, path] of text.matchAll(/https:\/\/originsmeta\.com(\/[^\s)]*)?/g)) {
      const p = (path ?? "/").replace(/[.,;:]$/, "");
      if (fixed.has(p)) continue;
      const m = p.match(/^\/(en|it|es)(?:\/(.*))?$/);
      if (!m) {
        problems.push(`${p}: senza lingua`);
        continue;
      }
      const rest = m[2] ?? "";
      const [section, slug, extra] = rest.split("/");
      const ok =
        rest === ""
          ? existsSync(app("[locale]/(home)/page.tsx"))
          : section === "guides" && slug
            ? guideSlugs.has(slug) && !extra
            : section === "news" && slug === "feed.xml"
              ? existsSync(app("[locale]/(site)/news/feed.xml/route.ts"))
              : section === "news" && slug
                ? newsSlugs.has(slug) && !extra
                : section === "cards" && slug
                  ? Boolean(getCard(slug)) && !extra
                  : existsSync(app(`[locale]/(site)/${rest}/page.tsx`));
      if (!ok) problems.push(p);
    }
    assert.deepEqual(problems, []);
  });
});

describe("rotta /llms-full.txt", () => {
  test("statica, in testo semplice, noindex", () => {
    const src = read("../app/llms-full.txt/route.ts");
    assert.match(src, /export const dynamic = "force-static";/);
    assert.match(src, /"content-type": "text\/plain; charset=utf-8"/);
    assert.match(src, /"x-robots-tag": "noindex"/);
    assert.match(src, /llmsFull\(\)/);
  });
});
