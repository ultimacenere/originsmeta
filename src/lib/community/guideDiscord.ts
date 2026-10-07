import type { Locale } from "../i18n";
import { escapeDiscord, type DiscordWebhookPayload } from "../discordWebhook";
import { discordUtm } from "../analytics";

/**
 * Messaggi Discord delle guide della community (pacchetto GUIDE, 27/09/2026), funzioni pure con test (guides.test.ts):
 * - `guidePayload`: l'annuncio pubblico di una guida appena pubblicata, nel canale #guides del nostro Discord
 *   (webhook DISCORD_WEBHOOK_GUIDES, come i mazzi in #community-decks con DISCORD_WEBHOOK_DECKS);
 * - `guideReportPayload`: la segnalazione di una guida, nel canale PRIVATO dello staff (DISCORD_FEEDBACK_WEBHOOK_URL,
 *   lo stesso dei feedback e della casella messaggi), con il link alla pagina dove lo staff trova "Nascondi".
 * Testi degli utenti (titolo, nome, riassunto, motivo) sempre passati da `escapeDiscord`, tagliati entro i limiti di
 * Discord; nessuna menzione (`sendDiscordWebhook` manda `allowed_mentions: { parse: [] }`).
 */

const MINT = 0x31e3bd;
const CRIMSON = 0xc81e7a;
const SITE = "https://originsmeta.com";
/** UTM dei link del messaggio, come gli annunci dei mazzi (MIS-07): le pagine hanno comunque il canonical pulito. */
const UTM = discordUtm("guide", "guides");

type Lang = Locale;
const FLAGS: Record<Lang, string> = { en: "🇬🇧 English", it: "🇮🇹 Italiano", es: "🇪🇸 Español", fr: "🇫🇷 Français" };
const BY: Record<Lang, string> = { en: "by", it: "di", es: "de", fr: "par" };

/** Un testo tagliato all'ultima parola intera entro `max` caratteri, con l'ellissi. */
export function cut(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const head = flat.slice(0, max - 1);
  const space = head.lastIndexOf(" ");
  return `${(space > max * 0.6 ? head.slice(0, space) : head).trim()}…`;
}

export type AnnouncedGuide = {
  slug: string;
  title: string;
  lang: Lang;
  author: string;
  summary: string;
  /** nome della categoria nelle tre lingue (dizionari: guides.categories) */
  category: Record<Lang, string>;
  /**
   * copertina: un percorso del sito (media kit in public/media) oppure, dal 29/09/2026, l'indirizzo pubblico di una
   * copertina caricata nel bucket del sito (`STORAGE_COVER`): l'immagine grande del messaggio
   */
  image?: string;
};

/**
 * Le sole immagini assolute ammesse nell'annuncio: le copertine delle guide caricate nel bucket `profile-media` del
 * progetto Supabase del sito (cartella `<id>/guide/`, nome scelto dal sito). Un indirizzo qualsiasi farebbe dire a Discord
 * l'IP di chi apre il messaggio a un sito di terzi.
 */
const STORAGE_COVER = /^https:\/\/[a-z0-9]{20}\.supabase\.co\/storage\/v1\/object\/public\/profile-media\/[0-9a-f-]{36}\/guide\/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$/;

/** L'immagine dell'annuncio: percorso del sito reso assoluto, copertina caricata nel bucket del sito, altrimenti niente. */
function announcedImage(image: string | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("/") && !image.startsWith("//")) return `${SITE}${image}`;
  return STORAGE_COVER.test(image) ? image : null;
}

/**
 * L'annuncio: titolo e link nella lingua in cui la guida è scritta, riassunto, autore e categoria nelle tre lingue, la
 * lingua della guida e la copertina. Solo il link alla versione originale: l'annuncio parte alla prima pubblicazione,
 * quando le altre due versioni mostrano ancora l'originale con la nota (la traduzione arriva qualche minuto dopo) e sono
 * noindex; dalla pagina si passa comunque alle altre lingue con il selettore del sito.
 */
export function guidePayload(g: AnnouncedGuide): DiscordWebhookPayload {
  const author = escapeDiscord(cut(g.author, 60));
  const image = announcedImage(g.image);
  return {
    content: "📘 **Nuova guida · New guide · Nueva guía · Nouveau guide**",
    embeds: [
      {
        // il titolo di un embed non interpreta il Markdown: resta com'è, solo accorciato
        title: g.title.slice(0, 256),
        url: `${SITE}/${g.lang}/guides/community/${g.slug}?${UTM}`,
        description: [
          escapeDiscord(cut(g.summary, 300)),
          "",
          ...(["it", "en", "es", "fr"] as const).map((l) => `${g.category[l]} · ${BY[l]} ${author}`),
        ].join("\n"),
        fields: [{ name: FLAGS[g.lang], value: `[${escapeDiscord(g.title.replace(/[[\]]/g, "").slice(0, 200))}](${SITE}/${g.lang}/guides/community/${g.slug}?${UTM})` }],
        ...(image ? { image: { url: image } } : {}),
        color: MINT,
        footer: { text: "originsmeta.com" },
      },
    ],
  };
}

export type GuideReportNotice = { slug: string; title: string; lang: Lang; author: string; reporter: string | null; reason: string };

/** La segnalazione per il canale privato dello staff (in italiano, come gli altri avvisi dello staff). */
export function guideReportPayload(r: GuideReportNotice): DiscordWebhookPayload {
  const link = `${SITE}/it/guides/community/${r.slug}`;
  return {
    username: "OriginsMeta · segnalazioni",
    embeds: [
      {
        title: "Segnalazione di una guida della community",
        url: link,
        description: escapeDiscord(cut(r.reason, 500)),
        color: CRIMSON,
        fields: [
          { name: "Guida", value: escapeDiscord(cut(r.title, 200)) },
          { name: "Autore", value: escapeDiscord(cut(r.author, 80)) },
          { name: "Segnalata da", value: r.reporter ? escapeDiscord(`@${cut(r.reporter, 80)}`) : "utente" },
          // lo staff, con l'accesso fatto, trova "Nascondi (staff)" in fondo alla pagina della guida
          { name: "Nascondi dal sito", value: link },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "originsmeta.com · guide della community" },
      },
    ],
  };
}
