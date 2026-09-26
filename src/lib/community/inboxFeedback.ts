import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { supabaseEnabled } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";
import { inboxLabels } from "@/lib/inboxLabels";
import { feedbackSubject, inboxErrorCode } from "./messages";

/**
 * Feedback → casella messaggi (26/09/2026, pacchetto INBOX; richiesta di Pierluigi: "possiamo rispondere a chi ci dà i
 * feedback direttamente da lì"). Se chi manda un feedback dal riquadro ha fatto l'accesso (sessione Supabase nei cookie
 * della richiesta), il feedback si salva anche come conversazione con origin 'feedback' (RPC `inbox_start`, con la sua
 * sessione): lo staff risponde dall'area staff e l'utente legge la risposta nel suo profilo.
 *
 * Senza accesso non fa nulla (e non chiama Supabase: basta l'assenza dei cookie sb-). Non lancia mai: con un errore
 * (migrazione non applicata, limite di frequenza) il feedback va su Discord come prima, senza la conversazione.
 * Restituisce l'id della conversazione e il nome utente di chi scrive, per il messaggio allo staff.
 */
export async function saveFeedbackToInbox(message: string, page: string | null, locale: Locale): Promise<{ id: string; username: string | null } | null> {
  if (!supabaseEnabled) return null;
  try {
    const store = await cookies();
    if (!store.getAll().some((c) => c.name.startsWith("sb-"))) return null;
    const { supabase, user } = await currentUser();
    if (!supabase || !user) return null;
    const subject = feedbackSubject(inboxLabels[locale].feedbackSubject, page);
    const [started, profile] = await Promise.all([
      supabase.rpc("inbox_start", { topic: subject, content: message, via_feedback: true }),
      supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
    ]);
    if (started.error || typeof started.data !== "string") {
      console.error("[feedback] casella messaggi non salvata:", inboxErrorCode(started.error), started.error?.message ?? "");
      return null;
    }
    return { id: started.data, username: (profile.data as { username: string | null } | null)?.username ?? null };
  } catch (e) {
    console.error("[feedback] casella messaggi non salvata:", e instanceof Error ? e.message : e);
    return null;
  }
}
