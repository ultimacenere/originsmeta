/**
 * Invio a un webhook Discord, solo lato server (nessuna dipendenza: solo fetch). Nato per il pop-up dei
 * feedback (22/09/2026, `src/app/api/feedback/route.ts`), usato anche da "Mandaci la tua guida" (23/09/2026,
 * `src/app/api/guide-submission/route.ts`); le notifiche dei tornei (`src/lib/tournament/notify.ts`) hanno
 * ancora il loro invio interno, che in futuro può passare da qui.
 *
 * L'URL di un webhook è un segreto (chi lo conosce scrive nel canale): si legge da una variabile d'ambiente
 * senza prefisso NEXT_PUBLIC_, impostata su Vercel, e non va mai nel codice né nel repository.
 */

/** Campo di un embed. Limiti di Discord: nome 256 caratteri, valore 1024. */
export type DiscordEmbedField = { name: string; value: string; inline?: boolean };

export type DiscordEmbed = {
  title?: string;
  /** link del titolo */
  url?: string;
  /** fino a 4096 caratteri */
  description?: string;
  /** immagine grande sotto il testo (URL assoluto) */
  image?: { url: string };
  /** colore della barra laterale, come intero (0x31e3bd = menta) */
  color?: number;
  fields?: DiscordEmbedField[];
  /** data ISO 8601: Discord la mostra nell'ora locale di chi legge */
  timestamp?: string;
  footer?: { text: string };
};

export type DiscordWebhookPayload = {
  content?: string;
  username?: string;
  embeds?: DiscordEmbed[];
};

/**
 * File di testo allegato al messaggio (per esempio il testo completo di una guida inviata dal sito, che in un
 * embed non ci sta: la descrizione ha un tetto di 4096 caratteri). Discord ne mostra un'anteprima nel canale.
 */
export type DiscordFile = { name: string; content: string };

/**
 * Legge l'URL del webhook dalla variabile indicata e lo accetta solo se è davvero un webhook Discord
 * (https://discord.com/api/webhooks/<id>/<token>, anche discordapp.com, ptb e canary). Un valore sbagliato
 * (per esempio il link del canale incollato al posto del webhook) vale come variabile assente.
 */
export function discordWebhookUrl(envName: string): string | null {
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const hostOk = /^(?:(?:ptb|canary)\.)?discord(?:app)?\.com$/i.test(u.hostname);
    if (u.protocol !== "https:" || !hostOk || !/^\/api\/webhooks\/\d+\/[\w-]+\/?$/.test(u.pathname)) {
      console.error(`[discord] ${envName} non sembra l'URL di un webhook Discord: la variabile viene ignorata`);
      return null;
    }
    return u.toString();
  } catch {
    console.error(`[discord] ${envName} non è un URL valido: la variabile viene ignorata`);
    return null;
  }
}

/**
 * Rende "testo semplice" una stringa scritta da un utente prima di metterla in un messaggio Discord:
 * - la formattazione Markdown di Discord (grassetto, corsivo, citazioni, blocchi di codice, link mascherati,
 *   titoli, elenchi) viene annullata con una barra rovesciata davanti a ogni simbolo, che Discord non mostra;
 *   così anche gli indirizzi web restano testo e non diventano link cliccabili;
 * - le menzioni (@everyone, @here, <@utente>, <@&ruolo>, <#canale>, </comando:id>) vengono spezzate: la "<" è
 *   preceduta dalla barra e dopo ogni "@" c'è uno spazio di larghezza zero.
 * È una seconda linea di difesa: la prima è `allowed_mentions: { parse: [] }` in `sendDiscordWebhook`, che
 * impedisce a Discord di notificare chiunque, qualunque cosa ci sia nel testo.
 */
export function escapeDiscord(text: string): string {
  return text.replace(/[\\*_~`|>#[\]()<:-]/g, "\\$&").replace(/@/g, "@\u200b");
}

/**
 * Manda il messaggio e dice se Discord l'ha accettato. Non lancia mai eccezioni: rete giù, timeout o risposta
 * d'errore diventano `{ ok: false }` (con il codice HTTP quando c'è), e il dettaglio finisce in console.error.
 * Con dei file allegati la richiesta diventa multipart (il messaggio va nel campo `payload_json`, i file in
 * `files[n]`), come vuole l'API dei webhook di Discord.
 */
export async function sendDiscordWebhook(
  url: string,
  payload: DiscordWebhookPayload,
  { timeoutMs = 5000, files = [] }: { timeoutMs?: number; files?: DiscordFile[] } = {},
): Promise<{ ok: boolean; status?: number }> {
  // nessuna menzione può partire, qualunque cosa contenga il testo
  const json = JSON.stringify({ ...payload, allowed_mentions: { parse: [] } });
  let body: string | FormData = json;
  if (files.length) {
    body = new FormData();
    body.append("payload_json", json);
    files.forEach((f, i) => (body as FormData).append(`files[${i}]`, new Blob([f.content], { type: "text/plain; charset=utf-8" }), f.name));
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      // con FormData il tipo (e il separatore delle parti) lo scrive fetch
      headers: files.length ? undefined : { "content-type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) console.error("[discord] il webhook ha risposto", res.status);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    console.error("[discord] invio non riuscito:", e instanceof Error ? e.message : e);
    return { ok: false };
  }
}
