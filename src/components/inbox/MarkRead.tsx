"use client";

import { useEffect } from "react";
import { markConversationRead } from "@/lib/community/inboxActions";
import { trackEvent } from "@/lib/analytics";
import { announceInboxChange } from "./InboxIndicator";

/**
 * Segna come letta la conversazione aperta (26/09/2026, pacchetto INBOX), dal browser e non durante il disegno della
 * pagina sul server: una pagina renderizzata non è una pagina vista (prefetch, anteprime). Si segna fino all'ultimo
 * messaggio mostrato (`seen`), così un messaggio arrivato mentre la pagina era aperta resta da leggere. Dopo, il numero
 * dei non letti nel menu si aggiorna subito e parte l'evento message_read (una volta per messaggi nuovi).
 */
export function MarkRead({ id, seen, unread, view }: { id: string; seen: string | null; unread: boolean; view: "user" | "staff" }) {
  useEffect(() => {
    if (!unread) return;
    markConversationRead(id, seen)
      .then((r) => {
        if (!r.changed) return;
        trackEvent("message_read", { placement: view === "staff" ? "staff_area" : "account" });
        announceInboxChange();
      })
      .catch(() => {
        /* rete assente: la conversazione resta da leggere, si riprova alla prossima visita */
      });
  }, [id, seen, unread, view]);
  return null;
}
