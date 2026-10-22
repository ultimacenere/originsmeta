/**
 * Test dei commenti ai mazzi (22/10/2026) con il runner integrato di Node: `node --test src/lib/community/deckComments.test.ts`.
 *
 * - Regole pure (deckComments.ts): pulizia e controllo del testo, codici d'errore (ogni errore delle funzioni SQL ha il
 *   suo), chi può fare che cosa, ordine dei fili.
 * - Lo stesso blocco "22/10/2026: COMMENTI AI MAZZI" di schema.sql: tetti uguali a COMMENT_LIMITS, tabelle chiuse alla
 *   scrittura diretta (solo lettura per colonna), funzioni security definer con search_path fisso, eseguibili solo da
 *   authenticated, avvisi con i tipi nuovi.
 * - Etichette nelle sette lingue (deckCommentLabels.ts, markdownLabels.ts): stesse chiavi e stessi segnaposto.
 * - Avviso allo staff (deckCommentDiscord.ts): testo senza segni, escapato, link alla sezione dei commenti.
 *
 * I moduli sono scritti per Next (import senza estensione): il test registra un hook di risoluzione dei moduli di Node
 * (`module.registerHooks`, come guides.test.ts) che aggiunge `.ts` agli import senza estensione.
 */
import * as nodeModule from "node:module";
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
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

const C: typeof import("./deckComments") = await import("./deckComments.ts" as string);
const T: typeof import("./deckCommentText") = await import("./deckCommentText.ts" as string);
const D: typeof import("./deckCommentDiscord") = await import("./deckCommentDiscord.ts" as string);
const N: typeof import("./notifications") = await import("./notifications.ts" as string);
const { deckCommentLabels }: typeof import("../deckCommentLabels") = await import("../deckCommentLabels.ts" as string);
const { markdownLabels }: typeof import("../markdownLabels") = await import("../markdownLabels.ts" as string);

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const schema = read("../../../supabase/schema.sql");
const START = "-- ===== 22/10/2026: COMMENTI AI MAZZI =====";
const block = (() => {
  const from = schema.indexOf(START);
  const next = schema.indexOf("\n-- ===== ", from + START.length);
  return from < 0 ? "" : schema.slice(from, next < 0 ? undefined : next);
})();

describe("testo dei commenti", () => {
  test("pulizia come il database: a capo Windows, invisibili, righe vuote in più", () => {
    assert.equal(T.cleanCommentBody("  ciao\r\n\r\n\r\n\r\n**mondo**\u200b  "), "ciao\n\n**mondo**");
    assert.equal(T.cleanCommentBody(42), "");
  });
  test("da 1 a 2000 caratteri, al massimo 40 righe", () => {
    assert.ok(T.commentBodyOk("ok"));
    assert.ok(!T.commentBodyOk(""));
    assert.ok(T.commentBodyOk("x".repeat(C.COMMENT_LIMITS.max)));
    assert.ok(!T.commentBodyOk("x".repeat(C.COMMENT_LIMITS.max + 1)));
    assert.ok(T.commentBodyOk(Array(C.COMMENT_LIMITS.maxLines).fill("a").join("\n")));
    assert.ok(!T.commentBodyOk(Array(C.COMMENT_LIMITS.maxLines + 1).fill("a").join("\n")));
  });
});

describe("codici d'errore", () => {
  test("ogni errore delle funzioni SQL ha il suo codice", () => {
    const raised = [...new Set([...block.matchAll(/raise exception '([a-z_]+)'/g)].map((m) => m[1]))];
    assert.ok(raised.length >= 10, raised.join(", "));
    for (const r of raised) assert.notEqual(C.commentErrorCode({ message: r }), "db", r);
    assert.equal(C.commentErrorCode({ message: "too_fast" }), "tooFast");
    assert.equal(C.commentErrorCode({ message: "rate_day" }), "rateDay");
  });
  test("migrazione mancante = non ancora attivi; il resto = errore generico", () => {
    for (const code of ["PGRST202", "PGRST205", "42P01", "42883"]) assert.equal(C.commentErrorCode({ code, message: "x" }), "unavailable", code);
    assert.equal(C.commentErrorCode({ message: "boom" }), "db");
    assert.equal(C.commentErrorCode(null), "db");
  });
});

