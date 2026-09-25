/**
 * Test dei dati strutturati del sito (`entities.ts` ed `events.ts` in questa cartella) e dei testi del pacchetto LD
 * dell'Ondata 2 (`entityLabels.ts`), con il runner integrato di Node: `node --test src/lib/jsonld/jsonld.test.ts`.
 * Controlla il grafo delle entità (un `@id` per entità, uguale in ogni lingua; Koin Games per `@id` come sviluppatore,
 * editore e organizzatore; Valve per lo Steam Next Fest; nessun logo di Koin; ogni rimando per `@id` punta a un'entità
 * che esiste), le pagine che firmano (news e guide con la Person unica, nessun `…#person` scritto a mano sotto src/app),
 * gli orari degli eventi (ISO 8601 con fuso, nello stesso giorno della data della scheda), le immagini degli eventi in
 * public/media, una sola valuta per le offerte gratuite, i testi nelle tre lingue (la non affiliazione a Koin Games c'è
 * sempre, il "fair use" non più, il permesso di Koin solo quando Pierluigi lo accende), le regole del mazzo nei dati del
 * deck builder, le tagline degli autori, il modulo leggero degli autori e la frase sulla "patch 0.7".
 *
 * Come in newsMeta.test.ts, i moduli del sito importano file senza estensione: un hook di risoluzione dei moduli di Node
 * (`module.registerHooks`, Node ≥ 22.15) aggiunge `.ts` agli import relativi prima di caricarli.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Locale } from "../i18n";

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
    return next(specifier, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const entities: typeof import("./entities") = await import("./entities.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const eventsLd: typeof import("./events") = await import("./events.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const eventsData: typeof import("../data/events") = await import("../data/events.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const authorsData: typeof import("../data/authors") = await import("../data/authors.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const labelsModule: typeof import("../entityLabels") = await import("../entityLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const discord: typeof import("../discord") = await import("../discord.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const newsData: typeof import("../data/news") = await import("../data/news.ts");

const { organization, organizationId, videoGame, videoGameId, koinGames, koinGamesId, gameLinks, personId, person, personRef, memberId, memberRef, website, websiteId, FREE_OFFER_CURRENCY } =
  entities;
const { eventId, eventNode, festivalNode } = eventsLd;
const { events, steamNextFest } = eventsData;
const { authors, founders, nicknameOf, authorByUsername } = authorsData;
const { entityLabels, deckBuilderApp, aboutChecks, aboutDisclaimer, KOIN_PERMISSION_PUBLIC } = labelsModule;

type Json = Record<string, unknown>;
const locales: Locale[] = ["en", "it", "es"];
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** I file .ts e .tsx sotto una cartella del progetto (percorso relativo a questo file), con il loro testo. */
function sources(dir: string): { file: string; text: string }[] {
  const root = fileURLToPath(new URL(dir, import.meta.url));
  return readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => ({ file: `${dir}${f.replace(/\\/g, "/")}`, text: readFileSync(`${root}/${f}`, "utf8") }));
}

/** Tutti i valori di `@id` usati come rimando ({ "@id": … } senza altri dati obbligatori) dentro un nodo. */
function references(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => references(n, out));
  else if (node && typeof node === "object") {
    const o = node as Json;
    if (typeof o["@id"] === "string" && !("@context" in o)) out.push(o["@id"]);
    for (const [k, v] of Object.entries(o)) if (k !== "@id") references(v, out);
  }
  return out;
}

