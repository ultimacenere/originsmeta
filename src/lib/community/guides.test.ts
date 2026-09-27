/**
 * Test delle guide della community (pacchetto GUIDE, 27/09/2026) con il runner integrato di Node:
 * `node --test src/lib/community/guides.test.ts`.
 *
 * - Database: le regole di supabase/wave2-GUIDE.sql (accodato a schema.sql dall'integratore: il test legge i due file
 *   insieme, così vale prima e dopo l'unione) coincidono con il codice: ruoli di `can_publish_guides` uguali a
 *   `canPublishGuides` di badges.ts, limiti del testo, categorie, copertine, tetti, grant per colonna, policy, nessuna
 *   grant su public.profiles (schema-guard.mjs non trova problemi).
 * - Regole pure di guides.ts: testo semplice, lettura del modulo, parole e soglia, lingue e traduzioni, sitemap.
 * - Messaggi Discord (guideDiscord.ts) ed etichette (communityGuideLabels.ts: stesse chiavi e segnaposto nelle tre lingue).
 *
 * I moduli sono scritti per Next (import senza estensione): prima di caricarli il test registra un hook di risoluzione
 * dei moduli di Node (`module.registerHooks`, come deckQuality.test.ts) che aggiunge `.ts` agli import senza estensione.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// I tipi di @types/node del progetto (20.x) non conoscono ancora `registerHooks`: la funzione c'è in Node 24.
const { registerHooks } = nodeModule as unknown as { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const srcUrl = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const spec = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcUrl).href : specifier;
    if ((/^\.\.?\//.test(spec) || spec.startsWith("file:")) && !/\.(?:[cm]?[jt]sx?|json)$/.test(spec)) {
      try {
        return next(`${spec}.ts`, context);
      } catch {
        // non è un modulo .ts: si risolve com'è scritto
      }
    }
    return next(spec, context);
  },
});

// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const G: typeof import("./guides") = await import("./guides.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const B: typeof import("./badges") = await import("./badges.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const D: typeof import("./guideDiscord") = await import("./guideDiscord.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const T: typeof import("./deckTranslation") = await import("./deckTranslation.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../communityGuideLabels") = await import("../communityGuideLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const I: typeof import("../i18n") = await import("../i18n.ts");
const S: typeof import("../../../scripts/schema-guard.mjs") = await import("../../../scripts/schema-guard.mjs");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const sorted = (xs: readonly string[]) => [...xs].sort();
/** Gli elementi fra apici di un elenco SQL: "('creator','pro')" → ["creator", "pro"]. */
const quoted = (s: string) => [...s.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);

/** schema.sql più wave2-GUIDE.sql, se c'è ancora (prima dell'unione): le istruzioni del pacchetto sono in fondo. */
const waveUrl = new URL("../../../supabase/wave2-GUIDE.sql", import.meta.url);
const sql = read("../../../supabase/schema.sql") + (existsSync(waveUrl) ? `\n${readFileSync(waveUrl, "utf8")}` : "");
const stmts: string[] = S.sqlStatements(sql);
const last = (re: RegExp) => stmts.filter((s) => re.test(s)).at(-1) ?? "";
const all = (re: RegExp) => stmts.filter((s) => re.test(s));

