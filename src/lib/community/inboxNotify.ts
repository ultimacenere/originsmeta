import { after } from "next/server";
import { siteUrl } from "@/lib/i18n";
import { discordWebhookUrl, escapeDiscord, sendDiscordWebhook } from "@/lib/discordWebhook";
import { DISCORD_EXCERPT_MAX, excerpt, staffThreadPath } from "./messages";

/**
 * Avviso allo staff di un messaggio nuovo di un utente nella casella messaggi (26/09/2026, pacchetto INBOX): va nel
 * canale Discord PRIVATO dello staff, lo stesso dei feedback e delle guide inviate (DISCORD_FEEDBACK_WEBHOOK_URL,
 * `src/lib/discordWebhook.ts`). Solo lato server.
 *
 * - Solo nel verso utente → staff: agli utenti non parte mai nulla fuori dal sito (scelta annunciata a Pierluigi).
 * - Mai il testo completo di un messaggio lungo: l'inizio (fino a DISCORD_EXCERPT_MAX caratteri), l'oggetto, il nome
 *   utente e il link alla conversazione nell'area staff. Il resto si legge sul sito, dopo l'accesso.
 * - Non si spegne con NEXT_PUBLIC_FEEDBACK=off (è la casella, non il riquadro del rodaggio): senza la variabile non
 *   parte niente e la casella funziona lo stesso (lo staff vede il numero dei non letti nel menu).
 * - Non blocca mai l'azione: il messaggio parte con `after()`, dopo la risposta al browser; `sendDiscordWebhook` non
 *   lancia e annulla menzioni e formattazione.
 */

/** Colore celeste del sito (--color-sky #3fc4e8) per la barra laterale: distingue la casella dai feedback (menta). */
const COLORE_CELESTE = 0x3fc4e8;

export type StaffNotice = {
  conversationId: string;
  /** nome utente (senza @) e nome mostrato di chi ha scritto */
  username: string | null;
  displayName: string | null;
  subject: string;
  body: string;
  /** conversazione nuova (Scrivi allo staff) o risposta in una esistente */
  isNew: boolean;
};

/** L'avviso, pronto per il webhook. Esportato per chiarezza; i testi sono in italiano come gli altri messaggi dello staff. */
export function staffNoticePayload(n: StaffNotice) {
  // il nome mostrato non ha un limite nel database (arriva dai metadati dell'iscrizione): tagliato, così con l'escape
  // di escapeDiscord il campo "Da" resta sotto i 1024 caratteri di Discord e l'avviso non viene rifiutato
  const displayName = n.displayName ? excerpt(n.displayName, 80) : null;
  const username = n.username ? excerpt(n.username, 100) : null;
  const who = username ? `@${username}` : displayName || "utente";
  const link = `${siteUrl}${staffThreadPath("it", n.conversationId)}`;
  const text = excerpt(n.body, DISCORD_EXCERPT_MAX);
  return {
    username: "OriginsMeta · messaggi",
    embeds: [
      {
        title: n.isNew ? "Nuova conversazione nella casella dello staff" : "Nuovo messaggio nella casella dello staff",
        url: link,
        description: escapeDiscord(text),
        color: COLORE_CELESTE,
        fields: [
          { name: "Da", value: escapeDiscord(displayName && username && displayName !== username ? `${displayName} (${who})` : who) },
          { name: "Oggetto", value: escapeDiscord(excerpt(n.subject, 200)) },
          // il link porta alla conversazione nell'area staff: il testo completo si legge lì, dopo l'accesso
          { name: "Rispondi sul sito", value: link },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "originsmeta.com · casella messaggi" },
      },
    ],
  };
}

/** Manda l'avviso dopo la risposta al browser, se il webhook è configurato. */
export function notifyStaff(n: StaffNotice): void {
  const url = discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL");
  if (!url) return;
  const job = async () => {
    await sendDiscordWebhook(url, staffNoticePayload(n));
  };
  try {
    after(job);
  } catch {
    void job();
  }
}

/** Il webhook dello staff è configurato? Serve a non leggere oggetto e nome utente quando l'avviso non partirebbe. */
export const staffNoticeEnabled = () => discordWebhookUrl("DISCORD_FEEDBACK_WEBHOOK_URL") !== null;
