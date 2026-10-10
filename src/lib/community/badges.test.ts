/**
 * Test dei ruoli e dei permessi (`badges.ts`): `node --test src/lib/community/badges.test.ts`.
 * Decisioni di Pierluigi del 27/09/2026 (Staff, Creator, Autore, Pro, Community; Influencer tolto). Controlla anche che
 * il database dica le stesse cose (supabase/schema.sql: vincolo del tag, tetto ai mazzi, calendario e copertine dei
 * tornei), che lo script dello staff accetti gli stessi tag e che i dizionari abbiano un'etichetta per ognuno.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { sqlStatements } from "../../../scripts/schema-guard.mjs";
import {
  ANALYTICS_BADGES,
  AUTHOR_DECK_LIMIT,
  BADGES,
  BADGE_ORDER,
  COMMUNITY_DECK_LIMIT,
  GUIDE_BADGES,
  LISTING_BADGES,
  SHOWCASE_BADGES,
  UNLIMITED_BADGES,
  canListTournaments,
  canPublishGuides,
  canSeeAnalytics,
  isShowcaseBadge,
  normalizeBadge,
  publishedDeckCap,
  shownBadge,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./badges.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { SIGNED_BADGES } from "../tierstats.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "../dictionaries/en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it } from "../dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "../dictionaries/es.ts";

const dictionaries = { en, it, es };

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const sorted = (xs: readonly string[]) => [...xs].sort();
/** Gli elementi fra apici di un elenco SQL: "('creator','pro')" → ["creator", "pro"]. */
const quoted = (s: string) => [...s.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);

describe("ruoli e permessi", () => {
  test("cinque tag, Influencer non c'è più", () => {
    assert.deepEqual([...BADGES], ["community", "creator", "author", "pro", "staff"]);
    assert.deepEqual(sorted(BADGE_ORDER), sorted(BADGES), "l'ordine dell'interfaccia elenca tutti i tag");
    assert.ok(!(BADGES as readonly string[]).includes("influencer"));
  });
  test("un valore sconosciuto vale community (anche influencer, prima della migrazione)", () => {
    assert.equal(normalizeBadge("influencer"), "community");
    assert.equal(normalizeBadge(null), "community");
    assert.equal(normalizeBadge(undefined), "community");
    assert.equal(normalizeBadge("Staff"), "community", "i tag si scrivono in minuscolo");
    assert.equal(normalizeBadge(42), "community");
    for (const b of BADGES) assert.equal(normalizeBadge(b), b);
    assert.equal(shownBadge("community"), null, "la community non si mostra");
    assert.equal(shownBadge("influencer"), null, "un tag sconosciuto nemmeno");
    assert.equal(shownBadge("author"), "author");
  });
  test("tetto ai mazzi pubblicati: community 5, Autore 20, Creator, Pro, Staff e admin nessuno", () => {
    assert.equal(COMMUNITY_DECK_LIMIT, 5);
    assert.equal(AUTHOR_DECK_LIMIT, 20);
    assert.equal(publishedDeckCap({ badge: "community", role: "user" }), 5);
    assert.equal(publishedDeckCap({ badge: "author", role: "user" }), 20);
    for (const b of ["creator", "pro", "staff"]) assert.equal(publishedDeckCap({ badge: b, role: "user" }), Infinity, b);
    assert.equal(publishedDeckCap({ badge: "community", role: "admin" }), Infinity);
    assert.equal(publishedDeckCap({ badge: "influencer", role: "user" }), 5, "valore sconosciuto");
    assert.equal(publishedDeckCap(null), 5, "profilo non letto");
    assert.ok(AUTHOR_DECK_LIMIT > COMMUNITY_DECK_LIMIT);
  });
  test("calendario e copertine dei tornei: Creator, Pro, Staff e admin; l'Autore no", () => {
    for (const b of ["creator", "pro", "staff"]) assert.ok(canListTournaments({ badge: b, role: "user" }), b);
    for (const b of ["author", "community", "influencer", null]) assert.ok(!canListTournaments({ badge: b, role: "user" }), String(b));
    assert.ok(canListTournaments({ badge: "community", role: "admin" }));
    assert.ok(!canListTournaments(null));
  });
  test("profilo vetrina e directory: Creator, Autore, Pro, Staff", () => {
    for (const b of ["creator", "author", "pro", "staff"]) assert.ok(isShowcaseBadge(b), b);
    for (const b of ["community", "influencer", "", null, undefined, "admin"]) assert.ok(!isShowcaseBadge(b), String(b));
  });
  test("guide pubblicate direttamente (pacchetto GUIDE; lo SQL qui sotto e in guides.test.ts): Autore, Creator, Pro, Staff e admin", () => {
    for (const b of ["author", "creator", "pro", "staff"]) assert.ok(canPublishGuides(b, "user"), b);
    assert.ok(canPublishGuides("community", "admin"));
    for (const b of ["community", "influencer", null]) assert.ok(!canPublishGuides(b, "user"), String(b));
    assert.ok(!canPublishGuides(undefined));
  });
  test("OriginsMeta Analytics in prova (10/10/2026): Creator, Pro, Staff e admin; l'Autore e la community no", () => {
    for (const b of ["creator", "pro", "staff"]) assert.ok(canSeeAnalytics(b, "user"), b);
    assert.ok(canSeeAnalytics("community", "admin"));
    for (const b of ["author", "community", "influencer", null]) assert.ok(!canSeeAnalytics(b, "user"), String(b));
    assert.ok(!canSeeAnalytics(undefined));
  });
  test("gli elenchi dei permessi usano solo tag esistenti", () => {
    for (const list of [UNLIMITED_BADGES, LISTING_BADGES, SHOWCASE_BADGES, GUIDE_BADGES, ANALYTICS_BADGES]) for (const b of list) assert.ok((BADGES as readonly string[]).includes(b), b);
  });
  test("tier list firmate: gli stessi tag del profilo vetrina (tierstats.ts non importa nulla, quindi li ripete)", () => {
    assert.deepEqual(sorted(SIGNED_BADGES), sorted(SHOWCASE_BADGES));
  });
});

