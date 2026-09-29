import { escapeDiscord, type DiscordWebhookPayload } from "../discordWebhook";
import { discordUtm } from "../analytics";
import { cut } from "./guideDiscord";

/**
 * L'annuncio su Discord di un fumetto appena pubblicato (pacchetto FUMETTI, 29/09/2026): funzione pura con test
 * (comics.test.ts). Come le guide della community (guideDiscord.ts): titolo e link nella lingua dei testi, presentazione,
 * autore, copertina; testi degli utenti sempre passati da `escapeDiscord` e tagliati entro i limiti di Discord, nessuna
 * menzione (`sendDiscordWebhook` manda `allowed_mentions: { parse: [] }`). Il webhook è DISCORD_WEBHOOK_COMICS (Vercel).
 */

const LIME = 0xb6e36a;
const SITE = "https://originsmeta.com";
const UTM = discordUtm("comic", "comics");

type Lang = "en" | "it" | "es";
const BY: Record<Lang, string> = { en: "Comic by", it: "Fumetto di", es: "Cómic de" };
const READ: Record<Lang, string> = { en: "🇬🇧 Read the comic", it: "🇮🇹 Leggi il fumetto", es: "🇪🇸 Lee el cómic" };

/**
 * Le sole immagini ammesse nell'annuncio: le copertine dei fumetti nel bucket `profile-media` del progetto Supabase del
 * sito (cartella `<id>/comic/`, nome scelto dal sito). Un indirizzo qualsiasi farebbe dire a Discord l'IP di chi apre il
 * messaggio a un sito di terzi.
 */
const STORAGE_COVER = /^https:\/\/[a-z0-9]{20}\.supabase\.co\/storage\/v1\/object\/public\/profile-media\/[0-9a-f-]{36}\/comic\/[A-Za-z0-9_-]{8,64}\.(png|jpg|jpeg|webp)$/;

export type AnnouncedComic = { slug: string; title: string; lang: Lang; author: string; summary: string; image?: string | null };

/** L'annuncio pubblico: i link portano alla pagina nelle tre lingue (i testi si traducono qualche minuto dopo). */
export function comicPayload(c: AnnouncedComic): DiscordWebhookPayload {
  const author = escapeDiscord(cut(c.author, 60));
  const image = c.image && STORAGE_COVER.test(c.image) ? c.image : null;
  const link = (l: Lang) => `${SITE}/${l}/news/comics/${c.slug}?${UTM}`;
  return {
    content: "💬 **Nuovo fumetto · New comic · Nuevo cómic**",
    embeds: [
      {
        // il titolo di un embed non interpreta il Markdown: resta com'è, solo accorciato
        title: c.title.slice(0, 256),
        url: link(c.lang),
        description: [escapeDiscord(cut(c.summary, 300)), "", `${BY[c.lang]} ${author}`, "", ...(["it", "en", "es"] as const).map((l) => `[${READ[l]}](${link(l)})`)].join("\n"),
        ...(image ? { image: { url: image } } : {}),
        color: LIME,
        footer: { text: "originsmeta.com" },
      },
    ],
  };
}
