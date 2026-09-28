/**
 * Test degli avvisi per chi segue (pacchetto SEGUI, 27/09/2026): funzioni pure di `notifications.ts` (percorsi, busta
 * dell'header, errori, cron delle dirette) e regole dell'SQL degli avvisi, con il runner integrato di Node:
 * `node --test src/lib/community/notifications.test.ts`. L'SQL si legge come in follows.test.ts: il blocco
 * `-- ===== 27/09/2026: SEGUI =====` di schema.sql (il ripiego su supabase/wave2-SEGUI.sql resta per i pacchetti futuri).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { sqlStatements } from "../../../scripts/schema-guard.mjs";
import {
  CRON_SECRET_MIN,
  LIVE_COOLDOWN_HOURS,
  NOTIFICATION_EVENT_RETENTION_DAYS,
  NOTIFICATION_KINDS,
  NOTIFICATION_RETENTION_DAYS,
  NOTIFY_DAILY_MAX,
  cronAuthorized,
  deckSlugOf,
  guideSlugOf,
  goneUnreadIds,
  envelopeAria,
  envelopeTarget,
  isNotificationKind,
  isSafeTarget,
  liveAlerts,
  missingHeadCount,
  notificationCount,
  notificationErrorCode,
  notificationHref,
  notificationsSince,
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
    assert.equal(publishTarget("guide_published", "come-giocare-merlin-x7k2"), "/guides/community/come-giocare-merlin-x7k2");
    assert.equal(publishTarget("guide_published", "/es/guides/community/mi-guia"), "/guides/community/mi-guia");
    assert.equal(publishTarget("guide_published", `/guides/community/${"a".repeat(60)}`), `/guides/community/${"a".repeat(60)}`, "60 caratteri: il massimo");
    for (const bad of ["", "Swarm Aggro", "/decks/community/", "/decks/community/a/b", "../x", "/decks/community/x?y=1", "a".repeat(81)]) {
      assert.equal(publishTarget("deck_published", bad), null, bad);
    }
    // solo le guide della community (pacchetto GUIDE), con lo slug di community_guides_slug_check (3-60, trattini singoli)
    for (const bad of ["/guides/merlin", "/guides/decks/merlin", "/guides/community/a/b", "ab", "/guides/community/a--b", "-abc", "abc-", "a".repeat(61), "/news/x", "Mi Guia"]) {
      assert.equal(publishTarget("guide_published", bad), null, bad);
    }
  });
  test("isSafeTarget e notificationHref: solo mazzi, guide della community e pagine /u, con la lingua di chi legge", () => {
    for (const ok of ["/decks/community/swarm-ab12", "/guides/community/merlin-x7k2", "/u/vegakiles", "/u/coach_crono"]) assert.ok(isSafeTarget(ok), ok);
    for (const bad of ["/decks/x", "//evil.example", "/u/", "/u/Vega", "https://x.y/", "/guides", "/guides/merlin", "/guides/community/ab", "/account", "/u/a b", 42, null]) {
      assert.ok(!isSafeTarget(bad), String(bad));
    }
    assert.equal(notificationHref("it", "/guides/community/merlin-x7k2"), "/it/guides/community/merlin-x7k2");
    assert.equal(notificationHref("it", "/u/vegakiles"), "/it/u/vegakiles");
    assert.equal(notificationHref("es", "/decks/community/swarm-ab12"), "/es/decks/community/swarm-ab12");
    assert.equal(notificationHref("en", "//evil.example"), null);
    assert.equal(deckSlugOf("/decks/community/swarm-ab12"), "swarm-ab12");
    assert.equal(deckSlugOf("/u/vegakiles"), null);
    assert.equal(guideSlugOf("/guides/community/merlin-x7k2"), "merlin-x7k2");
    for (const bad of ["/decks/community/swarm-ab12", "/guides/community/ab", "/guides/community/Merlin", "/guides/community/a--b", "/u/vegakiles", "/it/guides/community/merlin-x7k2"]) assert.equal(guideSlugOf(bad), null, bad);
    assert.ok(isNotificationKind("live"));
    assert.ok(!isNotificationKind("message"));
    assert.ok(!isNotificationKind("toString"));
  });
  test("goneUnreadIds: solo gli avvisi da leggere di un mazzo o di una guida non più online (29/09/2026)", () => {
    const items = [
      { id: 1, read_at: null, gone: true },
      { id: 2, read_at: "2026-09-29T08:00:00Z", gone: true },
      { id: 3, read_at: null, gone: false },
      { id: 4, read_at: null, gone: true },
    ];
    assert.deepEqual(goneUnreadIds(items), [1, 4]);
    assert.deepEqual(goneUnreadIds([]), []);
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
  test("missingHeadCount: il 204 senza conteggio di postgrest-js per una tabella che non c'è", () => {
    assert.ok(missingHeadCount({ error: null, count: null, status: 204 }), "404 senza corpo, trasformato in 204");
    assert.ok(!missingHeadCount({ error: null, count: 0, status: 200 }), "tabella vuota");
    assert.ok(!missingHeadCount({ error: null, count: 3, status: 206 }));
    assert.ok(!missingHeadCount({ error: { code: "42P01" }, count: null, status: 404 }), "errore vero: lo gestisce notificationErrorCode");
  });
  test("notificationsSince: gli ultimi NOTIFICATION_RETENTION_DAYS giorni", () => {
    const now = Date.UTC(2026, 8, 27, 12, 0, 0);
    assert.equal(notificationsSince(now), new Date(now - NOTIFICATION_RETENTION_DAYS * 86_400_000).toISOString());
    assert.equal(notificationsSince(now), "2026-06-29T12:00:00.000Z");
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

describe("database: avvisi nel blocco SEGUI di supabase/schema.sql", () => {
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
  test("registro degli invii: uno per autore ed evento, con sent (le dirette soppresse non spostano la pausa)", () => {
    const table = stmts.find((s) => s.startsWith("create table if not exists public.notification_events")) ?? "";
    assert.match(table, /primary key \(kind, actor_id, event_key\)/, "l'autore nella chiave: nessuno prenota l'evento di un altro");
    assert.match(table, /sent boolean not null default true/);
    assert.match(fn("notify_fanout"), /on conflict \(kind, actor_id, event_key\) do nothing/);
  });
  test("notify_followers: autore = proprietario della riga pubblicata, chiamante autore o staff, tetto giornaliero", () => {
    const f = fn("notify_followers");
    assert.match(f, /me uuid := auth\.uid\(\)/);
    assert.match(f, /v_actor uuid := coalesce\(p_actor, auth\.uid\(\)\)/);
    assert.match(f, /if v_actor <> me and not public\.is_staff\(\) then raise exception 'forbidden'/, "solo l'autore o lo staff");
    assert.match(f, /select d\.owner into v_owner from public\.community_decks d where d\.slug = substr\(v_target, 18\) and d\.status = 'published'/);
    // la guida: pubblicata e dell'autore, letta solo se la tabella del pacchetto GUIDE c'è
    assert.match(f, /if to_regclass\('public\.community_guides'\) is null then raise exception 'not_found'/);
    assert.ok(f.includes("select g.owner from public.community_guides g where g.slug = $1 and g.status = ''published''"), "controllo della guida");
    assert.match(f, /into v_owner using substr\(v_target, 19\)/, "'/guides/community/' sono 18 caratteri");
    assert.match(f, /if v_owner is null or v_owner <> v_actor then raise exception 'not_found'/);
    assert.match(f, /e\.kind = p_kind and e\.actor_id = v_actor and e\.event_key = v_target/, "dedupe per autore");
    assert.ok(f.includes(`if n >= ${NOTIFY_DAILY_MAX} then return 0`), "tetto giornaliero diverso fra codice e database");
    assert.ok(f.includes("'^/decks/community/[a-z0-9-]{1,80}$'") && f.includes("'^/guides/community/[a-z0-9]+(-[a-z0-9]+)*$'"), "forme dei percorsi uguali a notifications.ts");
    assert.ok(f.includes("char_length(v_target) not between 21 and 78"), "slug delle guide da 3 a 60 caratteri, come publishTarget");
    assert.ok(stmts.includes("drop function if exists public.notify_followers(text, text)"), "la firma a due argomenti si toglie");
    assert.ok(stmts.includes("revoke all on function public.notify_followers(text, text, uuid) from public, anon"));
    assert.ok(stmts.includes("grant execute on function public.notify_followers(text, text, uuid) to authenticated"));
  });
  test("notify_key_ok, notify_live e notifications_cleanup: segreto confrontato con l'impronta, una volta per persona e diretta", () => {
    const k = fn("notify_key_ok");
    assert.ok(k.includes(`char_length(p_key) between ${CRON_SECRET_MIN} and 256`), "lunghezza minima diversa fra codice e database");
    assert.match(k, /k\.key_hash = encode\(sha256\(convert_to\(p_key, 'utf8'\)\), 'hex'\)/);
    const f = fn("notify_live");
    assert.match(f, /if not public\.notify_key_ok\(p_key\) then raise exception 'forbidden'/);
    assert.match(f, /v_event := 'twitch:' \|\| p_stream_id/);
    assert.match(f, /e\.kind = 'live' and e\.actor_id = p_actor and e\.event_key = v_event/, "dedupe per persona e diretta");
    assert.ok(f.includes(`e.sent and e.created_at > now() - interval '${LIVE_COOLDOWN_HOURS} hours'`), "pausa diversa fra codice e database, o conta le dirette soppresse");
    assert.match(f, /values \('live', v_event, p_actor, 0, false\) on conflict \(kind, actor_id, event_key\) do nothing/, "diretta soppressa segnata con sent = false");
    assert.ok(stmts.includes("grant execute on function public.notify_live(text, uuid, text) to anon, authenticated"));
    const c = fn("notifications_cleanup");
    assert.match(c, /if not public\.notify_key_ok\(p_key\) then raise exception 'forbidden'/);
    assert.match(c, /perform public\.notifications_prune\(\)/);
    assert.ok(stmts.includes("grant execute on function public.notifications_cleanup(text) to anon, authenticated"));
    const script = read("../../../scripts/set-cron-key.mjs");
    assert.match(script, new RegExp(`const MIN = ${CRON_SECRET_MIN};`), "scripts/set-cron-key.mjs: lunghezza minima diversa");
    assert.match(script, /createHash\("sha256"\)\.update\(secret, "utf8"\)\.digest\("hex"\)/, "la stessa impronta del database");
  });
  test("conservazione e segna come letti", () => {
    const prune = fn("notifications_prune");
    assert.ok(prune.includes(`notifications where created_at < now() - interval '${NOTIFICATION_RETENTION_DAYS} days'`), "conservazione degli avvisi diversa fra codice e database");
    assert.ok(prune.includes(`notification_events where created_at < now() - interval '${NOTIFICATION_EVENT_RETENTION_DAYS} days'`), "conservazione del registro diversa fra codice e database");
    const m = fn("notifications_mark_read");
    assert.match(m, /where user_id = me and read_at is null/);
    assert.match(m, /perform public\.notifications_prune\(\)/);
    assert.ok(stmts.includes("grant execute on function public.notifications_mark_read(bigint[]) to authenticated"));
    for (const internal of ["notifications_prune()", "notify_fanout(uuid, text, text, text)", "notify_key_ok(text)"]) {
      assert.ok(stmts.includes(`revoke all on function public.${internal} from public, anon, authenticated`), internal);
      assert.ok(!stmts.some((s) => s.startsWith(`grant execute on function public.${internal}`)), internal);
    }
  });
});
