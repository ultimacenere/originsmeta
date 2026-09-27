/**
 * Test delle guide della community (pacchetto GUIDE, 27/09/2026) con il runner integrato di Node:
 * `node --test src/lib/community/guides.test.ts`.
 *
 * - Database: le regole del blocco GUIDE di supabase/schema.sql (più supabase/wave2-GUIDE.sql se tornasse: il test legge i due file
 *   insieme, così vale prima e dopo l'unione) coincidono con il codice: ruoli di `can_publish_guides` uguali a
 *   `canPublishGuides` di badges.ts, limiti del testo, invisibili, categorie, copertine (file veri del media kit), tetti
 *   contati sul registro, traduzioni salvate, grant per colonna, policy, segnalazioni, nessuna grant su public.profiles
 *   (schema-guard.mjs non trova problemi).
 * - Regole pure di guides.ts: testo semplice, lettura del modulo, parole e soglia, lingue e traduzioni, elenchi leggeri
 *   (le stesse risposte della pagina), sitemap, traduzione a pezzi con riuso delle parti (guideTranslateCore.ts, con un
 *   client finto al posto dell'API).
 * - Messaggi Discord (guideDiscord.ts), dati strutturati ed etichette (communityGuideLabels.ts: stesse chiavi e
 *   segnaposto nelle tre lingue).
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
const C: typeof import("./guideTranslateCore") = await import("./guideTranslateCore.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../communityGuideLabels") = await import("../communityGuideLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const I: typeof import("../i18n") = await import("../i18n.ts");
const S: typeof import("../../../scripts/schema-guard.mjs") = await import("../../../scripts/schema-guard.mjs");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const sorted = (xs: readonly string[]) => [...xs].sort();
/** Gli elementi fra apici di un elenco SQL: "('creator','pro')" → ["creator", "pro"]. */
const quoted = (s: string) => [...s.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);

