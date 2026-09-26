import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import type { Db } from "@/lib/supabase/public";
import { supabaseEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";
import { notificationErrorCode, publishTarget, type LiveAlert, type PublishKind } from "./notifications";

/**
 * Invio degli avvisi a chi segue (pacchetto SEGUI, 27/09/2026), lato server. Le righe le scrive solo il database, con le
 * funzioni security definer di supabase/wave2-SEGUI.sql: qui si chiamano.
 *
 * - `notifyFollowers(actorId, kind, target)`: mazzo o guida appena pubblicati. Da chiamare nella Server Action di
 *   pubblicazione, come `announceDeck` (discordDeck.ts): parte dopo la risposta al browser (`after()`), non lancia mai,
 *   non fa aspettare chi pubblica. La RPC `notify_followers` usa la sessione di chi ha pubblicato (auth.uid()): l'autore
 *   non si può indicare a mano. `client` è il client con la sessione della Server Action (quello di `currentUser()`);
 *   senza, si rilegge la sessione dai cookie e si controlla che sia proprio `actorId`. Il pacchetto GUIDE la chiama con
 *   `kind = "guide_published"` e il percorso della guida (`/guides/<slug>`).
 * - `notifyLive(secret, alert)`: diretta su Twitch, dalla rotta /api/cron/live (nessuna sessione: client anonimo con il
 *   segreto CRON_SECRET, che il database confronta con la sua impronta).
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

async function sendToFollowers(client: Db | undefined, actorId: string, kind: PublishKind, target: string): Promise<void> {
  let sb = client;
  if (!sb) {
    const { supabase, user } = await currentUser();
    // la RPC manda gli avvisi a nome di chi ha la sessione: se non è `actorId`, non si manda nulla
    if (!supabase || !user || user.id !== actorId) return;
    sb = supabase;
  }
  const { error } = await sb.rpc("notify_followers", { p_kind: kind, p_target: target });
  if (error && !missingMigration(error)) console.error(`[follows] avvisi ${kind} non inviati:`, error.code ?? "", error.message);
}

/**
 * Avvisa chi segue `actorId` che ha appena pubblicato un mazzo (`target` = slug o /decks/community/<slug>) o una guida
 * (`target` = /guides/<slug>). Dopo la risposta al browser; senza community, con un percorso non valido o prima della
 * migrazione non fa nulla. Solo i profili vetrina hanno follower: per gli altri il database risponde 0 senza scrivere.
 */
export function notifyFollowers(actorId: string, kind: PublishKind, target: string, client?: Db): void {
  if (!supabaseEnabled || !actorId || Date.now() < state.missingUntil) return;
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
 * (0 se la diretta era già stata annunciata o la persona ne ha annunciata un'altra da meno di 3 ore), null con un errore.
 */
export async function notifyLive(secret: string, alert: LiveAlert): Promise<number | null> {
  if (!supabaseEnabled || Date.now() < state.missingUntil) return null;
  const sb = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) }) },
  });
  const { data, error } = await sb.rpc("notify_live", { p_key: secret, p_actor: alert.actorId, p_stream_id: alert.streamId });
  if (error) {
    if (!missingMigration(error)) console.error(`[follows] avviso di diretta per @${alert.username} non inviato:`, error.code ?? "", error.message);
    return null;
  }
  return typeof data === "number" && Number.isFinite(data) ? data : 0;
}
