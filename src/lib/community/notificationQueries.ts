import type { Db } from "@/lib/supabase/public";
import type { NotificationRow } from "@/lib/supabase/database";
import type { Profile } from "./types";
import { NOTIFICATIONS_SHOWN, deckSlugOf, isNotificationKind, notificationErrorCode, type NotificationErrorCode } from "./notifications";

/**
 * Letture degli avvisi (pacchetto SEGUI, 27/09/2026), solo lato server e con la sessione di chi guarda: la policy fa
 * vedere a ciascuno solo i suoi. Le usano la rotta /api/inbox/status (numero per la busta dell'header) e la sezione
 * "Notifiche" di /account/messages (pagina privata e dinamica).
 *
 * Nessuna lancia: la busta e la pagina dei messaggi non si rompono per gli avvisi. Prima della migrazione (tabella
 * mancante) il numero è 0 e la sezione non compare (`unavailable`); per 5 minuti non si riprova a leggere la tabella
 * (stesso schema di `missingUntil` in creators.ts).
 */

export type NotificationActor = Profile & { id: string };

/** Un avviso da mostrare: chi ha fatto la cosa e, per un mazzo, il nome (null se il mazzo non è più pubblico). */
export type NotificationItem = NotificationRow & { actor: NotificationActor | null; deckName: string | null };

export type NotificationsResult = { ok: true; data: { items: NotificationItem[]; unread: number } } | { ok: false; error: NotificationErrorCode };

const COLUMNS = "id, user_id, kind, actor_id, target, created_at, read_at";
const MISSING_RETRY_MS = 5 * 60_000;
const state = { missingUntil: 0 };

function missing(error: { message?: string; code?: string } | null): boolean {
  if (notificationErrorCode(error) !== "unavailable") return false;
  state.missingUntil = Date.now() + MISSING_RETRY_MS;
  return true;
}

/**
 * Avvisi da leggere di `userId`, per la busta dell'header. 0 con qualsiasi errore (anche prima della migrazione: una
 * richiesta HEAD su una tabella che non c'è risponde senza corpo, e supabase-js la dà come "nessun risultato").
 */
export async function unreadNotificationCount(client: Db, userId: string): Promise<number> {
  if (Date.now() < state.missingUntil) return 0;
  const { count, error } = await client.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  if (error) {
    if (!missing(error)) console.error("[follows] notifiche da leggere:", error.code ?? "", error.message);
    return 0;
  }
  return typeof count === "number" && count > 0 ? count : 0;
}

/**
 * Gli ultimi `NOTIFICATIONS_SHOWN` avvisi di `userId`, dal più recente, con i profili di chi li ha causati (pubblici) e i
 * nomi dei mazzi ancora pubblicati (un mazzo nascosto o eliminato resta senza nome: la sezione lo dice e non fa il link).
 */
export async function listNotifications(client: Db, userId: string): Promise<NotificationsResult> {
  const res = await client.from("notifications").select(COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }).limit(NOTIFICATIONS_SHOWN);
  if (res.error) {
    if (missing(res.error)) return { ok: false, error: "unavailable" };
    console.error("[follows] notifiche:", res.error.code ?? "", res.error.message);
    return { ok: false, error: notificationErrorCode(res.error) };
  }
  const rows = ((res.data ?? []) as NotificationRow[]).filter((r) => isNotificationKind(r.kind));
  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const slugs = [...new Set(rows.flatMap((r) => (r.kind === "deck_published" ? [deckSlugOf(r.target)] : [])).filter((s): s is string => Boolean(s)))];
  const [actors, decks, unread] = await Promise.all([
    actorIds.length ? client.from("profiles").select("id, username, display_name, avatar_url, badge").in("id", actorIds) : Promise.resolve({ data: [], error: null }),
    slugs.length ? client.from("community_decks").select("slug, name").in("slug", slugs).eq("status", "published") : Promise.resolve({ data: [], error: null }),
    unreadNotificationCount(client, userId),
  ]);
  // profili e nomi dei mazzi sono un di più: con un errore l'avviso resta, con "un profilo che segui" e senza nome
  if (actors.error) console.error("[follows] profili degli avvisi:", actors.error.message);
  if (decks.error) console.error("[follows] mazzi degli avvisi:", decks.error.message);
  const byId = new Map(((actors.data ?? []) as NotificationActor[]).map((p) => [p.id, p]));
  const names = new Map(((decks.data ?? []) as { slug: string; name: string }[]).map((d) => [d.slug, d.name]));
  const items = rows.map((r) => {
    const slug = r.kind === "deck_published" ? deckSlugOf(r.target) : null;
    return { ...r, actor: byId.get(r.actor_id) ?? null, deckName: slug ? (names.get(slug) ?? null) : null };
  });
  return { ok: true, data: { items, unread: Math.max(unread, rows.filter((r) => !r.read_at).length) } };
}