describe("chi può fare che cosa", () => {
  const owner = "o";
  const c = (authorId: string | null, status: "visible" | "hidden" | "deleted" = "visible", parent: number | null = null) => ({ authorId, status, parent });
  test("senza accesso: niente", () => {
    assert.deepEqual(C.commentPermissions(c("a"), null, owner), { reply: false, edit: false, remove: false, hide: false, unhide: false, report: false });
  });
  test("chi ha scritto: modifica ed elimina, non segnala se stesso", () => {
    const p = C.commentPermissions(c("a"), { id: "a", staff: false }, owner);
    assert.ok(p.edit && p.remove && p.reply && !p.report && !p.hide);
  });
  test("chi ha pubblicato il mazzo: elimina i commenti degli altri, non li modifica", () => {
    const p = C.commentPermissions(c("a"), { id: owner, staff: false }, owner);
    assert.ok(p.remove && !p.edit && p.report && !p.hide);
  });
  test("lo staff: nasconde, rimette online, elimina", () => {
    assert.ok(C.commentPermissions(c("a"), { id: "s", staff: true }, owner).hide);
    const hidden = C.commentPermissions(c("a", "hidden"), { id: "s", staff: true }, owner);
    assert.ok(hidden.unhide && hidden.remove && !hidden.hide && !hidden.reply);
  });
  test("le risposte non hanno risposte; un posto eliminato non ha comandi", () => {
    assert.ok(!C.commentPermissions(c("a", "visible", 1), { id: "b", staff: false }, owner).reply);
    const gone = C.commentPermissions(c(null, "deleted"), { id: "s", staff: true }, owner);
    assert.deepEqual(gone, { reply: false, edit: false, remove: false, hide: false, unhide: false, report: false });
  });
});

describe("fili", () => {
  const row = (id: number, parent: number | null, at: string, status: "visible" | "hidden" | "deleted" = "visible") => ({ id, parent, created_at: at, status });
  test("primo livello dal più recente, risposte dalla più vecchia; posti eliminati senza risposte fuori", () => {
    const rows = [
      row(1, null, "2026-10-22T10:00:00Z"),
      row(2, null, "2026-10-22T11:00:00Z"),
      row(3, 1, "2026-10-22T12:00:00Z"),
      row(4, 1, "2026-10-22T11:30:00Z"),
      row(5, null, "2026-10-22T09:00:00Z", "deleted"),
      row(6, null, "2026-10-22T08:00:00Z", "deleted"),
      row(7, 6, "2026-10-22T08:30:00Z"),
    ];
    const t = C.threadComments(rows);
    assert.deepEqual(
      t.map((x) => [x.comment.id, x.replies.map((r) => r.id)]),
      [
        [2, []],
        [1, [4, 3]],
        [6, [7]],
      ],
    );
    assert.equal(C.visibleCount(rows), 5);
  });
  test("bersaglio dalla query: un uuid, mazzo o mazzo torneo, mai tutti e due", () => {
    const q = (o: Record<string, string>) => new URLSearchParams(o);
    const id = "123e4567-e89b-42d3-a456-426614174000";
    assert.deepEqual(C.commentTargetFrom(q({ deck: id })), { kind: "deck", id });
    assert.deepEqual(C.commentTargetFrom(q({ set: id })), { kind: "set", id });
    assert.equal(C.commentTargetFrom(q({ deck: id, set: id })), null);
    assert.equal(C.commentTargetFrom(q({ deck: "1 or 1=1" })), null);
  });
});