describe("database: permesso di pubblicare", () => {
  const fn = last(/^create (?:or replace )?function public\.can_publish_guides\(/);

  test("can_publish_guides esiste, security definer con search_path fisso, niente esecuzione per anon", () => {
    assert.ok(fn, "manca can_publish_guides");
    assert.match(fn, /security definer set search_path = public, pg_temp/);
    assert.ok(stmts.includes("revoke all on function public.can_publish_guides(uuid) from public, anon"));
    assert.ok(stmts.includes("grant execute on function public.can_publish_guides(uuid) to authenticated, service_role"));
  });

  test("gli stessi ruoli di canPublishGuides (badges.ts), più gli admin", () => {
    const m = /p\.role = 'admin' or p\.badge in \(([^)]*)\)/.exec(fn);
    assert.ok(m, fn);
    const sqlBadges = quoted(m[1]);
    assert.deepEqual(sorted(sqlBadges), sorted(B.GUIDE_BADGES));
    // stessa risposta per ogni tag e ruolo (anche un tag sconosciuto, che per il codice vale community)
    for (const badge of [...B.BADGES, "influencer", null]) {
      for (const role of ["user", "admin", null]) {
        const db = role === "admin" || (badge !== null && sqlBadges.includes(badge));
        assert.equal(B.canPublishGuides(badge, role), db, `${badge}/${role}`);
      }
    }
  });

  test("insert e update solo con can_publish_guides(auth.uid()); lo staff aggiorna anche le guide altrui", () => {
    const insert = last(/^create policy "community guides: roles insert own" on public\.community_guides for insert to authenticated/);
    assert.match(insert, /with check \(owner = \(select auth\.uid\(\)\) and public\.can_publish_guides\(\(select auth\.uid\(\)\)\)\)/);
    const update = last(/^create policy "community guides: owners and staff update" on public\.community_guides for update to authenticated/);
    assert.match(update, /using \(owner = \(select auth\.uid\(\)\) or \(select public\.is_staff\(\)\)\)/);
    assert.match(update, /with check \(public\.can_publish_guides\(\(select auth\.uid\(\)\)\) and \(owner = \(select auth\.uid\(\)\) or \(select public\.is_staff\(\)\)\)\)/);
  });

  test("letture: le pubblicate per tutti, il resto al proprietario e allo staff (is_staff mai valutata per anon)", () => {
    const pub = last(/^create policy "community guides: published are public"/);
    assert.match(pub, /for select to anon, authenticated using \(status = 'published'\)$/);
    assert.doesNotMatch(pub, /is_staff/);
    const rest = last(/^create policy "community guides: owners and staff read all"/);
    assert.match(rest, /for select to authenticated using \(owner = \(select auth\.uid\(\)\) or \(select public\.is_staff\(\)\)\)/);
    assert.ok(stmts.includes("alter table public.community_guides enable row level security"));
    assert.ok(stmts.includes("alter table public.community_guide_reports enable row level security"));
  });
});

