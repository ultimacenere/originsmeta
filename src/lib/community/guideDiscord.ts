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

type Lang = "en" | "it" | "es";
const FLAGS: Record<Lang, string> = { en: "🇬🇧 English", it: "🇮🇹 Italiano", es: "🇪🇸 Español" };
const BY: Record<Lang, string> = { en: "by", it: "di", es: "de" };

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
};

/**
 * L'annuncio: titolo e link nella lingua in cui la guida è scritta (la versione che si legge subito), riassunto, autore
 * e categoria nelle tre lingue, e i link alle altre due versioni (tradotte dal sito dopo la pubblicazione).
 */
export function guidePayload(g: AnnouncedGuide): DiscordWebhookPayload {
  const author = escapeDiscord(cut(g.author, 60));
  const others = (["it", "en", "es"] as const).filter((l) => l !== g.lang);
  const title = g.title.replace(/[[\]]/g, "").slice(0, 200);
  return {
    content: "📘 **Nuova guida · New guide · Nueva guía**",
    embeds: [
      {
        // il titolo di un embed non interpreta il Markdown: resta com'è, solo accorciato
        title: g.title.slice(0, 256),
        url: `${SITE}/${g.lang}/guides/community/${g.slug}?${UTM}`,
        description: [
          escapeDiscord(cut(g.summary, 300)),
          "",
          ...(["it", "en", "es"] as const).map((l) => `${g.category[l]} · ${BY[l]} ${author}`),
        ].join("\n"),
        fields: others.map((l) => ({ name: FLAGS[l], value: `[${escapeDiscord(title)}](${SITE}/${l}/guides/community/${g.slug}?${UTM})` })),
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