describe("blocco COMMENTI AI MAZZI di schema.sql", () => {
  test("c'è, in fondo allo schema, con le tre tabelle e le funzioni", () => {
    assert.ok(block.length > 1000, "blocco mancante");
    for (const t of ["deck_comments", "deck_comment_events", "deck_comment_reports"]) assert.match(block, new RegExp(`create table if not exists public\\.${t} \\(`), t);
    for (const f of ["deck_comment_add", "deck_comment_edit", "deck_comment_delete", "deck_comment_hide", "deck_comment_report"]) {
      const def = new RegExp(`create or replace function public\\.${f}\\([^)]*\\)\\nreturns [a-z]+ language plpgsql security definer set search_path = public, pg_temp as`);
      assert.match(block, def, f);
      assert.match(block, new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon;`), f);
      assert.match(block, new RegExp(`grant execute on function public\\.${f}\\([^)]*\\) to authenticated;`), f);
    }
  });
  test("tetti uguali a COMMENT_LIMITS", () => {
    const L = C.COMMENT_LIMITS;
    const has = (t: string) => assert.ok(block.includes(t), t);
    has(`community_guide_text_ok(t, 1, ${L.max}, true)`);
    has(`string_to_array(t, chr(10)), 1), 0) <= ${L.maxLines}`);
    has(`check (char_length(body) <= ${L.max})`);
    has(`interval '${L.minSeconds} seconds' then raise exception 'too_fast'`);
    has(`interval '1 hour') >= ${L.hourly} then`);
    has(`interval '1 day') >= ${L.daily} then`);
    has(`>= ${L.perTarget} then\n      raise exception 'target_full'`);
    has(`check (char_length(reason) <= ${L.reasonMax})`);
    has(`community_guide_text_ok(coalesce(p_reason, ''), 0, ${L.reasonMax}, true)`);
    has(`interval '1 day') >= ${L.reportsDaily} then\n    raise exception 'report_rate'`);
  });
  test("nessuna scrittura diretta: policy restrittive, solo lettura per colonna", () => {
    for (const op of ["insert", "update", "delete"]) assert.match(block, new RegExp(`create policy "deck comments no direct ${op}" on public\\.deck_comments as restrictive for ${op} to anon, authenticated`), op);
    assert.ok(block.includes("revoke all on public.deck_comments, public.deck_comment_events, public.deck_comment_reports from anon, authenticated;"));
    const grants = [...block.matchAll(/^grant [^;]+ on public\.deck_comment[a-z_]* [^;]*;/gm)].map((m) => m[0]);
    assert.deepEqual(grants, ["grant select (id, deck_id, set_id, parent_id, author, body, status, created_at, edited_at) on public.deck_comments to anon, authenticated;"]);
    assert.ok(!/on public\.profiles/.test(block.replace(/references public\.profiles/g, "")), "il blocco non tocca i permessi dei profili");
  });
  test("avvisi con i tipi nuovi, uno per commento e per persona", () => {
    assert.match(block, /'comment_reply', uid, target_path, 'comment:' \|\| new_id\)\n      on conflict \(user_id, kind, event_key\) do nothing/);
    assert.match(block, /'deck_comment', uid, target_path, 'comment:' \|\| new_id\)\n      on conflict \(user_id, kind, event_key\) do nothing/);
    for (const k of ["deck_comment", "comment_reply"]) assert.ok((N.NOTIFICATION_KINDS as readonly string[]).includes(k), k);
    assert.equal(N.notificationHref("it", "/decks/community/mio-mazzo", "deck_comment"), "/it/decks/community/mio-mazzo#comments");
    assert.equal(N.notificationHref("it", "/decks/tournament/mio-trio", "comment_reply"), "/it/decks/tournament/mio-trio#comments");
    assert.equal(N.notificationHref("it", "/decks/community/mio-mazzo", "deck_published"), "/it/decks/community/mio-mazzo");
  });
});

describe("etichette nelle sette lingue", () => {
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])).sort();
  const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  test("commenti: stesse chiavi e stessi segnaposto dell'inglese, un messaggio per ogni errore", () => {
    const en = deckCommentLabels.en;
    for (const [locale, L] of Object.entries(deckCommentLabels)) {
      assert.deepEqual(keys(L), keys(en), locale);
      for (const k of ["countMany", "showMore", "counter"] as const) assert.deepEqual(slots(L[k]), slots(en[k]), `${locale}.${k}`);
      assert.deepEqual(Object.keys(L.errors).sort(), [...C.COMMENT_ERRORS].sort(), locale);
      assert.match(L.privacy, /2/, locale);
      // "Autore" è un ruolo: chi ha pubblicato il mazzo non si chiama così
      assert.doesNotMatch(L.publisherTag, /^(Autore|Author|Autor)$/i, locale);
    }
  });
  test("barra di formattazione: stesse chiavi dell'inglese", () => {
    for (const [locale, L] of Object.entries(markdownLabels)) assert.deepEqual(keys(L), keys(markdownLabels.en), locale);
  });
});

describe("avviso allo staff", () => {
  test("testo senza segni ed escapato, link alla sezione dei commenti in italiano", () => {
    const p = D.commentReportPayload({ kind: "deck", slug: "mio-mazzo", deckName: "Mio *mazzo*", author: "Mario", reporter: "luigi", reason: "spam @everyone", body: "**Compra** qui <@123>" });
    const e = p.embeds?.[0];
    assert.ok(e);
    assert.equal(e.url, "https://originsmeta.com/it/decks/community/mio-mazzo#comments");
    assert.equal(e.description, "Compra qui \\<@\u200b123\\>");
    const field = (name: string) => e.fields?.find((f) => f.name === name)?.value;
    assert.equal(field("Mazzo"), "Mio \\*mazzo\\*");
    assert.equal(field("Motivo"), "spam @\u200beveryone");
    const set = D.commentReportPayload({ kind: "set", slug: "trio", deckName: "Trio", author: "A", reporter: null, reason: "", body: "x" });
    assert.equal(set.embeds?.[0]?.url, "https://originsmeta.com/it/decks/tournament/trio#comments");
    assert.equal(set.embeds?.[0]?.fields?.find((f) => f.name === "Motivo")?.value, "—");
  });
});
