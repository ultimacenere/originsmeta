import type { Rand } from "./engine";

/**
 * Chat di Twitch per il giveaway di un evento (10/11/2026). Dalle note: "Meccanica giveaway: chat scrive comando (es.
 * !codice) per 6 minuti, vincitori estratti automaticamente" e "Vincitori ricevono un codice univoco dal mod del canale".
 * Il pannello del mod legge la chat del suo canale dal browser, in sola lettura e senza account: la chat IRC di Twitch
 * accetta collegamenti anonimi (nick "justinfan" più cifre), che possono leggere e non scrivere. Nessun token, nessuna
 * richiesta dal nostro server a Twitch, niente nomi salvati: i partecipanti stanno solo nella memoria della pagina del
 * mod; al database va solo il nome dei vincitori, che lo salva come impronta (una vincita a persona in tutto l'evento).
 * Qui le parti pure: lettura delle righe IRC, chi partecipa, estrazione.
 */

export const TWITCH_IRC_URL = "wss://irc-ws.chat.twitch.tv:443";

/** I bot delle chat più diffusi: non partecipano mai (un comando che ripetono non è una persona). */
export const CHAT_BOTS: ReadonlySet<string> = new Set([
  "nightbot",
  "streamelements",
  "streamlabs",
  "fossabot",
  "moobot",
  "wizebot",
  "sery_bot",
  "soundalerts",
  "botrixoficial",
  "kofistreambot",
  "commanderroot",
]);

export type ChatMessage = { login: string; displayName: string; channel: string; text: string };

/** Le righe da mandare appena aperto il collegamento: lettura anonima con i tag (per il nome mostrato). */
export function ircHandshake(channel: string, nickNumber: number): string[] {
  const n = Math.abs(Math.floor(nickNumber)) % 1_000_000;
  return ["CAP REQ :twitch.tv/tags twitch.tv/commands", "PASS SCHMOOPIIE", `NICK justinfan${10000 + n}`, `JOIN #${channel}`];
}

function unescapeTag(v: string): string {
  return v.replace(/\\(.)/g, (_, c: string) => (c === "s" ? " " : c === ":" ? ";" : c === "r" ? "\r" : c === "n" ? "\n" : c));
}

/**
 * Una riga della chat IRC: un messaggio (PRIVMSG) diventa { login, displayName, channel, text }; PING e il resto
 * tornano come null (il PING lo gestisce `isPing`).
 */
export function parseChatLine(raw: string): ChatMessage | null {
  let line = raw.replace(/\r?\n$/, "");
  const tags: Record<string, string> = {};
  if (line.startsWith("@")) {
    const sp = line.indexOf(" ");
    if (sp < 0) return null;
    for (const kv of line.slice(1, sp).split(";")) {
      const eq = kv.indexOf("=");
      if (eq > 0) tags[kv.slice(0, eq)] = unescapeTag(kv.slice(eq + 1));
    }
    line = line.slice(sp + 1);
  }
  const m = /^:([a-z0-9_]{1,25})![^ ]+ PRIVMSG #([a-z0-9_]{1,25}) :(.*)$/i.exec(line);
  if (!m) return null;
  const login = m[1].toLowerCase();
  return { login, displayName: tags["display-name"] || m[1], channel: m[2].toLowerCase(), text: m[3] };
}

export function isPing(raw: string): boolean {
  return raw.startsWith("PING");
}

/** Il messaggio è una partecipazione? Il comando come prima parola, maiuscole o minuscole ("!codice", "!Codice pls"). */
export function isEntry(text: string, keyword: string): boolean {
  const first = (text ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  // i client aggiungono a volte caratteri invisibili in fondo ai messaggi ripetuti (il "trucco" anti-doppione di 7TV)
  return first.replace(/[\u034f\u200b-\u200f\u2060\ufeff\u{e0000}-\u{e007f}]/gu, "") === keyword.toLowerCase();
}

/** Chi può partecipare: niente bot noti, niente il proprietario del canale. */
export function canEnter(login: string, channel: string): boolean {
  return login !== channel && !CHAT_BOTS.has(login);
}

/**
 * Estrae `n` vincitori fra i partecipanti (ognuno una volta sola, nell'ordine di arrivo), saltando `exclude` (chi ha già
 * vinto o è stato scartato dal mod).
 */
export function drawWinners(entrants: readonly string[], n: number, rand: Rand, exclude: ReadonlySet<string> = new Set()): string[] {
  const unique = [...new Set(entrants)].filter((e) => !exclude.has(e));
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rand() * (i + 1)));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique.slice(0, Math.max(0, n));
}
