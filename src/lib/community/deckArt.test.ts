/**
 * Test delle immagini caricate per guide e mazzi (29/09/2026) con il runner integrato di Node:
 * `node --test src/lib/community/deckArt.test.ts`.
 *
 * - Regole pure dell'artwork della Leggendaria (deckArt.ts): percorsi, ruolo di chi l'ha pubblicato, campo del modulo,
 *   errori del database.
 * - Blocco "29/09/2026: IMMAGINI" di supabase/schema.sql uguale al codice: colonna e vincolo di `art_path`, trigger
 *   dell'artwork (ruoli di DECK_ART_BADGES) e della copertina delle guide (cartella e peso di guides.ts), file in uso, e le
 *   policy del bucket che valgono DOPO la migrazione (le ultime scritte nel file: prendono il posto di quelle del blocco
 *   VETRINA) con cartelle, ruoli e tetti di profileMedia.ts e badges.ts.
 * - Strumento dello staff (scripts/clear-profile-media.mjs): --orphans conta come in uso copertine e artwork.
 * - Etichette nelle tre lingue (deckArtLabels.ts) e paragrafo della privacy.
 *
 * Import senza estensione come in guides.test.ts: un hook di risoluzione aggiunge `.ts`.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
const A: typeof import("./deckArt") = await import("./deckArt.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const B: typeof import("./badges") = await import("./badges.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const M: typeof import("./profileMedia") = await import("./profileMedia.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const G: typeof import("./guides") = await import("./guides.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const L: typeof import("../deckArtLabels") = await import("../deckArtLabels.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const SL: typeof import("../showcaseLabels") = await import("../showcaseLabels.ts");
const S: typeof import("../../../scripts/schema-guard.mjs") = await import("../../../scripts/schema-guard.mjs");

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const sorted = (xs: readonly string[]) => [...xs].sort();
/** Gli elementi fra apici di un elenco SQL: "('creator', 'staff')" → ["creator", "staff"]. */
const quoted = (s: string) => [...s.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);

const OWNER = "0d0a3c9e-1234-4abc-9def-0123456789ab";
const OTHER = "11111111-2222-4333-8444-555555555555";
const FILE = "7f3c2a10-9b8e-4d6c-a5f4-3e2d1c0b9a87.webp";
const BASE = "https://obpnprlzxrlbvncpqlpq.supabase.co";

