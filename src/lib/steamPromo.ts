/**
 * Popup "collega Steam" (09/11/2026, Pierluigi: "voglio un popup per gli utenti registrati con su scritto: Il marketplace
 * è quasi pronto! collega il tuo account steam direttamente dal tuo profilo", con un tasto "entra nel tuo profilo" che
 * porti dove vogliamo). Regole (componente SteamPromo.tsx, montato nel layout della lingua):
 * - solo a chi ha fatto l'accesso e non ha ancora Steam collegato (steam_link_status, blocco STEAM di schema.sql): chi non
 *   ha l'accesso o ha già Steam non lo vede mai; se la funzione non risponde, niente popup;
 * - una volta per browser e per account (`STEAM_PROMO_SEEN_KEY`): chiuso o seguito, non torna; una campagna con un `id`
 *   nuovo lo fa ricomparire;
 * - STEAM_PROMO_DELAY_MS dopo il banner dei cookie (senza una scelta sui cookie non si apre), mai insieme agli altri
 *   riquadri che si aprono da soli né mentre si scrive (src/lib/autoOpen.ts), mai in accesso, account, strumenti e moduli
 *   (`promoQuietPath` di tournamentPromo.ts: in /account c'è già la sezione Steam);
 * - il tasto porta a /account#steam ("Il mio profilo", sezione "Account Steam").
 * `null` lo spegne; `until` (ISO) lo fa finire da solo. Funzioni pure: test in src/lib/steam/steam.test.ts.
 */

export type SteamPromo = {
  /** nome della campagna: entra negli eventi di misura e nella memoria del browser */
  id: string;
  /** fine del popup (ISO), o null finché non lo si spegne a mano */
  until: string | null;
};

export const STEAM_PROMO: SteamPromo | null = { id: "steam-link-1109", until: null };

/** Memoria del browser: le campagne già viste, una voce per campagna e account (`steamPromoSeenEntry`). */
export const STEAM_PROMO_SEEN_KEY = "originsmeta.steamPromo.v1";

/** Attesa dopo il banner dei cookie, e fra un tentativo e l'altro se la scheda è nascosta o si sta scrivendo. */
export const STEAM_PROMO_DELAY_MS = 3000;

/** Quante voci tiene la memoria del browser (le più recenti). */
const SEEN_MAX = 20;

/** Il popup è acceso (e, se ha una fine, non ancora finito). */
export function steamPromoActive(now: number, promo: SteamPromo | null): boolean {
  if (!promo) return false;
  if (!promo.until) return true;
  const end = Date.parse(promo.until);
  return Number.isFinite(end) && now < end;
}

/** La voce della memoria del browser per una campagna e un account. */
export function steamPromoSeenEntry(id: string, userId: string): string {
  return `${id}:${userId}`;
}

/** Le voci salvate (un elenco JSON di testi); qualunque altra cosa vale elenco vuoto. */
export function parseSteamPromoSeen(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, SEEN_MAX) : [];
  } catch {
    return [];
  }
}

/** L'elenco con `entry` in testa, senza doppioni, al massimo SEEN_MAX voci. */
export function addSteamPromoSeen(list: readonly string[], entry: string): string[] {
  return [entry, ...list.filter((x) => x !== entry)].slice(0, SEEN_MAX);
}