describe("database: vincoli uguali al codice", () => {
  const GL = G.GUIDE_LIMITS;
  const constraint = (name: string) => last(new RegExp(`^alter table public\\.community_guides add constraint ${name}\\b`));

  test("titolo, riassunto e sezioni: stessi minimi e massimi, bozze più larghe", () => {
    assert.ok(constraint("community_guides_title_check").includes(`community_guide_text_ok(title, case when status = 'draft' then 1 else ${GL.titleMin} end, ${GL.titleMax}, false)`));
    assert.ok(constraint("community_guides_summary_check").includes(`community_guide_text_ok(summary, case when status = 'draft' then 0 else ${GL.summaryMin} end, ${GL.summaryMax}, true)`));
    assert.ok(constraint("community_guides_sections_check").includes("community_guide_sections_ok(sections, status <> 'draft')"));
    const sections = last(/^create (?:or replace )?function public\.community_guide_sections_ok\(/);
    assert.ok(sections.includes(`jsonb_array_length(s) > ${GL.sectionsMax}`));
    assert.ok(sections.includes(`jsonb_array_length(s) < ${GL.sectionsMin}`));
    assert.ok(sections.includes(`, ${GL.headingMax}, false)`));
    assert.ok(sections.includes(`, ${GL.bodyMax}, true)`));
    const cards = last(/^create (?:or replace )?function public\.community_guide_cards_ok\(/);
    assert.ok(cards.includes(`cardinality(c) <= ${GL.cardsMax}`));
  });

  test("categorie: quelle del codice, dei dizionari e del tipo GuideCategory delle guide del sito", () => {
    const m = /check \(category in \(([^)]*)\)\)/.exec(constraint("community_guides_category_check"));
    assert.ok(m);
    assert.deepEqual(quoted(m[1]), [...G.GUIDE_CATEGORIES]);
    const dict = read("../dictionaries/en.ts");
    for (const c of G.GUIDE_CATEGORIES) assert.match(dict, new RegExp(`\\b${c}: "`), c);
    const type = /export type GuideCategory = ([^;]+);/.exec(read("../content/guides.ts"));
    assert.ok(type);
    assert.deepEqual(sorted([...type[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1])), sorted(G.GUIDE_CATEGORIES));
  });

  test("copertine preimpostate, lingue e stati", () => {
    const m = /check \(cover_preset in \(([^)]*)\)\)/.exec(constraint("community_guides_cover_preset_check"));
    assert.ok(m);
    assert.deepEqual(quoted(m[1]), [...G.GUIDE_COVER_PRESETS]);
    const langs = /check \(lang in \(([^)]*)\)\)/.exec(constraint("community_guides_lang_check"));
    assert.ok(langs);
    assert.deepEqual(quoted(langs[1]), [...G.GUIDE_LANGS]);
    assert.deepEqual([...G.GUIDE_LANGS], [...I.locales], "le lingue delle guide sono quelle del sito");
    assert.match(constraint("community_guides_status_check"), /status in \('draft','published','hidden'\)/);
  });

  test("video e risorse con le regole dei mazzi (blocco VIDEO)", () => {
    assert.ok(constraint("community_guides_videos_check").includes("public.deck_videos_ok(videos)"));
    assert.ok(constraint("community_guides_links_check").includes("public.deck_links_ok(links)"));
  });

  test("tetti del trigger: uguali alle costanti; copertina caricata solo per i ruoli con vetrina", () => {
    const fn = last(/^create (?:or replace )?function public\.guard_community_guide\(/);
    assert.ok(fn.includes(`if n >= ${G.GUIDE_MAX_PER_OWNER} then raise exception 'guide_limit'`));
    assert.ok(fn.includes(`if n >= ${G.GUIDE_DAILY_NEW_LIMIT} then raise exception 'guide_rate'`));
    assert.equal(fn.split(`if n >= ${G.GUIDE_DAILY_PUBLISH_LIMIT} then raise exception 'guide_daily_limit'`).length - 1, 2, "alla creazione e alla prima pubblicazione");
    assert.match(fn, /security definer set search_path = public, pg_temp/);
    assert.match(fn, /old\.status = 'hidden' or new\.status = 'hidden'/);
    const cover = /p\.role = 'admin' or p\.badge in \(([^)]*)\)\)\) then raise exception 'guide_cover_role'/.exec(fn);
    assert.ok(cover, "controllo del ruolo per la copertina caricata");
    assert.deepEqual(sorted(quoted(cover[1])), sorted(B.SHOWCASE_BADGES));
    const report = last(/^create (?:or replace )?function public\.guard_community_guide_report\(/);
    assert.ok(report.includes(`if n >= ${G.REPORT_DAILY_LIMIT} then raise exception 'report_rate'`));
    assert.ok(last(/^alter table public\.community_guide_reports add constraint community_guide_reports_reason_check/).includes(`(reason, ${G.REPORT_REASON_MIN}, ${G.REPORT_REASON_MAX}, true)`));
  });

  test("i caratteri invisibili rifiutati dal database li toglie anche il sito", () => {
    const fn = last(/^create (?:or replace )?function public\.community_guide_text_ok\(/);
    const m = /translate\(t, u&'([^']+)', ''\)/.exec(fn);
    assert.ok(m, "lista degli invisibili");
    const codes = m[1].split("\\").filter(Boolean).map((h) => parseInt(h, 16));
    assert.ok(codes.length >= 10);
    for (const c of codes) {
      const ch = String.fromCodePoint(c);
      assert.equal(G.cleanPlain(`a${ch}b`, 20, false), "ab", `U+${c.toString(16)}`);
      assert.equal(G.plainTextOk(`a${ch}b`, 1, 20, false), false, `U+${c.toString(16)}`);
    }
    assert.ok(fn.includes("strpos(replace(t, ' ', ''), repeat(chr(10), 3)) = 0"), "al massimo una riga vuota di fila");
  });
});

