/**
 * Test dei titoli e delle description delle pagine principali (home e hub), nelle tre lingue:
 * `node --test src/lib/hubMeta.test.ts`. Nati con il piano SEO/GEO del 25/09/2026 ("ogni ricerca alla sua pagina"):
 * i testi stanno nei dizionari e chi li cambia deve restare nei limiti che Google mostra senza tagliare.
 *
 * Le regole sono quelle di `pageTitle` e `cleanDescription` in src/lib/page.ts, che qui non si importa (carica Next):
 *  - un titolo che contiene già "Origins TCG" deve stare da solo entro 60 caratteri, uno che non lo contiene entro 46
 *    (pageTitle gli aggiunge " · Origins TCG"); il marchio " · OriginsMeta" lo aggiunge solo se ci sta;
 *  - una description sta fra 120 e 158 caratteri (sopra DESCRIPTION_MAX verrebbe tagliata con l'ellissi).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
// TypeScript segnala TS5097 sulle righe seguenti e le ignoriamo apposta, come in deckrules.test.ts.
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "./dictionaries/en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it } from "./dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "./dictionaries/es.ts";

type Dict = typeof en;
const dicts: [string, Dict][] = [
  ["en", en],
  ["it", it],
  ["es", es],
];

/** Stesse costanti di src/lib/page.ts (TITLE_MAX, DESCRIPTION_MAX). */
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 120;
const DESCRIPTION_MAX = 158;
const BRAND = " · Origins TCG";

/** I titoli in SERP delle pagine principali, come li passano le page.tsx a `pageMeta`. */
function hubTitles(d: Dict): Record<string, string> {
  return {
    home: d.meta.homeTitle,
    tierList: d.tier.metaTitle,
    community: d.tier.community.title,
    communityPreview: d.tier.community.titlePreview,
    mostPlayed: d.tier.played.title,
    tierMaker: d.tierMaker.title,
    decks: d.decks.metaTitle,
    cards: d.cards.metaTitle,
    deckBuilder: d.builder.title,
    metashifting: d.metashifting.title,
    locations: d.locations.title,
    faq: d.faq.metaTitle,
    tournaments: d.events.metaTitle,
    news: d.news.metaTitle,
    guides: d.guides.metaTitle,
    authors: d.authors.metaTitle,
    about: d.about.title,
  };
}

/** Le description delle stesse pagine (per /tournaments anche quella dei giorni prima della Crimson Cup). */
function hubDescriptions(d: Dict): Record<string, string> {
  return {
    home: d.meta.description,
    tierList: d.tier.description,
    community: d.tier.community.description,
    mostPlayed: d.tier.played.description,
    tierMaker: d.tierMaker.description,
    decks: d.decks.description,
    cards: d.cards.description,
    deckBuilder: d.builder.description,
    metashifting: d.metashifting.description,
    locations: d.locations.description,
    faq: d.faq.description,
    tournaments: d.events.description,
    tournamentsCup: d.events.descriptionCup,
    news: d.news.description,
    guides: d.guides.description,
    authors: d.authors.description,
    about: d.about.description,
  };
}

for (const [locale, d] of dicts) {
  describe(`titoli e description degli hub (${locale})`, () => {
    test("ogni titolo contiene Origins TCG e sta nei 60 caratteri senza essere tagliato", () => {
      for (const [page, title] of Object.entries(hubTitles(d))) {
        assert.match(title, /Origins TCG/, `${locale}/${page}: manca "Origins TCG" in "${title}"`);
        const final = /origins tcg|originsmeta/i.test(title) ? title : `${title}${BRAND}`;
        assert.ok(final.length <= TITLE_MAX, `${locale}/${page}: ${final.length} caratteri, "${final}"`);
      }
    });

    test("i titoli delle pagine principali sono tutti diversi", () => {
      const titles = Object.values(hubTitles(d));
      assert.equal(new Set(titles).size, titles.length);
    });

    test("ogni description sta fra 120 e 158 caratteri e nomina Origins TCG", () => {
      for (const [page, text] of Object.entries(hubDescriptions(d))) {
        assert.match(text, /Origins TCG/, `${locale}/${page}: manca "Origins TCG"`);
        assert.ok(text.length >= DESCRIPTION_MIN && text.length <= DESCRIPTION_MAX, `${locale}/${page}: ${text.length} caratteri`);
      }
    });

    test("la home punta al marchio e a Koin Games, non alle parole delle sezioni", () => {
      assert.match(d.meta.homeTitle, /Koin Games/);
      assert.match(d.meta.homeTitle, /OriginsMeta$/);
      // "carte"/"cartas" restano come definizione ("gioco di carte"): fuori solo le parole delle sezioni
      assert.doesNotMatch(d.meta.homeTitle, /tier list|decks?\b|mazzi|mazos|database/i);
      assert.match(d.meta.description, /Koin Games/);
      assert.match(d.home.h1, /Koin Games/);
      assert.match(d.home.inBrief, /Koin Games/);
    });

    test("le patch notes sono di MetaShifting, non di /news", () => {
      assert.match(d.metashifting.title, /patch notes|notas del parche/i);
      assert.doesNotMatch(d.news.metaTitle, /patch|parche/i);
    });

    test("la FAQ non promette l'assistente nel titolo", () => {
      for (const title of [d.faq.title, d.faq.metaTitle]) assert.doesNotMatch(title, /ask|chiedi|pregunta lo que/i);
    });
  });
}

test("in spagnolo mazzi e carte portano Koin Games (le SERP sono piene di Riftbound Origins)", () => {
  assert.match(es.decks.metaTitle, /Koin Games/);
  assert.match(es.cards.metaTitle, /Koin Games/);
});
