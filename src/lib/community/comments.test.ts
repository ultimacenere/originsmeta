/**
 * Test dei commenti sui mazzi della community (02/10/2026): funzioni pure di `comments.ts`, etichette di
 * `commentLabels.ts`, avvisi dei commenti di `notifications.ts` e regole del blocco `-- ===== 02/10/2026: COMMENTI =====`
 * di supabase/schema.sql (numeri uguali al codice, nessuna scrittura diretta, niente per anon), con il runner integrato
 * di Node: `node --test src/lib/community/comments.test.ts`. La prova delle funzioni su un Postgres vero (PGlite) sta
 * nello scratchpad della sessione del 02/10/2026; qui si controlla che l'SQL dica le stesse cose del codice.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as nodeModule from "node:module";
import { sqlStatements } from "../../../scripts/schema-guard.mjs";

type Resolved = { url: string; format?: string | null; shortCircuit?: boolean };
type ResolveHook = (specifier: string, context: object, next: (specifier: string, context?: object) => Resolved) => Resolved;
// comments.ts importa "./messages" senza estensione, come vuole Next: l'hook aggiunge `.ts` (come in analytics.test.ts)
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
const C: typeof import("./comments") = await import("./comments.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const N: typeof import("./notifications") = await import("./notifications.ts");
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
const { commentLabels, fillComment }: typeof import("../commentLabels") = await import("../commentLabels.ts");

const schema = readFileSync(new URL("../../../supabase/schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const MARKER = "-- ===== 02/10/2026: COMMENTI =====";
function block(): string {
  const at = schema.indexOf(MARKER);
  assert.ok(at >= 0, "manca il blocco COMMENTI in schema.sql");
  const next = schema.indexOf("\n-- ===== ", at + MARKER.length);
  return schema.slice(at, next < 0 ? undefined : next);
}

const row = (id: number, parent: number | null, created: string, extra: Partial<import("./comments").CommentRow> = {}) => ({
  id,
  deck_id: "d",
  user_id: "u",
  parent_id: parent,
  body: `c${id}`,
  status: "visible" as const,
  created_at: created,
  edited_at: null,
  author: null,
  ...extra,
});

describe("testo dei commenti", () => {
  test("checkComment: pulizia dei messaggi, vuoto e troppo lungo", () => {
    assert.deepEqual(C.checkComment("  Bel mazzo!\r\n\r\n\r\n\r\nMerlin  \n"), { ok: true, body: "Bel mazzo!\n\nMerlin" });
    assert.deepEqual(C.checkComment(` ${String.fromCharCode(0x200b)} \n `), { ok: false, error: "empty" });
    assert.deepEqual(C.checkComment(42), { ok: false, error: "empty" });
    assert.deepEqual(C.checkComment("é".repeat(C.COMMENT_MAX)).ok, true, "il massimo in caratteri visibili");
    assert.deepEqual(C.checkComment("😀".repeat(C.COMMENT_MAX)).ok, true, "un'emoji conta uno, come char_length");
    assert.deepEqual(C.checkComment("x".repeat(C.COMMENT_MAX + 1)), { ok: false, error: "tooLong" });
    assert.deepEqual(C.checkComment(" ".repeat(C.RAW_COMMENT_MAX + 1)), { ok: false, error: "tooLong" }, "tetto al testo grezzo prima della pulizia");
    assert.equal(C.commentRemaining("abc"), C.COMMENT_MAX - 3);
  });
  test("checkReportReason: una riga, facoltativa, fino a 300", () => {
    assert.equal(C.checkReportReason(" spam \n  ripetuto "), "spam ripetuto");
    assert.equal(C.checkReportReason(undefined), "");
    assert.equal(C.checkReportReason("x".repeat(C.REPORT_REASON_MAX)), "x".repeat(C.REPORT_REASON_MAX));
    assert.equal(C.checkReportReason("x".repeat(C.REPORT_REASON_MAX + 1)), null);
  });
});

describe("conversazioni", () => {
  test("buildThreads: commenti nell'ordine letto, risposte dalla più vecchia, orfane fuori, eliminati vuoti fuori", () => {
    const top = [row(5, null, "2026-10-02T12:00:00Z"), row(2, null, "2026-10-01T10:00:00Z", { status: "deleted", body: "" }), row(1, null, "2026-10-01T09:00:00Z", { status: "deleted", body: "" })];
    const replies = [row(7, 2, "2026-10-02T09:00:00Z"), row(6, 2, "2026-10-01T11:00:00Z"), row(9, 99, "2026-10-02T13:00:00Z"), row(8, 5, "2026-10-02T12:30:00Z")];
    const t = C.buildThreads(top, replies);
    assert.deepEqual(
      t.map((x) => [x.id, x.replies.map((r) => r.id)]),
      [
        [5, [8]],
        [2, [6, 7]],
      ],
    );
  });
  test("isCommentRow scarta le righe con la forma sbagliata", () => {
    assert.ok(C.isCommentRow(row(1, null, "2026-10-02T00:00:00Z")));
    assert.ok(!C.isCommentRow({ ...row(1, null, "x"), status: "spam" }));
    assert.ok(!C.isCommentRow({ ...row(1, null, "x"), id: "1" }));
    assert.ok(!C.isCommentRow(null));
  });
  test("nome, ancore e percorso per lo staff", () => {
    assert.equal(C.commentAuthorName({ username: "vega", display_name: " ", avatar_url: null, badge: null }, "?"), "vega");
    assert.equal(C.commentAuthorName(null, "Account cancellato"), "Account cancellato");
    assert.equal(C.commentAnchor(12), "comment-12");
    assert.equal(C.commentPath("merlin-control-ab12", 12), "/decks/community/merlin-control-ab12#comment-12");
    assert.equal(C.commentPath("../x", 12), null);
    assert.equal(C.commentPath("ok", 0), null);
  });
  test("commentErrorCode: codici del database, migrazione mancante, il resto è db", () => {
    assert.equal(C.commentErrorCode({ message: "comment_too_fast", code: "P0001" }), "tooFast");
    assert.equal(C.commentErrorCode({ message: "bad_parent", code: "P0001" }), "badParent");
    assert.equal(C.commentErrorCode({ message: "own_comment" }), "ownComment");
    assert.equal(C.commentErrorCode({ message: "x", code: "PGRST205" }), "unavailable");
    assert.equal(C.commentErrorCode({ message: "x", code: "42883" }), "unavailable");
    assert.equal(C.commentErrorCode({ message: "constructor" }), "db");
    assert.equal(C.commentErrorCode(null), "db");
  });
});

describe("avvisi dei commenti", () => {
  test("due tipi nuovi, link alla sezione dei commenti della scheda", () => {
    for (const k of N.COMMENT_KINDS) assert.ok(N.isNotificationKind(k), k);
    assert.equal(N.notificationHref("it", "/decks/community/merlin-ab12", "deck_comment"), `/it/decks/community/merlin-ab12#${C.COMMENTS_ANCHOR}`);
    assert.equal(N.notificationHref("es", "/decks/community/merlin-ab12", "comment_reply"), `/es/decks/community/merlin-ab12#${C.COMMENTS_ANCHOR}`);
    assert.equal(N.notificationHref("en", "/decks/community/merlin-ab12", "deck_published"), "/en/decks/community/merlin-ab12");
    assert.equal(N.notificationHref("en", "/u/vega", "deck_comment"), "/en/u/vega", "l'ancora solo sulla scheda di un mazzo");
    assert.equal(N.deckSlugOf("/decks/community/merlin-ab12"), "merlin-ab12");
  });
});

describe("database: blocco COMMENTI di supabase/schema.sql", () => {
  const sql = block();
  const stmts = sqlStatements(sql);
  const fn = (name: string) => stmts.find((s: string) => s.startsWith(`create or replace function public.${name}(`)) ?? "";

  test("numeri uguali al codice", () => {
    assert.ok(sql.includes(`char_length(body) between 1 and ${C.COMMENT_MAX}`), "vincolo del testo");
    const text = fn("deck_comment_text");
    assert.ok(text.includes(`> ${C.RAW_COMMENT_MAX} then raise exception 'comment_too_long'`), "tetto al testo grezzo");
    assert.ok(text.includes(`char_length(s) > ${C.COMMENT_MAX} then raise exception 'comment_too_long'`), "massimo dopo la pulizia");
    const add = fn("deck_comment_add");
    assert.ok(add.includes(`interval '${C.COMMENT_GAP_SECONDS} seconds'`), "pausa fra due commenti");
    assert.ok(add.includes(`if n >= ${C.COMMENTS_PER_HOUR} then raise exception 'comment_rate'`), "tetto orario");
    assert.ok(add.includes(`if n >= ${C.COMMENTS_PER_DAY} then raise exception 'comment_rate'`), "tetto giornaliero");
    assert.match(add, /if not public\.is_staff\(\) then/, "lo staff non ha tetti");
    const report = fn("deck_comment_report");
    assert.ok(report.includes(`if n >= ${C.COMMENT_REPORTS_PER_DAY} then raise exception 'report_rate'`));
    assert.ok(report.includes(`char_length(v_reason) > ${C.REPORT_REASON_MAX}`));
    assert.ok(report.includes(`> ${C.RAW_REPORT_REASON_MAX} then raise exception 'reason_too_long'`));
  });
  test("ogni codice d'errore del database ha la sua traduzione nel sito", () => {
    const raised = new Set([...sql.matchAll(/raise exception '([a-z_]+)'/g)].map((m) => m[1]));
    for (const code of raised) assert.notEqual(C.commentErrorCode({ message: code }), "db", code);
  });
  test("risposte a un livello e avvisi solo agli altri", () => {
    const add = fn("deck_comment_add");
    assert.match(add, /v_parent_parent is not null or v_parent_status <> 'visible' then\s+raise exception 'bad_parent'/, "niente risposte alle risposte né a commenti non visibili");
    assert.match(add, /v_parent_user <> me/, "nessun avviso a chi risponde a se stesso");
    assert.match(add, /v_owner <> me and v_owner is distinct from v_parent_user/, "l'autore del mazzo non riceve due avvisi");
    assert.ok(add.includes("'comment:' || v_id::text"), "un avviso per commento");
    assert.match(fn("deck_comment_forget"), /kind in \('deck_comment', 'comment_reply'\) and event_key = 'comment:' \|\| p_id::text/);
  });
  test("nessuna scrittura diretta, lettura per colonna, niente per anon", () => {
    for (const op of ["insert", "update", "delete"]) {
      assert.ok(stmts.some((s: string) => s.startsWith(`create policy "deck comments no direct ${op}" on public.deck_comments as restrictive for ${op}`)), op);
    }
    assert.ok(stmts.includes("revoke all on public.deck_comments from anon, authenticated"));
    assert.deepEqual(
      stmts.filter((s: string) => s.startsWith("grant") && /\bon public\.deck_comments\b/.test(s)),
      ["grant select (id, deck_id, user_id, parent_id, body, status, created_at, edited_at) on public.deck_comments to anon, authenticated"],
    );
    // la policy pubblica non usa is_staff (anon non la può eseguire)
    const pub = stmts.find((s: string) => s.startsWith('create policy "deck comments: public read"')) ?? "";
    assert.ok(pub && !pub.includes("is_staff"), pub);
    for (const name of ["deck_comment_add", "deck_comment_edit", "deck_comment_delete", "deck_comment_moderate", "deck_comment_report"]) {
      const grants = stmts.filter((s: string) => s.includes(`function public.${name}(`) && /^(grant|revoke)/.test(s));
      assert.ok(grants.some((s: string) => s.startsWith("revoke all") && /from public, anon$/.test(s)), `${name}: revoke a public e anon`);
      assert.ok(grants.some((s: string) => s.startsWith("grant execute") && s.endsWith("to authenticated")), `${name}: solo authenticated`);
      assert.match(fn(name), /security definer set search_path = public, pg_temp/, name);
    }
    for (const name of ["deck_comment_text", "deck_comment_forget"]) {
      assert.ok(stmts.some((s: string) => s.startsWith(`revoke all on function public.${name}(`) && s.endsWith("from public, anon, authenticated")), `${name}: interna`);
    }
    assert.ok(!/\bon public\.profiles\b/.test(sql.replace(/^--.*$/gm, "")), "il blocco non tocca i grant dei profili");
  });
});

describe("etichette", () => {
  type Tree = { [k: string]: string | Tree };
  const leaves = (o: Tree, prefix = ""): Map<string, string> => {
    const out = new Map<string, string>();
    for (const [k, v] of Object.entries(o)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") out.set(key, v);
      else for (const [kk, vv] of leaves(v, key)) out.set(kk, vv);
    }
    return out;
  };
  const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const en = leaves(commentLabels.en as unknown as Tree);
  for (const locale of ["it", "es"] as const) {
    test(`${locale}: stesse chiavi e segnaposto dell'inglese, nessun testo vuoto`, () => {
      const other = leaves(commentLabels[locale] as unknown as Tree);
      assert.deepEqual([...other.keys()].sort(), [...en.keys()].sort());
      for (const [k, v] of other) {
        assert.ok(v.trim(), `${locale} ${k}`);
        assert.deepEqual(ph(v), ph(en.get(k) ?? ""), `${locale} ${k}`);
      }
    });
  }
  test("spagnolo col tú; chi ha pubblicato il mazzo non si chiama Autore (è un ruolo)", () => {
    for (const [k, v] of leaves(commentLabels.es as unknown as Tree)) assert.doesNotMatch(v, /\b(usted|ustedes|vosotros|podéis|tenéis)\b/i, k);
    for (const l of Object.values(commentLabels)) assert.doesNotMatch(l.deckOwner, /autor|author|creator/i, l.deckOwner);
  });
  test("la privacy dice i numeri del database, Supabase e Discord", () => {
    for (const [locale, l] of Object.entries(commentLabels)) {
      for (const n of [C.COMMENT_GAP_SECONDS, C.COMMENTS_PER_HOUR, C.COMMENTS_PER_DAY]) assert.ok(l.privacy.includes(String(n)), `${locale}: ${n}`);
      assert.match(l.privacy, /Supabase/, locale);
      assert.match(l.privacy, /Discord/, locale);
      assert.ok(l.errors.reasonTooLong.includes(String(C.REPORT_REASON_MAX)), locale);
    }
    assert.equal(fillComment("{n} $& {x}", { n: 2 }), "2 $& {x}");
  });
});
