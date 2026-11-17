/**
 * Primo accesso con Steam (18/11/2026): parametri, indirizzi e piccole regole condivisi fra il pannello di accesso (nel
 * browser) e le rotte del server. Il cookie firmato con lo SteamID in sospeso sta in pending.ts (solo server).
 *
 * Il giro: "Continua con Steam" → Steam → /auth/steam/callback. Se lo SteamID è già collegato a un account si entra lì,
 * come prima; altrimenti il ritorno scrive il cookie e porta a /<lingua>/login?steam=new&next=…, dove il pannello chiede:
 * - "Crea l'account con Steam": modulo con il nome sul sito (proposto quello del profilo Steam, se il server l'ha letto),
 *   POST a /auth/steam/create, che crea l'account come prima e apre la sessione;
 * - "Ho già un account": si entra con Discord o con l'email. L'indirizzo di ritorno porta `steam=pending`, così
 *   /auth/callback, dopo l'accesso, collega lo Steam in sospeso all'account e porta a /<lingua>/account?steam=<esito>#steam;
 *   con il codice dell'email (verificato nel browser) lo fa POST /auth/steam/pending.
 * Funzioni pure: test in steam.test.ts.
 */
// solo il tipo: il file va anche nel browser (LoginPanel) e i18n.ts porta con sé tutti i dizionari
import type { Locale } from "../i18n";

/** Il parametro dell'indirizzo che porta il giro: `steam=new` sulla pagina di accesso, `steam=pending` sul ritorno. */
export const STEAM_FLOW_PARAM = "steam";
export const STEAM_NEW_VALUE = "new";
export const STEAM_PENDING_VALUE = "pending";
/** Nome rifiutato da /auth/steam/create: la pagina di accesso lo dice sopra il campo. */
export const STEAM_NAME_ERROR_PARAM = "name_error";
export const STEAM_PENDING_ROUTE = "/auth/steam/pending";
export const STEAM_CREATE_ROUTE = "/auth/steam/create";

export type SteamNameError = "invalid" | "reserved";

export function parseSteamNameError(raw: string | null | undefined): SteamNameError | null {
  return raw === "invalid" || raw === "reserved" ? raw : null;
}

/** La pagina della scelta, nella lingua di `locale`, con la pagina a cui tornare e l'eventuale errore del nome. */
export function steamChoicePath(locale: Locale, next: string, nameError?: SteamNameError): string {
  const q = new URLSearchParams({ [STEAM_FLOW_PARAM]: STEAM_NEW_VALUE, next });
  if (nameError) q.set(STEAM_NAME_ERROR_PARAM, nameError);
  return `/${locale}/login?${q.toString()}`;
}

/** La pagina del profilo con l'esito del collegamento, dove si arriva dopo aver collegato lo Steam in sospeso. */
export function steamLinkedPath(locale: Locale, outcome: string): string {
  return `/${locale}/account?steam=${encodeURIComponent(outcome)}#steam`;
}

export type SteamPendingInfo = { pending: boolean; name: string | null };

/** La risposta di GET /auth/steam/pending, ricontrollata (nome al massimo di 64 caratteri). */
export function parsePendingInfo(json: unknown): SteamPendingInfo {
  if (!json || typeof json !== "object") return { pending: false, name: null };
  const v = json as { pending?: unknown; name?: unknown };
  const name = typeof v.name === "string" && v.name.trim() ? v.name.trim().slice(0, 64) : null;
  return { pending: v.pending === true, name: v.pending === true ? name : null };
}