describe("entità del sito", () => {
  test("un @id per entità, sul dominio e senza la lingua", () => {
    const ids = [organizationId, videoGameId, koinGamesId, personId("davdas")];
    for (const id of ids) assert.match(id, /^https:\/\/originsmeta\.com\/#[a-z-]+$/);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(organization["@id"], organizationId);
    assert.equal(videoGame["@id"], videoGameId);
    assert.equal(koinGames["@id"], koinGamesId);
    // un iscritto della community: un @id solo per le tre lingue, diverso da quello di un autore del sito
    assert.equal(memberId("albeo_o"), "https://originsmeta.com/#user-albeo_o");
  });

  test("il gioco rimanda a Koin Games per @id come sviluppatore ed editore; nessun logo né immagine di Koin", () => {
    assert.deepEqual(videoGame.developer, { "@id": koinGamesId });
    assert.deepEqual(videoGame.publisher, { "@id": koinGamesId });
    for (const node of [koinGames, videoGame, entities.koinGamesRef]) {
      assert.ok(!("logo" in node) && !("image" in node), `${String(node["@id"])}: niente logo o immagine di Koin nei dati strutturati`);
    }
    assert.match(String(videoGame.disambiguatingDescription), /Koin Games/);
    assert.match(String(videoGame.disambiguatingDescription), /not to be confused with Riftbound: Origins/);
  });

  test("gli indirizzi ufficiali del gioco sono quelli del footer", () => {
    const block = read("../../components/Footer.tsx").match(/export const officialLinks = \{([\s\S]*?)\};/)?.[1] ?? "";
    const official = Object.fromEntries([...block.matchAll(/(\w+): "([^"]+)"/g)].map((m) => [m[1], m[2]]));
    assert.ok(Object.keys(official).length >= 6, "officialLinks letto da Footer.tsx");
    for (const [key, url] of Object.entries(gameLinks)) assert.equal(url, official[key], `gameLinks.${key}`);
    assert.deepEqual(videoGame.sameAs, [gameLinks.steam, gameLinks.site, gameLinks.x, gameLinks.youtube]);
    assert.equal(koinGames.url, official.koin);
  });

  test("OriginsMeta: fondatori con la Person unica, il nostro Discord, la non affiliazione e come verifichiamo i dati", () => {
    assert.deepEqual(
      founders.map((a) => a.slug),
      ["pierluigi-cella", "davdas"],
    );
    assert.deepEqual(
      (organization.founder as Json[]).map((f) => f["@id"]),
      founders.map((a) => personId(a.slug)),
    );
    assert.deepEqual(organization.sameAs, [discord.ORIGINSMETA_DISCORD]);
    assert.match(String(organization.description), /Not affiliated with Koin Games\.$/);
    assert.equal(organization.publishingPrinciples, "https://originsmeta.com/en/about#how-we-check");
    assert.match(read("../../app/[locale]/(site)/about/page.tsx"), /id="how-we-check"/);
  });

  test("la stessa persona in tutte le lingue: pagina autore, firma di news e guide, profilo della community", () => {
    const ids = locales.map((l) => person({ slug: "davdas", name: "Luigi “Davdas” Ragoni", url: `/${l}/authors/davdas` })["@id"]);
    assert.deepEqual(ids, [personId("davdas"), personId("davdas"), personId("davdas")]);
    const ref = personRef({ slug: "davdas", name: "Luigi “Davdas” Ragoni" }, "/it/authors/davdas");
    assert.deepEqual(ref, { "@type": "Person", "@id": personId("davdas"), name: "Luigi “Davdas” Ragoni", url: "https://originsmeta.com/it/authors/davdas" });
    const page = entities.authorProfilePage({ locale: "es", path: "/es/authors/davdas", name: "Luigi “Davdas” Ragoni", slug: "davdas" });
    // Google vuole nome e pagina nel mainEntity di una ProfilePage, anche se il nodo Person completo è nella stessa pagina
    assert.deepEqual(page.mainEntity, { "@type": "Person", "@id": personId("davdas"), name: "Luigi “Davdas” Ragoni", url: "https://originsmeta.com/es/authors/davdas" });
    assert.deepEqual(memberRef({ username: "albeo_o", name: "albeo" }, "/en/u/albeo_o"), {
      "@type": "Person",
      "@id": memberId("albeo_o"),
      name: "albeo",
      url: "https://originsmeta.com/en/u/albeo_o",
    });
  });

  test("le voci di una lista possono dire l'entità e il dato che la pagina mostra accanto", () => {
    const list = entities.collectionPage({
      locale: "en",
      path: "/en/tier-list/most-played",
      name: "x",
      description: "x",
      items: [
        { name: "Dorothy", path: "/en/cards/dorothy", description: "In 2 decks · 13%" },
        { name: "Luigi “Davdas” Ragoni", path: "/en/authors/davdas", id: personId("davdas") },
      ],
    });
    assert.deepEqual((list.mainEntity as Json).itemListElement, [
      { "@type": "ListItem", position: 1, name: "Dorothy", url: "https://originsmeta.com/en/cards/dorothy", description: "In 2 decks · 13%" },
      { "@type": "ListItem", position: 2, name: "Luigi “Davdas” Ragoni", url: "https://originsmeta.com/en/authors/davdas", item: { "@id": personId("davdas") } },
    ]);
  });

  test("ogni rimando per @id punta a un'entità che esiste", () => {
    const upcoming = events.filter((e) => e.ld);
    const nodes: Json[] = [
      organization,
      koinGames,
      videoGame,
      ...locales.map((l) => website(l, "x")),
      ...locales.flatMap((l) => upcoming.map((e) => eventNode(e, l))),
      entities.webApplication({ locale: "en", path: "/en/deck-builder", name: "x", description: "x" }),
      entities.aboutPage({ locale: "it", path: "/it/about", name: "x", description: "x" }),
      entities.authorProfilePage({ locale: "es", path: "/es/authors/davdas", name: "x", slug: "davdas" }),
      entities.collectionPage({ locale: "en", path: "/en/authors", name: "x", description: "x", items: authors.map((a) => ({ name: a.name, path: "/x", id: personId(a.slug) })) }),
      entities.collectionPage({ locale: "en", path: "/en/tournaments", name: "x", description: "x", items: upcoming.map((e) => ({ name: "x", path: "/x", id: eventId(e.slug) })) }),
    ];
    // entità definite: i nodi del layout (su ogni pagina), le persone (pagine autore), gli eventi (/tournaments)
    const known = new Set<string>([
      organizationId,
      videoGameId,
      koinGamesId,
      ...locales.map((l) => websiteId(l)),
      ...authors.map((a) => personId(a.slug)),
      ...upcoming.map((e) => eventId(e.slug)),
      eventId(steamNextFest.slug),
    ]);
    const missing = nodes.flatMap((n) => references(n)).filter((id) => !known.has(id));
    assert.deepEqual([...new Set(missing)], []);
  });
});

/*
  Le pagine che firmano. Il test qui sopra prova i costruttori, non le pagine: prima dell'Ondata 2 news e guide scrivevano
  a mano `author: { "@id": `${authorUrl}#person` }`, cioè una Person per lingua che dal pacchetto LD nessuna pagina
  dichiara più. Questi due test leggono il sorgente delle pagine: finché le note di integrazione 2 e 3 del pacchetto LD
  non sono applicate falliscono, apposta, e il merge non può lasciare le firme staccate dalle pagine autore.
*/
describe("pagine che firmano (sorgente)", () => {
  test("news e guide usano la Person unica dell'autore (`personRef`), non `…/authors/<slug>#person`", () => {
    for (const page of ["../../app/[locale]/(site)/news/[slug]/page.tsx", "../../app/[locale]/(site)/guides/[slug]/page.tsx"]) {
      const text = read(page);
      // assert.ok e non assert.match: in caso di errore il messaggio dice cosa fare, senza stampare tutto il file
      assert.ok(/personRef\(/.test(text), `${page}: la firma nei dati strutturati deve essere personRef(author, authorPath) (nota di integrazione 2/3 del pacchetto LD)`);
      assert.ok(!/#person(?![-\w])/.test(text), `${page}: un @id "…#person" scritto a mano (nota di integrazione 2/3 del pacchetto LD)`);
    }
  });

  test("nessuna pagina sotto src/app scrive a mano l'@id di una persona", () => {
    const offenders = sources("../../app/").filter((s) => /#person(?![-\w])|#user-/.test(s.text.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, "")));
    assert.deepEqual(
      offenders.map((s) => s.file),
      [],
      "gli @id delle persone si scrivono solo con personId/personRef e memberId/memberRef (src/lib/jsonld/entities.ts)",
    );
  });
});

describe("moduli", () => {
  test("il grafo del layout non si porta dietro news e guide: entities.ts legge il nucleo leggero degli autori", () => {
    const ent = read("./entities.ts");
    assert.match(ent, /from "\.\.\/data\/authorsCore"/);
    assert.doesNotMatch(ent, /from "\.\.\/data\/authors"/);
    // il nucleo importa solo tipi
    const core = read("../data/authorsCore.ts");
    const imports = [...core.matchAll(/^import .*$/gm)].map((m) => m[0]);
    assert.ok(imports.length > 0 && imports.every((i) => /^import type /.test(i)), imports.join("\n"));
  });

  test("nessun componente client importa i dati strutturati (restano sul server)", () => {
    const offenders = sources("../../").filter((s) => /^\s*["']use client["']/.test(s.text) && /from "@\/(?:components\/JsonLd|lib\/jsonld\/[^"]+)"/.test(s.text));
    assert.deepEqual(
      offenders.map((s) => s.file),
      [],
    );
  });

  test("una sola valuta per le offerte a prezzo 0 in tutto il sito", () => {
    assert.match(FREE_OFFER_CURRENCY, /^[A-Z]{3}$/);
    const literal = sources("../../").flatMap((s) => [...s.text.matchAll(/priceCurrency:\s*"([A-Z]{3})"/g)].map((m) => ({ file: s.file, currency: m[1] })));
    assert.deepEqual(
      literal.filter((x) => x.currency !== FREE_OFFER_CURRENCY),
      [],
    );
    assert.equal((entities.webApplication({ locale: "en", path: "/x", name: "x", description: "x" }).offers as Json).priceCurrency, FREE_OFFER_CURRENCY);
  });
});

describe("eventi", () => {
  const cup = events.find((e) => e.slug === "next-fest-tournament");
  const ranked = events.find((e) => e.slug === "steam-next-fest");

  test("Crimson Cup: nome ufficiale, inizio con fuso, Koin come organizzatore, immagine ufficiale, iscrizione gratuita", () => {
    assert.ok(cup);
    for (const l of locales) {
      const node = eventNode(cup, l);
      assert.equal(node["@id"], eventId("next-fest-tournament"), l);
      assert.equal(node.name, "Crimson Cup", l);
      assert.match(String(node.alternateName), /Origins TCG/, l);
      assert.equal(node.startDate, "2026-10-20T19:00:00+02:00", l);
      assert.equal(node.endDate, "2026-10-25", l);
      assert.equal((node.organizer as Json)["@id"], koinGamesId, l);
      assert.equal(node.image, "https://originsmeta.com/media/news-crimson-cup.webp", l);
      assert.equal(node.isAccessibleForFree, true, l);
      assert.deepEqual(node.offers, { "@type": "Offer", price: "0", priceCurrency: FREE_OFFER_CURRENCY, url: "https://discord.gg/originstcg" }, l);
      assert.equal(node.url, `https://originsmeta.com/${l}/tournaments#next-fest-tournament`, l);
      // il torneo di Koin dello Steam Next Fest: il festival è il superEvent (organizzato da Valve), come per la classificata
      assert.equal((node.superEvent as Json)["@id"], eventId(steamNextFest.slug), l);
      // il titolo visibile resta quello di prima (cambio editoriale da far decidere a Pierluigi), con il nome dentro
      assert.match(cup.title[l], /Crimson Cup/, l);
    }
  });

  test("Steam Next Fest: il festival lo organizza Valve, la classificata nella demo è di Koin", () => {
    assert.ok(ranked);
    const node = eventNode(ranked, "en");
    assert.match(String(node.name), /^Origins TCG/);
    assert.equal((node.organizer as Json)["@id"], koinGamesId);
    const fest = node.superEvent as Json;
    assert.deepEqual(fest, festivalNode());
    assert.equal((fest.organizer as Json).name, "Valve");
    assert.equal(fest.startDate, "2026-10-19T10:00:00-07:00");
    assert.equal(fest.endDate, "2026-10-26");
    // la classificata parte con il festival: stesso giorno, e nessun orario inventato per l'evento di Koin
    assert.equal(node.startDate, steamNextFest.startAt.slice(0, 10));
    // nessuna offerta: non c'è un'iscrizione, e un prezzo 0 verso la pagina del gioco completo direbbe "il gioco è gratis"
    assert.ok(!("offers" in node) && !("isAccessibleForFree" in node));
  });

  test("gli orari sono ISO 8601 con il fuso e cadono nel giorno della scheda", () => {
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
    const timed = events.flatMap((e) => (e.ld?.startAt ? [{ slug: e.slug, start: e.start, at: e.ld.startAt }] : []));
    assert.ok(timed.length >= 1);
    for (const e of timed) {
      assert.match(e.at, iso, e.slug);
      assert.equal(e.at.slice(0, 10), e.start, e.slug);
    }
    assert.match(steamNextFest.startAt, iso);
  });

  test("le immagini degli eventi esistono in public/media e i nomi sono in ogni lingua", () => {
    for (const e of events) {
      if (!e.ld) continue;
      if (e.ld.image) assert.ok(existsSync(new URL(`../../../public${e.ld.image}`, import.meta.url)), `${e.slug}: ${e.ld.image}`);
      for (const l of locales) {
        if (e.ld.name) assert.ok(e.ld.name[l]?.trim(), `${e.slug} [${l}]: name`);
        if (e.ld.alternateName) assert.ok(e.ld.alternateName[l]?.trim(), `${e.slug} [${l}]: alternateName`);
      }
    }
  });

  test("un evento non ufficiale non ha Koin come organizzatore", () => {
    const base = events[0];
    const node = eventNode({ ...base, slug: "prova", official: false, ld: undefined }, "en");
    assert.ok(!("organizer" in node));
    assert.ok(!("isAccessibleForFree" in node) && !("offers" in node));
    assert.equal(node.image, "https://originsmeta.com/media/og.jpg");
  });
});

describe("testi del pacchetto (entityLabels.ts)", () => {
  test("stesse voci in ogni lingua, nessun testo vuoto", () => {
    for (const l of locales) {
      const x = entityLabels[l];
      assert.equal(x.about.check.length, entityLabels.en.about.check.length, l);
      assert.equal(x.builder.features.length, entityLabels.en.builder.features.length, l);
      const strings: string[] = JSON.stringify(x).match(/"(?:[^"\\]|\\.)*"/g) ?? [];
      assert.ok(!strings.includes('""'), `${l}: testo vuoto`);
    }
  });

  test("la non affiliazione a Koin Games non si toglie mai; niente fair use; il permesso del 19 settembre solo quando è acceso", () => {
    const notAffiliated: Record<Locale, RegExp> = {
      en: /^OriginsMeta is not affiliated with, endorsed by or sponsored by Koin Games\./,
      it: /^OriginsMeta non è affiliato a Koin Games, né approvato o sponsorizzato da Koin Games\./,
      es: /^OriginsMeta no está afiliado a Koin Games/,
    };
    const permission: Record<Locale, RegExp> = { en: /19 September 2026/, it: /19 settembre 2026/, es: /19 de septiembre de 2026/ };
    for (const l of locales) {
      const { disclaimer, disclaimerPermission } = entityLabels[l].about;
      for (const text of [disclaimer, disclaimerPermission]) {
        assert.match(text, notAffiliated[l], l);
        assert.doesNotMatch(text, /fair use/i, l);
      }
      // la versione pubblicata oggi non rende pubblico il permesso; quella pronta sì
      assert.doesNotMatch(disclaimer, permission[l], l);
      assert.match(disclaimerPermission, permission[l], l);
      assert.equal(aboutDisclaimer(l), KOIN_PERMISSION_PUBLIC ? disclaimerPermission : disclaimer, l);
    }
  });

  test("description di /about fra 120 e 158 caratteri, con le stesse fonti della pagina", () => {
    for (const l of locales) {
      const text = entityLabels[l].about.description;
      assert.ok(text.length >= 120 && text.length <= 158, `${l}: ${text.length} caratteri`);
      assert.match(text, /Origins TCG/, l);
      assert.match(text, /World of Origins/, l);
    }
  });

  test('"Come verifichiamo i dati": data e numero dalla verifica, nessun segnaposto rimasto', () => {
    for (const l of locales) {
      const checks = aboutChecks(l, { date: "DATA", count: 999, textsDate: "TESTI" });
      assert.equal(checks.length, entityLabels[l].about.check.length, l);
      const all = checks.join(" ");
      assert.doesNotMatch(all, /\{\w+\}/, `${l}: segnaposto non sostituito`);
      for (const v of ["DATA", "999", "TESTI"]) assert.ok(all.includes(v), `${l}: manca ${v}`);
      // nessun numero di carte scritto a mano: arriva da cardsVerified
      assert.doesNotMatch(entityLabels[l].about.check.join(" "), /\b1(?:22|6)\b/, l);
    }
  });

  test("segnaposto delle frasi con un link", () => {
    for (const l of locales) {
      assert.match(entityLabels[l].about.newToGame, /\{link\}/, l);
      assert.match(entityLabels[l].about.checkErrors, /\{email\}/, l);
    }
  });

  test("deck builder: i numeri sono quelli di RULES, la regola Conquest è quella della Crimson Cup", () => {
    for (const l of locales) {
      const app = deckBuilderApp(l);
      for (const s of [app.description, ...app.features]) assert.doesNotMatch(s, /\{\w+\}/, `${l}: segnaposto non sostituito in "${s}"`);
      assert.match(app.description, /Koin Games/, l);
      assert.match(app.description, /25/, l);
      assert.ok(app.features.some((f) => /\b8\b/.test(f) && /Conquest/.test(f)), `${l}: Conquest con 8 carte uniche`);
    }
    assert.match(deckBuilderApp("en").features[0], /1 Legendary plus 12 base cards, each played as 2 copies \(25 cards\)/);
  });
});

describe("autori", () => {
  test("la tagline, che è la meta description, sta fra 120 e 158 caratteri in ogni lingua", () => {
    for (const a of authors) {
      for (const l of locales) {
        const n = a.tagline[l].length;
        assert.ok(n >= 120 && n <= 158, `${a.slug} [${l}]: ${n} caratteri`);
      }
    }
  });

  test("nickname e account della community", () => {
    assert.deepEqual(
      authors.map((a) => nicknameOf(a)),
      ["Aldry", "Davdas"],
    );
    assert.equal(authorByUsername("luigidavdasragoni")?.slug, "davdas");
    assert.equal(authorByUsername(null), undefined);
    assert.equal(authorByUsername("nessuno"), undefined);
  });
});

describe("news della patch del 21 settembre", () => {
  test('"patch 0.7" nel testo e nelle FAQ, in ogni lingua (i creator la chiamano così, Steam non le dà un numero)', () => {
    const item = newsData.news.find((n) => n.slug === "demo-patch-notes-0921");
    assert.ok(item);
    // un articolo già uscito che cambia dichiara la data (lastmod della sitemap, dateModified); il paragrafo
    // "Aggiornamento del …" lo controlla newsMeta.test.ts
    assert.ok(item.updated && item.updated > item.date, "updated");
    for (const l of locales) {
      assert.match(item.body?.[l] ?? "", /patch 0\.7/, `${l}: testo`);
      // la domanda spagnola dice "parche 0.7" (è come si cerca), la risposta riporta il nome che usano i creator
      assert.ok(
        item.faq?.[l]?.some((f) => /(patch|parche) 0\.7/.test(f.q) && /patch 0\.7/.test(f.a)),
        `${l}: FAQ`,
      );
    }
    // "parche 0.7" non è documentato fra i creator (le fonti sono video in inglese): il testo non lo attribuisce a loro
    assert.doesNotMatch(item.body?.es ?? "", /parche 0\.7/);
    assert.ok(item.faq?.es?.every((f) => !/parche 0\.7/.test(f.a)));
  });
});
