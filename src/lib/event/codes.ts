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

/** Un codice dato a un canale, come lo legge il pannello del mod (community_event_mod_view). */
export type PlacedCode = { code: string; slot: number; redeemed: boolean };

/**
 * I codici di un canale che non stanno più al loro posto dopo un cambio dei passaggi (16/11/2026, schema finale di Dav:
 * da 17 slot a 14, quasi tutti spostati). Il database lega ogni codice a un indice di slot e a un canale, e "Prepara i
 * codici" ritrova i codici per indice: un codice rimasto su uno slot che ora è di un altro canale (o che non c'è più)
 * resta riscattabile ma non compare nel messaggio di nessuno streamer, e fa contare come pieno lo slot nuovo.
 * Sono da liberare: i codici su uno slot che non è di questo canale, e quelli oltre i pacchetti dello slot (prima si
 * tengono i riscattati, che non si possono liberare, poi i più vecchi nell'ordine in cui arrivano). I riscattati non si
 * liberano mai. `codes` nell'ordine del database (data di assegnazione, poi id).
 */
export function misplacedCodes(slots: readonly { channel: string; packs: number }[], channel: string, codes: readonly PlacedCode[]): string[] {
  const out: string[] = [];
  const bySlot = new Map<number, PlacedCode[]>();
  for (const c of codes) {
    if (slots[c.slot]?.channel !== channel) {
      if (!c.redeemed) out.push(c.code);
      continue;
    }
    bySlot.set(c.slot, [...(bySlot.get(c.slot) ?? []), c]);
  }
  for (const [slot, list] of bySlot) {
    const keep = [...list.filter((c) => c.redeemed), ...list.filter((c) => !c.redeemed)];
    for (const c of keep.slice(Math.max(0, slots[slot].packs))) if (!c.redeemed) out.push(c.code);
  }
  return out;
}