describe("artwork della Leggendaria: regole pure", () => {
  test("percorso nella cartella dei mazzi, e con owner di quel proprietario", () => {
    const path = `${OWNER}/deck/${FILE}`;
    assert.ok(A.deckArtPathOk(path));
    assert.ok(A.deckArtPathOk(path, OWNER));
    assert.ok(!A.deckArtPathOk(path, OTHER), "cartella di un altro");
    assert.ok(!A.deckArtPathOk(`${OWNER}/guide/${FILE}`), "non la copertina di una guida");
    assert.ok(!A.deckArtPathOk(`${OWNER}/avatar/${FILE}`), "non la foto profilo");
    assert.ok(!A.deckArtPathOk(`${OWNER}/decks/${FILE}`));
    assert.ok(!A.deckArtPathOk(`${OWNER}/deck/../x.webp`));
    assert.ok(!A.deckArtPathOk(`${OWNER}/deck/${FILE.replace("webp", "svg")}`));
    assert.ok(!A.deckArtPathOk(`${OWNER.toUpperCase()}/deck/${FILE}`), "l'id come lo scrive il database, in minuscolo");
    assert.ok(!A.deckArtPathOk(`${OWNER}/deck/${"a".repeat(170)}.webp`), "oltre i 200 caratteri");
    assert.ok(!A.deckArtPathOk(path, "non-un-uuid"));
    assert.ok(!A.deckArtPathOk(null) && !A.deckArtPathOk(42));
  });

  test("si mostra solo per Creator e Staff di oggi, con un percorso del proprietario", () => {
    const deck = (badge: string | null, art: string | null = `${OWNER}/deck/${FILE}`) => ({ owner: OWNER, art_path: art, profile: { badge } });
    assert.equal(A.deckArtUrl(deck("creator"), BASE), `${BASE}/storage/v1/object/public/profile-media/${OWNER}/deck/${FILE}`);
    assert.equal(A.deckArtUrl(deck("staff"), `${BASE}/`), `${BASE}/storage/v1/object/public/profile-media/${OWNER}/deck/${FILE}`);
    for (const badge of ["community", "author", "pro", "influencer", null]) assert.equal(A.deckArtUrl(deck(badge), BASE), null, String(badge));
    assert.equal(A.deckArtUrl(deck("creator", null), BASE), null);
    assert.equal(A.deckArtUrl(deck("creator", `${OTHER}/deck/${FILE}`), BASE), null, "file di un altro utente");
    assert.equal(A.deckArtUrl({ owner: OWNER, art_path: `${OWNER}/deck/${FILE}` }, BASE), null, "senza profilo niente artwork");
  });

  test("campo del modulo: assente, vuoto, valido, non valido", () => {
    assert.equal(A.readDeckArtField(null), undefined, "senza campo la colonna non si tocca");
    assert.equal(A.readDeckArtField(undefined), undefined);
    assert.equal(A.readDeckArtField(""), null);
    assert.equal(A.readDeckArtField("   "), null);
    assert.equal(A.readDeckArtField(` ${OWNER}/deck/${FILE} `), `${OWNER}/deck/${FILE}`);
    assert.equal(A.readDeckArtField(`${OWNER}/cover/${FILE}`), false);
    assert.equal(A.readDeckArtField("https://example.com/x.webp"), false);
  });

  test("errori del database: colonna mancante, ruolo, file", () => {
    assert.ok(A.missingArtColumn({ code: "PGRST204", message: "Could not find the 'art_path' column of 'community_decks' in the schema cache" }));
    assert.ok(A.missingArtColumn({ code: "42703", message: "column community_decks.art_path does not exist" }));
    assert.ok(!A.missingArtColumn({ code: "PGRST204", message: "Could not find the 'links' column" }));
    assert.ok(!A.missingArtColumn({ code: "23514", message: "deck_art_file" }));
    assert.ok(!A.missingArtColumn(null));
    assert.equal(A.deckArtErrorCode({ message: "deck_art_role" }), "artRole");
    assert.equal(A.deckArtErrorCode({ message: "deck_art_file" }), "artFile");
    assert.equal(A.deckArtErrorCode({ message: 'new row for relation "community_decks" violates check constraint "community_decks_art_path_check"' }), "artFile");
    assert.equal(A.deckArtErrorCode({ message: "duplicate key" }), null);
    assert.equal(A.deckArtErrorCode(null), null);
  });

  test("misure: 5:7 come le carte, la minima nelle stesse proporzioni, 2 MB come il bucket", () => {
    assert.equal(A.DECK_ART_SIZE.width * 7, A.DECK_ART_SIZE.height * 5);
    assert.equal(A.DECK_ART_MIN.width * 7, A.DECK_ART_MIN.height * 5);
    assert.ok(A.DECK_ART_MIN.width < A.DECK_ART_SIZE.width);
    assert.equal(A.DECK_ART_MAX_BYTES, M.COVER_MAX_BYTES);
    assert.equal(A.DECK_ART_ASPECT, 5 / 7);
    assert.ok(M.MEDIA_KINDS.includes(A.DECK_ART_FOLDER as never));
    assert.ok(M.MEDIA_KINDS.includes(G.GUIDE_COVER_FOLDER as never));
  });

  test("permesso: Creator, Staff e admin", () => {
    assert.deepEqual(sorted(B.DECK_ART_BADGES), ["creator", "staff"]);
    for (const badge of [...B.BADGES, "influencer", null]) {
      for (const role of ["user", "admin", null]) {
        assert.equal(B.canUseDeckArt(badge, role), role === "admin" || badge === "creator" || badge === "staff", `${badge}/${role}`);
      }
    }
  });
});