describe("database: grant minime", () => {
  test("revoke di tutto, poi lettura per tutti e scrittura solo sulle colonne del sito", () => {
    const revokeAt = stmts.lastIndexOf("revoke all on public.community_guides from anon, authenticated");
    assert.ok(revokeAt >= 0);
    const grants = stmts.filter((s, i) => i > revokeAt && /^grant .* on public\.community_guides to /.test(s));
    assert.ok(grants.includes("grant select on public.community_guides to anon, authenticated"));
    assert.ok(grants.includes("grant delete on public.community_guides to authenticated"));
    const cols = (kind: string) => {
      const g = grants.find((s) => s.startsWith(`grant ${kind} (`));
      assert.ok(g, kind);
      return /\(([^)]*)\)/.exec(g)![1].split(",").map((c) => c.trim());
    };
    for (const reserved of ["id", "owner", "slug", "created_at", "updated_at", "published_at"]) assert.ok(!cols("update").includes(reserved), `update ${reserved}`);
    for (const reserved of ["id", "created_at", "updated_at", "published_at", "translations"]) assert.ok(!cols("insert").includes(reserved), `insert ${reserved}`);
    assert.ok(cols("update").includes("translations"), "le traduzioni le scrive il sito con la sessione del proprietario");
    assert.ok(!grants.some((s) => /^grant (all|insert|update) on public\.community_guides/.test(s)), "niente scrittura sull'intera tabella");
    const reports = stmts.lastIndexOf("revoke all on public.community_guide_reports from anon, authenticated");
    assert.ok(reports >= 0);
    assert.ok(stmts.includes("grant insert (guide_id, user_id, reason) on public.community_guide_reports to authenticated"));
  });

  test("il pacchetto non tocca public.profiles e schema-guard non trova problemi", () => {
    const wave = existsSync(waveUrl) ? S.sqlStatements(readFileSync(waveUrl, "utf8")) : [];
    assert.ok(!wave.some((s: string) => /\bon (?:table )?public\.profiles\b/.test(s) && /^(grant|revoke)\b/.test(s)));
    assert.deepEqual(S.schemaProblems(sql), []);
  });

  test("le funzioni security definer hanno il search_path fisso e niente esecuzione pubblica", () => {
    for (const s of all(/^create (?:or replace )?function public\.(can_publish_guides|guard_community_guide|guard_community_guide_report)\(/)) {
      assert.match(s, /security definer set search_path = public, pg_temp/);
    }
    assert.ok(stmts.includes("revoke all on function public.guard_community_guide() from public, anon, authenticated"));
    assert.ok(stmts.includes("revoke all on function public.guard_community_guide_report() from public, anon, authenticated"));
  });
});

describe("testo semplice", () => {
  test("cleanPlain: a capo uniformi, tabulazioni, invisibili, righe vuote e spazi in coda", () => {
    assert.equal(G.cleanPlain("  Ciao\r\nmondo \t\r\n\r\n\r\n\r\nfine  ", 100, true), "Ciao\nmondo\n\nfine");
    assert.equal(G.cleanPlain("Titolo\n su\t due righe", 100, false), "Titolo su due righe");
    assert.equal(G.cleanPlain(`a${String.fromCodePoint(0x2028)}b`, 10, true), "a\nb");
    assert.equal(G.cleanPlain(42, 10, false), "");
    // tetto al testo grezzo prima delle regex: quattro volte il massimo (più un margine)
    assert.ok(G.cleanPlain("x".repeat(10_000), 10, false).length <= 10 * 4 + 64);
  });

  test("plainTextOk: lunghezze in punti di codice, vuoto solo se ammesso, niente a capo nei titoli", () => {
    assert.ok(G.plainTextOk("", 0, 10, true));
    assert.ok(!G.plainTextOk("", 1, 10, true));
    assert.ok(!G.plainTextOk("   ", 0, 10, true));
    assert.ok(G.plainTextOk("🃏🃏🃏", 3, 3, false), "un'emoji conta uno");
    assert.ok(!G.plainTextOk("riga\nriga", 1, 20, false));
    assert.ok(G.plainTextOk("riga\n\nriga", 1, 20, true));
    assert.ok(!G.plainTextOk("riga\n\n\nriga", 1, 20, true));
    assert.ok(!G.plainTextOk(" spazio", 1, 20, false));
    assert.ok(!G.plainTextOk("tab\there", 1, 20, false));
  });
});

/** Un modulo finto: `get` e `getAll` come FormData. */
function form(fields: Record<string, string | string[]>) {
  return {
    get: (k: string) => {
      const v = fields[k];
      return v === undefined ? null : Array.isArray(v) ? (v[0] ?? null) : v;
    },
    getAll: (k: string) => {
      const v = fields[k];
      return v === undefined ? [] : Array.isArray(v) ? v : [v];
    },
  };
}

