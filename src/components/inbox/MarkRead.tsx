"use client";

import { useEffect } from "react";
import { markConversationRead, markInboxSeen } from "@/lib/community/inboxActions";
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

/**
 * Entrare nella casella (la propria, /account/messages, o l'area staff) spegne la busta dell'header (22/10/2026, Pierluigi:
 * "che io legga o non legga i messaggi, quelle notifiche da quel momento in poi devono sparire"): appena la pagina si apre
 * nel browser segna come letto tutto quello che la busta contava quando la pagina è stata disegnata (`seen`), poi la busta
 * si rilegge subito (`announceInboxChange`). La pagina non si ridisegna: durante questa visita si vede ancora che cosa era
 * nuovo. Una conversazione o un avviso arrivati dopo restano da leggere.
 */
export function MarkInboxSeen({ seen, view }: { seen: string; view: "user" | "staff" }) {
  useEffect(() => {
    markInboxSeen(seen)
      .then((r) => {
        if (!r.messages && !r.notifications) return;
        if (r.messages) trackEvent("message_read", { placement: view === "staff" ? "staff_area" : "account" });
        announceInboxChange();
      })
      .catch(() => {
        /* rete assente: resta tutto da leggere, si riprova alla prossima visita */
      });
  }, [seen, view]);
  return null;
}
