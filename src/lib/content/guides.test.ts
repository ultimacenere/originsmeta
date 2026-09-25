/**
 * Test delle guide nuove (Ondata 3 del piano SEO/GEO, 25/09/2026) con il runner integrato di Node:
 * `node --test src/lib/content/guides.test.ts`. Controlla, nelle tre lingue, i limiti SEO (title in SERP con "Origins
 * TCG" entro 60 caratteri, excerpt fra 120 e 158), le date, la copertina (in public/media e di una famiglia di immagini
 * diversa da quelle delle altre guide, delle news e dello slider della home), l'assenza di World of Origins, le ancore
 * delle sezioni, i link interni (prefisso della lingua, pagine e ancore che esistono, stesse destinazioni in ogni lingua,
 * collegamenti fra le guide nuove, nomi di mazzi che contengono una carta sempre linkati) e, per la guida alle
 * Leggendarie, che tabella, ordine e testi citati coincidano con il
 * database delle carte: quando una patch cambia una Leggendaria, o ne arriva una nuova, il test fallisce finché la guida
 * non è aggiornata. Usa il codice vero del sito (guides.ts, cards.ts, news.ts, page.ts) con lo stesso hook di
 * risoluzione dei moduli di cardTitles.test.ts (Node ≥ 22.15).
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { linkProblem, internalLinks, anchorsOf, type NewsChecks } from "../data/newsMeta.ts";

type Resolved = { url: string; format?: string | null; importAttributes?: Record<string, string>; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "next/navigation") return { url: "data:text/javascript,export function notFound(){throw new Error('notFound')}", shortCircuit: true };
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
const guidesModule: typeof import("./guides") = await import("./guides.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardsModule: typeof import("../data/cards") = await import("../data/cards.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const newsModule: typeof import("../data/news") = await import("../data/news.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const pageModule: typeof import("../page") = await import("../page.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const cardlinksModule: typeof import("../cardlinks") = await import("../cardlinks.ts");

type Locale = "en" | "it" | "es";
const locales: Locale[] = ["en", "it", "es"];
const { getGuide, getGuides, guideSlugs } = guidesModule;
const { cards, getCard } = cardsModule;
const { news } = newsModule;
const { pageTitle } = pageModule;
const { linkCardNames } = cardlinksModule;

/** Le guide controllate qui: quelle dell'Ondata 3. Una guida nuova può aggiungersi all'elenco. */
const CHECKED = ["origins-tcg-legendaries", "origins-tcg-ranked", "origins-tcg-conquest"] as const;
const DAY = "2026-09-25";