const LONG_SUMMARY = "Una guida completa per giocare Dorothy Combo in classificata: che cosa tenere al mulligan, come arrivare al turno forte e contro chi stare attenti.";
const known = (s: string) => ["dorothy", "mulan", "merlin"].includes(s);

describe("readGuideForm", () => {
  const base = { lang: "it", category: "decks", cover_preset: "mint", title: "Dorothy Combo in classificata", summary: LONG_SUMMARY };

  test("pubblicazione: tutti i minimi; righe vuote saltate; carte sconosciute e doppioni scartati", () => {
    const r = G.readGuideForm(
      form({
        ...base,
        section_heading_0: "Mulligan",
        section_body_0: "Tieni Dorothy.",
        section_heading_1: "",
        section_body_1: "  ",
        section_heading_2: "Matchup",
        section_body_2: "Occhio a Merlin.",
        cards: ["dorothy", "dorothy", "sconosciuta", "BAD slug", "merlin"],
      }),
      "publish",
      known,
    );
    assert.ok(r.ok);
    assert.deepEqual(r.value.sections, [
      { heading: "Mulligan", body: "Tieni Dorothy." },
      { heading: "Matchup", body: "Occhio a Merlin." },
    ]);
    assert.deepEqual(r.value.cards, ["dorothy", "merlin"]);
    assert.equal(r.value.lang, "it");
  });

  test("pubblicazione senza i minimi: errore sul campo giusto", () => {
    const err = (fields: Record<string, string | string[]>) => {
      const r = G.readGuideForm(form(fields), "publish", known);
      return r.ok ? null : r.error;
    };
    assert.deepEqual(err({ ...base, title: "Corto", section_heading_0: "A", section_body_0: "B" }), { code: "title" });
    assert.deepEqual(err({ ...base, summary: "Troppo breve", section_heading_0: "A", section_body_0: "B" }), { code: "summary" });
    assert.deepEqual(err({ ...base }), { code: "sections" });
    assert.deepEqual(err({ ...base, section_heading_0: "A", section_body_0: "B", section_heading_1: "", section_body_1: "Testo senza titolo" }), { code: "heading", index: 1 });
    assert.deepEqual(err({ ...base, section_heading_0: "Solo il titolo" }), { code: "body", index: 0 });
    assert.deepEqual(err({ ...base, lang: "fr", section_heading_0: "A", section_body_0: "B" }), { code: "lang" });
    assert.deepEqual(err({ ...base, category: "altro", section_heading_0: "A", section_body_0: "B" }), { code: "category" });
    assert.deepEqual(err({ ...base, cover_preset: "keyart", section_heading_0: "A", section_body_0: "B" }), { code: "cover" });
    const many: Record<string, string> = { ...base };
    for (let i = 0; i < 13; i++) Object.assign(many, { [`section_heading_${i}`]: `S${i}`, [`section_body_${i}`]: "testo" });
    assert.deepEqual(err(many), { code: "sections" });
  });

  test("bozza: si salva a metà (titolo da un carattere, riassunto e sezioni vuoti, sezione senza testo)", () => {
    const r = G.readGuideForm(form({ ...base, title: "X", summary: "", section_heading_0: "Solo il titolo" }), "draft", known);
    assert.ok(r.ok);
    assert.deepEqual(r.value.sections, [{ heading: "Solo il titolo", body: "" }]);
    const empty = G.readGuideForm(form({ ...base, title: "" }), "draft", known);
    assert.ok(!empty.ok);
  });

  test("guideErrorField: il campo da mettere a fuoco", () => {
    assert.equal(G.guideErrorField({ code: "heading", index: 2 }), "section_heading_2");
    assert.equal(G.guideErrorField({ code: "body", index: 0 }), "section_body_0");
    assert.equal(G.guideErrorField({ code: "title" }), "title");
    assert.equal(G.guideErrorField({ code: "cover" }), "cover_preset");
  });
});

