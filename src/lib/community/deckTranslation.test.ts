/**
 * Test della traduzione delle guide dei mazzi (`deckTranslation.ts`) con il runner integrato di Node:
 * `node --test src/lib/community/deckTranslation.test.ts`. Come per gli altri test, l'import ha l'estensione `.ts`.
 * Nessuna chiamata all'API: si provano le parti pure (impronta, scelta della versione, controlli della risposta).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  freshTranslation,
  guideHash,
  guideLocales,
  guideText,
  localizedGuide,
  missingLocales,
  namesIn,
  parseTranslation,
  STRATEGY_GUIDE_TRANSLATION_SYSTEM,
  textHash,
  translationRequest,
  translationRequestFor,
  TRANSLATION_MODEL,
  TRANSLATION_RULES,
  TRANSLATION_SYSTEM,
  type DeckTranslations,
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./deckTranslation.ts";

type Lang = "en" | "it" | "es";
const all: Lang[] = ["en", "it", "es"];
// Nei test le lingue sono scritte a mano: il tipo Locale del sito può averne di meno durante le modifiche.
const g = (lang: Lang, summary: string, more: Record<string, string> = {}) => ({ lang, summary, ...more }) as never;

describe("guideText e guideHash", () => {
  test("il testo tiene il riassunto e solo le sezioni piene, nell'ordine fisso", () => {
    const t = guideText(g("it", "Riassunto", { notes: "Note", strengths: "Forza", weaknesses: "  " }));
    assert.deepEqual(Object.keys(t), ["summary", "strengths", "notes"]);
  });

  test("stessa guida, stessa impronta; cambia se cambiano testo o lingua", () => {
    const a = guideHash(g("it", "Mazzo aggro", { strengths: "Veloce" }));
    assert.equal(a, guideHash(g("it", "Mazzo aggro", { strengths: "Veloce" })));
    assert.notEqual(a, guideHash(g("it", "Mazzo aggro!", { strengths: "Veloce" })));
    assert.notEqual(a, guideHash(g("en", "Mazzo aggro", { strengths: "Veloce" })));
    assert.notEqual(a, guideHash(g("it", "Mazzo aggro", { weaknesses: "Veloce" })));
  });

  test("le sezioni vuote non cambiano l'impronta", () => {
    assert.equal(guideHash(g("it", "X", { notes: "" })), guideHash(g("it", "X")));
  });
});

describe("scelta della versione da mostrare", () => {
  const guide = g("it", "Piano di gioco", { strengths: "Curva bassa" });
  const hash = guideHash(guide);
  const translations: DeckTranslations = {
    en: { hash, at: "2026-09-25T10:00:00Z", guide: { summary: "Game plan", strengths: "Low curve" } },
    es: { hash: "vecchia", at: "2026-09-24T10:00:00Z", guide: { summary: "Plan viejo" } },
  } as never;
  const deck = { guide, translations };

  test("traduzione aggiornata: si mostra nella sua lingua", () => {
    const v = localizedGuide(deck, "en" as never);
    assert.equal(v.translated, true);
    assert.equal(v.lang, "en");
    assert.equal(v.text.summary, "Game plan");
  });

  test("traduzione rimasta indietro rispetto al testo: si mostra l'originale", () => {
    const v = localizedGuide(deck, "es" as never);
    assert.equal(v.translated, false);
    assert.equal(v.lang, "it");
    assert.equal(v.text.summary, "Piano di gioco");
    assert.equal(freshTranslation(deck, "es" as never), null);
  });

  test("nella lingua dell'autore si mostra sempre l'originale", () => {
    const v = localizedGuide({ guide, translations: { it: { hash, at: "", guide: { summary: "Altro" } } } as never }, "it" as never);
    assert.equal(v.translated, false);
    assert.equal(v.text.summary, "Piano di gioco");
  });

  test("lingue disponibili e lingue da tradurre", () => {
    assert.deepEqual(guideLocales(deck, all as never), ["en", "it"]);
    assert.deepEqual(missingLocales(deck, all as never), ["es"]);
    assert.deepEqual(guideLocales({ guide, translations: null }, all as never), ["it"]);
    assert.deepEqual(missingLocales({ guide }, all as never), ["en", "es"]);
  });
});

describe("namesIn", () => {
  const names = ["Hare", "Van Helsing's Tools", "Mulan", "Queen of Hearts", "Roo"];

  test("trova i nomi a parola intera, senza badare alle maiuscole", () => {
    const text = { summary: "Con mulan e Van Helsing's Tools si vince; Queen of Hearts no." };
    assert.deepEqual(namesIn(text as never, names), ["Mulan", "Queen of Hearts", "Van Helsing's Tools"]);
  });

  test("non trova un nome dentro un'altra parola", () => {
    assert.deepEqual(namesIn({ summary: "Share the kangaroo" } as never, names), []);
  });
});

describe("parseTranslation", () => {
  const source = { summary: "Riassunto del mazzo", notes: "Una nota" };

  test("accetta gli stessi campi e ripulisce spazi e a capo", () => {
    assert.deepEqual(parseTranslation(source, '{"summary":"  Deck summary \\r\\n ok ","notes":"A note"}'), { summary: "Deck summary \n ok", notes: "A note" });
  });

  test("rifiuta JSON rotto, campi mancanti o in più, valori non testuali o vuoti", () => {
    assert.equal(parseTranslation(source, "not json"), null);
    assert.equal(parseTranslation(source, '{"summary":"x"}'), null);
    assert.equal(parseTranslation(source, '{"summary":"x","notes":"y","extra":"z"}'), null);
    assert.equal(parseTranslation(source, '{"summary":"x","notes":3}'), null);
    assert.equal(parseTranslation(source, '{"summary":"   ","notes":"y"}'), null);
    assert.equal(parseTranslation(source, '["x"]'), null);
  });

  test("rifiuta una traduzione molto più lunga dell'originale", () => {
    assert.equal(parseTranslation({ summary: "Breve" }, JSON.stringify({ summary: "x".repeat(400) })), null);
  });
});

describe("translationRequest", () => {
  test("schema con esattamente i campi della guida, istruzioni in cache e fallback del modello", () => {
    const req = translationRequest(g("it", "Riassunto", { mulligan: "Tieni le carte da 1" }), "es" as never, ["Mulan"]);
    assert.equal(req.model, TRANSLATION_MODEL);
    const schema = req.output_config.format.schema as { properties: Record<string, unknown>; required: string[]; additionalProperties: boolean };
    assert.deepEqual(Object.keys(schema.properties), ["summary", "mulligan"]);
    assert.deepEqual(schema.required, ["summary", "mulligan"]);
    assert.equal(schema.additionalProperties, false);
    assert.equal(req.system[0].cache_control.type, "ephemeral");
    assert.equal(req.fallbacks, "default");
    assert.match(req.messages[0].content, /SOURCE LANGUAGE: Italian/);
    assert.match(req.messages[0].content, /TARGET LANGUAGE: Spanish/);
    assert.match(req.messages[0].content, /NAMES: Mulan/);
  });

  test("portoghese del Brasile: lingua d'arrivo con il você (20/10/2026)", () => {
    const req = translationRequest(g("en", "Game plan"), "pt" as never, []);
    assert.match(req.messages[0].content, /TARGET LANGUAGE: Brazilian Portuguese/);
    assert.match(req.messages[0].content, /"você"/);
  });

  test("tedesco: lingua d'arrivo con il du (20/10/2026)", () => {
    const req = translationRequest(g("en", "Game plan"), "de" as never, []);
    assert.match(req.messages[0].content, /TARGET LANGUAGE: German/);
    assert.match(req.messages[0].content, /"du"/);
  });
});

describe("parti generali (pacchetto GUIDE, 27/09/2026): i mazzi non cambiano", () => {
  test("guideHash dà le stesse impronte di prima della generalizzazione: le traduzioni salvate restano valide", () => {
    // valori calcolati con il codice del 26/09/2026, prima di textHash
    assert.equal(guideHash(g("it", "Mazzo aggro con Mulan", { strengths: "Curva bassa", notes: "Nota" })), "ddkdan0bgd");
    assert.equal(guideHash(g("es", "Plan")), "cefco0o2ne");
    assert.equal(textHash(["es", "Plan", "", "", "", "", "", ""]), "cefco0o2ne");
  });

  test("le istruzioni dei mazzi sono quelle del 20/10/2026 (impronta SHA-256: tedesco con il glossario del gioco)", () => {
    // fino al 06/10/2026: cfaf38c952aaddcb4e33503e4fdac9abb85d5e44d6841420bc4843a376a24413 (tre lingue)
    // 07/10/2026: 20942417f73164d41f52aca4f4aefc4eaaba5ccea79d59f41b49423b60413882 (francese con il glossario provvisorio)
    // 08/10/2026: 4bc9eff49034ca648f06a32c32f63a986f35abb34e2805d2806e440e25ebcee4 (glossario francese letto nel gioco)
    // 20/10/2026: d115ffa7dac5a08bdc60921cc6ffa6a3ca2dbd4c43c0e511675adbbe178b5f27 (portoghese del Brasile con il glossario del gioco)
    // 20/10/2026: 5c2cd841a7dc0da9302babb3bfbc6e0b4cece42e24b61898f7d03c2b3c081ae5 (tedesco con il glossario provvisorio)
    assert.equal(createHash("sha256").update(TRANSLATION_SYSTEM).digest("hex"), "ea952f1787a0fa3418d202a8034956c0b7bc9e67c7b08ce815d9ea20bd872aec");
    assert.ok(TRANSLATION_SYSTEM.endsWith(TRANSLATION_RULES));
  });

  test("guide della community: stesse regole e glossario, titolo tradotto dal 29/09/2026", () => {
    assert.ok(STRATEGY_GUIDE_TRANSLATION_SYSTEM.endsWith(TRANSLATION_RULES));
    assert.match(STRATEGY_GUIDE_TRANSLATION_SYSTEM, /heading_N/);
    assert.match(STRATEGY_GUIDE_TRANSLATION_SYSTEM, /"title" is the title of the guide/);
    assert.doesNotMatch(STRATEGY_GUIDE_TRANSLATION_SYSTEM, /never translated/);
    assert.match(TRANSLATION_RULES, /On Reveal = Alla rivelazione = Al revelar = À la révélation = Ao revelar = Beim Aufdecken/);
    assert.match(TRANSLATION_RULES, /Snipe = Tiro di precisione = Disparo certero = Tir de précision = Tiro certeiro = Präzisionsschuss/);
  });

  test("translationRequestFor: campi qualsiasi, lingua di partenza e istruzioni scelte da chi chiama", () => {
    const req = translationRequestFor({ summary: "Intro", heading_1: "Mulligan", body_1: "Tieni Mulan" }, "it", "en", [], STRATEGY_GUIDE_TRANSLATION_SYSTEM);
    const schema = req.output_config.format.schema as { properties: Record<string, unknown>; required: string[] };
    assert.deepEqual(Object.keys(schema.properties), ["summary", "heading_1", "body_1"]);
    assert.deepEqual(schema.required, ["summary", "heading_1", "body_1"]);
    assert.equal(req.system[0].text, STRATEGY_GUIDE_TRANSLATION_SYSTEM);
    assert.match(req.messages[0].content, /SOURCE LANGUAGE: Italian/);
    assert.match(req.messages[0].content, /TARGET LANGUAGE: English/);
    assert.match(req.messages[0].content, /NAMES: \(none\)/);
    // la richiesta dei mazzi è quella generale con le istruzioni dei mazzi
    const deck = translationRequest(g("it", "Riassunto"), "en" as never, []);
    assert.deepEqual(deck, translationRequestFor({ summary: "Riassunto" }, "it", "en", [], TRANSLATION_SYSTEM));
  });

  test("parseTranslation vale per un testo qualsiasi", () => {
    assert.deepEqual(parseTranslation({ summary: "Intro", heading_1: "Titolo" }, '{"summary":"Intro EN","heading_1":"Title"}'), { summary: "Intro EN", heading_1: "Title" });
    assert.equal(parseTranslation({ summary: "Intro", heading_1: "Titolo" }, '{"summary":"Intro EN"}'), null);
  });
});