// Sezioni del sito: le cartelle delle rotte sotto [locale]/(site) e [locale]/(home), come in newsMeta.test.ts.
const appDir = (group: string) => new URL(`../../app/[locale]/${group}/`, import.meta.url);
const sections = new Set(
  ["(site)", "(home)"].flatMap((g) => readdirSync(appDir(g), { withFileTypes: true }).filter((e) => e.isDirectory() && !/^[[(_]/.test(e.name)).map((e) => e.name)),
);
const checks: NewsChecks = { pageTitle, guides: new Set<string>(guideSlugs), news, sections };

const guide = (locale: Locale, slug: string) => {
  const g = getGuide(locale, slug);
  assert.ok(g, `${locale} ${slug}: la guida non esiste`);
  return g;
};

/** Cosa non va in un link interno della guida, oltre ai controlli di `linkProblem`: carte, ancore delle guide, mazzi. */
function guideLinkProblem(path: string, locale: Locale): string | undefined {
  const base = linkProblem(path, locale, checks);
  if (base) return base;
  const [route, anchor] = path.slice(locale.length + 1).split("#");
  const [section, slug, sub] = route.split("/").filter(Boolean);
  if (section === "cards" && slug && !getCard(slug)) return `carta che non esiste: ${path}`;
  if (section === "guides" && slug && anchor) {
    const target = getGuide(locale, slug);
    if (!target || !anchorsOf(target.body).has(anchor)) return `ancora che non c'è nella guida: ${path}`;
  }
  // Le schede dei mazzi della community hanno uno slug "nome-xxxx" (4 cifre esadecimali in fondo).
  if (section === "decks" && slug === "community" && !/^[a-z0-9-]+-[0-9a-f]{4}$/.test(sub ?? "")) return `scheda mazzo con uno slug strano: ${path}`;
  return undefined;
}

/** Destinazione di un link senza lingua né ancora, per confrontare le tre versioni della stessa guida. */
const target = (path: string, locale: Locale) => path.slice(locale.length + 1).split("#")[0];

describe("guide dell'Ondata 3: registrazione e SEO", () => {
  test("sono registrate, in cima all'elenco, nelle tre lingue", () => {
    assert.deepEqual(guideSlugs.slice(0, CHECKED.length), [...CHECKED]);
    for (const l of locales) for (const s of CHECKED) guide(l, s);
  });
  test("title in SERP con Origins TCG entro 60 caratteri, excerpt fra 120 e 158, titoli diversi fra le lingue", () => {
    for (const s of CHECKED) {
      const titles = new Set<string>();
      for (const l of locales) {
        const g = guide(l, s);
        const serp = pageTitle(g.metaTitle ?? g.title);
        assert.match(serp, /Origins TCG/, `${l} ${s}: ${serp}`);
        assert.ok(serp.length <= 60, `${l} ${s}: "${serp}" (${serp.length})`);
        assert.ok(g.excerpt.length >= 120 && g.excerpt.length <= 158, `${l} ${s}: excerpt di ${g.excerpt.length} caratteri`);
        titles.add(g.metaTitle ?? g.title);
      }
      assert.equal(titles.size, locales.length, `${s}: stesso metaTitle in due lingue`);
    }
  });
  test("nessun title in SERP uguale a quello di un'altra guida o di una news", () => {
    for (const l of locales) {
      const others = new Set([
        ...getGuides(l)
          .filter((g) => !(CHECKED as readonly string[]).includes(g.slug))
          .map((g) => (g.metaTitle ?? g.title).toLowerCase()),
        ...news.map((n) => n.metaTitle[l].toLowerCase()),
      ]);
      for (const s of CHECKED) assert.ok(!others.has((guide(l, s).metaTitle ?? "").toLowerCase()), `${l} ${s}`);
    }
  });
  test("pubblicate il 25/09/2026 in ogni lingua, aggiornate non prima", () => {
    for (const l of locales)
      for (const s of CHECKED) {
        const g = guide(l, s);
        assert.equal(g.published, DAY, `${l} ${s}`);
        // le guide promettono aggiornamenti (patch, apertura della classificata): `updated` può solo andare avanti
        assert.match(g.updated, /^\d{4}-\d{2}-\d{2}$/, `${l} ${s}`);
        assert.ok(g.updated >= (g.published ?? DAY), `${l} ${s}: updated ${g.updated} prima della pubblicazione`);
      }
  });
  test("copertina in public/media, diversa da quelle delle altre guide, delle news e dello slider della home", () => {
    /*
      Si confrontano le "famiglie" di immagini, non solo i file: la stessa illustrazione esiste in più tagli o varianti
      (hero-1200 / hero-1920, keyart-mulan / keyart-mulan-wide, keyart-queen-of-hearts / -cyber / -wide), e due file
      diversi della stessa famiglia in /guides o /news sembrano la stessa copertina.
    */
    const family = (img: string) => img.replace(/^\/media\//, "").replace(/\.webp$/, "").replace(/-(?:wide|cyber|\d{3,4})$/, "");
    const used = new Map<string, string>();
    for (const g of getGuides("en")) if (g.image && !(CHECKED as readonly string[]).includes(g.slug)) used.set(family(g.image), g.slug);
    for (const n of news) used.set(family(n.image), n.slug);
    used.set(family("/media/hero-1920.webp"), "slider della home"); // prima slide, src/app/[locale]/(home)/page.tsx
    const mine = new Set<string>();
    for (const s of CHECKED) {
      const img = guide("en", s).image ?? "";
      assert.match(img, /^\/media\/[a-z0-9-]+\.webp$/, s);
      assert.ok(existsSync(new URL(`../../../public${img}`, import.meta.url)), `${s}: ${img} non esiste`);
      assert.ok(!used.has(family(img)), `${s}: ${img} è della stessa famiglia di una copertina di ${used.get(family(img))}`);
      assert.ok(!mine.has(family(img)), `${s}: ${img} ripetuta fra le guide nuove`);
      mine.add(family(img));
      // la versione italiana e quella spagnola hanno la stessa copertina
      for (const l of locales) assert.equal(guide(l, s).image, img, `${l} ${s}: copertina diversa dall'inglese`);
    }
  });
  test("nessun riferimento a World of Origins (regola del 25/09/2026: il sito non lo nomina e non lo linka)", () => {
    for (const l of locales)
      for (const s of CHECKED) {
        const g = guide(l, s);
        const text = [g.title, g.metaTitle ?? "", g.excerpt, g.body, ...(g.faq ?? []).flatMap((f) => [f.q, f.a])].join("\n");
        assert.doesNotMatch(text, /world\s*of\s*origins|worldoforigins/i, `${l} ${s}`);
      }
  });
  test("stesse FAQ (per numero) nelle tre lingue", () => {
    for (const s of CHECKED) {
      const n = guide("en", s).faq?.length ?? 0;
      assert.ok(n >= 3, s);
      for (const l of locales) assert.equal(guide(l, s).faq?.length, n, `${l} ${s}`);
    }
  });
});

describe("guide dell'Ondata 3: sezioni e link", () => {
  test("ogni sezione ## ha la sua ancora, unica, e le tre lingue hanno le stesse sezioni", () => {
    for (const s of CHECKED) {
      const count = (l: Locale) => [...guide(l, s).body.matchAll(/^## /gm)].length;
      for (const l of locales) {
        const heads = [...guide(l, s).body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
        for (const h of heads) assert.match(h, /\{#[a-z0-9-]+\}$/, `${l} ${s}: "${h}" senza ancora`);
        const anchors = heads.map((h) => h.match(/\{#([a-z0-9-]+)\}$/)?.[1]);
        assert.equal(new Set(anchors).size, anchors.length, `${l} ${s}: ancore ripetute`);
        assert.equal(count(l), count("en"), `${l} ${s}: sezioni diverse dall'inglese`);
      }
      // la prima sezione è l'"In breve" nella lingua della pagina
      assert.equal(anchorsOf(guide("it", s).body).has("in-breve"), true, s);
      assert.equal(anchorsOf(guide("es", s).body).has("en-resumen"), true, s);
      assert.equal(anchorsOf(guide("en", s).body).has("in-brief"), true, s);
    }
  });
  test("link interni con il prefisso della lingua, verso pagine e ancore che esistono", () => {
    const problems: string[] = [];
    for (const s of CHECKED)
      for (const l of locales)
        for (const path of internalLinks(guide(l, s).body)) {
          const p = guideLinkProblem(path, l);
          if (p) problems.push(`${s} [${l}]: ${p}`);
        }
    assert.deepEqual(problems, []);
  });
  test("le tre lingue linkano le stesse pagine", () => {
    for (const s of CHECKED) {
      const of = (l: Locale) => [...new Set(internalLinks(guide(l, s).body).map((p) => target(p, l)))].sort();
      for (const l of locales) assert.deepEqual(of(l), of("en"), `${l} ${s}`);
    }
  });
  test("le guide che la mappa delle query indica rimandano alle nuove, e le nuove si collegano fra loro, in ogni lingua", () => {
    // Il tipo Guide non ha un campo "guide correlate": i collegamenti fra guide stanno nel testo.
    const expected: Record<string, string[]> = {
      "origins-tcg-explained": ["origins-tcg-legendaries", "origins-tcg-ranked"],
      "steam-next-fest-2026": ["origins-tcg-ranked", "origins-tcg-conquest"],
      "origins-tcg-legendaries": ["origins-tcg-conquest", "origins-tcg-ranked"],
      "origins-tcg-ranked": ["origins-tcg-legendaries", "origins-tcg-conquest", "steam-next-fest-2026"],
      "origins-tcg-conquest": ["origins-tcg-legendaries", "origins-tcg-ranked", "steam-next-fest-2026"],
    };
    for (const [from, to] of Object.entries(expected))
      for (const l of locales) {
        const links = internalLinks(guide(l, from).body);
        for (const t of to) assert.ok(links.includes(`/${l}/guides/${t}`), `${l} ${from} → ${t}`);
      }
  });
  test("i nomi dei mazzi che contengono il nome di una carta sono sempre link espliciti", () => {
    /*
      Markdown.tsx collega da solo i nomi delle carte nel testo semplice (linkCardNames): "Glinda Reborn" scritto senza
      link diventerebbe "[Glinda](/xx/cards/glinda) Reborn", un link alla carta dentro il nome di un mazzo. Chi scrive
      un mazzo così deve linkarlo alla sua scheda, che il riconoscimento automatico salta.
    */
    for (const s of CHECKED)
      for (const l of locales) {
        const body = guide(l, s).body;
        const deckNames = new Set([...body.matchAll(/\[([^\]]+)\]\(\/[a-z]{2}\/decks\/community\/[a-z0-9-]+\)/g)].map((m) => m[1].replace(/\\/g, "")));
        const plain = body.replace(/!?\[[^\]\n]*\]\([^)\n]*\)/g, " ");
        for (const name of deckNames) {
          const hasCard = linkCardNames(name).some((seg) => typeof seg !== "string" && seg.text !== name);
          if (hasCard) assert.ok(!plain.includes(name), `${l} ${s}: "${name}" senza link, il nome di una carta dentro diventerebbe un link alla carta`);
        }
      }
  });
});

describe("guida alle Leggendarie: coincide con il database delle carte", () => {
  const SLUG = "origins-tcg-legendaries";
  // Ordine dichiarato nella guida: costo, poi nome.
  const legendaries = cards
    .filter((c) => c.legendary && c.status === "active")
    .sort((a, b) => (a.mana ?? 0) - (b.mana ?? 0) || a.name.localeCompare(b.name));
  const align: Record<string, string> = { good: "Good", evil: "Evil", neutral: "Neutral" };

  test("il numero nel titolo è quello delle Leggendarie attive, e i tag le elencano tutte, in ordine", () => {
    for (const l of locales) {
      const g = guide(l, SLUG);
      assert.ok(g.title.includes(String(legendaries.length)), `${l}: ${g.title}`);
      assert.ok((g.metaTitle ?? "").includes(String(legendaries.length)), `${l}: ${g.metaTitle}`);
      assert.deepEqual(g.tags?.cards, legendaries.map((c) => c.slug), l);
    }
  });
  test("tabella: una riga per Leggendaria, con costo, Potenza/Salute e allineamento del database", () => {
    for (const l of locales) {
      const rows = [...guide(l, SLUG).body.matchAll(/^\| \[([^\]]+)\]\(\/[a-z]{2}\/cards\/([a-z0-9-]+)\) \| (\d+) \| ([^|]+) \| (\w+) \| (\d+) \|$/gm)];
      assert.equal(rows.length, legendaries.length, `${l}: righe della tabella`);
      rows.forEach((m, i) => {
        const c = legendaries[i];
        assert.equal(m[2], c.slug, `${l} riga ${i + 1}`);
        assert.equal(m[1], c.name, `${l} ${c.slug}`);
        assert.equal(Number(m[3]), c.mana, `${l} ${c.slug}: costo`);
        if (c.type === "unit") assert.equal(m[4].trim(), `${c.power}/${c.health}`, `${l} ${c.slug}: statistiche`);
        else assert.doesNotMatch(m[4], /\d/, `${l} ${c.slug}: una magia non ha statistiche`);
        assert.equal(m[5], align[c.alignment ?? ""], `${l} ${c.slug}: allineamento`);
      });
      // la somma dei mazzi è quella dichiarata nel testo (20 mazzi pubblicati entro le 20:00 del 25/09/2026); coppie e
      // terne della guida al Conquest non hanno un test: si ricontano a mano dai mazzi pubblicati, insieme a questo numero
      const total = rows.reduce((n, m) => n + Number(m[6]), 0);
      assert.equal(total, 20, `${l}: totale dei mazzi`);
      // e la FAQ "quale Leggendaria è nel maggior numero di mazzi" dice lo stesso totale
      const declared = new RegExp(`\\b${total}\\b`);
      for (const f of guide(l, SLUG).faq ?? [])
        if (/most decks|maggior numero di mazzi|más mazos/.test(f.q)) assert.match(f.a, declared, `${l}: FAQ sui mazzi`);
    }
  });
  test("una sezione per Leggendaria, nell'ordine dichiarato, con la riga dei dati e il testo ufficiale nella lingua della pagina", () => {
    for (const l of locales) {
      const body = guide(l, SLUG).body;
      const heads = [...body.matchAll(/^## (.+?) \{#([a-z0-9-]+)\}$/gm)];
      const legSections = heads.filter((h) => legendaries.some((c) => c.slug === h[2]));
      assert.deepEqual(
        legSections.map((h) => h[2]),
        legendaries.map((c) => c.slug),
        `${l}: ordine delle sezioni`,
      );
      for (const c of legendaries) {
        const start = body.indexOf(`{#${c.slug}}`);
        const next = body.indexOf("\n## ", start);
        const section = body.slice(start, next < 0 ? undefined : next);
        assert.match(section, new RegExp(`^\\*\\*${c.mana} (mana|de maná) · `, "m"), `${l} ${c.slug}: costo`);
        if (c.type === "unit") assert.ok(section.includes(` · ${c.power}/${c.health} · `), `${l} ${c.slug}: statistiche`);
        assert.ok(section.includes(` · ${align[c.alignment ?? ""]}**`), `${l} ${c.slug}: allineamento`);
        for (const line of (c.ability?.[l] ?? "").split("\n")) assert.ok(section.includes(`> ${line}\n`), `${l} ${c.slug}: manca "${line}"`);
        assert.ok(section.includes(`](/${l}/cards/${c.slug})`), `${l} ${c.slug}: manca il link alla scheda`);
      }
    }
  });
  test("le Leggendarie fuori dalla demo sono tutte citate, e solo quelle", () => {
    const removed = cards.filter((c) => c.legendary && c.status !== "active").map((c) => c.slug).sort();
    for (const l of locales) {
      const body = guide(l, SLUG).body;
      const start = body.indexOf(l === "en" ? "{#not-in-the-demo}" : l === "it" ? "{#fuori-dalla-demo}" : "{#fuera-de-la-demo}");
      assert.ok(start > 0, l);
      const section = body.slice(start, body.indexOf("\n## ", start));
      const linked = [...section.matchAll(/\]\(\/[a-z]{2}\/cards\/([a-z0-9-]+)\)/g)].map((m) => m[1]).sort();
      assert.deepEqual(linked, removed, l);
    }
  });
});

describe("tutte le guide: le righe di tabella con una carta coincidono con il database", () => {
  // Righe come "| [Roo](/en/cards/roo) | 2 | 2/4 with Move |": costo e statistiche devono essere quelli di oggi.
  // Il 25/09/2026 le guide dei mazzi Dorothy Combo e King of Value Trade avevano ancora Dorothy a 5 mana, Roo a 2/3 e
  // Magic Carpet a 3/4, i valori di prima della patch della demo del 21/09 (card-history.ts): dopo una patch il test
  // fallisce finché le tabelle non sono aggiornate.
  const ROW = /^\| \[[^\]]+\]\(\/[a-z]{2}\/cards\/([a-z0-9-]+)\)[^|]*\| (\d+) \| (\d+)\/(\d+)/;
  test("costo, potenza e salute delle carte nelle tabelle, nelle tre lingue", () => {
    let rows = 0;
    for (const l of locales)
      for (const g of getGuides(l))
        for (const line of g.body.split("\n")) {
          const m = line.match(ROW);
          if (!m) continue;
          rows++;
          const card = getCard(m[1]);
          assert.ok(card, `${l} ${g.slug}: carta che non esiste, ${m[1]}`);
          assert.equal(card.mana, Number(m[2]), `${l} ${g.slug} ${m[1]}: costo`);
          if (card.power !== undefined) assert.equal(`${m[3]}/${m[4]}`, `${card.power}/${card.health}`, `${l} ${g.slug} ${m[1]}: statistiche`);
        }
    // le tabelle delle guide dei mazzi e di quella alle Leggendarie: se il numero crolla, l'espressione non le trova più
    assert.ok(rows >= 100, `solo ${rows} righe trovate`);
  });
});