describe("errori del database", () => {
  test("i codici del trigger, le policy, la tabella che manca", () => {
    assert.equal(G.guideErrorCode({ code: "23514", message: "guide_daily_limit" }), "guide_daily_limit");
    assert.equal(G.guideErrorCode({ code: "42501", message: "guide_hidden" }), "guide_hidden");
    assert.equal(G.guideErrorCode({ code: "42501", message: 'new row violates row-level security policy for table "community_guides"' }), "forbidden");
    assert.equal(G.guideErrorCode({ code: "23505", message: "duplicate key" }), "duplicate");
    assert.equal(G.guideErrorCode({ code: "PGRST205", message: "Could not find the table 'public.community_guides' in the schema cache" }), "unavailable");
    assert.equal(G.guideErrorCode({ code: "42P01", message: 'relation "public.community_guides" does not exist' }), "unavailable");
    assert.equal(G.guideErrorCode({ code: "XX000", message: "boom" }), "db");
    assert.equal(G.guideErrorCode(null), "db");
    assert.ok(!G.guideTableMissing({ code: "23505", message: "duplicate" }));
  });
});

/** Un testo di `n` parole. */
const words = (n: number) => Array.from({ length: n }, (_, i) => `parola${i}`).join(" ");

describe("parole, lingue, indicizzazione e sitemap", () => {
  const all = ["en", "it", "es"] as const;
  const guide = (n: number, extra: Record<string, unknown> = {}) =>
    ({ lang: "it", summary: words(20), sections: [{ heading: "Mulligan", body: words(n) }], status: "published", translations: null, ...extra }) as never;

  test("parole: riassunto più titoli e testi delle sezioni; minuti di lettura", () => {
    assert.equal(G.communityGuideWords({ summary: "uno due", sections: [{ heading: "tre", body: "quattro cinque 3/2" }] }), 5);
    assert.equal(G.readMinutes(0), 1);
    assert.equal(G.readMinutes(1000), 5);
  });

  test("soglia: sotto 300 parole nessuna lingua, niente hreflang, fuori dalla sitemap", () => {
    assert.equal(G.COMMUNITY_GUIDE_MIN_WORDS, 300);
    const thin = guide(100);
    assert.deepEqual(G.communityGuideIndexing(thin, all as never, "it" as never), { languages: [], noindex: true, hreflang: false });
    const ok = guide(300);
    assert.deepEqual(G.communityGuideIndexing(ok, all as never, "it" as never), { languages: ["it"], noindex: false, hreflang: true });
    assert.equal(G.communityGuideIndexing(ok, all as never, "en" as never).noindex, true, "la versione non tradotta è noindex");
    assert.equal(G.communityGuideIndexable({ ...(ok as object), status: "hidden" } as never), false);
  });

  test("traduzioni: valgono solo sul testo attuale e con le stesse sezioni", () => {
    const g0 = guide(300);
    const hash = G.communityGuideHash(g0);
    const tr = { hash, at: "2026-09-27T10:00:00Z", guide: { summary: "Summary", sections: [{ heading: "Mulligan", body: "Text" }] } };
    const g1 = guide(300, { translations: { en: tr, es: { ...tr, hash: "vecchia" }, it: tr } });
    assert.deepEqual(G.communityGuideLocales(g1, all as never), ["en", "it"]);
    assert.deepEqual(G.missingGuideLocales(g1, all as never), ["es"]);
    assert.equal(G.localizedCommunityGuide(g1, "en" as never).translated, true);
    assert.equal(G.localizedCommunityGuide(g1, "es" as never).lang, "it");
    assert.equal(G.localizedCommunityGuide(g1, "it" as never).translated, false, "nella lingua dell'autore sempre l'originale");
    const fewer = guide(300, { translations: { en: { ...tr, guide: { summary: "S", sections: [] } } } });
    assert.equal(G.freshGuideTranslation(fewer, "en" as never), null);
    // il titolo non entra nell'impronta: cambiarlo non butta via le traduzioni
    assert.equal(G.communityGuideHash({ ...(g0 as object), title: "Altro" } as never), hash);
    assert.notEqual(G.communityGuideHash({ ...(g0 as object), lang: "es" } as never), hash);
  });

  test("sitemap: solo sopra soglia e pubblicate, con le loro lingue; latest su tutte", () => {
    const rows = [
      { slug: "a-1111", updated_at: "2026-09-27T10:00:00Z", ...(guide(400) as object) },
      { slug: "b-2222", updated_at: "2026-09-28T10:00:00Z", ...(guide(10) as object) },
      { slug: "c-3333", updated_at: "2026-09-26T10:00:00Z", ...(guide(400) as object), status: "hidden" },
    ];
    const out = G.sitemapCommunityGuides(rows as never, all as never);
    assert.deepEqual(out.guides, [{ slug: "a-1111", updated_at: "2026-09-27T10:00:00Z", locales: ["it"] }]);
    assert.equal(out.latest, "2026-09-28T10:00:00Z");
    assert.deepEqual(G.sitemapCommunityGuides([], all as never), { guides: [] });
  });

  test("testo da tradurre in campi piatti, e ritorno", () => {
    const text = { summary: "Intro", sections: [{ heading: "A", body: "Uno" }, { heading: "B", body: "Due" }] };
    const doc = G.guideTranslationDoc(text);
    assert.deepEqual(Object.keys(doc), ["summary", "heading_1", "body_1", "heading_2", "body_2"]);
    assert.deepEqual(G.guideTextFromDoc(doc, 2), text);
    assert.equal(G.guideTextFromDoc({ summary: "x", heading_1: "A" }, 1), null);
    const req = T.translationRequestFor(doc, "it", "es", [], T.STRATEGY_GUIDE_TRANSLATION_SYSTEM);
    assert.deepEqual((req.output_config.format.schema as { required: string[] }).required, Object.keys(doc));
  });

  test("letture difensive: sezioni rovinate scartate, copertina caricata solo nella cartella del proprietario", () => {
    assert.deepEqual(G.storedSections([{ heading: "A", body: "B" }, { heading: 3 }, null, "x"]), [{ heading: "A", body: "B" }]);
    assert.deepEqual(G.storedSections("nope"), []);
    const owner = "8d0a3c9e-1234-4abc-9def-0123456789ab";
    assert.ok(G.coverPathOk(`${owner}/guides/cover-1.webp`, owner));
    assert.ok(!G.coverPathOk(`${owner}/../x.webp`, owner));
    assert.ok(!G.coverPathOk(`0d0a3c9e-1234-4abc-9def-0123456789ab/cover.webp`, owner));
    assert.ok(!G.coverPathOk(`${owner}/cover.svg`, owner));
    assert.equal(G.GUIDE_COVER_BUCKET, null, "il bucket lo porta VETRINA: finché è null si usano le copertine preimpostate");
  });
});

