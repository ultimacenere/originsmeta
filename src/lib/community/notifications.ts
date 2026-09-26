import type { InboxStatus } from "./messages";

/**
 * Avvisi per chi segue (pacchetto SEGUI, 27/09/2026): le regole in funzioni pure, senza import (a parte un tipo), così
 * si provano con `node --test src/lib/community/notifications.test.ts`. Il database sta in supabase/wave2-SEGUI.sql, gli
 * invii in `notify.ts`, le letture in `notificationQueries.ts`, la sezione "Notifiche" di /account/messages in
 * src/components/follow/.
 *
 * Tre tipi di avviso, per chi segue un profilo vetrina (Creator, Autore, Pro, Staff):
 *   - `deck_published`: ha pubblicato un mazzo (Server Action di pubblicazione, dentro after());
 *   - `live`: è andato in diretta su Twitch con Origins TCG (rotta /api/cron/live, cron di Vercel ogni 10 minuti);
 *   - `guide_published`: ha pubblicato una guida (lo userà il pacchetto GUIDE con `notifyFollowers`).
 * Ogni avviso porta a un percorso interno senza lingua (`target`): la scheda del mazzo, la guida, la pagina /u di chi è in
 * diretta. Il sito lo ricontrolla (`isSafeTarget`) prima di farne un link.
 */