describe("database: stesse regole in supabase/schema.sql", () => {
  const schema = read("../../../supabase/schema.sql");
  const stmts = sqlStatements(schema);
  const last = (re: RegExp) => stmts.filter((s) => re.test(s)).at(-1) ?? "";

  test("vincolo del tag: i cinque tag, dopo il passaggio degli Influencer a Creator", () => {
    const add = stmts.filter((s) => s.startsWith("alter table public.profiles add constraint profiles_badge_check"));
    assert.equal(add.length, 1, "un solo vincolo del tag");
    const m = /check \(badge in \(([^)]*)\)\)/.exec(add[0]);
    assert.ok(m, add[0]);
    assert.deepEqual(quoted(m[1]), [...BADGES]);
    const update = stmts.indexOf("update public.profiles set badge = 'creator' where badge = 'influencer'");
    assert.ok(update >= 0, "manca il passaggio degli Influencer a Creator");
    assert.ok(update < stmts.indexOf(add[0]), "il passaggio va prima del vincolo, che altrimenti fallirebbe");
    assert.ok(stmts.indexOf("alter table public.profiles drop constraint if exists profiles_badge_check") < update, "il vincolo vecchio va tolto prima");
  });
  test("nessun'altra istruzione nomina influencer (a parte la descrizione della colonna)", () => {
    const rest = stmts.filter((s) => s.includes("influencer") && s !== "update public.profiles set badge = 'creator' where badge = 'influencer'" && !s.startsWith("comment on "));
    assert.deepEqual(rest, []);
  });
  test("tetto ai mazzi (max_published_decks): stessi numeri e stessi tag senza tetto", () => {
    const fn = last(/^create (?:or replace )?function public\.max_published_decks\(/);
    assert.ok(fn, "manca max_published_decks");
    const unlimited = /when p\.role = 'admin' or p\.badge in \(([^)]*)\) then 2147483647/.exec(fn);
    assert.ok(unlimited, fn);
    assert.deepEqual(sorted(quoted(unlimited[1])), sorted(UNLIMITED_BADGES));
    assert.ok(fn.includes(`when p.badge = 'author' then ${AUTHOR_DECK_LIMIT}`), "tetto dell'Autore diverso fra codice e database");
    assert.ok(fn.includes(`else ${COMMUNITY_DECK_LIMIT} end`), "tetto della community diverso fra codice e database");
    const enforce = last(/^create (?:or replace )?function public\.enforce_deck_limit\(/);
    assert.ok(enforce.includes(`coalesce(public.max_published_decks(new.owner), ${COMMUNITY_DECK_LIMIT})`));
  });
  test("calendario dei tornei (protect_tournament_listing) e copertine: gli stessi tag del codice", () => {
    const fn = last(/^create (?:or replace )?function public\.protect_tournament_listing\(/);
    for (const text of [fn, stmts.find((s) => s.includes('create policy "badged users upload tournament covers"')) ?? ""]) {
      const m = /p\.badge in \(([^)]*)\) or p\.role = 'admin'/.exec(text);
      assert.ok(m, text.slice(0, 200));
      assert.deepEqual(sorted(quoted(m[1])), sorted(LISTING_BADGES));
    }
    // anche la prima definizione (sovrascritta più sotto) resta allineata: chi legge il file non trova elenchi vecchi
    for (const s of stmts.filter((x) => /p\.badge in \(/.test(x))) {
      assert.doesNotMatch(s, /influencer/);
    }
  });
  test("guide della community (can_publish_guides) e copertine caricate: gli stessi tag del codice", () => {
    // Qui, in un test già in `npm test`, perché il confronto giri anche prima che l'integratore registri guides.test.ts.
    // Il blocco GUIDE sta in schema.sql; il ripiego su supabase/wave2-GUIDE.sql resta per i pacchetti futuri.
    const wave = new URL("../../../supabase/wave2-GUIDE.sql", import.meta.url);
    const all = sqlStatements(schema + (existsSync(wave) ? `\n${readFileSync(wave, "utf8")}` : ""));
    const fn = all.filter((x) => /^create (?:or replace )?function public\.can_publish_guides\(/.test(x)).at(-1) ?? "";
    assert.ok(fn, "manca can_publish_guides (supabase/wave2-GUIDE.sql o schema.sql)");
    const m = /p\.role = 'admin' or p\.badge in \(([^)]*)\)/.exec(fn);
    assert.ok(m, fn);
    assert.deepEqual(sorted(quoted(m[1])), sorted(GUIDE_BADGES));
    for (const badge of [...BADGES, "influencer", null]) {
      for (const role of ["user", "admin", null]) assert.equal(canPublishGuides(badge, role), role === "admin" || (badge !== null && quoted(m[1]).includes(badge)), `${badge}/${role}`);
    }
    const guard = all.filter((x) => /^create (?:or replace )?function public\.guard_community_guide\(/.test(x)).at(-1) ?? "";
    const cover = /p\.role = 'admin' or p\.badge in \(([^)]*)\)\)\) then raise exception 'guide_cover_role'/.exec(guard);
    assert.ok(cover, "copertina caricata solo per i ruoli con vetrina");
    assert.deepEqual(sorted(quoted(cover[1])), sorted(SHOWCASE_BADGES));
  });
});

