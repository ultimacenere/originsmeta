/**
 * Test degli avvisi per chi segue (pacchetto SEGUI, 27/09/2026): funzioni pure di `notifications.ts` (percorsi, busta
 * dell'header, errori, cron delle dirette) e regole dell'SQL degli avvisi, con il runner integrato di Node:
 * `node --test src/lib/community/notifications.test.ts`. L'SQL si legge come in follows.test.ts: il blocco
 * `-- ===== 27/09/2026: SEGUI =====` di schema.sql se c'è, altrimenti supabase/wave2-SEGUI.sql.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { sqlStatements } from "../../../scripts/schema-guard.mjs";
import {
  CRON_SECRET_MIN,
  LIVE_COOLDOWN_HOURS,
  NOTIFICATION_KINDS,
  NOTIFICATION_RETENTION_DAYS,
  NOTIFY_DAILY_MAX,
  cronAuthorized,
  deckSlugOf,
  envelopeAria,
  envelopeTarget,
  isNotificationKind,
  isSafeTarget,
  liveAlerts,
  notificationCount,
  notificationErrorCode,
  notificationHref,
  publishTarget,
  withNotificationCount,
  // Node vuole l'estensione `.ts` nel percorso, ma il tsconfig del progetto non ha `allowImportingTsExtensions`:
  // TypeScript segnala TS5097 sulla riga seguente e la ignoriamo apposta, come in src/lib/tierstats.test.ts.
  // @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
} from "./notifications.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { badgeCount, envelopeHref, envelopeLabel, parseInboxStatus } from "./messages.ts";

const MARKER = "-- ===== 27/09/2026: SEGUI =====";
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

function seguiSql(): string {
  const schema = read("../../../supabase/schema.sql");
  const at = schema.indexOf(MARKER);
  if (at >= 0) {
    const next = schema.indexOf("\n-- ===== ", at + MARKER.length);
    return schema.slice(at, next < 0 ? undefined : next);
  }
  const file = new URL("../../../supabase/wave2-SEGUI.sql", import.meta.url);
  assert.ok(existsSync(file), "manca l'SQL del pacchetto SEGUI");
  return readFileSync(file, "utf8");
}

describe("percorsi degli avvisi", () => {
  test("publishTarget: slug o percorso, lingua tolta, forme sbagliate rifiutate", () => {
    assert.equal(publishTarget("deck_published", "swarm-aggro-ab12"), "/decks/community/swarm-aggro-ab12");
    assert.equal(publishTarget("deck_published", "/decks/community/swarm-ab12"), "/decks/community/swarm-ab12");
    assert.equal(publishTarget("deck_published", "/it/decks/community/swarm-ab12"), "/decks/community/swarm-ab12");
    assert.equal(publishTarget("guide_published", "come-giocare-merlin"), "/guides/come-giocare-merlin");
    assert.equal(publishTarget("guide_published", "/es/guides/community/mi-guia"), "/guides/community/mi-guia");
    for (const bad of ["", "Swarm Aggro", "/decks/community/", "/decks/community/a/b", "../x", "/decks/community/x?y=1", "a".repeat(81)]) {
      assert.equal(publishTarget("deck_published", bad), null, bad);
    }
    assert.equal(publishTarget("guide_published", "/guides/a/b/c"), null, "al massimo una sezione");
    assert.equal(publishTarget("guide_published", "/news/x"), null);
  });
  test("isSafeTarget e notificationHref: solo mazzi, guide e pagine /u, con la lingua di chi legge", () => {
    for (const ok of ["/decks/community/swarm-ab12", "/guides/merlin", "/guides/community/merlin", "/u/vegakiles", "/u/coach_crono"]) assert.ok(isSafeTarget(ok), ok);
    for (const bad of ["/decks/x", "//evil.example", "/u/", "/u/Vega", "https://x.y/", "/guides", "/account", "/u/a b", 42, null]) assert.ok(!isSafeTarget(bad), String(bad));
    assert.equal(notificationHref("it", "/u/vegakiles"), "/it/u/vegakiles");
    assert.equal(notificationHref("es", "/decks/community/swarm-ab12"), "/es/decks/community/swarm-ab12");
    assert.equal(notificationHref("en", "//evil.example"), null);
    assert.equal(deckSlugOf("/decks/community/swarm-ab12"), "swarm-ab12");
    assert.equal(deckSlugOf("/u/vegakiles"), null);
    assert.ok(isNotificationKind("live"));
    assert.ok(!isNotificationKind("message"));
    assert.ok(!isNotificationKind("toString"));
  });
});

describe("busta dell'header: messaggi più avvisi", () => {
  test("withNotificationCount e notificationCount: il campo della rotta, 0 se manca o è strano", () => {
    const json = { loggedIn: true, unread: 2, staff: false, staffUnread: 0, notifications: 3 };
    const s = withNotificationCount(parseInboxStatus(json), json);
    assert.deepEqual(s, { unread: 2, staff: false, staffUnread: 0, notifications: 3 });
    assert.equal(badgeCount(s), 2, "badgeCount conta ancora solo i messaggi");
    assert.equal(notificationCount(s), 3);
    assert.equal(notificationCount(withNotificationCount({ unread: 0 }, { notifications: -4 })), 0);
    assert.equal(notificationCount(withNotificationCount({ unread: 0 }, {})), 0, "rotta di prima, senza il campo");
    assert.equal(withNotificationCount(null, json), null, "senza accesso resta null");
    assert.equal(notificationCount(null), 0);
  });
  test("envelopeTarget: con le sole notifiche alla loro sezione, altrimenti dove porta la casella", () => {
    const status = (unread: number, staffUnread = 0, staff = false) => ({ unread, staff, staffUnread });
    assert.equal(envelopeTarget(envelopeHref(status(0), "it"), 0, 2, "it"), "/it/account/messages#notifications");
    assert.equal(envelopeTarget(envelopeHref(status(1), "it"), 1, 2, "it"), "/it/account/messages", "prima i messaggi");
    const staffOnly = status(0, 3, true);
    assert.equal(envelopeTarget(envelopeHref(staffOnly, "es"), badgeCount(staffOnly), 5, "es"), "/es/account/staff/messages", "lo staff con messaggi degli utenti va alla sua casella");
    assert.equal(envelopeTarget(envelopeHref(status(0), "en"), 0, 0, "en"), "/en/account/messages", "nessuna novità");
  });
  test("envelopeAria: il nome dei messaggi più le notifiche, con il numero intero", () => {
    const nav = { messages: "Messaggi", envelopeOne: "Messaggi, 1 non letto", envelopeMany: "Messaggi, {n} non letti" };
    const L = { notifOne: "1 notifica nuova", notifMany: "{n} notifiche nuove" };
    assert.equal(envelopeAria(envelopeLabel(nav, 0), 0, L), "Messaggi");
    assert.equal(envelopeAria(envelopeLabel(nav, 2), 0, L), "Messaggi, 2 non letti");
    assert.equal(envelopeAria(envelopeLabel(nav, 0), 1, L), "Messaggi, 1 notifica nuova");
    assert.equal(envelopeAria(envelopeLabel(nav, 1), 14, L), "Messaggi, 1 non letto, 14 notifiche nuove");
  });
});

describe("errori e cron", () => {
  test("notificationErrorCode", () => {
    assert.equal(notificationErrorCode({ message: "forbidden", code: "P0001" }), "forbidden");
    assert.equal(notificationErrorCode({ message: "bad_target", code: "P0001" }), "badTarget");
    assert.equal(notificationErrorCode({ message: "not_found", code: "P0001" }), "notFound");
    assert.equal(notificationErrorCode({ message: "x", code: "PGRST202" }), "unavailable");
    assert.equal(notificationErrorCode({ message: "x", code: "42883" }), "unavailable");
    assert.equal(notificationErrorCode({ message: "constructor" }), "db");
    assert.equal(notificationErrorCode(null), "db");
  });
  test("cronAuthorized: Bearer con il segreto esatto, lungo almeno CRON_SECRET_MIN", () => {
    const secret = "s".repeat(CRON_SECRET_MIN);
    assert.ok(cronAuthorized(`Bearer ${secret}`, secret));
    assert.ok(!cronAuthorized(`Bearer ${secret}x`, secret));
    assert.ok(!cronAuthorized(`bearer ${secret}`, secret));
    assert.ok(!cronAuthorized(secret, secret));
    assert.ok(!cronAuthorized(null, secret));
    assert.ok(!cronAuthorized("Bearer short", "short"), "segreto troppo corto: mai autorizzato");
    assert.ok(!cronAuthorized("Bearer ", ""));
    assert.ok(!cronAuthorized(`Bearer ${secret}`, undefined));
  });
  test("liveAlerts: una per profilo e per diretta su Origins, id numerico obbligatorio", () => {
    const profiles = [
      { id: "p1", username: "vegakiles", login: "VegaKiles" },
      { id: "p2", username: "coachcrono", login: "coachcrono" },
      { id: "p3", username: "team", login: "coachcrono" },
      { id: "p4", username: "offline", login: "offline" },
      { id: "p1", username: "vegakiles", login: "vegakiles" },
    ];
    const streams = [
      { id: "111", user_login: "vegakiles", game_name: "Origins TCG" },
      { id: "222", user_login: "CoachCrono", game_name: "Origins TCG" },
      { id: "333", user_login: "other", game_name: "Origins TCG" },
      { user_login: "offline", game_name: "Origins TCG" },
    ];
    const isOrigins = (s: { game_name?: string }) => s.game_name === "Origins TCG";
    assert.deepEqual(liveAlerts(profiles, streams, isOrigins), [
      { actorId: "p1", username: "vegakiles", streamId: "111" },
      { actorId: "p2", username: "coachcrono", streamId: "222" },
      { actorId: "p3", username: "team", streamId: "222" },
    ]);
    assert.deepEqual(liveAlerts(profiles, [{ id: "9", user_login: "vegakiles", game_name: "Chess" }], isOrigins), [], "altro gioco: niente avviso");
    assert.deepEqual(liveAlerts(profiles, [{ id: "abc", user_login: "vegakiles", game_name: "Origins TCG" }], isOrigins), [], "id non numerico");
  });
});

describe("database: avvisi in supabase/wave2-SEGUI.sql", () => {
  const sql = seguiSql();
  const stmts = sqlStatements(sql);
  const fn = (name: string) => stmts.find((s) => s.startsWith(`create or replace function public.${name}(`)) ?? "";
  const quoted = (s: string) => [...s.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

  test("tipi di avviso uguali a NOTIFICATION_KINDS, un avviso per evento e per utente", () => {
    const table = stmts.find((s) => s.startsWith("create table if not exists public.notifications")) ?? "";
    const kinds = /kind text not null check \(kind in \(([^)]*)\)\)/.exec(table);
    assert.ok(kinds, table.slice(0, 300));
    assert.deepEqual(quoted(kinds[1]), [...NOTIFICATION_KINDS]);
    assert.match(table, /constraint notifications_once unique \(user_id, kind, event_key\)/);
  });
  test("nessuna scrittura diretta: policy restrittive, lettura per colonna senza event_key", () => {
    for (const op of ["insert", "update", "delete"]) {
      assert.ok(stmts.some((s) => s.startsWith(`create policy "notifications no direct ${op}" on public.notifications as restrictive for ${op}`)), op);
    }
    assert.ok(stmts.some((s) => s.startsWith('create policy "notifications read own" on public.notifications for select to authenticated using (user_id = (select auth.uid()))')));
    assert.ok(stmts.includes("revoke all on public.notifications, public.notification_events, public.notify_keys from anon, authenticated"));
    const grants = stmts.filter((s) => s.startsWith("grant") && /\bon public\.notifications\b/.test(s));
    assert.deepEqual(grants, ["grant select (id, user_id, kind, actor_id, target, created_at, read_at) on public.notifications to authenticated"]);
    assert.ok(!stmts.some((s) => s.startsWith("grant") && /public\.(notification_events|notify_keys)\b/.test(s)), "nessun client legge eventi e impronte");
  });
  test("notify_followers: autore = auth.uid(), mazzo suo e pubblicato, tetto giornaliero, solo authenticated", () => {
    const f = fn("notify_followers");
    assert.match(f, /me uuid := auth\.uid\(\)/);
    assert.match(f, /d\.owner = me and d\.status = 'published'/);
    assert.ok(f.includes(`if n >= ${NOTIFY_DAILY_MAX} then return 0`), "tetto giornaliero diverso fra codice e database");
    assert.ok(f.includes("'^/decks/community/[a-z0-9-]{1,80}$'") && f.includes("'^/guides(/[a-z0-9-]{1,80}){1,2}$'"), "forme dei percorsi uguali a notifications.ts");
    assert.ok(stmts.includes("revoke all on function public.notify_followers(text, text) from public, anon"));
    assert.ok(stmts.includes("grant execute on function public.notify_followers(text, text) to authenticated"));
  });
  test("notify_live: segreto confrontato con l'impronta, una volta per diretta, pausa uguale a LIVE_COOLDOWN_HOURS", () => {
    const f = fn("notify_live");
    assert.ok(f.includes(`char_length(p_key) not between ${CRON_SECRET_MIN} and 256`), "lunghezza minima diversa fra codice e database");
    assert.match(f, /k\.key_hash = encode\(sha256\(convert_to\(p_key, 'utf8'\)\), 'hex'\)/);
    assert.match(f, /raise exception 'forbidden'/);
    assert.match(f, /v_event := 'twitch:' \|\| p_stream_id/);
    assert.ok(f.includes(`interval '${LIVE_COOLDOWN_HOURS} hours'`), "pausa fra due dirette diversa fra codice e database");
    assert.ok(stmts.includes("grant execute on function public.notify_live(text, uuid, text) to anon, authenticated"));
    const script = read("../../../scripts/set-cron-key.mjs");
    assert.match(script, new RegExp(`const MIN = ${CRON_SECRET_MIN};`), "scripts/set-cron-key.mjs: lunghezza minima diversa");
    assert.match(script, /createHash\("sha256"\)\.update\(secret, "utf8"\)\.digest\("hex"\)/, "la stessa impronta del database");
  });
  test("conservazione e segna come letti", () => {
    assert.ok(fn("notifications_prune").includes(`interval '${NOTIFICATION_RETENTION_DAYS} days'`), "conservazione diversa fra codice e database");
    const m = fn("notifications_mark_read");
    assert.match(m, /where user_id = me and read_at is null/);
    assert.ok(stmts.includes("grant execute on function public.notifications_mark_read(bigint[]) to authenticated"));
    for (const internal of ["notifications_prune()", "notify_fanout(uuid, text, text, text)"]) {
      assert.ok(stmts.includes(`revoke all on function public.${internal} from public, anon, authenticated`), internal);
      assert.ok(!stmts.some((s) => s.startsWith(`grant execute on function public.${internal}`)), internal);
    }
  });
});
