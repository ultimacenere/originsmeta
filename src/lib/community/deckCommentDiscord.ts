import { escapeDiscord, type DiscordWebhookPayload } from "../discordWebhook";
import { stripMarkdown } from "../userMarkdown";
import { cut } from "./guideDiscord";
import { commentTargetPath, type CommentTarget } from "./deckComments";

/**
 * Avviso allo staff per la prima segnalazione di un commento a un mazzo (22/10/2026), nel canale privato dei feedback
 * (DISCORD_FEEDBACK_WEBHOOK_URL), in italiano come gli altri avvisi dello staff. Funzione pura (test in
 * deckComments.test.ts): testi degli utenti senza i segni della formattazione e passati da `escapeDiscord`.
 */

const CRIMSON = 0xc81e7a;
const SITE = "https://originsmeta.com";

export type CommentReportNotice = {
  kind: CommentTarget["kind"];
  slug: string;
  deckName: string;
  author: string;
  reporter: string | null;
  reason: string;
  body: string;
};

export function commentReportPayload(r: CommentReportNotice): DiscordWebhookPayload {
  const link = `${SITE}/it${commentTargetPath(r.kind, r.slug)}`;
  return {
    username: "OriginsMeta · segnalazioni",
    embeds: [
      {
        title: r.kind === "deck" ? "Segnalazione di un commento a un mazzo" : "Segnalazione di un commento a un mazzo torneo",
        url: link,
        description: escapeDiscord(cut(stripMarkdown(r.body, { headings: false }), 500)),
        color: CRIMSON,
        fields: [
          { name: "Mazzo", value: escapeDiscord(cut(r.deckName, 120)) },
          { name: "Autore del commento", value: escapeDiscord(cut(r.author, 80)) },
          { name: "Segnalato da", value: r.reporter ? escapeDiscord(`@${cut(r.reporter, 80)}`) : "utente" },
          { name: "Motivo", value: r.reason ? escapeDiscord(cut(r.reason, 500)) : "—" },
          // lo staff, con l'accesso fatto, trova "Nascondi" ed "Elimina" sotto il commento
          { name: "Nascondi o elimina dal sito", value: link },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "originsmeta.com · commenti ai mazzi" },
      },
    ],
  };
}