describe("messaggi Discord", () => {
  const g = {
    slug: "dorothy-combo-ab12",
    title: "Dorothy Combo: la guida",
    lang: "es" as const,
    author: "Vega @everyone",
    summary: "Una **guía** con [link](https://evil.example)",
    category: { en: "Deck guides", it: "Guide ai mazzi", es: "Guías de mazos" },
  };

  test("annuncio: link nella lingua della guida, le altre due nei campi, testi degli utenti ripuliti", () => {
    const p = D.guidePayload(g);
    const e = p.embeds![0];
    assert.match(e.url!, /^https:\/\/originsmeta\.com\/es\/guides\/community\/dorothy-combo-ab12\?utm_source=discord/);
    assert.deepEqual(
      e.fields!.map((f) => f.name),
      ["🇮🇹 Italiano", "🇬🇧 English"],
    );
    assert.ok(e.fields!.every((f) => f.value.includes("/guides/community/dorothy-combo-ab12?")));
    assert.ok(!e.description!.includes("**guía**"), "Markdown dell'utente annullato");
    assert.ok(!e.description!.includes("@everyone"), "menzioni spezzate");
    assert.ok(e.description!.includes("Guide ai mazzi") && e.description!.includes("Guías de mazos"));
  });

  test("segnalazione: canale dello staff, link alla pagina in italiano, motivo tagliato", () => {
    const p = D.guideReportPayload({ slug: g.slug, title: g.title, lang: "es", author: "Vega", reporter: "coachcrono", reason: "x".repeat(900) });
    const e = p.embeds![0];
    assert.equal(e.url, "https://originsmeta.com/it/guides/community/dorothy-combo-ab12");
    assert.ok(e.description!.length <= 500);
    assert.ok(e.fields!.some((f) => f.name === "Nascondi dal sito"));
  });

  test("cut: all'ultima parola intera, con l'ellissi", () => {
    assert.equal(D.cut("uno due tre quattro", 10), "uno due…");
    assert.equal(D.cut("breve", 10), "breve");
  });
});