/** schema.sql (più wave2-GUIDE.sql, ripiego per i pacchetti futuri: dal 27/09/2026 il file non c'è più). */
const waveUrl = new URL("../../../supabase/wave2-GUIDE.sql", import.meta.url);
const sql = read("../../../supabase/schema.sql") + (existsSync(waveUrl) ? `\n${readFileSync(waveUrl, "utf8")}` : "");
const stmts: string[] = S.sqlStatements(sql);
const last = (re: RegExp) => stmts.filter((s) => re.test(s)).at(-1) ?? "";
const all = (re: RegExp) => stmts.filter((s) => re.test(s));
const guardFn = () => last(/^create (?:or replace )?function public\.guard_community_guide\(/);

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

/** Larghezza e altezza di un file WebP (VP8X, VP8 o VP8L), per controllare le misure dichiarate delle copertine. */
function webpSize(b: Buffer): [number, number] {
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  const bits = b.readUInt32LE(21);
  return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
}

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

  test("copertine: le chiavi del database, file veri del media kit in 16:9 con le misure dichiarate, fra quelle dei tornei", () => {
    const m = /check \(cover_preset in \(([^)]*)\)\)/.exec(constraint("community_guides_cover_preset_check"));
    assert.ok(m);
    assert.deepEqual(quoted(m[1]), [...G.GUIDE_COVER_PRESETS]);
    assert.match(last(/^create table if not exists public\.community_guides /), new RegExp(`cover_preset text not null default '${G.DEFAULT_GUIDE_COVER}'`));
    assert.ok(stmts.includes(`alter table public.community_guides alter column cover_preset set default '${G.DEFAULT_GUIDE_COVER}'`));
    const tournaments = read("../tournament/types.ts");
    for (const key of G.GUIDE_COVER_PRESETS) {
      const c = G.GUIDE_COVERS[key];
      const file = new URL(`../../../public${c.src}`, import.meta.url);
      assert.ok(existsSync(file), c.src);
      assert.deepEqual(webpSize(readFileSync(file)), [c.width, c.height], `misure di ${c.src}`);
      assert.ok(Math.abs(c.width / c.height - 16 / 9) < 0.01, `${c.src}: 16:9, si mostra intera senza ritagli`);
      assert.ok(tournaments.includes(`"${c.src}"`), `${c.src} fra le copertine dei tornei (materiale Koin già in uso)`);
    }
    assert.equal(G.guideCover("sconosciuta").src, G.GUIDE_COVERS[G.DEFAULT_GUIDE_COVER].src);
  });

  test("lingue e stati", () => {
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

  test("tetti del trigger: uguali alle costanti e contati sul registro, che eliminare una guida non azzera", () => {
    const fn = guardFn();
    assert.ok(fn.includes(`if n >= ${G.GUIDE_MAX_PER_OWNER} then raise exception 'guide_limit'`));
    assert.ok(fn.includes(`if n >= ${G.GUIDE_DAILY_NEW_LIMIT} then raise exception 'guide_rate'`));
    assert.equal(fn.split(`if n >= ${G.GUIDE_DAILY_PUBLISH_LIMIT} then raise exception 'guide_daily_limit'`).length - 1, 2, "alla creazione e alla prima pubblicazione");
    // i conteggi giornalieri leggono il registro, mai le guide ancora presenti
    assert.ok(fn.includes("from public.community_guide_events where owner = new.owner and kind = 'create' and at > now() - interval '1 day'"));
    assert.equal(fn.split("from public.community_guide_events where owner = new.owner and kind = 'publish' and at > now() - interval '1 day'").length - 1, 2);
    assert.doesNotMatch(fn, /from public\.community_guides where owner = new\.owner and (created_at|published_at)/);
    assert.ok(fn.includes("insert into public.community_guide_events (owner, kind) values (new.owner, 'create')"));
    assert.equal(fn.split("values (new.owner, 'publish')").length - 1, 2, "prima pubblicazione alla creazione e dopo");
    assert.ok(fn.includes("values (new.owner, 'hide')"));
    // dopo una guida nascosta dallo staff, niente pubblicazioni per 24 ore (alla creazione e al passaggio a pubblicata)
    assert.equal(G.GUIDE_HIDE_COOLDOWN_HOURS, 24);
    assert.equal(fn.split("kind = 'hide' and at > now() - interval '1 day') then raise exception 'guide_hidden_recent'").length - 1, 2);
    assert.match(fn, /security definer set search_path = public, pg_temp/);
    assert.match(fn, /old\.status = 'hidden' or new\.status = 'hidden'/);
    const cover = /p\.role = 'admin' or p\.badge in \(([^)]*)\)\)\) then raise exception 'guide_cover_role'/.exec(fn);
    assert.ok(cover, "controllo del ruolo per la copertina caricata");
    assert.deepEqual(sorted(quoted(cover[1])), sorted(B.SHOWCASE_BADGES));
  });

  test("registro dei tetti: RLS senza policy, nessuna grant, cancellato con l'account", () => {
    const table = last(/^create table if not exists public\.community_guide_events /);
    assert.match(table, /owner uuid not null references public\.profiles\(id\) on delete cascade/);
    assert.ok(stmts.includes("alter table public.community_guide_events enable row level security"));
    assert.ok(stmts.includes("revoke all on public.community_guide_events from anon, authenticated"));
    assert.ok(!stmts.some((s) => /^create policy .* on public\.community_guide_events\b/.test(s)), "nessuna policy: solo il trigger lo legge e lo scrive");
    assert.ok(!stmts.some((s) => /^grant .* on public\.community_guide_events\b/.test(s)));
    assert.match(last(/^alter table public\.community_guide_events add constraint community_guide_events_kind_check/), /kind in \('create','publish','hide'\)/);
  });

  test("parole e impronta: scritte dal sito, azzerate se il testo cambia senza nuova impronta", () => {
    const fn = guardFn();
    assert.ok(fn.includes("(new.lang, new.summary, new.sections) is distinct from (old.lang, old.summary, old.sections) and new.text_hash is not distinct from old.text_hash"));
    assert.ok(fn.includes("new.words := null") && fn.includes("new.text_hash := null"));
    assert.match(constraint("community_guides_text_hash_check"), /text_hash \~ '\^\[0-9a-z\]\{1,16\}\$'/);
    // l'impronta del codice sta nel vincolo (cyrb53 in base 36)
    assert.match(G.communityGuideHash({ lang: "it", summary: "x".repeat(300), sections: [{ heading: "h", body: "b".repeat(4000) }] }), /^[0-9a-z]{1,16}$/);
  });

  test("traduzioni salvate: stessi massimi del codice, stesse sezioni, controllate dal trigger per tutti", () => {
    const fn = last(/^create (?:or replace )?function public\.community_guide_translation_ok\(/);
    const TL = G.TRANSLATION_LIMITS;
    assert.ok(fn.includes(`community_guide_text_ok(t -> 'guide' ->> 'summary', 1, ${TL.summaryMax}, true)`));
    assert.ok(fn.includes(`community_guide_text_ok(x ->> 'heading', 1, ${TL.headingMax}, false)`));
    assert.ok(fn.includes(`community_guide_text_ok(x ->> 'body', 1, ${TL.bodyMax}, true)`));
    assert.ok(fn.includes("jsonb_array_length(t -> 'guide' -> 'sections') <> n"));
    assert.ok(fn.includes(`jsonb_array_length(t -> 'parts') > ${G.GUIDE_LIMITS.sectionsMax + 1}`));
    assert.deepEqual([TL.summaryMax, TL.headingMax, TL.bodyMax], [950, 400, 10200]);
    const guard = guardFn();
    assert.ok(guard.includes("not public.community_guide_translation_ok(v, jsonb_array_length(new.sections))"));
    assert.ok(guard.includes("raise exception 'guide_translation'"));
    assert.ok(stmts.includes("revoke all on function public.community_guide_translation_ok(jsonb, integer) from public, anon"));
  });

  test("i caratteri invisibili rifiutati dal database li toglie anche il sito, e viceversa", () => {
    const fn = last(/^create (?:or replace )?function public\.community_guide_text_ok\(/);
    const m = /translate\(t, u&'([^']+)', ''\)/.exec(fn);
    assert.ok(m, "lista degli invisibili");
    const codes = m[1].split("\\").filter(Boolean).map((h) => parseInt(h, 16));
    for (const c of codes) {
      const ch = String.fromCodePoint(c);
      assert.equal(G.cleanPlain(`a${ch}b`, 20, false), "ab", `U+${c.toString(16)}`);
      assert.equal(G.plainTextOk(`a${ch}b`, 1, 20, false), false, `U+${c.toString(16)}`);
    }
    // i riempitivi che sembrano spazi vuoti (Hangul, Braille vuoto) e gli invisibili U+2060-2064
    for (const c of [0x115f, 0x1160, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0x2800, 0x3164, 0xffa0]) assert.ok(codes.includes(c), `U+${c.toString(16)} nella lista del database`);
    // ogni carattere che il sito toglie (oltre ai controlli, che il database rifiuta con [[:cntrl:]]) è nella lista
    for (let c = 0xa0; c <= 0xffff; c++) {
      if (c >= 0xd800 && c <= 0xdfff) continue;
      if (G.cleanPlain(`a${String.fromCodePoint(c)}b`, 20, true) === "ab") assert.ok(codes.includes(c), `U+${c.toString(16)} tolto dal sito ma non dal database`);
    }
    assert.equal(G.plainTextOk("\u3164".repeat(10), 1, 20, false), false, "titolo invisibile");
    assert.equal(G.cleanPlain("\u3164\u3164 Titolo", 20, false), "Titolo");
  });

  test("righe vuote: al massimo una di fila, anche se fatte di spazi Unicode; niente separatori di riga", () => {
    const fn = last(/^create (?:or replace )?function public\.community_guide_text_ok\(/);
    const blank = "strpos(regexp_replace(t, '[ \\u00a0\\u1680\\u2000-\\u200a\\u202f\\u205f\\u3000]', '', 'g'), repeat(chr(10), 3)) = 0";
    assert.ok(fn.includes(blank), "le righe fatte di spazi Unicode contano come vuote");
    assert.ok(fn.includes("t !~ '[\\u2028\\u2029]'"));
    for (const ch of [" ", "\u00a0", "\u1680", "\u2000", "\u200a", "\u202f", "\u205f", "\u3000"]) {
      assert.equal(G.plainTextOk(`a\n${ch}\n${ch}\nb`, 1, 50, true), false, `U+${ch.codePointAt(0)!.toString(16)}`);
    }
    assert.ok(G.plainTextOk("a\n\nb", 1, 50, true));
    assert.equal(G.plainTextOk("a\u2028b", 1, 50, true), false);
    assert.equal(G.cleanPlain("a\n\u00a0\n\u00a0\n\u00a0\nb", 50, true), "a\n\nb");
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
    assert.ok(cols("update").includes("translations"), "le traduzioni le scrive il sito con la sessione del proprietario (il trigger le controlla)");
    for (const col of ["words", "text_hash"]) assert.ok(cols("insert").includes(col) && cols("update").includes(col), col);
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

/*
  Revisione del 27/09/2026 (blocco "27/09/2026: DATE E FOTO" di schema.sql): `words` la scrive il sito, ma via API chi ha
  il ruolo poteva mandare un numero qualsiasi. Il trigger community_guides_words la azzera sopra
  community_guide_words_max, che conta i pezzi separati da spazi, barre e apostrofi: deve essere un sovrainsieme di
  countWords, così il numero giusto del sito passa sempre. L'espressione si legge dallo schema e si prova qui in JavaScript.
*/
describe("database: parole delle guide mai sopra il massimo possibile", () => {
  const body = /function public\.community_guide_words_max\(summary text, sections jsonb\)[\s\S]*?regexp_split_to_array\(p\.t, '((?:[^']|'')+)'\)/.exec(sql);
  const pgClass = body?.[1] ?? "";
  // [[:space:]] è una classe POSIX di Postgres: in JavaScript diventa \s (gli spazi ASCII; quelli Unicode sono elencati)
  const jsSplit = new RegExp(pgClass.split("[:space:]").join(String.raw`\s`).split("''").join("'"), "u");
  const maxWords = (summary: string, sections: { heading: string; body: string }[]) =>
    [summary, ...sections.flatMap((s) => [s.heading, s.body])].reduce((n, t) => n + t.split(jsSplit).filter(Boolean).length, 0);
  const ch = (code: number) => String.fromCharCode(code);

  test("la funzione e il trigger ci sono, dopo community_guides_guard", () => {
    assert.ok(pgClass, "manca community_guide_words_max");
    assert.ok(stmts.includes("create trigger community_guides_words before insert or update of words, summary, sections on public.community_guides for each row execute function public.guard_community_guide_words()"));
    assert.ok("community_guides_guard" < "community_guides_words", "Postgres esegue i trigger nell'ordine dei nomi");
    assert.match(last(/^create (?:or replace )?function public\.guard_community_guide_words\(/), /if new\.words is not null and new\.words > public\.community_guide_words_max\(new\.summary, new\.sections\) then new\.words := null/);
    assert.ok(stmts.includes("revoke all on function public.community_guide_words_max(text, jsonb) from public, anon"));
    assert.ok(stmts.includes("grant execute on function public.community_guide_words_max(text, jsonb) to authenticated, service_role"));
  });

  test("mai meno delle parole contate dal sito (spazi Unicode, barre, apostrofi, numeri, trattini)", () => {
    const samples: { summary: string; sections: { heading: string; body: string }[] }[] = [
      { summary: "uno due", sections: [{ heading: "tre", body: "quattro cinque 3/2" }] },
      { summary: `dell'avversario l${ch(0x2019)}abilità don't`, sections: [{ heading: "Swarm/Aggro | Midrange", body: "mid-range Trick-or-Treat - • 5" }] },
      { summary: ["a", "b", "c", "d", "e", "f", "g", "h", "i"].join(ch(0xa0)), sections: [{ heading: ["x", "y"].join(ch(0x202f)), body: ["p", "q", "r", "s"].join(ch(0x2003)) }] },
      { summary: `uno${ch(0x3000)}due${ch(0x2028)}tre${ch(0x1680)}quattro`, sections: [{ heading: `${ch(0x205f)}cinque`, body: `sei${ch(0x2009)}sette\n\notto\tnove` }] },
      { summary: "   spazi   in   testa   ", sections: [{ heading: "''", body: "l'' 'x' ’y’ ///a" }] },
      { summary: "Dorothy, Merlin e Dracula: 3 Leggendarie per 12 carte base.", sections: [] },
    ];
    for (const s of samples) {
      const site = G.communityGuideWords(s);
      assert.ok(maxWords(s.summary, s.sections) >= site, `${JSON.stringify(s)}: ${maxWords(s.summary, s.sections)} < ${site}`);
    }
  });

  test("un numero inventato su una guida corta supera il massimo", () => {
    const short = { summary: "Una guida corta.", sections: [{ heading: "Piano", body: "Gioca le carte giuste." }] };
    assert.ok(maxWords(short.summary, short.sections) < 300);
    assert.ok(99999 > maxWords(short.summary, short.sections));
  });
});

describe("database: segnalazioni", () => {
  test("5 al giorno, mai sulla propria guida, avviso allo staff solo alla prima della giornata", () => {
    const report = last(/^create (?:or replace )?function public\.guard_community_guide_report\(/);
    assert.ok(report.includes(`if n >= ${G.REPORT_DAILY_LIMIT} then raise exception 'report_rate'`));
    assert.equal(G.REPORT_DAILY_LIMIT, 5);
    assert.ok(report.includes("new.first_in_day := not exists ( select 1 from public.community_guide_reports r where r.guide_id = new.guide_id and r.created_at > now() - interval '1 day' )"));
    assert.ok(last(/^alter table public\.community_guide_reports add constraint community_guide_reports_reason_check/).includes(`(reason, ${G.REPORT_REASON_MIN}, ${G.REPORT_REASON_MAX}, true)`));
    const insert = last(/^create policy "guide reports: users report published guides"/);
    assert.ok(insert.includes("g.status = 'published' and g.owner <> (select auth.uid())"), "niente segnalazioni sulla propria guida");
    const select = last(/^create policy "guide reports: own and staff read"/);
    assert.match(select, /for select to authenticated using \(user_id = \(select auth\.uid\(\)\) or \(select public\.is_staff\(\)\)\)/);
    assert.ok(stmts.includes('drop policy if exists "guide reports: staff read" on public.community_guide_reports'), "la vecchia policy di sola lettura dello staff si toglie");
  });

  test("si cancellano con l'account di chi le ha fatte, come dice l'informativa", () => {
    assert.match(last(/^create table if not exists public\.community_guide_reports /), /user_id uuid not null references public\.profiles\(id\) on delete cascade/);
    assert.ok(stmts.includes("alter table public.community_guide_reports add constraint community_guide_reports_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade"));
    for (const locale of ["en", "it", "es"] as const) assert.doesNotMatch(L.communityGuideLabels[locale].privacy, /set null|anonim/i);
    assert.match(L.communityGuideLabels.it.privacy, /nome utente/);
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
  const base = { lang: "it", category: "decks", cover_preset: "keyart-mulan", title: "Dorothy Combo in classificata", summary: LONG_SUMMARY };

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
    assert.equal(r.value.cover_preset, "keyart-mulan");
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
    // i vecchi disegni a gradiente non sono più copertine
    assert.deepEqual(err({ ...base, cover_preset: "mint", section_heading_0: "A", section_body_0: "B" }), { code: "cover" });
    assert.deepEqual(err({ ...base, cover_preset: "toString", section_heading_0: "A", section_body_0: "B" }), { code: "cover" });
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
    assert.equal(G.guideErrorCode({ code: "42501", message: "guide_hidden_recent" }), "guide_hidden_recent", "non confuso con guide_hidden");
    assert.equal(G.guideErrorCode({ code: "23514", message: "guide_translation" }), "guide_translation");
    assert.equal(G.guideErrorCode({ code: "42501", message: 'new row violates row-level security policy for table "community_guides"' }), "forbidden");
    assert.equal(G.guideErrorCode({ code: "23505", message: "duplicate key" }), "duplicate");
    assert.equal(G.guideErrorCode({ code: "PGRST205", message: "Could not find the table 'public.community_guides' in the schema cache" }), "unavailable");
    assert.equal(G.guideErrorCode({ code: "42P01", message: 'relation "public.community_guides" does not exist' }), "unavailable");
    assert.equal(G.guideErrorCode({ code: "42703", message: 'column community_guides.words does not exist' }), "unavailable");
    assert.equal(G.guideErrorCode({ code: "XX000", message: "boom" }), "db");
    assert.equal(G.guideErrorCode(null), "db");
    assert.ok(!G.guideTableMissing({ code: "23505", message: "duplicate" }));
  });
});

/** Un testo di `n` parole. */
const words = (n: number) => Array.from({ length: n }, (_, i) => `parola${i}`).join(" ");
const LOCALES = ["en", "it", "es"] as const;
type Lang = (typeof LOCALES)[number];

describe("parole, lingue, indicizzazione", () => {
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
    assert.deepEqual(G.communityGuideIndexing(thin, LOCALES as never, "it" as never), { languages: [], noindex: true, hreflang: false });
    const ok = guide(300);
    assert.deepEqual(G.communityGuideIndexing(ok, LOCALES as never, "it" as never), { languages: ["it"], noindex: false, hreflang: true });
    assert.equal(G.communityGuideIndexing(ok, LOCALES as never, "en" as never).noindex, true, "la versione non tradotta è noindex");
    assert.equal(G.communityGuideIndexable({ ...(ok as object), status: "hidden" } as never), false);
  });

  test("traduzioni: valgono solo sul testo attuale e con le stesse sezioni", () => {
    const g0 = guide(300);
    const hash = G.communityGuideHash(g0);
    const tr = { hash, at: "2026-09-27T10:00:00Z", guide: { summary: "Summary", sections: [{ heading: "Mulligan", body: "Text" }] } };
    const g1 = guide(300, { translations: { en: tr, es: { ...tr, hash: "vecchia" }, it: tr } });
    assert.deepEqual(G.guideShapeLocales(G.indexShapeOf(g1), LOCALES as never), ["en", "it"]);
    assert.deepEqual(G.missingGuideLocales(g1, LOCALES as never), ["es"]);
    assert.equal(G.localizedCommunityGuide(g1, "en" as never).translated, true);
    assert.equal(G.localizedCommunityGuide(g1, "es" as never).lang, "it");
    assert.equal(G.localizedCommunityGuide(g1, "it" as never).translated, false, "nella lingua dell'autore sempre l'originale");
    const fewer = guide(300, { translations: { en: { ...tr, guide: { summary: "S", sections: [] } } } });
    assert.equal(G.freshGuideTranslation(fewer, "en" as never), null);
    // il titolo non entra nell'impronta: cambiarlo non butta via le traduzioni
    assert.equal(G.communityGuideHash({ ...(g0 as object), title: "Altro" } as never), hash);
    assert.notEqual(G.communityGuideHash({ ...(g0 as object), lang: "es" } as never), hash);
  });

  test("una traduzione scritta via API con segni di direzione, invisibili, titoli su più righe o testo enorme non vale", () => {
    const g0 = guide(300);
    const hash = G.communityGuideHash(g0);
    const tr = (text: unknown) => guide(300, { translations: { en: { hash, at: "2026-09-27T10:00:00Z", guide: text } } });
    assert.ok(G.freshGuideTranslation(tr({ summary: "Summary", sections: [{ heading: "Mulligan", body: "Text" }] }), "en" as never));
    const bad = [
      { summary: "Evil \u202e text", sections: [{ heading: "Mulligan", body: "Text" }] },
      { summary: "Summary", sections: [{ heading: "Two\nlines", body: "Text" }] },
      { summary: "x".repeat(G.TRANSLATION_LIMITS.summaryMax + 1), sections: [{ heading: "Mulligan", body: "Text" }] },
      { summary: "Summary", sections: [{ heading: "\u3164\u3164\u3164", body: "Text" }] },
      { summary: "Summary", sections: [{ heading: "Mulligan", body: "a\n\n\n\nb" }] },
      { summary: "Summary", sections: [{ heading: "Mulligan", body: 3 }] },
      "testo",
    ];
    for (const text of bad) assert.equal(G.freshGuideTranslation(tr(text), "en" as never), null, JSON.stringify(text).slice(0, 60));
  });
});

describe("elenchi leggeri", () => {
  const tr = (hash: string, summary = "The English summary of the guide.") => ({ hash, at: "2026-09-28T09:00:00.000Z", guide: { summary, sections: [{ heading: "Mulligan", body: "Keep Dorothy." }] } });
  const full = (extra: Record<string, unknown> = {}) => {
    const base = {
      id: "g1",
      slug: "dorothy-ab12",
      owner: "o1",
      title: "Dorothy Combo: la guida",
      category: "decks",
      cover_preset: "keyart-mulan",
      status: "published",
      created_at: "2026-09-27T10:00:00+00:00",
      updated_at: "2026-09-27T10:00:00+00:00",
      published_at: "2026-09-27T10:00:00+00:00",
      lang: "it",
      summary: words(20),
      sections: [{ heading: "Mulligan", body: words(300) }],
      cards: [],
      translations: null,
      ...extra,
    };
    return base as never as Parameters<typeof G.listItemOf>[0];
  };

  test("le stesse risposte della pagina, calcolate senza sezioni né traduzioni intere", () => {
    const g0 = full();
    const g = full({ translations: { en: tr(G.communityGuideHash(g0)), es: tr("vecchia") } });
    const item = G.listItemOf(g);
    for (const l of LOCALES) assert.deepEqual(G.guideShapeIndexing(item, LOCALES as never, l as never), G.communityGuideIndexing(g, LOCALES as never, l as never), l);
    assert.equal(item.words, G.communityGuideWords(g));
    assert.equal(item.text_hash, G.communityGuideHash(g));
    assert.ok(!("sections" in item) && !("translations" in item), "la voce non porta il testo intero");
    assert.deepEqual(G.guideShapeSummary(item, "en" as never), { text: "The English summary of the guide.", lang: "en" });
    assert.equal(G.guideShapeSummary(item, "es" as never).lang, "it", "la traduzione vecchia non si mostra");
  });

  test("parole non salvate o impronta diversa (testo cambiato fuori dal sito): la guida non si indicizza negli elenchi", () => {
    const item = G.listItemOf(full({ translations: null }));
    assert.equal(G.guideShapeIndexable({ ...item, words: null }), false);
    const withTr = { ...item, tr: { en: { hash: item.text_hash, at: "2026-09-28T09:00:00.000Z", summary: "Summary" } } };
    assert.deepEqual(G.guideShapeLocales(withTr, LOCALES as never), ["en", "it"]);
    assert.deepEqual(G.guideShapeLocales({ ...withTr, text_hash: "altro" }, LOCALES as never), ["it"]);
    assert.deepEqual(G.guideShapeLocales({ ...withTr, text_hash: null }, LOCALES as never), ["it"]);
    // un riassunto tradotto che non rispetta le regole non conta
    assert.deepEqual(G.guideShapeLocales({ ...withTr, tr: { en: { ...withTr.tr.en, summary: "a\u202eb" } } }, LOCALES as never), ["it"]);
    // la data della versione tradotta è quella dell'arrivo della traduzione
    assert.equal(G.guideShapeDate(withTr, "en" as never), "2026-09-28T09:00:00.000Z");
    assert.equal(G.guideShapeDate(withTr, "it" as never), item.updated_at);
  });
});

describe("sitemap e date degli elenchi", () => {
  type Row = { slug: string; lang: Lang; status: string; words: number | null; text_hash: string | null; tr: Record<string, { hash: string | null; at: string | null; summary: string | null }>; updated_at: string; published_at: string; cover_preset: string };
  const row = (slug: string, extra: Partial<Row> = {}): Row => ({
    slug,
    lang: "it",
    status: "published",
    words: 400,
    text_hash: `h-${slug}`,
    tr: {},
    updated_at: "2026-09-20T10:00:00+00:00",
    published_at: "2026-09-20T10:00:00+00:00",
    cover_preset: "keyart-mulan",
    ...extra,
  });

  test("solo sopra soglia e pubblicate, con le loro lingue, la data di ogni versione e la copertina", () => {
    const rows = [
      row("a", { updated_at: "2026-09-27T10:00:00+00:00", published_at: "2026-09-27T10:00:00+00:00" }),
      row("b", { words: 10, updated_at: "2026-09-30T10:00:00+00:00" }),
      row("c", { status: "hidden", updated_at: "2026-09-29T10:00:00+00:00" }),
      row("d", { tr: { en: { hash: "h-d", at: "2026-09-29T08:00:00.000Z", summary: "An English summary." } }, updated_at: "2026-09-26T10:00:00+00:00", published_at: "2026-09-26T10:00:00+00:00" }),
      row("e", { words: null }),
    ];
    const out = G.sitemapCommunityGuides(rows as never, LOCALES as never);
    assert.deepEqual(
      out.guides.map((g) => [g.slug, g.locales, g.dates, g.image]),
      [
        ["a", ["it"], { it: "2026-09-27T10:00:00+00:00" }, "/media/keyart-mulan.webp"],
        ["d", ["en", "it"], { en: "2026-09-29T08:00:00.000Z", it: "2026-09-26T10:00:00+00:00" }, "/media/keyart-mulan.webp"],
      ],
    );
    // la guida sottile del 30/09 e quella nascosta non spostano le date delle pagine che non le mostrano
    assert.deepEqual(out.hub, { en: "2026-09-29T08:00:00.000Z", it: "2026-09-27T10:00:00+00:00" });
    assert.deepEqual(out.list, out.hub);
    assert.deepEqual(G.sitemapCommunityGuides([], LOCALES as never), { guides: [], hub: {}, list: {} });
  });

  test("/guides guarda solo le guide che mostra (le più recenti), /guides/community tutte", () => {
    const rows = Array.from({ length: G.COMMUNITY_GUIDES_ON_HUB + 1 }, (_, i) =>
      row(`g${i}`, {
        published_at: `2026-09-${String(10 + i).padStart(2, "0")}T10:00:00+00:00`,
        // la più vecchia (fuori da /guides) è stata modificata per ultima
        updated_at: i === 0 ? "2026-09-29T10:00:00+00:00" : `2026-09-${String(10 + i).padStart(2, "0")}T10:00:00+00:00`,
      }),
    );
    const out = G.sitemapCommunityGuides(rows as never, LOCALES as never);
    assert.equal(out.list.it, "2026-09-29T10:00:00+00:00");
    assert.equal(out.hub.it, `2026-09-${10 + G.COMMUNITY_GUIDES_ON_HUB}T10:00:00+00:00`);
    assert.deepEqual(
      (G.guidesIndexableIn(rows as never, LOCALES as never, "it" as never) as unknown as Row[]).map((r) => r.slug).slice(0, 2),
      [`g${G.COMMUNITY_GUIDES_ON_HUB}`, `g${G.COMMUNITY_GUIDES_ON_HUB - 1}`],
      "dalla più recente",
    );
  });
});

describe("traduzione a pezzi", () => {
  const big = (n: number) => ({ lang: "it" as const, summary: "Riassunto della guida.", sections: Array.from({ length: n }, (_, i) => ({ heading: `Sezione ${i + 1}`, body: `${"testo ".repeat(660)}fine ${i + 1}` })) });
  const size = (doc: Record<string, string>) => Object.values(doc).reduce((n, v) => n + v.length, 0);

  test("gruppi entro 8000 caratteri, una sezione mai divisa, ogni campo una volta sola", () => {
    const g = big(12);
    const plan = G.planGuideTranslation(g, null);
    assert.equal(plan.parts.length, 13);
    assert.ok(plan.chunks.length >= 6);
    for (const c of plan.chunks) {
      assert.ok(size(c) <= G.TRANSLATION_CHUNK_CHARS, `gruppo di ${size(c)} caratteri`);
      for (const k of Object.keys(c)) if (k.startsWith("heading_")) assert.ok(`body_${k.slice(8)}` in c, "titolo e testo della sezione insieme");
      assert.ok(G.translationMaxTokens(c) <= 16000 && G.translationMaxTokens(c) >= 1000);
    }
    assert.deepEqual(sorted(plan.chunks.flatMap((c) => Object.keys(c))), sorted(Object.keys(G.guideTranslationDoc(g))));
    assert.equal(G.translationMaxTokens({ a: "x".repeat(8000) }), 5000);
    assert.equal(G.translationMaxTokens({ a: "x".repeat(100_000) }), 16000);
  });

  test("riuso: una modifica ritraduce solo le parti cambiate, anche con le sezioni spostate", () => {
    const g = { lang: "it" as const, summary: "Riassunto", sections: [{ heading: "A", body: "Uno" }, { heading: "B", body: "Due" }] };
    const prev = { hash: "x", at: "2026-09-27T10:00:00Z", parts: G.guidePartHashes(g), guide: { summary: "Summary", sections: [{ heading: "A-en", body: "One" }, { heading: "B-en", body: "Two" }] } };
    const g2 = { ...g, sections: [{ heading: "B", body: "Due" }, { heading: "A", body: "Uno cambiato" }] };
    const plan = G.planGuideTranslation(g2, prev);
    assert.equal(plan.summary, "Summary");
    assert.deepEqual(plan.sections, [{ heading: "B-en", body: "Two" }, null]);
    assert.deepEqual(plan.chunks, [{ heading_2: "A", body_2: "Uno cambiato" }]);
    assert.deepEqual(G.assembleGuideTranslation(g2, plan, [{ heading_2: "A-en", body_2: "One, changed" }]), {
      summary: "Summary",
      sections: [
        { heading: "B-en", body: "Two" },
        { heading: "A-en", body: "One, changed" },
      ],
    });
    // cambiata la lingua dell'originale, o senza impronte delle parti, non si riusa nulla
    assert.equal(G.planGuideTranslation({ ...g, lang: "es" }, prev).summary, null);
    assert.equal(G.planGuideTranslation(g, { ...prev, parts: undefined }).summary, null);
    // una traduzione salvata rovinata non si riusa
    assert.equal(G.planGuideTranslation(g, { ...prev, guide: { ...prev.guide, summary: "a\u202eb" } }).summary, null);
  });

  test("riunione: un pezzo mancante dà null; il testo tradotto si pulisce come il database lo accetta", () => {
    const g = { lang: "it" as const, summary: "Riassunto", sections: [{ heading: "A", body: "Uno" }] };
    const plan = G.planGuideTranslation(g, null);
    assert.equal(G.assembleGuideTranslation(g, plan, []), null);
    assert.equal(G.assembleGuideTranslation(g, plan, [null]), null);
    assert.equal(G.assembleGuideTranslation(g, plan, [{ summary: "Summary", heading_1: "A" }]), null);
    assert.deepEqual(G.assembleGuideTranslation(g, plan, [{ summary: " Summary\u202e ", heading_1: "Title on\ntwo lines", body_1: "One\r\n\r\n\r\n\r\nTwo" }]), {
      summary: "Summary",
      sections: [{ heading: "Title on two lines", body: "One\n\nTwo" }],
    });
  });

  /** Un client finto dell'API: traduce anteponendo la lingua, conta le richieste in corso insieme. */
  function fakeClient(respond: (doc: Record<string, string>, to: string) => Record<string, string> | Error | "refusal" = (doc, to) => Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, `[${to}] ${v}`]))) {
    const calls: { doc: Record<string, string>; to: string; maxTokens: number; timeout: number }[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const create = async (req: { max_tokens: number; messages: { content: string }[] }, opts: { timeout: number }) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight--;
      const content = req.messages[0].content;
      const doc = JSON.parse(content.slice(content.indexOf("GUIDE:\n") + 7)) as Record<string, string>;
      const to = /TARGET LANGUAGE: (\w+)/.exec(content)![1];
      calls.push({ doc, to, maxTokens: req.max_tokens, timeout: opts.timeout });
      const r = respond(doc, to);
      if (r instanceof Error) throw r;
      if (r === "refusal") return { stop_reason: "refusal", model: "m", content: [] };
      return { stop_reason: "end_turn", model: "claude-opus-5", content: [{ type: "text", text: JSON.stringify(r) }] };
    };
    return { client: { beta: { messages: { create } } } as never, calls, maxInFlight: () => maxInFlight };
  }

  test("una guida lunga in due lingue: a pezzi, al massimo 4 richieste insieme, max_tokens dalla lunghezza", async () => {
    const g = big(12);
    const fake = fakeClient();
    const out = await C.translateGuideText(fake.client, g, ["en", "it", "es"] as never, [], { now: () => "2026-09-27T12:00:00.000Z" });
    assert.deepEqual(Object.keys(out).sort(), ["en", "es"], "mai nella lingua dell'originale");
    const plan = G.planGuideTranslation(g, null);
    assert.equal(fake.calls.length, plan.chunks.length * 2);
    assert.ok(fake.maxInFlight() <= C.TRANSLATION_CONCURRENCY);
    for (const c of fake.calls) {
      assert.equal(c.maxTokens, G.translationMaxTokens(c.doc));
      assert.equal(c.timeout, C.CHUNK_TIMEOUT_MS);
    }
    const en = out.en!;
    assert.equal(en.hash, G.communityGuideHash(g));
    assert.deepEqual(en.parts, G.guidePartHashes(g));
    assert.equal(en.at, "2026-09-27T12:00:00.000Z");
    assert.equal(en.guide.sections.length, 12);
    assert.ok(en.guide.sections.every((s, i) => s.heading === `[English] Sezione ${i + 1}`));
    // la traduzione salvata vale per la pagina
    assert.ok(G.freshGuideTranslation({ ...g, translations: { en } } as never, "en" as never));
  });

  test("un pezzo che non riesce fa saltare solo quella lingua; al giro dopo si riusa quello che c'era", async () => {
    const g = big(4);
    const errors: string[] = [];
    let failed = false;
    const fake = fakeClient((doc, to) => {
      if (to === "Spanish" && !failed) {
        failed = true;
        return new Error("timeout");
      }
      return Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, `[${to}] ${v}`]));
    });
    const out = await C.translateGuideText(fake.client, g, ["en", "es"] as never, [], { onError: (to) => errors.push(to) });
    assert.deepEqual(Object.keys(out), ["en"]);
    assert.deepEqual(errors, ["es"]);

    // l'autore corregge una sezione: in inglese si ritraduce solo quella
    const edited = { ...g, translations: { en: out.en }, sections: g.sections.map((s, i) => (i === 2 ? { ...s, body: `${s.body} corretto` } : s)) };
    const again = fakeClient();
    const out2 = await C.translateGuideText(again.client, edited, ["en"] as never, []);
    assert.equal(again.calls.length, 1);
    assert.deepEqual(Object.keys(again.calls[0].doc), ["heading_3", "body_3"]);
    assert.equal(out2.en!.guide.sections[0].heading, out.en!.guide.sections[0].heading);
    assert.ok(out2.en!.guide.sections[2].body.endsWith("corretto"));
  });

  test("un rifiuto dell'API o una risposta con i campi sbagliati: nessuna traduzione, nessuna eccezione", async () => {
    const g = big(1);
    assert.deepEqual(await C.translateGuideText(fakeClient(() => "refusal").client, g, ["en"] as never, []), {});
    assert.deepEqual(await C.translateGuideText(fakeClient(() => ({ other: "x" })).client, g, ["en"] as never, []), {});
    assert.deepEqual(await C.runLimited([async () => 1, async () => 2, async () => 3], 2), [1, 2, 3]);
  });

  test("la richiesta usa le regole e il glossario comuni, con il tetto dei token passato", () => {
    const req = T.translationRequestFor({ summary: "x" }, "it", "es", [], T.STRATEGY_GUIDE_TRANSLATION_SYSTEM, { maxTokens: 1200 });
    assert.equal(req.max_tokens, 1200);
    assert.equal(T.translationRequestFor({ summary: "x" }, "it", "es", [], T.TRANSLATION_SYSTEM).max_tokens, 16000, "i mazzi restano come prima");
    const text = { summary: "Intro", sections: [{ heading: "A", body: "Uno" }, { heading: "B", body: "Due" }] };
    const doc = G.guideTranslationDoc(text);
    assert.deepEqual(Object.keys(doc), ["summary", "heading_1", "body_1", "heading_2", "body_2"]);
    assert.deepEqual(G.guideTextFromDoc(doc, 2), text);
    assert.equal(G.guideTextFromDoc({ summary: "x", heading_1: "A" }, 1), null);
    assert.deepEqual((T.translationRequestFor(doc, "it", "es", [], T.STRATEGY_GUIDE_TRANSLATION_SYSTEM).output_config.format.schema as { required: string[] }).required, Object.keys(doc));
  });
});