/*
  Il blocco dello schema: dal titolo al successivo (o alla fine del file). Le policy del bucket si leggono anche dallo
  schema intero: valgono le ultime scritte, quelle di questo blocco.
*/
describe("database: blocco IMMAGINI di supabase/schema.sql", () => {
  const MARKER = "-- ===== 29/09/2026: IMMAGINI =====";
  const schema = read("../../../supabase/schema.sql");
  const at = schema.indexOf(MARKER);
  const next = at >= 0 ? schema.indexOf("\n-- ===== ", at + MARKER.length) : -1;
  const block = at >= 0 ? schema.slice(at, next < 0 ? undefined : next) : "";
  const stmts = S.sqlStatements(block);
  const fullStmts = S.sqlStatements(schema);
  const one = (re: RegExp) => {
    const found = stmts.filter((s) => re.test(s));
    assert.equal(found.length, 1, `${re}: ${found.length} istruzioni`);
    return found[0];
  };
  const lastInSchema = (re: RegExp) => fullStmts.filter((s) => re.test(s)).at(-1) ?? "";

  test("il blocco c'è, dopo GUIDE e DATE E FOTO, e si può applicare", () => {
    assert.ok(at > 0, "manca il blocco");
    assert.ok(at > schema.indexOf("-- ===== 27/09/2026: GUIDE ====="), "dopo il blocco GUIDE (le policy leggono community_guides)");
    assert.ok(at > schema.indexOf("-- ===== 27/09/2026: DATE E FOTO ====="));
    assert.deepEqual(S.schemaProblems(schema), []);
    assert.deepEqual(S.singleDollarLines(block), []);
    assert.deepEqual(S.overLongRepetitions(block), []);
    // niente grant né revoke su public.profiles (schema-guard.mjs)
    assert.deepEqual(
      stmts.filter((s) => /^(grant|revoke)\b/.test(s) && /\bpublic\.profiles\b/.test(s)),
      [],
    );
  });

  test("artwork del mazzo: colonna, vincolo uguale al codice, indice", () => {
    one(/^alter table public\.community_decks add column if not exists art_path text$/);
    one(/add constraint community_decks_art_path_check/);
    // dal testo del file (sqlStatements scrive tutto in minuscolo): la stessa espressione del codice, lettera per lettera
    assert.ok(block.includes(`char_length(art_path) <= 200 and art_path ~ ('^' || owner::text || '/${A.DECK_ART_FOLDER}/${M.MEDIA_FILE_RE}$')`));
    one(/^create index if not exists community_decks_art_path_idx on public\.community_decks \(art_path\) where art_path is not null$/);
  });

  test("trigger dell'artwork: ruoli di DECK_ART_BADGES più gli admin, file con il peso del codice", () => {
    const fn = one(/^create or replace function public\.guard_deck_art\(/);
    assert.match(fn, /set search_path = public, pg_temp/);
    assert.doesNotMatch(fn, /security definer/, "con i privilegi di chi salva: vede solo la sua cartella");
    const roles = /p\.id = new\.owner and \(p\.role = 'admin' or p\.badge in \(([^)]*)\)\)/.exec(fn);
    assert.ok(roles, fn);
    assert.deepEqual(sorted(quoted(roles[1])), sorted(B.DECK_ART_BADGES));
    assert.ok(fn.includes(`public.profile_media_ok(new.art_path, ${A.DECK_ART_MAX_BYTES})`));
    assert.ok(fn.includes("new.art_path is not null and (tg_op = 'insert' or new.art_path is distinct from old.art_path)"), "toglierlo si può sempre");
    assert.ok(fn.includes("'deck_art_role'") && fn.includes("'deck_art_file'"), "i codici che legge deckArtErrorCode");
    assert.ok(stmts.includes("revoke all on function public.guard_deck_art() from public, anon, authenticated"));
    assert.ok(stmts.includes("create trigger community_decks_art before insert or update of art_path on public.community_decks for each row execute function public.guard_deck_art()"));
  });

  test("copertina delle guide: la cartella e il peso di guides.ts, e il file che c'è", () => {
    const fn = one(/^create or replace function public\.guard_community_guide_cover\(/);
    assert.match(fn, /set search_path = public, pg_temp/);
    assert.doesNotMatch(fn, /security definer/);
    assert.ok(block.includes(`new.cover_path !~ ('^' || new.owner::text || '/${G.GUIDE_COVER_FOLDER}/${M.MEDIA_FILE_RE}$')`));
    assert.ok(fn.includes(`public.profile_media_ok(new.cover_path, ${G.GUIDE_COVER_MAX_BYTES})`));
    assert.ok(fn.includes("'guide_cover_path'") && fn.includes("'guide_cover_file'"));
    assert.equal(G.guideErrorCode({ message: "guide_cover_file" }), "coverImage");
    assert.equal(G.guideErrorCode({ code: "42501", message: "guide_cover_path" }), "coverImage");
    assert.equal(G.guideErrorCode({ code: "42501", message: "guide_cover_role" }), "coverImage");
    assert.ok(stmts.includes("revoke all on function public.guard_community_guide_cover() from public, anon, authenticated"));
    assert.ok(stmts.includes("create trigger community_guides_cover before insert or update of cover_path on public.community_guides for each row execute function public.guard_community_guide_cover()"));
    // lo stesso percorso che accetta il codice
    const re = new RegExp(`^${OWNER}/${G.GUIDE_COVER_FOLDER}/${M.MEDIA_FILE_RE}$`);
    assert.ok(re.test(`${OWNER}/guide/${FILE}`) && G.coverPathOk(`${OWNER}/guide/${FILE}`, OWNER));
  });

  test("file in uso: profilo, copertine delle guide e artwork dei mazzi del proprietario della cartella", () => {
    const fn = one(/^create or replace function public\.profile_media_in_use\(/);
    assert.match(fn, /stable security definer set search_path = public, pg_temp/);
    for (const part of [
      "pr.id = uid and (pr.avatar_path = p or pr.cover_path = p or pr.background_path = p)",
      "g.owner = uid and g.cover_path = p",
      "d.owner = uid and d.art_path = p",
    ]) {
      assert.ok(fn.includes(part), part);
    }
    assert.ok(stmts.includes("revoke all on function public.profile_media_in_use(text) from public, anon"));
    assert.ok(stmts.includes("grant execute on function public.profile_media_in_use(text) to authenticated, service_role"));
  });

  test("policy del bucket: le regole di questo blocco restano nell'ultima definizione", () => {
    // le policy di questo blocco le ha rifatte il blocco FUMETTI (29/09/2026): conta l'ultima definizione nello schema
    one(/create policy "profile media upload"/);
    const upload = lastInSchema(/create policy "profile media upload"/);
    const del = lastInSchema(/create policy "profile media owners delete"/);
    // cancellazione: propria cartella (o admin) e mai un file in uso
    assert.ok(del.includes("((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())"));
    assert.ok(del.includes("and not public.profile_media_in_use(name)"));
    // caricamento: il nome che sceglie il sito (dal testo del file: sqlStatements scrive in minuscolo)
    assert.ok(block.includes(`and storage.filename(name) ~ '${M.MEDIA_UPLOAD_NAME_RE}'`));
    assert.ok(schema.slice(schema.lastIndexOf('create policy "profile media upload"')).includes(`and storage.filename(name) ~ '${M.MEDIA_UPLOAD_NAME_RE}'`));
    assert.ok(upload.includes("(storage.foldername(name))[1] = auth.uid()::text"));
    assert.doesNotMatch(upload, /metadata/, "niente peso nella policy (lo Storage la prova prima del file)");
  });

  test("caricamento: cartelle, ruoli e tetti uguali al codice", () => {
    const upload = lastInSchema(/create policy "profile media upload"/);
    const cap = /public\.profile_media_count\(\) < \(case when exists \(select 1 from public\.profiles p where p\.id = auth\.uid\(\) and \(p\.badge in \(([^)]*)\) or p\.role = 'admin'\)\) then (\d+) else (\d+) end\)/.exec(upload);
    assert.ok(cap, upload);
    assert.deepEqual(sorted(quoted(cap[1])), sorted(B.SHOWCASE_BADGES));
    assert.equal(Number(cap[2]), M.MEDIA_FILES_MAX_SHOWCASE);
    assert.equal(Number(cap[3]), M.MEDIA_FILES_MAX);
    assert.ok(upload.includes("(storage.foldername(name))[2] = 'avatar'"), "la foto profilo per tutti");
    const showcase = /\(storage\.foldername\(name\)\)\[2\] in \(([^)]*)\) and exists \(select 1 from public\.profiles p where p\.id = auth\.uid\(\) and \(p\.badge in \(([^)]*)\) or p\.role = 'admin'\)\)/.exec(upload);
    assert.ok(showcase, "cartelle dei ruoli con vetrina");
    assert.deepEqual(sorted(quoted(showcase[1])), ["background", "cover", "guide"]);
    assert.deepEqual(sorted(quoted(showcase[2])), sorted(B.SHOWCASE_BADGES));
    // chi pubblica guide carica le copertine: gli stessi ruoli (più gli admin)
    assert.deepEqual(sorted(B.GUIDE_BADGES), sorted(B.SHOWCASE_BADGES));
    const deck = /\(storage\.foldername\(name\)\)\[2\] = 'deck' and exists \(select 1 from public\.profiles p where p\.id = auth\.uid\(\) and \(p\.badge in \(([^)]*)\) or p\.role = 'admin'\)\)/.exec(upload);
    assert.ok(deck, "cartella dei mazzi");
    assert.deepEqual(sorted(quoted(deck[1])), sorted(B.DECK_ART_BADGES));
    // ogni cartella del codice ha la sua regola nella policy, e nessun'altra
    const folders = [...upload.matchAll(/\(storage\.foldername\(name\)\)\[2\] (?:= '([a-z]+)'|in \(([^)]*)\))/g)].flatMap((m) => (m[1] ? [m[1]] : quoted(m[2])));
    assert.deepEqual(sorted(folders), sorted(M.MEDIA_KINDS));
  });

  test("la vetrina resta com'era: il suo blocco e i suoi test non cambiano", () => {
    const vetrina = schema.slice(schema.indexOf("-- ===== 27/09/2026: VETRINA ====="), schema.indexOf("-- ===== 27/09/2026: SEGUI ====="));
    assert.ok(vetrina.includes("public.profile_media_count() < 12"));
    assert.ok(!vetrina.includes("profile_media_in_use"));
  });
});