describe("script e interfaccia", () => {
  test("scripts/set-badge.mjs accetta gli stessi tag, con gli alias dell'Autore, e rifiuta influencer", () => {
    const src = read("../../../scripts/set-badge.mjs");
    const m = /const BADGES = \[([^\]]*)\]/.exec(src);
    assert.ok(m);
    assert.deepEqual(sorted([...m[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1])), sorted(BADGES));
    for (const alias of ["autore", "autor"]) assert.match(src, new RegExp(`${alias}: "author"`));
    assert.match(src, /typed === "influencer"/, "l'errore dedicato a chi scrive ancora influencer");
    // chi passa a un ruolo che non pubblica sul calendario esce dal calendario: stesso elenco di LISTING_BADGES
    const listing = /const LISTING = \[([^\]]*)\]/.exec(src);
    assert.ok(listing);
    assert.deepEqual(sorted([...listing[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1])), sorted(LISTING_BADGES));
    // chi perde il ruolo che pubblica le guide le ritrova tra le bozze (revisione del 27/09/2026): stesso elenco di GUIDE_BADGES
    const guides = /const GUIDES = \[([^\]]*)\]/.exec(src);
    assert.ok(guides);
    assert.deepEqual(sorted([...guides[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1])), sorted(GUIDE_BADGES));
    assert.match(src, /update public\.community_guides set status = 'draft' where owner = \$1 and status = 'published'/);
  });
  test("dizionari: un'etichetta per ogni tag, Creator uguale nelle tre lingue; il tetto dell'Autore nel messaggio", () => {
    const expected: Record<string, Record<string, string>> = {
      en: { community: "Community", creator: "Creator", author: "Author", pro: "Pro", staff: "Staff" },
      it: { community: "Community", creator: "Creator", author: "Autore", pro: "Pro", staff: "Staff" },
      es: { community: "Community", creator: "Creator", author: "Autor", pro: "Pro", staff: "Staff" },
    };
    for (const [locale, labels] of Object.entries(expected)) {
      const d = dictionaries[locale as keyof typeof dictionaries];
      assert.deepEqual({ ...d.community.badges }, labels, locale);
      assert.match(d.community.errors.deckLimitAuthor, new RegExp(`\\b${AUTHOR_DECK_LIMIT}\\b`), `${locale}: deckLimitAuthor`);
      assert.match(d.community.errors.deckLimit, new RegExp(`\\b${COMMUNITY_DECK_LIMIT}\\b`), `${locale}: deckLimit`);
      for (const text of [d.tournaments.create.listedLocked, d.tournaments.create.coverLocked]) {
        assert.doesNotMatch(text, /influencer/i, locale);
        assert.ok(text.includes(labels.creator) && !text.includes(labels.author), `${locale}: calendario e copertine per il Creator, non per l'Autore`);
      }
    }
  });
  test("stili: una pastiglia per ogni tag (cardArt.ts), Creator col gradiente e Autore in celeste", () => {
    const src = read("../cardArt.ts");
    const m = /export const badgeStyle: Record<string, string> = \{([^}]*)\}/.exec(src);
    assert.ok(m);
    const got = Object.fromEntries([...m[1].matchAll(/(\w+): "([^"]*)"/g)].map((x) => [x[1], x[2]]));
    assert.deepEqual(sorted(Object.keys(got)), sorted(BADGES));
    assert.equal(got.creator, "badge-creator");
    assert.equal(got.author, "badge-author");
    const css = read("../../app/globals.css");
    assert.match(css, /\.badge-creator \{[^}]*--grad-ig/, "il Creator ha il gradiente stile Instagram");
    assert.match(css, /\.badge-author \{[^}]*--color-sky/, "l'Autore è celeste");
    assert.doesNotMatch(css, /\.badge-ig\b/);
  });
});
