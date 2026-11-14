/**
 * Codici del giveaway e nomi Twitch (eventi della community, 10/11/2026). Funzioni pure, uguali al blocco
 * "10/11/2026: EVENTI DELLA COMMUNITY" di supabase/schema.sql (event.test.ts le confronta):
 * - un codice ha 10 caratteri presi da CODE_ALPHABET (niente I, L, O, 0 e 1, che si confondono) e si mostra in due
 *   gruppi da 5 ("ABCDE-FGHJK"); chi lo scrive può mettere spazi, trattini e minuscole: si normalizza prima di
 *   mandarlo al database, che rifà la stessa normalizzazione;
 * - un nome Twitch (login) è fatto di minuscole, cifre e trattini bassi, da 3 a 25 caratteri; "@Nome" e l'indirizzo del
 *   canale valgono come il nome.
 */

export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 10;
/** Forma di un codice normalizzato: la stessa espressione del vincolo della tabella community_event_codes. */
export const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{10}$/;
/** Forma di un nome Twitch: la stessa espressione dei vincoli del database. */
export const TWITCH_LOGIN_PATTERN = /^[a-z0-9_]{3,25}$/;

/** Il codice come lo salva il database: maiuscole, senza spazi né trattini. */
export function normalizeCode(input: string): string {
  return (input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Il codice scritto ha la forma giusta? (Il database lo ricontrolla comunque.) */
export function isCodeShape(input: string): boolean {
  return CODE_PATTERN.test(normalizeCode(input));
}

/** "ABCDEFGHJK" → "ABCDE-FGHJK", per mostrarlo e copiarlo. */
export function formatCode(code: string): string {
  const c = normalizeCode(code);
  return c.length === CODE_LENGTH ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}

/**
 * Nome Twitch normalizzato, o null se non è un nome valido: accetta "Nome", "@Nome", "twitch.tv/nome" e l'indirizzo
 * completo del canale.
 */
export function twitchLogin(input: string): string | null {
  let s = (input ?? "").trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/^(?:www\.|m\.)?twitch\.tv\//, "").replace(/^@/, "");
  s = s.split(/[/?#\s]/)[0] ?? "";
  return TWITCH_LOGIN_PATTERN.test(s) ? s : null;
}

/** Indirizzo del canale Twitch. */
export function twitchUrl(login: string): string {
  return `https://www.twitch.tv/${login}`;
}

/**
 * Il vincitore di comodo del pacchetto `k` dello slot `slot` (da 0), per i codici consegnati a mano agli streamer
 * (14/11/2026): il database dà un codice a uno slot solo per un nome Twitch (community_event_assign) e lo fa riscattare
 * solo se è stato dato a uno slot. "om01x07" = slot 1, pacchetto 7; sempre lo stesso nome, quindi sempre lo stesso codice.
 */
export function staffWinnerLogin(slot: number, k: number): string {
  const two = (n: number) => String(Math.max(0, Math.floor(n)) + 1).padStart(2, "0");
  return `om${two(slot)}x${two(k)}`;
}
