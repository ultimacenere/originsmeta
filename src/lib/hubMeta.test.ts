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

    test("i titoli degli hub non prendono le parole di un altro primario (revisione dell'Ondata 1)", () => {
      // "mazzi" è di /decks, "carte" di /cards, "codici" di /deck-builder
      assert.doesNotMatch(d.tier.metaTitle, /decks?\b|cards?\b|mazzi|carte|mazos|cartas/i);
      assert.match(d.tier.metaTitle, /meta\b/i);
      assert.doesNotMatch(d.faq.metaTitle, /decks?\b|mazzi|mazos/i);
      assert.doesNotMatch(d.decks.metaTitle, /codes?\b|codici|códigos/i);
      assert.match(d.decks.metaTitle, /guides|guide|guías/i);
    });

    test("/tournaments nomina la Crimson Cup ma lascia posti e premi alla news delle regole", () => {
      for (const text of [d.events.descriptionCup, d.events.cupLead]) {
        assert.match(text, /Crimson Cup/);
        assert.match(text, /2026/);
        assert.doesNotMatch(text, /512|10[.,]000|\$/);
      }
    });

    test("l'H1 dei Luoghi dice che sono quelli della Demo 2.0", () => {
      assert.match(d.locations.headline, /Demo 2\.0/);
    });

    test("la FAQ non promette l'assistente nel titolo", () => {
      for (const title of [d.faq.title, d.faq.metaTitle]) assert.doesNotMatch(title, /ask|chiedi|pregunta lo que/i);
    });

    test("con l'assistente spento la FAQ non ne parla", () => {
      for (const text of [d.faq.introOffline, d.faq.offlineTitle, d.faq.offline]) assert.doesNotMatch(text, /assistant|assistente|asistente/i);
    });

    test("la dicitura del footer dice sempre che il sito non è affiliato a Koin Games", () => {
      assert.match(d.footer.disclaimer, /not affiliated with Koin Games|non affiliato a Koin Games|no está afiliado a Koin Games/);
    });

    test("le frasi costruite con i dati hanno i loro segnaposto", () => {
      const br = d.decks.brief;
      assert.match(br.count, /\{n\}.*\{date\}|\{date\}.*\{n\}/);
      assert.match(br.countOne, /\{date\}/);
      for (const text of [br.legendaries, br.legendariesOne, br.cards, br.cardsOne, br.rated, br.ratedOne]) assert.match(text, /\{list\}/);
      // il pari merito in testa (deckBrief in tierstats.ts): quante sono, il numero comune dove c'è, e tutti i nomi
      for (const text of [br.legendariesTie, br.cardsTie]) assert.match(text, /^\{count\}.*\{n\}.*\{list\}/);
      assert.match(br.ratedTie, /^\{count\}.*\{list\}/);
      assert.equal(br.numbers.length, 11);
      assert.match(br.rating, /\{avg\}.*\{votes\}/);
      // la patch senza numero ha già una data come etichetta: la sua frase non ripete il nome
      assert.match(d.metashifting.latest, /\{patch\}.*\{date\}.*\{changes\}/);
      assert.match(d.metashifting.latestDated, /\{date\}.*\{changes\}/);
      assert.doesNotMatch(d.metashifting.latestDated, /\{patch\}/);
      assert.match(d.metashifting.changesMany, /\{n\}/);
      assert.match(d.locations.headline, /Origins TCG.*\{n\}|\{n\}.*Origins TCG/);
    });
  });
}

test("in spagnolo mazzi e carte portano Koin Games (le SERP sono piene di Riftbound Origins)", () => {
  assert.match(es.decks.metaTitle, /Koin Games/);
  assert.match(es.cards.metaTitle, /Koin Games/);
});
