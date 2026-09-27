import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import type { Db } from "@/lib/supabase/public";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";
import { isUuid } from "./util";
import { notificationErrorCode, publishTarget, type LiveAlert, type PublishKind } from "./notifications";

/**
 * Invio degli avvisi a chi segue (pacchetto SEGUI, 27/09/2026), lato server. Le righe le scrive solo il database, con le
 * funzioni security definer di supabase/wave2-SEGUI.sql: qui si chiamano.
 *
 * - `notifyFollowers(actorId, kind, target, client?)`: mazzo o guida appena pubblicati. Da chiamare nella Server Action
 *   di pubblicazione, come `announceDeck` (discordDeck.ts): parte dopo la risposta al browser (`after()`), non lancia
 *   mai, non fa aspettare chi pubblica. `actorId` è l'autore, cioè il PROPRIETARIO del mazzo o della guida (per le guide
 *   `saved.owner`, anche quando agisce lo staff): gli avvisi vanno ai suoi follower e portano il suo nome. `client` è il
 *   client con la sessione della Server Action (quello di `currentUser()`); senza, si rilegge la sessione dai cookie.
 *   Chi decide è il database (RPC `notify_followers` con `p_actor`): la riga deve esistere, essere pubblicata e avere
 *   `actorId` come proprietario, e chi ha la sessione deve essere l'autore stesso o lo staff (admin o ruolo Staff, che
 *   pubblica per conto suo). Con un'altra sessione non parte nulla (errore `forbidden` nei log). Il pacchetto GUIDE la
 *   chiama con `kind = "guide_published"` e la guida (`<slug>` o `/guides/community/<slug>`).
 * - `notifyLive(secret, alert)`: diretta su Twitch, dalla rotta /api/cron/live (nessuna sessione: client anonimo con il
 *   segreto CRON_SECRET, che il database confronta con la sua impronta).
 * - `cleanupNotifications(secret)`: pulizia periodica (avvisi oltre i 90 giorni, registro degli invii oltre i 180), dalla
 *   stessa rotta a ogni giro del cron.
 *
 * Prima della migrazione (funzioni mancanti: 42883, PGRST202) non succede nulla: lo si scrive nei log una volta e per 5
 * minuti non si riprova (stesso schema di `missingUntil` in creators.ts); dopo la migrazione un'istanza accesa riprende
 * da sola.
 */

const TIMEOUT_MS = 5000;
const MISSING_RETRY_MS = 5 * 60_000;
const state = { missingUntil: 0, logged: false };

/** La migrazione del pacchetto SEGUI manca ancora? Lo si scrive nei log una volta sola. */
function missingMigration(error: { message?: string; code?: string } | null): boolean {
  if (notificationErrorCode(error) !== "unavailable") return false;
  state.missingUntil = Date.now() + MISSING_RETRY_MS;
  if (!state.logged) {
    state.logged = true;
    console.error("[follows] mancano le funzioni degli avvisi (notify_followers, notify_live): va applicata la migrazione del pacchetto SEGUI");
  }
  return true;
}

/** Client anonimo senza cache e con un timeout, per le chiamate del cron (nessuna sessione). */
function cronClient() {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) }) },
  });
}

async function sendToFollowers(client: Db | undefined, actorId: string, kind: PublishKind, target: string): Promise<void> {
  let sb = client;
  if (!sb) {
    const { supabase, user } = await currentUser();
    if (!supabase || !user) return;
    sb = supabase;
  }
  // l'autore va sempre al database: lo confronta con il proprietario della riga e con chi ha la sessione
  const { error } = await sb.rpc("notify_followers", { p_kind: kind, p_target: target, p_actor: actorId });
  if (error && !missingMigration(error)) console.error(`[follows] avvisi ${kind} non inviati:`, error.code ?? "", error.message);
}

/**
 * Avvisa chi segue `actorId` (proprietario del mazzo o della guida) che ha appena pubblicato un mazzo (`target` = slug o
 * /decks/community/<slug>) o una guida (`target` = slug o /guides/community/<slug>). Dopo la risposta al browser; senza
 * community, con un percorso o un id non validi o prima della migrazione non fa nulla. Solo i profili vetrina hanno
 * follower: per gli altri il database risponde 0 senza scrivere.
 */
export function notifyFollowers(actorId: string, kind: PublishKind, target: string, client?: Db): void {
  if (!supabaseEnabled || !isUuid(actorId) || Date.now() < state.missingUntil) return;
  const path = publishTarget(kind, target);
  if (!path) return;
  const job = async () => {
    try {
      await sendToFollowers(client, actorId, kind, path);
    } catch (e) {
      console.error("[follows] avvisi non inviati:", e instanceof Error ? e.message : e);
    }
  };
  try {
    after(job);
  } catch {
    // fuori da una richiesta (script, test): subito
    void job();
  }
}

/**
 * Avviso di diretta per i follower di `alert.actorId` (rotta /api/cron/live). Restituisce quanti avvisi sono partiti
 * (0 se la diretta era già stata annunciata o l'ultimo avviso di diretta della persona è di meno di 3 ore fa), null con
 * un errore.
 */
export async function notifyLive(secret: string, alert: LiveAlert): Promise<number | null> {
  if (!supabaseEnabled || Date.now() < state.missingUntil) return null;
  const { data, error } = await cronClient().rpc("notify_live", { p_key: secret, p_actor: alert.actorId, p_stream_id: alert.streamId });
  if (error) {
    if (!missingMigration(error)) console.error(`[follows] avviso di diretta per @${alert.username} non inviato:`, error.code ?? "", error.message);
    return null;
  }
  return typeof data === "number" && Number.isFinite(data) ? data : 0;
}

/**
 * Pulizia degli avvisi scaduti (rotta /api/cron/live, a ogni giro): true se il database l'ha fatta, false con un errore
 * (segreto non registrato, database giù) o prima della migrazione. Non lancia.
 */
export async function cleanupNotifications(secret: string): Promise<boolean> {
  if (!supabaseEnabled || Date.now() < state.missingUntil) return false;
  try {
    const { error } = await cronClient().rpc("notifications_cleanup", { p_key: secret });
    if (!error) return true;
    if (!missingMigration(error)) console.error("[follows] pulizia degli avvisi non riuscita:", error.code ?? "", error.message);
  } catch (e) {
    console.error("[follows] pulizia degli avvisi non riuscita:", e instanceof Error ? e.message : e);
  }
  return false;
}