describe("letture difensive", () => {
  test("sezioni rovinate scartate, copertina caricata solo nella cartella del proprietario", () => {
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
    image: "/media/keyart-mulan.webp",
  };

  test("annuncio: solo la versione originale (le altre mostrano ancora l'originale), copertina, testi degli utenti ripuliti", () => {
    const p = D.guidePayload(g);
    const e = p.embeds![0];
    assert.match(e.url!, /^https:\/\/originsmeta\.com\/es\/guides\/community\/dorothy-combo-ab12\?utm_source=discord/);
    assert.deepEqual(
      e.fields!.map((f) => f.name),
      ["🇪🇸 Español"],
    );
    assert.ok(!JSON.stringify(p).includes("/it/guides/community/") && !JSON.stringify(p).includes("/en/guides/community/"), "niente link alle versioni non ancora tradotte");
    assert.equal(e.image?.url, "https://originsmeta.com/media/keyart-mulan.webp");
    assert.equal(D.guidePayload({ ...g, image: "https://evil.example/x.png" }).embeds![0].image, undefined, "solo immagini del sito");
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
  test("Article con l'autore Person del membro (lo stesso @id del profilo), carte citate e parte di /guides/community", async () => {
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
      image: "https://originsmeta.com/media/keyart-mulan.webp",
      author,
      cards: [{ slug: "dorothy", key: "C123", name: "Dorothy" }],
      words: 420,
      section: "Guías de mazos",
    });
    assert.equal(node["@type"], "Article");
    assert.equal(node["@id"], "https://originsmeta.com/es/guides/community/dorothy-combo-ab12#article");
    assert.equal((node.author as { "@id": string })["@id"], "https://originsmeta.com/#user-vegakiles");
    assert.deepEqual(node.isPartOf, { "@id": "https://originsmeta.com/es/guides/community#collection" });
    assert.equal((node.mentions as { "@id": string }[])[0]["@id"], "https://originsmeta.com/#card-C123");
    assert.equal(node.inLanguage, "es");
    assert.equal(node.wordCount, 420);
    assert.equal(node.image, "https://originsmeta.com/media/keyart-mulan.webp");
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

  test("un messaggio per ogni errore del modulo, del database e delle segnalazioni", () => {
    const codes = ["title", "summary", "sections", "heading", "body", "category", "lang", "cover", "cards", "notLoggedIn", "forbidden", "disabled", "unavailable", "guide_daily_limit", "guide_limit", "guide_rate", "guide_hidden", "guide_hidden_recent", "guide_status", "duplicate", "db"];
    for (const locale of ["en", "it", "es"] as const) for (const c of codes) assert.ok(L.communityGuideLabels[locale].errors[c as keyof typeof L.communityGuideLabels.en.errors], `${locale}: ${c}`);
    for (const locale of ["en", "it", "es"] as const) for (const c of ["reason", "duplicate", "report_rate", "notLoggedIn", "own", "forbidden", "db"]) assert.ok(L.communityGuideLabels[locale].report.errors[c as "db"], `${locale}: report ${c}`);
    // i tetti detti nei messaggi sono quelli del database
    assert.match(L.communityGuideLabels.it.errors.guide_daily_limit, new RegExp(`\\b${G.GUIDE_DAILY_PUBLISH_LIMIT}\\b`));
    assert.match(L.communityGuideLabels.en.errors.guide_limit, new RegExp(`\\b${G.GUIDE_MAX_PER_OWNER}\\b`));
    assert.match(L.communityGuideLabels.es.errors.guide_rate, new RegExp(`\\b${G.GUIDE_DAILY_NEW_LIMIT}\\b`));
    assert.match(L.communityGuideLabels.en.errors.guide_hidden_recent, /24 hours/);
  });

  test("un nome per ogni copertina; il riquadro dice \"nelle altre due lingue\" e non è al maschile", () => {
    for (const locale of ["en", "it", "es"] as const) assert.deepEqual(sorted(Object.keys(L.communityGuideLabels[locale].editor.covers)), sorted(G.GUIDE_COVER_PRESETS));
    assert.doesNotMatch(L.communityGuideLabels.it.cta.text, /da solo|inglese, italiano e spagnolo/);
    assert.match(L.communityGuideLabels.it.cta.text, /altre due lingue/);
    assert.match(L.communityGuideLabels.en.cta.text, /other two languages/);
    assert.match(L.communityGuideLabels.es.cta.text, /otros dos idiomas/);
  });
});