export const NOTIFICATION_KINDS = ["deck_published", "live", "guide_published"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
/** I tipi che partono da chi pubblica (RPC `notify_followers`); la diretta parte dal cron (`notify_live`). */
export type PublishKind = Exclude<NotificationKind, "live">;

/** Quanti avvisi mostra la sezione "Notifiche" (i più recenti). */
export const NOTIFICATIONS_SHOWN = 50;
/** Al massimo 10 invii al giorno per autore e tipo (mazzi, guide): uguale in `notify_followers`. */
export const NOTIFY_DAILY_MAX = 10;
/** Fra due avvisi di diretta della stessa persona almeno 3 ore: uguale in `notify_live`. */
export const LIVE_COOLDOWN_HOURS = 3;
/** Gli avvisi durano 90 giorni: uguale in `notifications_prune`. */
export const NOTIFICATION_RETENTION_DAYS = 90;
/** Lunghezza minima del segreto della rotta del cron (CRON_SECRET): uguale in `notify_live` e in scripts/set-cron-key.mjs. */
export const CRON_SECRET_MIN = 32;
/** Ancora della sezione "Notifiche" in /account/messages. */
export const NOTIFICATIONS_ANCHOR = "notifications";

export function isNotificationKind(v: unknown): v is NotificationKind {
  return typeof v === "string" && (NOTIFICATION_KINDS as readonly string[]).includes(v);
}

const SLUG = "[a-z0-9-]{1,80}";
const DECK_TARGET = new RegExp(`^/decks/community/(${SLUG})$`);
const GUIDE_TARGET = new RegExp(`^/guides(?:/${SLUG}){1,2}$`);
const PROFILE_TARGET = /^\/u\/([a-z0-9_-]{1,60})$/;

/** Il percorso di un avviso è uno di quelli che il sito sa aprire: scheda di un mazzo, guida, pagina /u. */
export function isSafeTarget(target: unknown): target is string {
  return typeof target === "string" && target.length <= 160 && (DECK_TARGET.test(target) || GUIDE_TARGET.test(target) || PROFILE_TARGET.test(target));
}

/** Lo slug del mazzo di un avviso `deck_published` (per leggerne il nome), altrimenti null. */
export function deckSlugOf(target: string): string | null {
  return DECK_TARGET.exec(target)?.[1] ?? null;
}

/**
 * Il percorso da mandare a `notify_followers`, come lo vuole il database: per un mazzo basta lo slug (o il percorso
 * intero), per una guida il percorso sotto /guides (o lo slug). Una lingua in testa (/it/…) si toglie: gli avvisi si
 * aprono nella lingua di chi li legge. null se non ha la forma giusta (niente chiamata al database).
 */
export function publishTarget(kind: PublishKind, raw: string): string | null {
  let t = String(raw ?? "").trim();
  t = t.replace(/^\/(?:en|it|es)(?=\/)/, "");
  if (kind === "deck_published") {
    if (!t.startsWith("/")) t = `/decks/community/${t}`;
    return DECK_TARGET.test(t) ? t : null;
  }
  if (!t.startsWith("/")) t = `/guides/${t}`;
  return GUIDE_TARGET.test(t) ? t : null;
}

/** Il link di un avviso nella lingua di chi lo legge; null per un percorso che il sito non riconosce. */
export function notificationHref(locale: string, target: string): string | null {
  return isSafeTarget(target) ? `/${locale}${target}` : null;
}

/* ---------- busta dell'header: messaggi + avvisi ---------- */

/** Lo stato della busta con gli avvisi non letti (campo `notifications` di /api/inbox/status). */
export type NotifiedInboxStatus = InboxStatus & { notifications?: number };

const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : typeof v === "string" && /^\d{1,9}$/.test(v) ? Number(v) : 0;

/** Aggiunge allo stato della casella il numero degli avvisi da leggere letto dal JSON della rotta (assente = 0). */
export function withNotificationCount<T extends object>(status: T | null, json: unknown): (T & { notifications: number }) | null {
  if (!status) return null;
  const n = json && typeof json === "object" && !Array.isArray(json) ? count((json as Record<string, unknown>).notifications) : 0;
  return { ...status, notifications: n };
}

/** Avvisi da leggere nello stato della busta. */
export function notificationCount(status: { notifications?: number } | null | undefined): number {
  return count(status?.notifications);
}

/**
 * Dove porta la busta: dove porterebbe per i messaggi (`messagesHref`, cioè `envelopeHref` di messages.ts) quando ci sono
 * messaggi da leggere o nessuna novità; alla sezione "Notifiche" di /account/messages quando le novità sono solo avvisi.
 */
export function envelopeTarget(messagesHref: string, messages: number, notifications: number, locale: string): string {
  if (messages > 0 || notifications < 1) return messagesHref;
  return `/${locale}/account/messages#${NOTIFICATIONS_ANCHOR}`;
}

/**
 * Nome della busta per i lettori di schermo: quello dei messaggi (`envelopeLabel` di messages.ts, "Messaggi, 2 non
 * letti") più gli avvisi, con il numero intero ("…, 3 notifiche nuove").
 */
export function envelopeAria(base: string, notifications: number, labels: { notifOne: string; notifMany: string }): string {
  const n = count(notifications);
  if (n < 1) return base;
  return `${base}, ${n === 1 ? labels.notifOne : labels.notifMany.replace("{n}", String(n))}`;
}

/* ---------- errori ---------- */

export type NotificationErrorCode = "notLoggedIn" | "forbidden" | "badTarget" | "notFound" | "unavailable" | "db";

const RAISED: Record<string, NotificationErrorCode> = {
  not_logged_in: "notLoggedIn",
  forbidden: "forbidden",
  bad_kind: "badTarget",
  bad_target: "badTarget",
  not_found: "notFound",
  too_many: "badTarget",
};

/** Dall'errore di Supabase al codice del sito; tabella o funzione mancante (migrazione non applicata) → `unavailable`. */
export function notificationErrorCode(error: { message?: string | null; code?: string | null } | null | undefined): NotificationErrorCode {
  if (!error) return "db";
  const code = error.code ?? "";
  if (["42P01", "42883", "42703", "PGRST200", "PGRST202", "PGRST205"].includes(code)) return "unavailable";
  const msg = (error.message ?? "").trim();
  return Object.hasOwn(RAISED, msg) ? RAISED[msg] : "db";
}

/* ---------- cron delle dirette ---------- */

/**
 * La chiamata del cron di Vercel porta `Authorization: Bearer <CRON_SECRET>`. Senza segreto (o con uno troppo corto) la
 * rotta non fa nulla; il confronto non si ferma al primo carattere diverso.
 */
export function cronAuthorized(header: string | null | undefined, secret: string | null | undefined): boolean {
  if (!secret || secret.length < CRON_SECRET_MIN || typeof header !== "string") return false;
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Un profilo vetrina con un canale Twitch, da controllare. */
export type LiveProfile = { id: string; username: string; login: string };
/** Una diretta come la restituisce Helix (i campi che servono qui). */
export type LiveStream = { id?: string; user_login: string };
/** Un avviso di diretta da mandare: chi è in diretta (id del profilo) e l'id della diretta. */
export type LiveAlert = { actorId: string; username: string; streamId: string };

/**
 * Le dirette su Origins TCG dei profili (`isOrigins`, cioè `isOriginsStream` di twitchLive.ts), una per profilo e per
 * diretta. Più profili sullo stesso canale ricevono ognuno il suo avviso (i loro follower sono diversi); una diretta
 * senza id numerico si salta (il database la rifiuterebbe).
 */
export function liveAlerts<S extends LiveStream>(profiles: readonly LiveProfile[], streams: readonly S[], isOrigins: (s: S) => boolean): LiveAlert[] {
  const byLogin = new Map<string, S>();
  for (const s of streams) {
    if (!s?.user_login || typeof s.id !== "string" || !/^\d{1,40}$/.test(s.id) || !isOrigins(s)) continue;
    byLogin.set(s.user_login.toLowerCase(), s);
  }
  const out: LiveAlert[] = [];
  const seen = new Set<string>();
  for (const p of profiles) {
    const s = byLogin.get(p.login.toLowerCase());
    if (!s || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push({ actorId: p.id, username: p.username, streamId: s.id as string });
  }
  return out;
}