describe("dati strutturati", () => {
  test("Article con l'autore Person del membro (lo stesso @id del profilo), carte citate e parte di /guides", async () => {
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const J: typeof import("../jsonld/communityGuide") = await import("../jsonld/communityGuide.ts");
    // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
    const P: typeof import("../jsonld/deck") = await import("../jsonld/deck.ts");
    const author = P.communityPerson({ locale: "es", username: "vegakiles", name: "Vega" });
    const node = J.communityGuideArticle({
      locale: "es",
      pageUrl: "https://originsmeta.com/es/guides/community/dorothy-combo-ab12",
      headline: "Dorothy Combo · guía de Origins TCG",
      description: "Una guía",
      published: "2026-09-27T12:00:00Z",
      modified: "2026-09-28T12:00:00Z",
      image: "https://originsmeta.com/media/og.jpg",
      author,
      cards: [{ slug: "dorothy", key: "C123", name: "Dorothy" }],
      words: 420,
      section: "Guías de mazos",
    });
    assert.equal(node["@type"], "Article");
    assert.equal(node["@id"], "https://originsmeta.com/es/guides/community/dorothy-combo-ab12#article");
    assert.equal((node.author as { "@id": string })["@id"], "https://originsmeta.com/#user-vegakiles");
    assert.deepEqual(node.isPartOf, { "@id": "https://originsmeta.com/es/guides#collection" });
    assert.equal((node.mentions as { "@id": string }[])[0]["@id"], "https://originsmeta.com/#card-C123");
    assert.equal(node.inLanguage, "es");
    assert.equal(node.wordCount, 420);
  });
});

describe("etichette", () => {
  /** I percorsi delle chiavi di un oggetto di etichette. */
  const paths = (o: unknown, pre = ""): string[] =>
    o && typeof o === "object" ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (v && typeof v === "object" ? paths(v, `${pre}${k}.`) : [`${pre}${k}`])) : [];
  const at = (o: unknown, p: string) => p.split(".").reduce<unknown>((x, k) => (x as Record<string, unknown>)?.[k], o);
  const holes = (s: string) => sorted([...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))]);

  test("stesse chiavi e stessi segnaposto in inglese, italiano e spagnolo", () => {
    const en = L.communityGuideLabels.en;
    for (const locale of ["it", "es"] as const) {
      const other = L.communityGuideLabels[locale];
      assert.deepEqual(sorted(paths(other)), sorted(paths(en)), locale);
      for (const p of paths(en)) assert.deepEqual(holes(String(at(other, p))), holes(String(at(en, p))), `${locale}: ${p}`);
    }
  });

  test("un messaggio per ogni errore del modulo e del database", () => {
    const codes = ["title", "summary", "sections", "heading", "body", "category", "lang", "cover", "cards", "notLoggedIn", "forbidden", "disabled", "unavailable", "guide_daily_limit", "guide_limit", "guide_rate", "guide_hidden", "guide_status", "duplicate", "db"];
    for (const locale of ["en", "it", "es"] as const) for (const c of codes) assert.ok(L.communityGuideLabels[locale].errors[c as keyof typeof L.communityGuideLabels.en.errors], `${locale}: ${c}`);
    // i tetti detti nei messaggi sono quelli del database
    assert.match(L.communityGuideLabels.it.errors.guide_daily_limit, new RegExp(`\\b${G.GUIDE_DAILY_PUBLISH_LIMIT}\\b`));
    assert.match(L.communityGuideLabels.en.errors.guide_limit, new RegExp(`\\b${G.GUIDE_MAX_PER_OWNER}\\b`));
    assert.match(L.communityGuideLabels.es.errors.guide_rate, new RegExp(`\\b${G.GUIDE_DAILY_NEW_LIMIT}\\b`));
  });

  test("un nome per ogni copertina", () => {
    for (const locale of ["en", "it", "es"] as const) assert.deepEqual(sorted(Object.keys(L.communityGuideLabels[locale].editor.covers)), sorted(G.GUIDE_COVER_PRESETS));
  });
});
