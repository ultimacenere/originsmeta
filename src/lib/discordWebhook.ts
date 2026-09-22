/**
 * Invio a un webhook Discord, solo lato server (nessuna dipendenza: solo fetch). Nato per il pop-up dei
 * feedback (22/09/2026, `src/app/api/feedback/route.ts`); le notifiche dei tornei (`src/lib/tournament/notify.ts`)
 * hanno ancora il loro invio interno, che in futuro può passare da qui.
 *
 * L'URL di un webhook è un segreto (chi lo conosce scrive nel canale): si legge da una variabile d'ambiente
 * senza prefisso NEXT_PUBLIC_, impostata su Vercel, e non va mai nel codice né nel repository.
 */

/** Campo di un embed. Limiti di Discord: nome 256 caratteri, valore 1024. */
export type DiscordEmbedField = { name: string; value: string; inline?: boolean };

export type DiscordEmbed = {
  title?: string;
  /** fino a 4096 caratteri */
  description?: string;
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
 */
export async function sendDiscordWebhook(url: string, payload: DiscordWebhookPayload, timeoutMs = 5000): Promise<{ ok: boolean; status?: number }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // nessuna menzione può partire, qualunque cosa contenga il testo
      body: JSON.stringify({ ...payload, allowed_mentions: { parse: [] } }),
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