describe("strumento dello staff e testi", () => {
  test("--orphans conta come in uso anche copertine delle guide e artwork dei mazzi", () => {
    const script = read("../../../scripts/clear-profile-media.mjs");
    const code = script
      .split(/\r?\n/)
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    assert.match(code, /public\.profile_media_in_use\(o\.name\) as used/);
    assert.match(code, /set cover_path = null where owner = \$1/);
    assert.match(code, /set art_path = null where owner = \$1/);
    assert.match(code, /--guide-covers/);
    assert.match(code, /--deck-art/);
    assert.doesNotMatch(code, /delete from storage\.objects/i);
  });

  test("etichette: stesse chiavi e stessi segnaposto nelle tre lingue", () => {
    const paths = (o: unknown, prefix = ""): string[] =>
      o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k)) : [prefix];
    const at = (o: unknown, p: string) => p.split(".").reduce<unknown>((x, k) => (x as Record<string, unknown>)[k], o);
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const en = L.deckArtLabels.en;
    for (const locale of ["it", "es"] as const) {
      const other = L.deckArtLabels[locale];
      assert.deepEqual(sorted(paths(other)), sorted(paths(en)), locale);
      for (const p of paths(en)) assert.deepEqual(holes(String(at(other, p))), holes(String(at(en, p))), `${locale}: ${p}`);
    }
    for (const locale of ["en", "it", "es"] as const) {
      const f = L.deckArtFormLabels(locale);
      // gli errori del caricamento sono quelli di MediaError (mediaUpload.ts), quelli delle Server Action i codici di actions.ts
      assert.deepEqual(sorted(Object.keys(f.errors)), ["limit", "tooBig", "type", "upload"]);
      assert.deepEqual(sorted(Object.keys(f.actionErrors)), ["artFile", "artRole", "artUnavailable"]);
      assert.match(f.hint, /\{minw\}.*\{minh\}.*\{w\}.*\{h\}/);
      assert.match(f.hint, /5:7/);
    }
  });

  test("la privacy dice delle copertine delle guide e dell'artwork dei mazzi", () => {
    assert.match(SL.showcaseLabels.en.privacy, /community guide.*Legendary artwork/);
    assert.match(SL.showcaseLabels.it.privacy, /guida della community.*artwork della Leggendaria/);
    assert.match(SL.showcaseLabels.es.privacy, /guía de la comunidad.*arte de la Legendaria/);
  });
});
